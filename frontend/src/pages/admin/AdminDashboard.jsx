import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import adminService from '../../services/adminService';
import AdminHome from './AdminHome';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import CentralAuditLog from './CentralAuditLog';
import BackupManagement from './BackupManagement';
import DisasterRecovery from './DisasterRecovery';
import ContactMessagesManager from './ContactMessagesManager';
import AlertCenter from './AlertCenter';
import SystemJobs from './SystemJobs';
import SystemHealth from './SystemHealth';
import DataImportExport from './DataImportExport';
import Maintenance from './Maintenance';
import Integrations from './Integrations';
import DangerZone from './DangerZone';
import ManagerChat from '../../components/ManagerChat';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    let timer;
    const fetchUnread = async () => {
      try {
        const res = await adminService.getUnreadAlertCount();
        setUnreadAlerts(res.data?.data?.unread || 0);
      } catch (err) {
        /* sidebar badge is best-effort */
      }
    };
    fetchUnread();
    timer = setInterval(fetchUnread, 60000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { label: 'Overview',       path: '/admin/overview',       icon: 'home' },
    { type: 'divider' },
    { label: 'Users',          path: '/admin/users',          icon: 'users' },
    { type: 'divider' },
    { label: 'Alert Center',   path: '/admin/alerts',         icon: 'bell', badge: unreadAlerts },
    { label: 'System Jobs',    path: '/admin/system-jobs',    icon: 'clock' },
    { label: 'System Health',  path: '/admin/system-health',  icon: 'activity' },
    { label: 'Import / Export', path: '/admin/import-export',  icon: 'upload-cloud' },
    { label: 'Backups',        path: '/admin/backups',        icon: 'hard-drive' },
    { label: 'Disaster Recovery', path: '/admin/dr',          icon: 'shield' },
    { label: 'Maintenance',     path: '/admin/maintenance',    icon: 'tool' },
    { label: 'Settings',       path: '/admin/settings',       icon: 'sliders' },
    { label: 'Integrations',   path: '/admin/integrations',   icon: 'git-branch' },
    { type: 'divider' },
    { label: 'Danger Zone',    path: '/admin/danger-zone',    icon: 'alert-octagon', color: '#DC2626' },
    { type: 'divider' },
    { label: 'Contact', icon: 'message-circle', children: [
      { label: 'Contact Messages', path: '/admin/contact-messages', icon: 'inbox' },
      { label: 'Chat', path: '/admin/chat', icon: 'message-square', color: '#6B8E23' }
    ] },
    { type: 'divider' },
    { label: 'Audit Logs',     path: '/admin/audit',          icon: 'clipboard' },
  ];

  return (
    <div className={styles.adminDashboard}>
      <DashboardLayout menuItems={menuItems} title="Admin Dashboard">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<AdminHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="dr" element={<DisasterRecovery />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="system-jobs" element={<SystemJobs />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="import-export" element={<DataImportExport />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="audit" element={<CentralAuditLog />} />
            <Route path="contact-messages" element={<ContactMessagesManager />} />
            <Route path="chat" element={<ManagerChat />} />
            <Route path="backups" element={<BackupManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="danger-zone" element={<DangerZone />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default AdminDashboard;
