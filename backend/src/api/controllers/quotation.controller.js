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
      table.string('status', 20).defaultTo('pending');
      table.integer('received_by').unsigned().nullable();
      table.timestamp('received_at').nullable();
    });
  }
}).catch(console.error);

// Per-item acceptance columns (idempotent for existing databases)
db.schema.hasColumn('general_store_incoming_items', 'status').then(exists => {
  if (exists) return Promise.resolve();
  return db.schema.alterTable('general_store_incoming_items', table => {
    table.string('status', 20).defaultTo('pending');
    table.integer('received_by').unsigned().nullable();
    table.timestamp('received_at').nullable();
  }).then(() => db.raw(`UPDATE general_store_incoming_items it
      JOIN general_store_incoming g ON g.id = it.incoming_id AND g.status = 'received'
      SET it.status = 'received', it.received_by = g.received_by, it.received_at = g.received_at`));
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

    const incomingRows = await db('general_store_incoming').whereIn('quotation_id', ids).orderBy('id');
    const receiverIds = [...new Set(incomingRows.map(g => g.received_by).filter(Boolean))];
    const receiverMap = {};
    if (receiverIds.length) {
      const receivers = await db('users').whereIn('id', receiverIds).select('id', 'full_name');
      receivers.forEach(u => { receiverMap[u.id] = u.full_name; });
    }
    const incomingMap = {};
    incomingRows.forEach(g => {
      incomingMap[g.quotation_id] = {
        store_status: g.status,
        store_delivery_no: g.delivery_note_no,
        store_received_by: g.received_by,
        store_received_by_name: receiverMap[g.received_by] || null,
        store_received_at: g.received_at
      };
    });
    const itemAggMap = {};
    if (ids.length) {
      const itemAggs = await db('general_store_incoming as g')
        .join('general_store_incoming_items as it', 'it.incoming_id', 'g.id')
        .whereIn('g.quotation_id', ids)
        .groupBy('g.quotation_id')
        .select('g.quotation_id',
          db.raw("COALESCE(SUM(it.line_total),0) as total_value"),
          db.raw("COALESCE(SUM(CASE WHEN it.status = 'received' THEN it.line_total ELSE 0 END),0) as received_value"),
          db.raw("COUNT(CASE WHEN it.status = 'received' THEN 1 END) as received_count"),
          db.raw('COUNT(*) as item_count'));
      itemAggs.forEach(a => { itemAggMap[a.quotation_id] = a; });
    }
    const pharmRows = await db('pharmacy_store_incoming').whereIn('quotation_id', ids).orderBy('id');
    const pharmMap = {};
    pharmRows.forEach(p => {
      pharmMap[p.quotation_id] = {
        pharmacy_store_status: p.status,
        pharmacy_delivery_no: p.delivery_note_no,
        pharmacy_received_at: p.received_at
      };
    });
    quotations.forEach(q => {
      if (q.destination === 'pharmacy') {
        const pharm = pharmMap[q.id];
        if (pharm) {
          Object.assign(q, pharm);
        } else {
          Object.assign(q, { pharmacy_store_status: q.status === 'Converted' ? 'not_received' : null });
        }
      } else {
        const incoming = incomingMap[q.id];
        if (incoming) {
          Object.assign(q, incoming);
        } else {
          Object.assign(q, { store_status: q.status === 'Converted' ? 'not_sent' : null });
        }
      }
      const agg = itemAggMap[q.id];
      if (agg) {
        const totalValue = parseFloat(agg.total_value || 0);
        const receivedValue = parseFloat(agg.received_value || 0);
        Object.assign(q, {
          store_total_value: totalValue,
          store_received_value: receivedValue,
          store_received_count: Number(agg.received_count || 0),
          store_item_count: Number(agg.item_count || 0),
          store_percent: totalValue > 0
            ? Math.round((receivedValue / totalValue) * 100)
            : (Number(agg.received_count || 0) > 0 ? 100 : 0)
        });
      }
    });
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

    const pharmRows = await db('pharmacy_store_incoming')
      .whereIn('quotation_id', ids)
      .select('quotation_id', 'delivery_note_no', 'status', 'received_by', 'received_at');
    const pharmMap = {};
    pharmRows.forEach(p => {
      pharmMap[p.quotation_id] = {
        pharmacy_delivery_no: p.delivery_note_no,
        pharmacy_store_status: p.status,
        pharmacy_received_at: p.received_at
      };
    });
    quotations.forEach(q => {
      if (q.destination === 'pharmacy') {
        Object.assign(q, pharmMap[q.id] || { pharmacy_store_status: q.status === 'Converted' ? 'not_received' : null });
      }
    });
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
  const { supplier_id, supplier_name, items, date_agreed, agreed_via, notes, vat_rate, destination } = req.body;
  const dest = destination === 'pharmacy' ? 'pharmacy' : 'general';

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
      item_description: item.item_description || item.name || '',
      quantity: qty,
      unit: item.unit || '',
      unit_price: price,
      line_total: lineTotal,
      category: item.category || null,
      batch_no: item.batch_no || null,
      strength: item.strength || null,
      expiry_date: item.expiry_date || null
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
    vat_amount: vatAmt,
    destination: dest
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
    category: item.category || null,
    batch_no: item.batch_no || null,
    strength: item.strength || null,
    expiry_date: item.expiry_date || null,
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

  // ── Pharmacy destination: create a pending Pharmacy Store shipment ──
  if (quote.destination === 'pharmacy') {
    const shipmentNo = `PHS-${Date.now().toString().slice(-6)}`;
    const [pharmacyShipmentId] = await db('pharmacy_store_incoming').insert({
      quotation_id: id,
      purchase_order_id: poId,
      quotation_no: quote.quotation_no,
      delivery_note_no: shipmentNo,
      supplier_name: quote.supplier_name || null,
      status: 'pending',
      total_amount: quote.total_amount,
      vat_amount: quote.vat_amount || 0,
      created_by: req.user.id,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });
    if (items.length > 0) {
      const shipmentItems = items.map(item => ({
        incoming_id: pharmacyShipmentId,
        item_description: item.item_description,
        category: item.category || null,
        batch_no: item.batch_no || null,
        strength: item.strength || null,
        expiry_date: item.expiry_date || null,
        quantity: item.quantity,
        unit: item.unit || 'unit',
        unit_price: item.unit_price,
        line_total: item.line_total,
        status: 'pending',
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      }));
      await db('pharmacy_store_incoming_items').insert(shipmentItems);
    }
    await sendNotification('Pharmacy Store Keeper', null, {
      type: 'PHARMACY_STORE_INCOMING',
      title: 'Pending Pharmacy Store Shipment',
      message: `Shipment ${shipmentNo} (${quote.quotation_no}) from ${quote.supplier_name || 'supplier'} is waiting for the Pharmacy Store Keeper to receive into pharmacy inventory.`,
      related_entity_id: pharmacyShipmentId,
      link: '/pharmacy/pending-incoming'
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

exports.updateQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { supplier_id, supplier_name, items, date_agreed, agreed_via, notes, vat_rate, destination } = req.body;

  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (quote.status !== 'Pending CEO Approval') {
    throw AppError.badRequest('Only pending quotations (before CEO approval) can be edited');
  }

  const dest = destination === 'pharmacy' ? 'pharmacy' : 'general';
  if (!supplier_name) throw AppError.badRequest('Supplier name is required');
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('At least one item is required');
  }

  const vatPct = parseFloat(vat_rate ?? 15);
  let subtotal = 0;
  const processedItems = items.map((item, idx) => {
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unit_price) || 0;
    const lineTotal = qty * price;
    subtotal += lineTotal;
    return {
      line_no: idx + 1,
      item_description: item.item_description || item.name || '',
      quantity: qty,
      unit: item.unit || '',
      unit_price: price,
      line_total: lineTotal,
      category: item.category || null,
      batch_no: item.batch_no || null,
      strength: item.strength || null,
      expiry_date: item.expiry_date || null
    };
  });

  const vatAmt = subtotal * (vatPct / 100);
  const total_amount = subtotal + vatAmt;
  const firstItem = processedItems[0];
  const itemSummary = processedItems.length === 1
    ? firstItem.item_description
    : `${processedItems.length} items: ${processedItems.map(i => i.item_description).join(', ')}`;

  const trx = await db.transaction();
  try {
    await trx('purchase_quotation_items').where({ quotation_id: id }).del();
    await trx('purchase_quotation_items').insert(processedItems.map(item => ({
      quotation_id: id,
      ...item
    })));
    await trx('purchase_quotations').where({ id }).update({
      supplier_id: supplier_id || null,
      supplier_name,
      item_description: itemSummary,
      unit: firstItem.unit || '',
      quantity: processedItems.reduce((s, i) => s + i.quantity, 0),
      unit_price: firstItem.unit_price,
      vat_rate: vatPct,
      vat_amount: vatAmt,
      total_amount,
      destination: dest,
      date_agreed: date_agreed || trx.fn.now(),
      agreed_via: agreed_via || 'Phone',
      notes: notes || '',
      updated_at: trx.fn.now()
    });
    await trx('quotation_finance')
      .where({ quotation_id: id })
      .andWhere('finance_requested', false)
      .update({ amount: total_amount });
    await trx.commit();
  } catch (e) {
    await trx.rollback();
    throw e;
  }

  await audit('QUOTATION_UPDATED', req.user.id, {
    resource: 'quotations',
    resourceId: String(id),
    action: 'UPDATE',
    recordIdentifier: quote.quotation_no,
    module: 'Procurement',
    afterState: { quotation_no: quote.quotation_no, destination: dest, total_amount }
  });

  res.json({ status: 'success', message: 'Quotation updated' });
});

exports.deleteQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (quote.status !== 'Cancelled') {
    throw AppError.badRequest('Only cancelled quotations can be deleted');
  }

  const trx = await db.transaction();
  try {
    await trx('purchase_quotation_items').where({ quotation_id: id }).del();
    await trx('quotation_finance').where({ quotation_id: id }).del();
    await trx('pharmacy_store_incoming_items')
      .whereIn('incoming_id', trx('pharmacy_store_incoming').select('id').where({ quotation_id: id }))
      .del();
    await trx('pharmacy_store_incoming').where({ quotation_id: id }).del();
    await trx('general_store_incoming_items')
      .whereIn('incoming_id', trx('general_store_incoming').select('id').where({ quotation_id: id }))
      .del();
    await trx('general_store_incoming').where({ quotation_id: id }).del();
    await trx('purchase_quotations').where({ id }).del();
    await trx.commit();
  } catch (e) {
    await trx.rollback();
    throw e;
  }

  await audit('QUOTATION_DELETED', req.user.id, {
    resource: 'quotations',
    resourceId: String(id),
    action: 'DELETE',
    recordIdentifier: quote.quotation_no,
    module: 'Procurement',
    afterState: { quotation_no: quote.quotation_no, status: quote.status }
  });

  res.json({ status: 'success', message: 'Quotation deleted' });
});

