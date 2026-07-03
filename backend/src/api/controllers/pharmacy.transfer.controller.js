const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { audit } = require('../../config/logger');
const notificationRepository = require('../../repositories/notification.repository');

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
      roleTarget: 'Store Manager',
      title: 'Pharmacy Transfer Approved',
      message: `${transfer.drug_name} — Ship ${transfer.quantity_requested} units to Pharmacy`,
      type: 'pharmacy_transfer',
      link: `/store/pharmacy-shipments/${id}`
    });
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
      roleTarget: 'Store Manager',
      title: 'Pharmacy Transfer Completed',
      message: `${transfer.drug_name} — Pharmacy confirmed receipt of ${transfer.quantity_shipped} units`,
      type: 'pharmacy_transfer',
      link: `/store/pharmacy-shipments/${id}`
    });
    res.json({ status: 'success', message: 'Shipment received and stock updated' });
  }
};

module.exports = pharmacyTransferController;
