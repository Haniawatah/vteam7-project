import express from 'express';
import städer from '../../models/städer.js';

import { checkToken } from '../../middleware/utils.js';

const router = express.Router();

router.use(checkToken);


// GET all cities
router.get('/', async (req, res) => {
    const data = await städer.getAll();
    res.status(200).json(data);
});


router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await städer.getOne(id);

    return res.json({ doc });
});

export default router;
