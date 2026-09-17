const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { audit } = require('../../config/logger');
const { sendNotification, sendFinanceNotification } = require('../../services/notification.service');

// Ensure purchase_quotation_items table exists
db.schema.hasTable('purchase_quotation_items').then(exists => {
  if (!exists) {
    return db.schema.createTable('purchase_quotation_items', table => {
      table.increments('id').primary();
      table.integer('quotation_id').unsigned().notNullable();
      table.foreign('quotation_id').references('id').inTable('purchase_quotations').onDelete('CASCADE');
      table.integer('line_no').notNullable();
      table.string('item_description');
      table.integer('quantity').defaultTo(1);
      table.string('unit').defaultTo('');
      table.decimal('unit_price', 15, 2).notNullable();
      table.decimal('line_total', 15, 2).notNullable();
      table.timestamps(true, true);
    });
  }
}).catch(console.error);

// Ensure general_store_incoming tables exist (convert→send to General Store flow)
db.schema.hasTable('general_store_incoming').then(exists => {
  if (!exists) {
    return db.schema.createTable('general_store_incoming', table => {
      table.increments('id').primary();
      table.integer('quotation_id').unsigned().notNullable();
      table.integer('purchase_order_id').unsigned();
      table.string('quotation_no', 30).notNullable();
      table.string('supplier_name', 150);
      table.string('delivery_note_no', 50);
      table.string('status', 30).defaultTo('pending');
      table.integer('created_by').unsigned();
      table.integer('received_by').unsigned();
      table.timestamp('received_at').nullable();
      table.timestamps(true, true);
    });
  }
}).catch(console.error);

db.schema.hasTable('general_store_incoming_items').then(exists => {
  if (!exists) {
    return db.schema.createTable('general_store_incoming_items', table => {
      table.increments('id').primary();
      table.integer('incoming_id').unsigned().notNullable();
      table.foreign('incoming_id').references('id').inTable('general_store_incoming').onDelete('CASCADE');
      table.string('item_description', 200);
      table.decimal('quantity', 15, 3).defaultTo(0);
      table.string('unit', 50).defaultTo('unit');
      table.decimal('unit_price', 15, 2).defaultTo(0);
      table.decimal('line_total', 15, 2).defaultTo(0);
    });
  }
}).catch(console.error);

// Ensure quotation_finance table exists (finance approval gate before conversion)
db.schema.hasTable('quotation_finance').then(exists => {
  if (!exists) {
    return db.schema.createTable('quotation_finance', table => {
      table.increments('id').primary();
      table.integer('quotation_id').unsigned().notNullable();
      table.unique('quotation_id');
      table.string('quotation_no', 30).notNullable();
      table.decimal('amount', 15, 2).defaultTo(0);
      table.string('status', 40).defaultTo('awaiting ceo approval');
      table.boolean('finance_requested').notNullable().defaultTo(false);
      table.boolean('ceo_approved').notNullable().defaultTo(false);
      table.integer('created_by').unsigned();
      table.integer('finance_approved_by').unsigned();
      table.timestamp('finance_approved_at').nullable();
      table.timestamp('paid_at').nullable();
      table.timestamps(true, true);
    });
  }
}).catch(console.error);

// Backfill finance_requested on existing tables
db.schema.hasColumn('quotation_finance', 'finance_requested').then(exists => {
  if (!exists) {
    return db.schema.alterTable('quotation_finance', table => {
      table.boolean('finance_requested').notNullable().defaultTo(false);
    });
  }
}).catch(console.error);

// Backfill ceo_approved on existing tables
db.schema.hasColumn('quotation_finance', 'ceo_approved').then(exists => {
  if (!exists) {
    return db.schema.alterTable('quotation_finance', table => {
      table.boolean('ceo_approved').notNullable().defaultTo(false);
    });
  }
}).catch(console.error);

