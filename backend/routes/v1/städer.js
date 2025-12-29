import express from 'express';
import { getDb } from '../../database.js';
import { listCities } from '../../models/städer.js';

const router = express.Router();

// GET all cities
router.get('/cities', async (_req, res) => {
    const db = await getDb();
    res.json(await listCities(db));
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await städer.getOne(id);

    return res.json({ doc });
});

export default router;
