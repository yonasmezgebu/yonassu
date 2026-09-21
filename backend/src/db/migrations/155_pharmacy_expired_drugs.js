// Migration step 155 of 362
// Creates table: pharmacy_expired_drugs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_expired_drugs\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`drug_name\` varchar(200) DEFAULT NULL,
  \`quantity\` int(11) DEFAULT '0',
  \`expiry_date\` varchar(30) DEFAULT NULL,
  \`location\` varchar(50) DEFAULT NULL COMMENT 'Pharmacy / Store',
  \`action_required\` varchar(50) DEFAULT NULL COMMENT 'Dispose / Return / Write-off',
  \`status\` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  \`requested_by\` int(10) unsigned DEFAULT NULL,
  \`ceo_notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_expired_drugs');
};
