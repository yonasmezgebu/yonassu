exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS security_deposit numeric(10,2) DEFAULT '5000.00'`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE cars DROP COLUMN IF EXISTS security_deposit`);
};
