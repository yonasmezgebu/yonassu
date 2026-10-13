exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE finance_evs ADD COLUMN IF NOT EXISTS account_id integer`);
  await knex.raw(`ALTER TABLE finance_evs ADD COLUMN IF NOT EXISTS account_name varchar(255)`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE finance_evs DROP COLUMN IF EXISTS account_id`);
  await knex.raw(`ALTER TABLE finance_evs DROP COLUMN IF EXISTS account_name`);
};
