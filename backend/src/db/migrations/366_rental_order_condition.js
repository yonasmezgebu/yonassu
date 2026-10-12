exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE rental_orders ADD COLUMN IF NOT EXISTS car_condition varchar(20)`);
  await knex.raw(`ALTER TABLE rental_orders ADD COLUMN IF NOT EXISTS condition_reason text`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE rental_orders DROP COLUMN IF EXISTS car_condition`);
  await knex.raw(`ALTER TABLE rental_orders DROP COLUMN IF EXISTS condition_reason`);
};
