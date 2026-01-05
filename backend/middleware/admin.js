// Admin-skydd: kräver att req.user.role === "admin"
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  return next();
}

// Bakåtkompatibilitet (vissa filer importerar { checkAdmin })
export const checkAdmin = requireAdmin;

// Bakåtkompatibilitet (vissa filer gör default-import)
export default requireAdmin;