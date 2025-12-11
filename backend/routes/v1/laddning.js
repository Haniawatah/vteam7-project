import express from 'express';
import laddnings_station from '../../models/laddnings-stationer.js';

const router = express.Router();

// GET all charging stations
router.get('/', async (req, res) => {
    const data = await laddnings_station.getAll();
    res.status(200).json(data);
});


router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await laddnings_station.getOne(id);

    return res.json({ doc });
});


export default router;
