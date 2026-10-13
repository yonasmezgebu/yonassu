exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE erp_liabilities_v4 ADD COLUMN IF NOT EXISTS phone varchar(50)`);
  await knex.raw(`ALTER TABLE erp_liabilities_v4 ADD COLUMN IF NOT EXISTS email varchar(255)`);
  await knex.raw(`ALTER TABLE erp_liabilities_v4 ADD COLUMN IF NOT EXISTS due_reminder_sent boolean NOT NULL DEFAULT false`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE erp_liabilities_v4 DROP COLUMN IF EXISTS phone`);
  await knex.raw(`ALTER TABLE erp_liabilities_v4 DROP COLUMN IF EXISTS email`);
  await knex.raw(`ALTER TABLE erp_liabilities_v4 DROP COLUMN IF EXISTS due_reminder_sent`);
};
