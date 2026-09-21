// Migration step 268 of 362
// Creates table: sales_tenders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sales_tenders\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`category\` varchar(255) NOT NULL,
  \`description\` text NOT NULL,
  \`base_price\` decimal(15,2) NOT NULL,
  \`deadline\` date NOT NULL,
  \`status\` varchar(255) DEFAULT 'open',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`posted_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`image_url\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_tenders');
};
