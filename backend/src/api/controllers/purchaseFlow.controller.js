const { db, transaction } = require('../../config/database');
const notificationService = require('../../services/notification.service');
const { v4: uuidv4 } = require('uuid');

// ─── Helpers ────────────────────────────────────────────────────────────────
const genCode = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-5)}`;

const logAudit = async (trx, entityType, entityId, action, actorId, before, after) => {
  await trx('audit_logs').insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_id: actorId,
    before_state: before ? JSON.stringify(before) : null,
    after_state: after ? JSON.stringify(after) : null,
  });
};

// ─── 1. Create Purchase Request (Flow 2) or New Drug Request (Flow 3) ─────
exports.createRequest = async (req, res) => {
  const {
    drug_id, requested_qty, urgency,
    // Flow 3 fields
    is_new_drug, new_drug_name, new_drug_strength, new_drug_unit,
    new_drug_category, new_drug_classification, new_drug_therapeutic_use, purpose_reason,
  } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== 'Pharmacy Manager') {
    return res.status(403).json({ error: 'Only Pharmacy Manager can create purchase requests' });
  }
  if (!requested_qty || requested_qty <= 0) {
    return res.status(400).json({ error: 'A positive requested_qty is required' });
  }

  // ── FLOW 3: New Drug ────────────────────────────────────────────────────
  if (is_new_drug) {
    if (!new_drug_name || !new_drug_strength) {
      return res.status(400).json({ error: 'new_drug_name and new_drug_strength are required for new drug requests' });
    }
    if (!new_drug_category || !new_drug_classification || !new_drug_therapeutic_use) {
      return res.status(400).json({ error: 'category, classification, and therapeutic_use are required for new drug requests' });
    }
    if (!purpose_reason) {
      return res.status(400).json({ error: 'purpose_reason is mandatory for new drug requests' });
    }

    try {
      await transaction(async (trx) => {
        // Normalized duplicate check (case-insensitive name + strength)
        const duplicate = await trx('drugs')
          .whereRaw('LOWER(TRIM(name)) = ?', [new_drug_name.toLowerCase().trim()])
          .whereRaw('LOWER(TRIM(strength)) = ?', [new_drug_strength.toLowerCase().trim()])
          .first();

        if (duplicate) {
          return res.status(409).json({
            error: `Drug "${duplicate.name} ${duplicate.strength}" already exists in the system (ID: ${duplicate.id}). Use Flow 1 or Flow 2 instead.`,
            existing_drug_id: duplicate.id,
            existing_drug_status: duplicate.status,
          });
        }

        // Check for pending new drug request with same name+strength
        const existingPendingRequest = await trx('purchase_requests')
          .where('is_new_drug', true)
          .whereIn('status', ['PENDING_DECISION', 'APPROVED', 'WAIT'])
          .whereRaw('LOWER(TRIM(new_drug_name)) = ?', [new_drug_name.toLowerCase().trim()])
          .whereRaw('LOWER(TRIM(new_drug_strength)) = ?', [new_drug_strength.toLowerCase().trim()])
          .first();

        if (existingPendingRequest) {
          throw new Error(`An open new drug request for "${new_drug_name} ${new_drug_strength}" already exists (${existingPendingRequest.request_code})`);
        }

        // Create the drug entry with PENDING status
        const [drugId] = await trx('drugs').insert({
          name: new_drug_name.trim(),
          strength: new_drug_strength.trim(),
          unit: new_drug_unit || null,
          category: new_drug_category,
          classification: new_drug_classification,
          therapeutic_use: new_drug_therapeutic_use,
          status: 'PENDING',
        });

        const [newId] = await trx('purchase_requests').insert({
          request_code: genCode('PR'),
          drug_id: drugId,
          is_new_drug: true,
          scenario: 'NEW_DRUG',
          store_qty_at_request: null,
          store_min_level: null,
          pharmacy_qty_at_request: null,
          pharmacy_reorder_level: null,
          new_drug_name: new_drug_name.trim(),
          new_drug_strength: new_drug_strength.trim(),
          new_drug_category,
          new_drug_classification,
          new_drug_therapeutic_use,
          purpose_reason,
          requested_qty,
          urgency: urgency || 'MEDIUM',
          status: 'PENDING_DECISION',
          created_by: userId,
        });

        const newRequest = await trx('purchase_requests').where('id', newId).first();
        await logAudit(trx, 'purchase_requests', newId, 'CREATE_NEW_DRUG', userId, null, newRequest);

        // Notify CEO — explicitly tagged as new drug
        await notificationService.sendNotification('CEO', null, {
          type: 'NEW_DRUG_REQUEST_CREATED',
          title: '🆕 New Drug Request',
          message: `Pharmacy has requested a brand-new drug: "${new_drug_name} ${new_drug_strength}" (Request: ${newRequest.request_code}). No prior stock exists. Purpose: ${purpose_reason}`,
          related_entity_id: newId,
          link: `/ceo/purchase-flow/${newId}`,
        });

        res.status(201).json({ message: 'New drug purchase request created', data: newRequest });
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
    return;
  }

  // ── FLOW 2: Existing Drug ────────────────────────────────────────────────
  if (!drug_id) {
    return res.status(400).json({ error: 'drug_id is required for existing drug purchase requests' });
  }

  try {
    await transaction(async (trx) => {
      // Get current inventory snapshots
      const storeItem = await trx('store_inventory').where('drug_id', drug_id).first();
      const pharmacyItem = await trx('pharmacy_inventory').where('drug_id', drug_id).first();

      const storeQty = storeItem ? storeItem.quantity : 0;
      const storeMinLevel = storeItem ? storeItem.min_level : 0;
      const pharmacyQty = pharmacyItem ? pharmacyItem.quantity : 0;
      const pharmacyReorderLevel = pharmacyItem ? pharmacyItem.reorder_level : 0;

      // SRS Section 3: Flow 2 ONLY applies when store is at or below min_level
      if (storeQty > storeMinLevel) {
        return res.status(400).json({
          error: 'Store stock is not low. If only Pharmacy stock is low, use Flow 1 (Transfer Request) instead.',
          store_qty: storeQty,
          store_min_level: storeMinLevel
        });
      }

      // Check for an existing open request for this drug
      const existing = await trx('purchase_requests')
        .where('drug_id', drug_id)
        .where('is_new_drug', false)
        .whereIn('status', ['PENDING_DECISION', 'APPROVED', 'WAIT'])
        .first();

      if (existing) {
        throw new Error('An open purchase request already exists for this drug');
      }

      const scenario = (pharmacyQty <= pharmacyReorderLevel)
        ? 'STORE_AND_PHARMACY_LOW'
        : 'STORE_ONLY_LOW';

      const [newId] = await trx('purchase_requests').insert({
        request_code: genCode('PR'),
        drug_id,
        is_new_drug: false,
        scenario,
        store_qty_at_request: storeQty,
        store_min_level: storeMinLevel,
        pharmacy_qty_at_request: pharmacyQty,
        pharmacy_reorder_level: pharmacyReorderLevel,
        requested_qty,
        urgency: urgency || 'MEDIUM',
        status: 'PENDING_DECISION',
        created_by: userId,
      });

      const newRequest = await trx('purchase_requests').where('id', newId).first();
      await logAudit(trx, 'purchase_requests', newId, 'CREATE', userId, null, newRequest);

      // Notify CEO
      await notificationService.sendNotification('CEO', null, {
        type: 'PURCHASE_REQUEST_CREATED',
        title: 'New Purchase Request',
        message: `Pharmacy has submitted a purchase request (${newRequest.request_code}) for drug ID ${drug_id}. Scenario: ${scenario}.`,
        related_entity_id: newId,
        link: `/ceo/purchase-flow/${newId}`,
      });

      res.status(201).json({ message: 'Purchase request created', data: newRequest });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 2. Get All Purchase Requests (role-filtered) ─────────────────────────
exports.getRequests = async (req, res) => {
  const role = req.user.role;
  const { status, drug_id } = req.query;

  try {
    let query = db('purchase_requests')
      .leftJoin('drugs', 'purchase_requests.drug_id', 'drugs.id')
      .select('purchase_requests.*', 'drugs.name as drug_name');

    if (status) query = query.where('purchase_requests.status', status);
    if (drug_id) query = query.where('purchase_requests.drug_id', drug_id);

    // Purchase Managers and Market Team see only APPROVED or WAIT requests
    if (role === 'Purchase Manager') {
      query = query.whereIn('purchase_requests.status', ['APPROVED', 'WAIT']);
    }
    if (role === 'Market Team') {
      query = query.where('purchase_requests.status', 'WAIT');
    }

    const requests = await query.orderBy('purchase_requests.created_at', 'desc');
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── 3. CEO Decision on Purchase Request ──────────────────────────────────
exports.decideRequest = async (req, res) => {
  const { id } = req.params;
  const { decision, reason, wait_document_url, wait_instructions } = req.body;
  const userId = req.user.id;

  if (req.user.role !== 'CEO') {
    return res.status(403).json({ error: 'Only CEO can decide on purchase requests' });
  }
  if (!['APPROVE', 'REJECT', 'WAIT'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision. Must be APPROVE, REJECT, or WAIT' });
  }
  if (decision === 'REJECT' && !reason) {
    return res.status(400).json({ error: 'Rejection requires a mandatory written reason' });
  }
  if (decision === 'WAIT' && (!wait_document_url || !wait_instructions)) {
    return res.status(400).json({ error: 'WAIT requires both a document URL and written instructions' });
  }

  try {
    await transaction(async (trx) => {
      const request = await trx('purchase_requests').where({ id }).first();
      if (!request) throw new Error('Purchase request not found');
      if (request.status !== 'PENDING_DECISION') {
        throw new Error(`Cannot decide on a request in status: ${request.status}`);
      }

      const newStatus = decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'WAIT';
      const updates = {
        status: newStatus,
        decided_by: userId,
        decision,
        decision_reason: reason || null,
        wait_document_url: wait_document_url || null,
        wait_instructions: wait_instructions || null,
        updated_at: new Date(),
      };

      await trx('purchase_requests').where({ id }).update(updates);
      const updated = await trx('purchase_requests').where({ id }).first();
      await logAudit(trx, 'purchase_requests', id, `DECISION_${decision}`, userId, request, updated);

      // Flow 3: Sync drug status based on CEO decision
      if (request.is_new_drug && request.drug_id) {
        if (newStatus === 'APPROVED') {
          await trx('drugs').where({ id: request.drug_id }).update({ status: 'ACTIVE', updated_at: new Date() });
        } else if (newStatus === 'REJECTED') {
          await trx('drugs').where({ id: request.drug_id }).update({ status: 'REJECTED', updated_at: new Date() });
        }
        await logAudit(trx, 'drugs', request.drug_id, `STATUS_${newStatus}`, userId,
          { status: 'PENDING' }, { status: newStatus === 'APPROVED' ? 'ACTIVE' : 'REJECTED' });
      }

      if (newStatus === 'APPROVED') {
        const isNewDrug = request.is_new_drug;
        await notificationService.sendNotification('Purchase Manager', null, {
          type: 'PURCHASE_REQUEST_APPROVED',
          title: isNewDrug ? '🆕 New Drug Request Approved' : 'Purchase Request Approved',
          message: isNewDrug
            ? `New drug request ${request.request_code} approved. Drug is now ACTIVE. You may now create a tender.`
            : `Request ${request.request_code} approved. You may now create a tender.`,
          related_entity_id: id,
          link: `/purchase/flow/${id}`,
        });
      } else if (newStatus === 'REJECTED') {
        const isNewDrug = request.is_new_drug;
        await notificationService.sendNotification('Pharmacy Manager', request.created_by, {
          type: 'PURCHASE_REQUEST_REJECTED',
          title: isNewDrug ? '🆕 New Drug Request Rejected' : 'Purchase Request Rejected',
          message: isNewDrug
            ? `New drug request ${request.request_code} was rejected. The drug has been marked REJECTED. Reason: ${reason}`
            : `Request ${request.request_code} was rejected. Reason: ${reason}`,
          related_entity_id: id,
          link: `/pharmacy/purchase-flow/${id}`,
        });
      } else if (newStatus === 'WAIT') {
        // Create market task
        const [taskId] = await trx('market_tasks').insert({
          purchase_request_id: id,
          instructions: wait_instructions,
          document_url: wait_document_url,
          status: 'IN_PROGRESS',
        });
        await notificationService.sendNotification('Purchase Manager', null, {
          type: 'PURCHASE_REQUEST_WAIT',
          title: 'Purchase Request On Hold',
          message: `Request ${request.request_code} placed on WAIT pending market research.`,
          related_entity_id: id,
          link: `/purchase/flow/${id}`,
        });
        await notificationService.sendNotification('Market Team', null, {
          type: 'MARKET_TASK_ASSIGNED',
          title: 'Market Research Task Assigned',
          message: `CEO has assigned a market research task for purchase request ${request.request_code}.`,
          related_entity_id: taskId,
          link: `/market/tasks/${taskId}`,
        });
      }

      res.json({ message: `Decision recorded: ${decision}`, data: updated });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 4. Market Team — Complete a Task ────────────────────────────────────
exports.completeMarketTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (req.user.role !== 'Market Team') {
    return res.status(403).json({ error: 'Only Market Team can complete market tasks' });
  }

  try {
    await transaction(async (trx) => {
      const task = await trx('market_tasks').where({ id }).first();
      if (!task) throw new Error('Market task not found');
      if (task.status === 'READY_FOR_PURCHASE') throw new Error('Task is already complete');

      await trx('market_tasks').where({ id }).update({
        status: 'READY_FOR_PURCHASE',
        assigned_to: userId,
        completed_at: new Date(),
        updated_at: new Date(),
      });

      // Move the purchase_request back to APPROVED so Purchase can proceed
      await trx('purchase_requests')
        .where({ id: task.purchase_request_id })
        .update({ status: 'APPROVED', updated_at: new Date() });

      await logAudit(trx, 'market_tasks', id, 'COMPLETE', userId, task, { status: 'READY_FOR_PURCHASE' });

      await notificationService.sendNotification('Purchase Manager', null, {
        type: 'MARKET_TASK_READY',
        title: 'Market Research Ready',
        message: `Market research for purchase request ${task.purchase_request_id} is complete. You may now post a tender.`,
        related_entity_id: task.purchase_request_id,
        link: `/purchase/flow/${task.purchase_request_id}`,
      });

      res.json({ message: 'Market task marked as ready for purchase' });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 5. Get Market Tasks ──────────────────────────────────────────────────
exports.getMarketTasks = async (req, res) => {
  try {
    const tasks = await db('market_tasks')
      .join('purchase_requests', 'market_tasks.purchase_request_id', 'purchase_requests.id')
      .leftJoin('drugs', 'purchase_requests.drug_id', 'drugs.id')
      .select('market_tasks.*', 'purchase_requests.request_code', 'drugs.name as drug_name')
      .orderBy('market_tasks.created_at', 'desc');
    res.json({ data: tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── 6. Create Tender ────────────────────────────────────────────────────
exports.createTender = async (req, res) => {
  const { purchase_request_id, quantity, closing_at, terms, delivery_type } = req.body;
  const userId = req.user.id;

  if (req.user.role !== 'Purchase Manager') {
    return res.status(403).json({ error: 'Only Purchase Manager can create tenders' });
  }
  if (!purchase_request_id || !quantity || !closing_at || !delivery_type) {
    return res.status(400).json({ error: 'purchase_request_id, quantity, closing_at, and delivery_type are required' });
  }
  if (!['VIA_STORE', 'DIRECT_TO_PHARMACY'].includes(delivery_type)) {
    return res.status(400).json({ error: 'delivery_type must be VIA_STORE or DIRECT_TO_PHARMACY' });
  }
  if (new Date(closing_at) <= new Date()) {
    return res.status(400).json({ error: 'closing_at must be in the future' });
  }

  try {
    await transaction(async (trx) => {
      const pr = await trx('purchase_requests').where({ id: purchase_request_id }).first();
      if (!pr) throw new Error('Purchase request not found');
      if (pr.status !== 'APPROVED') {
        throw new Error('Can only create a tender for an APPROVED purchase request');
      }

      // Prevent duplicate open tenders for same request
      const existing = await trx('tenders')
        .where({ purchase_request_id })
        .whereIn('status', ['OPEN', 'CLOSED'])
        .first();
      if (existing) throw new Error('An open tender already exists for this purchase request');

      const [tenderId] = await trx('tenders').insert({
        tender_code: genCode('TN'),
        purchase_request_id,
        drug_id: pr.drug_id,
        quantity,
        closing_at: new Date(closing_at),
        terms: terms || null,
        status: 'OPEN',
        delivery_type,
        is_new_drug: pr.is_new_drug || false,
        created_by: userId,
      });

      const newTender = await trx('tenders').where('id', tenderId).first();
      await logAudit(trx, 'tenders', tenderId, 'CREATE', userId, null, newTender);

      // Notify all registered suppliers
      await notificationService.sendNotification('Supplier', null, {
        type: 'TENDER_POSTED',
        title: 'New Tender Posted',
        message: `A new tender (${newTender.tender_code}) is now open for bidding. Closes: ${new Date(closing_at).toLocaleString()}`,
        related_entity_id: tenderId,
        link: `/supplier/tenders/${tenderId}`,
      });

      res.status(201).json({ message: 'Tender created successfully', data: newTender });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 7. Get Tenders (role-aware) ─────────────────────────────────────────
exports.getTenders = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const { status } = req.query;

  try {
    let query = db('tenders')
      .leftJoin('drugs', 'tenders.drug_id', 'drugs.id')
      .leftJoin('purchase_requests', 'tenders.purchase_request_id', 'purchase_requests.id')
      .select('tenders.*', 'drugs.name as drug_name', 'purchase_requests.request_code');

    if (status) query = query.where('tenders.status', status);

    // Suppliers only see OPEN tenders
    if (role === 'Supplier') {
      query = query.where('tenders.status', 'OPEN');
    }

    const tenders = await query.orderBy('tenders.created_at', 'desc');
    res.json({ data: tenders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── 8. Submit Bid ────────────────────────────────────────────────────────
exports.submitBid = async (req, res) => {
  const { id: tender_id } = req.params;
  const { unit_price } = req.body;
  const supplierId = req.user.id;

  if (req.user.role !== 'Supplier') {
    return res.status(403).json({ error: 'Only Suppliers can submit bids' });
  }
  if (!unit_price || unit_price <= 0) {
    return res.status(400).json({ error: 'A positive unit_price is required' });
  }

  try {
    await transaction(async (trx) => {
      const tender = await trx('tenders').where({ id: tender_id }).first();
      if (!tender) throw new Error('Tender not found');
      if (tender.status !== 'OPEN') throw new Error('This tender is not open for bids');
      if (new Date(tender.closing_at) <= new Date()) throw new Error('This tender has already closed');

      // A supplier can only bid once per tender
      const existingBid = await trx('bids').where({ tender_id, supplier_id: supplierId }).first();
      if (existingBid) throw new Error('You have already submitted a bid for this tender');

      const total_cost = parseFloat((unit_price * tender.quantity).toFixed(2));

      // Validate bid against quantity and terms (is_valid based on server logic)
      // For the SRS, bid is valid if unit_price > 0 and quantity matches tender quantity
      const is_valid = unit_price > 0; // can be extended with more term checks

      const [bidId] = await trx('bids').insert({
        tender_id,
        supplier_id: supplierId,
        unit_price: parseFloat(unit_price),
        total_cost,
        is_valid,
      });

      const newBid = await trx('bids').where('id', bidId).first();
      await logAudit(trx, 'bids', bidId, 'SUBMIT', supplierId, null, { tender_id, unit_price, total_cost, is_valid });

      res.status(201).json({ message: 'Bid submitted successfully', data: newBid });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 9. Get Bids for a Tender (CEO sees all, Supplier sees only own) ──────
exports.getTenderBids = async (req, res) => {
  const { id: tender_id } = req.params;
  const role = req.user.role;
  const userId = req.user.id;

  try {
    let query = db('bids')
      .join('tenders', 'bids.tender_id', 'tenders.id')
      .leftJoin('users', 'bids.supplier_id', 'users.id')
      .where('bids.tender_id', tender_id)
      .select(
        'bids.id', 'bids.tender_id', 'bids.unit_price', 'bids.total_cost',
        'bids.is_valid', 'bids.submitted_at',
        'users.name as supplier_name'
      )
      .orderBy('bids.total_cost', 'asc'); // Always sorted low-to-high per SRS

    // Suppliers can only see their own bids
    if (role === 'Supplier') {
      query = query.where('bids.supplier_id', userId).select('bids.supplier_id');
    } else {
      query = query.select('bids.supplier_id');
    }

    const bids = await query;
    res.json({ data: bids });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── 10. CEO Awards Bid ───────────────────────────────────────────────────
exports.awardTender = async (req, res) => {
  const { id: tender_id } = req.params;
  const { bid_id, override_reason } = req.body;
  const userId = req.user.id;

  if (req.user.role !== 'CEO') {
    return res.status(403).json({ error: 'Only CEO can award tenders' });
  }

  try {
    await transaction(async (trx) => {
      const tender = await trx('tenders').where({ id: tender_id }).first();
      if (!tender) throw new Error('Tender not found');
      if (tender.status !== 'CLOSED') throw new Error('Tender must be CLOSED before awarding');

      const bids = await trx('bids')
        .where({ tender_id, is_valid: true })
        .orderBy('total_cost', 'asc');

      if (bids.length === 0) throw new Error('No valid bids to award');

      const lowestBid = bids[0];
      const selectedBid = bid_id ? bids.find(b => b.id === parseInt(bid_id)) : lowestBid;
      if (!selectedBid) throw new Error('Selected bid not found or is invalid');

      // If CEO selects a non-lowest bid, override reason is mandatory
      if (selectedBid.id !== lowestBid.id && !override_reason) {
        throw new Error('A mandatory reason is required when selecting a non-lowest bid');
      }

      await trx('tenders').where({ id: tender_id }).update({
        status: 'AWARDED',
        updated_at: new Date(),
      });

      // Create a delivery record based on tender delivery_type
      const [deliveryId] = await trx('deliveries').insert({
        tender_id,
        delivery_type: tender.delivery_type,
        status: 'PENDING',
      });

      await logAudit(trx, 'tenders', tender_id, 'AWARD', userId, tender, {
        status: 'AWARDED',
        winning_bid_id: selectedBid.id,
        winning_supplier_id: selectedBid.supplier_id,
        override_reason: override_reason || null,
      });

      // Notify Purchase Manager
      await notificationService.sendNotification('Purchase Manager', null, {
        type: 'TENDER_AWARDED',
        title: 'Tender Awarded',
        message: `Tender ${tender.tender_code} has been awarded. You may now create a fund request.`,
        related_entity_id: tender_id,
        link: `/purchase/tenders/${tender_id}`,
      });

      // Notify winning supplier
      await notificationService.sendNotification('Supplier', selectedBid.supplier_id, {
        type: 'BID_WON',
        title: 'Your Bid Was Selected',
        message: `Your bid for tender ${tender.tender_code} was selected. Prepare for delivery.`,
        related_entity_id: tender_id,
        link: `/supplier/tenders/${tender_id}`,
      });

      res.json({
        message: 'Tender awarded successfully',
        data: { tender_id, winning_bid: selectedBid, delivery_id: deliveryId, override_reason: override_reason || null }
      });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 11. CEO Rejects All Bids ─────────────────────────────────────────────
exports.cancelTender = async (req, res) => {
  const { id: tender_id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  if (req.user.role !== 'CEO') {
    return res.status(403).json({ error: 'Only CEO can cancel tenders' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'A reason is required to cancel a tender' });
  }

  try {
    await transaction(async (trx) => {
      const tender = await trx('tenders').where({ id: tender_id }).first();
      if (!tender) throw new Error('Tender not found');
      if (!['CLOSED', 'OPEN'].includes(tender.status)) throw new Error('Cannot cancel this tender');

      await trx('tenders').where({ id: tender_id }).update({ status: 'CANCELLED', updated_at: new Date() });
      await logAudit(trx, 'tenders', tender_id, 'CANCEL', userId, tender, { status: 'CANCELLED', reason });

      await notificationService.sendNotification('Purchase Manager', null, {
        type: 'TENDER_CANCELLED',
        title: 'Tender Cancelled',
        message: `Tender ${tender.tender_code} was cancelled by CEO. Reason: ${reason}. Please reissue.`,
        related_entity_id: tender_id,
        link: `/purchase/tenders/${tender_id}`,
      });

      res.json({ message: 'Tender cancelled' });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 12. Create Fund Request ──────────────────────────────────────────────
exports.createFundRequest = async (req, res) => {
  const { tender_ids } = req.body; // array of AWARDED tender IDs
  const userId = req.user.id;

  if (req.user.role !== 'Purchase Manager') {
    return res.status(403).json({ error: 'Only Purchase Manager can create fund requests' });
  }
  if (!tender_ids || !Array.isArray(tender_ids) || tender_ids.length === 0) {
    return res.status(400).json({ error: 'At least one tender_id is required' });
  }

  try {
    await transaction(async (trx) => {
      // Validate all tenders are AWARDED and fetch winning bids
      const tenders = await trx('tenders').whereIn('id', tender_ids);

      for (const t of tenders) {
        if (t.status !== 'AWARDED') {
          throw new Error(`Tender ${t.tender_code} is not yet AWARDED. Only AWARDED tenders can be bundled.`);
        }
      }

      // Get winning bid for each tender (lowest valid bid)
      const items = [];
      let totalAmount = 0;

      for (const tender of tenders) {
        const winningBid = await trx('bids')
          .where({ tender_id: tender.id, is_valid: true })
          .orderBy('total_cost', 'asc')
          .first();

        if (!winningBid) throw new Error(`No valid bids found for tender ${tender.tender_code}`);

        const lineTotal = parseFloat((winningBid.unit_price * tender.quantity).toFixed(2));
        items.push({
          tender_id: tender.id,
          drug_id: tender.drug_id,
          quantity: tender.quantity,
          unit_price: winningBid.unit_price,
          line_total: lineTotal,
        });
        totalAmount += lineTotal;
      }

      // Propagate is_new_drug from any of the bundled tenders
      const anyNewDrug = tenders.some(t => t.is_new_drug);

      const [frId] = await trx('fund_requests').insert({
        fund_request_code: genCode('FR'),
        created_by: userId,
        status: 'PENDING_APPROVAL',
        total_amount: parseFloat(totalAmount.toFixed(2)),
        is_new_drug: anyNewDrug,
      });

      // Insert line items
      const lineItems = items.map(item => ({ ...item, fund_request_id: frId }));
      await trx('fund_request_items').insert(lineItems);

      const newFR = await trx('fund_requests').where('id', frId).first();
      await logAudit(trx, 'fund_requests', frId, 'CREATE', userId, null, newFR);

      // Notify CEO
      await notificationService.sendNotification('CEO', null, {
        type: 'FUND_REQUEST_CREATED',
        title: 'New Fund Request',
        message: `A fund request (${newFR.fund_request_code}) for ETB ${totalAmount.toFixed(2)} requires your approval.`,
        related_entity_id: frId,
        link: `/ceo/fund-requests/${frId}`,
      });

      res.status(201).json({ message: 'Fund request created', data: newFR });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 13. Get Fund Requests ─────────────────────────────────────────────────
exports.getFundRequests = async (req, res) => {
  try {
    const fundRequests = await db('fund_requests')
      .select('*')
      .orderBy('created_at', 'desc');

    // Get items for each fund request
    const withItems = await Promise.all(fundRequests.map(async (fr) => {
      const items = await db('fund_request_items')
        .join('drugs', 'fund_request_items.drug_id', 'drugs.id')
        .join('tenders', 'fund_request_items.tender_id', 'tenders.id')
        .where('fund_request_items.fund_request_id', fr.id)
        .select('fund_request_items.*', 'drugs.name as drug_name', 'tenders.tender_code');
      return { ...fr, items };
    }));

    res.json({ data: withItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── 14. CEO Decision on Fund Request ────────────────────────────────────
exports.decideFundRequest = async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body; // 'APPROVED' or 'REJECTED'
  const userId = req.user.id;

  if (req.user.role !== 'CEO') {
    return res.status(403).json({ error: 'Only CEO can decide on fund requests' });
  }
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be APPROVED or REJECTED' });
  }
  if (decision === 'REJECTED' && !reason) {
    return res.status(400).json({ error: 'Rejection requires a mandatory reason' });
  }

  try {
    await transaction(async (trx) => {
      const fr = await trx('fund_requests').where({ id }).first();
      if (!fr) throw new Error('Fund request not found');
      if (fr.status !== 'PENDING_APPROVAL') {
        throw new Error(`Fund request is already in status: ${fr.status}`);
      }

      await trx('fund_requests').where({ id }).update({
        status: decision,
        decided_by: userId,
        decision_reason: reason || null,
        decided_at: new Date(),
        updated_at: new Date(),
      });

      const updated = await trx('fund_requests').where({ id }).first();
      await logAudit(trx, 'fund_requests', id, `DECISION_${decision}`, userId, fr, updated);

      if (decision === 'APPROVED') {
        await notificationService.sendNotification('Finance Manager', null, {
          type: 'FUND_REQUEST_APPROVED',
          title: 'Fund Request Approved',
          message: `Fund request ${fr.fund_request_code} (ETB ${fr.total_amount}) has been approved. Please verify budget.`,
          related_entity_id: id,
          link: `/finance/fund-requests/${id}`,
        });
        await notificationService.sendNotification('Purchase Manager', fr.created_by, {
          type: 'FUND_REQUEST_APPROVED',
          title: 'Fund Request Approved',
          message: `Your fund request ${fr.fund_request_code} was approved by CEO.`,
          related_entity_id: id,
          link: `/purchase/fund-requests/${id}`,
        });
      } else {
        await notificationService.sendNotification('Purchase Manager', fr.created_by, {
          type: 'FUND_REQUEST_REJECTED',
          title: 'Fund Request Rejected',
          message: `Fund request ${fr.fund_request_code} was rejected. Reason: ${reason}`,
          related_entity_id: id,
          link: `/purchase/fund-requests/${id}`,
        });
      }

      res.json({ message: `Fund request ${decision.toLowerCase()}`, data: updated });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 15. Finance marks Fund Request Ready for Payment ────────────────────
exports.markReadyForPayment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (req.user.role !== 'Finance Manager') {
    return res.status(403).json({ error: 'Only Finance Manager can mark fund requests ready for payment' });
  }

  try {
    await transaction(async (trx) => {
      const fr = await trx('fund_requests').where({ id }).first();
      if (!fr) throw new Error('Fund request not found');
      if (fr.status !== 'APPROVED') {
        throw new Error('Fund request must be APPROVED before marking ready for payment');
      }

      await trx('fund_requests').where({ id }).update({
        status: 'READY_FOR_PAYMENT',
        updated_at: new Date(),
      });

      await logAudit(trx, 'fund_requests', id, 'READY_FOR_PAYMENT', userId, fr, { status: 'READY_FOR_PAYMENT' });

      await notificationService.sendNotification('Purchase Manager', fr.created_by, {
        type: 'FUND_READY_FOR_PAYMENT',
        title: 'Fund Ready for Payment',
        message: `Finance has verified budget. Fund request ${fr.fund_request_code} is now ready for payment after delivery.`,
        related_entity_id: id,
        link: `/purchase/fund-requests/${id}`,
      });

      res.json({ message: 'Fund request marked ready for payment' });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 16. Receive Delivery ─────────────────────────────────────────────────
exports.receiveDelivery = async (req, res) => {
  const { id } = req.params;
  const { status: deliveryStatus, notes } = req.body; // 'RECEIVED' or 'ISSUE_REPORTED'
  const userId = req.user.id;
  const role = req.user.role;

  if (!['RECEIVED', 'ISSUE_REPORTED'].includes(deliveryStatus)) {
    return res.status(400).json({ error: 'Status must be RECEIVED or ISSUE_REPORTED' });
  }

  try {
    await transaction(async (trx) => {
      const delivery = await trx('deliveries').where({ id }).first();
      if (!delivery) throw new Error('Delivery not found');
      if (delivery.status !== 'PENDING') throw new Error('Delivery already processed');

      const tender = await trx('tenders').where({ id: delivery.tender_id }).first();

      // Enforce who can receive based on delivery_type
      if (delivery.delivery_type === 'VIA_STORE' && role !== 'Store Manager') {
        throw new Error('Only Store Manager can receive VIA_STORE deliveries');
      }
      if (delivery.delivery_type === 'DIRECT_TO_PHARMACY' && role !== 'CEO') {
        throw new Error('CEO must confirm DIRECT_TO_PHARMACY deliveries');
      }

      await trx('deliveries').where({ id }).update({
        status: deliveryStatus,
        received_by: userId,
        received_at: new Date(),
        notes: notes || null,
        updated_at: new Date(),
      });

      await logAudit(trx, 'deliveries', id, `RECEIVE_${deliveryStatus}`, userId, delivery, { status: deliveryStatus });

      // Update inventory if goods received
      if (deliveryStatus === 'RECEIVED') {
        if (delivery.delivery_type === 'VIA_STORE') {
          // Add to store_inventory
          const storeItem = await trx('store_inventory').where('drug_id', tender.drug_id).first();
          if (storeItem) {
            await trx('store_inventory').where('drug_id', tender.drug_id).increment('quantity', tender.quantity);
          } else {
            await trx('store_inventory').insert({ drug_id: tender.drug_id, quantity: tender.quantity, min_level: 0 });
          }
        } else {
          // DIRECT_TO_PHARMACY — update pharmacy_inventory
          const pharmaItem = await trx('pharmacy_inventory').where('drug_id', tender.drug_id).first();
          if (pharmaItem) {
            await trx('pharmacy_inventory').where('drug_id', tender.drug_id).increment('quantity', tender.quantity);
          } else {
            await trx('pharmacy_inventory').insert({ drug_id: tender.drug_id, quantity: tender.quantity, reorder_level: 0 });
          }
        }

        // Notify Finance that payment can now be processed
        await notificationService.sendNotification('Finance Manager', null, {
          type: 'DELIVERY_RECEIVED',
          title: 'Goods Received — Payment Unlocked',
          message: `Delivery for tender ${tender.tender_code} confirmed. You may now process payment.`,
          related_entity_id: delivery.tender_id,
          link: `/finance/payments`,
        });

        await notificationService.sendNotification('Purchase Manager', null, {
          type: 'DELIVERY_RECEIVED',
          title: 'Delivery Confirmed',
          message: `Goods for tender ${tender.tender_code} have been received.`,
          related_entity_id: delivery.tender_id,
          link: `/purchase/tenders/${delivery.tender_id}`,
        });
      } else {
        await notificationService.sendNotification('CEO', null, {
          type: 'DELIVERY_ISSUE',
          title: 'Delivery Issue Reported',
          message: `An issue was reported for delivery on tender ${tender.tender_code}. Notes: ${notes}`,
          related_entity_id: delivery.tender_id,
          link: `/ceo/deliveries/${id}`,
        });
      }

      res.json({ message: `Delivery marked ${deliveryStatus}` });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 17. Get Deliveries ────────────────────────────────────────────────────
exports.getDeliveries = async (req, res) => {
  try {
    const deliveries = await db('deliveries')
      .join('tenders', 'deliveries.tender_id', 'tenders.id')
      .leftJoin('drugs', 'tenders.drug_id', 'drugs.id')
      .select('deliveries.*', 'tenders.tender_code', 'tenders.quantity', 'drugs.name as drug_name')
      .orderBy('deliveries.created_at', 'desc');
    res.json({ data: deliveries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── 18. Create Payment (Finance) ─────────────────────────────────────────
exports.createPayment = async (req, res) => {
  const { fund_request_id, supplier_id } = req.body;
  const userId = req.user.id;

  if (req.user.role !== 'Finance Manager') {
    return res.status(403).json({ error: 'Only Finance Manager can create payments' });
  }
  if (!fund_request_id || !supplier_id) {
    return res.status(400).json({ error: 'fund_request_id and supplier_id are required' });
  }

  try {
    await transaction(async (trx) => {
      const fr = await trx('fund_requests').where({ id: fund_request_id }).first();
      if (!fr) throw new Error('Fund request not found');

      // SRS Section 6 Rule: Two-way match — fund request must be READY_FOR_PAYMENT
      if (fr.status !== 'READY_FOR_PAYMENT') {
        throw new Error('Fund request must be READY_FOR_PAYMENT before a payment can be created');
      }

      // Get all tenders tied to this fund request
      const frItems = await trx('fund_request_items').where({ fund_request_id });
      const tenderIds = frItems.map(i => i.tender_id);

      // Check ALL deliveries are RECEIVED
      const deliveries = await trx('deliveries').whereIn('tender_id', tenderIds);
      const allReceived = deliveries.length > 0 && deliveries.every(d => d.status === 'RECEIVED');
      if (!allReceived) {
        throw new Error('All goods must be received before payment can be processed');
      }

      // GUARD: Block double-payment — check for existing PAID payment
      const existingPaid = await trx('payments')
        .where({ fund_request_id, status: 'PAID' })
        .first();
      if (existingPaid) {
        throw new Error(`Payment already made for this fund request. Receipt: ${existingPaid.receipt_code}`);
      }

      const receiptCode = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const [paymentId] = await trx('payments').insert({
        fund_request_id,
        supplier_id,
        amount: fr.total_amount,
        paid_by: userId,
        paid_at: new Date(),
        receipt_code: receiptCode,
        status: 'PAID',
        is_new_drug: fr.is_new_drug || false,
      });

      const newPayment = await trx('payments').where('id', paymentId).first();
      await logAudit(trx, 'payments', paymentId, 'PAY', userId, null, newPayment);

      await notificationService.sendNotification('CEO', null, {
        type: 'PAYMENT_COMPLETED',
        title: 'Payment Processed',
        message: `Payment of ETB ${fr.total_amount} for fund request ${fr.fund_request_code} has been processed. Receipt: ${receiptCode}`,
        related_entity_id: paymentId,
        link: `/finance/payments/${paymentId}`,
      });
      await notificationService.sendNotification('Purchase Manager', fr.created_by, {
        type: 'PAYMENT_COMPLETED',
        title: 'Payment Processed',
        message: `Fund request ${fr.fund_request_code} payment is complete. Receipt: ${receiptCode}`,
        related_entity_id: paymentId,
        link: `/purchase/fund-requests/${fund_request_id}`,
      });
      await notificationService.sendNotification('Supplier', supplier_id, {
        type: 'PAYMENT_COMPLETED',
        title: 'Payment Received',
        message: `Payment for your bid has been processed. Receipt: ${receiptCode}`,
        related_entity_id: paymentId,
        link: `/supplier/payments/${paymentId}`,
      });

      res.status(201).json({ message: 'Payment processed successfully', data: newPayment });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── 19. Get Payments ─────────────────────────────────────────────────────
exports.getPayments = async (req, res) => {
  try {
    const payments = await db('payments')
      .join('fund_requests', 'payments.fund_request_id', 'fund_requests.id')
      .leftJoin('users', 'payments.supplier_id', 'users.id')
      .select('payments.*', 'fund_requests.fund_request_code', 'users.name as supplier_name')
      .orderBy('payments.paid_at', 'desc');
    res.json({ data: payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
