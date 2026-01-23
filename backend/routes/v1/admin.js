import express from 'express';

import { checkToken } from '../../middleware/utils.js';
import { checkAdmin } from '../../middleware/admin.js';
import { getDb } from '../../database.js';


const router = express.Router();

router.use(checkToken);



router.get('/users', checkToken, checkAdmin, async (req, res) => {
    const data = await user.getAll();
    res.status(200).json(data);
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


router.post('/admin/scooter/reset', checkToken, checkAdmin, async (req, res, next) => {
    try {
        const db = getDb();
        await db.collection('scooters').updateMany({}, { $set: { status: 'Available' } });
        await db.collection('log').updateMany({ status: 'active' }, { $set: { status: 'abandoned', end_time: new Date() } });
        res.json({ ok: true, message: 'Simulation reset' });
    } catch (e) {
        next(e);
    }
});


export default router;
