import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FinanceHome from './FinanceHome';

// Cash Management
import FinanceCRV from './FinanceCRV';
import FinancePV from './FinancePV';
import FinancePCV from './FinancePCV';
import FinanceCashBook from './FinanceCashBook';
import FinanceBankAccounts from './FinanceBankAccounts';

// Receivables
import FinanceCustomers from './FinanceCustomers';
import FinanceCustomerInvoices from './FinanceCustomerInvoices';
import FinanceCustomerPayments from './FinanceCustomerPayments';
import FinanceOutstandingReceivables from './FinanceOutstandingReceivables';

// Payables
import FinanceSuppliers from './FinanceSuppliers';
import FinanceSupplierBills from './FinanceSupplierBills';
import FinanceSupplierPayments from './FinanceSupplierPayments';
import FinanceOutstandingPayables from './FinanceOutstandingPayables';

// Procurement
import FinanceProcurement from './FinanceProcurement';

// Accounting
import ChartOfAccounts from './ChartOfAccounts';
import FinanceJournalEntries from './FinanceJournalEntries';
import FinanceGeneralLedger from './FinanceGeneralLedger';
import FinanceTrialBalance from './FinanceTrialBalance';
import FinanceFiscalPeriods from './FinanceFiscalPeriods';

// Reports
import FinanceCashFlow from './FinanceCashFlow';
import FinanceProfitLoss from './FinanceProfitLoss';
import FinanceBalanceSheet from './FinanceBalanceSheet';
import FinanceIncomeExpense from './FinanceIncomeExpense';
import FinanceReportsHub from './FinanceReportsHub';

// Approvals
import FinancePendingVouchers from './FinancePendingVouchers';
import FinanceApprovedVouchers from './FinanceApprovedVouchers';
import FinanceRejectedVouchers from './FinanceRejectedVouchers';

import styles from './FinanceDashboard.module.css';

const FinanceDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/finance/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Cash Management', icon: 'wallet',
      children: [
        { label: '1. Cash Receipt Voucher', path: '/finance/crv',           icon: 'credit-card',  color: '#22c55e' },
        { label: '2. Payment Voucher',      path: '/finance/pv',            icon: 'shopping-cart', color: '#f59e0b' },
        { label: '3. Petty Cash Voucher',   path: '/finance/pcv',           icon: 'wallet',        color: '#8b5cf6' },
        { label: '4. Cash Book',            path: '/finance/cash-book',     icon: 'book',          color: '#06b6d4' },
        { label: '5. Bank Accounts',        path: '/finance/bank-accounts', icon: 'building',      color: '#3b82f6' },
      ] },
    { type: 'divider' },
    { label: 'Receivables', icon: 'users',
      children: [
        { label: '6. Customers',               path: '/finance/customers',           icon: 'users',         color: '#0284c7' },
        { label: '7. Customer Invoices',       path: '/finance/customer-invoices',   icon: 'file-text',     color: '#0ea5e9' },
        { label: '8. Customer Payments',       path: '/finance/customer-payments',   icon: 'credit-card',   color: '#22c55e' },
        { label: '9. Outstanding Receivables', path: '/finance/outstanding-ar',      icon: 'alert-circle',  color: '#0369a1' },
      ] },
    { type: 'divider' },
    { label: 'Payables', icon: 'truck',
      children: [
        { label: '10. Suppliers',             path: '/finance/suppliers',           icon: 'truck',         color: '#ea580c' },
        { label: '11. Supplier Bills',        path: '/finance/supplier-bills',      icon: 'file-text',     color: '#f97316' },
        { label: '12. Supplier Payments',     path: '/finance/supplier-payments',   icon: 'shopping-cart', color: '#f59e0b' },
        { label: '13. Outstanding Payables',  path: '/finance/outstanding-ap',      icon: 'alert-circle',  color: '#c2410c' },
      ] },
    { type: 'divider' },
    { label: 'Procurement Finance', icon: 'shopping-bag',
      children: [
        { label: '14. Procurement Finance',   path: '/finance/procurement',         icon: 'pie-chart',     color: '#db2777' },
      ] },
    { type: 'divider' },
    { label: 'Accounting', icon: 'book',
      children: [
        { label: '15. Chart of Accounts', path: '/finance/coa',             icon: 'list' },
        { label: '16. Journal Entries',   path: '/finance/journal',         icon: 'file-plus' },
        { label: '17. General Ledger',    path: '/finance/ledger',          icon: 'book' },
        { label: '18. Trial Balance',     path: '/finance/trial-balance',   icon: 'scale' },
        { label: '19. Fiscal Periods',    path: '/finance/fiscal-periods',  icon: 'calendar' },
      ] },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart-2',
      children: [
        { label: '20. Cash Flow',         path: '/finance/cash-flow',       icon: 'droplets',     color: '#0369a1' },
        { label: '21. Profit & Loss',     path: '/finance/profit-loss',     icon: 'trending-up',  color: '#059669' },
        { label: '22. Balance Sheet',     path: '/finance/balance-sheet',   icon: 'scale',        color: '#7c3aed' },
        { label: '23. Income & Expense',  path: '/finance/income-expense',  icon: 'bar-chart-2',  color: '#2563eb' },
        { label: '24. Financial Reports', path: '/finance/reports-hub',     icon: 'file-bar-chart', color: '#475569' },
      ] },
    { type: 'divider' },
    { label: 'Approvals', icon: 'check-circle',
      children: [
        { label: '25. Pending Vouchers',  path: '/finance/pending-vouchers',  icon: 'clock',         color: '#d97706' },
        { label: '26. Approved Vouchers', path: '/finance/approved-vouchers', icon: 'check-circle',  color: '#16a34a' },
        { label: '27. Rejected Vouchers', path: '/finance/rejected-vouchers', icon: 'x-circle',      color: '#dc2626' },
      ] },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Finance Dashboard — 27 Links">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<FinanceHome />} />

            {/* Cash Management */}
            <Route path="crv" element={<FinanceCRV />} />
            <Route path="pv" element={<FinancePV />} />
            <Route path="pcv" element={<FinancePCV />} />
            <Route path="cash-book" element={<FinanceCashBook />} />
            <Route path="bank-accounts" element={<FinanceBankAccounts />} />

            {/* Receivables */}
            <Route path="customers" element={<FinanceCustomers />} />
            <Route path="customer-invoices" element={<FinanceCustomerInvoices />} />
            <Route path="customer-payments" element={<FinanceCustomerPayments />} />
            <Route path="outstanding-ar" element={<FinanceOutstandingReceivables />} />

            {/* Payables */}
            <Route path="suppliers" element={<FinanceSuppliers />} />
            <Route path="supplier-bills" element={<FinanceSupplierBills />} />
            <Route path="supplier-payments" element={<FinanceSupplierPayments />} />
            <Route path="outstanding-ap" element={<FinanceOutstandingPayables />} />

            {/* Procurement */}
            <Route path="procurement" element={<FinanceProcurement />} />

            {/* Accounting */}
            <Route path="coa" element={<ChartOfAccounts />} />
            <Route path="journal" element={<FinanceJournalEntries />} />
            <Route path="ledger" element={<FinanceGeneralLedger />} />
            <Route path="trial-balance" element={<FinanceTrialBalance />} />
            <Route path="fiscal-periods" element={<FinanceFiscalPeriods />} />

            {/* Reports */}
            <Route path="cash-flow" element={<FinanceCashFlow />} />
            <Route path="profit-loss" element={<FinanceProfitLoss />} />
            <Route path="balance-sheet" element={<FinanceBalanceSheet />} />
            <Route path="income-expense" element={<FinanceIncomeExpense />} />
            <Route path="reports-hub" element={<FinanceReportsHub />} />

            {/* Approvals */}
            <Route path="pending-vouchers" element={<FinancePendingVouchers />} />
            <Route path="approved-vouchers" element={<FinanceApprovedVouchers />} />
            <Route path="rejected-vouchers" element={<FinanceRejectedVouchers />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default FinanceDashboard;
