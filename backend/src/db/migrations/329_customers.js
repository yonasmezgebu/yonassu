// Migration step 329 of 362
// Creates table: customers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`customers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) DEFAULT NULL,
  \`name\` varchar(100) NOT NULL,
  \`phone\` varchar(20) NOT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`customer_type_id\` int(11) NOT NULL,
  \`address\` text,
  \`tax_id\` varchar(50) DEFAULT NULL,
  \`credit_limit\` decimal(15,2) DEFAULT '0.00',
  \`current_balance\` decimal(15,2) DEFAULT '0.00',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_by\` int(11) DEFAULT NULL,
  \`deleted_at\` datetime DEFAULT NULL,
  \`customer_group\` varchar(50) DEFAULT 'Retail',
  \`loyalty_tier_id\` int(10) unsigned DEFAULT NULL,
  \`total_lifetime_value\` decimal(15,2) DEFAULT '0.00',
  \`last_purchase_date\` date DEFAULT NULL,
  \`preferred_communication\` varchar(20) DEFAULT 'SMS',
  \`tags\` text,
  \`total_visits\` int(11) DEFAULT '0',
  \`preferred_language\` varchar(10) DEFAULT 'en',
  \`password_hash\` varchar(255) DEFAULT NULL,
  \`profile_picture\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`user_id\` (\`user_id\`),
  KEY \`idx_customers_phone\` (\`phone\`),
  KEY \`idx_customers_type\` (\`customer_type_id\`),
  KEY \`created_by\` (\`created_by\`),
  CONSTRAINT \`customers_ibfk_1\` FOREIGN KEY (\`customer_type_id\`) REFERENCES \`customer_types\` (\`id\`),
  CONSTRAINT \`customers_ibfk_2\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_customer_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customers');
};
