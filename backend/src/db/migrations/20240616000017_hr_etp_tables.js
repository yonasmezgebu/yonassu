exports.up = async function (knex) {
  // ─── HR DEPARTMENTS ──────────────────────────────────────────────────────
  const hasHrDept = await knex.schema.hasTable('hr_departments');
  if (!hasHrDept) {
    await knex.schema.createTable('hr_departments', (t) => {
      t.string('dept_id', 20).primary();
      t.string('dept_name', 100).notNullable();
      t.string('dept_code', 10);
      t.string('head_employee_id', 20);
      t.string('budget_code', 20);
      t.datetime('created_date').defaultTo(knex.fn.now());
      t.datetime('modified_date').defaultTo(knex.fn.now());
      t.string('status', 20).defaultTo('Active');
    });
  }

  // ─── HR UNITS ─────────────────────────────────────────────────────────────
  const hasHrUnit = await knex.schema.hasTable('hr_units');
  if (!hasHrUnit) {
    await knex.schema.createTable('hr_units', (t) => {
      t.string('unit_id', 20).primary();
      t.string('unit_name', 100).notNullable();
      t.string('dept_id', 20).references('dept_id').inTable('hr_departments').onDelete('SET NULL');
      t.string('unit_head_id', 20);
      t.datetime('created_date').defaultTo(knex.fn.now());
      t.string('status', 20).defaultTo('Active');
    });
  }

  // ─── HR POSITIONS ─────────────────────────────────────────────────────────
  const hasHrPos = await knex.schema.hasTable('hr_positions');
  if (!hasHrPos) {
    await knex.schema.createTable('hr_positions', (t) => {
      t.string('position_id', 20).primary();
      t.string('position_title', 100).notNullable();
      t.string('position_level', 50);
      t.string('dept_id', 20).references('dept_id').inTable('hr_departments').onDelete('SET NULL');
      t.decimal('budgeted_salary', 12, 2);
      t.datetime('created_date').defaultTo(knex.fn.now());
      t.string('status', 20).defaultTo('Active');
    });
  }

  // ─── HR EMPLOYEES (Master File) ──────────────────────────────────────────
  const hasHrEmp = await knex.schema.hasTable('hr_employees');
  if (!hasHrEmp) {
    await knex.schema.createTable('hr_employees', (t) => {
      t.string('employee_id', 20).primary();
      t.string('full_name', 150).notNullable();
      t.string('national_id', 50);
      t.date('date_of_birth');
      t.string('gender', 10);
      t.string('marital_status', 20);
      t.string('profile_photo_path', 255);
      t.string('personal_phone', 20);
      t.string('emergency_contact_name', 150);
      t.string('emergency_contact_phone', 20);
      t.string('personal_email', 100);
      t.text('physical_address');
      t.string('dept_id', 20).references('dept_id').inTable('hr_departments').onDelete('SET NULL');
      t.string('unit_id', 20).references('unit_id').inTable('hr_units').onDelete('SET NULL');
      t.string('position_id', 20).references('position_id').inTable('hr_positions').onDelete('SET NULL');
      t.string('direct_manager_id', 20);
      t.date('hire_date');
      t.date('contract_end_date');
      t.string('employment_type', 20).defaultTo('Permanent');
      t.date('probation_end_date');
      t.decimal('base_salary', 12, 2).defaultTo(0);
      t.decimal('housing_allowance', 12, 2).defaultTo(0);
      t.decimal('transport_allowance', 12, 2).defaultTo(0);
      t.decimal('communication_allowance', 12, 2).defaultTo(0);
      t.decimal('overtime_rate', 5, 2).defaultTo(1.5);
      t.string('bank_name', 100);
      t.string('bank_account_number', 50);
      t.string('employment_status', 20).defaultTo('Active');
      t.date('termination_date');
      t.text('termination_reason');
      t.string('rehire_eligible', 3).defaultTo('Yes');
      t.string('created_by', 50);
      t.datetime('created_date').defaultTo(knex.fn.now());
      t.string('last_modified_by', 50);
      t.datetime('last_modified_date').defaultTo(knex.fn.now());
      t.string('has_pc_access', 3).defaultTo('No');
      t.time('shift_start_time');
      t.time('shift_end_time');
      t.string('weekly_off_days', 50);
    });
  }

  // ─── HR EMPLOYEE DOCUMENTS ────────────────────────────────────────────────
  const hasHrDoc = await knex.schema.hasTable('hr_employee_documents');
  if (!hasHrDoc) {
    await knex.schema.createTable('hr_employee_documents', (t) => {
      t.increments('doc_id');
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.string('doc_type', 50);
      t.string('doc_name', 200);
      t.string('doc_path', 255);
      t.datetime('upload_date').defaultTo(knex.fn.now());
      t.string('uploaded_by', 50);
    });
  }

  // ─── ETP AGENT INSTALLATIONS ──────────────────────────────────────────────
  const hasAgent = await knex.schema.hasTable('etp_agent_installations');
  if (!hasAgent) {
    await knex.schema.createTable('etp_agent_installations', (t) => {
      t.string('agent_id', 20).primary();
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.string('pc_name', 100);
      t.string('mac_address', 50);
      t.string('ip_address', 50);
      t.datetime('last_heartbeat');
      t.string('agent_version', 20).defaultTo('1.0.0');
      t.datetime('installation_date').defaultTo(knex.fn.now());
      t.string('status', 20).defaultTo('Active');
    });
  }

  // ─── ETP SESSION LOGS (Raw Data) ──────────────────────────────────────────
  const hasSession = await knex.schema.hasTable('etp_session_logs');
  if (!hasSession) {
    await knex.schema.createTable('etp_session_logs', (t) => {
      t.increments('session_id');
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.date('log_date');
      t.datetime('pc_login_time');
      t.datetime('pc_logout_time');
      t.integer('total_idle_seconds').defaultTo(0);
      t.integer('total_active_seconds').defaultTo(0);
      t.string('source_type', 20).defaultTo('PC_AGENT');
      t.string('is_override', 3).defaultTo('No');
      t.text('override_reason');
      t.string('entry_by', 50);
      t.datetime('entry_date').defaultTo(knex.fn.now());
    });
  }

  // ─── ETP HEARTBEAT LOGS (Real-time) ───────────────────────────────────────
  const hasHb = await knex.schema.hasTable('etp_heartbeat_logs');
  if (!hasHb) {
    await knex.schema.createTable('etp_heartbeat_logs', (t) => {
      t.increments('heartbeat_id');
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.datetime('heartbeat_time').defaultTo(knex.fn.now());
      t.string('status', 20).defaultTo('Online');
      t.integer('active_minutes').defaultTo(0);
      t.integer('idle_minutes').defaultTo(0);
      t.index(['employee_id', 'heartbeat_time'], 'idx_hb_emp_time');
    });
  }

  // ─── ETP DAILY ATTENDANCE ─────────────────────────────────────────────────
  const hasDaily = await knex.schema.hasTable('etp_daily_attendance');
  if (!hasDaily) {
    await knex.schema.createTable('etp_daily_attendance', (t) => {
      t.increments('record_id');
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.date('attendance_date');
      t.integer('week_number');
      t.integer('month_number');
      t.integer('year_number');
      t.time('actual_start_time');
      t.time('actual_end_time');
      t.decimal('net_work_hours', 6, 2).defaultTo(0);
      t.decimal('scheduled_hours', 6, 2).defaultTo(8);
      t.integer('late_minutes').defaultTo(0);
      t.integer('early_leave_minutes').defaultTo(0);
      t.decimal('overtime_hours', 6, 2).defaultTo(0);
      t.integer('absent_days').defaultTo(0);
      t.string('attendance_status', 20).defaultTo('Not Recorded');
      t.string('is_manual_override', 3).defaultTo('No');
      t.text('override_reason');
      t.datetime('calculated_date').defaultTo(knex.fn.now());
      t.unique(['employee_id', 'attendance_date'], 'idx_unique_attendance');
    });
  }

  // ─── ETP WEEKLY SUMMARY ───────────────────────────────────────────────────
  const hasWeekly = await knex.schema.hasTable('etp_weekly_summary');
  if (!hasWeekly) {
    await knex.schema.createTable('etp_weekly_summary', (t) => {
      t.increments('summary_id');
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.integer('week_number');
      t.integer('month_number');
      t.integer('year_number');
      t.date('week_start_date');
      t.date('week_end_date');
      t.decimal('total_worked_hours', 6, 2).defaultTo(0);
      t.integer('total_late_minutes').defaultTo(0);
      t.integer('total_absent_days').defaultTo(0);
      t.decimal('total_overtime_hours', 6, 2).defaultTo(0);
      t.datetime('calculated_date').defaultTo(knex.fn.now());
      t.unique(['employee_id', 'week_number', 'year_number'], 'idx_unique_weekly');
    });
  }

  // ─── ETP MONTHLY SUMMARY ──────────────────────────────────────────────────
  const hasMonthly = await knex.schema.hasTable('etp_monthly_summary');
  if (!hasMonthly) {
    await knex.schema.createTable('etp_monthly_summary', (t) => {
      t.increments('summary_id');
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.integer('month_number');
      t.integer('year_number');
      t.decimal('total_worked_hours', 8, 2).defaultTo(0);
      t.integer('total_late_minutes').defaultTo(0);
      t.integer('total_absent_days').defaultTo(0);
      t.decimal('total_overtime_hours', 6, 2).defaultTo(0);
      t.decimal('attendance_rate', 5, 2).defaultTo(0);
      t.decimal('punctuality_rate', 5, 2).defaultTo(0);
      t.datetime('calculated_date').defaultTo(knex.fn.now());
      t.unique(['employee_id', 'month_number', 'year_number'], 'idx_unique_monthly');
    });
  }

  // ─── PAYROLL SALARY COMPONENTS ────────────────────────────────────────────
  const hasPayComp = await knex.schema.hasTable('payroll_salary_components');
  if (!hasPayComp) {
    await knex.schema.createTable('payroll_salary_components', (t) => {
      t.increments('component_id');
      t.string('employee_id', 20).references('employee_id').inTable('hr_employees').onDelete('CASCADE');
      t.integer('month_number');
      t.integer('year_number');
      t.decimal('base_salary', 12, 2).defaultTo(0);
      t.decimal('housing_allowance', 12, 2).defaultTo(0);
      t.decimal('transport_allowance', 12, 2).defaultTo(0);
      t.decimal('communication_allowance', 12, 2).defaultTo(0);
      t.decimal('overtime_pay', 12, 2).defaultTo(0);
      t.decimal('bonus_pay', 12, 2).defaultTo(0);
      t.decimal('deduction_absent', 12, 2).defaultTo(0);
      t.decimal('deduction_loan', 12, 2).defaultTo(0);
      t.decimal('deduction_tax', 12, 2).defaultTo(0);
      t.decimal('deduction_pension', 12, 2).defaultTo(0);
      t.decimal('gross_pay', 12, 2).defaultTo(0);
      t.decimal('net_pay', 12, 2).defaultTo(0);
      t.datetime('calculated_date').defaultTo(knex.fn.now());
      t.string('status', 20).defaultTo('Draft');
      t.string('approved_by', 50);
      t.datetime('approved_date');
      t.unique(['employee_id', 'month_number', 'year_number'], 'idx_unique_payroll');
    });
  }

  // ─── PAYROLL DEPARTMENT AGGREGATION ───────────────────────────────────────
  const hasPayDept = await knex.schema.hasTable('payroll_department_aggregation');
  if (!hasPayDept) {
    await knex.schema.createTable('payroll_department_aggregation', (t) => {
      t.increments('agg_id');
      t.string('dept_id', 20).references('dept_id').inTable('hr_departments').onDelete('SET NULL');
      t.integer('month_number');
      t.integer('year_number');
      t.integer('employee_count').defaultTo(0);
      t.decimal('total_gross_pay', 12, 2).defaultTo(0);
      t.decimal('total_net_pay', 12, 2).defaultTo(0);
      t.decimal('total_overtime_pay', 12, 2).defaultTo(0);
      t.decimal('total_deductions', 12, 2).defaultTo(0);
      t.decimal('total_worked_hours', 10, 2).defaultTo(0);
      t.decimal('total_late_hours', 10, 2).defaultTo(0);
      t.integer('total_absent_days').defaultTo(0);
      t.datetime('calculated_date').defaultTo(knex.fn.now());
      t.unique(['dept_id', 'month_number', 'year_number'], 'idx_unique_dept_payroll');
    });
  }

  // ─── PAYROLL COMPANY AGGREGATION ──────────────────────────────────────────
  const hasPayCo = await knex.schema.hasTable('payroll_company_aggregation');
  if (!hasPayCo) {
    await knex.schema.createTable('payroll_company_aggregation', (t) => {
      t.increments('agg_id');
      t.integer('month_number');
      t.integer('year_number');
      t.integer('total_employees').defaultTo(0);
      t.decimal('company_gross_pay', 14, 2).defaultTo(0);
      t.decimal('company_net_pay', 14, 2).defaultTo(0);
      t.decimal('total_overtime_pay', 12, 2).defaultTo(0);
      t.decimal('total_deductions', 14, 2).defaultTo(0);
      t.decimal('total_worked_hours', 12, 2).defaultTo(0);
      t.decimal('total_late_hours', 10, 2).defaultTo(0);
      t.integer('total_absent_days').defaultTo(0);
      t.datetime('calculated_date').defaultTo(knex.fn.now());
      t.string('approval_status', 20).defaultTo('Draft');
      t.string('approved_by', 50);
      t.datetime('approved_date');
      t.text('rejection_reason');
      t.unique(['month_number', 'year_number'], 'idx_unique_company_payroll');
    });
  }

  // ─── HR NOTIFICATION RULES ────────────────────────────────────────────────
  const hasNotifRule = await knex.schema.hasTable('hr_notification_rules');
  if (!hasNotifRule) {
    await knex.schema.createTable('hr_notification_rules', (t) => {
      t.string('rule_id', 20).primary();
      t.string('rule_name', 100);
      t.text('trigger_condition');
      t.string('priority', 20).defaultTo('MEDIUM');
      t.string('recipient_roles', 100);
      t.string('action_type', 50).defaultTo('Alert');
      t.string('is_active', 3).defaultTo('Yes');
      t.datetime('created_date').defaultTo(knex.fn.now());
    });
  }

  // ─── HR NOTIFICATIONS LOG ─────────────────────────────────────────────────
  const hasNotifLog = await knex.schema.hasTable('hr_notifications_log');
  if (!hasNotifLog) {
    await knex.schema.createTable('hr_notifications_log', (t) => {
      t.increments('notification_id');
      t.string('rule_id', 20).references('rule_id').inTable('hr_notification_rules').onDelete('SET NULL');
      t.string('employee_id', 20);
      t.string('dept_id', 20);
      t.text('notification_message');
      t.string('priority', 20).defaultTo('MEDIUM');
      t.string('status', 20).defaultTo('Pending');
      t.string('recipient_user', 50);
      t.datetime('sent_date').defaultTo(knex.fn.now());
      t.datetime('read_date');
      t.datetime('acknowledge_date');
      t.text('action_taken');
    });
  }
};

exports.down = async function (knex) {
  const tables = [
    'payroll_company_aggregation',
    'payroll_department_aggregation',
    'payroll_salary_components',
    'etp_monthly_summary',
    'etp_weekly_summary',
    'etp_daily_attendance',
    'etp_heartbeat_logs',
    'etp_session_logs',
    'etp_agent_installations',
    'hr_employee_documents',
    'hr_employees',
    'hr_positions',
    'hr_units',
    'hr_departments',
    'hr_notifications_log',
    'hr_notification_rules',
  ];
  for (const t of tables) {
    const exists = await knex.schema.hasTable(t);
    if (exists) await knex.schema.dropTable(t);
  }
};
