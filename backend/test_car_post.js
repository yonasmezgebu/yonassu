const { db } = require('./src/config/database');
const carRepository = require('./src/repositories/car.repository');

async function testPost() {
  try {
    const dataToInsert = {
      name: 'Test Car 123',
      daily_rate: 1500,
      seats: 4,
      transmission: 'Manual',
      fuel_type: 'Petrol',
      car_type: 'Sedan',
      description: 'Test description',
      availability: 'Available'
    };
    
    console.log('Inserting...', dataToInsert);
    const newCar = await carRepository.createAndReturn(dataToInsert);
    console.log('Created:', newCar);
  } catch (err) {
    console.error('Error creating car:', err.message);
    console.error(err);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

testPost();
