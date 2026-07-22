require('dotenv').config();
const { db } = require('./src/config/database');

async function fix() {
  try {
    await db.raw(`ALTER TABLE job_applications MODIFY COLUMN status ENUM('PENDING','IN_PERSON_INVITED','SUBMITTED_TO_CEO','REJECTED','APPROVED','INFORMED') DEFAULT 'PENDING'`);
    console.log('✅ ENUM updated — INFORMED is now a valid status!');
  } catch (e) {
    console.error('❌ ALTER failed:', e.message);
  }
  process.exit(0);
}

fix();
