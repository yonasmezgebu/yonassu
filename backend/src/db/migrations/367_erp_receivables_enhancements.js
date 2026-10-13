exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE erp_receivables ADD COLUMN IF NOT EXISTS phone varchar(50)`);
  await knex.raw(`ALTER TABLE erp_receivables ADD COLUMN IF NOT EXISTS email varchar(255)`);
  await knex.raw(`ALTER TABLE erp_receivables ADD COLUMN IF NOT EXISTS due_reminder_sent boolean NOT NULL DEFAULT false`);
  await knex.raw(`ALTER TABLE erp_receivable_payments ADD COLUMN IF NOT EXISTS account_id integer`);
  await knex.raw(`ALTER TABLE erp_receivable_payments ADD COLUMN IF NOT EXISTS account_name varchar(255)`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE erp_receivables DROP COLUMN IF EXISTS phone`);
  await knex.raw(`ALTER TABLE erp_receivables DROP COLUMN IF EXISTS email`);
  await knex.raw(`ALTER TABLE erp_receivables DROP COLUMN IF EXISTS due_reminder_sent`);
  await knex.raw(`ALTER TABLE erp_receivable_payments DROP COLUMN IF EXISTS account_id`);
  await knex.raw(`ALTER TABLE erp_receivable_payments DROP COLUMN IF EXISTS account_name`);
};
