-- ============================================================
-- SUTANA EMS FULL DATABASE EXPORT
-- 331 tables + 0 external dependency tables
-- Generated: 2026-08-09T14:44:20.427Z
-- Safe to re-run (DROP TABLE IF EXISTS included)
-- Run each statement one at a time using the -- N. comment,
--   or run the whole file at once.
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8;

-- ------------------------------------------------------------
-- 001. access_certifications
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `access_certifications`;
CREATE TABLE `access_certifications` (
  `id` int(10) unsigned NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'in_progress',
  `owner_id` int(10) unsigned DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 002. admin_data_scopes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `admin_data_scopes`;
CREATE TABLE `admin_data_scopes` (
  `id` int(10) unsigned NOT NULL,
  `admin_id` int(10) unsigned DEFAULT NULL,
  `geographic` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `sensitivity_limit` varchar(10) DEFAULT NULL,
  `time_restriction` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 003. admin_elevations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `admin_elevations`;
CREATE TABLE `admin_elevations` (
  `id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `target_tier` varchar(10) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `reason` text,
  `ticket_ref` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `approved_by` int(10) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 004. admin_tiers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `admin_tiers`;
CREATE TABLE `admin_tiers` (
  `id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `tier` enum('L1','L2','L3','L4') NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 005. agrirent_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `agrirent_orders`;
CREATE TABLE `agrirent_orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(30) NOT NULL,
  `tractor_id` int(10) unsigned DEFAULT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `customer_name` varchar(120) NOT NULL,
  `customer_phone` varchar(30) NOT NULL,
  `customer_email` varchar(120) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(10) unsigned DEFAULT '1',
  `daily_rate` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `field_location` varchar(255) DEFAULT NULL,
  `field_size_hectares` decimal(8,2) DEFAULT NULL,
  `farming_purpose` varchar(100) DEFAULT NULL,
  `special_instructions` text,
  `payment_method` varchar(30) DEFAULT 'Telebirr',
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_status` enum('Pending','Confirmed','Rejected') DEFAULT 'Pending',
  `finance_notes` text,
  `verified_by` int(10) unsigned DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','approved','confirmed','active','completed','cancelled') DEFAULT 'pending',
  `is_manual` tinyint(1) DEFAULT '0',
  `created_by` int(10) unsigned DEFAULT NULL,
  `manager_note` text,
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `payment_screenshot` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agrirent_orders_order_number_unique` (`order_number`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 006. users
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) DEFAULT '0',
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `is_employee` tinyint(1) NOT NULL DEFAULT '0',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT '0',
  `lockout_until` timestamp NULL DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `chat_enabled` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_phone` (`phone`),
  KEY `idx_users_status` (`status_id`),
  KEY `idx_users_deleted_at` (`deleted_at`),
  KEY `department_id` (`department_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 007. branches
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `address` text,
  `phone` varchar(50) DEFAULT NULL,
  `working_hours` varchar(100) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `alternate_phone` varchar(50) DEFAULT NULL,
  `working_hours_monday_saturday` varchar(100) DEFAULT NULL,
  `working_hours_sunday` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(50) DEFAULT NULL,
  `delivery_support_phone` varchar(50) DEFAULT NULL,
  `latitude` decimal(10,2) DEFAULT NULL,
  `longitude` decimal(10,2) DEFAULT NULL,
  `display_order` int(11) DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_name_unique` (`name`),
  UNIQUE KEY `branches_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 008. announcements
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `created_by` int(11) NOT NULL,
  `target_audience` enum('All Branches','Specific Branch','Managers Only') NOT NULL DEFAULT 'All Branches',
  `target_branch_id` int(10) unsigned DEFAULT NULL,
  `published_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `announcements_created_by_foreign` (`created_by`),
  KEY `announcements_target_branch_id_foreign` (`target_branch_id`),
  CONSTRAINT `announcements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `announcements_target_branch_id_foreign` FOREIGN KEY (`target_branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 009. approvals
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `approvals`;
CREATE TABLE `approvals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `apr_no` varchar(30) NOT NULL,
  `requisition_id` int(11) NOT NULL,
  `req_no` varchar(30) NOT NULL,
  `drug_id` int(11) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `quantity_requested` int(11) NOT NULL,
  `quantity_approved` int(11) NOT NULL,
  `decision` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `rejection_reason` text,
  `approved_by` int(11) DEFAULT NULL,
  `approved_by_name` varchar(100) DEFAULT NULL,
  `stamp_id` varchar(100) DEFAULT NULL,
  `approved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `approvals_apr_no_unique` (`apr_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 010. attendance_records
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `action` varchar(20) NOT NULL,
  `status` varchar(30) DEFAULT 'Present',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(50) DEFAULT NULL,
  `work_date` date NOT NULL,
  `recorded_by` varchar(50) DEFAULT NULL,
  `computer_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 011. audit_logs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `resource_id` varchar(255) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `before_state` json DEFAULT NULL,
  `after_state` json DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text,
  `status` varchar(20) DEFAULT 'success',
  `error_message` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_resource` (`resource`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1283 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 012. audit_logs_archive
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs_archive`;
CREATE TABLE `audit_logs_archive` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `resource_id` varchar(255) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `before_state` json DEFAULT NULL,
  `after_state` json DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text,
  `status` varchar(20) DEFAULT 'success',
  `error_message` text,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 013. bank_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `bank_payments`;
CREATE TABLE `bank_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(255) NOT NULL,
  `reference` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(255) DEFAULT NULL,
  `bank_code` varchar(255) NOT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `description` text,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bank_payments_payment_id_unique` (`payment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 014. bids
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `bids`;
CREATE TABLE `bids` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tender_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned NOT NULL,
  `bid_price_per_unit` decimal(15,2) NOT NULL,
  `quantity_requested` int(11) NOT NULL,
  `total_bid_value` decimal(15,2) NOT NULL,
  `proposed_pickup_date` date DEFAULT NULL,
  `notes` text,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `evaluation_label` varchar(20) DEFAULT NULL,
  `evaluation_notes` text,
  `disqualification_reason` text,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `items` json DEFAULT NULL,
  `ceo_approval_status` varchar(255) DEFAULT 'pending',
  `bidder_full_name` varchar(255) DEFAULT NULL,
  `bidder_email` varchar(255) DEFAULT NULL,
  `bidder_phone` varchar(255) DEFAULT NULL,
  `opened_at` datetime DEFAULT NULL,
  `notification_sent` tinyint(1) DEFAULT '0',
  `digital_signature` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 015. boards
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `boards`;
CREATE TABLE `boards` (
  `board_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `board_name` varchar(100) NOT NULL,
  `role` varchar(50) DEFAULT 'Governance',
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`board_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 016. board_activities
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `board_activities`;
CREATE TABLE `board_activities` (
  `activity_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `board_id` int(10) unsigned NOT NULL,
  `activity_type` varchar(100) DEFAULT NULL,
  `details` text,
  `activity_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`activity_id`),
  KEY `board_activities_board_id_index` (`board_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 017. board_meetings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `board_meetings`;
CREATE TABLE `board_meetings` (
  `id` int(10) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `meeting_date` date NOT NULL,
  `meeting_time` time DEFAULT NULL,
  `venue` varchar(200) DEFAULT NULL,
  `status` enum('scheduled','in-progress','completed','cancelled') DEFAULT 'scheduled',
  `agenda` text,
  `minutes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 018. board_members
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `board_members`;
CREATE TABLE `board_members` (
  `member_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `board_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`),
  KEY `board_members_board_id_foreign` (`board_id`),
  CONSTRAINT `board_members_board_id_foreign` FOREIGN KEY (`board_id`) REFERENCES `boards` (`board_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 019. board_packs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `board_packs`;
CREATE TABLE `board_packs` (
  `id` int(10) unsigned NOT NULL,
  `meeting_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `status` enum('draft','final','distributed') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 020. board_resolutions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `board_resolutions`;
CREATE TABLE `board_resolutions` (
  `id` int(10) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `meeting_id` int(10) unsigned DEFAULT NULL,
  `resolution_date` date DEFAULT NULL,
  `status` enum('proposed','passed','rejected','implemented') DEFAULT 'proposed',
  `proposed_by` varchar(100) DEFAULT NULL,
  `outcome` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 021. break_glass_events
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `break_glass_events`;
CREATE TABLE `break_glass_events` (
  `id` int(10) unsigned NOT NULL,
  `activated_by` int(10) unsigned DEFAULT NULL,
  `reason` text,
  `co_approver_id` int(10) unsigned DEFAULT NULL,
  `activated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `deactivated_by` int(10) unsigned DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 022. budget_periods
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `budget_periods`;
CREATE TABLE `budget_periods` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `period_type` enum('monthly','quarterly','yearly','custom') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_budget` decimal(15,2) DEFAULT '0.00',
  `total_encumbered` decimal(15,2) DEFAULT '0.00',
  `total_spent` decimal(15,2) DEFAULT '0.00',
  `status` enum('draft','active','frozen','closed') DEFAULT 'draft',
  `created_by` int(10) unsigned DEFAULT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 023. expense_categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `expense_categories`;
CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `requires_approval` tinyint(1) DEFAULT '0',
  `approval_limit` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 024. chart_of_accounts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `chart_of_accounts`;
CREATE TABLE `chart_of_accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account_code` varchar(20) NOT NULL,
  `account_name` varchar(200) NOT NULL,
  `account_type` enum('asset','liability','equity','revenue','expense') NOT NULL,
  `account_class` varchar(50) DEFAULT NULL,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_control_account` tinyint(1) DEFAULT '0',
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chart_of_accounts_account_code_unique` (`account_code`),
  KEY `chart_of_accounts_parent_id_foreign` (`parent_id`),
  CONSTRAINT `chart_of_accounts_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 025. budget_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `budget_items`;
CREATE TABLE `budget_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `budget_period_id` int(10) unsigned NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `coa_id` int(10) unsigned DEFAULT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `encumbered_amount` decimal(15,2) DEFAULT '0.00',
  `spent_amount` decimal(15,2) DEFAULT '0.00',
  `remaining_amount` decimal(15,2) DEFAULT '0.00',
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `budget_items_budget_period_id_foreign` (`budget_period_id`),
  KEY `budget_items_category_id_foreign` (`category_id`),
  KEY `budget_items_coa_id_foreign` (`coa_id`),
  CONSTRAINT `budget_items_budget_period_id_foreign` FOREIGN KEY (`budget_period_id`) REFERENCES `budget_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `budget_items_coa_id_foreign` FOREIGN KEY (`coa_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 026. payment_methods
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payment_methods`;
CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `requires_reference` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 027. expenses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `date` date NOT NULL,
  `description` text NOT NULL,
  `receipt_path` varchar(255) DEFAULT NULL,
  `payment_method_id` int(11) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `entered_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `approval_tier` varchar(20) DEFAULT NULL,
  `payment_status` varchar(30) DEFAULT 'unpaid',
  `budget_id` int(10) unsigned DEFAULT NULL,
  `encumbered_amount` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(3) DEFAULT 'ETB',
  `exchange_rate` decimal(15,6) DEFAULT '1.000000',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `withholding_tax` decimal(15,2) DEFAULT '0.00',
  `vat_amount` decimal(15,2) DEFAULT '0.00',
  `net_amount` decimal(15,2) DEFAULT '0.00',
  `payment_processor_id` int(10) unsigned DEFAULT NULL,
  `payment_processed_at` timestamp NULL DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `po_id` int(10) unsigned DEFAULT NULL,
  `grn_id` int(10) unsigned DEFAULT NULL,
  `coa_id` int(10) unsigned DEFAULT NULL,
  `is_encumbered` tinyint(1) DEFAULT '0',
  `encumbered_at` timestamp NULL DEFAULT NULL,
  `de_encumbered_at` timestamp NULL DEFAULT NULL,
  `erca_declaration_ref` varchar(50) DEFAULT NULL,
  `tax_declared` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_expenses_category` (`category_id`),
  KEY `idx_expenses_date` (`date`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `entered_by` (`entered_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`),
  CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`entered_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 028. budget_encumbrances
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `budget_encumbrances`;
CREATE TABLE `budget_encumbrances` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `budget_item_id` int(10) unsigned NOT NULL,
  `expense_id` int(11) DEFAULT NULL,
  `purchase_order_id` int(10) unsigned DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('encumbered','disbursed','released','cancelled') DEFAULT 'encumbered',
  `encumbered_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disbursed_at` timestamp NULL DEFAULT NULL,
  `released_at` timestamp NULL DEFAULT NULL,
  `created_by` int(10) unsigned DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `budget_encumbrances_budget_item_id_foreign` (`budget_item_id`),
  KEY `budget_encumbrances_expense_id_foreign` (`expense_id`),
  CONSTRAINT `budget_encumbrances_budget_item_id_foreign` FOREIGN KEY (`budget_item_id`) REFERENCES `budget_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_encumbrances_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 029. cars
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cars`;
CREATE TABLE `cars` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `daily_rate` decimal(10,2) DEFAULT '0.00',
  `seats` int(11) DEFAULT '4',
  `transmission` varchar(50) DEFAULT 'Manual',
  `fuel_type` varchar(50) DEFAULT 'Petrol',
  `car_type` varchar(50) DEFAULT 'Sedan',
  `description` text,
  `availability` varchar(50) DEFAULT 'Available',
  `image1` varchar(255) DEFAULT NULL,
  `image2` varchar(255) DEFAULT NULL,
  `image3` varchar(255) DEFAULT NULL,
  `image4` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `asset_value` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 030. car_renting_fuel_service
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `car_renting_fuel_service`;
CREATE TABLE `car_renting_fuel_service` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(255) NOT NULL,
  `asset_type` varchar(255) NOT NULL,
  `asset_name` varchar(255) NOT NULL,
  `request_type` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `estimated_cost_cents` int(11) NOT NULL,
  `requested_date` varchar(255) NOT NULL,
  `status` enum('PENDING_CEO','PENDING_FINANCE','FINANCE_READY','PAYMENT_RELEASED','COMPLETED','REJECTED') DEFAULT 'PENDING_CEO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `priority` varchar(255) DEFAULT 'Normal',
  `driver_name` varchar(255) DEFAULT NULL,
  `reported_by` varchar(255) DEFAULT NULL,
  `current_mileage` int(11) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 031. car_renting_maintenance
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `car_renting_maintenance`;
CREATE TABLE `car_renting_maintenance` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(255) NOT NULL,
  `asset_type` varchar(255) NOT NULL,
  `asset_name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `estimated_cost_cents` int(11) NOT NULL,
  `scheduled_date` varchar(255) NOT NULL,
  `status` enum('PENDING_CEO','PENDING_FINANCE','FINANCE_READY','FINANCE_APPROVED','PAYMENT_RELEASED','COMPLETED','REJECTED') DEFAULT 'PENDING_CEO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `priority` varchar(255) DEFAULT 'Normal',
  `mechanic_name` varchar(255) DEFAULT NULL,
  `mechanic_phone` varchar(255) DEFAULT NULL,
  `reported_by` varchar(255) DEFAULT NULL,
  `images` longtext,
  `notes` text,
  `location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 032. car_renting_store_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `car_renting_store_requests`;
CREATE TABLE `car_renting_store_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(50) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `store_handler` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `status` enum('PENDING_STORE','FORWARDED_TO_CEO','APPROVED','REJECTED','SHIPPED','RECEIVED') DEFAULT 'PENDING_STORE',
  `rejection_reason` text,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `department` varchar(50) DEFAULT 'Car Rental',
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_number` (`request_number`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 033. car_renting_store_request_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `car_renting_store_request_items`;
CREATE TABLE `car_renting_store_request_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `quantity_requested` int(11) NOT NULL,
  `quantity_shipped` int(11) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `car_renting_store_request_items_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `car_renting_store_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 034. certification_reviews
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `certification_reviews`;
CREATE TABLE `certification_reviews` (
  `id` int(10) unsigned NOT NULL,
  `certification_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(20) DEFAULT NULL,
  `notes` text,
  `reviewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 035. communication_logs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `communication_logs`;
CREATE TABLE `communication_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` varchar(10) NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `content` text NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `provider_response` text,
  `retry_count` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `sent_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_logs_type` (`type`),
  KEY `idx_logs_status` (`status`),
  KEY `idx_logs_created` (`created_at`),
  KEY `idx_logs_recipient` (`recipient`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 036. compliance_evidence
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `compliance_evidence`;
CREATE TABLE `compliance_evidence` (
  `id` int(10) unsigned NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ready',
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 037. compliance_status
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `compliance_status`;
CREATE TABLE `compliance_status` (
  `id` int(10) unsigned NOT NULL,
  `requirement` varchar(200) NOT NULL,
  `regulation` varchar(100) DEFAULT NULL,
  `status` enum('compliant','non-compliant','in-progress','not-applicable') DEFAULT 'in-progress',
  `last_review_date` date DEFAULT NULL,
  `next_review_date` date DEFAULT NULL,
  `responsible_owner` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 038. composite_roles
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `composite_roles`;
CREATE TABLE `composite_roles` (
  `id` int(10) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 039. composite_role_mappings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `composite_role_mappings`;
CREATE TABLE `composite_role_mappings` (
  `id` int(10) unsigned NOT NULL,
  `composite_role_id` int(10) unsigned DEFAULT NULL,
  `single_role_id` int(10) unsigned DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 040. contact_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE `contact_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `department` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `attachment` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'unread',
  `assigned_to` int(10) unsigned DEFAULT NULL,
  `admin_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  `replied_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_contact_department` (`department`),
  KEY `idx_contact_status` (`status`),
  KEY `idx_contact_assigned` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 041. contracts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `contracts`;
CREATE TABLE `contracts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contract_number` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `supplier_id` int(10) unsigned NOT NULL,
  `type` enum('quantity','value','service','framework') NOT NULL DEFAULT 'quantity',
  `total_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `consumed_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `start_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` enum('draft','active','full','expired','cancelled') NOT NULL DEFAULT 'draft',
  `notes` text,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contracts_contract_number_unique` (`contract_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 042. crisis_actions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `crisis_actions`;
CREATE TABLE `crisis_actions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `priority` enum('critical','high','medium','low') DEFAULT 'high',
  `status` enum('pending','in-progress','completed') DEFAULT 'pending',
  `assigned_to` varchar(100) DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 043. crisis_fast_track
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `crisis_fast_track`;
CREATE TABLE `crisis_fast_track` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_title` varchar(200) NOT NULL,
  `description` text,
  `amount` decimal(14,2) DEFAULT NULL,
  `requested_by` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` varchar(100) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 044. crisis_status
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `crisis_status`;
CREATE TABLE `crisis_status` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `is_active` tinyint(1) DEFAULT '0',
  `activated_at` timestamp NULL DEFAULT NULL,
  `activated_by` varchar(100) DEFAULT NULL,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 045. customer_types
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `customer_types`;
CREATE TABLE `customer_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `color_code` varchar(7) NOT NULL DEFAULT '#6B7280',
  `icon_name` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 046. customers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `customer_type_id` int(11) NOT NULL,
  `address` text,
  `tax_id` varchar(50) DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `customer_group` varchar(50) DEFAULT 'Retail',
  `loyalty_tier_id` int(10) unsigned DEFAULT NULL,
  `total_lifetime_value` decimal(15,2) DEFAULT '0.00',
  `last_purchase_date` date DEFAULT NULL,
  `preferred_communication` varchar(20) DEFAULT 'SMS',
  `tags` text,
  `total_visits` int(11) DEFAULT '0',
  `preferred_language` varchar(10) DEFAULT 'en',
  `password_hash` varchar(255) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_customers_phone` (`phone`),
  KEY `idx_customers_type` (`customer_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`customer_type_id`) REFERENCES `customer_types` (`id`),
  CONSTRAINT `customers_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_customer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 047. customer_notifications
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `customer_notifications`;
CREATE TABLE `customer_notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `link_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_customer` (`customer_id`),
  KEY `idx_notifications_read` (`is_read`),
  CONSTRAINT `customer_notifications_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 048. customer_quotes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `customer_quotes`;
CREATE TABLE `customer_quotes` (
  `id` varchar(255) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_type` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `paper_type` varchar(50) NOT NULL,
  `pages_per_copy` int(11) NOT NULL,
  `color_printing` tinyint(1) NOT NULL DEFAULT '0',
  `binding_type` varchar(50) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `breakdown_json` text,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 049. delegated_assignments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `delegated_assignments`;
CREATE TABLE `delegated_assignments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `node_id` int(10) unsigned DEFAULT NULL,
  `admin_id` int(10) unsigned DEFAULT NULL,
  `capability` varchar(20) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 050. delegated_nodes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `delegated_nodes`;
CREATE TABLE `delegated_nodes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `type` enum('global','region','department') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 051. tenders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tenders`;
CREATE TABLE `tenders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reference_number` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `item_ids` json DEFAULT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `starting_bid_price` decimal(15,2) NOT NULL,
  `deadline` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `terms_conditions` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `created_by` int(10) unsigned DEFAULT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `awarded_bid_id` int(10) unsigned DEFAULT NULL,
  `sales_order_id` int(10) unsigned DEFAULT NULL,
  `cancellation_reason` text,
  `category` varchar(100) DEFAULT NULL,
  `attachments` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_new_drug` tinyint(1) DEFAULT '0',
  `is_hidden` tinyint(1) DEFAULT '0',
  `deadline_notified` tinyint(1) DEFAULT '0',
  `items` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenders_reference_number_unique` (`reference_number`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 052. deliveries
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `deliveries`;
CREATE TABLE `deliveries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tender_id` int(10) unsigned NOT NULL,
  `delivery_type` enum('VIA_STORE','DIRECT_TO_PHARMACY') NOT NULL,
  `received_by` int(10) unsigned DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `status` enum('PENDING','RECEIVED','ISSUE_REPORTED') DEFAULT 'PENDING',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `deliveries_tender_id_foreign` (`tender_id`),
  CONSTRAINT `deliveries_tender_id_foreign` FOREIGN KEY (`tender_id`) REFERENCES `tenders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 053. departments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 054. shareholders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `shareholders`;
CREATE TABLE `shareholders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `share_percentage` decimal(5,2) DEFAULT '0.00',
  `shares_count` int(11) DEFAULT '0',
  `share_type` enum('ordinary','preferred','founder') DEFAULT 'ordinary',
  `status` enum('active','inactive') DEFAULT 'active',
  `joined_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 055. dividends
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `dividends`;
CREATE TABLE `dividends` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `shareholder_id` int(10) unsigned DEFAULT NULL,
  `period` varchar(50) NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `per_share` decimal(10,2) DEFAULT NULL,
  `declaration_date` date DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `status` enum('declared','paid','cancelled') DEFAULT 'declared',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `dividends_shareholder_id_foreign` (`shareholder_id`),
  CONSTRAINT `dividends_shareholder_id_foreign` FOREIGN KEY (`shareholder_id`) REFERENCES `shareholders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 056. drugs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `drugs`;
CREATE TABLE `drugs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `strength` varchar(255) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(255) DEFAULT NULL,
  `classification` varchar(255) DEFAULT NULL,
  `therapeutic_use` text,
  `status` enum('PENDING','ACTIVE','REJECTED') DEFAULT 'ACTIVE',
  `requires_prescription` tinyint(1) DEFAULT '0',
  `vat_rate` decimal(5,2) DEFAULT '15.00',
  `drug_image` varchar(500) DEFAULT NULL,
  `drug_code` varchar(50) DEFAULT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `brand_name` varchar(150) DEFAULT NULL,
  `dosage_form` varchar(50) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `manufacturer_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 057. drug_categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `drug_categories`;
CREATE TABLE `drug_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `drug_categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 058. dr_tests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `dr_tests`;
CREATE TABLE `dr_tests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(20) DEFAULT 'in_progress',
  `notes` text,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 059. employees
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `employee_id` varchar(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `position` varchar(80) DEFAULT NULL,
  `department` enum('Printing','Pharmacy','Car Rental','Farming','Retail','Admin','IT','Finance') NOT NULL,
  `join_date` date DEFAULT NULL,
  `base_salary` decimal(12,2) DEFAULT '0.00',
  `allowance` decimal(12,2) DEFAULT '0.00',
  `standing_deduction` decimal(12,2) DEFAULT '0.00',
  `payment_method` enum('Cash','Bank Transfer','Telebirr') DEFAULT 'Bank Transfer',
  `bank_account` varchar(30) DEFAULT NULL,
  `work_type` enum('Office','Field') DEFAULT 'Office',
  `status` enum('Active','Inactive','On Leave') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password_hash` varchar(255) NOT NULL DEFAULT '',
  `check_in_time` time NOT NULL DEFAULT '08:30:00',
  `check_out_time` time NOT NULL DEFAULT '17:30:00',
  `lunch_break_minutes` int(11) DEFAULT '60',
  `work_days_per_month` int(11) DEFAULT '22',
  `document_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 060. erp_customers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_customers`;
CREATE TABLE `erp_customers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 061. erp_equity_transactions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_equity_transactions`;
CREATE TABLE `erp_equity_transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `owner_name` varchar(255) NOT NULL,
  `transaction_type` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 062. erp_liabilities
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_liabilities`;
CREATE TABLE `erp_liabilities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(255) NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `description` text,
  `amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `status` varchar(255) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 063. erp_liabilities_v3
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_liabilities_v3`;
CREATE TABLE `erp_liabilities_v3` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` int(10) unsigned DEFAULT NULL,
  `liability_type` varchar(255) DEFAULT 'ACCOUNTS_PAYABLE',
  `invoice_number` varchar(255) NOT NULL,
  `description` text,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `invoice_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 064. erp_suppliers_v4
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_suppliers_v4`;
CREATE TABLE `erp_suppliers_v4` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 065. erp_liabilities_v4
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_liabilities_v4`;
CREATE TABLE `erp_liabilities_v4` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_type` varchar(255) NOT NULL,
  `reference_no` varchar(255) NOT NULL,
  `party_id` int(10) unsigned DEFAULT NULL,
  `party_name` varchar(255) DEFAULT NULL,
  `description` text,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `issue_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `erp_liabilities_v4_party_id_foreign` (`party_id`),
  CONSTRAINT `erp_liabilities_v4_party_id_foreign` FOREIGN KEY (`party_id`) REFERENCES `erp_suppliers_v4` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 066. erp_loan_details_v4
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_loan_details_v4`;
CREATE TABLE `erp_loan_details_v4` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned NOT NULL,
  `lender_name` varchar(255) DEFAULT NULL,
  `interest_rate` varchar(255) DEFAULT NULL,
  `term_months` int(11) DEFAULT NULL,
  `principal_amount` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `erp_loan_details_v4_liability_id_foreign` (`liability_id`),
  CONSTRAINT `erp_loan_details_v4_liability_id_foreign` FOREIGN KEY (`liability_id`) REFERENCES `erp_liabilities_v4` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 067. erp_owners
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_owners`;
CREATE TABLE `erp_owners` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `owner_name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ownership_percentage` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 068. erp_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_payments`;
CREATE TABLE `erp_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 069. erp_payments_v3
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_payments_v3`;
CREATE TABLE `erp_payments_v3` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(255) NOT NULL DEFAULT 'Cash',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 070. erp_payments_v4
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_payments_v4`;
CREATE TABLE `erp_payments_v4` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned NOT NULL,
  `payment_date` date DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `erp_payments_v4_liability_id_foreign` (`liability_id`),
  CONSTRAINT `erp_payments_v4_liability_id_foreign` FOREIGN KEY (`liability_id`) REFERENCES `erp_liabilities_v4` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 071. erp_receivables
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_receivables`;
CREATE TABLE `erp_receivables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `description` text,
  `amount` decimal(15,2) NOT NULL,
  `received_amount` decimal(15,2) DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `status` varchar(255) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 072. erp_receivable_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_receivable_payments`;
CREATE TABLE `erp_receivable_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `receivable_id` int(10) unsigned NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `erp_receivable_payments_receivable_id_foreign` (`receivable_id`),
  CONSTRAINT `erp_receivable_payments_receivable_id_foreign` FOREIGN KEY (`receivable_id`) REFERENCES `erp_receivables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 073. erp_suppliers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_suppliers`;
CREATE TABLE `erp_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 074. erp_suppliers_v3
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_suppliers_v3`;
CREATE TABLE `erp_suppliers_v3` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 075. erp_tax_details_v4
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `erp_tax_details_v4`;
CREATE TABLE `erp_tax_details_v4` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned NOT NULL,
  `tax_type` varchar(255) DEFAULT NULL,
  `tax_period` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `erp_tax_details_v4_liability_id_foreign` (`liability_id`),
  CONSTRAINT `erp_tax_details_v4_liability_id_foreign` FOREIGN KEY (`liability_id`) REFERENCES `erp_liabilities_v4` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 076. hr_employees
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_employees`;
CREATE TABLE `hr_employees` (
  `employee_id` varchar(20) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `national_id` varchar(50) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `marital_status` varchar(20) DEFAULT NULL,
  `profile_photo_path` varchar(255) DEFAULT NULL,
  `personal_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_name` varchar(150) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `personal_email` varchar(100) DEFAULT NULL,
  `physical_address` text,
  `dept_id` varchar(20) DEFAULT NULL,
  `unit_id` varchar(20) DEFAULT NULL,
  `position_id` varchar(20) DEFAULT NULL,
  `direct_manager_id` varchar(20) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `contract_end_date` date DEFAULT NULL,
  `employment_type` varchar(20) DEFAULT 'Permanent',
  `probation_end_date` date DEFAULT NULL,
  `base_salary` decimal(12,2) DEFAULT '0.00',
  `housing_allowance` decimal(12,2) DEFAULT '0.00',
  `transport_allowance` decimal(12,2) DEFAULT '0.00',
  `communication_allowance` decimal(12,2) DEFAULT '0.00',
  `overtime_rate` decimal(5,2) DEFAULT '1.50',
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `employment_status` varchar(20) DEFAULT 'Active',
  `registration_status` varchar(255) NOT NULL DEFAULT 'pending_approval',
  `rejection_reason` text,
  `termination_date` date DEFAULT NULL,
  `termination_reason` text,
  `rehire_eligible` varchar(3) DEFAULT 'Yes',
  `created_by` varchar(50) DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_modified_by` varchar(50) DEFAULT NULL,
  `last_modified_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `has_pc_access` varchar(3) DEFAULT 'No',
  `shift_start_time` time DEFAULT NULL,
  `shift_end_time` time DEFAULT NULL,
  `weekly_off_days` varchar(50) DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `last_web_active` timestamp NULL DEFAULT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `education_level` varchar(50) DEFAULT NULL,
  `institution_name` varchar(150) DEFAULT NULL,
  `field_of_study` varchar(100) DEFAULT NULL,
  `graduation_year` varchar(10) DEFAULT NULL,
  `id_photo_front` varchar(255) DEFAULT NULL,
  `id_photo_back` varchar(255) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'Bank Transfer',
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `bank_account_number` (`bank_account_number`),
  KEY `hr_employees_dept_id_foreign` (`dept_id`),
  KEY `hr_employees_unit_id_foreign` (`unit_id`),
  KEY `hr_employees_position_id_foreign` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 077. etp_agent_installations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `etp_agent_installations`;
CREATE TABLE `etp_agent_installations` (
  `agent_id` varchar(20) NOT NULL,
  `employee_id` varchar(20) DEFAULT NULL,
  `pc_name` varchar(100) DEFAULT NULL,
  `mac_address` varchar(50) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `last_heartbeat` datetime DEFAULT NULL,
  `agent_version` varchar(20) DEFAULT '1.0.0',
  `installation_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'Active',
  PRIMARY KEY (`agent_id`),
  KEY `etp_agent_installations_employee_id_foreign` (`employee_id`),
  CONSTRAINT `etp_agent_installations_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 078. etp_daily_attendance
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `etp_daily_attendance`;
CREATE TABLE `etp_daily_attendance` (
  `record_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `attendance_date` date DEFAULT NULL,
  `week_number` int(11) DEFAULT NULL,
  `month_number` int(11) DEFAULT NULL,
  `year_number` int(11) DEFAULT NULL,
  `actual_start_time` time DEFAULT NULL,
  `actual_end_time` time DEFAULT NULL,
  `net_work_hours` decimal(6,2) DEFAULT '0.00',
  `scheduled_hours` decimal(6,2) DEFAULT '8.00',
  `late_minutes` int(11) DEFAULT '0',
  `early_leave_minutes` int(11) DEFAULT '0',
  `overtime_hours` decimal(6,2) DEFAULT '0.00',
  `absent_days` int(11) DEFAULT '0',
  `attendance_status` varchar(20) DEFAULT 'Not Recorded',
  `is_manual_override` varchar(3) DEFAULT 'No',
  `override_reason` text,
  `calculated_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`),
  UNIQUE KEY `idx_unique_attendance` (`employee_id`,`attendance_date`),
  CONSTRAINT `etp_daily_attendance_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 079. etp_heartbeat_logs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `etp_heartbeat_logs`;
CREATE TABLE `etp_heartbeat_logs` (
  `heartbeat_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `heartbeat_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'Online',
  `active_minutes` int(11) DEFAULT '0',
  `idle_minutes` int(11) DEFAULT '0',
  PRIMARY KEY (`heartbeat_id`),
  KEY `idx_hb_emp_time` (`employee_id`,`heartbeat_time`),
  CONSTRAINT `etp_heartbeat_logs_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 080. etp_monthly_summary
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `etp_monthly_summary`;
CREATE TABLE `etp_monthly_summary` (
  `summary_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `month_number` int(11) DEFAULT NULL,
  `year_number` int(11) DEFAULT NULL,
  `total_worked_hours` decimal(8,2) DEFAULT '0.00',
  `total_late_minutes` int(11) DEFAULT '0',
  `total_absent_days` int(11) DEFAULT '0',
  `total_overtime_hours` decimal(6,2) DEFAULT '0.00',
  `attendance_rate` decimal(5,2) DEFAULT '0.00',
  `punctuality_rate` decimal(5,2) DEFAULT '0.00',
  `calculated_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`summary_id`),
  UNIQUE KEY `idx_unique_monthly` (`employee_id`,`month_number`,`year_number`),
  CONSTRAINT `etp_monthly_summary_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 081. etp_session_logs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `etp_session_logs`;
CREATE TABLE `etp_session_logs` (
  `session_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `log_date` date DEFAULT NULL,
  `pc_login_time` datetime DEFAULT NULL,
  `pc_logout_time` datetime DEFAULT NULL,
  `total_idle_seconds` int(11) DEFAULT '0',
  `total_active_seconds` int(11) DEFAULT '0',
  `source_type` varchar(20) DEFAULT 'PC_AGENT',
  `is_override` varchar(3) DEFAULT 'No',
  `override_reason` text,
  `entry_by` varchar(50) DEFAULT NULL,
  `entry_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `etp_session_logs_employee_id_foreign` (`employee_id`),
  CONSTRAINT `etp_session_logs_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 082. etp_weekly_summary
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `etp_weekly_summary`;
CREATE TABLE `etp_weekly_summary` (
  `summary_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `week_number` int(11) DEFAULT NULL,
  `month_number` int(11) DEFAULT NULL,
  `year_number` int(11) DEFAULT NULL,
  `week_start_date` date DEFAULT NULL,
  `week_end_date` date DEFAULT NULL,
  `total_worked_hours` decimal(6,2) DEFAULT '0.00',
  `total_late_minutes` int(11) DEFAULT '0',
  `total_absent_days` int(11) DEFAULT '0',
  `total_overtime_hours` decimal(6,2) DEFAULT '0.00',
  `calculated_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`summary_id`),
  UNIQUE KEY `idx_unique_weekly` (`employee_id`,`week_number`,`year_number`),
  CONSTRAINT `etp_weekly_summary_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 083. expense_approval_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `expense_approval_requests`;
CREATE TABLE `expense_approval_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) NOT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `tier` enum('manager','director','ceo') NOT NULL,
  `status` enum('pending','approved','rejected','escalated','skipped') DEFAULT 'pending',
  `comments` text,
  `actioned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_approval_requests_expense_id_foreign` (`expense_id`),
  KEY `expense_approval_requests_approver_id_foreign` (`approver_id`),
  CONSTRAINT `expense_approval_requests_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expense_approval_requests_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 084. expense_approvers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `expense_approvers`;
CREATE TABLE `expense_approvers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `approval_tier` enum('manager','director','ceo') NOT NULL,
  `min_amount` decimal(15,2) DEFAULT '0.00',
  `max_amount` decimal(15,2) DEFAULT '999999999.99',
  `is_active` tinyint(1) DEFAULT '1',
  `priority` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_approvers_user_id_foreign` (`user_id`),
  CONSTRAINT `expense_approvers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 085. expense_audit_trail
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `expense_audit_trail`;
CREATE TABLE `expense_audit_trail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `actor_id` int(11) DEFAULT NULL,
  `actor_name` varchar(100) DEFAULT NULL,
  `old_values` text,
  `new_values` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_audit_trail_expense_id_foreign` (`expense_id`),
  CONSTRAINT `expense_audit_trail_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 086. expense_taxes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `expense_taxes`;
CREATE TABLE `expense_taxes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) NOT NULL,
  `tax_type` varchar(30) NOT NULL,
  `taxable_amount` decimal(15,2) NOT NULL,
  `tax_rate` decimal(5,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `erca_reference` varchar(50) DEFAULT NULL,
  `declared` tinyint(1) DEFAULT '0',
  `declared_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_taxes_expense_id_foreign` (`expense_id`),
  CONSTRAINT `expense_taxes_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 087. farming_store_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `farming_store_requests`;
CREATE TABLE `farming_store_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(50) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `store_handler` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `status` enum('PENDING_STORE','FORWARDED_TO_CEO','APPROVED','REJECTED','SHIPPED','RECEIVED') DEFAULT 'FORWARDED_TO_CEO',
  `rejection_reason` text,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_number` (`request_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 088. farming_store_request_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `farming_store_request_items`;
CREATE TABLE `farming_store_request_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `quantity_requested` int(11) NOT NULL,
  `quantity_shipped` int(11) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `farming_store_request_items_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `farming_store_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 089. field_security
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `field_security`;
CREATE TABLE `field_security` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `module` varchar(255) DEFAULT NULL,
  `field_name` varchar(255) DEFAULT NULL,
  `sensitivity` varchar(10) DEFAULT 'L0',
  `mask_rule` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 090. finance_accounts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_accounts`;
CREATE TABLE `finance_accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account_name` varchar(255) NOT NULL,
  `account_type` varchar(255) NOT NULL,
  `bank_provider` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `currency` varchar(255) NOT NULL DEFAULT 'ETB',
  `opening_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `opening_balance_date` date NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Active',
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 091. finance_cashbook
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_cashbook`;
CREATE TABLE `finance_cashbook` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `type` varchar(255) NOT NULL,
  `reference` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `receipts` decimal(15,2) DEFAULT '0.00',
  `payments` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 092. finance_crvs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_crvs`;
CREATE TABLE `finance_crvs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `crv_number` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `received_from` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_holder` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `cheque_no` varchar(255) DEFAULT NULL,
  `telebirr_number` varchar(255) DEFAULT NULL,
  `telebirr_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `prepared_by` varchar(255) DEFAULT NULL,
  `checked_by` varchar(255) DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `prepared_signature` longtext,
  `checked_signature` longtext,
  `receiver_signature` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_crvs_crv_number_unique` (`crv_number`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 093. pos_sales
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pos_sales`;
CREATE TABLE `pos_sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(100) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `discount_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `amount_paid` decimal(15,2) NOT NULL,
  `change_amount` decimal(15,2) DEFAULT '0.00',
  `cashier_id` int(11) NOT NULL,
  `sale_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status_id` int(11) NOT NULL,
  `voided_by` int(11) DEFAULT NULL,
  `void_reason` text,
  `deleted_at` datetime DEFAULT NULL,
  `notes` text,
  `sale_type` enum('walk_in','online') DEFAULT 'walk_in',
  `order_source` varchar(255) DEFAULT NULL,
  `order_id` int(10) unsigned DEFAULT NULL,
  `manager_approved` tinyint(1) DEFAULT '1',
  `manager_approved_by` int(10) unsigned DEFAULT NULL,
  `manager_approved_at` timestamp NULL DEFAULT NULL,
  `manager_flag_reason` text,
  `is_submitted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_pos_invoice` (`invoice_number`),
  KEY `idx_pos_customer` (`customer_id`),
  KEY `idx_pos_date` (`sale_date`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `status_id` (`status_id`),
  KEY `cashier_id` (`cashier_id`),
  KEY `voided_by` (`voided_by`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 094. finance_customer_credit
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_customer_credit`;
CREATE TABLE `finance_customer_credit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `original_amount` decimal(12,2) NOT NULL,
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  `balance` decimal(12,2) GENERATED ALWAYS AS ((`original_amount` - `paid_amount`)) STORED,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `status` enum('OUTSTANDING','PAID','OVERDUE','WRITTEN_OFF') DEFAULT 'OUTSTANDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `finance_customer_credit_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `finance_customer_credit_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `pos_sales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 095. finance_departments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_departments`;
CREATE TABLE `finance_departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 096. finance_expense_categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_expense_categories`;
CREATE TABLE `finance_expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 097. finance_expenses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_expenses`;
CREATE TABLE `finance_expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_number` varchar(30) NOT NULL,
  `category_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `expense_date` date NOT NULL,
  `description` text NOT NULL,
  `notes` text,
  `status` enum('DRAFT','PENDING_CEO_APPROVAL','APPROVED','REJECTED','NEEDS_INFO','PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `submitted_by` int(11) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` text,
  `rejection_reason` text,
  `paid_by` int(11) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `payment_method_id` int(11) DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `receipt_path` varchar(500) DEFAULT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancel_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
-- 098. finance_expense_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_expense_payments`;
CREATE TABLE `finance_expense_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `paid_by` int(11) NOT NULL,
  `paid_at` datetime NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `paid_by` (`paid_by`),
  CONSTRAINT `finance_expense_payments_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `finance_expenses` (`id`),
  CONSTRAINT `finance_expense_payments_ibfk_2` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 099. finance_expense_seq
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_expense_seq`;
CREATE TABLE `finance_expense_seq` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seq_date` date NOT NULL,
  `counter` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_seq_date` (`seq_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 100. finance_income_submissions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_income_submissions`;
CREATE TABLE `finance_income_submissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `department` varchar(255) NOT NULL,
  `submitted_by` varchar(255) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `currency` varchar(255) DEFAULT 'ETB',
  `reference_no` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `manual_details` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 101. finance_notifications
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_notifications`;
CREATE TABLE `finance_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) NOT NULL,
  `type` enum('PENDING_APPROVAL','APPROVED','REJECTED','NEEDS_INFO','PAID','CANCELLED') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_by` int(11) DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `read_by` (`read_by`),
  CONSTRAINT `finance_notifications_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `finance_expenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `finance_notifications_ibfk_2` FOREIGN KEY (`read_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 102. finance_payables
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_payables`;
CREATE TABLE `finance_payables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pv_number` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `paid_to` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `amount_paid` decimal(14,2) DEFAULT '0.00',
  `outstanding_balance` decimal(14,2) DEFAULT '0.00',
  `payment_method` varchar(255) NOT NULL DEFAULT 'Cash',
  `description` varchar(255) DEFAULT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Paid',
  `due_date` date DEFAULT NULL,
  `bank_details` text,
  `telebirr_details` text,
  `prepared_by` text,
  `checked_by` text,
  `payee_name` text,
  `prepared_signature` text,
  `checked_signature` text,
  `payee_signature` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_payables_pv_number_unique` (`pv_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 103. finance_pcvs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_pcvs`;
CREATE TABLE `finance_pcvs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pcv_number` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `paid_to` varchar(255) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL DEFAULT 'Cash',
  `description` varchar(255) NOT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `prepared_by` varchar(255) DEFAULT NULL,
  `checked_by` varchar(255) DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `prepared_signature` longtext,
  `checked_signature` longtext,
  `receiver_signature` longtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_holder` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `cheque_no` varchar(255) DEFAULT NULL,
  `telebirr_number` varchar(255) DEFAULT NULL,
  `telebirr_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending_ceo',
  `reject_reason` text,
  `ceo_read` tinyint(1) NOT NULL DEFAULT '0',
  `finance_read` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_pcvs_pcv_number_unique` (`pcv_number`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 104. finance_pvs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_pvs`;
CREATE TABLE `finance_pvs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pv_number` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `paid_to` varchar(255) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_holder` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `cheque_no` varchar(255) DEFAULT NULL,
  `telebirr_number` varchar(255) DEFAULT NULL,
  `telebirr_name` varchar(255) DEFAULT NULL,
  `prepared_by` varchar(255) DEFAULT NULL,
  `checked_by` varchar(255) DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `prepared_signature` longtext,
  `checked_signature` longtext,
  `receiver_signature` longtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_pvs_pv_number_unique` (`pv_number`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 105. finance_receivables
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_receivables`;
CREATE TABLE `finance_receivables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `invoice_no` varchar(255) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `amount_paid` decimal(14,2) DEFAULT '0.00',
  `outstanding_balance` decimal(14,2) DEFAULT '0.00',
  `status` varchar(255) DEFAULT 'Unpaid',
  `department_source` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `manual_details` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 106. finance_reconciliations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_reconciliations`;
CREATE TABLE `finance_reconciliations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reconciliation_no` varchar(255) NOT NULL,
  `account_id` int(10) unsigned DEFAULT NULL,
  `period_from` date NOT NULL,
  `period_to` date NOT NULL,
  `erp_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `actual_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `difference` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` varchar(255) NOT NULL DEFAULT 'Draft',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finance_reconciliations_reconciliation_no_unique` (`reconciliation_no`),
  KEY `finance_reconciliations_account_id_foreign` (`account_id`),
  CONSTRAINT `finance_reconciliations_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `finance_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 107. finance_recon_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `finance_recon_items`;
CREATE TABLE `finance_recon_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reconciliation_id` int(10) unsigned DEFAULT NULL,
  `transaction_date` date DEFAULT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `transaction_type` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `erp_amount` decimal(15,2) DEFAULT '0.00',
  `actual_amount` decimal(15,2) DEFAULT '0.00',
  `difference` decimal(15,2) DEFAULT '0.00',
  `match_status` varchar(255) DEFAULT 'Unmatched',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `finance_recon_items_reconciliation_id_foreign` (`reconciliation_id`),
  CONSTRAINT `finance_recon_items_reconciliation_id_foreign` FOREIGN KEY (`reconciliation_id`) REFERENCES `finance_reconciliations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 108. fund_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `fund_requests`;
CREATE TABLE `fund_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fund_request_code` varchar(255) NOT NULL,
  `created_by` int(10) unsigned NOT NULL,
  `status` enum('PENDING_APPROVAL','APPROVED','REJECTED','READY_FOR_PAYMENT') DEFAULT 'PENDING_APPROVAL',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `decided_by` int(10) unsigned DEFAULT NULL,
  `decision_reason` text,
  `decided_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_new_drug` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `fund_requests_fund_request_code_unique` (`fund_request_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 109. fund_request_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `fund_request_items`;
CREATE TABLE `fund_request_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fund_request_id` int(10) unsigned NOT NULL,
  `tender_id` int(10) unsigned NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fund_request_items_fund_request_id_foreign` (`fund_request_id`),
  KEY `fund_request_items_tender_id_foreign` (`tender_id`),
  KEY `fund_request_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `fund_request_items_fund_request_id_foreign` FOREIGN KEY (`fund_request_id`) REFERENCES `fund_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fund_request_items_tender_id_foreign` FOREIGN KEY (`tender_id`) REFERENCES `tenders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 110. gallery_images
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `gallery_images`;
CREATE TABLE `gallery_images` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_path` varchar(255) NOT NULL,
  `thumbnail_path` varchar(255) DEFAULT NULL,
  `date_taken` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT '0',
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 111. general_movement_log
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `general_movement_log`;
CREATE TABLE `general_movement_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `item_type` enum('Machine','Material') NOT NULL,
  `item_id` varchar(30) NOT NULL,
  `from_location` varchar(100) DEFAULT 'Printing Store',
  `to_location` varchar(100) DEFAULT 'Printing Production',
  `quantity` decimal(15,3) DEFAULT '0.000' COMMENT 'For materials only',
  `moved_by` varchar(150) DEFAULT NULL COMMENT 'General Store Keeper who released the item',
  `approved_by` varchar(150) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `action_type` varchar(50) DEFAULT 'Move to Production',
  `date_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `department` varchar(255) DEFAULT 'General',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 112. general_store_materials
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `general_store_materials`;
CREATE TABLE `general_store_materials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `material_id` varchar(30) NOT NULL COMMENT 'e.g. PSMAT-001',
  `material_name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT 'Other',
  `unit` varchar(50) DEFAULT 'unit' COMMENT 'Roll, box, liter, kg, ream, etc.',
  `quantity_in_store` decimal(15,3) DEFAULT '0.000',
  `unit_value` decimal(15,2) DEFAULT '0.00' COMMENT 'Cost per unit, set by Finance',
  `total_value` decimal(15,2) DEFAULT '0.00' COMMENT 'quantity_in_store x unit_value',
  `registered_by` varchar(150) DEFAULT NULL,
  `date_registered` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `department` varchar(255) DEFAULT 'General',
  `reorder_level` int(11) DEFAULT '10',
  PRIMARY KEY (`id`),
  UNIQUE KEY `printing_store_materials_material_id_unique` (`material_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 113. goods_receipt_notes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `goods_receipt_notes`;
CREATE TABLE `goods_receipt_notes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `grn_number` varchar(30) NOT NULL,
  `po_id` int(11) NOT NULL,
  `received_date` date NOT NULL,
  `received_by` int(11) NOT NULL,
  `receiving_note` varchar(500) DEFAULT NULL,
  `status` enum('pending','completed','partial') DEFAULT 'completed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `goods_receipt_notes_grn_number_unique` (`grn_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 114. grn
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `grn`;
CREATE TABLE `grn` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `grn_no` varchar(30) NOT NULL,
  `issue_voucher_id` int(11) NOT NULL,
  `iss_no` varchar(30) NOT NULL,
  `approval_id` int(11) NOT NULL,
  `apr_no` varchar(30) NOT NULL,
  `requisition_id` int(11) NOT NULL,
  `req_no` varchar(30) NOT NULL,
  `drug_id` int(11) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `unit_of_measure` varchar(50) DEFAULT 'Tablets',
  `quantity_expected` int(11) NOT NULL,
  `quantity_received` int(11) NOT NULL,
  `discrepancy_note` text,
  `condition` enum('Good','Damaged') DEFAULT 'Good',
  `pharmacy_stock_before` int(11) NOT NULL,
  `pharmacy_stock_after` int(11) NOT NULL,
  `status` enum('PENDING','COMPLETED') DEFAULT 'PENDING',
  `received_by` int(11) DEFAULT NULL,
  `received_by_name` varchar(100) DEFAULT NULL,
  `stamp_id` varchar(100) DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 115. grn_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `grn_items`;
CREATE TABLE `grn_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `grn_id` int(11) NOT NULL,
  `po_item_id` int(11) NOT NULL,
  `quantity_ordered` int(11) NOT NULL,
  `quantity_received` int(11) NOT NULL,
  `quantity_damaged` int(11) DEFAULT '0',
  `quality_pass` tinyint(1) DEFAULT '1',
  `unit_price` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 116. hr_policies
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_policies`;
CREATE TABLE `hr_policies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `file_ref` varchar(255) DEFAULT NULL,
  `version_number` int(11) DEFAULT '1',
  `status` varchar(255) DEFAULT 'Draft',
  `effective_date` date DEFAULT NULL,
  `published_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `acknowledgment_required` tinyint(1) DEFAULT '0',
  `send_to_all` tinyint(1) DEFAULT '0',
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hr_policies_published_by_foreign` (`published_by`),
  KEY `hr_policies_approved_by_foreign` (`approved_by`),
  CONSTRAINT `hr_policies_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `hr_policies_published_by_foreign` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 117. hr_announcements
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_announcements`;
CREATE TABLE `hr_announcements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `author_id` int(11) DEFAULT NULL,
  `audience_scope` json DEFAULT NULL,
  `priority` varchar(255) DEFAULT 'Info',
  `status` varchar(255) DEFAULT 'Published',
  `publish_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  `linked_policy_id` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hr_announcements_author_id_foreign` (`author_id`),
  KEY `hr_announcements_linked_policy_id_foreign` (`linked_policy_id`),
  CONSTRAINT `hr_announcements_author_id_foreign` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `hr_announcements_linked_policy_id_foreign` FOREIGN KEY (`linked_policy_id`) REFERENCES `hr_policies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 118. hr_announcement_receipts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_announcement_receipts`;
CREATE TABLE `hr_announcement_receipts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `announcement_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hr_announcement_receipts_announcement_id_foreign` (`announcement_id`),
  KEY `hr_announcement_receipts_user_id_foreign` (`user_id`),
  CONSTRAINT `hr_announcement_receipts_announcement_id_foreign` FOREIGN KEY (`announcement_id`) REFERENCES `hr_announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hr_announcement_receipts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 119. hr_audit_logs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_audit_logs`;
CREATE TABLE `hr_audit_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `actor_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `target_module` varchar(255) NOT NULL,
  `target_id` varchar(255) NOT NULL,
  `before_state` json DEFAULT NULL,
  `after_state` json DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hr_audit_logs_actor_id_foreign` (`actor_id`),
  CONSTRAINT `hr_audit_logs_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 120. hr_deductions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_deductions`;
CREATE TABLE `hr_deductions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'Tax/PAYE',
  `amount` decimal(12,2) NOT NULL,
  `amount_type` varchar(20) NOT NULL DEFAULT 'Fixed',
  `percentage` decimal(8,4) DEFAULT NULL,
  `frequency` varchar(20) DEFAULT 'Monthly',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `description` text,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 121. hr_departments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_departments`;
CREATE TABLE `hr_departments` (
  `dept_id` varchar(20) NOT NULL,
  `dept_name` varchar(100) NOT NULL,
  `dept_code` varchar(10) DEFAULT NULL,
  `head_employee_id` varchar(20) DEFAULT NULL,
  `budget_code` varchar(20) DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'Active',
  PRIMARY KEY (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 122. hr_employee_documents
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_employee_documents`;
CREATE TABLE `hr_employee_documents` (
  `doc_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `doc_type` varchar(50) DEFAULT NULL,
  `doc_name` varchar(200) DEFAULT NULL,
  `doc_path` varchar(255) DEFAULT NULL,
  `upload_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`doc_id`),
  KEY `hr_employee_documents_employee_id_foreign` (`employee_id`),
  CONSTRAINT `hr_employee_documents_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 123. hr_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_messages`;
CREATE TABLE `hr_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'unread',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 124. hr_notifications_log
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_notifications_log`;
CREATE TABLE `hr_notifications_log` (
  `notification_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rule_id` varchar(20) DEFAULT NULL,
  `employee_id` varchar(20) DEFAULT NULL,
  `dept_id` varchar(20) DEFAULT NULL,
  `notification_message` text,
  `priority` varchar(20) DEFAULT 'MEDIUM',
  `status` varchar(20) DEFAULT 'Pending',
  `recipient_user` varchar(50) DEFAULT NULL,
  `sent_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `read_date` datetime DEFAULT NULL,
  `acknowledge_date` datetime DEFAULT NULL,
  `action_taken` text,
  PRIMARY KEY (`notification_id`),
  KEY `hr_notifications_log_rule_id_foreign` (`rule_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 125. hr_notification_rules
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_notification_rules`;
CREATE TABLE `hr_notification_rules` (
  `rule_id` varchar(20) NOT NULL,
  `rule_name` varchar(100) DEFAULT NULL,
  `trigger_condition` text,
  `priority` varchar(20) DEFAULT 'MEDIUM',
  `recipient_roles` varchar(100) DEFAULT NULL,
  `action_type` varchar(50) DEFAULT 'Alert',
  `is_active` varchar(3) DEFAULT 'Yes',
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 126. hr_policy_acknowledgments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_policy_acknowledgments`;
CREATE TABLE `hr_policy_acknowledgments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `policy_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `acknowledged_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hr_policy_acknowledgments_policy_id_foreign` (`policy_id`),
  KEY `hr_policy_acknowledgments_user_id_foreign` (`user_id`),
  CONSTRAINT `hr_policy_acknowledgments_policy_id_foreign` FOREIGN KEY (`policy_id`) REFERENCES `hr_policies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hr_policy_acknowledgments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 127. hr_positions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_positions`;
CREATE TABLE `hr_positions` (
  `position_id` varchar(20) NOT NULL,
  `position_title` varchar(100) NOT NULL,
  `position_level` varchar(50) DEFAULT NULL,
  `dept_id` varchar(20) DEFAULT NULL,
  `budgeted_salary` decimal(12,2) DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'Active',
  PRIMARY KEY (`position_id`),
  KEY `hr_positions_dept_id_foreign` (`dept_id`),
  CONSTRAINT `hr_positions_dept_id_foreign` FOREIGN KEY (`dept_id`) REFERENCES `hr_departments` (`dept_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 128. hr_settings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_settings`;
CREATE TABLE `hr_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contact_phone1` varchar(255) DEFAULT '',
  `contact_phone2` varchar(255) DEFAULT '',
  `contact_email` varchar(255) DEFAULT '',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 129. hr_units
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `hr_units`;
CREATE TABLE `hr_units` (
  `unit_id` varchar(20) NOT NULL,
  `unit_name` varchar(100) NOT NULL,
  `dept_id` varchar(20) DEFAULT NULL,
  `unit_head_id` varchar(20) DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'Active',
  PRIMARY KEY (`unit_id`),
  KEY `hr_units_dept_id_foreign` (`dept_id`),
  CONSTRAINT `hr_units_dept_id_foreign` FOREIGN KEY (`dept_id`) REFERENCES `hr_departments` (`dept_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 130. inventory
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `unit_cost` decimal(15,2) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_counted` datetime DEFAULT NULL,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 131. products
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `category_id` int(11) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL,
  `reorder_level` int(11) DEFAULT '0',
  `expiry_date` date DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `business_unit` enum('retail','farming','pharmacy','rental') DEFAULT NULL,
  `description` text,
  `product_image` varchar(255) DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `stock_quantity` int(11) DEFAULT '0',
  `requires_serial` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_products_sku` (`sku`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_expiry` (`expiry_date`),
  KEY `unit_id` (`unit_id`),
  KEY `supplier_id` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 132. inventory_counts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_counts`;
CREATE TABLE `inventory_counts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `counted_quantity` int(11) NOT NULL,
  `system_quantity` int(11) NOT NULL,
  `variance` int(11) NOT NULL,
  `notes` text,
  `counted_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `inventory_counts_product_id_foreign` (`product_id`),
  KEY `inventory_counts_counted_by_foreign` (`counted_by`),
  CONSTRAINT `inventory_counts_counted_by_foreign` FOREIGN KEY (`counted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_counts_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 133. inventory_movements
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_movements`;
CREATE TABLE `inventory_movements` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `quantity_before` int(11) NOT NULL,
  `quantity_after` int(11) NOT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reason` text,
  `performed_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movement_product` (`product_id`),
  KEY `idx_movement_type` (`transaction_type`),
  KEY `idx_movement_created` (`created_at`),
  KEY `performed_by` (`performed_by`),
  KEY `approved_by` (`approved_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 134. inventory_serials
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_serials`;
CREATE TABLE `inventory_serials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `serial_number` varchar(100) NOT NULL,
  `status` enum('In Stock','Sold','Damaged','Lost') DEFAULT 'In Stock',
  `location` varchar(255) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_serial` (`product_id`,`serial_number`),
  CONSTRAINT `inventory_serials_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 135. invoice_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `invoice_payments`;
CREATE TABLE `invoice_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `status_id` int(11) NOT NULL,
  `processed_by` int(11) NOT NULL,
  `processed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_payments_sale` (`sale_id`),
  KEY `idx_invoice_payments_status` (`status_id`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `processed_by` (`processed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 136. issue_vouchers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `issue_vouchers`;
CREATE TABLE `issue_vouchers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `iss_no` varchar(30) NOT NULL,
  `approval_id` int(11) NOT NULL,
  `apr_no` varchar(30) NOT NULL,
  `requisition_id` int(11) NOT NULL,
  `req_no` varchar(30) NOT NULL,
  `drug_id` int(11) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `unit_of_measure` varchar(50) DEFAULT 'Tablets',
  `quantity_approved` int(11) NOT NULL,
  `quantity_issued` int(11) NOT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `store_stock_before` int(11) NOT NULL,
  `store_stock_after` int(11) NOT NULL,
  `status` enum('DRAFT','ISSUED','RECEIVED','COMPLETED') DEFAULT 'DRAFT',
  `issued_by` int(11) DEFAULT NULL,
  `issued_by_name` varchar(100) DEFAULT NULL,
  `stamp_id` varchar(100) DEFAULT NULL,
  `issued_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `issue_vouchers_iss_no_unique` (`iss_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 137. news_posts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `news_posts`;
CREATE TABLE `news_posts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `visibility` varchar(255) NOT NULL DEFAULT 'public',
  `youtube_url` varchar(255) DEFAULT NULL,
  `images` json DEFAULT NULL,
  `hiring_position` varchar(255) DEFAULT NULL,
  `hiring_deadline` date DEFAULT NULL,
  `hiring_email` varchar(255) DEFAULT NULL,
  `hiring_location` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `posted_by` int(10) unsigned DEFAULT NULL,
  `send_notification` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 138. job_applications
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `job_applications`;
CREATE TABLE `job_applications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int(10) unsigned DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `education_status` varchar(255) NOT NULL,
  `national_id` varchar(255) NOT NULL,
  `sex` enum('Male','Female') NOT NULL,
  `status` enum('PENDING','IN_PERSON_INVITED','SUBMITTED_TO_CEO','REJECTED','APPROVED','INFORMED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rejection_reason` text,
  `id_front_image` varchar(255) DEFAULT NULL,
  `id_back_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `job_applications_post_id_foreign` (`post_id`),
  CONSTRAINT `job_applications_post_id_foreign` FOREIGN KEY (`post_id`) REFERENCES `news_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 139. knex_migrations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `knex_migrations`;
CREATE TABLE `knex_migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 140. knex_migrations_lock
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `knex_migrations_lock`;
CREATE TABLE `knex_migrations_lock` (
  `index` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int(11) DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 141. leads
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `leads`;
CREATE TABLE `leads` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `source` varchar(50) DEFAULT 'walk_in',
  `status` enum('new','contacted','qualified','converted','lost') DEFAULT 'new',
  `notes` text,
  `assigned_to` int(10) unsigned DEFAULT NULL,
  `converted_to_customer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 142. leave_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) NOT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `leave_type` enum('Annual Leave','Sick Leave','Unpaid Leave','Emergency Leave') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `reviewed_by` varchar(20) DEFAULT NULL,
  `rejection_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 143. leave_types
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `leave_types`;
CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `is_paid` tinyint(1) DEFAULT '1',
  `max_days_per_year` int(11) DEFAULT '15',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 144. liabilities
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `liabilities`;
CREATE TABLE `liabilities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_type` varchar(255) NOT NULL,
  `reference_no` varchar(255) NOT NULL,
  `party_name` varchar(255) NOT NULL,
  `description` text,
  `amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `due_date` date NOT NULL,
  `status` varchar(255) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 145. liability_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `liability_payments`;
CREATE TABLE `liability_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `liability_payments_liability_id_foreign` (`liability_id`),
  CONSTRAINT `liability_payments_liability_id_foreign` FOREIGN KEY (`liability_id`) REFERENCES `liabilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 146. loan_details
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `loan_details`;
CREATE TABLE `loan_details` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned NOT NULL,
  `lender_name` varchar(255) NOT NULL,
  `interest_rate` decimal(5,2) DEFAULT NULL,
  `term_months` int(11) DEFAULT NULL,
  `principal_amount` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `loan_details_liability_id_foreign` (`liability_id`),
  CONSTRAINT `loan_details_liability_id_foreign` FOREIGN KEY (`liability_id`) REFERENCES `liabilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 147. loyalty_points
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `loyalty_points`;
CREATE TABLE `loyalty_points` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `points` decimal(12,2) NOT NULL,
  `type` enum('earned','redeemed','expired','reversed','signup_bonus') DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(10) unsigned DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `loyalty_points_customer_id_foreign` (`customer_id`),
  CONSTRAINT `loyalty_points_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 148. loyalty_rewards
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `loyalty_rewards`;
CREATE TABLE `loyalty_rewards` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `points_required` int(11) NOT NULL,
  `reward_type` varchar(50) DEFAULT 'discount',
  `reward_value` decimal(15,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 149. loyalty_tiers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `loyalty_tiers`;
CREATE TABLE `loyalty_tiers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `min_annual_spend` decimal(15,2) DEFAULT '0.00',
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `points_multiplier` decimal(5,2) DEFAULT '1.00',
  `color` varchar(7) DEFAULT '#94a3b8',
  `benefits` text,
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loyalty_tiers_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 150. manager_chats
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `manager_chats`;
CREATE TABLE `manager_chats` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sender_user_id` int(10) unsigned NOT NULL,
  `receiver_user_id` int(10) unsigned NOT NULL,
  `message` text NOT NULL,
  `deleted_by_sender` tinyint(1) DEFAULT '0',
  `deleted_by_receiver` tinyint(1) DEFAULT '0',
  `seen_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `reply_to_id` int(10) unsigned DEFAULT NULL,
  `reactions` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 151. manager_chat_groups
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `manager_chat_groups`;
CREATE TABLE `manager_chat_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 152. manager_chat_group_members
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `manager_chat_group_members`;
CREATE TABLE `manager_chat_group_members` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `is_banned` tinyint(1) DEFAULT '0',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `manager_chat_group_members_group_id_user_id_unique` (`group_id`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 153. manager_chat_group_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `manager_chat_group_messages`;
CREATE TABLE `manager_chat_group_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(10) unsigned NOT NULL,
  `sender_user_id` int(10) unsigned NOT NULL,
  `message` text,
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reply_to_id` int(10) unsigned DEFAULT NULL,
  `reactions` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 154. manager_sale_actions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `manager_sale_actions`;
CREATE TABLE `manager_sale_actions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pos_sale_id` int(10) unsigned NOT NULL,
  `manager_id` int(10) unsigned NOT NULL,
  `action` enum('approved','flagged') NOT NULL,
  `reason` text,
  `cash_to_handover` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 155. manufacturers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `manufacturers`;
CREATE TABLE `manufacturers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(200) DEFAULT NULL,
  `address` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `manufacturers_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 156. purchase_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `purchase_requests`;
CREATE TABLE `purchase_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_code` varchar(255) NOT NULL,
  `drug_id` int(10) unsigned DEFAULT NULL,
  `scenario` enum('STORE_AND_PHARMACY_LOW','STORE_ONLY_LOW','NEW_DRUG') DEFAULT NULL,
  `store_qty_at_request` int(11) DEFAULT NULL,
  `store_min_level` int(11) DEFAULT NULL,
  `pharmacy_qty_at_request` int(11) DEFAULT NULL,
  `pharmacy_reorder_level` int(11) DEFAULT NULL,
  `requested_qty` int(11) NOT NULL,
  `urgency` enum('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  `status` enum('PENDING_DECISION','APPROVED','REJECTED','WAIT') DEFAULT 'PENDING_DECISION',
  `created_by` int(10) unsigned NOT NULL,
  `decided_by` int(10) unsigned DEFAULT NULL,
  `decision` enum('APPROVE','REJECT','WAIT') DEFAULT NULL,
  `decision_reason` text,
  `wait_document_url` varchar(255) DEFAULT NULL,
  `wait_instructions` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_new_drug` tinyint(1) DEFAULT '0',
  `new_drug_category` varchar(255) DEFAULT NULL,
  `new_drug_classification` varchar(255) DEFAULT NULL,
  `new_drug_therapeutic_use` text,
  `purpose_reason` text,
  `new_drug_name` varchar(255) DEFAULT NULL,
  `new_drug_strength` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_requests_request_code_unique` (`request_code`),
  KEY `purchase_requests_drug_id_foreign` (`drug_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 157. market_tasks
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `market_tasks`;
CREATE TABLE `market_tasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `purchase_request_id` int(10) unsigned NOT NULL,
  `assigned_to` int(10) unsigned DEFAULT NULL,
  `document_url` varchar(255) DEFAULT NULL,
  `instructions` text,
  `status` enum('IN_PROGRESS','READY_FOR_PURCHASE') DEFAULT 'IN_PROGRESS',
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `market_tasks_purchase_request_id_foreign` (`purchase_request_id`),
  CONSTRAINT `market_tasks_purchase_request_id_foreign` FOREIGN KEY (`purchase_request_id`) REFERENCES `purchase_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 158. month_end_closes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `month_end_closes`;
CREATE TABLE `month_end_closes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `close_period` varchar(7) NOT NULL,
  `close_date` date NOT NULL,
  `status` enum('open','closing','closed','reopened') DEFAULT 'open',
  `closed_at` timestamp NULL DEFAULT NULL,
  `closed_by` int(10) unsigned DEFAULT NULL,
  `reopened_by` int(10) unsigned DEFAULT NULL,
  `reopened_at` timestamp NULL DEFAULT NULL,
  `checklist_results` text,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `month_end_closes_close_period_unique` (`close_period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 159. notifications
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `role_target` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text,
  `news_post_id` int(10) unsigned DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(50) DEFAULT 'general',
  `link` varchar(500) DEFAULT NULL,
  `related_entity_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 160. opportunities
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `opportunities`;
CREATE TABLE `opportunities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` int(10) unsigned DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `stage` enum('new','qualification','proposal','negotiation','closed_won','closed_lost') DEFAULT NULL,
  `expected_value` decimal(15,2) DEFAULT '0.00',
  `probability` decimal(5,2) DEFAULT '0.00',
  `expected_close_date` date DEFAULT NULL,
  `assigned_to` int(10) unsigned DEFAULT NULL,
  `notes` text,
  `lost_reason` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `opportunities_lead_id_foreign` (`lead_id`),
  CONSTRAINT `opportunities_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 161. order_statuses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `order_statuses`;
CREATE TABLE `order_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 162. order_status_history
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `order_status_history`;
CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `from_status` varchar(50) DEFAULT NULL,
  `to_status` varchar(50) NOT NULL,
  `note` text,
  `changed_by` int(11) NOT NULL,
  `changed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_history_order` (`order_id`),
  KEY `idx_history_timestamp` (`changed_at`),
  KEY `changed_by` (`changed_by`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 163. password_history
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `password_history`;
CREATE TABLE `password_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_password_history_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 164. payment_schedules
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payment_schedules`;
CREATE TABLE `payment_schedules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reference_type` varchar(30) NOT NULL,
  `reference_id` int(10) unsigned NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `remaining_amount` decimal(15,2) NOT NULL,
  `due_date` date NOT NULL,
  `scheduled_date` date DEFAULT NULL,
  `status` enum('pending','partial','paid','overdue','cancelled') DEFAULT 'pending',
  `supplier_id` int(10) unsigned DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 165. payment_statuses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payment_statuses`;
CREATE TABLE `payment_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 166. payment_terms
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payment_terms`;
CREATE TABLE `payment_terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `days_net` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 167. payroll
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll`;
CREATE TABLE `payroll` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `month` varchar(7) NOT NULL,
  `status` enum('Draft','Sent','Finance Approved','Paid') DEFAULT 'Draft',
  `total_base_salary` decimal(14,2) DEFAULT '0.00',
  `total_bonus` decimal(14,2) DEFAULT '0.00',
  `total_deduction` decimal(14,2) DEFAULT '0.00',
  `total_net` decimal(14,2) DEFAULT '0.00',
  `employee_count` int(11) DEFAULT '0',
  `payment_method` varchar(30) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `sent_to_finance_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `finance_approved_by` int(11) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `month` (`month`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 168. payroll_company_aggregation
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_company_aggregation`;
CREATE TABLE `payroll_company_aggregation` (
  `agg_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `month_number` int(11) DEFAULT NULL,
  `year_number` int(11) DEFAULT NULL,
  `total_employees` int(11) DEFAULT '0',
  `company_gross_pay` decimal(14,2) DEFAULT '0.00',
  `company_net_pay` decimal(14,2) DEFAULT '0.00',
  `total_overtime_pay` decimal(12,2) DEFAULT '0.00',
  `total_deductions` decimal(14,2) DEFAULT '0.00',
  `total_worked_hours` decimal(12,2) DEFAULT '0.00',
  `total_late_hours` decimal(10,2) DEFAULT '0.00',
  `total_absent_days` int(11) DEFAULT '0',
  `calculated_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `approval_status` varchar(20) DEFAULT 'Draft',
  `approved_by` varchar(50) DEFAULT NULL,
  `approved_date` datetime DEFAULT NULL,
  `rejection_reason` text,
  `payment_status` varchar(20) DEFAULT 'Unpaid',
  `paid_by` varchar(50) DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`agg_id`),
  UNIQUE KEY `idx_unique_company_payroll` (`month_number`,`year_number`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 169. payroll_department_aggregation
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_department_aggregation`;
CREATE TABLE `payroll_department_aggregation` (
  `agg_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dept_id` varchar(20) DEFAULT NULL,
  `month_number` int(11) DEFAULT NULL,
  `year_number` int(11) DEFAULT NULL,
  `employee_count` int(11) DEFAULT '0',
  `total_gross_pay` decimal(12,2) DEFAULT '0.00',
  `total_net_pay` decimal(12,2) DEFAULT '0.00',
  `total_overtime_pay` decimal(12,2) DEFAULT '0.00',
  `total_deductions` decimal(12,2) DEFAULT '0.00',
  `total_worked_hours` decimal(10,2) DEFAULT '0.00',
  `total_late_hours` decimal(10,2) DEFAULT '0.00',
  `total_absent_days` int(11) DEFAULT '0',
  `calculated_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`agg_id`),
  UNIQUE KEY `idx_unique_dept_payroll` (`dept_id`,`month_number`,`year_number`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 170. payroll_finance_queue
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_finance_queue`;
CREATE TABLE `payroll_finance_queue` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `month_number` int(11) NOT NULL,
  `year_number` int(11) NOT NULL,
  `total_net_pay` decimal(15,2) DEFAULT NULL,
  `total_employees` int(11) DEFAULT NULL,
  `approved_by_ceo` varchar(255) DEFAULT NULL,
  `ceo_approved_date` datetime DEFAULT NULL,
  `payment_status` varchar(255) DEFAULT 'Pending Payment',
  `payment_method` varchar(255) DEFAULT NULL,
  `paid_by` varchar(255) DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `proof_file` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payroll_finance_queue_month_number_year_number_unique` (`month_number`,`year_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 171. payroll_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_items`;
CREATE TABLE `payroll_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payroll_id` int(11) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `base_salary` decimal(12,2) DEFAULT '0.00',
  `daily_rate` decimal(12,2) DEFAULT '0.00',
  `days_present` decimal(4,2) DEFAULT '0.00',
  `days_absent` decimal(4,2) DEFAULT '0.00',
  `late_minutes` int(11) DEFAULT '0',
  `absence_deduction` decimal(12,2) DEFAULT '0.00',
  `late_deduction` decimal(12,2) DEFAULT '0.00',
  `early_leave_deduction` decimal(12,2) DEFAULT '0.00',
  `standing_deduction` decimal(12,2) DEFAULT '0.00',
  `overtime_hours` decimal(5,2) DEFAULT '0.00',
  `overtime_pay` decimal(12,2) DEFAULT '0.00',
  `performance_bonus` decimal(12,2) DEFAULT '0.00',
  `net_salary` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payroll_id` (`payroll_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `payroll_items_ibfk_1` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`id`),
  CONSTRAINT `payroll_items_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 172. payroll_records
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_records`;
CREATE TABLE `payroll_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payroll_month` varchar(7) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `base_salary` decimal(12,2) NOT NULL,
  `days_present` decimal(4,2) NOT NULL,
  `daily_rate` decimal(12,2) NOT NULL,
  `deduction_amount` decimal(12,2) DEFAULT '0.00',
  `bonus_amount` decimal(12,2) DEFAULT '0.00',
  `net_salary` decimal(12,2) NOT NULL,
  `status` enum('Draft','Approved_HR','Approved_Finance','Paid') DEFAULT 'Draft',
  `payment_method` enum('Cash','Bank Transfer','Telebirr') DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_employee_month` (`employee_id`,`payroll_month`),
  CONSTRAINT `payroll_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 173. payroll_salary_components
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_salary_components`;
CREATE TABLE `payroll_salary_components` (
  `component_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `month_number` int(11) DEFAULT NULL,
  `year_number` int(11) DEFAULT NULL,
  `base_salary` decimal(12,2) DEFAULT '0.00',
  `housing_allowance` decimal(12,2) DEFAULT '0.00',
  `transport_allowance` decimal(12,2) DEFAULT '0.00',
  `communication_allowance` decimal(12,2) DEFAULT '0.00',
  `overtime_pay` decimal(12,2) DEFAULT '0.00',
  `bonus_pay` decimal(12,2) DEFAULT '0.00',
  `deduction_absent` decimal(12,2) DEFAULT '0.00',
  `deduction_loan` decimal(12,2) DEFAULT '0.00',
  `deduction_tax` decimal(12,2) DEFAULT '0.00',
  `deduction_pension` decimal(12,2) DEFAULT '0.00',
  `gross_pay` decimal(12,2) DEFAULT '0.00',
  `net_pay` decimal(12,2) DEFAULT '0.00',
  `calculated_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'Draft',
  `approved_by` varchar(50) DEFAULT NULL,
  `approved_date` datetime DEFAULT NULL,
  PRIMARY KEY (`component_id`),
  UNIQUE KEY `idx_unique_payroll` (`employee_id`,`month_number`,`year_number`),
  CONSTRAINT `payroll_salary_components_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 174. petty_cash_funds
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `petty_cash_funds`;
CREATE TABLE `petty_cash_funds` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fund_name` varchar(100) NOT NULL,
  `imprest_amount` decimal(15,2) NOT NULL,
  `current_balance` decimal(15,2) NOT NULL,
  `max_disbursement` decimal(15,2) DEFAULT '5000.00',
  `max_per_transaction` decimal(15,2) DEFAULT '2000.00',
  `custodian_id` int(11) NOT NULL,
  `status` enum('active','suspended','closed') DEFAULT 'active',
  `last_reconciled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `petty_cash_funds_custodian_id_foreign` (`custodian_id`),
  CONSTRAINT `petty_cash_funds_custodian_id_foreign` FOREIGN KEY (`custodian_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 175. petty_cash_transactions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `petty_cash_transactions`;
CREATE TABLE `petty_cash_transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fund_id` int(10) unsigned NOT NULL,
  `type` enum('disbursement','replenishment','adjustment','transfer') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `receipt_path` varchar(255) DEFAULT NULL,
  `requested_by` int(10) unsigned DEFAULT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `status` enum('pending','approved','rejected','paid') DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `petty_cash_transactions_fund_id_foreign` (`fund_id`),
  KEY `petty_cash_transactions_category_id_foreign` (`category_id`),
  CONSTRAINT `petty_cash_transactions_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `petty_cash_transactions_fund_id_foreign` FOREIGN KEY (`fund_id`) REFERENCES `petty_cash_funds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 176. pharmacy_branches
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_branches`;
CREATE TABLE `pharmacy_branches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pharmacy_branches_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 177. pharmacy_workers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_workers`;
CREATE TABLE `pharmacy_workers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `post_permission` tinyint(1) DEFAULT '0',
  `phone` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pharmacy_workers_branch_id_foreign` (`branch_id`),
  CONSTRAINT `pharmacy_workers_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `pharmacy_branches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 178. pharmacy_audit_trail
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_audit_trail`;
CREATE TABLE `pharmacy_audit_trail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `worker_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(30) DEFAULT NULL COMMENT 'PAID / CASHOUT',
  `recipient` varchar(200) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pharmacy_audit_trail_branch_id_foreign` (`branch_id`),
  KEY `pharmacy_audit_trail_worker_id_foreign` (`worker_id`),
  CONSTRAINT `pharmacy_audit_trail_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `pharmacy_branches` (`id`),
  CONSTRAINT `pharmacy_audit_trail_worker_id_foreign` FOREIGN KEY (`worker_id`) REFERENCES `pharmacy_workers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 179. pharmacy_branch_toggle_log
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_branch_toggle_log`;
CREATE TABLE `pharmacy_branch_toggle_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `action` enum('ACTIVE','INACTIVE') NOT NULL,
  `toggled_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pharmacy_branch_toggle_log_branch_id_foreign` (`branch_id`),
  KEY `pharmacy_branch_toggle_log_toggled_by_foreign` (`toggled_by`),
  CONSTRAINT `pharmacy_branch_toggle_log_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `pharmacy_branches` (`id`),
  CONSTRAINT `pharmacy_branch_toggle_log_toggled_by_foreign` FOREIGN KEY (`toggled_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 180. pharmacy_categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_categories`;
CREATE TABLE `pharmacy_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `cover_image` varchar(255) DEFAULT NULL,
  `icon_class` varchar(50) DEFAULT NULL,
  `display_order` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 181. pharmacy_customer_queries
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_customer_queries`;
CREATE TABLE `pharmacy_customer_queries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `drug_name` varchar(200) DEFAULT NULL,
  `channel` varchar(30) DEFAULT NULL COMMENT 'PHONE / IN_PERSON / ONLINE',
  `response_status` varchar(30) DEFAULT NULL COMMENT 'AVAILABLE / LOW_STOCK / OUT_OF_STOCK',
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_phone` varchar(30) DEFAULT NULL,
  `notify_on_restock` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 182. pharmacy_direct_deliveries
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_direct_deliveries`;
CREATE TABLE `pharmacy_direct_deliveries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `delivery_no` varchar(50) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `unit_of_measure` varchar(50) DEFAULT 'Units',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `delivery_date` date NOT NULL,
  `invoice_no` varchar(100) DEFAULT NULL,
  `notes` text,
  `received_by` int(11) DEFAULT NULL,
  `received_by_name` varchar(100) DEFAULT NULL,
  `status` enum('PENDING_CEO','CEO_CONFIRMED','CEO_REJECTED','FINANCE_PAID') DEFAULT 'PENDING_CEO',
  `ceo_confirmed_at` timestamp NULL DEFAULT NULL,
  `ceo_confirmed_by` int(11) DEFAULT NULL,
  `ceo_notes` text,
  `finance_payable_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_no` (`delivery_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 183. pharmacy_dispenses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_dispenses`;
CREATE TABLE `pharmacy_dispenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `notes` text,
  `items` json NOT NULL,
  `total_items` int(11) NOT NULL DEFAULT '0',
  `dispensed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 184. pharmacy_drug_hide_log
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_drug_hide_log`;
CREATE TABLE `pharmacy_drug_hide_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `drug_id` int(11) DEFAULT NULL,
  `drug_name` varchar(200) DEFAULT NULL,
  `reason` text,
  `hide_type` varchar(30) DEFAULT NULL COMMENT 'TEMPORARY / PERMANENT / PUBLIC_ONLY',
  `auto_show_at` date DEFAULT NULL,
  `notify_ceo` tinyint(1) DEFAULT '1',
  `hidden_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pharmacy_drug_hide_log_hidden_by_foreign` (`hidden_by`),
  CONSTRAINT `pharmacy_drug_hide_log_hidden_by_foreign` FOREIGN KEY (`hidden_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 185. pharmacy_expired_drugs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_expired_drugs`;
CREATE TABLE `pharmacy_expired_drugs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `drug_name` varchar(200) DEFAULT NULL,
  `quantity` int(11) DEFAULT '0',
  `expiry_date` varchar(30) DEFAULT NULL,
  `location` varchar(50) DEFAULT NULL COMMENT 'Pharmacy / Store',
  `action_required` varchar(50) DEFAULT NULL COMMENT 'Dispose / Return / Write-off',
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `requested_by` int(10) unsigned DEFAULT NULL,
  `ceo_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 186. pharmacy_sales_reports
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_sales_reports`;
CREATE TABLE `pharmacy_sales_reports` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `report_date` date NOT NULL,
  `total_sales` int(11) DEFAULT '0',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `submitted_by` int(10) unsigned DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `finance_decision` varchar(30) DEFAULT NULL,
  `finance_notes` text,
  `finance_decided_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 187. pharmacy_finance_records
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_finance_records`;
CREATE TABLE `pharmacy_finance_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `report_id` int(10) unsigned DEFAULT NULL,
  `revenue` decimal(12,2) DEFAULT '0.00',
  `cogs` decimal(12,2) DEFAULT '0.00',
  `profit_loss` decimal(12,2) DEFAULT '0.00',
  `result` enum('PROFIT','LOSS') DEFAULT NULL,
  `income_recorded` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pharmacy_finance_records_report_id_unique` (`report_id`),
  CONSTRAINT `pharmacy_finance_records_report_id_foreign` FOREIGN KEY (`report_id`) REFERENCES `pharmacy_sales_reports` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 188. pharmacy_inventory
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_inventory`;
CREATE TABLE `pharmacy_inventory` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `drug_id` int(10) unsigned NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `reorder_level` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int(11) DEFAULT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `stock_status` enum('In Stock','Low Stock','Out of Stock','Expired') DEFAULT NULL,
  `last_updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pharmacy_inventory_branch_drug_batch_unique` (`branch_id`,`drug_id`,`batch_no`),
  KEY `pharmacy_inventory_drug_id_foreign` (`drug_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 189. pharmacy_manager_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_manager_requests`;
CREATE TABLE `pharmacy_manager_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `drug_name` varchar(200) DEFAULT NULL,
  `drug_id` int(11) DEFAULT NULL,
  `drug_image` varchar(500) DEFAULT NULL,
  `request_type` varchar(30) DEFAULT NULL COMMENT 'QUANTITY / PRICE',
  `current_value` decimal(12,2) DEFAULT NULL,
  `requested_value` decimal(12,2) DEFAULT NULL,
  `ceo_value` decimal(12,2) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `reason` text,
  `requested_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 190. pharmacy_medications
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_medications`;
CREATE TABLE `pharmacy_medications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `generic_name` varchar(200) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `manufacturer` varchar(200) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `price_unit` varchar(50) DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT '0',
  `reorder_level` int(11) DEFAULT '10',
  `drug_image` varchar(255) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `description` text,
  `dosage_info` text,
  `expiry_date` date DEFAULT NULL,
  `is_prescription_required` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `is_hidden` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `pharmacy_medications_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `pharmacy_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 191. pharmacy_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_messages`;
CREATE TABLE `pharmacy_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sender_name` varchar(255) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `sender_phone` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 192. pharmacy_sales
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_sales`;
CREATE TABLE `pharmacy_sales` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `worker_id` int(10) unsigned DEFAULT NULL,
  `sale_type` varchar(30) NOT NULL COMMENT 'WALK-IN / ONLINE',
  `recipient_name` varchar(200) DEFAULT NULL,
  `recipient_phone` varchar(30) DEFAULT NULL,
  `total_products` int(11) DEFAULT '0',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `receipt_no` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_submitted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `pharmacy_sales_receipt_no_unique` (`receipt_no`),
  KEY `pharmacy_sales_branch_id_foreign` (`branch_id`),
  KEY `pharmacy_sales_worker_id_foreign` (`worker_id`),
  CONSTRAINT `pharmacy_sales_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `pharmacy_branches` (`id`),
  CONSTRAINT `pharmacy_sales_worker_id_foreign` FOREIGN KEY (`worker_id`) REFERENCES `pharmacy_workers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 193. pharmacy_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_payments`;
CREATE TABLE `pharmacy_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` int(10) unsigned DEFAULT NULL,
  `payment_method` enum('CASH','BANK_TRANSFER','TELBIR') NOT NULL,
  `amount` decimal(12,2) DEFAULT '0.00',
  `recipient_name` varchar(200) DEFAULT NULL,
  `recipient_phone` varchar(30) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_holder` varchar(200) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `telbir_number` varchar(50) DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `worker_name` varchar(150) DEFAULT NULL,
  `status` enum('PAID','CASHOUT') DEFAULT 'PAID',
  `receipt_no` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pharmacy_payments_sale_id_foreign` (`sale_id`),
  CONSTRAINT `pharmacy_payments_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `pharmacy_sales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 194. pharmacy_prescriptions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_prescriptions`;
CREATE TABLE `pharmacy_prescriptions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_phone` varchar(30) DEFAULT NULL,
  `drug_name` varchar(200) DEFAULT NULL,
  `quantity` int(11) DEFAULT '0',
  `prescription_file` text,
  `source` varchar(30) DEFAULT NULL COMMENT 'ONLINE / PHYSICAL',
  `intake_source` varchar(50) DEFAULT NULL COMMENT 'HOSPITAL / HEALTH_INSTITUTION / PRIVATE_DOCTOR',
  `special_instructions` text,
  `status` enum('PENDING','PREPARED','PICKED_UP','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `reference_no` varchar(50) DEFAULT NULL,
  `branch_pickup` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pharmacy_prescriptions_reference_no_unique` (`reference_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 195. pharmacy_product_posts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_product_posts`;
CREATE TABLE `pharmacy_product_posts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `product_id` int(10) unsigned DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `posted_by` int(10) unsigned DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 196. pharmacy_report_branches
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_report_branches`;
CREATE TABLE `pharmacy_report_branches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `report_id` int(10) unsigned DEFAULT NULL,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `total_sales` int(11) DEFAULT '0',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `worker_count` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `pharmacy_report_branches_report_id_foreign` (`report_id`),
  KEY `pharmacy_report_branches_branch_id_foreign` (`branch_id`),
  CONSTRAINT `pharmacy_report_branches_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `pharmacy_branches` (`id`),
  CONSTRAINT `pharmacy_report_branches_report_id_foreign` FOREIGN KEY (`report_id`) REFERENCES `pharmacy_sales_reports` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 197. pharmacy_report_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_report_payments`;
CREATE TABLE `pharmacy_report_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `report_id` int(10) unsigned DEFAULT NULL,
  `payment_type` varchar(50) DEFAULT NULL,
  `count` int(11) DEFAULT '0',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `pharmacy_report_payments_report_id_foreign` (`report_id`),
  CONSTRAINT `pharmacy_report_payments_report_id_foreign` FOREIGN KEY (`report_id`) REFERENCES `pharmacy_sales_reports` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 198. pharmacy_sale_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_sale_items`;
CREATE TABLE `pharmacy_sale_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` int(10) unsigned DEFAULT NULL,
  `drug_name` varchar(200) DEFAULT NULL,
  `quantity` int(11) DEFAULT '1',
  `unit_price` decimal(12,2) DEFAULT '0.00',
  `total_price` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `pharmacy_sale_items_sale_id_foreign` (`sale_id`),
  CONSTRAINT `pharmacy_sale_items_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `pharmacy_sales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 199. pharmacy_settings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_settings`;
CREATE TABLE `pharmacy_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contact_phone1` varchar(255) DEFAULT NULL,
  `contact_phone2` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 200. pharmacy_stock_movements
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_stock_movements`;
CREATE TABLE `pharmacy_stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `medication_id` int(11) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `medication_id` (`medication_id`),
  CONSTRAINT `pharmacy_stock_movements_ibfk_1` FOREIGN KEY (`medication_id`) REFERENCES `pharmacy_medications` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 201. pharmacy_tasks
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_tasks`;
CREATE TABLE `pharmacy_tasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `assigned_to` int(10) unsigned DEFAULT NULL,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `task_type` varchar(100) NOT NULL,
  `priority` varchar(20) DEFAULT 'Medium',
  `deadline` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `instructions` text,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 202. pharmacy_transfer_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pharmacy_transfer_requests`;
CREATE TABLE `pharmacy_transfer_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(30) NOT NULL,
  `drug_id` int(11) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `quantity_requested` int(11) NOT NULL,
  `urgency` enum('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  `status` enum('PENDING','APPROVED','REJECTED','SHIPPED','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `store_qty_before` int(11) DEFAULT NULL,
  `pharmacy_qty_before` int(11) DEFAULT NULL,
  `pharmacy_reorder_level` int(11) DEFAULT NULL,
  `store_unit_price` decimal(15,2) DEFAULT NULL,
  `pharmacy_unit_price` decimal(15,2) DEFAULT NULL,
  `rejection_reason` text,
  `notes` text,
  `created_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `rejected_by` int(11) DEFAULT NULL,
  `shipped_by` int(11) DEFAULT NULL,
  `received_by` int(11) DEFAULT NULL,
  `shipment_number` varchar(30) DEFAULT NULL,
  `quantity_shipped` int(11) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pharmacy_transfer_requests_request_number_unique` (`request_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 203. pos_audit_trail
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pos_audit_trail`;
CREATE TABLE `pos_audit_trail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `recipient` varchar(255) DEFAULT NULL,
  `amount` decimal(14,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sale_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 204. pos_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pos_items`;
CREATE TABLE `pos_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `source` varchar(50) DEFAULT 'retail',
  PRIMARY KEY (`id`),
  KEY `idx_pos_items_sale` (`sale_id`),
  KEY `idx_pos_items_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 205. pos_returns
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pos_returns`;
CREATE TABLE `pos_returns` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `return_number` varchar(50) NOT NULL,
  `sale_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `total_refund` decimal(15,2) NOT NULL DEFAULT '0.00',
  `refund_method` varchar(20) DEFAULT 'original',
  `reason` text,
  `processed_by` int(10) unsigned NOT NULL,
  `status` varchar(20) DEFAULT 'completed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pos_returns_return_number_unique` (`return_number`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 206. pos_return_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pos_return_items`;
CREATE TABLE `pos_return_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `return_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `refund_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reason_code` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pos_return_items_return_id_foreign` (`return_id`),
  CONSTRAINT `pos_return_items_return_id_foreign` FOREIGN KEY (`return_id`) REFERENCES `pos_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 207. pos_shifts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pos_shifts`;
CREATE TABLE `pos_shifts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id` int(10) unsigned NOT NULL,
  `shift_type` enum('morning','afternoon','evening') DEFAULT 'morning',
  `opening_float` decimal(12,2) DEFAULT '0.00',
  `total_sales` decimal(12,2) DEFAULT '0.00',
  `transaction_count` int(11) DEFAULT '0',
  `cash_collected` decimal(12,2) DEFAULT '0.00',
  `telebirr_collected` decimal(12,2) DEFAULT '0.00',
  `transfer_collected` decimal(12,2) DEFAULT '0.00',
  `credit_collected` decimal(12,2) DEFAULT '0.00',
  `check_collected` decimal(12,2) DEFAULT '0.00',
  `physical_cash_counted` decimal(12,2) DEFAULT NULL,
  `difference_amount` decimal(12,2) DEFAULT '0.00',
  `difference_reason` varchar(255) DEFAULT NULL,
  `cash_to_handover` decimal(12,2) DEFAULT '0.00',
  `status` enum('OPEN','CLOSED','VERIFIED') DEFAULT 'OPEN',
  `verified_by` int(10) unsigned DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `opened_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 208. po_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `po_items`;
CREATE TABLE `po_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `quantity_ordered` int(11) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `quantity_received` int(11) DEFAULT '0',
  `quantity_damaged` int(11) DEFAULT '0',
  `quality_pass` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_po_items_po` (`po_id`),
  KEY `idx_po_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 209. po_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `po_payments`;
CREATE TABLE `po_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method_id` int(11) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `status_id` int(11) NOT NULL,
  `processed_by` int(11) NOT NULL,
  `processed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_po_payments_po` (`po_id`),
  KEY `idx_po_payments_status` (`status_id`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `processed_by` (`processed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 210. po_statuses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `po_statuses`;
CREATE TABLE `po_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 211. prescription_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `prescription_requests`;
CREATE TABLE `prescription_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_number` varchar(50) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `medication_id` int(11) NOT NULL,
  `medication_name` varchar(200) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price_per_unit` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `prescription_image` varchar(255) DEFAULT NULL,
  `delivery_option` enum('pickup','delivery') DEFAULT 'pickup',
  `delivery_address` text,
  `delivery_fee` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','approved','rejected','ready_for_pickup','picked_up','delivered') DEFAULT 'pending',
  `rejection_reason` text,
  `requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_rejected_at` timestamp NULL DEFAULT NULL,
  `ready_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_number` (`request_number`),
  KEY `customer_id` (`customer_id`),
  KEY `medication_id` (`medication_id`),
  CONSTRAINT `prescription_requests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `prescription_requests_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `pharmacy_medications` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 212. price_lists
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `price_lists`;
CREATE TABLE `price_lists` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `currency` varchar(3) DEFAULT 'ETB',
  `is_active` tinyint(1) DEFAULT '1',
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `priority` int(11) DEFAULT '0',
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 213. price_list_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `price_list_items`;
CREATE TABLE `price_list_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `price_list_id` int(10) unsigned NOT NULL,
  `product_id` int(11) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `min_quantity` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `price_list_items_price_list_id_product_id_min_quantity_unique` (`price_list_id`,`product_id`,`min_quantity`),
  KEY `price_list_items_product_id_foreign` (`product_id`),
  CONSTRAINT `price_list_items_price_list_id_foreign` FOREIGN KEY (`price_list_id`) REFERENCES `price_lists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `price_list_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 214. printing_assets_machines
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_assets_machines`;
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

-- ------------------------------------------------------------
-- 215. printing_material_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_material_requests`;
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

-- ------------------------------------------------------------
-- 216. printing_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_messages`;
CREATE TABLE `printing_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('unread','read','replied') DEFAULT 'unread',
  `is_archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 217. printing_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_orders`;
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

-- ------------------------------------------------------------
-- 218. printing_production_machines
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_production_machines`;
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

-- ------------------------------------------------------------
-- 219. printing_production_materials
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_production_materials`;
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

-- ------------------------------------------------------------
-- 220. printing_product_types
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_product_types`;
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

-- ------------------------------------------------------------
-- 221. printing_settings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `printing_settings`;
CREATE TABLE `printing_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contact_phone1` varchar(50) DEFAULT NULL,
  `contact_phone2` varchar(50) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_address` text,
  `office_hours` varchar(255) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `terms_and_conditions` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 222. procurement_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_requests`;
CREATE TABLE `procurement_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pr_no` varchar(30) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `quantity_requested` int(11) NOT NULL,
  `unit_of_measure` varchar(50) DEFAULT 'Each',
  `estimated_unit_price` decimal(15,2) DEFAULT NULL,
  `estimated_total` decimal(15,2) DEFAULT NULL,
  `justification` text,
  `current_stock` int(11) DEFAULT '0',
  `reorder_level` int(11) DEFAULT '0',
  `urgency` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
  `status` enum('DRAFT','PENDING_CEO_REVIEW','CEO_APPROVED','CEO_REJECTED','IN_MARKET','TENDER_CREATED','FUND_REQUESTED','FUND_APPROVED','PAYMENT_MADE','SHIPPED','RECEIVED','CANCELLED') DEFAULT 'DRAFT',
  `ceo_decision` enum('PENDING','APPROVED','REJECTED','WAIT') NOT NULL DEFAULT 'PENDING',
  `ceo_notes` text,
  `ceo_decided_by` int(11) DEFAULT NULL,
  `ceo_decided_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `requested_by` int(11) NOT NULL,
  `requested_by_name` varchar(100) DEFAULT NULL,
  `rejection_reason` text,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `request_type` varchar(20) DEFAULT 'EXISTING_DRUG',
  `drug_category` varchar(100) DEFAULT NULL,
  `drug_classification` varchar(100) DEFAULT NULL,
  `therapeutic_use` text,
  `request_reason` text,
  `wait_document` varchar(255) DEFAULT NULL,
  `wait_instructions` text,
  `new_drug_flag` varchar(10) DEFAULT 'NO',
  `manager_signature` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_requests_pr_no_unique` (`pr_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 223. procurement_market_tasks
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_market_tasks`;
CREATE TABLE `procurement_market_tasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `procurement_request_id` int(10) unsigned NOT NULL,
  `pr_no` varchar(30) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `quantity_needed` int(11) NOT NULL,
  `market_info` text,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED') DEFAULT 'PENDING',
  `assigned_by` int(11) NOT NULL,
  `assigned_by_name` varchar(100) DEFAULT NULL,
  `completed_by` int(11) DEFAULT NULL,
  `completed_by_name` varchar(100) DEFAULT NULL,
  `completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `procurement_market_tasks_procurement_request_id_foreign` (`procurement_request_id`),
  CONSTRAINT `procurement_market_tasks_procurement_request_id_foreign` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 224. procurement_tenders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_tenders`;
CREATE TABLE `procurement_tenders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tender_no` varchar(30) NOT NULL,
  `procurement_request_id` int(10) unsigned NOT NULL,
  `pr_no` varchar(30) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_of_measure` varchar(50) DEFAULT 'Each',
  `budget_estimate` decimal(15,2) DEFAULT NULL,
  `market_task_id` int(10) unsigned DEFAULT NULL,
  `status` enum('DRAFT','OPEN','CLOSED','AWARDED','CANCELLED') DEFAULT 'DRAFT',
  `opening_date` date DEFAULT NULL,
  `closing_date` date DEFAULT NULL,
  `issued_by` int(11) NOT NULL,
  `issued_by_name` varchar(100) DEFAULT NULL,
  `terms_and_conditions` text,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `new_drug_flag` varchar(10) DEFAULT 'NO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_tenders_tender_no_unique` (`tender_no`),
  KEY `procurement_tenders_procurement_request_id_foreign` (`procurement_request_id`),
  KEY `procurement_tenders_market_task_id_foreign` (`market_task_id`),
  CONSTRAINT `procurement_tenders_market_task_id_foreign` FOREIGN KEY (`market_task_id`) REFERENCES `procurement_market_tasks` (`id`),
  CONSTRAINT `procurement_tenders_procurement_request_id_foreign` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 225. procurement_bids
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_bids`;
CREATE TABLE `procurement_bids` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tender_id` int(10) unsigned NOT NULL,
  `tender_no` varchar(30) NOT NULL,
  `supplier_user_id` int(11) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `supplier_contact` varchar(100) DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `delivery_days` int(11) DEFAULT NULL,
  `validity_period` varchar(50) DEFAULT NULL,
  `bid_document_path` text,
  `status` enum('SUBMITTED','SHORTLISTED','AWARDED','REJECTED') DEFAULT 'SUBMITTED',
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `procurement_bids_tender_id_foreign` (`tender_id`),
  CONSTRAINT `procurement_bids_tender_id_foreign` FOREIGN KEY (`tender_id`) REFERENCES `procurement_tenders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 226. procurement_fund_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_fund_requests`;
CREATE TABLE `procurement_fund_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tender_id` int(10) unsigned NOT NULL,
  `tender_no` varchar(30) NOT NULL,
  `procurement_request_id` int(10) unsigned NOT NULL,
  `pr_no` varchar(30) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING_CEO_APPROVAL','APPROVED','REJECTED') DEFAULT 'PENDING_CEO_APPROVAL',
  `ceo_decision` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `ceo_notes` text,
  `ceo_decided_by` int(11) DEFAULT NULL,
  `ceo_decided_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `requested_by` int(11) NOT NULL,
  `requested_by_name` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `new_drug_flag` varchar(10) DEFAULT 'NO',
  PRIMARY KEY (`id`),
  KEY `procurement_fund_requests_tender_id_foreign` (`tender_id`),
  CONSTRAINT `procurement_fund_requests_tender_id_foreign` FOREIGN KEY (`tender_id`) REFERENCES `procurement_tenders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 227. procurement_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_messages`;
CREATE TABLE `procurement_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sender_name` varchar(255) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `sender_phone` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 228. procurement_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_payments`;
CREATE TABLE `procurement_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `payment_no` varchar(30) NOT NULL,
  `fund_request_id` int(10) unsigned NOT NULL,
  `pr_no` varchar(30) NOT NULL,
  `tender_no` varchar(30) NOT NULL,
  `supplier_user_id` int(11) DEFAULT NULL,
  `supplier_name` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('BANK_TRANSFER','CASH','CHECK','TELEBIRR') DEFAULT 'BANK_TRANSFER',
  `status` enum('PENDING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING',
  `transaction_ref` varchar(100) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `paid_by` int(11) NOT NULL,
  `paid_by_name` varchar(100) DEFAULT NULL,
  `paid_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `new_drug_flag` varchar(10) DEFAULT 'NO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_payments_payment_no_unique` (`payment_no`),
  KEY `procurement_payments_fund_request_id_foreign` (`fund_request_id`),
  CONSTRAINT `procurement_payments_fund_request_id_foreign` FOREIGN KEY (`fund_request_id`) REFERENCES `procurement_fund_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 229. procurement_receipts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_receipts`;
CREATE TABLE `procurement_receipts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(30) NOT NULL,
  `payment_id` int(10) unsigned NOT NULL,
  `payment_no` varchar(30) NOT NULL,
  `procurement_request_id` int(10) unsigned NOT NULL,
  `pr_no` varchar(30) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `quantity_ordered` int(11) NOT NULL,
  `quantity_received` int(11) NOT NULL,
  `condition` enum('GOOD','DAMAGED','PARTIAL') DEFAULT 'GOOD',
  `discrepancy_notes` text,
  `status` enum('PENDING','COMPLETED') DEFAULT 'PENDING',
  `received_by` int(11) NOT NULL,
  `received_by_name` varchar(100) DEFAULT NULL,
  `received_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_receipts_receipt_no_unique` (`receipt_no`),
  KEY `procurement_receipts_payment_id_foreign` (`payment_id`),
  CONSTRAINT `procurement_receipts_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `procurement_payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 230. procurement_settings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_settings`;
CREATE TABLE `procurement_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contact_phone1` varchar(255) DEFAULT NULL,
  `contact_phone2` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 231. procurement_tender_decisions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `procurement_tender_decisions`;
CREATE TABLE `procurement_tender_decisions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tender_id` int(10) unsigned NOT NULL,
  `tender_no` varchar(30) NOT NULL,
  `selected_bid_id` int(10) unsigned DEFAULT NULL,
  `decision` enum('PENDING','APPROVED','REJECTED','RE_TENDER') DEFAULT 'PENDING',
  `decision_notes` text,
  `decided_by` int(11) NOT NULL,
  `decided_by_name` varchar(100) DEFAULT NULL,
  `decided_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `procurement_tender_decisions_tender_id_foreign` (`tender_id`),
  KEY `procurement_tender_decisions_selected_bid_id_foreign` (`selected_bid_id`),
  CONSTRAINT `procurement_tender_decisions_selected_bid_id_foreign` FOREIGN KEY (`selected_bid_id`) REFERENCES `procurement_bids` (`id`),
  CONSTRAINT `procurement_tender_decisions_tender_id_foreign` FOREIGN KEY (`tender_id`) REFERENCES `procurement_tenders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 232. product_categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `business_unit` enum('retail','farming','pharmacy','all','rental') DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `description` text,
  `icon_class` varchar(255) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 233. promotions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `promotions`;
CREATE TABLE `promotions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `type` enum('percentage','fixed','bogo','bundle','loyalty') NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `min_purchase_amount` decimal(15,2) DEFAULT '0.00',
  `applies_to` enum('all','category','product') DEFAULT 'all',
  `product_id` int(10) unsigned DEFAULT NULL,
  `category_id` int(10) unsigned DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `max_uses` int(11) DEFAULT '0',
  `current_uses` int(11) DEFAULT '0',
  `coupon_code` varchar(50) DEFAULT NULL,
  `requires_coupon` tinyint(1) DEFAULT '0',
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 234. public_tenders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_tenders`;
CREATE TABLE `public_tenders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(255) DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tender_number` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `opening_date` date DEFAULT NULL,
  `closing_date` date DEFAULT NULL,
  `contact_phone1` varchar(255) DEFAULT NULL,
  `contact_phone2` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `ceo_read` tinyint(1) DEFAULT '0',
  `purchase_read` tinyint(1) DEFAULT '0',
  `delivery_status` enum('PENDING','RECEIVED') DEFAULT 'PENDING',
  `payment_status` enum('PENDING','PAID') DEFAULT 'PENDING',
  `tender_type` varchar(255) DEFAULT 'multiple',
  `image_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 235. public_bids
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_bids`;
CREATE TABLE `public_bids` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `public_tender_id` int(10) unsigned DEFAULT NULL,
  `competitor_name` varchar(255) NOT NULL,
  `digital_signature_text` text,
  `hand_signature_path` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `delivery_time` varchar(255) DEFAULT NULL,
  `payment_terms` varchar(255) DEFAULT NULL,
  `bid_status` varchar(255) DEFAULT 'pending',
  `recommendation_reason` text,
  `ceo_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `public_bids_public_tender_id_foreign` (`public_tender_id`),
  CONSTRAINT `public_bids_public_tender_id_foreign` FOREIGN KEY (`public_tender_id`) REFERENCES `public_tenders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 236. public_tender_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_tender_items`;
CREATE TABLE `public_tender_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `public_tender_id` int(10) unsigned DEFAULT NULL,
  `object_type` varchar(255) NOT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `quantity` decimal(14,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `public_tender_items_public_tender_id_foreign` (`public_tender_id`),
  CONSTRAINT `public_tender_items_public_tender_id_foreign` FOREIGN KEY (`public_tender_id`) REFERENCES `public_tenders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 237. public_bid_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_bid_items`;
CREATE TABLE `public_bid_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `public_bid_id` int(10) unsigned DEFAULT NULL,
  `public_tender_item_id` int(10) unsigned DEFAULT NULL,
  `price_birr` bigint(20) NOT NULL,
  `price_cent` int(11) NOT NULL,
  `total_birr` bigint(20) NOT NULL,
  `total_cent` int(11) NOT NULL,
  `checkup` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `public_bid_items_public_bid_id_foreign` (`public_bid_id`),
  KEY `public_bid_items_public_tender_item_id_foreign` (`public_tender_item_id`),
  CONSTRAINT `public_bid_items_public_bid_id_foreign` FOREIGN KEY (`public_bid_id`) REFERENCES `public_bids` (`id`) ON DELETE CASCADE,
  CONSTRAINT `public_bid_items_public_tender_item_id_foreign` FOREIGN KEY (`public_tender_item_id`) REFERENCES `public_tender_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 238. public_deliveries
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_deliveries`;
CREATE TABLE `public_deliveries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `public_tender_id` int(10) unsigned NOT NULL,
  `status` enum('PENDING','RECEIVED','ISSUE_REPORTED') DEFAULT 'PENDING',
  `received_by` int(10) unsigned DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `notes` text,
  `store_read` tinyint(1) DEFAULT '0',
  `purchase_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `public_deliveries_public_tender_id_foreign` (`public_tender_id`),
  CONSTRAINT `public_deliveries_public_tender_id_foreign` FOREIGN KEY (`public_tender_id`) REFERENCES `public_tenders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 239. public_fund_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_fund_requests`;
CREATE TABLE `public_fund_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_code` varchar(255) NOT NULL,
  `status` enum('PENDING_CEO','APPROVED','REJECTED','READY_FOR_PAYMENT') DEFAULT 'PENDING_CEO',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `created_by` int(10) unsigned NOT NULL,
  `decided_by` int(10) unsigned DEFAULT NULL,
  `decision_reason` text,
  `decided_at` datetime DEFAULT NULL,
  `ceo_read` tinyint(1) DEFAULT '0',
  `finance_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_fund_requests_request_code_unique` (`request_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 240. public_fund_request_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_fund_request_items`;
CREATE TABLE `public_fund_request_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fund_request_id` int(10) unsigned NOT NULL,
  `public_tender_id` int(10) unsigned NOT NULL,
  `public_bid_id` int(10) unsigned NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `public_fund_request_items_fund_request_id_foreign` (`fund_request_id`),
  KEY `public_fund_request_items_public_tender_id_foreign` (`public_tender_id`),
  KEY `public_fund_request_items_public_bid_id_foreign` (`public_bid_id`),
  CONSTRAINT `public_fund_request_items_fund_request_id_foreign` FOREIGN KEY (`fund_request_id`) REFERENCES `public_fund_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `public_fund_request_items_public_bid_id_foreign` FOREIGN KEY (`public_bid_id`) REFERENCES `public_bids` (`id`) ON DELETE CASCADE,
  CONSTRAINT `public_fund_request_items_public_tender_id_foreign` FOREIGN KEY (`public_tender_id`) REFERENCES `public_tenders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 241. public_payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `public_payments`;
CREATE TABLE `public_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fund_request_id` int(10) unsigned NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING','PAID') DEFAULT 'PENDING',
  `paid_by` int(10) unsigned DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `receipt_code` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_payments_receipt_code_unique` (`receipt_code`),
  UNIQUE KEY `public_payments_fund_request_id_status_unique` (`fund_request_id`,`status`),
  CONSTRAINT `public_payments_fund_request_id_foreign` FOREIGN KEY (`fund_request_id`) REFERENCES `public_fund_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 242. purchase_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_number` varchar(20) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `order_date` date NOT NULL,
  `expected_delivery_date` date NOT NULL,
  `sector_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `notes` text,
  `attachment` varchar(255) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `po_number` (`po_number`),
  KEY `idx_po_number` (`po_number`),
  KEY `idx_po_supplier` (`supplier_id`),
  KEY `idx_po_status` (`status_id`),
  KEY `sector_id` (`sector_id`),
  KEY `approved_by` (`approved_by`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 243. purchase_quotations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `purchase_quotations`;
CREATE TABLE `purchase_quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_no` varchar(50) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `date_agreed` date DEFAULT NULL,
  `agreed_via` varchar(100) DEFAULT NULL,
  `notes` text,
  `status` enum('Recorded','Converted','Cancelled') DEFAULT 'Recorded',
  `recorded_by` int(11) DEFAULT NULL,
  `converted_to_delivery_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotation_no` (`quotation_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 244. push_subscriptions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `push_subscriptions`;
CREATE TABLE `push_subscriptions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `p256dh_key` varchar(255) NOT NULL,
  `auth_key` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 245. quotations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `quotations`;
CREATE TABLE `quotations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quote_number` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `opportunity_id` int(10) unsigned DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `status` enum('draft','sent','accepted','rejected','expired') DEFAULT 'draft',
  `valid_until` date DEFAULT NULL,
  `terms_conditions` text,
  `notes` text,
  `created_by` int(10) unsigned DEFAULT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `approved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unit` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotations_quote_number_unique` (`quote_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 246. quotation_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `quotation_items`;
CREATE TABLE `quotation_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quotation_id` int(10) unsigned NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `line_total` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_items_quotation_id_foreign` (`quotation_id`),
  CONSTRAINT `quotation_items_quotation_id_foreign` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 247. registered_computers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `registered_computers`;
CREATE TABLE `registered_computers` (
  `computer_id` varchar(10) NOT NULL,
  `computer_name` varchar(60) NOT NULL,
  `location` varchar(80) DEFAULT NULL,
  `department` varchar(40) DEFAULT NULL,
  `mac_address` varchar(17) DEFAULT NULL,
  `ip_range` varchar(20) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`computer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 248. rental_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `rental_messages`;
CREATE TABLE `rental_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sender_name` varchar(255) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `sender_phone` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 249. rental_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `rental_orders`;
CREATE TABLE `rental_orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `car_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `driver_name` varchar(255) NOT NULL,
  `driver_license` varchar(100) NOT NULL,
  `pickup_date` datetime NOT NULL,
  `return_date` datetime NOT NULL,
  `total_days` int(11) NOT NULL,
  `daily_rate` decimal(10,2) NOT NULL,
  `rental_amount` decimal(10,2) NOT NULL,
  `security_deposit` decimal(10,2) DEFAULT '5000.00',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'Cash',
  `status` varchar(50) DEFAULT 'PENDING_APPROVAL',
  `special_requests` text,
  `manager_note` text,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `payment_status` enum('UNPAID','PENDING_VERIFICATION','PAID') DEFAULT 'UNPAID',
  `payment_proof_url` varchar(255) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `finance_notes` text,
  `verified_amount` decimal(10,2) DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `verified_by_finance_at` datetime DEFAULT NULL,
  `extension_fee` decimal(10,2) DEFAULT '0.00',
  `damage_fee` decimal(10,2) DEFAULT '0.00',
  `fuel_fee` decimal(10,2) DEFAULT '0.00',
  `late_fee` decimal(10,2) DEFAULT '0.00',
  `refund_amount` decimal(10,2) DEFAULT '0.00',
  `additional_owed` decimal(10,2) DEFAULT '0.00',
  `actual_return_time` datetime DEFAULT NULL,
  `actual_return_odometer` int(11) DEFAULT NULL,
  `extended_return_date` datetime DEFAULT NULL,
  `pending_extension_days` int(11) DEFAULT NULL,
  `cancellation_reason` text,
  `is_cancellation_requested` tinyint(1) DEFAULT '0',
  `pickup_remarks` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rental_orders_order_number_unique` (`order_number`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 250. rental_settings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `rental_settings`;
CREATE TABLE `rental_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contact_phone1` varchar(255) DEFAULT NULL,
  `contact_phone2` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 251. report_submissions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `report_submissions`;
CREATE TABLE `report_submissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `report_type` enum('income_statement','balance_sheet','bank_reconciliation') NOT NULL,
  `period` varchar(7) NOT NULL,
  `financial_year` varchar(9) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `notes` text,
  `submitted_by` int(11) NOT NULL,
  `status` enum('draft','submitted','ceo_approved','board_approved','rejected') DEFAULT 'draft',
  `ceo_comment` text,
  `board_comment` text,
  `rejected_by` int(11) DEFAULT NULL,
  `rejection_reason` text,
  `ceo_actioned_by` int(11) DEFAULT NULL,
  `board_actioned_by` int(11) DEFAULT NULL,
  `ceo_actioned_at` timestamp NULL DEFAULT NULL,
  `board_actioned_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `report_submissions_submitted_by_foreign` (`submitted_by`),
  KEY `report_submissions_ceo_actioned_by_foreign` (`ceo_actioned_by`),
  KEY `report_submissions_board_actioned_by_foreign` (`board_actioned_by`),
  KEY `report_submissions_rejected_by_foreign` (`rejected_by`),
  CONSTRAINT `report_submissions_board_actioned_by_foreign` FOREIGN KEY (`board_actioned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `report_submissions_ceo_actioned_by_foreign` FOREIGN KEY (`ceo_actioned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `report_submissions_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `report_submissions_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 252. requisitions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `requisitions`;
CREATE TABLE `requisitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `req_no` varchar(30) NOT NULL,
  `drug_id` int(11) NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `unit_of_measure` varchar(50) DEFAULT 'Tablets',
  `quantity_requested` int(11) NOT NULL,
  `current_stock` int(11) NOT NULL COMMENT 'Pharmacy stock at time of request',
  `reorder_level` int(11) NOT NULL,
  `justification` text,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `requesting_dept` varchar(100) DEFAULT 'Pharmacy',
  `requested_by` int(11) NOT NULL,
  `requested_by_name` varchar(100) DEFAULT NULL,
  `rejection_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 253. retail_audit_trail
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_audit_trail`;
CREATE TABLE `retail_audit_trail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id` int(11) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `recipient` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 254. retail_branches
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_branches`;
CREATE TABLE `retail_branches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `address` text,
  `phone` varchar(50) DEFAULT NULL,
  `working_hours` varchar(100) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 255. retail_branch_products
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_branch_products`;
CREATE TABLE `retail_branch_products` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_branch_products_branch_id_product_id_unique` (`branch_id`,`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 256. retail_cart_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_cart_items`;
CREATE TABLE `retail_cart_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `product_id` int(10) unsigned DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 257. retail_categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_categories`;
CREATE TABLE `retail_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `icon_class` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_categories_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 258. retail_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_orders`;
CREATE TABLE `retail_orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `tax` decimal(12,2) DEFAULT '0.00',
  `delivery_fee` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `status` enum('PROCESSING','PACKING','SHIPPED','DELIVERED','CANCELLED') DEFAULT 'PROCESSING',
  `payment_status` enum('AWAITING_PAYMENT','PAID','OVERDUE') DEFAULT 'AWAITING_PAYMENT',
  `payment_method` enum('cash','bank_transfer','telebirr','credit') DEFAULT 'cash',
  `delivery_type` enum('pickup','delivery') DEFAULT 'pickup',
  `delivery_address` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_orders_invoice_number_unique` (`invoice_number`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 259. retail_products
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_products`;
CREATE TABLE `retail_products` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned DEFAULT NULL,
  `sku` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `stock_quantity` int(11) DEFAULT '0',
  `reorder_level` int(11) DEFAULT '10',
  `expiry_date` date DEFAULT NULL,
  `product_image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_products_sku_unique` (`sku`),
  KEY `retail_products_category_id_foreign` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 260. retail_order_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_order_items`;
CREATE TABLE `retail_order_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned DEFAULT NULL,
  `product_id` int(10) unsigned DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `retail_order_items_order_id_foreign` (`order_id`),
  KEY `retail_order_items_product_id_foreign` (`product_id`),
  CONSTRAINT `retail_order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `retail_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `retail_order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `retail_products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 261. retail_pos_carts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_pos_carts`;
CREATE TABLE `retail_pos_carts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cart_code` varchar(255) DEFAULT NULL,
  `cashier_id` int(11) DEFAULT NULL,
  `cashier_name` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_amount` decimal(12,2) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `telbir_number` varchar(255) DEFAULT NULL,
  `txn_id` varchar(255) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `items` text,
  `finance_submission_id` int(11) DEFAULT NULL,
  `store_request_id` int(11) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `sales_manager_signature` text,
  `signature_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_pos_carts_cart_code_unique` (`cart_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 262. retail_shifts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_shifts`;
CREATE TABLE `retail_shifts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id` int(10) unsigned DEFAULT NULL,
  `shift_type` enum('morning','afternoon','evening') DEFAULT 'morning',
  `opening_float` decimal(12,2) DEFAULT '0.00',
  `total_sales` decimal(12,2) DEFAULT '0.00',
  `transaction_count` int(11) DEFAULT '0',
  `cash_collected` decimal(12,2) DEFAULT '0.00',
  `telebirr_collected` decimal(12,2) DEFAULT '0.00',
  `transfer_collected` decimal(12,2) DEFAULT '0.00',
  `credit_collected` decimal(12,2) DEFAULT '0.00',
  `physical_cash_counted` decimal(12,2) DEFAULT NULL,
  `difference_amount` decimal(12,2) DEFAULT '0.00',
  `difference_reason` varchar(255) DEFAULT NULL,
  `status` enum('OPEN','CLOSED','VERIFIED') DEFAULT 'OPEN',
  `opened_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 263. retail_transactions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_transactions`;
CREATE TABLE `retail_transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `shift_id` int(10) unsigned DEFAULT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','bank_transfer','telebirr','credit') NOT NULL,
  `payment_ref` varchar(255) DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `customer_phone` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_submitted` tinyint(1) DEFAULT '0',
  `sale_type` varchar(255) DEFAULT 'WALK-IN',
  `received_by` varchar(255) DEFAULT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_phone` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `submission_ref` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `retail_transactions_invoice_number_unique` (`invoice_number`),
  KEY `retail_transactions_shift_id_foreign` (`shift_id`),
  CONSTRAINT `retail_transactions_shift_id_foreign` FOREIGN KEY (`shift_id`) REFERENCES `retail_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 264. retail_transaction_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_transaction_items`;
CREATE TABLE `retail_transaction_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `line_total` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 265. retail_update_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `retail_update_requests`;
CREATE TABLE `retail_update_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `old_data` json NOT NULL,
  `new_data` json NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 266. risk_register
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `risk_register`;
CREATE TABLE `risk_register` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `likelihood` enum('rare','unlikely','possible','likely','almost-certain') DEFAULT 'possible',
  `impact` enum('negligible','minor','moderate','major','severe') DEFAULT 'moderate',
  `risk_score` int(11) DEFAULT NULL,
  `status` enum('identified','assessed','mitigated','monitored','closed') DEFAULT 'identified',
  `owner` varchar(100) DEFAULT NULL,
  `mitigation_strategy` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 267. rma_returns
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `rma_returns`;
CREATE TABLE `rma_returns` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `return_number` varchar(50) NOT NULL,
  `original_sale_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `condition` enum('unopened','opened','damaged','defective') DEFAULT 'unopened',
  `restocking_fee` decimal(15,2) DEFAULT '0.00',
  `refund_method` enum('original','cash','store_credit','bank_transfer') DEFAULT 'original',
  `total_refund` decimal(15,2) DEFAULT '0.00',
  `status` enum('pending_review','approved','rejected','completed') DEFAULT 'pending_review',
  `reason` text,
  `processed_by` int(10) unsigned DEFAULT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `inspection_notes` text,
  `rejection_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rma_returns_return_number_unique` (`return_number`),
  KEY `rma_returns_original_sale_id_foreign` (`original_sale_id`),
  CONSTRAINT `rma_returns_original_sale_id_foreign` FOREIGN KEY (`original_sale_id`) REFERENCES `pos_sales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 268. rma_return_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `rma_return_items`;
CREATE TABLE `rma_return_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rma_return_id` int(10) unsigned NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `item_condition` enum('unopened','opened','damaged','defective') DEFAULT NULL,
  `refund_amount` decimal(15,2) NOT NULL,
  `reason_code` varchar(50) DEFAULT 'customer_return',
  PRIMARY KEY (`id`),
  KEY `rma_return_items_rma_return_id_foreign` (`rma_return_id`),
  CONSTRAINT `rma_return_items_rma_return_id_foreign` FOREIGN KEY (`rma_return_id`) REFERENCES `rma_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 269. roles
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `is_custom` tinyint(1) NOT NULL DEFAULT '0',
  `branch_scoped` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` int(10) unsigned DEFAULT NULL,
  `permissions` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 270. sales_messages
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sales_messages`;
CREATE TABLE `sales_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sender_name` varchar(255) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `sender_phone` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 271. sales_settings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sales_settings`;
CREATE TABLE `sales_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `contact_phone1` varchar(255) DEFAULT NULL,
  `contact_phone2` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 272. sales_store_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sales_store_requests`;
CREATE TABLE `sales_store_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_code` varchar(255) DEFAULT NULL,
  `material_id` varchar(255) DEFAULT NULL,
  `quantity_requested` int(11) DEFAULT NULL,
  `department` varchar(255) DEFAULT 'Sales',
  `created_by_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `quantity_shipped` int(11) DEFAULT '0',
  `signature` varchar(10000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_store_requests_request_code_unique` (`request_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 273. sales_targets
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sales_targets`;
CREATE TABLE `sales_targets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `business_unit_id` int(10) unsigned DEFAULT NULL,
  `target_date` date NOT NULL,
  `period` enum('daily','weekly','monthly','quarterly','yearly') NOT NULL,
  `target_amount` decimal(15,2) NOT NULL,
  `achieved_amount` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 274. sales_tenders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sales_tenders`;
CREATE TABLE `sales_tenders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `base_price` decimal(15,2) NOT NULL,
  `deadline` date NOT NULL,
  `status` varchar(255) DEFAULT 'open',
  `created_by` int(10) unsigned DEFAULT NULL,
  `posted_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 275. sales_tender_bids
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sales_tender_bids`;
CREATE TABLE `sales_tender_bids` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sales_tender_id` int(10) unsigned DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `bid_amount` decimal(15,2) NOT NULL,
  `notes` text,
  `signature_data` text,
  `status` varchar(255) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 276. sale_audit_log
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sale_audit_log`;
CREATE TABLE `sale_audit_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pos_sale_id` int(10) unsigned NOT NULL,
  `action` enum('created','approved','flagged','voided','refunded','manager_note') NOT NULL,
  `performed_by` int(10) unsigned NOT NULL,
  `action_details` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 277. sale_statuses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sale_statuses`;
CREATE TABLE `sale_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 278. sectors
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sectors`;
CREATE TABLE `sectors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 279. self_registered_suppliers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `self_registered_suppliers`;
CREATE TABLE `self_registered_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `category` varchar(200) NOT NULL,
  `business_address` text NOT NULL,
  `description` text,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_photo` varchar(255) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `payment_terms` varchar(50) DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT NULL,
  `location_type` varchar(50) DEFAULT NULL,
  `bank_name` varchar(200) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_account_holder` varchar(200) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `bank_account` varchar(255) DEFAULT NULL,
  `bank_holder` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `self_registered_suppliers_user_id_unique` (`user_id`),
  KEY `self_registered_suppliers_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 280. service_accounts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `service_accounts`;
CREATE TABLE `service_accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `scope` varchar(255) DEFAULT NULL,
  `owner_id` int(10) unsigned DEFAULT NULL,
  `secret_hash` varchar(255) DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `ip_whitelist` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `last_used` timestamp NULL DEFAULT NULL,
  `rotated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 281. sessions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(512) NOT NULL,
  `expires_at` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 282. session_anomalies
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `session_anomalies`;
CREATE TABLE `session_anomalies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) DEFAULT NULL,
  `anomaly_type` varchar(50) DEFAULT NULL,
  `description` text,
  `severity` varchar(20) DEFAULT NULL,
  `detected_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 283. settings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_settings_key` (`setting_key`),
  KEY `idx_settings_category` (`category`),
  KEY `updated_by` (`updated_by`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 284. single_roles
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `single_roles`;
CREATE TABLE `single_roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `module` varchar(255) DEFAULT NULL,
  `function` varchar(255) DEFAULT NULL,
  `scope` varchar(255) DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `single_roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 285. social_links
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `social_links`;
CREATE TABLE `social_links` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) NOT NULL,
  `url` varchar(255) DEFAULT NULL,
  `icon_color` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `social_links_platform_unique` (`platform`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 286. sod_rules
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sod_rules`;
CREATE TABLE `sod_rules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `function_a` varchar(255) DEFAULT NULL,
  `function_b` varchar(255) DEFAULT NULL,
  `severity` enum('CRITICAL','HIGH','MEDIUM','LOW') DEFAULT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 287. sod_violations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sod_violations`;
CREATE TABLE `sod_violations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `role_a_id` int(10) unsigned DEFAULT NULL,
  `role_b_id` int(10) unsigned DEFAULT NULL,
  `sod_rule_id` int(10) unsigned DEFAULT NULL,
  `status` varchar(20) DEFAULT 'open',
  `notes` text,
  `detected_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `remediated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 288. stamps
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stamps`;
CREATE TABLE `stamps` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `stamp_id` varchar(100) NOT NULL,
  `document_id` int(11) NOT NULL,
  `document_type` varchar(30) NOT NULL COMMENT 'REQUISITION, APPROVAL, ISSUE, GRN',
  `approved_by` int(11) NOT NULL,
  `approved_by_name` varchar(100) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stamps_stamp_id_unique` (`stamp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 289. stock_adjustments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_adjustments`;
CREATE TABLE `stock_adjustments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `adjustment_no` varchar(50) NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `adjustment_type` varchar(100) DEFAULT NULL,
  `quantity_before` int(11) DEFAULT NULL,
  `quantity_after` int(11) DEFAULT NULL,
  `adjustment_qty` int(11) DEFAULT NULL,
  `reason` text,
  `approval_code` varchar(100) DEFAULT NULL,
  `adjusted_by` int(10) unsigned DEFAULT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `adjustment_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `rejection_reason` text,
  `approved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_adjustments_drug_id_foreign` (`drug_id`),
  CONSTRAINT `stock_adjustments_drug_id_foreign` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 290. stock_counts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_counts`;
CREATE TABLE `stock_counts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `count_no` varchar(50) NOT NULL,
  `count_type` varchar(50) DEFAULT NULL,
  `count_date` date DEFAULT NULL,
  `counted_by` int(10) unsigned DEFAULT NULL,
  `verified_by` int(10) unsigned DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('PENDING','APPROVED','REJECTED','Draft','In Progress','Pending Verification','Verified','Closed') DEFAULT 'PENDING',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_counts_count_no_unique` (`count_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 291. stock_count_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_count_items`;
CREATE TABLE `stock_count_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `count_id` int(10) unsigned NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `system_quantity` int(11) DEFAULT NULL,
  `physical_quantity` int(11) DEFAULT NULL,
  `variance` int(11) DEFAULT NULL,
  `reason_code` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_count_items_count_id_foreign` (`count_id`),
  KEY `stock_count_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `stock_count_items_count_id_foreign` FOREIGN KEY (`count_id`) REFERENCES `stock_counts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_count_items_drug_id_foreign` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 292. stock_issues
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_issues`;
CREATE TABLE `stock_issues` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `issue_no` varchar(50) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `issued_to` varchar(150) DEFAULT NULL,
  `requisition_ref` varchar(50) DEFAULT NULL,
  `approval_ref` varchar(50) DEFAULT NULL,
  `issued_by` int(10) unsigned DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_issues_issue_no_unique` (`issue_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 293. stock_issue_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_issue_items`;
CREATE TABLE `stock_issue_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `issue_id` int(10) unsigned NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `unit_cost` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_issue_items_issue_id_foreign` (`issue_id`),
  KEY `stock_issue_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `stock_issue_items_drug_id_foreign` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`),
  CONSTRAINT `stock_issue_items_issue_id_foreign` FOREIGN KEY (`issue_id`) REFERENCES `stock_issues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 294. stock_receipts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_receipts`;
CREATE TABLE `stock_receipts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(50) NOT NULL,
  `supplier_id` int(10) unsigned DEFAULT NULL,
  `supplier_name` varchar(255) DEFAULT NULL,
  `purchase_order_ref` varchar(100) DEFAULT NULL,
  `delivery_note_ref` varchar(100) DEFAULT NULL,
  `received_by` int(10) unsigned DEFAULT NULL,
  `receipt_date` date DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_receipts_receipt_no_unique` (`receipt_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 295. stock_receipt_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_receipt_items`;
CREATE TABLE `stock_receipt_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `receipt_id` int(10) unsigned NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `manufacture_date` date DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT NULL,
  `storage_location` varchar(100) DEFAULT NULL,
  `near_expiry_days` int(11) DEFAULT '90',
  PRIMARY KEY (`id`),
  KEY `stock_receipt_items_receipt_id_foreign` (`receipt_id`),
  KEY `stock_receipt_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `stock_receipt_items_drug_id_foreign` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`),
  CONSTRAINT `stock_receipt_items_receipt_id_foreign` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 296. stock_transfers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transfers`;
CREATE TABLE `stock_transfers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transfer_no` varchar(50) NOT NULL,
  `from_location` varchar(255) DEFAULT NULL,
  `to_location` varchar(255) DEFAULT NULL,
  `transfer_type` varchar(50) DEFAULT NULL,
  `authorized_by` varchar(150) DEFAULT NULL,
  `created_by` int(10) unsigned DEFAULT NULL,
  `transfer_date` date DEFAULT NULL,
  `status` enum('Pending','Approved','In Transit','Received','Cancelled') DEFAULT 'Pending',
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_transfers_transfer_no_unique` (`transfer_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 297. stock_transfer_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transfer_items`;
CREATE TABLE `stock_transfer_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transfer_id` int(10) unsigned NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `stock_transfer_items_transfer_id_foreign` (`transfer_id`),
  KEY `stock_transfer_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `stock_transfer_items_drug_id_foreign` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`),
  CONSTRAINT `stock_transfer_items_transfer_id_foreign` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 298. stock_update_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_update_requests`;
CREATE TABLE `stock_update_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inventory_id` int(11) NOT NULL,
  `drug_id` int(11) NOT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `old_data` json NOT NULL,
  `new_data` json NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 299. store_requisitions
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_requisitions`;
CREATE TABLE `store_requisitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `requisition_no` varchar(50) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `requested_by` varchar(150) DEFAULT NULL,
  `priority` varchar(50) DEFAULT 'Normal',
  `status` enum('Pending','Approved','Issued','Rejected') DEFAULT 'Pending',
  `requisition_date` date DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_requisitions_requisition_no_unique` (`requisition_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 300. store_approved_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_approved_requests`;
CREATE TABLE `store_approved_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `approval_no` varchar(50) NOT NULL,
  `requisition_id` int(10) unsigned DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `approved_by` varchar(150) DEFAULT NULL,
  `approval_date` date DEFAULT NULL,
  `stamp_id` varchar(50) DEFAULT NULL,
  `status` enum('Active','Fulfilled','Cancelled') DEFAULT 'Active',
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_approved_requests_approval_no_unique` (`approval_no`),
  KEY `store_approved_requests_requisition_id_foreign` (`requisition_id`),
  CONSTRAINT `store_approved_requests_requisition_id_foreign` FOREIGN KEY (`requisition_id`) REFERENCES `store_requisitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 301. store_approved_request_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_approved_request_items`;
CREATE TABLE `store_approved_request_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `approval_id` int(10) unsigned NOT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `drug_id` int(10) unsigned DEFAULT NULL,
  `quantity_approved` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `store_approved_request_items_approval_id_foreign` (`approval_id`),
  KEY `store_approved_request_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `store_approved_request_items_approval_id_foreign` FOREIGN KEY (`approval_id`) REFERENCES `store_approved_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_approved_request_items_drug_id_foreign` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 302. store_staff
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_staff`;
CREATE TABLE `store_staff` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `staff_no` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `performance` varchar(50) DEFAULT 'Good',
  `assigned_tasks` int(11) DEFAULT '0',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_staff_staff_no_unique` (`staff_no`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 303. store_attendance
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_attendance`;
CREATE TABLE `store_attendance` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` int(10) unsigned NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('Present','Absent','Late','Leave') DEFAULT 'Present',
  `reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `store_attendance_staff_id_foreign` (`staff_id`),
  CONSTRAINT `store_attendance_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `store_staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 304. store_deliveries
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_deliveries`;
CREATE TABLE `store_deliveries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `delivery_no` varchar(50) NOT NULL,
  `supplier_name` varchar(255) DEFAULT NULL,
  `items_description` text,
  `quantity_summary` varchar(100) DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `po_reference` varchar(100) DEFAULT NULL,
  `status` enum('Pending','In Transit','Received','Rejected') DEFAULT 'Pending',
  `rejection_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_deliveries_delivery_no_unique` (`delivery_no`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 305. store_inventory
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_inventory`;
CREATE TABLE `store_inventory` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `drug_id` int(10) unsigned NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `min_level` int(11) NOT NULL DEFAULT '0',
  `max_level` int(11) DEFAULT '0',
  `warehouse_id` int(11) DEFAULT NULL,
  `reserved_quantity` int(11) DEFAULT NULL,
  `selling_price` decimal(12,2) DEFAULT NULL,
  `manufacture_date` date DEFAULT NULL,
  `notes` text,
  `stock_status` enum('In Stock','Low Stock','Out of Stock','Expired') DEFAULT NULL,
  `reorder_level` int(11) DEFAULT '0',
  `batch_no` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `storage_location` varchar(100) DEFAULT NULL,
  `last_received_at` timestamp NULL DEFAULT NULL,
  `last_issued_at` timestamp NULL DEFAULT NULL,
  `near_expiry_days` int(11) DEFAULT '90',
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_inventory_drug_warehouse_batch_unique` (`drug_id`,`warehouse_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 306. store_purchase_research
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_purchase_research`;
CREATE TABLE `store_purchase_research` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_number` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity_requested` int(11) NOT NULL DEFAULT '1',
  `reason` text,
  `current_stock` int(11) DEFAULT '0',
  `requested_by` int(11) NOT NULL,
  `ceo_handler` int(11) DEFAULT NULL,
  `market_handler` int(11) DEFAULT NULL,
  `ceo_instructions` text,
  `research_findings` text,
  `research_prices` text,
  `research_suppliers` text,
  `research_quality` text,
  `research_availability` text,
  `research_notes` text,
  `research_attachments` json DEFAULT NULL,
  `rejection_reason` text,
  `approval_instructions` text,
  `status` enum('PENDING_PURCHASE','PENDING_CEO','MARKET_STUDY','RESULTS_SUBMITTED','APPROVED','REJECTED') DEFAULT 'PENDING_PURCHASE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_number` (`request_number`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 307. store_requisition_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_requisition_items`;
CREATE TABLE `store_requisition_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `requisition_id` int(10) unsigned NOT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `drug_id` int(10) unsigned DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `quantity_approved` int(11) DEFAULT NULL,
  `quantity_issued` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `store_requisition_items_requisition_id_foreign` (`requisition_id`),
  KEY `store_requisition_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `store_requisition_items_drug_id_foreign` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`),
  CONSTRAINT `store_requisition_items_requisition_id_foreign` FOREIGN KEY (`requisition_id`) REFERENCES `store_requisitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 308. store_sales_records
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_sales_records`;
CREATE TABLE `store_sales_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sale_code` varchar(100) DEFAULT NULL,
  `request_id` int(10) unsigned NOT NULL,
  `product_id` varchar(100) DEFAULT NULL,
  `product_name` varchar(300) DEFAULT NULL,
  `quantity_sold` int(11) NOT NULL,
  `sold_by_id` int(10) unsigned DEFAULT NULL,
  `sold_by_name` varchar(300) DEFAULT NULL,
  `customer_name` varchar(300) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `unit_value` decimal(14,2) DEFAULT NULL,
  `total_value` decimal(14,2) DEFAULT NULL,
  `sale_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_sales_records_sale_code_unique` (`sale_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 309. store_sales_releases
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_sales_releases`;
CREATE TABLE `store_sales_releases` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_id` int(10) unsigned NOT NULL,
  `released_by_id` int(10) unsigned DEFAULT NULL,
  `released_by_name` varchar(300) DEFAULT NULL,
  `quantity_released` int(11) NOT NULL,
  `remaining_stock` decimal(14,2) DEFAULT NULL,
  `release_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 310. store_sales_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_sales_requests`;
CREATE TABLE `store_sales_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_code` varchar(100) DEFAULT NULL,
  `store_module` varchar(50) DEFAULT 'general_store',
  `product_id` varchar(100) DEFAULT NULL,
  `product_name` varchar(300) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `quantity_requested` int(11) NOT NULL,
  `customer_name` varchar(300) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `requested_by_id` int(10) unsigned DEFAULT NULL,
  `requested_by_name` varchar(300) DEFAULT NULL,
  `digital_signature` text,
  `signature_timestamp` timestamp NULL DEFAULT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `status` enum('Pending','Approved','Released','Sold','Rejected') DEFAULT 'Pending',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cart_items` text,
  `retail_cart_id` int(11) DEFAULT NULL,
  `store_keeper_signature` text,
  `store_keeper_notes` text,
  `payment_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_sales_requests_request_code_unique` (`request_code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 311. store_suppliers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `store_suppliers`;
CREATE TABLE `store_suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_no` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `tax_id` varchar(100) DEFAULT NULL,
  `payment_terms` varchar(50) DEFAULT 'Net 30',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `delivery_count` int(11) DEFAULT '0',
  `balance` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_suppliers_supplier_no_unique` (`supplier_no`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 312. suppliers
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `contact_person` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `payment_terms_id` int(11) DEFAULT NULL,
  `lead_time_days` int(11) DEFAULT '7',
  `tax_id` varchar(50) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_suppliers_name` (`name`),
  KEY `idx_suppliers_active` (`is_active`),
  KEY `payment_terms_id` (`payment_terms_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 313. supplier_catalog
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `supplier_catalog`;
CREATE TABLE `supplier_catalog` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `awarded_unit_price` decimal(15,2) NOT NULL,
  `currency` varchar(255) DEFAULT 'ETB',
  `effective_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 314. supplier_credit_limits
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `supplier_credit_limits`;
CREATE TABLE `supplier_credit_limits` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `credit_limit` decimal(15,2) NOT NULL,
  `current_utilization` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(3) DEFAULT 'ETB',
  `payment_terms_days` int(11) DEFAULT '30',
  `interest_rate` decimal(5,2) DEFAULT '0.00',
  `review_date` date DEFAULT NULL,
  `status` enum('active','suspended','closed') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `supplier_credit_limits_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `supplier_credit_limits_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 315. supplier_documents
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `supplier_documents`;
CREATE TABLE `supplier_documents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `document_type` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 316. support_tickets
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `admin_reply` text,
  `replied_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 317. tax_details
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tax_details`;
CREATE TABLE `tax_details` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `liability_id` int(10) unsigned NOT NULL,
  `tax_type` varchar(255) NOT NULL,
  `tax_period` varchar(255) DEFAULT NULL,
  `receipt_no` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tax_details_liability_id_foreign` (`liability_id`),
  CONSTRAINT `tax_details_liability_id_foreign` FOREIGN KEY (`liability_id`) REFERENCES `liabilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 318. tax_receipts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tax_receipts`;
CREATE TABLE `tax_receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `serial_number` varchar(20) NOT NULL,
  `order_id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_type_id` int(11) NOT NULL,
  `approval_amount_total` int(11) NOT NULL,
  `used_count` int(11) DEFAULT '0',
  `remaining` int(11) NOT NULL,
  `approved_date` date NOT NULL,
  `approval_document` varchar(255) NOT NULL,
  `printed_by` int(11) NOT NULL,
  `printed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `idx_tax_serial` (`serial_number`),
  KEY `idx_tax_order` (`order_id`),
  KEY `customer_type_id` (`customer_type_id`),
  KEY `printed_by` (`printed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 319. tax_registrations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tax_registrations`;
CREATE TABLE `tax_registrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tax_type` varchar(30) NOT NULL,
  `registration_number` varchar(50) NOT NULL,
  `registration_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `rate` decimal(5,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 320. tenants
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tenants`;
CREATE TABLE `tenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `isolation` enum('logical','schema','database','instance') DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 321. test1
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `test1`;
CREATE TABLE `test1` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 322. test2
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `test2`;
CREATE TABLE `test2` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `test1_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test2_test1_id_foreign` (`test1_id`),
  CONSTRAINT `test2_test1_id_foreign` FOREIGN KEY (`test1_id`) REFERENCES `test1` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 323. three_way_matches
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `three_way_matches`;
CREATE TABLE `three_way_matches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `expense_id` int(11) DEFAULT NULL,
  `po_id` int(11) NOT NULL,
  `grn_id` int(10) unsigned DEFAULT NULL,
  `match_status` enum('pending','matched','mismatch','partial') DEFAULT 'pending',
  `po_amount` decimal(15,2) DEFAULT NULL,
  `grn_amount` decimal(15,2) DEFAULT NULL,
  `invoice_amount` decimal(15,2) DEFAULT NULL,
  `variance_amount` decimal(15,2) DEFAULT NULL,
  `variance_reason` text,
  `matched_by` int(10) unsigned DEFAULT NULL,
  `matched_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `three_way_matches_expense_id_foreign` (`expense_id`),
  KEY `three_way_matches_po_id_foreign` (`po_id`),
  CONSTRAINT `three_way_matches_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `three_way_matches_po_id_foreign` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 324. tractors
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tractors`;
CREATE TABLE `tractors` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `daily_rate` decimal(10,2) DEFAULT '0.00',
  `tractor_type` varchar(255) DEFAULT 'Standard',
  `transmission` varchar(255) DEFAULT 'Manual',
  `fuel_type` varchar(255) DEFAULT 'Diesel',
  `description` text,
  `availability` varchar(255) DEFAULT 'Available',
  `asset_value` decimal(15,2) DEFAULT '0.00',
  `image1` varchar(255) DEFAULT NULL,
  `image2` varchar(255) DEFAULT NULL,
  `image3` varchar(255) DEFAULT NULL,
  `image4` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 325. transfer_requests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `transfer_requests`;
CREATE TABLE `transfer_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `request_code` varchar(255) NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `requested_qty` int(11) NOT NULL,
  `pharmacy_qty_at_request` int(11) NOT NULL,
  `store_qty_at_request` int(11) NOT NULL,
  `urgency` enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
  `status` enum('PENDING_APPROVAL','APPROVED','REJECTED','SHIPPED','COMPLETED','CANCELLED','Requested','In Transit','Received','Closed') NOT NULL DEFAULT 'Requested',
  `created_by` int(10) unsigned NOT NULL,
  `decided_by` int(10) unsigned DEFAULT NULL,
  `decision_reason` text,
  `shipped_by` int(10) unsigned DEFAULT NULL,
  `shipped_qty` int(11) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `received_by` int(10) unsigned DEFAULT NULL,
  `received_qty` int(11) DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `transfer_no` varchar(50) DEFAULT NULL,
  `from_branch_id` int(11) DEFAULT NULL,
  `from_warehouse_id` int(11) DEFAULT NULL,
  `to_branch_id` int(11) DEFAULT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `ceo_approved_by` int(11) DEFAULT NULL,
  `requested_date` date DEFAULT NULL,
  `decision_date` date DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `reason` text,
  `signature` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_requests_request_code_unique` (`request_code`),
  KEY `transfer_requests_drug_id_foreign` (`drug_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 326. transfer_items
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `transfer_items`;
CREATE TABLE `transfer_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transfer_request_id` int(10) unsigned NOT NULL,
  `drug_id` int(10) unsigned NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `batch_no` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `transfer_items_transfer_request_id_foreign` (`transfer_request_id`),
  KEY `transfer_items_drug_id_foreign` (`drug_id`),
  CONSTRAINT `transfer_items_transfer_request_id_foreign` FOREIGN KEY (`transfer_request_id`) REFERENCES `transfer_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 327. units
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `units`;
CREATE TABLE `units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `abbreviation` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 328. user_roles
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `sub_role` varchar(100) DEFAULT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `idx_user_roles_user` (`user_id`),
  KEY `idx_user_roles_role` (`role_id`),
  KEY `assigned_by` (`assigned_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 329. user_statuses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `user_statuses`;
CREATE TABLE `user_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `sort_order` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- 330. view_manager_attendance
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `view_manager_attendance`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_manager_attendance` AS select `fs`.`id` AS `shift_id`,`fs`.`worker_id` AS `worker_id`,`u`.`full_name` AS `manager_name`,`u`.`phone` AS `manager_phone`,`fs`.`shift_type` AS `shift_type`,`fs`.`clocked_in_at` AS `clocked_in_at`,`fs`.`clocked_out_at` AS `clocked_out_at`,timestampdiff(MINUTE,`fs`.`clocked_in_at`,coalesce(`fs`.`clocked_out_at`,now())) AS `duration_minutes`,cast(`fs`.`clocked_in_at` as date) AS `work_date`,`fs`.`status` AS `status` from (`farming_shifts` `fs` left join `users` `u` on((`fs`.`worker_id` = `u`.`id`))) where (`fs`.`clocked_in_at` is not null) order by `fs`.`clocked_in_at` desc;

-- ------------------------------------------------------------
-- 331. warehouses
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE `warehouses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `address` text,
  `phone` varchar(50) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `warehouses_name_unique` (`name`),
  UNIQUE KEY `warehouses_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- TOTAL: 331 tables exported
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;