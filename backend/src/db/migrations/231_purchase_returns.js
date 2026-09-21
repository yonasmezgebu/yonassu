// Migration step 231 of 362
// Creates table: purchase_returns
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`purchase_returns\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`return_code\` varchar(30) NOT NULL,
  \`po_ref\` varchar(100) NOT NULL,
  \`supplier_name\` varchar(200) NOT NULL,
  \`item\` varchar(300) NOT NULL,
  \`qty\` int(10) unsigned NOT NULL,
  \`reason\` varchar(100) NOT NULL,
  \`auth_number\` varchar(100) DEFAULT NULL,
  \`method\` varchar(50) DEFAULT 'Ship',
  \`notes\` text,
  \`status\` varchar(50) DEFAULT 'Pending',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchase_returns');
};
