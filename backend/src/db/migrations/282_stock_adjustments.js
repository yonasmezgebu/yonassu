// Migration step 282 of 362
// Creates table: stock_adjustments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_adjustments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`adjustment_no\` varchar(50) NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`adjustment_type\` varchar(100) DEFAULT NULL,
  \`quantity_before\` int(11) DEFAULT NULL,
  \`quantity_after\` int(11) DEFAULT NULL,
  \`adjustment_qty\` int(11) DEFAULT NULL,
  \`reason\` text,
  \`approval_code\` varchar(100) DEFAULT NULL,
  \`adjusted_by\` int(10) unsigned DEFAULT NULL,
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`adjustment_date\` date DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`status\` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  \`rejection_reason\` text,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`stock_adjustments_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`stock_adjustments_drug_id_foreign\` FOREIGN KEY (\`drug_id\`) REFERENCES \`drugs\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_adjustments');
};
