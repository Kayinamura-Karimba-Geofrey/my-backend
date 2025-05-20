const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createNews,
    getAllNews,
    getNewsById,
    updateNews,
    deleteNews,
    deleteMedia
} = require('../controllers/newsController');


router.post('/', protect, createNews);
router.get('/', getAllNews);
router.get('/:id', getNewsById);
router.put('/:id', protect, updateNews);
router.delete('/:id', protect, deleteNews);
router.delete('/:id/media', protect, deleteMedia);

module.exports = router;