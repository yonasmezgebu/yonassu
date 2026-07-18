import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// New Home
import StoreHomeNew from './StoreHomeNew';

// Stock Operations (Menu Items 1-7)
import StoreStockList from './StoreStockList';
import StoreAddNewStock from './StoreAddNewStock';
import StoreGoodsReceiving from './StoreGoodsReceiving';
import StoreGoodsIssue from './StoreGoodsIssue';
import StoreStockTransfer from './StoreStockTransfer';
import StoreStockAdjustment from './StoreStockAdjustment';
import StorePhysicalCount from './StorePhysicalCount';
import StoreStockMovement from './StoreStockMovement';

// New Pages
import StoreRealTimeAccess from './StoreRealTimeAccess';
import StoreQuickAction from './StoreQuickAction';
import StoreGoodsReceivedToday from './StoreGoodsReceivedToday';
import StoreGoodsIssuedToday from './StoreGoodsIssuedToday';
import StoreTransfersList from './StoreTransfersList';

// Monitoring & Reports
import StoreReports from './StoreReports';
import StoreAlerts from './StoreAlerts';
import StoreAuditTrail from './StoreAuditTrail';

import styles from './StoreDashboard.module.css';

const PharmacyStoreDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy-store/overview', icon: 'home' },
    { type: 'divider' },
    {
      label: 'Stock Operations', icon: 'package',
      children: [
        { label: '1. Stock List',       path: '/pharmacy-store/stock-list',        icon: 'list',             color: '#3b82f6' },
        { label: 'Add New Stock',       path: '/pharmacy-store/add-new-stock',     icon: 'plus',             color: '#059669' },
        { label: '2. Goods Receiving',  path: '/pharmacy-store/goods-receiving',   icon: 'truck',            color: '#22c55e' },
        { label: '3. Goods Issue',      path: '/pharmacy-store/goods-issue',       icon: 'arrow-up-right',   color: '#f59e0b' },
        { label: '4. Stock Transfer',   path: '/pharmacy-store/stock-transfer',    icon: 'arrow-left-right', color: '#8b5cf6' },
        { label: '5. Stock Adjustment', path: '/pharmacy-store/stock-adjustment',  icon: 'sliders',          color: '#f97316' },
        { label: '6. Physical Count',   path: '/pharmacy-store/physical-count',    icon: 'clipboard-check',  color: '#06b6d4' },
        { label: '7. Stock Movement',   path: '/pharmacy-store/stock-movement',    icon: 'activity',         color: '#14b8a6' },
        { label: '8. Requests',         path: '/pharmacy-store/requests',          icon: 'clipboard',        color: '#6366f1' },
        { label: '9. Operation',        path: '/pharmacy-store/operation',         icon: 'settings',         color: '#8b5cf6' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Monitoring & Reports', icon: 'shield',
      children: [
        { label: 'Report',      path: '/pharmacy-store/reports',     icon: 'file-text', color: '#3b82f6' },
        { label: 'Alert',       path: '/pharmacy-store/alerts',      icon: 'bell',      color: '#ef4444' },
        { label: 'Audit Trail', path: '/pharmacy-store/audit-trail', icon: 'lock',      color: '#10b981' },
      ]
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="💊 Pharmacy Store Keeper Dashboard">
        <Routes>
          {/* Home & New Pages */}
          <Route path="overview"            element={<StoreHomeNew />} />
          <Route path="real-time-access"    element={<StoreRealTimeAccess />} />
          <Route path="quick-action"        element={<StoreQuickAction />} />
          <Route path="goods-received-today" element={<StoreGoodsReceivedToday />} />
          <Route path="goods-issued-today"  element={<StoreGoodsIssuedToday />} />
          <Route path="transfers-list"      element={<StoreTransfersList />} />

          {/* Stock Operations */}
          <Route path="stock-list"        element={<StoreStockList />} />
          <Route path="add-new-stock"     element={<StoreAddNewStock />} />
          <Route path="goods-receiving"   element={<StoreGoodsReceiving />} />
          <Route path="goods-issue"       element={<StoreGoodsIssue />} />
          <Route path="stock-transfer"    element={<StoreStockTransfer />} />
          <Route path="stock-adjustment"  element={<StoreStockAdjustment />} />
          <Route path="physical-count"    element={<StorePhysicalCount />} />
          <Route path="stock-movement"    element={<StoreStockMovement />} />

          {/* Monitoring & Reports */}
          <Route path="reports"     element={<StoreReports />} />
          <Route path="alerts"      element={<StoreAlerts />} />
          <Route path="audit-trail" element={<StoreAuditTrail />} />

          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default PharmacyStoreDashboard;
