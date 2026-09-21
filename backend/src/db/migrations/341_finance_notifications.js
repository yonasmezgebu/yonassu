// Migration step 341 of 362
// Creates table: finance_notifications
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_notifications\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`expense_id\` int(11) NOT NULL,
  \`type\` enum('PENDING_APPROVAL','APPROVED','REJECTED','NEEDS_INFO','PAID','CANCELLED') NOT NULL,
  \`message\` text NOT NULL,
  \`is_read\` tinyint(1) DEFAULT '0',
  \`read_by\` int(11) DEFAULT NULL,
  \`read_at\` datetime DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`expense_id\` (\`expense_id\`),
  KEY \`read_by\` (\`read_by\`),
  CONSTRAINT \`finance_notifications_ibfk_1\` FOREIGN KEY (\`expense_id\`) REFERENCES \`finance_expenses\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`finance_notifications_ibfk_2\` FOREIGN KEY (\`read_by\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_notifications');
};
