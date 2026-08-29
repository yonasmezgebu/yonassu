import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BackButton from '../../components/pharmacy/BackButton';

import PharmacyOverview from './PharmacyOverview';
import PharmacyProducts from './PharmacyProducts';
import PharmacyCategories from './PharmacyCategories';
import PharmacyBranches from './PharmacyBranches';
import PharmacyRequests from './PharmacyRequests';
import RequisitionForm from './RequisitionForm';
import GRNForm from './GRNForm';
import ProcurementRequests from '../procurement/ProcurementRequests';
import PharmacyReceive from '../procurement/PharmacyReceive';
import PharmacyDirectDeliveries from './PharmacyDirectDeliveries';
import CashierAuditLog from '../sales/CashierAuditLog';
import ReturnsPage from '../sales/ReturnsPage';
import PharmacyManagerControls from './PharmacyManagerControls';

import ExpiredDrugReport from './ExpiredDrugReport';
import DrugHideForm from './DrugHideForm';
import PharmacyPendingShipments from './PharmacyPendingShipments';
import PharmacyContact from './PharmacyContact';
import ManagerChat from '../../components/ManagerChat';

// New Imports
import PharmacyMedicines from './PharmacyMedicines';
import PharmacyStockOperations from './PharmacyStockOperations';
import PharmacyInventoryView from './PharmacyInventoryView';
import StoreInventoryView from './StoreInventoryView';
import StoreRequisitionForm from './StoreRequisitionForm';
import ReceivingHub from './ReceivingHub';
import PharmacyGoodsReceiving from './PharmacyGoodsReceiving';
import PharmacyStockTransfer from './PharmacyStockTransfer';
import PharmacyStockAdjustment from './PharmacyStockAdjustment';
import PharmacyExpiryManagement from './PharmacyExpiryManagement';
import PharmacyBatches from './PharmacyBatches';
import PharmacyTasks from './PharmacyTasks';
// Product Posts
// import PharmacyWorkerProductPosts from './PharmacyWorkerProductPosts';

// SRS Alignment
import WarehouseManagement from './WarehouseManagement';
import BranchDrugs from './BranchDrugs';
import CEOPendingApprovals from './CEOPendingApprovals';

// Health Publisher
import PharmacyHealthPublisher from './PharmacyHealthPublisher';

// Sales & Ops Imports
import PharmacyStaff from './PharmacyStaff';

import CentralAuditLog from '../admin/CentralAuditLog';
import PharmacyManagerSales from './PharmacyManagerSales';
import PharmacySalesReports from './PharmacySalesReports';

