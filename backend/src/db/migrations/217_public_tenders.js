// Migration step 217 of 362
// Creates table: public_tenders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_tenders\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`description\` text,
  \`status\` varchar(255) DEFAULT 'draft',
  \`created_by\` int(11) DEFAULT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`tender_number\` varchar(255) DEFAULT NULL,
  \`category\` varchar(255) DEFAULT NULL,
  \`opening_date\` date DEFAULT NULL,
  \`closing_date\` date DEFAULT NULL,
  \`contact_phone1\` varchar(255) DEFAULT NULL,
  \`contact_phone2\` varchar(255) DEFAULT NULL,
  \`contact_email\` varchar(255) DEFAULT NULL,
  \`ceo_read\` tinyint(1) DEFAULT '0',
  \`purchase_read\` tinyint(1) DEFAULT '0',
  \`delivery_status\` enum('PENDING','RECEIVED') DEFAULT 'PENDING',
  \`payment_status\` enum('PENDING','PAID') DEFAULT 'PENDING',
  \`tender_type\` varchar(255) DEFAULT 'multiple',
  \`image_path\` varchar(255) DEFAULT NULL,
  \`terms_conditions\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_tenders');
};
