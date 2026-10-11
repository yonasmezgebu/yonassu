// Migration step 364
// Adds the custom AgriRent pricing components a Rental Manager can set when
// registering a walk-in order: a per-hectare rate and a farming-purpose fee.
// The hire total is (days x daily_rate) + (hectares x hectare_rate) + purpose_fee
// plus VAT. Both default to 0 so existing/online orders are unaffected.
exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE agrirent_orders ADD COLUMN IF NOT EXISTS hectare_rate numeric(12,2) DEFAULT '0.00'`);
  await knex.raw(`ALTER TABLE agrirent_orders ADD COLUMN IF NOT EXISTS purpose_fee numeric(12,2) DEFAULT '0.00'`);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE agrirent_orders DROP COLUMN IF EXISTS hectare_rate`);
  await knex.raw(`ALTER TABLE agrirent_orders DROP COLUMN IF EXISTS purpose_fee`);
};
