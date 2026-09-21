// Migration step 224 of 362
// Creates table: purchase_orders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`purchase_orders\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`po_number\` varchar(20) NOT NULL,
  \`supplier_id\` int(11) NOT NULL,
  \`order_date\` date NOT NULL,
  \`expected_delivery_date\` date NOT NULL,
  \`sector_id\` int(11) NOT NULL,
  \`status_id\` int(11) NOT NULL,
  \`subtotal\` decimal(15,2) NOT NULL,
  \`tax_amount\` decimal(15,2) DEFAULT '0.00',
  \`total_amount\` decimal(15,2) NOT NULL,
  \`paid_amount\` decimal(15,2) DEFAULT '0.00',
  \`notes\` text,
  \`attachment\` varchar(255) DEFAULT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`approved_at\` datetime DEFAULT NULL,
  \`rejection_reason\` text,
  \`created_by\` int(11) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`deleted_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`po_number\` (\`po_number\`),
  KEY \`idx_po_number\` (\`po_number\`),
  KEY \`idx_po_supplier\` (\`supplier_id\`),
  KEY \`idx_po_status\` (\`status_id\`),
  KEY \`sector_id\` (\`sector_id\`),
  KEY \`approved_by\` (\`approved_by\`),
  KEY \`created_by\` (\`created_by\`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchase_orders');
};
