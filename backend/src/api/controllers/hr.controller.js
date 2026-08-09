const hrService = require('../../services/hr.service');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const audit = require('../../services/audit.service').logAudit;

exports.getHRSummary = catchAsync(async (req, res) => {
  const data = await hrService.getHRSummary();
  res.json({ success: true, data });
});

exports.getAttritionData = catchAsync(async (req, res) => {
  const { period = 'quarter' } = req.query;
  const data = await hrService.getAttritionData(period);
  res.json({ success: true, data });
});

exports.getCompensationData = catchAsync(async (req, res) => {
  const data = await hrService.getCompensationData();
  res.json({ success: true, data });
});

exports.getSuccessionPipeline = catchAsync(async (req, res) => {
  const data = await hrService.getSuccessionPipeline();
  res.json({ success: true, data });
});

exports.getDEIMetrics = catchAsync(async (req, res) => {
  const data = await hrService.getDEIMetrics();
  res.json({ success: true, data });
});

exports.createEmployee = catchAsync(async (req, res) => {
  const id = await hrService.createEmployee(req.body);
  await audit({ action: 'EMPLOYEE_CREATED', userId: req.user.id, resource: 'HR', resourceId: id, ipAddress: req.ip });
  res.status(201).json({ status: 'success', data: { employeeId: id } });
});

exports.updateEmployee = catchAsync(async (req, res) => {
  await hrService.updateEmployee(req.params.id, req.body);
  await audit({ action: 'EMPLOYEE_UPDATED', userId: req.user.id, resource: 'HR', resourceId: req.params.id, ipAddress: req.ip });
  res.json({ status: 'success', message: 'Employee updated' });
});

exports.getEmployees = catchAsync(async (req, res) => {
  const employees = await hrService.getEmployees(req.query);
  res.json({ status: 'success', data: { employees } });
});

exports.getEmployeeById = catchAsync(async (req, res) => {
  const emp = await hrService.getEmployeeById(req.params.id);
  if (!emp) throw new AppError('Employee not found', 404);
  res.json({ status: 'success', data: { employee: emp } });
});

exports.clockIn = catchAsync(async (req, res) => {
  const result = await hrService.registerClock(req.body.employeeId, req.body.computerId, 'CLOCK_IN', req.ip);
  if (result.error) throw new AppError(result.error, 400);
  await audit({ action: 'CLOCK_IN', userId: req.body.employeeId, resource: 'ATTENDANCE', resourceId: result.id, ipAddress: req.ip });
  res.json({ status: 'success', data: result });
});

exports.clockOut = catchAsync(async (req, res) => {
  const result = await hrService.registerClock(req.body.employeeId, req.body.computerId, 'CLOCK_OUT', req.ip);
  if (result.error) throw new AppError(result.error, 400);
  await audit({ action: 'CLOCK_OUT', userId: req.body.employeeId, resource: 'ATTENDANCE', resourceId: result.id, ipAddress: req.ip });
  res.json({ status: 'success', data: result });
});

exports.getMyAttendance = catchAsync(async (req, res) => {
  const today = await hrService.getTodayAttendance(req.user.employeeId || req.query.employeeId);
  res.json({ status: 'success', data: today });
});

exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const records = await hrService.getMonthlyAttendance(req.params.employeeId || req.query.employeeId, req.query.month);
  res.json({ status: 'success', data: { records } });
});

exports.getDailyAttendances = catchAsync(async (req, res) => {
  const attendances = await hrService.getDailyAttendances(req.query.date);
  res.json({ status: 'success', data: { attendances } });
});

exports.registerComputer = catchAsync(async (req, res) => {
  await hrService.registerComputer(req.body);
  await audit({ action: 'COMPUTER_REGISTERED', userId: req.user.id, resource: 'HR', resourceId: req.body.computerId, ipAddress: req.ip });
  res.status(201).json({ status: 'success', message: 'Computer registered' });
});

