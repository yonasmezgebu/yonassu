const { db } = require('../../config/database');
const notificationRepository = require('../../repositories/notification.repository');
const audit = require('../../services/centralAudit.service');

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
        'drugs.classification',
        'drugs.therapeutic_use',
        'drugs.requires_prescription',
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
  const trx = await db.transaction();
  try {
    const { 
      // store_inventory fields
      quantity, min_level, max_level, batch_no, expiry_date, near_expiry_days, unit_cost, storage_location,
      // drugs fields
      drug_name, strength, unit, unit_price, category, classification, therapeutic_use, requires_prescription
    } = req.body;

    const inv = await trx('store_inventory').where('id', req.params.id).first();
    if (!inv) {
      await trx.rollback();
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    const drug = await trx('drugs').where('id', inv.drug_id).first();

    const oldData = {
      ...inv,
      drug_name: drug.name,
      strength: drug.strength,
      unit: drug.unit,
      unit_price: drug.unit_price,
      category: drug.category,
      classification: drug.classification,
      therapeutic_use: drug.therapeutic_use,
      requires_prescription: drug.requires_prescription
    };

    const newData = { ...req.body };

    const [reqId] = await trx('stock_update_requests').insert({
      inventory_id: inv.id,
      drug_id: drug.id,
      requested_by: req.user?.id,
      old_data: JSON.stringify(oldData),
      new_data: JSON.stringify(newData),
      status: 'PENDING'
    });

    await notificationRepository.create({
      roleTarget: 'CEO',
      title: 'Stock Update Approval',
      message: `Pending record update for ${drug.name}`,
      type: 'pharmacy',
      link: '/ceo/pharmacy-hub?tab=updates',
      reference_id: reqId
    });

    await trx.commit();

    // Emit real-time socket event so CEO bell updates instantly
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('pharmacy-transfer', {
          title: 'Stock Update Approval',
          message: `Pending record update for ${drug.name}`,
          type: 'pharmacy',
          link: '/ceo/pharmacy-hub?tab=updates'
        });
      }
    } catch (_) {}

    res.json({ success: true, message: 'Update submitted for CEO approval', status: 'PENDING' });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// STOCK UPDATE APPROVALS
// ================================================================

