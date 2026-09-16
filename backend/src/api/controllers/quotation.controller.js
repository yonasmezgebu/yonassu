const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { audit } = require('../../config/logger');
const { sendNotification } = require('../../services/notification.service');

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
  }
  res.json({ status: 'success', data: quotations });
});

exports.getQuotationItems = catchAsync(async (req, res) => {
  const { id } = req.params;
  const items = await db('purchase_quotation_items').where({ quotation_id: id }).orderBy('line_no');
  res.json({ status: 'success', data: items });
});

exports.getPendingQuotations = catchAsync(async (req, res) => {
  const quotations = await db('purchase_quotations')
    .where({ status: 'Pending CEO Approval' })
    .orderBy('id', 'desc');
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

  res.status(201).json({ status: 'success', data: { id, quotation_no } });
});

exports.approveQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (quote.status !== 'Pending CEO Approval') throw AppError.badRequest(`Quotation is already ${quote.status}`);

  // Own the audit entry for this decision (suppress the middleware's generic write)
  res.locals.__centralAudited = true;

  if (action === 'approve') {
    await db('purchase_quotations').where({ id }).update({
      status: 'Recorded',
      ceo_approved_by: req.user.id,
      ceo_approved_at: db.fn.now(),
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
    res.json({ status: 'success', message: 'Quotation approved by CEO' });
  } else if (action === 'reject') {
    await db('purchase_quotations').where({ id }).update({
      status: 'Cancelled',
      ceo_approved_by: req.user.id,
      ceo_approved_at: db.fn.now(),
      ceo_rejection_reason: reason || 'Rejected by CEO',
      updated_at: db.fn.now()
    });
    await audit('QUOTATION_REJECTED', req.user.id, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      resource: 'quotations',
      resourceId: String(id),
      module: 'CEO',
      recordIdentifier: quote.quotation_no,
      afterState: { status: 'Cancelled', ceo_rejection_reason: reason || 'Rejected by CEO' }
    });
    await sendNotification('Purchase Manager', null, {
      type: 'QUOTATION_REJECTED',
      title: 'Quotation Rejected',
      message: `Quotation ${quote.quotation_no} was rejected by the CEO${reason ? ` — Reason: ${reason}` : ''}.`,
      related_entity_id: id,
      link: '/purchase/quotations'
    });
    res.json({ status: 'success', message: 'Quotation rejected by CEO' });
  } else {
    throw AppError.badRequest('Invalid action. Use "approve" or "reject"');
  }
});

exports.convertQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (quote.status !== 'Recorded') throw AppError.badRequest(`Quotation must be approved before converting (current status: ${quote.status})`);

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
