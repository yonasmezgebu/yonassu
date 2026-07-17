import apiClient from './apiClient';

// NOTE: apiClient interceptor already returns response.data,
// so we get { status, data, ... } directly — no extra .data needed.

const pharmacyService = {
  // Dashboard
  getDashboardStats: async () => {
    return await apiClient.get('/pharmacy/dashboard');
  },

  // Categories
  getCategories: async () => {
    return await apiClient.get('/pharmacy/categories');
  },

  getCategoryById: async (id) => {
    return await apiClient.get(`/pharmacy/categories/${id}`);
  },

  createCategory: async (formData) => {
    return await apiClient.post('/pharmacy/categories', formData);
  },

  updateCategory: async (id, formData) => {
    return await apiClient.put(`/pharmacy/categories/${id}`, formData);
  },

  deleteCategory: async (id) => {
    return await apiClient.delete(`/pharmacy/categories/${id}`);
  },

  // Products
  getProducts: async (includeHidden = false) => {
    const params = includeHidden ? '?include_hidden=true' : '';
    return await apiClient.get(`/pharmacy/products${params}`);
  },

  getAllProducts: async () => {
    return await apiClient.get('/pharmacy/products/all');
  },

  searchProducts: async (query) => {
    return await apiClient.get(`/pharmacy/products/search?q=${encodeURIComponent(query)}`);
  },

  getProductsByCategory: async (categoryId) => {
    return await apiClient.get(`/pharmacy/products/category/${categoryId}`);
  },

  getProductById: async (id) => {
    return await apiClient.get(`/pharmacy/products/${id}`);
  },

  createProduct: async (formData) => {
    return await apiClient.post('/pharmacy/products', formData);
  },

  updateProduct: async (id, formData) => {
    return await apiClient.put(`/pharmacy/products/${id}`, formData);
  },

  deleteProduct: async (id) => {
    return await apiClient.delete(`/pharmacy/products/${id}`);
  },

  deleteAllProducts: async () => {
    return await apiClient.delete('/pharmacy/products/all');
  },

  hideProduct: async (id, data) => {
    return await apiClient.post(`/pharmacy/products/${id}/hide`, data);
  },

  restoreProduct: async (id) => {
    return await apiClient.patch(`/pharmacy/products/${id}/restore`);
  },

  updateStock: async (id, data) => {
    return await apiClient.post(`/pharmacy/products/${id}/stock`, data);
  },

  // Branches
  getBranches: async () => {
    return await apiClient.get('/pharmacy/branches');
  },

  createBranch: async (formData) => {
    return await apiClient.post('/pharmacy/branches', formData);
  },

  updateBranch: async (id, formData) => {
    return await apiClient.put(`/pharmacy/branches/${id}`, formData);
  },

  deleteBranch: async (id) => {
    return await apiClient.delete(`/pharmacy/branches/${id}`);
  },

  // POS Sales
  createSale: async (data) => {
    return await apiClient.post('/pharmacy/pos/sales', data);
  },

  getSales: async () => {
    return await apiClient.get('/pharmacy/pos/sales');
  },

  // ── Flow 4: Pharmacy Sales & Payment Tracking ──────────────────────

  // Sales
  getAllSales: async () => {
    return await apiClient.get('/pharmacy/sales');
  },

  // Workers
  getWorkers: async () => {
    return await apiClient.get('/pharmacy/workers');
  },

  toggleWorkerPermission: async (id) => {
    return await apiClient.patch(`/pharmacy/workers/${id}/permission`);
  },

  // Worker can add products setting
  getWorkerAddProductSetting: async () => {
    return await apiClient.get('/pharmacy/admin/worker-can-add-products');
  },

  updateWorkerAddProductSetting: async (enabled) => {
    return await apiClient.patch('/pharmacy/admin/worker-can-add-products', { enabled });
  },

  // Branches toggle
  toggleBranchStatus: async (id) => {
    return await apiClient.patch(`/pharmacy/branches/${id}/toggle`);
  },

  // Reports
  getReports: async () => {
    return await apiClient.get('/pharmacy/reports');
  },

  getReportById: async (id) => {
    return await apiClient.get(`/pharmacy/reports/${id}`);
  },

  submitReport: async (data) => {
    return await apiClient.post('/pharmacy/reports', data);
  },

  financeDecision: async (id, data) => {
    return await apiClient.patch(`/pharmacy/reports/${id}/finance-decision`, data);
  },

  // Manager requests (CEO approval)
  createManagerRequest: async (data) => {
    return await apiClient.post('/pharmacy/manager-requests', data);
  },

  getManagerRequests: async () => {
    return await apiClient.get('/pharmacy/manager-requests');
  },

  ceoDecision: async (id, data) => {
    return await apiClient.patch(`/pharmacy/manager-requests/${id}/ceo-number`, data);
  },

  // Product Posts
  getProductPosts: async () => {
    return await apiClient.get('/pharmacy/product-posts');
  },

  getPublicProductPosts: async () => {
    return await apiClient.get('/pharmacy/product-posts/public');
  },

  getProductPostById: async (id) => {
    return await apiClient.get(`/pharmacy/product-posts/${id}`);
  },

  createProductPost: async (formData) => {
    return await apiClient.post('/pharmacy/product-posts', formData);
  },

  updateProductPost: async (id, formData) => {
    return await apiClient.put(`/pharmacy/product-posts/${id}`, formData);
  },

  deleteProductPost: async (id) => {
    return await apiClient.delete(`/pharmacy/product-posts/${id}`);
  },

  // ── Pharmacy & Health Content Posts ──
  getPublicHealthPosts: async () => {
    return await apiClient.get('/pharmacy/health-posts/public');
  },

  getHealthPosts: async (params) => {
    return await apiClient.get('/pharmacy/health-posts', { params });
  },

  getHealthPostById: async (id) => {
    return await apiClient.get(`/pharmacy/health-posts/${id}`);
  },

  scrapeHealthData: async () => {
    return await apiClient.get('/pharmacy/health-posts/scrape');
  },

  createHealthPost: async (formData) => {
    return await apiClient.post('/pharmacy/health-posts', formData);
  },

  updateHealthPost: async (id, formData) => {
    return await apiClient.put(`/pharmacy/health-posts/${id}`, formData);
  },

  deleteHealthPost: async (id) => {
    return await apiClient.delete(`/pharmacy/health-posts/${id}`);
  },

  getStockMovements: async (params) => {
    return await apiClient.get('/pharmacy/stock-movements', { params });
  },

  publishHealthPost: async (id) => {
    return await apiClient.patch(`/pharmacy/health-posts/${id}/publish`);
  },

  getWorkerAdjustStockSetting: async () => {
    const res = await apiClient.get('/pharmacy/admin/worker-can-adjust-stock');
    return res.data;
  },

  updateWorkerAdjustStockSetting: async (enabled) => {
    const res = await apiClient.patch('/pharmacy/admin/worker-can-adjust-stock', { enabled });
    return res.data;
  },

  getWorkerHealthPostSetting: async () => {
    const res = await apiClient.get('/pharmacy/admin/worker-can-manage-health-posts');
    return res.data;
  },

  updateWorkerHealthPostSetting: async (enabled) => {
    const res = await apiClient.patch('/pharmacy/admin/worker-can-manage-health-posts', { enabled });
    return res.data;
  },

  getWorkerHideDrugSetting: async () => {
    const res = await apiClient.get('/pharmacy/admin/worker-can-hide-drugs');
    return res.data;
  },

  updateWorkerHideDrugSetting: async (enabled) => {
    const res = await apiClient.patch('/pharmacy/admin/worker-can-hide-drugs', { enabled });
    return res.data;
  }
};

export default pharmacyService;