exports.getQuotations = catchAsync(async (req, res) => {
  const quotations = await db('purchase_quotations').orderBy('id', 'desc');
  // Attach item count to each quotation
  const ids = quotations.map(q => q.id);
  if (ids.length > 0) {
    const counts = await db('purchase_quotation_items')
      .whereIn('quotation_id', ids)
      .groupBy('quotation_id')
      .select('quotation_id', db.raw('COUNT(*) as item_count'));
    const countMap = {};
    counts.forEach(c => { countMap[c.quotation_id] = c.item_count; });
    quotations.forEach(q => { q.item_count = countMap[q.id] || 0; });

    const financeRows = await db('quotation_finance').whereIn('quotation_id', ids);
    const financeMap = {};
    financeRows.forEach(f => {
      financeMap[f.quotation_id] = {
        finance_status: f.status,
        finance_requested: !!f.finance_requested,
        finance_ceo_approved: !!f.ceo_approved,
        finance_amount: f.amount,
        finance_approved_by: f.finance_approved_by,
        finance_approved_at: f.finance_approved_at,
        paid_at: f.paid_at
      };
    });
    quotations.forEach(q => { Object.assign(q, financeMap[q.id] || { finance_status: null }); });

    const incomingRows = await db('general_store_incoming').whereIn('quotation_id', ids);
    const incomingMap = {};
    incomingRows.forEach(g => {
      incomingMap[g.quotation_id] = {
        store_status: g.status,
        store_delivery_no: g.delivery_note_no,
        store_received_by: g.received_by,
        store_received_at: g.received_at
      };
    });
    quotations.forEach(q => { Object.assign(q, incomingMap[q.id] || { store_status: null }); });
  }
  res.json({ status: 'success', data: quotations });
});

exports.getFinanceExpenses = catchAsync(async (req, res) => {
  // Finance dashboard should only see quotations that were actually submitted
  // to Finance (have a quotation_finance row), never raw purchase records.
  const quotations = await db('purchase_quotations as q')
    .innerJoin('quotation_finance as f', 'f.quotation_id', 'q.id')
    .orderBy('q.id', 'desc')
    .select(
      'q.*',
      'f.status as finance_status',
      'f.finance_requested',
      'f.ceo_approved as finance_ceo_approved',
      'f.amount as finance_amount',
      'f.finance_approved_by',
      'f.finance_approved_at',
      'f.paid_at'
    );
  const ids = quotations.map(q => q.id);
  if (ids.length > 0) {
    const counts = await db('purchase_quotation_items')
      .whereIn('quotation_id', ids)
      .groupBy('quotation_id')
      .select('quotation_id', db.raw('COUNT(*) as item_count'));
    const countMap = {};
    counts.forEach(c => { countMap[c.quotation_id] = c.item_count; });
    quotations.forEach(q => { q.item_count = countMap[q.id] || 0; });
  }
  res.json({ status: 'success', data: quotations });
});

exports.getQuotationItems = catchAsync(async (req, res) => {
  const { id } = req.params;
  const items = await db('purchase_quotation_items').where({ quotation_id: id }).orderBy('line_no');
  res.json({ status: 'success', data: items });
});

exports.getPendingQuotations = catchAsync(async (req, res) => {
  // Awaiting CEO approval = quote still pending CEO, OR finance request is
  // still awaiting CEO sign-off (legacy quotes recorded before ceo_approved
  // tracking can be stuck at status Recorded with ceo_approved false).
  const quotations = await db('purchase_quotations as q')
    .leftJoin('quotation_finance as f', 'f.quotation_id', 'q.id')
    .where(function () {
      this.where('q.status', 'Pending CEO Approval')
        .orWhere(function () {
          this.where('f.ceo_approved', false)
            .andWhere('f.status', 'awaiting ceo approval');
        });
    })
    .whereNotIn('q.status', ['Cancelled', 'Converted'])
    .orderBy('q.id', 'desc')
    .select('q.*', 'f.ceo_approved as finance_ceo_approved', 'f.status as finance_status', 'f.finance_requested as finance_requested_flag');
  const ids = quotations.map(q => q.id);
  if (ids.length > 0) {
    const counts = await db('purchase_quotation_items')
      .whereIn('quotation_id', ids)
      .groupBy('quotation_id')
      .select('quotation_id', db.raw('COUNT(*) as item_count'));
    const countMap = {};
    counts.forEach(c => { countMap[c.quotation_id] = c.item_count; });
    quotations.forEach(q => { q.item_count = countMap[q.id] || 0; });
  }
  res.json({ status: 'success', data: quotations });
});

