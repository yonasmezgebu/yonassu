// Migration step 237 of 362
// Creates table: rental_messages
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`rental_messages\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`sender_name\` varchar(255) NOT NULL,
  \`sender_email\` varchar(255) NOT NULL,
  \`sender_phone\` varchar(255) DEFAULT NULL,
  \`message\` text NOT NULL,
  \`is_read\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rental_messages');
};
