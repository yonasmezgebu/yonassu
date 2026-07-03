import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import styles from './BoardDashboard.module.css';

// Overview & Performance
import {
  CompanyOverview,
  PerformanceSummary,
  KeyAlerts,
  CEOPerformance,
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
  CEODecisions,
  MajorInvestments,
  PolicyChanges,
} from './approvals/ApprovalPages';

// Operations & Compliance
import {
  BranchOverview,
  DepartmentOverview,
  StructureReview,
  AuditLogsReadOnly,
  AuditReports,
  ComplianceStatus,
  LegalReports,
} from './operations/OperationsPages';

/* ── Main Dashboard ── */

const BoardDashboard = () => {
  const menuItems = [
    { 
      label: 'Executive', 
      icon: 'dashboard',
      children: [
        { label: 'Company Overview',    path: '/board/company-overview',       icon: 'home' },
        { label: 'Performance Summary', path: '/board/performance-summary',    icon: 'bar-chart' },
        { label: 'Key Alerts',          path: '/board/key-alerts',             icon: 'alert-triangle' },
      ]
    },
    { 
      label: 'Leadership', 
      icon: 'users',
      children: [
        { label: 'CEO Performance',     path: '/board/ceo-performance',        icon: 'user-check' },
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
        { label: 'CEO Decisions',       path: '/board/ceo-decisions',          icon: 'user-check' },
        { label: 'Budget Approval',     path: '/board/budget-approval',        icon: 'check-circle' },
        { label: 'Major Investments',   path: '/board/major-investments',      icon: 'trending-up' },
        { label: 'Policy Changes',      path: '/board/policy-changes',         icon: 'settings' },
      ]
    },
    { 
      label: 'Operations', 
      icon: 'layers',
      children: [
        { label: 'Branch Overview',     path: '/board/branch-overview',        icon: 'building' },
        { label: 'Department Overview', path: '/board/department-overview',    icon: 'layers' },
        { label: 'Structure Review',    path: '/board/structure-review',       icon: 'git-branch' },
      ]
    },
    { 
      label: 'Governance', 
      icon: 'settings',
      children: [
        { label: 'Audit Logs',          path: '/board/audit-logs',             icon: 'lock' },
        { label: 'Compliance Status',   path: '/board/compliance-status',      icon: 'shield' },
        { label: 'Legal Reports',       path: '/board/legal-reports',          icon: 'scale' },
      ]
    }
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Board of Directors">
        <div className={styles.dashboardContent}>
          <Routes>
            {/* Overview & Performance */}
            <Route path="company-overview"    element={<CompanyOverview />} />
            <Route path="performance-summary" element={<PerformanceSummary />} />
            <Route path="key-alerts"          element={<KeyAlerts />} />
            <Route path="ceo-performance"     element={<CEOPerformance />} />
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
            <Route path="ceo-decisions"       element={<CEODecisions />} />
            <Route path="budget-approval"     element={<BudgetApproval />} />
            <Route path="major-investments"   element={<MajorInvestments />} />
            <Route path="policy-changes"      element={<PolicyChanges />} />

            {/* Operations */}
            <Route path="branch-overview"     element={<BranchOverview />} />
            <Route path="department-overview" element={<DepartmentOverview />} />
            <Route path="structure-review"    element={<StructureReview />} />

            {/* Governance — Audit Logs is provably read-only, no write routes */}
            <Route path="audit-logs"          element={<AuditLogsReadOnly />} />
            <Route path="compliance-status"   element={<ComplianceStatus />} />
            <Route path="legal-reports"       element={<LegalReports />} />

            {/* Redirects */}
            <Route path="overview"            element={<Navigate to="company-overview" replace />} />
            <Route path="/"                   element={<Navigate to="company-overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default BoardDashboard;
