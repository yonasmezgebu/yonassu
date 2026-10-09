const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const newsController = require('../controllers/news.controller');

const { upload, handleUploadError } = require('../../services/storage.service');

// Public
router.get('/public', newsController.publicPosts);

// Employee
router.get('/notifications', authenticate, newsController.myNotifications);
router.get('/notifications/unread-count', authenticate, newsController.unreadCount);
router.put('/notifications/:id/read', authenticate, newsController.markRead);
router.put('/notifications/read-all', authenticate, newsController.markAllRead);

// Admin + HR Manager
router.use(authenticate, authorizeRoles(['Admin', 'CEO', 'HR Manager', 'HR']));
router.get('/', newsController.listPosts);
router.get('/:id', newsController.getPost);
router.post('/', upload.news.array('images', 10), newsController.createPost);
router.put('/:id', upload.news.array('images', 10), newsController.updatePost);
router.delete('/:id', newsController.deletePost);

module.exports = router;
