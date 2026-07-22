import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Manager Pages
import RentalDashboard from './manager/RentalDashboard';
import RentalOrders from './manager/RentalOrders';
import FleetManager from './FleetManager';
import AssetRegister from './manager/AssetRegister';
import AddAsset from './manager/AddAsset';
import Maintenance from './manager/Maintenance';
import AssetUtilization from './manager/AssetUtilization';
import AvailabilityCalendar from './manager/AvailabilityCalendar';
import AssetStatusHistory from './manager/AssetStatusHistory';
import RentalReport from './manager/RentalReport';
import RevenueReport from './manager/RevenueReport';
import PerformanceReport from './manager/PerformanceReport';
import CarRentingStoreRequest from './manager/CarRentingStoreRequest';

const CarRentingDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/car-renting/manager/dashboard', icon: 'home', color: '#3b82f6' },
    { type: 'divider' },

    { label: 'Operations', icon: 'shopping-cart',
      children: [
        { label: 'Rental Order',     path: '/car-renting/manager/orders',      icon: 'clipboard',   color: '#0ea5e9' },
        { label: 'Agri Rent Order',  path: '/car-renting/manager/agri-orders', icon: 'leaf',        color: '#22c55e' },
        { label: 'Store Request',    path: '/car-renting/manager/store-request', icon: 'package',     color: '#f59e0b' },
        { label: 'Audit Log',        path: '/car-renting/manager/history',     icon: 'shield',      color: '#64748b' },
      ]
    },
    { type: 'divider' },

    { label: 'Fleet & Assets', icon: 'truck',
      children: [
        { label: 'Rental Post',             path: '/car-renting/manager/fleet',         icon: 'car',        color: '#3b82f6' },
        { label: 'Tractor Post',            path: '/car-renting/manager/tractor-fleet', icon: 'truck',      color: '#22c55e' },
        { label: 'Asset Register',          path: '/car-renting/manager/assets',        icon: 'list',       color: '#64748b' },
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
        { label: 'Performance Report', path: '/car-renting/manager/reports/performance', icon: 'bar-chart-2',  color: '#f59e0b' },
      ]
    }
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <DashboardLayout menuItems={menuItems} title="Car & Agri Rental Dashboard">
        <Routes>
          {/* Dashboard */}
          <Route path="manager/dashboard" element={<RentalDashboard />} />

          {/* Operations */}
          <Route path="manager/orders"      element={<RentalOrders />} />
          <Route path="manager/agri-orders" element={<RentalOrders />} />
          <Route path="manager/store-request" element={<CarRentingStoreRequest />} />

          {/* Fleet */}
          <Route path="manager/fleet"         element={<FleetManager />} />
          <Route path="manager/tractor-fleet" element={<FleetManager />} />
          <Route path="manager/assets"        element={<AssetRegister />} />
          <Route path="manager/assets/new"   element={<AddAsset />} />
          <Route path="manager/maintenance"  element={<Maintenance />} />
          <Route path="manager/utilization"  element={<AssetUtilization />} />
          <Route path="manager/calendar"     element={<AvailabilityCalendar />} />
          <Route path="manager/history"      element={<AssetStatusHistory />} />

          {/* Reports */}
          <Route path="manager/reports/rental"      element={<RentalReport />} />
          <Route path="manager/reports/revenue"     element={<RevenueReport />} />
          <Route path="manager/reports/performance" element={<PerformanceReport />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="manager/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default CarRentingDashboard;
