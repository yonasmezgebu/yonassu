const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const applicationsController = require('../controllers/applications.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

// Multer storage for ID images
const idImagesDir = './uploads/id-images';
if (!fs.existsSync(idImagesDir)) fs.mkdirSync(idImagesDir, { recursive: true });

const idStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, idImagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});
const idUpload = multer({
  storage: idStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|jpg)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Public route to submit an application (with optional ID images)
router.post('/', idUpload.fields([
  { name: 'id_front_image', maxCount: 1 },
  { name: 'id_back_image',  maxCount: 1 }
]), applicationsController.submitApplication);

// Admin/HR routes
router.use(authenticate, authorizeRoles(['Admin', 'HR', 'HR Manager', 'CEO']));
router.get('/', applicationsController.getApplications);
router.put('/:id/status', applicationsController.updateStatus);
router.delete('/:id', applicationsController.deleteApplication);

module.exports = router;
