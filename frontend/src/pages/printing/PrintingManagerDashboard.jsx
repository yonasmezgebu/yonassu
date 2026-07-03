import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PrintingOverview from './PrintingOverview';
import PrintingOrders from './PrintingOrders';
import PrintingCreateOrder from './PrintingCreateOrder';
import PrintingOrderDetail from './PrintingOrderDetail';
import PrintingTaxReceipts from './PrintingTaxReceipts';

const PrintingManagerDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/printing-manager/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Print Jobs', icon: 'printer',
      children: [
        { label: 'New Job Order',        path: '/printing-manager/create-order', icon: 'file-plus',    color: '#22c55e' },
        { label: 'Job Queue',            path: '/printing-manager/orders',        icon: 'list',        color: '#3b82f6' },
        { label: 'In Design',            path: '/printing-manager/orders',        icon: 'layers',      color: '#f59e0b' },
        { label: 'File Check (Prepress)', path: '/printing-manager/orders',       icon: 'check-circle', color: '#8b5cf6' },
        { label: 'In Printing',          path: '/printing-manager/orders',        icon: 'printer',     color: '#06b6d4' },
        { label: 'Finishing',            path: '/printing-manager/orders',        icon: 'check-square', color: '#f97316' },
        { label: 'Ready for Delivery',   path: '/printing-manager/orders',        icon: 'package',     color: '#14b8a6' },
        { label: 'Job History',          path: '/printing-manager/orders',        icon: 'clock',       color: '#64748b' },
      ] },
    { type: 'divider' },
    { label: 'Design & Files', icon: 'layers',
      children: [
        { label: 'Design Requests',       path: '/printing-manager/orders',        icon: 'file-text' },
        { label: 'Upload Artwork',        path: '/printing-manager/create-order',  icon: 'upload' },
        { label: 'File Review / Approval', path: '/printing-manager/orders',       icon: 'check-circle' },
        { label: 'Print Specifications',  path: '/printing-manager/create-order',  icon: 'file-plus' },
        { label: 'Version Control',       path: '/printing-manager/orders',        icon: 'git-branch' },
      ] },
    { type: 'divider' },
    { label: 'Production', icon: 'settings',
      children: [
        { label: 'Machine Allocation',       path: '/printing-manager/orders', icon: 'monitor' },
        { label: 'Print Schedule',           path: '/printing-manager/orders', icon: 'calendar' },
        { label: 'Job Progress Tracking',    path: '/printing-manager/orders', icon: 'trending-up' },
        { label: 'Material Usage',           path: '/printing-manager/overview', icon: 'package' },
        { label: 'Reprint Requests',         path: '/printing-manager/orders', icon: 'rotate-ccw' },
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
    { type: 'divider' },
    { label: 'Orders / Customers', icon: 'users',
      children: [
        { label: 'Customer Orders',  path: '/printing-manager/orders',        icon: 'shopping-cart' },
        { label: 'Custom Requests',  path: '/printing-manager/create-order',  icon: 'file-plus' },
        { label: 'Order Tracking',   path: '/printing-manager/orders',        icon: 'package' },
        { label: 'Delivery Notes',   path: '/printing-manager/orders',        icon: 'file-text' },
      ] },
    { type: 'divider' },
    { label: 'Approvals', icon: 'check-circle',
      children: [
        { label: 'Design Approval',          path: '/printing-manager/orders?status=design',    icon: 'layers' },
        { label: 'Print Approval',           path: '/printing-manager/orders?status=print',     icon: 'printer' },
        { label: 'Reprint Approval',         path: '/printing-manager/orders?status=reprint',   icon: 'rotate-ccw' },
        { label: 'Job Completion Approval',  path: '/printing-manager/orders?status=complete',  icon: 'check-circle', color: '#22c55e' },
      ] },
    { type: 'divider' },
    { label: 'Delivery', icon: 'truck',
      children: [
        { label: 'Ready for Dispatch', path: '/printing-manager/orders', icon: 'package' },
        { label: 'Delivery Schedule',  path: '/printing-manager/orders', icon: 'calendar' },
        { label: 'Driver Assignment',  path: '/printing-manager/orders', icon: 'user' },
        { label: 'Delivered Jobs',     path: '/printing-manager/orders', icon: 'check-circle' },
      ] },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'Daily Production Report',     path: '/printing-manager/overview', icon: 'clock' },
        { label: 'Machine Performance Report',  path: '/printing-manager/overview', icon: 'monitor' },
        { label: 'Job Cost Report',             path: '/printing-manager/orders',   icon: 'wallet' },
        { label: 'Material Consumption Report', path: '/printing-manager/overview', icon: 'package' },
        { label: 'Monthly Summary',             path: '/printing-manager/overview', icon: 'file-text' },
      ] },
    { type: 'divider' },
    { label: 'Quality Control', icon: 'shield',
      children: [
        { label: 'Inspection',       path: '/printing-manager/orders', icon: 'search' },
        { label: 'Defect Report',    path: '/printing-manager/orders', icon: 'alert-triangle' },
        { label: 'Rework Jobs',      path: '/printing-manager/orders', icon: 'rotate-ccw' },
        { label: 'Quality Checklist', path: '/printing-manager/orders', icon: 'check-square' },
      ] },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Printing Supervisor">
      <Routes>
        <Route path="overview"        element={<PrintingOverview />} />
        <Route path="orders"          element={<PrintingOrders />} />
        <Route path="orders/:id"      element={<PrintingOrderDetail />} />
        <Route path="create-order"    element={<PrintingCreateOrder />} />
        <Route path="tax-receipts"    element={<PrintingTaxReceipts />} />
        <Route path="/"               element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PrintingManagerDashboard;
