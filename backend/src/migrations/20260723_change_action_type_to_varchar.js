exports.up = async function (knex) {
  // Check if we are using MySQL or SQLite
  const client = knex.client.config.client;
  
  if (client === 'mysql' || client === 'mysql2') {
    await knex.raw("ALTER TABLE general_movement_log MODIFY COLUMN action_type VARCHAR(50) DEFAULT 'Move to Production'");
  } else {
    // For SQLite or others where ALTER COLUMN is not directly supported,
    // we can skip or recreate. Since SUTANA uses MySQL according to previous errors, this is fine.
    // We'll just leave it as raw for mysql.
  }
};

exports.down = async function (knex) {
  const client = knex.client.config.client;
  if (client === 'mysql' || client === 'mysql2') {
    await knex.raw("ALTER TABLE general_movement_log MODIFY COLUMN action_type ENUM('Move to Production', 'Return to Store', 'Consume', 'Register', 'Value Update') DEFAULT 'Move to Production'");
  }
};
