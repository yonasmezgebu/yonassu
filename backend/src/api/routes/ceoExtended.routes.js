const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/ceoExtended.controller');

// Strategy Execution (OKR)
router.get('/okrs', authenticate, authorize(['ceo:dashboard']), ctrl.getOKRs);
router.put('/okrs/:id', authenticate, authorize(['ceo:dashboard']),
  param('id').isInt(), validate, ctrl.updateOKR);
router.get('/initiatives', authenticate, authorize(['ceo:dashboard']), ctrl.getInitiativePortfolio);

// Customer Executive View
router.get('/customers/top', authenticate, authorize(['ceo:dashboard']), ctrl.getTopAccounts);
router.get('/customers/:accountId/health', authenticate, authorize(['ceo:dashboard']),
  param('accountId').isInt(), validate, ctrl.getAccountHealth);
router.get('/customers/churn-risk', authenticate, authorize(['ceo:dashboard']), ctrl.getChurnPrediction);

// Supply Chain
router.get('/supply-chain/suppliers', authenticate, authorize(['ceo:dashboard']), ctrl.getSupplierHealth);
router.get('/supply-chain/disruptions', authenticate, authorize(['ceo:dashboard']), ctrl.getDisruptionHeatmap);
router.get('/supply-chain/inventory-risk', authenticate, authorize(['ceo:dashboard']), ctrl.getInventoryRisk);

// Corporate IT
router.get('/it/portfolio', authenticate, authorize(['ceo:dashboard']), ctrl.getITPortfolio);
router.get('/it/spend', authenticate, authorize(['ceo:dashboard']), ctrl.getITSpend);
router.get('/it/cybersecurity', authenticate, authorize(['ceo:dashboard']), ctrl.getCybersecurityDashboard);

// Legal & IP
router.get('/legal/litigation', authenticate, authorize(['ceo:dashboard']), ctrl.getLitigationSummary);
router.get('/legal/patents', authenticate, authorize(['ceo:dashboard']), ctrl.getPatentPortfolio);
router.get('/legal/regulatory', authenticate, authorize(['ceo:dashboard']), ctrl.getRegulatoryChanges);

// Facilities & Real Estate
router.get('/facilities/properties', authenticate, authorize(['ceo:dashboard']), ctrl.getPropertyPortfolio);
router.get('/facilities/leases', authenticate, authorize(['ceo:dashboard']), ctrl.getLeaseCalendar);
router.get('/facilities/capex', authenticate, authorize(['ceo:dashboard']), ctrl.getFacilitiesCAPEX);

// Override Privileges
router.get('/overrides', authenticate, authorize(['ceo:dashboard']), ctrl.getOverrideLog);
router.post('/overrides', authenticate, authorize(['ceo:dashboard']), ctrl.executeOverride);
router.get('/audit', authenticate, authorize(['ceo:dashboard']), ctrl.getAuditLog);

// Delegation
router.get('/delegations', authenticate, authorize(['ceo:dashboard']), ctrl.getDelegations);
router.post('/delegations', authenticate, authorize(['ceo:dashboard']), ctrl.createDelegation);
router.delete('/delegations/:id', authenticate, authorize(['ceo:dashboard']),
  param('id').isInt(), validate, ctrl.revokeDelegation);
router.get('/delegations/deputy', authenticate, authorize(['ceo:dashboard']), ctrl.getDeputyConfig);
router.put('/delegations/deputy', authenticate, authorize(['ceo:dashboard']), ctrl.setDeputy);

// Personalization
router.get('/views', authenticate, authorize(['ceo:dashboard']), ctrl.getSavedViews);
router.post('/views', authenticate, authorize(['ceo:dashboard']), ctrl.saveView);
router.delete('/views/:id', authenticate, authorize(['ceo:dashboard']),
  param('id').isInt(), validate, ctrl.deleteView);
router.get('/widgets', authenticate, authorize(['ceo:dashboard']), ctrl.getWidgetLibrary);
router.put('/dashboard/layout', authenticate, authorize(['ceo:dashboard']), ctrl.updateDashboardLayout);

module.exports = router;
