import express from 'express';
import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';
import { ObjectId } from 'mongodb';


const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// GET all charging stations
router.get('/stations', async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.json([]);

        const docs = await db.collection('laddningStation').find({}).toArray();
        console.log(docs, "ttttttt")
        res.json(docs);
    } catch (e) {
        next(e);
    }
});



router.post('/scooter/:scooterId/charge', async (req, res, next) => {
    console.log("hej532444444444")
    try {
        const { station } = req.body;
        const scooterId = req.params.scooterId;

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'DB not connected' });

        // Update bike location
        let test = await db.collection('scooters').updateOne(
            { id: scooterId },
            { $set: { status: 'Charging' } }
        );

        console.log(test, "-------------------------------------------\n\n", station)

        // Add bike to spot
        let chawo = await db.collection('laddningStation').updateOne(
            { _id: new ObjectId(station) },
            { $addToSet: { elsparkcyklar: scooterId } }
        );

        console.log(chawo, "-------------------------------------------")

        res.json({ message: 'Bike parked successfully', station });
    } catch (e) {
        next(e);
    }
});




// Remove a bike from charge station
router.post('/scooter/:scooterId/uncharge', async (req, res, next) => {
    try {
        const { station } = req.body; 
        const scooterId = req.params.scooterId;

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'DB not connected' });

        await db.collection('scooters').updateOne(
            { id: scooterId },
            { $set: { status: 'Available' } }
        );

        //Remove from charge station
        await db.collection('laddningStation').updateOne(
            { _id: new ObjectId(station) },
            { $pull: { elsparkcyklar: scooterId } }
        );

        res.json({ message: 'Bike removed from station successfully', station });
    } catch (e) {
        next(e);
    }
});







router.get('/stations', async (_req, res) => {
    try {
        const db = await getDb();
        if (!db) return res.json([]);

        const charging = await db.collection('chargingStations').find({}).limit(1000).toArray();
        const parking = await db.collection('parkingStations').find({}).limit(1000).toArray();

        const norm = (raw, type) => ({
            id: String(raw._id ?? raw.id ?? ''),
            city: raw.city ?? raw.stad ?? raw.cityName ?? raw.name ?? '—',
            type,
            capacity: Number(raw.capacity ?? raw.slots ?? raw.maxScooters ?? 0),
            location: raw.location ?? raw.position ?? raw.coordinates ?? raw.zone?.center ?? null,
        });

        return res.json([...charging.map((s) => norm(s, 'Charging')), ...parking.map((s) => norm(s, 'Parking'))]);
    } catch {
        return res.json([]);
    }
});

export default router;
