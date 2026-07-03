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
import CEOHR from './CEOHR';
import CEOPharmacyM20M22 from './CEOPharmacyM20M22';
import CEODrugProcurement from './CEODrugProcurement';
import CEONewDrugRequests from './CEONewDrugRequests';
import CEODirectDelivery from './CEODirectDelivery';
import CEOPharmacyManagerRequests from './CEOPharmacyManagerRequests';
import CEOTenderBids from './CEOTenderBids';
import CEOFundApprovalsM9 from './CEOFundApprovalsM9';
import CEOPrinting from './CEOPrinting';
import CEOCarRental from './CEOCarRental';
import CEOTenderFull from './CEOTenderFull';

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
        { label: '6. Pharmacy (M20-M22)', path: '/ceo/pharmacy', icon: 'pill', color: '#ef4444' },
        { label: '7. Drug Procurement', path: '/ceo/procurement', icon: 'clipboard', color: '#06b6d4' },
        { label: '8. New Drug Requests', path: '/ceo/new-drugs', icon: 'alert-triangle', color: '#f97316' },
        { label: '9. Direct Delivery', path: '/ceo/direct-delivery', icon: 'truck', color: '#14b8a6' },
        { label: '10. Manager Requests', path: '/ceo/manager-requests', icon: 'file-text', color: '#6366f1' },
        { type: 'divider' },
        { label: '11. Tender Bids (M7)', path: '/ceo/tender-bids', icon: 'award', color: '#84cc16' },
        { label: '12. Fund Approvals (M9)', path: '/ceo/fund-approvals', icon: 'check-circle', color: '#eab308' },
        { type: 'divider' },
        { label: '13. Printing', path: '/ceo/printing', icon: 'printer', color: '#a855f7' },
        { label: '14. Car Rental', path: '/ceo/car-rental', icon: 'car', color: '#0ea5e9' },
        { label: '15. Tender Full', path: '/ceo/tender-full', icon: 'briefcase', color: '#f43f5e' },
      ]
    },
    { type: 'divider' },
    { label: 'Approvals', icon: 'check-circle',
      children: [
        { label: 'Pending',  path: '/ceo/approvals/pending',  icon: 'clock' },
        { label: 'Approved', path: '/ceo/approvals/approved', icon: 'check-circle', color: '#22c55e' },
        { label: 'Rejected', path: '/ceo/approvals/rejected', icon: 'x' },
      ] },
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
            
            <Route path="pharmacy" element={<CEOPharmacyM20M22 />} />
            <Route path="procurement" element={<CEODrugProcurement />} />
            <Route path="new-drugs" element={<CEONewDrugRequests />} />
            <Route path="direct-delivery" element={<CEODirectDelivery />} />
            <Route path="manager-requests" element={<CEOPharmacyManagerRequests />} />
            
            <Route path="tender-bids" element={<CEOTenderBids />} />
            <Route path="fund-approvals" element={<CEOFundApprovalsM9 />} />
            
            <Route path="printing" element={<CEOPrinting />} />
            <Route path="car-rental" element={<CEOCarRental />} />
            <Route path="tender-full" element={<CEOTenderFull />} />

            {/* 9 Additional Approval & Report Modules */}
            <Route path="approvals/pending" element={<CEOPendingApprovals />} />
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

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default CEODashboard;
