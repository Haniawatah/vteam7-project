import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '../database.js';

const USERS = 'users';
const SESSIONS = 'sessions';
const PAYMENTS = 'payments';

const now = () => new Date();

function pbkdf2(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
}

function verifyPassword(user, password) {
  const hash = pbkdf2(String(password), user.passwordSalt);
  return hash === user.passwordHash;
}

function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: String(u._id),
    name: u.name ?? '',
    email: u.email ?? '',
    role: u.role ?? 'user',
    balance: Number(u.balance ?? 0),
    rides: u.rides ?? [],
  };
}

async function createSession(userId) {
  const db = await getDb();
  const token = crypto.randomBytes(24).toString('hex');
  await db.collection(SESSIONS).insertOne({ token, userId: new ObjectId(userId), createdAt: now() });
  return token;
}

async function getSessionUser(token) {
  const db = await getDb();
  const session = await db.collection(SESSIONS).findOne({ token });
  if (!session) return null;
  const user = await db.collection(USERS).findOne({ _id: session.userId });
  return user ? { user, session } : null;
}

export async function registerUser({ email, password, name }) {
  if (!email || !password) throw new Error('Email and password are required');

  const db = await getDb();
  const existing = await db.collection(USERS).findOne({ email: String(email).toLowerCase() });
  if (existing) throw new Error('Email already registered');

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = pbkdf2(String(password), salt);

  const doc = {
    email: String(email).toLowerCase(),
    name: name ?? '',
    role: 'user',
    balance: 0,
    passwordSalt: salt,
    passwordHash,
    createdAt: now(),
  };

  const { insertedId } = await db.collection(USERS).insertOne(doc);
  const token = await createSession(insertedId);
  const user = await db.collection(USERS).findOne({ _id: insertedId });

  return { token, user: sanitizeUser(user) };
}

export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error('Email and password are required');

  const db = await getDb();
  const user = await db.collection(USERS).findOne({ email: String(email).toLowerCase() });
  if (!user) throw new Error('Invalid credentials');

  if (!verifyPassword(user, password)) throw new Error('Invalid credentials');

  const token = await createSession(user._id);
  return { token, user: sanitizeUser(user) };
}

export async function loginAdmin({ email, password }) {
  if (!email || !password) throw new Error('Email and password are required');

  const db = await getDb();
  const user = await db.collection(USERS).findOne({ email: String(email).toLowerCase() });
  if (!user) throw new Error('Invalid credentials');

  if (!verifyPassword(user, password)) throw new Error('Invalid credentials');
  if ((user.role ?? 'user') !== 'admin') throw new Error('Admin only');

  const token = await createSession(user._id);
  return { token, user: sanitizeUser(user) };
}

// Seed/update an admin user using env vars (optional, but makes admin login usable)
// Required env:
//   ADMIN_EMAIL=admin@example.com
//   ADMIN_PASSWORD=...
export async function ensureAdminFromEnv() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) return { ok: false, reason: 'missing ADMIN_EMAIL/ADMIN_PASSWORD' };

  const db = await getDb();
  const existing = await db.collection(USERS).findOne({ email });

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = pbkdf2(String(password), salt);

  if (!existing) {
    const doc = {
      email,
      name: 'Admin',
      role: 'admin',
      balance: 0,
      passwordSalt: salt,
      passwordHash,
      createdAt: now(),
    };
    await db.collection(USERS).insertOne(doc);
    return { ok: true, created: true };
  }

  // keep it deterministic: ensure role=admin and reset password to env value
  await db.collection(USERS).updateOne(
    { _id: existing._id },
    { $set: { role: 'admin', passwordSalt: salt, passwordHash, updatedAt: now() } }
  );
  return { ok: true, created: false };
}

export async function listUsers() {
  const db = await getDb();
  const users = await db.collection(USERS).find({}, { projection: { passwordHash: 0, passwordSalt: 0 } }).toArray();
  return users.map(sanitizeUser);
}

export async function getPaymentInfo(userId) {
  const db = await getDb();
  const p = await db.collection(PAYMENTS).findOne({ userId: new ObjectId(userId) });
  return p
    ? { cardNumber: p.cardNumber ?? '', expiryDate: p.expiryDate ?? '' }
    : { cardNumber: '', expiryDate: '' };
}

export async function updatePaymentInfo(userId, { cardNumber, expiryDate }) {
  const db = await getDb();
  await db.collection(PAYMENTS).updateOne(
    { userId: new ObjectId(userId) },
    { $set: { userId: new ObjectId(userId), cardNumber: String(cardNumber), expiryDate: String(expiryDate), updatedAt: now() } },
    { upsert: true }
  );
  return { ok: true };
}

// --- Middleware expected by routes ---
export async function authenticateUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const found = await getSessionUser(token);
    if (!found) return res.status(401).json({ error: 'Invalid token' });

    req.user = sanitizeUser(found.user);
    req.user._id = String(found.user._id); // internal convenience
    req.token = token;
    next();
  } catch (e) {
    res.status(500).json({ error: 'Auth failed' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// --- Compatibility exports (some route versions import these) ---
// Support both: getUserDocByToken(token) and getUserDocByToken(db, token)
export async function getUserDocByToken(dbOrToken, maybeToken) {
  const token =
    typeof dbOrToken === 'string' ? dbOrToken : (maybeToken || '');

  if (!token) return null;

  const db =
    typeof dbOrToken === 'object' && dbOrToken?.collection
      ? dbOrToken
      : await getDb();

  const session = await db.collection('sessions').findOne({ token });
  if (!session) return null;

  const userId =
    session.userId instanceof ObjectId ? session.userId : new ObjectId(session.userId);

  const user = await db.collection('users').findOne({ _id: userId });
  return user || null;
}

export function toUserDto(userDoc) {
  // Prefer existing sanitizer if your file already defines one
  if (typeof sanitizeUser === 'function') return sanitizeUser(userDoc);

  // Fallback: strip sensitive fields
  if (!userDoc) return null;
  return {
    id: String(userDoc._id),
    name: userDoc.name ?? '',
    email: userDoc.email ?? '',
    role: userDoc.role ?? 'user',
    balance: Number(userDoc.balance ?? 0),
    rides: userDoc.rides ?? [],
  };
}
