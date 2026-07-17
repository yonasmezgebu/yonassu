const express = require('express');
const router = express.Router();
const pharmacyInventoryController = require('../controllers/pharmacyInventory.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Require a valid JWT and any of these roles
router.use(authenticate);
router.use(authorizeRoles(['Admin', 'CEO', 'Pharmacy Manager', 'Pharmacy Worker', 'Finance Manager', 'Finance Cashier']));

router.get('/current', pharmacyInventoryController.getCurrentStock);
router.get('/low-stock', pharmacyInventoryController.getLowStock);

module.exports = router;
