// Migration step 142 of 362
// Creates table: payment_schedules
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payment_schedules\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`reference_type\` varchar(30) NOT NULL,
  \`reference_id\` int(10) unsigned NOT NULL,
  \`total_amount\` decimal(15,2) NOT NULL,
  \`paid_amount\` decimal(15,2) DEFAULT '0.00',
  \`remaining_amount\` decimal(15,2) NOT NULL,
  \`due_date\` date NOT NULL,
  \`scheduled_date\` date DEFAULT NULL,
  \`status\` enum('pending','partial','paid','overdue','cancelled') DEFAULT 'pending',
  \`supplier_id\` int(10) unsigned DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payment_schedules');
};
