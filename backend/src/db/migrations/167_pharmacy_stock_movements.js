// Migration step 167 of 362
// Creates table: pharmacy_stock_movements
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_stock_movements\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`medication_id\` int(11) NOT NULL,
  \`quantity_change\` int(11) NOT NULL,
  \`reason\` varchar(100) DEFAULT NULL,
  \`reference_no\` varchar(100) DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`medication_id\` (\`medication_id\`),
  CONSTRAINT \`pharmacy_stock_movements_ibfk_1\` FOREIGN KEY (\`medication_id\`) REFERENCES \`pharmacy_medications\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_stock_movements');
};
