const express = require('express');
const router = express.Router();
const selfSupplierController = require('../controllers/selfSupplier.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Any logged-in user can register or view their own profile
router.post('/', authenticate, selfSupplierController.registerSupplier);
router.get('/me', authenticate, selfSupplierController.getMySupplierProfile);

// Purchase managers and admins can view all registered suppliers
const managerRoles = ['Admin', 'CEO', 'Purchase Manager', 'Purchase', 'Procurement Manager', 'Finance'];
router.get('/', authenticate, authorizeRoles(managerRoles), selfSupplierController.getAllSuppliers);

// Stage 2 verification — staff fills in tax/bank/terms/credit details → status = Verified
router.put('/:id/verify', authenticate, authorizeRoles(managerRoles), selfSupplierController.verifySupplier);

// Quick status update
router.patch('/:id/status', authenticate, authorizeRoles(managerRoles), selfSupplierController.updateSupplierStatus);

module.exports = router;
