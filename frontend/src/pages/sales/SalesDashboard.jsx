import React, { createContext, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import DashboardLayout from '../../components/layout/DashboardLayout';

import SalesOverview from './SalesOverview';

import RetailPOS from './RetailPOS';
import ReturnsPage from './ReturnsPage';

import RetailStoreInventory from './RetailStoreInventory';
import RetailBranches from './RetailBranches';
import SalesCEOReport from './SalesCEOReport';
import SalesFinanceReview from './SalesFinanceReview';
import SalesDailySummary from './SalesDailySummary';

import CashierAuditLog from './CashierAuditLog';
import TenderManagePage from '../admin/TenderManagePage';
import SalesProductAdjust from './SalesProductAdjust';

// We import these directly if needed
// import ProcurementRequests from '../procurement/ProcurementRequests';
// import PharmacyReceive from '../procurement/PharmacyReceive';
// import DirectDelivery from '../procurement/DirectDelivery';

import SalesContact from './SalesContact';
import ManagerChat from '../../components/ManagerChat';


export const WorkerAuthContext = createContext();

const SalesDashboard = () => {
  const location = useLocation();
  const FULL_BLEED = [
    '/sales/staff', '/sales/branches', 
    '/sales/finance-review', '/sales/ceo-report', '/sales/daily-summary',
    '/sales/store-inventory',
    '/sales/procurement-requests',
    '/sales/sales', '/sales/sales-return',
    '/sales/bids',
    '/sales/pos',
    '/sales/inventory/adjust',
  ];
  const isFullBleed = FULL_BLEED.some(path => location.pathname.includes(path));
  const isNoPaddingPage = location.pathname.includes('/sales/pos') || location.pathname.includes('/sales/sales-return') || location.pathname.includes('/sales/store-inventory');
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
      ]
    },
    { type: 'divider' },



    // ── Inventory ──
    { label: 'Inventory', icon: 'package',
      children: [
        { label: 'Store Inventory',  path: '/sales/store-inventory',  icon: 'database', color: '#0891b2' },
      ]
    },
    { type: 'divider' },

    // ── Staff ──
    { label: 'Staff & Ops', icon: 'users',
      children: [
        { label: 'Branches',         path: '/sales/branches',   icon: 'building', color: '#f59e0b' },
        { label: 'Bids',             path: '/sales/bids',       icon: 'award', color: '#059669' },
      ]
    },
    { type: 'divider' },

    // ── Reports ──
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'CEO Report',     path: '/sales/ceo-report',     icon: 'bar-chart-2',  color: '#064e3b' },
        { label: 'Finance Review', path: '/sales/finance-review', icon: 'dollar-sign',  color: '#D97706' },
        { label: 'Daily Summary',  path: '/sales/daily-summary',  icon: 'shield',       color: '#6366f1' },
      ]
    },
    { type: 'divider' },

    // ── Settings ──
    { label: 'Settings', icon: 'settings',
      children: [
        { label: 'Contact Settings', icon: 'phone', color: '#14b8a6', children: [
          { label: 'Setting Contact', path: '/sales/contact', icon: 'settings' },
          { label: 'Chat', path: '/sales/chat', icon: 'message-circle', color: '#6B8E23' }
        ] },
      ]
    },
  ];

  const [hasManagerPermission, setHasManagerPermission] = useState(true);

  return (
    <WorkerAuthContext.Provider value={{ hasManagerPermission, setHasManagerPermission }}>
    <div>
    <DashboardLayout menuItems={menuItems} title="Sales Manager Dashboard" noPadding={isNoPaddingPage}>
        <div style={isFullBleed ? {
          margin: isNoPaddingPage ? 0 : '-32px',
          padding: 0,
          background:
            location.pathname.includes('/sales/ceo-report')     ? '#F1F8E9' :
            location.pathname.includes('/sales/finance-review') ? '#E8F5E9' :
            location.pathname.includes('/sales/bids')           ? '#F5F5F5' :
            (
              location.pathname.includes('/sales/store-inventory')
            ) ? '#1B5E20' :
            '#F5F5F5',
          minHeight: '100vh',
          boxSizing: 'border-box',
        } : {}}>

          <Routes>
            {/* Dashboards */}
            <Route path="overview" element={<SalesOverview />} />

            {/* Sales */}
            <Route path="pos"           element={<RetailPOS />} />
            <Route path="pos/:id"       element={<RetailPOS />} />
            <Route path="sales-return"    element={<ReturnsPage />} />



            {/* Inventory */}
            <Route path="store-inventory"  element={<RetailStoreInventory />} />

            {/* Staff */}
            <Route path="branches"   element={<RetailBranches />} />
            <Route path="bids"       element={<TenderManagePage />} />

            {/* Reports */}
            <Route path="ceo-report"    element={<SalesCEOReport />} />
            <Route path="finance-review" element={<SalesFinanceReview />} />
            <Route path="daily-summary" element={<SalesDailySummary />} />
            
            <Route path="inventory/adjust/:id" element={<SalesProductAdjust />} />

            {/* Settings */}
            <Route path="contact" element={<SalesContact />} />
            <Route path="chat" element={<ManagerChat />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
    </WorkerAuthContext.Provider>
  );
};

export default SalesDashboard;
