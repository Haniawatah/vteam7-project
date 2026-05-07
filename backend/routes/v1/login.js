import express from 'express';
import crypto from 'crypto';

import { getDb, makeSalt, hashPassword, verifyPassword } from '../../database.js';
import { signToken } from '../../middleware/signtoken.js';

const router = express.Router();

function safeUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, balance: Number(u.wallet ?? 0) };
}

// POST /login: kontrollerar email/lösenord och returnerar { token, user }
router.post('/login', async (req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const users = db.collection('users');
    const user = await users.findOne({ email: String(email) });
    if (!user) return res.status(401).json({ message: 'invalid credentials' });

    const ok =
      user.passwordSalt && user.passwordHash
        ? verifyPassword(password, user.passwordSalt, user.passwordHash)
        : false;

    if (!ok) return res.status(401).json({ message: 'invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (e) {
    next(e);
  }
});

// POST /register: skapar ny användare i Mongo och returnerar { token, user }
router.post('/register', async (req, res, next) => {
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    const { email, password, name } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const users = db.collection('users');

    const exists = await users.findOne({ email: String(email) });
    if (exists) return res.status(409).json({ message: 'email already exists' });

    const salt = makeSalt();
    const passwordHash = hashPassword(password, salt);

    const user = {
      id: `u_${crypto.randomUUID()}`,
      name: name || String(email).split('@')[0],
      email: String(email),
      role: 'user',
      wallet: 0,
      enabled: false,
      payment_information: { card_id: null, cardHash: null, last4: null, expiryDate: null, enabled: null,},
      subscription: { status: 'inactive', nextBillingDate: null, monthlyFee: 0 },
      passwordSalt: salt,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await users.insertOne(user);

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (e) {
    next(e);
  }
});

export default router;
