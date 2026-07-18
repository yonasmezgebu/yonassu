const { db, transaction } = require('../../config/database');
const notificationService = require('../../services/notification.service');

// Helper: check if user has a role (req.user.roles is an array)
const hasRole = (req, ...roles) => {
  const userRoles = req.user.roles || [];
  return roles.some(r => userRoles.includes(r));
};

// Helper for audit logs
const logAudit = async (trx, req, resource, resourceId, action, beforeState, afterState) => {
  try {
    await trx('audit_logs').insert({
      user_id: req.user.id,
      action,
      resource,
      resource_id: resourceId,
      ip_address: req.ip || '127.0.0.1',
      before_state: beforeState ? JSON.stringify(beforeState) : null,
      after_state: afterState ? JSON.stringify(afterState) : null,
    });
  } catch (e) {
    console.warn('[transfer] audit log failed (non-fatal):', e.message);
  }
};

const generateRequestCode = () => `PR-${Math.floor(1000 + Math.random() * 9000)}-${Date.now()}`;

exports.createRequest = async (req, res) => {
  const { drug_id, requested_qty, urgency, signature } = req.body;
  const userId = req.user.id;

  if (!hasRole(req, 'Pharmacy Manager', 'Admin')) {
    return res.status(403).json({ error: 'Only Pharmacy Manager can create requests' });
  }

  if (!requested_qty || requested_qty <= 0) {
    return res.status(400).json({ error: 'Requested quantity must be greater than 0' });
  }

  try {
    await transaction(async (trx) => {
      // 1. Check existing open requests for this drug
      const existing = await trx('transfer_requests')
        .where('drug_id', drug_id)
        .whereIn('status', ['PENDING_APPROVAL', 'APPROVED', 'SHIPPED'])
        .first();

      if (existing) {
        throw new Error('An open request already exists for this drug');
      }

      // 2. Get current quantities
      const storeItem = await trx('store_inventory').where('drug_id', drug_id).first();
      const pharmacyItem = await trx('pharmacy_inventory').where('drug_id', drug_id).first();

      const storeQty = storeItem ? storeItem.quantity : 0;
      const pharmacyQty = pharmacyItem ? pharmacyItem.quantity : 0;

      // 3. Create request
      const [newId] = await trx('transfer_requests').insert({
        request_code: generateRequestCode(),
        drug_id,
        requested_qty,
        pharmacy_qty_at_request: pharmacyQty,
        store_qty_at_request: storeQty,
        urgency: urgency || 'MEDIUM',
        status: 'PENDING_APPROVAL',
        created_by: userId,
        signature: signature || null
      });

      const newRequest = await trx('transfer_requests').where('id', newId).first();

      // 4. Audit Log
      await logAudit(trx, req, 'transfer_requests', newId, 'CREATE', null, newRequest);

      // 5. Notify CEO (best-effort — do not fail the transaction if notification fails)
      try {
        await notificationService.sendNotification('CEO', null, {
          type: 'REQUEST_CREATED',
          title: 'New Transfer Request',
          message: `Pharmacy requested ${requested_qty} units for drug ID ${drug_id}`,
          related_entity_id: newId,
          link: `/ceo/flow1-transfers`
        });
      } catch (notifyErr) {
        console.warn('[transfer] Notification failed (non-fatal):', notifyErr.message);
      }

      res.status(201).json({
        status: 'success',
        data: newRequest
      });
    });
  } catch (error) {
    console.error('Create Request Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.getRequests = async (req, res) => {
  const { status, drug_id } = req.query;
  const userRoles = req.user.roles || [];

  try {
    let query = db('transfer_requests')
      .join('drugs', 'transfer_requests.drug_id', 'drugs.id')
      .select('transfer_requests.*', 'drugs.name as drug_name');

    if (status) query = query.where('transfer_requests.status', status);
    if (drug_id) query = query.where('transfer_requests.drug_id', drug_id);

    // Pharmacy Store Keeper only sees requests that concern them
    if ((userRoles.includes('Pharmacy Store Keeper') || userRoles.includes('General Store Keeper')) && !userRoles.includes('Admin') && !userRoles.includes('CEO')) {
      query = query.whereIn('transfer_requests.status', ['APPROVED', 'SHIPPED', 'COMPLETED', 'DISCREPANCY']);
    }

    // Pharmacy Manager only sees their own requests
    if (userRoles.includes('Pharmacy Manager') && !userRoles.includes('Admin') && !userRoles.includes('CEO')) {
      query = query.where('transfer_requests.created_by', req.user.id);
    }

    const requests = await query.orderBy('transfer_requests.created_at', 'desc');
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await db('transfer_requests')
      .join('drugs', 'transfer_requests.drug_id', 'drugs.id')
      .where('transfer_requests.id', req.params.id)
      .select('transfer_requests.*', 'drugs.name as drug_name', 'drugs.unit_price')
      .first();

    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Fetch live store and pharmacy qty to display alongside frozen snapshot
    const storeItem = await db('store_inventory').where('drug_id', request.drug_id).first();
    const pharmacyItem = await db('pharmacy_inventory').where('drug_id', request.drug_id).first();

    request.live_store_qty = storeItem ? storeItem.quantity : 0;
    request.live_pharmacy_qty = pharmacyItem ? pharmacyItem.quantity : 0;

    res.json({ data: request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.decideRequest = async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body;
  const userId = req.user.id;

  if (!hasRole(req, 'CEO', 'Admin')) {
    return res.status(403).json({ error: 'Only CEO can decide on transfer requests' });
  }

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be APPROVED or REJECTED' });
  }

  if (decision === 'REJECTED' && !reason) {
    return res.status(400).json({ error: 'Rejection requires a reason' });
  }

  try {
    await transaction(async (trx) => {
      const request = await trx('transfer_requests').where({ id }).first();
      if (!request) throw new Error('Request not found');
      if (!['PENDING_APPROVAL', 'DISCREPANCY'].includes(request.status)) {
        throw new Error('Can only decide on PENDING_APPROVAL or DISCREPANCY requests');
      }

      const updates = {
        status: decision,
        decided_by: userId,
        decision_reason: reason || null,
        updated_at: new Date()
      };

      await trx('transfer_requests').where({ id }).update(updates);
      const updatedRequest = await trx('transfer_requests').where({ id }).first();

      await logAudit(trx, req, 'transfer_requests', id, `DECISION_${decision}`, request, updatedRequest);

      try {
        if (decision === 'APPROVED') {
          await notificationService.sendNotification('Pharmacy Store Keeper', null, {
            type: 'REQUEST_APPROVED',
            title: 'Transfer Approved',
            message: `Request ${request.request_code} approved. Ready to ship.`,
            related_entity_id: id,
            link: `/store/transfers/${id}`
          });
        } else {
          await notificationService.sendNotification('Pharmacy Manager', request.created_by, {
            type: 'REQUEST_REJECTED',
            title: 'Transfer Rejected',
            message: `Request ${request.request_code} was rejected. Reason: ${reason}`,
            related_entity_id: id,
            link: `/pharmacy/store-inventory`
          });
        }
      } catch (notifyErr) {
        console.warn('[transfer] Notification failed (non-fatal):', notifyErr.message);
      }

      res.json({ message: 'Decision saved', data: updatedRequest });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.shipRequest = async (req, res) => {
  const { id } = req.params;
  const { shipped_qty } = req.body;
  const userId = req.user.id;

  if (!hasRole(req, 'Pharmacy Store Keeper', 'General Store Keeper', 'Admin')) {
    return res.status(403).json({ error: 'Only Store Keepers can ship requests' });
  }

  if (!shipped_qty || shipped_qty <= 0) {
    return res.status(400).json({ error: 'Shipped quantity must be greater than 0' });
  }

  try {
    await transaction(async (trx) => {
      const request = await trx('transfer_requests').where({ id }).first();
      if (!request) throw new Error('Request not found');
      if (request.status !== 'APPROVED') throw new Error('Request must be APPROVED before shipping');

      // Deduct from store_inventory
      const storeItem = await trx('store_inventory').where('drug_id', request.drug_id).first();
      if (!storeItem || storeItem.quantity < shipped_qty) {
        throw new Error(`Not enough stock in Store. Available: ${storeItem ? storeItem.quantity : 0}`);
      }

      await trx('store_inventory').where('drug_id', request.drug_id).decrement('quantity', shipped_qty);

      const updates = {
        status: 'SHIPPED',
        shipped_by: userId,
        shipped_qty,
        shipped_at: new Date(),
        updated_at: new Date()
      };

      await trx('transfer_requests').where({ id }).update(updates);
      const updatedRequest = await trx('transfer_requests').where({ id }).first();

      await logAudit(trx, req, 'transfer_requests', id, 'SHIP', request, updatedRequest);

      try {
        await notificationService.sendNotification('Pharmacy Manager', request.created_by, {
          type: 'REQUEST_SHIPPED',
          title: '📦 Shipment Ready — Confirm Receipt',
          message: `Store has shipped ${shipped_qty} units of your request ${request.request_code}. Please go to Transfer Requests and click "Receive Stock".`,
          related_entity_id: id,
          link: `/pharmacy/store-inventory?tab=my_requests`
        });
      } catch (notifyErr) {
        console.warn('[transfer] Notification failed (non-fatal):', notifyErr.message);
      }

      res.json({ message: 'Shipped successfully', data: updatedRequest });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.receiveRequest = async (req, res) => {
  const { id } = req.params;
  const { received_qty } = req.body;
  const userId = req.user.id;

  if (!hasRole(req, 'Pharmacy Manager', 'Pharmacy Worker', 'Admin')) {
    return res.status(403).json({ error: 'Only Pharmacy staff can receive shipments' });
  }

  if (received_qty === undefined || received_qty === null || received_qty < 0) {
    return res.status(400).json({ error: 'Received quantity must be 0 or greater' });
  }

  try {
    await transaction(async (trx) => {
      const request = await trx('transfer_requests').where({ id }).first();
      if (!request) throw new Error('Request not found');
      if (request.status !== 'SHIPPED') throw new Error('Request must be in SHIPPED status to receive');

      const isMatch = Number(received_qty) === Number(request.shipped_qty);
      const newStatus = isMatch ? 'COMPLETED' : 'DISCREPANCY';

      let decisionReason = null;
      if (!isMatch) {
        decisionReason = `DISCREPANCY: Received ${received_qty} but shipped ${request.shipped_qty}. Requires CEO review.`;
      }

      const updates = {
        status: newStatus,
        received_by: userId,
        received_qty,
        received_at: new Date(),
        updated_at: new Date()
      };

      if (!isMatch) updates.decision_reason = decisionReason;

      await trx('transfer_requests').where({ id }).update(updates);

      // Only add to pharmacy inventory if quantities match exactly
      if (isMatch) {
        const pharmacyItem = await trx('pharmacy_inventory').where('drug_id', request.drug_id).first();
        if (pharmacyItem) {
          await trx('pharmacy_inventory').where('drug_id', request.drug_id).increment('quantity', received_qty);
        } else {
          await trx('pharmacy_inventory').insert({ drug_id: request.drug_id, quantity: received_qty });
        }
        
        // Also update pharmacy_medications (the medicine table) so it appears in pharmacy stock immediately
        const drug = await trx('drugs').where('id', request.drug_id).first();
        if (drug) {
          const pmItem = await trx('pharmacy_medications').where('name', drug.name).first();
          if (pmItem) {
            await trx('pharmacy_medications').where('id', pmItem.id).increment('stock_quantity', received_qty);
          } else {
            await trx('pharmacy_medications').insert({
              name: drug.name,
              generic_name: drug.generic_name || drug.name,
              price: drug.unit_price || 0,
              price_unit: drug.unit || 'unit',
              stock_quantity: received_qty,
              is_active: true,
              is_hidden: true, // Hidden from public until published via Health Publisher
              created_at: new Date(),
              updated_at: new Date()
            });
          }
        }
      }

      const updatedRequest = await trx('transfer_requests').where({ id }).first();
      await logAudit(trx, req, 'transfer_requests', id, 'RECEIVE', request, updatedRequest);

      try {
        if (isMatch) {
          await notificationService.sendNotification('CEO', null, {
            type: 'REQUEST_COMPLETED',
            title: 'Transfer Completed',
            message: `Request ${request.request_code} successfully received by Pharmacy. ${received_qty} units added to Pharmacy stock.`,
            related_entity_id: id,
            link: `/ceo/flow1-transfers`
          });
          await notificationService.sendNotification('Pharmacy Store Keeper', request.shipped_by, {
            type: 'REQUEST_COMPLETED',
            title: 'Transfer Confirmed',
            message: `Pharmacy confirmed receipt of ${received_qty} units from ${request.request_code}.`,
            related_entity_id: id,
            link: `/store/inventory`
          });
        } else {
          await notificationService.sendNotification('CEO', null, {
            type: 'REQUEST_DISCREPANCY',
            title: '⚠️ Transfer Discrepancy',
            message: `Discrepancy in ${request.request_code}: Received ${received_qty} but shipped ${request.shipped_qty}. Requires manual review.`,
            related_entity_id: id,
            link: `/ceo/flow1-transfers`
          });
        }
      } catch (notifyErr) {
        console.warn('[transfer] Notification failed (non-fatal):', notifyErr.message);
      }

      res.json({
        message: isMatch ? 'Stock received and added to Pharmacy inventory' : 'Discrepancy flagged for CEO review',
        data: updatedRequest
      });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.cancelRequest = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await transaction(async (trx) => {
      const request = await trx('transfer_requests').where({ id }).first();
      if (!request) throw new Error('Request not found');
      if (request.status !== 'PENDING_APPROVAL') {
        throw new Error('Only PENDING_APPROVAL requests can be cancelled');
      }
      // Only creator or Admin can cancel
      const isAdmin = hasRole(req, 'Admin', 'CEO');
      if (request.created_by !== userId && !isAdmin) {
        throw new Error('You can only cancel your own requests');
      }

      await trx('transfer_requests').where({ id }).update({
        status: 'CANCELLED',
        updated_at: new Date()
      });
      const updatedRequest = await trx('transfer_requests').where({ id }).first();

      await logAudit(trx, req, 'transfer_requests', id, 'CANCEL', request, updatedRequest);

      res.json({ message: 'Request cancelled', data: updatedRequest });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.savePushSubscription = async (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription) return res.status(400).json({ error: 'Missing data' });

  try {
    const existing = await db('push_subscriptions').where({
      user_id: userId,
      endpoint: subscription.endpoint
    }).first();

    if (!existing) {
      await db('push_subscriptions').insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth
      });
    }
    res.json({ message: 'Subscription saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
