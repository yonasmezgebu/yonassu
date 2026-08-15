const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/vatConfig.controller');

// Only the CEO Dashboard is the authorized interface for changing VAT
// configuration. Mutations require the CEO, Finance Manager or Admin role.
const GOVERNANCE_ROLES = ['CEO', 'Finance Manager', 'Accountant', 'Admin'];

router.use(authenticate);

// Reads — any authenticated user may view the central configuration
router.get('/',                  ctrl.getAll);
router.get('/history',           ctrl.getHistory);

// Product / Service Tax Mapping
router.get('/mappings/list',     ctrl.getMappings);
router.get('/mappings/products', ctrl.getMappingProducts);
router.get('/mappings/history',  ctrl.getMappingHistory);
router.post('/mappings',         authorizeRoles(GOVERNANCE_ROLES), ctrl.upsertMapping);
router.delete('/mappings/:id',   authorizeRoles(GOVERNANCE_ROLES), ctrl.removeMapping);

router.get('/:id',               ctrl.getById);

// Governance mutations — CEO / Finance only
router.post('/',                 authorizeRoles(GOVERNANCE_ROLES), ctrl.createConfig);
router.put('/:id',               authorizeRoles(GOVERNANCE_ROLES), ctrl.updateConfig);
router.post('/:id/approve',      authorizeRoles(GOVERNANCE_ROLES), ctrl.approveConfig);
router.post('/:id/reject',       authorizeRoles(GOVERNANCE_ROLES), ctrl.rejectConfig);
router.patch('/:id/toggle',      authorizeRoles(GOVERNANCE_ROLES), ctrl.toggleActive);

module.exports = router;
