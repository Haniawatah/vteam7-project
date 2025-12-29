import express from 'express';
import user from '../../models/user.js';

import { checkToken } from '../../middleware/utils.js';

const router = express.Router();

router.use(checkToken);

// GET all users
router.get('/', async (req, res) => {
    const data = await user.getAll();
    res.status(200).json(data);
});


router.post("/register", async (req, res) => {
    console.log(req)
    const result = await user.register(req.body);
    res.status(201).json({ result });
});



router.get('/profile', async (req, res) => {
    const userEmail = req.user.email;

    console.log(req)
    const data = await user.getOne(userEmail);
    
    if (!data) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }


    res.status(200).json({ data });

});

router.get('/:email', async (req, res) => {
    const email = req.params.email;
    const doc = await user.getOne(email);

    return res.json({ doc });
});

export default router;
