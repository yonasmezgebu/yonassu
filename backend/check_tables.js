const { db } = require('./src/config/database');

async function listTables() {
  try {
    const [rows] = await db.raw('SHOW TABLES');
    const tableKey = Object.keys(rows[0])[0];
    const tables = rows.map(r => r[tableKey]).filter(t => t.includes('car'));
    console.log('Tables containing "car":', tables);
    
    // Check cars table rows
    if (tables.includes('cars')) {
      const allCars = await db('cars').select('*');
      console.log('Cars in DB:', allCars.length);
      console.log(allCars);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

listTables();
