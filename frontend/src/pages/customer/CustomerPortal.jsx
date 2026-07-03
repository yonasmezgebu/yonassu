import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// New portal pages
import CustomerDashboardHome  from './portal/CustomerDashboardHome';
import PlaceNewOrder          from './portal/PlaceNewOrder';
import OrderHistory           from './portal/OrderHistory';
import TrackOrders            from './portal/TrackOrders';
import CustomerInvoicesPage   from './portal/CustomerInvoicesPage';
import CustomerReceiptsPage   from './portal/CustomerReceiptsPage';
import PayInvoice             from './portal/PayInvoice';
import PaymentHistory         from './portal/PaymentHistory';
import ContactUs              from './portal/ContactUs';
import SupportHistory         from './portal/SupportHistory';

// Keep legacy profile page
import CustomerProfile        from './CustomerProfile';

const CustomerPortal = () => {
  const menuItems = [
    { label: 'Dashboard',   path: '/customer/dashboard', icon: 'home', color: '#3b82f6' },
    { type: 'divider' },

    {
      label: 'Orders', icon: 'shopping-cart',
      children: [
        { label: 'Place New Order', path: '/customer/orders/new',     icon: 'plus-circle',  color: '#10b981' },
        { label: 'Order History',   path: '/customer/orders/history', icon: 'clock',        color: '#64748b' },
        { label: 'Track Orders',    path: '/customer/orders/track',   icon: 'map-pin',      color: '#8b5cf6' },
      ],
    },
    { type: 'divider' },

    {
      label: 'Documents', icon: 'file-text',
      children: [
        { label: 'Invoices', path: '/customer/documents/invoices', icon: 'file-minus', color: '#ef4444' },
        { label: 'Receipts', path: '/customer/documents/receipts', icon: 'receipt',    color: '#0ea5e9' },
      ],
    },
    { type: 'divider' },

    {
      label: 'Payments', icon: 'credit-card',
      children: [
        { label: 'Pay Invoice',     path: '/customer/payments/pay',     icon: 'credit-card', color: '#f59e0b' },
        { label: 'Payment History', path: '/customer/payments/history', icon: 'dollar-sign', color: '#64748b' },
      ],
    },
    { type: 'divider' },

    {
      label: 'Support', icon: 'message-circle',
      children: [
        { label: 'Contact Us',      path: '/customer/support/contact', icon: 'send',          color: '#3b82f6' },
        { label: 'Support History', path: '/customer/support/history', icon: 'message-square', color: '#64748b' },
      ],
    },

  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Customer Portal">
      <Routes>
        {/* 1 – Dashboard Overview */}
        <Route path="dashboard"              element={<CustomerDashboardHome />} />

        {/* 2–4 – Orders */}
        <Route path="orders/new"             element={<PlaceNewOrder />} />
        <Route path="orders/history"         element={<OrderHistory />} />
        <Route path="orders/track"           element={<TrackOrders />} />

        {/* 5–6 – Documents */}
        <Route path="documents/invoices"     element={<CustomerInvoicesPage />} />
        <Route path="documents/receipts"     element={<CustomerReceiptsPage />} />

        {/* 7–8 – Payments */}
        <Route path="payments/pay"           element={<PayInvoice />} />
        <Route path="payments/history"       element={<PaymentHistory />} />

        {/* 9–10 – Support */}
        <Route path="support/contact"        element={<ContactUs />} />
        <Route path="support/history"        element={<SupportHistory />} />

        {/* Legacy */}
        <Route path="profile"               element={<CustomerProfile />} />

        {/* Catch-all → dashboard */}
        <Route path="*"                     element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default CustomerPortal;
