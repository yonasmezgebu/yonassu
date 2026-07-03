const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacy.controller');
const requestsController = require('../controllers/pharmacy.requests.controller');
const transferController = require('../controllers/pharmacy.transfer.controller');
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
router.get('/products/:id', optionalAuthenticate, pharmacyController.getProductById);
router.get('/branches', optionalAuthenticate, pharmacyController.getBranches);

router.get('/dashboard', optionalAuthenticate, pharmacyController.getDashboardStats);

// Protected endpoints (Pharmacist, Admin, CEO)
router.use(authenticate);

// Customer: Submit & manage own requests
router.post('/requests', uploads.generic.single('prescription_image'), handleUploadError, requestsController.createRequest);
router.get('/requests/my-requests', requestsController.getMyRequests);
router.delete('/requests/:id/cancel', requestsController.cancelRequest);

// POS Checkout (Pharmacy Manager)
router.post('/pos/checkout', pharmacyController.posCheckout);

// Pharmacy Manager endpoints
router.use(authorizeRoles(['Pharmacy Manager', 'Admin', 'CEO']));

  // Worker Settings
  router.get('/admin/worker-can-add-products', pharmacyController.getWorkerAddProductSetting);
  router.patch('/admin/worker-can-add-products', pharmacyController.updateWorkerAddProductSetting);

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

// Categories
router.post('/categories', uploads.pharmacyCategoryImage.single('cover_image'), handleUploadError, pharmacyController.createCategory);
router.put('/categories/:id', uploads.pharmacyCategoryImage.single('cover_image'), handleUploadError, pharmacyController.updateCategory);
router.delete('/categories/:id', pharmacyController.deleteCategory);

// Prescription Request Management (Pharmacy Manager)
router.get('/requests', requestsController.getAllRequests);
router.get('/requests/pending', requestsController.getPendingRequests);
router.post('/requests/:id/approve', requestsController.approveRequest);
router.post('/requests/:id/reject', requestsController.rejectRequest);
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
router.get('/transfers/:id', transferController.getById);
router.post('/transfers', transferCreateValidation, validate, transferController.create);
router.patch('/transfers/:id/approve', body('reason').optional(), validate, transferController.approve);
router.patch('/transfers/:id/reject', body('reason').notEmpty().withMessage('Rejection reason is required'), validate, transferController.reject);

// Store Manager / CEO can ship (authorizeRoles in the controller checks role or we add a separate middleware)
router.patch('/transfers/:id/ship', [
  body('quantityShipped').optional().isInt({ min: 1 }),
  body('shipmentNumber').optional().isString()
], validate, transferController.ship);

router.patch('/transfers/:id/receive', transferController.receive);

module.exports = router;
