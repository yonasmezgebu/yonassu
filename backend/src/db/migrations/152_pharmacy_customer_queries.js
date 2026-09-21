// Migration step 152 of 362
// Creates table: pharmacy_customer_queries
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_customer_queries\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`drug_name\` varchar(200) DEFAULT NULL,
  \`channel\` varchar(30) DEFAULT NULL COMMENT 'PHONE / IN_PERSON / ONLINE',
  \`response_status\` varchar(30) DEFAULT NULL COMMENT 'AVAILABLE / LOW_STOCK / OUT_OF_STOCK',
  \`customer_name\` varchar(200) DEFAULT NULL,
  \`customer_phone\` varchar(30) DEFAULT NULL,
  \`notify_on_restock\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_customer_queries');
};
