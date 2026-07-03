const express = require('express');
const router = express.Router();
const procController = require('../controllers/procurement.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Health + Seed
router.get('/health', procController.health);
router.post('/seed', procController.seedDemoData);

// All other routes require auth
router.use(authenticate);

// M2: Procurement Requests
router.post('/requests', procController.createProcurementRequest);
router.get('/requests', procController.listProcurementRequests);
router.get('/requests/:id', procController.getProcurementRequest);

// M3: CEO Decision
router.patch('/requests/:id/ceo-decision', procController.ceoDecide);

// M4: Market Tasks
router.get('/market/approved-prs', procController.getApprovedPRsForMarket);
router.get('/market/tasks', procController.listMarketTasks);
router.post('/market/tasks', procController.createMarketTask);
router.patch('/market/tasks/:id/complete', procController.completeMarketTask);

// M5: Tenders
router.post('/tenders', procController.createTender);
router.get('/tenders', procController.listTenders);
router.get('/tenders/:id', procController.getTender);

// M6: Bids
router.post('/bids', procController.submitBid);
router.get('/bids', procController.listBids);

// M7: Tender CEO Decision
router.patch('/tenders/:id/ceo-decision', procController.ceoDecideTender);

// M9: Fund Requests
router.post('/fund-requests', procController.createFundRequest);
router.get('/fund-requests', procController.listFundRequests);

// M10: CEO Fund Approval
router.patch('/fund-requests/:id/ceo-decision', procController.ceoDecideFund);

// M11: Payments
router.post('/payments', procController.createPayment);
router.get('/payments', procController.listPayments);

// M12: Receipts
router.post('/receipts', procController.createReceipt);
router.get('/receipts', procController.listReceipts);

// Tender Close (auto-sort bids)
router.patch('/tenders/:id/close', procController.closeTender);

// Store Shipment Confirmation
router.post('/store/confirm-shipment', procController.storeConfirmShipment);

// Pharmacy Receipt Confirmation
router.post('/pharmacy/confirm-receipt', procController.pharmacyConfirmReceipt);

// Direct Delivery to Pharmacy (Flow 3 Step 14)
router.post('/pharmacy/direct-delivery', procController.directDeliveryToPharmacy);

// CEO Confirm Direct Delivery
router.post('/pharmacy/ceo-confirm-direct', procController.ceoConfirmDirectDelivery);

module.exports = router;
