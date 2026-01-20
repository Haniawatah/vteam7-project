import express from 'express';
import { getDb } from '../../database.js';

import { checkToken } from '../../middleware/utils.js';
import { ObjectId } from 'mongodb';
import { checkAdmin } from '../../middleware/admin.js';

const router = express.Router();

router.use(checkToken);


// GET all parking stations
router.get('/stations', async (req, res) => {
    console.log("hej")
    try {
        const db = getDb();
        if (!db) return res.json([]);

        const docs = await db.collection('parkeringStation').find({}).toArray();
        console.log(docs, "ttttttt")
        res.json(docs);
    } catch (e) {
        next(e);
    }
});


// POST /bikes/:bikeId/park
router.post('/scooter/:scooterId/park', checkAdmin , async (req, res, next) => {
    console.log("hej")
    try {
        const { station } = req.body;
        const scooterId = req.params.scooterId;

        console.log(scooterId, "dwadaaaaaaaaaaaaaaaaaa")

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'DB not connected' });

        // Update bike location
        let test = await db.collection('scooters').updateOne(
            { id: scooterId },
            { $set: { status: 'Available' } }
        );

        console.log(test, "-------------------------------------------")

        // Add bike to spot
        let chawo = await db.collection('parkeringStation').updateOne(
            { _id: new ObjectId(station) },
            { $addToSet: { elsparkcyklar: scooterId } }
        );

        console.log(chawo, "-------------------------------------------")

        res.json({ message: 'Bike parked successfully', station });
    } catch (e) {
        next(e);
    }
});









// Remove a bike from
router.post('/scooter/:scooterId/unpark', async (req, res, next) => {
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
        await db.collection('parkeringStation').updateOne(
            { _id: new ObjectId(station) },
            { $pull: { elsparkcyklar: scooterId } }
        );

        res.json({ message: 'Bike removed from station successfully', station });
    } catch (e) {
        next(e);
    }
});









export default router;
