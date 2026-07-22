const fs = require('fs');
const path = require('path');

const dir = 'd:/SUTANA/frontend/src/pages/sales';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

// These are salesService methods that DON'T exist — they came from pharmacyService cloning
// For all cloned pages, we need to use pharmacyService for backend calls
const pharmacyOnlyMethods = [
  'getDashboardStats',
  'getHealthPosts',
  'getPublicHealthPosts',
  'getHealthPostById',
  'createHealthPost',
  'updateHealthPost',
  'deleteHealthPost',
  'publishHealthPost',
  'scrapeHealthData',
  'getWorkerHealthPostSetting',
  'updateWorkerHealthPostSetting',
  'getWorkerAdjustStockSetting',
  'updateWorkerAdjustStockSetting',
  'getWorkerHideDrugSetting',
  'updateWorkerHideDrugSetting',
  'getWorkerAddProductSetting',
  'updateWorkerAddProductSetting',
  'getWorkers',
  'toggleWorkerPermission',
  'getBranches',
  'createBranch',
  'updateBranch',
  'deleteBranch',
  'toggleBranchStatus',
  'getCategories',
  'getCategoryById',
  'createCategory',
  'updateCategory',
  'deleteCategory',
  'getProducts',
  'getAllProducts',
  'searchProducts',
  'getProductsByCategory',
  'getProductById',
  'createProduct',
  'updateProduct',
  'deleteProduct',
  'deleteAllProducts',
  'hideProduct',
  'restoreProduct',
  'updateStock',
  'getReports',
  'getReportById',
  'submitReport',
  'financeDecision',
  'createManagerRequest',
  'getManagerRequests',
  'ceoDecision',
  'getProductPosts',
  'getPublicProductPosts',
  'getProductPostById',
  'createProductPost',
  'updateProductPost',
  'deleteProductPost',
  'getStockMovements',
  'getAllSales',
];

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Check if this file uses salesService and calls pharmacy-only methods
  const usesSalesService = content.includes("import salesService from");
  const usesPharmacyMethods = pharmacyOnlyMethods.some(m => content.includes(`salesService.${m}`));

  if (usesSalesService && usesPharmacyMethods) {
    // Add pharmacyService import if not already there
    if (!content.includes("import pharmacyService from")) {
      content = content.replace(
        "import salesService from '../../services/salesService';",
        "import salesService from '../../services/salesService';\nimport pharmacyService from '../../services/pharmacyService';"
      );
      // Handle alternate import path
      content = content.replace(
        'import salesService from "../../services/salesService";',
        'import salesService from "../../services/salesService";\nimport pharmacyService from "../../services/pharmacyService";'
      );
    }

    // Replace pharmacy-only method calls from salesService to pharmacyService
    pharmacyOnlyMethods.forEach(method => {
      const regex = new RegExp(`salesService\\.${method}`, 'g');
      if (regex.test(content)) {
        content = content.replace(new RegExp(`salesService\\.${method}`, 'g'), `pharmacyService.${method}`);
        changed = true;
      }
    });

    // Fix the /sales/dashboard -> /pharmacy/dashboard endpoint calls
    // (these are direct apiClient calls that were renamed from pharmacy)
    content = content.replace(/apiClient\.get\('\/sales\/dashboard'\)/g, "apiClient.get('/pharmacy/dashboard')");
    content = content.replace(/apiClient\.get\("\/sales\/dashboard"\)/g, 'apiClient.get("/pharmacy/dashboard")');
    content = content.replace(/apiClient\.get\(`\/sales\/dashboard`\)/g, 'apiClient.get(`/pharmacy/dashboard`)');
    
    // Fix /sales/workers -> /pharmacy/workers
    content = content.replace(/apiClient\.get\('\/sales\/workers'\)/g, "apiClient.get('/pharmacy/workers')");
    content = content.replace(/apiClient\.get\("\/sales\/workers"\)/g, 'apiClient.get("/pharmacy/workers")');
    
    fs.writeFileSync(filePath, content);
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nTotal fixed: ${fixedCount} files`);
