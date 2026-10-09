const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacy.controller');
const requestsController = require('../controllers/pharmacy.requests.controller');
const transferController = require('../controllers/pharmacy.transfer.controller');
const postsController = require('../controllers/pharmacy.posts.controller');
const healthController = require('../controllers/pharmacy.health.controller');
const dispenseController = require('../controllers/pharmacy.dispense.controller');
const { authenticate, authorizeRoles, optionalAuthenticate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { uploads, handleUploadError } = require('../middleware/upload.middleware');

// Optional authentication for public endpoints (to track requests if needed, but allow public access)
router.get('/categories', optionalAuthenticate, pharmacyController.getCategories);
router.get('/categories/:id', optionalAuthenticate, pharmacyController.getCategoryById);
router.get('/products', optionalAuthenticate, pharmacyController.getProducts);
router.get('/products/search', optionalAuthenticate, pharmacyController.searchProducts);
router.get('/products/category/:id', optionalAuthenticate, pharmacyController.getProductsByCategory);
// /products/all must be before /products/:id
router.get('/products/all', authenticate, authorizeRoles(['Pharmacy Manager', 'Admin', 'CEO', 'Pharmacy Worker']), pharmacyController.getAllProducts);
router.delete('/products/all', authenticate, authorizeRoles(['Pharmacy Manager', 'Admin', 'CEO']), pharmacyController.deleteAllProducts);
router.get('/products/:id', optionalAuthenticate, pharmacyController.getProductById);
router.get('/branches', optionalAuthenticate, pharmacyController.getBranches);
router.get('/store-inventory', authenticate, authorizeRoles(['Pharmacy Manager', 'Admin', 'CEO', 'Finance Manager']), pharmacyController.getStoreInventory);
router.get('/dashboard', optionalAuthenticate, pharmacyController.getDashboardStats);

// Public product posts (published only)
router.get('/product-posts/public', postsController.publicList);

// Protected endpoints (Pharmacist, Admin, CEO)
router.use(authenticate);

// Customer: Submit & manage own requests
router.post('/requests', uploads.generic.fields([{ name: 'prescription_image', maxCount: 1 }, { name: 'paymentScreenshot', maxCount: 1 }]), handleUploadError, requestsController.createRequest);
router.post('/requests/:id/upload', uploads.generic.single('prescription_image'), handleUploadError, requestsController.uploadPrescriptionImage);
router.get('/requests/my-requests', requestsController.getMyRequests);
router.delete('/requests/:id/cancel', requestsController.cancelRequest);
router.delete('/requests/:id/hide', async (req, res) => {
  try {
    const { db } = require('../../config/database');
    const order = await db('prescription_requests').where({ id: req.params.id }).first();
    
    if (!order) return res.status(404).json({ message: 'Request not found' });
    
    // Check if order belongs to current user
    if (order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to hide this order' });
    }
    
    if (!['delivered', 'picked_up', 'completed', 'ready_for_pickup'].includes((order.status || '').toLowerCase())) {
      return res.status(400).json({ message: 'Only completed orders can be removed' });
    }
    
    await db('prescription_requests').where({ id: req.params.id }).update({ is_deleted_by_customer: true });
    res.json({ message: 'Order removed from your dashboard' });
  } catch (error) {
    console.error('Error hiding prescription request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POS Checkout (Pharmacy Manager)
router.post('/pos/checkout', pharmacyController.posCheckout);

// ── Product Posts (visible to all authenticated pharmacy users) ──
router.get('/product-posts', postsController.list);
router.get('/product-posts/:id', postsController.getById);
router.post('/product-posts', uploads.pharmacyProductPostImage.single('image'), handleUploadError, postsController.create);
router.put('/product-posts/:id', uploads.pharmacyProductPostImage.single('image'), handleUploadError, postsController.update);
router.delete('/product-posts/:id', postsController.remove);

// ── Pharmacy & Health Content Posts ──
router.get('/health-posts', healthController.list);
router.get('/health-posts/scrape', healthController.scrape);
router.get('/health-posts/:id', healthController.getById);
router.post('/health-posts', uploads.pharmacyHealthUpload.fields([{ name: 'drug_image', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }]), handleUploadError, healthController.create);
router.put('/health-posts/:id', uploads.pharmacyHealthUpload.fields([{ name: 'drug_image', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }]), handleUploadError, healthController.update);
router.delete('/health-posts/:id', healthController.remove);
router.patch('/health-posts/:id/publish', healthController.publish);

// Dispense / Issue Medicines
router.post('/dispense', dispenseController.createDispense);
router.get('/dispenses', dispenseController.listDispenses);

// Pharmacy Manager & Worker endpoints
router.use(authorizeRoles(['Pharmacy Manager', 'Admin', 'CEO', 'Pharmacy Worker']));

  // Worker Settings
  router.get('/admin/worker-can-add-products', pharmacyController.getWorkerAddProductSetting);
  router.patch('/admin/worker-can-add-products', pharmacyController.updateWorkerAddProductSetting);
  router.get('/admin/worker-can-adjust-stock', pharmacyController.getWorkerAdjustStockSetting);
  router.patch('/admin/worker-can-adjust-stock', pharmacyController.updateWorkerAdjustStockSetting);
  router.get('/admin/worker-can-manage-health-posts', pharmacyController.getWorkerHealthPostSetting);
  router.patch('/admin/worker-can-manage-health-posts', pharmacyController.updateWorkerHealthPostSetting);
  router.get('/admin/worker-can-hide-drugs', pharmacyController.getWorkerHideDrugSetting);
  router.patch('/admin/worker-can-hide-drugs', pharmacyController.updateWorkerHideDrugSetting);

  // Products
router.post(
  '/products', 
  uploads.generic.fields([
    { name: 'drug_image', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
  ]),
  handleUploadError,
  pharmacyController.createProduct
);
router.put(
  '/products/:id', 
  uploads.generic.fields([
    { name: 'drug_image', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
  ]),
  handleUploadError,
  pharmacyController.updateProduct
);
router.delete('/products/:id', pharmacyController.deleteProduct);
router.post('/products/:id/stock', pharmacyController.updateStock);
router.post('/products/:id/hide', pharmacyController.hideProduct);
router.patch('/products/:id/restore', pharmacyController.restoreProduct);
router.get('/stock-movements', pharmacyController.getStockMovements);

// Categories
router.post('/categories', uploads.pharmacyCategoryImage.single('cover_image'), handleUploadError, pharmacyController.createCategory);
router.put('/categories/:id', uploads.pharmacyCategoryImage.single('cover_image'), handleUploadError, pharmacyController.updateCategory);
router.delete('/categories/:id', pharmacyController.deleteCategory);

// Prescription Request Management (Pharmacy Manager)
router.get('/requests', requestsController.getAllRequests);
router.get('/requests/pending', requestsController.getPendingRequests);
router.post('/requests/:id/approve', requestsController.approveRequest);
router.post('/requests/:id/reject', requestsController.rejectRequest);
router.delete('/requests/:id', requestsController.deleteRequestByPharmacy);
router.put('/requests/:id/ready', requestsController.markReady);
router.put('/requests/:id/complete', requestsController.markComplete);

// Branches
router.post('/branches', uploads.pharmacyBranchImage.single('cover_image'), handleUploadError, pharmacyController.createBranch);
router.put('/branches/:id', uploads.pharmacyBranchImage.single('cover_image'), handleUploadError, pharmacyController.updateBranch);
router.delete('/branches/:id', pharmacyController.deleteBranch);

// ── Store Transfer Requests (Pharmacy → Store) ──
const transferCreateValidation = [
  body('drugId').isInt().withMessage('Drug ID is required'),
  body('quantityRequested').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('urgency').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  body('notes').optional().isString()
];

router.get('/transfers', transferController.list);
router.get('/transfers/pending-approvals', authenticate, transferController.listPendingApprovals);
router.get('/transfers/:id', transferController.getById);
router.post('/transfers', transferCreateValidation, validate, transferController.create);
router.patch('/transfers/:id/approve', body('reason').optional(), validate, transferController.approve);
router.patch('/transfers/:id/reject', body('reason').notEmpty().withMessage('Rejection reason is required'), validate, transferController.reject);

// Store Manager / CEO can ship
router.patch('/transfers/:id/ship', [
  body('quantityShipped').optional().isInt({ min: 1 }),
  body('shipmentNumber').optional().isString()
], validate, transferController.ship);

router.patch('/transfers/:id/receive', transferController.receive);

// Branch-to-branch transfer
router.post('/transfers/branch-to-branch', authenticate, transferController.branchToBranch);
router.patch('/transfers/:id/ceo-approve', authenticate, transferController.ceoApproveTransfer);
router.patch('/transfers/:id/ceo-reject', authenticate, body('reason').optional(), validate, transferController.ceoRejectTransfer);
router.get('/branch-inventory/:branch_id', transferController.getBranchInventory);
router.get('/branch-inventory/:branch_id/available', transferController.getAvailableDrugs);
router.get('/drugs/all', transferController.getAllDrugs);
router.get('/stock/summary', transferController.getStockSummary);
router.get('/branch-transfers', transferController.listBranchTransfers);

// Branch drug assignment
router.post('/branch-drugs/assign', transferController.assignDrugToBranch);
router.put('/branch-drugs/set-quantity', transferController.setBranchDrugQuantity);
router.post('/branch-drugs/bulk-assign', transferController.bulkAssignDrugs);
router.put('/branch-drugs/:id', transferController.updateBranchDrug);
router.delete('/branch-drugs/:id', transferController.removeBranchDrug);

// ── Pharmacy Tasks ──
router.get('/tasks', authenticate, pharmacyController.getPharmacyTasks);
router.post('/tasks', authenticate, pharmacyController.createPharmacyTask);
router.patch('/tasks/:id/status', authenticate, pharmacyController.updatePharmacyTaskStatus);

// ── Assigned Pharmacy Workers (for Sales Form branch-auto-fill) ──
router.get('/workers', authenticate, async (req, res) => {
  const { db } = require('../../config/database');
  try {
    const pwRole = await db('roles').where('name', 'Pharmacy Worker').first();
    if (!pwRole) return res.json({ status: 'success', data: [] });

    const workers = await db('user_roles as ur')
      .join('users as u', 'ur.user_id', 'u.id')
      .leftJoin('branches as b', 'ur.branch_id', 'b.id')
      .where('ur.role_id', pwRole.id)
      .whereNull('u.deleted_at')
      .select(
        'u.id', 'u.full_name', 'u.email', 'u.phone', 'u.profile_photo',
        'ur.sub_role', 'ur.branch_id', 'b.name as branch_name'
      )
      .orderBy('u.full_name', 'asc');

    res.json({ status: 'success', data: workers });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
