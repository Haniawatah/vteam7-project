import crypto from 'crypto';
import { getDb } from '../database.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt] = stored.split(':');
  return hashPassword(String(password || ''), salt) === stored;
}

export async function usersCol() {
  const db = await getDb();
  const col = db.collection('users');

  // Keep compatible with an existing "email_1" index (no collation changes here)
  try {
    await col.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
  } catch (e) {
    const codeName = e?.codeName;
    const code = e?.code;
    if (!(code === 86 || codeName === 'IndexKeySpecsConflict' || codeName === 'IndexOptionsConflict')) throw e;
  }

  return col;
}

export async function findUserByEmail(email) {
  const col = await usersCol();
  return col.findOne({ email: normalizeEmail(email) });
}

export async function createUser({ email, password, name = '', role = 'user' }) {
  const col = await usersCol();
  const doc = {
    email: normalizeEmail(email),
    name: String(name || ''),
    role: role === 'admin' ? 'admin' : 'user',
    passwordHash: hashPassword(String(password || '')),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const res = await col.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function upsertAdminFromEnv() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email || !password) return { ok: false, reason: 'ADMIN_EMAIL/ADMIN_PASSWORD not set' };

  const col = await usersCol();
  const existing = await col.findOne({ email });

  const existingSalt =
    typeof existing?.passwordHash === 'string' && existing.passwordHash.includes(':')
      ? existing.passwordHash.split(':')[0]
      : undefined;

  await col.updateOne(
    { email },
    {
      $set: {
        email,
        role: 'admin',
        passwordHash: hashPassword(password, existingSalt),
        updatedAt: new Date(),
      },
      $setOnInsert: { name: 'Admin', createdAt: new Date() },
    },
    { upsert: true }
  );

  const after = await col.findOne({ email });
  return { ok: true, email, role: after?.role ?? null };
}

export function toPublicUser(u) {
  if (!u) return null;
  return { id: String(u._id), email: u.email, name: u.name, role: u.role };
}

export function checkPassword(u, password) {
  return verifyPassword(password, u?.passwordHash);
}

/**
 * Compatibility layer for older routes that still do:
 *   import user from '../models/user.js'
 *   await user.getAll(), await user.getOne(), await user.register()
 */
async function getAll() {
  const col = await usersCol();
  const rows = await col.find({}).toArray();
  return rows.map(toPublicUser);
}

async function getOne(email) {
  const u = await findUserByEmail(email);
  return toPublicUser(u);
}

async function register(email, password, name) {
  const existing = await findUserByEmail(email);
  if (existing) return null;
  const created = await createUser({ email, password, name, role: 'user' });
  return toPublicUser(created);
}

export default { getAll, getOne, register };
