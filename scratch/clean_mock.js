const { db } = require('./backend/src/config/database');

async function cleanMockData() {
  try {
    console.log('Cleaning pos_sales...');
    await db('pos_sales').del();
    
    console.log('Cleaning pos_sale_items...');
    await db('pos_sale_items').del();

    console.log('Cleaning pos_audit_trail...');
    await db('pos_audit_trail').del();

    console.log('Mock data deleted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning mock data:', error);
    process.exit(1);
  }
}

cleanMockData();
