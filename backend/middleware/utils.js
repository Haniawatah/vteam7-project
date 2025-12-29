import jwt from 'jsonwebtoken';

export function checkToken(req, res, next) {
    const token = req.headers['x-access-token'];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }

        req.user = decoded;
        next();
    });
}

export function checkAdmin(req, res, next) {

    const userRole = req.user?.roll;

    if (userRole !== 'admin') {

        return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    next();
}