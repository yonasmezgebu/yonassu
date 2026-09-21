// Migration step 305 of 362
// Creates table: store_update_approvals
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_update_approvals\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`material_id\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`requested_by\` int(11) DEFAULT NULL,
  \`update_type\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`before_state\` json DEFAULT NULL,
  \`after_state\` json DEFAULT NULL,
  \`status\` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  \`rejection_reason\` text COLLATE utf8mb4_unicode_ci,
  \`approved_by\` int(11) DEFAULT NULL,
  \`approved_at\` datetime DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_material_id\` (\`material_id\`),
  KEY \`idx_status\` (\`status\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_update_approvals');
};
