exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('tenders');
  if (hasTable) {
    const hasCol = await knex.schema.hasColumn('tenders', 'attachments');
    if (hasCol) {
      await knex.raw('ALTER TABLE tenders MODIFY COLUMN attachments TEXT');
    }
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('tenders');
  if (hasTable) {
    const hasCol = await knex.schema.hasColumn('tenders', 'attachments');
    if (hasCol) {
      await knex.raw('ALTER TABLE tenders MODIFY COLUMN attachments VARCHAR(1000)');
    }
  }
};
