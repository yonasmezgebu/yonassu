import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminHome from './AdminHome';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import AuditLogs from './AuditLogs';
import BackupManagement from './BackupManagement';
import RoleDesigner from './RoleDesigner';
import TenantManagement from './TenantManagement';
import DisasterRecovery from './DisasterRecovery';
import ApiKeyManagement from './ApiKeyManagement';
import GalleryManager from './GalleryManager';
import NewsManager from './NewsManager';
import ContactMessagesManager from './ContactMessagesManager';
import AlertCenter from './AlertCenter';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const menuItems = [
    { label: 'Overview',       path: '/admin/overview',       icon: 'home' },
    { type: 'divider' },
    { label: 'Users',          path: '/admin/users',          icon: 'users' },
    { label: 'Role Designer',  path: '/admin/role-designer',  icon: 'settings' },
    { label: 'API Keys',       path: '/admin/api-keys',       icon: 'key' },
    { type: 'divider' },
    { label: 'Tenants',        path: '/admin/tenants',        icon: 'database' },
    { label: 'Audit Logs',     path: '/admin/audit',          icon: 'clipboard' },
    { label: 'Alert Center',   path: '/admin/alerts',         icon: 'bell' },
    { label: 'Backups',        path: '/admin/backups',        icon: 'hard-drive' },
    { label: 'Disaster Recovery', path: '/admin/dr',          icon: 'shield' },
    { label: 'Settings',       path: '/admin/settings',       icon: 'sliders' },
    { type: 'divider' },
    { label: 'Gallery',        path: '/admin/gallery',        icon: 'image' },
    { label: 'News & Notices', path: '/admin/news',           icon: 'file-text' },
    { label: 'Contact Messages', path: '/admin/contact-messages', icon: 'message-circle' },
  ];

  return (
    <div className={styles.adminDashboard}>
      <DashboardLayout menuItems={menuItems} title="Admin Dashboard">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<AdminHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="role-designer" element={<RoleDesigner />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="dr" element={<DisasterRecovery />} />
            <Route path="api-keys" element={<ApiKeyManagement />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="gallery" element={<GalleryManager />} />
            <Route path="news" element={<NewsManager />} />
            <Route path="contact-messages" element={<ContactMessagesManager />} />
            <Route path="backups" element={<BackupManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default AdminDashboard;
