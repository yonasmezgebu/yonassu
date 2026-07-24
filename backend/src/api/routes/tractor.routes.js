const express = require('express');
const router = express.Router();
const tractorController = require('../controllers/tractor.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads } = require('../../config/multer');

// Configure multer for handling up to 4 images
const uploadFields = uploads.carImages.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]);

// Public route for Fleet Gallery (no auth needed)
router.get('/public', tractorController.getAllTractorsPublic);

// All routes below require authentication
router.use(authenticate);

// READ: Car Manager, Admin, CEO, Finance Manager, and Agri Rental Manager can all view tractors
router.get(
  '/',
  authorizeRoles(['Car Renting Manager', 'Admin', 'CEO', 'Finance Manager', 'Agri Rental Manager']),
  tractorController.getAllTractorsManager
);

// WRITE: Only Agri Rental Manager, Car Renting Manager, Admin, CEO can create/update/delete
router.post('/', authorizeRoles(['Agri Rental Manager', 'Car Renting Manager', 'Admin', 'CEO']), uploadFields, tractorController.createTractor);
router.put('/:id', authorizeRoles(['Agri Rental Manager', 'Car Renting Manager', 'Admin', 'CEO']), uploadFields, tractorController.updateTractor);
router.delete('/:id', authorizeRoles(['Agri Rental Manager', 'Car Renting Manager', 'Admin', 'CEO']), tractorController.deleteTractor);
router.patch('/:id/restore', authorizeRoles(['Agri Rental Manager', 'Car Renting Manager', 'Admin', 'CEO']), tractorController.restoreTractor);
router.delete('/:id/permanent', authorizeRoles(['Agri Rental Manager', 'Car Renting Manager', 'Admin', 'CEO']), tractorController.hardDeleteTractor);

// ASSET VALUE: Finance Manager, Admin, CEO, Agri Rental Manager, Car Renting Manager can update asset values
router.patch(
  '/:id/asset-value',
  authorizeRoles(['Finance Manager', 'Admin', 'CEO', 'Agri Rental Manager', 'Car Renting Manager']),
  tractorController.updateAssetValue
);

module.exports = router;
