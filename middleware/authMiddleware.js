const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: 'Not authorized, no token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            {
                 expiresIn: '30d'
            }
            req.admin = await Admin.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

const admin = (req, res, next) => {
    if (req.admin && req.admin.role === 'admin') {
        next();
    } else {
        res.status(401).json({ error: 'Not authorized as an admin' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.admin && req.admin.role === 'super_admin') {
        next();
    } else {
        res.status(401).json({ error: 'Not authorized as a super admin' });
    }
};

module.exports = { protect, admin, superAdmin };