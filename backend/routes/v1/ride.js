import express from 'express';
import crypto from 'crypto';

import { getDb, mem, nowIso, computeRidePrice } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';

const router = express.Router();

// Startar en resa (låser scootern till InUse)
router.post('/ride/start/:scooterId', authenticate, async (req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    const scooterId = req.params.scooterId;

    const scooter = await db.collection('scooters').findOne({ id: scooterId });
    if (!scooter) return res.status(404).json({ message: 'Scooter not found' });
    if (scooter.status !== 'Available') return res.status(409).json({ message: 'Scooter not available' });

    for (const r of mem.rides.values()) {
      if (r.userId === req.user.id && r.status === 'active') return res.status(409).json({ message: 'Already riding' });
    }

    await db.collection('scooters').updateOne({ id: scooterId }, { $set: { status: 'InUse', updatedAt: new Date() } });

    const rideId = `ride_${crypto.randomUUID()}`;
    const ride = {
      _id: rideId,
      id: rideId,
      userId: req.user.id,
      scooterId,
      start_time: nowIso(),
      end_time: null,
      status: 'active',
      price: 0,
    };

    mem.rides.set(rideId, ride);
    res.json(ride);
  } catch (e) {
    next(e);
  }
});

// Hämtar aktiv resa + aktuell scooter-data (för ActiveRide-sidan)
router.get('/ride/active/:rideId', authenticate, async (req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    const ride = mem.rides.get(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (req.user.role !== 'admin' && ride.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const scooter = await db.collection('scooters').findOne({ id: ride.scooterId });
    res.json({ ...ride, price: computeRidePrice(ride), scooter });
  } catch (e) {
    next(e);
  }
});

// Hämtar pris i realtid (frontend pollar)
router.get('/ride/price/:rideId', authenticate, (req, res) => {
  const ride = mem.rides.get(req.params.rideId);
  if (!ride) return res.status(404).json({ message: 'Ride not found' });
  if (req.user.role !== 'admin' && ride.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  res.json({ price: computeRidePrice(ride) });
});

// Avslutar resa: släpper scooter + debiterar (plånboken kan bli negativ = "postpaid")
router.post('/ride/end/:rideId', authenticate, async (req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    const ride = mem.rides.get(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (req.user.role !== 'admin' && ride.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (ride.status !== 'active') return res.status(409).json({ message: 'Ride is not active' });

    ride.status = 'ended';
    ride.end_time = nowIso();
    ride.price = computeRidePrice(ride);

    await db.collection('scooters').updateOne({ id: ride.scooterId }, { $set: { status: 'Available', updatedAt: new Date() } });

    const due = Number(ride.price ?? 0);

    const upd = await db.collection('users').findOneAndUpdate(
      { id: ride.userId },
      { $inc: { wallet: -due }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    res.json({ ok: true, ride, charged: due, wallet: Number(upd?.value?.wallet ?? 0) });
  } catch (e) {
    next(e);
  }
});

// Hämtar historik för avslutade resor
router.get('/ride/history', authenticate, (req, res) => {
  const rows = [...mem.rides.values()].filter((r) => r.userId === req.user.id && r.status !== 'active');
  res.json(rows);
});

export default router;
