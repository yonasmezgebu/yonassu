const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendNotification } = require('../../services/notification.service');

const bcrypt = require('bcryptjs');

// ── Attendance helpers ────────────────────────────────────────────────
// A record counts as PRESENT when there is evidence of work: a clock-in/out,
// computed net hours, or an explicit Present/Late status.
function attendanceIsPresent(rec) {
  if (!rec) return false;
  const s = (rec.attendance_status || '').toLowerCase();
  if (['present', 'late', 'on leave'].includes(s)) return true;
  if (rec.actual_start_time || rec.actual_end_time) return true;
  return Number(rec.net_work_hours) > 0;
}

function authLabel(method) {
  const m = (method || 'ashara').toLowerCase();
  if (m === 'card') return 'RFID Card';
  if (m === 'face') return 'Face Rec';
  return 'Ashara';
}

function timeHMM(timeVal) {
  if (!timeVal) return '';
  const t = String(timeVal);
  return t.slice(0, 5);
}

function toDateOnly(value) {
  if (!value) return null;
  // Keep pure date strings verbatim — new Date('YYYY-MM-DD') parses as UTC and
  // shifts a day in negative-offset timezones.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── ISO week helpers (SRS 1.3 Weekly period: Monday–Sunday) ────────────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Monday of the current ISO week
function currentWeekMonday() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayNr = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - dayNr);
  return d;
}

// ISO week number + year for a date
function isoWeekOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNr = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNr + 3); // Thursday
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.floor((d - jan1) / 86400000 / 7) + 1;
  return { week, year };
}

// Monday of the given ISO week number + year
function isoWeekMonday(week, year) {
  const jan4 = new Date(year, 0, 4);
  const dayNr = (jan4.getDay() + 6) % 7; // Mon=0
  const week1Monday = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - dayNr);
  return new Date(week1Monday.getFullYear(), week1Monday.getMonth(), week1Monday.getDate() + (week - 1) * 7);
}

// Ensure a user linked to an employee carries the standard "Employee" role
// (Employee Dashboard access) and is flagged as an employee in the system.
const ensureEmployeeRole = async (userId, assignedBy = null) => {
  if (!userId) return;
  const empRole = await db('roles').where('name', 'Employee').first();
  if (!empRole) return;
  const existing = await db('user_roles')
    .where({ user_id: userId, role_id: empRole.id })
    .first();
  if (!existing) {
    await db('user_roles').insert({
      user_id: userId,
      role_id: empRole.id,
      assigned_by: assignedBy,
      assigned_at: db.fn.now(),
    });
  }
  await db('users').where('id', userId).update({ is_employee: true });
};

// Ensure the specific position role is also assigned to the user
const ensurePositionRole = async (userId, positionId, assignedBy = null) => {
  if (!userId || !positionId) return;
  const existing = await db('user_roles').where({ user_id: userId, role_id: positionId }).first();
  if (!existing) {
    await db('user_roles').insert({
      user_id: userId,
      role_id: positionId,
      assigned_by: assignedBy,
      assigned_at: db.fn.now(),
    }).catch(() => {});
  }
};

// Resolve the user account linked to an employee record and keep the
// employee's personal_email aligned with the user's login email.
const resolveLinkedUser = async ({ user_id, personal_email }) => {
  let user = null;
  if (user_id) user = await db('users').where('id', user_id).first();
  if (!user && personal_email) user = await db('users').where('email', personal_email.toLowerCase()).first();
  return user || null;
};

// Sync HR employee details to the Users table (for login)
const syncEmployeeToUser = async (empData, assignedBy = null) => {
  if (!empData.personal_email) return null;
  
  let user = await resolveLinkedUser({ user_id: empData.user_id, personal_email: empData.personal_email });
  
  if (!user) {
    // Create new login account for this employee
    const hashedPassword = await bcrypt.hash('123456', 10);
    const [newUserId] = await db('users').insert({
      email: empData.personal_email.toLowerCase(),
      password: hashedPassword,
      full_name: empData.full_name,
      phone: empData.personal_phone || '0000000000',
      department_id: empData.dept_id ? parseInt(empData.dept_id, 10) : null,
      is_employee: true,
      status_id: 1,
      deleted_at: null
    });
    user = { id: newUserId, email: empData.personal_email.toLowerCase() };
  } else {
    // Update existing login account (and restore if deleted/inactive)
    const userUpdates = {};
    if (empData.dept_id !== undefined) userUpdates.department_id = empData.dept_id ? parseInt(empData.dept_id, 10) : null;
    if (empData.full_name !== undefined) userUpdates.full_name = empData.full_name;
    if (empData.personal_phone !== undefined && empData.personal_phone) userUpdates.phone = empData.personal_phone;
    if (empData.personal_email !== undefined) userUpdates.email = empData.personal_email.toLowerCase();
    
    userUpdates.status_id = 1;
    userUpdates.deleted_at = null;
    
    await db('users').where('id', user.id).update(userUpdates);
  }

  // Ensure they have the universal Employee role
  await ensureEmployeeRole(user.id, assignedBy);
  // Ensure they have their specific department/position role
  if (empData.position_id) {
    await ensurePositionRole(user.id, empData.position_id, assignedBy);
  }
  
  return user.id;
};

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
// SRS STEP 1 — ONE-TIME EMPLOYEE REGISTRATION (SETUP PHASE)
// HR registers an existing system user once for the ETP attendance module.
// Data is taken from the users/attendance side and the rest is filled manually.
// ─────────────────────────────────────────────────────────────────────────────
exports.getAttendanceRegistrationCandidates = catchAsync(async (req, res) => {
  // System users with a login account who are NOT yet registered for attendance,
  // i.e. they have no hr_employees profile (no user_id link and no personal_email link).
  const registeredIds = db('hr_employees').whereNot('user_id', null).select('user_id');
  const linkedEmails = db('hr_employees').whereNot('personal_email', null).select(db.raw('LOWER(personal_email)'));

  const candidates = await db('users as u')
    .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
    .leftJoin('roles as r', 'r.id', 'ur.role_id')
    .where('u.deleted_at', null)
    .whereNotIn('u.id', registeredIds)
    .whereNotIn(db.raw('LOWER(u.email)'), linkedEmails)
    .select(
      'u.id', 'u.full_name', 'u.email', 'u.phone',
      db.raw('DATE(u.created_at) as created_at'),
      db.raw('GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ", ") as roles')
    )
    .groupBy('u.id')
    .orderBy('u.created_at', 'desc');

  res.json({ status: 'success', data: candidates });
});

