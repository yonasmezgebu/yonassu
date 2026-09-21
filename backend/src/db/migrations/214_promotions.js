// Migration step 214 of 362
// Creates table: promotions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`promotions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`description\` text,
  \`type\` enum('percentage','fixed','bogo','bundle','loyalty') NOT NULL,
  \`value\` decimal(15,2) NOT NULL,
  \`min_purchase_amount\` decimal(15,2) DEFAULT '0.00',
  \`applies_to\` enum('all','category','product') DEFAULT 'all',
  \`product_id\` int(10) unsigned DEFAULT NULL,
  \`category_id\` int(10) unsigned DEFAULT NULL,
  \`start_date\` datetime NOT NULL,
  \`end_date\` datetime NOT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`max_uses\` int(11) DEFAULT '0',
  \`current_uses\` int(11) DEFAULT '0',
  \`coupon_code\` varchar(50) DEFAULT NULL,
  \`requires_coupon\` tinyint(1) DEFAULT '0',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('promotions');
};
