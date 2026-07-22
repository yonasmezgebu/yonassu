-- ============================================================
-- RETAIL STORE DATABASE SCHEMA
-- Database: sutana_ems
-- 9 tables: retail_* (7) + pos_* (2)
-- ============================================================

-- ------------------------------------------------------------
-- 1. retail_categories — product categories
-- ------------------------------------------------------------
CREATE TABLE `retail_categories` (
  `id`          int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name`        varchar(255) NOT NULL,
  `slug`        varchar(255) NOT NULL,
  `description` text,
  `icon_class`  varchar(255) DEFAULT NULL,
  `is_active`   tinyint(1) DEFAULT '1',
  `created_at`  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_categories_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 2. retail_products — product catalog
-- ------------------------------------------------------------
CREATE TABLE `retail_products` (
  `id`             int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id`    int(10) unsigned DEFAULT NULL,
  `sku`            varchar(255) NOT NULL,
  `name`           varchar(255) NOT NULL,
  `description`    text,
  `price`          decimal(10,2) NOT NULL,
  `cost_price`     decimal(10,2) DEFAULT '0.00',
  `stock_quantity` int(11) DEFAULT '0',
  `reorder_level`  int(11) DEFAULT '10',
  `product_image`  varchar(255) DEFAULT NULL,
  `is_active`      tinyint(1) DEFAULT '1',
  `created_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_products_sku_unique` (`sku`),
  KEY `retail_products_category_id_foreign` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 3. retail_shifts — shift management
-- ------------------------------------------------------------
CREATE TABLE `retail_shifts` (
  `id`                  int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id`          int(10) unsigned DEFAULT NULL,
  `shift_type`          enum('morning','afternoon','evening') DEFAULT 'morning',
  `opening_float`       decimal(12,2) DEFAULT '0.00',
  `total_sales`         decimal(12,2) DEFAULT '0.00',
  `transaction_count`   int(11) DEFAULT '0',
  `cash_collected`      decimal(12,2) DEFAULT '0.00',
  `telebirr_collected`  decimal(12,2) DEFAULT '0.00',
  `transfer_collected`  decimal(12,2) DEFAULT '0.00',
  `credit_collected`    decimal(12,2) DEFAULT '0.00',
  `physical_cash_counted` decimal(12,2) DEFAULT NULL,
  `difference_amount`   decimal(12,2) DEFAULT '0.00',
  `difference_reason`   varchar(255) DEFAULT NULL,
  `status`              enum('OPEN','CLOSED','VERIFIED') DEFAULT 'OPEN',
  `opened_at`           timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at`           timestamp NULL DEFAULT NULL,
  `created_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 4. retail_transactions — payments (linked to shifts)
-- ------------------------------------------------------------
CREATE TABLE `retail_transactions` (
  `id`               int(10) unsigned NOT NULL AUTO_INCREMENT,
  `shift_id`         int(10) unsigned DEFAULT NULL,
  `invoice_number`   varchar(255) NOT NULL,
  `total_amount`     decimal(12,2) NOT NULL,
  `payment_method`   enum('cash','bank_transfer','telebirr','credit') NOT NULL,
  `payment_ref`      varchar(255) DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `discount_amount`  decimal(12,2) DEFAULT '0.00',
  `customer_phone`   varchar(255) DEFAULT NULL,
  `notes`            text,
  `created_at`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_transactions_invoice_number_unique` (`invoice_number`),
  KEY `retail_transactions_shift_id_foreign` (`shift_id`),
  CONSTRAINT `retail_transactions_shift_id_foreign`
    FOREIGN KEY (`shift_id`) REFERENCES `retail_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 5. retail_orders — customer orders (online / pickup / delivery)
-- ------------------------------------------------------------
CREATE TABLE `retail_orders` (
  `id`               int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id`      int(11) DEFAULT NULL,
  `invoice_number`   varchar(255) NOT NULL,
  `subtotal`         decimal(12,2) DEFAULT '0.00',
  `tax`              decimal(12,2) DEFAULT '0.00',
  `delivery_fee`     decimal(10,2) DEFAULT '0.00',
  `total_amount`     decimal(12,2) NOT NULL,
  `status`           enum('PROCESSING','PACKING','SHIPPED','DELIVERED','CANCELLED') DEFAULT 'PROCESSING',
  `payment_status`   enum('AWAITING_PAYMENT','PAID','OVERDUE') DEFAULT 'AWAITING_PAYMENT',
  `payment_method`   enum('cash','bank_transfer','telebirr','credit') DEFAULT 'cash',
  `delivery_type`    enum('pickup','delivery') DEFAULT 'pickup',
  `delivery_address` varchar(255) DEFAULT NULL,
  `notes`            text,
  `created_at`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_orders_invoice_number_unique` (`invoice_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 6. retail_order_items — order line items (FK to orders & products)
-- ------------------------------------------------------------
CREATE TABLE `retail_order_items` (
  `id`         int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id`   int(10) unsigned DEFAULT NULL,
  `product_id` int(10) unsigned DEFAULT NULL,
  `quantity`   int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal`   decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `retail_order_items_order_id_foreign` (`order_id`),
  KEY `retail_order_items_product_id_foreign` (`product_id`),
  CONSTRAINT `retail_order_items_order_id_foreign`
    FOREIGN KEY (`order_id`) REFERENCES `retail_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `retail_order_items_product_id_foreign`
    FOREIGN KEY (`product_id`) REFERENCES `retail_products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 7. retail_cart_items — shopping cart
-- ------------------------------------------------------------
CREATE TABLE `retail_cart_items` (
  `id`         int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id`    int(10) unsigned DEFAULT NULL,
  `product_id` int(10) unsigned DEFAULT NULL,
  `quantity`   int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- POS (Point of Sale) tables — also part of retail store
-- ============================================================

-- ------------------------------------------------------------
-- 8. pos_shifts — POS shift management (richer than retail_shifts)
-- ------------------------------------------------------------
CREATE TABLE `pos_shifts` (
  `id`                  int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id`          int(10) unsigned NOT NULL,
  `shift_type`          enum('morning','afternoon','evening') DEFAULT 'morning',
  `opening_float`       decimal(12,2) DEFAULT '0.00',
  `total_sales`         decimal(12,2) DEFAULT '0.00',
  `transaction_count`   int(11) DEFAULT '0',
  `cash_collected`      decimal(12,2) DEFAULT '0.00',
  `telebirr_collected`  decimal(12,2) DEFAULT '0.00',
  `transfer_collected`  decimal(12,2) DEFAULT '0.00',
  `credit_collected`    decimal(12,2) DEFAULT '0.00',
  `check_collected`     decimal(12,2) DEFAULT '0.00',
  `physical_cash_counted` decimal(12,2) DEFAULT NULL,
  `difference_amount`   decimal(12,2) DEFAULT '0.00',
  `difference_reason`   varchar(255) DEFAULT NULL,
  `cash_to_handover`    decimal(12,2) DEFAULT '0.00',
  `status`              enum('OPEN','CLOSED','VERIFIED') DEFAULT 'OPEN',
  `verified_by`         int(10) unsigned DEFAULT NULL,
  `verified_at`         timestamp NULL DEFAULT NULL,
  `opened_at`           timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at`           timestamp NULL DEFAULT NULL,
  `created_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 9. pos_sales — POS sales transactions
-- ------------------------------------------------------------
CREATE TABLE `pos_sales` (
  `id`                  int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number`      varchar(100) DEFAULT NULL,
  `customer_id`         int(11) DEFAULT NULL,
  `subtotal`            decimal(15,2) NOT NULL,
  `tax_amount`          decimal(15,2) DEFAULT '0.00',
  `discount_amount`     decimal(15,2) DEFAULT '0.00',
  `total_amount`        decimal(15,2) NOT NULL,
  `payment_method_id`   int(11) NOT NULL,
  `payment_reference`   varchar(100) DEFAULT NULL,
  `amount_paid`         decimal(15,2) NOT NULL,
  `change_amount`       decimal(15,2) DEFAULT '0.00',
  `cashier_id`          int(11) NOT NULL,
  `sale_date`           datetime DEFAULT CURRENT_TIMESTAMP,
  `status_id`           int(11) NOT NULL,
  `voided_by`           int(11) DEFAULT NULL,
  `void_reason`         text,
  `deleted_at`          datetime DEFAULT NULL,
  `notes`               text,
  `sale_type`           enum('walk_in','online') DEFAULT 'walk_in',
  `order_source`        varchar(255) DEFAULT NULL,
  `order_id`            int(10) unsigned DEFAULT NULL,
  `manager_approved`    tinyint(1) DEFAULT '1',
  `manager_approved_by` int(10) unsigned DEFAULT NULL,
  `manager_approved_at` timestamp NULL DEFAULT NULL,
  `manager_flag_reason` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_pos_invoice` (`invoice_number`),
  KEY `idx_pos_customer` (`customer_id`),
  KEY `idx_pos_date` (`sale_date`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `status_id` (`status_id`),
  KEY `cashier_id` (`cashier_id`),
  KEY `voided_by` (`voided_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 10. pos_items — POS sale line items
-- ------------------------------------------------------------
CREATE TABLE `pos_items` (
  `id`               int(11) NOT NULL AUTO_INCREMENT,
  `sale_id`          int(11) NOT NULL,
  `product_id`       int(11) NOT NULL,
  `quantity`         int(11) NOT NULL,
  `unit_price`       decimal(15,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `subtotal`         decimal(15,2) NOT NULL,
  `total`            decimal(15,2) NOT NULL,
  `source`           varchar(50) DEFAULT 'retail',
  PRIMARY KEY (`id`),
  KEY `idx_pos_items_sale` (`sale_id`),
  KEY `idx_pos_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 11. pos_returns — POS return/refund transactions
-- ------------------------------------------------------------
CREATE TABLE `pos_returns` (
  `id`            int(10) unsigned NOT NULL AUTO_INCREMENT,
  `return_number` varchar(50) NOT NULL,
  `sale_id`       int(10) unsigned NOT NULL,
  `customer_id`   int(10) unsigned DEFAULT NULL,
  `total_refund`  decimal(15,2) NOT NULL DEFAULT '0.00',
  `refund_method` varchar(20) DEFAULT 'original',
  `reason`        text,
  `processed_by`  int(10) unsigned NOT NULL,
  `status`        varchar(20) DEFAULT 'completed',
  `created_at`    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pos_returns_return_number_unique` (`return_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
