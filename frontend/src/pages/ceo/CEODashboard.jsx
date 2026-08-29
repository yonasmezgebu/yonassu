import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Core Dashboard Overview
import CEOHome from './CEOHome';

// Old CEO Modules that should be restored
import ExecutiveReports from './ExecutiveReports';

// 15 New CEO Modules
import CEOSales from './CEOSales';
import CEOPurchase from './CEOPurchase';
import CEOFinance from './CEOFinance';
import CEOFinanceApprovals from './CEOFinanceApprovals';
import CEOHR from './CEOHR';
import HRPolicies from '../hr/HRPolicies';
import HRAnnouncements from '../hr/HRAnnouncements';
import CEOPharmacyHub from './CEOPharmacyHub';
import CEOPharmacySales from './CEOPharmacySales';
import CEOStoreRequisitions from './CEOStoreRequisitions';
import CEOProcurementDecisions from '../procurement/CEOProcurementDecisions';
import CEOTenderManager from './CEOTenderManager';
import CEOPrinting from './CEOPrinting';
import CEOAgriAndCarRental from './CEOAgriAndCarRental';
import CEOApplicants from './CEOApplicants';
import CEOGeneralProcurementPaymentApprovals from './CEOGeneralProcurementPaymentApprovals';
import HREmployeesPending from '../hr/HREmployeesPending';
import CEOPayrollApproval from './CEOPayrollApproval';

// Approval & Report Modules
import CEOApprovalsHub from './CEOApprovalsHub';
import CEOApprovedApprovals from './CEOApprovedApprovals';
import CEORejectedApprovals from './CEORejectedApprovals';
import CEOStoreApprovals from './CEOStoreApprovals';
import CEOAuditLog from './CEOAuditLog';
import CEOVatConfig from './CEOVatConfig';
import CEODangerZone from './CEODangerZone';
import CEOQuotationApprovals from './CEOQuotationApprovals';

import ManagerChat from '../../components/ManagerChat';
import styles from './CEODashboard.module.css';
import apiClient from '../../services/apiClient';

