exports.up = function(knex) {
  return knex.schema.table('hr_employees', table => {
    table.string('education_level', 50).nullable();        // e.g. Bachelor, Master, PhD, Diploma, Certificate
    table.string('institution_name', 150).nullable();      // University / school name
    table.string('field_of_study', 100).nullable();        // e.g. Computer Science
    table.string('graduation_year', 10).nullable();        // e.g. 2018
    table.string('id_photo_front', 255).nullable();        // path to front ID image
    table.string('id_photo_back', 255).nullable();         // path to back ID image
  });
};

exports.down = function(knex) {
  return knex.schema.table('hr_employees', table => {
    table.dropColumn('education_level');
    table.dropColumn('institution_name');
    table.dropColumn('field_of_study');
    table.dropColumn('graduation_year');
    table.dropColumn('id_photo_front');
    table.dropColumn('id_photo_back');
  });
};
