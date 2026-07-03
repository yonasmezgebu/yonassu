const { db } = require('../config/database');

const getAttritionData = async (period = 'quarter') => {
  const now = new Date();
  let intervals;

  if (period === 'year') {
    intervals = [];
    for (let y = 0; y < 5; y++) {
      const year = now.getFullYear() - y;
      intervals.push({ label: `${year}`, start: `${year}-01-01`, end: `${year}-12-31` });
    }
  } else {
    intervals = [];
    for (let q = 0; q < 8; q++) {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - q * 3;
      const year = now.getFullYear() + Math.floor(quarterStartMonth / 12);
      const month = ((quarterStartMonth % 12) + 12) % 12;
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endMonth = month + 3;
      const endYear = year + Math.floor(endMonth / 12);
      const em = (endMonth % 12) || 12;
      const endDate = new Date(endYear, em, 0);
      intervals.push({ label: `Q${(month / 3) + 1} ${year}`, start, end: endDate.toISOString().split('T')[0] });
    }
  }

  const results = [];
  for (const interval of intervals) {
    const hired = await db('employees').whereBetween('join_date', [interval.start, interval.end]).count('id as count').first();
    const departed = await db('employees').where('status', 'Inactive').whereBetween('created_at', [interval.start, interval.end]).count('id as count').first();
    const h = parseInt(hired.count);
    const d = parseInt(departed.count);
    const totalAtStart = await db('employees').where('join_date', '<', interval.start).count('id as count').first();
    const avgHeadcount = parseInt(totalAtStart.count) + Math.round(h / 2);
    const rate = avgHeadcount > 0 ? parseFloat(((d / avgHeadcount) * 100).toFixed(1)) : 0;
    results.push({ period: interval.label, hired: h, departed: d, attritionRate: rate });
  }

  const total = await db('employees').count('id as count').first();
  const active = await db('employees').where('status', 'Active').count('id as count').first();
  const overallRate = parseInt(total.count) > 0 ? parseFloat((((parseInt(total.count) - parseInt(active.count)) / parseInt(total.count)) * 100).toFixed(1)) : 0;

  return { intervals: results, overallAttritionRate: overallRate };
};

const getCompensationData = async () => {
  const byDepartment = await db('employees').select('department').avg('salary as avg').min('salary as min').max('salary as max').count('id as count').groupBy('department').orderBy('department');
  const byPosition = await db('employees').select('position').avg('salary as avg').min('salary as min').max('salary as max').count('id as count').groupBy('position').orderBy('position');
  const totalPayroll = await db('payroll').sum('net_pay as total').first();
  const salaryByGender = await db('employees').select('gender').avg('salary as avg').groupBy('gender');

  return {
    totalPayroll: Math.round(parseFloat(totalPayroll?.total || 0)),
    byDepartment: byDepartment.map(d => ({
      department: d.department,
      employeeCount: parseInt(d.count),
      avgSalary: Math.round(parseFloat(d.avg || 0)),
      minSalary: Math.round(parseFloat(d.min || 0)),
      maxSalary: Math.round(parseFloat(d.max || 0))
    })),
    byPosition: byPosition.map(p => ({
      position: p.position,
      employeeCount: parseInt(p.count),
      avgSalary: Math.round(parseFloat(p.avg || 0)),
      minSalary: Math.round(parseFloat(p.min || 0)),
      maxSalary: Math.round(parseFloat(p.max || 0))
    })),
    salaryByGender: salaryByGender.map(g => ({ gender: g.gender || 'Unspecified', avgSalary: Math.round(parseFloat(g.avg || 0)) }))
  };
};

const getSuccessionPipeline = async () => {
  const pipeline = await db('succession_planning as sp')
    .leftJoin('employees as inc', 'sp.incumbent_id', 'inc.id')
    .leftJoin('employees as suc', 'sp.successor_id', 'suc.id')
    .select('sp.id', 'sp.position', 'sp.readiness', 'sp.notes',
      'inc.first_name as incumbent_first', 'inc.last_name as incumbent_last',
      'suc.first_name as successor_first', 'suc.last_name as successor_last',
      'suc.position as successor_current_position')
    .orderBy('sp.position');

  const byReadiness = await db('succession_planning').select('readiness').count('id as count').groupBy('readiness');
  const totalPositions = await db('succession_planning').count('id as count').first();
  const filled = await db('succession_planning').whereNotNull('successor_id').count('id as count').first();

  return {
    totalPositions: parseInt(totalPositions.count),
    filledPositions: parseInt(filled.count),
    coverageRate: parseInt(totalPositions.count) > 0 ? Math.round((parseInt(filled.count) / parseInt(totalPositions.count)) * 100) : 0,
    byReadiness: byReadiness.map(r => ({ readiness: r.readiness, count: parseInt(r.count) })),
    pipeline: pipeline.map(p => ({
      id: p.id,
      position: p.position,
      incumbent: p.incumbent_first ? `${p.incumbent_first} ${p.incumbent_last}` : 'Vacant',
      successor: p.successor_first ? `${p.successor_first} ${p.successor_last}` : null,
      successorCurrentPosition: p.successor_current_position,
      readiness: p.readiness,
      notes: p.notes
    }))
  };
};