// ─────────────────────────────────────────────────────────────────────
//  PHARMACY STORE INCOMING FLOW (pharmacy-destination quotations)
//  Route handlers wired in purchase.routes.js under /pharmacy-incoming
// ─────────────────────────────────────────────────────────────────────

exports.listPharmacyIncoming = catchAsync(async (req, res) => {
  const { status } = req.query;
  let query = db('pharmacy_store_incoming as psi')
    .leftJoin('pharmacy_store_incoming_items as psii', 'psii.incoming_id', 'psi.id')
    .groupBy('psi.id')
    .orderBy('psi.created_at', 'desc')
    .select(
      'psi.id', 'psi.delivery_note_no', 'psi.quotation_no', 'psi.quotation_id',
      'psi.purchase_order_id', 'psi.supplier_name', 'psi.status', 'psi.total_amount',
      'psi.vat_amount', 'psi.created_at',
      db.raw('COUNT(psii.id) as total_lines'),
      db.raw('SUM(CASE WHEN psii.status = "received" THEN 1 ELSE 0 END) as received_lines'),
      db.raw('SUM(CASE WHEN psii.status = "pending" THEN 1 ELSE 0 END) as pending_lines'),
      db.raw('COALESCE(SUM(psii.quantity), 0) as total_quantity'),
      db.raw('COALESCE(SUM(CASE WHEN psii.status = "received" THEN psii.quantity ELSE 0 END), 0) as received_quantity')
    );
  if (status && status !== 'All') query = query.having('psi.status', status);
  const rows = await query;
  res.json({ status: 'success', data: rows });
});

