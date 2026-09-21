// Migration step 336 of 362
// Creates table: expense_audit_trail
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`expense_audit_trail\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`expense_id\` int(11) NOT NULL,
  \`action\` varchar(50) NOT NULL,
  \`actor_id\` int(11) DEFAULT NULL,
  \`actor_name\` varchar(100) DEFAULT NULL,
  \`old_values\` text,
  \`new_values\` text,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`expense_audit_trail_expense_id_foreign\` (\`expense_id\`),
  CONSTRAINT \`expense_audit_trail_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expense_audit_trail');
};
