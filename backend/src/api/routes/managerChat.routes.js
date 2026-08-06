const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/managerChat.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const ROLES = [
  'CEO', 'Admin', 'HR Manager',
  'Car Rental Manager', 'Car Renting Manager',
  'Printing Supervisor', 'Printing Manager',
  'Pharmacy Manager', 'Sales Manager',
  'Purchase Manager', 'Purchase',
  'Board Member', 'Board',
  'General Store Manager', 'General Store Keeper',
  'Pharmacy Store Manager'
];

// All routes require authentication + valid role
router.get('/users',                    authenticate, authorizeRoles(ROLES), ctrl.getManagerUsers);
router.get('/conversation/:partnerId',  authenticate, authorizeRoles(ROLES), ctrl.getConversation);
router.post('/send',                    authenticate, authorizeRoles(ROLES), ctrl.sendMessage);
router.delete('/:messageId',            authenticate, authorizeRoles(ROLES), ctrl.deleteMessage);
router.get('/unread-count',             authenticate, authorizeRoles(ROLES), ctrl.getUnreadCount);

// Admin / CEO routes for Chat Access Toggle
router.get('/admin/users',              authenticate, authorizeRoles(['CEO']), ctrl.getAdminUsers);
router.patch('/admin/users/:id/toggle', authenticate, authorizeRoles(['CEO']), ctrl.toggleChatAccess);

module.exports = router;
