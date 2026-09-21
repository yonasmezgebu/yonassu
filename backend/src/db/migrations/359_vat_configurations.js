// Migration step 359 of 362
// Creates table: vat_configurations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`vat_configurations\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`treatment\` enum('standard','exempt','zero_rated') NOT NULL,
  \`rate\` decimal(5,4) NOT NULL DEFAULT '0.0000',
  \`description\` text,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`effective_from\` date DEFAULT NULL,
  \`requires_approval\` tinyint(1) DEFAULT '1',
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('vat_configurations');
};
