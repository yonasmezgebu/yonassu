const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const applicationsController = require('../controllers/applications.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const { upload, handleUploadError } = require('../../services/storage.service');

// Public route to submit an application (with optional ID images)
router.post('/', upload.application.fields([
  { name: 'id_front_image', maxCount: 1 },
  { name: 'id_back_image',  maxCount: 1 }
]), applicationsController.submitApplication);

// Admin/HR routes
router.use(authenticate, authorizeRoles(['Admin', 'HR', 'HR Manager', 'HR', 'CEO']));
router.get('/', applicationsController.getApplications);
router.put('/:id/status', applicationsController.updateStatus);
router.delete('/:id', applicationsController.deleteApplication);

module.exports = router;
