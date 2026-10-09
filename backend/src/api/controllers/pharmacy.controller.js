const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { sendNotification } = require('../../services/notification.service');
const { getFileInfo, deleteFile } = require('../middleware/upload.middleware');
const { audit } = require('../../config/logger');
const settingsRepository = new (require('../../repositories/settings.repository'))();
const logPharmacyAction = require('../../utils/pharmacyAuditLogger');

const pharmacyController = {
  // ==============================
  // DASHBOARD
  // ==============================
  getDashboardStats: async (req, res) => {
    // 1. Total Sales from pharmacy_sales (actual worker sales table)
    const totalSalesQuery = await db('pharmacy_sales').sum('total_amount as total').first();
    const totalSales = totalSalesQuery.total || 0;

    // 2. Customers Served (distinct recipient phones)
    const customersServedQuery = await db('pharmacy_sales').countDistinct('recipient_phone as count').first();
    const customersServed = customersServedQuery.count || 0;

    // 3. Low Stock Alerts
    const lowStockAlerts = await db('pharmacy_medications')
      .whereRaw('stock_quantity <= reorder_level')
      .select('id', 'name', 'stock_quantity as stock', 'price_unit as unit', 'reorder_level as reorderLevel');
    
    const today = new Date().toISOString().split('T')[0];
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 30);
    const expiringDateStr = expiringDate.toISOString().split('T')[0];

    // 4. Expired/Expiring Products (Only count if we actually have stock)
    const expiredProducts = await db('pharmacy_medications')
      .where('expiry_date', '<', today)
      .andWhere('stock_quantity', '>', 0)
      .select('id', 'name', 'expiry_date as date');
      
    const expiringProducts = await db('pharmacy_medications')
      .where('expiry_date', '>=', today)
      .andWhere('expiry_date', '<=', expiringDateStr)
      .andWhere('stock_quantity', '>', 0)
      .select('id', 'name', 'expiry_date as date');
      
    const expiredList = [
      ...expiredProducts.map(p => ({ ...p, status: 'expired' })),
      ...expiringProducts.map(p => ({ ...p, status: 'expiring' }))
    ];

    // 5. Extra dashboard stats
    const totalMedicationsQuery = await db('pharmacy_medications')
      .where('is_active', true).count('id as count').first();
    const totalMedications = Number(totalMedicationsQuery?.count || 0);

    const totalStockQuery = await db('pharmacy_medications')
      .sum('stock_quantity as qty').first();
    const totalStockQuantity = Number(totalStockQuery?.qty || 0);

    const pendingTransfersQuery = await db('pharmacy_transfer_requests')
      .where('status', 'PENDING').count('id as count').first();
    const pendingTransfers = Number(pendingTransfersQuery?.count || 0);

    const pendingReceiptsQuery = await db('procurement_requests')
      .where('status', 'SHIPPED').count('id as count').first();
    const pendingReceipts = Number(pendingReceiptsQuery?.count || 0);

    const pendingExpiredReportsQuery = await db('pharmacy_expired_drugs')
      .where('status', 'PENDING').count('id as count').first();
    const pendingExpiredReports = Number(pendingExpiredReportsQuery?.count || 0);

    // Live Revenue — read from unsubmitted pharmacy_sales (the actual worker sales table)
    const todaySalesQuery = await db('pharmacy_sales')
      .where(function() {
        this.where('is_submitted', false).orWhereNull('is_submitted');
      })
      .sum('total_amount as total').first();
    const todaySales = Number(todaySalesQuery?.total || 0);

    const todaySalesCountQuery = await db('pharmacy_sales')
      .where(function() {
        this.where('is_submitted', false).orWhereNull('is_submitted');
      })
      .count('id as count').first();
    const todaySalesCount = Number(todaySalesCountQuery?.count || 0);

    // 7. Category breakdown
    let categoryBreakdown = [];
    let grandTotal = { sku_count: 0, total_quantity: 0, total_value: 0 };
    try {
      categoryBreakdown = await db('pharmacy_medications as m')
        .leftJoin('pharmacy_categories as c', 'm.category_id', 'c.id')
        .select(
          db.raw("COALESCE(c.name, 'Uncategorized') as category"),
          db.raw('COUNT(m.id) as sku_count'),
          db.raw('SUM(m.stock_quantity) as total_quantity'),
          db.raw('SUM(m.stock_quantity * m.price) as total_value')
        )
        .where('m.is_active', true)
        .groupByRaw("COALESCE(c.name, 'Uncategorized')")
        .orderBy('total_value', 'desc');

      grandTotal = {
        sku_count: categoryBreakdown.reduce((s, r) => s + Number(r.sku_count || 0), 0),
        total_quantity: categoryBreakdown.reduce((s, r) => s + Number(r.total_quantity || 0), 0),
        total_value: categoryBreakdown.reduce((s, r) => s + Number(r.total_value || 0), 0),
      };
    } catch(e) { /* ignore if table join fails */ }

    // 8. Top selling products today — read from pharmacy_sale_items joined with unsubmitted pharmacy_sales
    let topSelling = [];
    try {
      topSelling = await db('pharmacy_sale_items as si')
        .join('pharmacy_sales as s', 'si.sale_id', 's.id')
        .where(function() {
          this.where('s.is_submitted', false).orWhereNull('s.is_submitted');
        })
        .select(
          'si.drug_name as name',
          db.raw('SUM(si.quantity) as units_sold'),
          db.raw('SUM(si.total_price) as revenue')
        )
        .groupBy('si.drug_name')
        .orderBy('units_sold', 'desc')
        .limit(5);
    } catch(e) { /* ignore */ }

    // 6. Prescription Refill Requests (Mocked since no table exists yet)
    const refillRequests = [
      { 
        id: 'RX-001', customer: 'Alemitu T.', medicine: 'Amoxicillin 500mg', 
        qty: 2, unit: 'strips', status: 'PENDING' 
      },
      { 
        id: 'RX-002', customer: 'Biruk D.', medicine: 'Insulin Glargine', 
        qty: 2, unit: 'vials', status: 'READY_FOR_PICKUP' 
      }
    ];

    res.json({
      status: 'success',
      data: {
        totalSales,
        customersServed,
        lowStockAlerts,
        expiredList,
        refillRequests,
        totalMedications,
        totalStockQuantity,
        pendingTransfers,
        pendingReceipts,
        todaySales,
        todaySalesCount,
        pendingExpiredReports,
        categoryBreakdown,
        grandTotal,
        topSelling
      }
    });
  },

  // ==============================
  // CATEGORIES
  // ==============================
  getCategories: async (req, res) => {
    const categories = await db('pharmacy_categories')
      .where('is_active', true)
      .orderBy('display_order', 'asc')
      .orderBy('name', 'asc');
    
    const counts = await db('pharmacy_medications')
      .select('category_id')
      .count('* as count')
      .where('is_active', true)
      .groupBy('category_id');
      
    const categoriesWithCounts = categories.map(cat => {
      const countItem = counts.find(c => c.category_id === cat.id);
      return {
        ...cat,
        product_count: countItem ? parseInt(countItem.count) : 0
      };
    });

    res.json({ status: 'success', data: categoriesWithCounts });
  },

  getCategoryById: async (req, res) => {
    const category = await db('pharmacy_categories').where({ id: req.params.id }).first();
    if (!category) throw new AppError('Category not found', 404);
    res.json({ status: 'success', data: category });
  },

  createCategory: async (req, res) => {
    const { name, description, icon_class, display_order, is_active } = req.body;
    
    if (!name) {
      throw new AppError('Category name is required', 400);
    }

    let slug = req.body.slug;
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    let cover_image = null;
    if (req.file) {
      cover_image = getFileInfo(req.file).url;
    }

    let parsed_is_active = 1;
    if (is_active !== undefined) {
      parsed_is_active = (is_active === 'true' || is_active === true || is_active === 1 || is_active === '1') ? 1 : 0;
    }

    const [id] = await db('pharmacy_categories').insert({
      name, slug, description, cover_image, icon_class, 
      display_order: display_order ? parseInt(display_order) : 0,
      is_active: parsed_is_active
    });

    const category = await db('pharmacy_categories').where({ id }).first();
    
    if (req.user) {
      await audit('CREATE_PHARMACY_CATEGORY', req.user.id, { details: { categoryId: id, name } });
    }
    logPharmacyAction(req, 'Category Created', name, null, category, 'Pharmacy Store');

    res.status(201).json({ status: 'success', data: category });
  },

  updateCategory: async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const existing = await db('pharmacy_categories').where({ id }).first();
    if (!existing) throw new AppError('Category not found', 404);

    if (req.file) {
      updateData.cover_image = getFileInfo(req.file).url;
      if (existing.cover_image) {
        deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
      }
    }

    if (updateData.display_order !== undefined) {
      updateData.display_order = parseInt(updateData.display_order) || 0;
    }
    
    if (updateData.is_active !== undefined) {
      updateData.is_active = (updateData.is_active === 'true' || updateData.is_active === true || updateData.is_active === 1 || updateData.is_active === '1') ? 1 : 0;
    }

    await db('pharmacy_categories').where({ id }).update(updateData);
    const category = await db('pharmacy_categories').where({ id }).first();
    
    if (req.user) {
      await audit('UPDATE_PHARMACY_CATEGORY', req.user.id, { details: { categoryId: id } });
    }
    logPharmacyAction(req, 'Category Updated', existing.name, existing, category, 'Pharmacy Store');

    res.json({ status: 'success', data: category });
  },

  deleteCategory: async (req, res) => {
    const { id } = req.params;
    
    const products = await db('pharmacy_medications').where({ category_id: id }).count('* as count').first();
    if (products.count > 0) {
      throw new AppError('Cannot delete category containing products', 400);
    }

    const existing = await db('pharmacy_categories').where({ id }).first();
    if (!existing) throw new AppError('Category not found', 404);

    if (existing.cover_image) {
      deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
    }

    await db('pharmacy_categories').where({ id }).del();
    
    if (req.user) {
      await audit('DELETE_PHARMACY_CATEGORY', req.user.id, { details: { categoryId: id } });
    }
    logPharmacyAction(req, 'Category Deleted', existing.name, existing, null, 'Pharmacy Store');

    res.status(204).send();
  },

  // ==============================
  // STORE INVENTORY (read-only for pharmacy)
  // ==============================
  getStoreInventory: async (req, res) => {
    const items = await db('store_inventory as si')
      .join('drugs as d', 'si.drug_id', 'd.id')
      .leftJoin('drug_categories as dc', 'd.category_id', 'dc.id')
      .select(
        'si.id',
        'si.drug_id',
        'd.name',
        'd.generic_name',
        'd.brand_name',
        db.raw('COALESCE(dc.name, d.category) as category'),
        'd.unit',
        'si.quantity as stock_quantity',
        'si.min_level',
        'si.max_level',
        'si.reorder_level',
        'si.reserved_quantity',
        'si.batch_no',
        'si.expiry_date',
        'si.manufacture_date',
        'si.unit_cost',
        'si.selling_price',
        'si.stock_status',
        'si.storage_location',
        'si.warehouse_id',
        'd.unit_price'
      )
      .orderBy('d.name', 'asc');

    res.json({ status: 'success', data: items });
  },

  // MEDICATIONS / PRODUCTS
  // ==============================
  getProducts: async (req, res) => {
    const { include_hidden } = req.query;
    let query = db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .select(
        'pm.*',
        'pc.name as category_name'
      )
      .where('pm.is_active', true);

    if (include_hidden !== 'true') {
      query = query.where(function () {
        this.where('pm.is_hidden', false).orWhereNull('pm.is_hidden');
      });
    }

    const products = await query.orderBy('pm.created_at', 'desc');

    res.json({ status: 'success', data: products });
  },

  getAllProducts: async (req, res) => {
    const products = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .select(
        'pm.*',
        'pc.name as category_name'
      )
      .orderBy('pm.created_at', 'desc');

    res.json({ status: 'success', data: products });
  },

  searchProducts: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ status: 'success', data: [] });

    const products = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .select(
        'pm.*',
        'pc.name as category_name'
      )
      .where(function () {
        this.where('pm.name', 'ilike', `%${q}%`)
          .orWhere('pm.generic_name', 'ilike', `%${q}%`);
      })
      .where('pm.is_active', true)
      .orderBy('pm.name', 'asc');

    res.json({ status: 'success', data: products });
  },

  getProductById: async (req, res) => {
    const product = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .select(
        'pm.*',
        'pc.name as category_name'
      )
      .where('pm.id', req.params.id)
      .first();

    if (!product) throw new AppError('Product not found', 404);
    res.json({ status: 'success', data: product });
  },

  getProductsByCategory: async (req, res) => {
    const products = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .select(
        'pm.*',
        'pc.name as category_name'
      )
      .where('pm.category_id', req.params.id)
      .where('pm.is_active', true)
      .orderBy('pm.name', 'asc');

    res.json({ status: 'success', data: products });
  },

  getStockMovements: async (req, res) => {
    const { medication_id, type, startDate, endDate } = req.query;
    let query = db('pharmacy_stock_movements as psm')
      .leftJoin('pharmacy_medications as pm', 'psm.medication_id', 'pm.id')
      .select('psm.*', 'pm.name as drug_name', 'pm.category_id')
      .orderBy('psm.created_at', 'desc');

    if (medication_id) query = query.where('psm.medication_id', medication_id);
    if (type) query = query.where('psm.type', type);
    if (startDate) query = query.where('psm.created_at', '>=', new Date(startDate));
    if (endDate) query = query.where('psm.created_at', '<=', new Date(endDate));

    const movements = await query;
    res.json({ status: 'success', data: movements });
  },

  hideProduct: async (req, res) => {
    const { id } = req.params;
    const product = await db('pharmacy_medications').where('id', id).first();
    if (!product) throw new AppError('Product not found', 404);

    await db('pharmacy_medications').where('id', id).update({ is_hidden: true, updated_at: db.fn.now() });
    logPharmacyAction(req, 'Product Hidden', product.name, { is_hidden: false }, { is_hidden: true }, 'Pharmacy Store');
    res.json({ status: 'success', message: 'Product hidden from public view' });
  },

  restoreProduct: async (req, res) => {
    const { id } = req.params;
    const product = await db('pharmacy_medications').where('id', id).first();
    if (!product) throw new AppError('Product not found', 404);

    await db('pharmacy_medications').where('id', id).update({ is_hidden: false, updated_at: db.fn.now() });
    logPharmacyAction(req, 'Product Restored', product.name, { is_hidden: true }, { is_hidden: false }, 'Pharmacy Store');
    res.json({ status: 'success', message: 'Product restored to public view' });
  },

  createProduct: async (req, res) => {
    const data = { ...req.body };
    
    if (!data.name) {
      throw new AppError('Product name is required', 400);
    }

    // Parse numeric/boolean fields
    if (data.price) data.price = parseFloat(data.price);
    if (data.stock_quantity) data.stock_quantity = parseInt(data.stock_quantity);
    if (data.reorder_level) data.reorder_level = parseInt(data.reorder_level);
    if (data.is_prescription_required !== undefined) data.is_prescription_required = data.is_prescription_required === 'true' || data.is_prescription_required === true;
    if (data.is_active !== undefined) data.is_active = data.is_active === 'true' || data.is_active === true;
    if (data.expiry_date === '') data.expiry_date = null;

    if (req.files && req.files.drug_image && req.files.drug_image[0]) {
      data.drug_image = getFileInfo(req.files.drug_image[0]).url;
    }
    if (req.files && req.files.cover_image && req.files.cover_image[0]) {
      data.cover_image = getFileInfo(req.files.cover_image[0]).url;
    }

    const [id] = await db('pharmacy_medications').insert(data);
    const product = await db('pharmacy_medications').where({ id }).first();
    
    if (req.user) {
      await audit('CREATE_PHARMACY_PRODUCT', req.user.id, { details: { productId: id, name: data.name } });
    }
    logPharmacyAction(req, 'Product Created', data.name, null, product, 'Pharmacy Store');

    res.status(201).json({ status: 'success', data: product });
  },

  updateProduct: async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    
    const existing = await db('pharmacy_medications').where({ id }).first();
    if (!existing) throw new AppError('Product not found', 404);

    // Parse numeric/boolean fields
    if (data.price) data.price = parseFloat(data.price);
    if (data.stock_quantity) data.stock_quantity = parseInt(data.stock_quantity);
    if (data.reorder_level) data.reorder_level = parseInt(data.reorder_level);
    if (data.is_prescription_required !== undefined) data.is_prescription_required = data.is_prescription_required === 'true' || data.is_prescription_required === true;
    if (data.is_active !== undefined) data.is_active = data.is_active === 'true' || data.is_active === true;
    if (data.expiry_date === '') data.expiry_date = null;

    if (req.files && req.files.drug_image && req.files.drug_image[0]) {
      data.drug_image = getFileInfo(req.files.drug_image[0]).url;
      if (existing.drug_image) deleteFile(existing.drug_image.replace('/uploads/', 'uploads/'));
    }
    if (req.files && req.files.cover_image && req.files.cover_image[0]) {
      data.cover_image = getFileInfo(req.files.cover_image[0]).url;
      if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
    }

    await db('pharmacy_medications').where({ id }).update(data);
    const product = await db('pharmacy_medications').where({ id }).first();
    
    if (req.user) {
      await audit('UPDATE_PHARMACY_PRODUCT', req.user.id, { details: { productId: id } });
    }
    logPharmacyAction(req, 'Product Updated', existing.name, existing, product, 'Pharmacy Store');

    res.json({ status: 'success', data: product });
  },

  deleteAllProducts: async (req, res) => {
    await db('pharmacy_stock_movements').del();
    const products = await db('pharmacy_medications').select('id', 'drug_image', 'cover_image');
    for (const p of products) {
      if (p.drug_image) deleteFile(p.drug_image.replace('/uploads/', 'uploads/'));
      if (p.cover_image) deleteFile(p.cover_image.replace('/uploads/', 'uploads/'));
    }
    await db('pharmacy_medications').del();
    if (req.user) {
      await audit('DELETE_ALL_PHARMACY_PRODUCTS', req.user.id, {});
    }
    res.json({ status: 'success', message: 'All products deleted' });
  },

  deleteProduct: async (req, res) => {
    const { id } = req.params;
    
    const existing = await db('pharmacy_medications').where({ id }).first();
    if (!existing) throw new AppError('Product not found', 404);

    if (existing.drug_image) deleteFile(existing.drug_image.replace('/uploads/', 'uploads/'));
    if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));

    // Delete related stock movements first
    await db('pharmacy_stock_movements').where({ medication_id: id }).del();
    await db('pharmacy_medications').where({ id }).del();
    
    if (req.user) {
      await audit('DELETE_PHARMACY_PRODUCT', req.user.id, { details: { productId: id } });
    }
    logPharmacyAction(req, 'Product Deleted', existing.name, existing, null, 'Pharmacy Store');

    res.status(204).send();
  },

  updateStock: async (req, res) => {
    const { id } = req.params;
    const { quantity_change, reason, reference_no } = req.body;

    if (!quantity_change) throw new AppError('Quantity change is required', 400);

    const product = await db('pharmacy_medications').where({ id }).first();
    if (!product) throw new AppError('Product not found', 404);

    const newStock = product.stock_quantity + parseInt(quantity_change);
    if (newStock < 0) throw new AppError('Stock cannot go below zero', 400);

    await db.transaction(async (trx) => {
      await trx('pharmacy_medications')
        .where({ id })
        .update({ stock_quantity: newStock });

      await trx('pharmacy_stock_movements').insert({
        medication_id: id,
        quantity_change: parseInt(quantity_change),
        reason,
        reference_no,
        created_by: req.user ? req.user.id : null
      });
    });

    const updatedProduct = await db('pharmacy_medications').where({ id }).first();

    if (req.user) {
      await audit('UPDATE_PHARMACY_STOCK', req.user.id, { details: { productId: id, quantity_change, newStock } });
    }
    logPharmacyAction(req, 'Stock Adjusted', product.name, { stock_quantity: product.stock_quantity }, { stock_quantity: newStock, quantity_change, reason }, 'Pharmacy Store');

    res.json({ status: 'success', data: updatedProduct });
  },

  // ==============================
  // BRANCHES
  // ==============================
  getBranches: async (req, res) => {
    try {
      const managerRoles = req.user ? (req.user.roles || []) : [];
      
      // If Admin/CEO, return all branches
      if (managerRoles.includes('Admin') || managerRoles.includes('CEO')) {
        const branches = await db('branches').orderBy('name', 'asc');
        return res.json({ status: 'success', data: branches });
      }

      // If Pharmacy Manager, restrict to their branches
      if (managerRoles.includes('Pharmacy Manager')) {
        const pmRole = await db('roles').where('name', 'Pharmacy Manager').first();
        if (pmRole) {
          const branchIds = await db('user_roles')
            .where('user_id', req.user.id)
            .where('role_id', pmRole.id)
            .whereNotNull('branch_id')
            .pluck('branch_id');
            
          if (branchIds.length > 0) {
            const branches = await db('branches').whereIn('id', branchIds).orderBy('name', 'asc');
            return res.json({ status: 'success', data: branches });
          }
        }
      }
      
      // Fallback: if not assigned any specific branch yet, return all active
      const branches = await db('branches').orderBy('name', 'asc');
      res.json({ status: 'success', data: branches });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  createBranch: async (req, res) => {
    try {
      const allowed = ['name', 'code', 'address', 'phone', 'working_hours', 'manager_name', 'is_active', 'status'];
      const data = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) data[key] = req.body[key];
      }
      if (req.body.branch_name) data.name = req.body.branch_name;
      if (!data.code && data.name) data.code = data.name.substring(0, 3).toUpperCase();
      if (req.body.latitude) data.latitude = parseFloat(req.body.latitude);
      if (req.body.longitude) data.longitude = parseFloat(req.body.longitude);
      if (req.body.display_order) data.display_order = parseInt(req.body.display_order);

      if (req.file) {
        data.cover_image = getFileInfo(req.file).url;
      }

      const [id] = await db('branches').insert(data);
      const branch = await db('branches').where({ id }).first();
      logPharmacyAction(req, 'Branch Created', branch.name, null, branch, 'Pharmacy Store');
      res.status(201).json({ status: 'success', data: branch });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  updateBranch: async (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ['name', 'code', 'address', 'phone', 'working_hours', 'manager_name', 'is_active', 'status'];
      const data = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) data[key] = req.body[key];
      }
      if (req.body.branch_name) data.name = req.body.branch_name;
      if (req.body.latitude) data.latitude = parseFloat(req.body.latitude);
      if (req.body.longitude) data.longitude = parseFloat(req.body.longitude);
      if (req.body.display_order) data.display_order = parseInt(req.body.display_order);

      const existing = await db('branches').where({ id }).first();
      if (!existing) return res.status(404).json({ status: 'error', message: 'Branch not found' });

      if (req.file) {
        data.cover_image = getFileInfo(req.file).url;
        if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
      }

      await db('branches').where({ id }).update(data);
      const branch = await db('branches').where({ id }).first();
      logPharmacyAction(req, 'Branch Updated', existing.name, existing, branch, 'Pharmacy Store');
      res.json({ status: 'success', data: branch });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  deleteBranch: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await db('branches').where({ id }).first();
      if (!existing) return res.status(404).json({ status: 'error', message: 'Branch not found' });

      if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));

      await db('branches').where({ id }).del();
      logPharmacyAction(req, 'Branch Deleted', existing.name, existing, null, 'Pharmacy Store');
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  // POS Walk-in Checkout for Pharmacists
  posCheckout: async (req, res) => {
    try {
      const { items, payment_method } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Cart items are required' });
      }

      let total_amount = 0;
      const resolvedItems = [];

      for (const item of items) {
        const product = await db('pharmacy_medications').where({ id: item.product_id, is_active: true }).first();
        if (!product) throw new AppError(`Product ID ${item.product_id} not found`, 404);
        if (product.stock_quantity < item.quantity) {
          throw new AppError(`Insufficient stock for "${product.name}". Only ${product.stock_quantity} remaining.`, 400);
        }
        total_amount += (parseFloat(product.price) * item.quantity);
        resolvedItems.push({ product, quantity: item.quantity });
      }

      // Generate a simple invoice number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await db('pos_sales').count('id as total').first();
      const invoice_number = `PH-${dateStr}-${String(parseInt(count.total) + 1).padStart(4, '0')}`;

      // Decrement stock for each item
      for (const { product, quantity } of resolvedItems) {
        await db('pharmacy_medications').where({ id: product.id }).decrement('stock_quantity', quantity);
      }

      // Track in pos_sales for system manager reporting
      const paymentMethodRecord = await db('payment_methods').where('name', 'ilike', `%${payment_method}%`).first() || await db('payment_methods').first();
      if (paymentMethodRecord) {
        const completedStatus = await db('sale_statuses').where('status_code', 'completed').first();
        if (completedStatus) {
          await db('pos_sales').insert({
            invoice_number,
            subtotal: total_amount,
            tax_amount: 0,
            discount_amount: 0,
            total_amount,
            payment_method_id: paymentMethodRecord.id,
            amount_paid: total_amount,
            change_amount: 0,
            cashier_id: req.user.id,
            sale_date: db.fn.now(),
            status_id: completedStatus.id,
            notes: `Pharmacy POS: ${items.map(i => `${i.product_id}x${i.quantity}`).join(', ')}`
          });
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Checkout successful',
        data: { invoice_number, total_amount }
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  getWorkerAddProductSetting: async (req, res) => {
    try {
      const val = await settingsRepository.getValue('pharmacy_worker_can_add_products', true);
      res.json({ status: 'success', data: { enabled: val } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  updateWorkerAddProductSetting: async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') throw new AppError('enabled must be boolean', 400);
      const isManager = req.user.roles.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
      if (!isManager) throw new AppError('Only managers can change this setting', 403);
      await settingsRepository.setValue('pharmacy_worker_can_add_products', enabled, 'Pharmacy', 'Allow workers to manage products and categories', req.user.id);
      res.json({ status: 'success', data: { enabled } });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  getWorkerAdjustStockSetting: async (req, res) => {
    try {
      const val = await settingsRepository.getValue('pharmacy_worker_can_adjust_stock', true);
      res.json({ status: 'success', data: { enabled: val } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  updateWorkerAdjustStockSetting: async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') throw new AppError('enabled must be boolean', 400);
      const isManager = req.user.roles.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
      if (!isManager) throw new AppError('Only managers can change this setting', 403);
      await settingsRepository.setValue('pharmacy_worker_can_adjust_stock', enabled, 'Pharmacy', 'Allow workers to adjust and assign stock', req.user.id);
      res.json({ status: 'success', data: { enabled } });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  getWorkerHealthPostSetting: async (req, res) => {
    try {
      const val = await settingsRepository.getValue('pharmacy_worker_can_manage_health_posts', false);
      res.json({ status: 'success', data: { enabled: val } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  updateWorkerHealthPostSetting: async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') throw new AppError('enabled must be boolean', 400);
      const isManager = req.user.roles.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
      if (!isManager) throw new AppError('Only managers can change this setting', 403);
      await settingsRepository.setValue('pharmacy_worker_can_manage_health_posts', enabled, 'Pharmacy', 'Allow workers to post, edit and delete health posts', req.user.id);
      res.json({ status: 'success', data: { enabled } });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  getWorkerHideDrugSetting: async (req, res) => {
    try {
      const val = await settingsRepository.getValue('pharmacy_worker_can_hide_drugs', false);
      res.json({ status: 'success', data: { enabled: val } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  updateWorkerHideDrugSetting: async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') throw new AppError('enabled must be boolean', 400);
      const isManager = req.user.roles.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
      if (!isManager) throw new AppError('Only managers can change this setting', 403);
      await settingsRepository.setValue('pharmacy_worker_can_hide_drugs', enabled, 'Pharmacy', 'Allow workers to hide and restore drugs', req.user.id);
      res.json({ status: 'success', data: { enabled } });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  // ==============================
  // PHARMACY TASKS
  // ==============================
  getPharmacyTasks: async (req, res) => {
    try {
      // For manager, fetch all tasks. 
      // If we want to restrict to specific branches, we can.
      const tasks = await db('pharmacy_tasks as pt')
        .leftJoin('users as u', 'pt.assigned_to', 'u.id')
        .leftJoin('branches as b', 'pt.branch_id', 'b.id')
        .select(
          'pt.*',
          'u.full_name as staff_name',
          'b.name as branch_name'
        )
        .orderBy('pt.created_at', 'desc');
      res.json({ status: 'success', data: tasks });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  createPharmacyTask: async (req, res) => {
    try {
      const { assigned_to, branch_id, task_type, priority, deadline, instructions } = req.body;
      if (!assigned_to || !task_type || !deadline) {
        throw new AppError('Missing required fields', 400);
      }
      
      const [id] = await db('pharmacy_tasks').insert({
        assigned_to,
        branch_id,
        task_type,
        priority: priority || 'Medium',
        deadline,
        instructions,
        status: 'Pending',
        created_by: req.user ? req.user.id : null
      });

      const task = await db('pharmacy_tasks').where({ id }).first();
      res.status(201).json({ status: 'success', data: task });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  updatePharmacyTaskStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) throw new AppError('Status is required', 400);

      const existing = await db('pharmacy_tasks').where({ id }).first();
      if (!existing) throw new AppError('Task not found', 404);

      await db('pharmacy_tasks').where({ id }).update({ status, updated_at: db.fn.now() });
      const task = await db('pharmacy_tasks').where({ id }).first();
      
      res.json({ status: 'success', data: task });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  }
};

module.exports = pharmacyController;