exports.getRegisteredComputers = catchAsync(async (req, res) => {
  const computers = await hrService.getRegisteredComputers();
  res.json({ status: 'success', data: { computers } });
});

exports.createLeaveRequest = catchAsync(async (req, res) => {
  const id = await hrService.createLeaveRequest(req.user.employeeId || req.body.employeeId, req.body);
  await audit({ action: 'LEAVE_REQUESTED', userId: req.user.id || req.body.employeeId, resource: 'HR', resourceId: id, ipAddress: req.ip });
  res.status(201).json({ status: 'success', data: { leaveId: id } });
});

exports.getLeaveRequests = catchAsync(async (req, res) => {
  const leaves = await hrService.getLeaveRequests(req.query);
  res.json({ status: 'success', data: { leaves } });
});

exports.approveLeave = catchAsync(async (req, res) => {
  const { approved, rejectionReason } = req.body;
  const status = approved ? 'Approved' : 'Rejected';
  await hrService.approveLeave(req.params.id, req.user.id, status, rejectionReason);
  await audit({ action: 'LEAVE_' + status.toUpperCase(), userId: req.user.id, resource: 'HR', resourceId: req.params.id, ipAddress: req.ip });
  res.json({ status: 'success', message: `Leave ${status.toLowerCase()}` });
});

exports.getHRSummary = catchAsync(async (req, res) => {
  const summary = await hrService.getHRSummary();
  res.json({ status: 'success', data: summary });
});

exports.calculatePayroll = catchAsync(async (req, res) => {
  const result = await hrService.calculatePayroll(req.body.month);
  await audit({ action: 'PAYROLL_CALCULATED', userId: req.user.id, resource: 'PAYROLL', resourceId: result.payrollId, ipAddress: req.ip });
  res.json({ status: 'success', data: result });
});

exports.getPayroll = catchAsync(async (req, res) => {
  const { db } = require('../../config/database');
  const month = req.params.month; // e.g. '2026-06'
  const parts = month.split('-');
  const year = parseInt(parts[0]);
  const mon = parseInt(parts[1]);

  // First try the old payroll table
  let payroll = await hrService.getPayroll(month);

  // If not found, try the new ETP payroll aggregation tables
  if (!payroll) {
    const company = await db('payroll_company_aggregation')
      .where({ month_number: mon, year_number: year }).first();
    if (company) {
      const items = await db('payroll_salary_components as ps')
        .leftJoin('hr_employees as e', 'ps.employee_id', 'e.employee_id')
        .leftJoin('hr_departments as d', 'e.dept_id', 'd.dept_id')
        .leftJoin('hr_positions as p', 'e.position_id', 'p.position_id')
        .select('ps.*', 'e.full_name', 'd.dept_name as department', 'p.position_title as position', 'e.bank_account_number as bank_account', 'e.bank_name')
        .where({ 'ps.month_number': mon, 'ps.year_number': year });
      payroll = {
        month,
        total_net: company.company_net_pay,
        total_gross: company.company_gross_pay,
        employee_count: company.total_employees,
        status: company.approval_status || 'Draft',
        items,
      };
    }
  }

  // If still not found, return empty structure instead of 404
  if (!payroll) {
    return res.json({
      status: 'success',
      data: {
        payroll: {
          month,
          total_net: 0,
          total_gross: 0,
          employee_count: 0,
          status: 'Not Generated',
          items: [],
        }
      }
    });
  }

  res.json({ status: 'success', data: { payroll } });
});

exports.sendPayrollToFinance = catchAsync(async (req, res) => {
  await hrService.sendPayrollToFinance(req.params.month, req.user.id);
  await audit({ action: 'PAYROLL_SENT', userId: req.user.id, resource: 'PAYROLL', resourceId: req.params.month, ipAddress: req.ip });
  res.json({ status: 'success', message: 'Payroll sent to finance' });
});

exports.approvePayrollFinance = catchAsync(async (req, res) => {
  await hrService.approvePayroll(req.params.month, req.user.id);
  await audit({ action: 'PAYROLL_APPROVED', userId: req.user.id, resource: 'PAYROLL', resourceId: req.params.month, ipAddress: req.ip });
  res.json({ status: 'success', message: 'Payroll approved' });
});

