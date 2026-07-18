const express = require('express');
const router = express.Router();
const flowController = require('../controllers/publicProcurementFlow.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticate);

// ── Fund Requests ──
router.post('/fund-requests', authorizeRoles(['Purchase', 'Admin']), flowController.createFundRequest);
router.get('/fund-requests', flowController.getFundRequests);
router.put('/fund-requests/:id/approve', authorizeRoles(['CEO', 'Admin']), flowController.approveFundRequest);
router.put('/fund-requests/:id/verify', authorizeRoles(['Finance', 'Finance Manager', 'Admin']), flowController.verifyFundRequest);

// ── Deliveries ──
router.get('/deliveries', flowController.getDeliveries);
router.put('/deliveries/:tenderId/receive', authorizeRoles(['Pharmacy Store Keeper', 'General Store Keeper', 'Store Keeper', 'Pharmacy Manager', 'Admin']), flowController.receiveDelivery);

// ── Payments ──
router.get('/payments', flowController.getPayments);
router.post('/payments', authorizeRoles(['Finance', 'Finance Manager', 'Admin']), flowController.createPayment);

// ── Read Actions for Notifications ──
router.post('/mark-read', flowController.markNotificationRead);

module.exports = router;
