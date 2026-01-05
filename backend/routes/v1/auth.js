import express from "express";
import { getDb } from '../../database.js';
import { signToken } from '../../middleware/signtoken.js';

const router = express.Router();

router.get('/auth/google', async (_req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    // dev shortcut: log in as admin
    const admin = await db.collection('users').findOne({ id: 'u_admin' });
    if (!admin) return res.status(500).json({ message: 'Admin user missing' });

    const token = signToken(admin);
    res.redirect(`http://localhost:5173/oauth-success?token=${encodeURIComponent(token)}`);
  } catch (e) {
    next(e);
  }
});

router.post('/auth/logout', (_req, res) => res.json({ ok: true }));

// Routes under /v1/auth/*
router.post("/logout", (_req, res) => res.json({ ok: true }));

export default router;
