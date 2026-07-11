exports.up = function(knex) {
  return knex.schema.createTable('procurement_settings', table => {
    table.increments('id').primary();
    table.string('contact_phone1').nullable();
    table.string('contact_phone2').nullable();
    table.string('contact_email').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('procurement_settings');
};
