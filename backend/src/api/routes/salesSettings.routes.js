const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salesSettings.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// ─── Settings (contact info) ─────────────────────────────────────────────────
router.get('/', ctrl.getSettings);
router.put('/', authenticate, authorizeRoles(['Sales Manager', 'Admin', 'CEO']), ctrl.updateSettings);

// ─── Messages from public customers ─────────────────────────────────────────
// Public: anyone can submit a message
router.post('/messages', ctrl.submitMessage);

// Protected: Sales Manager/Admin can read and manage messages
router.get('/messages', authenticate, authorizeRoles(['Sales Manager', 'Admin', 'CEO']), ctrl.getMessages);
router.get('/messages/unread-count', authenticate, authorizeRoles(['Sales Manager', 'Admin', 'CEO']), ctrl.getUnreadCount);
router.patch('/messages/:id/read', authenticate, authorizeRoles(['Sales Manager', 'Admin', 'CEO']), ctrl.markRead);
router.patch('/messages/mark-all-read', authenticate, authorizeRoles(['Sales Manager', 'Admin', 'CEO']), ctrl.markAllRead);

module.exports = router;

