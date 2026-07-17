const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pharmacySales.controller');
const { authenticate } = require('../middleware/auth.middleware');

// ─── Customer JWT middleware ───────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

function customerAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ success: false, message: 'No token provided' });
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sutana-secret');
    if (decoded.role !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Not a customer token' });
    req.customer = { id: decoded.customerId, phone: decoded.phone };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function staffOrCustomer(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next(); // anonymous allowed for prescription tracking
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sutana-secret');
    if (decoded.role === 'CUSTOMER') req.customer = { id: decoded.customerId };
    else req.user = decoded;
    next();
  } catch { next(); }
}

// ─── PUBLIC: Drug Catalog ──────────────────────────────────────────────────────
router.get('/drugs', ctrl.listDrugs);
router.get('/drugs/:id', ctrl.getDrug);

// ─── PUBLIC: Customer Auth ─────────────────────────────────────────────────────
router.post('/customer/register', ctrl.customerRegister);
router.post('/customer/login', ctrl.customerLogin);

// ─── PUBLIC: Prescription Tracking ────────────────────────────────────────────
router.get('/prescriptions/track/:reference_code', ctrl.trackPrescription);

// ─── Customer-authenticated: Prescription Submit & Orders ─────────────────────
router.post('/prescriptions', staffOrCustomer, ctrl.submitPrescription);
router.post('/customer/orders', customerAuth, ctrl.submitOnlineOrder);

// ─── Staff: Prescription management ──────────────────────────────────────────
router.get('/prescriptions', authenticate, ctrl.listPrescriptions);
router.patch('/prescriptions/:id/status', authenticate, ctrl.updatePrescriptionStatus);

// ─── Branches ─────────────────────────────────────────────────────────────────
router.get('/branches', ctrl.listBranches); // public for customer form
router.post('/branches', authenticate, ctrl.createBranch);
router.patch('/branches/:id/toggle', authenticate, ctrl.toggleBranch);

// ─── Workers ──────────────────────────────────────────────────────────────────
router.get('/workers', authenticate, ctrl.listWorkers);
router.post('/workers', authenticate, ctrl.assignWorker);

// ─── Sales (POS) ──────────────────────────────────────────────────────────────
router.post('/sales', authenticate, ctrl.createSale);
router.get('/sales', authenticate, ctrl.listSales);
router.get('/sales/pending', authenticate, ctrl.listPendingOnlineOrders);
router.get('/sales/:id', authenticate, ctrl.getSale);
router.patch('/sales/:id/process', authenticate, ctrl.processPendingOrder);
router.patch('/sales/:id/void', authenticate, ctrl.voidSale);

// ─── Payments ─────────────────────────────────────────────────────────────────
router.patch('/payments/:id/verify', authenticate, ctrl.verifyPayment);
router.post('/handovers', authenticate, ctrl.recordCashHandover);
router.get('/handovers', authenticate, ctrl.listHandovers);

// ─── Daily Reports ────────────────────────────────────────────────────────────
router.post('/reports/daily', authenticate, ctrl.submitDailyReport);
router.get('/reports/daily', authenticate, ctrl.listDailyReports);
router.patch('/reports/daily/:id/decide', authenticate, ctrl.decideReport);

// ─── Change Requests ──────────────────────────────────────────────────────────
router.post('/change-requests', authenticate, ctrl.createChangeRequest);
router.get('/change-requests', authenticate, ctrl.listChangeRequests);
router.patch('/change-requests/:id/decide', authenticate, ctrl.decideChangeRequest);

// ─── Expired Drug Reports ─────────────────────────────────────────────────────
router.post('/expired-drugs', authenticate, ctrl.reportExpiredDrug);
router.get('/expired-drugs', authenticate, ctrl.listExpiredReports);
router.patch('/expired-drugs/:id/decide', authenticate, ctrl.decideExpiredReport);

// ─── Drug Visibility ──────────────────────────────────────────────────────────
router.post('/drugs/:drug_id/hide', authenticate, ctrl.hideDrug);
router.patch('/drugs/:drug_id/restore', authenticate, ctrl.restoreDrug);
router.get('/hidden-drugs', authenticate, ctrl.listHiddenDrugs);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get('/stats', authenticate, ctrl.salesStats);

module.exports = router;
