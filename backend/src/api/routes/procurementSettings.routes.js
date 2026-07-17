const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/procurementSettings.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// ─── Settings (contact info) ─────────────────────────────────────────────────
router.get('/', ctrl.getSettings);
router.put('/', authenticate, authorizeRoles(['Purchase', 'Admin']), ctrl.updateSettings);

// ─── Messages from public customers ─────────────────────────────────────────
// Public: anyone can submit a message
router.post('/messages', ctrl.submitMessage);

// Protected: Purchase/Admin can read and manage messages
router.get('/messages', authenticate, authorizeRoles(['Purchase', 'Admin']), ctrl.getMessages);
router.get('/messages/unread-count', authenticate, authorizeRoles(['Purchase', 'Admin']), ctrl.getUnreadCount);
router.patch('/messages/:id/read', authenticate, authorizeRoles(['Purchase', 'Admin']), ctrl.markRead);
router.patch('/messages/mark-all-read', authenticate, authorizeRoles(['Purchase', 'Admin']), ctrl.markAllRead);

module.exports = router;

