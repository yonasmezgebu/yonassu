SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8;


CREATE TABLE `printing_assets_machines` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine_id` varchar(30) NOT NULL COMMENT 'e.g. PSM-001',
  `machine_name` varchar(150) NOT NULL,
  `model_serial` varchar(150) DEFAULT NULL,
  `status` enum('In Store','Moved to Production','Under Maintenance') DEFAULT 'In Store',
  `registered_by` varchar(150) DEFAULT NULL COMMENT 'General Store Keeper name',
  `date_registered` date DEFAULT NULL,
  `internal_value` decimal(15,2) DEFAULT '0.00' COMMENT 'Set by Finance only',
  `condition_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `department` varchar(255) DEFAULT 'Printing',
  PRIMARY KEY (`id`),
  UNIQUE KEY `printing_store_machines_machine_id_unique` (`machine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
CREATE TABLE `printing_material_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_code` varchar(50) NOT NULL,
  `material_id` varchar(50) NOT NULL,
  `material_name` varchar(200) DEFAULT NULL,
  `quantity_requested` decimal(10,2) NOT NULL,
  `quantity_shipped` decimal(10,2) DEFAULT NULL,
  `quantity_received` decimal(10,2) DEFAULT NULL,
  `store_qty_at_request` decimal(10,2) DEFAULT NULL,
  `urgency` varchar(20) DEFAULT 'MEDIUM',
  `status` varchar(30) DEFAULT 'PENDING',
  `notes` text,
  `rejection_reason` text,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_by_name` varchar(200) DEFAULT NULL,
  `decided_by` int(10) unsigned DEFAULT NULL,
  `shipped_by` int(10) unsigned DEFAULT NULL,
  `received_by` int(10) unsigned DEFAULT NULL,
  `decided_at` timestamp NULL DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
CREATE TABLE `printing_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_type_id` int(11) NOT NULL,
  `product_type` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `paper_type` varchar(10) NOT NULL,
  `pages_per_copy` int(11) NOT NULL,
  `color_printing` tinyint(1) DEFAULT '0',
  `binding_type` varchar(20) DEFAULT 'None',
  `due_date` date NOT NULL,
  `special_instructions` text,
  `attachments` json DEFAULT NULL,
  `price_per_unit` decimal(15,2) NOT NULL,
  `binding_cost` decimal(15,2) DEFAULT '0.00',
  `total_price` decimal(15,2) NOT NULL,
  `status_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `payment_status` varchar(255) DEFAULT 'Pending',
  `payment_proof_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_orders_number` (`order_number`),
  KEY `idx_orders_customer` (`customer_id`),
  KEY `idx_orders_status` (`status_id`),
  KEY `idx_orders_due_date` (`due_date`),
  KEY `customer_type_id` (`customer_type_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
CREATE TABLE `printing_product_types` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `base_price_per_page` decimal(10,2) DEFAULT '0.50',
  `color_multiplier` decimal(5,2) DEFAULT '2.00',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `printing_product_types_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `printing_production_machines` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine_id` varchar(30) NOT NULL COMMENT 'Reference to printing_store_machines.machine_id',
  `status` enum('Active/Functional','Idle in Production','Returned to Store') DEFAULT 'Active/Functional',
  `moved_date` date DEFAULT NULL,
  `approved_by` varchar(150) DEFAULT NULL COMMENT 'Printing Supervisor who approved the move',
  `job_reference` varchar(100) DEFAULT NULL COMMENT 'Optional print job/order reference',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `printing_production_materials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `material_id` varchar(30) NOT NULL COMMENT 'Reference to printing_store_materials.material_id',
  `quantity_moved` decimal(15,3) DEFAULT '0.000',
  `quantity_consumed` decimal(15,3) DEFAULT '0.000',
  `quantity_remaining` decimal(15,3) DEFAULT '0.000',
  `moved_date` date DEFAULT NULL,
  `approved_by` varchar(150) DEFAULT NULL,
  `job_reference` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;