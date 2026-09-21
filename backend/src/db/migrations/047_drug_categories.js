// Migration step 47 of 362
// Creates table: drug_categories
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`drug_categories\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(150) NOT NULL,
  \`description\` text,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`drug_categories_name_unique\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('drug_categories');
};
