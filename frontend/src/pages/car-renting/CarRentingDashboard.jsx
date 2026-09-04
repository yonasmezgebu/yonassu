import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Manager Pages
import RentalDashboard from './manager/RentalDashboard';
import RentalOrders from './manager/RentalOrders';
import FleetManager from './FleetManager';
import ManagerChat from '../../components/ManagerChat';
import CentralAuditLog from '../admin/CentralAuditLog';
import TractorRegister from './manager/TractorRegister';
import AgriRentList from './manager/AgriRentList';
import AgriRentOrders from './manager/AgriRentOrders';
import RentalOrdersHistory from './manager/RentalOrdersHistory';
import AgriRentOrdersHistory from './manager/AgriRentOrdersHistory';
import AgriRentCreateOrder from './manager/AgriRentCreateOrder';
import AssetRegister from './manager/AssetRegister';
import AddAsset from './manager/AddAsset';
import Maintenance from './manager/Maintenance';
import FuelService from './manager/FuelService';
import AvailabilityCalendar from './manager/AvailabilityCalendar';
import RentalReport from './manager/RentalReport';
import RevenueReport from './manager/RevenueReport';
import CarRentingStoreRequest from './manager/CarRentingStoreRequest';
import OverdueNotifier from './manager/OverdueNotifier';
import RentalContact from './manager/RentalContact';
import ProcurementRequest from './manager/ProcurementRequest';
import CarRentingTasks from './CarRentingTasks';

const CarRentingDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/car-renting/manager/dashboard', icon: 'home', color: '#3b82f6' },
    { type: 'divider' },

    { label: 'Operations', icon: 'shopping-cart',
      children: [
        { label: 'Rental Order',     path: '/car-renting/manager/orders',      icon: 'clipboard',   color: '#0ea5e9' },
        { label: 'Agri Rent Order',  path: '/car-renting/manager/agri-orders', icon: 'leaf',        color: '#22c55e' },
        { label: 'Rental Order History', path: '/car-renting/manager/orders-history', icon: 'archive', color: '#64748b' },
        { label: 'Agri Rent History',    path: '/car-renting/manager/agri-history',   icon: 'archive', color: '#64748b' },
        { label: 'Store Request',    path: '/car-renting/manager/store-request', icon: 'package',     color: '#f59e0b' },
        { label: 'Procurement Request', path: '/car-renting/manager/procurement-request', icon: 'file-plus', color: '#8b5cf6' }
      ]
    },
    { type: 'divider' },

    { label: 'Fleet & Assets', icon: 'truck',
      children: [
        { label: 'Rental Post & Vehicle', path: '/car-renting/manager/fleet',         icon: 'car',   color: '#228B22' },
        { label: 'Tractor Post',          path: '/car-renting/manager/tractor-fleet', icon: 'truck', color: '#2E8B57' },
      ]
    },
    { type: 'divider' },

    { label: 'Service & Drivers', icon: 'tool',
      children: [
        { label: 'Maintenance',             path: '/car-renting/manager/maintenance',   icon: 'tool',       color: '#ef4444' },
        { label: 'Service & Fuel',          path: '/car-renting/manager/utilization',   icon: 'activity',   color: '#f59e0b' },
        { label: 'Drivers',                 path: '/car-renting/manager/calendar',      icon: 'users',      color: '#8b5cf6' },
      ]
    },
    { type: 'divider' },

    { label: 'Reports', icon: 'pie-chart',
      children: [
        { label: 'Rental Report',      path: '/car-renting/manager/reports/rental',      icon: 'trending-up',  color: '#3b82f6' },
        { label: 'Revenue Report',     path: '/car-renting/manager/reports/revenue',     icon: 'dollar-sign',  color: '#10b981' },
      ]
    },
    { type: 'divider' },

    { label: 'Settings', icon: 'settings',
      children: [
        { label: 'Contact Settings', path: '/car-renting/manager/contact', icon: 'phone-call', color: '#228B22' },
        { label: 'Chat', path: '/car-renting/manager/chat', icon: 'message-circle', color: '#6B8E23' },
      ]
    },
    { type: 'divider' },
    { label: 'Employee', icon: 'briefcase',
      children: [
        { label: 'Tasks', path: '/car-renting/manager/tasks', icon: 'check-square', color: '#16a34a' },
        { label: 'Reports', path: '/car-renting/manager/tasks', icon: 'file-text', color: '#0ea5e9' }
      ]
    },
    { type: 'divider' },
    { label: 'Audit Log', path: '/car-renting/manager/audit-log', icon: 'clipboard', color: '#6366f1' },
  ];

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <OverdueNotifier />
      <DashboardLayout menuItems={menuItems} title="Car & Agri Rental Dashboard">
        <Routes>
          {/* Dashboard */}
          <Route path="manager/dashboard" element={<RentalDashboard />} />

          {/* Operations */}
          <Route path="manager/tasks"       element={<CarRentingTasks />} />
          <Route path="manager/orders"      element={<RentalOrders />} />
          <Route path="manager/orders-history" element={<RentalOrdersHistory />} />
          <Route path="manager/agri-history"   element={<AgriRentOrdersHistory />} />
          <Route path="manager/agri-orders" element={<AgriRentOrders />} />
          <Route path="manager/agri-orders/new" element={<AgriRentCreateOrder />} />
          <Route path="manager/store-request" element={<CarRentingStoreRequest />} />
          <Route path="manager/procurement-request" element={<ProcurementRequest />} />

          {/* Fleet */}
          <Route path="manager/fleet"         element={<FleetManager />} />
          <Route path="manager/tractor-fleet"  element={<TractorRegister />} />
          <Route path="manager/agrirent-list"  element={<AgriRentList />} />
          <Route path="manager/assets"         element={<AssetRegister />} />
          <Route path="manager/assets/new"   element={<AddAsset />} />
          <Route path="manager/maintenance"  element={<Maintenance />} />
          <Route path="manager/utilization"  element={<FuelService />} />
          <Route path="manager/calendar"     element={<AvailabilityCalendar />} />

          {/* Reports */}
          <Route path="manager/reports/rental"      element={<RentalReport />} />
          <Route path="manager/reports/revenue"     element={<RevenueReport />} />

          {/* Settings */}
          <Route path="manager/contact" element={<RentalContact />} />
          <Route path="manager/chat" element={<ManagerChat />} />
          <Route path="manager/audit-log" element={<CentralAuditLog />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/car-renting/manager/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default CarRentingDashboard;
