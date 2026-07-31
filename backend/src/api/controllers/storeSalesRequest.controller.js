/**
 * Store Sales Request Flow Controller
 * Handles: Sales Manager creates signed request → Store Keeper releases → Auto Sale record
 */
const { db } = require('../../config/database');

// ─── Helper: generate a unique code ────────────────────────────────────────
function genCode(prefix) {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

// ─── GET /store-sales-requests ─────────────────────────────────────────────
// Sales Manager: see their own requests; Store Keeper: see all pending ones
exports.listRequests = async (req, res) => {
  try {
    const { status, mine } = req.query;
    let q = db('store_sales_requests').orderBy('created_at', 'desc');
    if (status) q = q.where('status', status);
    if (mine === 'true' && req.user?.id) q = q.where('requested_by_id', req.user.id);
    const rows = await q.limit(200);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};

// ─── POST /store-sales-requests ────────────────────────────────────────────
// Sales Manager submits a signed request
exports.createRequest = async (req, res) => {
  try {
    const {
      product_id, product_name, unit,
      quantity_requested, customer_name, customer_phone,
      digital_signature, notes, store_module
    } = req.body;

    if (!product_name) return res.status(400).json({ status: 'error', message: 'Product name is required' });
    if (!quantity_requested || quantity_requested < 1) return res.status(400).json({ status: 'error', message: 'Quantity must be at least 1' });
    if (!digital_signature) return res.status(400).json({ status: 'error', message: 'Digital signature is required — Sales Manager must sign before submitting' });

    const request_code = genCode('SSR');
    const [id] = await db('store_sales_requests').insert({
      request_code,
      store_module: store_module || 'general_store',
      product_id: product_id || null,
      product_name,
      unit: unit || null,
      quantity_requested: parseInt(quantity_requested),
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      requested_by_id: req.user?.id || null,
      requested_by_name: req.user?.name || req.user?.full_name || req.user?.username || null,
      digital_signature,
      signature_timestamp: new Date(),
      notes: notes || null,
      status: 'Pending',
    });

    const created = await db('store_sales_requests').where('id', id).first();
    res.status(201).json({ status: 'success', data: created });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};

// ─── GET /store-sales-requests/:id ─────────────────────────────────────────
exports.getRequest = async (req, res) => {
  try {
    const req_ = await db('store_sales_requests').where('id', req.params.id).first();
    if (!req_) return res.status(404).json({ status: 'error', message: 'Request not found' });
    const release = await db('store_sales_releases').where('request_id', req.params.id).first();
    const saleRec = await db('store_sales_records').where('request_id', req.params.id).first();
    res.json({ status: 'success', data: { ...req_, release, sale_record: saleRec } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};

// ─── PATCH /store-sales-requests/:id/reject ────────────────────────────────
exports.rejectRequest = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    const existing = await db('store_sales_requests').where('id', req.params.id).first();
    if (!existing) return res.status(404).json({ status: 'error', message: 'Request not found' });
    if (existing.status !== 'Pending') return res.status(400).json({ status: 'error', message: `Cannot reject a request with status: ${existing.status}` });

    await db('store_sales_requests').where('id', req.params.id).update({
      status: 'Rejected',
      rejection_reason: rejection_reason || 'Rejected by Store Keeper',
      updated_at: new Date(),
    });

    res.json({ status: 'success', message: 'Request rejected' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};

// ─── POST /store-sales-requests/:id/release ────────────────────────────────
// Store Keeper releases the product; system auto-deducts stock and creates sale record
exports.releaseRequest = async (req, res) => {
  const trx = await db.transaction();
  try {
    const reqId = parseInt(req.params.id);
    const { notes } = req.body;

    // Fetch the request
    const storeReq = await trx('store_sales_requests').where('id', reqId).first();
    if (!storeReq) { await trx.rollback(); return res.status(404).json({ status: 'error', message: 'Request not found' }); }
    if (storeReq.status !== 'Pending') { await trx.rollback(); return res.status(400).json({ status: 'error', message: `Cannot release a request with status: ${storeReq.status}` }); }
    if (!storeReq.digital_signature) { await trx.rollback(); return res.status(403).json({ status: 'error', message: 'BLOCKED: No digital signature found on this request. The Sales Manager must sign first.' }); }

    // Deduct from general_store_materials
    let remaining_stock = null;
    if (storeReq.product_id) {
      const mat = await trx('general_store_materials').where('material_id', storeReq.product_id).first();
      if (mat) {
        const currentQty = parseFloat(mat.quantity_in_store) || 0;
        const newQty = Math.max(0, currentQty - storeReq.quantity_requested);
        remaining_stock = newQty;
        await trx('general_store_materials').where('material_id', storeReq.product_id).update({
          quantity_in_store: newQty,
          updated_at: new Date(),
        });
        // Log movement
        await trx('general_movement_log').insert({
          material_id: mat.material_id,
          material_name: mat.material_name,
          action_type: 'Issue to Department',
          quantity: storeReq.quantity_requested,
          department: 'Sales',
          registered_by: req.user?.name || req.user?.full_name || 'Store Keeper',
          notes: `Sales Request #${storeReq.request_code} — Released to Sales Manager: ${storeReq.requested_by_name || '—'} | Customer: ${storeReq.customer_name || 'N/A'}`,
          created_at: new Date(),
        }).catch(() => {}); // log failure is non-fatal
      }
    }

    // Create release record
    await trx('store_sales_releases').insert({
      request_id: reqId,
      released_by_id: req.user?.id || null,
      released_by_name: req.user?.name || req.user?.full_name || req.user?.username || null,
      quantity_released: storeReq.quantity_requested,
      remaining_stock,
      release_date: new Date(),
      notes: notes || null,
    });

    // Auto-create sale record
    const sale_code = genCode('SALE');
    const unit_value = null; // can be derived later from store material value if needed
    await trx('store_sales_records').insert({
      sale_code,
      request_id: reqId,
      product_id: storeReq.product_id,
      product_name: storeReq.product_name,
      quantity_sold: storeReq.quantity_requested,
      sold_by_id: storeReq.requested_by_id,
      sold_by_name: storeReq.requested_by_name,
      customer_name: storeReq.customer_name,
      customer_phone: storeReq.customer_phone,
      sale_date: new Date(),
    });

    // ALSO SYNC RETAIL PRODUCTS INVENTORY (Decrement so they match exactly)
    const gsm = await trx('general_store_materials').where('id', storeReq.product_id).first();
    if (gsm && gsm.material_id) {
      await trx('retail_products')
        .where('sku', gsm.material_id)
        .decrement('stock_quantity', storeReq.quantity_requested)
        .catch(() => {}); // Best effort
    }

    // Update request status → Sold
    await trx('store_sales_requests').where('id', reqId).update({
      status: 'Sold',
      store_keeper_signature: req.body.store_keeper_signature,
      store_keeper_notes: req.body.notes || req.body.store_keeper_notes,
      updated_at: new Date(),
    });

    await trx.commit();

    // Fetch full result
    const updatedReq = await db('store_sales_requests').where('id', reqId).first();
    const release = await db('store_sales_releases').where('request_id', reqId).first();
    const saleRecord = await db('store_sales_records').where('request_id', reqId).first();

    res.json({ status: 'success', message: 'Product released and sale recorded successfully', data: { request: updatedReq, release, sale_record: saleRecord } });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ status: 'error', message: e.message });
  }
};

// ─── GET /store-sales-requests/records ─────────────────────────────────────
// Sale records — visible to CEO, Finance, Admin
exports.listSaleRecords = async (req, res) => {
  try {
    const rows = await db('store_sales_records')
      .join('store_sales_requests', 'store_sales_records.request_id', 'store_sales_requests.id')
      .select(
        'store_sales_records.*',
        'store_sales_requests.request_code',
        'store_sales_requests.digital_signature',
        'store_sales_requests.status as request_status',
      )
      .orderBy('store_sales_records.sale_date', 'desc')
      .limit(500);
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};
