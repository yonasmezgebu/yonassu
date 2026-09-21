// Migration step 179 of 362
// Creates table: pos_audit_trail
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pos_audit_trail\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`cashier_id\` int(10) unsigned DEFAULT NULL,
  \`action\` varchar(255) DEFAULT NULL,
  \`recipient\` varchar(255) DEFAULT NULL,
  \`amount\` decimal(14,2) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`sale_id\` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pos_audit_trail');
};
