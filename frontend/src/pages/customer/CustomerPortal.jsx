import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Actual fully-featured customer service pages
import CustomerAllOrders      from './CustomerAllOrders';
import CustomerFarmingOrders  from './CustomerFarmingOrders';
import CustomerPrintingOrders from './CustomerPrintingOrders';
import CustomerRetailOrders   from './CustomerRetailOrders';
import CustomerRentals        from './CustomerRentals';
import CustomerPrescriptions  from './CustomerPrescriptions';
import CustomerBids           from './CustomerBids';
import CustomerInvoices       from './CustomerInvoices';
import CustomerReceipts       from './CustomerReceipts';
import SupportTickets         from './SupportTickets';
import CustomerBecomeSupplier from './CustomerBecomeSupplier';

const CustomerPortal = () => {
  const menuItems = [
    { label: 'Overview',   path: '/customer/dashboard', icon: 'home', color: '#3b82f6' },
    { type: 'divider' },

    {
      label: 'My Services', icon: 'shopping-cart',
      children: [
        { label: 'Printing Orders',  path: '/customer/printing-orders', icon: 'printer',       color: '#3b82f6' },
        { label: 'AgriRent Orders',   path: '/customer/farming-orders',  icon: 'leaf',          color: '#059669' },
        { label: 'Retail Orders',    path: '/customer/retail-orders',   icon: 'package',       color: '#d97706' },
        { label: 'Car Rentals',      path: '/customer/rentals',         icon: 'car',           color: '#8b5cf6' },
        { label: 'Pharmacy',         path: '/customer/prescriptions',   icon: 'pill',          color: '#ec4899' },
        { label: 'Tender Bids',      path: '/customer/bids',            icon: 'award',         color: '#eab308' },
      ],
    },
    { type: 'divider' },

    {
      label: 'Financials', icon: 'credit-card',
      children: [
        { label: 'Invoices', path: '/customer/invoices', icon: 'file-text', color: '#ef4444' },
        { label: 'Receipts', path: '/customer/receipts', icon: 'receipt',   color: '#0ea5e9' },
      ],
    },
    { type: 'divider' },

    {
      label: 'Account & Support', icon: 'settings',
      children: [
        { label: 'Support Tickets', path: '/customer/support', icon: 'message-circle', color: '#64748b' },
        { label: 'Become a Supplier', path: '/customer/become-supplier', icon: 'truck', color: '#10b981' },
        { label: 'Become a Customer', path: '/customer/become-customer', icon: 'user-plus', color: '#8b5cf6' },
      ],
    },
  ];

  const location = useLocation();
  const noPaddingRoutes = ['/customer/printing-orders', '/customer/rentals'];
  const isNoPadding = noPaddingRoutes.some(route => location.pathname.includes(route));

  return (
    <DashboardLayout menuItems={menuItems} title="Customer Portal" noPadding={isNoPadding}>
      <Routes>
        {/* Overview Dashboard */}
        <Route path="dashboard"       element={<CustomerAllOrders />} />

        {/* My Services */}
        <Route path="printing-orders" element={<CustomerPrintingOrders />} />
        <Route path="farming-orders"  element={<CustomerFarmingOrders />} />
        <Route path="retail-orders"   element={<CustomerRetailOrders />} />
        <Route path="rentals"         element={<CustomerRentals />} />
        <Route path="prescriptions"   element={<CustomerPrescriptions />} />
        <Route path="bids"            element={<CustomerBids />} />

        {/* Financials */}
        <Route path="invoices"        element={<CustomerInvoices />} />
        <Route path="receipts"        element={<CustomerReceipts />} />

        {/* Support & Settings */}
        <Route path="support"         element={<SupportTickets />} />
        <Route path="become-supplier" element={<CustomerBecomeSupplier />} />
        <Route path="become-customer" element={<div style={{padding: 40}}><h2>Become a Customer</h2><p>Application form coming soon...</p></div>} />

        {/* Catch-all */}
        <Route path="*"               element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default CustomerPortal;
