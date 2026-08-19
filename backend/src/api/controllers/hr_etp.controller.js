const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENTS
// ─────────────────────────────────────────────────────────────────────────────
exports.getDepartments = catchAsync(async (req, res) => {
  const depts = await db('departments').select('id as dept_id', 'name as dept_name').orderBy('name');
  res.json({ status: 'success', data: depts });
});

exports.createDepartment = catchAsync(async (req, res) => {
  const { dept_name, description } = req.body;
  const [id] = await db('departments').insert({ name: dept_name, description });
  res.status(201).json({ status: 'success', data: { dept_id: id } });
});

exports.updateDepartment = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('departments').where('id', id).update({ name: req.body.dept_name, description: req.body.description });
  res.json({ status: 'success', message: 'Department updated' });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNITS
// ─────────────────────────────────────────────────────────────────────────────
exports.getUnits = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: [] });
});

exports.createUnit = catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', data: { unit_id: 'UNIT-001' } });
});

// ─────────────────────────────────────────────────────────────────────────────
// POSITIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.getPositions = catchAsync(async (req, res) => {
  const positions = await db('roles').select('id as position_id', 'name as position_title').orderBy('name');
  res.json({ status: 'success', data: positions });
});

exports.createPosition = catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', data: { position_id: req.body.position_title } });
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES (ETP Master)
// ─────────────────────────────────────────────────────────────────────────────
exports.getETPEmployees = catchAsync(async (req, res) => {
  const { dept_id, status, search } = req.query;

  // ── 1. Fetch dedicated HR employee records ──────────────────────────────
  let q = db('hr_employees as e')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .leftJoin('roles as p', 'e.position_id', 'p.id')
    .leftJoin('users as u', 'e.personal_email', 'u.email');

  if (dept_id) q = q.where('e.dept_id', dept_id);
  if (status)  q = q.where('e.employment_status', status);
  if (search)  q = q.where(function() {
    this.where('e.full_name', 'like', `%${search}%`)
        .orWhere('e.employee_id', 'like', `%${search}%`);
  });

  const hrEmployees = await q.select('e.*', 'd.name as dept_name', 'p.name as position_title', 'u.profile_photo as user_photo').orderBy('e.full_name');
  
  // Tag them
  const results = hrEmployees.map(emp => ({ ...emp, _source: 'hr_employees' }));

  // ── 2. Fetch unregistered users from the users table ────────────────────
  if (!dept_id && !status) {
    const hrEmails = new Set(hrEmployees.map(e => e.personal_email).filter(Boolean));
    const hrIds = new Set(hrEmployees.map(e => e.employee_id).filter(Boolean));
    
    let uq = db('users');
    if (search) {
      uq = uq.where(function() {
        this.where('full_name', 'like', `%${search}%`)
            .orWhere('username', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`);
      });
    }
    
    const allUsers = await uq.select('*');
    const unregistered = allUsers.filter(u => !hrEmails.has(u.email) && !hrIds.has(u.id));
    
    unregistered.forEach(u => {
      results.push({
        _source: 'users_table',
        employee_id: u.id,
        full_name: u.full_name || u.username,
        personal_email: u.email,
        personal_phone: u.phone_number,
        dept_name: 'Unregistered',
        position_title: u.role || 'N/A',
        employment_status: 'Pending Registration',
        user_photo: u.profile_photo,
        gender: '',
        hire_date: u.created_at,
      });
    });
  }

  // Prevent browser caching — force fresh response every time
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  res.json({ status: 'success', data: results, total: results.length });
});

exports.getETPEmployee = catchAsync(async (req, res) => {
  const emp = await db('hr_employees as e')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .leftJoin('roles as p', 'e.position_id', 'p.id')
    .where('e.employee_id', req.params.id)
    .select('e.*', 'd.name as dept_name', 'p.name as position_title')
    .first();
  if (!emp) throw new AppError('Employee not found', 404);

  res.json({ status: 'success', data: emp });
});

exports.createETPEmployee = catchAsync(async (req, res) => {
  const rawBank = (req.body.bank_account_number || '').toString().trim();
  const bank_account_number = rawBank || null;
  const { full_name, national_id, gender, dept_id, position_id, base_salary, housing_allowance, transport_allowance, has_pc_access, shift_start_time, shift_end_time, phone, bank_name, payment_method, emergency_contact_name, emergency_contact_phone, marital_status, document_path, user_id } = req.body;
  const date_of_birth = (req.body.date_of_birth || '').trim() || null;
  const personal_email = (req.body.personal_email || '').trim() || null;
  const physical_address = (req.body.physical_address || '').trim() || null;

  // Education fields
  const education_level   = req.body.education_level || null;
  const institution_name  = req.body.institution_name || null;
  const field_of_study    = req.body.field_of_study || null;
  const graduation_year   = req.body.graduation_year || null;

  // ID photo paths from multer (set by route middleware)
  const id_photo_front = req.files?.id_photo_front?.[0]?.path || req.body.id_photo_front || null;
  const id_photo_back  = req.files?.id_photo_back?.[0]?.path  || req.body.id_photo_back  || null;

  if (bank_account_number) {
    const existingBank = await db('hr_employees').where('bank_account_number', bank_account_number).first();
    if (existingBank) throw new AppError('Bank account number is already registered to another employee', 400);
  }

  const count = await db('hr_employees').count('employee_id as c').first();
  const employee_id = `EMP-2026-${String(parseInt(count.c || 0) + 1).padStart(3, '0')}`;

  await db('hr_employees').insert({
    employee_id, full_name, national_id, gender,
    dept_id, position_id,
    base_salary: base_salary || 0,
    housing_allowance: housing_allowance || 0,
    transport_allowance: transport_allowance || 0,
    bank_name: bank_name || null,
    bank_account_number: bank_account_number || null,
    payment_method: payment_method || 'Bank Transfer',
    emergency_contact_name: emergency_contact_name || null,
    emergency_contact_phone: emergency_contact_phone || null,
    has_pc_access: has_pc_access || 'No',
    shift_start_time: shift_start_time || '09:00',
    shift_end_time: shift_end_time || '18:00',
    weekly_off_days: 'Friday,Saturday',
    personal_phone: phone || req.body.personal_phone,
    physical_address: physical_address,
    personal_email: personal_email || `${employee_id}@sutana.com`,
    employment_status: 'Inactive',
    registration_status: 'pending_approval',
    employment_type: req.body.employment_type || 'Permanent',
    date_of_birth: date_of_birth || null,
    marital_status: marital_status || 'Single',
    document_path: document_path || null,
    hire_date: req.body.hire_date || new Date(),
    overtime_rate: 1.5,
    // Education
    education_level, institution_name, field_of_study, graduation_year,
    // ID photos & Link
    id_photo_front, id_photo_back, user_id: user_id || null
  });

  res.status(201).json({ status: 'success', data: { employee_id } });
});

exports.updateETPEmployee = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = {};
  const nullableFields = ['date_of_birth', 'bank_account_number', 'bank_name', 'national_id',
    'physical_address', 'personal_email', 'emergency_contact_name', 'emergency_contact_phone',
    'document_path', 'housing_allowance', 'transport_allowance', 'overtime_rate',
    'education_level', 'institution_name', 'field_of_study', 'graduation_year',
    'id_photo_front', 'id_photo_back'];
  const fields = ['full_name', 'national_id', 'gender', 'dept_id', 'position_id',
    'base_salary', 'housing_allowance', 'transport_allowance', 'has_pc_access',
    'shift_start_time', 'shift_end_time', 'employment_status', 'employment_type',
    'personal_phone', 'physical_address', 'personal_email', 'overtime_rate', 'bank_name', 'bank_account_number', 'payment_method',
    'emergency_contact_name', 'emergency_contact_phone', 'date_of_birth', 'marital_status', 'document_path',
    'registration_status', 'hire_date',
    'education_level', 'institution_name', 'field_of_study', 'graduation_year',
    'id_photo_front', 'id_photo_back'];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      const val = typeof req.body[f] === 'string' ? req.body[f].trim() : req.body[f];
      if (val === '' && nullableFields.includes(f)) {
        updates[f] = null;
      } else {
        updates[f] = val;
      }
    }
  }
  if (req.body.phone) updates.personal_phone = req.body.phone;

  // Handle ID photo uploads from multer (multipart)
  if (req.files?.id_photo_front?.[0]) updates.id_photo_front = req.files.id_photo_front[0].path.replace(/\\/g, '/');
  if (req.files?.id_photo_back?.[0])  updates.id_photo_back  = req.files.id_photo_back[0].path.replace(/\\/g, '/');
  // Handle document file upload — override any body-sent path with the real saved path
  if (req.files?.document_file?.[0])  updates.document_path  = req.files.document_file[0].path.replace(/\\/g, '/');

  // Only check bank duplicate if a non-empty bank account is being set
  if (updates.bank_account_number) {
    const existingBank = await db('hr_employees')
      .where('bank_account_number', updates.bank_account_number)
      .andWhereNot('employee_id', id)
      .first();
    if (existingBank) throw new AppError('Bank account number is already registered to another employee', 400);
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ status: 'fail', message: 'No fields to update' });
  await db('hr_employees').where('employee_id', id).update(updates);
  res.json({ status: 'success', message: 'Employee updated' });
});

exports.deleteETPEmployee = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('hr_employees').where('employee_id', id).update({ employment_status: 'Terminated' });
  await db('hr_notifications_log').insert({
    rule_id: 'R-004',
    notification_message: `Employee ${id} has been terminated.`,
    priority: 'MEDIUM', status: 'Pending', recipient_user: 'CEO', sent_date: db.fn.now(),
  });
  res.json({ status: 'success', message: 'Employee terminated' });
});

exports.terminateEmployee = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('hr_employees').where('employee_id', id).update({ employment_status: 'Terminated' });
  res.json({ status: 'success', message: 'Employee terminated' });
});

// ─────────────────────────────────────────────────────────────────────────────
// ETP HEARTBEAT (Public - called by PC Agent)
// ─────────────────────────────────────────────────────────────────────────────
exports.heartbeat = catchAsync(async (req, res) => {
  const { employee_id, pc_name, mac_address, ip_address, status } = req.body;
  if (!employee_id) throw new AppError('employee_id required', 400);

  await db('etp_heartbeat_logs').insert({
    employee_id,
    heartbeat_time: db.fn.now(),
    status: status || 'Online',
    active_minutes: req.body.active_minutes || 0,
    idle_minutes: req.body.idle_minutes || 0,
  });

  // Update agent last_heartbeat
  await db('etp_agent_installations')
    .where('employee_id', employee_id)
    .update({ last_heartbeat: db.fn.now(), ip_address, status: 'Active' });

  res.json({ status: 'success', message: 'Heartbeat recorded' });
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
exports.getDailyAttendance = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { date = today, dept_id } = req.query;

  // Get all active employees
  let empQuery = db('hr_employees as e')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .leftJoin('roles as p', 'e.position_id', 'p.id')
    .select('e.*', 'd.name as dept_name', 'p.name as position_title')
    .where('e.employment_status', 'Active');
  if (dept_id) empQuery = empQuery.where('e.dept_id', dept_id);
  const employees = await empQuery;

  // Get heartbeats from last 15 minutes for online status
  const cutoff15 = new Date(Date.now() - 15 * 60 * 1000);
  const cutoff2h  = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const recentHeartbeats = await db('etp_heartbeat_logs')
    .where('heartbeat_time', '>=', cutoff2h)
    .select('employee_id', db.raw('MAX(heartbeat_time) as last_seen'), db.raw('MAX(status) as last_status'))
    .groupBy('employee_id');

  const heartbeatMap = {};
  for (const hb of recentHeartbeats) {
    heartbeatMap[hb.employee_id] = hb;
  }

  // Get today's attendance records
  const todayRecords = await db('etp_daily_attendance').where('attendance_date', date);
  const attendanceMap = {};
  for (const rec of todayRecords) {
    attendanceMap[rec.employee_id] = rec;
  }

  // Build response
  const result = employees.map(emp => {
    const hb = heartbeatMap[emp.employee_id];
    const att = attendanceMap[emp.employee_id];
    const webActive = emp.last_web_active ? new Date(emp.last_web_active) : null;
    const lastHbSeen = hb ? new Date(hb.last_seen) : null;

    let bestLastSeen = null;
    if (webActive && lastHbSeen) {
      bestLastSeen = webActive > lastHbSeen ? webActive : lastHbSeen;
    } else {
      bestLastSeen = webActive || lastHbSeen;
    }

    let onlineStatus = 'Offline';
    if (bestLastSeen) {
      if (bestLastSeen >= cutoff15) onlineStatus = 'Online';
      else if (bestLastSeen >= cutoff2h) onlineStatus = 'Idle';
    }
    return {
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      phone: emp.phone || emp.personal_phone || '',
      dept_name: emp.dept_name || '',
      position_title: emp.position_title || '',
      has_pc_access: emp.has_pc_access,
      shift_start_time: emp.shift_start_time,
      shift_end_time: emp.shift_end_time,
      online_status: onlineStatus,
      last_seen: bestLastSeen,
      attendance_status: att?.attendance_status || 'Not Recorded',
      net_work_hours: att?.net_work_hours || 0,
      late_minutes: att?.late_minutes || 0,
      overtime_hours: att?.overtime_hours || 0,
      clock_in: att?.actual_start_time || null,
      clock_out: att?.actual_end_time || null,
      is_manual_override: att?.is_manual_override || 'No',
    };
  });

  const summary = {
    total: result.length,
    online: result.filter(r => r.online_status === 'Online').length,
    idle: result.filter(r => r.online_status === 'Idle').length,
    offline: result.filter(r => r.online_status === 'Offline').length,
    present: result.filter(r => r.attendance_status === 'Present').length,
    absent: result.filter(r => r.attendance_status === 'Absent').length,
  };

  res.json({ status: 'success', data: { employees: result, summary, date } });
});

exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const { month, year, dept_id } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  let q = db('etp_monthly_summary as ms')
    .join('hr_employees as e', 'ms.employee_id', 'e.employee_id')
    .leftJoin('hr_departments as d', 'e.dept_id', 'd.dept_id')
    .where('ms.month_number', m)
    .where('ms.year_number', y)
    .select('ms.*', 'e.full_name', 'e.dept_id', 'd.dept_name', 'e.position_id');

  if (dept_id) q = q.where('e.dept_id', dept_id);

  const records = await q.orderBy('e.full_name');
  res.json({ status: 'success', data: records });
});

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL ENTRY
// ─────────────────────────────────────────────────────────────────────────────
exports.submitManualEntry = catchAsync(async (req, res) => {
  const { month, year, dept_id, entries } = req.body;
  if (!entries || !Array.isArray(entries)) throw new AppError('entries array required', 400);

  const insertedSessions = [];
  for (const entry of entries) {
    const { employee_id, days_worked, days_absent, overtime_hours, notes } = entry;

    // Create session log as manual entry
    const [sessionId] = await db('etp_session_logs').insert({
      employee_id,
      log_date: `${year}-${String(month).padStart(2, '0')}-01`,
      total_active_seconds: days_worked * 8 * 3600,
      total_idle_seconds: 0,
      source_type: 'MANUAL_ENTRY',
      is_override: 'Yes',
      override_reason: notes || 'Manual monthly entry',
      entry_by: req.user?.email || 'manager',
      entry_date: db.fn.now(),
    });

    // Create/update monthly summary
    const existing = await db('etp_monthly_summary')
      .where({ employee_id, month_number: month, year_number: year })
      .first();

    if (existing) {
      await db('etp_monthly_summary').where('summary_id', existing.summary_id).update({
        total_worked_hours: days_worked * 8,
        total_absent_days: days_absent,
        total_overtime_hours: overtime_hours || 0,
        calculated_date: db.fn.now(),
      });
    } else {
      await db('etp_monthly_summary').insert({
        employee_id,
        month_number: month,
        year_number: year,
        total_worked_hours: days_worked * 8,
        total_absent_days: days_absent,
        total_overtime_hours: overtime_hours || 0,
        calculated_date: db.fn.now(),
      });
    }

    insertedSessions.push(sessionId);
  }

  // Fire HR notification
  await db('hr_notifications_log').insert({
    rule_id: 'R-005',
    dept_id,
    notification_message: `Manual attendance entries submitted for ${month}/${year}. Total employees: ${entries.length}.`,
    priority: 'MEDIUM',
    status: 'Pending',
    recipient_user: 'CEO',
    sent_date: db.fn.now(),
  });

  res.json({ status: 'success', message: `${entries.length} entries recorded`, data: { count: insertedSessions.length } });
});

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL
// ─────────────────────────────────────────────────────────────────────────────
exports.calculatePayroll = catchAsync(async (req, res) => {
  const { month, year } = req.body;
  const m = parseInt(month);
  const y = parseInt(year);

  const employees = await db('hr_employees')
    .where('employment_status', 'Active')
    .whereIn('registration_status', ['ceo_approved', 'completed']);

  const validEmployeeIds = employees.map(e => e.employee_id);

  // Remove any previously calculated draft records for employees that are no longer eligible
  if (validEmployeeIds.length > 0) {
    await db('payroll_salary_components')
      .where({ month_number: m, year_number: y })
      .whereNotIn('employee_id', validEmployeeIds)
      .del();
  } else {
    await db('payroll_salary_components')
      .where({ month_number: m, year_number: y })
      .del();
  }
  let companyGross = 0, companyNet = 0, companyOT = 0, companyDeductions = 0;
  let companyHours = 0, companyLate = 0, companyAbsent = 0;

  const deptMap = {};

  const activeDeductions = await db('hr_deductions').where('status', 'Active');
  const deductionMap = {};
  for (const d of activeDeductions) {
    if (!deductionMap[d.employee_id]) deductionMap[d.employee_id] = { tax: 0, pension: 0, loan: 0 };
    // For percentage-based deductions, we store the percentage and recompute at payroll time
    // to always use the current base salary (handled per-employee below)
    // For fixed, just use the stored amount
    const deductionEntry = { ...d, resolvedAmount: parseFloat(d.amount || 0) };
    if (!deductionMap[d.employee_id]._raw) deductionMap[d.employee_id]._raw = [];
    deductionMap[d.employee_id]._raw.push(deductionEntry);
  }

  for (const emp of employees) {
    const summary = await db('etp_monthly_summary')
      .where({ employee_id: emp.employee_id, month_number: m, year_number: y })
      .first();

    const workedHours = summary?.total_worked_hours || 0;
    const lateMinutes = summary?.total_late_minutes || 0;
    const absentDays  = summary?.total_absent_days || 0;
    const overtimeHrs = summary?.total_overtime_hours || 0;

    const workingDays = 26; // approx
    const dailyRate   = parseFloat(emp.base_salary) / workingDays;
    const hourlyRate  = dailyRate / 8;
    const overtimePay = overtimeHrs * hourlyRate * parseFloat(emp.overtime_rate || 1.5);
    const absentDed   = absentDays * dailyRate;
    const lateDed     = (lateMinutes / 60) * hourlyRate;
    
    const empDeds = deductionMap[emp.employee_id] || {};
    const rawDeds = empDeds._raw || [];
    const empBaseSalary = parseFloat(emp.base_salary) || 0;

    // Resolve each deduction (percentage uses current base salary)
    let taxDed = 0, pensionDed = 0, manualDeductions = 0;
    for (const d of rawDeds) {
      let amt = parseFloat(d.amount || 0);
      if (d.amount_type === 'Percentage' && d.percentage != null) {
        amt = (empBaseSalary * parseFloat(d.percentage)) / 100;
      }
      if (d.type === 'Tax/PAYE') taxDed += amt;
      else if (d.type === 'Pension') pensionDed += amt;
      else manualDeductions += amt;
    }

    const gross = parseFloat(emp.base_salary) + parseFloat(emp.housing_allowance || 0)
                + parseFloat(emp.transport_allowance || 0) + parseFloat(emp.communication_allowance || 0)
                + overtimePay;
    const deductions = absentDed + lateDed + pensionDed + taxDed + manualDeductions;
    const net = Math.max(0, gross - deductions);

    // Upsert salary component
    const existing = await db('payroll_salary_components')
      .where({ employee_id: emp.employee_id, month_number: m, year_number: y }).first();

    const payrollData = {
      employee_id: emp.employee_id, month_number: m, year_number: y,
      base_salary: emp.base_salary, housing_allowance: emp.housing_allowance || 0,
      transport_allowance: emp.transport_allowance || 0, communication_allowance: emp.communication_allowance || 0,
      overtime_pay: overtimePay, deduction_absent: absentDed, deduction_pension: pensionDed,
      deduction_tax: taxDed, deduction_loan: manualDeductions, gross_pay: gross, net_pay: net, status: 'Draft',
      calculated_date: db.fn.now(),
    };
    if (existing) await db('payroll_salary_components').where('component_id', existing.component_id).update(payrollData);
    else await db('payroll_salary_components').insert(payrollData);

    // Accumulate
    companyGross += gross; companyNet += net; companyOT += overtimePay;
    companyDeductions += deductions; companyHours += workedHours;
    companyLate += lateMinutes / 60; companyAbsent += absentDays;

    if (!deptMap[emp.dept_id]) deptMap[emp.dept_id] = { count: 0, gross: 0, net: 0, ot: 0, ded: 0, hours: 0, late: 0, absent: 0 };
    deptMap[emp.dept_id].count++; deptMap[emp.dept_id].gross += gross; deptMap[emp.dept_id].net += net;
    deptMap[emp.dept_id].ot += overtimePay; deptMap[emp.dept_id].ded += deductions;
    deptMap[emp.dept_id].hours += workedHours; deptMap[emp.dept_id].late += lateMinutes / 60;
    deptMap[emp.dept_id].absent += absentDays;
  }

  // Department aggregation
  for (const [deptId, agg] of Object.entries(deptMap)) {
    const ex = await db('payroll_department_aggregation').where({ dept_id: deptId, month_number: m, year_number: y }).first();
    const row = { dept_id: deptId, month_number: m, year_number: y, employee_count: agg.count,
      total_gross_pay: agg.gross, total_net_pay: agg.net, total_overtime_pay: agg.ot,
      total_deductions: agg.ded, total_worked_hours: agg.hours, total_late_hours: agg.late,
      total_absent_days: agg.absent, calculated_date: db.fn.now() };
    if (ex) await db('payroll_department_aggregation').where('agg_id', ex.agg_id).update(row);
    else await db('payroll_department_aggregation').insert(row);
  }

  // Company aggregation
  const compEx = await db('payroll_company_aggregation').where({ month_number: m, year_number: y }).first();
  const compRow = { month_number: m, year_number: y, total_employees: employees.length,
    company_gross_pay: companyGross, company_net_pay: companyNet, total_overtime_pay: companyOT,
    total_deductions: companyDeductions, total_worked_hours: companyHours, total_late_hours: companyLate,
    total_absent_days: companyAbsent, approval_status: 'Draft',
    approved_by: null, approved_date: null, rejection_reason: null,
    calculated_date: db.fn.now() };
  if (compEx) await db('payroll_company_aggregation').where('agg_id', compEx.agg_id).update(compRow);
  else await db('payroll_company_aggregation').insert(compRow);

  // Notify CEO
  await db('hr_notifications_log').insert({
    rule_id: 'R-004',
    notification_message: `Payroll for ${m}/${y} is ready for review. Total: ${companyNet.toFixed(2)} ETB. Employees: ${employees.length}.`,
    priority: 'MEDIUM', status: 'Pending', recipient_user: 'CEO', sent_date: db.fn.now(),
  });

  res.json({ status: 'success', message: `Payroll calculated for ${m}/${y}`, data: { total_employees: employees.length, company_gross: companyGross, company_net: companyNet } });
});

exports.getPayrollSummary = catchAsync(async (req, res) => {
  const { month, year } = req.params;
  const m = parseInt(month);
  const y = parseInt(year);

  const company = await db('payroll_company_aggregation')
    .where({ month_number: m, year_number: y }).first();
  const depts = await db('payroll_department_aggregation as da')
    .leftJoin('departments as d', 'da.dept_id', 'd.id')
    .where({ 'da.month_number': m, 'da.year_number': y })
    .select('da.*', 'd.name as dept_name').orderBy('da.total_gross_pay', 'desc');
  // Employee-level breakdown — only CEO-approved/completed active employees
  const employees = await db('payroll_salary_components as ps')
    .leftJoin('hr_employees as e', 'ps.employee_id', 'e.employee_id')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .leftJoin('roles as p', 'e.position_id', 'p.id')
    .where({ 'ps.month_number': m, 'ps.year_number': y })
    .where('e.employment_status', 'Active')
    .whereIn('e.registration_status', ['ceo_approved', 'completed'])
    .select(
      'ps.*',
      'e.full_name',
      'e.dept_id',
      'e.personal_phone',
      'e.bank_name',
      'e.bank_account_number',
      db.raw("COALESCE(e.payment_method, 'Bank Transfer') as payment_method"),
      'd.name as dept_name',
      'p.name as position'
    )
    .orderBy('e.full_name');
  res.json({ status: 'success', data: { payrollSummary: company, company, departments: depts, employees } });
});

exports.getApprovedPayrolls = catchAsync(async (req, res) => {
  // Return all non-Draft payrolls for CEO view and Finance payment queue
  const payrolls = await db('payroll_company_aggregation')
    .whereNot('approval_status', 'Draft')
    .orderBy('year_number', 'desc').orderBy('month_number', 'desc');
  res.json({ status: 'success', data: payrolls });
});

exports.submitPayroll = catchAsync(async (req, res) => {
  const { month, year } = req.body;
  const m = parseInt(month);
  const y = parseInt(year);

  const existing = await db('payroll_company_aggregation').where({ month_number: m, year_number: y }).first();
  if (!existing) return res.status(404).json({ status: 'fail', message: 'No payroll found for this period' });
  if (existing.approval_status !== 'Draft' && existing.approval_status !== 'Rejected') {
    return res.status(400).json({ status: 'fail', message: 'Payroll must be in Draft or Rejected status to submit' });
  }

  await db('payroll_company_aggregation')
    .where({ month_number: m, year_number: y })
    .update({ approval_status: 'Pending CEO Approval' });

  await db('hr_notifications_log').insert({
    rule_id: 'R-004',
    notification_message: `Payroll for ${m}/${y} has been submitted for approval. Total: ${existing.company_net_pay} ETB.`,
    priority: 'HIGH', status: 'Pending', recipient_user: 'CEO', sent_date: db.fn.now(),
  });

  res.json({ status: 'success', message: 'Payroll submitted for CEO approval' });
});

exports.approvePayroll = catchAsync(async (req, res) => {
  const { month, year, action, reason } = req.body;
  const m = parseInt(month);
  const y = parseInt(year);

  const existing = await db('payroll_company_aggregation').where({ month_number: m, year_number: y }).first();
  if (!existing) return res.status(404).json({ status: 'fail', message: 'No payroll found for this period' });
  if (existing.approval_status === 'Paid') return res.status(400).json({ status: 'fail', message: 'Cannot change status of a paid payroll' });

  const status = action === 'approve' ? 'Approved' : 'Rejected';
  await db('payroll_company_aggregation')
    .where({ month_number: m, year_number: y })
    .update({ approval_status: status, approved_by: req.user?.email, approved_date: db.fn.now(), rejection_reason: reason || null });

  if (action === 'approve') {
    // Update individual salary components
    await db('payroll_salary_components')
      .where({ month_number: m, year_number: y })
      .update({ status: 'Approved', approved_by: req.user?.email, approved_date: db.fn.now() });

    // Auto-submit to Finance queue
    const queueExists = await db('payroll_finance_queue')
      .where({ month_number: m, year_number: y }).first();
    if (!queueExists) {
      await db('payroll_finance_queue').insert({
        month_number: m,
        year_number: y,
        total_net_pay: existing.company_net_pay,
        total_employees: existing.total_employees,
        approved_by_ceo: req.user?.email,
        ceo_approved_date: db.fn.now(),
        payment_status: 'Pending Payment',
        created_at: db.fn.now(),
      });
    } else {
      await db('payroll_finance_queue')
        .where({ month_number: m, year_number: y })
        .update({ payment_status: 'Pending Payment', approved_by_ceo: req.user?.email, ceo_approved_date: db.fn.now() });
    }

    // HIGH priority Finance notification
    await db('hr_notifications_log').insert({
      rule_id: 'R-005',
      notification_message: `⚠️ PAYROLL READY FOR PAYMENT: ${m}/${y} approved by CEO (${req.user?.email}). Total: ${parseFloat(existing.company_net_pay).toLocaleString()} ETB for ${existing.total_employees} employees. Action required: Process payment in Finance → Payroll Payment.`,
      priority: 'HIGH', status: 'Pending', recipient_user: 'Finance', sent_date: db.fn.now(),
    });

    // Also notify HR
    await db('hr_notifications_log').insert({
      rule_id: 'R-004',
      notification_message: `Payroll for ${m}/${y} approved by CEO. Submitted to Finance for payment processing.`,
      priority: 'MEDIUM', status: 'Pending', recipient_user: 'HR', sent_date: db.fn.now(),
    });
  } else {
    // Rejected — notify HR
    await db('hr_notifications_log').insert({
      rule_id: 'R-004',
      notification_message: `Payroll for ${m}/${y} was rejected by CEO. Reason: ${reason || 'No reason given'}. Please revise and resubmit.`,
      priority: 'HIGH', status: 'Pending', recipient_user: 'HR', sent_date: db.fn.now(),
    });
  }

  res.json({ status: 'success', message: `Payroll ${status.toLowerCase()}` });
});

exports.markPayrollPaid = catchAsync(async (req, res) => {
  const { month, year, payment_method } = req.body;
  const m = parseInt(month);
  const y = parseInt(year);

  const existing = await db('payroll_company_aggregation').where({ month_number: m, year_number: y }).first();
  if (!existing) return res.status(404).json({ status: 'fail', message: 'No payroll found for this period' });
  if (existing.approval_status !== 'Approved') return res.status(400).json({ status: 'fail', message: 'Payroll must be approved before marking as paid' });
  if (existing.approval_status === 'Paid') return res.status(400).json({ status: 'fail', message: 'Payroll is already marked as paid' });

  const paymentInfo = req.file ? `${payment_method || 'Bank Transfer'} | Proof: ${req.file.path}` : (payment_method || 'Bank Transfer');
  const paidBy = req.user?.email || 'Finance';
  const now = db.fn.now();

  // 1. Mark payroll as Paid
  await db('payroll_company_aggregation')
    .where({ month_number: m, year_number: y })
    .update({
      approval_status: 'Paid',
      payment_status: 'Paid',
      payment_method: paymentInfo,
      paid_by: paidBy,
      paid_date: now
    });

  // 2. Mark individual salary components as Paid
  await db('payroll_salary_components')
    .where({ month_number: m, year_number: y })
    .update({ status: 'Paid' });

  // 3. Update Finance queue record
  await db('payroll_finance_queue')
    .where({ month_number: m, year_number: y })
    .update({
      payment_status: 'Paid',
      paid_by: paidBy,
      paid_date: now,
      payment_method: paymentInfo,
      proof_file: req.file ? req.file.path : null,
    })
    .catch(() => {}); // graceful — queue entry may not exist on older records

  // 4. Auto-record in expenses table for Finance audit trail
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabel = monthNames[(m - 1)] || m;
  try {
    // Find or create a 'Payroll' expense category
    let cat = await db('expense_categories').where('name', 'Payroll').first();
    if (!cat) {
      const [catId] = await db('expense_categories').insert({ name: 'Payroll', description: 'Monthly payroll payments', requires_approval: 0 });
      cat = { id: catId };
    }
    // Find default payment method (Bank Transfer)
    const pm = await db('payment_methods').where('name', 'like', '%Bank%').first();
    await db('expenses').insert({
      date: db.fn.now(),
      amount: existing.company_net_pay,
      description: `Staff Payroll — ${monthLabel} ${y} (${existing.total_employees} employees)`,
      category_id: cat.id,
      payment_method_id: pm ? pm.id : null,
      reference_no: `PAYROLL-${y}-${String(m).padStart(2,'0')}`,
      notes: `Processed by: ${paidBy} | Method: ${paymentInfo}`,
      entered_by: req.user?.id || null,
      approved_at: now,
      approved_by: req.user?.id || null,
      created_at: now,
    });
  } catch (expErr) {
    console.error('Expense auto-record failed (non-fatal):', expErr.message);
  }

  // 5. Notify HR that payroll has been paid
  await db('hr_notifications_log').insert({
    rule_id: 'R-004',
    notification_message: `✅ Payroll for ${monthLabel} ${y} has been PAID by Finance (${paidBy}). Method: ${payment_method || 'Bank Transfer'}. Total: ${parseFloat(existing.company_net_pay).toLocaleString()} ETB. Expense record auto-created.`,
    priority: 'HIGH', status: 'Pending', recipient_user: 'HR', sent_date: db.fn.now(),
  });

  res.json({ status: 'success', message: 'Payroll marked as paid — expense recorded, HR notified.' });
});

exports.markEmployeePaid = catchAsync(async (req, res) => {
  const { month, year, employee_id, payment_method } = req.body;
  const m = parseInt(month);
  const y = parseInt(year);

  const existing = await db('payroll_company_aggregation').where({ month_number: m, year_number: y }).first();
  if (!existing) return res.status(404).json({ status: 'fail', message: 'No payroll found' });
  if (existing.approval_status !== 'Approved' && existing.approval_status !== 'Paid') return res.status(400).json({ status: 'fail', message: 'Payroll not approved' });

  // Update specific employee
  await db('payroll_salary_components')
    .where({ month_number: m, year_number: y, employee_id })
    .update({ status: 'Paid' });

  // Check if ALL employees are now paid
  const pendingCountData = await db('payroll_salary_components')
    .where({ month_number: m, year_number: y })
    .whereNot({ status: 'Paid' })
    .count('* as count').first();
  
  if (Number(pendingCountData.count) === 0) {
    // All paid! Mark the overall payroll as paid
    const paymentInfo = req.file ? `${payment_method || 'Bank Transfer'} | Proof: ${req.file.path}` : (payment_method || 'Bank Transfer');
    const paidBy = req.user?.email || 'Finance';
    const now = db.fn.now();

    await db('payroll_company_aggregation')
      .where({ month_number: m, year_number: y })
      .update({
        approval_status: 'Paid',
        payment_status: 'Paid',
        payment_method: paymentInfo,
        paid_by: paidBy,
        paid_date: now
      });

    await db('payroll_finance_queue')
      .where({ month_number: m, year_number: y })
      .update({
        payment_status: 'Paid',
        paid_by: paidBy,
        paid_date: now,
        payment_method: paymentInfo,
        proof_file: req.file ? req.file.path : null,
      }).catch(() => {});
      
    // Record expense if possible
    try {
      let cat = await db('expense_categories').where('name', 'Payroll').first();
      if (!cat) {
        const [catId] = await db('expense_categories').insert({ name: 'Payroll', description: 'Monthly payroll payments', requires_approval: 0 });
        cat = { id: catId };
      }
      const pm = await db('payment_methods').where('name', 'like', '%Bank%').first();
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      await db('expenses').insert({
        date: db.fn.now(),
        amount: existing.company_net_pay,
        description: `Staff Payroll — ${monthNames[(m - 1)] || m} ${y} (${existing.total_employees} employees)`,
        category_id: cat.id,
        payment_method_id: pm ? pm.id : null,
        reference_no: `PAYROLL-${y}-${String(m).padStart(2,'0')}`,
        notes: `Processed by: ${paidBy} | Method: Individual Payments`,
        entered_by: req.user?.id || null,
        approved_at: now,
        approved_by: req.user?.id || null,
        created_at: now,
      });
    } catch (e) {}
  }

  res.json({ status: 'success', message: 'Employee marked as paid.' });
});

exports.getFinancePayrollQueue = catchAsync(async (req, res) => {
  // Finance payment queue — all Approved or Paid payrolls with queue details
  const rows = await db('payroll_finance_queue as q')
    .orderBy('q.year_number', 'desc')
    .orderBy('q.month_number', 'desc')
    .select('q.*');
  res.json({ status: 'success', data: rows });
});

// ─────────────────────────────────────────────────────────────────────────────
// HR NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.getHRNotifications = catchAsync(async (req, res) => {
  const { status, limit = 50 } = req.query;
  let q = db('hr_notifications_log').orderBy('sent_date', 'desc').limit(parseInt(limit));
  if (status) q = q.where('status', status);
  const notifications = await q;
  res.json({ status: 'success', data: notifications });
});

exports.acknowledgeHRNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action_taken } = req.body;
  await db('hr_notifications_log').where('notification_id', id).update({
    status: 'Acknowledged', acknowledge_date: db.fn.now(), action_taken: action_taken || 'Reviewed',
  });
  res.json({ status: 'success', message: 'Notification acknowledged' });
});

exports.getNotificationRules = catchAsync(async (req, res) => {
  const rules = await db('hr_notification_rules').orderBy('priority');
  res.json({ status: 'success', data: rules });
});

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW STATS (CEO/Board)
// ─────────────────────────────────────────────────────────────────────────────
exports.getHROverview = catchAsync(async (req, res) => {
  const [totalEmp, activeEmp, byDept, recentNotifs] = await Promise.all([
    db('hr_employees').count('employee_id as c').first(),
    db('hr_employees').where('employment_status', 'Active').count('employee_id as c').first(),
    db('hr_employees')
      .where('employment_status', 'Active')
      .leftJoin('hr_departments', 'hr_employees.dept_id', 'hr_departments.dept_id')
      .select('hr_departments.dept_name', 'hr_departments.dept_id', db.raw('COUNT(*) as count'), db.raw('AVG(hr_employees.base_salary) as avg_salary'))
      .groupBy('hr_employees.dept_id')
      .orderBy('count', 'desc'),
    db('hr_notifications_log').where('status', 'Pending').orderBy('sent_date', 'desc').limit(10),
  ]);

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const onlineCount = await db('etp_heartbeat_logs')
    .where('heartbeat_time', '>=', cutoff)
    .countDistinct('employee_id as c').first();

  // Get payroll summary from payroll_company_aggregation
  const now = new Date();
  const compPay = await db('payroll_company_aggregation')
    .where({ month_number: now.getMonth() + 1, year_number: now.getFullYear() })
    .first();

  let pSummary = null;
  if (compPay) {
    pSummary = {
      company_net_pay: compPay.company_net_pay,
      company_gross_pay: compPay.company_gross_pay,
      total_deductions: compPay.total_deductions,
      total_employees: compPay.total_employees,
      approval_status: compPay.approval_status,
    };
  }

  res.json({
    status: 'success',
    data: {
      totalEmployees: parseInt(totalEmp.c || 0),
      activeEmployees: parseInt(activeEmp.c || 0),
      onlineNow: parseInt(onlineCount?.c || 0),
      byDepartment: byDept,
      pendingNotifications: recentNotifs,
      payrollSummary: pSummary,
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY SUMMARY CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
exports.calculateWeeklySummary = catchAsync(async (req, res) => {
  const { week_number, month_number, year_number } = req.body;
  if (!week_number || !month_number || !year_number) throw new AppError('week_number, month_number, year_number required', 400);

  // Determine week start/end dates from ISO week
  const weekStart = new Date(year_number, 0, 1 + (week_number - 1) * 7);
  const dayOfWeek = weekStart.getDay();
  const diff = dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek;
  const monday = new Date(weekStart.setDate(weekStart.getDate() + diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const sMon = monday.toISOString().split('T')[0];
  const sSun = sunday.toISOString().split('T')[0];

  // Aggregate daily attendance for the week
  const rows = await db('etp_daily_attendance')
    .where('week_number', week_number)
    .where('month_number', month_number)
    .where('year_number', year_number)
    .select('employee_id')
    .select(db.raw('SUM(net_work_hours) as total_worked_hours'))
    .select(db.raw('SUM(late_minutes) as total_late_minutes'))
    .select(db.raw('SUM(absent_days) as total_absent_days'))
    .select(db.raw('SUM(overtime_hours) as total_overtime_hours'))
    .groupBy('employee_id');

  if (rows.length === 0) throw new AppError('No daily attendance found for the given week', 404);

  let updatedCount = 0;
  for (const row of rows) {
    const existing = await db('etp_weekly_summary')
      .where({ employee_id: row.employee_id, week_number, month_number, year_number })
      .first();

    const data = {
      employee_id: row.employee_id, week_number, month_number, year_number,
      week_start_date: sMon, week_end_date: sSun,
      total_worked_hours: row.total_worked_hours || 0,
      total_late_minutes: parseInt(row.total_late_minutes) || 0,
      total_absent_days: parseInt(row.total_absent_days) || 0,
      total_overtime_hours: row.total_overtime_hours || 0,
      calculated_date: db.fn.now(),
    };

    if (existing) {
      await db('etp_weekly_summary').where('summary_id', existing.summary_id).update(data);
    } else {
      await db('etp_weekly_summary').insert(data);
    }
    updatedCount++;
  }

  res.json({ status: 'success', message: `Weekly summary calculated for week ${week_number} (${sMon} - ${sSun})`, data: { week_number, month_number, year_number, employees_processed: updatedCount } });
});

exports.getWeeklySummary = catchAsync(async (req, res) => {
  const { week_number, month_number, year_number, dept_id } = req.query;
  let q = db('etp_weekly_summary as ws')
    .join('hr_employees as e', 'ws.employee_id', 'e.employee_id')
    .leftJoin('hr_departments as d', 'e.dept_id', 'd.dept_id')
    .select('ws.*', 'e.full_name', 'e.dept_id', 'd.dept_name', 'e.position_id');

  if (week_number) q = q.where('ws.week_number', parseInt(week_number));
  if (month_number) q = q.where('ws.month_number', parseInt(month_number));
  if (year_number) q = q.where('ws.year_number', parseInt(year_number));
  if (dept_id) q = q.where('e.dept_id', dept_id);

  const records = await q.orderBy('e.full_name');
  res.json({ status: 'success', data: records });
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────
exports.getEmployeeDocuments = catchAsync(async (req, res) => {
  const docs = await db('hr_employee_documents')
    .where('employee_id', req.params.id)
    .orderBy('upload_date', 'desc');
  res.json({ status: 'success', data: docs });
});

exports.getMyPayslips = catchAsync(async (req, res) => {
  // Look up the employee record by user_id to get the EMP-XXXX id
  const empRecord = await db('hr_employees').where('user_id', req.user.id).first();
  const empId = empRecord ? empRecord.employee_id : null;

  if (!empId) {
    return res.json({ status: 'success', data: [] });
  }

  const payslips = await db('payroll_salary_components')
    .leftJoin('hr_employees', 'payroll_salary_components.employee_id', 'hr_employees.employee_id')
    .leftJoin('departments', 'hr_employees.dept_id', 'departments.id')
    .leftJoin('positions', 'hr_employees.position_id', 'positions.id')
    .select(
      'payroll_salary_components.*',
      'hr_employees.full_name',
      'departments.name as department_name',
      'positions.title as position_title'
    )
    .where('payroll_salary_components.employee_id', empId)
    // Return all statuses so employees can see Draft and Paid payslips
    .orderBy([{ column: 'year_number', order: 'desc' }, { column: 'month_number', order: 'desc' }]);

  // Explicitly log the view action (GET requests are not caught by audit middleware)
  try {
    const centralAuditService = require('../../services/centralAudit.service');
    await centralAuditService.captureLegacy('EMPLOYEE_PAYSLIP_VIEWED', req.user.id, {
      centralAudit: true,
      module: 'Employee',
      ip: req.ip,
      description: `Employee ${empRecord.full_name || empRecord.employee_id} viewed their payslips`
    });
  } catch (err) {
    // Ignore audit log failure
  }

  res.json({ status: 'success', data: payslips });
});

exports.uploadEmployeeDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) throw new AppError('No file uploaded', 400);

  const { doc_type, doc_name } = req.body;
  const docPath = req.file.path.replace(/\\/g, '/');

  const [docId] = await db('hr_employee_documents').insert({
    employee_id: id,
    doc_type: doc_type || 'General',
    doc_name: doc_name || req.file.originalname,
    doc_path: docPath,
    uploaded_by: req.user?.email || 'system',
    upload_date: db.fn.now(),
  });

  // Fire notification
  await db('hr_notifications_log').insert({
    rule_id: 'R-010',
    employee_id: id,
    notification_message: `Document "${doc_name || req.file.originalname}" uploaded for employee ${id}`,
    priority: 'LOW', status: 'Pending', recipient_user: 'HR Manager', sent_date: db.fn.now(),
  });

  res.status(201).json({ status: 'success', message: 'Document uploaded', data: { doc_id: docId, doc_path: docPath } });
});

exports.deleteEmployeeDocument = catchAsync(async (req, res) => {
  const { id, docId } = req.params;
  const doc = await db('hr_employee_documents').where({ doc_id: docId, employee_id: id }).first();
  if (!doc) throw new AppError('Document not found', 404);

  // Delete file from disk
  const fs = require('fs');
  if (doc.doc_path && fs.existsSync(doc.doc_path)) {
    fs.unlinkSync(doc.doc_path);
  }

  await db('hr_employee_documents').where('doc_id', docId).del();
  res.json({ status: 'success', message: 'Document deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT INSTALLATIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.getAgentInstallations = catchAsync(async (req, res) => {
  const { status } = req.query;
  let q = db('etp_agent_installations as a')
    .leftJoin('hr_employees as e', 'a.employee_id', 'e.employee_id')
    .leftJoin('hr_departments as d', 'e.dept_id', 'd.dept_id')
    .select('a.*', 'e.full_name', 'e.dept_id', 'd.dept_name');

  if (status) q = q.where('a.status', status);
  const agents = await q.orderBy('a.installation_date', 'desc');
  res.json({ status: 'success', data: agents });
});

exports.getAgentInstallation = catchAsync(async (req, res) => {
  const agent = await db('etp_agent_installations as a')
    .leftJoin('hr_employees as e', 'a.employee_id', 'e.employee_id')
    .leftJoin('hr_departments as d', 'e.dept_id', 'd.dept_id')
    .select('a.*', 'e.full_name', 'e.dept_id', 'd.dept_name')
    .where('a.agent_id', req.params.id)
    .first();
  if (!agent) throw new AppError('Agent installation not found', 404);
  res.json({ status: 'success', data: agent });
});

exports.createAgentInstallation = catchAsync(async (req, res) => {
  const { employee_id, pc_name, mac_address, ip_address, agent_version } = req.body;
  if (!employee_id) throw new AppError('employee_id required', 400);

  const count = await db('etp_agent_installations').count('agent_id as c').first();
  const num = String(parseInt(count.c) + 1).padStart(3, '0');
  const agent_id = `AGT-${num}`;

  await db('etp_agent_installations').insert({
    agent_id, employee_id, pc_name, mac_address, ip_address,
    agent_version: agent_version || '1.0.0',
    status: 'Active',
    installation_date: db.fn.now(),
    last_heartbeat: db.fn.now(),
  });

  // Update employee has_pc_access
  await db('hr_employees').where('employee_id', employee_id).update({ has_pc_access: 'Yes' });

  res.status(201).json({ status: 'success', data: { agent_id } });
});

exports.updateAgentInstallation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await db('etp_agent_installations').where('agent_id', id).first();
  if (!existing) throw new AppError('Agent installation not found', 404);

  await db('etp_agent_installations').where('agent_id', id).update({
    ...req.body,
    last_heartbeat: req.body.last_heartbeat ? undefined : db.fn.now(),
  });

  res.json({ status: 'success', message: 'Agent installation updated' });
});

exports.deleteAgentInstallation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await db('etp_agent_installations').where('agent_id', id).first();
  if (!existing) throw new AppError('Agent installation not found', 404);

  await db('etp_agent_installations').where('agent_id', id).del();

  // Reset has_pc_access if no other agents for this employee
  const otherAgents = await db('etp_agent_installations')
    .where('employee_id', existing.employee_id).where('agent_id', '!=', id).first();
  if (!otherAgents) {
    await db('hr_employees').where('employee_id', existing.employee_id).update({ has_pc_access: 'No' });
  }

  res.json({ status: 'success', message: 'Agent installation deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// DAILY ATTENDANCE CALCULATION ENGINE (cron-triggerable)
// ─────────────────────────────────────────────────────────────────────────────
exports.calculateDailyAttendance = catchAsync(async (req, res) => {
  const { date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get all active employees
  const employees = await db('hr_employees').where('employment_status', 'Active');

  // Get heartbeats for the target date
  const heartbeats = await db('etp_heartbeat_logs')
    .where(db.raw('DATE(heartbeat_time)'), targetDate)
    .orderBy('employee_id')
    .orderBy('heartbeat_time', 'asc');

  const heartbeatByEmployee = {};
  for (const hb of heartbeats) {
    if (!heartbeatByEmployee[hb.employee_id]) heartbeatByEmployee[hb.employee_id] = [];
    heartbeatByEmployee[hb.employee_id].push(hb);
  }

  let processed = 0;
  for (const emp of employees) {
    const empHeartbeats = heartbeatByEmployee[emp.employee_id] || [];
    const dt = new Date(targetDate);
    const weekNum = getWeekNumber(dt);
    const monthNum = dt.getMonth() + 1;
    const yearNum = dt.getFullYear();

    let attendanceStatus = 'Absent';
    let actualStartTime = null;
    let actualEndTime = null;
    let netWorkHours = 0;
    let lateMinutes = 0;
    let overtimeHours = 0;
    let totalActiveMinutes = 0;
    let totalIdleMinutes = 0;

    if (empHeartbeats.length > 0) {
      actualStartTime = empHeartbeats[0].heartbeat_time;
      actualEndTime = empHeartbeats[empHeartbeats.length - 1].heartbeat_time;

      for (const hb of empHeartbeats) {
        totalActiveMinutes += parseInt(hb.active_minutes) || 0;
        totalIdleMinutes += parseInt(hb.idle_minutes) || 0;
      }

      netWorkHours = Math.round((totalActiveMinutes / 60) * 100) / 100;
      attendanceStatus = netWorkHours >= 4 ? 'Present' : 'Half-Day';

      // Late check: compare first heartbeat to shift start
      if (emp.shift_start_time && actualStartTime) {
        const shiftStart = new Date(`${targetDate}T${emp.shift_start_time}`);
        const firstBeat = new Date(actualStartTime);
        if (firstBeat > shiftStart) {
          lateMinutes = Math.round((firstBeat - shiftStart) / 60000);
        }
      }

      // Overtime check: compare last heartbeat to shift end
      if (emp.shift_end_time && actualEndTime) {
        const shiftEnd = new Date(`${targetDate}T${emp.shift_end_time}`);
        const lastBeat = new Date(actualEndTime);
        if (lastBeat > shiftEnd) {
          overtimeHours = Math.round(((lastBeat - shiftEnd) / 3600000) * 100) / 100;
        }
      }
    }

    const absentDays = attendanceStatus === 'Absent' ? 1 : 0;

    // Upsert daily attendance
    const existing = await db('etp_daily_attendance')
      .where({ employee_id: emp.employee_id, attendance_date: targetDate }).first();

    const attData = {
      employee_id: emp.employee_id, attendance_date: targetDate,
      week_number: weekNum, month_number: monthNum, year_number: yearNum,
      actual_start_time: actualStartTime ? new Date(actualStartTime).toTimeString().slice(0, 8) : null,
      actual_end_time: actualEndTime ? new Date(actualEndTime).toTimeString().slice(0, 8) : null,
      net_work_hours: netWorkHours,
      scheduled_hours: 8,
      late_minutes: lateMinutes,
      early_leave_minutes: 0,
      overtime_hours: overtimeHours,
      absent_days: absentDays,
      attendance_status: attendanceStatus,
      calculated_date: db.fn.now(),
    };

    if (existing) {
      // Don't overwrite manual overrides
      if (existing.is_manual_override !== 'Yes') {
        await db('etp_daily_attendance').where('record_id', existing.record_id).update(attData);
      }
    } else {
      await db('etp_daily_attendance').insert(attData);
    }
    processed++;
  }

  res.json({ status: 'success', message: `Daily attendance calculated for ${targetDate}`, data: { date: targetDate, employees_processed: processed } });
});

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY SUMMARY CALCULATION (cron-triggerable)
// ─────────────────────────────────────────────────────────────────────────────
exports.calculateMonthlySummary = catchAsync(async (req, res) => {
  const { month, year } = req.body;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  const dailySummary = await db('etp_daily_attendance')
    .where('month_number', m)
    .where('year_number', y)
    .select('employee_id')
    .select(db.raw('SUM(net_work_hours) as total_worked_hours'))
    .select(db.raw('SUM(late_minutes) as total_late_minutes'))
    .select(db.raw('SUM(absent_days) as total_absent_days'))
    .select(db.raw('SUM(overtime_hours) as total_overtime_hours'))
    .groupBy('employee_id');

  if (dailySummary.length === 0) throw new AppError('No daily attendance found for the given month', 404);

  const workingDays = 26;
  let updatedCount = 0;

  for (const row of dailySummary) {
    const totalWorked = parseFloat(row.total_worked_hours) || 0;
    const totalAbsent = parseInt(row.total_absent_days) || 0;
    const presentDays = Math.round(totalWorked / 8);
    const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 10000) / 100 : 0;
    const punctualityRate = workingDays > 0 ? Math.round(((workingDays - (parseInt(row.total_late_minutes) || 0) / 60 / 8) / workingDays) * 10000) / 100 : 0;

    const existing = await db('etp_monthly_summary')
      .where({ employee_id: row.employee_id, month_number: m, year_number: y }).first();

    const data = {
      employee_id: row.employee_id, month_number: m, year_number: y,
      total_worked_hours: totalWorked,
      total_late_minutes: parseInt(row.total_late_minutes) || 0,
      total_absent_days: totalAbsent,
      total_overtime_hours: parseFloat(row.total_overtime_hours) || 0,
      attendance_rate: attendanceRate,
      punctuality_rate: Math.max(0, Math.min(100, punctualityRate)),
      calculated_date: db.fn.now(),
    };

    if (existing) {
      await db('etp_monthly_summary').where('summary_id', existing.summary_id).update(data);
    } else {
      await db('etp_monthly_summary').insert(data);
    }
    updatedCount++;
  }

  res.json({ status: 'success', message: `Monthly summary calculated for ${m}/${y}`, data: { month: m, year: y, employees_processed: updatedCount } });
});

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE REQUESTS (ETP)
// ─────────────────────────────────────────────────────────────────────────────
exports.getETPLeaves = catchAsync(async (req, res) => {
  const { status, employee_id } = req.query;
  let q = db('leave_requests as lr')
    .leftJoin('employees as e', 'lr.employee_id', 'e.employee_id')
    .select('lr.*', 'e.full_name', 'e.department as dept_id', 'e.email as personal_email');
  if (status) q = q.where('lr.status', status);
  if (employee_id) q = q.where('lr.employee_id', employee_id);
  const leaves = await q.orderBy('lr.created_at', 'desc');
  res.json({ status: 'success', data: { leaves } });
});

exports.createETPLeave = catchAsync(async (req, res) => {
  const { employee_id, leave_type, start_date, end_date, reason } = req.body;
  if (!employee_id || !leave_type || !start_date || !end_date) {
    throw new AppError('employee_id, leave_type, start_date, end_date required', 400);
  }
  const emp = await db('employees').where('employee_id', employee_id).first();
  if (!emp) throw new AppError('Employee not found', 404);
  const start = new Date(start_date);
  const end = new Date(end_date);
  const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const [id] = await db('leave_requests').insert({
    employee_id, leave_type, start_date, end_date, total_days: Math.max(1, total_days),
    reason: reason || null, status: 'Pending', created_at: db.fn.now(),
  });
  res.status(201).json({ status: 'success', data: { leave_id: id } });
});

exports.reviewETPLeave = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;
  const leave = await db('leave_requests').where('id', id).first();
  if (!leave) throw new AppError('Leave request not found', 404);
  const status = action === 'approve' ? 'Approved' : 'Rejected';
  await db('leave_requests').where('id', id).update({
    status, reviewed_by: req.user?.email, rejection_reason: reason || null,
    updated_at: db.fn.now(),
  });
  res.json({ status: 'success', message: `Leave ${status.toLowerCase()}` });
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE SELF-SERVICE (ETP)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyLeaves = catchAsync(async (req, res) => {
  const emp = await db('employees').where('user_id', req.user?.id).first();
  if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found' });
  const leaves = await db('leave_requests')
    .where('employee_id', emp.employee_id)
    .orderBy('created_at', 'desc');
  res.json({ status: 'success', data: { leaves } });
});

exports.getMyProfile = catchAsync(async (req, res) => {
  const emp = await db('employees')
    .where('user_id', req.user?.id)
    .first();
  if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee profile not found for this user' });
  res.json({ status: 'success', data: {
    ...emp,
    dept_name: emp.department,
    position_title: emp.position,
    manager_name: 'N/A' // Just for UI compatibility
  } });
});

exports.getMyAttendancePortal = catchAsync(async (req, res) => {
  const emp = await db('employees').where('user_id', req.user?.id).first();
  if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found' });
  const today = new Date().toISOString().split('T')[0];
  const att = await db('attendance')
    .where({ employee_id: emp.user_id, date: today }).first();
  res.json({ status: 'success', data: att ? {
    employee_id: emp.employee_id,
    attendance_date: att.date,
    attendance_status: att.status === 'present' ? 'Present' : (att.status === 'late' ? 'Late' : 'Absent'),
    net_work_hours: 8
  } : { employee_id: emp.employee_id, attendance_date: today, attendance_status: 'Not Recorded', net_work_hours: 0 } });
});

exports.getMyDocuments = catchAsync(async (req, res) => {
  const empRecord = await db('hr_employees').where('user_id', req.user.id).first();
  const empId = empRecord ? empRecord.employee_id : null;

  if (!empId) {
    return res.json({ status: 'success', data: [] });
  }

  const docs = await db('hr_employee_documents')
    .where('employee_id', empId)
    .orderBy('upload_date', 'desc');
  res.json({ status: 'success', data: docs });
});

exports.getMyPayslips = catchAsync(async (req, res) => {
  const empRecord = await db('hr_employees').where('user_id', req.user.id).first();
  const empId = empRecord ? empRecord.employee_id : null;

  if (!empId) {
    return res.json({ status: 'success', data: [] });
  }

  const payslips = await db('payroll_salary_components')
    .where('employee_id', empId)
    .orderBy([{ column: 'year_number', order: 'desc' }, { column: 'month_number', order: 'desc' }]);
  res.json({ status: 'success', data: payslips });
});


// ─── Internal helpers ───────────────────────────────────────────────────────
function getWeekNumber(d) {
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d - startOfYear + (startOfYear.getTimezoneOffset() - d.getTimezoneOffset()) * 60000;
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
}

function calculateTax(grossSalary) {
  // Ethiopian income tax brackets (ETB/month)
  if (grossSalary <= 600)     return 0;
  if (grossSalary <= 1650)    return (grossSalary - 600) * 0.10;
  if (grossSalary <= 3200)    return 105 + (grossSalary - 1650) * 0.15;
  if (grossSalary <= 5250)    return 337.5 + (grossSalary - 3200) * 0.20;
  if (grossSalary <= 7800)    return 747.5 + (grossSalary - 5250) * 0.25;
  if (grossSalary <= 10900)   return 1385 + (grossSalary - 7800) * 0.30;
  return 2315 + (grossSalary - 10900) * 0.35;
}

// ───────────────────────────────────────────────────────────────────────────────
// CEO EMPLOYEE REGISTRATION APPROVAL
// ───────────────────────────────────────────────────────────────────────────────
exports.getPendingRegistrations = catchAsync(async (req, res) => {
  const rows = await db('hr_employees as e')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .leftJoin('roles as p', 'e.position_id', 'p.id')
    .where('e.registration_status', 'pending_approval')
    .select(
      'e.employee_id', 'e.full_name', 'e.gender', 'e.personal_phone', 'e.personal_email',
      'e.hire_date', 'e.employment_type', 'e.base_salary', 'e.housing_allowance',
      'e.transport_allowance', 'e.bank_name', 'e.bank_account_number',
      'e.education_level', 'e.institution_name', 'e.field_of_study', 'e.graduation_year',
      'e.id_photo_front', 'e.id_photo_back', 'e.document_path',
      'e.has_pc_access', 'e.shift_start_time', 'e.shift_end_time',
      'e.marital_status', 'e.date_of_birth', 'e.national_id', 'e.physical_address',
      'e.registration_status', 'e.created_date',
      'd.name as dept_name', 'p.name as position_title'
    )
    .orderBy('e.created_date', 'desc');
  res.json({ status: 'success', data: rows });
});

exports.approveRegistration = catchAsync(async (req, res) => {
  const { id } = req.params;
  const emp = await db('hr_employees').where('employee_id', id).first();
  if (!emp) throw new AppError('Employee not found', 404);
  if (emp.registration_status !== 'pending_approval') throw new AppError('Employee is not in pending state', 400);

  await db('hr_employees').where('employee_id', id).update({
    registration_status: 'ceo_approved',
    employment_status: 'Inactive',
    rejection_reason: null,
  });
  res.json({ status: 'success', message: `${emp.full_name} has been approved by CEO. Awaiting HR final completion.` });
});

exports.rejectRegistration = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason?.trim()) throw new AppError('Rejection reason is required', 400);
  const emp = await db('hr_employees').where('employee_id', id).first();
  if (!emp) throw new AppError('Employee not found', 404);
  if (emp.registration_status !== 'pending_approval') throw new AppError('Employee is not in pending state', 400);

  await db('hr_employees').where('employee_id', id).update({
    registration_status: 'rejected',
    employment_status: 'Inactive',
    rejection_reason: reason.trim(),
  });
  res.json({ status: 'success', message: `${emp.full_name}'s registration has been rejected.` });
});

// ───────────────────────────────────────────────────────────────────────────────
// HR EMPLOYEE REGISTRATION FINAL COMPLETION
// ───────────────────────────────────────────────────────────────────────────────
exports.completeRegistration = catchAsync(async (req, res) => {
  const { id } = req.params;
  const emp = await db('hr_employees').where('employee_id', id).first();
  if (!emp) throw new AppError('Employee not found', 404);
  if (emp.registration_status !== 'ceo_approved') throw new AppError('Employee must be CEO approved before HR can complete registration', 400);

  await db('hr_employees').where('employee_id', id).update({
    registration_status: 'completed',
    employment_status: 'Active',
  });
  res.json({ status: 'success', message: `${emp.full_name}'s registration is fully completed and active.` });
});

