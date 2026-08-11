const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { audit } = require('../../config/logger');
const notificationRepository = require('../../repositories/notification.repository');
const logPharmacyAction = require('../../utils/pharmacyAuditLogger');

const generateRequestNumber = async () => {
  const last = await db('pharmacy_transfer_requests').orderBy('id', 'desc').first();
  const num = last ? parseInt(last.request_number.split('-')[1]) + 1 : 1;
  return `PR-${String(num).padStart(3, '0')}`;
};

const getDrugStockData = async (drugId) => {
  const pharmacyProduct = await db('pharmacy_medications').where('id', drugId).first();
  if (!pharmacyProduct) throw new AppError('Drug not found in pharmacy catalog', 404);
  const storeProduct = await db('products').where('name', pharmacyProduct.name).first();
  return { pharmacyProduct, storeProduct };
};

const emitNotification = async (io, { roleTarget, userId, title, message, type, link }) => {
  try {
    await notificationRepository.create({ roleTarget, userId, title, message, type, link, data: JSON.stringify({ type }) });
  } catch (e) { console.error('Notify create fail:', e.message); }
  try {
    if (io) io.emit('pharmacy-transfer', { title, message, type, link });
  } catch (e) { /* socket may not be available */ }
};

const pharmacyTransferController = {
  create: async (req, res) => {
    const { drugId, quantityRequested, urgency, notes } = req.body;
    const userId = req.user.id;
    if (!drugId || !quantityRequested) throw new AppError('Drug and quantity are required', 400);
    const { pharmacyProduct, storeProduct } = await getDrugStockData(drugId);
    const pharmacyStock = pharmacyProduct.stock_quantity || 0;
    const storeStock = storeProduct ? (storeProduct.stock_quantity || 0) : 0;
    const reorderLevel = pharmacyProduct.reorder_level || pharmacyProduct.minimum_stock || 0;
    if (quantityRequested > storeStock) throw new AppError(`Only ${storeStock} units available in store`, 400);
    const requestNumber = await generateRequestNumber();
    const [id] = await db('pharmacy_transfer_requests').insert({
      request_number: requestNumber,
      drug_id: drugId,
      drug_name: pharmacyProduct.name,
      quantity_requested: quantityRequested,
      urgency: urgency || 'MEDIUM',
      status: 'PENDING',
      store_qty_before: storeStock,
      pharmacy_qty_before: pharmacyStock,
      pharmacy_reorder_level: reorderLevel,
      store_unit_price: storeProduct ? storeProduct.unit_price : 0,
      pharmacy_unit_price: pharmacyProduct.unit_price || 0,
      notes: notes || null,
      created_by: userId,
      created_at: db.fn.now()
    });
    await audit('PHARMACY_TRANSFER_CREATED', userId, { details: { requestNumber, drugId, quantityRequested } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'CEO',
      title: 'New Pharmacy Transfer Request',
      message: `${pharmacyProduct.name} — ${quantityRequested} units need CEO approval`,
      type: 'pharmacy_transfer',
      link: `/ceo/pharmacy-transfers/${id}`
    });
    const transfer = await db('pharmacy_transfer_requests').where('id', id).first();
    logPharmacyAction(req, 'Transfer Created', requestNumber, null, transfer, 'Pharmacy Store');
    res.status(201).json({ status: 'success', data: transfer });
  },

  list: async (req, res) => {
    const { status } = req.query;
    const user = req.user;
    let query = db('pharmacy_transfer_requests as ptr')
      .leftJoin('users as cu', 'ptr.created_by', 'cu.id')
      .leftJoin('users as au', 'ptr.approved_by', 'au.id')
      .select('ptr.*', 'cu.full_name as created_by_name', 'au.full_name as approved_by_name')
      .orderBy('ptr.created_at', 'desc');
    if (status) query = query.where('ptr.status', status);
    if (user.roles.includes('Pharmacy Manager') || user.roles.includes('Pharmacy Worker')) {
      query = query.where('ptr.created_by', user.id);
    }
    const rows = await query;
    res.json({ status: 'success', data: rows });
  },

  getById: async (req, res) => {
    const { id } = req.params;
    const transfer = await db('pharmacy_transfer_requests as ptr')
      .leftJoin('users as cu', 'ptr.created_by', 'cu.id')
      .leftJoin('users as au', 'ptr.approved_by', 'au.id')
      .leftJoin('users as su', 'ptr.shipped_by', 'su.id')
      .leftJoin('users as ru', 'ptr.received_by', 'ru.id')
      .select('ptr.*',
        'cu.full_name as created_by_name',
        'au.full_name as approved_by_name',
        'su.full_name as shipped_by_name',
        'ru.full_name as received_by_name')
      .where('ptr.id', id)
      .first();
    if (!transfer) throw new AppError('Transfer request not found', 404);
    const { pharmacyProduct, storeProduct } = await getDrugStockData(transfer.drug_id);
    res.json({
      status: 'success',
      data: {
        ...transfer,
        current_pharmacy_stock: pharmacyProduct.stock_quantity || 0,
        current_store_stock: storeProduct ? storeProduct.stock_quantity : 0,
        drug_details: pharmacyProduct,
        store_drug_details: storeProduct
      }
    });
  },

  approve: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const transfer = await db('pharmacy_transfer_requests').where('id', id).first();
    if (!transfer) throw new AppError('Transfer request not found', 404);
    if (transfer.status !== 'PENDING') throw new AppError('Request is not in PENDING status', 400);
    await db('pharmacy_transfer_requests').where('id', id).update({
      status: 'APPROVED',
      approved_by: userId,
      updated_at: db.fn.now()
    });
    await audit('PHARMACY_TRANSFER_APPROVED', userId, { details: { requestNumber: transfer.request_number, id } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'Pharmacy Store Keeper',
      title: 'Pharmacy Transfer Approved',
      message: `${transfer.drug_name} — Ship ${transfer.quantity_requested} units to Pharmacy`,
      type: 'pharmacy_transfer',
      link: `/store/pharmacy-shipments/${id}`
    });
    logPharmacyAction(req, 'Transfer Approved', transfer.request_number, { status: 'PENDING' }, { status: 'APPROVED' }, 'Pharmacy Store');
    res.json({ status: 'success', message: 'Request approved' });
  },

  reject: async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    if (!reason) throw new AppError('Rejection reason is required', 400);
    const transfer = await db('pharmacy_transfer_requests').where('id', id).first();
    if (!transfer) throw new AppError('Transfer request not found', 404);
    if (transfer.status !== 'PENDING') throw new AppError('Request is not in PENDING status', 400);
    await db('pharmacy_transfer_requests').where('id', id).update({
      status: 'REJECTED',
      rejected_by: userId,
      rejection_reason: reason,
      updated_at: db.fn.now()
    });
    await audit('PHARMACY_TRANSFER_REJECTED', userId, { details: { requestNumber: transfer.request_number, id, reason } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'Pharmacy Manager',
      title: 'Pharmacy Transfer Rejected',
      message: `${transfer.drug_name} — ${reason}`,
      type: 'pharmacy_transfer',
      link: `/pharmacy/transfers/${id}`
    });
    logPharmacyAction(req, 'Transfer Rejected', transfer.request_number, { status: 'PENDING' }, { status: 'REJECTED', reason }, 'Pharmacy Store');
    res.json({ status: 'success', message: 'Request rejected' });
  },

  ship: async (req, res) => {
    const { id } = req.params;
    const { quantityShipped, shipmentNumber } = req.body;
    const userId = req.user.id;
    const transfer = await db('pharmacy_transfer_requests').where('id', id).first();
    if (!transfer) throw new AppError('Transfer request not found', 404);
    if (transfer.status !== 'APPROVED') throw new AppError('Request must be approved before shipping', 400);
    const qty = quantityShipped || transfer.quantity_requested;
    if (qty <= 0) throw new AppError('Invalid quantity', 400);
    const storeProduct = await db('products').where('name', transfer.drug_name).first();
    if (storeProduct) {
      const newStock = (storeProduct.stock_quantity || 0) - qty;
      if (newStock < 0) throw new AppError(`Insufficient store stock. Available: ${storeProduct.stock_quantity}`, 400);
      await db('products').where('id', storeProduct.id).update({ stock_quantity: newStock, updated_at: db.fn.now() });
    }
    const shipNum = shipmentNumber || `SH-${String(transfer.id).padStart(3, '0')}`;
    await db('pharmacy_transfer_requests').where('id', id).update({
      status: 'SHIPPED',
      shipped_by: userId,
      quantity_shipped: qty,
      shipment_number: shipNum,
      shipped_at: db.fn.now(),
      updated_at: db.fn.now()
    });
    await audit('PHARMACY_TRANSFER_SHIPPED', userId, { details: { requestNumber: transfer.request_number, id, qty, shipNum } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'Pharmacy Manager',
      title: 'Shipment Dispatched',
      message: `${qty} units of ${transfer.drug_name} — Shipment #${shipNum}`,
      type: 'pharmacy_transfer',
      link: `/pharmacy/receive-shipments/${id}`
    });
    logPharmacyAction(req, 'Transfer Shipped', transfer.request_number, { status: 'APPROVED' }, { status: 'SHIPPED', quantity_shipped: qty, shipment_number: shipNum }, 'Pharmacy Store');
    res.json({ status: 'success', message: 'Shipment dispatched' });
  },

  receive: async (req, res) => {
    const { id } = req.params;
    const { quantityReceived } = req.body;
    const userId = req.user.id;
    const transfer = await db('pharmacy_transfer_requests').where('id', id).first();
    if (!transfer) throw new AppError('Transfer request not found', 404);
    if (transfer.status !== 'SHIPPED') throw new AppError('Request must be shipped before receiving', 400);
    const qty = parseInt(quantityReceived) || transfer.quantity_shipped || transfer.quantity_requested;
    if (qty <= 0) throw new AppError('Invalid quantity', 400);
    const pharmacyProduct = await db('pharmacy_medications').where('id', transfer.drug_id).first();
    if (pharmacyProduct) {
      const newStock = (pharmacyProduct.stock_quantity || 0) + qty;
      await db('pharmacy_medications').where('id', pharmacyProduct.id).update({
        stock_quantity: newStock,
        updated_at: db.fn.now()
      });
    }
    await db('pharmacy_transfer_requests').where('id', id).update({
      status: 'COMPLETED',
      received_by: userId,
      quantity_received: qty,
      received_at: db.fn.now(),
      updated_at: db.fn.now()
    });
    await audit('PHARMACY_TRANSFER_COMPLETED', userId, { details: { requestNumber: transfer.request_number, id } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'CEO',
      title: 'Pharmacy Transfer Completed',
      message: `${transfer.drug_name} — Pharmacy stock updated (received ${transfer.quantity_shipped} units)`,
      type: 'pharmacy_transfer',
      link: `/ceo/pharmacy-transfers/${id}`
    });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'Pharmacy Store Keeper',
      title: 'Pharmacy Transfer Completed',
      message: `${transfer.drug_name} — Pharmacy confirmed receipt of ${transfer.quantity_shipped} units`,
      type: 'pharmacy_transfer',
      link: `/store/pharmacy-shipments/${id}`
    });
    logPharmacyAction(req, 'Transfer Received', transfer.request_number, { status: 'SHIPPED' }, { status: 'COMPLETED', quantity_received: qty }, 'Pharmacy Store');
    res.json({ status: 'success', message: 'Shipment received and stock updated' });
  }
};

