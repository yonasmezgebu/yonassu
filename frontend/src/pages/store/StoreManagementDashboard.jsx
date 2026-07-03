import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

import StoreManagementHome from './StoreManagementHome';

// Procurement
import StoreSuppliers from './StoreSuppliers';
import StoreDeliveries from './StoreDeliveries';
import StoreGoodsReceiving from './StoreGoodsReceiving'; // M19 exact match

// Reports
import StoreStockReport from './StoreStockReport';
import StoreStockMovementReport from './StoreStockMovementReport';
import StoreLowStockReport from './StoreLowStockReport';
import StoreOverstockReport from './StoreOverstockReport';
import StoreInventoryValuation from './StoreInventoryValuation';
import StorePhysicalCountReport from './StorePhysicalCountReport';

// Staff Management
import StoreStaffList from './StoreStaffList';
import StoreAssignTasks from './StoreAssignTasks';
import StoreAttendance from './StoreAttendance';

import styles from './StoreDashboard.module.css'; // Reusing CSS

const StoreManagementDashboard = () => {
  const menuItems = [
    { label: 'Dashboard Home', path: '/store-management/overview', icon: 'home' },
    { type: 'divider' },
    {
      label: 'Procurement Tracking', icon: 'truck',
      children: [
        { label: '1. Suppliers',      path: '/store-management/suppliers',      icon: 'users',    color: '#3b82f6' },
        { label: '2. Deliveries',     path: '/store-management/deliveries',     icon: 'package',  color: '#06b6d4' },
        { label: '3. Goods Receipt',  path: '/store-management/goods-receipt',  icon: 'download', color: '#22c55e' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Reports', icon: 'pie-chart',
      children: [
        { label: '4. Stock Report',            path: '/store-management/stock-report',            icon: 'bar-chart',    color: '#6366f1' },
        { label: '5. Movement Report',         path: '/store-management/movement-report',         icon: 'activity',     color: '#8b5cf6' },
        { label: '6. Low Stock Report',        path: '/store-management/low-stock-report',        icon: 'alert-circle', color: '#f59e0b' },
        { label: '7. Overstock Report',        path: '/store-management/overstock-report',        icon: 'trending-up',  color: '#f97316' },
        { label: '8. Inventory Valuation',     path: '/store-management/inventory-valuation',     icon: 'dollar-sign',  color: '#10b981' },
        { label: '9. Physical Count Report',   path: '/store-management/physical-count-report',   icon: 'clipboard',    color: '#14b8a6' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Staff Management', icon: 'briefcase',
      children: [
        { label: '10. Staff List',    path: '/store-management/staff-list',   icon: 'users',      color: '#0ea5e9' },
        { label: '11. Assign Tasks',  path: '/store-management/assign-tasks', icon: 'check-square',color: '#8b5cf6' },
        { label: '12. Attendance',    path: '/store-management/attendance',   icon: 'calendar',   color: '#22c55e' },
      ]
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="📋 Store (Inventory) Dashboard">
        <Routes>
          <Route path="overview" element={<StoreManagementHome />} />
          
          <Route path="suppliers" element={<StoreSuppliers />} />
          <Route path="deliveries" element={<StoreDeliveries />} />
          <Route path="goods-receipt" element={<StoreGoodsReceiving />} />
          
          <Route path="stock-report" element={<StoreStockReport />} />
          <Route path="movement-report" element={<StoreStockMovementReport />} />
          <Route path="low-stock-report" element={<StoreLowStockReport />} />
          <Route path="overstock-report" element={<StoreOverstockReport />} />
          <Route path="inventory-valuation" element={<StoreInventoryValuation />} />
          <Route path="physical-count-report" element={<StorePhysicalCountReport />} />
          
          <Route path="staff-list" element={<StoreStaffList />} />
          <Route path="assign-tasks" element={<StoreAssignTasks />} />
          <Route path="attendance" element={<StoreAttendance />} />

          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default StoreManagementDashboard;
