const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { audit } = require('../../config/logger');
const notificationRepository = require('../../repositories/notification.repository');
const crypto = require('crypto');

const generateHash = (input) => crypto.createHash('sha256').update(input).digest('hex');

const generateStampId = () => `STAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

const STAMP_PERMISSIONS = {
  CEO: ['APPROVAL'],
  'Store Manager': ['ISSUE'],
  'Pharmacy Manager': ['GRN', 'REQUISITION'],
  Admin: ['APPROVAL', 'ISSUE', 'GRN', 'REQUISITION'],
};

const canStamp = (userRoles, documentType) => {
  return userRoles.some(r => (STAMP_PERMISSIONS[r] || []).includes(documentType));
};

const generateStamp = async (documentId, documentType, approvedBy, userName, role) => {
  const stampId = generateStampId();
  const hash = generateHash(stampId + String(documentId) + String(approvedBy));
  await db('stamps').insert({
    stamp_id: stampId, document_id: documentId, document_type: documentType,
    approved_by: approvedBy, approved_by_name: userName, role, timestamp: db.fn.now(), hash
  });
  return { stamp_id: stampId, document_id: documentId, document_type: documentType, approved_by_name: userName, role, timestamp: new Date().toISOString() };
};

const emitNotification = async (io, { roleTarget, userId, title, message, type, link }) => {
  try { await notificationRepository.create({ roleTarget, userId, title, message, type, link }); } catch (e) { console.error('Notify fail:', e.message); }
  try { if (io) io.emit('pharmacy-transfer', { title, message, type, link }); } catch (e) {}
};

const generateAprNo = async () => {
  const last = await db('approvals').orderBy('id', 'desc').first();
  const num = last ? parseInt(last.apr_no.split('-')[2]) + 1 : 1;
  return `APR-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
};

const generateIssNo = async () => {
  const last = await db('issue_vouchers').orderBy('id', 'desc').first();
  const num = last ? parseInt(last.iss_no.split('-')[2]) + 1 : 1;
  return `ISS-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
};

const generateGrnNo = async () => {
  const last = await db('grn').orderBy('id', 'desc').first();
  const num = last ? parseInt(last.grn_no.split('-')[2]) + 1 : 1;
  return `GRN-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
};

