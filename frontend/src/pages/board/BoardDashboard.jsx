import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ManagerChat from '../../components/ManagerChat';
import styles from './BoardDashboard.module.css';

// Overview & Performance
import {
  ExecutiveOverview,
  DepartmentSummary,
} from './overview/OverviewPages';

// Strategy & Risk
import { StrategyProgress, RiskOverview } from './strategy/StrategyPages';

// Financials & Reports
import {
  RevenueSummary,
  ExpenseSummary,
  ProfitLoss,
  ReportGenerator,
} from './financials/FinancialPages';

// Approvals
import {
  BudgetApproval,
  MajorInvestments,
  PolicyChanges,
} from './approvals/ApprovalPages';

// Audit Reports for the Reports section
import {
  AuditReports,
} from './operations/OperationsPages';

/* ── Main Dashboard ── */

const BoardDashboard = () => {
  const menuItems = [
    { 
      label: 'Executive', 
      path: '/board/executive',
      icon: 'dashboard',
    },
    { 
      label: 'Leadership', 
      icon: 'users',
      children: [
        { label: 'Department Summary',  path: '/board/department-summary',     icon: 'users' },
        { label: 'Strategy Progress',   path: '/board/strategy-progress',      icon: 'target' },
        { label: 'Risk Overview',       path: '/board/risk-overview',          icon: 'shield' },
      ]
    },
    { 
      label: 'Financials', 
      icon: 'wallet',
      children: [
        { label: 'Revenue Summary',     path: '/board/revenue-summary',        icon: 'trending-up' },
        { label: 'Expense Summary',     path: '/board/expense-summary',        icon: 'wallet' },
        { label: 'Profit & Loss',       path: '/board/profit-loss',            icon: 'bar-chart-2' },
      ]
    },
    { 
      label: 'Reports', 
      icon: 'file-text',
      children: [
        { label: 'Monthly Reports',     path: '/board/monthly-reports',        icon: 'file-text' },
        { label: 'Quarterly Reports',   path: '/board/quarterly-reports',      icon: 'file-text' },
        { label: 'Annual Reports',      path: '/board/annual-reports',         icon: 'file-text' },
        { label: 'Audit Reports',       path: '/board/audit-reports',          icon: 'clipboard' },
      ]
    },
    { 
      label: 'Approvals', 
      icon: 'clipboard',
      children: [
        { label: 'Budget Approval',     path: '/board/budget-approval',        icon: 'check-circle' },
        { label: 'Major Investments',   path: '/board/major-investments',      icon: 'trending-up' },
        { label: 'Policy Changes',      path: '/board/policy-changes',         icon: 'settings' },
      ]
    },
    { type: 'divider' },
    { 
      label: 'Contact', 
      icon: 'message-circle', 
      children: [
        { label: 'Chat', path: '/board/chat', icon: 'message-square', color: '#6B8E23' }
      ] 
    }
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Board of Directors">
        <div className={styles.dashboardContent}>
          <Routes>
            {/* Overview & Performance */}
            <Route path="executive"           element={<ExecutiveOverview />} />
            <Route path="department-summary"  element={<DepartmentSummary />} />

            {/* Strategy & Risk */}
            <Route path="strategy-progress"   element={<StrategyProgress />} />
            <Route path="risk-overview"       element={<RiskOverview />} />

            {/* Financials */}
            <Route path="revenue-summary"     element={<RevenueSummary />} />
            <Route path="expense-summary"     element={<ExpenseSummary />} />
            <Route path="profit-loss"         element={<ProfitLoss />} />

            {/* Reports — one parameterized generator */}
            <Route path="monthly-reports"     element={<ReportGenerator periodType="Monthly" />} />
            <Route path="quarterly-reports"   element={<ReportGenerator periodType="Quarterly" />} />
            <Route path="annual-reports"      element={<ReportGenerator periodType="Annual" />} />
            <Route path="audit-reports"       element={<AuditReports />} />

            {/* Approvals */}
            <Route path="budget-approval"     element={<BudgetApproval />} />
            <Route path="major-investments"   element={<MajorInvestments />} />
            <Route path="policy-changes"      element={<PolicyChanges />} />

            {/* Chat */}
            <Route path="chat"                element={<ManagerChat />} />

            {/* Redirects */}
            <Route path="overview"            element={<Navigate to="executive" replace />} />
            <Route path="/"                   element={<Navigate to="executive" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default BoardDashboard;
