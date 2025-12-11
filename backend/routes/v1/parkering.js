import express from 'express';
import parkering_Station from '../../models/parkering-stationer.js';

const router = express.Router();

// GET all parking stations
router.get('/', async (req, res) => {
    const data = await parkering_Station.getAll();
    res.status(200).json(data);
});


router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await parkering_Station.getOne(id);

    return res.json({ doc });
});

export default router;
