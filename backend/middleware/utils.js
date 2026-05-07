import jwt from 'jsonwebtoken';
import { getDb } from '../database.js';

// Hämtar token från "Authorization: Bearer ..." eller "x-access-token"
export function getTokenFromReq(req) {
  const auth = req.headers?.authorization || '';
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const x = req.headers?.['x-access-token'];
  return typeof x === 'string' ? x.trim() : '';
}

// Hjälpfunktion för att skapa HTTP-fel med statuskod
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Middleware: verifierar JWT och sätter req.user
export async function authenticate(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const decoded = jwt.verify(token, secret);

    const db = getDb();
    if (!db) return res.status(500).json({ message: 'Database not configured' });

    const userId = decoded.sub || decoded.id;
    const user = await db.collection('users').findOne({ id: userId });

    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Bakåtkompatibilitet (vissa routes importerar { checkToken })
export const checkToken = authenticate;

// Gemensam funktion för att hämta JWT-secret
export function getJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.SECRET ||
    process.env.SECRET_KEY ||
    ''
  );
}