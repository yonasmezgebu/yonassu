const fs = require('fs');
const path = require('path');

const srcDir = 'd:/SUTANA/frontend/src/pages/pharmacy';
const dstDir = 'd:/SUTANA/frontend/src/pages/sales';

const mappings = [
  { src: 'PharmacyOverview.jsx', dst: 'SalesHome.jsx' },
  { src: 'PharmacySalesForm.jsx', dst: 'POSPage.jsx' },
  { src: 'PharmacySalesReturn.jsx', dst: 'ReturnsPage.jsx' },
  { src: 'PharmacyDailySummary.jsx', dst: 'ZReportPage.jsx' },
  { src: 'PharmacyStaff.jsx', dst: 'manager/SalesCustomerList.jsx' } // Using Staff for customer list as a placeholder for UI? Wait, PharmacyStaff is for staff. 
];

function doReplace(content) {
  let c = content;
  
  // Basic term replacements
  c = c.replace(/Pharmacy HQ/g, 'Sales HQ');
  c = c.replace(/Pharmacy Sales/g, 'Sales');
  c = c.replace(/Pharmacy Overview/g, 'Sales Overview');
  c = c.replace(/Pharmacy Return/g, 'Sales Return');
  c = c.replace(/Pharmacy/g, 'Sales');
  c = c.replace(/pharmacy/g, 'sales');
  
  // API endpoints
  c = c.replace(/\/sales\/sales/g, '/sales'); // just in case
  c = c.replace(/\/sales\/products/g, '/sales/products');
  
  // Route paths
  c = c.replace(/\/sales-worker/g, '/sales');
  c = c.replace(/\/sales\/sales-list/g, '/sales/manager/history');
  c = c.replace(/\/sales\/medicines/g, '/sales/manager/products/catalog');
  c = c.replace(/\/sales\/stock-operations/g, '/sales/manager/products/stock');
  c = c.replace(/\/sales\/sales/g, '/sales/pos'); // Fixing the double sales
  
  // Text specifics
  c = c.replace(/Medicines/g, 'Products');
  c = c.replace(/medicines/g, 'products');
  c = c.replace(/drug/g, 'product');
  c = c.replace(/Drug/g, 'Product');
  c = c.replace(/prescription/g, 'order');
  c = c.replace(/Prescription/g, 'Order');
  c = c.replace(/Rx Pending/g, 'Orders Pending');
  c = c.replace(/Rx Queue/g, 'Order Queue');
  c = c.replace(/Health Info/g, 'Customer Info');
  c = c.replace(/health-publisher/g, 'customers');
  
  // For components named Pharmacy...
  c = c.replace(/SalesOverview/g, 'SalesHome');
  c = c.replace(/SalesSalesForm/g, 'POSPage');
  c = c.replace(/SalesSalesReturn/g, 'ReturnsPage');

  return c;
}

mappings.forEach(m => {
  const srcPath = path.join(srcDir, m.src);
  const dstPath = path.join(dstDir, m.dst);
  
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf8');
    content = doReplace(content);
    fs.writeFileSync(dstPath, content, 'utf8');
    console.log(`Copied and transformed ${m.src} to ${m.dst}`);
  } else {
    console.log(`Missing ${m.src}`);
  }
});
