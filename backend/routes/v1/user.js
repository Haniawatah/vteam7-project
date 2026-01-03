import express from 'express';
import user from '../../models/user.js';
import { ObjectId } from 'mongodb';

import { checkToken } from '../../middleware/utils.js';
import { getDb } from '../../database.js';
import requireAdmin from '../../middleware/admin.js';

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

// GET /v1/users
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.json([]); // no DB configured

    const users = await db.collection('users').find({}).limit(500).toArray();
    const out = users.map((u) => ({
      id: String(u._id ?? u.id ?? ''),
      email: u.email ?? '',
      role: u.role ?? u.roll ?? 'user',
      balance: Number(u.balance ?? u.wallet ?? 0),
      name: u.name ?? u.username ?? '',
    }));
    return res.json(out);
  } catch {
    // Keep UI working even if DB is temporarily down
    return res.json([]);
  }
});

router.patch('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const role = req.body?.role === 'admin' ? 'admin' : 'user';

  try {
    const db = await getDb();
    if (!db) return res.status(501).json({ error: 'DB not configured' });

    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid id' });

    await db.collection('users').updateOne({ _id }, { $set: { role } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    if (!db) return res.status(501).json({ error: 'DB not configured' });

    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid id' });

    await db.collection('users').deleteOne({ _id });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
