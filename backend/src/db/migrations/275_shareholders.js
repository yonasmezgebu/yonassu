// Migration step 275 of 362
// Creates table: shareholders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`shareholders\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(200) NOT NULL,
  \`email\` varchar(150) DEFAULT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`share_percentage\` decimal(5,2) DEFAULT '0.00',
  \`shares_count\` int(11) DEFAULT '0',
  \`share_type\` enum('ordinary','preferred','founder') DEFAULT 'ordinary',
  \`status\` enum('active','inactive') DEFAULT 'active',
  \`joined_date\` date DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('shareholders');
};
