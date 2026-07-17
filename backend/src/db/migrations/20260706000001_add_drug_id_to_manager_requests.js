exports.up = async function (knex) {
  if (await knex.schema.hasTable('pharmacy_manager_requests')) {
    if (!(await knex.schema.hasColumn('pharmacy_manager_requests', 'drug_id'))) {
      await knex.schema.alterTable('pharmacy_manager_requests', (t) => {
        t.integer('drug_id').unsigned().references('id').inTable('pharmacy_medications');
      });
    }
    if (!(await knex.schema.hasColumn('pharmacy_manager_requests', 'drug_image'))) {
      await knex.schema.alterTable('pharmacy_manager_requests', (t) => {
        t.string('drug_image', 500);
      });
    }
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('pharmacy_manager_requests')) {
    if (await knex.schema.hasColumn('pharmacy_manager_requests', 'drug_id')) {
      await knex.schema.alterTable('pharmacy_manager_requests', (t) => {
        t.dropColumn('drug_id');
      });
    }
    if (await knex.schema.hasColumn('pharmacy_manager_requests', 'drug_image')) {
      await knex.schema.alterTable('pharmacy_manager_requests', (t) => {
        t.dropColumn('drug_image');
      });
    }
  }
};
