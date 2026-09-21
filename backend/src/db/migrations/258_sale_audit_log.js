// Migration step 258 of 362
// Creates table: sale_audit_log
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sale_audit_log\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`pos_sale_id\` int(10) unsigned NOT NULL,
  \`action\` enum('created','approved','flagged','voided','refunded','manager_note') NOT NULL,
  \`performed_by\` int(10) unsigned NOT NULL,
  \`action_details\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sale_audit_log');
};
