// Migration step 262 of 362
// Creates table: sales_messages
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sales_messages\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`sender_name\` varchar(255) NOT NULL,
  \`sender_email\` varchar(255) NOT NULL,
  \`sender_phone\` varchar(255) DEFAULT NULL,
  \`message\` text NOT NULL,
  \`is_read\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_messages');
};