exports.createQuotation = catchAsync(async (req, res) => {
  const { supplier_id, supplier_name, items, date_agreed, agreed_via, notes, vat_rate } = req.body;

  if (!supplier_name) throw AppError.badRequest('Supplier name is required');
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('At least one item is required');
  }

  const vatPct = parseFloat(vat_rate ?? 15);

  // Calculate totals from items
  let subtotal = 0;
  const processedItems = items.map((item, idx) => {
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unit_price) || 0;
    const lineTotal = qty * price;
    subtotal += lineTotal;
    return {
      line_no: idx + 1,
      item_description: item.item_description || '',
      quantity: qty,
      unit: item.unit || '',
      unit_price: price,
      line_total: lineTotal
    };
  });

  const vatAmt = subtotal * (vatPct / 100);
  const total_amount = subtotal + vatAmt;

  // Auto-generate quotation_no
  const lastQ = await db('purchase_quotations').orderBy('id', 'desc').first();
  const nextId = (lastQ?.id || 0) + 1;
  const quotation_no = `QTN-${nextId.toString().padStart(3, '0')}`;

  // Build a summary of items for the main record
  const firstItem = processedItems[0];
  const itemSummary = processedItems.length === 1
    ? firstItem.item_description
    : `${processedItems.length} items: ${processedItems.map(i => i.item_description).join(', ')}`;

  const [id] = await db('purchase_quotations').insert({
    quotation_no,
    supplier_id: supplier_id || null,
    supplier_name,
    item_description: itemSummary,
    unit: firstItem.unit || '',
    quantity: processedItems.reduce((s, i) => s + i.quantity, 0),
    unit_price: firstItem.unit_price,
    total_amount,
    date_agreed: date_agreed || db.fn.now(),
    agreed_via: agreed_via || 'Phone',
    notes: notes || '',
    status: 'Pending CEO Approval',
    recorded_by: req.user.id,
    vat_rate: vatPct,
    vat_amount: vatAmt
  });

  // Insert line items
  const lineRows = processedItems.map(item => ({
    quotation_id: id,
    line_no: item.line_no,
    item_description: item.item_description,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    line_total: item.line_total,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  }));
  await db('purchase_quotation_items').insert(lineRows);

  // Open a finance request for this quotation (awaiting CEO approval -> finance ready)
  await db('quotation_finance').insert({
    quotation_id: id,
    quotation_no,
    amount: total_amount,
    status: 'awaiting ceo approval',
    created_by: req.user.id
  });

  res.locals.__centralAudited = true;
  await audit('QUOTATION_FINANCE_SUBMITTED', req.user.id, {
    resource: 'quotations',
    resourceId: String(id),
    action: 'SUBMIT_FINANCE',
    recordIdentifier: quotation_no,
    module: 'Procurement',
    description: `Quotation ${quotation_no} submitted for finance approval (ETB ${total_amount.toFixed(2)})`,
    afterState: { quotation_no, status: 'Pending CEO Approval', finance_status: 'awaiting ceo approval', amount: total_amount }
  });

  sendFinanceNotification({
    type: 'finance',
    title: 'Expense Awaiting CEO Approval',
    message: `Quotation ${quotation_no} for ${supplier_name} (ETB ${total_amount.toFixed(2)}) submitted. Approve after CEO approves.`,
    related_entity_id: id,
    link: '/finance/quotation-expenses'
  });

  res.status(201).json({ status: 'success', data: { id, quotation_no } });
});

