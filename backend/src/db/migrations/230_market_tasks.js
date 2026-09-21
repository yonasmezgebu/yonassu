// Migration step 230 of 362
// Creates table: market_tasks
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`market_tasks\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`purchase_request_id\` int(10) unsigned NOT NULL,
  \`assigned_to\` int(10) unsigned DEFAULT NULL,
  \`document_url\` varchar(255) DEFAULT NULL,
  \`instructions\` text,
  \`status\` enum('IN_PROGRESS','READY_FOR_PURCHASE') DEFAULT 'IN_PROGRESS',
  \`completed_at\` datetime DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`market_tasks_purchase_request_id_foreign\` (\`purchase_request_id\`),
  CONSTRAINT \`market_tasks_purchase_request_id_foreign\` FOREIGN KEY (\`purchase_request_id\`) REFERENCES \`purchase_requests\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('market_tasks');
};
