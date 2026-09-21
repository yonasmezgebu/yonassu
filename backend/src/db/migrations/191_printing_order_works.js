// Migration step 191 of 362
// Creates table: printing_order_works
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_order_works\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`order_id\` int(11) NOT NULL,
  \`filename\` varchar(255) NOT NULL,
  \`original_name\` varchar(255) NOT NULL,
  \`size\` int(10) unsigned NOT NULL DEFAULT '0',
  \`mime_type\` varchar(120) DEFAULT NULL,
  \`file_path\` varchar(500) DEFAULT NULL,
  \`file_url\` varchar(500) DEFAULT NULL,
  \`message\` text,
  \`uploaded_by\` int(10) unsigned DEFAULT NULL,
  \`uploaded_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`printing_order_works_order_id_foreign\` (\`order_id\`),
  CONSTRAINT \`printing_order_works_order_id_foreign\` FOREIGN KEY (\`order_id\`) REFERENCES \`printing_orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_order_works');
};
