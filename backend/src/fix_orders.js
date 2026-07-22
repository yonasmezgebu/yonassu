require('dotenv').config({ path: '../.env' });
const knex = require('knex');
const knexfile = require('../knexfile');
const db = knex(knexfile.development || knexfile);

async function fixStuckOrders() {
  try {
    const receivedStatus = await db('order_statuses').where('status_code', 'received').first();
    const inQueueStatus = await db('order_statuses').where('status_code', 'in_queue').first();
    
    if (receivedStatus && inQueueStatus) {
      const updated = await db('printing_orders')
        .where('status_id', receivedStatus.id)
        .update({ status_id: inQueueStatus.id });
      console.log(`Updated ${updated} orders from 'received' to 'in_queue'.`);
    } else {
      console.log('Statuses not found.');
      if (!inQueueStatus) {
        const statuses = await db('order_statuses').select('*');
        console.log('Available statuses:', statuses);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixStuckOrders();
