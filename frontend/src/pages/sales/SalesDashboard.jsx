import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SalesHome from './SalesHome';
import POSPage from './POSPage';
import CustomerManagement from './CustomerManagement';
import SalesReports from './SalesReports';
import ReturnsPage from './ReturnsPage';
import ZReportPage from './ZReportPage';
import SalesOrders from './SalesOrders';
import SalesTenderProductPage from './SalesTenderProductPage';
import RetailOrderPage from './RetailOrderPage';
import SalesManagerHandover from './SalesManagerHandover';

// New Sales Manager Pages
import SalesManagerDashboard from './manager/SalesManagerDashboard';
import SalesNewSale from './manager/SalesNewSale';
import SalesQuotations from './manager/SalesQuotations';
import SalesManagerOrders from './manager/SalesOrders';
import SalesInvoices from './manager/SalesInvoices';
import SalesManagerReturns from './manager/SalesReturns';
import SalesHistory from './manager/SalesHistory';
import SalesCustomerList from './manager/SalesCustomerList';
import SalesAddCustomer from './manager/SalesAddCustomer';
import SalesCreditCustomers from './manager/SalesCreditCustomers';
import SalesCustomerStatement from './manager/SalesCustomerStatement';

// Addendum Pages
import ReceivePayment from './manager/payments/ReceivePayment';
import PaymentHistory from './manager/payments/PaymentHistory';
import OutstandingPayments from './manager/payments/OutstandingPayments';

import ProductCatalog from './manager/products/ProductCatalog';
import StockAvailability from './manager/products/StockAvailability';
import PriceList from './manager/products/PriceList';
import Promotions from './manager/products/Promotions';

import PendingApprovals from './manager/approvals/PendingApprovals';
import ApprovedApprovals from './manager/approvals/ApprovedApprovals';
import RejectedApprovals from './manager/approvals/RejectedApprovals';

// Reports Addendum Pages
import SalesReport from './manager/reports/SalesReport';
import DailySales from './manager/reports/DailySales';
import MonthlySales from './manager/reports/MonthlySales';
import CustomerReport from './manager/reports/CustomerReport';
import ProductPerformance from './manager/reports/ProductPerformance';

const SalesDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/sales/manager/dashboard', icon: 'home', color: '#3b82f6' },
    { type: 'divider' },
    
    // --- NEW SALES MANAGER SECTION ---
    { label: 'Sales Manager', icon: 'trending-up',
      children: [
        { label: 'New Sale',       path: '/sales/manager/new-sale',  icon: 'shopping-cart',color: '#22c55e' },
        { label: 'Quotations',     path: '/sales/manager/quotations',icon: 'file-text',    color: '#f59e0b' },
        { label: 'Sales Orders',   path: '/sales/manager/orders',    icon: 'package',      color: '#06b6d4' },
        { label: 'Invoices',       path: '/sales/manager/invoices',  icon: 'file-plus',    color: '#8b5cf6' },
        { label: 'Sales Returns',  path: '/sales/manager/returns',   icon: 'rotate-ccw',   color: '#f97316' },
        { label: 'Sales History',  path: '/sales/manager/history',   icon: 'clock',        color: '#64748b' },
      ]
    },
    { type: 'divider' },
    { label: 'Customers (Manager)', icon: 'users',
      children: [
        { label: 'Customer List',    path: '/sales/manager/customers',          icon: 'users',      color: '#3b82f6' },
        { label: 'Add Customer',     path: '/sales/manager/customers/new',      icon: 'user-plus',  color: '#22c55e' },
        { label: 'Credit Customers', path: '/sales/manager/customers/credit',   icon: 'credit-card',color: '#ef4444' },
        { label: 'Statements',       path: '/sales/manager/customers/statement',icon: 'file-text',  color: '#8b5cf6' },
      ]
    },
    { type: 'divider' },
    { label: 'Payments (Manager)', icon: 'wallet',
      children: [
        { label: 'Receive Payment',     path: '/sales/manager/payments/new',      icon: 'credit-card', color: '#22c55e' },
        { label: 'Payment History',     path: '/sales/manager/payments/history',  icon: 'clock',       color: '#3b82f6' },
        { label: 'Outstanding Payments', path: '/sales/manager/payments/outstanding', icon: 'alert-circle', color: '#ef4444' },
      ]
    },
    { type: 'divider' },
    { label: 'Products (Manager)', icon: 'box',
      children: [
        { label: 'Product Catalog',    path: '/sales/manager/products/catalog',    icon: 'package', color: '#8b5cf6' },
        { label: 'Stock Availability', path: '/sales/manager/products/stock',      icon: 'layers',  color: '#0ea5e9' },
        { label: 'Price List',         path: '/sales/manager/products/pricelist',  icon: 'tag',     color: '#f59e0b' },
        { label: 'Promotions',         path: '/sales/manager/products/promotions', icon: 'star',    color: '#ec4899' },
      ]
    },
    { type: 'divider' },
    { label: 'Approvals (Manager)', icon: 'check-circle',
      children: [
        { label: 'Pending Approval', path: '/sales/manager/approvals/pending',  icon: 'clock',        color: '#f59e0b' },
        { label: 'Approved',         path: '/sales/manager/approvals/approved', icon: 'check-circle', color: '#10b981' },
        { label: 'Rejected',         path: '/sales/manager/approvals/rejected', icon: 'x-circle',     color: '#ef4444' },
      ]
    },
    { type: 'divider' },
    // --- END NEW SECTION ---

    { label: 'POS & Operations', icon: 'monitor',
      children: [
        { label: 'Point of Sale',  path: '/sales/pos',           icon: 'shopping-cart', color: '#22c55e' },
        { label: 'Retail Orders',  path: '/sales/retail-order',  icon: 'package',       color: '#3b82f6' },
        { label: 'Daily Sales',    path: '/sales/z-report',      icon: 'clock',         color: '#f59e0b' },
        { label: 'Handover',       path: '/sales/handover',      icon: 'file-text',     color: '#8b5cf6' },
      ] },
    { type: 'divider' },
    { label: 'Reports (Manager)', icon: 'pie-chart',
      children: [
        { label: 'Sales Report',          path: '/sales/manager/reports/sales',       icon: 'trending-up',  color: '#3b82f6' },
        { label: 'Daily Sales',           path: '/sales/manager/reports/daily',       icon: 'sun',          color: '#f59e0b' },
        { label: 'Monthly Sales',         path: '/sales/manager/reports/monthly',     icon: 'bar-chart-2',  color: '#10b981' },
        { label: 'Customer Report',       path: '/sales/manager/reports/customers',   icon: 'users',        color: '#8b5cf6' },
        { label: 'Product Performance',   path: '/sales/manager/reports/products',    icon: 'package',      color: '#ec4899' },
      ] },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          {/* Existing Routes */}
          <Route path="pos" element={<POSPage />} />
          <Route path="orders" element={<SalesOrders />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="reports" element={<SalesReports />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="z-report" element={<ZReportPage />} />
          <Route path="tender-product" element={<SalesTenderProductPage />} />
          <Route path="retail-order" element={<RetailOrderPage />} />
          <Route path="handover" element={<SalesManagerHandover />} />
          
          {/* New Manager Routes */}
          <Route path="manager/dashboard" element={<SalesManagerDashboard />} />
          <Route path="manager/new-sale" element={<SalesNewSale />} />
          <Route path="manager/quotations" element={<SalesQuotations />} />
          <Route path="manager/orders" element={<SalesManagerOrders />} />
          <Route path="manager/invoices" element={<SalesInvoices />} />
          <Route path="manager/returns" element={<SalesManagerReturns />} />
          <Route path="manager/history" element={<SalesHistory />} />
          <Route path="manager/customers" element={<SalesCustomerList />} />
          <Route path="manager/customers/new" element={<SalesAddCustomer />} />
          <Route path="manager/customers/credit" element={<SalesCreditCustomers />} />
          <Route path="manager/customers/statement" element={<SalesCustomerStatement />} />

          {/* Addendum Routes */}
          <Route path="manager/payments/new" element={<ReceivePayment />} />
          <Route path="manager/payments/history" element={<PaymentHistory />} />
          <Route path="manager/payments/outstanding" element={<OutstandingPayments />} />

          <Route path="manager/products/catalog" element={<ProductCatalog />} />
          <Route path="manager/products/stock" element={<StockAvailability />} />
          <Route path="manager/products/pricelist" element={<PriceList />} />
          <Route path="manager/products/promotions" element={<Promotions />} />

          <Route path="manager/approvals/pending" element={<PendingApprovals />} />
          <Route path="manager/approvals/approved" element={<ApprovedApprovals />} />
          <Route path="manager/approvals/rejected" element={<RejectedApprovals />} />

          {/* Reports Addendum Routes */}
          <Route path="manager/reports/sales" element={<SalesReport />} />
          <Route path="manager/reports/daily" element={<DailySales />} />
          <Route path="manager/reports/monthly" element={<MonthlySales />} />
          <Route path="manager/reports/customers" element={<CustomerReport />} />
          <Route path="manager/reports/products" element={<ProductPerformance />} />

          <Route path="/" element={<Navigate to="manager/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default SalesDashboard;
