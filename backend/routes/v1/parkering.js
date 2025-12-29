import express from 'express';
import ParkeringStation from '../../models/parkering-stationer.js';

import { checkToken } from '../../middleware/utils.js';

const router = express.Router();

router.use(checkToken);


// GET all parking stations
router.get('/', async (req, res) => {
    const data = await ParkeringStation.getAll();
    console.log("hej")
    res.status(200).json(data);
});


router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await ParkeringStation.getOne(id);

    return res.json({ doc });
});

export default router;
