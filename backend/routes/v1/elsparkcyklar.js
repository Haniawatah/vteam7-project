import express from 'express';
import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';

const router = express.Router();

// GET /v1/scooters
router.get('/', authenticate, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.json([]);

    const scooters = await db.collection('scooters').find({}).limit(2000).toArray();
    return res.json(
      scooters.map((s) => ({
        id: String(s._id),
        batteryLevel: Number(s.batteryLevel ?? s.battery ?? 0),
        status: s.status ?? 'Off',
        location: s.location ?? s.position ?? { lat: 0, lng: 0 },
        city: s.city ?? s.stad ?? '',
      }))
    );
  } catch {
    return res.json([]);
  }
});

export default router;
