import express from 'express';
import { getDb } from '../../database.js';
import { listChargingStations } from '../../models/laddnings-stationer.js';

const router = express.Router();

// GET all charging stations
router.get('/charging-stations', async (_req, res) => {
    const db = await getDb();
    res.json(await listChargingStations(db));
});


router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await laddnings_station.getOne(id);

    return res.json({ doc });
});


export default router;