exports.approveQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');

  // Legacy quotes created before ceo_approved tracking can be stuck at status
  // Recorded while finance is still awaiting CEO sign-off. Allow approving
  // those too (approval just flips finance ceo_approved).
  const finance = await db('quotation_finance').where({ quotation_id: id }).first();
  const awaitingCeo = finance
    && finance.status === 'awaiting ceo approval'
    && !finance.ceo_approved;
  if (quote.status !== 'Pending CEO Approval' && !(quote.status === 'Recorded' && awaitingCeo)) {
    throw AppError.badRequest(`Quotation is not awaiting CEO approval (current status: ${quote.status})`);
  }

  // Own the audit entry for this decision (suppress the middleware's generic write)
  res.locals.__centralAudited = true;

  if (action === 'approve') {
    await db('purchase_quotations').where({ id }).update({
      status: 'Recorded',
      ceo_approved_by: req.user.id,
      ceo_approved_at: db.fn.now(),
      updated_at: db.fn.now()
    });
    await db('quotation_finance').where({ quotation_id: id }).update({
      ceo_approved: true,
      updated_at: db.fn.now()
    });
    await audit('QUOTATION_APPROVED', req.user.id, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      resource: 'quotations',
      resourceId: String(id),
      module: 'CEO',
      recordIdentifier: quote.quotation_no,
      afterState: { status: 'Recorded', ceo_approved_by: req.user.id }
    });
    await sendNotification('Purchase Manager', null, {
      type: 'QUOTATION_APPROVED',
      title: 'Quotation Approved',
      message: `Quotation ${quote.quotation_no} was approved by the CEO and is now Recorded.`,
      related_entity_id: id,
      link: '/purchase/quotations'
    });
    sendFinanceNotification({
      type: 'finance',
      title: 'CEO Approved — Release Funds',
      message: `Quotation ${quote.quotation_no} was approved by CEO. Mark it ready to release funds.`,
      related_entity_id: id,
      link: '/finance/quotation-expenses'
    });
    res.json({ status: 'success', message: 'Quotation approved by CEO' });
  } else if (action === 'reject') {
    await db('purchase_quotations').where({ id }).update({
      status: 'Cancelled',
      ceo_approved_by: req.user.id,
      ceo_approved_at: db.fn.now(),
      ceo_rejection_reason: reason || 'Rejected by CEO',
      updated_at: db.fn.now()
    });
    await db('quotation_finance').where({ quotation_id: id }).update({
      status: 'cancelled',
      ceo_approved: false,
      updated_at: db.fn.now()
    });
    await audit('QUOTATION_REJECTED', req.user.id, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      resource: 'quotations',
      resourceId: String(id),
      module: 'CEO',
      recordIdentifier: quote.quotation_no,
      afterState: { status: 'Cancelled', finance_status: 'cancelled', ceo_rejection_reason: reason || 'Rejected by CEO' }
    });
    await sendNotification('Purchase Manager', null, {
      type: 'QUOTATION_REJECTED',
      title: 'Quotation Rejected',
      message: `Quotation ${quote.quotation_no} was rejected by the CEO${reason ? ` — Reason: ${reason}` : ''}.`,
      related_entity_id: id,
      link: '/purchase/quotations'
    });
    sendFinanceNotification({
      type: 'finance',
      title: 'Quotation Cancelled',
      message: `Quotation ${quote.quotation_no} was rejected by the CEO. Expense request cancelled${reason ? ` — Reason: ${reason}` : ''}.`,
      related_entity_id: id,
      link: '/finance/quotation-expenses'
    });
    res.json({ status: 'success', message: 'Quotation rejected by CEO' });
  } else {
    throw AppError.badRequest('Invalid action. Use "approve" or "reject"');
  }
});

exports.financeApproveQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (quote.status !== 'Recorded') {
    throw AppError.badRequest('CEO approval is required before finance can release funds');
  }
  const finance = await db('quotation_finance').where({ quotation_id: id }).first();
  if (!finance || finance.status !== 'awaiting ceo approval') {
    throw AppError.badRequest(`Finance request is not awaiting CEO approval (current status: ${finance ? finance.status : 'missing'})`);
  }
  if (!finance.ceo_approved) {
    throw AppError.badRequest('CEO approval is required before finance can release funds');
  }

  await db('quotation_finance').where({ quotation_id: id }).update({
    status: 'ready',
    finance_approved_by: req.user.id,
    finance_approved_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  res.locals.__centralAudited = true;
  await audit('QUOTATION_FINANCE_APPROVED', req.user.id, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    resource: 'quotations',
    resourceId: String(id),
    module: 'Finance',
    recordIdentifier: quote.quotation_no,
    description: `Finance released funds for quotation ${quote.quotation_no}`,
    afterState: { quotation_no: quote.quotation_no, quotation_status: 'Recorded', finance_status: 'ready', amount: finance.amount, finance_approved_by: req.user.id }
  });

  await sendNotification('Purchase Manager', null, {
    type: 'QUOTATION_FINANCE_READY',
    title: 'Finance Ready',
    message: `Quotation ${quote.quotation_no} is finance-approved (ETB ${finance.amount ? Number(finance.amount).toFixed(2) : '0.00'}). You may now convert to purchase.`,
    related_entity_id: id,
    link: '/purchase/quotations'
  });
  sendFinanceNotification({
    type: 'finance',
    title: 'Funds Ready — Awaiting Purchase',
    message: `Quotation ${quote.quotation_no} marked ready. Converting to purchase and receiving to store will mark it paid.`,
    related_entity_id: id,
    link: '/finance/quotation-expenses'
  });

  res.json({ status: 'success', message: 'Quotation finance-approved and ready to convert' });
});

