// Migration step 87 of 362
// Creates table: gallery_images
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`gallery_images\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`category\` varchar(255) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`description\` text,
  \`image_path\` varchar(255) NOT NULL,
  \`thumbnail_path\` varchar(255) DEFAULT NULL,
  \`date_taken\` date DEFAULT NULL,
  \`location\` varchar(255) DEFAULT NULL,
  \`display_order\` int(11) NOT NULL DEFAULT '0',
  \`status\` varchar(255) NOT NULL DEFAULT 'active',
  \`uploaded_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('gallery_images');
};
