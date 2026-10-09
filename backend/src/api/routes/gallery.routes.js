const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const { upload, handleUploadError } = require('../../services/storage.service');

// ── Public (no login required) ─────────────────────────────────
router.get('/public', galleryController.getPublicImages);
router.get('/public/:id', galleryController.getPublicImageById);

// ── Admin + HR (login + role) ─────────────────────────────────
router.use(authenticate);
router.use(authorizeRoles(['Admin', 'CEO', 'HR Manager', 'HR']));

router.get('/', galleryController.getAllImages);
router.post('/', upload.gallery.single('image'), (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'FILE_TOO_LARGE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Max 5MB.' });
  }
  if (err) return res.status(400).json({ status: 'error', message: err.message });
  next();
}, galleryController.createImage);

router.put('/:id', upload.gallery.single('image'), (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'FILE_TOO_LARGE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Max 5MB.' });
  }
  if (err) return res.status(400).json({ status: 'error', message: err.message });
  next();
}, galleryController.updateImage);

router.delete('/:id', galleryController.deleteImage);

module.exports = router;
