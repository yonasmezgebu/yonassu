const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

// Ensure table exists on first load
db.schema.hasTable('purchase_quotations').then(exists => {
  if (!exists) {
    return db.schema.createTable('purchase_quotations', table => {
      table.increments('id').primary();
      table.string('quotation_no');
      table.integer('supplier_id').unsigned().nullable();
      table.string('supplier_name');
      table.string('item_description');
      table.string('unit').defaultTo('');
      table.integer('quantity');
      table.decimal('unit_price', 15, 2);
      table.decimal('total_amount', 15, 2);
      table.date('date_agreed');
      table.string('agreed_via');
      table.text('notes');
      table.string('status').defaultTo('Pending CEO Approval');
      table.integer('recorded_by');
      table.integer('converted_to_delivery_id').nullable();
      table.decimal('vat_rate', 5, 2).defaultTo(15);
      table.decimal('vat_amount', 15, 2).defaultTo(0);
      table.integer('ceo_approved_by').unsigned().nullable();
      table.timestamp('ceo_approved_at').nullable();
      table.text('ceo_rejection_reason').nullable();
      table.timestamps(true, true);
    });
  } else {
    // Migrate: add columns if missing
    return db.schema.hasColumn('purchase_quotations', 'vat_rate').then(hasVatRate => {
      const cols = [];
      if (!hasVatRate) cols.push(table => table.decimal('vat_rate', 5, 2).defaultTo(15));
      return db.schema.hasColumn('purchase_quotations', 'vat_amount').then(hasVatAmount => {
        if (!hasVatAmount) cols.push(table => table.decimal('vat_amount', 15, 2).defaultTo(0));
        return db.schema.hasColumn('purchase_quotations', 'ceo_approved_by').then(hasCeoApproved => {
          if (!hasCeoApproved) cols.push(table => table.integer('ceo_approved_by').unsigned().nullable());
          return db.schema.hasColumn('purchase_quotations', 'ceo_approved_at').then(hasCeoAt => {
            if (!hasCeoAt) cols.push(table => table.timestamp('ceo_approved_at').nullable());
            return db.schema.hasColumn('purchase_quotations', 'ceo_rejection_reason').then(hasCeoReason => {
              if (!hasCeoReason) cols.push(table => table.text('ceo_rejection_reason').nullable());
              if (cols.length > 0) {
                return db.schema.alterTable('purchase_quotations', table => {
                  cols.forEach(fn => fn(table));
                });
              }
            });
          });
        });
      });
    });
  }
}).catch(console.error);

exports.getQuotations = catchAsync(async (req, res) => {
  const quotations = await db('purchase_quotations').orderBy('id', 'desc');
  res.json({ status: 'success', data: quotations });
});

exports.getPendingQuotations = catchAsync(async (req, res) => {
  const quotations = await db('purchase_quotations')
    .where({ status: 'Pending CEO Approval' })
    .orderBy('id', 'desc');
  res.json({ status: 'success', data: quotations });
});

exports.createQuotation = catchAsync(async (req, res) => {
  const { supplier_id, supplier_name, item_description, unit, quantity, unit_price, date_agreed, agreed_via, notes, vat_rate } = req.body;
  
  if (!supplier_name || !item_description || !quantity || !unit_price) {
    throw AppError.badRequest('Missing required fields: supplier_name, item_description, quantity, unit_price');
  }

  const costPrice = parseFloat(unit_price);
  const qty = parseFloat(quantity);
  const subtotal = qty * costPrice;
  const vatPct = parseFloat(vat_rate ?? 15);
  const vatAmt = subtotal * (vatPct / 100);
  const total_amount = subtotal + vatAmt;
  
  // Auto-generate quotation_no
  const lastQ = await db('purchase_quotations').orderBy('id', 'desc').first();
  const nextId = (lastQ?.id || 0) + 1;
  const quotation_no = `QTN-${nextId.toString().padStart(3, '0')}`;

  const [id] = await db('purchase_quotations').insert({
    quotation_no,
    supplier_id: supplier_id || null,
    supplier_name,
    item_description,
    unit: unit || '',
    quantity,
    unit_price: costPrice,
    total_amount,
    date_agreed: date_agreed || db.fn.now(),
    agreed_via: agreed_via || 'Phone',
    notes: notes || '',
    status: 'Pending CEO Approval',
    recorded_by: req.user.id,
    vat_rate: vatPct,
    vat_amount: vatAmt
  });

  res.status(201).json({ status: 'success', data: { id, quotation_no } });
});

exports.approveQuotation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body; // action: 'approve' or 'reject'

  const quote = await db('purchase_quotations').where({ id }).first();
  if (!quote) throw AppError.notFound('Quotation not found');
  if (quote.status !== 'Pending CEO Approval') throw AppError.badRequest(`Quotation is already ${quote.status}`);

  if (action === 'approve') {
    await db('purchase_quotations').where({ id }).update({
      status: 'Recorded',
      ceo_approved_by: req.user.id,
      ceo_approved_at: db.fn.now(),
      updated_at: db.fn.now()
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

  // Create a purchase order directly based on this quotation
  const [poId] = await db('purchase_orders').insert({
    po_number: `PO-${quote.quotation_no}`,
    supplier_id: quote.supplier_id || null,
    supplier_name: quote.supplier_name,
    total_amount: quote.total_amount,
    status: 'pending',
    created_by: req.user.id,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  // Create order item
  await db('purchase_order_items').insert({
    purchase_order_id: poId,
    item_description: quote.item_description,
    quantity: quote.quantity,
    unit_price: quote.unit_price,
    total_price: quote.total_amount
  });

  // Update quote status
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
