const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles, optionalAuthenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/vatConfig.controller');

// Only the CEO Dashboard is the authorized interface for changing VAT
// configuration. Mutations require the CEO, Finance Manager or Admin role.
const GOVERNANCE_ROLES = ['CEO', 'Finance Manager', 'Accountant', 'Admin'];

// Reads are public so that visitor-facing pages (services, marketplace) can
// show VAT-inclusive prices without forcing login.
router.get('/',                  optionalAuthenticate, ctrl.getAll);
router.get('/history',           optionalAuthenticate, ctrl.getHistory);

// Product / Service Tax Mapping
router.get('/mappings/list',     optionalAuthenticate, ctrl.getMappings);
router.get('/mappings/products', optionalAuthenticate, ctrl.getMappingProducts);
router.get('/mappings/catalog',  optionalAuthenticate, ctrl.getCatalog);
router.get('/mappings/history',  optionalAuthenticate, ctrl.getMappingHistory);
router.post('/mappings',         authenticate, authorizeRoles(GOVERNANCE_ROLES), ctrl.upsertMapping);
router.delete('/mappings/:id',   authenticate, authorizeRoles(GOVERNANCE_ROLES), ctrl.removeMapping);

router.get('/:id',               optionalAuthenticate, ctrl.getById);

// Governance mutations — CEO / Finance only
router.post('/',                 authenticate, authorizeRoles(GOVERNANCE_ROLES), ctrl.createConfig);
router.put('/:id',               authenticate, authorizeRoles(GOVERNANCE_ROLES), ctrl.updateConfig);
router.post('/:id/approve',      authenticate, authorizeRoles(GOVERNANCE_ROLES), ctrl.approveConfig);
router.post('/:id/reject',       authenticate, authorizeRoles(GOVERNANCE_ROLES), ctrl.rejectConfig);
router.patch('/:id/toggle',      authenticate, authorizeRoles(GOVERNANCE_ROLES), ctrl.toggleActive);

module.exports = router;
