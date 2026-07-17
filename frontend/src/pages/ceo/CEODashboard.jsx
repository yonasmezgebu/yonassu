import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Core Dashboard Overview
import CEOHome from './CEOHome';

// Old CEO Modules that should be restored
import ExecutiveReports from './ExecutiveReports';
import CEOBoard from './CEOBoard';
import CEORisk from './CEORisk';
import ReportApprovals from './ReportApprovals';
import CEOInventoryReport from './CEOInventoryReport';
import CEOExpenses from './CEOExpenses';
import SalesReports from '../sales/SalesReports';
import CEOPurchaseWorkflow from './CEOPurchaseWorkflow';

// 15 New CEO Modules
import CEOSales from './CEOSales';
import CEOPurchase from './CEOPurchase';
import CEOInventory from './CEOInventory';
import CEOFinance from './CEOFinance';
import CEOFinanceApprovals from './CEOFinanceApprovals';
import CEOHR from './CEOHR';
import HRPolicies from '../hr/HRPolicies';
import HRAnnouncements from '../hr/HRAnnouncements';
import CEOPharmacyM20M22 from './CEOPharmacyM20M22';
import CEOStoreRequisitions from './CEOStoreRequisitions';
import CEOProcurementDecisions from '../procurement/CEOProcurementDecisions';
import PharmacyFinanceControls from '../pharmacy/PharmacyFinanceControls';
import CEODirectDelivery from './CEODirectDelivery';
import CEORequestApprovals from '../pharmacy/CEORequestApprovals';
import CEOTenderManager from './CEOTenderManager';
import CEOFundApprovalsM9 from './CEOFundApprovalsM9';
import CEOPrinting from './CEOPrinting';
import CEOCarRental from './CEOCarRental';
import StoreAdjustmentApprovals from './StoreAdjustmentApprovals';
import PharmacyStockTransfer from '../pharmacy/PharmacyStockTransfer';

// 9 Additional Approval & Report Modules
import CEOPendingApprovals from './CEOPendingApprovals';
import CEOApprovedApprovals from './CEOApprovedApprovals';
import CEORejectedApprovals from './CEORejectedApprovals';
import CEOExecutiveReport from './CEOExecutiveReport';
import CEOFinancialReport from './CEOFinancialReport';
import CEOSalesReport from './CEOSalesReport';
import CEOInventoryReportFull from './CEOInventoryReportFull';
import CEOHRReport from './CEOHRReport';
import CEOAuditReport from './CEOAuditReport';

// Flow 1 & 2
import TransferDashboard from '../CEO/TransferDashboard';
import PurchaseFlowDashboard from './PurchaseFlowDashboard';

import styles from './CEODashboard.module.css';

const CEODashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/ceo/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Business', icon: 'bar-chart-2',
      children: [
        { label: '1. Sales', path: '/ceo/sales', icon: 'trending-up', color: '#10b981' },
        { label: '2. Purchase', path: '/ceo/purchase', icon: 'shopping-cart', color: '#3b82f6' },
        { label: '3. Inventory', path: '/ceo/inventory', icon: 'package', color: '#f59e0b' },
        { label: '4. Finance', path: '/ceo/finance', icon: 'dollar-sign', color: '#8b5cf6' },
        { label: '5. HR', path: '/ceo/hr', icon: 'users', color: '#ec4899' },
        { type: 'divider' },
        { label: 'HR Policies', path: '/ceo/policies', icon: 'shield', color: '#64748b' },
        { label: 'Announcements', path: '/ceo/announcements', icon: 'bell', color: '#fbbf24' },
        { type: 'divider' },
        { label: '6b. Pharmacy Sales/Finance', path: '/ceo/pharmacy-finance', icon: 'dollar-sign', color: '#ef4444' },
        { label: '7. Procurement & New Drugs', path: '/ceo/procurement-decisions', icon: 'clipboard', color: '#06b6d4' },
        { label: '9. Direct Delivery', path: '/ceo/direct-delivery', icon: 'truck', color: '#14b8a6' },
        { label: '10. Manager Requests', path: '/ceo/manager-requests', icon: 'file-text', color: '#6366f1' },
        { label: '10b. Store Requisitions', path: '/ceo/store-requisitions', icon: 'clipboard', color: '#059669' },
        { type: 'divider' },
        { label: '11. Tender (Bid)', path: '/ceo/tenders', icon: 'award', color: '#84cc16' },
        { label: '12. Fund Approvals (M9)', path: '/ceo/tenders?tab=Fund Requests', icon: 'check-circle', color: '#eab308' },
        { type: 'divider' },
        { label: '13. Printing', path: '/ceo/printing', icon: 'printer', color: '#a855f7' },
        { label: '14. Car Rental', path: '/ceo/car-rental', icon: 'car', color: '#0ea5e9' },
      ]
    },
    { type: 'divider' },
    { label: 'Reports', icon: 'file-text',
      children: [
        { label: 'Executive Report',  path: '/ceo/reports/executive',  icon: 'file-text' },
        { label: 'Financial Report',  path: '/ceo/reports/financial',  icon: 'bar-chart' },
        { label: 'Sales Report',      path: '/ceo/reports/sales',      icon: 'trending-up' },
        { label: 'Inventory Report',  path: '/ceo/reports/inventory',  icon: 'package' },
        { label: 'HR Report',         path: '/ceo/reports/hr',         icon: 'users' },
        { label: 'Audit Report',      path: '/ceo/reports/audit',      icon: 'clipboard' },
      ] },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="🏛️ CEO DASHBOARD - SUTANA BUSINESS">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<CEOHome />} />
            
            {/* 15 Modules */}
            <Route path="sales" element={<CEOSales />} />
            <Route path="purchase" element={<CEOPurchase />} />
            <Route path="inventory" element={<CEOInventory />} />
            <Route path="finance" element={<CEOFinance />} />
            <Route path="hr" element={<CEOHR />} />
            <Route path="policies" element={<HRPolicies />} />
            <Route path="announcements" element={<HRAnnouncements />} />
            
            {/* Pharmacy M20-M22 Module Disabled */}
            <Route path="pharmacy" element={<CEOPharmacyM20M22 />} />
            <Route path="pharmacy-finance" element={<PharmacyFinanceControls />} />
            <Route path="procurement-decisions" element={<CEOProcurementDecisions />} />
            <Route path="direct-delivery" element={<CEODirectDelivery />} />
            <Route path="manager-requests" element={<CEORequestApprovals />} />
            <Route path="store-requisitions" element={<CEOStoreRequisitions />} />
            
            <Route path="tenders" element={<CEOTenderManager />} />
            <Route path="fund-approvals" element={<CEOFundApprovalsM9 />} />
            
            <Route path="printing" element={<CEOPrinting />} />
            <Route path="car-rental" element={<CEOCarRental />} />

            {/* 9 Additional Approval & Report Modules */}
            <Route path="approvals/pending" element={<CEOPendingApprovals />} />
            <Route path="store-adjustments" element={<StoreAdjustmentApprovals />} />
            <Route path="approvals/approved" element={<CEOApprovedApprovals />} />
            <Route path="approvals/rejected" element={<CEORejectedApprovals />} />
            <Route path="reports/executive" element={<CEOExecutiveReport />} />
            <Route path="reports/financial" element={<CEOFinancialReport />} />
            <Route path="reports/sales" element={<CEOSalesReport />} />
            <Route path="reports/inventory" element={<CEOInventoryReportFull />} />
            <Route path="reports/hr" element={<CEOHRReport />} />
            <Route path="reports/audit" element={<CEOAuditReport />} />

            {/* Restored Old Routes (Kept for backwards compatibility) */}
            <Route path="reports"   element={<ExecutiveReports />} />
            <Route path="inventory-report" element={<CEOInventoryReport />} />
            <Route path="sales-report" element={<SalesReports />} />
            <Route path="expenses"  element={<CEOExpenses />} />
            <Route path="board"     element={<CEOBoard />} />
            <Route path="report-approvals" element={<ReportApprovals />} />
            <Route path="risk"      element={<CEORisk />} />
            <Route path="budget-workflow" element={<CEOPurchaseWorkflow />} />

            {/* Flow 1 & 2 */}
            <Route path="flow1-transfers" element={<TransferDashboard user={{ role: 'CEO' }} />} />
            <Route path="flow2-purchase" element={<PurchaseFlowDashboard user={{ role: 'CEO' }} />} />
            
            <Route path="branch-transfers" element={<PharmacyStockTransfer />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default CEODashboard;
