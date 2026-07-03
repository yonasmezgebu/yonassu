const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const HRController = require('../controllers/hr.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize, authorizeRoles } = require('../middleware/auth.middleware');

router.post('/auth/login', body('employeeId').notEmpty(), body('password').notEmpty(), validate, HRController.authenticate);

router.get('/summary', authenticate, authorize(['hr:read']), HRController.getHRSummary);

router.post('/employees', authenticate, authorizeRoles(['HR Manager', 'CEO', 'Admin']),
  body('fullName').notEmpty(), body('email').isEmail(), body('department').notEmpty(), validate, HRController.createEmployee);
router.put('/employees/:id', authenticate, authorizeRoles(['HR Manager', 'CEO', 'Admin']), HRController.updateEmployee);
router.get('/employees', authenticate, authorizeRoles(['HR Manager', 'CEO', 'Admin']), HRController.getEmployees);
router.get('/employees/:id', authenticate, authorizeRoles(['HR Manager', 'CEO', 'Admin']), HRController.getEmployeeById);

router.post('/clock-in', body('employeeId').notEmpty(), body('computerId').notEmpty(), validate, HRController.clockIn);
router.post('/clock-out', body('employeeId').notEmpty(), body('computerId').notEmpty(), validate, HRController.clockOut);
router.get('/my-attendance', authenticate, HRController.getMyAttendance);
router.get('/attendance/monthly/:employeeId', authenticate, authorizeRoles(['HR Manager', 'CEO', 'Admin']), HRController.getMonthlyAttendance);
router.get('/attendance/daily', authenticate, authorizeRoles(['HR Manager', 'CEO', 'Admin']), HRController.getDailyAttendances);

router.post('/computers', authenticate, authorize(['hr:write']),
  body('computerId').notEmpty(), body('computerName').notEmpty(), validate, HRController.registerComputer);
router.get('/computers', authenticate, authorize(['hr:read']), HRController.getRegisteredComputers);

router.post('/leaves', authenticate, body('leaveTypeId').isInt(), body('startDate').notEmpty(), body('endDate').notEmpty(), validate, HRController.createLeaveRequest);
router.get('/leaves', authenticate, HRController.getLeaveRequests);
router.post('/leaves/:id/review', authenticate, authorize(['hr:write']), body('approved').isBoolean(), validate, HRController.approveLeave);

router.post('/payroll/calculate', authenticate, authorizeRoles(['HR Manager', 'Admin']), body('month').notEmpty(), validate, HRController.calculatePayroll);
router.get('/payroll/:month', authenticate, authorizeRoles(['HR Manager', 'Finance Manager', 'CEO', 'Admin']), HRController.getPayroll);
router.post('/payroll/:month/send', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.sendPayrollToFinance);
router.post('/payroll/:month/approve', authenticate, authorize(['finance:approve']), HRController.approvePayrollFinance);
router.post('/payroll/:month/pay', authenticate, authorize(['finance:write']), body('paymentMethod').notEmpty(), validate, HRController.markPayrollPaid);

router.get('/manager-accuracy', authenticate, authorizeRoles(['CEO', 'HR Manager', 'Admin']), HRController.getManagerAccuracyReport);


// ---- NEW HR DASHBOARD ROUTES ----
router.get('/activities/today', authenticate, HRController.getTodayActivities);
router.get('/departments', authenticate, HRController.getDepartments);
router.post('/departments', authenticate, HRController.createDepartment);
router.put('/departments/:id', authenticate, HRController.updateDepartment);
router.put('/employees/:id/status', authenticate, HRController.updateEmployeeStatus);
router.get('/attendance/history', authenticate, HRController.getAttendanceHistory);
router.get('/absences', authenticate, HRController.getAbsences);
router.post('/absences', authenticate, HRController.createAbsence);
router.put('/leaves/:id/reject', authenticate, HRController.rejectLeave);
router.get('/reports', authenticate, HRController.getReports);
router.get('/export/:module', authenticate, HRController.exportModule);

// ---- EXTENDED HR DASHBOARD ROUTES (Menus 12-22) ----
// Payroll
router.get('/payroll/salaries', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getSalaries);
router.put('/payroll/salaries/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.updateSalary);
router.get('/payroll/periods', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getPayrollPeriods);
router.post('/payroll/process', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.processPayroll);
router.put('/payroll/:id/approve', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.approvePayroll);
router.put('/payroll/:id/finalize', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.finalizePayroll);
router.get('/payroll/deductions', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getDeductions);
router.post('/payroll/deductions', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createDeduction);
router.put('/payroll/deductions/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.updateDeduction);
router.delete('/payroll/deductions/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.deleteDeduction);
router.get('/payroll/payslips', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO', 'Employee']), HRController.getPayslips);
router.post('/payroll/payslips/generate', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.generatePayslips);
router.get('/payroll/payslips/:id/pdf', authenticate, authorizeRoles(['HR Manager', 'Admin', 'Employee']), HRController.getPayslipPdf);
router.post('/payroll/payslips/:id/email', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.emailPayslip);

// Recruitment
router.get('/recruitment/jobs', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO', 'Employee']), HRController.getJobPosts);
router.post('/recruitment/jobs', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createJobPost);
router.put('/recruitment/jobs/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.updateJobPost);
router.get('/recruitment/applications', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getApplications);
router.put('/recruitment/applications/:id/status', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.updateApplicationStatus);
router.get('/recruitment/interviews', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getInterviews);
router.post('/recruitment/interviews', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createInterview);
router.put('/recruitment/interviews/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.updateInterview);
router.get('/recruitment/pipeline', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getRecruitmentPipeline);
router.post('/recruitment/hire/:applicationId', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.hireCandidate);

// Performance
router.get('/performance/evaluations', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getEvaluations);
router.post('/performance/evaluations', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createEvaluation);
router.get('/performance/reviews', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO', 'Employee']), HRController.getReviews);
router.put('/performance/reviews/:id/approve', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.approveReview);
router.get('/performance/feedback', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO', 'Employee']), HRController.getFeedback);
router.post('/performance/feedback', authenticate, authorizeRoles(['HR Manager', 'Admin', 'Employee']), HRController.submitFeedback);
router.put('/performance/feedback/:id/acknowledge', authenticate, authorizeRoles(['Employee', 'HR Manager', 'Admin']), HRController.acknowledgeFeedback);

// ---- FINAL HR DASHBOARD ROUTES (Menus 23-28) ----
// Contracts
router.get('/contracts', authenticate, authorizeRoles(['HR Manager', 'Admin', 'CEO']), HRController.getContracts);
router.post('/contracts', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createContract);
router.put('/contracts/:id/approve', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.approveContract);
router.put('/contracts/:id/renew', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.renewContract);
router.put('/contracts/:id/terminate', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.terminateContract);
router.get('/contracts/:id/document', authenticate, authorizeRoles(['HR Manager', 'Admin', 'Employee']), HRController.getContractDocument);

// Employee Files
router.get('/files', authenticate, HRController.getEmployeeFiles);
router.post('/files/upload', authenticate, HRController.uploadEmployeeFile);
router.get('/files/:id/download', authenticate, HRController.downloadEmployeeFile);
router.delete('/files/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.deleteEmployeeFile);
router.put('/files/:id/archive', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.archiveEmployeeFile);

// HR Policies
router.get('/policies', authenticate, HRController.getPolicies);
router.post('/policies', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createPolicy);
router.put('/policies/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.updatePolicy);
router.put('/policies/:id/publish', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.publishPolicy);
router.put('/policies/:id/archive', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.archivePolicy);
router.post('/policies/:id/send-to-all', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.sendPolicyToAll);

// Announcements
router.get('/announcements', authenticate, HRController.getAnnouncements);
router.post('/announcements', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createAnnouncement);
router.put('/announcements/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.updateAnnouncement);
router.delete('/announcements/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.deleteAnnouncement);
router.post('/announcements/:id/read', authenticate, HRController.readAnnouncement);

// Internal Notices
router.get('/notices', authenticate, HRController.getNotices);
router.post('/notices', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.createNotice);
router.put('/notices/:id/publish', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.publishNotice);
router.delete('/notices/:id', authenticate, authorizeRoles(['HR Manager', 'Admin']), HRController.deleteNotice);

// HR Messages
router.get('/messages/inbox', authenticate, HRController.getInboxMessages);
router.get('/messages/sent', authenticate, HRController.getSentMessages);
router.post('/messages/send', authenticate, HRController.sendMessage);
router.put('/messages/:id/read', authenticate, HRController.readMessage);
router.put('/messages/:id/reply', authenticate, HRController.replyMessage);
router.delete('/messages/:id', authenticate, HRController.deleteMessage);

module.exports = router;
