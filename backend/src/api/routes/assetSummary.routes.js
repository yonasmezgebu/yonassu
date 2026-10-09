const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assetSummary.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Consolidated Assets summary across all 5 asset modules
router.get(
  '/',
  authenticate,
  authorizeRoles(['CEO', 'Admin', 'Finance Manager']),
  ctrl.getAssetSummary
);

module.exports = router;
