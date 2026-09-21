// Migration step 185 of 362
// Creates table: price_lists
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`price_lists\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`description\` text,
  \`currency\` varchar(3) DEFAULT 'ETB',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`effective_from\` date DEFAULT NULL,
  \`effective_to\` date DEFAULT NULL,
  \`priority\` int(11) DEFAULT '0',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('price_lists');
};
