// Migration step 20 of 362
// Creates table: budget_periods
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`budget_periods\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`period_type\` enum('monthly','quarterly','yearly','custom') NOT NULL,
  \`start_date\` date NOT NULL,
  \`end_date\` date NOT NULL,
  \`total_budget\` decimal(15,2) DEFAULT '0.00',
  \`total_encumbered\` decimal(15,2) DEFAULT '0.00',
  \`total_spent\` decimal(15,2) DEFAULT '0.00',
  \`status\` enum('draft','active','frozen','closed') DEFAULT 'draft',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('budget_periods');
};
