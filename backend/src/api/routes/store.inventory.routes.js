const router = require('express').Router();
const ctrl = require('../controllers/store.inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/add-stock', authenticate, ctrl.addNewStock);
router.get('/dashboard', authenticate, ctrl.dashboardStats);
router.get('/movements', authenticate, ctrl.stockMovements);
router.get('/activities/recent', authenticate, ctrl.getRecentActivities);

router.get('/inventory', authenticate, ctrl.getInventory);
router.get('/inventory/:id', authenticate, ctrl.getInventoryItem);
router.put('/inventory/:id', authenticate, ctrl.updateInventoryItem);

router.get('/update-requests/pending', authenticate, ctrl.getPendingUpdateRequests);
router.patch('/update-requests/:id/approve', authenticate, ctrl.approveUpdateRequest);
router.patch('/update-requests/:id/reject', authenticate, ctrl.rejectUpdateRequest);

router.post('/receipts', authenticate, ctrl.createReceipt);
router.get('/receipts', authenticate, ctrl.listReceipts);
router.get('/receipts/today', authenticate, ctrl.listTodayReceipts);
router.get('/receipts/:id', authenticate, ctrl.getReceipt);
router.put('/receipts/:id', authenticate, ctrl.updateReceipt);
router.delete('/receipts/:id', authenticate, ctrl.deleteReceipt);

router.post('/issues', authenticate, ctrl.createIssue);
router.get('/issues', authenticate, ctrl.listIssues);
router.get('/issues/today', authenticate, ctrl.listTodayIssues);
router.get('/issues/:id', authenticate, ctrl.getIssue);
router.put('/issues/:id', authenticate, ctrl.updateIssue);
router.delete('/issues/:id', authenticate, ctrl.deleteIssue);

router.post('/transfers', authenticate, ctrl.createTransfer);
router.get('/transfers', authenticate, ctrl.listTransfers);
router.get('/transfers/:id', authenticate, ctrl.getTransfer);
router.put('/transfers/:id/status', authenticate, ctrl.updateTransferStatus);

router.post('/adjustments', authenticate, ctrl.createAdjustment);
router.get('/adjustments', authenticate, ctrl.listAdjustments);
router.get('/adjustments/pending', authenticate, ctrl.getPendingAdjustments);
router.patch('/adjustments/:id/approve', authenticate, ctrl.approveAdjustment);
router.patch('/adjustments/:id/reject', authenticate, ctrl.rejectAdjustment);

router.post('/counts', authenticate, ctrl.createCount);
router.get('/counts', authenticate, ctrl.listCounts);
router.get('/counts/:id', authenticate, ctrl.getCount);
router.put('/counts/:id/status', authenticate, ctrl.updateCountStatus);

router.post('/requisitions', authenticate, ctrl.createRequisition);
router.get('/requisitions', authenticate, ctrl.listRequisitions);
router.get('/requisitions/:id', authenticate, ctrl.getRequisition);
router.put('/requisitions/:id/status', authenticate, ctrl.updateRequisitionStatus);

router.post('/approved-requests', authenticate, ctrl.createApprovedRequest);
router.get('/approved-requests', authenticate, ctrl.listApprovedRequests);

router.get('/suppliers', authenticate, ctrl.getSuppliers);
router.post('/suppliers', authenticate, ctrl.createSupplier);
router.put('/suppliers/:id', authenticate, ctrl.updateSupplier);
router.patch('/suppliers/:id/status', authenticate, ctrl.toggleSupplierStatus);

router.get('/deliveries', authenticate, ctrl.getDeliveries);
router.post('/deliveries', authenticate, ctrl.createDelivery);
router.patch('/deliveries/:id/status', authenticate, ctrl.updateDeliveryStatus);

router.get('/overstock', authenticate, ctrl.getOverstock);

router.get('/staff', authenticate, ctrl.getStoreStaff);
router.post('/staff', authenticate, ctrl.createStoreStaff);
router.patch('/staff/:id/status', authenticate, ctrl.toggleStoreStaffStatus);

router.get('/attendance', authenticate, ctrl.getStoreAttendance);
router.post('/attendance', authenticate, ctrl.markStoreAttendance);

module.exports = router;
