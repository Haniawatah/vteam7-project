import express from 'express';
import elsparkcyklar from '../../models/elsparkcykel.js';

const router = express.Router();

// GET all charging stations
router.get('/', async (req, res) => {
    const data = await elsparkcyklar.getAll();
    return res.json({ data });
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await elsparkcyklar.getOne(id);

    return res.json({ doc });
});


export default router;
