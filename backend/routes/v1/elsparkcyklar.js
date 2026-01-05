import express from 'express';

import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';

const router = express.Router();

// Normaliserar DB-dokument till formatet frontend använder:
// { id, status, batteryLevel, location:{lat,lng}, city }
function normalize(doc) {
  return {
    id: String(doc?.id ?? ''),
    status: String(doc?.status ?? 'Off'),
    batteryLevel: Number(doc?.batteryLevel ?? 0),
    location: doc?.location ?? { lat: 0, lng: 0 },
    city: String(doc?.city ?? 'Stockholm'),
  };
}

// MUST be '/scooters' (frontend calls GET /v1/scooters)
// GET /scooters: alla scooters (för kartor)
router.get('/scooters', async (_req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.json([]);

    const docs = await db.collection('scooters').find({}).toArray();
    res.json(docs.map(normalize).filter((s) => s.id));
  } catch (e) {
    next(e);
  }
});

// GET only available scooters (safe extra endpoint in case rent hook uses it)
// GET /scooters/available: bara "Available" (för rent-sidan)
router.get('/scooters/available', async (_req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.json([]);

    const docs = await db.collection('scooters').find({ status: 'Available' }).toArray();
    res.json(docs.map(normalize).filter((s) => s.id));
  } catch (e) {
    next(e);
  }
});

// GET scooter by ID (for admin + frontend details view)
router.get('/scooters/:id', async (req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    const doc = await db.collection('scooters').findOne({ id: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Not found' });

    res.json(normalize(doc));
  } catch (e) {
    next(e);
  }
});

// Admin delete (keep working; now requiresAdmin is always defined)
// Admin: ta bort scooter (kräver token + admin-roll)
router.delete('/scooters/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    await db.collection('scooters').deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
