// Migration step 137 of 362
// Creates table: opportunities
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`opportunities\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`lead_id\` int(10) unsigned DEFAULT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`name\` varchar(200) NOT NULL,
  \`description\` text,
  \`stage\` enum('new','qualification','proposal','negotiation','closed_won','closed_lost') DEFAULT NULL,
  \`expected_value\` decimal(15,2) DEFAULT '0.00',
  \`probability\` decimal(5,2) DEFAULT '0.00',
  \`expected_close_date\` date DEFAULT NULL,
  \`assigned_to\` int(10) unsigned DEFAULT NULL,
  \`notes\` text,
  \`lost_reason\` varchar(200) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`opportunities_lead_id_foreign\` (\`lead_id\`),
  CONSTRAINT \`opportunities_lead_id_foreign\` FOREIGN KEY (\`lead_id\`) REFERENCES \`leads\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('opportunities');
};
