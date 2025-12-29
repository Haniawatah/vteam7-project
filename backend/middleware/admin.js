import jwt from 'jsonwebtoken';
export function checkAdmin(req, res, next) {

    const userRole = req.user?.roll;

    if (userRole !== 'admin') {

        return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    next();
}