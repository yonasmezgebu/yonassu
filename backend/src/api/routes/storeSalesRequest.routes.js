const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/storeSalesRequest.controller');

router.use(authenticate);

// Sales Manager routes
router.get('/', ctrl.listRequests);
router.post('/', ctrl.createRequest);
router.get('/records', ctrl.listSaleRecords);
router.get('/:id', ctrl.getRequest);

// Store Keeper routes
router.patch('/:id/release', ctrl.releaseRequest);
router.patch('/:id/reject', ctrl.rejectRequest);

module.exports = router;
