const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};


const registerAdmin = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        
        const admin = await Admin.create({
            fullName,
            email,
            password,
            role: role || 'admin'
        });

        if (admin) {
            res.status(201).json({
                _id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role,
                token: generateToken(admin._id)
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        
        if (!admin.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        
        admin.lastLogin = Date.now();
        await admin.save();

        res.json({
            _id: admin._id,
            fullName: admin.fullName,
            email: admin.email,
            role: admin.role,
            token: generateToken(admin._id)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('-password');
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const updateProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const { fullName, email, password, currentPassword } = req.body;

        
        if (fullName) admin.fullName = fullName;
        if (email) admin.email = email;

    
        if (password && currentPassword) {
            const isMatch = await admin.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
            admin.password = password;
        }

        const updatedAdmin = await admin.save();

        res.json({
            _id: updatedAdmin._id,
            fullName: updatedAdmin.fullName,
            email: updatedAdmin.email,
            role: updatedAdmin.role
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getProfile,
    updateProfile
};