const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const C = require('../controllers/hr_etp.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const HR_DOCS_DIR = './uploads/hr/documents';
if (!fs.existsSync(HR_DOCS_DIR)) fs.mkdirSync(HR_DOCS_DIR, { recursive: true });
const hrDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, HR_DOCS_DIR),
  filename: (req, file, cb) => cb(null, 'hr-doc-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const hrDocUpload = multer({
  storage: hrDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: ' + allowed.join(', ')));
  },
});

const ceoBoard = ['CEO', 'Admin', 'Board Member'];
const hrCeo    = ['CEO', 'Admin', 'HR Manager'];

router.post('/etp/heartbeat', C.heartbeat);

router.get('/etp/overview', authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getHROverview);

router.get('/etp/departments',      authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getDepartments);
router.post('/etp/departments',     authenticate, authorizeRoles(hrCeo),                       C.createDepartment);
router.put('/etp/departments/:id',  authenticate, authorizeRoles(hrCeo),                       C.updateDepartment);

router.get('/etp/units',  authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getUnits);
router.post('/etp/units', authenticate, authorizeRoles(hrCeo),                       C.createUnit);

router.get('/etp/positions',  authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getPositions);
router.post('/etp/positions', authenticate, authorizeRoles(hrCeo),                       C.createPosition);

router.get('/etp/employees',       authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getETPEmployees);
router.get('/etp/employees/:id',   authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getETPEmployee);
router.post('/etp/employees',      authenticate, authorizeRoles(hrCeo),                       C.createETPEmployee);
router.put('/etp/employees/:id',      authenticate, authorizeRoles(hrCeo),  C.updateETPEmployee);
router.delete('/etp/employees/:id',   authenticate, authorizeRoles(hrCeo),  C.deleteETPEmployee);
router.patch('/etp/employees/:id/terminate', authenticate, authorizeRoles(hrCeo), C.terminateEmployee);

router.get('/etp/attendance/daily',   authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getDailyAttendance);
router.get('/etp/attendance/monthly', authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getMonthlyAttendance);
router.post('/etp/attendance/calculate-daily',   authenticate, authorizeRoles(hrCeo), C.calculateDailyAttendance);
router.post('/etp/attendance/calculate-weekly',  authenticate, authorizeRoles(hrCeo), C.calculateWeeklySummary);
router.post('/etp/attendance/calculate-monthly', authenticate, authorizeRoles(hrCeo), C.calculateMonthlySummary);
router.get('/etp/attendance/weekly', authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getWeeklySummary);

router.post('/etp/manual-entry', authenticate, authorizeRoles([...hrCeo, 'HR Manager']), C.submitManualEntry);

const FINANCE_PAYROLL_DIR = './uploads/finance/payroll';
if (!fs.existsSync(FINANCE_PAYROLL_DIR)) fs.mkdirSync(FINANCE_PAYROLL_DIR, { recursive: true });
const financePayrollStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FINANCE_PAYROLL_DIR),
  filename: (req, file, cb) => cb(null, 'payroll-proof-' + Date.now() + path.extname(file.originalname)),
});
const financeUpload = multer({ storage: financePayrollStorage });

router.post('/etp/payroll/calculate',          authenticate, authorizeRoles(hrCeo),     C.calculatePayroll);
router.post('/etp/payroll/submit',             authenticate, authorizeRoles(hrCeo),     C.submitPayroll);
router.get('/etp/payroll/summary/:month/:year', authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getPayrollSummary);
router.post('/etp/payroll/approve',            authenticate, authorizeRoles(ceoBoard),                     C.approvePayroll);
router.post('/etp/payroll/mark-paid',          authenticate, authorizeRoles([...ceoBoard, 'Finance Manager', 'Finance']), financeUpload.single('payment_proof'), C.markPayrollPaid);
router.get('/etp/payroll/approved-list',       authenticate, authorizeRoles([...ceoBoard, 'Finance Manager', 'Finance']), C.getApprovedPayrolls);

router.get('/etp/employees/:id/documents',             authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getEmployeeDocuments);
router.post('/etp/employees/:id/documents',            authenticate, authorizeRoles(hrCeo), hrDocUpload.single('file'), C.uploadEmployeeDocument);
router.delete('/etp/employees/:id/documents/:docId',   authenticate, authorizeRoles(hrCeo), C.deleteEmployeeDocument);

router.get('/etp/agents',       authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getAgentInstallations);
router.get('/etp/agents/:id',   authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getAgentInstallation);
router.post('/etp/agents',      authenticate, authorizeRoles(hrCeo),                       C.createAgentInstallation);
router.put('/etp/agents/:id',   authenticate, authorizeRoles(hrCeo),                       C.updateAgentInstallation);
router.delete('/etp/agents/:id', authenticate, authorizeRoles(hrCeo),                       C.deleteAgentInstallation);

router.get('/etp/notifications',         authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getHRNotifications);
router.patch('/etp/notifications/:id',   authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.acknowledgeHRNotification);
router.get('/etp/notification-rules',    authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getNotificationRules);

// ETP Leaves
router.get('/etp/leaves',       authenticate, authorizeRoles([...ceoBoard, 'HR Manager']), C.getETPLeaves);
router.post('/etp/leaves',      authenticate, authorizeRoles([...ceoBoard, 'HR Manager', 'Employee']), C.createETPLeave);
router.post('/etp/leaves/:id/review', authenticate, authorizeRoles(ceoBoard), C.reviewETPLeave);

// Employee Self-Service
router.get('/etp/my-profile', authenticate, C.getMyProfile);
router.get('/etp/my-attendance', authenticate, C.getMyAttendancePortal);
router.get('/etp/my-leaves', authenticate, C.getMyLeaves);
router.get('/etp/my-documents', authenticate, C.getMyDocuments);
router.get('/etp/my-payslips', authenticate, C.getMyPayslips);

module.exports = router;
