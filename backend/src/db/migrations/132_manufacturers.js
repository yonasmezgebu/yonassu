// Migration step 132 of 362
// Creates table: manufacturers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`manufacturers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(200) NOT NULL,
  \`country\` varchar(100) DEFAULT NULL,
  \`contact_phone\` varchar(50) DEFAULT NULL,
  \`contact_email\` varchar(200) DEFAULT NULL,
  \`address\` text,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`manufacturers_name_unique\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('manufacturers');
};
