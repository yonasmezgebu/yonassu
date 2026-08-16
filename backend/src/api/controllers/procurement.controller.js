const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { HTTP_STATUS } = require('../../utils/constants');
const notificationRepository = require('../../repositories/notification.repository');
const { hashPassword } = require('../../config/auth');
const vatConfigService = require('../../services/vatConfig.service');

function isNewDrug(pr) {
  return pr.request_type === 'NEW_DRUG' || pr.new_drug_flag === 'YES';
}
function flagPrefix(pr) { return isNewDrug(pr) ? '🆕 NEW DRUG: ' : ''; }

const procController = {

  // ── Health + Seed ──
  health: async (req, res) => {
    const tables = [
      'procurement_requests', 'procurement_market_tasks', 'procurement_tenders',
      'procurement_bids', 'procurement_tender_decisions', 'procurement_fund_requests',
      'procurement_payments', 'procurement_receipts'
    ];
    const statuses = {};
    for (const t of tables) {
      try { const row = await db(t).first(); statuses[t] = { exists: true, rowCount: row ? 'has data' : 'empty' }; }
      catch (e) { statuses[t] = { exists: false }; }
    }
    res.json({ status: 'success', data: { service: 'Drug Procurement Workflow', version: '1.0.0', tables: statuses } });
  },

  seedDemoData: async (req, res) => {
    const seeds = [];

    const requiredRoles = ['Market Team', 'Supplier', 'Finance Manager', 'Purchase Manager'];
    for (const roleName of requiredRoles) {
      const exists = await db('roles').where({ name: roleName }).first();
      if (!exists) {
        await db('roles').insert({ name: roleName, description: roleName, permissions: '{}' });
        seeds.push({ role: roleName, created: true });
      }
    }

    const demoPassword = await hashPassword('Demo@123');
    const demos = [
      { full_name: 'Pharmacy Mgr', email: 'pharmacy@demo.com', phone: '0911111111', role_type: 'Pharmacy Manager', dept_id: 10 },
      { full_name: 'CEO User', email: 'ceo@demo.com', phone: '0911111112', role_type: 'CEO', dept_id: 2 },
      { full_name: 'Market Team', email: 'market@demo.com', phone: '0911111113', role_type: 'Market Team', dept_id: 5 },
      { full_name: 'Purchase Mgr', email: 'purchase@demo.com', phone: '0911111114', role_type: 'Purchase Manager', dept_id: 5 },
      { full_name: 'Supplier Co', email: 'supplier@demo.com', phone: '0911111115', role_type: 'Supplier', dept_id: 5 },
      { full_name: 'Finance Mgr', email: 'finance@demo.com', phone: '0911111116', role_type: 'Finance Manager', dept_id: 3 },
      { full_name: 'Store Mgr', email: 'store@demo.com', phone: '0911111117', role_type: 'General Store Keeper', dept_id: 7 },
      { full_name: 'Finance User', email: 'financeuser@demo.com', phone: '0911111118', role_type: 'Finance', dept_id: 3 },
    ];

    for (const d of demos) {
      const exists = await db('users').where({ email: d.email }).first();
      if (!exists) {
        const result = await db('users').insert({
          full_name: d.full_name, email: d.email, phone: d.phone,
          password: demoPassword, status_id: 1, department_id: d.dept_id,
        });
        const userId = result[0];
        const roleRow = await db('roles').where({ name: d.role_type }).first();
        if (roleRow) {
          await db('user_roles').insert({ user_id: userId, role_id: roleRow.id });
        }
        seeds.push({ email: d.email, created: true });
      } else {
        seeds.push({ email: d.email, created: false, reason: 'already exists' });
      }
    }

    const inventoryItems = [
      { name: 'Amoxicillin 500mg', sku: 'AMOX-500', price: 25.00, stock: 500, reorder: 200 },
      { name: 'Paracetamol 500mg', sku: 'PARA-500', price: 5.00, stock: 1000, reorder: 500 },
      { name: 'Ciprofloxacin 250mg', sku: 'CIPRO-250', price: 35.00, stock: 300, reorder: 100 },
      { name: 'Metronidazole 400mg', sku: 'METRO-400', price: 10.00, stock: 800, reorder: 300 },
      { name: 'Ibuprofen 400mg', sku: 'IBU-400', price: 15.00, stock: 600, reorder: 200 },
    ];
    for (const item of inventoryItems) {
      const exists = await db('products').where({ sku: item.sku }).first();
      if (!exists) {
        await db('products').insert({
          name: item.name, sku: item.sku, category_id: 1, unit_id: 1,
          selling_price: item.price, stock_quantity: item.stock, reorder_level: item.reorder,
          is_active: true
        });
        seeds.push({ sku: item.sku, created: true });
      } else {
        seeds.push({ sku: item.sku, created: false, reason: 'already exists' });
      }
    }

    // Seed test procurement data: Ciprofloxacin 500mg as NEW_DRUG
    const pharmUser = await db('users').where({ email: 'pharmacy@demo.com' }).first();
    const ciproPR = await db('procurement_requests').where({ pr_no: 'PR-2026-003' }).first();
    if (!ciproPR && pharmUser) {
      const prId = await db('procurement_requests').insert({
        pr_no: 'PR-2026-003', request_type: 'NEW_DRUG',
        drug_name: 'Ciprofloxacin 500mg', drug_category: 'ANTIBIOTIC',
        drug_classification: 'PRESCRIPTION', therapeutic_use: 'Treatment of bacterial infections',
        request_reason: 'Current 250mg strength insufficient for severe cases; 500mg needed per new treatment protocol',
        quantity_requested: 200, unit_of_measure: 'Each',
        estimated_unit_price: 45.00, estimated_total: 9000.00,
        justification: 'Physician request for higher-strength Ciprofloxacin for severe UTI and respiratory infections',
        urgency: 'HIGH', status: 'PENDING_CEO_REVIEW', ceo_decision: 'PENDING',
        new_drug_flag: 'YES', requested_by: pharmUser.id,
        requested_by_name: pharmUser.full_name, notes: 'Test seed data for Flow 3 validation'
      });
      seeds.push({ pr_no: 'PR-2026-003', created: true });
    } else {
      seeds.push({ pr_no: 'PR-2026-003', created: false, reason: ciproPR ? 'already exists' : 'no pharmacy user' });
    }

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { seeds } });
  },

  createProcurementRequest: async (req, res) => {
    const { drugName, quantityRequested, unitOfMeasure, estimatedUnitPrice, justification, urgency, notes,
            requestType, drugCategory, drugClassification, therapeuticUse, requestReason, managerSignature } = req.body;
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const last = await db('procurement_requests').orderBy('id', 'desc').first();
    const num = last ? parseInt(last.pr_no.split('-')[2]) + 1 : 1;
    const prNo = `PR-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
    const estimatedTotal = (parseFloat(estimatedUnitPrice) || 0) * (parseInt(quantityRequested) || 0);
    const isNew = requestType === 'NEW_DRUG';
    if (isNew && !requestReason) throw new AppError('Request reason is required for new drugs', HTTP_STATUS.BAD_REQUEST);

    await db('procurement_requests').insert({
      pr_no: prNo, request_type: requestType || 'EXISTING_DRUG',
      drug_name: drugName, drug_category: drugCategory, drug_classification: drugClassification,
      therapeutic_use: therapeuticUse, request_reason: requestReason,
      quantity_requested: quantityRequested, unit_of_measure: unitOfMeasure || 'Each',
      estimated_unit_price: estimatedUnitPrice || 0, estimated_total: estimatedTotal,
      justification, urgency: urgency || 'MEDIUM',
      status: 'PENDING_CEO_REVIEW', ceo_decision: 'PENDING',
      new_drug_flag: isNew ? 'YES' : 'NO',
      requested_by: userId, requested_by_name: userName, notes,
      manager_signature: managerSignature || null
    });

    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    try {
      await notificationRepository.create({
        roleTarget: 'CEO', title: `New Procurement Request${newTag}`,
        message: `PR ${prNo}: ${drugName} x${quantityRequested}${isNew ? ' (NEW)' : ''}`,
        type: 'info', link: `/ceo/procurement-decisions`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { pr_no: prNo, request_type: requestType || 'EXISTING_DRUG' } });
  },


  listProcurementRequests: async (req, res) => {
    const rows = await db('procurement_requests')
      .leftJoin('users', 'procurement_requests.ceo_decided_by', 'users.id')
      .select('procurement_requests.*', 'users.full_name as ceo_decided_by_name')
      .orderBy('procurement_requests.created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  getProcurementRequest: async (req, res) => {
    const row = await db('procurement_requests')
      .leftJoin('users', 'procurement_requests.ceo_decided_by', 'users.id')
      .select('procurement_requests.*', 'users.full_name as ceo_decided_by_name')
      .where('procurement_requests.id', req.params.id).first();
    if (!row) throw new AppError('Not found', HTTP_STATUS.NOT_FOUND);
    res.json({ status: 'success', data: row });
  },

  // ── M3/Flow3: CEO Decision (APPROVE/REJECT/WAIT) ──
  ceoDecide: async (req, res) => {
    const { decision, ceoNotes, waitDocument, waitInstructions } = req.body;
    const row = await db('procurement_requests').where({ id: req.params.id }).first();
    if (!row) throw new AppError('Not found', HTTP_STATUS.NOT_FOUND);
    const userId = req.user.id;
    const userName = req.user.full_name || 'CEO';
    const isNew = isNewDrug(row);
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    const prefix = isNew ? '🆕 NEW DRUG: ' : '';

    if (decision === 'WAIT') {
      if (!waitDocument && !waitInstructions) throw new AppError('Document and instructions required for WAIT decision', HTTP_STATUS.BAD_REQUEST);
      await db('procurement_requests').where({ id: row.id }).update({
        ceo_decision: 'WAIT', ceo_notes: ceoNotes, ceo_decided_by: userId, ceo_decided_at: db.fn.now(),
        wait_document: waitDocument, wait_instructions: waitInstructions,
        status: 'IN_MARKET'
      });
      try {
        await notificationRepository.create({
          roleTarget: 'Market Team', title: `⏳ Request ${row.pr_no} - Market Task Assigned${newTag}`,
          message: `${prefix}${row.drug_name} - ${waitInstructions || 'Review document and research market'}`,
          type: 'warning', link: `/purchase/market-tasks`
        });
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: `⏳ Request ${row.pr_no} - WAIT${newTag}`,
          message: `${prefix}${row.drug_name} - Document attached, market team assigned`,
          type: 'warning', link: `/purchase/market-tasks`
        });
      } catch (e) {}
      return res.json({ status: 'success', data: { id: row.id, pr_no: row.pr_no, decision: 'WAIT' } });
    }

    const updates = {
      ceo_decision: decision, ceo_notes: ceoNotes, ceo_decided_by: userId, ceo_decided_at: db.fn.now(),
      status: decision === 'APPROVED' ? 'APPROVED_FOR_PURCHASE' : 'CEO_REJECTED'
    };
    await db('procurement_requests').where({ id: row.id }).update(updates);

    if (decision === 'APPROVED') {
      try {
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: `✅ ${prefix}Request ${row.pr_no} Accepted — Create Tender${newTag}`,
          message: `${isNew ? '🆕 New Drug ' : ''}${row.drug_name} — CEO accepted. Create a tender now.`,
          type: 'success', link: `/purchase/tenders`
        });
      } catch (e) {}
    } else {
      try {
        await notificationRepository.create({
          roleTarget: 'Pharmacy Manager', title: `❌ Request ${row.pr_no} Rejected${newTag}`,
          message: `${prefix}${row.drug_name} - Reason: ${ceoNotes || 'No reason provided'}`,
          type: 'error', link: `/pharmacy/procurement-requests`
        });
      } catch (e) {}
    }
    res.json({ status: 'success', data: { id: row.id, pr_no: row.pr_no, decision } });
  },

  // ── M4: Market Tasks ──
  listMarketTasks: async (req, res) => {
    const rows = await db('procurement_market_tasks').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  getApprovedPRsForMarket: async (req, res) => {
    const rows = await db('procurement_requests').whereIn('status', ['APPROVED_FOR_PURCHASE', 'IN_MARKET']).orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  createMarketTask: async (req, res) => {
    const { procurementRequestId, notes } = req.body;
    const pr = await db('procurement_requests').where({ id: procurementRequestId }).first();
    if (!pr) throw new AppError('PR not found', HTTP_STATUS.NOT_FOUND);
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    await db('procurement_market_tasks').insert({
      procurement_request_id: pr.id, pr_no: pr.pr_no, drug_name: pr.drug_name,
      quantity_needed: pr.quantity_requested, assigned_by: userId, assigned_by_name: userName, notes
    });
    try {
      await notificationRepository.create({
        roleTarget: 'Purchase Manager', title: 'Market Task Assigned',
        message: `PR ${pr.pr_no}: Market research assigned to ${userName}`,
        type: 'info', link: `/purchase/market-tasks`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { pr_no: pr.pr_no } });
  },

  completeMarketTask: async (req, res) => {
    const { marketInfo } = req.body;
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    await db('procurement_market_tasks').where({ id: req.params.id }).update({
      market_info: marketInfo, status: 'COMPLETED', completed_by: userId, completed_by_name: userName, completed_at: db.fn.now()
    });
    const task = await db('procurement_market_tasks').where({ id: req.params.id }).first();
    if (task) {
      await db('procurement_requests').where({ pr_no: task.pr_no }).update({ status: 'IN_MARKET', assigned_market_team: userId });
      try {
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: 'Market Research Complete',
          message: `PR ${task.pr_no}: Market research done by ${userName}`,
          type: 'success', link: `/purchase/market-tasks`
        });
      } catch (e) {}
    }
    res.json({ status: 'success', data: { id: req.params.id } });
  },

  // ── M5: Tenders ──
  createTender: async (req, res) => {
    const { procurementRequestId, budgetEstimate, openingDate, closingDate, termsAndConditions, notes } = req.body;
    const pr = await db('procurement_requests').where({ id: procurementRequestId }).first();
    if (!pr) throw new AppError('PR not found', HTTP_STATUS.NOT_FOUND);
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const last = await db('procurement_tenders').orderBy('id', 'desc').first();
    const num = last ? parseInt(last.tender_no.split('-')[2]) + 1 : 1;
    const tenderNo = `TND-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
    const isNew = isNewDrug(pr);
    await db('procurement_tenders').insert({
      tender_no: tenderNo, procurement_request_id: pr.id, pr_no: pr.pr_no,
      drug_name: pr.drug_name, quantity: pr.quantity_requested, unit_of_measure: pr.unit_of_measure,
      budget_estimate: budgetEstimate || pr.estimated_total,
      status: 'OPEN', opening_date: openingDate, closing_date: closingDate,
      issued_by: userId, issued_by_name: userName, terms_and_conditions: termsAndConditions, notes,
      new_drug_flag: isNew ? 'YES' : 'NO'
    });
    await db('procurement_requests').where({ id: pr.id }).update({ status: 'TENDER_CREATED' });
    
    // Mark specific notification for this PR as read
    try {
      await db('notifications')
        .where('title', 'like', `%${pr.pr_no}%`)
        .andWhere('role_target', 'Purchase Manager')
        .update({ is_read: true });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }

    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    try {
      await notificationRepository.create({
        roleTarget: 'Supplier', title: `📢 New Tender Open${newTag}`,
        message: `Tender ${tenderNo}: ${isNew ? 'NEW DRUG - ' : ''}${pr.drug_name}`,
        type: 'info', link: `/purchase/drug-tenders`
      });
      await notificationRepository.create({
        roleTarget: 'CEO', title: `📢 Tender ${tenderNo} Posted${newTag}`,
        message: `${isNew ? 'New Drug ' : ''}Tender posted for ${pr.drug_name}`,
        type: 'success', link: `/ceo/tender-decisions`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { tender_no: tenderNo, new_drug_flag: isNew ? 'YES' : 'NO' } });
  },

  listTenders: async (req, res) => {
    const rows = await db('procurement_tenders').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  getTender: async (req, res) => {
    const row = await db('procurement_tenders').where({ id: req.params.id }).first();
    if (!row) throw new AppError('Not found', HTTP_STATUS.NOT_FOUND);
    const decision = await db('procurement_tender_decisions')
      .where({ tender_id: row.id }).orderBy('id', 'desc').first();
    const bids = await db('procurement_bids')
      .leftJoin('users', 'procurement_bids.supplier_user_id', 'users.id')
      .select('procurement_bids.*', 'users.full_name as supplier_name_resolved')
      .where('procurement_bids.tender_id', row.id)
      .orderBy('procurement_bids.total_amount', 'asc');
    res.json({ status: 'success', data: {
      ...row,
      ceo_decision: decision?.decision || 'PENDING',
      ceo_notes: decision?.decision_notes || null,
      ceo_decided_by_name: decision?.decided_by_name || null,
      ceo_decided_at: decision?.decided_at || null,
      bids
    } });
  },

  // ── M6: Bids ──
  submitBid: async (req, res) => {
    const { tenderId, unitPrice, totalAmount, deliveryDays, validityPeriod, notes } = req.body;
    const tender = await db('procurement_tenders').where({ id: tenderId }).first();
    if (!tender) throw new AppError('Tender not found', HTTP_STATUS.NOT_FOUND);
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    await db('procurement_bids').insert({
      tender_id: tender.id, tender_no: tender.tender_no,
      supplier_user_id: userId, supplier_name: userName,
      unit_price: unitPrice, total_amount: totalAmount || (parseFloat(unitPrice) * tender.quantity),
      delivery_days: deliveryDays, validity_period: validityPeriod, notes
    });
    try {
      await notificationRepository.create({
        roleTarget: 'CEO', title: 'New Supplier Bid',
        message: `Bid received for ${tender.tender_no} from ${userName}`,
        type: 'info', link: `/ceo/tender-decisions`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { tender_no: tender.tender_no } });
  },

  listBids: async (req, res) => {
    const rows = await db('procurement_bids').where({ supplier_user_id: req.user.id }).orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  // ── Tender Auto-Close + Sort ──
  closeTender: async (req, res) => {
    const tender = await db('procurement_tenders').where({ id: req.params.id }).first();
    if (!tender) throw new AppError('Tender not found', HTTP_STATUS.NOT_FOUND);
    const isNew = tender.new_drug_flag === 'YES';
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    await db('procurement_tenders').where({ id: tender.id }).update({ status: 'CLOSED' });
    const bids = await db('procurement_bids').where({ tender_id: tender.id }).orderBy('total_amount', 'asc');
    const lowest = bids[0];
    try {
      await notificationRepository.create({
        roleTarget: 'CEO', title: `📊 TENDER ${tender.tender_no} CLOSED${newTag}`,
        message: `${isNew ? 'NEW DRUG: ' : ''}${tender.drug_name} | Lowest Bid: ${lowest ? '$' + parseFloat(lowest.total_amount).toFixed(2) + ' by ' + lowest.supplier_name : 'No bids'}`,
        type: 'info', link: `/ceo/tender-decisions`
      });
      await notificationRepository.create({
        roleTarget: 'Purchase Manager', title: `📊 Tender ${tender.tender_no} Closed${newTag}`,
        message: `${tender.drug_name} - ${bids.length} bids received`,
        type: 'info', link: `/purchase/drug-tenders`
      });
    } catch (e) {}
    res.json({ status: 'success', data: { tender_no: tender.tender_no, bids: bids.map((b, i) => ({ ...b, rank: i + 1 })) } });
  },

  // ── M7: Tender CEO Decision ──
  ceoDecideTender: async (req, res) => {
    const { decision, selectedBidId, decisionNotes } = req.body;
    const tender = await db('procurement_tenders').where({ id: req.params.id }).first();
    if (!tender) throw new AppError('Tender not found', HTTP_STATUS.NOT_FOUND);
    const userId = req.user.id;
    const userName = req.user.full_name || 'CEO';
    const isNew = tender.new_drug_flag === 'YES';
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    await db('procurement_tender_decisions').insert({
      tender_id: tender.id, tender_no: tender.tender_no,
      selected_bid_id: selectedBidId || null,
      decision, decision_notes: decisionNotes,
      decided_by: userId, decided_by_name: userName, decided_at: db.fn.now()
    });
    const newStatus = decision === 'APPROVED' ? 'AWARDED' : (decision === 'RE_TENDER' ? 'OPEN' : 'CLOSED');
    await db('procurement_tenders').where({ id: tender.id }).update({ status: newStatus });
    if (decision === 'APPROVED' && selectedBidId) {
      await db('procurement_bids').where({ id: selectedBidId }).update({ status: 'AWARDED' });
      await db('procurement_bids').where({ tender_id: tender.id }).whereNot({ id: selectedBidId }).update({ status: 'REJECTED' });
      const bid = await db('procurement_bids').where({ id: selectedBidId }).first();
      try {
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: `✅ CEO Approved${newTag}`,
          message: `${tender.drug_name} | Supplier: ${bid ? bid.supplier_name : ''} | Total: $${bid ? parseFloat(bid.total_amount).toFixed(2) : '0.00'}`,
          type: 'success', link: `/purchase/drug-tenders`
        });
        await notificationRepository.create({
          roleTarget: 'Finance Manager', title: `Tender Awarded${newTag}`,
          message: `Tender ${tender.tender_no} awarded to ${bid ? bid.supplier_name : ''}`,
          type: 'success', link: `/finance/procurement-finance`
        });
      } catch (e) {}
    } else if (decision === 'RE_TENDER') {
      try {
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: 'Re-Tender Requested',
          message: `Tender ${tender.tender_no} needs re-tendering`, type: 'warning', link: `/purchase/drug-tenders`
        });
      } catch (e) {}
    } else if (decision === 'REJECTED' || decision === 'CLOSED') {
      try {
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: 'Tender Closed',
          message: `Tender ${tender.tender_no} was closed without award`, type: 'error', link: `/purchase/drug-tenders`
        });
      } catch (e) {}
    }
    res.json({ status: 'success', data: { tender_no: tender.tender_no, decision } });
  },

  // ── M9: Fund Requests ──
  createFundRequest: async (req, res) => {
    const { tenderId, totalAmount, notes } = req.body;
    const tender = await db('procurement_tenders').where({ id: tenderId }).first();
    if (!tender) throw new AppError('Tender not found', HTTP_STATUS.NOT_FOUND);
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const isNew = tender.new_drug_flag === 'YES';
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    const pr = await db('procurement_requests').where({ id: tender.procurement_request_id }).first();
    const awardedBid = await db('procurement_bids').where({ tender_id: tender.id, status: 'AWARDED' }).first();
    const baseAmount = awardedBid && awardedBid.total_amount
      ? parseFloat(awardedBid.total_amount)
      : parseFloat(totalAmount || tender.budget_estimate || 0);
    const vatCalc = await vatConfigService.computeVatForItem('tender_buy', awardedBid ? awardedBid.id : null, baseAmount);
    const vatAmount = parseFloat(vatCalc.vat.toFixed(2));
    const finalAmount = parseFloat((baseAmount + vatAmount).toFixed(2));
    await db('procurement_fund_requests').insert({
      tender_id: tender.id, tender_no: tender.tender_no,
      procurement_request_id: tender.procurement_request_id, pr_no: tender.pr_no,
      total_amount: finalAmount,
      vat_amount: vatAmount,
      requested_by: userId, requested_by_name: userName, notes,
      new_drug_flag: isNew ? 'YES' : 'NO',
      status: 'PENDING_CEO_APPROVAL'
    });
    await db('procurement_requests').where({ id: tender.procurement_request_id }).update({ status: 'FUND_REQUESTED' });
    try {
      await notificationRepository.create({
        roleTarget: 'CEO', title: `💰 Fund Request - ${tender.tender_no}${newTag}`,
        message: `${isNew ? 'NEW DRUG: ' : ''}${tender.drug_name} | Total: $${parseFloat(totalAmount || tender.budget_estimate).toFixed(2)}`,
        type: 'info', link: `/ceo/fund-approvals`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { pr_no: tender.pr_no, new_drug_flag: isNew ? 'YES' : 'NO' } });
  },

  listFundRequests: async (req, res) => {
    const rows = await db('procurement_fund_requests').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  // ── M10: CEO Fund Approval ──
  ceoDecideFund: async (req, res) => {
    const { decision, ceoNotes } = req.body;
    const fr = await db('procurement_fund_requests').where({ id: req.params.id }).first();
    if (!fr) throw new AppError('Fund request not found', HTTP_STATUS.NOT_FOUND);
    const isNew = fr.new_drug_flag === 'YES';
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    const userId = req.user.id;
    await db('procurement_fund_requests').where({ id: fr.id }).update({
      ceo_decision: decision, ceo_notes: ceoNotes, ceo_decided_by: userId, ceo_decided_at: db.fn.now(),
      status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    });
    if (decision === 'APPROVED') {
      await db('procurement_requests').where({ id: fr.procurement_request_id }).update({ status: 'FUND_APPROVED' });
      try {
        await notificationRepository.create({
          roleTarget: 'Finance', title: `💰 Funds Approved${newTag}`,
          message: `${isNew ? 'NEW DRUG: ' : ''}FR ${fr.id} for PR ${fr.pr_no} | Total: $${parseFloat(fr.total_amount).toFixed(2)}`,
          type: 'success', link: `/finance/procurement-finance`
        });
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: `💰 Fund Request #FR-${fr.id} Approved${newTag}`,
          message: `${isNew ? 'NEW DRUG: ' : ''}Total: $${parseFloat(fr.total_amount).toFixed(2)}`,
          type: 'success', link: `/purchase/drug-tenders`
        });
      } catch (e) {}
    } else {
      try {
        await notificationRepository.create({
          roleTarget: 'Finance Manager', title: `❌ Fund Request #FR-${fr.id} Rejected${newTag}`,
          message: `Reason: ${ceoNotes || 'No reason provided'}`,
          type: 'error', link: `/finance/procurement-finance`
        });
      } catch (e) {}
    }
    res.json({ status: 'success', data: { id: fr.id, decision } });
  },

  // ── M11: Payments ──
  createPayment: async (req, res) => {
    const { fundRequestId, amount, paymentMethod, transactionRef, paymentDate, notes } = req.body;
    const fr = await db('procurement_fund_requests').where({ id: fundRequestId }).first();
    if (!fr) throw new AppError('Fund request not found', HTTP_STATUS.NOT_FOUND);
    const tender = await db('procurement_tenders').where({ id: fr.tender_id }).first();
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const paidBid = await db('procurement_bids').where({ tender_id: fr.tender_id, status: 'AWARDED' }).first();
    const last = await db('procurement_payments').orderBy('id', 'desc').first();
    const num = last ? parseInt(last.payment_no.split('-')[2]) + 1 : 1;
    const paymentNo = `PAY-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
    const isNew = fr.new_drug_flag === 'YES';
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    const pr = await db('procurement_requests').where({ id: fr.procurement_request_id }).first();

    await db('procurement_payments').insert({
      payment_no: paymentNo, fund_request_id: fr.id,
      pr_no: fr.pr_no, tender_no: fr.tender_no,
      supplier_user_id: paidBid ? paidBid.supplier_user_id : null,
      supplier_name: paidBid ? paidBid.supplier_name : null,
      amount: amount || fr.total_amount, payment_method: paymentMethod || 'BANK_TRANSFER',
      transaction_ref: transactionRef, payment_date: paymentDate,
      status: 'COMPLETED', paid_by: userId, paid_by_name: userName, paid_at: db.fn.now(), notes,
      new_drug_flag: isNew ? 'YES' : 'NO'
    });
    await db('procurement_requests').where({ id: fr.procurement_request_id }).update({ status: 'PAYMENT_MADE' });

    try {
      await notificationRepository.create({
        roleTarget: 'General Store Keeper', title: `Payment Made${newTag}`,
        message: `Payment ${paymentNo} for PR ${fr.pr_no}`, type: 'success', link: `/store/shipments`
      });
      if (paidBid) {
        await notificationRepository.create({
          roleTarget: 'Supplier', title: `Payment Issued${newTag}`,
          message: `Payment ${paymentNo} for tender ${fr.tender_no}`, type: 'success', link: `/buyer/bids`
        });
      }
      const nTitle = isNew ? `✅ PAYMENT COMPLETED - NEW DRUG ADDED ✅` : 'Payment Completed';
      await notificationRepository.create({
        roleTarget: 'CEO', title: nTitle,
        message: `${isNew ? '🆕 New Drug: ' + (pr ? pr.drug_name : '') + ' successfully added. ' : ''}Supplier: ${paidBid ? paidBid.supplier_name : ''} | Amount: $${parseFloat(amount || fr.total_amount).toFixed(2)}`,
        type: 'success', link: `/ceo/procurement-decisions`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { payment_no: paymentNo, new_drug_flag: isNew ? 'YES' : 'NO' } });
  },

  listPayments: async (req, res) => {
    const rows = await db('procurement_payments').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  // ── Store Shipment (Flow 2) + New Drug Store Receipt (Flow 3 Step 12) ──
  storeConfirmShipment: async (req, res) => {
    const { paymentId, deliveryNote, notes } = req.body;
    const payment = await db('procurement_payments').where({ id: paymentId }).first();
    if (!payment) throw new AppError('Payment not found', HTTP_STATUS.NOT_FOUND);
    const pr = await db('procurement_requests').where({ pr_no: payment.pr_no }).first();
    if (!pr) throw new AppError('PR not found', HTTP_STATUS.NOT_FOUND);
    if (pr.status !== 'PAYMENT_MADE') throw new AppError('PR is not in PAYMENT_MADE status', HTTP_STATUS.BAD_REQUEST);

    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const isNew = isNewDrug(pr);
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';

    // For new drugs: add to products table instead of decrementing
    if (isNew) {
      const existing = await db('products').where({ name: pr.drug_name }).first();
      if (!existing) {
        await db('products').insert({
          name: pr.drug_name, sku: pr.drug_name.toUpperCase().replace(/\s+/g, '-'),
          category_id: 1, unit_id: 1, selling_price: parseFloat(pr.estimated_unit_price) || 0,
          stock_quantity: pr.quantity_requested || 0, reorder_level: 10, is_active: true
        });
      } else {
        await db('products').where({ id: existing.id }).increment('stock_quantity', pr.quantity_requested || 0);
      }
    } else {
      const product = await db('products').where({ name: pr.drug_name }).first();
      if (product) {
        const newStock = (product.stock_quantity || 0) + (pr.quantity_requested || 0);
        await db('products').where({ id: product.id }).update({ stock_quantity: newStock });
      }
    }

    const last = await db('procurement_receipts').orderBy('id', 'desc').first();
    const num = last ? parseInt(last.receipt_no.split('-')[2]) + 1 : 1;
    const receiptNo = `RCP-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
    await db('procurement_receipts').insert({
      receipt_no: receiptNo, payment_id: payment.id, payment_no: payment.payment_no,
      procurement_request_id: pr.id, pr_no: payment.pr_no,
      drug_name: pr.drug_name || '',
      quantity_ordered: pr.quantity_requested || 0, quantity_received: pr.quantity_requested || 0,
      condition: 'GOOD', received_by: userId, received_by_name: userName, received_at: db.fn.now(),
      notes: [deliveryNote, notes].filter(Boolean).join(' | ')
    });

    await db('procurement_requests').where({ id: pr.id }).update({ status: 'SHIPPED' });

    try {
      await notificationRepository.create({
        roleTarget: 'Pharmacy Manager', title: `Drugs Shipped${newTag}`,
        message: `PR ${pr.pr_no}: ${pr.drug_name} shipped from store. Confirm receipt.`,
        type: 'info', link: `/pharmacy/receive-shipment`
      });
      await notificationRepository.create({
        roleTarget: 'CEO', title: `📦 New Drug Received${newTag}`,
        message: `${isNew ? 'First-time entry: ' : ''}${pr.drug_name} | Supplier: ${payment.supplier_name || ''} | Total Value: $${parseFloat(payment.amount).toFixed(2)}`,
        type: 'success', link: `/ceo/procurement-decisions`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { receipt_no: receiptNo, status: 'SHIPPED', new_drug_flag: isNew ? 'YES' : 'NO' } });
  },

  // ── Pharmacy Receipt ──
  pharmacyConfirmReceipt: async (req, res) => {
    const { receiptId } = req.body;
    const receipt = await db('procurement_receipts').where({ id: receiptId }).first();
    if (!receipt) throw new AppError('Receipt not found', HTTP_STATUS.NOT_FOUND);
    const pr = await db('procurement_requests').where({ pr_no: receipt.pr_no }).first();
    if (!pr) throw new AppError('PR not found', HTTP_STATUS.NOT_FOUND);
    if (pr.status !== 'SHIPPED') throw new AppError('PR is not in SHIPPED status', HTTP_STATUS.BAD_REQUEST);

    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const isNew = isNewDrug(pr);

    // New drug: add to pharmacy_medications
    if (isNew) {
      const existing = await db('pharmacy_medications').where({ name: pr.drug_name }).first();
      if (!existing) {
        await db('pharmacy_medications').insert({
          name: pr.drug_name, category_id: 1, price: parseFloat(pr.estimated_unit_price) || 0,
          stock_quantity: pr.quantity_requested || 0, is_active: true
        });
      } else {
        await db('pharmacy_medications').where({ id: existing.id }).increment('stock_quantity', pr.quantity_requested || 0);
      }
    } else {
      const pharmDrug = await db('pharmacy_medications').where({ name: pr.drug_name }).first();
      if (pharmDrug) {
        await db('pharmacy_medications').where({ id: pharmDrug.id }).increment('stock_quantity', pr.quantity_requested || 0);
      }
    }

    await db('procurement_requests').where({ id: pr.id }).update({ status: 'RECEIVED' });

    try {
      await notificationRepository.create({
        roleTarget: 'Pharmacy Manager', title: 'Drugs Received',
        message: `PR ${pr.pr_no}: ${pr.drug_name} received at pharmacy.`,
        type: 'success', link: `/pharmacy`
      });
      await notificationRepository.create({
        roleTarget: 'General Store Keeper', title: 'Shipment Received',
        message: `PR ${pr.pr_no}: ${pr.drug_name} confirmed received by pharmacy.`,
        type: 'success', link: `/store/shipments`
      });
    } catch (e) {}
    res.json({ status: 'success', data: { pr_no: pr.pr_no, status: 'RECEIVED' } });
  },

  // ── Direct Delivery to Pharmacy (Flow 3 Step 14) ──
  directDeliveryToPharmacy: async (req, res) => {
    const { paymentId, deliveryNote, notes } = req.body;
    const payment = await db('procurement_payments').where({ id: paymentId }).first();
    if (!payment) throw new AppError('Payment not found', HTTP_STATUS.NOT_FOUND);
    const pr = await db('procurement_requests').where({ pr_no: payment.pr_no }).first();
    if (!pr) throw new AppError('PR not found', HTTP_STATUS.NOT_FOUND);
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const isNew = isNewDrug(pr);
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';

    // Add to pharmacy_medications directly
    const existing = await db('pharmacy_medications').where({ name: pr.drug_name }).first();
    if (!existing) {
      await db('pharmacy_medications').insert({
        name: pr.drug_name, category_id: 1, price: parseFloat(pr.estimated_unit_price) || 0,
        stock_quantity: pr.quantity_requested || 0, is_active: true
      });
    } else {
      await db('pharmacy_medications').where({ id: existing.id }).increment('stock_quantity', pr.quantity_requested || 0);
    }

    await db('procurement_requests').where({ id: pr.id }).update({ status: 'RECEIVED' });

    try {
      await notificationRepository.create({
        roleTarget: 'CEO', title: `📦 Direct Delivery Received${newTag}`,
        message: `${pr.drug_name} delivered directly to pharmacy. Confirm receipt.`,
        type: 'info', link: `/ceo/procurement-decisions`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { pr_no: pr.pr_no, status: 'RECEIVED', new_drug_flag: isNew ? 'YES' : 'NO' } });
  },

  // ── CEO Confirm Direct Delivery ──
  ceoConfirmDirectDelivery: async (req, res) => {
    const { prNo, issueReported } = req.body;
    const pr = await db('procurement_requests').where({ pr_no: prNo }).first();
    if (!pr) throw new AppError('PR not found', HTTP_STATUS.NOT_FOUND);
    const isNew = isNewDrug(pr);
    const newTag = isNew ? ' 🆕 NEW DRUG' : '';
    await db('procurement_requests').where({ id: pr.id }).update({
      status: 'RECEIVED', ceo_notes: issueReported ? `Issue reported: ${issueReported}` : 'Confirmed received'
    });
    try {
      await notificationRepository.create({
        roleTarget: 'Finance Manager', title: `✅ CEO Confirmed${newTag}`,
        message: `${pr.drug_name} marked as RECEIVED. Ready for payment.`,
        type: 'success', link: `/finance/procurement-finance`
      });
      if (isNew) {
        await notificationRepository.create({
          roleTarget: 'Purchase Manager', title: `📦 Direct Delivery - CEO Confirmed${newTag}`,
          message: `${pr.drug_name} successfully added to Pharmacy inventory`,
          type: 'success', link: `/purchase/drug-tenders`
        });
      }
    } catch (e) {}
    res.json({ status: 'success', data: { pr_no: pr.pr_no, status: 'RECEIVED' } });
  },

  // ── M12: Receipts (legacy) ──
  createReceipt: async (req, res) => {
    const { paymentId, quantityReceived, condition, discrepancyNotes, deliveryNote, notes } = req.body;
    const payment = await db('procurement_payments').where({ id: paymentId }).first();
    if (!payment) throw new AppError('Payment not found', HTTP_STATUS.NOT_FOUND);
    const pr = await db('procurement_requests').where({ pr_no: payment.pr_no }).first();
    const userId = req.user.id;
    const userName = req.user.full_name || 'Unknown';
    const last = await db('procurement_receipts').orderBy('id', 'desc').first();
    const num = last ? parseInt(last.receipt_no.split('-')[2]) + 1 : 1;
    const receiptNo = `RCP-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
    await db('procurement_receipts').insert({
      receipt_no: receiptNo, payment_id: payment.id, payment_no: payment.payment_no,
      procurement_request_id: pr ? pr.id : null, pr_no: payment.pr_no,
      drug_name: pr ? pr.drug_name : '',
      quantity_ordered: pr ? pr.quantity_requested : 0, quantity_received: quantityReceived || (pr ? pr.quantity_requested : 0),
      condition: condition || 'GOOD', discrepancy_notes: discrepancyNotes,
      received_by: userId, received_by_name: userName, received_at: db.fn.now(),
      notes: [deliveryNote, notes].filter(Boolean).join(' | ')
    });
    await db('procurement_requests').where({ pr_no: payment.pr_no }).update({ status: 'RECEIVED' });
    try {
      await notificationRepository.create({
        roleTarget: 'Pharmacy Manager', title: 'Goods Received',
        message: `Receipt ${receiptNo} for PR ${payment.pr_no}`, type: 'success', link: `/procurement`
      });
    } catch (e) {}
    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { receipt_no: receiptNo } });
  },

  listReceipts: async (req, res) => {
    const rows = await db('procurement_receipts').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  // ─────────────────────────────────────────────────────────────────────
  //  PHARMACY DIRECT DELIVERY FLOW
  //  Step 1: Pharmacy Manager records goods received directly from supplier
  //  Step 2: CEO confirms delivery (triggers finance payable)
  //  Step 3: Finance creates payable linked to this delivery
  // ─────────────────────────────────────────────────────────────────────

  /** POST /procurement/direct-deliveries — Pharmacy Manager submits a direct delivery */
  createDirectDelivery: async (req, res) => {
    const {
      supplierName, drugName, quantity, unitOfMeasure = 'Units',
      unitPrice, deliveryDate, invoiceNo, notes
    } = req.body;
    if (!supplierName || !drugName || !quantity || !unitPrice || !deliveryDate) {
      throw new AppError('supplierName, drugName, quantity, unitPrice and deliveryDate are required', HTTP_STATUS.BAD_REQUEST);
    }
    const userId = req.user.id;
    const userName = req.user.full_name || 'Pharmacy Manager';
    const totalAmount = parseFloat(unitPrice) * parseInt(quantity);

    // Generate delivery_no
    const last = await db('pharmacy_direct_deliveries').orderBy('id', 'desc').first();
    const num = last ? parseInt((last.delivery_no || '').split('-')[3] || '0') + 1 : 1;
    const deliveryNo = `PDD-${new Date().getFullYear()}-${String(num).padStart(4, '0')}`;

    const [id] = await db('pharmacy_direct_deliveries').insert({
      delivery_no: deliveryNo,
      supplier_name: supplierName,
      drug_name: drugName,
      quantity: parseInt(quantity),
      unit_of_measure: unitOfMeasure,
      unit_price: parseFloat(unitPrice),
      total_amount: totalAmount,
      delivery_date: deliveryDate,
      invoice_no: invoiceNo || null,
      notes: notes || null,
      received_by: userId,
      received_by_name: userName,
      status: 'PENDING_CEO',
    });

    // Notify CEO
    try {
      await notificationRepository.create({
        roleTarget: 'CEO',
        title: '🚚 Direct Delivery — CEO Confirmation Required',
        message: `${drugName} (${quantity} ${unitOfMeasure}) received from ${supplierName}. ETB ${totalAmount.toLocaleString()}. Please confirm.`,
        type: 'info',
        link: '/ceo/pharmacy-hub?tab=delivery',
      });
    } catch (_) {}

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { id, delivery_no: deliveryNo } });
  },

  /** GET /procurement/direct-deliveries — List direct deliveries (filterable by status) */
  listDirectDeliveries: async (req, res) => {
    const { status } = req.query;
    let query = db('pharmacy_direct_deliveries').orderBy('created_at', 'desc');
    if (status) query = query.where('status', status);
    const rows = await query;
    res.json({ status: 'success', data: rows });
  },

  /** PATCH /procurement/direct-deliveries/:id/ceo-confirm — CEO confirms or rejects */
  ceoConfirmDelivery: async (req, res) => {
    const { action, ceoNotes } = req.body; // action = 'CONFIRM' | 'REJECT'
    const delivery = await db('pharmacy_direct_deliveries').where({ id: req.params.id }).first();
    if (!delivery) throw new AppError('Delivery not found', HTTP_STATUS.NOT_FOUND);
    if (delivery.status !== 'PENDING_CEO') throw new AppError('Delivery is not pending CEO confirmation', HTTP_STATUS.BAD_REQUEST);

    const userId = req.user.id;
    const newStatus = action === 'CONFIRM' ? 'CEO_CONFIRMED' : 'CEO_REJECTED';

    await db('pharmacy_direct_deliveries').where({ id: delivery.id }).update({
      status: newStatus,
      ceo_confirmed_at: db.fn.now(),
      ceo_confirmed_by: userId,
      ceo_notes: ceoNotes || null,
    });

    if (action === 'CONFIRM') {
      // Auto-update pharmacy stock
      try {
        const existing = await db('pharmacy_medications').where({ name: delivery.drug_name }).first();
        if (existing) {
          await db('pharmacy_medications').where({ id: existing.id }).increment('stock_quantity', delivery.quantity);
        } else {
          await db('pharmacy_medications').insert({
            name: delivery.drug_name, category_id: 1,
            price: delivery.unit_price, stock_quantity: delivery.quantity, is_active: true,
          });
        }
      } catch (_) {}

      // Notify Finance to create payable
      try {
        await notificationRepository.create({
          roleTarget: 'Finance Manager',
          title: '💳 Create Payable — Direct Delivery Confirmed',
          message: `CEO confirmed delivery ${delivery.delivery_no}: ${delivery.drug_name} from ${delivery.supplier_name}. Total: ETB ${parseFloat(delivery.total_amount).toLocaleString()}. Create payable.`,
          type: 'success',
          link: '/finance/flow2-funds',
        });
      } catch (_) {}

      // Notify Pharmacy Manager
      try {
        await notificationRepository.create({
          roleTarget: 'Pharmacy Manager',
          title: '✅ Delivery Confirmed by CEO',
          message: `${delivery.drug_name} (${delivery.delivery_no}) has been confirmed. Stock updated and Finance has been notified.`,
          type: 'success',
          link: '/pharmacy-manager/direct-deliveries',
        });
      } catch (_) {}
    } else {
      // Notify Pharmacy Manager of rejection
      try {
        await notificationRepository.create({
          roleTarget: 'Pharmacy Manager',
          title: '❌ Delivery Rejected by CEO',
          message: `${delivery.delivery_no} (${delivery.drug_name}) was rejected. Notes: ${ceoNotes || 'No reason given'}`,
          type: 'error',
          link: '/pharmacy-manager/direct-deliveries',
        });
      } catch (_) {}
    }

    res.json({ status: 'success', data: { id: delivery.id, delivery_no: delivery.delivery_no, status: newStatus } });
  },

  /** PATCH /procurement/direct-deliveries/:id/finance-pay — Finance marks as paid */
  financeMarkDeliveryPaid: async (req, res) => {
    const { payableId } = req.body;
    const delivery = await db('pharmacy_direct_deliveries').where({ id: req.params.id }).first();
    if (!delivery) throw new AppError('Delivery not found', HTTP_STATUS.NOT_FOUND);
    await db('pharmacy_direct_deliveries').where({ id: delivery.id }).update({
      status: 'FINANCE_PAID',
      finance_payable_id: payableId || null,
    });
    res.json({ status: 'success', data: { id: delivery.id, status: 'FINANCE_PAID' } });
  },

};

module.exports = procController;

