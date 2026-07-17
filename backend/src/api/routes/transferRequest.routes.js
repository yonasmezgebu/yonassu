const express = require('express');
const router = express.Router();
const transferRequestController = require('../controllers/transferRequest.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All transfer-request routes require authentication
router.post('/', authenticate, transferRequestController.createRequest);
router.get('/', authenticate, transferRequestController.getRequests);
router.get('/:id', authenticate, transferRequestController.getRequestById);

// Lifecycle actions
router.patch('/:id/decision', authenticate, transferRequestController.decideRequest);
router.patch('/:id/ship', authenticate, transferRequestController.shipRequest);
router.patch('/:id/receive', authenticate, transferRequestController.receiveRequest);
router.patch('/:id/cancel', authenticate, transferRequestController.cancelRequest);

// Web Push subscription (can be called without auth from service worker)
router.post('/push-subscription', transferRequestController.savePushSubscription);

module.exports = router;
