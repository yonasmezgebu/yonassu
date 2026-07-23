-- ============================================================
-- FINANCE MODULE DATABASE SCHEMA
-- Database: sutana_ems
-- ============================================================

-- ------------------------------------------------------------
-- 1. finance_accounts — bank/cash accounts
-- ------------------------------------------------------------
CREATE TABLE `finance_accounts` (
  `id`                  int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account_name`        varchar(255) NOT NULL,
  `account_type`        varchar(255) NOT NULL,
  `bank_provider`       varchar(255) DEFAULT NULL,
  `account_number`      varchar(255) DEFAULT NULL,
  `branch`              varchar(255) DEFAULT NULL,
  `currency`            varchar(255) NOT NULL DEFAULT 'ETB',
  `opening_balance`     decimal(15,2) NOT NULL DEFAULT '0.00',
  `opening_balance_date` date NOT NULL,
  `status`              varchar(255) NOT NULL DEFAULT 'Active',
  `description`         text,
  `created_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 2. finance_cashbook — cashbook journal
-- ------------------------------------------------------------
CREATE TABLE `finance_cashbook` (
  `id`          int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date`        date NOT NULL,
  `type`        varchar(255) NOT NULL,
  `reference`   varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `receipts`    decimal(15,2) DEFAULT '0.00',
  `payments`    decimal(15,2) DEFAULT '0.00',
  `created_at`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 3. finance_crvs — Cash Receipt Vouchers
-- ------------------------------------------------------------
CREATE TABLE `finance_crvs` (
  `id`                int(10) unsigned NOT NULL AUTO_INCREMENT,
  `crv_number`        varchar(255) NOT NULL,
  `date`              date NOT NULL,
  `received_from`     varchar(255) NOT NULL,
  `amount`            decimal(15,2) NOT NULL,
  `payment_method`    varchar(255) NOT NULL,
  `description`       varchar(255) NOT NULL,
  `reference_no`      varchar(255) DEFAULT NULL,
  `bank_name`         varchar(255) DEFAULT NULL,
  `account_holder`    varchar(255) DEFAULT NULL,
  `account_number`    varchar(255) DEFAULT NULL,
  `cheque_no`         varchar(255) DEFAULT NULL,
  `telebirr_number`   varchar(255) DEFAULT NULL,
  `telebirr_name`     varchar(255) DEFAULT NULL,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `prepared_by`       varchar(255) DEFAULT NULL,
  `checked_by`        varchar(255) DEFAULT NULL,
  `receiver_name`     varchar(255) DEFAULT NULL,
  `prepared_signature` longtext,
  `checked_signature`  longtext,
  `receiver_signature` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_crvs_crv_number_unique` (`crv_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 4. finance_customer_credit — customer credit tracking
-- ------------------------------------------------------------
CREATE TABLE `finance_customer_credit` (
  `id`                int(11) NOT NULL AUTO_INCREMENT,
  `customer_id`       int(11) NOT NULL,
  `invoice_id`        int(11) DEFAULT NULL,
  `original_amount`   decimal(12,2) NOT NULL,
  `paid_amount`       decimal(12,2) DEFAULT '0.00',
  `balance`           decimal(12,2) GENERATED ALWAYS AS ((`original_amount` - `paid_amount`)) STORED,
  `invoice_date`      date NOT NULL,
  `due_date`          date DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `status`            enum('OUTSTANDING','PAID','OVERDUE','WRITTEN_OFF') DEFAULT 'OUTSTANDING',
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `finance_customer_credit_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `finance_customer_credit_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `pos_sales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. finance_departments — department list
-- ------------------------------------------------------------
CREATE TABLE `finance_departments` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `name`       varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. finance_expense_categories — expense categories
-- ------------------------------------------------------------
CREATE TABLE `finance_expense_categories` (
  `id`          int(11) NOT NULL AUTO_INCREMENT,
  `name`        varchar(100) NOT NULL,
  `description` text,
  `created_at`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. finance_expenses — expense requests with approval workflow
-- ------------------------------------------------------------
CREATE TABLE `finance_expenses` (
  `id`                int(11) NOT NULL AUTO_INCREMENT,
  `expense_number`    varchar(30) NOT NULL,
  `category_id`       int(11) NOT NULL,
  `department_id`     int(11) NOT NULL,
  `amount`            decimal(12,2) NOT NULL,
  `expense_date`      date NOT NULL,
  `description`       text NOT NULL,
  `notes`             text,
  `status`            enum('DRAFT','PENDING_CEO_APPROVAL','APPROVED','REJECTED','NEEDS_INFO','PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `submitted_by`      int(11) DEFAULT NULL,
  `reviewed_by`       int(11) DEFAULT NULL,
  `reviewed_at`       datetime DEFAULT NULL,
  `review_notes`      text,
  `rejection_reason`  text,
  `paid_by`           int(11) DEFAULT NULL,
  `paid_at`           datetime DEFAULT NULL,
  `payment_method_id` int(11) DEFAULT NULL,
  `reference_number`  varchar(100) DEFAULT NULL,
  `receipt_path`      varchar(500) DEFAULT NULL,
  `cancelled_by`      int(11) DEFAULT NULL,
  `cancelled_at`      datetime DEFAULT NULL,
  `cancel_reason`     text,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_number` (`expense_number`),
  KEY `category_id` (`category_id`),
  KEY `department_id` (`department_id`),
  KEY `submitted_by` (`submitted_by`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `paid_by` (`paid_by`),
  CONSTRAINT `finance_expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `finance_expense_categories` (`id`),
  CONSTRAINT `finance_expenses_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `finance_departments` (`id`),
  CONSTRAINT `finance_expenses_ibfk_3` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `finance_expenses_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `finance_expenses_ibfk_5` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 8. finance_expense_payments — expense payment transactions
-- ------------------------------------------------------------
CREATE TABLE `finance_expense_payments` (
  `id`               int(11) NOT NULL AUTO_INCREMENT,
  `expense_id`       int(11) NOT NULL,
  `amount`           decimal(12,2) NOT NULL,
  `payment_method`   varchar(50) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `paid_by`          int(11) NOT NULL,
  `paid_at`          datetime NOT NULL,
  `notes`            text,
  `created_at`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `paid_by` (`paid_by`),
  CONSTRAINT `finance_expense_payments_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `finance_expenses` (`id`),
  CONSTRAINT `finance_expense_payments_ibfk_2` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 9. finance_expense_seq — expense numbering sequence
-- ------------------------------------------------------------
CREATE TABLE `finance_expense_seq` (
  `id`       int(11) NOT NULL AUTO_INCREMENT,
  `seq_date` date NOT NULL,
  `counter`  int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_seq_date` (`seq_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 10. finance_income_submissions — income/department revenue
-- ------------------------------------------------------------
CREATE TABLE `finance_income_submissions` (
  `id`             int(10) unsigned NOT NULL AUTO_INCREMENT,
  `department`     varchar(255) NOT NULL,
  `submitted_by`   varchar(255) NOT NULL,
  `amount`         decimal(14,2) NOT NULL,
  `currency`       varchar(255) DEFAULT 'ETB',
  `reference_no`   varchar(255) DEFAULT NULL,
  `description`    varchar(255) DEFAULT NULL,
  `status`         varchar(255) DEFAULT 'Pending',
  `created_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `manual_details` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 11. finance_notifications — expense workflow notifications
-- ------------------------------------------------------------
CREATE TABLE `finance_notifications` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) NOT NULL,
  `type`       enum('PENDING_APPROVAL','APPROVED','REJECTED','NEEDS_INFO','PAID','CANCELLED') NOT NULL,
  `message`    text NOT NULL,
  `is_read`    tinyint(1) DEFAULT '0',
  `read_by`    int(11) DEFAULT NULL,
  `read_at`    datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `read_by` (`read_by`),
  CONSTRAINT `finance_notifications_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `finance_expenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `finance_notifications_ibfk_2` FOREIGN KEY (`read_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 12. finance_payables — accounts payable (PVs)
-- ------------------------------------------------------------
CREATE TABLE `finance_payables` (
  `id`                  int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pv_number`           varchar(255) NOT NULL,
  `date`                date NOT NULL,
  `paid_to`             varchar(255) NOT NULL,
  `category`            varchar(255) NOT NULL,
  `total_amount`        decimal(14,2) NOT NULL,
  `amount_paid`         decimal(14,2) DEFAULT '0.00',
  `outstanding_balance` decimal(14,2) DEFAULT '0.00',
  `payment_method`      varchar(255) NOT NULL DEFAULT 'Cash',
  `description`         varchar(255) DEFAULT NULL,
  `reference_no`        varchar(255) DEFAULT NULL,
  `status`              varchar(255) DEFAULT 'Paid',
  `due_date`            date DEFAULT NULL,
  `bank_details`        text,
  `telebirr_details`    text,
  `prepared_by`         text,
  `checked_by`          text,
  `payee_name`          text,
  `prepared_signature`  text,
  `checked_signature`   text,
  `payee_signature`     text,
  `created_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_payables_pv_number_unique` (`pv_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 13. finance_pcvs — Petty Cash Vouchers (with CEO approval)
-- ------------------------------------------------------------
CREATE TABLE `finance_pcvs` (
  `id`                int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pcv_number`        varchar(255) NOT NULL,
  `date`              date NOT NULL,
  `paid_to`           varchar(255) NOT NULL,
  `amount`            decimal(14,2) NOT NULL,
  `payment_method`    varchar(255) NOT NULL DEFAULT 'Cash',
  `description`       varchar(255) NOT NULL,
  `reference_no`      varchar(255) DEFAULT NULL,
  `prepared_by`       varchar(255) DEFAULT NULL,
  `checked_by`        varchar(255) DEFAULT NULL,
  `receiver_name`     varchar(255) DEFAULT NULL,
  `prepared_signature` longtext,
  `checked_signature`  longtext,
  `receiver_signature` longtext,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bank_name`         varchar(255) DEFAULT NULL,
  `account_holder`    varchar(255) DEFAULT NULL,
  `account_number`    varchar(255) DEFAULT NULL,
  `cheque_no`         varchar(255) DEFAULT NULL,
  `telebirr_number`   varchar(255) DEFAULT NULL,
  `telebirr_name`     varchar(255) DEFAULT NULL,
  `status`            varchar(255) NOT NULL DEFAULT 'pending_ceo',
  `reject_reason`     text,
  `ceo_read`          tinyint(1) NOT NULL DEFAULT '0',
  `finance_read`      tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_pcvs_pcv_number_unique` (`pcv_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 14. finance_pvs — Payment Vouchers
-- ------------------------------------------------------------
CREATE TABLE `finance_pvs` (
  `id`                int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pv_number`         varchar(255) NOT NULL,
  `date`              date NOT NULL,
  `paid_to`           varchar(255) NOT NULL,
  `amount`            decimal(14,2) NOT NULL,
  `payment_method`    varchar(255) NOT NULL,
  `description`       varchar(255) NOT NULL,
  `reference_no`      varchar(255) DEFAULT NULL,
  `bank_name`         varchar(255) DEFAULT NULL,
  `account_holder`    varchar(255) DEFAULT NULL,
  `account_number`    varchar(255) DEFAULT NULL,
  `cheque_no`         varchar(255) DEFAULT NULL,
  `telebirr_number`   varchar(255) DEFAULT NULL,
  `telebirr_name`     varchar(255) DEFAULT NULL,
  `prepared_by`       varchar(255) DEFAULT NULL,
  `checked_by`        varchar(255) DEFAULT NULL,
  `receiver_name`     varchar(255) DEFAULT NULL,
  `prepared_signature` longtext,
  `checked_signature`  longtext,
  `receiver_signature` longtext,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_pvs_pv_number_unique` (`pv_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 15. finance_receivables — accounts receivable
-- ------------------------------------------------------------
CREATE TABLE `finance_receivables` (
  `id`                 int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_name`      varchar(255) NOT NULL,
  `invoice_no`         varchar(255) DEFAULT NULL,
  `invoice_date`       date NOT NULL,
  `due_date`           date NOT NULL,
  `total_amount`       decimal(14,2) NOT NULL,
  `amount_paid`        decimal(14,2) DEFAULT '0.00',
  `outstanding_balance` decimal(14,2) DEFAULT '0.00',
  `status`             varchar(255) DEFAULT 'Unpaid',
  `department_source`  varchar(255) DEFAULT NULL,
  `created_at`         timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `manual_details`     longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 16. finance_reconciliations — bank reconciliation headers
-- ------------------------------------------------------------
CREATE TABLE `finance_reconciliations` (
  `id`                int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reconciliation_no` varchar(255) NOT NULL,
  `account_id`        int(10) unsigned DEFAULT NULL,
  `period_from`       date NOT NULL,
  `period_to`         date NOT NULL,
  `erp_balance`       decimal(15,2) NOT NULL DEFAULT '0.00',
  `actual_balance`    decimal(15,2) NOT NULL DEFAULT '0.00',
  `difference`        decimal(15,2) NOT NULL DEFAULT '0.00',
  `status`            varchar(255) NOT NULL DEFAULT 'Draft',
  `notes`             text,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_reconciliations_reconciliation_no_unique` (`reconciliation_no`),
  KEY `finance_reconciliations_account_id_foreign` (`account_id`),
  CONSTRAINT `finance_reconciliations_account_id_foreign`
    FOREIGN KEY (`account_id`) REFERENCES `finance_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 17. finance_recon_items — reconciliation line items
-- ------------------------------------------------------------
CREATE TABLE `finance_recon_items` (
  `id`                int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reconciliation_id` int(10) unsigned DEFAULT NULL,
  `transaction_date`  date DEFAULT NULL,
  `reference_no`      varchar(255) DEFAULT NULL,
  `transaction_type`  varchar(255) DEFAULT NULL,
  `description`       varchar(255) DEFAULT NULL,
  `erp_amount`        decimal(15,2) DEFAULT '0.00',
  `actual_amount`     decimal(15,2) DEFAULT '0.00',
  `difference`        decimal(15,2) DEFAULT '0.00',
  `match_status`      varchar(255) DEFAULT 'Unmatched',
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `finance_recon_items_reconciliation_id_foreign` (`reconciliation_id`),
  CONSTRAINT `finance_recon_items_reconciliation_id_foreign`
    FOREIGN KEY (`reconciliation_id`) REFERENCES `finance_reconciliations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
