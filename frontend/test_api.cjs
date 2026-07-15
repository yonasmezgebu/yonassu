const axios = require('axios');

async function testApi() {
  try {
    const data = {
      full_name: 'Test Create Api',
      national_id: '',
      date_of_birth: '',
      gender: 'Male',
      marital_status: 'Single',
      personal_phone: '',
      personal_email: '',
      physical_address: '',
      dept_id: '',
      position_id: '',
      direct_manager_id: '',
      hire_date: '',
      employment_type: 'Permanent',
      base_salary: '',
      housing_allowance: '',
      transport_allowance: '',
      communication_allowance: '',
      bank_name: '',
      bank_account_number: '',
      has_pc_access: 'No',
      shift_start_time: '08:00',
      shift_end_time: '17:00',
      weekly_off_days: 'Saturday,Sunday',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    };
    const res = await axios.post('http://localhost:5000/api/v1/hr/etp/employees', data);
    console.log('Success:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error status:', err.response.status);
      console.log('Error data:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}
testApi();
