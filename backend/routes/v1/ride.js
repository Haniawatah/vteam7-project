import express from 'express';

import * as elsparkcyklar from '../../models/elsparkcykel.js';
import * as rideLog from '../../models/ride.js';
import { getWallet, getSubscription, removeMoney } from "../../models/user.js";

import { checkToken } from '../../middleware/utils.js';
import { getDb } from '../../database.js';
import requireAdmin from '../../middleware/admin.js';

const router = express.Router();

router.use(checkToken);

async function listRideHistory() {
  const db = await getDb();
  if (!db) return [];

  const rides = await db.collection('rides').find({}).sort({ startTime: -1 }).limit(1000).toArray();
  return rides.map((r) => ({
    id: String(r._id ?? r.id ?? ''),
    user: r.user ?? r.userId ?? r.email ?? '—',
    scooterId: r.scooterId ?? r.scooter_id ?? '—',
    startTime: r.startTime ?? r.start_time ?? r.createdAt ?? null,
    endTime: r.endTime ?? r.end_time ?? r.endedAt ?? null,
    price: Number(r.price ?? r.cost ?? 0),
    status: r.status ?? '—',
  }));
}


// GET all parking stations
router.get('/', async (req, res) => {
    const data = await elsparkcyklar.getAllScooters();
    console.log("hej")
    res.status(200).json(data);
});



//Startar våran ride, (måste fixa scooterId till rideId)
router.post('/start/:rideId', async (req, res) => {
    const id = req.params.rideId;

    let newData = await elsparkcyklar.getScooterById(id);

    console.log(newData, "newdata:")

    const currentDateTime = new Date().toISOString();

    let test = {
        user_id: req.user.sub,
        scooterId: id,
        start_location: newData.position,
        start_time: currentDateTime,
        price: 5,
        status: 'active'
    }

    const insertedId = await rideLog.addLog(test);

    const data = await rideLog.getLogById(insertedId);

    await elsparkcyklar.updateScooterStatus(id, 'InUse');

    res.status(200).json(data);

});


//Kollar priset på ens ride
router.get('/price/:rideId', async (req, res) => {
    const rideId = req.params.rideId;

    const data = await rideLog.getLogById(rideId);

    console.log(data.start_time, "data")

    const startTime = new Date(data.start_time).getTime();
    const currentTime = Date.now();

    const durationInMinute = Math.ceil((currentTime - startTime) / 60000);

    const pricePerMinute = 5;
    const price = (durationInMinute * pricePerMinute) + 5;

    try {
        res.status(200).json({ price });
    } catch (e) {
        console.error("Couldnt get the price for the ride:", e);
        res.status(500).json({ error: "Couldnt get the price for the ride:" });
    }
});


// End a ride
router.post('/end/:rideId', async (req, res) => {
    const rideId = req.params.rideId;
    const scooterId = req.body.scooterId;
    const userId = req.user.sub

    console.log("hejsan-----------------")

    try {

        const data = await rideLog.getLogById(rideId);
        let scooterData = await elsparkcyklar.getScooterById(scooterId);

        //Hämtar datum och tider för att räkna ut priset för riden
        const startTime = new Date(data.start_time).getTime(); 
        const currentTime = new Date();
        const durationInMinute = Math.ceil((currentTime - startTime) / 60000);
        const pricePerMinute = 5;
        const price = (durationInMinute * pricePerMinute) + 5;

        //Hämtar wallet och subscription
        const wallet = await getWallet(userId)
        const subscription = await getSubscription(userId)

        console.log(subscription, "suben", userId)


        //Kollar ifall vi har en subscription som är "aktiv / fortfarande funkar"
        //Isånafall så behöver man inte betala, annars kostar det
        if (!subscription || (subscription.status !== 'active' && subscription.status !== 'stopping')) {
            if (wallet < price) {
                return res.status(400).json({ error: 'Not enough balance in wallet' });
            }
            await removeMoney(userId, price);
        }

        //Updaterar våran ridelogs saker som position och annat
        let rideData = {
            logId: rideId,
            end_location: scooterData.position ,
            end_time: currentTime,
            price: price,
            status: 'Complete'
        };

        // End the ride and update the log
        await rideLog.updateLog(rideData);

        await elsparkcyklar.updateScooterStatus(scooterId, 'Available');

        res.status(200).json({ message: "Ride ended successfully" });
    } catch (e) {
        console.error("Error ending ride:", e);
        res.status(500).json({ error: "Error ending the ride" });
    }
});


router.get('/active/:scooterId', async (req, res) => {
    const scooterId = req.params.scooterId;
    const userId = req.user.sub;

    console.log(scooterId, "tttt");
    const data = await rideLog.getLogById(scooterId);

    console.log(data, "-----------------")

    try {
      if (userId === data.user_id){
          return res.json(data);
      }
    } catch {
        return res.json([]);
    }
});




router.get('/history', async (req, res) => {
    const userId = req.user.sub;

    const data = await rideLog.getLogsByUser(userId);

    console.log(data, "test");

    return res.json(data);
});





// Ride history for admin
router.get('/rides/history', requireAdmin, async (_req, res) => {
  try {
    return res.json(await listRideHistory());
  } catch {
    return res.json([]);
  }
});

// Alias the frontend mentions as fallback
router.get('/logs', requireAdmin, async (_req, res) => {
  try {
    return res.json(await listRideHistory());
  } catch {
    return res.json([]);
  }
});



router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await rideLog.getAllLogs();

    return res.json({ doc });
});


export default router;
