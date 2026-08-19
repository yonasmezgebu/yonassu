const express = require('express');
const router = express.Router();
const EmployeeReportsController = require('../controllers/employeeReports.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const managerRoles = [
  'CEO', 'Admin', 'Pharmacy Manager', 'Sales Manager', 
  'Printing Supervisor', 'Car Rental Manager', 'Purchase Manager', 
  'HR Manager', 'Finance Manager'
];

router.post('/', authenticate, EmployeeReportsController.submitReport);
router.get('/my', authenticate, EmployeeReportsController.getMyReports);
router.get('/department/:dept', authenticate, authorizeRoles(managerRoles), EmployeeReportsController.getDepartmentReports);

module.exports = router;
