/**
 * Migration: Generalize product_tax_mappings to support every module.
 *
 * Previously mappings only referenced the generic `products` table (product_id).
 * Now each mapping targets an item inside a module catalog:
 *   source: printing | pharmacy | car_rental | agrirent | retail | tender_sell | tender_buy
 *   item_id / item_name: the module product reference (denormalized name snapshot)
 *
 * Idempotent via column existence checks.
 */

exports.up = async function (knex) {
  if (await knex.schema.hasTable('product_tax_mappings')) {
    const cols = await knex.raw('SHOW COLUMNS FROM `product_tax_mappings`');
    const existing = new Set(cols[0].map((c) => c.Field));

    if (!existing.has('source')) {
      await knex.raw("ALTER TABLE `product_tax_mappings` ADD COLUMN `source` VARCHAR(50) NOT NULL DEFAULT 'retail'");
    }
    if (!existing.has('item_id')) {
      await knex.raw('ALTER TABLE `product_tax_mappings` ADD COLUMN `item_id` BIGINT UNSIGNED NULL');
    }
    if (!existing.has('item_name')) {
      await knex.raw('ALTER TABLE `product_tax_mappings` ADD COLUMN `item_name` VARCHAR(255) NULL');
    }

    // Legacy product_id is now optional
    await knex.raw('ALTER TABLE `product_tax_mappings` MODIFY `product_id` INT UNSIGNED NULL');

    // Backfill legacy rows that only referenced products.id
    await knex.raw(
      'UPDATE `product_tax_mappings` SET `item_id` = `product_id`, ' +
      '`item_name` = (SELECT `name` FROM `products` WHERE `products`.`id` = `product_tax_mappings`.`product_id`) ' +
      'WHERE `item_id` IS NULL AND `product_id` IS NOT NULL'
    );

    // Replace UNIQUE(product_id) with UNIQUE(source, item_id)
    const oldIdx = await knex.raw("SHOW INDEX FROM `product_tax_mappings` WHERE `Column_name` = 'product_id' AND `Non_unique` = 0");
    if (oldIdx[0] && oldIdx[0].length) {
      await knex.raw(`ALTER TABLE \`product_tax_mappings\` DROP INDEX \`${oldIdx[0][0].Key_name}\``);
    }
    const newIdx = await knex.raw("SHOW INDEX FROM `product_tax_mappings` WHERE `Column_name` = 'source' AND `Non_unique` = 0");
    if (!newIdx[0] || !newIdx[0].length) {
      await knex.raw('ALTER TABLE `product_tax_mappings` ADD UNIQUE INDEX `uq_mapping_source_item` (`source`, `item_id`)');
    }
  }

  if (await knex.schema.hasTable('product_tax_mapping_history')) {
    const cols = await knex.raw('SHOW COLUMNS FROM `product_tax_mapping_history`');
    const existing = new Set(cols[0].map((c) => c.Field));
    if (!existing.has('source')) {
      await knex.raw('ALTER TABLE `product_tax_mapping_history` ADD COLUMN `source` VARCHAR(50) NULL');
    }
    if (!existing.has('item_id')) {
      await knex.raw('ALTER TABLE `product_tax_mapping_history` ADD COLUMN `item_id` BIGINT UNSIGNED NULL');
    }
  }
};

exports.down = async function (knex) {
  // Intentionally no-op — reverting requires data-dependent decisions.
};