const erpController = {
  // ── Model 20: Requisition ──
  createRequisition: async (req, res) => {
    // Support both legacy single-item and new multi-item format
    const { drugId, quantityRequested, justification, unitOfMeasure, items } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.username || 'User';

    // Normalise to an items array
    let itemList = items;
    if (!itemList || !Array.isArray(itemList) || itemList.length === 0) {
      if (!drugId || !quantityRequested) throw new AppError('Drug and quantity are required', 400);
      itemList = [{ drugId, quantityRequested, unitOfMeasure: unitOfMeasure || 'Tablets' }];
    }
    if (itemList.length === 0) throw new AppError('At least one item is required', 400);

    let firstInsertedId = null;
    const drugNames = [];
    const insertRows = [];

    for (const item of itemList) {
      const pharmacyProduct = await db('pharmacy_medications').where('id', item.drugId).first();
      if (!pharmacyProduct) throw new AppError(`Drug ID ${item.drugId} not found in pharmacy catalog`, 404);

      const currentStock = pharmacyProduct.stock_quantity || 0;
      const reorderLevel = pharmacyProduct.reorder_level || pharmacyProduct.minimum_stock || 0;

      insertRows.push({
        drug_id: item.drugId,
        drug_name: pharmacyProduct.name,
        unit_of_measure: item.unitOfMeasure || 'Tablets',
        quantity_requested: item.quantityRequested,
        current_stock: currentStock,
        reorder_level: reorderLevel,
        justification: justification || null,
        requested_by: userId,
        requested_by_name: userName,
        requesting_dept: 'Pharmacy',
        status: 'PENDING'
      });
      drugNames.push(pharmacyProduct.name);
    }

    // Insert all items
    let generatedReqNo = null;
    for (let i = 0; i < insertRows.length; i++) {
      const row = insertRows[i];
      if (i === 0) {
        // First item: insert with placeholder, get ID, then generate real req_no
        const tempReqNo = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const [insertedId] = await db('requisitions').insert({ ...row, req_no: tempReqNo });
        firstInsertedId = insertedId;
        generatedReqNo = `REQ-${new Date().getFullYear()}-${String(insertedId).padStart(3, '0')}`;
        await db('requisitions').where('id', insertedId).update({ req_no: generatedReqNo });
      } else {
        await db('requisitions').insert({ ...row, req_no: generatedReqNo });
      }
    }

    await audit('REQUISITION_CREATED', userId, { details: { reqNo: generatedReqNo, itemCount: itemList.length } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'CEO', title: '📋 New Pharmacy Requisition',
      message: `${drugNames.join(', ')} — ${itemList.length} item(s) need CEO approval`,
      type: 'new', link: `/ceo/pharmacy-approvals`
    });

    res.status(201).json({ status: 'success', data: { req_no: generatedReqNo, item_count: itemList.length } });
  },

  listRequisitions: async (req, res) => {
    const { status } = req.query;
    const user = req.user;
    let query = db('requisitions').orderBy('created_at', 'desc');
    if (status) query = query.where('status', status);
    if (user.roles?.includes('Pharmacy Manager') || user.roles?.includes('Pharmacy Worker')) {
      query = query.where('requested_by', user.id);
    }
    const rows = await query;

    // Enrich with store & pharmacy pricing
    const enriched = await Promise.all(rows.map(async (r) => {
      const storeDrug = await db('products').where('name', r.drug_name).first();
      const drug = await db('pharmacy_medications').where('id', r.drug_id).first();
      return {
        ...r,
        store_unit_price: storeDrug?.unit_price || 0,
        current_store_stock: storeDrug?.stock_quantity || 0,
        pharmacy_unit_price: drug?.price || 0,
        current_pharmacy_stock: drug?.stock_quantity || 0,
      };
    }));

    // Group by req_no
    const grouped = {};
    for (const row of enriched) {
      if (!grouped[row.req_no]) {
        grouped[row.req_no] = {
          req_no: row.req_no,
          id: row.id, // first item id, used for single-item compat
          status: row.status,
          requested_by: row.requested_by,
          requested_by_name: row.requested_by_name,
          requesting_dept: row.requesting_dept,
          justification: row.justification,
          created_at: row.created_at,
          items: []
        };
      }
      grouped[row.req_no].items.push(row);
    }
    res.json({ status: 'success', data: Object.values(grouped) });
  },

  getRequisition: async (req, res) => {
    const { id } = req.params;
    // Try to find by id first
    const r = await db('requisitions').where('id', id).first();
    if (!r) throw new AppError('Requisition not found', 404);

    // Fetch all items sharing the same req_no
    const allItems = await db('requisitions').where('req_no', r.req_no).orderBy('id', 'asc');

    // Enrich each item with store/pharmacy inventory data
    const enrichedItems = await Promise.all(allItems.map(async (item) => {
      const drug = await db('pharmacy_medications').where('id', item.drug_id).first();
      const storeDrug = await db('products').where('name', item.drug_name).first();
      return {
        ...item,
        current_pharmacy_stock: drug?.stock_quantity || 0,
        pharmacy_unit_price: drug?.price || storeDrug?.unit_price || 0,
        current_store_stock: storeDrug?.stock_quantity || 0,
        store_unit_price: storeDrug?.unit_price || 0,
      };
    }));

    const approval = await db('approvals').where('req_no', r.req_no).first();
    res.json({ status: 'success', data: {
      ...r,
      items: enrichedItems,
      current_pharmacy_stock: enrichedItems[0]?.current_pharmacy_stock || 0,
      current_store_stock: enrichedItems[0]?.current_store_stock || 0,
      store_unit_price: enrichedItems[0]?.store_unit_price || 0,
      approval
    }});
  },

  // ── Model 21: Approval ──
  listApprovals: async (req, res) => {
    const { status } = req.query;
    let query = db('approvals as a').leftJoin('users as u', 'a.approved_by', 'u.id').select('a.*', 'u.full_name as approved_by_name').orderBy('a.created_at', 'desc');
    if (status) {
      if (status === 'PENDING') query = query.where('a.decision', 'PENDING');
      else query = query.where('a.decision', status);
    }
    const rows = await query;
    res.json({ status: 'success', data: rows });
  },

  getApproval: async (req, res) => {
    const { id } = req.params;
    const a = await db('approvals as ap').leftJoin('users as u', 'ap.approved_by', 'u.id').select('ap.*', 'u.full_name as approved_by_name').where('ap.id', id).first();
    if (!a) throw new AppError('Approval not found', 404);
    const r = await db('requisitions').where('id', a.requisition_id).first();
    const drug = await db('pharmacy_medications').where('id', a.drug_id).first();
    const storeDrug = await db('products').where('name', a.drug_name).first();
    const stamp = await db('stamps').where({ document_id: id, document_type: 'APPROVAL' }).first();
    res.json({ status: 'success', data: { ...a, requisition: r, current_pharmacy_stock: drug?.stock_quantity || 0, current_store_stock: storeDrug?.stock_quantity || 0, store_unit_price: storeDrug?.unit_price || 0, stamp } });
  },

  approveRequisition: async (req, res) => {
    const { id } = req.params;
    // Support both single id (legacy) and req_no batch approval
    const { quantityApproved, rejectionReason, approvedQuantities } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.username || 'CEO';
    const userRoles = req.user.roles || [];

    const requisition = await db('requisitions').where('id', id).first();
    if (!requisition) throw new AppError('Requisition not found', 404);

    // Fetch all items in the same req_no group
    const allItems = await db('requisitions').where('req_no', requisition.req_no).where('status', 'PENDING');
    if (allItems.length === 0) throw new AppError('Requisition group is not pending', 400);

    const decision = rejectionReason ? 'REJECTED' : 'APPROVED';

    let stampData = null;
    if (decision === 'APPROVED') {
      if (!canStamp(userRoles, 'APPROVAL')) throw new AppError('You do not have stamp permission for approvals', 403);
      stampData = await generateStamp(id, 'APPROVAL', userId, userName, userRoles.find(r => STAMP_PERMISSIONS[r]?.includes('APPROVAL')) || 'CEO');
    }

    const aprNo = await generateAprNo();
    let firstAprId = null;

    for (const item of allItems) {
      // Per-item qty override if provided, else use item's requested qty
      const qtyApproved = decision === 'REJECTED' ? 0 :
        (approvedQuantities?.[item.id] || item.quantity_requested);

      const [aprId] = await db('approvals').insert({
        apr_no: aprNo,
        requisition_id: item.id,
        req_no: item.req_no,
        drug_id: item.drug_id,
        drug_name: item.drug_name,
        quantity_requested: item.quantity_requested,
        quantity_approved: qtyApproved,
        decision,
        rejection_reason: rejectionReason || null,
        approved_by: userId,
        approved_by_name: userName,
        stamp_id: stampData?.stamp_id || null,
        approved_at: db.fn.now()
      });
      if (!firstAprId) firstAprId = aprId;

      await db('requisitions').where('id', item.id).update({
        status: decision,
        rejection_reason: rejectionReason || null,
        updated_at: db.fn.now()
      });
    }

    await audit('REQUISITION_' + decision, userId, { details: { reqNo: requisition.req_no, itemCount: allItems.length, rejectionReason } });

    if (decision === 'APPROVED') {
      emitNotification(req.app?.get('io'), {
        roleTarget: 'Store Manager', title: '✅ Requisition Approved',
        message: `${allItems.length} item(s) from Pharmacy — Req ${requisition.req_no}`,
        type: 'approved', link: `/store/issue-notes/create/${firstAprId}`
      });
    } else {
      emitNotification(req.app?.get('io'), {
        roleTarget: 'Pharmacy Manager', userId: requisition.requested_by, title: '❌ Requisition Rejected',
        message: `Req ${requisition.req_no} — ${rejectionReason}`,
        type: 'rejected', link: `/pharmacy/requisitions/${id}`
      });
    }

    res.status(201).json({ status: 'success', data: { id: firstAprId, apr_no: aprNo, decision, stamp: stampData } });
  },

  // ── Model 22: Issue Note ──
  listIssueVouchers: async (req, res) => {
    const { status } = req.query;
    let query = db('issue_vouchers as iv').leftJoin('users as u', 'iv.issued_by', 'u.id').select('iv.*', 'u.full_name as issued_by_name').orderBy('iv.created_at', 'desc');
    if (status) query = query.where('iv.status', status);
    const rows = await query;
    res.json({ status: 'success', data: rows });
  },

  getIssueVoucher: async (req, res) => {
    const { id } = req.params;
    const iv = await db('issue_vouchers as iv').leftJoin('users as u', 'iv.issued_by', 'u.id').select('iv.*', 'u.full_name as issued_by_name').where('iv.id', id).first();
    if (!iv) throw new AppError('Issue voucher not found', 404);
    const approval = await db('approvals').where('id', iv.approval_id).first();
    const stamp = await db('stamps').where({ document_id: id, document_type: 'ISSUE' }).first();
    res.json({ status: 'success', data: { ...iv, approval, stamp } });
  },

  createIssueVoucher: async (req, res) => {
    const { approvalId } = req.params;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.username || 'Store Manager';

    const approval = await db('approvals').where('id', approvalId).first();
    if (!approval) throw new AppError('Approval not found', 404);
    if (approval.decision !== 'APPROVED') throw new AppError('Approval has not been granted', 400);

    const existing = await db('issue_vouchers').where('approval_id', approvalId).first();
    if (existing) return res.json({ status: 'success', data: existing, message: 'Issue voucher already exists' });

    const storeDrug = await db('products').where('name', approval.drug_name).first();
    const storeStockBefore = storeDrug?.stock_quantity || 0;

    const issNo = await generateIssNo();
    const [id] = await db('issue_vouchers').insert({
      iss_no: issNo, approval_id: approvalId, apr_no: approval.apr_no,
      requisition_id: approval.requisition_id, req_no: approval.req_no,
      drug_id: approval.drug_id, drug_name: approval.drug_name,
      quantity_approved: approval.quantity_approved, quantity_issued: 0,
      store_stock_before: storeStockBefore, store_stock_after: storeStockBefore,
      status: 'DRAFT', created_at: db.fn.now()
    });

    // Mark old "approved" notification as read for Store Manager
    try { await notificationRepository.markByLink(`/store/issue-notes/create/${approvalId}`); } catch (e) {}

    const voucher = await db('issue_vouchers').where('id', id).first();
    res.status(201).json({ status: 'success', data: voucher });
  },

  issueItems: async (req, res) => {
    const { id } = req.params;
    const { quantityIssued, batchNumber, expiryDate } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.username || 'Store Manager';
    const userRoles = req.user.roles || [];

    const voucher = await db('issue_vouchers').where('id', id).first();
    if (!voucher) throw new AppError('Issue voucher not found', 404);
    if (voucher.status !== 'DRAFT') throw new AppError('Voucher is not in DRAFT status', 400);
    if (!quantityIssued || quantityIssued < 1) throw new AppError('Issue quantity is required', 400);
    if (quantityIssued > voucher.quantity_approved) throw new AppError(`Cannot issue more than approved quantity (${voucher.quantity_approved})`, 400);

    const storeDrug = await db('products').where('name', voucher.drug_name).first();
    if (!storeDrug) throw new AppError('Drug not found in store inventory', 404);

    const storeStockBefore = storeDrug.stock_quantity || 0;
    if (quantityIssued > storeStockBefore) throw new AppError(`Insufficient store stock. Available: ${storeStockBefore}`, 400);
    const storeStockAfter = storeStockBefore - quantityIssued;

    if (!canStamp(userRoles, 'ISSUE')) throw new AppError('You do not have stamp permission for issue notes', 403);
    const stampData = await generateStamp(id, 'ISSUE', userId, userName, userRoles.find(r => STAMP_PERMISSIONS[r]?.includes('ISSUE')) || 'Store Manager');

    await db('products').where('id', storeDrug.id).update({ stock_quantity: storeStockAfter, updated_at: db.fn.now() });
    await db('issue_vouchers').where('id', id).update({
      quantity_issued: quantityIssued, batch_number: batchNumber || null,
      expiry_date: expiryDate || null, store_stock_before: storeStockBefore,
      store_stock_after: storeStockAfter, status: 'ISSUED',
      issued_by: userId, issued_by_name: userName,
      stamp_id: stampData.stamp_id, issued_at: db.fn.now(), updated_at: db.fn.now()
    });

    // Auto-create GRN draft
    const pharmacyDrug = await db('pharmacy_medications').where('name', voucher.drug_name).first();
    const pharmacyStockBefore = pharmacyDrug?.stock_quantity || 0;
    const grnNo = await generateGrnNo();
    const [grnId] = await db('grn').insert({
      grn_no: grnNo, issue_voucher_id: id, iss_no: voucher.iss_no,
      approval_id: voucher.approval_id, apr_no: voucher.apr_no,
      requisition_id: voucher.requisition_id, req_no: voucher.req_no,
      drug_id: voucher.drug_id, drug_name: voucher.drug_name,
      quantity_expected: quantityIssued, quantity_received: 0,
      pharmacy_stock_before: pharmacyStockBefore, pharmacy_stock_after: pharmacyStockBefore,
      status: 'PENDING', created_at: db.fn.now()
    });

    await audit('ITEMS_ISSUED', userId, { details: { issNo: voucher.iss_no, id, quantityIssued, storeStockBefore, storeStockAfter } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'Pharmacy Manager', title: '🚚 Items Dispatched',
      message: `${quantityIssued} units of ${voucher.drug_name} — Voucher #${voucher.iss_no}`,
      type: 'shipment', link: `/pharmacy/grn/${grnId}`
    });

    const updated = await db('issue_vouchers').where('id', id).first();
    res.json({ status: 'success', data: updated, stamp: stampData });
  },

  // ── Model 19: Goods Receiving Note ──
  listGRNs: async (req, res) => {
    const { status } = req.query;
    const user = req.user;
    let query = db('grn as g').leftJoin('users as u', 'g.received_by', 'u.id').select('g.*', 'u.full_name as received_by_name').orderBy('g.created_at', 'desc');
    if (status) query = query.where('g.status', status);
    if (user.roles?.includes('Pharmacy Manager') || user.roles?.includes('Pharmacy Worker')) {
      query = query.where('g.received_by', user.id).orWhere('g.status', 'PENDING');
    }
    const rows = await query;
    res.json({ status: 'success', data: rows });
  },

  getGRN: async (req, res) => {
    const { id } = req.params;
    const g = await db('grn as g').leftJoin('users as u', 'g.received_by', 'u.id').select('g.*', 'u.full_name as received_by_name').where('g.id', id).first();
    if (!g) throw new AppError('GRN not found', 404);
    const iv = await db('issue_vouchers').where('id', g.issue_voucher_id).first();
    const stamp = await db('stamps').where({ document_id: id, document_type: 'GRN' }).first();
    const pharmacyDrug = await db('pharmacy_medications').where('name', g.drug_name).first();
    res.json({ status: 'success', data: { ...g, issue_voucher: iv, stamp, current_pharmacy_stock: pharmacyDrug?.stock_quantity || 0 } });
  },

  confirmReceipt: async (req, res) => {
    const { id } = req.params;
    const { quantityReceived, condition, discrepancyNote } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.username || 'Pharmacy Manager';
    const userRoles = req.user.roles || [];

    const grn = await db('grn').where('id', id).first();
    if (!grn) throw new AppError('GRN not found', 404);
    if (grn.status !== 'PENDING') throw new AppError('GRN is already completed', 400);

    const qtyReceived = quantityReceived || grn.quantity_expected;
    if (qtyReceived < 0) throw new AppError('Invalid quantity', 400);

    const pharmacyDrug = await db('pharmacy_medications').where('name', grn.drug_name).first();
    const pharmacyStockBefore = pharmacyDrug?.stock_quantity || 0;
    const pharmacyStockAfter = pharmacyStockBefore + qtyReceived;

    if (!canStamp(userRoles, 'GRN')) throw new AppError('You do not have stamp permission for GRN', 403);
    const stampData = await generateStamp(id, 'GRN', userId, userName, userRoles.find(r => STAMP_PERMISSIONS[r]?.includes('GRN')) || 'Pharmacy Manager');

    if (pharmacyDrug) {
      await db('pharmacy_medications').where('id', pharmacyDrug.id).update({ stock_quantity: pharmacyStockAfter, updated_at: db.fn.now() });
    }

    await db('grn').where('id', id).update({
      quantity_received: qtyReceived, condition: condition || 'Good',
      discrepancy_note: discrepancyNote || (qtyReceived !== grn.quantity_expected ? `Expected ${grn.quantity_expected}, received ${qtyReceived}` : null),
      pharmacy_stock_before: pharmacyStockBefore, pharmacy_stock_after: pharmacyStockAfter,
      status: 'COMPLETED', received_by: userId, received_by_name: userName,
      stamp_id: stampData.stamp_id, received_at: db.fn.now(), updated_at: db.fn.now()
    });

    await db('issue_vouchers').where('id', grn.issue_voucher_id).update({ status: 'COMPLETED', updated_at: db.fn.now() });

    await audit('GRN_COMPLETED', userId, { details: { grnNo: grn.grn_no, id, qtyReceived, pharmacyStockBefore, pharmacyStockAfter } });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'CEO', title: '✅ Request Completed',
      message: `${grn.drug_name} — Pharmacy received ${qtyReceived} units. Stock: ${pharmacyStockAfter}`,
      type: 'completed', link: `/ceo/pharmacy-approvals/${grn.requisition_id}`
    });
    emitNotification(req.app?.get('io'), {
      roleTarget: 'Store Manager', title: '✅ Request Completed',
      message: `${grn.drug_name} — Pharmacy confirmed receipt of ${qtyReceived} units`,
      type: 'completed', link: `/store/issue-notes/${grn.issue_voucher_id}`
    });

    const updated = await db('grn').where('id', id).first();
    res.json({ status: 'success', data: updated, stamp: stampData });
  },

  // ── CEO Pending Items ──
  getCEOPending: async (req, res) => {
    // Pharmacy Requisitions (M20-M22) are disabled for CEO per user request.
    const pendingManager = await db('pharmacy_manager_requests').where('status', 'PENDING');
    const pendingTransfers = await db('transfer_requests').where('status', 'PENDING_APPROVAL');
    const pendingProcurements = await db('procurement_requests').where('status', 'PENDING_CEO_REVIEW');
    // Only show tenders and bids the CEO hasn't read yet
    const pendingTenders = await db('public_tenders').where('status', 'awaiting_ceo_approval').where('ceo_read', false);
    const recentBids = await db('public_bids').where('bid_status', 'pending').where('ceo_read', false);
    const pendingPCVs = await db('finance_pcvs').where('status', 'pending_ceo').where('ceo_read', false);
    
    const items = [];
    
    if (pendingTenders.length > 0) {
      items.push({ 
        type: 'tender_approval', 
        count: pendingTenders.length, 
        label: `${pendingTenders.length} Tender(s) Awaiting Bid Award`, 
        link: '/ceo/tenders',
        details: pendingTenders.map(t => ({ id: t.id, title: `Tender ${t.tender_number}`, subtitle: 'Pending CEO Award', link: `/ceo/tenders?viewTender=${t.id}` }))
      });
    }

    if (recentBids.length > 0) {
      items.push({
        type: 'new_bid',
        count: recentBids.length,
        label: `${recentBids.length} New Bid(s) Submitted`,
        link: '/ceo/tenders?tab=Open',
        details: recentBids.slice(0, 5).map(b => ({ id: b.id, title: `Bid from ${b.competitor_name}`, subtitle: 'Pending Evaluation', link: `/ceo/tenders?viewTender=${b.public_tender_id}` }))
      });
    }
    
    if (pendingTransfers.length > 0) {
      items.push({ 
        type: 'transfer_request', 
        count: pendingTransfers.length, 
        label: `${pendingTransfers.length} Pharmacy Transfer Request(s) Pending`, 
        link: '/ceo/flow1-transfers',
        details: pendingTransfers.map(t => ({ id: t.id, title: `Transfer ${t.tr_no}`, subtitle: 'Pending CEO Approval' }))
      });
    }
    if (pendingManager.length > 0) {
      items.push({ 
        type: 'manager_request', 
        count: pendingManager.length, 
        label: `${pendingManager.length} Manager Request(s) Pending`, 
        link: '/ceo/manager-requests',
        details: pendingManager.map(m => ({ id: m.id, title: m.drug_name || 'Manager Request', subtitle: 'Pending Approval' }))
      });
    }
    if (pendingProcurements.length > 0) {
      items.push({ 
        type: 'procurement_request', 
        count: pendingProcurements.length, 
        label: `${pendingProcurements.length} Procurement Request(s) Pending`, 
        link: '/ceo/procurement-decisions',
        details: pendingProcurements.map(p => ({ 
          id: p.id, 
          title: `PR ${p.pr_no}: ${p.drug_name}`, 
          subtitle: `${p.quantity_requested} ${p.unit_of_measure} - ${p.urgency}`,
          type: 'procurement'
        }))
      });
    }
    if (pendingPCVs.length > 0) {
      items.push({ 
        type: 'pcv_approval', 
        count: pendingPCVs.length, 
        label: `${pendingPCVs.length} Petty Cash Voucher(s) Pending`, 
        link: '/ceo/finance',
        details: pendingPCVs.map(p => ({ 
          id: p.id, 
          title: `PCV ${p.pcv_number}`, 
          subtitle: `ETB ${parseFloat(p.amount).toLocaleString()} to ${p.paid_to}`,
          type: 'pcv',
          link: '/ceo/finance'
        }))
      });
    }
    res.json({ status: 'success', data: items });
  },

  markCEORead: async (req, res) => {
    const { type, id } = req.body;
    try {
      if (type === 'tender') {
        await db('public_tenders').where('id', id).update({ ceo_read: true });
      } else if (type === 'bid') {
        await db('public_bids').where('id', id).update({ ceo_read: true });
      } else if (type === 'pcv') {
        await db('finance_pcvs').where('id', id).update({ ceo_read: true });
      } else if (type === 'tender_all') {
        // Mark all pending tenders as read
        await db('public_tenders').where('status', 'awaiting_ceo_approval').update({ ceo_read: true });
      } else if (type === 'bid_all') {
        // Mark all pending bids as read
        await db('public_bids').where('bid_status', 'pending').update({ ceo_read: true });
      }
      res.json({ status: 'success' });
    } catch (err) {
      console.error('markCEORead error', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getPurchasePendingTenders: async (req, res) => {
    try {
      const awardedTenders = await db('public_tenders')
        .where('status', 'awarded')
        .andWhere('purchase_read', false)
        .orderBy('updated_at', 'desc');
      res.json({ status: 'success', data: awardedTenders });
    } catch (err) {
      console.error('getPurchasePendingTenders error', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  markPurchaseRead: async (req, res) => {
    const { id } = req.body;
    try {
      if (id) {
        await db('public_tenders').where('id', id).update({ purchase_read: true });
      }
      res.json({ status: 'success' });
    } catch (err) {
      console.error('markPurchaseRead error', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  // ── Pending Shipments (approved approvals needing issue vouchers) ──
  getPendingShipments: async (req, res) => {
    const rows = await db('approvals as a')
      .leftJoin('issue_vouchers as iv', 'a.id', 'iv.approval_id')
      .leftJoin('requisitions as r', 'a.requisition_id', 'r.id')
      .select('a.id', 'a.apr_no', 'a.req_no', 'a.drug_name', 'a.quantity_approved', 'a.approved_at', 'a.approved_by_name',
        'r.quantity_requested', 'r.drug_id')
      .where('a.decision', 'APPROVED')
      .whereNull('iv.id')
      .orderBy('a.approved_at', 'desc');
    res.json({ status: 'success', data: rows });
  }
};

module.exports = erpController;
