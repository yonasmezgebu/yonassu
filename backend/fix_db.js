const knex = require('knex')(require('./knexfile'));

async function createTable() {
  try {
    const exists = await knex.schema.hasTable('retail_branch_products');
    if (!exists) {
      await knex.schema.createTable('retail_branch_products', (t) => {
        t.increments('id').primary();
        t.integer('branch_id').unsigned().notNullable().references('id').inTable('retail_branches').onDelete('CASCADE');
        t.integer('product_id').unsigned().notNullable().references('id').inTable('retail_products').onDelete('CASCADE');
        t.integer('quantity').defaultTo(0);
        t.timestamps(true, true);
      });
      console.log('TABLE CREATED SUCCESSFULLY');
    } else {
      console.log('TABLE ALREADY EXISTS');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await knex.destroy();
  }
}

createTable();
