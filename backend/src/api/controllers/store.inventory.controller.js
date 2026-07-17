const { db } = require('../../config/database');

// ================================================================
// INVENTORY (store_inventory)
// ================================================================

exports.getInventory = async (req, res) => {
  try {
    const { low_stock, search } = req.query;
    let query = db('store_inventory')
      .join('drugs', 'store_inventory.drug_id', 'drugs.id')
      .select(
        'store_inventory.*',
        'drugs.name as drug_name',
        'drugs.strength',
        'drugs.unit',
        'drugs.unit_price',
        'drugs.category',
        'drugs.status as drug_status'
      )
      .orderBy('drugs.name');
    if (low_stock === 'true') {
      query = query.where('store_inventory.quantity', '<=', db.raw('COALESCE(store_inventory.min_level, 0)'));
    }
    if (search) {
      query = query.where('drugs.name', 'like', `%${search}%`);
    }
    const rows = await query;
    const total_items = rows.length;
    const total_quantity = rows.reduce((s, r) => s + Number(r.quantity), 0);
    const total_value = rows.reduce((s, r) => s + Number(r.quantity) * Number(r.unit_price), 0);
    const low_stock_count = rows.filter(r => Number(r.quantity) <= Number(r.min_level || 0)).length;
    res.json({ success: true, data: rows, total_items, total_quantity, total_value, low_stock_count });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getInventoryItem = async (req, res) => {
  try {
    const row = await db('store_inventory')
      .join('drugs', 'store_inventory.drug_id', 'drugs.id')
      .select('store_inventory.*', 'drugs.name as drug_name', 'drugs.strength', 'drugs.unit', 'drugs.unit_price', 'drugs.category')
      .where('store_inventory.id', req.params.id)
      .first();
    if (!row) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { quantity, min_level, batch_no, expiry_date, unit_cost, storage_location } = req.body;
    const upd = {};
    if (quantity !== undefined) upd.quantity = quantity;
    if (min_level !== undefined) upd.min_level = min_level;
    if (batch_no !== undefined) upd.batch_no = batch_no;
    if (expiry_date !== undefined) upd.expiry_date = expiry_date;
    if (unit_cost !== undefined) upd.unit_cost = unit_cost;
    if (storage_location !== undefined) upd.storage_location = storage_location;
    const affected = await db('store_inventory').where('id', req.params.id).update(upd);
    if (!affected) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// GOODS RECEIVING (stock_receipts)
// ================================================================

exports.createReceipt = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { receipt_no, supplier_name, supplier_id, purchase_order_ref, delivery_note_ref, receipt_date, remarks, items } = req.body;
    if (!receipt_no || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'receipt_no and items required' });
    }
    const [receipt_id] = await trx('stock_receipts').insert({
      receipt_no, supplier_name, supplier_id, purchase_order_ref, delivery_note_ref,
      receipt_date: receipt_date || new Date(), remarks, received_by: req.user?.id
    });
    for (const item of items) {
      await trx('stock_receipt_items').insert({
        receipt_id, drug_id: item.drug_id, batch_no: item.batch_no,
        expiry_date: item.expiry_date, manufacture_date: item.manufacture_date,
        quantity: item.quantity, unit_cost: item.unit_cost,
        subtotal: item.quantity * (item.unit_cost || 0),
        storage_location: item.storage_location
      });
      const existing = await trx('store_inventory').where('drug_id', item.drug_id).first();
      if (existing) {
        await trx('store_inventory').where('id', existing.id).update({
          quantity: db.raw('quantity + ?', [item.quantity]),
          batch_no: item.batch_no || existing.batch_no,
          expiry_date: item.expiry_date || existing.expiry_date,
          unit_cost: item.unit_cost || existing.unit_cost,
          storage_location: item.storage_location || existing.storage_location,
          last_received_at: db.raw('NOW()')
        });
      } else {
        await trx('store_inventory').insert({
          drug_id: item.drug_id, quantity: item.quantity,
          batch_no: item.batch_no, expiry_date: item.expiry_date,
          unit_cost: item.unit_cost, storage_location: item.storage_location,
          last_received_at: db.raw('NOW()')
        });
      }
    }
    await trx.commit();
    res.status(201).json({ success: true, message: 'Receipt created', data: { id: receipt_id } });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listReceipts = async (req, res) => {
  try {
    const rows = await db('stock_receipts').orderBy('created_at', 'desc');
    for (const r of rows) {
      r.items = await db('stock_receipt_items').where('receipt_id', r.id);
    }
    const total = rows.reduce((s, r) => s + r.items.reduce((si, i) => si + Number(i.quantity), 0), 0);
    res.json({ success: true, data: rows, total_received: total, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const row = await db('stock_receipts').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    row.items = await db('stock_receipt_items').where('receipt_id', row.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listTodayReceipts = async (req, res) => {
  try {
    const rows = await db('stock_receipts').whereRaw('DATE(created_at) = CURDATE()').orderBy('created_at', 'desc');
    for (const r of rows) {
      r.items = await db('stock_receipt_items').where('receipt_id', r.id);
    }
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateReceipt = async (req, res) => {
  try {
    const { supplier_name, purchase_order_ref, delivery_note_ref, remarks } = req.body;
    const upd = {};
    if (supplier_name !== undefined) upd.supplier_name = supplier_name;
    if (purchase_order_ref !== undefined) upd.purchase_order_ref = purchase_order_ref;
    if (delivery_note_ref !== undefined) upd.delivery_note_ref = delivery_note_ref;
    if (remarks !== undefined) upd.remarks = remarks;
    const affected = await db('stock_receipts').where('id', req.params.id).update(upd);
    if (!affected) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Receipt updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteReceipt = async (req, res) => {
  const trx = await db.transaction();
  try {
    const row = await trx('stock_receipts').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    const items = await trx('stock_receipt_items').where('receipt_id', row.id);
    for (const item of items) {
      await trx('store_inventory').where('drug_id', item.drug_id).update({
        quantity: db.raw('GREATEST(quantity - ?, 0)', [item.quantity])
      });
    }
    await trx('stock_receipt_items').where('receipt_id', row.id).del();
    await trx('stock_receipts').where('id', row.id).del();
    await trx.commit();
    res.json({ success: true, message: 'Receipt deleted, inventory reverted' });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// GOODS ISSUE (stock_issues)
// ================================================================

exports.createIssue = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { issue_no, department, issued_to, requisition_ref, approval_ref, issue_date, remarks, items } = req.body;
    if (!issue_no || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'issue_no and items required' });
    }
    for (const item of items) {
      const inv = await trx('store_inventory').where('drug_id', item.drug_id).first();
      if (!inv || Number(inv.quantity) < Number(item.quantity)) {
        await trx.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for drug_id ${item.drug_id}` });
      }
    }
    const [issue_id] = await trx('stock_issues').insert({
      issue_no, department, issued_to, requisition_ref, approval_ref,
      issue_date: issue_date || new Date(), remarks, issued_by: req.user?.id
    });
    for (const item of items) {
      await trx('stock_issue_items').insert({
        issue_id, drug_id: item.drug_id, batch_no: item.batch_no,
        quantity: item.quantity, unit_cost: item.unit_cost
      });
      await trx('store_inventory').where('drug_id', item.drug_id).update({
        quantity: db.raw('GREATEST(quantity - ?, 0)', [item.quantity]),
        last_issued_at: db.raw('NOW()')
      });
    }
    await trx.commit();
    res.status(201).json({ success: true, message: 'Issue created', data: { id: issue_id } });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listIssues = async (req, res) => {
  try {
    const rows = await db('stock_issues').orderBy('created_at', 'desc');
    for (const r of rows) {
      r.items = await db('stock_issue_items').where('issue_id', r.id);
    }
    const total = rows.reduce((s, r) => s + r.items.reduce((si, i) => si + Number(i.quantity), 0), 0);
    res.json({ success: true, data: rows, total_issued: total, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getIssue = async (req, res) => {
  try {
    const row = await db('stock_issues').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    row.items = await db('stock_issue_items').where('issue_id', row.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listTodayIssues = async (req, res) => {
  try {
    const rows = await db('stock_issues').whereRaw('DATE(created_at) = CURDATE()').orderBy('created_at', 'desc');
    for (const r of rows) {
      r.items = await db('stock_issue_items').where('issue_id', r.id);
    }
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateIssue = async (req, res) => {
  try {
    const { department, issued_to, remarks } = req.body;
    const upd = {};
    if (department !== undefined) upd.department = department;
    if (issued_to !== undefined) upd.issued_to = issued_to;
    if (remarks !== undefined) upd.remarks = remarks;
    const affected = await db('stock_issues').where('id', req.params.id).update(upd);
    if (!affected) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Issue updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteIssue = async (req, res) => {
  const trx = await db.transaction();
  try {
    const row = await trx('stock_issues').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    const items = await trx('stock_issue_items').where('issue_id', row.id);
    for (const item of items) {
      await trx('store_inventory').where('drug_id', item.drug_id).update({
        quantity: db.raw('quantity + ?', [item.quantity])
      });
    }
    await trx('stock_issue_items').where('issue_id', row.id).del();
    await trx('stock_issues').where('id', row.id).del();
    await trx.commit();
    res.json({ success: true, message: 'Issue deleted, inventory restored' });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// STOCK TRANSFERS
// ================================================================

exports.createTransfer = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { transfer_no, from_location, to_location, transfer_type, authorized_by, transfer_date, remarks, items } = req.body;
    if (!transfer_no || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'transfer_no and items required' });
    }
    for (const item of items) {
      const inv = await trx('store_inventory').where('drug_id', item.drug_id).first();
      if (!inv || Number(inv.quantity) < Number(item.quantity)) {
        await trx.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for drug_id ${item.drug_id}` });
      }
    }
    const [transfer_id] = await trx('stock_transfers').insert({
      transfer_no, from_location, to_location, transfer_type, authorized_by,
      transfer_date: transfer_date || new Date(), remarks, created_by: req.user?.id, status: 'Pending'
    });
    for (const item of items) {
      await trx('stock_transfer_items').insert({
        transfer_id, drug_id: item.drug_id, batch_no: item.batch_no,
        expiry_date: item.expiry_date, quantity: item.quantity
      });
      await trx('store_inventory').where('drug_id', item.drug_id).update({
        quantity: db.raw('GREATEST(quantity - ?, 0)', [item.quantity])
      });
    }
    await trx.commit();
    res.status(201).json({ success: true, message: 'Transfer created', data: { id: transfer_id } });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listTransfers = async (req, res) => {
  try {
    const rows = await db('stock_transfers').orderBy('created_at', 'desc');
    for (const r of rows) {
      r.items = await db('stock_transfer_items').where('transfer_id', r.id);
    }
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getTransfer = async (req, res) => {
  try {
    const row = await db('stock_transfers').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    row.items = await db('stock_transfer_items').where('transfer_id', row.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateTransferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'Approved', 'In Transit', 'Received', 'Cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const affected = await db('stock_transfers').where('id', req.params.id).update({ status });
    if (!affected) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Status updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// ================================================================
// ADD STOCK (register new drug + initial inventory)
// ================================================================

exports.addNewStock = async (req, res) => {
  try {
    const { name, strength, unit, unit_price, category, classification, therapeutic_use, requires_prescription, initial_quantity, min_level, max_level, storage_location } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Drug name is required' });
    }

    const [drugId] = await db('drugs').insert({
      name: name.trim(),
      strength: strength || null,
      unit: unit || null,
      unit_price: unit_price || 0,
      category: category || null,
      classification: classification || null,
      therapeutic_use: therapeutic_use || null,
      requires_prescription: requires_prescription || false,
      status: 'ACTIVE'
    });

    if (initial_quantity && Number(initial_quantity) > 0) {
      const qty = Number(initial_quantity);
      const existing = await db('store_inventory').where('drug_id', drugId).first();
      if (existing) {
        await db('store_inventory').where('drug_id', drugId).update({ quantity: existing.quantity + qty });
      } else {
        await db('store_inventory').insert({
          drug_id: drugId, quantity: qty,
          min_level: min_level || 0, max_level: max_level || 0,
          storage_location: storage_location || null,
          batch_no: 'BT-INITIAL', unit_cost: unit_price || 0,
          expiry_date: null
        });
      }
    }

    const drug = await db('drugs').where('id', drugId).first();
    res.status(201).json({ success: true, message: 'New stock item registered', data: drug });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// STOCK ADJUSTMENTS
// ================================================================

exports.createAdjustment = async (req, res) => {
  try {
    const { adjustment_no, drug_id, batch_no, adjustment_type, reason, adjustment_qty, approval_code, adjustment_date } = req.body;
    if (!adjustment_no || !drug_id || adjustment_qty === undefined) {
      return res.status(400).json({ success: false, message: 'adjustment_no, drug_id, adjustment_qty required' });
    }
    const inv = await db('store_inventory').where('drug_id', drug_id).first();
    const qty_before = inv ? Number(inv.quantity) : 0;
    const qty_after = Math.max(0, qty_before + Number(adjustment_qty));
    await db('stock_adjustments').insert({
      adjustment_no, drug_id, batch_no, adjustment_type, reason,
      quantity_before: qty_before, quantity_after: qty_after,
      adjustment_qty: Number(adjustment_qty), approval_code,
      adjustment_date: adjustment_date || new Date(),
      adjusted_by: req.user?.id,
      status: 'PENDING'
    });
    res.status(201).json({ success: true, message: 'Adjustment submitted for CEO approval', status: 'PENDING' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listAdjustments = async (req, res) => {
  try {
    const rows = await db('stock_adjustments')
      .join('drugs', 'stock_adjustments.drug_id', 'drugs.id')
      .select('stock_adjustments.*', 'drugs.name as drug_name', 'drugs.strength', 'drugs.unit')
      .orderBy('created_at', 'desc');
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getPendingAdjustments = async (req, res) => {
  try {
    const rows = await db('stock_adjustments')
      .join('drugs', 'stock_adjustments.drug_id', 'drugs.id')
      .select('stock_adjustments.*', 'drugs.name as drug_name', 'drugs.strength', 'drugs.unit')
      .where('stock_adjustments.status', 'PENDING')
      .orderBy('created_at', 'desc');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.approveAdjustment = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const adj = await trx('stock_adjustments').where('id', id).first();
    if (!adj) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    if (adj.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Adjustment is not pending' });

    await trx('stock_adjustments').where('id', id).update({
      status: 'APPROVED',
      approved_by: req.user?.id,
      approved_at: new Date()
    });

    const inv = await trx('store_inventory').where('drug_id', adj.drug_id).first();
    if (inv) {
      await trx('store_inventory').where('id', inv.id).update({ quantity: adj.quantity_after });
    } else {
      await trx('store_inventory').insert({ drug_id: adj.drug_id, quantity: adj.quantity_after, batch_no: adj.batch_no });
    }

    await trx.commit();
    res.json({ success: true, message: 'Adjustment approved and applied', data: adj });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.rejectAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const adj = await db('stock_adjustments').where('id', id).first();
    if (!adj) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    if (adj.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Adjustment is not pending' });

    await db('stock_adjustments').where('id', id).update({
      status: 'REJECTED',
      rejection_reason: reason.trim(),
      approved_by: req.user?.id,
      approved_at: new Date()
    });
    res.json({ success: true, message: 'Adjustment rejected' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// PHYSICAL COUNTS
// ================================================================

exports.createCount = async (req, res) => {
  try {
    const { count_no, count_type, count_date, remarks, items } = req.body;
    if (!count_no || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'count_no and items required' });
    }
    const [count_id] = await db('stock_counts').insert({
      count_no, count_type, count_date: count_date || new Date(),
      remarks, counted_by: req.user?.id, status: 'Draft'
    });
    for (const item of items) {
      const inv = await db('store_inventory').where('drug_id', item.drug_id).first();
      const system_qty = inv ? Number(inv.quantity) : 0;
      const phys_qty = Number(item.physical_quantity);
      await db('stock_count_items').insert({
        count_id, drug_id: item.drug_id, batch_no: item.batch_no,
        system_quantity: system_qty, physical_quantity: phys_qty,
        variance: phys_qty - system_qty, reason_code: item.reason_code
      });
    }
    res.status(201).json({ success: true, message: 'Count created', data: { id: count_id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listCounts = async (req, res) => {
  try {
    const rows = await db('stock_counts').orderBy('created_at', 'desc');
    for (const r of rows) {
      r.items = await db('stock_count_items').where('count_id', r.id);
    }
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    const row = await db('stock_counts').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    row.items = await db('stock_count_items').where('count_id', row.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateCountStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Draft', 'In Progress', 'Pending Verification', 'Verified', 'Closed'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const upd = { status };
    if (status === 'Verified') upd.verified_by = req.user?.id;
    const affected = await db('stock_counts').where('id', req.params.id).update(upd);
    if (!affected) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Status updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// REQUISITIONS (M20)
// ================================================================

exports.createRequisition = async (req, res) => {
  try {
    const { requisition_no, department, requested_by, priority, requisition_date, remarks, items } = req.body;
    if (!requisition_no || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'requisition_no and items required' });
    }
    const [req_id] = await db('store_requisitions').insert({
      requisition_no, department, requested_by, priority: priority || 'Normal',
      requisition_date: requisition_date || new Date(), remarks, status: 'Pending'
    });
    for (const item of items) {
      await db('store_requisition_items').insert({
        requisition_id: req_id, item_name: item.item_name,
        drug_id: item.drug_id, quantity: item.quantity
      });
    }
    res.status(201).json({ success: true, message: 'Requisition created', data: { id: req_id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listRequisitions = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('store_requisitions').orderBy('created_at', 'desc');
    if (status) query = query.where('status', status);
    const rows = await query;
    for (const r of rows) {
      r.items = await db('store_requisition_items').where('requisition_id', r.id);
    }
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getRequisition = async (req, res) => {
  try {
    const row = await db('store_requisitions').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    row.items = await db('store_requisition_items').where('requisition_id', row.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateRequisitionStatus = async (req, res) => {
  try {
    const { status, rejection_reason, decided_by } = req.body;
    const valid = ['Pending', 'Approved', 'Issued', 'Rejected', 'Wait'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const updateData = { status };
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (decided_by) updateData.decided_by = decided_by;
    if (status === 'Approved') updateData.approved_at = db.fn.now();
    const affected = await db('store_requisitions').where('id', req.params.id).update(updateData);
    if (!affected) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Status updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// APPROVED REQUESTS (M21)
// ================================================================

exports.createApprovedRequest = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { approval_no, requisition_id, department, approved_by, approval_date, stamp_id, items } = req.body;
    if (!approval_no || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'approval_no and items required' });
    }
    const [approval_id] = await trx('store_approved_requests').insert({
      approval_no, requisition_id, department, approved_by,
      approval_date: approval_date || new Date(), stamp_id, status: 'Active'
    });
    for (const item of items) {
      await trx('store_approved_request_items').insert({
        approval_id, item_name: item.item_name,
        drug_id: item.drug_id, quantity_approved: item.quantity_approved
      });
    }
    if (requisition_id) {
      await trx('store_requisitions').where('id', requisition_id).update({ status: 'Approved' });
    }
    await trx.commit();
    res.status(201).json({ success: true, message: 'Approved request created', data: { id: approval_id } });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listApprovedRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('store_approved_requests').orderBy('created_at', 'desc');
    if (status) query = query.where('status', status);
    const rows = await query;
    for (const r of rows) {
      r.items = await db('store_approved_request_items').where('approval_id', r.id);
    }
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// DASHBOARD STATS
// ================================================================

exports.dashboardStats = async (req, res) => {
  try {
    const totalItems = await db('store_inventory').count('id as count').first();
    const totalQty = await db('store_inventory').sum('quantity as qty').first();
    const totalDrugs = await db('drugs').count('id as count').first();
    const lowStock = await db('store_inventory')
      .where(db.raw('quantity <= COALESCE(min_level, 0)')).count('id as count').first();
    const valueRow = await db('store_inventory')
      .join('drugs', 'store_inventory.drug_id', 'drugs.id')
      .select(db.raw('COALESCE(SUM(store_inventory.quantity * drugs.unit_price), 0) as total_value')).first();
    const todayReceipts = await db('stock_receipts')
      .whereRaw('DATE(created_at) = CURDATE()').count('id as count').first();
    const todayIssues = await db('stock_issues')
      .whereRaw('DATE(created_at) = CURDATE()').count('id as count').first();
    const pendingRequisitions = await db('store_requisitions')
      .where('status', 'Pending').count('id as count').first();
    const pendingTransfers = await db('stock_transfers')
      .where('status', 'Pending').count('id as count').first();
    const recentReceipts = await db('stock_receipts').orderBy('created_at', 'desc').limit(5);
    const recentIssues = await db('stock_issues').orderBy('created_at', 'desc').limit(5);
    const recentTransfers = await db('stock_transfers').orderBy('created_at', 'desc').limit(5);
    const lowStockItems = await db('store_inventory')
      .join('drugs', 'store_inventory.drug_id', 'drugs.id')
      .select('store_inventory.*', 'drugs.name as drug_name', 'drugs.strength', 'drugs.unit')
      .where(db.raw('store_inventory.quantity <= COALESCE(store_inventory.min_level, 0)'))
      .limit(10);

    res.json({
      success: true,
      data: {
        totalItems: Number(totalItems?.count || 0),
        totalQuantity: Number(totalQty?.qty || 0),
        totalDrugs: Number(totalDrugs?.count || 0),
        totalValue: Number(valueRow?.total_value || 0),
        lowStockCount: Number(lowStock?.count || 0),
        todayReceipts: Number(todayReceipts?.count || 0),
        todayIssues: Number(todayIssues?.count || 0),
        pendingRequisitions: Number(pendingRequisitions?.count || 0),
        pendingTransfers: Number(pendingTransfers?.count || 0),
        recentReceipts, recentIssues, recentTransfers, lowStockItems
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// STOCK MOVEMENTS (unified log)
// ================================================================

exports.stockMovements = async (req, res) => {
  try {
    const { limit } = req.query;
    const receipts = await db('stock_receipts')
      .join('stock_receipt_items', 'stock_receipts.id', 'stock_receipt_items.receipt_id')
      .join('drugs', 'stock_receipt_items.drug_id', 'drugs.id')
      .select(
        db.raw("'Receipt' as movement_type"),
        'stock_receipt_items.id as id',
        'stock_receipts.receipt_no as ref_no',
        'drugs.name as item_name',
        'drugs.strength',
        'stock_receipt_items.quantity as qty_moved',
        'drugs.unit',
        db.raw("COALESCE(NULLIF(stock_receipts.received_by, ''), 'Store') as performed_by"),
        'stock_receipts.created_at'
      );
    const issues = await db('stock_issues')
      .join('stock_issue_items', 'stock_issues.id', 'stock_issue_items.issue_id')
      .join('drugs', 'stock_issue_items.drug_id', 'drugs.id')
      .select(
        db.raw("'Issue' as movement_type"),
        'stock_issue_items.id as id',
        'stock_issues.issue_no as ref_no',
        'drugs.name as item_name',
        'drugs.strength',
        'stock_issue_items.quantity as qty_moved',
        'drugs.unit',
        'stock_issues.issued_to as performed_by',
        'stock_issues.created_at'
      );
    const adjustments = await db('stock_adjustments')
      .join('drugs', 'stock_adjustments.drug_id', 'drugs.id')
      .select(
        db.raw("'Adjustment' as movement_type"),
        'stock_adjustments.id',
        'stock_adjustments.adjustment_no as ref_no',
        'drugs.name as item_name',
        'drugs.strength',
        'stock_adjustments.adjustment_qty as qty_moved',
        'drugs.unit',
        db.raw("'' as performed_by"),
        'stock_adjustments.created_at'
      );
    const transfers = await db('stock_transfers')
      .join('stock_transfer_items', 'stock_transfers.id', 'stock_transfer_items.transfer_id')
      .join('drugs', 'stock_transfer_items.drug_id', 'drugs.id')
      .select(
        db.raw("'Transfer' as movement_type"),
        'stock_transfer_items.id as id',
        'stock_transfers.transfer_no as ref_no',
        'drugs.name as item_name',
        'drugs.strength',
        'stock_transfer_items.quantity as qty_moved',
        'drugs.unit',
        db.raw("CONCAT(COALESCE(stock_transfers.authorized_by, ''), ' (', COALESCE(stock_transfers.from_location, ''), ' → ', COALESCE(stock_transfers.to_location, ''), ')') as performed_by"),
        'stock_transfers.created_at'
      );
    const all = [...receipts, ...issues, ...adjustments, ...transfers]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const sliced = limit ? all.slice(0, Number(limit)) : all;
    res.json({ success: true, data: sliced, total: all.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// RECENT ACTIVITIES (unified real-time feed)
// ================================================================

exports.getRecentActivities = async (req, res) => {
  try {
    const receipts = await db('stock_receipts')
      .select(db.raw("'Receipt' as type"), 'id', 'receipt_no as ref_no', 'supplier_name as ref_name', 'created_at')
      .orderBy('created_at', 'desc').limit(10);
    const issues = await db('stock_issues')
      .select(db.raw("'Issue' as type"), 'id', 'issue_no as ref_no', 'issued_to as ref_name', 'created_at')
      .orderBy('created_at', 'desc').limit(10);
    const transfers = await db('stock_transfers')
      .select(db.raw("'Transfer' as type"), 'id', 'transfer_no as ref_no', 'from_location as ref_name', 'created_at')
      .orderBy('created_at', 'desc').limit(10);
    const adjustments = await db('stock_adjustments')
      .select(db.raw("'Adjustment' as type"), 'id', 'adjustment_no as ref_no', db.raw("'' as ref_name"), 'created_at')
      .orderBy('created_at', 'desc').limit(10);
    const all = [...receipts, ...issues, ...transfers, ...adjustments]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 30);
    res.json({ success: true, data: all });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// SUPPLIERS
// ================================================================

exports.getSuppliers = async (req, res) => {
  try {
    const rows = await db('store_suppliers').orderBy('name');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, tax_id, payment_terms } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });
    const [id] = await db('store_suppliers').insert({
      supplier_no: 'SUP-' + String(Date.now()).slice(-6), name, contact_person, phone, email, address, tax_id,
      payment_terms: payment_terms || 'Net 30',
    });
    res.status(201).json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const upd = req.body;
    delete upd.id; delete upd.supplier_no;
    await db('store_suppliers').where('id', req.params.id).update(upd);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.toggleSupplierStatus = async (req, res) => {
  try {
    const row = await db('store_suppliers').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    const newStatus = row.status === 'Active' ? 'Inactive' : 'Active';
    await db('store_suppliers').where('id', req.params.id).update({ status: newStatus });
    res.json({ success: true, data: { status: newStatus } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// DELIVERIES
// ================================================================

exports.getDeliveries = async (req, res) => {
  try {
    const rows = await db('store_deliveries').orderBy('created_at', 'desc');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createDelivery = async (req, res) => {
  try {
    const { supplier_name, items_description, quantity_summary, delivery_date, po_reference } = req.body;
    const [id] = await db('store_deliveries').insert({
      delivery_no: 'DEL-' + String(Date.now()).slice(-6),
      supplier_name, items_description, quantity_summary, delivery_date, po_reference
    });
    res.status(201).json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const valid = ['Pending', 'In Transit', 'Received', 'Rejected'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    await db('store_deliveries').where('id', req.params.id).update({ status, rejection_reason });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// OVERSTOCK (items exceeding max_level)
// ================================================================

exports.getOverstock = async (req, res) => {
  try {
    const rows = await db('store_inventory')
      .join('drugs', 'store_inventory.drug_id', 'drugs.id')
      .select('store_inventory.*', 'drugs.name as drug_name', 'drugs.unit_price')
      .where('store_inventory.quantity', '>', db.raw('COALESCE(store_inventory.max_level, 999999)'))
      .orderBy(db.raw('store_inventory.quantity - COALESCE(store_inventory.max_level, 0)'), 'desc');
    const data = rows.map(r => ({
      id: r.id, name: r.drug_name, quantity: r.quantity, max_level: r.max_level || 0,
      excess: r.quantity - (r.max_level || 0), unit_price: r.unit_price,
      excess_value: (r.quantity - (r.max_level || 0)) * Number(r.unit_price),
      storage_location: r.storage_location
    }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// STORE STAFF
// ================================================================

exports.getStoreStaff = async (req, res) => {
  try {
    const rows = await db('store_staff').orderBy('full_name');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createStoreStaff = async (req, res) => {
  try {
    const { full_name, role, phone, hire_date } = req.body;
    if (!full_name) return res.status(400).json({ success: false, message: 'full_name required' });
    const [id] = await db('store_staff').insert({
      staff_no: 'STF-' + String(Date.now()).slice(-6), full_name, role, phone, hire_date
    });
    res.status(201).json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.toggleStoreStaffStatus = async (req, res) => {
  try {
    const row = await db('store_staff').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    const newStatus = row.status === 'Active' ? 'Inactive' : 'Active';
    await db('store_staff').where('id', req.params.id).update({ status: newStatus });
    res.json({ success: true, data: { status: newStatus } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// STORE ATTENDANCE
// ================================================================

exports.getStoreAttendance = async (req, res) => {
  try {
    const rows = await db('store_attendance')
      .join('store_staff', 'store_attendance.staff_id', 'store_staff.id')
      .select('store_attendance.*', 'store_staff.full_name', 'store_staff.role', 'store_staff.staff_no')
      .orderBy('store_attendance.attendance_date', 'desc')
      .orderBy('store_staff.full_name');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.markStoreAttendance = async (req, res) => {
  try {
    const { staff_id, attendance_date, status, reason } = req.body;
    if (!staff_id || !status) return res.status(400).json({ success: false, message: 'staff_id and status required' });
    const date = attendance_date || new Date().toISOString().slice(0, 10);
    const existing = await db('store_attendance').where({ staff_id, attendance_date: date }).first();
    if (existing) {
      await db('store_attendance').where('id', existing.id).update({ status, reason });
    } else {
      await db('store_attendance').insert({ staff_id, attendance_date: date, status, reason });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
