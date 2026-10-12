const express = require('express');
const router = express.Router();
const rentalOrderController = require('../controllers/rentalOrder.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads } = require('../middleware/upload.middleware');

// Public/Customer routes
router.post('/', authenticate, rentalOrderController.createOrder);
router.get('/my-orders', authenticate, rentalOrderController.getCustomerOrders);
router.patch('/my-orders/:id', authenticate, rentalOrderController.updateCustomerOrder);
router.put('/my-orders/:id', authenticate, rentalOrderController.updateCustomerOrder);
const handleCustomerHideOrder = async (req, res) => {
  try {
    const { db } = require('../../config/database');
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID' });
    }

    // Find the order by ID only first (no ownership filter to avoid type mismatch)
    const order = await db('rental_orders').where('id', orderId).first();

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Verify ownership using loose comparison (handles int/string JWT mismatch)
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const isOwner =
      (order.customer_id != null && String(order.customer_id) === String(userId)) ||
      (order.customer_email && order.customer_email.toLowerCase() === userEmail);

    if (!isOwner) {
      return res.status(403).json({ status: 'error', message: 'You are not authorized to remove this order' });
    }

    const terminalStatuses = ['COMPLETED', 'completed', 'REJECTED', 'rejected', 'CANCELLED', 'cancelled', 'ABANDONED', 'abandoned'];
    if (!terminalStatuses.includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Only completed, rejected, cancelled or abandoned orders can be removed from dashboard'
      });
    }

    await db('rental_orders')
      .where('id', orderId)
      .update({ is_deleted_by_customer: true, updated_at: db.fn.now() });

    res.status(200).json({ status: 'success', message: 'Order removed from your dashboard' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to remove order', error: err.message });
  }
};

router.delete('/my-orders/:id/hide', authenticate, handleCustomerHideOrder);
router.delete('/my-orders/:id', authenticate, handleCustomerHideOrder);
router.get('/search', authenticate, authorizeRoles(['Admin', 'CEO']), rentalOrderController.searchOrders);
router.post('/:id/payment-proof', authenticate, uploads.singlePaymentProof.single('proof'), rentalOrderController.uploadPaymentProof);

// Manager manual order creation (walk-in / phone-in)
router.post('/manual', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), uploads.singlePaymentProof.single('paymentProof'), rentalOrderController.createManualOrder);


// Manager routes
router.get('/', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.getAllOrders);

// Schedule-later (waitlist holds awaiting dates) — defined before /:id routes
router.get('/schedule-later', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.getScheduleLaterOrders);
router.patch('/:id/dates', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.setOrderDates);

// Archive / History / Delete (Manager) — defined before /:id routes
router.get('/history', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.getArchivedOrders);
router.post('/bulk-archive', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.bulkArchiveOrders);
router.post('/bulk-restore', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.bulkRestoreOrders);
router.delete('/bulk', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.bulkDeleteOrders);
router.post('/:id/archive', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.archiveOrder);
router.post('/:id/restore', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.restoreOrder);
router.delete('/:id', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.deleteOrder);

router.post('/:id/start', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.startRental);
router.get('/:id', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO', 'Finance Manager']), rentalOrderController.getOrderById);
router.put('/:id/status', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.updateOrderStatus);
router.patch('/:id/status', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.updateOrderStatus);

// Finance routes
router.get('/pending-payments', authenticate, authorizeRoles(['Admin', 'CEO']), rentalOrderController.getPendingPayments);
router.post('/:id/verify-payment', authenticate, authorizeRoles(['Admin', 'CEO']), rentalOrderController.verifyPayment);

// Lifecycle Routes
router.post('/:id/cancel', authenticate, rentalOrderController.cancelOrder);
router.post('/:id/cancel/approve', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.approveCancellation);
router.post('/:id/extend', authenticate, rentalOrderController.extendOrder);
router.post('/:id/extend/approve', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.approveExtension);
router.post('/:id/process-return', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.processReturn);
router.post('/:id/no-show', authenticate, authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO']), rentalOrderController.markNoShow);
router.patch('/:id/pickup-remarks', authenticate, rentalOrderController.updatePickupRemarks);

module.exports = router;
