// Migration step 202 of 362
// Creates table: procurement_tenders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_tenders\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`tender_no\` varchar(30) NOT NULL,
  \`procurement_request_id\` int(10) unsigned NOT NULL,
  \`pr_no\` varchar(30) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`unit_of_measure\` varchar(50) DEFAULT 'Each',
  \`budget_estimate\` decimal(15,2) DEFAULT NULL,
  \`market_task_id\` int(10) unsigned DEFAULT NULL,
  \`status\` enum('DRAFT','OPEN','CLOSED','AWARDED','CANCELLED') DEFAULT 'DRAFT',
  \`opening_date\` date DEFAULT NULL,
  \`closing_date\` date DEFAULT NULL,
  \`issued_by\` int(11) NOT NULL,
  \`issued_by_name\` varchar(100) DEFAULT NULL,
  \`terms_and_conditions\` text,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`new_drug_flag\` varchar(10) DEFAULT 'NO',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`procurement_tenders_tender_no_unique\` (\`tender_no\`),
  KEY \`procurement_tenders_procurement_request_id_foreign\` (\`procurement_request_id\`),
  KEY \`procurement_tenders_market_task_id_foreign\` (\`market_task_id\`),
  CONSTRAINT \`procurement_tenders_market_task_id_foreign\` FOREIGN KEY (\`market_task_id\`) REFERENCES \`procurement_market_tasks\` (\`id\`),
  CONSTRAINT \`procurement_tenders_procurement_request_id_foreign\` FOREIGN KEY (\`procurement_request_id\`) REFERENCES \`procurement_requests\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_tenders');
};
