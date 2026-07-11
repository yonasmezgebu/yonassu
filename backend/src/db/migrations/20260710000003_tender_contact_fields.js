exports.up = function(knex) {
  return knex.schema.alterTable('public_tenders', table => {
    table.string('contact_phone1').nullable();
    table.string('contact_phone2').nullable();
    table.string('contact_email').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('public_tenders', table => {
    table.dropColumn('contact_phone1');
    table.dropColumn('contact_phone2');
    table.dropColumn('contact_email');
  });
};
