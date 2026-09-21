// Migration step 355 of 362
// Creates table: pharmacy_drug_hide_log
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_drug_hide_log\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`drug_id\` int(11) DEFAULT NULL,
  \`drug_name\` varchar(200) DEFAULT NULL,
  \`reason\` text,
  \`hide_type\` varchar(30) DEFAULT NULL COMMENT 'TEMPORARY / PERMANENT / PUBLIC_ONLY',
  \`auto_show_at\` date DEFAULT NULL,
  \`notify_ceo\` tinyint(1) DEFAULT '1',
  \`hidden_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_drug_hide_log_hidden_by_foreign\` (\`hidden_by\`),
  CONSTRAINT \`pharmacy_drug_hide_log_hidden_by_foreign\` FOREIGN KEY (\`hidden_by\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_drug_hide_log');
};