exports.askFinanceBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (!['Pending CEO Approval', 'Recorded'].includes(quote.status)) {
    throw AppError.badRequest(`Finance budget can only be requested for a quotation awaiting or approved by the CEO (current status: ${quote.status})`);
  }

  let finance = await db('quotation_finance').where({ quotation_id: id }).first();
  let created = false;
  if (!finance) {
    await db('quotation_finance').insert({
      quotation_id: id,
      quotation_no: quote.quotation_no,
      amount: quote.total_amount,
      status: 'awaiting ceo approval',
      finance_requested: true,
      created_by: req.user.id
    });
    finance = { status: 'awaiting ceo approval', amount: quote.total_amount, finance_requested: true };
    created = true;
  } else if (finance.status === 'cancelled') {
    await db('quotation_finance').where({ quotation_id: id }).update({
      status: 'awaiting ceo approval',
      finance_requested: true,
      ceo_approved: false,
      updated_at: db.fn.now()
    });
    finance.status = 'awaiting ceo approval';
    finance.finance_requested = true;
    finance.ceo_approved = false;
    created = true;
  } else if (finance.status === 'awaiting ceo approval' && finance.finance_requested) {
    throw AppError.badRequest('Budget request already sent to Finance — please wait for their response');
  } else if (finance.status === 'awaiting ceo approval' && !finance.finance_requested) {
    await db('quotation_finance').where({ quotation_id: id }).update({
      finance_requested: true,
      updated_at: db.fn.now()
    });
    finance.finance_requested = true;
    created = true;
  }

  if (created) {
    res.locals.__centralAudited = true;
    await audit('QUOTATION_FINANCE_SUBMITTED', req.user.id, {
      resource: 'quotations',
      resourceId: String(id),
      action: 'SUBMIT_FINANCE',
      recordIdentifier: quote.quotation_no,
      module: 'Procurement',
      description: `Budget requested from finance for quotation ${quote.quotation_no}`,
      afterState: { quotation_no: quote.quotation_no, status: quote.status, finance_status: 'awaiting ceo approval', amount: Number(quote.total_amount) }
    });
  }

  sendFinanceNotification({
    type: 'finance',
    title: 'Budget Requested',
    message: `Budget requested for ${quote.quotation_no} (${quote.supplier_name || ''} — ETB ${finance.amount ? Number(finance.amount).toFixed(2) : Number(quote.total_amount).toFixed(2)}). Mark ready after CEO approval.`,
    related_entity_id: id,
    link: '/finance/quotation-expenses'
  });

  await sendNotification('CEO', null, {
    type: 'general',
    title: 'Quotation & Budget Request',
    message: quote.status === 'Pending CEO Approval'
      ? `Purchase requested budget for ${quote.quotation_no} (${quote.supplier_name || ''} — ETB ${Number(quote.total_amount).toFixed(2)}). CEO approval is required before Finance can release funds.`
      : `Budget requested from Finance for ${quote.quotation_no} (${quote.supplier_name || ''} — ETB ${Number(quote.total_amount).toFixed(2)}).`,
    related_entity_id: id,
    link: '/ceo/quotation-approvals'
  });

  res.json({ status: 'success', message: finance.status === 'ready'
    ? `Finance budget already released for ${quote.quotation_no} — ready to convert`
    : finance.status === 'paid'
      ? `Finance budget already paid for ${quote.quotation_no}`
      : `Budget request sent to finance for ${quote.quotation_no}` });
});

