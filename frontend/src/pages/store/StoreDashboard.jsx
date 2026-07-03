import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// New Home
import StoreHomeNew from './StoreHomeNew';

// Stock Operations (Menu Items 1-7)
import StoreStockList from './StoreStockList';
import StoreGoodsReceiving from './StoreGoodsReceiving';
import StoreGoodsIssue from './StoreGoodsIssue';
import StoreStockTransfer from './StoreStockTransfer';
import StoreStockAdjustment from './StoreStockAdjustment';
import StorePhysicalCount from './StorePhysicalCount';
import StoreStockMovement from './StoreStockMovement';

// Requests Section (Menu Items 8-12)
import StoreRequisitions from './StoreRequisitions';
import StorePendingRequests from './StorePendingRequests';
import StoreApprovedRequests from './StoreApprovedRequests';
import StoreRequestHistory from './StoreRequestHistory';
import StoreCountHistory from './StoreCountHistory';

import styles from './StoreDashboard.module.css';

const StoreDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/store/overview', icon: 'home' },
    { type: 'divider' },
    {
      label: 'Stock Operations', icon: 'package',
      children: [
        { label: '1. Stock List',       path: '/store/stock-list',        icon: 'list',          color: '#3b82f6' },
        { label: '2. Goods Receiving',  path: '/store/goods-receiving',   icon: 'truck',         color: '#22c55e' },
        { label: '3. Goods Issue',      path: '/store/goods-issue',       icon: 'arrow-up-right',color: '#f59e0b' },
        { label: '4. Stock Transfer',   path: '/store/stock-transfer',    icon: 'arrow-left-right', color: '#8b5cf6' },
        { label: '5. Stock Adjustment', path: '/store/stock-adjustment',  icon: 'sliders',       color: '#f97316' },
        { label: '6. Physical Count',   path: '/store/physical-count',    icon: 'clipboard-check', color: '#06b6d4' },
        { label: '7. Stock Movement',   path: '/store/stock-movement',    icon: 'activity',      color: '#14b8a6' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Requests Section', icon: 'clipboard',
      children: [
        { label: '8. Requisitions',         path: '/store/requisitions',        icon: 'file-text',    color: '#6366f1' },
        { label: '9. Pending Requests',     path: '/store/pending-requests',    icon: 'clock',        color: '#f59e0b' },
        { label: '10. Approved Requests',   path: '/store/approved-requests',   icon: 'check-circle', color: '#22c55e' },
        { label: '11. Request History',     path: '/store/request-history',     icon: 'book-open',    color: '#64748b' },
        { label: '12. Count History',       path: '/store/count-history',       icon: 'archive',      color: '#8b5cf6' },
      ]
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="📦 Inventory (Store) Dashboard">
        <Routes>
          {/* Home */}
          <Route path="overview" element={<StoreHomeNew />} />

          {/* Stock Operations: Menu Items 1-7 */}
          <Route path="stock-list"        element={<StoreStockList />} />
          <Route path="goods-receiving"   element={<StoreGoodsReceiving />} />
          <Route path="goods-issue"       element={<StoreGoodsIssue />} />
          <Route path="stock-transfer"    element={<StoreStockTransfer />} />
          <Route path="stock-adjustment"  element={<StoreStockAdjustment />} />
          <Route path="physical-count"    element={<StorePhysicalCount />} />
          <Route path="stock-movement"    element={<StoreStockMovement />} />

          {/* Requests Section: Menu Items 8-12 */}
          <Route path="requisitions"      element={<StoreRequisitions />} />
          <Route path="pending-requests"  element={<StorePendingRequests />} />
          <Route path="approved-requests" element={<StoreApprovedRequests />} />
          <Route path="request-history"   element={<StoreRequestHistory />} />
          <Route path="count-history"     element={<StoreCountHistory />} />

          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default StoreDashboard;
