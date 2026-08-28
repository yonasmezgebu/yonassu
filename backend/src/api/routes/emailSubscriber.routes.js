const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailSubscriber.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

router.post('/subscribe', ctrl.subscribe);
router.get('/admin', authenticate, authorizeRoles(['Admin', 'CEO']), ctrl.listSubscribers);
router.get('/admin/export', authenticate, authorizeRoles(['Admin', 'CEO']), ctrl.exportCsv);
router.put('/admin/:id/status', authenticate, authorizeRoles(['Admin', 'CEO']), ctrl.toggleStatus);
router.delete('/admin/:id', authenticate, authorizeRoles(['Admin', 'CEO']), ctrl.deleteSubscriber);

module.exports = router;
