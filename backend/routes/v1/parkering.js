import express from 'express';
import { getDb } from '../../database.js';
import { listParkingStations } from '../../models/parkering-stationer.js';

const router = express.Router();

// GET all parking stations
router.get('/parking-stations', async (_req, res) => {
    const db = await getDb();
    res.json(await listParkingStations(db));
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await parkering_Station.getOne(id);

    return res.json({ doc });
});

export default router;
