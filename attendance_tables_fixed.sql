SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8;

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
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
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `bank_account_number` (`bank_account_number`),
  KEY `hr_employees_dept_id_foreign` (`dept_id`),
  KEY `hr_employees_unit_id_foreign` (`unit_id`),
  KEY `hr_employees_position_id_foreign` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
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

-- view_manager_attendance (VIEW) - requires farming_shifts + users tables
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_manager_attendance` AS select `fs`.`id` AS `shift_id`,`fs`.`worker_id` AS `worker_id`,`u`.`full_name` AS `manager_name`,`u`.`phone` AS `manager_phone`,`fs`.`shift_type` AS `shift_type`,`fs`.`clocked_in_at` AS `clocked_in_at`,`fs`.`clocked_out_at` AS `clocked_out_at`,timestampdiff(MINUTE,`fs`.`clocked_in_at`,coalesce(`fs`.`clocked_out_at`,now())) AS `duration_minutes`,cast(`fs`.`clocked_in_at` as date) AS `work_date`,`fs`.`status` AS `status` from (`farming_shifts` `fs` left join `users` `u` on((`fs`.`worker_id` = `u`.`id`))) where (`fs`.`clocked_in_at` is not null) order by `fs`.`clocked_in_at` desc;

SET FOREIGN_KEY_CHECKS = 1;