exports.markPayrollPaid = catchAsync(async (req, res) => {
  await hrService.markPayrollPaid(req.params.month, req.body.paymentMethod);
  await audit({ action: 'PAYROLL_PAID', userId: req.user.id, resource: 'PAYROLL', resourceId: req.params.month, ipAddress: req.ip });
  res.json({ status: 'success', message: 'Payroll marked as paid' });
});

exports.getManagerAccuracyReport = catchAsync(async (req, res) => {
  const report = await hrService.getManagerAccuracyReport();
  res.json({ status: 'success', data: { report } });
});

exports.authenticate = catchAsync(async (req, res) => {
  const emp = await hrService.authenticateEmployee(req.body.employeeId, req.body.password);
  if (!emp) throw new AppError('Invalid Employee ID or Password', 401);
  const token = require('jsonwebtoken').sign(
    { employeeId: emp.employee_id, sub: emp.employee_id, role: 'Employee' },
    process.env.JWT_SECRET || require('../../config/env').jwt.secret,
    { expiresIn: '12h' }
  );
  res.json({ status: 'success', data: { token, employee: emp } });
});

// ---- NEW HR DASHBOARD ENDPOINTS ----
exports.getTodayActivities = catchAsync(async (req, res) => {
  const activities = await hrService.getTodayActivities();
  res.json({ status: 'success', data: activities });
});

exports.getDepartments = catchAsync(async (req, res) => {
  const departments = await hrService.getDepartments();
  res.json({ status: 'success', data: { departments } });
});

