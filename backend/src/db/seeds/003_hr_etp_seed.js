exports.seed = async function (knex) {
  // ─── HR NOTIFICATION RULES ─────────────────────────────────────────────────
  const rulesExist = await knex('hr_notification_rules').first();
  if (!rulesExist) {
    await knex('hr_notification_rules').insert([
      { rule_id: 'R-001', rule_name: 'Shift Abandonment Alert', priority: 'CRITICAL', trigger_condition: 'CURRENT_TIME > shift_start_time + 2h AND last_heartbeat > 2h ago', recipient_roles: 'CEO,HR,Dept_Head', action_type: 'Alert', is_active: 'Yes' },
      { rule_id: 'R-002', rule_name: 'Excessive Overtime Alert', priority: 'HIGH', trigger_condition: 'weekly_hours > 48 by Thursday', recipient_roles: 'CEO,HR,Manager', action_type: 'Alert', is_active: 'Yes' },
      { rule_id: 'R-003', rule_name: 'Department Absenteeism Spike', priority: 'HIGH', trigger_condition: 'absent > 15% dept total', recipient_roles: 'CEO,Dept_Head,HR', action_type: 'Alert', is_active: 'Yes' },
      { rule_id: 'R-004', rule_name: 'Monthly Payroll Ready', priority: 'MEDIUM', trigger_condition: 'payroll_calculated = TRUE', recipient_roles: 'CEO,Board', action_type: 'Approval', is_active: 'Yes' },
      { rule_id: 'R-005', rule_name: 'Manual Entry Pending Approval', priority: 'MEDIUM', trigger_condition: 'manual_entries_submitted = TRUE', recipient_roles: 'CEO,HR', action_type: 'Approval', is_active: 'Yes' },
      { rule_id: 'R-006', rule_name: 'New Hire Registered', priority: 'LOW', trigger_condition: 'employee_created = TRUE', recipient_roles: 'CEO,Dept_Head,HR', action_type: 'Alert', is_active: 'Yes' },
      { rule_id: 'R-007', rule_name: 'Salary Discrepancy Alert', priority: 'HIGH', trigger_condition: 'salary > budget * 1.20', recipient_roles: 'CEO,Finance', action_type: 'Alert', is_active: 'Yes' },
      { rule_id: 'R-008', rule_name: 'Probation Expiry Reminder', priority: 'MEDIUM', trigger_condition: 'probation_end <= 7 days', recipient_roles: 'HR,Manager,CEO', action_type: 'Alert', is_active: 'Yes' },
      { rule_id: 'R-009', rule_name: 'Contract Expiry Reminder', priority: 'MEDIUM', trigger_condition: 'contract_end <= 30 days', recipient_roles: 'HR,Manager,CEO', action_type: 'Alert', is_active: 'Yes' },
      { rule_id: 'R-010', rule_name: 'Excessive Late Arrivals', priority: 'MEDIUM', trigger_condition: 'late_days_in_week > 5', recipient_roles: 'Manager,HR', action_type: 'Alert', is_active: 'Yes' },
    ]);
  }

  // ─── HR DEPARTMENTS ───────────────────────────────────────────────────────
  const deptsExist = await knex('hr_departments').first();
  if (!deptsExist) {
    await knex('hr_departments').insert([
      { dept_id: 'DEP-001', dept_name: 'Executive', dept_code: 'EXEC', budget_code: 'BUD-EXEC' },
      { dept_id: 'DEP-002', dept_name: 'IT', dept_code: 'IT', budget_code: 'BUD-IT' },
      { dept_id: 'DEP-003', dept_name: 'Sales', dept_code: 'SALES', budget_code: 'BUD-SALES' },
      { dept_id: 'DEP-004', dept_name: 'Production', dept_code: 'PROD', budget_code: 'BUD-PROD' },
      { dept_id: 'DEP-005', dept_name: 'HR', dept_code: 'HR', budget_code: 'BUD-HR' },
      { dept_id: 'DEP-006', dept_name: 'Finance', dept_code: 'FIN', budget_code: 'BUD-FIN' },
      { dept_id: 'DEP-007', dept_name: 'Admin', dept_code: 'ADMIN', budget_code: 'BUD-ADMIN' },
    ]);
  }

  // ─── HR POSITIONS ─────────────────────────────────────────────────────────
  const posExist = await knex('hr_positions').first();
  if (!posExist) {
    await knex('hr_positions').insert([
      { position_id: 'POS-001', position_title: 'CEO', position_level: 'Executive', dept_id: 'DEP-001', budgeted_salary: 20000 },
      { position_id: 'POS-002', position_title: 'Department Head', position_level: 'Management', dept_id: 'DEP-002', budgeted_salary: 12000 },
      { position_id: 'POS-003', position_title: 'Senior Developer', position_level: 'Professional', dept_id: 'DEP-002', budgeted_salary: 6100 },
      { position_id: 'POS-004', position_title: 'Developer', position_level: 'Professional', dept_id: 'DEP-002', budgeted_salary: 4200 },
      { position_id: 'POS-005', position_title: 'Network Engineer', position_level: 'Professional', dept_id: 'DEP-002', budgeted_salary: 5500 },
      { position_id: 'POS-006', position_title: 'Production Worker', position_level: 'Staff', dept_id: 'DEP-004', budgeted_salary: 3200 },
    ]);
  }

  // ─── SAMPLE EMPLOYEES ─────────────────────────────────────────────────────
  // Get users to link employee records to actual login accounts
  const users = await knex('users').select('id', 'email');

  const userMap = {};
  users.forEach(u => { userMap[u.email] = u.id; });

  const empExist = await knex('hr_employees').first();
  if (!empExist) {
    await knex('hr_employees').insert([
      { employee_id: 'EMP-2026-001', full_name: 'Kidist Belay',    user_id: userMap['admin@sutana.com'] || null, dept_id: 'DEP-007', position_id: 'POS-002', base_salary: 5000, hire_date: '2020-01-15', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'Yes', shift_start_time: '09:00', shift_end_time: '18:00', weekly_off_days: 'Friday,Saturday', personal_phone: '0911000000', personal_email: 'admin@sutana.com',    physical_address: 'Addis Ababa, Bole', emergency_contact_name: 'Parent', emergency_contact_phone: '0999000001', date_of_birth: '1990-05-15', gender: 'Female', marital_status: 'Single', national_id: 'ID-0001', contract_end_date: null, overtime_rate: 1.5 },
      { employee_id: 'EMP-2026-002', full_name: 'Habtamu Abera',   user_id: userMap['ceo@sutana.com'] || null,  dept_id: 'DEP-001', position_id: 'POS-001', base_salary: 20000, hire_date: '2019-03-01', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'Yes', shift_start_time: '08:00', shift_end_time: '17:00', weekly_off_days: 'Friday,Saturday', personal_phone: '0912345671', personal_email: 'ceo@sutana.com',     physical_address: 'Addis Ababa, CMC', emergency_contact_name: 'Spouse', emergency_contact_phone: '0999000002', date_of_birth: '1975-08-20', gender: 'Male', marital_status: 'Married', national_id: 'ID-0002', contract_end_date: null, overtime_rate: 1.5 },
      { employee_id: 'EMP-2026-003', full_name: 'Melat Sisay',     user_id: userMap['finance@sutana.com'] || null,  dept_id: 'DEP-006', position_id: 'POS-002', base_salary: 12000, hire_date: '2020-06-01', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'Yes', shift_start_time: '09:00', shift_end_time: '18:00', weekly_off_days: 'Friday,Saturday', personal_phone: '0912345672', personal_email: 'finance@sutana.com',  physical_address: 'Addis Ababa, Kazanchis', emergency_contact_name: 'Brother', emergency_contact_phone: '0999000003', date_of_birth: '1988-11-10', gender: 'Female', marital_status: 'Married', national_id: 'ID-0003', contract_end_date: null, overtime_rate: 1.5 },
      { employee_id: 'EMP-2026-004', full_name: 'Ephrem Abebe',    user_id: userMap['printing@sutana.com'] || null, dept_id: 'DEP-004', position_id: 'POS-002', base_salary: 12000, hire_date: '2021-02-15', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'Yes', shift_start_time: '08:00', shift_end_time: '17:00', weekly_off_days: 'Friday,Saturday', personal_phone: '0912345673', personal_email: 'printing@sutana.com', physical_address: 'Addis Ababa, Merkato', emergency_contact_name: 'Sister', emergency_contact_phone: '0999000004', date_of_birth: '1985-04-02', gender: 'Male', marital_status: 'Married', national_id: 'ID-0004', contract_end_date: null, overtime_rate: 1.5 },
      { employee_id: 'EMP-2026-005', full_name: 'Getaneh Mihtere', user_id: userMap['purchase@sutana.com'] || null, dept_id: 'DEP-003', position_id: 'POS-002', base_salary: 12000, hire_date: '2021-09-01', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'Yes', shift_start_time: '09:00', shift_end_time: '18:00', weekly_off_days: 'Friday,Saturday', personal_phone: '0912345674', personal_email: 'purchase@sutana.com', physical_address: 'Addis Ababa, Bole', emergency_contact_name: 'Mother', emergency_contact_phone: '0999000005', date_of_birth: '1992-07-18', gender: 'Male', marital_status: 'Single', national_id: 'ID-0005', contract_end_date: null, overtime_rate: 1.5 },
      { employee_id: 'EMP-2026-006', full_name: 'Shibabaw Alemu',  user_id: userMap['inventory@sutana.com'] || null, dept_id: 'DEP-004', position_id: 'POS-006', base_salary: 3200, hire_date: '2022-05-10', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'No', shift_start_time: '08:00', shift_end_time: '17:00', weekly_off_days: 'Friday', personal_phone: '0912345675', personal_email: 'inventory@sutana.com', physical_address: 'Addis Ababa, Akaki', emergency_contact_name: 'Father', emergency_contact_phone: '0999000006', date_of_birth: '1995-12-25', gender: 'Male', marital_status: 'Single', national_id: 'ID-0006', contract_end_date: null, overtime_rate: 1.5 },
      { employee_id: 'EMP-2026-007', full_name: 'Dereje Alemneh',  user_id: userMap['sales@sutana.com'] || null,  dept_id: 'DEP-003', position_id: 'POS-004', base_salary: 4200, hire_date: '2023-01-15', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'Yes', shift_start_time: '09:00', shift_end_time: '18:00', weekly_off_days: 'Friday,Saturday', personal_phone: '0901407032', personal_email: 'sales@sutana.com',    physical_address: 'Addis Ababa, Summit', emergency_contact_name: 'Wife', emergency_contact_phone: '0999000007', date_of_birth: '1990-03-12', gender: 'Male', marital_status: 'Married', national_id: 'ID-0007', contract_end_date: null, overtime_rate: 1.5 },
      { employee_id: 'EMP-2026-008', full_name: 'Misrak Tsehayneh', user_id: userMap['employ@sutana.com'] || null, dept_id: 'DEP-005', position_id: 'POS-004', base_salary: 4200, hire_date: '2023-06-01', employment_type: 'Permanent', employment_status: 'Active', has_pc_access: 'Yes', shift_start_time: '09:00', shift_end_time: '18:00', weekly_off_days: 'Friday,Saturday', personal_phone: '0936194641', personal_email: 'employ@sutana.com', physical_address: 'Addis Ababa, Bole', emergency_contact_name: 'Parent', emergency_contact_phone: '0999000008', date_of_birth: '1995-08-15', gender: 'Female', marital_status: 'Single', national_id: 'ID-0008', contract_end_date: null, overtime_rate: 1.5 },
    ]);
  }

  // Fix: link any existing employees without user_id to matching users by email
  const unlinked = await knex('hr_employees').whereNull('user_id').orWhere('user_id', 0);
  for (const emp of unlinked) {
    const match = users.find(u => u.email === emp.personal_email);
    if (match) {
      await knex('hr_employees').where('employee_id', emp.employee_id).update({ user_id: match.id });
    }
  }

  // Link manager references (direct_manager_id points to employee_id)
  const ceoEmp = await knex('hr_employees').where('user_id', userMap['ceo@sutana.com']).first();
  if (ceoEmp) {
    await knex('hr_employees').whereNot('employee_id', ceoEmp.employee_id).update({ direct_manager_id: ceoEmp.employee_id });
  }
};
