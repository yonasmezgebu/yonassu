// Migration step 120 of 362
// Creates table: leads
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`leads\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`email\` varchar(100) DEFAULT NULL,
  \`source\` varchar(50) DEFAULT 'walk_in',
  \`status\` enum('new','contacted','qualified','converted','lost') DEFAULT 'new',
  \`notes\` text,
  \`assigned_to\` int(10) unsigned DEFAULT NULL,
  \`converted_to_customer_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('leads');
};
