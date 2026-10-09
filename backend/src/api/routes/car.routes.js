const express = require('express');
const router = express.Router();
const carController = require('../controllers/car.controller');
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
router.get('/public', carController.getAllCarsPublic);

// All routes below require authentication
router.use(authenticate);

// READ: Car Manager, Admin, CEO, Finance Manager, and Agri Rental Manager can all view cars
router.get(
  '/',
  authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Admin', 'CEO', 'Finance Manager', 'Agri Rental Manager']),
  carController.getAllCarsManager
);

// WRITE: Only Car Renting Manager, Admin, CEO can create/update/delete
router.post('/', authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Admin', 'CEO']), uploadFields, carController.createCar);
router.put('/:id', authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Admin', 'CEO']), uploadFields, carController.updateCar);
router.delete('/:id', authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Admin', 'CEO']), carController.deleteCar);
router.patch('/:id/restore', authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Admin', 'CEO']), carController.restoreCar);
router.delete('/:id/permanent', authorizeRoles(['Car Renting Manager', 'Rental Manager', 'Admin', 'CEO']), carController.hardDeleteCar);

// ASSET VALUE: Finance Manager, Admin, CEO, Car Renting Manager can update asset values
router.patch(
  '/:id/asset-value',
  authorizeRoles(['Finance Manager', 'Admin', 'CEO', 'Car Renting Manager', 'Rental Manager']),
  carController.updateAssetValue
);

module.exports = router;
