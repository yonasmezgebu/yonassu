const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rentalSettings.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Public: View settings (for footer)
router.get('/', ctrl.getSettings);

// Public: Submit message
router.post('/messages', ctrl.submitMessage);

// Protected: Car Renting Manager/Admin can update settings
router.put('/', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), ctrl.updateSettings);

// Protected: Car Renting Manager/Admin can read and manage messages
router.get('/messages', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), ctrl.getMessages);
router.get('/messages/unread-count', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), ctrl.getUnreadCount);
router.patch('/messages/:id/read', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), ctrl.markRead);
router.patch('/messages/mark-all-read', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), ctrl.markAllRead);

module.exports = router;
