import express from 'express';
import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';

const router = express.Router();

router.get('/stations', authenticate, requireAdmin, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.json([]);

    // Adjust collection names to your schema if needed:
    const charging = await db.collection('chargingStations').find({}).limit(1000).toArray();
    const parking = await db.collection('parkingStations').find({}).limit(1000).toArray();

    const norm = (raw, type) => ({
      id: String(raw._id ?? raw.id ?? ''),
      city: raw.city ?? raw.stad ?? raw.cityName ?? raw.name ?? '—',
      type,
      capacity: Number(raw.capacity ?? raw.slots ?? raw.maxScooters ?? 0),
      location: raw.location ?? raw.position ?? raw.coordinates ?? raw.zone?.center ?? null,
    });

    return res.json([
      ...charging.map((s) => norm(s, 'Charging')),
      ...parking.map((s) => norm(s, 'Parking')),
    ]);
  } catch {
    return res.json([]);
  }
});

export default router;
