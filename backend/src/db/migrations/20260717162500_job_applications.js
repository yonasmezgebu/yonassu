exports.up = function(knex) {
  return knex.schema.createTable('job_applications', table => {
    table.increments('id').primary();
    table.integer('post_id').unsigned().references('id').inTable('news_posts').onDelete('CASCADE');
    table.string('full_name').notNullable();
    table.string('phone_number').notNullable();
    table.string('email').notNullable();
    table.string('education_status').notNullable();
    table.string('national_id').notNullable();
    table.enu('sex', ['Male', 'Female']).notNullable();
    table.enu('status', ['PENDING', 'IN_PERSON_INVITED', 'SUBMITTED_TO_CEO', 'REJECTED']).defaultTo('PENDING');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('job_applications');
};
