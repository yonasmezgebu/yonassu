const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const generalProcurementController = require('../controllers/generalProcurement.controller');

router.use(authenticate);

// Car Renting / Agri Rental -> Create request, view past requests
router.post('/request', generalProcurementController.createRequest);
router.get('/requests/my', generalProcurementController.getMyRequests);

// CEO -> List requests, decide
router.get('/requests/pending', authorizeRoles(['CEO', 'Admin']), generalProcurementController.getPending);
router.put('/requests/:id/decide', authorizeRoles(['CEO', 'Admin']), generalProcurementController.decideRequest);

// Purchase -> List approved requests, accept, request payment, complete via tender
router.get('/requests/approved', authorizeRoles(['Admin', 'Purchase Manager', 'Purchase', 'Purchase Staff', 'purchase', 'Purchase Team']), generalProcurementController.getApproved);
router.put('/requests/:id/accept', authorizeRoles(['Admin', 'Purchase Manager', 'Purchase', 'Purchase Staff', 'purchase', 'Purchase Team']), generalProcurementController.acceptRequest);
router.put('/requests/:id/request-payment', authorizeRoles(['Admin', 'Purchase Manager', 'Purchase', 'Purchase Staff', 'purchase', 'Purchase Team']), generalProcurementController.requestPayment);
router.put('/requests/:id/complete-tender', authorizeRoles(['Admin', 'Purchase Manager', 'Purchase', 'Purchase Staff', 'purchase', 'Purchase Team']), generalProcurementController.completeTender);
router.delete('/requests/:id', authorizeRoles(['Admin', 'Purchase Manager', 'Purchase', 'Purchase Staff', 'purchase', 'Purchase Team']), generalProcurementController.deleteRequest);

// Finance -> Check funds and Pay
router.get('/requests/finance/pending', authorizeRoles(['Admin', 'Finance Manager', 'Accountant']), generalProcurementController.getFinancePending);
router.get('/requests/finance/all', authorizeRoles(['Admin', 'Finance Manager', 'Accountant', 'CEO']), generalProcurementController.getFinanceAll);
router.put('/requests/:id/finance-check', authorizeRoles(['Admin', 'Finance Manager', 'Accountant']), generalProcurementController.financeCheck);
router.put('/requests/:id/pay', authorizeRoles(['Admin', 'Finance Manager', 'Accountant']), generalProcurementController.payRequest);

// CEO -> Final Payment Approval
router.get('/requests/payment/pending', authorizeRoles(['CEO', 'Admin']), generalProcurementController.getPaymentPending);
router.put('/requests/:id/payment-decide', authorizeRoles(['CEO', 'Admin']), generalProcurementController.decidePayment);

module.exports = router;
