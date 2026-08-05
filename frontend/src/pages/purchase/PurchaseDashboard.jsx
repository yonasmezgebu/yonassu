import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// 1. Sourcing & Procurement
import PurchaseMarketResearch from './PurchaseMarketResearch';
import PurchaseRequests from './PurchaseRequests';
import PurchaseDrugTenders from './PurchaseDrugTenders';
import PurchaseSupplierBids from './PurchaseSupplierBids';
import PurchaseSupplierQuotations from './PurchaseSupplierQuotations';
import PurchaseOrders from './PurchaseOrders';
import PurchaseReturns from './PurchaseReturns';
import PurchaseHistory from './PurchaseHistory';
import PurchaseSmartTenders from './PurchaseSmartTenders';

// 2. Supplier Management
import PurchaseSupplierList from './PurchaseSupplierList';
import PurchaseAddSupplier from './PurchaseAddSupplier';

// 3. Stock & Inventory
import PurchaseStockRequests from './PurchaseStockRequests';
import PurchasePendingDeliveries from './PurchasePendingDeliveries';
import PurchaseReceivedItems from './PurchaseReceivedItems';
import PurchaseStockAvailability from './PurchaseStockAvailability';

// 4. Approvals
import PurchaseApprovalsPending from './PurchaseApprovalsPending';
import PurchaseApprovalsApproved from './PurchaseApprovalsApproved';
import PurchaseApprovalsRejected from './PurchaseApprovalsRejected';

// 5. Reports
import PurchaseReportPurchase from './PurchaseReportPurchase';
import PurchaseReportDelivery from './PurchaseReportDelivery';
import PurchaseReportCEO from './PurchaseReportCEO';
import PurchaseReportFinancial from './PurchaseReportFinancial';

// Flow 2
import PurchaseApprovedRequests from './PurchaseApprovedRequests';
import PurchaseHome from './PurchaseHome';

import styles from './PurchaseDashboard.module.css';

const PurchaseDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/purchase/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Sourcing & Procurement', icon: 'layers',
      children: [
        { label: 'Market Research (M4)',    path: '/purchase/market-research', icon: 'search',       color: '#0284c7' },
        { label: 'Purchase',                path: '/purchase/requests',        icon: 'shopping-cart', color: '#3b82f6' },
        { label: 'Tender & Bid',            path: '/purchase/smart-tenders',   icon: 'dollar-sign',  color: '#10b981' },
        { label: 'Quotation',               path: '/purchase/quotations',             icon: 'file',         color: '#22c55e' },
        { label: 'Purchase Audit',          path: '/purchase/history',         icon: 'clock',        color: '#475569' },
      ]
    },
    { type: 'divider' },
    { label: 'Supplier Management', icon: 'building',
      children: [
        { label: 'Supplier Directory',       path: '/purchase/suppliers',          icon: 'truck',      color: '#10b981' },
      ]
    },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart-2',
      children: [
        { label: 'Purchase Report',         path: '/purchase/reports/purchase',    icon: 'file-text',    color: '#0284c7' },
        { label: 'Delivery Report',         path: '/purchase/reports/delivery',    icon: 'truck',        color: '#d97706' },
        { label: 'CEO Report',              path: '/purchase/reports/ceo',         icon: 'briefcase',    color: '#10b981' },
        { label: 'Financial Review',        path: '/purchase/reports/financial',   icon: 'dollar-sign',  color: '#8b5cf6' },
      ]
    }
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Purchase Manager Dashboard — All Departments">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="overview" element={<PurchaseHome />} />
            
            {/* 1. Sourcing & Procurement */}
            <Route path="market-research" element={<PurchaseMarketResearch />} />
            <Route path="requests" element={<PurchaseRequests />} />
            <Route path="smart-tenders" element={<PurchaseSmartTenders />} />
            <Route path="quotations" element={<PurchaseSupplierQuotations />} />
            <Route path="orders" element={<PurchaseOrders />} />
            <Route path="returns" element={<PurchaseReturns />} />
            <Route path="history" element={<PurchaseHistory />} />

            {/* 2. Supplier Management */}
            <Route path="suppliers" element={<PurchaseSupplierList />} />
            <Route path="suppliers/add" element={<PurchaseAddSupplier />} />

            {/* 5. Reports */}
            <Route path="reports/purchase" element={<PurchaseReportPurchase />} />
            <Route path="reports/delivery" element={<PurchaseReportDelivery />} />
            <Route path="reports/ceo" element={<PurchaseReportCEO />} />
            <Route path="reports/financial" element={<PurchaseReportFinancial />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PurchaseDashboard;
