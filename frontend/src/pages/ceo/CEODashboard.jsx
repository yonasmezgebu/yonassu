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
import CEOFinance from './CEOFinance';
import CEOFinanceApprovals from './CEOFinanceApprovals';
import CEOHR from './CEOHR';
import HRPolicies from '../hr/HRPolicies';
import HRAnnouncements from '../hr/HRAnnouncements';
import CEOPharmacyHub from './CEOPharmacyHub';
import CEOPharmacyM20M22 from './CEOPharmacyM20M22';
import CEOStoreRequisitions from './CEOStoreRequisitions';
import CEOProcurementDecisions from '../procurement/CEOProcurementDecisions';
import CEODirectDelivery from './CEODirectDelivery';
import CEOTenderManager from './CEOTenderManager';
import CEOPrinting from './CEOPrinting';
import CEOAgriAndCarRental from './CEOAgriAndCarRental';
import CEOApplicants from './CEOApplicants';
import HREmployeesPending from '../hr/HREmployeesPending';

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

import ManagerChat from '../../components/ManagerChat';
import styles from './CEODashboard.module.css';

const CEODashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/ceo/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Business', icon: 'bar-chart-2',
      children: [
        { label: 'Sales', path: '/ceo/sales', icon: 'trending-up', color: '#10b981' },
        { label: 'Purchase', path: '/ceo/purchase', icon: 'shopping-cart', color: '#3b82f6' },
        { label: 'Finance', path: '/ceo/finance', icon: 'dollar-sign', color: '#8b5cf6' },
        { label: 'HR', path: '/ceo/hr', icon: 'users', color: '#ec4899' },
        { label: 'Pharmacy', path: '/ceo/pharmacy-hub', icon: 'plus-circle', color: '#ef4444' },
        { label: 'Store', path: '/ceo/store-requisitions', icon: 'clipboard', color: '#059669' },
        { label: 'Agri and Car Rental', path: '/ceo/agri-and-car-rental', icon: 'truck', color: '#0ea5e9' },
        { label: 'Tender (Bid)', path: '/ceo/tenders', icon: 'award', color: '#84cc16' },
        { label: 'Printing', path: '/ceo/printing', icon: 'printer', color: '#a855f7' },
      ]
    },
    { type: 'divider' },
    { label: 'Administration', icon: 'shield',
      children: [
        { label: 'Job Applicants', path: '/ceo/applicants', icon: 'briefcase', color: '#f43f5e' },
        { label: 'Employee Approvals', path: '/ceo/employee-approvals', icon: 'user-check', color: '#10b981' },
        { label: 'HR Policies', path: '/ceo/policies', icon: 'shield', color: '#64748b' },
        { label: 'Announcements', path: '/ceo/announcements', icon: 'bell', color: '#fbbf24' },
        { label: 'Fund Approvals (M9)', path: '/ceo/tenders?tab=Fund Requests', icon: 'check-circle', color: '#eab308' },
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
    { type: 'divider' },
    { label: 'Setting Contact', icon: 'settings', children: [{ label: 'Chat', path: '/ceo/chat', icon: 'message-circle', color: '#6B8E23' }] },
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
            <Route path="finance" element={<CEOFinance />} />
            <Route path="hr" element={<CEOHR />} />
            <Route path="applicants" element={<CEOApplicants />} />
            <Route path="employee-approvals" element={<HREmployeesPending />} />
            <Route path="policies" element={<HRPolicies />} />
            <Route path="announcements" element={<HRAnnouncements />} />
            
            {/* Pharmacy Hub */}
            <Route path="pharmacy-hub" element={<CEOPharmacyHub />} />
            <Route path="pharmacy" element={<CEOPharmacyM20M22 />} />

            <Route path="procurement-decisions" element={<CEOProcurementDecisions />} />
            <Route path="direct-delivery" element={<CEODirectDelivery />} />
            <Route path="store-requisitions" element={<CEOStoreRequisitions />} />
            
            <Route path="tenders" element={<CEOTenderManager />} />
            
            <Route path="printing" element={<CEOPrinting />} />
            <Route path="agri-and-car-rental" element={<CEOAgriAndCarRental />} />

            {/* 9 Additional Approval & Report Modules */}
            <Route path="approvals/pending" element={<CEOPendingApprovals />} />
            <Route path="store-adjustments" element={<Navigate to="/ceo/pharmacy-hub?tab=adjustments" replace />} />
            <Route path="store-counts" element={<Navigate to="/ceo/pharmacy-hub?tab=counts" replace />} />
            <Route path="store-update-approvals" element={<Navigate to="/ceo/pharmacy-hub?tab=updates" replace />} />
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

            <Route path="chat" element={<ManagerChat />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default CEODashboard;
