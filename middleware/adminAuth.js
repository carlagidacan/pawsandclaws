const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No admin token provided' });
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;

        const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
        
        // Check if the user is an admin
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin rights required.' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(401).json({ message: 'Admin authentication failed' });
    }
};

module.exports = adminAuth;
