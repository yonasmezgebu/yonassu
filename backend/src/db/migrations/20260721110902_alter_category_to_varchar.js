exports.up = async function(knex) {
  // Convert ENUM to VARCHAR for flexibility since categories vary by department
  await knex.raw('ALTER TABLE general_store_materials MODIFY COLUMN category VARCHAR(100) DEFAULT "Other"');
};

exports.down = async function(knex) {
  // Revert back to ENUM (Warning: This will fail if there is data outside the ENUM)
  await knex.raw('ALTER TABLE general_store_materials MODIFY COLUMN category ENUM("Paper", "Ink", "Toner", "Chemical", "Other") DEFAULT "Other"');
};
