const express = require('express');
const router = express.Router();
const centralAuditController = require('../controllers/centralAudit.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', centralAuditController.getLogs);
router.post('/', centralAuditController.createLog);

module.exports = router;