const PharmacyDashboard = () => {
  const location = useLocation();
  const FULL_BLEED = [
    '/pharmacy/staff', '/pharmacy/branches', 
    '/pharmacy/store-inventory', '/pharmacy/stock-operations', 
    '/pharmacy/procurement-requests', '/pharmacy/stock-adjustment', 
    '/pharmacy/expiry-management', '/pharmacy/batches', '/pharmacy/health-publisher',
    '/pharmacy/medicines', '/pharmacy/contact', '/pharmacy/chat'
  ];
  const isFullBleed = FULL_BLEED.some(path => location.pathname.includes(path));
  const hideBackButton = ['/pharmacy/overview', '/pharmacy'].includes(location.pathname) || isFullBleed;

  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Pharmacy', icon: 'pill',
      children: [
        { label: 'Store Inventory',  path: '/pharmacy/store-inventory',  icon: 'database',  color: '#0891b2', altActiveOn: ['/pharmacy/pharmacy-stock', '/pharmacy/products', '/pharmacy/categories'] },
        { label: 'Stock Operations', path: '/pharmacy/stock-operations', icon: 'package',   color: '#3b82f6', altActiveOn: ['/pharmacy/medicines', '/pharmacy/stock-transfer', '/pharmacy/receiving', '/pharmacy/goods-receiving', '/pharmacy/pending-shipments', '/pharmacy/branch-drugs', '/pharmacy/warehouses'] },
        { label: 'Drug Procurement', path: '/pharmacy/procurement-requests',  icon: 'shopping-cart', color: '#059669', altActiveOn: ['/pharmacy/store-requisition', '/pharmacy/requisitions', '/pharmacy/grn', '/pharmacy/receive-shipment'] },
        { label: 'Direct Delivery',  path: '/pharmacy/direct-delivery',       icon: 'truck',         color: '#8b5cf6' },
        { label: 'Stock Adjustment', path: '/pharmacy/stock-adjustment',      icon: 'sliders',       color: '#f97316' },
        { label: 'Expiry Management',path: '/pharmacy/expiry-management',     icon: 'alert-triangle',color: '#ef4444' },
        { label: 'Batch Management', path: '/pharmacy/batches',               icon: 'layers',        color: '#14b8a6' },
        { label: 'Health Publisher', path: '/pharmacy/health-publisher',      icon: 'globe',         color: '#059669' },
      ] },

    { label: 'Staff & Contact', icon: 'users',
      children: [
        { label: 'Staff Mgmt',      path: '/pharmacy/staff',          icon: 'settings' },
        { label: 'Branches',        path: '/pharmacy/branches',       icon: 'building',  color: '#f59e0b' },
        { label: 'Contact',         path: '/pharmacy/contact',        icon: 'phone',     color: '#10b981' },
        { label: 'Chat',            path: '/pharmacy/chat',           icon: 'message-circle', color: '#6B8E23' },
      ] },
    { label: 'Employee', icon: 'briefcase',
      children: [
        { label: 'Tasks & Reports', path: '/pharmacy/tasks',          icon: 'check-square', color: '#16a34a' }
      ] },
    { type: 'divider' },
    { label: 'Sales', icon: 'shopping-cart',
      children: [
        { label: 'Worker Sales',  path: '/pharmacy/manager-sales', icon: 'dollar-sign', color: '#059669' },
      ] },
    { type: 'divider' },
    { label: 'Reports', path: '/pharmacy/reports', icon: 'bar-chart', color: '#059669' },
    { type: 'divider' },
    { label: 'Audit Log', path: '/pharmacy/audit-log', icon: 'clipboard', color: '#6366f1' },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems} title="Pharmacy Manager">
        <div style={isFullBleed ? {
          margin: '-32px -32px -32px -32px',
          padding: 0,
          background:
            (
              location.pathname.includes('/pharmacy/store-inventory') ||
              location.pathname.includes('/pharmacy/stock-operations') ||
              location.pathname.includes('/pharmacy/procurement-requests') ||
              location.pathname.includes('/pharmacy/stock-adjustment') ||
              location.pathname.includes('/pharmacy/expiry-management') ||
              location.pathname.includes('/pharmacy/batches') ||
              location.pathname.includes('/pharmacy/health-publisher')
            ) ? '#50760F' :
            '#D5DCF0',
          minHeight: '100vh',
          boxSizing: 'border-box',
        } : {}}>
          {!hideBackButton && <BackButton />}
          <Routes>
            <Route path="overview"   element={<PharmacyOverview />} />
            <Route path="products"   element={<PharmacyProducts />} />
            <Route path="categories" element={<PharmacyCategories />} />
            <Route path="branches"   element={<PharmacyBranches />} />
            <Route path="requests"   element={<PharmacyRequests />} />
            <Route path="pending-shipments" element={<PharmacyPendingShipments />} />
            <Route path="requisitions" element={<RequisitionForm />} />
            <Route path="requisitions/:id" element={<RequisitionForm />} />
            <Route path="grn" element={<GRNForm />} />
            <Route path="grn/:id" element={<GRNForm />} />
            <Route path="procurement-requests" element={<ProcurementRequests />} />
            <Route path="procurement-requests/:id" element={<ProcurementRequests />} />
            <Route path="receive-shipment" element={<PharmacyReceive />} />
            <Route path="direct-delivery" element={<PharmacyDirectDeliveries />} />
            {/* <Route path="product-posts" element={<PharmacyWorkerProductPosts />} /> */}
            <Route path="health-publisher" element={<PharmacyHealthPublisher />} />

            <Route path="expired-drugs" element={<ExpiredDrugReport />} />
            <Route path="drug-hide" element={<DrugHideForm />} />
            <Route path="audit" element={<CashierAuditLog source="pharmacy" />} />

            {/* Inventory & Stock Routes */}
            <Route path="medicines"        element={<PharmacyMedicines />} />
            <Route path="store-inventory"  element={<StoreInventoryView />} />
            <Route path="store-requisition" element={<StoreRequisitionForm />} />
            <Route path="pharmacy-stock"   element={<PharmacyInventoryView />} />
            <Route path="stock-operations" element={<PharmacyStockOperations />} />
            <Route path="receiving"        element={<ReceivingHub />} />
            <Route path="goods-receiving"  element={<PharmacyGoodsReceiving />} />
            <Route path="stock-transfer"   element={<PharmacyStockTransfer />} />
            <Route path="stock-adjustment" element={<PharmacyStockAdjustment />} />
            <Route path="expiry-management" element={<PharmacyExpiryManagement />} />
            <Route path="batches"          element={<PharmacyBatches />} />
            <Route path="tasks"            element={<PharmacyTasks />} />

            {/* Sales & Ops Routes */}
            <Route path="staff"         element={<PharmacyStaff />} />
            <Route path="warehouses"    element={<WarehouseManagement />} />
            <Route path="branch-drugs"  element={<BranchDrugs />} />
            <Route path="ceo-approvals" element={<CEOPendingApprovals />} />
            <Route path="contact"       element={<PharmacyContact />} />
            <Route path="chat"          element={<ManagerChat />} />
            <Route path="audit-log"     element={<CentralAuditLog fixedModule="Pharmacy" mode="pharmacy" />} />
            <Route path="manager-sales" element={<PharmacyManagerSales />} />
            <Route path="reports"       element={<PharmacySalesReports />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PharmacyDashboard;
