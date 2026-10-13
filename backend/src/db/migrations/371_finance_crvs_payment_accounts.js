exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE finance_crvs ADD COLUMN IF NOT EXISTS account_id integer`);
  await knex.raw(`ALTER TABLE finance_crvs ADD COLUMN IF NOT EXISTS account_name varchar(255)`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE finance_crvs DROP COLUMN IF EXISTS account_id`);
  await knex.raw(`ALTER TABLE finance_crvs DROP COLUMN IF EXISTS account_name`);
};
