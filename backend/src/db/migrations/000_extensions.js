// Migration step 0
// Installs the extensions the converted schema depends on.
//
// `citext` is the important one: every MySQL `enum(...)` column was converted to
// `citext` plus a CHECK constraint.  MySQL's default collation compares those
// values case-insensitively, and `citext` is what preserves that behaviour
// without the CHECK constraint having to enumerate every casing variant.
//
// This must run before any table that declares a `citext` column, hence the 000
// prefix -- knex runs migrations in filename order.
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS citext');
};

exports.down = async function (knex) {
  await knex.raw('DROP EXTENSION IF EXISTS citext');
};
