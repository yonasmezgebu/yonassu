const fs = require('fs');
const path = require('path');

const srcDir = 'd:/SUTANA/frontend/src/pages/pharmacy';
const dstDir = 'd:/SUTANA/frontend/src/pages/sales';

const mappings = [
  { src: 'PharmacyInventoryView.jsx', dst: 'SalesInventoryView.jsx' },
  { src: 'PharmacyWorkerLowStock.jsx', dst: 'SalesWorkerLowStock.jsx' },
  { src: 'PharmacyWorkerExpiringMedicines.jsx', dst: 'SalesWorkerExpiringProducts.jsx' },
  { src: 'ExpiredDrugReport.jsx', dst: 'ExpiredproductReport.jsx' }, // case exactness
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

  // Fix API client routing
  c = c.replace(/\/sales\/sales/g, '/sales'); 
  c = c.replace(/\/sales-worker\//g, '/sales/');
  
  // Specific renames
  c = c.replace(/SalesInventoryView/g, 'SalesInventoryView');
  c = c.replace(/SalesWorkerLowStock/g, 'SalesWorkerLowStock');
  c = c.replace(/SalesWorkerExpiringProducts/g, 'SalesWorkerExpiringProducts');
  c = c.replace(/ExpiredproductReport/g, 'ExpiredproductReport');

  // Fix imports
  c = c.replace(/salesService/g, 'salesService'); 

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
