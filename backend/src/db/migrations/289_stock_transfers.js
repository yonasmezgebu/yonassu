// Migration step 289 of 362
// Creates table: stock_transfers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_transfers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`transfer_no\` varchar(50) NOT NULL,
  \`from_location\` varchar(255) DEFAULT NULL,
  \`to_location\` varchar(255) DEFAULT NULL,
  \`transfer_type\` varchar(50) DEFAULT NULL,
  \`authorized_by\` varchar(150) DEFAULT NULL,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`transfer_date\` date DEFAULT NULL,
  \`status\` enum('Pending','Approved','In Transit','Received','Cancelled') DEFAULT 'Pending',
  \`remarks\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`stock_transfers_transfer_no_unique\` (\`transfer_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_transfers');
};
