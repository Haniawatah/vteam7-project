import express from 'express';
import elsparkcyklar from '../../models/elsparkcykel.js';
import rideLog from '../../models/ride.js';

import { checkToken } from '../../middleware/utils.js';

const router = express.Router();

router.use(checkToken);


// GET all parking stations
router.get('/', async (req, res) => {
    const data = await elsparkcyklar.getAll();
    console.log("hej")
    res.status(200).json(data);
});


router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await rideLog.getAll();

    return res.json({ doc });
});



router.post('/start/:scooterId', async (req, res) => {
    const id = req.params.scooterId;

    let newData = await elsparkcyklar.getOne(id);

    const currentDateTime = new Date().toISOString();

    let test = {
        user_id: req.user.user_id,
        scooterId: id,
        start_location: newData.position,
        start_time: currentDateTime,
        price: 5,
        status: 'active'
    }

    const data = await rideLog.addOne(test);

    const testData = await rideLog.getOne(data.insertedId);

    const updatedScooter = await elsparkcyklar.startLog(id, testData);

    console.log(testData);
    console.log("----------------t----------------------")

    console.log(updatedScooter);

    res.status(200).json({ data });

});

// End a ride
router.post('/end/:scooterId', async (req, res) => {
    const id = req.params.scooterId;


    let newData = await elsparkcyklar.getOne(id);

    const currentDateTime = new Date().toISOString();

    try {
        let rideData = {
            logId: '695310fa74de3a9f9b64b8b7',
            end_location: newData.position ,
            end_time: currentDateTime,
            price: 25,
            status: 'Complete'
        };

        // End the ride and update the log
        const data = await rideLog.updateLog(rideData);

        const updatedLog = await elsparkcyklar.endLog(id, rideData);

        console.log(data);
        console.log("------------------te--------------------")
        console.log(updatedLog);

        res.status(200).json({ message: "Ride ended successfully", updatedLog });
    } catch (e) {
        console.error("Error ending ride:", e);
        res.status(500).json({ error: "Error ending the ride" });
    }
});

export default router;
