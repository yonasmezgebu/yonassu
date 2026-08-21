const express = require('express');
const router = express.Router();
const financeCashController = require('../controllers/financeCash.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/crv', financeCashController.createCRV);
router.get('/crv', financeCashController.getCRVs);
router.get('/crv/:id', financeCashController.getCRVById);

router.post('/ev', financeCashController.createEV);
router.get('/ev', financeCashController.getEVs);
router.get('/ev/pending', financeCashController.getPendingEVs);
router.get('/ev/finance-notifications', financeCashController.getFinanceNotifications);
router.put('/ev/:id/finance-read', financeCashController.markFinanceRead);
router.get('/ev/:id', financeCashController.getEVById);
router.put('/ev/:id/approve', financeCashController.approveEV);
router.put('/ev/:id/reject', financeCashController.rejectEV);
router.put('/ev/:id/finalize', financeCashController.finalizeEV);

router.get('/cashbook', financeCashController.getCashBook);

module.exports = router;