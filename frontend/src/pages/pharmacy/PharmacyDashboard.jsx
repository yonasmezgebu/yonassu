import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

import PharmacyOverview from './PharmacyOverview';
import PharmacyProducts from './PharmacyProducts';
import PharmacyCategories from './PharmacyCategories';
import PharmacyBranches from './PharmacyBranches';
import PharmacyRequests from './PharmacyRequests';
import PharmacyPOS from './PharmacyPOS';
import RequisitionForm from './RequisitionForm';
import GRNForm from './GRNForm';
import ProcurementRequests from '../procurement/ProcurementRequests';
import PharmacyReceive from '../procurement/PharmacyReceive';
import DirectDelivery from '../procurement/DirectDelivery';
import CashierAuditLog from '../sales/CashierAuditLog';
import SalesReports from '../sales/SalesReports';
import ReturnsPage from '../sales/ReturnsPage';
import PharmacySalesForm from './PharmacySalesForm';
import PharmacyManagerDashboard from './PharmacyManagerDashboard';
import PharmacyFinanceReview from './PharmacyFinanceReview';
import CustomerPrescription from './CustomerPrescription';
import PharmacyWorkerPrescriptions from './PharmacyWorkerPrescriptions';
import CustomerQueryForm from './CustomerQueryForm';
import ExpiredDrugReport from './ExpiredDrugReport';
import DrugHideForm from './DrugHideForm';
import PharmacyPendingShipments from './PharmacyPendingShipments';

// New Imports
import PharmacyMedicines from './PharmacyMedicines';
import PharmacyInventoryView from './PharmacyInventoryView';
import PharmacyGoodsReceiving from './PharmacyGoodsReceiving';
import PharmacyIssueMedicines from './PharmacyIssueMedicines';
import PharmacyStockTransfer from './PharmacyStockTransfer';
import PharmacyStockAdjustment from './PharmacyStockAdjustment';
import PharmacyExpiryManagement from './PharmacyExpiryManagement';
import PharmacyBatches from './PharmacyBatches';
import PharmacySalesHistory from './PharmacySalesHistory';
import PharmacyTasks from './PharmacyTasks';
import PharmacyInventoryReport from './PharmacyInventoryReport';
import PharmacyStockMovement from './PharmacyStockMovement';

// New Sales & Ops Imports
import PharmacySalesList from './PharmacySalesList';
import PharmacySalesReturn from './PharmacySalesReturn';
import PharmacyStaff from './PharmacyStaff';
import PharmacyStaffList from './PharmacyStaffList';
import PharmacyAssignTasks from './PharmacyAssignTasks';
import PharmacyAttendance from './PharmacyAttendance';
import PharmacyReportsHub from './PharmacyReportsHub';
import PharmacySalesReport from './PharmacySalesReport';
import PharmacyExpiryReport from './PharmacyExpiryReport';
import PharmacyDailySummary from './PharmacyDailySummary';

const PharmacyDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Pharmacy', icon: 'pill',
      children: [
        { label: 'Medicines',        path: '/pharmacy/medicines',    icon: 'package',     color: '#22c55e' },
        { label: 'Inventory',        path: '/pharmacy/inventory',    icon: 'layers',      color: '#3b82f6' },
        { label: 'Goods Receiving',  path: '/pharmacy/goods-receiving',icon: 'truck',       color: '#f59e0b' },
        { label: 'Issue Medicines',  path: '/pharmacy/issue-medicines',icon: 'arrow-right', color: '#8b5cf6' },
        { label: 'Stock Transfer',   path: '/pharmacy/stock-transfer', icon: 'git-branch',  color: '#06b6d4' },
        { label: '🚚 Pending Shipments', path: '/pharmacy/pending-shipments', icon: 'truck', color: '#f59e0b' },
        { label: 'Store Requisition (M20)', path: '/pharmacy/requisitions', icon: 'file-text', color: '#8B5CF6' },
        { label: 'Drug Procurement', path: '/pharmacy/procurement-requests', icon: 'shopping-cart', color: '#059669' },
        { label: 'Receive Drug Shipment', path: '/pharmacy/receive-shipment', icon: 'truck', color: '#059669' },
        { label: '🆕 Direct Delivery', path: '/pharmacy/direct-delivery', icon: 'truck', color: '#059669' },
        { label: 'Stock Movement',   path: '/pharmacy/stock-movement', icon: 'activity',  color: '#06b6d4' },
        { label: 'Stock Adjustment', path: '/pharmacy/stock-adjustment', icon: 'sliders',     color: '#f97316' },
        { label: 'Expiry Management',path: '/pharmacy/expiry-management', icon: 'alert-triangle', color: '#ef4444' },
        { label: 'Batch Management', path: '/pharmacy/batches',     icon: 'layers',      color: '#14b8a6' },
      ] },
    { type: 'divider' },
    { label: 'Flow 4 — Sales', icon: 'trending-up',
      children: [
        { label: '🛒 New Sale',        path: '/pharmacy/sales',         icon: 'shopping-cart', color: '#059669' },
        { label: '📊 Manager Dashboard', path: '/pharmacy/manager',     icon: 'bar-chart-2',   color: '#224f94' },
        { label: '💰 Finance Review',  path: '/pharmacy/finance-review', icon: 'dollar-sign', color: '#D97706' },
        { label: '🚫 Expired Drugs',   path: '/pharmacy/expired-drugs',  icon: 'alert-triangle', color: '#ef4444' },
        { label: '🔒 Hide Drug',       path: '/pharmacy/drug-hide',     icon: 'eye-off',      color: '#8B5CF6' },
      ] },
    { type: 'divider' },
    { label: 'Prescriptions', icon: 'file-text',
      children: [
        { label: 'New Prescription',    path: '/pharmacy/customer-prescription',  icon: 'file-plus' },
        { label: 'Worker Prescriptions', path: '/pharmacy/worker-prescriptions',  icon: 'clipboard' },
        { label: 'Drug Query',          path: '/pharmacy/drug-query',            icon: 'search' },
      ] },
    { type: 'divider' },
    { label: 'Sales', icon: 'trending-up',
      children: [
        { label: 'POS',          path: '/pharmacy/pos', icon: 'shopping-cart' },
        { label: 'Sales List',   path: '/pharmacy/sales-list', icon: 'list' },
        { label: 'Sales History', path: '/pharmacy/sales-history', icon: 'clock' },
        { label: 'Sales Return',  path: '/pharmacy/sales-return',     icon: 'rotate-ccw' },
      ] },
    { type: 'divider' },
    { label: 'Staff', icon: 'users',
      children: [
        { label: 'Staff Mgmt',   path: '/pharmacy/staff',  icon: 'settings' },
        { label: 'Staff List',   path: '/pharmacy/staff-list',  icon: 'users' },
        { label: 'Assign Tasks', path: '/pharmacy/assign-tasks',     icon: 'check-circle' },
        { label: 'Attendance',   path: '/pharmacy/attendance',     icon: 'clock' },
      ] },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'Reports Hub',      path: '/pharmacy/reports-hub', icon: 'bar-chart-2' },
        { label: 'Inventory Report', path: '/pharmacy/inventory-report', icon: 'package' },
        { label: 'Sales Report',     path: '/pharmacy/sales-report',     icon: 'trending-up' },
        { label: 'Expiry Report',    path: '/pharmacy/expiry-report', icon: 'alert-triangle' },
        { label: 'Stock Movement',   path: '/pharmacy/stock-movement', icon: 'activity' },
        { label: 'Daily Summary',    path: '/pharmacy/daily-summary', icon: 'file-text' },
      ] },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems} title="Pharmacy Manager">
        <div>
          <Routes>
            <Route path="overview"   element={<PharmacyOverview />} />
            <Route path="products"   element={<PharmacyProducts />} />
            <Route path="categories" element={<PharmacyCategories />} />
            <Route path="branches"   element={<PharmacyBranches />} />
            <Route path="requests"   element={<PharmacyRequests />} />
            <Route path="pending-shipments" element={<PharmacyPendingShipments />} />
            <Route path="pos"        element={<PharmacyPOS />} />
            <Route path="requisitions" element={<RequisitionForm />} />
            <Route path="requisitions/:id" element={<RequisitionForm />} />
            <Route path="grn" element={<GRNForm />} />
            <Route path="grn/:id" element={<GRNForm />} />
            <Route path="procurement-requests" element={<ProcurementRequests />} />
            <Route path="procurement-requests/:id" element={<ProcurementRequests />} />
            <Route path="receive-shipment" element={<PharmacyReceive />} />
            <Route path="direct-delivery" element={<DirectDelivery />} />
            <Route path="sales" element={<PharmacySalesForm />} />
            <Route path="sales/:id" element={<PharmacySalesForm />} />
            <Route path="manager" element={<PharmacyManagerDashboard />} />
            <Route path="finance-review" element={<PharmacyFinanceReview />} />
            <Route path="finance-review/:id" element={<PharmacyFinanceReview />} />
            <Route path="customer-prescription" element={<CustomerPrescription />} />
            <Route path="worker-prescriptions" element={<PharmacyWorkerPrescriptions />} />
            <Route path="drug-query" element={<CustomerQueryForm />} />
            <Route path="expired-drugs" element={<ExpiredDrugReport />} />
            <Route path="drug-hide" element={<DrugHideForm />} />
            <Route path="audit"      element={<CashierAuditLog source="pharmacy" />} />

            {/* New Routes */}
            <Route path="medicines" element={<PharmacyMedicines />} />
            <Route path="inventory" element={<PharmacyInventoryView />} />
            <Route path="goods-receiving" element={<PharmacyGoodsReceiving />} />
            <Route path="issue-medicines" element={<PharmacyIssueMedicines />} />
            <Route path="stock-transfer" element={<PharmacyStockTransfer />} />
            <Route path="stock-adjustment" element={<PharmacyStockAdjustment />} />
            <Route path="expiry-management" element={<PharmacyExpiryManagement />} />
            <Route path="batches" element={<PharmacyBatches />} />
            <Route path="tasks" element={<PharmacyTasks />} />
            
            {/* Sales & Ops Routes */}
            <Route path="sales-list" element={<PharmacySalesList />} />
            <Route path="sales-return" element={<PharmacySalesReturn />} />
            <Route path="sales-history" element={<PharmacySalesHistory />} />
            <Route path="staff" element={<PharmacyStaff />} />
            <Route path="staff-list" element={<PharmacyStaffList />} />
            <Route path="assign-tasks" element={<PharmacyAssignTasks />} />
            <Route path="attendance" element={<PharmacyAttendance />} />
            <Route path="reports-hub" element={<PharmacyReportsHub />} />
            <Route path="inventory-report" element={<PharmacyInventoryReport />} />
            <Route path="sales-report" element={<PharmacySalesReport />} />
            <Route path="expiry-report" element={<PharmacyExpiryReport />} />
            <Route path="stock-movement" element={<PharmacyStockMovement />} />
            <Route path="daily-summary" element={<PharmacyDailySummary />} />

            <Route path="/"          element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PharmacyDashboard;
