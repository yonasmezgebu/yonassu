const { db } = require('./src/config/database');
db.raw("ALTER TABLE retail_orders MODIFY COLUMN payment_status ENUM('AWAITING_PAYMENT', 'PENDING', 'PAID', 'OVERDUE') DEFAULT 'AWAITING_PAYMENT'").then(() => {
  console.log('success');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
