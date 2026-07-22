import React, { createContext, useState } from 'react';

export const WorkerAuthContext = createContext();
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BackButton from '../../components/pharmacy/BackButton';

import SalesOverview from './SalesOverview';
import SalesWorkerHome from './SalesWorkerHome';
import POSPage from './POSPage';
import ReturnsPage from './ReturnsPage';
import SalesHealthPublisher from './SalesHealthPublisher';
import SalesWorkerHealthPublisher from './SalesWorkerHealthPublisher';
import SalesOrders from './SalesOrders';
import SalesOrderHistory from './SalesOrderHistory';
import SalesProducts from './SalesProducts';
import SalesStoreInventory from './SalesStoreInventory';
import SalesStockOperations from './SalesStockOperations';
import SalesStockAdjustment from './SalesStockAdjustment';
import SalesExpiryManagement from './SalesExpiryManagement';
import SalesBatches from './SalesBatches';
import SalesStaff from './SalesStaff';
import SalesAttendance from './SalesAttendance';
import SalesBranches from './SalesBranches';
import SalesCEOReport from './SalesCEOReport';
import SalesFinanceReview from './SalesFinanceReview';
import SalesDailySummary from './SalesDailySummary';
import SalesNewOrder from './SalesNewOrder';
import SalesPendingOrders from './SalesPendingOrders';
import CashierAuditLog from './CashierAuditLog';

// We import these directly if needed
// import ProcurementRequests from '../procurement/ProcurementRequests';
// import PharmacyReceive from '../procurement/PharmacyReceive';
// import DirectDelivery from '../procurement/DirectDelivery';

