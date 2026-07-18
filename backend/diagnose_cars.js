const { db } = require('./src/config/database');

async function diagnose() {
  try {
    console.log('=== Cars Table Diagnosis ===\n');

    // 1. Count all cars (including soft deleted)
    const all = await db('cars').count('id as count').first();
    console.log('Total rows in cars table (incl. deleted):', all.count);

    // 2. Count non-deleted
    const active = await db('cars').whereNull('deleted_at').count('id as count').first();
    console.log('Non-deleted cars (visible to public):', active.count);

    // 3. Count soft-deleted
    const deleted = await db('cars').whereNotNull('deleted_at').count('id as count').first();
    console.log('Soft-deleted cars (hidden):', deleted.count);

    // 4. List all cars with their deleted_at
    const cars = await db('cars').select('id', 'name', 'availability', 'deleted_at', 'created_at');
    console.log('\nAll cars detail:');
    if (cars.length === 0) {
      console.log('  -> NO CARS EXIST IN DATABASE AT ALL!');
    } else {
      cars.forEach(c => {
        const status = c.deleted_at ? `DELETED (${c.deleted_at})` : 'ACTIVE';
        console.log(`  [${status}] ID=${c.id} | ${c.name} | ${c.availability}`);
      });
    }

    // 5. Check if cars table even exists
    const hasTable = await db.schema.hasTable('cars');
    console.log('\ncars table exists:', hasTable);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

diagnose();
