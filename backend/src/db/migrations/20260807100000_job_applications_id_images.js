exports.up = function(knex) {
  return knex.schema.table('job_applications', table => {
    table.string('id_front_image').nullable();
    table.string('id_back_image').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('job_applications', table => {
    table.dropColumn('id_front_image');
    table.dropColumn('id_back_image');
  });
};
