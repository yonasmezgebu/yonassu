// Migration step 93 of 362
// Creates table: goods_receipt_notes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`goods_receipt_notes\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`grn_number\` varchar(30) NOT NULL,
  \`po_id\` int(11) NOT NULL,
  \`received_date\` date NOT NULL,
  \`received_by\` int(11) NOT NULL,
  \`receiving_note\` varchar(500) DEFAULT NULL,
  \`status\` enum('pending','completed','partial') DEFAULT 'completed',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`goods_receipt_notes_grn_number_unique\` (\`grn_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('goods_receipt_notes');
};
