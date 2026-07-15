const { db } = require('./src/config/database');

async function testUpdate() {
  try {
    const fields = ['full_name', 'national_id', 'gender', 'dept_id', 'position_id',
      'base_salary', 'housing_allowance', 'transport_allowance', 'has_pc_access',
      'shift_start_time', 'shift_end_time', 'employment_status', 'employment_type',
      'personal_phone', 'physical_address', 'personal_email', 'overtime_rate', 'bank_name', 'bank_account_number',
      'emergency_contact_name', 'emergency_contact_phone', 'date_of_birth', 'marital_status', 'document_path'];

    const reqBody = {
      full_name: 'Test Update',
      base_salary: '',
      date_of_birth: '',
      marital_status: 'Single'
    };

    const updates = {};
    for (const f of fields) {
      if (reqBody[f] !== undefined) {
        if (reqBody[f] === '') {
          updates[f] = null;
        } else {
          updates[f] = reqBody[f];
        }
      }
    }
    console.log('Updates object:', updates);

    // Get an existing employee ID to test
    const emp = await db('hr_employees').first();
    if (!emp) {
      console.log('No employee to update');
      return;
    }

    await db('hr_employees').where('employee_id', emp.employee_id).update(updates);
    console.log('Update success');
  } catch (err) {
    console.error('Update error:', err.message);
  } finally {
    process.exit(0);
  }
}
testUpdate();