exports.enrollFingerprint = catchAsync(async (req, res) => {
  const { employee_id, fingerprint_id } = req.body;
  if (!employee_id || !fingerprint_id) throw new AppError('employee_id and fingerprint_id are required', 400);

  const emp = await db('hr_employees').where('employee_id', employee_id).first();
  if (!emp) throw new AppError('Employee not found', 404);

  // Check if fingerprint ID is already taken by someone else
  const existing = await db('hr_employees').where('fingerprint_id', fingerprint_id).first();
  if (existing && existing.employee_id !== employee_id) {
    throw new AppError(`Fingerprint ID ${fingerprint_id} is already assigned to ${existing.full_name}`, 400);
  }

  await db('hr_employees').where('employee_id', employee_id).update({
    fingerprint_id,
    fingerprint_enrolled_at: new Date().toISOString(),
    fingerprint_enrolled_by: req.user?.full_name || 'HR Admin'
  });

  res.json({
    status: 'success',
    message: `Fingerprint ID ${fingerprint_id} successfully enrolled for ${emp.full_name}`
  });
});

exports.registerAttendanceEmployee = catchAsync(async (req, res) => {
  const user_id = req.body.user_id;
  if (!user_id) throw new AppError('user_id is required', 400);

  const user = await db('users').where('id', user_id).whereNull('deleted_at').first();
  if (!user) throw new AppError('User account not found', 404);

  // Guard: already registered for attendance
  const existing = await db('hr_employees')
    .where(function () {
      this.where('user_id', user_id)
        .orWhere('personal_email', user.email);
    })
    .first();
  if (existing) throw new AppError(`User is already registered as ${existing.employee_id}`, 409);

  const full_name = (req.body.full_name || user.full_name || '').trim();
  const personal_phone = (req.body.personal_phone || user.phone || '').trim() || null;
  const dept_id = req.body.dept_id ? parseInt(req.body.dept_id, 10) : null;
  const position_id = req.body.position_id ? parseInt(req.body.position_id, 10) : null;

  // Next sequential employee ID (safest: max numeric suffix + 1)
  const idRows = await db('hr_employees').select('employee_id');
  const nums = idRows
    .map(r => parseInt(String(r.employee_id).replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
  const employee_id = `EMP-2026-${String(nextNum).padStart(3, '0')}`;

  // Sync the user account (department, name, phone, is_employee, Employee role)
  const syncedUserId = await syncEmployeeToUser({
    user_id,
    personal_email: user.email,
    full_name,
    personal_phone,
    dept_id,
    position_id
  }, req.user?.id);

  await db('hr_employees').insert({
    employee_id,
    full_name,
    personal_phone,
    personal_email: user.email.toLowerCase(),
    user_id: syncedUserId || user.id,
    dept_id,
    position_id,
    base_salary: req.body.base_salary ? parseFloat(req.body.base_salary) : 0,
    housing_allowance: req.body.housing_allowance ? parseFloat(req.body.housing_allowance) : 0,
    transport_allowance: req.body.transport_allowance ? parseFloat(req.body.transport_allowance) : 0,
    has_pc_access: req.body.has_pc_access || 'Yes',
    shift_start_time: req.body.shift_start_time || '09:00',
    shift_end_time: req.body.shift_end_time || '18:00',
    weekly_off_days: 'Friday,Saturday',
    employment_status: 'Active',
    registration_status: 'active',
    is_attendance_enabled: req.body.is_attendance_enabled !== undefined ? req.body.is_attendance_enabled : true,
    employment_type: req.body.employment_type || 'Permanent',
    hire_date: req.body.hire_date || new Date(),
    gender: req.body.gender || null,
    marital_status: req.body.marital_status || 'Single',
    national_id: (req.body.national_id || '').trim() || null,
    overtime_rate: 1.5
  });

  res.status(201).json({
    status: 'success',
    message: `${full_name} registered once for attendance (${employee_id}).`,
    data: { employee_id, user_id: syncedUserId || user.id }
  });
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
    .leftJoin('users as u', function() {
      this.on('e.user_id', 'u.id').orOn('e.personal_email', 'u.email');
    });

  if (dept_id) q = q.where('e.dept_id', dept_id);
  if (status)  q = q.where('e.employment_status', status);
  if (search)  q = q.where(function() {
    this.where('e.full_name', 'like', `%${search}%`)
        .orWhere('e.employee_id', 'like', `%${search}%`);
  });

  const hrEmployees = await q.select('e.*', 'd.name as dept_name', 'p.name as position_title', 'u.profile_photo as user_photo').orderBy('e.full_name');
  
  // Dedupe — the user join may match both user_id and personal_email
  const seenEmpIds = new Set();
  const uniqueEmployees = [];
  for (const emp of hrEmployees) {
    if (seenEmpIds.has(emp.employee_id)) continue;
    seenEmpIds.add(emp.employee_id);
    uniqueEmployees.push(emp);
  }

  // Tag them
  const results = uniqueEmployees.map(emp => ({ ...emp, _source: 'hr_employees' }));

  // ── 2. Fetch unregistered users from the users table ────────────────────
  if (!dept_id && !status) {
    const hrEmails = new Set(hrEmployees.map(e => e.personal_email).filter(Boolean));
    const hrUserIds = new Set(hrEmployees.map(e => e.user_id).filter(Boolean).map(id => String(id)));
    
    let uq = db('users');
    if (search) {
      uq = uq.where(function() {
        this.where('full_name', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`);
      });
    }
    
    const allUsers = await uq.select('*');
    const unregistered = allUsers.filter(u => !hrEmails.has(u.email) && !hrUserIds.has(String(u.id)));
    
    const unregisteredIds = unregistered.map(u => u.id);
    const roleRows = unregisteredIds.length
      ? await db('user_roles')
          .leftJoin('roles', 'user_roles.role_id', 'roles.id')
          .whereIn('user_roles.user_id', unregisteredIds)
          .select('user_roles.user_id', 'roles.name')
      : [];
    const roleByUser = {};
    for (const row of roleRows) {
      if (row.name && !roleByUser[row.user_id]) roleByUser[row.user_id] = row.name;
    }
    
    unregistered.forEach(u => {
      if (roleByUser[u.id] === 'Customer') return;
      results.push({
        _source: 'users_table',
        employee_id: u.id,
        full_name: u.full_name,
        personal_email: u.email,
        personal_phone: u.phone,
        dept_name: 'Unregistered',
        position_title: roleByUser[u.id] || 'N/A',
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

  // ID photo paths from multer (set by route middleware) — normalize to forward slashes for URL safety
  const id_photo_front = req.files?.id_photo_front?.[0]?.path
    ? req.files.id_photo_front[0].path.replace(/\\/g, '/')
    : (req.body.id_photo_front || null);
  const id_photo_back  = req.files?.id_photo_back?.[0]?.path
    ? req.files.id_photo_back[0].path.replace(/\\/g, '/')
    : (req.body.id_photo_back  || null);

  if (bank_account_number) {
    const existingBank = await db('hr_employees').where('bank_account_number', bank_account_number).first();
    if (existingBank) throw new AppError('Bank account number is already registered to another employee', 400);
  }

  const count = await db('hr_employees').count('employee_id as c').first();
  const employee_id = `EMP-2026-${String(parseInt(count.c || 0) + 1).padStart(3, '0')}`;

  // Keep the employee's email aligned with the linked user account and link by
  // email when no explicit user_id is given, so HR and Admin stay consistent.
  const linkedUser = await resolveLinkedUser({ user_id, personal_email });
  const finalUserEmail = linkedUser ? linkedUser.email : (personal_email || `${employee_id}@sutana.com`);
  
  // Force sync the user account
  const syncedUserId = await syncEmployeeToUser({
    user_id: linkedUser ? linkedUser.id : (user_id || null),
    personal_email: finalUserEmail,
    full_name,
    personal_phone: phone || req.body.personal_phone,
    dept_id,
    position_id
  }, req.user?.id);

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
    personal_email: finalUserEmail,
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
    id_photo_front, id_photo_back, user_id: syncedUserId
  });

  res.status(201).json({ status: 'success', data: { employee_id } });
});

exports.updateETPEmployee = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = {};
  const nullableFields = ['date_of_birth', 'bank_account_number', 'bank_name', 'national_id',
    'physical_address', 'personal_email', 'emergency_contact_name', 'emergency_contact_phone',
    'document_path', 'housing_allowance', 'transport_allowance', 'overtime_rate',
    'education_level', 'institution_name', 'field_of_study', 'graduation_year'];
  const fields = ['full_name', 'national_id', 'gender', 'dept_id', 'position_id',
    'base_salary', 'housing_allowance', 'transport_allowance', 'has_pc_access',
    'shift_start_time', 'shift_end_time', 'employment_status', 'employment_type',
    'personal_phone', 'physical_address', 'personal_email', 'overtime_rate', 'bank_name', 'bank_account_number', 'payment_method',
    'emergency_contact_name', 'emergency_contact_phone', 'date_of_birth', 'marital_status', 'document_path',
    'registration_status', 'hire_date', 'is_attendance_enabled',
    'education_level', 'institution_name', 'field_of_study', 'graduation_year'];
  // NOTE: id_photo_front / id_photo_back are intentionally excluded from the body loop —
  // they are only updated when multer provides an actual uploaded file (see below).
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

  // Keep email aligned with the linked user account and auto-assign the
  // standard Employee role so the person always has Employee Dashboard access.
  const currentEmp = await db('hr_employees').where('employee_id', id).first();
  const targetUserId = updates.user_id !== undefined ? updates.user_id : currentEmp?.user_id;
  const targetEmail = updates.personal_email !== undefined ? updates.personal_email : currentEmp?.personal_email;
  
  // Force sync the user account
  const syncedUserId = await syncEmployeeToUser({
    user_id: targetUserId,
    personal_email: targetEmail,
    full_name: updates.full_name !== undefined ? updates.full_name : currentEmp?.full_name,
    personal_phone: updates.personal_phone !== undefined ? updates.personal_phone : currentEmp?.personal_phone,
    dept_id: updates.dept_id !== undefined ? updates.dept_id : currentEmp?.dept_id,
    position_id: updates.position_id !== undefined ? updates.position_id : currentEmp?.position_id
  }, req.user?.id);

  if (syncedUserId) {
    updates.user_id = syncedUserId;
  } else if (targetUserId && !targetEmail) {
    // If they had a user_id but somehow we didn't sync (no email?), keep it
    updates.user_id = targetUserId;
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ status: 'fail', message: 'No fields to update' });
  await db('hr_employees').where('employee_id', id).update(updates);

  // ── Notify Admin about the HR employee update ──────────────────────────────
  try {
    const updatedEmp = await db('hr_employees as e')
      .leftJoin('departments as d', 'e.dept_id', 'd.id')
      .leftJoin('roles as r', 'e.position_id', 'r.id')
      .select('e.employee_id', 'e.full_name', 'e.personal_email', 'e.employment_status',
              'e.registration_status', 'd.name as dept_name', 'r.name as position_title')
      .where('e.employee_id', id)
      .first();

    // Build a human-readable summary of what changed
    const changedFields = [];
    if (updates.full_name)        changedFields.push(`Name → ${updates.full_name}`);
    if (updates.personal_email)   changedFields.push(`Email → ${updates.personal_email}`);
    if (updates.dept_id)          changedFields.push(`Department → ${updatedEmp?.dept_name || updates.dept_id}`);
    if (updates.position_id)      changedFields.push(`Position → ${updatedEmp?.position_title || updates.position_id}`);
    if (updates.base_salary)      changedFields.push(`Base Salary → ${updates.base_salary}`);
    if (updates.employment_status) changedFields.push(`Status → ${updates.employment_status}`);
    if (updates.registration_status) changedFields.push(`Registration → ${updates.registration_status}`);
    if (updates.employment_type)  changedFields.push(`Employment Type → ${updates.employment_type}`);
    if (updates.hire_date)        changedFields.push(`Hire Date → ${updates.hire_date}`);

    const changedSummary = changedFields.length > 0 ? changedFields.join(', ') : 'Profile details updated';
    const updatedByName  = req.user?.full_name || req.user?.email || 'HR';
    const announcementTitle = `Employee Profile Updated: ${updatedEmp?.full_name || id}`;
    const announcementBody  =
      `HR has updated the profile of employee ${updatedEmp?.full_name || id} (${id}).\n\n` +
      `Department: ${updatedEmp?.dept_name || '—'}\n` +
      `Position: ${updatedEmp?.position_title || '—'}\n` +
      `Email: ${updatedEmp?.personal_email || '—'}\n` +
      `Employment Status: ${updatedEmp?.employment_status || '—'}\n` +
      `Registration Status: ${updatedEmp?.registration_status || '—'}\n\n` +
      `Changes: ${changedSummary}\n\n` +
      `Updated by: ${updatedByName}`;

    // 1. Create an HR announcement (visible in HR Announcements section)
    await db('hr_announcements').insert({
      title: announcementTitle,
      body: announcementBody,
      author_id: req.user?.id || null,
      audience_scope: JSON.stringify({ roles: ['Admin', 'HR Manager'] }),
      priority: 'Info',
      status: 'Published',
      publish_at: db.fn.now(),
    });

    // 2. Create in-app notifications for all Admin users
    const admins = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'Admin')
      .whereNull('users.deleted_at')
      .select('users.id');

    for (const admin of admins) {
      await db('notifications').insert({
        user_id: admin.id,
        title: announcementTitle,
        message: `${changedSummary} — Updated by ${updatedByName}`,
        type: 'hr_employee_update',
        link: '/hr/employees',
        is_read: false,
        created_at: db.fn.now(),
      });
    }
  } catch (notifErr) {
    // Never let notification failure break the main update response
    console.error('[HR Update Notify] Failed to send admin notification:', notifErr.message);
  }

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
      time_in: timeHMM(att?.actual_start_time),
      auth_method: att?.auth_method || null,
      auth_label: att ? authLabel(att.auth_method) : '—',
      terminal_ip: att?.terminal_ip || null,
      status: att ? (attendanceIsPresent(att) ? 'P' : 'A') : 'A',
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
    present_pa: result.filter(r => r.status === 'P').length,
    absent_pa: result.filter(r => r.status === 'A').length,
    ashara_scans: result.filter(r => (r.auth_method || 'ashara') === 'ashara' && r.status === 'P').length,
    card_scans: result.filter(r => r.auth_method === 'card' && r.status === 'P').length,
    face_scans: result.filter(r => r.auth_method === 'face' && r.status === 'P').length,
    card_face_scans: result.filter(r => (r.auth_method === 'card' || r.auth_method === 'face') && r.status === 'P').length,
  };

  // Pin the currently logged-in user's own attendance record first
  const meEmp = await db('hr_employees').where('user_id', req.user?.id).first();
  let ordered = result.map(r => ({ ...r, is_me: false }));
  if (meEmp) {
    const idx = ordered.findIndex(r => r.employee_id === meEmp.employee_id);
    if (idx !== -1) {
      ordered[idx].is_me = true;
      const [me] = ordered.splice(idx, 1);
      ordered = [me, ...ordered];
    }
  }

  res.json({ status: 'success', data: { employees: ordered, summary, date } });
});

exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const { month, year, dept_id, search } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  // All active employees (so the whole workforce is visible even with no records)
  let empQuery = db('hr_employees as e')
    .join('departments as d', 'e.dept_id', 'd.id')
    .select('e.employee_id', 'e.full_name', 'e.dept_id', 'd.name as dept_name', 'e.position_id')
    .where('e.employment_status', 'Active');
  if (dept_id) empQuery = empQuery.where('e.dept_id', dept_id);
  if (search) empQuery = empQuery.where('e.full_name', 'like', `%${search.trim()}%`);
  const employees = await empQuery;

  // Live aggregation from the daily log for the selected month
  const rows = await db('etp_daily_attendance as da')
    .where('da.month_number', m)
    .where('da.year_number', y)
    .select(
      'da.employee_id',
      db.raw('COUNT(*) as work_days'),
      db.raw('COALESCE(SUM(da.net_work_hours),0) as total_worked_hours'),
      db.raw('COALESCE(SUM(da.late_minutes),0) as total_late_minutes'),
      db.raw('COALESCE(SUM(da.overtime_hours),0) as total_overtime_hours')
    )
    .groupBy('da.employee_id');

  const rowMap = {};
  for (const r of rows) rowMap[r.employee_id] = r;

  // Per-employee present/absent counts (needs the row-level presence test)
  const dailyRows = await db('etp_daily_attendance as da')
    .where('da.month_number', m)
    .where('da.year_number', y)
    .select('da.employee_id', 'da.attendance_status', 'da.actual_start_time', 'da.actual_end_time', 'da.net_work_hours');
  const presentMap = {};
  for (const r of dailyRows) {
    if (!presentMap[r.employee_id]) presentMap[r.employee_id] = { present: 0, total: 0 };
    presentMap[r.employee_id].total += 1;
    if (attendanceIsPresent(r)) presentMap[r.employee_id].present += 1;
  }

  const records = employees.map(emp => {
    const agg = rowMap[emp.employee_id] || {};
    const pa = presentMap[emp.employee_id] || { present: 0, total: 0 };
    const work_days = pa.total;
    const days_present = pa.present;
    const days_absent = work_days - days_present;
    const attendance_rate = work_days > 0 ? Math.round((days_present / work_days) * 1000) / 10 : 0;
    const attendance_percent = work_days > 0 ? Math.round((days_present / work_days) * 100) : 0;
    return {
      summary_id: null,
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      dept_id: emp.dept_id,
      dept_name: emp.dept_name,
      position_id: emp.position_id,
      month_number: m,
      year_number: y,
      total_working_days: work_days,
      days_present,
      days_absent,
      attendance_rate,
      attendance_percent,
      total_worked_hours: Number(agg.total_worked_hours || 0),
      total_late_minutes: Number(agg.total_late_minutes || 0),
      total_absent_days: days_absent,
      total_overtime_hours: Number(agg.total_overtime_hours || 0),
      punctuality_rate: work_days > 0 ? Math.round((1 - (Number(agg.total_late_minutes || 0) / (work_days * 480))) * 1000) / 10 : 0,
      calculated_date: new Date(),
      status: work_days === 0 ? 'No Records' : (days_absent === 0 ? 'Perfect' : days_present >= work_days / 2 ? 'Good' : 'Poor'),
    };
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));

  const withRecords = records.filter(r => r.total_working_days > 0);
  const workingDates = await db('etp_daily_attendance')
    .where('month_number', m)
    .where('year_number', y)
    .distinct('attendance_date');
  const overview = {
    month: m,
    year: y,
    month_label: new Date(y, m - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    total_working_days: workingDates.length,
    total_employees: employees.length,
    avg_present_rate: withRecords.length > 0
      ? Math.round((withRecords.reduce((s, r) => s + r.attendance_rate, 0) / withRecords.length) * 10) / 10
      : 0,
    total_absences: withRecords.reduce((s, r) => s + r.days_absent, 0),
    tracked_employees: withRecords.length,
  };

  // Pin the currently logged-in user's own monthly record first
  const meEmp = await db('hr_employees').where('user_id', req.user?.id).first();
  let ordered = records.map(r => ({ ...r, is_me: false }));
  if (meEmp) {
    const idx = ordered.findIndex(r => r.employee_id === meEmp.employee_id);
    if (idx !== -1) {
      ordered[idx].is_me = true;
      const [me] = ordered.splice(idx, 1);
      ordered = [me, ...ordered];
    }
  }

  res.json({ status: 'success', data: ordered, overview, query: { month: m, year: y } });
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
    else {
      await db('payroll_salary_components').insert(payrollData);

      // First time this payslip exists → notify the employee immediately
      if (emp.user_id) {
        try {
          const monthName = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' });
          const notifMessage = `Your ${monthName} ${y} payslip is ready — Net ETB ${Number(net).toLocaleString()}`;
          await db('notifications').insert({
            user_id: emp.user_id,
            title: 'Payslip Available',
            message: notifMessage,
            type: 'payslip',
            link: '/employee/payslips',
            is_read: false,
            created_at: db.fn.now()
          });
          const io = req.app.get('io');
          if (io) {
            io.emit('employee-payslip', {
              user_id: emp.user_id,
              title: 'Payslip Available',
              message: notifMessage,
              type: 'payslip',
              link: '/employee/payslips'
            });
          }
        } catch (_) { /* notification errors must not block payroll */ }
      }
    }

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

    // HR bell notification — payroll approved by CEO
    sendNotification('HR Manager', null, {
      title: 'Payroll Approved by CEO',
      message: `Payroll for ${m}/${y} was approved by CEO and submitted to Finance for payment.`,
      type: 'payroll_approved',
      link: '/hr/monthly-payroll',
    }).catch(err => console.error('[Notification] Failed to notify HR:', err.message));
  } else {
    // Rejected — notify HR
    await db('hr_notifications_log').insert({
      rule_id: 'R-004',
      notification_message: `Payroll for ${m}/${y} was rejected by CEO. Reason: ${reason || 'No reason given'}. Please revise and resubmit.`,
      priority: 'HIGH', status: 'Pending', recipient_user: 'HR', sent_date: db.fn.now(),
    });

    // HR bell notification — payroll rejected by CEO
    sendNotification('HR Manager', null, {
      title: 'Payroll Rejected by CEO',
      message: `Payroll for ${m}/${y} was rejected by CEO. Reason: ${reason || 'No reason given'}. Please revise and resubmit.`,
      type: 'payroll_rejected',
      link: '/hr/monthly-payroll',
    }).catch(err => console.error('[Notification] Failed to notify HR:', err.message));
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
  const { week, year, dept_id } = req.query;
  const current = currentWeekMonday();
  const cur = isoWeekOf(current);
  const w = parseInt(week) || cur.week;
  const y = parseInt(year) || cur.year;

  let monday;
  if (week || year) monday = isoWeekMonday(w, y);
  else monday = current;
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const mondayStr = localDateStr(monday);
  const sundayStr = localDateStr(sunday);

  // All active employees
  let empQuery = db('hr_employees as e')
    .join('departments as d', 'e.dept_id', 'd.id')
    .select('e.employee_id', 'e.full_name', 'e.dept_id', 'd.name as dept_name', 'e.position_id')
    .where('e.employment_status', 'Active');
  if (dept_id) empQuery = empQuery.where('e.dept_id', dept_id);
  const employees = await empQuery;

  // Weekly rows (Mon–Sun) from the live daily log
  const rows = await db('etp_daily_attendance as da')
    .where('da.attendance_date', '>=', mondayStr)
    .where('da.attendance_date', '<=', sundayStr)
    .select('da.employee_id', 'da.attendance_status', 'da.actual_start_time', 'da.actual_end_time', 'da.net_work_hours', 'da.auth_method', 'da.terminal_ip');

  const weekMap = {};
  for (const r of rows) {
    if (!weekMap[r.employee_id]) weekMap[r.employee_id] = { work_days: 0, present: 0, absent: 0, auth: {} };
    const m = weekMap[r.employee_id];
    m.work_days += 1;
    if (attendanceIsPresent(r)) m.present += 1; else m.absent += 1;
    const label = authLabel(r.auth_method);
    m.auth[label] = (m.auth[label] || 0) + 1;
  }

  const records = employees.map(emp => {
    const m = weekMap[emp.employee_id] || { work_days: 0, present: 0, absent: 0, auth: {} };
    const attendance_rate = m.work_days > 0 ? Math.round((m.present / m.work_days) * 1000) / 10 : 0;
    return {
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      dept_id: emp.dept_id,
      dept_name: emp.dept_name,
      position_id: emp.position_id,
      week_number: w,
      year_number: y,
      week_start: mondayStr,
      week_end: sundayStr,
      total_working_days: m.work_days,
      total_p: m.present,
      total_a: m.absent,
      attendance_rate,
      auth_breakdown: m.auth,
    };
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));

  const withRecords = records.filter(r => r.total_working_days > 0);
  const overview = {
    week: w,
    year: y,
    week_label: `Week ${w} · ${mondayStr} to ${sundayStr}`,
    total_employees: employees.length,
    tracked_employees: withRecords.length,
    total_records: rows.length,
    avg_present_rate: withRecords.length > 0
      ? Math.round((withRecords.reduce((s, r) => s + r.attendance_rate, 0) / withRecords.length) * 10) / 10
      : 0,
    total_absences: withRecords.reduce((s, r) => s + r.total_a, 0),
  };

  // Pin the currently logged-in user's own record first
  const meEmp = await db('hr_employees').where('user_id', req.user?.id).first();
  let ordered = records.map(r => ({ ...r, is_me: false }));
  if (meEmp) {
    const idx = ordered.findIndex(r => r.employee_id === meEmp.employee_id);
    if (idx !== -1) {
      ordered[idx].is_me = true;
      const [me] = ordered.splice(idx, 1);
      ordered = [me, ...ordered];
    }
  }

  res.json({ status: 'success', data: ordered, overview, query: { week: w, year: y, from: mondayStr, to: sundayStr } });
});

// ─────────────────────────────────────────────────────────────────────────────
// YEARLY SUMMARY (SRS 1.3 / 3 — Jan–Dec aggregation, sum of 12 monthly totals)
// ─────────────────────────────────────────────────────────────────────────────
exports.getYearlyAttendance = catchAsync(async (req, res) => {
  const { year, dept_id, search } = req.query;
  const y = parseInt(year) || new Date().getFullYear();

  let empQuery = db('hr_employees as e')
    .join('departments as d', 'e.dept_id', 'd.id')
    .select('e.employee_id', 'e.full_name', 'e.dept_id', 'd.name as dept_name', 'e.position_id')
    .where('e.employment_status', 'Active');
  if (dept_id) empQuery = empQuery.where('e.dept_id', dept_id);
  if (search) empQuery = empQuery.where('e.full_name', 'like', `%${search.trim()}%`);
  const employees = await empQuery;

  const dailyRows = await db('etp_daily_attendance as da')
    .where('da.year_number', y)
    .select('da.employee_id', 'da.month_number', 'da.attendance_status', 'da.actual_start_time', 'da.actual_end_time', 'da.net_work_hours');

  // Per employee: 12 monthly buckets of P/A rows (SRS 2.5 year rollup)
  const yMap = {};
  for (const r of dailyRows) {
    if (!yMap[r.employee_id]) {
      yMap[r.employee_id] = { totals: { present: 0, absent: 0, work: 0 }, months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, present: 0, absent: 0, work: 0 })) };
    }
    const row = yMap[r.employee_id];
    const m = row.months[r.month_number - 1] || row.months[0];
    m.work += 1;
    if (attendanceIsPresent(r)) { m.present += 1; row.totals.present += 1; }
    else { m.absent += 1; row.totals.absent += 1; }
    row.totals.work += 1;
  }

  const records = employees.map(emp => {
    const a = yMap[emp.employee_id];
    const total_work = a ? a.totals.work : 0;
    const total_present = a ? a.totals.present : 0;
    const total_absent = a ? a.totals.absent : 0;
    const annual_rate = total_work > 0 ? Math.round((total_present / total_work) * 1000) / 10 : 0;
    return {
      summary_id: null,
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      dept_id: emp.dept_id,
      dept_name: emp.dept_name,
      position_id: emp.position_id,
      year: y,
      total_days_present: total_present,
      total_days_absent: total_absent,
      total_working_days: total_work,
      annual_attendance_rate: annual_rate,
      months: a ? a.months : Array.from({ length: 12 }, (_, i) => ({ month: i + 1, present: 0, absent: 0, work: 0 })),
      status: total_work === 0 ? 'No Records' : (total_absent === 0 ? 'Perfect' : total_present >= total_work / 2 ? 'Good' : 'Poor'),
    };
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));

  const withRecords = records.filter(r => r.total_working_days > 0);
  const overview = {
    year: y,
    total_employees: employees.length,
    tracked_employees: withRecords.length,
    avg_annual_rate: withRecords.length > 0
      ? Math.round((withRecords.reduce((s, r) => s + r.annual_attendance_rate, 0) / withRecords.length) * 10) / 10
      : 0,
    total_absences: withRecords.reduce((s, r) => s + r.total_days_absent, 0),
    months_label: Array.from({ length: 12 }, (_, i) => new Date(0, i, 1).toLocaleString('en', { month: 'short' })),
  };

  // Pin the currently logged-in user's own record first
  const meEmp = await db('hr_employees').where('user_id', req.user?.id).first();
  let ordered = records.map(r => ({ ...r, is_me: false }));
  if (meEmp) {
    const idx = ordered.findIndex(r => r.employee_id === meEmp.employee_id);
    if (idx !== -1) {
      ordered[idx].is_me = true;
      const [me] = ordered.splice(idx, 1);
      ordered = [me, ...ordered];
    }
  }

  res.json({ status: 'success', data: ordered, overview, query: { year: y } });
});

// ─────────────────────────────────────────────────────────────────────────────
// SELF-SERVICE CLOCK-IN SCAN (SRS 5 — Steps 3 & 4: terminal IP verification)
// ─────────────────────────────────────────────────────────────────────────────
exports.registerAttendanceScan = catchAsync(async (req, res) => {
  const { auth_method, ip_address } = req.body;
  const method = ['ashara', 'card', 'face'].includes(auth_method) ? auth_method : 'ashara';

  // Resolve the employee for the logged-in user (user_id first, email fallback)
  let emp = await db('hr_employees').where('user_id', req.user?.id).first();
  if (!emp && req.user?.id) {
    const user = await db('users').where('id', req.user.id).select('id', 'email', 'full_name').first();
    if (user?.email) {
      emp = await db('hr_employees')
        .where('personal_email', user.email)
        .first();
    }
  }
  if (!emp) return res.status(404).json({ status: 'fail', message: 'No employee profile linked to this account.' });

  // Resolve the source terminal IP (SRS 5 — Step 3 IP verification)
  const rawIp = ip_address
    || req.headers['x-forwarded-for']?.split(',')[0]
    || req.ip
    || req.socket?.remoteAddress
    || '';
  const terminalIp = (String(rawIp).replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1') || '').trim();

  const terminal = await db('registered_computers')
    .where('status', 'Active')
    .where(function () { this.where('ip_address', terminalIp).orWhere('ip_range', terminalIp); })
    .first();
  if (!terminal) {
    return res.status(403).json({
      status: 'fail',
      message: `Unauthorized terminal. IP ${terminalIp || 'unknown'} is not an allowed attendance computer.`,
    });
  }

  const now = new Date();
  const today = localDateStr(now);
  const hhmmss = now.toTimeString().slice(0, 8);
  const curWeek = isoWeekOf(now);

  const existing = await db('etp_daily_attendance')
    .where({ employee_id: emp.employee_id, attendance_date: today })
    .first();

  if (existing) {
    await db('etp_daily_attendance')
      .where('record_id', existing.record_id)
      .update({
        attendance_status: 'Present',
        auth_method: method,
        terminal_ip: terminalIp,
        actual_start_time: existing.actual_start_time || hhmmss,
        year_number: now.getFullYear(),
        month_number: now.getMonth() + 1,
        week_number: curWeek.week,
        calculated_date: now,
      });
  } else {
    await db('etp_daily_attendance').insert({
      employee_id: emp.employee_id,
      attendance_date: today,
      week_number: curWeek.week,
      month_number: now.getMonth() + 1,
      year_number: now.getFullYear(),
      actual_start_time: hhmmss,
      net_work_hours: 0,
      scheduled_hours: 8,
      late_minutes: 0,
      early_leave_minutes: 0,
      overtime_hours: 0,
      attendance_status: 'Present',
      is_manual_override: 'No',
      auth_method: method,
      terminal_ip: terminalIp,
    });
  }

  res.json({
    status: 'success',
    data: {
      message: `Scan accepted at ${terminal.computer_name} (${terminalIp})`,
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      time_in: hhmmss,
      auth_method: method,
      auth_label: authLabel(method),
      terminal_ip: terminalIp,
      computer_name: terminal.computer_name,
      status: 'P',
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALLOWED COMPUTERS / IP MANAGEMENT PANEL (SRS 5.1 & 6.1 — HR exclusive)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllowedComputers = catchAsync(async (req, res) => {
  const rows = await db('registered_computers').orderBy('computer_name');
  res.json({ status: 'success', data: rows });
});

exports.registerAllowedComputer = catchAsync(async (req, res) => {
  const { computer_name, ip_address, location, department, mac_address } = req.body;
  if (!computer_name || !ip_address) {
    throw new AppError('computer_name and ip_address are required', 400);
  }
  const addedBy = await db('hr_employees').where('user_id', req.user?.id).first();
  const computer_id = 'COM-' + String(Date.now()).slice(-6);
  await db('registered_computers').insert({
    computer_id,
    computer_name,
    ip_address,
    location: location || null,
    department: department || null,
    mac_address: mac_address || null,
    status: 'Active',
    added_by_hr_id: addedBy ? addedBy.employee_id : null,
  });
  res.status(201).json({ status: 'success', data: { computer_id, ip_address, status: 'Active' } });
});

exports.toggleAllowedComputer = catchAsync(async (req, res) => {
  const comp = await db('registered_computers').where('computer_id', req.params.id).first();
  if (!comp) return res.status(404).json({ status: 'fail', message: 'Computer not found' });
  const next = comp.status === 'Active' ? 'Inactive' : 'Active';
  await db('registered_computers').where('computer_id', comp.computer_id).update({ status: next });
  res.json({ status: 'success', data: { computer_id: comp.computer_id, ip_address: comp.ip_address, status: next } });
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
  const { month } = req.query;
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = now.getFullYear();
  const today = toDateOnly(now);

  let emp = await db('hr_employees as e')
    .leftJoin('departments as d', 'e.dept_id', 'd.id')
    .select('e.employee_id', 'e.full_name', 'e.hire_date', 'd.name as dept_name', 'e.position_id')
    .where('e.user_id', req.user?.id)
    .first();

  // Fallback: link by email if the user has no user_id on their HR profile
  let user = null;
  if (!emp && req.user?.id) {
    user = await db('users').where('id', req.user.id).select('id', 'email', 'full_name').first();
    if (user?.email) {
      emp = await db('hr_employees as e')
        .leftJoin('departments as d', 'e.dept_id', 'd.id')
        .select('e.employee_id', 'e.full_name', 'e.hire_date', 'd.name as dept_name', 'e.position_id')
        .where('e.personal_email', user.email)
        .first();
    }
  }

  // No HR attendance profile linked — render a graceful empty state (no 404)
  if (!emp) {
    return res.json({
      status: 'success',
      data: {
        linked: false,
        full_name: user?.full_name || req.user?.full_name || req.user?.name || `User #${req.user?.id || ''}`,
        employee_id: null,
        dept_name: null,
        hire_date: null,
        today: { attendance_date: today, status: 'A', attendance_status: 'Not Recorded', time_in: '', time_out: '', net_work_hours: '0.00', auth_label: '—', auth_method: null, terminal_ip: null },
        log: [],
        monthly: {
          month: m,
          year: y,
          month_label: new Date(y, m - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
          work_days: 0, days_present: 0, days_absent: 0, attendance_rate: 0,
          total_hours: 0, late_minutes: 0, method_counts: {},
        },
      },
    });
  }

  // Daily log: most recent 40 records
  const log = await db('etp_daily_attendance')
    .where('employee_id', emp.employee_id)
    .orderBy('attendance_date', 'desc')
    .limit(40)
    .select('record_id', 'employee_id', db.raw('DATE_FORMAT(attendance_date, "%Y-%m-%d") as attendance_date'), 'actual_start_time', 'actual_end_time',
      'net_work_hours', 'late_minutes', 'overtime_hours', 'attendance_status',
      'auth_method', 'terminal_ip', 'is_manual_override', 'override_reason', 'month_number', 'year_number');

  // Today's status
  const todayRec = log.find(r => toDateOnly(r.attendance_date) === today)
    || await db('etp_daily_attendance')
      .where({ employee_id: emp.employee_id, year_number: now.getFullYear(), month_number: now.getMonth() + 1 })
      .select('record_id', db.raw('DATE_FORMAT(attendance_date, "%Y-%m-%d") as attendance_date'), 'actual_start_time', 'actual_end_time', 'net_work_hours',
        'attendance_status', 'auth_method', 'terminal_ip', 'is_manual_override')
      .orderBy('attendance_date', 'desc').first();

  // Monthly summary (live)
  const monthRows = await db('etp_daily_attendance')
    .where({ employee_id: emp.employee_id, month_number: m, year_number: y });
  const work_days = monthRows.length;
  const days_present = monthRows.filter(attendanceIsPresent).length;
  const days_absent = work_days - days_present;
  const attendance_rate = work_days > 0 ? Math.round((days_present / work_days) * 1000) / 10 : 0;
  const total_hours = monthRows.reduce((s, r) => s + Number(r.net_work_hours || 0), 0);
  const late_minutes = monthRows.reduce((s, r) => s + Number(r.late_minutes || 0), 0);
  const methodCounts = monthRows.reduce((acc, r) => {
    const k = authLabel(r.auth_method);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  res.json({
    status: 'success',
    data: {
      linked: true,
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      dept_name: emp.dept_name,
      hire_date: emp.hire_date,
      today: todayRec ? {
        attendance_date: toDateOnly(todayRec.attendance_date),
        status: attendanceIsPresent(todayRec) ? 'P' : 'A',
        attendance_status: todayRec.attendance_status || 'Not Recorded',
        time_in: timeHMM(todayRec.actual_start_time),
        time_out: timeHMM(todayRec.actual_end_time),
        net_work_hours: Number(todayRec.net_work_hours || 0).toFixed(2),
        auth_method: todayRec.auth_method || null,
        auth_label: authLabel(todayRec.auth_method),
        terminal_ip: todayRec.terminal_ip || null,
        is_manual_override: todayRec.is_manual_override || 'No',
      } : { attendance_date: today, status: 'A', attendance_status: 'Not Recorded', time_in: '', auth_label: '—' },
      log: log.map(r => ({
        record_id: r.record_id,
        attendance_date: toDateOnly(r.attendance_date),
        time_in: timeHMM(r.actual_start_time),
        time_out: timeHMM(r.actual_end_time),
        net_work_hours: Number(r.net_work_hours || 0).toFixed(2),
        late_minutes: r.late_minutes || 0,
        overtime_hours: Number(r.overtime_hours || 0).toFixed(2),
        status: attendanceIsPresent(r) ? 'P' : 'A',
        attendance_status: r.attendance_status || 'Not Recorded',
        auth_label: authLabel(r.auth_method),
        auth_method: r.auth_method || null,
        terminal_ip: r.terminal_ip || null,
        month_number: r.month_number,
        year_number: r.year_number,
      })),
      monthly: {
        month: m,
        year: y,
        month_label: new Date(y, m - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
        work_days,
        days_present,
        days_absent,
        attendance_rate,
        total_hours: Math.round(total_hours * 100) / 100,
        late_minutes,
        method_counts: methodCounts,
      },
    }
  });
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

  // Full detail: payslip + employee profile (name, dept, position, payment info)
  // Same source as HR employee list: departments.name, roles.name (position_id -> roles.id)
  const payslips = await db('payroll_salary_components')
    .leftJoin('hr_employees', 'payroll_salary_components.employee_id', 'hr_employees.employee_id')
    .leftJoin('departments', 'hr_employees.dept_id', 'departments.id')
    .leftJoin('roles', 'hr_employees.position_id', 'roles.id')
    .select(
      'payroll_salary_components.*',
      'hr_employees.full_name',
      'hr_employees.payment_method',
      'hr_employees.bank_name',
      'hr_employees.bank_account_number',
      'hr_employees.hire_date',
      'departments.name as department_name',
      'roles.name as position_title'
    )
    .where('payroll_salary_components.employee_id', empId)
    .orderBy([{ column: 'year_number', order: 'desc' }, { column: 'month_number', order: 'desc' }]);

  // Fallbacks so the payslip never shows N/A
  const enriched = payslips.map(p => ({
    ...p,
    full_name: p.full_name || empRecord?.full_name || 'Employee',
    department_name: p.department_name || '—',
    position_title: p.position_title || 'Staff Member',
  }));

  res.json({ status: 'success', data: enriched });
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

  // Final HR step: make sure the linked user carries the standard Employee role
  const linkedUser = await resolveLinkedUser({ user_id: emp.user_id, personal_email: emp.personal_email });
  if (linkedUser) {
    await ensureEmployeeRole(linkedUser.id, req.user?.id);
    if (emp.personal_email !== linkedUser.email) {
      await db('hr_employees').where('employee_id', id).update({ personal_email: linkedUser.email, user_id: linkedUser.id });
    }
  }

  res.json({ status: 'success', message: `${emp.full_name}'s registration is fully completed and active.` });
});

