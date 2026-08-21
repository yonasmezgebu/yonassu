const express = require('express');
const router = express.Router();
const EmployeeTasksController = require('../controllers/employeeTasks.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const managerRoles = [
  'CEO', 'Admin',
  'Pharmacy Manager', 'Sales Manager',
  'Printing Supervisor',
  'Car Rental Manager', 'Car Renting Manager',   // both variants exist in DB
  'Purchase Manager', 'Purchase',
  'HR Manager',
  'Finance Manager',
  'General Store Keeper',
];

router.get('/', authenticate, EmployeeTasksController.getTasks);
router.get('/overview', authenticate, EmployeeTasksController.getOverview);
router.post('/', authenticate, authorizeRoles(managerRoles), EmployeeTasksController.createTask);
router.patch('/:id/status', authenticate, EmployeeTasksController.updateTaskStatus);
router.get('/department/:dept', authenticate, authorizeRoles(managerRoles), EmployeeTasksController.getDepartmentTasks);
router.get('/employees', authenticate, authorizeRoles(managerRoles), EmployeeTasksController.getEmployeesByDept);
router.delete('/:id', authenticate, authorizeRoles(managerRoles), EmployeeTasksController.deleteTask);

module.exports = router;
