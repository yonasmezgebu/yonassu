// Migration step 241 of 362
// Creates table: retail_audit_trail
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_audit_trail\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`cashier_id\` int(11) DEFAULT NULL,
  \`action\` varchar(255) DEFAULT NULL,
  \`recipient\` varchar(255) DEFAULT NULL,
  \`amount\` decimal(10,2) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`notes\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_audit_trail');
};
