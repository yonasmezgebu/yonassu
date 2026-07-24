const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/agrirentOrder.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');

const MANAGER_ROLES = ['Car Renting Manager', 'Admin', 'CEO'];
const FINANCE_ROLES = ['Finance', 'Finance Manager', 'Admin', 'CEO'];

// Public (authenticated customer) — supports screenshot upload
router.post('/', authenticate, uploads.generic.single('paymentScreenshot'), handleUploadError, ctrl.createOrder);
router.get('/my-orders', authenticate, ctrl.getMyOrders);

// Manager
router.post('/manual', authenticate, authorizeRoles(MANAGER_ROLES), uploads.generic.single('paymentScreenshot'), handleUploadError, ctrl.createManualOrder);
router.get('/', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.getAllOrders);
router.get('/:id', authenticate, authorizeRoles([...MANAGER_ROLES, ...FINANCE_ROLES]), ctrl.getOrderById);
router.patch('/:id/status', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.updateOrderStatus);
router.patch('/:id/payment-status', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.updatePaymentStatus);

// Finance
router.get('/pending-payments', authenticate, authorizeRoles(FINANCE_ROLES), ctrl.getPendingPayments);
router.post('/:id/verify-payment', authenticate, authorizeRoles(FINANCE_ROLES), ctrl.verifyPayment);

module.exports = router;
