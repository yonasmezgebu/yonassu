// Migration step 110 of 362
// Creates table: hr_settings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_settings\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`contact_phone1\` varchar(255) DEFAULT '',
  \`contact_phone2\` varchar(255) DEFAULT '',
  \`contact_email\` varchar(255) DEFAULT '',
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_settings');
};
