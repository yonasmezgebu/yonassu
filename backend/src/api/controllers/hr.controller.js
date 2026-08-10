const hrService   = require('../../services/hr.service');
const { catchAsync } = require('../../utils/catchAsync');
const AppError    = require('../../utils/AppError');
const centralAudit = require('../../services/centralAudit.service');
const { db } = require('../../config/database');

/* ─────────────────────────────────────────────────────────────
   Helper: fire a central audit log entry in a non-blocking way.
   Failures are swallowed so audit never breaks a real request.
   ───────────────────────────────────────────────────────────── */
const log = (req, action, recordIdentifier, previousValue, newValue) => {
  const u = req.user || {};
  centralAudit.createLog({
    userId:           u.id             || null,
    userName:         u.fullName       || u.full_name || u.username || 'System',
    role:             Array.isArray(u.roles) ? u.roles.join(', ') : (u.role_names || u.role || 'Unknown'),
    department:       u.departmentName || u.department_name || 'HR',
    module:           'HR',
    action,
    recordIdentifier: String(recordIdentifier || ''),
    previousValue,
    newValue,
    ipAddress:        req.ip,
  }).catch(() => {}); // never block
  // Tell the global audit middleware this request was already recorded,
  // so it won't write a second generic CREATE/UPDATE/DELETE row.
  if (req.res) req.res.locals.__centralAudited = true;
};

// ─── DASHBOARD / ANALYTICS ──────────────────────────────────

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

// ─── EMPLOYEES ───────────────────────────────────────────────

exports.createEmployee = catchAsync(async (req, res) => {
  const id = await hrService.createEmployee(req.body);
  log(req, 'Employee Created', `Employee #${id}`, null, {
    name: req.body.full_name, department: req.body.dept_id, position: req.body.position_id,
  });
  res.status(201).json({ status: 'success', data: { employeeId: id } });
});

