const { db } = require('./src/config/database');

async function updateSchema() {
  try {
    const table = 'hr_employees';
    const hasTable = await db.schema.hasTable(table);
    if (!hasTable) {
      console.log(`Table ${table} does not exist!`);
      process.exit(1);
    }

    const columnsToAdd = {
      emergency_contact_name: (t) => t.string('emergency_contact_name', 255).nullable(),
      emergency_contact_phone: (t) => t.string('emergency_contact_phone', 255).nullable(),
      marital_status: (t) => t.string('marital_status', 50).defaultTo('Single'),
      date_of_birth: (t) => t.date('date_of_birth').nullable(),
      document_path: (t) => t.string('document_path', 255).nullable(),
      has_pc_access: (t) => t.string('has_pc_access', 20).defaultTo('No')
    };

    let added = [];
    for (const [colName, colDef] of Object.entries(columnsToAdd)) {
      const hasColumn = await db.schema.hasColumn(table, colName);
      if (!hasColumn) {
        await db.schema.table(table, (t) => {
          colDef(t);
        });
        added.push(colName);
      }
    }
    
    if (added.length > 0) {
      console.log('Successfully added columns:', added.join(', '));
    } else {
      console.log('All columns already exist.');
    }

  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

updateSchema();
