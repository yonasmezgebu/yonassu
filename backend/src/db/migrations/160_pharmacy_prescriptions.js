// Migration step 160 of 362
// Creates table: pharmacy_prescriptions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_prescriptions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`customer_id\` int(11) DEFAULT NULL,
  \`customer_name\` varchar(200) DEFAULT NULL,
  \`customer_phone\` varchar(30) DEFAULT NULL,
  \`drug_name\` varchar(200) DEFAULT NULL,
  \`quantity\` int(11) DEFAULT '0',
  \`prescription_file\` text,
  \`source\` varchar(30) DEFAULT NULL COMMENT 'ONLINE / PHYSICAL',
  \`intake_source\` varchar(50) DEFAULT NULL COMMENT 'HOSPITAL / HEALTH_INSTITUTION / PRIVATE_DOCTOR',
  \`special_instructions\` text,
  \`status\` enum('PENDING','PREPARED','PICKED_UP','CANCELLED') NOT NULL DEFAULT 'PENDING',
  \`reference_no\` varchar(50) DEFAULT NULL,
  \`branch_pickup\` varchar(100) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pharmacy_prescriptions_reference_no_unique\` (\`reference_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_prescriptions');
};
