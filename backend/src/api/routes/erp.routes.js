const express = require('express');
const router = express.Router();
const erpController = require('../controllers/erp.transfer.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

// ── Model 20: Requisitions ──
router.get('/requisitions', erpController.listRequisitions);
router.get('/requisitions/:id', erpController.getRequisition);
router.post('/requisitions', (req, res, next) => {
  const { items, drugId, quantityRequested } = req.body;
  if (items && Array.isArray(items) && items.length > 0) {
    // Multi-item format: validate each item
    req.body = { ...req.body };
    const chain = [];
    items.forEach((item, i) => {
      chain.push(body(`items.${i}.drugId`).isInt().withMessage(`Item ${i}: Drug ID is required`));
      chain.push(body(`items.${i}.quantityRequested`).isInt({ min: 1 }).withMessage(`Item ${i}: Quantity must be at least 1`));
    });
    return Promise.all(chain.map(v => v.run(req))).then(() => next());
  }
  // Single-item fallback
  req.body = { ...req.body };
  return Promise.all([
    body('drugId').isInt().withMessage('Drug ID is required').run(req),
    body('quantityRequested').isInt({ min: 1 }).withMessage('Quantity must be at least 1').run(req)]).then(() => next());
}, validate, erpController.createRequisition);

// ── Model 21: Approvals ──
router.get('/approvals', erpController.listApprovals);
router.get('/approvals/:id', erpController.getApproval);
router.post('/approvals/:id', [
  body('quantityApproved').optional().isInt({ min: 1 }),
  body('rejectionReason').optional().isString()], validate, erpController.approveRequisition);

// ── Model 22: Issue Vouchers ──
router.get('/issue-vouchers', erpController.listIssueVouchers);
router.get('/issue-vouchers/:id', erpController.getIssueVoucher);
router.post('/issue-vouchers/create/:approvalId', erpController.createIssueVoucher);
router.patch('/issue-vouchers/:id/issue', [
  body('quantityIssued').isInt({ min: 1 }).withMessage('Issue quantity is required'),
  body('batchNumber').optional().isString(),
  body('expiryDate').optional().isString()], validate, erpController.issueItems);

// ── Model 19: Goods Receiving Notes ──
router.get('/grn', erpController.listGRNs);
router.get('/grn/:id', erpController.getGRN);
router.patch('/grn/:id/receive', [
  body('quantityReceived').optional().isInt({ min: 0 }),
  body('condition').optional().isIn(['Good', 'Damaged']),
  body('discrepancyNote').optional().isString()], validate, erpController.confirmReceipt);

// ── CEO Pending Items ──
router.get('/ceo-pending', erpController.getCEOPending);
router.post('/ceo-mark-read', erpController.markCEORead);

// ── Purchase Manager Pending Items ──
router.get('/purchase-pending-tenders', erpController.getPurchasePendingTenders);
router.post('/purchase-mark-read', erpController.markPurchaseRead);

// ── Pending Shipments (for Store Dashboard) ──
router.get('/pending-shipments', erpController.getPendingShipments);

module.exports = router;
