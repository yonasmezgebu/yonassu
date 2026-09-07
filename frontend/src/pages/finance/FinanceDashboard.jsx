import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FinanceHome from './FinanceHome';

// Cash Management
import FinanceEV from './FinanceEV';
import FinanceCashBook from './FinanceCashBook';
import FinanceCRV from './FinanceCRV';
import FinanceBankAccounts from './FinanceBankAccounts';
import FinancePayrollPayment from './FinancePayrollPayment';

// Receivables
import FinanceOutstandingReceivables from './FinanceOutstandingReceivables';
import FinanceAccountsReceivable from './FinanceAccountsReceivable';

// Payables
import FinanceLiabilities from './FinanceLiabilities';

// Procurement
import FinanceProcurement from './FinanceProcurement';
import FinanceGeneralProcurement from './FinanceGeneralProcurement';

// Reports
import FinanceCashFlow from './FinanceCashFlow';
import FinanceProfitLoss from './FinanceProfitLoss';
import FinanceBalanceSheet from './FinanceBalanceSheet';
import FinanceEquity from './FinanceEquity';

import FinanceLiveIncome from './FinanceLiveIncome';
import FinanceReceiptsDashboard from './FinanceReceiptsDashboard';
import FinancePrintingAssets from './FinancePrintingAssets';
import FinancePrintingMachines from './FinancePrintingMachines';
import FinancePharmacyAssets from './FinancePharmacyAssets';
import FinanceVehicleAssets from './FinanceVehicleAssets';
import FinanceTractorAssets from './FinanceTractorAssets';
import CentralAuditLog from '../admin/CentralAuditLog';
import styles from './FinanceDashboard.module.css';

const FinanceDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/finance/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Expense', icon: 'wallet',
      children: [
        { label: 'Expense Vouchers (EV)',         path: '/finance/ev',                    icon: 'file-text',     color: '#f59e0b' },
        { label: 'Procurement (Drug/Stock)',       path: '/finance/procurement',           icon: 'package',       color: '#15803d' },
        { label: 'General Procurement',           path: '/finance/general-procurement',   icon: 'truck',         color: '#047857' },
        { label: 'Expense Book',                  path: '/finance/cash-book',             icon: 'book',          color: '#06b6d4' },
        { label: 'Liabilities & Accounts Payable',path: '/finance/liabilities',           icon: 'alert-circle',  color: '#eab308' },
      ] },
    { type: 'divider' },
    { label: 'Accounts and reconciliation', path: '/finance/bank-accounts', icon: 'building', color: '#3b82f6' },

    { label: 'Receipts', path: '/finance/invoices', icon: 'receipt', color: '#2563eb' },
    { type: 'divider' },
    { label: 'Revenue', icon: 'trending-up',
      children: [
        { label: 'Receipts (CRV)',                path: '/finance/crv',                   icon: 'shopping-cart', color: '#10b981' },
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
    { type: 'divider' },
    { label: 'Audit Log', path: '/finance/audit-log', icon: 'clipboard', color: '#6366f1' },
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
            <Route path="ev" element={<FinanceEV />} />
            <Route path="crv" element={<FinanceCRV />} />
            <Route path="cash-book" element={<FinanceCashBook />} />
            <Route path="bank-accounts" element={<FinanceBankAccounts />} />
            <Route path="payroll-payment" element={<FinancePayrollPayment />} />

            {/* Receivables */}
            <Route path="outstanding-ar" element={<FinanceOutstandingReceivables />} />
            <Route path="accounts-receivable" element={<FinanceAccountsReceivable />} />

            {/* Payables */}
            <Route path="liabilities" element={<FinanceLiabilities />} />

            {/* Procurement */}
            <Route path="procurement" element={<FinanceProcurement />} />
            <Route path="general-procurement" element={<FinanceGeneralProcurement />} />
            
            {/* Live Income & Equity */}
            <Route path="pharmacy-sales" element={<FinanceLiveIncome />} />
            <Route path="invoices" element={<FinanceReceiptsDashboard />} />
            <Route path="receipts" element={<FinanceReceiptsDashboard />} />
            <Route path="equity" element={<FinanceEquity />} />

            {/* Reports */}
            <Route path="cash-flow" element={<FinanceCashFlow />} />
            <Route path="profit-loss" element={<FinanceProfitLoss />} />
            <Route path="balance-sheet" element={<FinanceBalanceSheet />} />
            <Route path="audit-log" element={<CentralAuditLog mode="finance" />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default FinanceDashboard;