const SalesDashboard = () => {
  const location = useLocation();
  const FULL_BLEED = [
    '/sales/staff', '/sales/attendance', '/sales/branches', 
    '/sales/daily-summary', '/sales/finance-review', '/sales/ceo-report', 
    '/sales/store-inventory', '/sales/stock-operations', 
    '/sales/procurement-requests', '/sales/stock-adjustment', 
    '/sales/expiry-management', '/sales/batches', '/sales/health-publisher',
    '/sales/products', '/sales/worker-home', '/sales/sales', '/sales/sales-return',
    '/sales/rx', '/sales/rx/new', '/sales/rx/pending', '/sales/rx/history'
  ];
  const isFullBleed = FULL_BLEED.some(path => location.pathname.includes(path));
  const hideBackButton = ['/sales/overview', '/sales'].includes(location.pathname) || isFullBleed;

  const menuItems = [
    // Manager Dashboard (From PharmacyManager)
    { label: 'Manager Overview', path: '/sales/overview', icon: 'home' },
    // Cashier Dashboard (From PharmacyWorker)
    { label: 'Cashier Overview', path: '/sales/worker-home', icon: 'home' },
    { type: 'divider' },

    // ── Sales Section (From Worker) ──
    {
      label: 'Sales Section', icon: 'shopping-cart',
      children: [
        { label: '🛒 New Sale',          path: '/sales/pos',              icon: 'shopping-cart', color: '#059669', className: 'executive' },
        { label: 'Sales Return',         path: '/sales/sales-return',       icon: 'rotate-ccw' },
        { label: '🌐 Sales Publisher',  path: '/sales/worker-health-publisher',   icon: 'globe',         color: '#224f94' },
      ]
    },
    { type: 'divider' },

    // ── Orders (From Worker Prescriptions) ──
    {
      label: 'Retail Orders', icon: 'file-text',
      children: [
        { label: 'Orders Queue', path: '/sales/rx',         icon: 'clipboard-list', color: '#059669' },
        { label: 'Order History', path: '/sales/rx/history', icon: 'list',           color: '#64748b' },
      ]
    },
    { type: 'divider' },

    // ── Inventory & Procurement (From Manager) ──
    { label: 'Inventory', icon: 'pill',
      children: [
        { label: 'Store Inventory',  path: '/sales/store-inventory',  icon: 'database',  color: '#0891b2' },
        { label: 'Stock Operations', path: '/sales/stock-operations', icon: 'package',   color: '#3b82f6' },
        // { label: 'Product Procurement', path: '/sales/procurement-requests',  icon: 'shopping-cart', color: '#059669' },
        { label: 'Stock Adjustment', path: '/sales/stock-adjustment',      icon: 'sliders',       color: '#f97316' },
        { label: 'Expiry Management',path: '/sales/expiry-management',     icon: 'alert-triangle',color: '#ef4444' },
        { label: 'Batch Management', path: '/sales/batches',               icon: 'layers',        color: '#14b8a6' },
        { label: 'Customer Publisher', path: '/sales/health-publisher',      icon: 'globe',         color: '#059669' },
      ] },

    // ── Staff (From Manager) ──
    { label: 'Staff & Ops', icon: 'users',
      children: [
        { label: 'Staff Mgmt',      path: '/sales/staff',          icon: 'settings' },
        { label: 'Attendance',      path: '/sales/attendance',     icon: 'clock' },
        { label: 'Branches',        path: '/sales/branches',       icon: 'building',  color: '#f59e0b' },
      ] },
    { type: 'divider' },

    // ── Reports (From Manager) ──
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'CEO Report', path: '/sales/ceo-report', icon: 'bar-chart-2',  color: '#064e3b' },
        { label: 'Finance Review', path: '/sales/finance-review', icon: 'dollar-sign',  color: '#D97706' },
        { label: 'Daily Summary',    path: '/sales/daily-summary',     icon: 'file-text' },
      ] },
  ];

  const [hasManagerPermission, setHasManagerPermission] = useState(true);

  return (
    <WorkerAuthContext.Provider value={{ hasManagerPermission, setHasManagerPermission }}>
    <div>
      <DashboardLayout menuItems={menuItems} title="Sales Manager (Unified)">
        <div style={isFullBleed ? {
          margin: '-32px -32px -32px -32px',
          padding: 0,
          background:
            location.pathname.includes('/sales/ceo-report')     ? '#F1BE91' :
            location.pathname.includes('/sales/finance-review') ? '#46D17A' :
            (
              location.pathname.includes('/sales/store-inventory') ||
              location.pathname.includes('/sales/stock-operations') ||
              location.pathname.includes('/sales/stock-adjustment') ||
              location.pathname.includes('/sales/expiry-management') ||
              location.pathname.includes('/sales/batches') ||
              location.pathname.includes('/sales/health-publisher')
            ) ? '#50760F' :
            '#D5DCF0',
          minHeight: '100vh',
          boxSizing: 'border-box',
        } : {}}>
          {!hideBackButton && <BackButton />}
          <Routes>
            {/* Dashboards */}
            <Route path="overview"   element={<SalesOverview />} />
            <Route path="worker-home" element={<SalesWorkerHome />} />

            {/* Sales */}
            <Route path="pos"           element={<POSPage />} />
            <Route path="pos/:id"       element={<POSPage />} />
            <Route path="sales-return"    element={<ReturnsPage />} />
            <Route path="worker-health-publisher" element={<SalesWorkerHealthPublisher />} />

            {/* Orders (Prescriptions mapping) */}
            <Route path="rx"              element={<SalesOrders />} />
            <Route path="rx/new"          element={<SalesNewOrder />} />
            <Route path="rx/pending"      element={<SalesPendingOrders />} />
            <Route path="rx/history"      element={<SalesOrderHistory />} />

            {/* Inventory */}
            <Route path="products"        element={<SalesProducts />} />
            <Route path="store-inventory"  element={<SalesStoreInventory />} />
            <Route path="stock-operations" element={<SalesStockOperations />} />
            <Route path="stock-adjustment" element={<SalesStockAdjustment />} />
            <Route path="expiry-management" element={<SalesExpiryManagement />} />
            <Route path="batches"          element={<SalesBatches />} />
            <Route path="health-publisher" element={<SalesHealthPublisher />} />

            {/* Staff */}
            <Route path="staff"         element={<SalesStaff />} />
            <Route path="attendance"    element={<SalesAttendance />} />
            <Route path="branches"   element={<SalesBranches />} />

            {/* Reports */}
            <Route path="ceo-report"    element={<SalesCEOReport />} />
            <Route path="finance-review" element={<SalesFinanceReview />} />
            <Route path="finance-review/:id" element={<SalesFinanceReview />} />
            <Route path="daily-summary" element={<SalesDailySummary />} />
            
            <Route path="audit" element={<CashierAuditLog source="sales" />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
    </WorkerAuthContext.Provider>
  );
};

export default SalesDashboard;
