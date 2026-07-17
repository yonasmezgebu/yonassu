const express = require('express');
const router = express.Router();
const publicTenderController = require('../controllers/publicTender.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// ─── Public endpoints (no auth required) ───────────────────────────────────
router.get('/public', publicTenderController.getPublicTenders);
router.get('/public/:id', publicTenderController.getTenderDetails);
router.post('/public/:id/bid', publicTenderController.submitBid);

// ─── Internal endpoints (require auth) ─────────────────────────────────────
router.use(authenticate);

// Customer: get own bids
router.get('/customer/bids', publicTenderController.getCustomerBids);

// Customer: update own pending bid
router.put('/customer/bids/:bidId', publicTenderController.updateMyPublicBid);

// Purchase / Admin: create, read, manage tenders
router.post('/internal', authorizeRoles(['Purchase', 'Admin']), publicTenderController.createTender);
router.get('/internal', authorizeRoles(['Purchase', 'CEO', 'Admin']), publicTenderController.getAllInternalTenders);
router.get('/internal/recent-bids', authorizeRoles(['Purchase', 'CEO', 'Admin']), publicTenderController.getRecentBids);
router.get('/internal/:id/bids', authorizeRoles(['Purchase', 'CEO', 'Admin']), publicTenderController.getBidsForTender);

// Purchase: close tender
router.put('/internal/:id/close', authorizeRoles(['Purchase', 'Admin']), publicTenderController.closeTender);

// Purchase: recommend a specific supplier bid
router.put('/internal/bids/:bidId/recommend', authorizeRoles(['Purchase', 'Admin']), publicTenderController.recommendSupplier);

// Purchase: submit evaluation to CEO
router.put('/internal/:id/submit-evaluation', authorizeRoles(['Purchase', 'Admin']), publicTenderController.submitEvaluationToCEO);

// CEO: approve final evaluation
router.put('/internal/:id/approve', authorizeRoles(['CEO', 'Admin']), publicTenderController.approveTender);

module.exports = router;
