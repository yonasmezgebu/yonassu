// Migration step 200 of 362
// Creates table: procurement_market_tasks
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_market_tasks\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`procurement_request_id\` int(10) unsigned NOT NULL,
  \`pr_no\` varchar(30) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`quantity_needed\` int(11) NOT NULL,
  \`market_info\` text,
  \`status\` enum('PENDING','IN_PROGRESS','COMPLETED') DEFAULT 'PENDING',
  \`assigned_by\` int(11) NOT NULL,
  \`assigned_by_name\` varchar(100) DEFAULT NULL,
  \`completed_by\` int(11) DEFAULT NULL,
  \`completed_by_name\` varchar(100) DEFAULT NULL,
  \`completed_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`procurement_market_tasks_procurement_request_id_foreign\` (\`procurement_request_id\`),
  CONSTRAINT \`procurement_market_tasks_procurement_request_id_foreign\` FOREIGN KEY (\`procurement_request_id\`) REFERENCES \`procurement_requests\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_market_tasks');
};