const CEODashboard = () => {
  const [storeApprovalCount, setStoreApprovalCount] = useState(0);

  // Poll for pending store update approvals
  const fetchStoreApprovalCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/ceo/store-updates/pending');
      if (res?.data?.updates) {
        const count = Array.isArray(res.data.updates) ? res.data.updates.length : 0;
        setStoreApprovalCount(count);
      }
    } catch (_) {
      // Silently fail — don't break the dashboard
    }
  }, []);

  useEffect(() => {
    fetchStoreApprovalCount();
    // Refresh every 60 seconds
    const id = setInterval(fetchStoreApprovalCount, 60_000);
    window.addEventListener('refreshNotifications', fetchStoreApprovalCount);
    return () => {
      clearInterval(id);
      window.removeEventListener('refreshNotifications', fetchStoreApprovalCount);
    };
  }, [fetchStoreApprovalCount]);

  const menuItems = [
    { label: 'Dashboard', path: '/ceo/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Business', icon: 'bar-chart-2',
      children: [
        { label: 'Sales', path: '/ceo/sales', icon: 'trending-up', color: '#10b981' },
        { label: 'Purchase', path: '/ceo/purchase', icon: 'shopping-cart', color: '#3b82f6' },
        { label: 'Finance', path: '/ceo/finance', icon: 'dollar-sign', color: '#8b5cf6' },
        { label: 'HR', path: '/ceo/hr', icon: 'users', color: '#ec4899' },
        { label: 'Pharmacy', path: '/ceo/pharmacy', icon: 'plus-circle', color: '#ef4444' },
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
        { label: 'Approvals Hub', path: '/ceo/approvals', icon: 'check-circle', color: '#10b981', altActiveOn: ['/ceo/finance-approvals', '/ceo/salary-approval', '/ceo/store-approvals', '/ceo/approvals/tenders', '/ceo/approvals/printing', '/ceo/approvals/agri-and-car-rental', '/ceo/approvals/approved', '/ceo/approvals/rejected', '/ceo/employee-approvals', '/ceo/payment-approvals', '/ceo/procurement-decisions', '/ceo/danger-zone', '/ceo/quotation-approvals'] },
        { label: 'HR Policies', path: '/ceo/policies', icon: 'shield', color: '#64748b' },
        { label: 'Announcements', path: '/ceo/announcements', icon: 'bell', color: '#fbbf24' },
      ]
    },
    { type: 'divider' },
    { label: 'Reports', path: '/ceo/reports', icon: 'file-text', color: '#3b82f6' },
    { type: 'divider' },
    { label: 'Setting', icon: 'settings', children: [
        { label: 'Chat', path: '/ceo/chat', icon: 'message-circle', color: '#6B8E23' },
        { label: 'VAT Configuration', path: '/ceo/vat-config', icon: 'percent', color: '#2563EB' },
    ] },
    { type: 'divider' },
    { label: 'Audit Log', path: '/ceo/audit-logs', icon: 'shield', color: '#3b82f6' },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="🏛️ CEO DASHBOARD - SUTANA BUSINESS">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<CEOHome />} />
            
            {/* Business Modules */}
            <Route path="sales" element={<CEOSales />} />
            <Route path="purchase" element={<CEOPurchase />} />
            <Route path="finance" element={<CEOFinance />} />
            <Route path="hr" element={<CEOHR />} />
            <Route path="applicants" element={<CEOApplicants />} />

            {/* Approvals Hub — the central landing page for all approvals */}
            <Route path="approvals" element={<CEOApprovalsHub />} />

            {/* Individual approval flows */}
            <Route path="employee-approvals" element={<HREmployeesPending />} />
            <Route path="salary-approval" element={<CEOPayrollApproval />} />
            <Route path="store-approvals" element={<CEOStoreApprovals />} />
            <Route path="finance-approvals" element={<CEOFinanceApprovals />} />
            <Route path="payment-approvals" element={<CEOGeneralProcurementPaymentApprovals />} />
            <Route path="quotation-approvals" element={<CEOQuotationApprovals />} />

            <Route path="policies" element={<HRPolicies />} />
            <Route path="announcements" element={<HRAnnouncements />} />
            
            {/* Pharmacy Hub */}
            <Route path="pharmacy-hub" element={<CEOPharmacyHub />} />
            <Route path="pharmacy" element={<CEOPharmacySales />} />

            <Route path="procurement-decisions" element={<CEOProcurementDecisions />} />
            <Route path="store-requisitions" element={<CEOStoreRequisitions />} />
            
            <Route path="tenders" element={<CEOTenderManager />} />
            
            <Route path="printing" element={<CEOPrinting />} />
            <Route path="agri-and-car-rental" element={<CEOAgriAndCarRental />} />

            {/* Approval Lists */}
            <Route path="approvals/tenders" element={<CEOTenderManager isApprovalMode={true} />} />
            <Route path="approvals/printing" element={<CEOPrinting isApprovalMode={true} />} />
            <Route path="approvals/agri-and-car-rental" element={<CEOAgriAndCarRental isApprovalMode={true} />} />
            
            <Route path="store-adjustments" element={<Navigate to="/ceo/pharmacy-hub?tab=adjustments" replace />} />
            <Route path="store-counts" element={<Navigate to="/ceo/pharmacy-hub?tab=counts" replace />} />
            <Route path="store-update-approvals" element={<Navigate to="/ceo/store-approvals" replace />} />
            <Route path="approvals/approved" element={<CEOApprovedApprovals />} />
            <Route path="approvals/rejected" element={<CEORejectedApprovals />} />

            {/* Reports */}
            <Route path="reports"   element={<ExecutiveReports />} />
            <Route path="audit-logs" element={<CEOAuditLog />} />

            <Route path="chat" element={<ManagerChat />} />
            <Route path="vat-config" element={<CEOVatConfig />} />
            <Route path="danger-zone" element={<CEODangerZone />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default CEODashboard;
