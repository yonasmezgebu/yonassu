import React, { createContext, useContext, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

import PharmacyWorkerHome from './PharmacyWorkerHome';

// Items 1-4
import PharmacyWorkerPOS from './PharmacyWorkerPOS';
import PharmacyWorkerSalesEntry from './PharmacyWorkerSalesEntry';
import PharmacyWorkerPaymentCollection from './PharmacyWorkerPaymentCollection';
import PharmacyWorkerPrintReceipt from './PharmacyWorkerPrintReceipt';

// Items 5-7
import PharmacyWorkerCurrentStock from './PharmacyWorkerCurrentStock';
import PharmacyWorkerExpiringMedicines from './PharmacyWorkerExpiringMedicines';
import PharmacyWorkerLowStock from './PharmacyWorkerLowStock';

// Items 8-10
import PharmacyWorkerMyTasks from './PharmacyWorkerMyTasks';
import PharmacyWorkerTodaysWork from './PharmacyWorkerTodaysWork';
import PharmacyWorkerCompletedTasks from './PharmacyWorkerCompletedTasks';

// Items 11-15
import PharmacyWorkerDispense from './PharmacyWorkerDispense';
import PharmacyWorkerGoodsReceiving from './PharmacyWorkerGoodsReceiving';
import PharmacyWorkerStockIssue from './PharmacyWorkerStockIssue';
import PharmacyWorkerStockCount from './PharmacyWorkerStockCount';
import PharmacyWorkerStockTransfer from './PharmacyWorkerStockTransfer';

// Items 16-18
import PharmacyWorkerNewPrescription from './PharmacyWorkerNewPrescription';
import PharmacyWorkerPendingPrescriptions from './PharmacyWorkerPendingPrescriptions';
import PharmacyWorkerPrescriptionHistory from './PharmacyWorkerPrescriptionHistory';

export const WorkerAuthContext = createContext();

const PharmacyWorkerDashboard = () => {
  const [hasManagerPermission, setHasManagerPermission] = useState(true);

  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy-worker/overview', icon: 'home' },
    { type: 'divider' },
    {
      label: 'Sales Section', icon: 'shopping-cart',
      children: [
        { label: '1. POS', path: '/pharmacy-worker/pos', icon: 'monitor', color: '#10b981', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
        { label: '2. Sales Entry', path: '/pharmacy-worker/sales-entry', icon: 'file-text', color: '#059669', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
        { label: '3. Payment Collection', path: '/pharmacy-worker/payment-collection', icon: 'credit-card', color: '#34d399', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
        { label: '4. Print Receipt', path: '/pharmacy-worker/print-receipt', icon: 'printer', color: '#065f46' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Inventory Section', icon: 'layers',
      children: [
        { label: '5. Current Stock', path: '/pharmacy-worker/current-stock', icon: 'package', color: '#6366f1' },
        { label: '6. Expiring Medicines', path: '/pharmacy-worker/expiring-medicines', icon: 'alert-triangle', color: '#ef4444' },
        { label: '7. Low Stock', path: '/pharmacy-worker/low-stock', icon: 'alert-circle', color: '#f59e0b' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Tasks Section', icon: 'clipboard-list',
      children: [
        { label: '8. My Tasks', path: '/pharmacy-worker/my-tasks', icon: 'check-square', color: '#8b5cf6' },
        { label: "9. Today's Work", path: '/pharmacy-worker/todays-work', icon: 'calendar', color: '#a855f7' },
        { label: '10. Completed Tasks', path: '/pharmacy-worker/completed-tasks', icon: 'check-circle', color: '#7c3aed' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Stock Operations', icon: 'package',
      children: [
        { label: '11. Dispense Medicines', path: '/pharmacy-worker/dispense',        icon: 'shopping-cart', color: '#22c55e', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
        { label: '12. Goods Receiving',    path: '/pharmacy-worker/goods-receiving', icon: 'truck',         color: '#f59e0b', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
        { label: '13. Stock Issue',        path: '/pharmacy-worker/stock-issue',     icon: 'arrow-right',   color: '#8b5cf6', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
        { label: '14. Stock Count',        path: '/pharmacy-worker/stock-count',     icon: 'clipboard-check', color: '#06b6d4', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
        { label: '15. Stock Transfer',     path: '/pharmacy-worker/stock-transfer',  icon: 'arrow-left-right', color: '#3b82f6', disabled: !hasManagerPermission, disabledReason: 'Manager permission required' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Prescriptions Section', icon: 'file-text',
      children: [
        { label: '16. New Prescription',       path: '/pharmacy-worker/new-prescription',     icon: 'file-plus', color: '#ec4899' },
        { label: '17. Pending Prescriptions',  path: '/pharmacy-worker/pending-prescriptions', icon: 'clock',     color: '#f97316' },
        { label: '18. Prescription History',   path: '/pharmacy-worker/prescription-history',  icon: 'archive',   color: '#64748b' },
      ]
    }
  ];

  return (
    <WorkerAuthContext.Provider value={{ hasManagerPermission, setHasManagerPermission }}>
      <DashboardLayout menuItems={menuItems} title="Pharmacy Worker Dashboard">
        <Routes>
          <Route path="overview"              element={<PharmacyWorkerHome />} />
          
          <Route path="pos"                   element={<PharmacyWorkerPOS />} />
          <Route path="sales-entry"           element={<PharmacyWorkerSalesEntry />} />
          <Route path="payment-collection"    element={<PharmacyWorkerPaymentCollection />} />
          <Route path="print-receipt"         element={<PharmacyWorkerPrintReceipt />} />
          
          <Route path="current-stock"         element={<PharmacyWorkerCurrentStock />} />
          <Route path="expiring-medicines"    element={<PharmacyWorkerExpiringMedicines />} />
          <Route path="low-stock"             element={<PharmacyWorkerLowStock />} />
          
          <Route path="my-tasks"              element={<PharmacyWorkerMyTasks />} />
          <Route path="todays-work"           element={<PharmacyWorkerTodaysWork />} />
          <Route path="completed-tasks"       element={<PharmacyWorkerCompletedTasks />} />
          
          <Route path="dispense"              element={<PharmacyWorkerDispense />} />
          <Route path="goods-receiving"       element={<PharmacyWorkerGoodsReceiving />} />
          <Route path="stock-issue"           element={<PharmacyWorkerStockIssue />} />
          <Route path="stock-count"           element={<PharmacyWorkerStockCount />} />
          <Route path="stock-transfer"        element={<PharmacyWorkerStockTransfer />} />
          
          <Route path="new-prescription"      element={<PharmacyWorkerNewPrescription />} />
          <Route path="pending-prescriptions" element={<PharmacyWorkerPendingPrescriptions />} />
          <Route path="prescription-history"  element={<PharmacyWorkerPrescriptionHistory />} />
          
          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </WorkerAuthContext.Provider>
  );
};

export default PharmacyWorkerDashboard;
