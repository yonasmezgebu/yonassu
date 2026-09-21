// Migration step 68 of 362
// Creates table: expense_categories
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`expense_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`requires_approval\` tinyint(1) DEFAULT '0',
  \`approval_limit\` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expense_categories');
};
