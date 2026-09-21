// Migration step 56 of 362
// Creates table: erp_owners
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_owners\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`owner_name\` varchar(255) NOT NULL,
  \`phone\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`ownership_percentage\` decimal(5,2) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_owners');
};
