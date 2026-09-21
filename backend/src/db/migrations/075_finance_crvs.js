// Migration step 75 of 362
// Creates table: finance_crvs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_crvs\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`crv_number\` varchar(255) NOT NULL,
  \`date\` date NOT NULL,
  \`received_from\` varchar(255) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`payment_method\` varchar(255) NOT NULL,
  \`description\` varchar(255) NOT NULL,
  \`reference_no\` varchar(255) DEFAULT NULL,
  \`bank_name\` varchar(255) DEFAULT NULL,
  \`account_holder\` varchar(255) DEFAULT NULL,
  \`account_number\` varchar(255) DEFAULT NULL,
  \`cheque_no\` varchar(255) DEFAULT NULL,
  \`telebirr_number\` varchar(255) DEFAULT NULL,
  \`telebirr_name\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`prepared_by\` varchar(255) DEFAULT NULL,
  \`checked_by\` varchar(255) DEFAULT NULL,
  \`receiver_name\` varchar(255) DEFAULT NULL,
  \`prepared_signature\` longtext,
  \`checked_signature\` longtext,
  \`receiver_signature\` longtext,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`finance_crvs_crv_number_unique\` (\`crv_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_crvs');
};
