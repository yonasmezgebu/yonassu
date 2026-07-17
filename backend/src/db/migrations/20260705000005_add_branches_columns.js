exports.up = async function (knex) {
  if (await knex.schema.hasTable('branches')) {
    const addCol = async (col, type, opts) => {
      if (!(await knex.schema.hasColumn('branches', col))) {
        await knex.schema.alterTable('branches', (t) => {
          t[type](col, opts);
        });
      }
    };
    await addCol('address', 'text');
    await addCol('phone', 'string', 50);
    await addCol('working_hours', 'string', 100);
    await addCol('manager_name', 'string', 100);
    await addCol('alternate_phone', 'string', 50);
    await addCol('working_hours_monday_saturday', 'string', 100);
    await addCol('working_hours_sunday', 'string', 100);
    await addCol('emergency_phone', 'string', 50);
    await addCol('delivery_support_phone', 'string', 50);
    await addCol('latitude', 'decimal', [10, 7]);
    await addCol('longitude', 'decimal', [10, 7]);
    await addCol('display_order', 'integer', 0);
    await addCol('cover_image', 'string', 500);
    await addCol('branch_name', 'string', 100);
    if (await knex.schema.hasColumn('branches', 'branch_name')) {
      await knex('branches').update({ branch_name: knex.ref('name') }).whereNull('branch_name');
    }
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('branches')) {
    const cols = [
      'address', 'phone', 'working_hours', 'manager_name', 'alternate_phone', 'working_hours_monday_saturday',
      'working_hours_sunday', 'emergency_phone', 'delivery_support_phone',
      'latitude', 'longitude', 'display_order', 'cover_image', 'branch_name'
    ];
    for (const col of cols) {
      if (await knex.schema.hasColumn('branches', col)) {
        await knex.schema.alterTable('branches', (t) => {
          t.dropColumn(col);
        });
      }
    }
  }
};
