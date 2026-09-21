// Migration step 330 of 362
// Creates table: customer_notifications
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`customer_notifications\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
  \`customer_id\` int(11) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`message\` text NOT NULL,
  \`type\` varchar(50) DEFAULT 'info',
  \`is_read\` tinyint(1) DEFAULT '0',
  \`link_url\` varchar(255) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_notifications_customer\` (\`customer_id\`),
  KEY \`idx_notifications_read\` (\`is_read\`),
  CONSTRAINT \`customer_notifications_ibfk_1\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customer_notifications');
};
