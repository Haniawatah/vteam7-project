import express from 'express';
import user from '../../models/user.js';

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
    const data = await user.getAll();
    res.status(200).json(data);
});


router.get('/:email', async (req, res) => {
    const email = req.params.email;
    const doc = await user.getOne(email);

    return res.json({ doc });
});

export default router;
