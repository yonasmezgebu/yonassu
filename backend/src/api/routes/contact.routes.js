const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const contactController = require('../controllers/contact.controller');
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({ windowMs: 3600000, max: 5, message: { status: 'fail', message: 'Too many submissions. Try again later.' } });

const { upload, handleUploadError } = require('../../services/storage.service');

// Public
router.post('/', contactLimiter, upload.contact.single('attachment'), contactController.submit);

// Internal (Admin + department heads)
router.use(authenticate);
router.get('/', contactController.list);
router.get('/export/csv', authorizeRoles(['Admin']), contactController.exportCsv);
router.get('/:id', contactController.get);
router.put('/:id/reply', contactController.reply);
router.put('/:id/close', contactController.close);
router.put('/:id/status', contactController.updateStatus);
router.put('/:id/assign', authorizeRoles(['Admin']), contactController.assign);
router.post('/bulk', authorizeRoles(['Admin']), contactController.bulkAction);
router.delete('/:id', authorizeRoles(['Admin']), contactController.deleteMessage);

module.exports = router;
