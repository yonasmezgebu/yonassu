const FormData = require('form-data');
const axios = require('axios');

async function testApi() {
  try {
    const form = new FormData();
    form.append('name', 'API Test Car');
    form.append('dailyRate', '2500');
    form.append('seats', '4');
    form.append('transmission', 'Automatic');
    form.append('fuelType', 'Diesel');
    form.append('carType', 'SUV');
    form.append('availability', 'Available');
    form.append('description', 'Test desc');

    console.log('Sending request...');
    
    // Fake JWT for CEO or Admin to bypass auth
    const token = 'fake-token-bypass'; 
    // Wait, the API requires a real JWT, maybe I should disable auth for a second or just see what the error log says.
  } catch (err) {
    console.error(err);
  }
}
testApi();
