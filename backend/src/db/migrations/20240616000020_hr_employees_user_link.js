exports.up = async function (knex) {
  const hasCol = await knex.schema.hasColumn('hr_employees', 'user_id');
  if (!hasCol) {
    await knex.schema.table('hr_employees', (t) => {
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    });
  }
};

exports.down = async function (knex) {
  const hasCol = await knex.schema.hasColumn('hr_employees', 'user_id');
  if (hasCol) {
    await knex.schema.table('hr_employees', (t) => {
      t.dropColumn('user_id');
    });
  }
};
