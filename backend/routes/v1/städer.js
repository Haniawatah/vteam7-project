import express from 'express';
import städer from '../../models/städer.js';
import { getDb } from '../../database.js';
import { checkToken, authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';

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

// New route for /v1/cities
router.get('/cities', authenticate, requireAdmin, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.json([]);

    const cities = await db.collection('cities').find({}).limit(200).toArray();
    return res.json(
      cities.map((c) => ({
        id: String(c._id ?? c.id ?? ''),
        city: c.city ?? c.name ?? c.stad ?? '',
      }))
    );
  } catch {
    return res.json([]);
  }
});

export default router;
