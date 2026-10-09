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

// Customer: get / update own bid for a specific tender
router.get('/public/:id/my-bid', publicTenderController.getMyPublicBid);
router.put('/public/:id/bid', publicTenderController.updatePublicBid);

// Customer: get own bids
router.get('/customer/bids', publicTenderController.getCustomerBids);

// Customer: update own pending bid
router.put('/customer/bids/:bidId', publicTenderController.updateMyPublicBid);
router.delete('/customer/bids/:bidId/hide', authenticate, async (req, res) => {
  const { db } = require('../../config/database');
  const bid = await db('public_bids').where({ id: req.params.bidId, customer_id: req.user.id }).first();
  if (!bid) return res.status(404).json({ message: 'Bid not found' });
  const completedStatuses = ['awarded', 'rejected', 'disqualified', 'closed', 'expired', 'accepted', 'approved'];
  if (!completedStatuses.includes((bid.bid_status || '').toLowerCase())) return res.status(400).json({ message: 'Only closed/completed bids can be removed' });
  await db('public_bids').where({ id: req.params.bidId }).update({ is_deleted_by_customer: true });
  res.json({ message: 'Bid removed from your dashboard' });
});

// Customer: cancel own bid (cancellable while pending/awarded/recommended)
router.put('/customer/bids/:bidId/cancel', publicTenderController.cancelBid);

// Purchase / Admin: create, read, manage tenders
router.post('/internal', authorizeRoles(['Purchase', 'Admin']), publicTenderController.createTender);
router.get('/internal', authorizeRoles(['Purchase', 'CEO', 'Admin']), publicTenderController.getAllInternalTenders);
router.get('/internal/recent-bids', authorizeRoles(['Purchase', 'CEO', 'Admin']), publicTenderController.getRecentBids);
router.get('/internal/:id/bids', authorizeRoles(['Purchase', 'CEO', 'Admin']), publicTenderController.getBidsForTender);

// Purchase: edit a published/draft tender (title, description, terms etc.)
router.put('/internal/:id', authorizeRoles(['Purchase', 'Admin']), publicTenderController.updateTender);

// Purchase: close tender
router.put('/internal/:id/close', authorizeRoles(['Purchase', 'Admin']), publicTenderController.closeTender);

// Purchase: recommend a specific supplier bid
router.put('/internal/bids/:bidId/recommend', authorizeRoles(['Purchase', 'Admin']), publicTenderController.recommendSupplier);

// Purchase: submit evaluation to CEO
router.put('/internal/:id/submit-evaluation', authorizeRoles(['Purchase', 'Admin']), publicTenderController.submitEvaluationToCEO);

// CEO: approve final evaluation
router.put('/internal/:id/approve', authorizeRoles(['CEO', 'Admin']), publicTenderController.approveTender);

// Finance/Purchase: update bid payment_status (confirm/reject)
router.put('/internal/bids/:bidId/payment-status', authorizeRoles(['Purchase', 'Admin']), publicTenderController.updateBidPaymentStatus);

module.exports = router;
