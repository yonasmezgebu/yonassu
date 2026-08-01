const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pharmacy.reports.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// ── CEO Report ───────────────────────────────────────────
// Pharmacy Manager: read-only | CEO: full (decide) | Finance: no access
router.get(
  '/ceo',
  authorizeRoles(['CEO', 'Pharmacy Manager', 'Admin']),
  ctrl.getCEOReport
);

// CEO actions
router.post(
  '/ceo/delivery/:id/decide',
  authorizeRoles(['CEO', 'Admin']),
  ctrl.ceoDecideDelivery
);

router.post(
  '/ceo/manager-request/:id/decide',
  authorizeRoles(['CEO', 'Admin']),
  ctrl.ceoDecideManagerRequest
);

router.post(
  '/ceo/expired-drug/:id/decide',
  authorizeRoles(['CEO', 'Admin']),
  ctrl.ceoDecideExpiredDrug
);

// ── Finance Review ───────────────────────────────────────
// Finance: full | Pharmacy Manager: read-only | CEO: no access
router.get(
  '/finance',
  authorizeRoles(['Finance', 'Finance Manager', 'Pharmacy Manager', 'Admin']),
  ctrl.getFinanceReview
);

// Finance actions
router.patch(
  '/finance/sales-report/:id/decide',
  authorizeRoles(['Finance', 'Finance Manager', 'Admin']),
  ctrl.financeDecideSalesReport
);

router.patch(
  '/finance/delivery/:id/mark-paid',
  authorizeRoles(['Finance', 'Finance Manager', 'Admin']),
  ctrl.financeMarkDeliveryPaid
);

// ── Daily Summary ─────────────────────────────────────────
// Pharmacy Manager: full | CEO: read-only summary | Finance: read-only summary
router.get(
  '/daily-summary',
  authorizeRoles(['Pharmacy Manager', 'CEO', 'Finance', 'Finance Manager', 'Admin']),
  ctrl.getDailySummary
);

module.exports = router;
