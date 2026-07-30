const express = require('express');
const router = express.Router();
const retailController = require('../controllers/retail.controller');
const { authenticate, authorizeRoles, optionalAuthenticate } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');

const managerRoles = ['CEO', 'Admin', 'Sales Manager'];
const cashierRoles = ['Admin', 'CEO', 'Sales/Cashier', 'Sales Manager'];

// ── Public (no login required) ──────────────────────────────────
router.get('/categories', retailController.getCategories);
router.get('/products', retailController.getProducts);
router.get('/products/:id', retailController.getProductById);
router.post('/track-order', retailController.trackOrder);

// ── Customer (login required) ──────────────────────────────────
router.use('/cart', authenticate);
router.get('/cart', retailController.getCart);
router.post('/cart/add', retailController.addToCart);
router.put('/cart/item/:id', retailController.updateCartItem);
router.delete('/cart/item/:id', retailController.removeCartItem);
router.delete('/cart', retailController.clearCart);

router.post('/orders/place', authenticate, retailController.placeOrder);
router.get('/orders/my-orders', authenticate, retailController.getMyOrders);

// ── Cashier (Admin, CEO) ───────────────────────────────────────
const cashierAuth = [authenticate, authorizeRoles(cashierRoles)];

router.post('/shifts/open', ...cashierAuth, retailController.openShift);
router.get('/shifts/current', ...cashierAuth, retailController.getCurrentShift);
router.get('/shifts/history', ...cashierAuth, retailController.getShiftHistory);
router.post('/shifts/close', ...cashierAuth, retailController.closeShift);

router.post('/pos/checkout', ...cashierAuth, retailController.posCheckout);
router.get('/pos/transactions', ...cashierAuth, retailController.getTransactions);

// Product management
router.put('/products/:id/stock', ...cashierAuth, retailController.updateStock);
router.post('/products', ...cashierAuth, uploads.singleProductImage.single('product_image'), retailController.createProduct);
router.put('/products/:id', ...cashierAuth, uploads.singleProductImage.single('product_image'), retailController.updateProduct);
router.post('/products/:id/partial-adjust', ...cashierAuth, retailController.partialAdjustProduct);
router.delete('/products/:id', ...cashierAuth, retailController.deleteProduct);

// Product update requests (CEO Approval Flow)
router.post('/products/:id/update-request', ...cashierAuth, retailController.createProductUpdateRequest);
router.get('/update-requests', ...cashierAuth, retailController.getProductUpdateRequests);
router.post('/update-requests/:id/approve', authenticate, authorizeRoles(['CEO', 'Admin']), retailController.approveProductUpdateRequest);
router.post('/update-requests/:id/reject', authenticate, authorizeRoles(['CEO', 'Admin']), retailController.rejectProductUpdateRequest);

// ── Inventory (Admin, CEO) ────────────────────────────────────
router.get('/inventory', ...cashierAuth, retailController.getInventory);

// ── Manager (Admin, CEO) ──────────────────────────────────────
const managerAuth = [authenticate, authorizeRoles(managerRoles)];

router.get('/manager/dashboard', ...managerAuth, retailController.getManagerDashboard);
router.get('/manager/sales-trends', ...managerAuth, retailController.getSalesTrends);
router.get('/manager/cashier-activity', ...managerAuth, retailController.getCashierActivity);
router.post('/manager/approve-discount', ...managerAuth, retailController.approveDiscount);
router.post('/manager/approve-refund', ...managerAuth, retailController.approveRefund);
router.post('/manager/verify-shift', ...managerAuth, retailController.verifyShift);

// ── Finance ──────────────────────────────────────────────────
router.get('/finance/reconciliation', ...managerAuth, retailController.getReconciliation);
router.post('/finance/deposit', ...managerAuth, retailController.recordDeposit);
router.get('/finance/audit-log', ...managerAuth, retailController.getAuditLog);
router.post('/finance/void', ...managerAuth, retailController.approveVoid);

// Admin: categories
router.post('/categories', ...managerAuth, retailController.createCategory);



// --- New Retail POS routes ---
router.post('/checkout-direct', authenticate, authorizeRoles(cashierRoles), retailController.checkoutDirect);
router.get('/pos/sales', authenticate, authorizeRoles(cashierRoles), retailController.getRetailSales);
router.post('/pos/sales/submit-daily', authenticate, authorizeRoles(cashierRoles), retailController.submitDailyRetail);
router.get('/pos/submission/:ref', authenticate, authorizeRoles(cashierRoles), retailController.getSubmissionDetails);
router.get('/pos/audit-trail', authenticate, authorizeRoles(cashierRoles), retailController.getRetailAuditTrail);
router.get('/pos/orders/pending', authenticate, authorizeRoles(cashierRoles), retailController.getPendingRetailOrders);


router.patch('/orders/:id/status', authenticate, authorizeRoles(cashierRoles), retailController.updateOrderStatus);




// --- Retail Branches ---
router.get('/branches', authenticate, authorizeRoles(managerRoles), retailController.getBranches);
router.post('/branches', authenticate, authorizeRoles(managerRoles), retailController.createBranch);
router.put('/branches/:id', authenticate, authorizeRoles(managerRoles), retailController.updateBranch);
router.delete('/branches/:id', authenticate, authorizeRoles(managerRoles), retailController.deleteBranch);
router.get('/branch-inventory/:id', authenticate, authorizeRoles(managerRoles), retailController.getBranchInventory);
router.put('/branch-products/set-quantity', authenticate, authorizeRoles(managerRoles), retailController.setBranchProductQuantity);

// --- Retail Store Inventory (general_store_materials dept=Sales) ---
router.get('/store-inventory',       authenticate, authorizeRoles(managerRoles), retailController.getStoreInventory);
router.post('/store-inventory',      authenticate, authorizeRoles(managerRoles), retailController.registerStoreItem);
router.put('/store-inventory/:id',   authenticate, authorizeRoles(managerRoles), retailController.updateStoreItem);
router.delete('/store-inventory/:id',authenticate, authorizeRoles(managerRoles), retailController.deleteStoreItem);

// --- Retail Store Requests (isolated from pharmacy transfer_requests) ---
router.get('/store-requests',          authenticate, authorizeRoles(managerRoles), retailController.getStoreRequests);
router.post('/store-requests',         authenticate, authorizeRoles(managerRoles), retailController.createStoreRequest);
router.patch('/store-requests/:id/receive', authenticate, authorizeRoles(managerRoles), retailController.receiveStoreRequest);

module.exports = router;