const getDEIMetrics = async () => {
  const total = await db('employees').count('id as count').first();
  const genderByDept = await db('employees').select('department', 'gender').count('id as count').groupBy('department', 'gender').orderBy('department');
  const overallGender = await db('employees').select('gender').count('id as count').groupBy('gender');
  const unknownGender = await db('employees').whereNull('gender').count('id as count').first();

  const deptMap = {};
  for (const row of genderByDept) {
    if (!deptMap[row.department]) deptMap[row.department] = { department: row.department, male: 0, female: 0, other: 0, total: 0 };
    const key = (row.gender || 'other').toLowerCase();
    if (deptMap[row.department][key] !== undefined) deptMap[row.department][key] = parseInt(row.count);
    deptMap[row.department].total += parseInt(row.count);
  }

  const totalCount = parseInt(total.count);
  const femaleCount = overallGender.filter(g => g.gender === 'Female').reduce((s, r) => s + parseInt(r.count), 0);
  const maleCount = overallGender.filter(g => g.gender === 'Male').reduce((s, r) => s + parseInt(r.count), 0);

  return {
    totalEmployees: totalCount,
    femalePercentage: totalCount > 0 ? parseFloat(((femaleCount / totalCount) * 100).toFixed(1)) : 0,
    malePercentage: totalCount > 0 ? parseFloat(((maleCount / totalCount) * 100).toFixed(1)) : 0,
    unknownGender: parseInt(unknownGender.count),
    overallGender: overallGender.map(g => ({ gender: g.gender || 'Unspecified', count: parseInt(g.count) })),
    byDepartment: Object.values(deptMap)
  };
};

const bcrypt = require('bcrypt');

// ─────────────────────────────────────────────────────────────
// Employee ID Generator
// ─────────────────────────────────────────────────────────────
const generateEmployeeId = async () => {
  const now = new Date();
  const prefix = `EMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-`;
  const last = await db('employees').where('employee_id', 'like', `${prefix}%`).orderBy('employee_id', 'desc').first();
  const seq = last ? String(parseInt(last.employee_id.slice(-3)) + 1).padStart(3, '0') : '001';
  return `${prefix}${seq}`;
};

// ─────────────────────────────────────────────────────────────
// Employee CRUD
// ─────────────────────────────────────────────────────────────
const createEmployee = async (data) => {
  const employeeId = await generateEmployeeId();
  const passwordHash = await bcrypt.hash(data.password || '123456', 10);
  await db('employees').insert({
    employee_id: employeeId,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone || null,
    document_url: data.documentUrl || null,
    password_hash: passwordHash,
    position: data.position || null,
    department: data.department,
    join_date: data.joinDate || new Date(),
    base_salary: data.baseSalary || 0,
    allowance: data.allowance || 0,
    standing_deduction: data.standingDeduction || 0,
    payment_method: data.paymentMethod || 'Cash',
    bank_account: data.bankAccount || null,
    work_type: data.workType || 'Office',
    check_in_time: data.checkInTime || '08:30:00',
    check_out_time: data.checkOutTime || '17:30:00',
    lunch_break_minutes: data.lunchBreakMinutes || 60,
    work_days_per_month: data.workDaysPerMonth || 22,
    status: 'Active',
    user_id: data.userId || null,
  });
  return employeeId;
};

const updateEmployee = async (id, data) => {
  const updates = {};
  if (data.fullName !== undefined) updates.full_name = data.fullName;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.documentUrl !== undefined) updates.document_url = data.documentUrl;
  if (data.position !== undefined) updates.position = data.position;
  if (data.department !== undefined) updates.department = data.department;
  if (data.baseSalary !== undefined) updates.base_salary = data.baseSalary;
  if (data.allowance !== undefined) updates.allowance = data.allowance;
  if (data.standingDeduction !== undefined) updates.standing_deduction = data.standingDeduction;
  if (data.paymentMethod !== undefined) updates.payment_method = data.paymentMethod;
  if (data.bankAccount !== undefined) updates.bank_account = data.bankAccount;
  if (data.workType !== undefined) updates.work_type = data.workType;
  if (data.status !== undefined) updates.status = data.status;
  if (data.checkInTime !== undefined) updates.check_in_time = data.checkInTime;
  if (data.checkOutTime !== undefined) updates.check_out_time = data.checkOutTime;
  updates.updated_at = db.fn.now();
  await db('employees').where('employee_id', id).update(updates);
};

const getEmployees = async (params = {}) => {
  let query = db('employees').select('*');
  if (params.department) query = query.where('department', params.department);
  if (params.status) query = query.where('status', params.status);
  if (params.search) {
    query = query.where(function () {
      this.where('full_name', 'like', `%${params.search}%`)
        .orWhere('email', 'like', `%${params.search}%`)
        .orWhere('employee_id', 'like', `%${params.search}%`);
    });
  }
  return query.orderBy('full_name');
};