exports.getPendingUpdateRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('stock_update_requests')
      .join('drugs', 'stock_update_requests.drug_id', 'drugs.id')
      .select('stock_update_requests.*', 'drugs.name as drug_name');
    
    if (status && status !== 'All') {
      query = query.where('stock_update_requests.status', status.toUpperCase());
    }

    const rows = await query.orderBy('stock_update_requests.created_at', 'desc');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.approveUpdateRequest = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const reqData = await trx('stock_update_requests').where('id', id).first();
    if (!reqData) { await trx.rollback(); return res.status(404).json({ success: false, message: 'Not found' }); }
    if (reqData.status !== 'PENDING') { await trx.rollback(); return res.status(400).json({ success: false, message: 'Not pending' }); }

    let newData = reqData.new_data;
    if (typeof newData === 'string') newData = JSON.parse(newData);

    const invUpd = {};
    if (newData.quantity !== undefined) invUpd.quantity = newData.quantity;
    if (newData.min_level !== undefined) invUpd.min_level = newData.min_level;
    if (newData.max_level !== undefined) invUpd.max_level = newData.max_level;
    if (newData.batch_no !== undefined) invUpd.batch_no = newData.batch_no;
    if (newData.expiry_date !== undefined) invUpd.expiry_date = newData.expiry_date;
    if (newData.near_expiry_days !== undefined) invUpd.near_expiry_days = newData.near_expiry_days;
    if (newData.unit_cost !== undefined) invUpd.unit_cost = newData.unit_cost;
    if (newData.storage_location !== undefined) invUpd.storage_location = newData.storage_location;
    if (Object.keys(invUpd).length > 0) {
      await trx('store_inventory').where('id', reqData.inventory_id).update(invUpd);
    }

    const drugUpd = {};
    if (newData.drug_name !== undefined) drugUpd.name = newData.drug_name;
    if (newData.strength !== undefined) drugUpd.strength = newData.strength;
    if (newData.unit !== undefined) drugUpd.unit = newData.unit;
    if (newData.unit_price !== undefined) drugUpd.unit_price = newData.unit_price;
    if (newData.category !== undefined) drugUpd.category = newData.category;
    if (newData.classification !== undefined) drugUpd.classification = newData.classification;
    if (newData.therapeutic_use !== undefined) drugUpd.therapeutic_use = newData.therapeutic_use;
    if (newData.requires_prescription !== undefined) drugUpd.requires_prescription = newData.requires_prescription;
    if (Object.keys(drugUpd).length > 0) {
      await trx('drugs').where('id', reqData.drug_id).update(drugUpd);
    }

    await trx('stock_update_requests').where('id', id).update({
      status: 'APPROVED', approved_by: req.user?.id, approved_at: new Date()
    });

    await notificationRepository.create({
      roleTarget: 'Pharmacy Manager',
      title: 'Update Approved',
      message: `Your update for ${drugUpd.name || 'a drug'} was approved.`,
      type: 'pharmacy',
      link: '/pharmacy/stock'
    });

    await trx.commit();
    res.json({ success: true, message: 'Update approved and applied' });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.rejectUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reason required' });

    const reqData = await db('stock_update_requests').where('id', id).first();
    if (!reqData) return res.status(404).json({ success: false, message: 'Not found' });

    await db('stock_update_requests').where('id', id).update({
      status: 'REJECTED', rejection_reason: reason
    });

    await notificationRepository.create({
      roleTarget: 'Pharmacy Manager',
      title: 'Update Rejected',
      message: `Update rejected: ${reason}`,
      type: 'pharmacy',
      link: '/pharmacy/stock'
    });

    res.json({ success: true, message: 'Update rejected' });
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
          last_received_at: db.raw('LOCALTIMESTAMP')
        });
      } else {
        await trx('store_inventory').insert({
          drug_id: item.drug_id, quantity: item.quantity,
          batch_no: item.batch_no, expiry_date: item.expiry_date,
          unit_cost: item.unit_cost, storage_location: item.storage_location,
          last_received_at: db.raw('LOCALTIMESTAMP')
        });
      }
    }
    await trx.commit();

    // ── Central Audit Log ──
    await audit.captureLegacy('STORE_GOODS_RECEIVED', req.user?.id, {
      module: 'Pharmacy Store',
      recordIdentifier: receipt_no,
      afterState: { receipt_no, supplier_name, items, remarks },
      ip: req.ip,
    });

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
    const rows = await db('stock_receipts').whereRaw('(created_at)::date = CURRENT_DATE').orderBy('created_at', 'desc');
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
    const { issue_no, department, issued_to, requisition_ref, approval_ref, issue_date, remarks, items, transfer_request_id } = req.body;
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
        last_issued_at: db.raw('LOCALTIMESTAMP')
      });
    }

    if (transfer_request_id) {
      const tr = await trx('transfer_requests').where({ id: transfer_request_id }).first();
      if (tr) {
        const totalShipped = items.reduce((sum, item) => sum + Number(item.quantity), 0);
        await trx('transfer_requests').where({ id: transfer_request_id }).update({
          status: 'SHIPPED',
          shipped_by: req.user?.id,
          shipped_qty: totalShipped,
          shipped_at: new Date(),
          updated_at: new Date()
        });

        const notificationService = require('../../services/notification.service');
        try {
          await notificationService.sendNotification('Pharmacy Manager', tr.created_by, {
            type: 'REQUEST_SHIPPED',
            title: '📦 Shipment Ready — Confirm Receipt',
            message: `Store has shipped ${totalShipped} units of your request ${tr.request_code}. Please go to Transfer Requests and click "Receive Stock".`,
            related_entity_id: transfer_request_id,
            link: `/pharmacy/store-inventory?tab=my_requests`
          });
        } catch (notifyErr) {
          console.warn('[createIssue] Notification failed (non-fatal):', notifyErr.message);
        }
      }
    }

    await trx.commit();

    // ── Central Audit Log ──
    await audit.captureLegacy('STORE_ISSUE_TO_DEPT', req.user?.id, {
      module: 'Pharmacy Store',
      department: department || 'Unknown',
      recordIdentifier: issue_no,
      afterState: { issue_no, department, issued_to, items, remarks },
      ip: req.ip,
    });

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
    const rows = await db('stock_issues').whereRaw('(created_at)::date = CURRENT_DATE').orderBy('created_at', 'desc');
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

    // ── Central Audit Log ──
    await audit.captureLegacy('STORE_MOVEMENT_TRANSFER', req.user?.id, {
      module: 'Pharmacy Store',
      recordIdentifier: transfer_no,
      afterState: { transfer_no, from_location, to_location, transfer_type, items, remarks },
      ip: req.ip,
    });

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
  const trx = await db.transaction();
  try {
    const {
      name, strength, unit, unit_price, category, classification,
      therapeutic_use, requires_prescription,
      batch_no, expiry_date, near_expiry_days,
      initial_quantity, min_level, max_level, storage_location
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'Drug name is required' });
    }
    if (!batch_no || !batch_no.trim()) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'Batch No is required for full traceability' });
    }
    if (!expiry_date) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'Expiry Date is required for batch tracking' });
    }
    if (!initial_quantity || Number(initial_quantity) <= 0) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'Initial quantity must be greater than 0' });
    }

    // 1. Insert the drug into the drugs catalog
    const [drugId] = await trx('drugs').insert({
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

    // 2. Always create an inventory row with the correct batch_no and expiry_date
    const qty = Number(initial_quantity);
    await trx('store_inventory').insert({
      drug_id:          drugId,
      quantity:         qty,
      batch_no:         batch_no.trim(),
      expiry_date:      expiry_date,
      near_expiry_days: near_expiry_days ? Number(near_expiry_days) : 90,
      unit_cost:        unit_price || 0,
      min_level:        min_level ? Number(min_level) : 0,
      max_level:        max_level ? Number(max_level) : 0,
      storage_location: storage_location || null,
      last_received_at: trx.fn.now(),
    });

    // 3. Record initial receipt for stock movement / audit trail
    const receipt_no = `INIT-${drugId}-${Date.now()}`;
    const [receipt_id] = await trx('stock_receipts').insert({
      receipt_no,
      supplier_name:  'Initial Registration',
      receipt_date:   trx.fn.now(),
      remarks:        `Opening stock registration for ${name.trim()} — Batch ${batch_no.trim()}`,
      received_by:    req.user?.id || null,
    });
    await trx('stock_receipt_items').insert({
      receipt_id,
      drug_id:          drugId,
      batch_no:         batch_no.trim(),
      expiry_date:      expiry_date,
      near_expiry_days: near_expiry_days ? Number(near_expiry_days) : 90,
      quantity:         qty,
      unit_cost:        unit_price || 0,
      subtotal:         qty * (unit_price || 0),
      storage_location: storage_location || null,
    });

    await trx.commit();

    const drug = await db('drugs').where('id', drugId).first();

    // ── Central Audit Log ──
    await audit.captureLegacy('STORE_NEW_ITEM_REGISTERED', req.user?.id, {
      module: 'Pharmacy Store',
      recordIdentifier: `drug-${drugId}`,
      afterState: { name: name.trim(), batch_no: batch_no.trim(), initial_quantity: qty, category, unit },
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `New stock item "${name.trim()}" registered with Batch No ${batch_no.trim()}`,
      data: drug
    });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

// STOCK ADJUSTMENTS
// ================================================================

exports.getNextAdjustmentNo = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `ADJ-${year}-`;
    const last = await db('stock_adjustments')
      .where('adjustment_no', 'like', `${prefix}%`)
      .orderBy('id', 'desc')
      .first();
    let nextSeq = 1;
    if (last && last.adjustment_no) {
      const parts = last.adjustment_no.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextSeq = num + 1;
    }
    const adjustment_no = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    res.json({ success: true, adjustment_no });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createAdjustment = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { adjustment_no, reason, remarks, adjustment_date, items } = req.body;

    // ── New format: items array from the form ──
    if (Array.isArray(items) && items.length > 0) {
      if (!adjustment_no) {
        await trx.rollback();
        return res.status(400).json({ success: false, message: 'adjustment_no is required' });
      }
      if (!reason) {
        await trx.rollback();
        return res.status(400).json({ success: false, message: 'reason is required' });
      }
      for (const item of items) {
        const { drug_id, batch_no, adjustment_type = 'ADD', quantity } = item;
        if (!drug_id || !quantity) {
          await trx.rollback();
          return res.status(400).json({ success: false, message: 'Each item must have drug_id and quantity' });
        }
        const inv = await trx('store_inventory').where('drug_id', drug_id).first();
        const qty_before = inv ? Number(inv.quantity) : 0;
        const adj_qty = adjustment_type === 'REMOVE' ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));
        const qty_after = Math.max(0, qty_before + adj_qty);
        await trx('stock_adjustments').insert({
          adjustment_no,
          drug_id,
          batch_no: batch_no || (inv ? inv.batch_no : null),
          adjustment_type,
          reason,
          quantity_before: qty_before,
          quantity_after: qty_after,
          adjustment_qty: adj_qty,
          adjustment_date: adjustment_date || new Date(),
          adjusted_by: req.user?.id,
          status: 'PENDING'
        });
      }
      await trx.commit();
      return res.status(201).json({ success: true, message: 'Adjustment submitted for CEO approval', status: 'PENDING' });
    }

    // ── Legacy single-item format ──
    const { drug_id, batch_no, adjustment_type, adjustment_qty, approval_code } = req.body;
    if (!adjustment_no || !drug_id || adjustment_qty === undefined) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'adjustment_no, drug_id, adjustment_qty required' });
    }
    const inv = await trx('store_inventory').where('drug_id', drug_id).first();
    const qty_before = inv ? Number(inv.quantity) : 0;
    const qty_after = Math.max(0, qty_before + Number(adjustment_qty));
    await trx('stock_adjustments').insert({
      adjustment_no, drug_id, batch_no, adjustment_type, reason,
      quantity_before: qty_before, quantity_after: qty_after,
      adjustment_qty: Number(adjustment_qty), approval_code,
      adjustment_date: adjustment_date || new Date(),
      adjusted_by: req.user?.id,
      status: 'PENDING'
    });
    await trx.commit();
    res.status(201).json({ success: true, message: 'Adjustment submitted for CEO approval', status: 'PENDING' });
  } catch (e) {
    await trx.rollback();
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
    const { status } = req.query;
    let query = db('stock_adjustments as sa')
      .join('drugs', 'sa.drug_id', 'drugs.id')
      .leftJoin('users as u', 'sa.approved_by', 'u.id')
      .leftJoin('users as ab', 'sa.adjusted_by', 'ab.id')
      .select(
        'sa.*',
        'drugs.name as drug_name', 'drugs.strength', 'drugs.unit',
        db.raw('u.full_name as approved_by_name'),
        db.raw('ab.full_name as adjusted_by_name')
      );
    
    if (status && status !== 'All') {
      query = query.where('sa.status', status.toUpperCase());
    }

    const rows = await query.orderBy('sa.created_at', 'desc');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};



