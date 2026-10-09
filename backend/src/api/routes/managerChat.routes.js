const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/managerChat.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const ROLES = [
  'CEO', 'Admin', 'HR Manager', 'HR',
  'Car Rental Manager', 'Car Renting Manager', 'Rental Manager',
  'Printing Supervisor', 'Printing Manager',
  'Pharmacy Manager', 'Sales Manager',
  'Purchase Manager', 'Purchase',
  'Board Member', 'Board',
  'General Store Manager', 'General Store Keeper', 'General Store',
  'Pharmacy Store Manager', 'Pharmacy Store Keeper', 'Pharmacy Store',
  'Finance Manager', 'Accountant',
  'Pharmacy Worker', 'Cashier', 'Employee'
];

// ── Multer for file uploads ──────────────────────────────────────────────────
const { upload, handleUploadError } = require('../../services/storage.service');

// ── DM Routes ─────────────────────────────────────────────────────────────────
router.get('/users',                    authenticate, authorizeRoles(ROLES), ctrl.getManagerUsers);
router.get('/conversation/:partnerId',  authenticate, authorizeRoles(ROLES), ctrl.getConversation);
router.post('/send',                    authenticate, authorizeRoles(ROLES), ctrl.sendMessage);
router.post('/send-file',               authenticate, authorizeRoles(ROLES), upload.chat.single('file'), ctrl.sendFile);
router.delete('/:messageId',            authenticate, authorizeRoles(ROLES), ctrl.deleteMessage);
router.get('/unread-count',             authenticate, authorizeRoles(ROLES), ctrl.getUnreadCount);
router.get('/unread-counts',            authenticate, authorizeRoles(ROLES), ctrl.getUnreadCounts);
router.patch('/heartbeat',              authenticate, authorizeRoles(ROLES), ctrl.heartbeat);
router.get('/online-status',            authenticate, authorizeRoles(ROLES), ctrl.getOnlineStatus);

// ── Admin / CEO Routes ────────────────────────────────────────────────────────
router.get('/admin/users',              authenticate, authorizeRoles(['CEO']), ctrl.getAdminUsers);
router.patch('/admin/users/:id/toggle', authenticate, authorizeRoles(['CEO']), ctrl.toggleChatAccess);

// ── Group Routes ──────────────────────────────────────────────────────────────
router.get('/groups',                                       authenticate, authorizeRoles(ROLES), ctrl.getMyGroups);
router.post('/groups',                                      authenticate, authorizeRoles(ROLES), upload.chat.single('profile_photo'), ctrl.createGroup);
router.patch('/groups/:groupId/photo',                      authenticate, authorizeRoles(ROLES), upload.chat.single('profile_photo'), ctrl.updateGroupPhoto);
router.get('/groups/:groupId/messages',                     authenticate, authorizeRoles(ROLES), ctrl.getGroupMessages);
router.post('/groups/:groupId/messages',                    authenticate, authorizeRoles(ROLES), upload.chat.single('file'), ctrl.sendGroupMessage);
router.delete('/groups/:groupId/messages/:messageId',       authenticate, authorizeRoles(ROLES), ctrl.deleteGroupMessage);
router.get('/groups/:groupId/members',                      authenticate, authorizeRoles(ROLES), ctrl.getGroupMembers);
router.post('/groups/:groupId/members',                     authenticate, authorizeRoles(ROLES), ctrl.addGroupMember);
router.delete('/groups/:groupId/members/:userId',           authenticate, authorizeRoles(ROLES), ctrl.removeGroupMember);
router.post('/groups/:groupId/leave',                       authenticate, authorizeRoles(ROLES), ctrl.leaveGroup);
router.patch('/groups/:groupId/members/:userId/ban',        authenticate, authorizeRoles(['CEO']), ctrl.banGroupMember);
router.delete('/groups/:groupId',                           authenticate, authorizeRoles(ROLES), ctrl.deleteGroup);

// ── Reactions ────────────────────────────────────────────────────────────────
router.post('/react/:messageId',                            authenticate, authorizeRoles(ROLES), ctrl.reactToDm);
router.post('/groups/:groupId/messages/:messageId/react',   authenticate, authorizeRoles(ROLES), ctrl.reactToGroupMessage);

module.exports = router;
