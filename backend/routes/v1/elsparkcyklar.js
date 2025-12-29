import express from 'express';
import elsparkcyklar from '../../models/elsparkcykel.js';

import { checkToken } from '../../middleware/utils.js';

const router = express.Router();

router.use(checkToken);


// GET all charging stations
router.get('/', async (req, res) => {
    const data = await elsparkcyklar.getAll();
    return res.json({ data });
});

// Create a new scooter
router.post('/', async (req, res) => {
    const data = await elsparkcyklar.addOne(req.body)
    res.status(201).json({ data });
});

//Get a specific scooter
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const data = await elsparkcyklar.getOne(id);

    return res.json({ data });
});


// Update a scooter by ID
router.put('/:id', async (req, res) => {
    const data = await elsparkcyklar.update(req.body)
    res.status(201).json({ data });
});

// Delete a scooter by ID
router.delete('/:id', async (req, res) => {
    const ok = await deleteScooter(db, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
});

export default router;