// ═══════════════════════════════════════════════════════════════
// Branch-to-Branch Transfer
// ═══════════════════════════════════════════════════════════════
pharmacyTransferController.branchToBranch = async (req, res) => {
  const { from_branch_id, to_branch_id, drug_id, quantity } = req.body;
  const userId = req.user.id;
  if (!from_branch_id || !to_branch_id || !drug_id || !quantity) {
    return res.status(400).json({ status: 'error', message: 'from_branch_id, to_branch_id, drug_id, and quantity are required' });
  }
  if (from_branch_id === to_branch_id) {
    return res.status(400).json({ status: 'error', message: 'Source and destination branches must be different' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ status: 'error', message: 'Quantity must be positive' });
  }

  try {
    // Check stock before creating request
    const sourceItem = await db('pharmacy_inventory')
      .where({ branch_id: from_branch_id, drug_id })
      .first();
    if (!sourceItem || sourceItem.quantity < quantity) {
      const available = sourceItem ? sourceItem.quantity : 0;
      return res.status(400).json({ status: 'error', message: `Insufficient stock in source branch. Available: ${available}, Requested: ${quantity}` });
    }

    const drug = await db('pharmacy_medications').where('id', drug_id).first();
    const [requestId] = await db('transfer_requests').insert({
      request_code: `BB-${String(Date.now()).slice(-8)}`,
      drug_id,
      requested_qty: quantity,
      pharmacy_qty_at_request: sourceItem.quantity,
      store_qty_at_request: 0,
      status: 'PENDING_APPROVAL',
      created_by: userId,
      transfer_no: `BB-${Date.now()}`,
      from_branch_id,
      to_branch_id,
      requested_by: userId,
      requested_date: new Date(),
    });

    await audit('BRANCH_TRANSFER_REQUEST', userId, {
      resource: 'transfer_requests',
      resourceId: requestId,
      module: 'Pharmacy',
      beforeState: null,
      afterState: { from_branch_id, to_branch_id, drug_id, quantity, status: 'PENDING_APPROVAL' }
    });
    if (req.res) req.res.locals.__centralAudited = true;

    res.status(201).json({
      status: 'success',
      message: `${quantity} units of ${drug ? drug.name : 'drug'} transfer request created. Awaiting CEO approval.`,
      data: { id: requestId, from_branch_id, to_branch_id, drug_id, quantity, status: 'PENDING_APPROVAL' }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// CEO approve a branch transfer
pharmacyTransferController.ceoApproveTransfer = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const request = await db('transfer_requests').where('id', id).where('status', 'PENDING_APPROVAL').first();
    if (!request) return res.status(404).json({ status: 'error', message: 'Pending transfer request not found' });

    const { from_branch_id, to_branch_id, drug_id, requested_qty } = request;

    await db.transaction(async (trx) => {
      const sourceItem = await trx('pharmacy_inventory')
        .where({ branch_id: from_branch_id, drug_id })
        .first();
      if (!sourceItem || sourceItem.quantity < requested_qty) {
        throw new AppError('Insufficient stock in source branch at time of approval', 400);
      }

      await trx('pharmacy_inventory')
        .where({ branch_id: from_branch_id, drug_id })
        .decrement('quantity', requested_qty);

      const destItem = await trx('pharmacy_inventory')
        .where({ branch_id: to_branch_id, drug_id })
        .first();
      if (destItem) {
        await trx('pharmacy_inventory')
          .where({ branch_id: to_branch_id, drug_id })
          .increment('quantity', requested_qty);
      } else {
        await trx('pharmacy_inventory').insert({
          branch_id: to_branch_id,
          drug_id,
          quantity: requested_qty,
          reorder_level: sourceItem.reorder_level || 0,
        });
      }

      await trx('transfer_requests').where('id', id).update({
        status: 'COMPLETED',
        ceo_approved_by: userId,
        approved_by: userId,
        decision_date: new Date(),
        received_date: new Date(),
      });
    });

    await audit('BRANCH_TRANSFER_APPROVED', userId, {
      resource: 'transfer_requests',
      resourceId: id,
      module: 'Pharmacy',
      beforeState: { status: 'PENDING_APPROVAL' },
      afterState: { status: 'COMPLETED', approved_by: userId }
    });
    if (req.res) req.res.locals.__centralAudited = true;

    res.json({ status: 'success', message: 'Transfer approved and executed' });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ status: 'error', message: error.message });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// CEO reject a branch transfer
pharmacyTransferController.ceoRejectTransfer = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  try {
    const request = await db('transfer_requests').where('id', id).where('status', 'PENDING_APPROVAL').first();
    if (!request) return res.status(404).json({ status: 'error', message: 'Pending transfer request not found' });

    await db('transfer_requests').where('id', id).update({
      status: 'REJECTED',
      ceo_approved_by: userId,
      decision_reason: reason || 'Rejected by CEO',
      decision_date: new Date(),
    });

    await audit('BRANCH_TRANSFER_REJECTED', userId, {
      resource: 'transfer_requests',
      resourceId: id,
      module: 'Pharmacy',
      beforeState: { status: 'PENDING_APPROVAL' },
      afterState: { status: 'REJECTED', reason }
    });
    if (req.res) req.res.locals.__centralAudited = true;

    res.json({ status: 'success', message: 'Transfer rejected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// List pending branch transfers (for CEO approval dashboard)
pharmacyTransferController.listPendingApprovals = async (req, res) => {
  try {
    const rows = await db('transfer_requests as tr')
      .join('drugs as d', 'tr.drug_id', 'd.id')
      .leftJoin('branches as fb', 'tr.from_branch_id', 'fb.id')
      .leftJoin('branches as tb', 'tr.to_branch_id', 'tb.id')
      .leftJoin('users as u', 'tr.requested_by', 'u.id')
      .select(
        'tr.id', 'tr.transfer_no', 'tr.requested_qty', 'tr.status',
        'tr.requested_date', 'tr.decision_date', 'tr.decision_reason',
        'd.name as drug_name', 'd.drug_code',
        'fb.name as from_branch', 'tb.name as to_branch',
        'u.full_name as requested_by_name'
      )
      .whereIn('tr.status', ['PENDING_APPROVAL'])
      .orderBy('tr.requested_date', 'asc');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get stock summary — all drugs with total stock across all branches
pharmacyTransferController.getStockSummary = async (req, res) => {
  try {
    const rows = await db('pharmacy_medications as pm')
      .select(
        'pm.id', 'pm.name', 'pm.generic_name', 'pm.price as unit_price',
        'pm.stock_quantity as total_stock',
        'pm.reorder_level'
      )
      .orderBy('pm.name');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get inventory by branch
pharmacyTransferController.getBranchInventory = async (req, res) => {
  const { branch_id } = req.params;
  try {
    const rows = await db('pharmacy_inventory as pi')
      .join('pharmacy_medications as pm', 'pi.drug_id', 'pm.id')
      .leftJoin('branches as b', 'pi.branch_id', 'b.id')
      .select(
        'pi.id', 'pi.drug_id', 'pi.quantity', 'pi.batch_no',
        'pi.expiry_date', 'pi.reorder_level', 'pi.stock_status',
        'pm.name', 'pm.price as unit_price',
        'pm.generic_name',
        'b.name as branch_name'
      )
      .where('pi.branch_id', branch_id)
      .orderBy('pm.name');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// List branch transfers
pharmacyTransferController.listBranchTransfers = async (req, res) => {
  try {
    const rows = await db('transfer_requests as tr')
      .join('pharmacy_medications as pm', 'tr.drug_id', 'pm.id')
      .leftJoin('branches as fb', 'tr.from_branch_id', 'fb.id')
      .leftJoin('branches as tb', 'tr.to_branch_id', 'tb.id')
      .leftJoin('users as u', 'tr.requested_by', 'u.id')
      .select(
        'tr.id', 'tr.transfer_no', 'tr.requested_qty', 'tr.status',
        'tr.requested_date', 'tr.received_date',
        'pm.name as drug_name',
        'fb.name as from_branch', 'tb.name as to_branch',
        'u.full_name as requested_by_name'
      )
      .whereNotNull('tr.from_branch_id')
      .orWhereNotNull('tr.to_branch_id')
      .orderBy('tr.requested_date', 'desc');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Branch Drug Assignment CRUD
// ═══════════════════════════════════════════════════════════════

// Get all drugs from drugs table
pharmacyTransferController.getAllDrugs = async (req, res) => {
  try {
    const rows = await db('pharmacy_medications').orderBy('name');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get all drugs available for assignment (not yet in a given branch)
pharmacyTransferController.getAvailableDrugs = async (req, res) => {
  const { branch_id } = req.params;
  try {
    const assigned = await db('pharmacy_inventory').where('branch_id', branch_id).select('drug_id');
    const assignedIds = assigned.map(a => a.drug_id);
    const rows = assignedIds.length > 0
      ? await db('pharmacy_medications').whereNotIn('id', assignedIds).orderBy('name')
      : await db('pharmacy_medications').orderBy('name');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Assign a drug to a branch
pharmacyTransferController.assignDrugToBranch = async (req, res) => {
  const { branch_id, drug_id, quantity, reorder_level, batch_no, expiry_date } = req.body;
  if (!branch_id || !drug_id) return res.status(400).json({ status: 'error', message: 'branch_id and drug_id required' });
  try {
    const existing = await db('pharmacy_inventory').where({ branch_id, drug_id }).first();
    if (existing) return res.status(400).json({ status: 'error', message: 'Drug already assigned to this branch' });
    const [id] = await db('pharmacy_inventory').insert({
      branch_id, drug_id,
      quantity: quantity || 0,
      reorder_level: reorder_level || 0,
      batch_no: batch_no || null,
      expiry_date: expiry_date || null,
      last_updated_at: new Date()
    });
    const row = await db('pharmacy_inventory').where('id', id).first();
    res.status(201).json({ status: 'success', data: row });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Update pharmacy_inventory record
const ALLOWED_UPDATE_FIELDS = ['quantity', 'reorder_level', 'batch_no', 'expiry_date', 'stock_status', 'branch_id'];
pharmacyTransferController.updateBranchDrug = async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }
    updateData.last_updated_at = new Date();
    await db('pharmacy_inventory').where('id', id).update(updateData);
    const row = await db('pharmacy_inventory').where('id', id).first();
    res.json({ status: 'success', data: row });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Remove drug from branch
pharmacyTransferController.removeBranchDrug = async (req, res) => {
  const { id } = req.params;
  try {
    await db('pharmacy_inventory').where('id', id).del();
    res.json({ status: 'success', message: 'Drug removed from branch' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Upsert: set quantity for a drug+branch (create or update)
pharmacyTransferController.setBranchDrugQuantity = async (req, res) => {
  const { branch_id, drug_id, quantity, transfer_from_branch_id } = req.body;
  if (!branch_id || !drug_id) return res.status(400).json({ status: 'error', message: 'branch_id and drug_id required' });
  try {
    const qtyToAssign = parseInt(quantity) || 0;
    
    // Get total stock from medications
    const medication = await db('pharmacy_medications').where('id', drug_id).first();
    if (!medication) return res.status(404).json({ status: 'error', message: 'Drug not found' });
    const totalStock = medication.stock_quantity || 0;

    // Get current inventory across all branches
    const allStock = await db('pharmacy_inventory').where({ drug_id });
    const currentBranchStock = allStock.find(s => s.branch_id === parseInt(branch_id));
    
    // Explicit branch-to-branch direct transfer (no CEO approval required for manager direct assignment)
    if (transfer_from_branch_id) {
      const srcBranchId = parseInt(transfer_from_branch_id);
      const srcStock = allStock.find(s => s.branch_id === srcBranchId);
      if (!srcStock || srcStock.quantity < qtyToAssign) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock in source branch. Available: ${srcStock ? srcStock.quantity : 0}`
        });
      }
      
      await db.transaction(async (trx) => {
        await trx('pharmacy_inventory').where('id', srcStock.id).decrement('quantity', qtyToAssign);
        if (currentBranchStock) {
          await trx('pharmacy_inventory').where('id', currentBranchStock.id).increment('quantity', qtyToAssign);
        } else {
          await trx('pharmacy_inventory').insert({
            branch_id, drug_id,
            quantity: qtyToAssign,
            reorder_level: 0,
            batch_no: null,
            last_updated_at: new Date()
          });
        }
      });
      const row = await db('pharmacy_inventory').where({ branch_id, drug_id }).first();
      return res.status(201).json({ status: 'success', message: 'Transferred drug directly', data: row });
    }

    // Assigning from the Unassigned Pool (or updating qty directly)
    const otherBranchesStock = allStock.filter(s => s.branch_id !== parseInt(branch_id));
    const totalOtherBranches = otherBranchesStock.reduce((s, r) => s + r.quantity, 0);
    const newTotalAssigned = totalOtherBranches + qtyToAssign;
    
    if (newTotalAssigned > totalStock) {
      const availableUnassigned = totalStock - totalOtherBranches;
      return res.status(400).json({ 
        status: 'error', 
        message: `Cannot assign ${qtyToAssign}. Unassigned stock available: ${availableUnassigned > 0 ? availableUnassigned : 0} (Total: ${totalStock}, Used: ${totalOtherBranches})` 
      });
    }

    if (currentBranchStock) {
      await db('pharmacy_inventory').where('id', currentBranchStock.id).update({ quantity: qtyToAssign, last_updated_at: new Date() });
    } else {
      await db('pharmacy_inventory').insert({
        branch_id, drug_id,
        quantity: qtyToAssign,
        reorder_level: 0,
        batch_no: null,
        last_updated_at: new Date()
      });
    }
    const row = await db('pharmacy_inventory').where({ branch_id, drug_id }).first();
    return res.status(201).json({ status: 'success', message: 'Quantity assigned successfully', data: row });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Bulk assign all drugs to a branch
pharmacyTransferController.bulkAssignDrugs = async (req, res) => {
  const { branch_id, quantity } = req.body;
  if (!branch_id) return res.status(400).json({ status: 'error', message: 'branch_id required' });
  try {
    const drugs = await db('pharmacy_medications').select('id');
    if (drugs.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No drugs found in system. First add drugs via Products page, then try again.' });
    }
    const existing = await db('pharmacy_inventory').where('branch_id', branch_id).select('drug_id');
    const existingIds = new Set(existing.map(e => e.drug_id));
    const toInsert = drugs
      .filter(d => !existingIds.has(d.id))
      .map(d => ({
        branch_id,
        drug_id: d.id,
        quantity: quantity || 100,
        reorder_level: 5,
        batch_no: 'BULK-' + Date.now(),
        last_updated_at: new Date()
      }));
    if (toInsert.length === 0) return res.json({ status: 'success', message: 'All drugs already assigned to this branch', count: 0 });
    await db('pharmacy_inventory').insert(toInsert);
    res.status(201).json({ status: 'success', message: `${toInsert.length} drugs assigned to branch`, count: toInsert.length });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = pharmacyTransferController;
