exports.up = function(knex) {
  return knex.schema.alterTable('hr_employees', table => {
    table.timestamp('last_web_active').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('hr_employees', table => {
    table.dropColumn('last_web_active');
  });
};
