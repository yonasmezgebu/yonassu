const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/purchaseFlow.controller');

// ── Purchase Requests ─────────────────────────────────────────────────────
router.post('/purchase-requests', authenticate, ctrl.createRequest);
router.get('/purchase-requests', authenticate, ctrl.getRequests);
router.patch('/purchase-requests/:id/decision', authenticate, ctrl.decideRequest);

// ── Market Tasks ──────────────────────────────────────────────────────────
router.get('/market-tasks', authenticate, ctrl.getMarketTasks);
router.patch('/market-tasks/:id/complete', authenticate, ctrl.completeMarketTask);

// ── Tenders ───────────────────────────────────────────────────────────────
router.post('/tenders', authenticate, ctrl.createTender);
router.get('/tenders', authenticate, ctrl.getTenders);
router.post('/tenders/:id/bids', authenticate, ctrl.submitBid);
router.get('/tenders/:id/bids', authenticate, ctrl.getTenderBids);
router.patch('/tenders/:id/award', authenticate, ctrl.awardTender);
router.patch('/tenders/:id/cancel', authenticate, ctrl.cancelTender);

// ── Fund Requests ─────────────────────────────────────────────────────────
router.post('/fund-requests', authenticate, ctrl.createFundRequest);
router.get('/fund-requests', authenticate, ctrl.getFundRequests);
router.patch('/fund-requests/:id/decision', authenticate, ctrl.decideFundRequest);
router.patch('/fund-requests/:id/ready-for-payment', authenticate, ctrl.markReadyForPayment);

// ── Deliveries ────────────────────────────────────────────────────────────
router.get('/deliveries', authenticate, ctrl.getDeliveries);
router.patch('/deliveries/:id/receive', authenticate, ctrl.receiveDelivery);

// ── Payments ──────────────────────────────────────────────────────────────
router.post('/payments', authenticate, ctrl.createPayment);
router.get('/payments', authenticate, ctrl.getPayments);

module.exports = router;