exports.getAllAdjustments = async (req, res) => {
  try {
    const rows = await db('stock_adjustments as sa')
      .join('drugs', 'sa.drug_id', 'drugs.id')
      .leftJoin('users as u', 'sa.approved_by', 'u.id')
      .select(
        'sa.*',
        'drugs.name as drug_name', 'drugs.strength', 'drugs.unit',
        db.raw('u.full_name as approved_by_name')
      )
      .orderBy('sa.created_at', 'desc');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};



exports.approveAdjustment = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const refAdj = await trx('stock_adjustments').where('id', id).first();
    if (!refAdj) {
      await trx.rollback();
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    const allLines = await trx('stock_adjustments').where('adjustment_no', refAdj.adjustment_no);
    const pendingLines = allLines.filter(a => a.status === 'PENDING');
    
    if (pendingLines.length === 0) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'No pending lines found for this adjustment' });
    }

    for (const adj of pendingLines) {
      await trx('stock_adjustments').where('id', adj.id).update({
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
    }

    await trx.commit();

    // ── Central Audit Log ──
    await audit.captureLegacy('STORE_ADJUSTMENT_APPROVED', req.user?.id, {
      module: 'Pharmacy Store',
      recordIdentifier: refAdj.adjustment_no,
      afterState: { adjustment_no: refAdj.adjustment_no, lines_approved: pendingLines.length },
      ip: req.ip,
    });

    res.json({ success: true, message: 'Adjustment group approved and applied' });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.rejectAdjustment = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const refAdj = await trx('stock_adjustments').where('id', id).first();
    if (!refAdj) {
      await trx.rollback();
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    await trx('stock_adjustments')
      .where('adjustment_no', refAdj.adjustment_no)
      .where('status', 'PENDING')
      .update({
        status: 'REJECTED',
        rejection_reason: reason.trim(),
        approved_by: req.user?.id,
        approved_at: new Date()
      });

    await trx.commit();
    res.json({ success: true, message: 'Adjustment group rejected' });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

// ================================================================
// PHYSICAL COUNTS
// ================================================================

exports.getNextCountNo = async (req, res) => {
  try {
    const last = await db('stock_counts').orderBy('id', 'desc').first();
    let num = 1;
    const year = new Date().getFullYear();
    if (last && last.count_no && last.count_no.startsWith(`PC-${year}-`)) {
      const parts = last.count_no.split('-');
      if (parts.length === 3) {
        num = parseInt(parts[2], 10) + 1;
      }
    }
    res.json({ success: true, count_no: `PC-${year}-${String(num).padStart(4, '0')}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getPendingCounts = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('stock_counts as sc')
      .leftJoin('users as u', 'sc.verified_by', 'u.id')
      .select('sc.*', db.raw('u.full_name as approved_by_name'));
    
    if (status && status !== 'All') {
      query = query.where('sc.status', status.toUpperCase());
    }

    const rows = await query.orderBy('sc.created_at', 'desc');
    for (const r of rows) {
      r.items = await db('stock_count_items')
        .join('drugs', 'stock_count_items.drug_id', 'drugs.id')
        .select('stock_count_items.*', 'drugs.name as drug_name', 'drugs.strength', 'drugs.unit')
        .where('stock_count_items.count_id', r.id);
    }
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};



exports.createCount = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { count_no, count_type, count_date, remarks, items } = req.body;
    if (!count_no || !items || !items.length) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'count_no and items required' });
    }
    const [count_id] = await trx('stock_counts').insert({
      count_no, count_type, count_date: count_date || new Date(),
      remarks, counted_by: req.user?.id, status: 'PENDING'
    });
    for (const item of items) {
      const inv = await trx('store_inventory').where('drug_id', item.drug_id).first();
      const system_qty = inv ? Number(inv.quantity) : 0;
      const phys_qty = Number(item.physical_quantity);
      await trx('stock_count_items').insert({
        count_id, drug_id: item.drug_id, batch_no: item.batch_no,
        system_quantity: system_qty, physical_quantity: phys_qty,
        variance: phys_qty - system_qty, reason_code: item.reason_code
      });
    }
    await trx.commit();
    res.status(201).json({ success: true, message: 'Count created and pending CEO approval', data: { id: count_id } });
  } catch (e) {
    await trx.rollback();
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
    row.items = await db('stock_count_items')
        .join('drugs', 'stock_count_items.drug_id', 'drugs.id')
        .select('stock_count_items.*', 'drugs.name as drug_name', 'drugs.strength', 'drugs.unit')
        .where('stock_count_items.count_id', row.id);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.approveCount = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const refCount = await trx('stock_counts').where('id', id).first();
    if (!refCount) {
      await trx.rollback();
      return res.status(404).json({ success: false, message: 'Count not found' });
    }
    if (refCount.status !== 'PENDING') {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'Count is not pending' });
    }

    // Apply adjustments for all items with a variance
    const items = await trx('stock_count_items').where('count_id', refCount.id);
    for (const item of items) {
      if (item.variance !== 0) {
        const inv = await trx('store_inventory').where('drug_id', item.drug_id).first();
        if (inv) {
          await trx('store_inventory').where('id', inv.id).update({ quantity: item.physical_quantity });
        } else {
          await trx('store_inventory').insert({ drug_id: item.drug_id, quantity: item.physical_quantity, batch_no: item.batch_no });
        }
      }
    }

    await trx('stock_counts').where('id', id).update({
      status: 'APPROVED',
      verified_by: req.user?.id,
      updated_at: new Date()
    });

    await trx.commit();
    res.json({ success: true, message: 'Physical count approved and inventory updated' });
  } catch (e) {
    await trx.rollback();
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.rejectCount = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const refCount = await trx('stock_counts').where('id', id).first();
    if (!refCount) {
      await trx.rollback();
      return res.status(404).json({ success: false, message: 'Count not found' });
    }

    await trx('stock_counts').where('id', id).update({
      status: 'REJECTED',
      remarks: (refCount.remarks ? refCount.remarks + '. ' : '') + 'Rejected: ' + reason.trim(),
      updated_at: new Date(),
      verified_by: req.user?.id
    });

    await trx.commit();
    res.json({ success: true, message: 'Physical count rejected' });
  } catch (e) {
    await trx.rollback();
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
    if (status && status !== 'All') query = query.where('status', status);
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
      .whereRaw('(created_at)::date = CURRENT_DATE').count('id as count').first();
    const todayIssues = await db('stock_issues')
      .whereRaw('(created_at)::date = CURRENT_DATE').count('id as count').first();
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
    const { limit, type, period } = req.query;

    // Build date filter
    let dateFrom = null;
    const now = new Date();
    if (period === 'week') {
      dateFrom = new Date(now); dateFrom.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      dateFrom = new Date(now); dateFrom.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      dateFrom = new Date(now); dateFrom.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      dateFrom = new Date(now); dateFrom.setFullYear(now.getFullYear() - 1);
    }
    const applyDate = (q, col) => dateFrom ? q.where(col, '>=', dateFrom.toISOString().split('T')[0]) : q;

    const shouldInclude = (t) => !type || type === 'ALL' || type === t;

    const receipts = shouldInclude('RECEIPT') ? await applyDate(
      db('stock_receipts')
        .join('stock_receipt_items', 'stock_receipts.id', 'stock_receipt_items.receipt_id')
        .join('drugs', 'stock_receipt_items.drug_id', 'drugs.id')
        .leftJoin('users', 'stock_receipts.received_by', 'users.id')
        .select(
          db.raw("'RECEIPT' as movement_type"),
          'stock_receipt_items.id as id',
          'stock_receipts.receipt_no as reference_no',
          'drugs.name as drug_name',
          'drugs.strength',
          'stock_receipt_items.quantity as quantity_in',
          db.raw('NULL as quantity_out'),
          'drugs.unit',
          db.raw("COALESCE(users.full_name, 'Store') as performed_by"),
          'stock_receipt_items.batch_no',
          'stock_receipts.remarks',
          'stock_receipts.created_at'
        ), 'stock_receipts.receipt_date') : [];

    const issues = shouldInclude('ISSUE') ? await applyDate(
      db('stock_issues')
        .join('stock_issue_items', 'stock_issues.id', 'stock_issue_items.issue_id')
        .join('drugs', 'stock_issue_items.drug_id', 'drugs.id')
        .leftJoin('users', 'stock_issues.issued_by', 'users.id')
        .select(
          db.raw("'ISSUE' as movement_type"),
          'stock_issue_items.id as id',
          'stock_issues.issue_no as reference_no',
          'drugs.name as drug_name',
          'drugs.strength',
          db.raw('NULL as quantity_in'),
          'stock_issue_items.quantity as quantity_out',
          'drugs.unit',
          db.raw("COALESCE(users.full_name, stock_issues.issued_to, 'Store') as performed_by"),
          'stock_issue_items.batch_no',
          db.raw('(COALESCE(stock_issues.department, \'\')::text || CASE WHEN (stock_issues.department IS NOT NULL AND stock_issues.remarks IS NOT NULL) THEN (\' - \') ELSE (\'\') END::text || COALESCE(stock_issues.remarks, \'\')::text) as remarks'),
          'stock_issues.created_at'
        ), 'stock_issues.issue_date') : [];

    const adjustments = shouldInclude('ADJUSTMENT') ? await applyDate(
      db('stock_adjustments')
        .join('drugs', 'stock_adjustments.drug_id', 'drugs.id')
        .leftJoin('users', 'stock_adjustments.adjusted_by', 'users.id')
        .select(
          db.raw("'ADJUSTMENT' as movement_type"),
          'stock_adjustments.id',
          'stock_adjustments.adjustment_no as reference_no',
          'drugs.name as drug_name',
          'drugs.strength',
          db.raw('CASE WHEN (stock_adjustments.adjustment_type = \'ADD\') THEN (stock_adjustments.adjustment_qty) ELSE (NULL) END as quantity_in'),
          db.raw('CASE WHEN (stock_adjustments.adjustment_type != \'ADD\') THEN (stock_adjustments.adjustment_qty) ELSE (NULL) END as quantity_out'),
          'drugs.unit',
          db.raw("COALESCE(users.full_name, 'Admin') as performed_by"),
          'stock_adjustments.batch_no',
          'stock_adjustments.reason as remarks',
          'stock_adjustments.created_at'
        ), 'stock_adjustments.adjustment_date') : [];

    const counts = shouldInclude('COUNT') ? await applyDate(
      db('stock_counts')
        .join('stock_count_items', 'stock_counts.id', 'stock_count_items.count_id')
        .join('drugs', 'stock_count_items.drug_id', 'drugs.id')
        .leftJoin('users', 'stock_counts.counted_by', 'users.id')
        .where('stock_counts.status', 'APPROVED')
        .whereRaw('stock_count_items.variance != 0')
        .select(
          db.raw("'COUNT' as movement_type"),
          'stock_count_items.id as id',
          'stock_counts.count_no as reference_no',
          'drugs.name as drug_name',
          'drugs.strength',
          db.raw('CASE WHEN (stock_count_items.variance > 0) THEN (stock_count_items.variance) ELSE (NULL) END as quantity_in'),
          db.raw('CASE WHEN (stock_count_items.variance < 0) THEN (ABS(stock_count_items.variance)) ELSE (NULL) END as quantity_out'),
          'drugs.unit',
          db.raw("COALESCE(users.full_name, 'Counter') as performed_by"),
          'stock_count_items.batch_no',
          'stock_counts.remarks',
          'stock_counts.created_at'
        ), 'stock_counts.count_date') : [];

    const all = [...receipts, ...issues, ...adjustments, ...counts]
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
