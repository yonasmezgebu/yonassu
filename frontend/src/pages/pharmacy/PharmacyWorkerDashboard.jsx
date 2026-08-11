import React, { createContext, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

import PharmacyWorkerHome from './PharmacyWorkerHome';
import PharmacySalesForm from './PharmacySalesForm';
import PharmacySalesReturn from './PharmacySalesReturn';
import PharmacyWorkerHealthPublisher from './PharmacyWorkerHealthPublisher';

// Prescriptions
import PharmacyWorkerPrescriptions from './PharmacyWorkerPrescriptions';
import PharmacyWorkerNewPrescription from './PharmacyWorkerNewPrescription';
import PharmacyWorkerPendingPrescriptions from './PharmacyWorkerPendingPrescriptions';
import PharmacyWorkerPrescriptionHistory from './PharmacyWorkerPrescriptionHistory';

import PharmacyStockOperations from './PharmacyStockOperations';
import PharmacyMedicines from './PharmacyMedicines';

export const WorkerAuthContext = createContext();

const PharmacyWorkerDashboard = () => {
  const [hasManagerPermission, setHasManagerPermission] = useState(true);

  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy-worker/overview', icon: 'home' },
    { type: 'divider' },

    // ── Sales ──
    {
      label: 'Sales Section', icon: 'shopping-cart',
      children: [
        { label: '🛒 New Sale',          path: '/pharmacy-worker/sales',              icon: 'shopping-cart', color: '#059669', className: 'executive' },
        { label: 'Sales Return',         path: '/pharmacy-worker/sales-return',       icon: 'rotate-ccw' },
        { label: '🌐 Health Publisher',  path: '/pharmacy-worker/health-publisher',   icon: 'globe',         color: '#224f94' },
      ]
    },
    { type: 'divider' },

    // ── Prescriptions ──
    {
      label: 'Prescriptions', icon: 'file-text',
      children: [
        { label: 'Prescription', path: '/pharmacy-worker/rx',         icon: 'clipboard-list', color: '#059669' },
        { label: 'Prescription History', path: '/pharmacy-worker/rx/history', icon: 'list',           color: '#64748b' },
      ]
    },
    { type: 'divider' },

    // ── Stock Operations ──
    {
      label: 'Stock Operations', path: '/pharmacy-worker/stock-operations', icon: 'package', color: '#3b82f6', altActiveOn: ['/pharmacy-worker/medicines']
    },
    { type: 'divider' },

    // ── Health Publisher (now in Sales Section) ──
  ];

  return (
    <WorkerAuthContext.Provider value={{ hasManagerPermission, setHasManagerPermission }}>
      <DashboardLayout menuItems={menuItems} title="Pharmacy Worker Dashboard">
        <Routes>
          <Route path="overview"        element={<PharmacyWorkerHome />} />

          {/* ── Sales ── */}
          <Route path="sales"           element={<PharmacySalesForm />} />
          <Route path="sales/:id"       element={<PharmacySalesForm />} />
          <Route path="sales-return"    element={<PharmacySalesReturn />} />

          {/* ── Prescriptions ── */}
          <Route path="rx"              element={<PharmacyWorkerPrescriptions />} />
          <Route path="rx/new"          element={<PharmacyWorkerNewPrescription />} />
          <Route path="rx/pending"      element={<PharmacyWorkerPendingPrescriptions />} />
          <Route path="rx/history"      element={<PharmacyWorkerPrescriptionHistory />} />

          {/* ── Stock Operations ── */}
          <Route path="stock-operations" element={<PharmacyStockOperations />} />
          <Route path="medicines" element={<PharmacyMedicines />} />

          {/* ── Health Publisher ── */}
          <Route path="health-publisher" element={<PharmacyWorkerHealthPublisher />} />

          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </WorkerAuthContext.Provider>
  );
};

export default PharmacyWorkerDashboard;