exports.convertQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { send_to_general_store } = req.body || {};
  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (quote.status !== 'Recorded') throw AppError.badRequest(`Quotation must be approved before converting (current status: ${quote.status})`);

  const finance = await db('quotation_finance').where({ quotation_id: id }).first();
  if (!finance || finance.status !== 'ready') {
    throw AppError.badRequest('Finance approval (ready) is required before this quotation can be converted');
  }

  const items = await db('purchase_quotation_items').where({ quotation_id: id }).orderBy('line_no');

  // Resolve supplier_id — find or create
  let supplierId = quote.supplier_id;
  if (!supplierId && quote.supplier_name) {
    let supplier = await db('suppliers').where({ name: quote.supplier_name }).first();
    if (!supplier) {
      const [newId] = await db('suppliers').insert({ name: quote.supplier_name, contact_person: 'N/A', phone: '0000000000', email: 'unknown@example.com', address: 'N/A', created_at: db.fn.now(), updated_at: db.fn.now() });
      supplierId = newId;
    } else {
      supplierId = supplier.id;
    }
  }
  if (!supplierId) throw AppError.badRequest('Supplier is required for purchase order');

  // Get default pending status id
  const pendingStatus = await db('po_statuses').where({ status_code: 'pending' }).first();
  const statusId = pendingStatus ? pendingStatus.id : null;

  // Create a purchase order (using correct column names from the actual table)
  const [poId] = await db('purchase_orders').insert({
    po_number: `PO-${quote.quotation_no}`,
    supplier_id: supplierId,
    order_date: quote.date_agreed || db.fn.now(),
    expected_delivery_date: quote.expected_delivery_date || db.raw('DATE_ADD(CURDATE(), INTERVAL 30 DAY)'),
    sector_id: quote.sector_id || 1,
    status_id: statusId || 1,
    total_amount: quote.total_amount,
    subtotal: items.length > 0 ? items.reduce((s, i) => s + parseFloat(i.line_total || 0), 0) : parseFloat(quote.total_amount) - parseFloat(quote.vat_amount || 0),
    tax_amount: parseFloat(quote.vat_amount || 0),
    notes: quote.notes || null,
    created_by: req.user.id,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
    ...(statusId ? { status_id: statusId } : {})
  });

  // Create order items for each quotation line item (using po_items table)
  if (items.length > 0) {
    const poItems = items.map(item => ({
      po_id: poId,
      product_name: item.item_description,
      quantity_ordered: item.quantity,
      unit_price: item.unit_price,
      total: item.line_total
    }));
    await db('po_items').insert(poItems);
  }

  await db('purchase_quotations').where({ id }).update({
    status: 'Converted',
    converted_to_delivery_id: poId,
    updated_at: db.fn.now()
  });

  // Own the audit + central write for this conversion (suppress generic middleware entry)
  res.locals.__centralAudited = true;
  await audit('QUOTATION_CONVERTED', req.user.id, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    resource: 'quotations',
    resourceId: String(id),
    module: 'Procurement',
    recordIdentifier: quote.quotation_no,
    afterState: { status: 'Converted', purchase_order_id: poId, send_to_general_store: !!send_to_general_store }
  });

  // Optional: drop a pending incoming shipment at the General Store
  if (send_to_general_store) {
    const deliveryNo = `DN-${poId}-${Date.now().toString().slice(-4)}`;
    const [incomingId] = await db('general_store_incoming').insert({
      quotation_id: id,
      purchase_order_id: poId,
      quotation_no: quote.quotation_no,
      supplier_name: quote.supplier_name || null,
      delivery_note_no: deliveryNo,
      status: 'pending',
      created_by: req.user.id,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });
    if (items.length > 0) {
      const incRows = items.map(item => ({
        incoming_id: incomingId,
        item_description: item.item_description,
        quantity: item.quantity,
        unit: item.unit || 'unit',
        unit_price: parseFloat(item.unit_price || 0),
        line_total: parseFloat(item.line_total || 0)
      }));
      await db('general_store_incoming_items').insert(incRows);
    }
    await sendNotification('General Store Keeper', null, {
      type: 'GENERAL_STORE_INCOMING',
      title: 'Incoming Shipment',
      message: `Shipment ${deliveryNo} (${quote.quotation_no}) from ${quote.supplier_name || 'supplier'} is ready to be received at the General Store.`,
      related_entity_id: incomingId,
      link: '/general-store/register'
    });
  }

  await sendNotification('Purchase Manager', null, {
    type: 'QUOTATION_CONVERTED',
    title: 'Quotation Converted',
    message: `Quotation ${quote.quotation_no} was converted to Purchase Order PO-${quote.quotation_no}${send_to_general_store ? ' and sent to the General Store.' : '.'}`,
    related_entity_id: id,
    link: '/purchase/quotations'
  });

  res.json({ status: 'success', message: 'Quotation converted to Purchase Order', purchase_order_id: poId });
});

exports.cancelQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (!['Recorded', 'Pending CEO Approval'].includes(quote.status)) {
    throw AppError.badRequest('Cannot cancel a converted quotation');
  }

  await db('purchase_quotations').where({ id }).update({
    status: 'Cancelled',
    updated_at: db.fn.now()
  });

  res.json({ status: 'success', message: 'Quotation cancelled' });
});
