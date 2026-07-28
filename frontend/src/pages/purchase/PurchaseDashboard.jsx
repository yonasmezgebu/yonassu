import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// 1. Sourcing & Procurement
import PurchaseMarketResearch from './PurchaseMarketResearch';
import PurchaseRequests from './PurchaseRequests';
import PurchaseDrugTenders from './PurchaseDrugTenders';
import PurchaseSupplierBids from './PurchaseSupplierBids';
import PurchaseRFQ from './PurchaseRFQ';
import PurchaseSupplierQuotations from './PurchaseSupplierQuotations';
import PurchaseOrders from './PurchaseOrders';
import PurchaseReturns from './PurchaseReturns';
import PurchaseHistory from './PurchaseHistory';
import PurchaseSmartTenders from './PurchaseSmartTenders';

// 2. Supplier Management
import PurchaseSupplierList from './PurchaseSupplierList';
import PurchaseAddSupplier from './PurchaseAddSupplier';
import PurchaseSupplierPerformance from './PurchaseSupplierPerformance';
import PurchaseSupplierContracts from './PurchaseSupplierContracts';

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
import PurchaseReportSupplier from './PurchaseReportSupplier';
import PurchaseReportDelivery from './PurchaseReportDelivery';
import PurchaseReportOutstanding from './PurchaseReportOutstanding';
import PurchaseReportMonthly from './PurchaseReportMonthly';

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
        { label: '1. Market Research (M4)',    path: '/purchase/market-research', icon: 'search',       color: '#0284c7' },
        { label: '2. Purchase',                path: '/purchase/requests',        icon: 'shopping-cart', color: '#3b82f6' },
        { label: '3. Tender & Bid',            path: '/purchase/smart-tenders',   icon: 'dollar-sign',  color: '#10b981' },
        { label: '4. Quotation',               path: '/purchase/rfq',             icon: 'file',         color: '#22c55e' },
        { label: '5. Purchase Audit',          path: '/purchase/history',         icon: 'clock',        color: '#475569' },
      ]
    },
    { type: 'divider' },
    { label: 'Supplier Management', path: '/purchase/suppliers', icon: 'building' },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart-2',
      children: [
        { label: '22. Purchase Report',        path: '/purchase/reports/purchase',    icon: 'file-text',    color: '#0284c7' },
        { label: '23. Supplier Report',        path: '/purchase/reports/supplier',    icon: 'users',        color: '#8b5cf6' },
        { label: '24. Delivery Report',        path: '/purchase/reports/delivery',    icon: 'truck',        color: '#d97706' },
        { label: '26. Monthly Summary',        path: '/purchase/reports/monthly',     icon: 'bar-chart-2',  color: '#4f46e5' },
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
            <Route path="rfq" element={<PurchaseRFQ />} />
            <Route path="quotations" element={<PurchaseSupplierQuotations />} />
            <Route path="orders" element={<PurchaseOrders />} />
            <Route path="returns" element={<PurchaseReturns />} />
            <Route path="history" element={<PurchaseHistory />} />

            {/* 2. Supplier Management */}
            <Route path="suppliers" element={<PurchaseSupplierList />} />
            <Route path="suppliers/add" element={<PurchaseAddSupplier />} />
            <Route path="supplier-performance" element={<PurchaseSupplierPerformance />} />
            <Route path="contracts" element={<PurchaseSupplierContracts />} />

            {/* 5. Reports */}
            <Route path="reports/purchase" element={<PurchaseReportPurchase />} />
            <Route path="reports/supplier" element={<PurchaseReportSupplier />} />
            <Route path="reports/delivery" element={<PurchaseReportDelivery />} />
            <Route path="reports/outstanding" element={<PurchaseReportOutstanding />} />
            <Route path="reports/monthly" element={<PurchaseReportMonthly />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PurchaseDashboard;
