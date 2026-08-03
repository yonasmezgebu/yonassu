import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PrintingOverview from './PrintingOverview';
import PrintingOrders from './PrintingOrders';
import PrintingCreateOrder from './PrintingCreateOrder';
import PrintingOrderDetail from './PrintingOrderDetail';
import PrintingTaxReceipts from './PrintingTaxReceipts';
import PrintingPublicPageSettings from './PrintingPublicPageSettings';

const PrintingManagerDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/printing-manager/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Print Jobs', icon: 'printer',
      children: [
        { label: 'Job Process',          path: '/printing-manager/create-order', icon: 'file-plus',    color: '#22c55e' },
        { label: 'Job History',          path: '/printing-manager/orders',        icon: 'clock',       color: '#64748b' },
        { label: 'Redo Request',         path: '/printing-manager/orders',        icon: 'rotate-ccw',  color: '#ec4899' },
      ] },
    { type: 'divider' },
    { label: 'Design & Files', icon: 'layers',
      children: [
        { label: 'Design Requests',       path: '/printing-manager/orders',        icon: 'file-text' },
        { label: 'Upload Artwork',        path: '/printing-manager/create-order',  icon: 'upload' },
        { label: 'File Review / Approval', path: '/printing-manager/orders',       icon: 'check-circle' },
      ] },
    { type: 'divider' },
    { label: 'Production', icon: 'settings',
      children: [
        { label: 'Store Machine',       path: '/printing-manager/orders', icon: 'monitor' },
        { label: 'Production Machine',  path: '/printing-manager/orders', icon: 'calendar' },
        { label: 'Store Material',      path: '/printing-manager/orders', icon: 'trending-up' },
        { label: 'Printing Production Material', path: '/printing-manager/overview', icon: 'package' },
      ] },
    { type: 'divider' },
    { label: 'Materials', icon: 'box',
      children: [
        { label: 'Paper Stock',         path: '/printing-manager/overview', icon: 'layers' },
        { label: 'Ink & Consumables',   path: '/printing-manager/overview', icon: 'droplet' },
        { label: 'Material Requests',   path: '/printing-manager/create-order', icon: 'clipboard' },
        { label: 'Low Stock Alerts',    path: '/printing-manager/overview', icon: 'alert-triangle' },
        { label: 'Usage Report',        path: '/printing-manager/overview', icon: 'bar-chart' },
      ] },

    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'Daily Production Report',     path: '/printing-manager/overview', icon: 'clock' },
        { label: 'Job Cost Report',             path: '/printing-manager/orders',   icon: 'wallet' },
        { label: 'Material Consumption Report', path: '/printing-manager/overview', icon: 'package' }
      ] },
    { type: 'divider' },
    { label: 'Settings', icon: 'settings',
      children: [
        { label: 'Public Page', path: '/printing-manager/public-settings', icon: 'globe' }
      ] }
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Printing Supervisor">
      <Routes>
        <Route path="overview"        element={<PrintingOverview />} />
        <Route path="orders"          element={<PrintingOrders />} />
        <Route path="orders/:id"      element={<PrintingOrderDetail />} />
        <Route path="create-order"    element={<PrintingCreateOrder />} />
        <Route path="tax-receipts"    element={<PrintingTaxReceipts />} />
        <Route path="public-settings" element={<PrintingPublicPageSettings />} />
        <Route path="/"               element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PrintingManagerDashboard;
