const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pharmacy.sales.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { uploads, handleUploadError } = require('../../config/multer');

router.use(authenticate);

// Parse JSON fields if request is multipart
const parseMultipartJSON = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    try {
      if (req.body.items) req.body.items = JSON.parse(req.body.items);
      if (req.body.payment) req.body.payment = JSON.parse(req.body.payment);
    } catch (e) {
      // let express-validator catch invalid JSON
    }
  }
  next();
};

// 🛒 Sales (A2/A3) 🛒
const saleValidation = [
  body('branch_id').isInt().withMessage('branch_id is required'),
  body('worker_id').optional({ nullable: true }).isInt().withMessage('worker_id must be an integer'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.drug_name').notEmpty().withMessage('drug_name required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be >= 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('unit_price must be >= 0'),
  body('payment').isObject().withMessage('payment details required'),
  body('payment.method').optional().isIn(['CASH', 'BANK_TRANSFER', 'TELBIR']),
  body('payment.status').optional().isIn(['PAID', 'CASHOUT'])
];
router.post('/sales', uploads.generic.single('paymentScreenshot'), handleUploadError, parseMultipartJSON, saleValidation, validate, ctrl.createSale);
router.post('/sales/submit-daily', ctrl.submitDaily);
router.get('/sales', ctrl.listSales);
router.get('/sales/:id', ctrl.getSale);
router.post('/sales/:id/return', ctrl.processReturn);

// ── Branches (A1) ──
router.patch('/branches/:id/toggle', authorizeRoles(['Pharmacy Manager', 'Admin', 'CEO']), ctrl.toggleBranch);

// ── Workers (B1) ──
router.get('/workers', ctrl.listWorkers);
router.patch('/workers/:id/permission', authorizeRoles(['Pharmacy Manager', 'Admin', 'CEO']), ctrl.toggleWorkerPermission);

// ── Reports (A7/A8/A9/A10) ──
router.post('/reports', authorizeRoles(['Pharmacy Manager', 'Admin']), ctrl.createReport);
router.get('/reports', ctrl.listReports);
router.get('/reports/:id', ctrl.getReport);
router.patch('/reports/:id/finance-decision', authorizeRoles(['Finance Manager', 'Admin', 'CEO']), [
  body('decision').isIn(['APPROVED', 'REJECTED']).withMessage('decision must be APPROVED or REJECTED'),
  body('finance_notes').optional().isString()
], validate, ctrl.financeDecision);

// ── Profit/Loss (A13) ──
router.get('/profit-loss', ctrl.getProfitLoss);

// ── Audit Trail (A14) ──
router.get('/audit-trail', ctrl.listAuditTrail);

// ── Expired Drugs (B4) ──
router.post('/expired-drugs', [
  body('drug_name').notEmpty().withMessage('drug_name required'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity required'),
  body('expiry_date').notEmpty().withMessage('expiry_date required')
], validate, authorizeRoles(['Pharmacy Manager', 'Pharmacist', 'Pharmacy Worker', 'Pharmacy Store Keeper', 'Admin']), ctrl.createExpiredDrug);
router.get('/expired-drugs', ctrl.listExpiredDrugs);
router.patch('/expired-drugs/:id/ceo-decision', authorizeRoles(['CEO', 'Admin']), [
  body('decision').isIn(['APPROVED', 'REJECTED']).withMessage('decision must be APPROVED or REJECTED')
], validate, ctrl.ceoDecideExpiredDrug);

// ── Hide Drug (B5) ──
router.post('/drug-hide', [
  body('drug_name').notEmpty().withMessage('drug_name required'),
  body('reason').notEmpty().withMessage('reason required'),
  body('hide_type').isIn(['TEMPORARY', 'PERMANENT', 'PUBLIC_ONLY']).withMessage('invalid hide_type')
], validate, ctrl.createDrugHide);
router.get('/drug-hide', ctrl.listDrugHide);

// ── Customer Queries (B6) ──
router.post('/queries', [
  body('drug_name').notEmpty().withMessage('drug_name required'),
  body('channel').isIn(['PHONE', 'IN_PERSON', 'ONLINE']).withMessage('invalid channel'),
  body('response_status').isIn(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK']).withMessage('invalid response_status'),
  body('customer_name').notEmpty().withMessage('customer_name required')
], validate, ctrl.createCustomerQuery);
router.get('/queries', ctrl.listCustomerQueries);

// ── Prescriptions (B7/B9) ──
router.post('/prescriptions', uploads.generic.single('prescription_file'), [
  body('customer_name').notEmpty().withMessage('customer_name required'),
  body('drug_name').notEmpty().withMessage('drug_name required'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity required'),
  body('source').notEmpty().withMessage('source required')
], validate, ctrl.createPrescription);
router.get('/prescriptions', ctrl.listPrescriptions);
router.patch('/prescriptions/:id/status', [
  body('status').isIn(['PREPARED', 'PICKED_UP']).withMessage('status must be PREPARED or PICKED_UP')
], validate, ctrl.updatePrescriptionStatus);

// ── Manager Requests (B2) ──
router.post('/manager-requests', authorizeRoles(['Pharmacy Manager', 'Admin']), [
  body('drug_name').notEmpty().withMessage('drug_name required'),
  body('request_type').isIn(['QUANTITY', 'PRICE']).withMessage('request_type must be QUANTITY or PRICE'),
  body('requested_value').isFloat().withMessage('requested_value required')
], validate, ctrl.createManagerRequest);
router.get('/manager-requests', ctrl.listManagerRequests);
router.patch('/manager-requests/:id/ceo-number', authorizeRoles(['CEO', 'Admin']), [
  body('ceo_value').isFloat().withMessage('ceo_value required')
], validate, ctrl.ceoDecideManagerRequest);

// ── Pending Shipments (from Store) ──
router.get('/pending-shipments', ctrl.getPharmacyPendingShipments);

module.exports = router;