exports.updateEmployee = catchAsync(async (req, res) => {
  const before = await hrService.getEmployeeById(req.params.id);
  await hrService.updateEmployee(req.params.id, req.body);
  log(req, 'Employee Updated', `Employee #${req.params.id}`,
    { name: before?.full_name, status: before?.employment_status },
    req.body
  );
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

exports.updateEmployeeStatus = catchAsync(async (req, res) => {
  const before = await hrService.getEmployeeById(req.params.id);
  await hrService.updateEmployeeStatus(req.params.id, req.body);
  log(req, 'Employee Status Changed', `Employee #${req.params.id}`,
    { status: before?.employment_status },
    { status: req.body.status, reason: req.body.reason }
  );
  res.json({ status: 'success', message: 'Status updated' });
});

// ─── DEPARTMENTS ─────────────────────────────────────────────

exports.getDepartments = catchAsync(async (req, res) => {
  const departments = await hrService.getDepartments();
  res.json({ status: 'success', data: { departments } });
});

exports.createDepartment = catchAsync(async (req, res) => {
  const id = await hrService.createDepartment(req.body);
  log(req, 'Department Created', `Department #${id}`, null, req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateDepartment = catchAsync(async (req, res) => {
  const before = await db('hr_departments').where('id', req.params.id).first();
  await hrService.updateDepartment(req.params.id, req.body);
  log(req, 'Department Updated', `Department #${req.params.id}`, before, req.body);
  res.json({ status: 'success', message: 'Department updated' });
});

// ─── ATTENDANCE ──────────────────────────────────────────────

exports.clockIn = catchAsync(async (req, res) => {
  const result = await hrService.registerClock(req.body.employeeId, req.body.computerId, 'CLOCK_IN', req.ip);
  if (result.error) throw new AppError(result.error, 400);
  log(req, 'Clock In', `Employee #${req.body.employeeId}`, null, { time: new Date().toISOString() });
  res.json({ status: 'success', data: result });
});

exports.clockOut = catchAsync(async (req, res) => {
  const result = await hrService.registerClock(req.body.employeeId, req.body.computerId, 'CLOCK_OUT', req.ip);
  if (result.error) throw new AppError(result.error, 400);
  log(req, 'Clock Out', `Employee #${req.body.employeeId}`, null, { time: new Date().toISOString() });
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

exports.getAttendanceHistory = catchAsync(async (req, res) => {
  const history = await hrService.getAttendanceHistory(req.query);
  res.json({ status: 'success', data: { history } });
});

exports.registerComputer = catchAsync(async (req, res) => {
  await hrService.registerComputer(req.body);
  log(req, 'Computer Registered', req.body.computerId || req.body.computer_id, null, req.body);
  res.status(201).json({ status: 'success', message: 'Computer registered' });
});

exports.getRegisteredComputers = catchAsync(async (req, res) => {
  const computers = await hrService.getRegisteredComputers();
  res.json({ status: 'success', data: { computers } });
});

exports.createAbsence = catchAsync(async (req, res) => {
  const id = await hrService.createAbsence(req.body);
  log(req, 'Absence Recorded', `Employee #${req.body.employee_id} Absence #${id}`, null, req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.getAbsences = catchAsync(async (req, res) => {
  const absences = await hrService.getAbsences(req.query);
  res.json({ status: 'success', data: { absences } });
});

exports.getTodayActivities = catchAsync(async (req, res) => {
  const activities = await hrService.getTodayActivities();
  res.json({ status: 'success', data: activities });
});

// ─── LEAVE ───────────────────────────────────────────────────

exports.createLeaveRequest = catchAsync(async (req, res) => {
  const id = await hrService.createLeaveRequest(req.user.employeeId || req.body.employeeId, req.body);
  log(req, 'Leave Request Submitted', `Leave #${id}`, null, {
    type: req.body.leave_type_id, from: req.body.start_date, to: req.body.end_date,
  });
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
  log(req, `Leave ${status}`, `Leave #${req.params.id}`,
    { status: 'Pending' },
    { status, reason: rejectionReason || null }
  );
  res.json({ status: 'success', message: `Leave ${status.toLowerCase()}` });
});

exports.rejectLeave = catchAsync(async (req, res) => {
  await hrService.approveLeave(req.params.id, req.user.id, 'Rejected', req.body.reason);
  log(req, 'Leave Rejected', `Leave #${req.params.id}`,
    { status: 'Pending' },
    { status: 'Rejected', reason: req.body.reason }
  );
  res.json({ status: 'success', message: 'Leave rejected' });
});

// ─── PAYROLL (legacy) ────────────────────────────────────────

exports.calculatePayroll = catchAsync(async (req, res) => {
  const result = await hrService.calculatePayroll(req.body.month);
  log(req, 'Payroll Calculated', `Month: ${req.body.month}`, null, {
    month: req.body.month, employees: result?.employeeCount,
  });
  res.json({ status: 'success', data: result });
});

exports.getPayroll = catchAsync(async (req, res) => {
  const { db } = require('../../config/database');
  const month = req.params.month;
  const parts = month.split('-');
  const year = parseInt(parts[0]);
  const mon  = parseInt(parts[1]);

  let payroll = await hrService.getPayroll(month);
  if (!payroll) {
    const company = await db('payroll_company_aggregation')
      .where({ month_number: mon, year_number: year }).first();
    if (company) {
      const items = await db('payroll_salary_components as ps')
        .leftJoin('hr_employees as e', 'ps.employee_id', 'e.employee_id')
        .leftJoin('departments as d', 'e.dept_id', 'd.id')
        .select('ps.*', 'e.full_name', 'd.name as department', 'e.bank_account_number as bank_account', 'e.bank_name')
        .where({ 'ps.month_number': mon, 'ps.year_number': year });
      payroll = {
        month, total_net: company.company_net_pay, total_gross: company.company_gross_pay,
        employee_count: company.total_employees, status: company.approval_status || 'Draft', items,
      };
    }
  }
  if (!payroll) {
    return res.json({ status: 'success', data: { payroll: {
      month, total_net: 0, total_gross: 0, employee_count: 0, status: 'Not Generated', items: [],
    }}});
  }
  res.json({ status: 'success', data: { payroll } });
});

exports.sendPayrollToFinance = catchAsync(async (req, res) => {
  await hrService.sendPayrollToFinance(req.params.month, req.user.id);
  log(req, 'Payroll Sent to Finance', `Month: ${req.params.month}`, { status: 'Draft' }, { status: 'Submitted' });
  res.json({ status: 'success', message: 'Payroll sent to finance' });
});

exports.approvePayrollFinance = catchAsync(async (req, res) => {
  await hrService.approvePayroll(req.params.month, req.user.id);
  log(req, 'Payroll Approved', `Month: ${req.params.month}`, { status: 'Submitted' }, { status: 'Approved' });
  res.json({ status: 'success', message: 'Payroll approved' });
});

exports.markPayrollPaid = catchAsync(async (req, res) => {
  await hrService.markPayrollPaid(req.params.month, req.body.paymentMethod);
  log(req, 'Payroll Marked Paid', `Month: ${req.params.month}`,
    { status: 'Approved' },
    { status: 'Paid', paymentMethod: req.body.paymentMethod }
  );
  res.json({ status: 'success', message: 'Payroll marked as paid' });
});

exports.getManagerAccuracyReport = catchAsync(async (req, res) => {
  const report = await hrService.getManagerAccuracyReport();
  res.json({ status: 'success', data: { report } });
});

// ─── PAYROLL (extended) ──────────────────────────────────────

exports.getSalaries = catchAsync(async (req, res) => {
  const salaries = await hrService.getSalaries(req.query);
  res.json({ status: 'success', data: { salaries } });
});

exports.updateSalary = catchAsync(async (req, res) => {
  const before = await hrService.getSalaryById ? await hrService.getSalaryById(req.params.id) : null;
  await hrService.updateSalary(req.params.id, req.body);
  log(req, 'Salary Updated', `Employee #${req.params.id}`,
    before ? { baseSalary: before.baseSalary, overtimePayment: before.overtimePayment } : null,
    { baseSalary: req.body.baseSalary, overtimePayment: req.body.overtimePayment }
  );
  res.json({ status: 'success', message: 'Salary updated' });
});

exports.getPayrollPeriods = catchAsync(async (req, res) => {
  const periods = await hrService.getPayrollPeriods();
  res.json({ status: 'success', data: { periods } });
});

exports.processPayroll = catchAsync(async (req, res) => {
  const result = await hrService.processPayroll(req.body);
  log(req, 'Payroll Processed', `Period: ${req.body.period || req.body.month}`, null, req.body);
  res.json({ status: 'success', data: result });
});

exports.approvePayroll = catchAsync(async (req, res) => {
  await hrService.approvePayrollProcess(req.params.id);
  log(req, 'Payroll Process Approved', `Payroll #${req.params.id}`, { status: 'Pending' }, { status: 'Approved' });
  res.json({ status: 'success', message: 'Payroll approved' });
});

exports.finalizePayroll = catchAsync(async (req, res) => {
  await hrService.finalizePayrollProcess(req.params.id);
  log(req, 'Payroll Finalized', `Payroll #${req.params.id}`, { status: 'Approved' }, { status: 'Finalized' });
  res.json({ status: 'success', message: 'Payroll finalized' });
});

// ─── DEDUCTIONS ──────────────────────────────────────────────

exports.getDeductions = catchAsync(async (req, res) => {
  const deductions = await hrService.getDeductions(req.query);
  res.json({ status: 'success', data: { deductions } });
});

exports.createDeduction = catchAsync(async (req, res) => {
  const id = await hrService.createDeduction(req.body);
  log(req, 'Deduction Created', `Deduction #${id}`, null, {
    employee: req.body.employee_id, type: req.body.deduction_type, amount: req.body.amount,
  });
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateDeduction = catchAsync(async (req, res) => {
  const before = await db('hr_deductions').where('id', req.params.id).first();
  await hrService.updateDeduction(req.params.id, req.body);
  log(req, 'Deduction Updated', `Deduction #${req.params.id}`, before, req.body);
  res.json({ status: 'success', message: 'Deduction updated' });
});

exports.deleteDeduction = catchAsync(async (req, res) => {
  const isPermanent = req.query.permanent === 'true';
  await hrService.deleteDeduction(req.params.id, isPermanent);
  log(req, isPermanent ? 'Deduction Permanently Deleted' : 'Deduction Cancelled',
    `Deduction #${req.params.id}`, null, { permanent: isPermanent });
  res.json({ status: 'success', message: 'Deduction deleted' });
});

// ─── PAYSLIPS ────────────────────────────────────────────────

exports.getPayslips = catchAsync(async (req, res) => {
  const { db } = require('../../config/database');
  const { month } = req.query;
  let query = db('payroll_salary_components as psc')
    .leftJoin('hr_employees as e', 'psc.employee_id', 'e.employee_id')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .select('psc.*', 'e.full_name', 'e.bank_name', 'e.bank_account_number', 'e.payment_method', 'd.name as department')
    .orderBy('psc.calculated_date', 'desc');
  if (month) {
    const [y, m] = month.split('-');
    if (y && m) query = query.where({ 'psc.month_number': parseInt(m, 10), 'psc.year_number': parseInt(y, 10) });
  }
  const data = await query;
  const payslips = data.map(ps => ({
    id: ps.component_id, employee_id: ps.employee_id, full_name: ps.full_name,
    department: ps.department, payroll_month: `${ps.month_number}/${ps.year_number}`,
    base_salary: ps.base_salary, performance_bonus: ps.bonus_pay, overtime_pay: ps.overtime_pay,
    absence_deduction: ps.deduction_absent, tax_deduction: ps.deduction_tax,
    pension_deduction: ps.deduction_pension, loan_deduction: ps.deduction_loan,
    net_salary: ps.net_pay, payroll_status: ps.status, days_present: 26,
    bank_name: ps.bank_name, bank_account_number: ps.bank_account_number, payment_method: ps.payment_method,
  }));
  res.json({ status: 'success', data: { payslips } });
});

exports.generatePayslips = catchAsync(async (req, res) => {
  const result = await hrService.generatePayslips(req.body);
  log(req, 'Payslips Generated', `Period: ${req.body.period || req.body.month}`, null, req.body);
  res.json({ status: 'success', data: result });
});

exports.getPayslipPdf = catchAsync(async (req, res) => {
  res.header('Content-Type', 'application/pdf');
  res.attachment('payslip.pdf');
  return res.send('%PDF-1.4 mock pdf');
});

exports.emailPayslip = catchAsync(async (req, res) => {
  await hrService.emailPayslip(req.params.id);
  log(req, 'Payslip Emailed', `Payslip #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Payslip emailed' });
});

// ─── RECRUITMENT ─────────────────────────────────────────────

exports.getJobPosts = catchAsync(async (req, res) => {
  const jobs = await hrService.getJobPosts(req.query);
  res.json({ status: 'success', data: { jobs } });
});

exports.createJobPost = catchAsync(async (req, res) => {
  const id = await hrService.createJobPost(req.body);
  log(req, 'Job Post Created', `Job #${id} — ${req.body.title}`, null, req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateJobPost = catchAsync(async (req, res) => {
  await hrService.updateJobPost(req.params.id, req.body);
  log(req, 'Job Post Updated', `Job #${req.params.id}`, null, req.body);
  res.json({ status: 'success', message: 'Job post updated' });
});

exports.getApplications = catchAsync(async (req, res) => {
  const apps = await hrService.getApplications(req.query);
  res.json({ status: 'success', data: { applications: apps } });
});

exports.updateApplicationStatus = catchAsync(async (req, res) => {
  await hrService.updateApplicationStatus(req.params.id, req.body.status, req.body.reason);
  log(req, `Application ${req.body.status}`, `Application #${req.params.id}`,
    null, { status: req.body.status, reason: req.body.reason }
  );
  res.json({ status: 'success', message: 'Application status updated' });
});

exports.deleteApplication = catchAsync(async (req, res) => {
  await hrService.deleteApplication(req.params.id);
  log(req, 'Application Deleted', `Application #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Application deleted successfully' });
});

exports.getInterviews = catchAsync(async (req, res) => {
  const interviews = await hrService.getInterviews(req.query);
  res.json({ status: 'success', data: { interviews } });
});

exports.createInterview = catchAsync(async (req, res) => {
  const id = await hrService.createInterview(req.body);
  log(req, 'Interview Scheduled', `Interview #${id}`, null, {
    candidate: req.body.application_id, date: req.body.scheduled_date,
  });
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateInterview = catchAsync(async (req, res) => {
  await hrService.updateInterview(req.params.id, req.body);
  log(req, 'Interview Updated', `Interview #${req.params.id}`, null, req.body);
  res.json({ status: 'success', message: 'Interview updated' });
});

exports.getRecruitmentPipeline = catchAsync(async (req, res) => {
  const pipeline = await hrService.getRecruitmentPipeline(req.query);
  res.json({ status: 'success', data: { pipeline } });
});

exports.hireCandidate = catchAsync(async (req, res) => {
  const employeeId = await hrService.hireCandidate(req.params.applicationId);
  log(req, 'Candidate Hired', `Application #${req.params.applicationId} → Employee #${employeeId}`,
    { status: 'Interview' }, { status: 'Hired', employeeId }
  );
  res.json({ status: 'success', message: 'Candidate hired', data: { employeeId } });
});

// ─── PERFORMANCE ─────────────────────────────────────────────

exports.getEvaluations = catchAsync(async (req, res) => {
  const evals = await hrService.getEvaluations(req.query);
  res.json({ status: 'success', data: { evaluations: evals } });
});

exports.createEvaluation = catchAsync(async (req, res) => {
  const id = await hrService.createEvaluation(req.body);
  log(req, 'Performance Evaluation Created', `Evaluation #${id}`, null, {
    employee: req.body.employee_id, period: req.body.period, score: req.body.overall_score,
  });
  res.status(201).json({ status: 'success', data: { id } });
});

exports.getReviews = catchAsync(async (req, res) => {
  const reviews = await hrService.getReviews(req.query);
  res.json({ status: 'success', data: { reviews } });
});

exports.approveReview = catchAsync(async (req, res) => {
  await hrService.approveReview(req.params.id);
  log(req, 'Performance Review Approved', `Review #${req.params.id}`,
    { status: 'Pending' }, { status: 'Approved' }
  );
  res.json({ status: 'success', message: 'Review approved' });
});

exports.getFeedback = catchAsync(async (req, res) => {
  const feedback = await hrService.getFeedback(req.query, req.user);
  res.json({ status: 'success', data: { feedback } });
});

exports.submitFeedback = catchAsync(async (req, res) => {
  const id = await hrService.submitFeedback(req.body, req.user);
  log(req, 'Feedback Submitted', `Feedback #${id}`, null, {
    to: req.body.to_employee_id, category: req.body.category,
  });
  res.status(201).json({ status: 'success', data: { id } });
});

exports.acknowledgeFeedback = catchAsync(async (req, res) => {
  await hrService.acknowledgeFeedback(req.params.id);
  log(req, 'Feedback Acknowledged', `Feedback #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Feedback acknowledged' });
});

// ─── CONTRACTS ───────────────────────────────────────────────

exports.getContracts = catchAsync(async (req, res) => {
  const contracts = await hrService.getContracts(req.query);
  res.json({ status: 'success', data: { contracts } });
});

exports.createContract = catchAsync(async (req, res) => {
  const id = await hrService.createContract(req.body);
  log(req, 'Contract Created', `Contract #${id}`, null, {
    employee: req.body.employee_id, type: req.body.contract_type, start: req.body.start_date,
  });
  res.status(201).json({ status: 'success', data: { id } });
});

exports.approveContract = catchAsync(async (req, res) => {
  await hrService.approveContract(req.params.id);
  log(req, 'Contract Approved', `Contract #${req.params.id}`, { status: 'Draft' }, { status: 'Approved' });
  res.json({ status: 'success', message: 'Contract approved' });
});

exports.renewContract = catchAsync(async (req, res) => {
  const newId = await hrService.renewContract(req.params.id, req.body);
  log(req, 'Contract Renewed', `Contract #${req.params.id} → New #${newId}`,
    { status: 'Active' }, { status: 'Renewed', newContractId: newId }
  );
  res.json({ status: 'success', message: 'Contract renewed', data: { id: newId } });
});

exports.terminateContract = catchAsync(async (req, res) => {
  await hrService.terminateContract(req.params.id, req.body.reason);
  log(req, 'Contract Terminated', `Contract #${req.params.id}`,
    { status: 'Active' }, { status: 'Terminated', reason: req.body.reason }
  );
  res.json({ status: 'success', message: 'Contract terminated' });
});

exports.getContractDocument = catchAsync(async (req, res) => {
  res.header('Content-Type', 'application/pdf');
  res.attachment(`contract_${req.params.id}.pdf`);
  return res.send('%PDF-1.4 mock pdf');
});

// ─── EMPLOYEE FILES ──────────────────────────────────────────

exports.getEmployeeFiles = catchAsync(async (req, res) => {
  const files = await hrService.getEmployeeFiles(req.query, req.user);
  res.json({ status: 'success', data: { files } });
});

exports.uploadEmployeeFile = catchAsync(async (req, res) => {
  const id = await hrService.uploadEmployeeFile(req.body);
  log(req, 'Employee File Uploaded', `File #${id}`, null, {
    employee: req.body.employee_id, fileName: req.body.file_name,
  });
  res.status(201).json({ status: 'success', data: { id } });
});

exports.downloadEmployeeFile = catchAsync(async (req, res) => {
  res.header('Content-Type', 'application/octet-stream');
  res.attachment(`file_${req.params.id}`);
  return res.send('mock file content');
});

exports.deleteEmployeeFile = catchAsync(async (req, res) => {
  await hrService.deleteEmployeeFile(req.params.id);
  log(req, 'Employee File Deleted', `File #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'File deleted' });
});

exports.archiveEmployeeFile = catchAsync(async (req, res) => {
  await hrService.archiveEmployeeFile(req.params.id);
  log(req, 'Employee File Archived', `File #${req.params.id}`, { status: 'Active' }, { status: 'Archived' });
  res.json({ status: 'success', message: 'File archived' });
});

// ─── HR POLICIES ─────────────────────────────────────────────

exports.getPolicies = catchAsync(async (req, res) => {
  const policies = await hrService.getPolicies(req.query);
  res.json({ status: 'success', data: { policies } });
});

exports.createPolicy = catchAsync(async (req, res) => {
  const id = await hrService.createPolicy(req.body, req.user.id);
  log(req, 'Policy Created', `Policy #${id} — ${req.body.title}`, null, req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updatePolicy = catchAsync(async (req, res) => {
  const before = await db('hr_policies').where('id', req.params.id).first();
  await hrService.updatePolicy(req.params.id, req.body, req.user.id);
  log(req, 'Policy Updated', `Policy #${req.params.id}`, before, req.body);
  res.json({ status: 'success', message: 'Policy updated' });
});

exports.publishPolicy = catchAsync(async (req, res) => {
  await hrService.publishPolicy(req.params.id, req.user.id);
  log(req, 'Policy Published', `Policy #${req.params.id}`, { status: 'Draft' }, { status: 'Published' });
  res.json({ status: 'success', message: 'Policy published' });
});

exports.archivePolicy = catchAsync(async (req, res) => {
  await hrService.archivePolicy(req.params.id, req.user.id);
  log(req, 'Policy Archived', `Policy #${req.params.id}`, { status: 'Published' }, { status: 'Archived' });
  res.json({ status: 'success', message: 'Policy archived' });
});

exports.sendPolicyToAll = catchAsync(async (req, res) => {
  await hrService.sendPolicyToAll(req.params.id, req.user.id);
  log(req, 'Policy Broadcast to All Staff', `Policy #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Policy broadcasted to all employees' });
});

exports.acknowledgePolicy = catchAsync(async (req, res) => {
  await hrService.acknowledgePolicy(req.params.id, req.user.id, req.ip);
  log(req, 'Policy Acknowledged', `Policy #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Policy acknowledged' });
});

// ─── ANNOUNCEMENTS ───────────────────────────────────────────

exports.getAnnouncements = catchAsync(async (req, res) => {
  const announcements = await hrService.getAnnouncements(req.query);
  res.json({ status: 'success', data: { announcements } });
});

exports.createAnnouncement = catchAsync(async (req, res) => {
  const id = await hrService.createAnnouncement(req.body, req.user.id);
  log(req, 'Announcement Created', `Announcement #${id} — ${req.body.title}`, null, req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updateAnnouncement = catchAsync(async (req, res) => {
  const before = await db('hr_announcements').where('id', req.params.id).first();
  await hrService.updateAnnouncement(req.params.id, req.body, req.user.id);
  log(req, 'Announcement Updated', `Announcement #${req.params.id}`, before, req.body);
  res.json({ status: 'success', message: 'Announcement updated' });
});

exports.deleteAnnouncement = catchAsync(async (req, res) => {
  await hrService.deleteAnnouncement(req.params.id, req.user.id);
  log(req, 'Announcement Deleted', `Announcement #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Announcement deleted' });
});

exports.retractAnnouncement = catchAsync(async (req, res) => {
  await hrService.retractAnnouncement(req.params.id, req.user.id);
  log(req, 'Announcement Retracted', `Announcement #${req.params.id}`,
    { status: 'Published' }, { status: 'Retracted' }
  );
  res.json({ status: 'success', message: 'Announcement retracted' });
});

exports.readAnnouncement = catchAsync(async (req, res) => {
  await hrService.readAnnouncement(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Announcement read' });
});

// ─── INTERNAL NOTICES ────────────────────────────────────────

exports.getNotices = catchAsync(async (req, res) => {
  const notices = await hrService.getNotices(req.query);
  res.json({ status: 'success', data: { notices } });
});

exports.createNotice = catchAsync(async (req, res) => {
  const id = await hrService.createNotice(req.body, req.user.id);
  log(req, 'Notice Created', `Notice #${id} — ${req.body.title}`, null, req.body);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.publishNotice = catchAsync(async (req, res) => {
  await hrService.publishNotice(req.params.id);
  log(req, 'Notice Published', `Notice #${req.params.id}`, { status: 'Draft' }, { status: 'Published' });
  res.json({ status: 'success', message: 'Notice published' });
});

exports.deleteNotice = catchAsync(async (req, res) => {
  await hrService.deleteNotice(req.params.id);
  log(req, 'Notice Deleted', `Notice #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Notice deleted' });
});

// ─── HR MESSAGES ─────────────────────────────────────────────

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
  log(req, 'Internal Message Sent', `Message #${id}`, null, {
    to: req.body.recipient_id, subject: req.body.subject,
  });
  res.status(201).json({ status: 'success', data: { id } });
});

exports.readMessage = catchAsync(async (req, res) => {
  await hrService.readMessage(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Message read' });
});

exports.replyMessage = catchAsync(async (req, res) => {
  const id = await hrService.replyMessage(req.params.id, req.body, req.user.id);
  log(req, 'Message Replied', `Original #${req.params.id} → Reply #${id}`, null, null);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.deleteMessage = catchAsync(async (req, res) => {
  await hrService.deleteMessage(req.params.id, req.user.id);
  log(req, 'Message Deleted', `Message #${req.params.id}`, null, null);
  res.json({ status: 'success', message: 'Message deleted' });
});

// ─── MISC ─────────────────────────────────────────────────────

exports.getReports = catchAsync(async (req, res) => {
  const reports = await hrService.getReports(req.query);
  res.json({ status: 'success', data: reports });
});

exports.exportModule = catchAsync(async (req, res) => {
  log(req, 'HR Data Exported', `Module: ${req.query.module || 'All'}`, null, null);
  res.header('Content-Type', 'text/csv');
  res.attachment('export.csv');
  return res.send('id,name\n1,Test');
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
