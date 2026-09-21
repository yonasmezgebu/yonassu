// Migration step 254 of 362
// Creates table: risk_register
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`risk_register\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(200) NOT NULL,
  \`description\` text,
  \`category\` varchar(100) DEFAULT NULL,
  \`likelihood\` enum('rare','unlikely','possible','likely','almost-certain') DEFAULT 'possible',
  \`impact\` enum('negligible','minor','moderate','major','severe') DEFAULT 'moderate',
  \`risk_score\` int(11) DEFAULT NULL,
  \`status\` enum('identified','assessed','mitigated','monitored','closed') DEFAULT 'identified',
  \`owner\` varchar(100) DEFAULT NULL,
  \`mitigation_strategy\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('risk_register');
};
