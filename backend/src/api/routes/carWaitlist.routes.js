const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/carWaitlist.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const MANAGER_ROLES = ['Car Renting Manager', 'Rental Manager', 'Admin', 'CEO'];

// Public (authenticated customer)
router.post('/', authenticate, ctrl.joinWaitlist);
router.get('/my', authenticate, ctrl.myWaitlist);

// Manager
router.get('/', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.listWaitlist);
router.patch('/:id', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.updateWaitlist);
router.delete('/:id', authenticate, authorizeRoles(MANAGER_ROLES), ctrl.deleteWaitlist);

module.exports = router;