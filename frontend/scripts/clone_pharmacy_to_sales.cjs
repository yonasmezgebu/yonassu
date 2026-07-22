const fs = require('fs');
const path = require('path');

const srcDir = 'd:/SUTANA/frontend/src/pages/pharmacy';
const dstDir = 'd:/SUTANA/frontend/src/pages/sales';

const mappings = [
  { src: 'PharmacyOverview.jsx', dst: 'SalesOverview.jsx' },
  { src: 'PharmacyWorkerHome.jsx', dst: 'SalesWorkerHome.jsx' },
  { src: 'PharmacySalesForm.jsx', dst: 'POSPage.jsx' },
  { src: 'PharmacySalesReturn.jsx', dst: 'ReturnsPage.jsx' },
  { src: 'PharmacyHealthPublisher.jsx', dst: 'SalesHealthPublisher.jsx' },
  { src: 'PharmacyWorkerHealthPublisher.jsx', dst: 'SalesWorkerHealthPublisher.jsx' },
  { src: 'PharmacyWorkerPrescriptions.jsx', dst: 'SalesOrders.jsx' },
  { src: 'PharmacyWorkerPrescriptionHistory.jsx', dst: 'SalesOrderHistory.jsx' },
  { src: 'PharmacyMedicines.jsx', dst: 'SalesProducts.jsx' },
  { src: 'StoreInventoryView.jsx', dst: 'SalesStoreInventory.jsx' },
  { src: 'PharmacyStockOperations.jsx', dst: 'SalesStockOperations.jsx' },
  { src: 'PharmacyStockAdjustment.jsx', dst: 'SalesStockAdjustment.jsx' },
  { src: 'PharmacyExpiryManagement.jsx', dst: 'SalesExpiryManagement.jsx' },
  { src: 'PharmacyBatches.jsx', dst: 'SalesBatches.jsx' },
  { src: 'PharmacyStaff.jsx', dst: 'SalesStaff.jsx' },
  { src: 'PharmacyAttendance.jsx', dst: 'SalesAttendance.jsx' },
  { src: 'PharmacyBranches.jsx', dst: 'SalesBranches.jsx' },
  { src: 'CEOReport.jsx', dst: 'SalesCEOReport.jsx' },
  { src: 'PharmacyFinanceReview.jsx', dst: 'SalesFinanceReview.jsx' },
  { src: 'PharmacyDailySummary.jsx', dst: 'SalesDailySummary.jsx' },
  { src: 'PharmacyWorkerNewPrescription.jsx', dst: 'SalesNewOrder.jsx' },
  { src: 'PharmacyWorkerPendingPrescriptions.jsx', dst: 'SalesPendingOrders.jsx' },
];

function doReplace(content, filename) {
  let c = content;
  
  // Basic terminology replacements
  c = c.replace(/Pharmacy HQ/g, 'Sales HQ');
  c = c.replace(/Pharmacy Sales/g, 'Sales');
  c = c.replace(/Pharmacy Overview/g, 'Sales Overview');
  c = c.replace(/Pharmacy Return/g, 'Sales Return');
  c = c.replace(/Pharmacy Manager/g, 'Sales Manager');
  c = c.replace(/Pharmacy Worker/g, 'Sales Worker');
  c = c.replace(/Pharmacy/g, 'Sales');
  c = c.replace(/pharmacy/g, 'sales');
  
  // Replace drug/medicines terminology
  c = c.replace(/Medicines/g, 'Products');
  c = c.replace(/medicines/g, 'products');
  c = c.replace(/drug/gi, 'product');
  c = c.replace(/prescription/g, 'order');
  c = c.replace(/Prescription/g, 'Order');
  c = c.replace(/Rx Pending/g, 'Orders Pending');
  c = c.replace(/Rx Queue/g, 'Order Queue');

  // Specific component renames
  c = c.replace(/SalesOverview/g, 'SalesOverview');
  c = c.replace(/SalesWorkerHome/g, 'SalesWorkerHome');
  c = c.replace(/SalesSalesForm/g, 'POSPage');
  c = c.replace(/SalesSalesReturn/g, 'ReturnsPage');
  c = c.replace(/SalesHealthPublisher/g, 'SalesHealthPublisher');
  c = c.replace(/SalesWorkerHealthPublisher/g, 'SalesWorkerHealthPublisher');
  c = c.replace(/SalesWorkerOrders/g, 'SalesOrders');
  c = c.replace(/SalesWorkerOrderHistory/g, 'SalesOrderHistory');
  c = c.replace(/SalesProducts/g, 'SalesProducts');
  c = c.replace(/StoreInventoryView/g, 'SalesStoreInventory');
  c = c.replace(/SalesStockOperations/g, 'SalesStockOperations');
  c = c.replace(/SalesStockAdjustment/g, 'SalesStockAdjustment');
  c = c.replace(/SalesExpiryManagement/g, 'SalesExpiryManagement');
  c = c.replace(/SalesBatches/g, 'SalesBatches');
  c = c.replace(/SalesStaff/g, 'SalesStaff');
  c = c.replace(/SalesAttendance/g, 'SalesAttendance');
  c = c.replace(/SalesBranches/g, 'SalesBranches');
  c = c.replace(/CEOReport/g, 'SalesCEOReport');
  c = c.replace(/SalesFinanceReview/g, 'SalesFinanceReview');
  c = c.replace(/SalesDailySummary/g, 'SalesDailySummary');
  c = c.replace(/SalesWorkerNewOrder/g, 'SalesNewOrder');
  c = c.replace(/SalesWorkerPendingOrders/g, 'SalesPendingOrders');

  // Fix API client routing
  c = c.replace(/\/sales\/sales/g, '/sales'); 
  c = c.replace(/\/sales-worker\//g, '/sales/');
  
  // Fix imports
  c = c.replace(/salesService/g, 'salesService'); // was already pharmacyService

  return c;
}

mappings.forEach(m => {
  const srcPath = path.join(srcDir, m.src);
  const dstPath = path.join(dstDir, m.dst);
  
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf8');
    content = doReplace(content, m.dst);
    fs.writeFileSync(dstPath, content, 'utf8');
    console.log(`Copied and transformed ${m.src} to ${m.dst}`);
  } else {
    console.log(`Missing ${m.src}`);
  }
});
