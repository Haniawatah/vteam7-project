import express from 'express';
import crypto from 'crypto';
import { db, ensureSeeded, getDb } from '../../database.js';
import { createScooter, deleteScooter, getScooter, listScooters, updateScooter } from '../../models/elsparkcykel.js';

const router = express.Router();

// Seed database if empty
async function seedIfEmpty(db) {
    const count = await db.collection('scooters').countDocuments();
    if (count > 0) return;
    const now = new Date();
    await db.collection('scooters').insertMany([
        { model: 'Standard', status: 'available', latitude: 59.3293, longitude: 18.0686, batteryLevel: 88, createdAt: now, updatedAt: now },
        { model: 'Standard', status: 'available', latitude: 59.334, longitude: 18.06, batteryLevel: 72, createdAt: now, updatedAt: now },
        { model: 'Standard', status: 'available', latitude: 59.322, longitude: 18.08, batteryLevel: 64, createdAt: now, updatedAt: now },
    ]);
}

// GET all scooters
router.get('/scooters', async (_req, res) => {
    const db = await getDb();
    if (process.env.NODE_ENV !== 'production') await seedIfEmpty(db);
    res.json(await listScooters(db));
});

// Create a new scooter
router.post('/scooters', async (req, res) => {
    const db = await getDb();
    res.status(201).json(await createScooter(db, req.body));
});

// Get a single scooter by ID
router.get('/scooters/:id', async (req, res) => {
    const db = await getDb();
    const scooter = await getScooter(db, req.params.id);
    if (!scooter) return res.status(404).json({ error: 'Not found' });
    res.json(scooter);
});

// Update a scooter by ID
router.put('/scooters/:id', async (req, res) => {
    const db = await getDb();
    const scooter = await updateScooter(db, req.params.id, req.body);
    if (!scooter) return res.status(404).json({ error: 'Not found' });
    res.json(scooter);
});

// Delete a scooter by ID
router.delete('/scooters/:id', async (req, res) => {
    const db = await getDb();
    const ok = await deleteScooter(db, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
});

export default router;
