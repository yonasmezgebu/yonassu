// Migration step 223 of 362
// Creates table: purchase_budget_workflow
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`purchase_budget_workflow\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`request_number\` varchar(50) NOT NULL,
  \`product_name\` varchar(255) NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '1',
  \`estimated_cost\` decimal(12,2) DEFAULT '0.00',
  \`supplier_name\` varchar(255) DEFAULT NULL,
  \`supplier_contact\` varchar(255) DEFAULT NULL,
  \`requested_by\` int(11) NOT NULL,
  \`store_notes\` text,
  \`purchase_officer_id\` int(11) DEFAULT NULL,
  \`po_number\` varchar(100) DEFAULT NULL,
  \`budget_request_notes\` text,
  \`finance_handler\` int(11) DEFAULT NULL,
  \`budget_amount\` decimal(12,2) DEFAULT NULL,
  \`finance_notes\` text,
  \`ceo_budget_handler\` int(11) DEFAULT NULL,
  \`ceo_budget_notes\` text,
  \`budget_approved_at\` timestamp NULL DEFAULT NULL,
  \`purchase_notes\` text,
  \`purchased_at\` timestamp NULL DEFAULT NULL,
  \`advance_amount\` decimal(12,2) DEFAULT NULL,
  \`advance_payment_ref\` varchar(255) DEFAULT NULL,
  \`advance_paid_at\` timestamp NULL DEFAULT NULL,
  \`inventory_handler\` int(11) DEFAULT NULL,
  \`receiving_notes\` text,
  \`goods_received_at\` timestamp NULL DEFAULT NULL,
  \`receipt_handler\` int(11) DEFAULT NULL,
  \`receipt_notes\` text,
  \`receipt_confirmed_at\` timestamp NULL DEFAULT NULL,
  \`ceo_remaining_handler\` int(11) DEFAULT NULL,
  \`remaining_notes\` text,
  \`remaining_approved_at\` timestamp NULL DEFAULT NULL,
  \`remaining_payment_ref\` varchar(255) DEFAULT NULL,
  \`remaining_paid_at\` timestamp NULL DEFAULT NULL,
  \`finance_payment_notes\` text,
  \`status\` enum('STORE_REQUESTED','BUDGET_REQUESTED','BUDGET_FORWARDED_CEO','BUDGET_APPROVED','BUDGET_READY','GOODS_PURCHASED','ADVANCE_PAID','GOODS_RECEIVED','RECEIPT_CONFIRMED','REMAINING_APPROVED','REMAINING_PAID','CANCELLED') DEFAULT 'STORE_REQUESTED',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`request_number\` (\`request_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchase_budget_workflow');
};
