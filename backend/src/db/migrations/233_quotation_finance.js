// Migration step 233 of 362
// Creates table: quotation_finance
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`quotation_finance\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`quotation_id\` int(10) unsigned NOT NULL,
  \`quotation_no\` varchar(30) NOT NULL,
  \`amount\` decimal(15,2) DEFAULT '0.00',
  \`status\` varchar(40) DEFAULT 'awaiting ceo approval',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`finance_approved_by\` int(10) unsigned DEFAULT NULL,
  \`finance_approved_at\` timestamp NULL DEFAULT NULL,
  \`paid_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`finance_requested\` tinyint(1) NOT NULL DEFAULT '0',
  \`ceo_approved\` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`quotation_finance_quotation_id_unique\` (\`quotation_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('quotation_finance');
};
