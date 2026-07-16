const { db } = require('./src/config/database');

async function test() {
  try {
    await db('hr_employees').insert({
      employee_id: 'EMP-9999',
      full_name: 'Test',
      national_id: '',
      gender: 'Male',
      dept_id: '',
      position_id: '',
      base_salary: 0,
      housing_allowance: 0,
      transport_allowance: 0,
      bank_name: null,
      bank_account_number: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      has_pc_access: 'No',
      shift_start_time: '09:00',
      shift_end_time: '18:00',
      weekly_off_days: 'Friday,Saturday',
      personal_phone: '',
      physical_address: null,
      personal_email: 'EMP-9999@sutana.com',
      employment_status: 'Active',
      employment_type: 'Permanent',
      date_of_birth: null,
      marital_status: 'Single',
      document_path: null,
      hire_date: new Date(),
      overtime_rate: 1.5
    });
    console.log('Insert success');
    await db('hr_employees').where('employee_id', 'EMP-9999').del();
  } catch (err) {
    console.error('Insert error:', err.message);
  } finally {
    process.exit(0);
  }
}
test();
