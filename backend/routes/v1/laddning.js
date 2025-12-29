import express from 'express';
import laddnings_station from '../../models/laddnings-stationer.js';

import { checkToken } from '../../middleware/utils.js';

const router = express.Router();



router.use(checkToken);


// GET all charging stations
router.get('/', async (req, res) => {
    const data = await laddnings_station.getAll();
    res.status(200).json(data);
});



router.post('/add', async (req, res) => {
    console.log(req.body)
    try {
        const result = await laddnings_station.addOne(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});



router.post("/update", async (req, res) => {
    const update = await laddnings_station.update(req.body);
    console.log("Updating document:", req.body.id);
    console.log("Allowed users:", req.body.allowed_users);

    return res.status(201).json({ update });

});


router.get('/hierarchy', async (req, res) => {
    try {
        const data = await laddnings_station.getHierarchy();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await laddnings_station.getOne(id);

    return res.json({ doc });
});




export default router;
