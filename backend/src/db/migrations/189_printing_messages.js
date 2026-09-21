// Migration step 189 of 362
// Creates table: printing_messages
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_messages\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`email\` varchar(100) DEFAULT NULL,
  \`phone\` varchar(50) NOT NULL,
  \`subject\` varchar(200) DEFAULT NULL,
  \`message\` text NOT NULL,
  \`status\` enum('unread','read','replied') DEFAULT 'unread',
  \`is_archived\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_messages');
};