exports.getPharmacyIncoming = catchAsync(async (req, res) => {
  const header = await db('pharmacy_store_incoming').where({ id: req.params.id }).first();
  if (!header) throw AppError.notFound('Pharmacy incoming shipment not found');
  const items = await db('pharmacy_store_incoming_items').where({ incoming_id: header.id }).orderBy('id');
  res.json({ status: 'success', data: { ...header, items } });
});

exports.acceptPharmacyIncomingItem = catchAsync(async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id, itemId } = req.params;
    const item = await trx('pharmacy_store_incoming_items').where({ id: itemId, incoming_id: id }).first();
    if (!item) throw AppError.notFound('Pharmacy incoming item not found');
    if (item.status === 'received') throw AppError.badRequest('Item already received');

    const name = item.item_description;
    const strength = item.strength || null;
    const qty = parseFloat(item.quantity) || 0;
    const batchNo = item.batch_no || null;
    const expiry = item.expiry_date || null;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const unit = item.unit || 'unit';

    // Upsert drug by name + strength (pharmacy catalogue)
    let drug = await trx('drugs')
      .where({ name })
      .andWhere(function () {
        this.where('strength', strength).orWhere(function () { this.whereNull('strength'); });
      })
      .first();
    let drugId;
    if (drug) {
      drugId = drug.id;
    } else {
      [drugId] = await trx('drugs').insert({
        name,
        strength,
        unit,
        unit_price: unitPrice,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    // One pharmacy_inventory row per batch + strength + expiry (per user choice)
    const existing = await trx('pharmacy_inventory')
      .where({ drug_id: drugId, batch_no: batchNo })
      .andWhere(function () {
        this.where('strength', strength).orWhere(function () { this.whereNull('strength'); });
      })
      .andWhere(function () {
        this.where('expiry_date', expiry).orWhere(function () { this.whereNull('expiry_date'); });
      })
      .first();
    if (existing) {
      await trx('pharmacy_inventory').where('id', existing.id).update({
        quantity: trx.raw('quantity + ?', [qty]),
        updated_at: trx.fn.now()
      });
    } else {
      await trx('pharmacy_inventory').insert({
        drug_id: drugId,
        quantity: qty,
        batch_no: batchNo,
        strength,
        expiry_date: expiry,
        unit_cost: unitPrice,
        reorder_level: 0,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    // Also record into the pharmacy store catalog (store_inventory)
    const storeRow = await trx('store_inventory')
      .where({ drug_id: drugId, batch_no: batchNo })
      .first();
    if (storeRow) {
      await trx('store_inventory').where('id', storeRow.id).update({
        quantity: trx.raw('quantity + ?', [qty]),
        unit_cost: unitPrice,
        expiry_date: expiry,
        stock_status: 'In Stock',
        last_received_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    } else {
      await trx('store_inventory').insert({
        drug_id: drugId,
        quantity: qty,
        batch_no: batchNo,
        expiry_date: expiry,
        near_expiry_days: 90,
        unit_cost: unitPrice,
        min_level: 0,
        max_level: 0,
        stock_status: 'In Stock',
        last_received_at: trx.fn.now(),
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    await trx('pharmacy_store_incoming_items').where({ id: itemId }).update({
      status: 'received',
      received_by: req.user.id,
      received_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    const pending = await trx('pharmacy_store_incoming_items')
      .where({ incoming_id: id }).whereNot('status', 'received').first();
    if (pending) {
      await trx('pharmacy_store_incoming').where({ id }).update({
        status: 'partial',
        updated_at: trx.fn.now()
      });
    } else {
      await trx('pharmacy_store_incoming').where({ id }).update({
        status: 'received',
        received_by: req.user.id,
        received_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
      const incoming = await trx('pharmacy_store_incoming').where({ id }).first();
      if (incoming && incoming.quotation_id) {
        await trx('quotation_finance').where({ quotation_id: incoming.quotation_id }).update({
          status: 'paid',
          paid_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
      }
    }

    await trx.commit();
    await audit('PHARMACY_INCOMING_ITEM_RECEIVED', req.user.id, {
      module: 'Pharmacy Store',
      recordIdentifier: `${item.item_description || 'item'} (${batchNo || 'no batch'})`,
      afterState: { incoming_id: id, item_id: itemId, drug_id: drugId, quantity: qty, batch_no: batchNo, strength, expiry_date: expiry },
      resource: 'pharmacy_store_incoming',
      resourceId: String(id)
    });
    res.json({ status: 'success', message: 'Item received into pharmacy inventory', data: { drug_id: drugId } });
  } catch (e) {
    await trx.rollback();
    throw e;
  }
});

// ─────────────────────────────────────────────────────────────────────
//  RECEIVE ENTIRE SHIPMENT AT ONCE (Add New Catalog → receive-all)
//  Registers every entry (existing shipment lines + extra new items) into
//  the drug catalogue & pharmacy inventory in ONE submit, marks the
//  incoming shipment received/partial, and pays the quotation finance
//  when the shipment is fully received. No per-item Accept clicks.
// ─────────────────────────────────────────────────────────────────────
exports.receivePharmacyIncoming = catchAsync(async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    if (!entries.length) throw AppError.badRequest('No entries provided');

    const incoming = await trx('pharmacy_store_incoming').where({ id }).first();
    if (!incoming) throw AppError.notFound('Pharmacy incoming shipment not found');

    const originalItems = await trx('pharmacy_store_incoming_items').where({ incoming_id: id });

    let received = 0;
    let registered = 0;
    const receiptItems = [];

    for (const ent of entries) {
      const name = String(ent.name || '').trim();
      if (!name) continue;
      const strength = ent.strength || null;
      const category = ent.category || null;
      const batchNo = ent.batch_no || null;
      let expiry = ent.expiry_date || null;
      if (expiry) {
        // Normalize to date-only string (column is DATE; avoid timestamp refusals)
        const parsed = new Date(expiry);
        if (!isNaN(parsed.getTime())) {
          expiry = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        } else {
          expiry = String(expiry).slice(0, 10);
        }
      }
      const qty = parseFloat(ent.quantity) || 0;
      const unit = ent.unit || 'unit';
      const unitPrice = parseFloat(ent.unit_price) || 0;
      const vatRate = ent.vat_rate === undefined || ent.vat_rate === null || ent.vat_rate === '' ? 15 : parseFloat(ent.vat_rate);

      // Upsert drug by name + strength
      let drug = await trx('drugs')
        .where({ name })
        .andWhere(function () {
          this.where('strength', strength).orWhere(function () { this.whereNull('strength'); });
        })
        .first();
      let drugId;
      if (drug) {
        drugId = drug.id;
      } else {
        [drugId] = await trx('drugs').insert({
          name,
          strength,
          unit,
          unit_price: unitPrice,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
      }

      // One pharmacy_inventory row per batch + strength + expiry
      const existing = await trx('pharmacy_inventory')
        .where({ drug_id: drugId, batch_no: batchNo })
        .andWhere(function () {
          this.where('strength', strength).orWhere(function () { this.whereNull('strength'); });
        })
        .andWhere(function () {
          this.where('expiry_date', expiry).orWhere(function () { this.whereNull('expiry_date'); });
        })
        .first();
      if (existing) {
        await trx('pharmacy_inventory').where('id', existing.id).update({
          quantity: trx.raw('quantity + ?', [qty]),
          unit_cost: unitPrice,
          updated_at: trx.fn.now()
        });
      } else {
        await trx('pharmacy_inventory').insert({
          drug_id: drugId,
          quantity: qty,
          batch_no: batchNo,
          strength,
          expiry_date: expiry,
          unit_cost: unitPrice,
          reorder_level: 0,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
      }

      // Store catalog (the Stock Catalog page reads store_inventory) — upsert
      // so received stock always appears in the pharmacy store catalog
      const storeRow = await trx('store_inventory')
        .where({ drug_id: drugId, batch_no: batchNo })
        .first();
      if (storeRow) {
        await trx('store_inventory').where('id', storeRow.id).update({
          quantity: trx.raw('quantity + ?', [qty]),
          unit_cost: unitPrice,
          expiry_date: expiry,
          stock_status: 'In Stock',
          last_received_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
      } else {
        await trx('store_inventory').insert({
          drug_id: drugId,
          quantity: qty,
          batch_no: batchNo,
          expiry_date: expiry,
          near_expiry_days: 90,
          unit_cost: unitPrice,
          min_level: 0,
          max_level: 0,
          stock_status: 'In Stock',
          last_received_at: trx.fn.now(),
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
      }

      receiptItems.push({
        drug_id: drugId,
        name,
        qty,
        unit,
        unitPrice,
        batchNo,
        expiry
      });

      // Original shipment line → mark received and persist keeper edits
      const orig = ent.itemId ? originalItems.find(o => o.id === Number(ent.itemId)) : null;
      if (orig) {
        await trx('pharmacy_store_incoming_items').where({ id: orig.id }).update({
          category,
          batch_no: batchNo,
          strength,
          expiry_date: expiry,
          quantity: qty,
          unit,
          unit_price: unitPrice,
          vat_rate: vatRate,
          status: 'received',
          received_by: req.user.id,
          received_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
        received += 1;
        await audit('PHARMACY_INCOMING_ITEM_RECEIVED', req.user.id, {
          module: 'Pharmacy Store',
          recordIdentifier: `${name} (${batchNo || 'no batch'})`,
          afterState: { incoming_id: id, item_id: orig.id, drug_id: drugId, quantity: qty, batch_no: batchNo, strength, expiry_date: expiry, vat_rate: vatRate },
          resource: 'pharmacy_store_incoming',
          resourceId: String(id)
        });
      } else {
        // Extra new catalog item (not part of the shipment)
        registered += 1;
        await audit('PHARMACY_STOCK_REGISTERED', req.user.id, {
          module: 'Pharmacy Store',
          recordIdentifier: `${name} (${batchNo || 'no batch'})`,
          afterState: { drug_id: drugId, quantity: qty, batch_no: batchNo, strength, expiry_date: expiry, unit_price: unitPrice, vat_rate: vatRate },
          resource: 'pharmacy_inventory',
          resourceId: String(drugId)
        });
      }
    }

    // One receipt for the full delivery (visible in Goods Receiving / ledger)
    if (receiptItems.length) {
      const receipt_no = `DEL-${id}-${Date.now()}`;
      const [receipt_id] = await trx('stock_receipts').insert({
        receipt_no,
        supplier_name: incoming.supplier_name || null,
        receipt_date: trx.fn.now(),
        remarks: `Pharmacy delivery ${incoming.delivery_note_no || ''} (${incoming.quotation_no || ''}) received into catalog — ${receiptItems.length} line(s)`,
        received_by: req.user.id || null,
      });
      await trx('stock_receipt_items').insert(
        receiptItems.map(r => ({
          receipt_id,
          drug_id: r.drug_id,
          batch_no: r.batchNo,
          expiry_date: r.expiry,
          near_expiry_days: 90,
          quantity: r.qty,
          unit_cost: r.unitPrice,
          subtotal: Math.round(r.qty * r.unitPrice * 100) / 100,
        }))
      );
    }

    const remaining = await trx('pharmacy_store_incoming_items')
      .where({ incoming_id: id }).whereNot('status', 'received').first();
    const anyReceived = await trx('pharmacy_store_incoming_items')
      .where({ incoming_id: id }).where('status', 'received').first();

    let newStatus = 'pending';
    if (remaining) newStatus = anyReceived ? 'partial' : 'pending';
    else newStatus = 'received';

    const incomingUpdate = { updated_at: trx.fn.now() };
    if (newStatus === 'received') {
      incomingUpdate.status = 'received';
      incomingUpdate.received_by = req.user.id;
      incomingUpdate.received_at = trx.fn.now();
    } else {
      incomingUpdate.status = newStatus === 'partial' ? 'partial' : 'pending';
    }
    await trx('pharmacy_store_incoming').where({ id }).update(incomingUpdate);

    if (newStatus === 'received' && incoming.quotation_id) {
      await trx('quotation_finance').where({ quotation_id: incoming.quotation_id }).update({
        status: 'paid',
        paid_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    await trx.commit();

    res.json({
      status: 'success',
      message: newStatus === 'received'
        ? 'Shipment fully received into pharmacy inventory'
        : 'Shipment partially received into pharmacy inventory',
      data: {
        incoming_id: id,
        incoming_status: newStatus,
        received,
        registered,
        finance_paid: newStatus === 'received' && !!incoming.quotation_id
      }
    });
  } catch (e) {
    await trx.rollback();
    throw e;
  }
});
