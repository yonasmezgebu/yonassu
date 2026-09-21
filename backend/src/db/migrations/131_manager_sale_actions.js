// Migration step 131 of 362
// Creates table: manager_sale_actions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`manager_sale_actions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`pos_sale_id\` int(10) unsigned NOT NULL,
  \`manager_id\` int(10) unsigned NOT NULL,
  \`action\` enum('approved','flagged') NOT NULL,
  \`reason\` text,
  \`cash_to_handover\` decimal(12,2) DEFAULT '0.00',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('manager_sale_actions');
};