exports.createDepartment = catchAsync(async (req, res) => {
  const id = await hrService.createDepartment(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateDepartment = catchAsync(async (req, res) => {
  await hrService.updateDepartment(req.params.id, req.body);
  res.json({ status: 'success', message: 'Department updated' });
});

exports.updateEmployeeStatus = catchAsync(async (req, res) => {
  await hrService.updateEmployeeStatus(req.params.id, req.body);
  res.json({ status: 'success', message: 'Status updated' });
});

exports.getAttendanceHistory = catchAsync(async (req, res) => {
  const history = await hrService.getAttendanceHistory(req.query);
  res.json({ status: 'success', data: { history } });
});

exports.createAbsence = catchAsync(async (req, res) => {
  const id = await hrService.createAbsence(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.getAbsences = catchAsync(async (req, res) => {
  const absences = await hrService.getAbsences(req.query);
  res.json({ status: 'success', data: { absences } });
});

exports.getReports = catchAsync(async (req, res) => {
  const reports = await hrService.getReports(req.query);
  res.json({ status: 'success', data: reports });
});

exports.rejectLeave = catchAsync(async (req, res) => {
  await hrService.approveLeave(req.params.id, req.user.id, 'Rejected', req.body.reason);
  res.json({ status: 'success', message: 'Leave rejected' });
});

exports.exportModule = catchAsync(async (req, res) => {
  res.header('Content-Type', 'text/csv');
  res.attachment('export.csv');
  return res.send('id,name\n1,Test');
});

// ---- EXTENDED HR DASHBOARD ROUTES (Menus 12-22) ----

// Payroll
exports.getSalaries = catchAsync(async (req, res) => {
  const salaries = await hrService.getSalaries(req.query);
  res.json({ status: 'success', data: { salaries } });
});

exports.updateSalary = catchAsync(async (req, res) => {
  await hrService.updateSalary(req.params.id, req.body);
  res.json({ status: 'success', message: 'Salary updated' });
});

exports.getPayrollPeriods = catchAsync(async (req, res) => {
  const periods = await hrService.getPayrollPeriods();
  res.json({ status: 'success', data: { periods } });
});

exports.processPayroll = catchAsync(async (req, res) => {
  const result = await hrService.processPayroll(req.body);
  res.json({ status: 'success', data: result });
});

exports.approvePayroll = catchAsync(async (req, res) => {
  await hrService.approvePayrollProcess(req.params.id);
  res.json({ status: 'success', message: 'Payroll approved' });
});

exports.finalizePayroll = catchAsync(async (req, res) => {
  await hrService.finalizePayrollProcess(req.params.id);
  res.json({ status: 'success', message: 'Payroll finalized' });
});

exports.getDeductions = catchAsync(async (req, res) => {
  const deductions = await hrService.getDeductions(req.query);
  res.json({ status: 'success', data: { deductions } });
});

exports.createDeduction = catchAsync(async (req, res) => {
  const id = await hrService.createDeduction(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateDeduction = catchAsync(async (req, res) => {
  await hrService.updateDeduction(req.params.id, req.body);
  res.json({ status: 'success', message: 'Deduction updated' });
});

exports.deleteDeduction = catchAsync(async (req, res) => {
  await hrService.deleteDeduction(req.params.id);
  res.json({ status: 'success', message: 'Deduction deleted' });
});

exports.getPayslips = catchAsync(async (req, res) => {
  const { db } = require('../../config/database');
  const { month } = req.query;

  let query = db('payroll_salary_components as psc')
    .leftJoin('hr_employees as e', 'psc.employee_id', 'e.employee_id')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .select(
      'psc.*',
      'e.full_name',
      'e.bank_name',
      'e.bank_account_number',
      'e.payment_method',
      'd.name as department'
    ).orderBy('psc.calculated_date', 'desc');

  if (month) {
    const [y, m] = month.split('-');
    if (y && m) {
      query = query.where({ 'psc.month_number': parseInt(m, 10), 'psc.year_number': parseInt(y, 10) });
    }
  }

  const data = await query;

  const payslips = data.map(ps => ({
    id: ps.component_id,
    employee_id: ps.employee_id,
    full_name: ps.full_name,
    department: ps.department,
    payroll_month: `${ps.month_number}/${ps.year_number}`,
    base_salary: ps.base_salary,
    performance_bonus: ps.bonus_pay,
    overtime_pay: ps.overtime_pay,
    absence_deduction: ps.deduction_absent,
    tax_deduction: ps.deduction_tax,
    pension_deduction: ps.deduction_pension,
    loan_deduction: ps.deduction_loan,
    net_salary: ps.net_pay,
    payroll_status: ps.status,
    days_present: 26,
    bank_name: ps.bank_name,
    bank_account_number: ps.bank_account_number,
    payment_method: ps.payment_method,
  }));

  res.json({ status: 'success', data: { payslips } });
});

exports.generatePayslips = catchAsync(async (req, res) => {
  const result = await hrService.generatePayslips(req.body);
  res.json({ status: 'success', data: result });
});

exports.getPayslipPdf = catchAsync(async (req, res) => {
  // Mock PDF return
  res.header('Content-Type', 'application/pdf');
  res.attachment('payslip.pdf');
  return res.send('%PDF-1.4 mock pdf');
});

exports.emailPayslip = catchAsync(async (req, res) => {
  await hrService.emailPayslip(req.params.id);
  res.json({ status: 'success', message: 'Payslip emailed' });
});

// Recruitment
exports.getJobPosts = catchAsync(async (req, res) => {
  const jobs = await hrService.getJobPosts(req.query);
  res.json({ status: 'success', data: { jobs } });
});

exports.createJobPost = catchAsync(async (req, res) => {
  const id = await hrService.createJobPost(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateJobPost = catchAsync(async (req, res) => {
  await hrService.updateJobPost(req.params.id, req.body);
  res.json({ status: 'success', message: 'Job post updated' });
});

exports.getApplications = catchAsync(async (req, res) => {
  const apps = await hrService.getApplications(req.query);
  res.json({ status: 'success', data: { applications: apps } });
});

exports.updateApplicationStatus = catchAsync(async (req, res) => {
  await hrService.updateApplicationStatus(req.params.id, req.body.status, req.body.reason);
  res.json({ status: 'success', message: 'Application status updated' });
});

exports.deleteApplication = catchAsync(async (req, res) => {
  await hrService.deleteApplication(req.params.id);
  res.json({ status: 'success', message: 'Application deleted successfully' });
});

exports.getInterviews = catchAsync(async (req, res) => {
  const interviews = await hrService.getInterviews(req.query);
  res.json({ status: 'success', data: { interviews } });
});

exports.createInterview = catchAsync(async (req, res) => {
  const id = await hrService.createInterview(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateInterview = catchAsync(async (req, res) => {
  await hrService.updateInterview(req.params.id, req.body);
  res.json({ status: 'success', message: 'Interview updated' });
});

exports.getRecruitmentPipeline = catchAsync(async (req, res) => {
  const pipeline = await hrService.getRecruitmentPipeline(req.query);
  res.json({ status: 'success', data: { pipeline } });
});

exports.hireCandidate = catchAsync(async (req, res) => {
  const employeeId = await hrService.hireCandidate(req.params.applicationId);
  res.json({ status: 'success', message: 'Candidate hired', data: { employeeId } });
});

// Performance
exports.getEvaluations = catchAsync(async (req, res) => {
  const evals = await hrService.getEvaluations(req.query);
  res.json({ status: 'success', data: { evaluations: evals } });
});

exports.createEvaluation = catchAsync(async (req, res) => {
  const id = await hrService.createEvaluation(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.getReviews = catchAsync(async (req, res) => {
  const reviews = await hrService.getReviews(req.query);
  res.json({ status: 'success', data: { reviews } });
});

exports.approveReview = catchAsync(async (req, res) => {
  await hrService.approveReview(req.params.id);
  res.json({ status: 'success', message: 'Review approved' });
});

exports.getFeedback = catchAsync(async (req, res) => {
  const feedback = await hrService.getFeedback(req.query, req.user);
  res.json({ status: 'success', data: { feedback } });
});

exports.submitFeedback = catchAsync(async (req, res) => {
  const id = await hrService.submitFeedback(req.body, req.user);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.acknowledgeFeedback = catchAsync(async (req, res) => {
  await hrService.acknowledgeFeedback(req.params.id);
  res.json({ status: 'success', message: 'Feedback acknowledged' });
});

// ---- FINAL HR DASHBOARD CONTROLLERS (Menus 23-28) ----

// Contracts
exports.getContracts = catchAsync(async (req, res) => {
  const contracts = await hrService.getContracts(req.query);
  res.json({ status: 'success', data: { contracts } });
});

exports.createContract = catchAsync(async (req, res) => {
  const id = await hrService.createContract(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.approveContract = catchAsync(async (req, res) => {
  await hrService.approveContract(req.params.id);
  res.json({ status: 'success', message: 'Contract approved' });
});

exports.renewContract = catchAsync(async (req, res) => {
  const newId = await hrService.renewContract(req.params.id, req.body);
  res.json({ status: 'success', message: 'Contract renewed', data: { id: newId } });
});

exports.terminateContract = catchAsync(async (req, res) => {
  await hrService.terminateContract(req.params.id, req.body.reason);
  res.json({ status: 'success', message: 'Contract terminated' });
});

exports.getContractDocument = catchAsync(async (req, res) => {
  // Mock document return
  res.header('Content-Type', 'application/pdf');
  res.attachment(`contract_${req.params.id}.pdf`);
  return res.send('%PDF-1.4 mock pdf');
});

// Employee Files
exports.getEmployeeFiles = catchAsync(async (req, res) => {
  const files = await hrService.getEmployeeFiles(req.query, req.user);
  res.json({ status: 'success', data: { files } });
});

exports.uploadEmployeeFile = catchAsync(async (req, res) => {
  const id = await hrService.uploadEmployeeFile(req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.downloadEmployeeFile = catchAsync(async (req, res) => {
  // Mock file download
  res.header('Content-Type', 'application/octet-stream');
  res.attachment(`file_${req.params.id}`);
  return res.send('mock file content');
});

exports.deleteEmployeeFile = catchAsync(async (req, res) => {
  await hrService.deleteEmployeeFile(req.params.id);
  res.json({ status: 'success', message: 'File deleted' });
});

exports.archiveEmployeeFile = catchAsync(async (req, res) => {
  await hrService.archiveEmployeeFile(req.params.id);
  res.json({ status: 'success', message: 'File archived' });
});

// HR Policies
exports.getPolicies = catchAsync(async (req, res) => {
  const policies = await hrService.getPolicies(req.query);
  res.json({ status: 'success', data: { policies } });
});

exports.createPolicy = catchAsync(async (req, res) => {
  const id = await hrService.createPolicy(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updatePolicy = catchAsync(async (req, res) => {
  await hrService.updatePolicy(req.params.id, req.body, req.user.id);
  res.json({ status: 'success', message: 'Policy updated' });
});

exports.publishPolicy = catchAsync(async (req, res) => {
  await hrService.publishPolicy(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Policy published' });
});

exports.archivePolicy = catchAsync(async (req, res) => {
  await hrService.archivePolicy(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Policy archived' });
});

exports.sendPolicyToAll = catchAsync(async (req, res) => {
  await hrService.sendPolicyToAll(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Policy broadcasted to all employees' });
});

exports.acknowledgePolicy = catchAsync(async (req, res) => {
  await hrService.acknowledgePolicy(req.params.id, req.user.id, req.ip);
  res.json({ status: 'success', message: 'Policy acknowledged' });
});

// Announcements
exports.getAnnouncements = catchAsync(async (req, res) => {
  const announcements = await hrService.getAnnouncements(req.query);
  res.json({ status: 'success', data: { announcements } });
});

exports.createAnnouncement = catchAsync(async (req, res) => {
  const id = await hrService.createAnnouncement(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateAnnouncement = catchAsync(async (req, res) => {
  await hrService.updateAnnouncement(req.params.id, req.body, req.user.id);
  res.json({ status: 'success', message: 'Announcement updated' });
});

exports.deleteAnnouncement = catchAsync(async (req, res) => {
  await hrService.deleteAnnouncement(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Announcement deleted' });
});

exports.retractAnnouncement = catchAsync(async (req, res) => {
  await hrService.retractAnnouncement(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Announcement retracted' });
});

exports.readAnnouncement = catchAsync(async (req, res) => {
  await hrService.readAnnouncement(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Announcement read' });
});

// Internal Notices
exports.getNotices = catchAsync(async (req, res) => {
  const notices = await hrService.getNotices(req.query);
  res.json({ status: 'success', data: { notices } });
});

exports.createNotice = catchAsync(async (req, res) => {
  const id = await hrService.createNotice(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.publishNotice = catchAsync(async (req, res) => {
  await hrService.publishNotice(req.params.id);
  res.json({ status: 'success', message: 'Notice published' });
});

exports.deleteNotice = catchAsync(async (req, res) => {
  await hrService.deleteNotice(req.params.id);
  res.json({ status: 'success', message: 'Notice deleted' });
});

// HR Messages
exports.getInboxMessages = catchAsync(async (req, res) => {
  const messages = await hrService.getInboxMessages(req.user.id);
  res.json({ status: 'success', data: { messages } });
});

exports.getSentMessages = catchAsync(async (req, res) => {
  const messages = await hrService.getSentMessages(req.user.id);
  res.json({ status: 'success', data: { messages } });
});

exports.sendMessage = catchAsync(async (req, res) => {
  const id = await hrService.sendMessage(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.readMessage = catchAsync(async (req, res) => {
  await hrService.readMessage(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Message read' });
});

exports.replyMessage = catchAsync(async (req, res) => {
  const id = await hrService.replyMessage(req.params.id, req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.deleteMessage = catchAsync(async (req, res) => {
  await hrService.deleteMessage(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Message deleted' });
});

