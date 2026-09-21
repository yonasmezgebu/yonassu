// Migration step 343 of 362
// Creates table: hr_policies
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_policies\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`category\` varchar(255) NOT NULL,
  \`file_ref\` varchar(255) DEFAULT NULL,
  \`version_number\` int(11) DEFAULT '1',
  \`status\` varchar(255) DEFAULT 'Draft',
  \`effective_date\` date DEFAULT NULL,
  \`published_by\` int(11) DEFAULT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`acknowledgment_required\` tinyint(1) DEFAULT '0',
  \`send_to_all\` tinyint(1) DEFAULT '0',
  \`description\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`hr_policies_published_by_foreign\` (\`published_by\`),
  KEY \`hr_policies_approved_by_foreign\` (\`approved_by\`),
  CONSTRAINT \`hr_policies_approved_by_foreign\` FOREIGN KEY (\`approved_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`hr_policies_published_by_foreign\` FOREIGN KEY (\`published_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_policies');
};
