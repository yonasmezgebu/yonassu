exports.up = async function (knex) {
  // 1. Enable pg_trgm extension for fast wildcard searches
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  // 2. Add GIN Trigram indexes for the most heavily searched columns
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm ON users USING gin (full_name gin_trgm_ops);');
  
  // Conditionally add for farming/pharmacy if tables exist
  const hasFarming = await knex.schema.hasTable('farming_products');
  if (hasFarming) {
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_farming_products_name_trgm ON farming_products USING gin (name gin_trgm_ops);');
  }

  const hasPharmacy = await knex.schema.hasTable('pharmacy_medications');
  if (hasPharmacy) {
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_pharm_meds_name_trgm ON pharmacy_medications USING gin (name gin_trgm_ops);');
  }
};

exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_pharm_meds_name_trgm;');
  await knex.raw('DROP INDEX IF EXISTS idx_farming_products_name_trgm;');
  await knex.raw('DROP INDEX IF EXISTS idx_users_full_name_trgm;');
  await knex.raw('DROP INDEX IF EXISTS idx_customers_name_trgm;');
  await knex.raw('DROP INDEX IF EXISTS idx_products_name_trgm;');
  
  // We generally don't drop the extension in case other databases use it
};
