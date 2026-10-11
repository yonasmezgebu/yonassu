const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/agrirentOrder.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');

const MANAGER_ROLES = ['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO'];
const FINANCE_ROLES = ['Finance Manager', 'Admin', 'CEO'];

// Public (authenticated customer) — supports screenshot upload
router.post('/', authenticate, uploads.generic.single('paymentScreenshot'), handleUploadError, ctrl.createOrder);
router.get('/my-orders', authenticate, ctrl.getMyOrders);
router.patch('/my-orders/:id/resubmit', authenticate, uploads.generic.single('paymentScreenshot'), handleUploadError, ctrl.resubmitMyOrder);
router.patch('/my-orders/:id/cancel', authenticate, ctrl.cancelMyOrder);
router.delete('/my-orders/:id', authenticate, async (req, res) => {
  const { db } = require('../../config/database');
  const order = await db('agrirent_orders')
    .where({ id: req.params.id })
    .where(function () {
      this.where('customer_id', req.user.id).orWhere('customer_email', req.user.email || '');
    })
    .first();
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const st = String(order.status || '').toLowerCase();
  if (!['completed', 'cancelled'].includes(st)) return res.status(400).json({ message: 'Only completed or cancelled orders can be removed' });
  await db('agrirent_orders').where({ id: req.params.id }).update({ is_deleted_by_customer: true, updated_at: new Date() });
  res.json({ message: 'Order removed from your dashboard' });
});

// Manager
router.post('/manual', authenticate, authorizeRoles(MANAGER_ROLES), uploads.generic.single('paymentScreenshot'), handleUploadError, ctrl.createManualOrder);
router.get('/', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.getAllOrders);
router.get('/schedule-later', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.getScheduleLaterOrders);
router.patch('/:id/dates', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.setOrderDates);

// Archive / History / Delete (Manager) — defined before /:id routes
router.get('/history', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.getArchivedOrders);
router.post('/bulk-archive', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.bulkArchiveOrders);
router.post('/bulk-restore', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.bulkRestoreOrders);
router.delete('/bulk', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.bulkDeleteOrders);
router.post('/:id/archive', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.archiveOrder);
router.post('/:id/restore', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.restoreOrder);
router.delete('/:id', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.deleteOrder);

router.get('/:id', authenticate, authorizeRoles([...MANAGER_ROLES, ...FINANCE_ROLES]), ctrl.getOrderById);
router.patch('/:id/status', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.updateOrderStatus);
router.patch('/:id/payment-status', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.updatePaymentStatus);

// Finance
router.get('/pending-payments', authenticate, authorizeRoles(FINANCE_ROLES), ctrl.getPendingPayments);
router.post('/:id/verify-payment', authenticate, authorizeRoles(FINANCE_ROLES), ctrl.verifyPayment);

module.exports = router;
