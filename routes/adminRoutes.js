const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    registerAdmin,
    loginAdmin,
    getProfile,
    updateProfile
} = require('../controllers/adminController');


router.post('/register', registerAdmin);
router.post('/login', loginAdmin);


router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;

