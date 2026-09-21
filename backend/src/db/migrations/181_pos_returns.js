// Migration step 181 of 362
// Creates table: pos_returns
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pos_returns\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`return_number\` varchar(50) NOT NULL,
  \`sale_id\` int(10) unsigned NOT NULL,
  \`customer_id\` int(10) unsigned DEFAULT NULL,
  \`total_refund\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`refund_method\` varchar(20) DEFAULT 'original',
  \`reason\` text,
  \`processed_by\` int(10) unsigned NOT NULL,
  \`status\` varchar(20) DEFAULT 'completed',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pos_returns_return_number_unique\` (\`return_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pos_returns');
};
