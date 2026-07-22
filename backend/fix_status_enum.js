require('dotenv').config();
const { db } = require('./src/config/database');

async function fix() {
  try {
    await db.raw(`ALTER TABLE job_applications MODIFY COLUMN status ENUM('PENDING','IN_PERSON_INVITED','SUBMITTED_TO_CEO','REJECTED','APPROVED') DEFAULT 'PENDING'`);
    console.log('✅ ENUM updated — APPROVED is now a valid status!');
    const [rows] = await db.raw(`SHOW COLUMNS FROM job_applications LIKE 'status'`);
    console.log('New column definition:', rows[0]);
  } catch (e) {
    console.error('❌ ALTER failed:', e.message);
  }
  process.exit(0);
}

fix();
