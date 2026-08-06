import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { NotifToastContainer } from './StoreHomeNew';

// New Home
import StoreHomeNew from './StoreHomeNew';

// Stock Operations
import StoreStockList from './StoreStockList';
import StoreAddNewStock from './StoreAddNewStock';
import StoreGoodsReceiving from './StoreGoodsReceiving';
import StoreGoodsIssue from './StoreGoodsIssue';

import StoreStockAdjustment from './StoreStockAdjustment';
import StorePhysicalCount from './StorePhysicalCount';
import StoreStockMovement from './StoreStockMovement';

// Quick/Real-time Views
import StoreRealTimeAccess from './StoreRealTimeAccess';
import StoreQuickAction from './StoreQuickAction';
import StoreGoodsReceivedToday from './StoreGoodsReceivedToday';
import StoreGoodsIssuedToday from './StoreGoodsIssuedToday';


// Monitoring & Reports
import StoreReports from './StoreReports';
import styles from './StoreDashboard.module.css';

const PharmacyStoreDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy-store/overview', icon: 'home' },
    { type: 'divider' },
    {
      label: 'Stock Operations', icon: 'package',
      children: [
        { label: 'Stock Catalog',       path: '/pharmacy-store/stock-list',        icon: 'list',             color: '#228B22' },
        { label: 'Add New Stock',       path: '/pharmacy-store/add-new-stock',     icon: 'plus',             color: '#228B22' },
        { label: 'Goods Receiving',     path: '/pharmacy-store/goods-receiving',   icon: 'truck',            color: '#228B22' },
        { label: 'Goods Issue',         path: '/pharmacy-store/goods-issue',       icon: 'arrow-up-right',   color: '#228B22' },
        { label: 'Stock Adjustment',    path: '/pharmacy-store/stock-adjustment',  icon: 'sliders',          color: '#228B22' },
        { label: 'Physical Count',      path: '/pharmacy-store/physical-count',    icon: 'clipboard-check',  color: '#228B22' },
        { label: 'Movement Log',        path: '/pharmacy-store/stock-movement',    icon: 'activity',         color: '#228B22' },
      ]
    },
    { type: 'divider' },
    {
      label: 'System & Reports', icon: 'shield',
      children: [
        { label: 'Reports',       path: '/pharmacy-store/reports',     icon: 'file-text', color: '#1B5E20' },
      ]
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <NotifToastContainer />
      <DashboardLayout menuItems={menuItems} title="🌿 Pharmacy Store Management">
        <Routes>
          {/* Home & New Pages */}
          <Route path="overview"            element={<StoreHomeNew />} />
          <Route path="real-time-access"    element={<StoreRealTimeAccess />} />
          <Route path="quick-action"        element={<StoreQuickAction />} />
          <Route path="goods-received-today" element={<StoreGoodsReceivedToday />} />
          <Route path="goods-issued-today"  element={<StoreGoodsIssuedToday />} />


          {/* Stock Operations */}
          <Route path="stock-list"        element={<StoreStockList />} />
          <Route path="add-new-stock"     element={<StoreAddNewStock />} />
          <Route path="goods-receiving"   element={<StoreGoodsReceiving />} />
          <Route path="goods-issue"       element={<StoreGoodsIssue />} />
          <Route path="stock-adjustment"  element={<StoreStockAdjustment />} />
          <Route path="physical-count"    element={<StorePhysicalCount />} />
          <Route path="stock-movement"    element={<StoreStockMovement />} />

          {/* Monitoring & Reports */}
          <Route path="reports"     element={<StoreReports />} />

          <Route path="chat" element={<ManagerChat />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default PharmacyStoreDashboard;
