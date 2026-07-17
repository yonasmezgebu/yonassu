const express = require('express');
const router = express.Router();
const financeCashController = require('../controllers/financeCash.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/crv', financeCashController.createCRV);
router.get('/crv', financeCashController.getCRVs);
router.get('/crv/:id', financeCashController.getCRVById);

router.post('/pv', financeCashController.createPV);
router.get('/pv', financeCashController.getPVs);
router.get('/pv/:id', financeCashController.getPVById);

router.post('/pcv', financeCashController.createPCV);
router.get('/pcv', financeCashController.getPCVs);
router.get('/pcv/pending', financeCashController.getPendingPCVs);
router.get('/pcv/finance-notifications', financeCashController.getFinanceNotifications);
router.put('/pcv/:id/finance-read', financeCashController.markFinanceRead);
router.get('/pcv/:id', financeCashController.getPCVById);
router.put('/pcv/:id/approve', financeCashController.approvePCV);
router.put('/pcv/:id/reject', financeCashController.rejectPCV);
router.put('/pcv/:id/finalize', financeCashController.finalizePCV);

router.get('/cashbook', financeCashController.getCashBook);

module.exports = router;
