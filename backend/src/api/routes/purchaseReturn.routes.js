const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/purchaseReturn.controller');

router.get('/', authenticate, ctrl.getReturns);
router.post('/', authenticate, ctrl.createReturn);
router.patch('/:id/status', authenticate, ctrl.updateReturnStatus);
router.delete('/:id', authenticate, ctrl.deleteReturn);

module.exports = router;
