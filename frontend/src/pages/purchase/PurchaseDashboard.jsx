import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PurchaseHome from './PurchaseHome';

// 1. Sourcing & Procurement
import PurchaseMarketResearch from './PurchaseMarketResearch';
import PurchaseRequests from './PurchaseRequests';
import PurchaseDrugTenders from './PurchaseDrugTenders';
import PurchaseSupplierBids from './PurchaseSupplierBids';
import PurchaseRFQ from './PurchaseRFQ';
import PurchaseSupplierQuotations from './PurchaseSupplierQuotations';
import PurchaseOrders from './PurchaseOrders';
import PurchaseGoodsReceiving from './PurchaseGoodsReceiving';
import PurchaseReturns from './PurchaseReturns';
import PurchaseHistory from './PurchaseHistory';

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

import styles from './PurchaseDashboard.module.css';

const PurchaseDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/purchase/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Sourcing & Procurement', icon: 'layers',
      children: [
        { label: '1. Market Research (M4)',    path: '/purchase/market-research', icon: 'search',       color: '#0284c7' },
        { label: '2. Purchase Requests',       path: '/purchase/requests',        icon: 'file-text',    color: '#3b82f6' },
        { label: '3. Drug Tenders (M5)',        path: '/purchase/tenders',         icon: 'clipboard',    color: '#0891b2' },
        { label: '4. Supplier Bids (M6)',       path: '/purchase/bids',            icon: 'inbox',        color: '#059669' },
        { label: '5. Request for Quotation',   path: '/purchase/rfq',             icon: 'file',         color: '#22c55e' },
        { label: '6. Supplier Quotations',     path: '/purchase/quotations',      icon: 'inbox',        color: '#f59e0b' },
        { label: '7. Purchase Orders',         path: '/purchase/orders',          icon: 'shopping-cart', color: '#8b5cf6' },
        { label: '8. Goods Receiving',         path: '/purchase/receiving',       icon: 'truck',        color: '#06b6d4' },
        { label: '9. Purchase Returns',        path: '/purchase/returns',         icon: 'rotate-ccw',   color: '#ea580c' },
        { label: '10. Purchase History',       path: '/purchase/history',         icon: 'clock',        color: '#475569' },
      ]
    },
    { type: 'divider' },
    { label: 'Supplier Management', icon: 'building',
      children: [
        { label: '11. Supplier List',          path: '/purchase/suppliers',          icon: 'users',        color: '#1d4ed8' },
        { label: '12. Add Supplier',           path: '/purchase/suppliers/add',      icon: 'user-plus',    color: '#22c55e' },
        { label: '13. Supplier Performance',   path: '/purchase/supplier-performance', icon: 'bar-chart-2', color: '#8b5cf6' },
        { label: '14. Supplier Contracts',     path: '/purchase/contracts',          icon: 'file-text',    color: '#0891b2' },
      ]
    },
    { type: 'divider' },
    { label: 'Stock & Inventory', icon: 'package',
      children: [
        { label: '15. Stock Requests',         path: '/purchase/stock-requests',     icon: 'clipboard',    color: '#3b82f6' },
        { label: '16. Pending Deliveries',     path: '/purchase/pending-deliveries', icon: 'clock',        color: '#d97706' },
        { label: '17. Received Items',         path: '/purchase/received-items',     icon: 'package',      color: '#16a34a' },
        { label: '18. Stock Availability',     path: '/purchase/stock-availability', icon: 'layers',       color: '#06b6d4' },
      ]
    },
    { type: 'divider' },
    { label: 'Approvals', icon: 'check-circle',
      children: [
        { label: '19. Pending Approval',       path: '/purchase/approvals/pending',  icon: 'clock',        color: '#d97706' },
        { label: '20. Approved',               path: '/purchase/approvals/approved', icon: 'check-circle', color: '#16a34a' },
        { label: '21. Rejected',               path: '/purchase/approvals/rejected', icon: 'x-circle',     color: '#dc2626' },
      ]
    },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart-2',
      children: [
        { label: '22. Purchase Report',        path: '/purchase/reports/purchase',    icon: 'file-text',    color: '#0284c7' },
        { label: '23. Supplier Report',        path: '/purchase/reports/supplier',    icon: 'users',        color: '#8b5cf6' },
        { label: '24. Delivery Report',        path: '/purchase/reports/delivery',    icon: 'truck',        color: '#d97706' },
        { label: '25. Outstanding Orders',     path: '/purchase/reports/outstanding', icon: 'alert-circle', color: '#dc2626' },
        { label: '26. Monthly Summary',        path: '/purchase/reports/monthly',     icon: 'bar-chart-2',  color: '#4f46e5' },
      ]
    }
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Purchase Manager Dashboard — 26 Links">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="overview" element={<PurchaseHome />} />

            {/* 1. Sourcing & Procurement */}
            <Route path="market-research" element={<PurchaseMarketResearch />} />
            <Route path="requests" element={<PurchaseRequests />} />
            <Route path="tenders" element={<PurchaseDrugTenders />} />
            <Route path="bids" element={<PurchaseSupplierBids />} />
            <Route path="rfq" element={<PurchaseRFQ />} />
            <Route path="quotations" element={<PurchaseSupplierQuotations />} />
            <Route path="orders" element={<PurchaseOrders />} />
            <Route path="receiving" element={<PurchaseGoodsReceiving />} />
            <Route path="returns" element={<PurchaseReturns />} />
            <Route path="history" element={<PurchaseHistory />} />

            {/* 2. Supplier Management */}
            <Route path="suppliers" element={<PurchaseSupplierList />} />
            <Route path="suppliers/add" element={<PurchaseAddSupplier />} />
            <Route path="supplier-performance" element={<PurchaseSupplierPerformance />} />
            <Route path="contracts" element={<PurchaseSupplierContracts />} />

            {/* 3. Stock & Inventory */}
            <Route path="stock-requests" element={<PurchaseStockRequests />} />
            <Route path="pending-deliveries" element={<PurchasePendingDeliveries />} />
            <Route path="received-items" element={<PurchaseReceivedItems />} />
            <Route path="stock-availability" element={<PurchaseStockAvailability />} />

            {/* 4. Approvals */}
            <Route path="approvals/pending" element={<PurchaseApprovalsPending />} />
            <Route path="approvals/approved" element={<PurchaseApprovalsApproved />} />
            <Route path="approvals/rejected" element={<PurchaseApprovalsRejected />} />

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
