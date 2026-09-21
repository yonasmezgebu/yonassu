// Migration step 303 of 362
// Creates table: store_attendance
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_attendance\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`staff_id\` int(10) unsigned NOT NULL,
  \`attendance_date\` date NOT NULL,
  \`status\` enum('Present','Absent','Late','Leave') DEFAULT 'Present',
  \`reason\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`store_attendance_staff_id_foreign\` (\`staff_id\`),
  CONSTRAINT \`store_attendance_staff_id_foreign\` FOREIGN KEY (\`staff_id\`) REFERENCES \`store_staff\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_attendance');
};
