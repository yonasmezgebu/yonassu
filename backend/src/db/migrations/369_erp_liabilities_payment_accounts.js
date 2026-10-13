exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE erp_payments_v4 ADD COLUMN IF NOT EXISTS account_id integer`);
  await knex.raw(`ALTER TABLE erp_payments_v4 ADD COLUMN IF NOT EXISTS account_name varchar(255)`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE erp_payments_v4 DROP COLUMN IF EXISTS account_id`);
  await knex.raw(`ALTER TABLE erp_payments_v4 DROP COLUMN IF EXISTS account_name`);
};
