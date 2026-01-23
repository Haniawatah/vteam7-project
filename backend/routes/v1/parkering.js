import express from 'express';
import { getDb } from '../../database.js';

import { checkToken } from '../../middleware/utils.js';
import { ObjectId } from 'mongodb';
import { checkAdmin } from '../../middleware/admin.js';
import { inStationZone, randomStationLocation } from '../../middleware/inZone.js';

const router = express.Router();

router.use(checkToken);


// GET all parking stations
router.get('/stations', async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.json([]);

        const docs = await db.collection('parkeringStation').find({}).toArray();
        res.status(200).json(docs);
    } catch (e) {
        next(e);
    }
});



// GET all parking stations
router.get('/stations/get/:city', async (req, res) => {
    const city = req.params.city
    try {
        const db = getDb();
        if (!db) return res.json([]);

        const laddStation = await db.collection('laddningStation').find({ stad_id: city }).toArray();
        const parkeringStation = await db.collection('parkeringStation').find({ stad_id: city }).toArray();
        const allaStationer = [...laddStation, ...parkeringStation];
        res.json(allaStationer);
    } catch (e) {
        next(e);
    }
});


// POST /bikes/:bikeId/park
router.post('/scooter/:scooterId/park', checkAdmin , async (req, res, next) => {
    try {
        const { station } = req.body;
        const scooterId = req.params.scooterId;

        const db = getDb();
        if (!db) return res.status(500).json({ message: 'DB not connected' });
        

        //Finding the scooter
        const scooter = await db.collection('scooters').findOne({ id: scooterId });
        if (!scooter) return res.status(404).json({ message: 'Scooter not found' });


        //Find the station
        const pickedStation = await db.collection('parkeringStation').findOne({ _id: new ObjectId(station) });
        if (!pickedStation) return res.status(404).json({ message: 'Station not found' });


        const stationZone = inStationZone(scooter.location.lat, scooter.location.lng, pickedStation.zone)

        //Getting a random location inside the "zone"
        let random;
        if(!stationZone) {
            random = randomStationLocation(pickedStation.zone)
        } else {
            console.log("The scooter is already in the zone")
            random = { lat: scooter.location.lat, lng: scooter.location.lng };
        }

        // ADding the bike to the station
        await db.collection('parkeringStation').updateOne(
            { _id: new ObjectId(station) },
            { $addToSet: { elsparkcyklar: scooterId } }
        );


        // Update bike location
        await db.collection('scooters').updateOne(
            { id: scooterId },
            { $set: { 
                status: 'Available' ,
                location: random
            } }
        );

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
