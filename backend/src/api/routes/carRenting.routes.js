const express = require('express');
const router = express.Router();
const carRentingController = require('../controllers/carRenting.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const storeRoles = ['Pharmacy Store Keeper', 'Pharmacy Store', 'General Store Keeper', 'General Store', 'CEO', 'Admin'];
const managerRoles = ['Car Renting Manager', 'Rental Manager', 'Agri Rental Manager', 'Admin', 'CEO'];

// Dashboard overview
router.get('/dashboard', authenticate, authorizeRoles([...managerRoles, 'Finance Manager', 'CEO', 'Admin']), carRentingController.getDashboardStats);

// Store Request Flow
router.post('/store-requests',          authenticate, authorizeRoles([...managerRoles, ...storeRoles]), carRentingController.createStoreRequest);
router.get('/store-requests',           authenticate, authorizeRoles([...managerRoles, ...storeRoles]), carRentingController.getStoreRequests);
router.get('/store-requests/:id',       authenticate, authorizeRoles([...managerRoles, ...storeRoles]), carRentingController.getStoreRequestDetail);
router.put('/store-requests/:id',       authenticate, authorizeRoles([...managerRoles]),                carRentingController.updateStoreRequest);
router.patch('/store-requests/:id/status', authenticate, authorizeRoles([...managerRoles, ...storeRoles]), carRentingController.updateStoreRequestStatus);

// Maintenance Flow
router.post('/maintenance', authenticate, authorizeRoles(managerRoles), carRentingController.createMaintenance);
router.get('/maintenance', authenticate, authorizeRoles(managerRoles), carRentingController.getMaintenance);
router.get('/maintenance/finance', authenticate, authorizeRoles(['Finance Manager', 'Admin', 'CEO']), carRentingController.getFinanceMaintenance);
router.patch('/maintenance/:id/ceo-approve', authenticate, authorizeRoles(['CEO', 'Admin']), carRentingController.ceoApproveMaintenance);
router.patch('/maintenance/:id/finance-approve', authenticate, authorizeRoles(['Finance Manager', 'Admin', 'CEO']), carRentingController.financeApproveMaintenance);
router.patch('/maintenance/:id/finance-pay', authenticate, authorizeRoles(['Finance Manager', 'Admin', 'CEO']), carRentingController.financePayMaintenance);
router.patch('/maintenance/:id/complete', authenticate, authorizeRoles(managerRoles), carRentingController.completeMaintenance);

// Fuel & Service Flow
router.post('/fuel-service', authenticate, authorizeRoles(managerRoles), carRentingController.createFuelService);
router.get('/fuel-service', authenticate, authorizeRoles([...managerRoles, 'Finance Manager', 'CEO', 'Admin']), carRentingController.getFuelServices);
router.patch('/fuel-service/:id/ceo-approve', authenticate, authorizeRoles(['CEO', 'Admin']), carRentingController.ceoApproveFuelService);
router.patch('/fuel-service/:id/finance-approve', authenticate, authorizeRoles(['Finance Manager', 'Admin', 'CEO']), carRentingController.financeApproveFuelService);
router.patch('/fuel-service/:id/finance-pay', authenticate, authorizeRoles(['Finance Manager', 'Admin', 'CEO']), carRentingController.financePayFuelService);
router.patch('/fuel-service/:id/complete', authenticate, authorizeRoles(managerRoles), carRentingController.completeFuelService);

module.exports = router;
