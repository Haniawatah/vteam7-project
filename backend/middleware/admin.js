import jwt from 'jsonwebtoken';
export function checkAdmin(req, res, next) {

    const userRole = req.user?.roll;

    if (userRole !== 'admin') {

        return res.status(403).json({ success: false, message: "Access denied2: Admins only" });
    }

    next();
}

export default function requireAdmin(req, res, next) {
  const role = req.user?.role ?? req.user?.roll; // tolerate legacy "roll"
  if (role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  return next();
}