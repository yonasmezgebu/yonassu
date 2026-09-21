import React, { createContext, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PharmacyWorkerPOS from './PharmacyWorkerPOS';
import ManagerChat from '../../components/ManagerChat';
import PharmacyWorkerAuditLog from './PharmacyWorkerAuditLog';

export const WorkerAuthContext = createContext();

const PharmacyWorkerDashboard = () => {
  const [hasManagerPermission, setHasManagerPermission] = useState(true);
  const location = useLocation();

  const FULL_BLEED = ['/pharmacy-worker/chat'];
  const isFullBleed = FULL_BLEED.some(path => location.pathname.includes(path));

  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy-worker/overview', icon: 'home' },
    { type: 'divider' },

    // ── Sales ──
    {
      label: 'Sales Section', icon: 'shopping-cart',
      children: [
        { label: 'New Sale',         path: '/pharmacy-worker/sales',              icon: 'shopping-cart', color: '#059669', className: 'executive' },
        { label: 'Sales Return',     path: '/pharmacy-worker/sales-return',       icon: 'rotate-ccw' },
        { label: 'Health Publisher', path: '/pharmacy-worker/health-publisher',   icon: 'globe',         color: '#224f94' },
      ]
    },
    { type: 'divider' },

    // ── Prescriptions ──
    {
      label: 'Prescriptions', icon: 'file-text',
      children: [
        { label: 'Prescription',         path: '/pharmacy-worker/rx',         icon: 'clipboard-list', color: '#059669' },
        { label: 'Prescription History', path: '/pharmacy-worker/rx/history', icon: 'list',           color: '#64748b' },
      ]
    },
    { type: 'divider' },

    // ── Stock Operations ──
    {
      label: 'Stock Operations', path: '/pharmacy-worker/stock-operations', icon: 'package', color: '#3b82f6', altActiveOn: ['/pharmacy-worker/medicines']
    },
    { type: 'divider' },

    // ── Staff & Contact ──
    {
      label: 'Staff & Contact', icon: 'users',
      children: [
        { label: 'Chat', path: '/pharmacy-worker/chat', icon: 'message-circle', color: '#6B8E23' },
      ]
    },
    { type: 'divider' },

    // ── Audit Log ──
    { label: 'Audit Log', path: '/pharmacy-worker/audit-log', icon: 'clipboard', color: '#6366f1' },
    { type: 'divider' },
  ];

  return (
    <WorkerAuthContext.Provider value={{ hasManagerPermission, setHasManagerPermission }}>
      <DashboardLayout menuItems={menuItems} title="Pharmacy Worker Dashboard">
        <div style={isFullBleed ? {
          margin: '-32px -32px -32px -32px',
          padding: 0,
          background: '#D5DCF0',
          minHeight: '100vh',
          boxSizing: 'border-box',
        } : {}}>
          <Routes>
            <Route path="overview"        element={<PharmacyWorkerHome />} />

            {/* ── Sales ── */}
            <Route path="sales"           element={<PharmacySalesForm />} />
            <Route path="sales/:id"       element={<PharmacySalesForm />} />
            <Route path="sales-return"    element={<PharmacySalesReturn />} />
            <Route path="pos"             element={<PharmacyWorkerPOS />} />

            {/* ── Prescriptions ── */}
            <Route path="rx"              element={<PharmacyWorkerPrescriptions />} />
            <Route path="rx/new"          element={<PharmacyWorkerNewPrescription />} />
            <Route path="rx/pending"      element={<PharmacyWorkerPendingPrescriptions />} />
            <Route path="rx/history"      element={<PharmacyWorkerPrescriptionHistory />} />

            {/* ── Stock Operations ── */}
            <Route path="stock-operations" element={<PharmacyStockOperations />} />
            <Route path="medicines"        element={<PharmacyMedicines />} />

            {/* ── Health Publisher ── */}
            <Route path="health-publisher" element={<PharmacyWorkerHealthPublisher />} />

            {/* ── Chat ── */}
            <Route path="chat"            element={<ManagerChat />} />

            {/* ── Audit Log (worker's own activity only) ── */}
            <Route path="audit-log"       element={<PharmacyWorkerAuditLog />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </WorkerAuthContext.Provider>
  );
};

export default PharmacyWorkerDashboard;
