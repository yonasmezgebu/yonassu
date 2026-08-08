// Run this to add id_front_image and id_back_image columns to job_applications
const { db } = require('./src/config/database');

async function run() {
  try {
    const hasIdFront = await db.schema.hasColumn('job_applications', 'id_front_image');
    const hasIdBack  = await db.schema.hasColumn('job_applications', 'id_back_image');

    if (!hasIdFront || !hasIdBack) {
      await db.schema.table('job_applications', table => {
        if (!hasIdFront) table.string('id_front_image').nullable();
        if (!hasIdBack)  table.string('id_back_image').nullable();
      });
      console.log('✅ Added id_front_image and id_back_image columns to job_applications');
    } else {
      console.log('ℹ️  Columns already exist, skipping.');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await db.destroy();
  }
}

run();
