// Migration step 276 of 362
// Creates table: dividends
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`dividends\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`shareholder_id\` int(10) unsigned DEFAULT NULL,
  \`period\` varchar(50) NOT NULL,
  \`total_amount\` decimal(14,2) NOT NULL,
  \`per_share\` decimal(10,2) DEFAULT NULL,
  \`declaration_date\` date DEFAULT NULL,
  \`payment_date\` date DEFAULT NULL,
  \`status\` enum('declared','paid','cancelled') DEFAULT 'declared',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`dividends_shareholder_id_foreign\` (\`shareholder_id\`),
  CONSTRAINT \`dividends_shareholder_id_foreign\` FOREIGN KEY (\`shareholder_id\`) REFERENCES \`shareholders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('dividends');
};
