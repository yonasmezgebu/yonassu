// Migration step 360 of 362
// Creates table: vat_change_history
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`vat_change_history\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`vat_config_id\` int(10) unsigned NOT NULL,
  \`change_type\` enum('created','updated','approved','rejected','deactivated') NOT NULL,
  \`old_rate\` decimal(5,4) DEFAULT NULL,
  \`new_rate\` decimal(5,4) DEFAULT NULL,
  \`old_treatment\` varchar(50) DEFAULT NULL,
  \`new_treatment\` varchar(50) DEFAULT NULL,
  \`old_effective_from\` date DEFAULT NULL,
  \`new_effective_from\` date DEFAULT NULL,
  \`changed_by_id\` int(10) unsigned DEFAULT NULL,
  \`changed_by_name\` varchar(150) DEFAULT NULL,
  \`changed_by_role\` varchar(100) DEFAULT NULL,
  \`approval_status\` enum('pending','approved','rejected') DEFAULT 'pending',
  \`approved_by_id\` int(10) unsigned DEFAULT NULL,
  \`approved_by_name\` varchar(150) DEFAULT NULL,
  \`notes\` text,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`vat_change_history_vat_config_id_foreign\` (\`vat_config_id\`),
  CONSTRAINT \`vat_change_history_vat_config_id_foreign\` FOREIGN KEY (\`vat_config_id\`) REFERENCES \`vat_configurations\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('vat_change_history');
};
