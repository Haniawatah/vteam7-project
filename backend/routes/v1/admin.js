import express from 'express';
import * as elsparkcyklar from '../../models/elsparkcykel.js';
import user from '../../models/user.js';

import { checkToken } from '../../middleware/utils.js';
import { checkAdmin } from '../../middleware/admin.js';


const router = express.Router();

router.use(checkToken);


// GET all charging stations
router.get('/', checkToken, checkAdmin, async (req, res) => {
    const data = await elsparkcyklar.getAll();
    return res.json({ data });
});


router.get('/users', checkToken, checkAdmin, async (req, res) => {
    const data = await user.getAll();
    res.status(200).json(data);
});

router.get('/user/:email', checkToken, checkAdmin, async (req, res) => {
    console.log("hejsan")
    const email = req.params.email;
    const data = await user.getOne(email);

    return res.json({ data });
});


router.get('/bike/:id', checkToken, checkAdmin, async (req, res) => {
    const id = req.params.id;
    const data = await elsparkcyklar.getOne(id);

    return res.json({ data });
});

router.get('/admin/users', checkToken, checkAdmin, async (_req, res) => {
    try {
        const db = await getDb();
        if (!db) return res.json([]);

        const users = await db.collection('users').find({}).limit(500).toArray();
        return res.json(
            users.map((u) => ({
                id: String(u._id ?? u.id ?? ''),
                email: u.email ?? '',
                role: u.role ?? u.roll ?? 'user',
                balance: Number(u.balance ?? u.wallet ?? 0),
                name: u.name ?? u.username ?? '',
            }))
        );
    } catch {
        return res.json([]);
    }
});


export default router;
