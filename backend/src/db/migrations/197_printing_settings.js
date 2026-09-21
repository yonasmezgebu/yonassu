// Migration step 197 of 362
// Creates table: printing_settings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_settings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`contact_phone1\` varchar(50) DEFAULT NULL,
  \`contact_phone2\` varchar(50) DEFAULT NULL,
  \`contact_email\` varchar(100) DEFAULT NULL,
  \`contact_address\` text,
  \`office_hours\` varchar(255) DEFAULT NULL,
  \`emergency_contact\` varchar(100) DEFAULT NULL,
  \`manager_name\` varchar(100) DEFAULT NULL,
  \`terms_and_conditions\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_settings');
};
