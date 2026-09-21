// Migration step 349 of 362
// Creates table: loyalty_points
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`loyalty_points\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`customer_id\` int(11) NOT NULL,
  \`points\` decimal(12,2) NOT NULL,
  \`type\` enum('earned','redeemed','expired','reversed','signup_bonus') DEFAULT NULL,
  \`reference_type\` varchar(50) DEFAULT NULL,
  \`reference_id\` int(10) unsigned DEFAULT NULL,
  \`expires_at\` date DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`loyalty_points_customer_id_foreign\` (\`customer_id\`),
  CONSTRAINT \`loyalty_points_customer_id_foreign\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('loyalty_points');
};
