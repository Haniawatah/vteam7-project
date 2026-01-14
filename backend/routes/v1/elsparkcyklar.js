import express from 'express';
import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/passport.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = express.Router();

const parseLimit = (v) => {
  const raw = String(v ?? '').trim().toLowerCase();
  if (!raw || raw === 'all' || raw === '0') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(5000, Math.floor(n)) : 0;
};

const parsePage = (v) => {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
};

// PUBLIC: list scooters (map/admin list)
router.get('/scooters', async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection('scooters');

    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const skip = limit ? (page - 1) * limit : 0;

    const cursor = col.find({}).sort({ _id: 1 });
    if (skip) cursor.skip(skip);
    if (limit) cursor.limit(limit);

    const [items, total] = await Promise.all([cursor.toArray(), col.countDocuments({})]);

    res.setHeader('X-Total-Count', String(total));
    res.setHeader('X-Returned-Count', String(items.length));
    res.setHeader('X-Limit', String(limit));
    res.setHeader('X-Page', String(page));

    return res.json(items);
  } catch (e) {
    console.error('[v1/scooters] failed:', e);
    return res.status(500).json({ message: 'Failed to fetch scooters' });
  }
});

// PUBLIC: available scooters for rent map
router.get('/scooters/available', async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection('scooters');
    const items = await col.find({ status: 'Available' }).toArray();
    return res.json(items);
  } catch (e) {
    console.error('[v1/scooters/available] failed:', e);
    return res.status(500).json({ message: 'Failed to fetch available scooters' });
  }
});

// ADMIN: create scooter (used by simulator when admin creds exist)
router.post('/scooters', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection('scooters');

    const body = req.body ?? {};
    const doc = {
      id: body.id,
      model: body.model ?? 'SIM',
      city: body.city ?? 'Stockholm',
      status: body.status ?? 'Available',
      batteryLevel: Number.isFinite(Number(body.batteryLevel)) ? Number(body.batteryLevel) : 100,
      location: body.location ?? { lat: 59.3293, lng: 18.0686 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await col.insertOne(doc);
    return res.status(201).json(doc);
  } catch (e) {
    console.error('[v1/scooters POST] failed:', e);
    return res.status(500).json({ message: 'Failed to create scooter' });
  }
});

/**
 * ADMIN: delete scooter
 * DELETE /v1/scooters/:id
 */
router.delete('/scooters/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const col = db.collection('scooters');

    const id = String(req.params.id);
    const filter = looksLikeObjectId(id) ? { _id: new ObjectId(id) } : { id };

    const r = await col.deleteOne(filter);
    return res.json({ ok: true, deletedCount: r.deletedCount ?? 0 });
  } catch (e) {
    console.error('[v1/scooters DELETE] failed:', e);
    return res.status(500).json({ message: 'Failed to delete scooter' });
  }
});

export default router;
