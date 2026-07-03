const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'sutana_ems', multipleStatements: true });

  const tables = ['pharmacy_manager_requests', 'pharmacy_branch_toggle_log', 'pharmacy_prescriptions',
    'pharmacy_customer_queries', 'pharmacy_drug_hide_log', 'pharmacy_expired_drugs', 'pharmacy_audit_trail',
    'pharmacy_finance_records', 'phyarmacy_report_payments', 'pharmacy_report_branches', 'pharmacy_sales_reports',
    'pharmacy_payments', 'pharmacy_sale_items', 'pharmacy_sales', 'pharmacy_workers', 'pharmacy_branches'
  ];

  await c.execute('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of tables) {
    await c.execute(`DROP TABLE IF EXISTS \`${t}\``);
  }
  await c.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Dropped existing tables');

  const sql = `
    CREATE TABLE pharmacy_branches (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE,
      status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_workers (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, branch_id INT,
      post_permission BOOLEAN DEFAULT FALSE, phone VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES pharmacy_branches(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_sales (
      id INT AUTO_INCREMENT PRIMARY KEY, branch_id INT, worker_id INT,
      sale_type VARCHAR(30) NOT NULL, recipient_name VARCHAR(200), recipient_phone VARCHAR(30),
      total_products INT DEFAULT 0, total_amount DECIMAL(12,2) DEFAULT 0, receipt_no VARCHAR(50) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES pharmacy_branches(id), FOREIGN KEY (worker_id) REFERENCES pharmacy_workers(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_sale_items (
      id INT AUTO_INCREMENT PRIMARY KEY, sale_id INT, drug_name VARCHAR(200),
      quantity INT DEFAULT 1, unit_price DECIMAL(12,2) DEFAULT 0, total_price DECIMAL(12,2) DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES pharmacy_sales(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_payments (
      id INT AUTO_INCREMENT PRIMARY KEY, sale_id INT,
      payment_method ENUM('CASH','BANK_TRANSFER','TELBIR') NOT NULL,
      amount DECIMAL(12,2) DEFAULT 0, recipient_name VARCHAR(200), recipient_phone VARCHAR(30),
      bank_name VARCHAR(100), account_holder VARCHAR(200), account_number VARCHAR(100),
      telbir_number VARCHAR(50), branch_name VARCHAR(100), worker_name VARCHAR(150),
      status ENUM('PAID','CASHOUT') DEFAULT 'PAID', receipt_no VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES pharmacy_sales(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_sales_reports (
      id INT AUTO_INCREMENT PRIMARY KEY, report_date DATE NOT NULL,
      total_sales INT DEFAULT 0, total_amount DECIMAL(12,2) DEFAULT 0,
      status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
      submitted_by INT, submitted_at TIMESTAMP NULL,
      finance_decision VARCHAR(30), finance_notes TEXT, finance_decided_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (submitted_by) REFERENCES users(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_report_branches (
      id INT AUTO_INCREMENT PRIMARY KEY, report_id INT, branch_id INT,
      total_sales INT DEFAULT 0, total_amount DECIMAL(12,2) DEFAULT 0, worker_count INT DEFAULT 0,
      FOREIGN KEY (report_id) REFERENCES pharmacy_sales_reports(id), FOREIGN KEY (branch_id) REFERENCES pharmacy_branches(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_report_payments (
      id INT AUTO_INCREMENT PRIMARY KEY, report_id INT, payment_type VARCHAR(50),
      count INT DEFAULT 0, total_amount DECIMAL(12,2) DEFAULT 0,
      FOREIGN KEY (report_id) REFERENCES pharmacy_sales_reports(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_finance_records (
      id INT AUTO_INCREMENT PRIMARY KEY, report_id INT UNIQUE,
      revenue DECIMAL(12,2) DEFAULT 0, cogs DECIMAL(12,2) DEFAULT 0,
      profit_loss DECIMAL(12,2) DEFAULT 0, result ENUM('PROFIT','LOSS'),
      income_recorded BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES pharmacy_sales_reports(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_audit_trail (
      id INT AUTO_INCREMENT PRIMARY KEY, branch_id INT, worker_id INT,
      action VARCHAR(30), recipient VARCHAR(200), amount DECIMAL(12,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES pharmacy_branches(id), FOREIGN KEY (worker_id) REFERENCES pharmacy_workers(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_expired_drugs (
      id INT AUTO_INCREMENT PRIMARY KEY, drug_name VARCHAR(200),
      quantity INT DEFAULT 0, expiry_date DATE, location VARCHAR(50),
      action_required VARCHAR(50), status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
      requested_by INT, ceo_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (requested_by) REFERENCES users(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_drug_hide_log (
      id INT AUTO_INCREMENT PRIMARY KEY, drug_id INT, drug_name VARCHAR(200),
      reason TEXT, hide_type VARCHAR(30), auto_show_at DATE,
      notify_ceo BOOLEAN DEFAULT TRUE, hidden_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hidden_by) REFERENCES users(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_customer_queries (
      id INT AUTO_INCREMENT PRIMARY KEY, drug_name VARCHAR(200),
      channel VARCHAR(30), response_status VARCHAR(30),
      customer_name VARCHAR(200), customer_phone VARCHAR(30),
      notify_on_restock BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_prescriptions (
      id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT,
      customer_name VARCHAR(200), customer_phone VARCHAR(30),
      drug_name VARCHAR(200), quantity INT DEFAULT 0,
      prescription_file TEXT, source VARCHAR(30), intake_source VARCHAR(50),
      special_instructions TEXT, status ENUM('PENDING','PREPARED','PICKED_UP') DEFAULT 'PENDING',
      reference_no VARCHAR(50) UNIQUE, branch_pickup VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_branch_toggle_log (
      id INT AUTO_INCREMENT PRIMARY KEY, branch_id INT,
      action ENUM('ACTIVE','INACTIVE') NOT NULL, toggled_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES pharmacy_branches(id), FOREIGN KEY (toggled_by) REFERENCES users(id)
    ) ENGINE=InnoDB;

    CREATE TABLE pharmacy_manager_requests (
      id INT AUTO_INCREMENT PRIMARY KEY, drug_name VARCHAR(200),
      request_type VARCHAR(30), current_value DECIMAL(12,2),
      requested_value DECIMAL(12,2), ceo_value DECIMAL(12,2),
      status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
      reason TEXT, requested_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (requested_by) REFERENCES users(id)
    ) ENGINE=InnoDB;
  `;

  await c.query(sql);
  console.log('All tables created');

  // Seed data
  const [branches] = await c.execute('SELECT COUNT(*) as c FROM pharmacy_branches');
  if (branches[0].c === 0) {
    await c.execute("INSERT INTO pharmacy_branches (name, status) VALUES ('Branch A', 'ACTIVE'), ('Branch B', 'ACTIVE'), ('Branch C', 'ACTIVE')");
    await c.execute("INSERT INTO pharmacy_workers (name, branch_id, post_permission) VALUES ('Worker 1', 1, TRUE), ('Worker 2', 1, FALSE), ('Worker 3', 2, TRUE), ('Worker 4', 2, FALSE), ('Worker 5', 3, TRUE), ('Worker 6', 3, FALSE)");
    console.log('Seed data inserted');
  }

  await c.end();
  console.log('Flow 4 migration complete!');
})();
