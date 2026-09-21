// Migration step 310 of 362
// Creates table: support_tickets
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`support_tickets\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(10) unsigned NOT NULL,
  \`customer_id\` int(10) unsigned DEFAULT NULL,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`subject\` varchar(200) NOT NULL,
  \`message\` text NOT NULL,
  \`status\` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  \`admin_reply\` text,
  \`replied_at\` datetime DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('support_tickets');
};
