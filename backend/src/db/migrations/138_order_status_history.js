// Migration step 138 of 362
// Creates table: order_status_history
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`order_status_history\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`order_id\` int(11) NOT NULL,
  \`from_status\` varchar(50) DEFAULT NULL,
  \`to_status\` varchar(50) NOT NULL,
  \`note\` text,
  \`changed_by\` int(11) NOT NULL,
  \`changed_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`ip_address\` varchar(45) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_history_order\` (\`order_id\`),
  KEY \`idx_history_timestamp\` (\`changed_at\`),
  KEY \`changed_by\` (\`changed_by\`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_status_history');
};