const getEmployeeById = async (id) => {
  return db('employees').where('employee_id', id).first();
};

const authenticateEmployee = async (employeeId, password) => {
  const emp = await db('employees').where('employee_id', employeeId).where('status', 'Active').first();
  if (!emp) return null;
  const valid = await bcrypt.compare(password, emp.password_hash);
  if (!valid) return null;
  return emp;
};

// ─────────────────────────────────────────────────────────────
// Computer Registration
// ─────────────────────────────────────────────────────────────
const registerComputer = async (data) => {
  await db('registered_computers').insert({
    computer_id: data.computerId,
    computer_name: data.computerName,
    location: data.location || null,
    department: data.department || null,
    mac_address: data.macAddress || null,
    ip_range: data.ipRange || null,
    status: 'Active',
  });
  return data.computerId;
};

const getRegisteredComputers = async () => {
  return db('registered_computers').where('status', 'Active').orderBy('computer_name');
};

const isComputerRegistered = async (computerId) => {
  const comp = await db('registered_computers').where('computer_id', computerId).where('status', 'Active').first();
  return !!comp;
};

// ─────────────────────────────────────────────────────────────
// Attendance / Clock-in / Clock-out
// Table: attendance_records
// Columns: id, employee_id, computer_id, action, status, timestamp, ip_address, work_date, notes, recorded_by
// ─────────────────────────────────────────────────────────────
const registerClock = async (employeeId, computerId, action, ip) => {
  if (!(await isComputerRegistered(computerId))) return { error: 'Computer not registered. Contact HR.' };

  const emp = await db('employees').where('employee_id', employeeId).where('status', 'Active').first();
  if (!emp) return { error: 'Employee not found or inactive.' };

  const now = new Date();
  const workDate = now.toISOString().split('T')[0];

  if (action === 'CLOCK_IN') {
    const existing = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_IN' }).first();
    if (existing) return { error: 'Already clocked in today.' };

    const clockedOut = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_OUT' }).first();
    if (clockedOut) return { error: 'Already clocked out today.' };

    const [id] = await db('attendance_records').insert({
      employee_id: employeeId,
      computer_id: computerId,
      action: 'CLOCK_IN',
      status: 'Present',
      timestamp: now,
      ip_address: ip,
      work_date: workDate,
      recorded_by: employeeId,
    });
    return { id, employeeId, action: 'CLOCK_IN', timestamp: now, workDate };

  } else if (action === 'CLOCK_OUT') {
    const clockIn = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_IN' }).first();
    if (!clockIn) return { error: 'No clock-in record found for today.' };

    const existingOut = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_OUT' }).first();
    if (existingOut) return { error: 'Already clocked out today.' };

    const [id] = await db('attendance_records').insert({
      employee_id: employeeId,
      computer_id: computerId,
      action: 'CLOCK_OUT',
      status: 'Present',
      timestamp: now,
      ip_address: ip,
      work_date: workDate,
      recorded_by: employeeId,
    });
    return { id, employeeId, action: 'CLOCK_OUT', timestamp: now, workDate };
  }
  return { error: 'Invalid action' };
};

const getTodayAttendance = async (employeeId) => {
  const today = new Date().toISOString().split('T')[0];
  const records = await db('attendance_records')
    .where({ employee_id: employeeId, work_date: today })
    .orderBy('timestamp');
  const clockIn = records.find(r => r.action === 'CLOCK_IN');
  const clockOut = records.find(r => r.action === 'CLOCK_OUT');
  return { employeeId, date: today, clockIn: clockIn || null, clockOut: clockOut || null };
};

const getMonthlyAttendance = async (employeeId, month) => {
  const [year, m] = month.split('-');
  const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
  const startDate = `${month}-01`;
  const endDate = `${month}-${daysInMonth}`;
  const records = await db('attendance_records')
    .where('employee_id', employeeId)
    .whereBetween('work_date', [startDate, endDate])
    .orderBy('work_date');
  return records;
};

const getDailyAttendances = async (date) => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  return db('attendance_records as ar')
    .leftJoin('employees as e', 'ar.employee_id', 'e.employee_id')
    .where('ar.work_date', targetDate)
    .select('ar.*', 'e.full_name', 'e.department', 'e.position');
};

// ─────────────────────────────────────────────────────────────
// Leave Requests
// ─────────────────────────────────────────────────────────────
const createLeaveRequest = async (data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const [id] = await db('leave_requests').insert({
    employee_id: data.employeeId,
    leave_type_id: data.leaveTypeId || null,
    leave_type: data.leaveType || 'Annual Leave',
    start_date: data.startDate,
    end_date: data.endDate,
    total_days: totalDays,
    reason: data.reason,
    status: 'Pending',
  });
  return id;
};

