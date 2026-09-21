// Migration step 135 of 362
// Creates table: job_applications
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`job_applications\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`post_id\` int(10) unsigned DEFAULT NULL,
  \`full_name\` varchar(255) NOT NULL,
  \`phone_number\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`education_status\` varchar(255) NOT NULL,
  \`national_id\` varchar(255) NOT NULL,
  \`sex\` enum('Male','Female') NOT NULL,
  \`status\` enum('PENDING','IN_PERSON_INVITED','SUBMITTED_TO_CEO','REJECTED','APPROVED','INFORMED') DEFAULT 'PENDING',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`rejection_reason\` text,
  \`id_front_image\` varchar(255) DEFAULT NULL,
  \`id_back_image\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`job_applications_post_id_foreign\` (\`post_id\`),
  CONSTRAINT \`job_applications_post_id_foreign\` FOREIGN KEY (\`post_id\`) REFERENCES \`news_posts\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('job_applications');
};
