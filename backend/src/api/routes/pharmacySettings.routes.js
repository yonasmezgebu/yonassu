const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/pharmacySettings.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const ROLES = ['Pharmacy Manager', 'Admin', 'CEO'];

// Public routes (no auth)
router.get('/', settingsController.getSettings);
router.post('/messages', settingsController.submitMessage);

// Protected routes
router.put('/', authenticate, authorizeRoles(ROLES), settingsController.updateSettings);
router.get('/messages', authenticate, authorizeRoles(ROLES), settingsController.getMessages);
router.get('/messages/unread-count', authenticate, authorizeRoles(ROLES), settingsController.getUnreadCount);
router.put('/messages/mark-all-read', authenticate, authorizeRoles(ROLES), settingsController.markAllRead);
router.put('/messages/:id/read', authenticate, authorizeRoles(ROLES), settingsController.markRead);

module.exports = router;
