const mysql = require('mysql2/promise');
const config = require('./src/config/env');
mysql.createConnection({
  host: config.database.host, user: config.database.user,
  password: config.database.password, database: config.database.database
}).then(async c => {
  // Check if table already exists
  const [existing] = await c.query("SHOW TABLES LIKE 'pharmacy_direct_deliveries'");
  if (existing.length > 0) {
    console.log('Table already exists');
    const [cols] = await c.query("SHOW COLUMNS FROM pharmacy_direct_deliveries");
    console.log(cols.map(r => r.Field));
    c.end();
    return;
  }
  
  await c.query(`
    CREATE TABLE pharmacy_direct_deliveries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      delivery_no VARCHAR(50) UNIQUE NOT NULL,
      supplier_name VARCHAR(255) NOT NULL,
      drug_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      unit_of_measure VARCHAR(50) DEFAULT 'Units',
      unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      delivery_date DATE NOT NULL,
      invoice_no VARCHAR(100),
      notes TEXT,
      received_by INT,
      received_by_name VARCHAR(100),
      status ENUM('PENDING_CEO', 'CEO_CONFIRMED', 'CEO_REJECTED', 'FINANCE_PAID') DEFAULT 'PENDING_CEO',
      ceo_confirmed_at TIMESTAMP NULL,
      ceo_confirmed_by INT,
      ceo_notes TEXT,
      finance_payable_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Created pharmacy_direct_deliveries table');
  c.end();
});
