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
import SalesReports from '../sales/SalesReports';
import ReturnsPage from '../sales/ReturnsPage';
import PharmacyManagerControls from './PharmacyManagerControls';
import PharmacyFinanceReview from './PharmacyFinanceReview';
import CEOReport from './CEOReport';

import ExpiredDrugReport from './ExpiredDrugReport';
import DrugHideForm from './DrugHideForm';
import PharmacyPendingShipments from './PharmacyPendingShipments';
import PharmacyContact from './PharmacyContact';

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
import PharmacyDailySummary from './PharmacyDailySummary';

const PharmacyDashboard = () => {
  const location = useLocation();
  const FULL_BLEED = [
    '/pharmacy/staff', '/pharmacy/branches', 
    '/pharmacy/daily-summary', '/pharmacy/finance-review', '/pharmacy/ceo-report', 
    '/pharmacy/store-inventory', '/pharmacy/stock-operations', 
    '/pharmacy/procurement-requests', '/pharmacy/stock-adjustment', 
    '/pharmacy/expiry-management', '/pharmacy/batches', '/pharmacy/health-publisher',
    '/pharmacy/medicines', '/pharmacy/contact'
  ];
  const isFullBleed = FULL_BLEED.some(path => location.pathname.includes(path));
  const hideBackButton = ['/pharmacy/overview', '/pharmacy'].includes(location.pathname) || isFullBleed;

  const menuItems = [
    { label: 'Dashboard', path: '/pharmacy/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Pharmacy', icon: 'pill',
      children: [
        { label: 'Store Inventory',  path: '/pharmacy/store-inventory',  icon: 'database',  color: '#0891b2', altActiveOn: ['/pharmacy/medicines', '/pharmacy/pharmacy-stock', '/pharmacy/products', '/pharmacy/categories'] },
        { label: 'Stock Operations', path: '/pharmacy/stock-operations', icon: 'package',   color: '#3b82f6', altActiveOn: ['/pharmacy/stock-transfer', '/pharmacy/receiving', '/pharmacy/goods-receiving', '/pharmacy/pending-shipments', '/pharmacy/branch-drugs', '/pharmacy/warehouses'] },
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
      ] },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'CEO Report', path: '/pharmacy/ceo-report', icon: 'bar-chart-2',  color: '#064e3b' },
        { label: 'Finance Review', path: '/pharmacy/finance-review', icon: 'dollar-sign',  color: '#D97706' },
        { label: 'Daily Summary',    path: '/pharmacy/daily-summary',     icon: 'file-text' },
      ] },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems} title="Pharmacy Manager">
        <div style={isFullBleed ? {
          margin: '-32px -32px -32px -32px',
          padding: 0,
          background:
            location.pathname.includes('/pharmacy/ceo-report')     ? '#F1BE91' :
            location.pathname.includes('/pharmacy/finance-review') ? '#46D17A' :
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
            <Route path="finance-review" element={<PharmacyFinanceReview />} />
            <Route path="finance-review/:id" element={<PharmacyFinanceReview />} />

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
            <Route path="ceo-report"    element={<CEOReport />} />
            <Route path="finance-review" element={<PharmacyFinanceReview />} />
            <Route path="daily-summary" element={<PharmacyDailySummary />} />
            <Route path="warehouses"    element={<WarehouseManagement />} />
            <Route path="branch-drugs"  element={<BranchDrugs />} />
            <Route path="ceo-approvals" element={<CEOPendingApprovals />} />
            <Route path="contact"       element={<PharmacyContact />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PharmacyDashboard;
