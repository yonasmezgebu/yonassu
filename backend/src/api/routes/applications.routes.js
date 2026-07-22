const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applications.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Public route to submit an application
router.post('/', applicationsController.submitApplication);

// Admin/HR routes
router.use(authenticate, authorizeRoles(['Admin', 'HR', 'HR Manager', 'CEO']));
router.get('/', applicationsController.getApplications);
router.put('/:id/status', applicationsController.updateStatus);

module.exports = router;
