import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FinanceHome from './FinanceHome';

// Cash Management
import FinanceCRV from './FinanceCRV';
import FinancePV from './FinancePV';
import FinancePCV from './FinancePCV';
import FinancePendingPCVs from './FinancePendingPCVs';
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

import FinanceLiveIncome from './FinanceLiveIncome';
import PurchaseFlowDashboard from './PurchaseFlowDashboard';
import FinancePrintingAssets from './FinancePrintingAssets';
import FinancePrintingMachines from './FinancePrintingMachines';
import FinancePharmacyAssets from './FinancePharmacyAssets';
import FinanceVehicleAssets from './FinanceVehicleAssets';
import FinanceTractorAssets from './FinanceTractorAssets';

import styles from './FinanceDashboard.module.css';

const FinanceDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/finance/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Finance Management', icon: 'wallet',
      children: [
        { label: '1. Cash Receipt Voucher', path: '/finance/crv',           icon: 'credit-card',  color: '#22c55e' },
        { label: '2. Payment Voucher',      path: '/finance/pv',            icon: 'shopping-cart', color: '#f59e0b' },
        { label: '3. Petty Cash Voucher',   path: '/finance/pcv',           icon: 'wallet',        color: '#8b5cf6' },
        { label: '4. Cash Book',            path: '/finance/cash-book',     icon: 'book',          color: '#06b6d4' },
      ] },
    { type: 'divider' },
    { label: 'Accounts and reconciliation', path: '/finance/bank-accounts', icon: 'building', color: '#3b82f6' },
    { type: 'divider' },
    { label: 'Receivables', icon: 'users',
      children: [
        { label: 'Live Income',      path: '/finance/pharmacy-sales', icon: 'trending-up', color: '#ef4444' },
        { label: 'Receivables Book', path: '/finance/outstanding-ar', icon: 'book-open',   color: '#0284c7' },
      ] },
    { type: 'divider' },
    { label: 'Assets', icon: 'package',
      children: [
        { label: 'General Store Valuation',      path: '/finance/general-store-assets', icon: 'package', color: '#228B22' },
        { label: 'Printing Machines Valuation',  path: '/finance/printing-machines-assets', icon: 'printer', color: '#2E8B57' },
        { label: 'Pharmacy Store & Stock',       path: '/finance/pharmacy-assets', icon: 'briefcase', color: '#6B8E23' },
        { label: 'Vehicle & Rental Assets',      path: '/finance/vehicle-assets', icon: 'truck', color: '#1B5E20' },
        { label: 'Tractor Assets',               path: '/finance/tractor-assets', icon: 'truck', color: '#8BC34A' },
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
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Finance Dashboard">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<FinanceHome />} />

            {/* Assets */}
            <Route path="general-store-assets" element={<FinancePrintingAssets />} />
            <Route path="printing-machines-assets" element={<FinancePrintingMachines />} />
            <Route path="pharmacy-assets" element={<FinancePharmacyAssets />} />
            <Route path="vehicle-assets" element={<FinanceVehicleAssets />} />
            <Route path="tractor-assets" element={<FinanceTractorAssets />} />

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

            {/* Procurement */}
            <Route path="procurement" element={<FinanceProcurement />} />
            
            {/* Live Income */}
            <Route path="pharmacy-sales" element={<FinanceLiveIncome />} />

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
