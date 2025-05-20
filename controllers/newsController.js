const News = require('../models/news');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = file.mimetype.startsWith('image/') ? 'uploads/images' : 'uploads/videos';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'));
        }
    }
}).array('media', 50);


const createNews = async (req, res) => {
    try {
        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const { title, content, tags, status } = req.body;
            const mediaFiles = req.files || [];
            
            const images = mediaFiles
                .filter(file => file.mimetype.startsWith('image/'))
                .map(file => file.path);
            
            const videos = mediaFiles
                .filter(file => file.mimetype.startsWith('video/'))
                .map(file => file.path);

            const news = new News({
                title,
                content,
                images,
                videos,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                status: status || 'draft',
                author: req.admin._id
            });

            await news.save();
            res.status(201).json(news);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getAllNews = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = status ? { status } : {};

        const news = await News.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('author', 'fullName email');

        const count = await News.countDocuments(query);

        res.json({
            news,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getNewsById = async (req, res) => {
    try {
        const news = await News.findById(req.params.id)
            .populate('author', 'fullName email');
        
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }
        
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const updateNews = async (req, res) => {
    try {
        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const { title, content, tags, status } = req.body;
            const news = await News.findById(req.params.id);

            if (!news) {
                return res.status(404).json({ error: 'News not found' });
            }

            const mediaFiles = req.files || [];
            
            if (mediaFiles.length > 0) {
                const newImages = mediaFiles
                    .filter(file => file.mimetype.startsWith('image/'))
                    .map(file => file.path);
                
                const newVideos = mediaFiles
                    .filter(file => file.mimetype.startsWith('video/'))
                    .map(file => file.path);

                news.images = [...news.images, ...newImages];
                news.videos = [...news.videos, ...newVideos];
            }

            news.title = title || news.title;
            news.content = content || news.content;
            news.tags = tags ? tags.split(',').map(tag => tag.trim()) : news.tags;
            news.status = status || news.status;

            await news.save();
            res.json(news);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteNews = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }

        
        const deleteFiles = async (files) => {
            for (const file of files) {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            }
        };

        await deleteFiles(news.images);
        await deleteFiles(news.videos);
        
        await news.remove();
        res.json({ message: 'News deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const deleteMedia = async (req, res) => {
    try {
        const { mediaUrl } = req.body;
        const news = await News.findById(req.params.id);

        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }

        
        news.images = news.images.filter(img => img !== mediaUrl);
        news.videos = news.videos.filter(vid => vid !== mediaUrl);

        
        if (fs.existsSync(mediaUrl)) {
            fs.unlinkSync(mediaUrl);
        }

        await news.save();
        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createNews,
    getAllNews,
    getNewsById,
    updateNews,
    deleteNews,
    deleteMedia
};