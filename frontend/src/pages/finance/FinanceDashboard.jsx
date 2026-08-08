import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FinanceHome from './FinanceHome';

// Cash Management
import FinancePV from './FinancePV';
import FinancePCV from './FinancePCV';
import FinancePendingPCVs from './FinancePendingPCVs';
import FinanceCashBook from './FinanceCashBook';
import FinanceBankAccounts from './FinanceBankAccounts';
import FinancePayrollPayment from './FinancePayrollPayment';

// Receivables
import FinanceOutstandingReceivables from './FinanceOutstandingReceivables';
import FinanceAccountsReceivable from './FinanceAccountsReceivable';

// Payables
import FinanceSuppliers from './FinanceSuppliers';
import FinanceSupplierBills from './FinanceSupplierBills';
import FinanceSupplierPayments from './FinanceSupplierPayments';
import FinanceLiabilities from './FinanceLiabilities';

// Procurement
import FinanceProcurement from './FinanceProcurement';

// Reports
import FinanceCashFlow from './FinanceCashFlow';
import FinanceProfitLoss from './FinanceProfitLoss';
import FinanceBalanceSheet from './FinanceBalanceSheet';
import FinanceEquity from './FinanceEquity';

import FinanceLiveIncome from './FinanceLiveIncome';
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
    { label: 'Expense', icon: 'wallet',
      children: [
        { label: 'Payment Voucher',      path: '/finance/pv',              icon: 'shopping-cart', color: '#f59e0b' },
        { label: 'Petty Cash Voucher',   path: '/finance/pcv',             icon: 'wallet',        color: '#8b5cf6' },
        { label: 'Expense Book',         path: '/finance/cash-book',       icon: 'book',          color: '#06b6d4' },
        { label: 'Payroll Payment',      path: '/finance/payroll-payment', icon: 'users',         color: '#16A34A' },
        { label: 'Liabillites&accounts payable', path: '/finance/liabilities', icon: 'alert-circle', color: '#eab308' },
      ] },
    { type: 'divider' },
    { label: 'Accounts and reconciliation', path: '/finance/bank-accounts', icon: 'building', color: '#3b82f6' },
    { type: 'divider' },
    { label: 'Revenue', icon: 'users',
      children: [
        { label: 'Live Income (All Departments)', path: '/finance/pharmacy-sales', icon: 'trending-up', color: '#ef4444' },
        { label: 'Revenue Book',             path: '/finance/outstanding-ar', icon: 'book-open',   color: '#0284c7' },
        { label: 'Accounts Receivable',      path: '/finance/accounts-receivable', icon: 'users', color: '#3b82f6' },
        { label: 'Equity',                   path: '/finance/equity',         icon: 'pie-chart',   color: '#10b981' },
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
        { label: 'Cash Flow',        path: '/finance/cash-flow',    icon: 'droplets',    color: '#0369a1' },
        { label: 'Income Statement', path: '/finance/profit-loss',  icon: 'trending-up', color: '#059669' },
        { label: 'Balance Sheet',    path: '/finance/balance-sheet', icon: 'scale',      color: '#7c3aed' },
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
            <Route path="pv" element={<FinancePV />} />
            <Route path="pcv" element={<FinancePCV />} />
            <Route path="cash-book" element={<FinanceCashBook />} />
            <Route path="bank-accounts" element={<FinanceBankAccounts />} />
            <Route path="payroll-payment" element={<FinancePayrollPayment />} />

            {/* Receivables */}
            <Route path="outstanding-ar" element={<FinanceOutstandingReceivables />} />
            <Route path="accounts-receivable" element={<FinanceAccountsReceivable />} />

            {/* Payables */}
            <Route path="suppliers" element={<FinanceSuppliers />} />
            <Route path="supplier-bills" element={<FinanceSupplierBills />} />
            <Route path="supplier-payments" element={<FinanceSupplierPayments />} />
            <Route path="liabilities" element={<FinanceLiabilities />} />

            {/* Procurement */}
            <Route path="procurement" element={<FinanceProcurement />} />
            
            {/* Live Income & Equity */}
            <Route path="pharmacy-sales" element={<FinanceLiveIncome />} />
            <Route path="equity" element={<FinanceEquity />} />

            {/* Reports */}
            <Route path="cash-flow" element={<FinanceCashFlow />} />
            <Route path="profit-loss" element={<FinanceProfitLoss />} />
            <Route path="balance-sheet" element={<FinanceBalanceSheet />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default FinanceDashboard;
