// Migration step 239 of 362
// Creates table: rental_settings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`rental_settings\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`contact_phone1\` varchar(255) DEFAULT NULL,
  \`contact_phone2\` varchar(255) DEFAULT NULL,
  \`contact_email\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rental_settings');
};
