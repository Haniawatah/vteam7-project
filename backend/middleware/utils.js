import jwt from 'jsonwebtoken';

function getToken(req) {
  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const x = req.headers?.['x-access-token'];
  if (typeof x === 'string' && x.trim()) return x.trim();
  return null;
}

export function authenticate(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const secret = process.env.JWT_SECRET || 'change-me';
    req.user = jwt.verify(token, secret);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Backwards-compat for existing routes importing { checkToken }
export const checkToken = authenticate;

export function checkAdmin(req, res, next) {

    const userRole = req.user?.role;

    if (userRole !== 'admin') {

        return res.status(403).json({ success: false, message: "Access denied: Admins 2only" });
    }

    next();
}