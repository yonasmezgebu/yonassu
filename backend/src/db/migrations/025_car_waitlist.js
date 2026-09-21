// Migration step 25 of 362
// Creates table: car_waitlist
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`car_waitlist\` (
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`car_id\` bigint(20) NOT NULL,
  \`user_id\` bigint(20) DEFAULT NULL,
  \`customer_name\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`customer_phone\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`customer_email\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`driver_name\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`driver_license\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`pickup_location\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`preferred_start_date\` date DEFAULT NULL,
  \`preferred_end_date\` date DEFAULT NULL,
  \`message\` mediumtext COLLATE utf8mb4_unicode_ci,
  \`status\` enum('waiting','notified','converted','removed') COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  \`notified_at\` timestamp NULL DEFAULT NULL,
  \`converted_at\` timestamp NULL DEFAULT NULL,
  \`removed_at\` timestamp NULL DEFAULT NULL,
  \`converted_order_id\` bigint(20) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('car_waitlist');
};
