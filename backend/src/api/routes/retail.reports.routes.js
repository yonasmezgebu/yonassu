const express = require('express');
const router = express.Router();
const retailReportsController = require('../controllers/retail.reports.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Routes mapping for Retail Store Reports

// CEO Report: CEO (Full) & Store Manager (Read-Only)
router.get('/ceo-report', authenticate, authorizeRoles(['ceo', 'store manager', 'sales manager', 'admin']), retailReportsController.getCEOReport);
router.post('/ceo-report/:id/action', authenticate, authorizeRoles(['ceo', 'admin']), retailReportsController.ceoApproveRetailUpdate);

// Finance Review: Finance (Full) & Store Manager (Read-Only)
router.get('/finance-review', authenticate, authorizeRoles(['finance', 'finance manager', 'store manager', 'sales manager', 'admin']), retailReportsController.getFinanceReview);
router.post('/finance-review/shift/:id/verify', authenticate, authorizeRoles(['finance', 'finance manager', 'admin']), retailReportsController.financeVerifyShift);
router.post('/finance-review/pos-cart/:id/verify', authenticate, authorizeRoles(['finance', 'finance manager', 'admin']), retailReportsController.financeVerifyPOSCart);

// Daily Summary: Store Manager (Full), CEO (Summary), Finance (Summary)
router.get('/daily-summary', authenticate, authorizeRoles(['store manager', 'sales manager', 'ceo', 'finance', 'finance manager', 'admin']), retailReportsController.getDailySummary);

module.exports = router;
