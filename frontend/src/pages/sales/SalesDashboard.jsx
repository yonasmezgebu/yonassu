import React, { createContext, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import DashboardLayout from '../../components/layout/DashboardLayout';
import BackButton from '../../components/pharmacy/BackButton';

import SalesOverview from './SalesOverview';

import RetailPOS from './RetailPOS';
import ReturnsPage from './ReturnsPage';
import RetailProductManager from './RetailProductManager';
import RetailStoreInventory from './RetailStoreInventory';
import RetailStockOperations from './RetailStockOperations';
import RetailExpiryManagement from './RetailExpiryManagement';
import SalesStaff from './SalesStaff';
import SalesAttendance from './SalesAttendance';
import SalesBranches from './SalesBranches';
import SalesCEOReport from './SalesCEOReport';
import SalesFinanceReview from './SalesFinanceReview';

import CashierAuditLog from './CashierAuditLog';

// We import these directly if needed
// import ProcurementRequests from '../procurement/ProcurementRequests';
// import PharmacyReceive from '../procurement/PharmacyReceive';
// import DirectDelivery from '../procurement/DirectDelivery';


export const WorkerAuthContext = createContext();

const SalesDashboard = () => {
  const location = useLocation();
  const FULL_BLEED = [
    '/sales/staff', '/sales/attendance', '/sales/branches', 
    '/sales/finance-review', '/sales/ceo-report', 
    '/sales/store-inventory', '/sales/stock-operations', 
    '/sales/procurement-requests', 
    '/sales/expiry-management', '/sales/health-publisher',
    '/sales/worker-home', '/sales/sales', '/sales/sales-return',

  ];
  const isFullBleed = FULL_BLEED.some(path => location.pathname.includes(path));
  const hideBackButton = ['/sales/overview', '/sales'].includes(location.pathname) || isFullBleed;

  const menuItems = [
    { label: 'Dashboard Overview', path: '/sales/overview', icon: 'home' },
    { type: 'divider' },

    // ── Sales Section ──
    {
      label: 'Sales', icon: 'shopping-cart',
      children: [
        { label: '🛒 New Sale (POS)',    path: '/sales/pos',              icon: 'shopping-cart', color: '#059669' },
        { label: 'Sales Return',         path: '/sales/sales-return',     icon: 'rotate-ccw' },
        { label: '🌐 Retail Publisher',  path: '/sales/product-manager', icon: 'globe',          color: '#228B22' },
      ]
    },
    { type: 'divider' },



    // ── Inventory ──
    { label: 'Inventory', icon: 'package',
      children: [
        { label: 'Store Inventory',   path: '/sales/store-inventory',  icon: 'database',       color: '#0891b2' },
        { label: 'Stock Operations',  path: '/sales/stock-operations', icon: 'package',        color: '#3b82f6' },
        { label: 'Expiry Management', path: '/sales/expiry-management',icon: 'alert-triangle', color: '#ef4444' },
      ]
    },
    { type: 'divider' },

    // ── Staff ──
    { label: 'Staff & Ops', icon: 'users',
      children: [
        { label: 'Staff Management', path: '/sales/staff',      icon: 'settings' },
        { label: 'Attendance',       path: '/sales/attendance', icon: 'clock' },
        { label: 'Branches',         path: '/sales/branches',   icon: 'building', color: '#f59e0b' },
      ]
    },
    { type: 'divider' },

    // ── Reports ──
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'CEO Report',     path: '/sales/ceo-report',     icon: 'bar-chart-2',  color: '#064e3b' },
        { label: 'Finance Review', path: '/sales/finance-review', icon: 'dollar-sign',  color: '#D97706' },
        { label: 'Cashier Audit',  path: '/sales/audit',          icon: 'shield',       color: '#6366f1' },
      ]
    },
  ];

  const [hasManagerPermission, setHasManagerPermission] = useState(true);

  return (
    <WorkerAuthContext.Provider value={{ hasManagerPermission, setHasManagerPermission }}>
    <div>
      <DashboardLayout menuItems={menuItems} title="Sales Manager Dashboard">
        <div style={isFullBleed ? {
          margin: '-32px -32px -32px -32px',
          padding: 0,
          background:
            location.pathname.includes('/sales/ceo-report')     ? '#A5D6A7' :
            location.pathname.includes('/sales/finance-review') ? '#228B22' :
            (
              location.pathname.includes('/sales/store-inventory') ||
              location.pathname.includes('/sales/stock-operations') ||
              location.pathname.includes('/sales/expiry-management') ||
              location.pathname.includes('/sales/product-manager')
            ) ? '#1B5E20' :
            '#D5DCF0',
          minHeight: '100vh',
          boxSizing: 'border-box',
        } : {}}>
          {!hideBackButton && <BackButton />}
          <Routes>
            {/* Dashboards */}
            <Route path="overview" element={<SalesOverview />} />

            {/* Sales */}
            <Route path="pos"           element={<RetailPOS />} />
            <Route path="pos/:id"       element={<RetailPOS />} />
            <Route path="sales-return"    element={<ReturnsPage />} />



            {/* Inventory */}
            <Route path="store-inventory"  element={<RetailStoreInventory />} />
            <Route path="stock-operations" element={<RetailStockOperations />} />
            <Route path="expiry-management" element={<RetailExpiryManagement />} />
            <Route path="product-manager" element={<RetailProductManager />} />

            {/* Staff */}
            <Route path="staff"         element={<SalesStaff />} />
            <Route path="attendance"    element={<SalesAttendance />} />
            <Route path="branches"   element={<SalesBranches />} />

            {/* Reports */}
            <Route path="ceo-report"    element={<SalesCEOReport />} />
            <Route path="finance-review" element={<SalesFinanceReview />} />
            <Route path="finance-review/:id" element={<SalesFinanceReview />} />
            
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
