import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

import {
  GSHome,
  GSInventory,
  GSRegisterItem,
  GSIssueItem,
  GSLogs,
  GSValuation,
  GSAlerts,
} from './GeneralStoreOperations';

import StoreReports from './StoreReports';

import styles from './StoreDashboard.module.css';

const GeneralStoreDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/general-store/overview', icon: 'home' },
    { type: 'divider' },
    {
      label: 'Stock Operations', icon: 'package',
      children: [
        { label: '1. Consumables Inventory', path: '/general-store/inventory',        icon: 'list',           color: '#3b82f6' },
        { label: '2. Register New Item',     path: '/general-store/register',         icon: 'plus',           color: '#22c55e' },
        { label: '3. Issue to Department',   path: '/general-store/issue',            icon: 'arrow-up-right', color: '#f59e0b' },
        { label: '4. Low Stock Alerts',      path: '/general-store/alerts',           icon: 'bell',           color: '#ef4444' },
        { label: '5. Movement Logs',         path: '/general-store/logs',             icon: 'list',           color: '#6366f1' },
        { label: '6. Stock Valuation',       path: '/general-store/valuation',        icon: 'dollar-sign',    color: '#8b5cf6' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Monitoring & Reports', icon: 'shield',
      children: [
        { label: 'Report',      path: '/general-store/reports',     icon: 'file-text', color: '#3b82f6' },
      ]
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="🏪 General Store Keeper Dashboard">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="overview"     element={<GSHome />} />
            <Route path="inventory"    element={<GSInventory />} />
            <Route path="register"     element={<GSRegisterItem />} />
            <Route path="issue"        element={<GSIssueItem />} />
            <Route path="alerts"       element={<GSAlerts />} />
            <Route path="logs"         element={<GSLogs />} />
            <Route path="valuation"    element={<GSValuation />} />
            <Route path="reports"      element={<StoreReports />} />
            <Route path="*"            element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default GeneralStoreDashboard;
