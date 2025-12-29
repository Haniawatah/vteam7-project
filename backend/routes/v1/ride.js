import express from 'express';
import crypto from 'crypto';
import { db, ensureSeeded } from '../../database.js';
import { getDb } from '../../database.js';
import { createRide, endRide, getRideById, listRideHistoryByUser } from '../../models/ride.js';
import { getUserDocByToken, toUserDto, authenticateUser } from '../../models/user.js';

const router = express.Router();

async function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const db = await getDb();
    const userDoc = await getUserDocByToken(db, token);
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized' });

    req.user = toUserDto(userDoc);
    next();
}

router.post('/rides', authenticateUser, async (req, res) => {
    try {
        const { scooterId } = req.body ?? {};
        if (!scooterId) return res.status(400).json({ error: 'scooterId is required' });
        const ride = await createRide({ userId: req.user._id, scooterId });
        res.status(201).json(ride);
    } catch (e) {
        res.status(400).json({ error: e?.message || 'Failed to create ride' });
    }
});

router.get('/rides/active/:rideId', authenticateUser, async (req, res) => {
    const ride = await getRideById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: 'No active ride found' });
    res.json(ride);
});

router.put('/rides/end/:rideId', authenticateUser, async (req, res) => {
    const ride = await endRide(req.params.rideId, req.user._id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
});

router.get('/rides/history', authenticateUser, async (req, res) => {
    res.json(await listRideHistoryByUser(req.user.id));
});

router.post('/', (req, res) => {
    ensureSeeded();
    const { scooterId } = req.body || {};
    const scooter = db.scooters.find((s) => s.id === scooterId);
    if (!scooter) return res.status(400).json({ error: 'Invalid scooterId' });
    if (scooter.status !== 'available') return res.status(409).json({ error: 'Scooter not available' });

    scooter.status = 'rented';

    const ride = {
        id: crypto.randomUUID(),
        scooterId,
        startTime: new Date().toISOString(),
        status: 'active',
    };

    db.rides.push(ride);
    res.status(201).json(ride);
});

router.get('/active/:rideId', (req, res) => {
    ensureSeeded();
    const ride = db.rides.find((r) => r.id === req.params.rideId && r.status === 'active');
    if (!ride) return res.status(404).json({ error: 'Not found' });
    res.json(ride);
});

router.put('/end/:rideId', (req, res) => {
    ensureSeeded();
    const ride = db.rides.find((r) => r.id === req.params.rideId);
    if (!ride) return res.status(404).json({ error: 'Not found' });

    ride.status = 'ended';
    ride.endTime = new Date().toISOString();

    const scooter = db.scooters.find((s) => s.id === ride.scooterId);
    if (scooter) scooter.status = 'available';

    res.json(ride);
});

router.get('/history', (req, res) => {
    ensureSeeded();
    const ended = db.rides
        .filter((r) => r.status === 'ended')
        .map((r) => ({
            id: r.id,
            scooterId: r.scooterId,
            date: r.endTime || r.startTime,
            duration: 0,
            cost: 0,
        }));
    res.json(ended);
});

export default router;
