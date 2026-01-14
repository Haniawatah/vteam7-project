// Admin-skydd: kräver att req.user.role === "admin"
export function requireAdmin(req, res, next) {
  const role = req.user?.role ?? req.user?.roll;
  if (role === 'admin') return next();
  return res.status(403).json({ message: 'Admin only' });
}

export default requireAdmin;

// Bakåtkompatibilitet (vissa filer importerar { checkAdmin })
export const checkAdmin = requireAdmin;