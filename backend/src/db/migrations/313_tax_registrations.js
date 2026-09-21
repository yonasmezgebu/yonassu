// Migration step 313 of 362
// Creates table: tax_registrations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`tax_registrations\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`tax_type\` varchar(30) NOT NULL,
  \`registration_number\` varchar(50) NOT NULL,
  \`registration_date\` date DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`rate\` decimal(5,2) NOT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tax_registrations');
};
