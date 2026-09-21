// Migration step 281 of 362
// Creates table: stamps
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stamps\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`stamp_id\` varchar(100) NOT NULL,
  \`document_id\` int(11) NOT NULL,
  \`document_type\` varchar(30) NOT NULL COMMENT 'REQUISITION, APPROVAL, ISSUE, GRN',
  \`approved_by\` int(11) NOT NULL,
  \`approved_by_name\` varchar(100) DEFAULT NULL,
  \`role\` varchar(50) NOT NULL,
  \`timestamp\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`hash\` varchar(255) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`stamps_stamp_id_unique\` (\`stamp_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stamps');
};
