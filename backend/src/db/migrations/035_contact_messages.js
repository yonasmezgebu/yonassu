// Migration step 35 of 362
// Creates table: contact_messages
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`contact_messages\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`full_name\` varchar(100) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`subject\` varchar(200) NOT NULL,
  \`department\` varchar(50) NOT NULL,
  \`message\` text NOT NULL,
  \`attachment\` varchar(500) DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'unread',
  \`assigned_to\` int(10) unsigned DEFAULT NULL,
  \`admin_notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`read_at\` timestamp NULL DEFAULT NULL,
  \`replied_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_contact_department\` (\`department\`),
  KEY \`idx_contact_status\` (\`status\`),
  KEY \`idx_contact_assigned\` (\`assigned_to\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('contact_messages');
};
