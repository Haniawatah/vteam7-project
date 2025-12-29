import express from 'express';
import crypto from 'crypto';
import { db, ensureSeeded } from '../../database.js';
import { getDb } from '../../database.js';
import {
  authenticateUser,
  createSession,
  createUser,
  deleteSession,
  getPaymentInfo,
  getUserDocByToken,
  listUsers,
  toUserDto,
  updatePaymentInfo,
} from '../../models/user.js';

const router = express.Router();

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();
  const userDoc = await getUserDocByToken(db, token);
  if (!userDoc) return res.status(401).json({ error: 'Unauthorized' });

  req.user = toUserDto(userDoc);
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.post('/auth/register', async (req, res) => {
  const db = await getDb();
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const userDoc = await createUser(db, { email, password, name, role: 'user' });
    const token = await createSession(db, userDoc._id);
    res.json({ token, user: toUserDto(userDoc) });
  } catch (e) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  const db = await getDb();
  const { email, password } = req.body || {};
  const userDoc = await authenticateUser(db, { email, password });
  if (!userDoc) return res.status(401).json({ error: 'Invalid credentials' });

  const token = await createSession(db, userDoc._id);
  res.json({ token, user: toUserDto(userDoc) });
});

router.post('/auth/logout', requireAuth, async (req, res) => {
  const db = await getDb();
  await deleteSession(db, req.token);
  res.json({ ok: true });
});

router.get('/users/me', requireAuth, async (req, res) => {
  res.json(req.user);
});

router.get('/users/me/payment', requireAuth, async (req, res) => {
  const db = await getDb();
  res.json(await getPaymentInfo(db, req.user.id));
});

router.put('/users/me/payment', requireAuth, async (req, res) => {
  const db = await getDb();
  const { cardNumber, expiryDate } = req.body || {};
  res.json(await updatePaymentInfo(db, req.user.id, { cardNumber, expiryDate }));
});

router.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  const db = await getDb();
  res.json(await listUsers(db));
});

router.get('/reports', requireAuth, requireAdmin, async (_req, res) => {
  const db = await getDb();
  const rides = await db.collection('rides').find({ status: 'ended' }).sort({ endTime: -1 }).limit(100).toArray();
  res.json(
    rides.map((r) => ({
      id: String(r._id),
      user: r.userId,
      rideDuration: r.duration ?? 0,
      date: r.endTime || r.date || r.startTime,
    }))
  );
});

export default router;
