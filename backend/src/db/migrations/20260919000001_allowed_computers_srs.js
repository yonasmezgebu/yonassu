exports.up = async (knex) => {
  await knex.schema.alterTable('registered_computers', (t) => {
    t.string('ip_address', 45).nullable().after('ip_range');
    t.string('added_by_hr_id', 20).nullable().after('status');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('registered_computers', (t) => {
    t.dropColumn('ip_address');
    t.dropColumn('added_by_hr_id');
  });
};