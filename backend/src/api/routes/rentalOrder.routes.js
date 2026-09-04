const express = require('express');
const router = express.Router();
const rentalOrderController = require('../controllers/rentalOrder.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads } = require('../middleware/upload.middleware');

// Public/Customer routes
router.post('/', authenticate, rentalOrderController.createOrder);
router.get('/my-orders', authenticate, rentalOrderController.getCustomerOrders);
router.delete('/my-orders/:id/hide', authenticate, async (req, res) => {
  const { db } = require('../../config/database');
  const order = await db('rental_orders').where({ id: req.params.id, customer_id: req.user.id }).first();
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!['COMPLETED', 'completed', 'REJECTED', 'rejected', 'CANCELLED', 'cancelled', 'ABANDONED', 'abandoned'].includes(order.status)) return res.status(400).json({ message: 'Only completed, rejected, cancelled or abandoned orders can be removed' });
  await db('rental_orders').where({ id: req.params.id }).update({ is_deleted_by_customer: true });
  res.json({ message: 'Order removed from your dashboard' });
});
router.get('/search', authenticate, authorizeRoles(['Finance', 'Admin', 'CEO']), rentalOrderController.searchOrders);
router.post('/:id/payment-proof', authenticate, uploads.singlePaymentProof.single('proof'), rentalOrderController.uploadPaymentProof);

// Manager manual order creation (walk-in / phone-in)
router.post('/manual', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), uploads.singlePaymentProof.single('paymentProof'), rentalOrderController.createManualOrder);


// Manager routes
router.get('/', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.getAllOrders);

// Archive / History / Delete (Manager) — defined before /:id routes
router.get('/history', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.getArchivedOrders);
router.post('/bulk-archive', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.bulkArchiveOrders);
router.post('/bulk-restore', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.bulkRestoreOrders);
router.delete('/bulk', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.bulkDeleteOrders);
router.post('/:id/archive', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.archiveOrder);
router.post('/:id/restore', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.restoreOrder);
router.delete('/:id', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.deleteOrder);

router.post('/:id/start', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.startRental);
router.get('/:id', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO', 'Finance', 'Finance Manager']), rentalOrderController.getOrderById);
router.put('/:id/status', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.updateOrderStatus);
router.patch('/:id/status', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.updateOrderStatus);

// Finance routes
router.get('/pending-payments', authenticate, authorizeRoles(['Finance', 'Admin', 'CEO']), rentalOrderController.getPendingPayments);
router.post('/:id/verify-payment', authenticate, authorizeRoles(['Finance', 'Admin', 'CEO']), rentalOrderController.verifyPayment);

// Lifecycle Routes
router.post('/:id/cancel', authenticate, rentalOrderController.cancelOrder);
router.post('/:id/cancel/approve', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.approveCancellation);
router.post('/:id/extend', authenticate, rentalOrderController.extendOrder);
router.post('/:id/extend/approve', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.approveExtension);
router.post('/:id/process-return', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.processReturn);
router.post('/:id/no-show', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.markNoShow);
router.patch('/:id/pickup-remarks', authenticate, rentalOrderController.updatePickupRemarks);

module.exports = router;
