// Migration step 173 of 362
// Creates table: pharmacy_sales
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_sales\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`worker_id\` int(10) unsigned DEFAULT NULL,
  \`sale_type\` varchar(30) NOT NULL COMMENT 'WALK-IN / ONLINE',
  \`recipient_name\` varchar(200) DEFAULT NULL,
  \`recipient_phone\` varchar(30) DEFAULT NULL,
  \`total_products\` int(11) DEFAULT '0',
  \`total_amount\` decimal(12,2) DEFAULT '0.00',
  \`receipt_no\` varchar(50) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`is_submitted\` tinyint(1) DEFAULT '0',
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  \`subtotal\` decimal(14,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pharmacy_sales_receipt_no_unique\` (\`receipt_no\`),
  KEY \`pharmacy_sales_branch_id_foreign\` (\`branch_id\`),
  KEY \`pharmacy_sales_worker_id_foreign\` (\`worker_id\`),
  CONSTRAINT \`pharmacy_sales_branch_id_foreign\` FOREIGN KEY (\`branch_id\`) REFERENCES \`pharmacy_branches\` (\`id\`),
  CONSTRAINT \`pharmacy_sales_worker_id_foreign\` FOREIGN KEY (\`worker_id\`) REFERENCES \`pharmacy_workers\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_sales');
};