const getLeaveRequests = async (params = {}) => {
  let query = db('leave_requests as lr')
    .leftJoin('employees as e', 'lr.employee_id', 'e.employee_id')
    .leftJoin('leave_types as lt', 'lr.leave_type_id', 'lt.id')
    .select('lr.*', 'e.full_name', 'e.department', 'lt.name as leave_type_name', 'lt.is_paid');
  if (params.employeeId) query = query.where('lr.employee_id', params.employeeId);
  if (params.status) query = query.where('lr.status', params.status);
  return query.orderBy('lr.created_at', 'desc');
};

const approveLeave = async (id, reviewerId, status, rejectionReason) => {
  const update = { status, reviewed_by: reviewerId, updated_at: db.fn.now() };
  if (rejectionReason) update.rejection_reason = rejectionReason;
  await db('leave_requests').where('id', id).update(update);
};

// ─────────────────────────────────────────────────────────────
// HR Summary (for dashboard)
// ─────────────────────────────────────────────────────────────
const getHRSummary = async () => {
  const today = new Date().toISOString().split('T')[0];
  const [total, active, inactive, deptBreakdown, presentToday, pendingLeaves, totalSalary] = await Promise.all([
    db('hr_employees').count('employee_id as count').first(),
    db('hr_employees').where('employment_status', 'Active').count('employee_id as count').first(),
    db('hr_employees').where('employment_status', '!=', 'Active').count('employee_id as count').first(),
    db('hr_employees as e')
      .leftJoin('hr_departments as d', 'e.dept_id', 'd.dept_id')
      .select('d.dept_name as department')
      .count('e.employee_id as count')
      .groupBy('e.dept_id', 'd.dept_name'),
    db('etp_daily_attendance').where('attendance_date', today).where('attendance_status', 'Present').countDistinct('employee_id as count').first(),
    db('leave_requests').where('status', 'pending').count('id as count').first(),
    db('hr_employees').where('employment_status', 'Active').sum('base_salary as total').first(),
  ]);
  const onLeave = await db('etp_daily_attendance').where('attendance_date', today).where('attendance_status', 'On Leave').countDistinct('employee_id as count').first();

  return {
    totalEmployees: parseInt(total.count),
    activeEmployees: parseInt(active.count),
    onLeaveCount: parseInt(onLeave.count),
    inactiveCount: parseInt(inactive.count),
    departmentBreakdown: deptBreakdown.map(d => ({ department: d.department || 'Unknown', count: parseInt(d.count) })),
    presentToday: parseInt(presentToday.count),
    pendingLeaves: parseInt(pendingLeaves.count),
    totalMonthlySalary: parseFloat(totalSalary.total || 0),
  };
};

