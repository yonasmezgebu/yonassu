exports.up = async function (knex) {
  await knex.schema.alterTable('procurement_requests', (table) => {
    table.string('request_type', 20).defaultTo('EXISTING_DRUG');
    table.string('drug_category', 100).nullable();
    table.string('drug_classification', 100).nullable();
    table.text('therapeutic_use').nullable();
    table.text('request_reason').nullable();
    table.string('wait_document', 255).nullable();
    table.text('wait_instructions').nullable();
    table.string('new_drug_flag', 10).defaultTo('NO');
  });
  await knex.schema.alterTable('procurement_tenders', (table) => {
    table.string('new_drug_flag', 10).defaultTo('NO');
  });
  await knex.schema.alterTable('procurement_fund_requests', (table) => {
    table.string('new_drug_flag', 10).defaultTo('NO');
  });
  await knex.schema.alterTable('procurement_payments', (table) => {
    table.string('new_drug_flag', 10).defaultTo('NO');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('procurement_requests', (table) => {
    table.dropColumn('request_type');
    table.dropColumn('drug_category');
    table.dropColumn('drug_classification');
    table.dropColumn('therapeutic_use');
    table.dropColumn('request_reason');
    table.dropColumn('wait_document');
    table.dropColumn('wait_instructions');
    table.dropColumn('new_drug_flag');
  });
  await knex.schema.alterTable('procurement_tenders', (table) => {
    table.dropColumn('new_drug_flag');
  });
  await knex.schema.alterTable('procurement_fund_requests', (table) => {
    table.dropColumn('new_drug_flag');
  });
  await knex.schema.alterTable('procurement_payments', (table) => {
    table.dropColumn('new_drug_flag');
  });
};