// ─────────────────────────────────────────────────────────────
// Payroll
// ─────────────────────────────────────────────────────────────
const calculatePayroll = async (month) => {
  const employees = await db('employees').where('status', 'Active');
  const items = [];
  let totalBase = 0, totalBonus = 0, totalDed = 0, totalNet = 0;
  const [yearStr, monthStr] = month.split('-');
  const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
  const workDaysPerMonth = 22;

  for (const emp of employees) {
    const dailyRate = parseFloat(emp.base_salary) / workDaysPerMonth;
    const startDate = `${month}-01`;
    const endDate = `${month}-${daysInMonth}`;

    // Get attendance records for this month
    const attendanceRecords = await db('attendance_records')
      .where('employee_id', emp.employee_id)
      .whereBetween('work_date', [startDate, endDate])
      .orderBy('work_date', 'asc');

    const daysPresent = new Set();
    for (const r of attendanceRecords) {
      if (r.action === 'CLOCK_IN') daysPresent.add(r.work_date);
    }

    // Get approved leaves for this month
    const leaveDays = await db('leave_requests')
      .leftJoin('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
      .where('leave_requests.employee_id', emp.employee_id)
      .where('leave_requests.status', 'Approved')
      .whereBetween('leave_requests.start_date', [startDate, endDate])
      .select('leave_requests.*', 'leave_types.is_paid');

    let totalPresent = daysPresent.size;
    let daysPaid = totalPresent;

    for (const l of leaveDays) {
      const ld = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1;
      if (l.is_paid) daysPaid += ld;
    }

    const daysAbsent = Math.max(0, workDaysPerMonth - daysPaid);
    const absenceDeduction = daysAbsent * dailyRate;
    const standingDed = parseFloat(emp.standing_deduction) || 0;
    const totalDeductions = absenceDeduction + standingDed;
    const totalBonuses = parseFloat(emp.allowance) || 0;
    const netSalary = Math.max(0, parseFloat(emp.base_salary) + totalBonuses - totalDeductions);

    items.push({
      employee_id: emp.employee_id,
      base_salary: emp.base_salary,
      daily_rate: Math.round(dailyRate * 100) / 100,
      days_present: totalPresent,
      days_absent: daysAbsent,
      absence_deduction: Math.round(absenceDeduction),
      standing_deduction: standingDed,
      performance_bonus: totalBonuses,
      net_salary: Math.round(netSalary),
    });
    totalBase += parseFloat(emp.base_salary);
    totalBonus += totalBonuses;
    totalDed += totalDeductions;
    totalNet += netSalary;
  }

  // Insert or update payroll record
  const existing = await db('payroll').where('month', month).first();
  let payrollId;
  if (existing) {
    await db('payroll').where('month', month).update({
      status: 'Draft',
      total_base_salary: Math.round(totalBase),
      total_bonus: Math.round(totalBonus),
      total_deduction: Math.round(totalDed),
      total_net: Math.round(totalNet),
      employee_count: items.length,
      updated_at: db.fn.now(),
    });
    payrollId = existing.id;
    await db('payroll_items').where('payroll_id', payrollId).delete();
  } else {
    [payrollId] = await db('payroll').insert({
      month,
      status: 'Draft',
      total_base_salary: Math.round(totalBase),
      total_bonus: Math.round(totalBonus),
      total_deduction: Math.round(totalDed),
      total_net: Math.round(totalNet),
      employee_count: items.length,
    });
  }

  for (const item of items) {
    await db('payroll_items').insert({ ...item, payroll_id: payrollId });
  }

  return { payrollId, totalNet: Math.round(totalNet), employeeCount: items.length };
};

const getPayroll = async (month) => {
  const p = await db('payroll').where('month', month).first();
  if (!p) return null;
  const items = await db('payroll_items as pi')
    .leftJoin('employees as e', 'pi.employee_id', 'e.employee_id')
    .select('pi.*', 'e.full_name', 'e.department', 'e.position', 'e.payment_method', 'e.bank_account')
    .where('pi.payroll_id', p.id);
  return { ...p, items };
};

const sendPayrollToFinance = async (month, userId) => {
  await db('payroll').where('month', month).update({
    status: 'Sent',
    created_by: userId,
    sent_to_finance_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
};

const approvePayroll = async (month, userId) => {
  await db('payroll').where('month', month).update({
    status: 'Finance Approved',
    finance_approved_by: userId,
    approved_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
};

const markPayrollPaid = async (month, paymentMethod) => {
  await db('payroll').where('month', month).update({
    status: 'Paid',
    payment_method: paymentMethod,
    paid_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
};

// ─────────────────────────────────────────────────────────────
// Manager Accuracy Report (CEO view)
// ─────────────────────────────────────────────────────────────
const getManagerAccuracyReport = async () => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const startOfMonth = `${currentMonth}-01`;

  // Get managers from hr_employees (those with direct reports)
  const managerRows = await db('hr_employees as e')
    .join('hr_employees as sub', 'e.employee_id', 'sub.direct_manager_id')
    .where('e.employment_status', 'Active')
    .select('e.employee_id', 'e.full_name', 'e.dept_id')
    .groupBy('e.employee_id', 'e.full_name', 'e.dept_id');

  const report = [];
  for (const m of managerRows) {
    const team = await db('hr_employees').where('direct_manager_id', m.employee_id).where('employment_status', 'Active');
    if (team.length === 0) continue;
    let totalPresent = 0, totalDays = 0;
    for (const t of team) {
      const att = await db('etp_daily_attendance')
        .where('employee_id', t.employee_id)
        .whereBetween('attendance_date', [startOfMonth, today])
        .where('attendance_status', 'Present')
        .sum('net_work_hours as hrs').first();
      if (att && parseFloat(att.hrs || 0) > 0) totalPresent++;
      totalDays++;
    }
    const workingDays = Math.max(totalDays, 1);
    const presentPct = Math.round((totalPresent / workingDays) * 100);
    const absencePct = 100 - presentPct;
    report.push({
      managerName: m.full_name,
      department: m.dept_id,
      fieldStaffCount: team.length,
      avgPresentPct: presentPct,
      absencePct,
      flagged: absencePct > 15,
    });
  }
  return report;
};

module.exports = {
  createEmployee, updateEmployee, getEmployees, getEmployeeById,
  authenticateEmployee, isComputerRegistered, registerClock,
  getTodayAttendance, getMonthlyAttendance, getDailyAttendances,
  registerComputer, getRegisteredComputers,
  createLeaveRequest, getLeaveRequests, approveLeave,
  getHRSummary, calculatePayroll, getPayroll,
  sendPayrollToFinance, approvePayroll, markPayrollPaid,
  getManagerAccuracyReport,
  getAttritionData, getCompensationData, getSuccessionPipeline, getDEIMetrics,
};

// ---- NEW HR DASHBOARD SERVICES ----
const getTodayActivities = async () => {
  const today = new Date().toISOString().split('T')[0];
  const logs = await db('attendance_records').where('work_date', today).orderBy('timestamp', 'desc').limit(50);
  const leaves = await db('leave_requests').where('created_at', '>=', today).limit(20);
  return { logs, leaves };
};

const getDepartments = async () => {
  return db('hr_departments');
};

const createDepartment = async (data) => {
  const [id] = await db('hr_departments').insert(data);
  return id;
};

const updateDepartment = async (id, data) => {
  await db('hr_departments').where('dept_id', id).update(data);
};

const updateEmployeeStatus = async (id, data) => {
  await db('hr_employees').where('employee_id', id).update({ employment_status: data.status });
};

const getAttendanceHistory = async (params) => {
  let query = db('attendance_records as ar')
    .leftJoin('hr_employees as e', 'ar.employee_id', 'e.employee_id')
    .select('ar.*', 'e.full_name as employeeName', 'e.dept_id');
  return query.orderBy('ar.timestamp', 'desc').limit(100);
};

const getAbsences = async (params) => {
  let query = db('leave_requests as lr')
    .leftJoin('hr_employees as e', 'lr.employee_id', 'e.employee_id')
    .select('lr.*', 'e.full_name as employeeName', 'e.dept_id')
    .where('lr.leave_type', 'Unpaid');
  return query.orderBy('lr.created_at', 'desc');
};

const createAbsence = async (data) => {
  const [id] = await db('leave_requests').insert({
    employee_id: data.employeeId,
    start_date: data.date,
    end_date: data.date,
    reason: data.reason,
    status: 'Approved',
    leave_type: 'Unpaid',
    total_days: 1
  });
  return id;
};

const getReports = async (params) => {
  return {
    metrics: {
      totalWorkDays: 22,
      totalPresent: 180,
      totalAbsent: 10,
      totalLate: 5,
      attendanceRate: 95,
      leaveUsage: 15
    },
    monthlyTrends: [
      { month: 'Jan', present: 200, absent: 10 },
      { month: 'Feb', present: 195, absent: 15 },
      { month: 'Mar', present: 210, absent: 5 }
    ]
  };
};

module.exports.getTodayActivities = getTodayActivities;
module.exports.getDepartments = getDepartments;
module.exports.createDepartment = createDepartment;
module.exports.updateDepartment = updateDepartment;
module.exports.updateEmployeeStatus = updateEmployeeStatus;
module.exports.getAttendanceHistory = getAttendanceHistory;
module.exports.getAbsences = getAbsences;
module.exports.createAbsence = createAbsence;
module.exports.getReports = getReports;

// ---- EXTENDED HR DASHBOARD SERVICES (Menus 12-22) ----

// Payroll Mocks
let mockDeductions = [];
let mockPayslips = [];
let mockJobs = [];
let mockApplications = [];
let mockInterviews = [];
let mockEvaluations = [];
let mockReviews = [];
let mockFeedback = [];

const getSalaries = async (params) => {
  let query = db('hr_employees').select('employee_id', 'full_name', 'dept_id', 'position_id', 'base_salary', 'allowance', 'standing_deduction', 'payment_method', 'bank_account_number');
  if (params.department) query = query.where('dept_id', params.department);
  const emps = await query;
  return emps.map(e => ({
    id: e.employee_id,
    name: e.full_name,
    department: e.dept_id,
    role: e.position_id,
    baseSalary: parseFloat(e.base_salary || 0),
    allowances: parseFloat(e.allowance || 0),
    deductions: parseFloat(e.standing_deduction || 0),
    netSalary: parseFloat(e.base_salary || 0) + parseFloat(e.allowance || 0) - parseFloat(e.standing_deduction || 0),
    paymentMethod: e.payment_method || 'Bank Transfer',
    bankAccount: e.bank_account_number || 'N/A'
  }));
};

const updateSalary = async (id, data) => {
  await db('hr_employees').where('employee_id', id).update({
    base_salary: data.baseSalary,
    allowance: data.allowances,
    standing_deduction: data.deductions
  });
};

const getPayrollPeriods = async () => {
  return [
    { id: 1, month: '06', year: '2026', status: 'Finalized' },
    { id: 2, month: '07', year: '2026', status: 'Draft' }
  ];
};

const processPayroll = async (data) => {
  return {
    id: Date.now().toString(),
    month: data.month,
    year: data.year,
    summary: { totalEmployees: 145, gross: 450000, deductions: 50000, net: 400000, tax: 25000 },
    status: 'Processed'
  };
};

const approvePayrollProcess = async (id) => { return true; };
const finalizePayrollProcess = async (id) => { return true; };

const getDeductions = async (params) => { return mockDeductions; };
const createDeduction = async (data) => {
  const newDed = { id: Date.now().toString(), ...data, status: 'Active' };
  mockDeductions.push(newDed);
  return newDed.id;
};
const updateDeduction = async (id, data) => {
  mockDeductions = mockDeductions.map(d => d.id === id ? { ...d, ...data } : d);
};
const deleteDeduction = async (id) => {
  mockDeductions = mockDeductions.filter(d => d.id !== id);
};

const getPayslips = async (params) => { return mockPayslips; };
const generatePayslips = async (data) => {
  mockPayslips.push({ id: Date.now().toString(), period: data.periodId, count: data.employeeIds?.length || 145, status: 'Draft' });
  return true;
};
const emailPayslip = async (id) => { return true; };

const getJobPosts = async (params) => { return mockJobs; };
const createJobPost = async (data) => {
  const newJob = { id: Date.now().toString(), ...data, status: 'Open', applicantCount: 0, postDate: new Date().toISOString() };
  mockJobs.push(newJob);
  return newJob.id;
};
const updateJobPost = async (id, data) => {
  mockJobs = mockJobs.map(j => j.id === id ? { ...j, ...data } : j);
};

const getApplications = async (params) => { return mockApplications; };
const updateApplicationStatus = async (id, status, reason) => {
  mockApplications = mockApplications.map(a => a.id === id ? { ...a, status, rejectReason: reason } : a);
};

const getInterviews = async (params) => { return mockInterviews; };
const createInterview = async (data) => {
  const newInt = { id: Date.now().toString(), ...data, status: 'Scheduled' };
  mockInterviews.push(newInt);
  return newInt.id;
};
const updateInterview = async (id, data) => {
  mockInterviews = mockInterviews.map(i => i.id === id ? { ...i, ...data } : i);
};

const getRecruitmentPipeline = async (params) => {
  return {
    applied: mockApplications.filter(a => a.status === 'New').length || 12,
    shortlisted: mockApplications.filter(a => a.status === 'Shortlisted').length || 5,
    interviewed: mockInterviews.length || 3,
    offered: 1,
    hired: 1,
    rejected: 2
  };
};

const hireCandidate = async (applicationId) => {
  // Mock auto-create employee
  const empId = 'EMP-' + Date.now().toString().slice(-6);
  await db('hr_employees').insert({
    employee_id: empId,
    full_name: 'New Hire ' + empId,
    email: 'newhire@sutana.com',
    employment_status: 'Active'
  });
  return empId;
};

const getEvaluations = async (params) => { return mockEvaluations; };
const createEvaluation = async (data) => {
  const ev = { id: Date.now().toString(), ...data, status: 'Completed' };
  mockEvaluations.push(ev);
  return ev.id;
};

const getReviews = async (params) => { return mockReviews; };
const approveReview = async (id) => {
  mockReviews = mockReviews.map(r => r.id === id ? { ...r, status: 'Approved' } : r);
};

const getFeedback = async (params, user) => {
  return mockFeedback.filter(f => !f.confidential || f.toId === user?.id || f.fromId === user?.id);
};
const submitFeedback = async (data, user) => {
  const f = { id: Date.now().toString(), ...data, fromId: user?.id, date: new Date().toISOString(), status: 'New' };
  mockFeedback.push(f);
  return f.id;
};
const acknowledgeFeedback = async (id) => {
  mockFeedback = mockFeedback.map(f => f.id === id ? { ...f, status: 'Acknowledged' } : f);
};

Object.assign(module.exports, {
  getSalaries, updateSalary, getPayrollPeriods, processPayroll, approvePayrollProcess, finalizePayrollProcess,
  getDeductions, createDeduction, updateDeduction, deleteDeduction,
  getPayslips, generatePayslips, emailPayslip,
  getJobPosts, createJobPost, updateJobPost,
  getApplications, updateApplicationStatus,
  getInterviews, createInterview, updateInterview,
  getRecruitmentPipeline, hireCandidate,
  getEvaluations, createEvaluation, getReviews, approveReview, getFeedback, submitFeedback, acknowledgeFeedback
});

// ---- FINAL HR DASHBOARD SERVICES (Menus 23-28) ----

let mockContracts = [];
let mockFiles = [];
let mockPolicies = [];
let mockAnnouncements = [];
let mockNotices = [];
let mockMessages = [];

// Contracts
const getContracts = async (params) => {
  return mockContracts;
};

const createContract = async (data) => {
  const contractId = Date.now().toString();
  const c = { id: contractId, ...data, status: 'Active', created_at: new Date().toISOString() };
  mockContracts.push(c);
  // Cross-module integration: Update base_salary if possible
  if (data.employeeId && data.baseSalary) {
    await db('hr_employees').where('employee_id', data.employeeId).update({ base_salary: data.baseSalary });
  }
  return contractId;
};

const approveContract = async (id) => {
  mockContracts = mockContracts.map(c => c.id === id ? { ...c, status: 'Active' } : c);
};

const renewContract = async (id, data) => {
  const oldContract = mockContracts.find(c => c.id === id);
  if (oldContract) {
    oldContract.status = 'Expired';
  }
  const newId = Date.now().toString();
  const c = { id: newId, ...oldContract, ...data, previousContractId: id, status: 'Active', created_at: new Date().toISOString() };
  mockContracts.push(c);
  return newId;
};

const terminateContract = async (id, reason) => {
  mockContracts = mockContracts.map(c => c.id === id ? { ...c, status: 'Terminated', terminateReason: reason } : c);
};

// Files
const getEmployeeFiles = async (params, user) => {
  // Medical and Disciplinary records restricted to HR Manager role
  const isHRManager = user && user.role === 'HR Manager';
  return mockFiles.filter(f => {
    if ((f.documentType === 'Medical Records' || f.documentType === 'Disciplinary Records') && !isHRManager) {
      return false;
    }
    return true;
  });
};

const uploadEmployeeFile = async (data) => {
  // Handle versioning
  const existingFiles = mockFiles.filter(f => f.employeeId === data.employeeId && f.documentType === data.documentType);
  const v = existingFiles.length + 1;
  const fileId = Date.now().toString();
  mockFiles.push({ id: fileId, ...data, version: v, status: 'Active', uploadDate: new Date().toISOString() });
  return fileId;
};

const deleteEmployeeFile = async (id) => {
  mockFiles = mockFiles.filter(f => f.id !== id);
};

const archiveEmployeeFile = async (id) => {
  mockFiles = mockFiles.map(f => f.id === id ? { ...f, status: 'Archived' } : f);
};

// Policies
const getPolicies = async (params) => {
  return mockPolicies;
};

const createPolicy = async (data) => {
  const pId = Date.now().toString();
  mockPolicies.push({ id: pId, ...data, version: 1, status: 'Draft', created_at: new Date().toISOString() });
  return pId;
};

const updatePolicy = async (id, data) => {
  mockPolicies = mockPolicies.map(p => p.id === id ? { ...p, ...data, version: p.version + 1, lastUpdated: new Date().toISOString() } : p);
};

const publishPolicy = async (id) => {
  mockPolicies = mockPolicies.map(p => p.id === id ? { ...p, status: 'Active', effectiveDate: new Date().toISOString() } : p);
};

const archivePolicy = async (id) => {
  mockPolicies = mockPolicies.map(p => p.id === id ? { ...p, status: 'Archived' } : p);
};

const sendPolicyToAll = async (id, userId) => {
  const p = mockPolicies.find(x => x.id === id);
  if (p) {
    // Cross-module integration: create an announcement
    mockAnnouncements.push({
      id: Date.now().toString(),
      title: `New Policy Published: ${p.policyName}`,
      content: `A new company policy has been published in the ${p.category} category. Please review it in the HR Policies section.`,
      importance: 'Important',
      targetAudience: 'All Employees',
      postedBy: userId,
      postedDate: new Date().toISOString(),
      status: 'Active',
      readCount: 0
    });
  }
};

// Announcements
const getAnnouncements = async (params) => {
  return mockAnnouncements;
};

const createAnnouncement = async (data, userId) => {
  const id = Date.now().toString();
  mockAnnouncements.push({ id, ...data, postedBy: userId, postedDate: new Date().toISOString(), status: 'Active', readCount: 0 });
  return id;
};

const updateAnnouncement = async (id, data) => {
  mockAnnouncements = mockAnnouncements.map(a => a.id === id ? { ...a, ...data } : a);
};

const deleteAnnouncement = async (id) => {
  mockAnnouncements = mockAnnouncements.filter(a => a.id !== id);
};

const readAnnouncement = async (id, userId) => {
  // Mock tracking
  mockAnnouncements = mockAnnouncements.map(a => a.id === id ? { ...a, readCount: (a.readCount || 0) + 1 } : a);
};

// Notices
const getNotices = async (params) => {
  return mockNotices;
};

const createNotice = async (data, userId) => {
  const id = Date.now().toString();
  mockNotices.push({ id, ...data, postedBy: userId, date: new Date().toISOString(), status: 'Draft' });
  return id;
};

const publishNotice = async (id) => {
  mockNotices = mockNotices.map(n => n.id === id ? { ...n, status: 'Published' } : n);
};

const deleteNotice = async (id) => {
  mockNotices = mockNotices.filter(n => n.id !== id);
};

// Messages
const getInboxMessages = async (userId) => {
  // Simplified mock: return all for demo if no direct routing implemented in mock
  return mockMessages.filter(m => !m.senderOnly);
};

const getSentMessages = async (userId) => {
  return mockMessages.filter(m => m.postedBy === userId || m.senderOnly);
};

const sendMessage = async (data, userId) => {
  const id = Date.now().toString();
  mockMessages.push({ id, ...data, postedBy: userId, date: new Date().toISOString(), status: 'Unread' });
  return id;
};

const readMessage = async (id, userId) => {
  mockMessages = mockMessages.map(m => m.id === id ? { ...m, status: 'Read' } : m);
};

const replyMessage = async (id, data, userId) => {
  const newId = Date.now().toString();
  mockMessages.push({ id: newId, ...data, postedBy: userId, date: new Date().toISOString(), status: 'Unread', parentId: id });
  return newId;
};

const deleteMessage = async (id, userId) => {
  mockMessages = mockMessages.filter(m => m.id !== id);
};

Object.assign(module.exports, {
  getContracts, createContract, approveContract, renewContract, terminateContract,
  getEmployeeFiles, uploadEmployeeFile, deleteEmployeeFile, archiveEmployeeFile,
  getPolicies, createPolicy, updatePolicy, publishPolicy, archivePolicy, sendPolicyToAll,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, readAnnouncement,
  getNotices, createNotice, publishNotice, deleteNotice,
  getInboxMessages, getSentMessages, sendMessage, readMessage, replyMessage, deleteMessage
});

