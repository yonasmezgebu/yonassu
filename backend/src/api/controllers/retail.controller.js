const { db, transaction } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const { generateOrderNumber, generateInvoiceNumber, generateReceiptNumber } = require('../../utils/orderNumber');
const { log } = require('../../services/salesAudit.service');
const vatConfigService = require('../../services/vatConfig.service');
const { recordInvoiceForOrder, recordReceiptForOrder } = require('../../services/invoiceDocument.service');
const { sendFinanceNotification, sendNotification } = require('../../services/notification.service');

const imgUrl = (file) => file ? `/uploads/products/${file.filename}` : null;

// ── Helpers ────────────────────────────────────────────────────

const getCartForUser = async (userId) => {
  return db('retail_cart_items')
    .select('retail_cart_items.*', 'retail_products.name', 'retail_products.price', 'retail_products.stock_quantity', 'retail_products.product_image', 'retail_products.sku')
    .join('retail_products', 'retail_cart_items.product_id', 'retail_products.id')
    .where('retail_cart_items.user_id', userId);
};

// =============================================================
// PUBLIC Endpoints (No login required)
// =============================================================

exports.getProducts = catchAsync(async (req, res) => {
  const { category_id, search, page = 1, limit = 30, include_inactive } = req.query;
  const offset = (page - 1) * limit;
  let query = db('retail_products as p')
    .select(
      'p.id', 'p.name', 'p.sku',
      'p.price', 'p.cost_price',
      'p.category_id', 'p.product_image', 'p.description',
      db.raw('COALESCE(gsm.quantity_in_store, p.stock_quantity) as stock_quantity'), 'p.reorder_level',
      'p.is_active', 'pc.name as category_name'
    )
    .leftJoin('retail_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('general_store_materials as gsm', 'p.sku', 'gsm.material_id');
  // Only filter active unless manager requests all
  if (!include_inactive || include_inactive === 'false') {
    query = query.where('p.is_active', true);
  }
  if (category_id) query = query.andWhere('p.category_id', category_id);
  if (search) {
    query = query.andWhere(q => {
      q.where('p.name', 'like', `%${search}%`)
       .orWhere('p.sku', 'like', `%${search}%`)
       .orWhere('p.description', 'like', `%${search}%`);
    });
  }
  const total = await query.clone().clearSelect().count('p.id as count').first();
  const products = await query.orderBy('p.name').limit(parseInt(limit)).offset(offset);
  res.json({ status: 'success', data: { products, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.count) } } });
});

exports.getProductById = catchAsync(async (req, res) => {
  const product = await db('retail_products as p')
    .select(
      'p.id', 'p.name', 'p.sku',
      'p.price', 'p.cost_price',
      'p.category_id', 'p.product_image', 'p.description',
      db.raw('COALESCE(gsm.quantity_in_store, p.stock_quantity) as stock_quantity'), 'p.reorder_level',
      'p.is_active', 'pc.name as category_name'
    )
    .leftJoin('retail_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('general_store_materials as gsm', 'p.sku', 'gsm.material_id')
    .where('p.id', req.params.id)
    .first();
  if (!product) throw new AppError('Product not found', 404);
  res.json({ status: 'success', data: product });
});

exports.getCategories = catchAsync(async (req, res) => {
  const categories = await db('retail_categories')
    .where('is_active', true)
    .orderBy('name');
  res.json({ status: 'success', data: categories });
});

exports.trackOrder = catchAsync(async (req, res) => {
  const { invoice_number } = req.body || req.query;
  if (!invoice_number) throw new AppError('Invoice number is required', 400);
  const order = await db('retail_orders').where({ invoice_number }).first();
  if (!order) throw new AppError('Order not found', 404);
  order.items = await db('retail_order_items')
    .select('retail_order_items.*', 'retail_products.name as product_name')
    .join('retail_products', 'retail_order_items.product_id', 'retail_products.id')
    .where('order_id', order.id);
  res.json({ status: 'success', data: order });
});

// =============================================================
// CUSTOMER Endpoints (Login required)
// =============================================================

exports.getCart = catchAsync(async (req, res) => {
  const items = await getCartForUser(req.user.id);
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const vatCalc = await vatConfigService.computeVatForItems(
    'retail',
    items.map((i) => ({ itemId: i.product_id, amount: parseFloat(i.price) * i.quantity }))
  );
  const tax = vatCalc.vat;
  res.json({ status: 'success', data: { items, subtotal, tax, total: subtotal + tax } });
});

exports.addToCart = catchAsync(async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const product = await db('retail_products as p')
    .select('p.*', db.raw('COALESCE(gsm.quantity_in_store, p.stock_quantity) as real_stock'))
    .leftJoin('general_store_materials as gsm', 'p.sku', 'gsm.material_id')
    .where({ 'p.id': product_id, 'p.is_active': true }).first();
  if (product) product.stock_quantity = product.real_stock;
  if (!product) throw new AppError('Product not found', 404);

  const existing = await db('retail_cart_items').where({ user_id: req.user.id, product_id }).first();
  if (existing) {
    const newQty = existing.quantity + parseInt(quantity);
    // Only enforce stock limit when stock_quantity is actually tracked (not null)
    if (product.stock_quantity !== null && product.stock_quantity !== undefined && newQty > product.stock_quantity) {
      throw new AppError(`Only ${product.stock_quantity} in stock`, 400);
    }
    await db('retail_cart_items').where({ id: existing.id }).update({ quantity: newQty });
  } else {
    if (product.stock_quantity !== null && product.stock_quantity !== undefined && parseInt(quantity) > product.stock_quantity) {
      throw new AppError(`Only ${product.stock_quantity} in stock`, 400);
    }
    await db('retail_cart_items').insert({ user_id: req.user.id, product_id, quantity: parseInt(quantity) });
  }
  const items = await getCartForUser(req.user.id);
  res.json({ status: 'success', message: 'Added to cart', data: { items } });
});

exports.updateCartItem = catchAsync(async (req, res) => {
  const { quantity } = req.body;
  const item = await db('retail_cart_items').where({ id: req.params.id, user_id: req.user.id }).first();
  if (!item) throw new AppError('Cart item not found', 404);
  const product = await db('retail_products').where({ id: item.product_id }).first();
  if (parseInt(quantity) > product.stock_quantity) throw new AppError(`Only ${product.stock_quantity} available`, 400);
  await db('retail_cart_items').where({ id: item.id }).update({ quantity: parseInt(quantity) });
  res.json({ status: 'success', message: 'Cart updated' });
});

exports.removeCartItem = catchAsync(async (req, res) => {
  await db('retail_cart_items').where({ id: req.params.id, user_id: req.user.id }).delete();
  res.json({ status: 'success', message: 'Item removed from cart' });
});

exports.clearCart = catchAsync(async (req, res) => {
  await db('retail_cart_items').where({ user_id: req.user.id }).delete();
  res.json({ status: 'success', message: 'Cart cleared' });
});

exports.placeOrder = catchAsync(async (req, res) => {
  // Multipart duplicate fields arrive as arrays (multer) — normalize to scalar.
  const scalar = (v) => (Array.isArray(v) ? v[v.length - 1] : v);
  const body = Object.fromEntries(Object.entries(req.body || {}).map(([k, v]) => [k, scalar(v)]));
  const { delivery_type, delivery_address, delivery_fee = 0, notes,
          customer_name, customer_phone, customer_email,
          payment_method, payment_ref } = body;
  const cartItems = await getCartForUser(req.user.id);
  if (cartItems.length === 0) throw new AppError('Cart is empty', 400);

  // Payment proof — either a payment reference (ID) or an uploaded screenshot
  const resolvedPaymentRef = (payment_ref || '').toString().trim() || null;
  const resolvedProofPath = req.file ? req.file.path : null;

  // Resolve customer info: prefer form fields, fall back to user profile
  const resolvedName  = customer_name  || req.user.full_name || req.user.fullName || null;
  const resolvedPhone = customer_phone || req.user.phone     || null;
  const resolvedEmail = customer_email || req.user.email     || null;

  const subtotal = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const vatCalc = await vatConfigService.computeVatForItems(
    'retail',
    cartItems.map((i) => ({ itemId: i.product_id, amount: parseFloat(i.price) * i.quantity }))
  );
  
  let vat_standard = 0, vat_exempt = 0, vat_zero_rated = 0, std_rate = 0.15;
  vatCalc.rows.forEach(r => {
    if (r.treatment === 'standard') { vat_standard += r.vat; std_rate = r.rate; }
    else if (r.treatment === 'exempt') vat_exempt += r.vat;
    else if (r.treatment === 'zero_rated') vat_zero_rated += r.vat;
  });

  const tax = vatCalc.vat;
  const total = subtotal + tax + parseFloat(delivery_fee);

  const result = await transaction(async (trx) => {
    for (const item of cartItems) {
      // Check if this product tracks stock (stock_quantity IS NOT NULL)
      const product = await trx('retail_products as p')
    .select('p.*', db.raw('COALESCE(gsm.quantity_in_store, p.stock_quantity) as real_stock'))
    .leftJoin('general_store_materials as gsm', 'p.sku', 'gsm.material_id')
    .where({ 'p.id': item.product_id }).first();
  if (product) product.stock_quantity = product.real_stock;
      if (product && product.stock_quantity !== null && product.stock_quantity !== undefined) {
        if (product.stock_quantity < item.quantity) {
          throw new AppError(`Insufficient stock for "${item.name}". Available: ${product.stock_quantity}`, 400);
        }
        await trx('retail_products')
          .where({ id: item.product_id })
          .decrement('stock_quantity', item.quantity);
      }
      // If stock_quantity is NULL, treat as unlimited — no deduction needed
    }


       // Resolve payment enum
    let resolvedPaymentEnum = 'cash';
    if (payment_method && !isNaN(payment_method)) {
      const acc = await trx('finance_accounts').where('id', payment_method).first();
      if (acc) {
        if (acc.account_type === 'Bank') resolvedPaymentEnum = 'bank_transfer';
        else if (acc.account_type === 'Mobile Wallet' || (acc.bank_provider && acc.bank_provider.toLowerCase().includes('telebirr'))) resolvedPaymentEnum = 'telebirr';
        else resolvedPaymentEnum = 'cash';
      }
    } else if (payment_method && typeof payment_method === 'string') {
      const validEnums = ['cash', 'bank_transfer', 'telebirr', 'credit'];
      if (validEnums.includes(payment_method.toLowerCase())) {
        resolvedPaymentEnum = payment_method.toLowerCase();
      }
    }

    const retail_order_number = await generateOrderNumber('RET');
    const isPaid = payment_method && (payment_ref || resolvedProofPath);

    const [orderId] = await trx('retail_orders').insert({
      customer_id: req.user.id,
      invoice_number: retail_order_number, subtotal, tax, delivery_fee, total_amount: total,
      payment_method: resolvedPaymentEnum,
      status: 'PROCESSING', payment_status: isPaid ? 'PENDING' : 'AWAITING_PAYMENT',
      delivery_type: delivery_type || 'pickup',
      delivery_address: delivery_address || null,
      notes: notes || null,
      customer_name:  resolvedName,
      customer_phone: resolvedPhone,
      customer_email: resolvedEmail,
      payment_ref: resolvedPaymentRef,
      payment_proof_path: resolvedProofPath,
      created_at: db.fn.now(), updated_at: db.fn.now()
    });

    for (const item of cartItems) {
      await trx('retail_order_items').insert({
        order_id: orderId, product_id: item.product_id,
        quantity: item.quantity, unit_price: item.price, subtotal: parseFloat(item.price) * item.quantity
      });
    }

    // NOTE: Online order placement records ONLY the pending order (retail_orders +
    // retail_order_items). It deliberately does NOT create a sales_invoice or
    // sales_receipt here — that avoids double-recording. The invoice + receipt are
    // created once at the POS waiting/collection step, where the order is recorded.

    await trx('retail_cart_items').where({ user_id: req.user.id }).delete();
    return { orderId, invoice_number: retail_order_number, total_amount: total };
  });

  // Notify Sales Manager of new online order
  try {
    await sendNotification('Sales Manager', null, {
      title: '🛒 New Online Order',
      message: `New online order #${result.invoice_number} — ETB ${Number(result.total_amount || 0).toLocaleString()}`,
      type: 'info',
      link: '/sales/pos'
    });
  } catch (e) { console.error('retail-order emit error:', e.message); }

  // Submit to Finance Live Income for verification
  if (payment_method && (resolvedPaymentRef || resolvedProofPath)) {
    // Resolve the human-readable account name for Finance to identify the payment channel
    let resolvedAccountName = String(payment_method);
    try {
      const acc = await db('finance_accounts').where('id', payment_method).first();
      if (acc) resolvedAccountName = `${acc.account_type} - ${acc.account_name}${acc.account_number ? ` (${acc.account_number})` : ''}`;
    } catch (_) {}

    const details = {
      order_id: result.orderId,
      order_invoice: result.invoice_number,
      paymentMethod: resolvedAccountName,
      paymentRef: resolvedPaymentRef || null,
      receivedFrom: resolvedName || 'Customer',
      phone: resolvedPhone || null,
      email: resolvedEmail || null,
    };
    if (resolvedProofPath && req.file) {
      details.paymentScreenshot = req.file.filename;
    }

    await db('finance_income_submissions').insert({
      department: 'Retail',
      submitted_by: resolvedName || 'Customer Portal',
      amount: total,
      reference_no: resolvedPaymentRef || (req.file ? req.file.filename : result.invoice_number),
      description: `Online Retail Order ${result.invoice_number} — ${resolvedName || 'Customer'} via ${resolvedAccountName}`,
      status: 'Pending',
      manual_details: JSON.stringify(details),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    }).catch(err => console.error('Failed to submit retail to finance:', err.message));

    sendFinanceNotification({
      title: '🛒 New Online Order — Finance Verification',
      message: `ETB ${Number(total || 0).toLocaleString()} — Retail Order ${result.invoice_number} (${resolvedName || 'Customer'}, ${resolvedAccountName}) awaiting verification.`,
      type: 'finance',
      link: '/finance/pharmacy-sales?tab=list',
      related_entity_id: result.orderId
    }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
  }

  res.status(201).json({ status: 'success', message: 'Order placed!', data: result });
});

exports.getMyOrders = catchAsync(async (req, res) => {
  const orders = await db('retail_orders').where({ customer_id: req.user.id })
    .where(function() {
      this.where('is_deleted_by_customer', false).orWhereNull('is_deleted_by_customer');
    })
    .orderBy('created_at', 'desc');
  for (const order of orders) {
    order.items = await db('retail_order_items')
      .select('retail_order_items.*', 'retail_products.name as product_name', 'retail_products.product_image')
      .join('retail_products', 'retail_order_items.product_id', 'retail_products.id')
      .where('order_id', order.id);
  }
  res.json({ status: 'success', data: orders });
});

// =============================================================
// CASHIER Endpoints
// =============================================================

exports.openShift = catchAsync(async (req, res) => {
  const { opening_float, shift_type } = req.body;
  const existing = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (existing) return res.status(400).json({ status: 'error', message: 'You already have an open shift' });

  const [id] = await db('retail_shifts').insert({
    cashier_id: req.user.id, shift_type: shift_type || 'morning',
    opening_float: parseFloat(opening_float || 0), status: 'OPEN',
    opened_at: db.fn.now(), created_at: db.fn.now(), updated_at: db.fn.now()
  });
  const shift = await db('retail_shifts').where({ id }).first();
  log(req, 'Shift Opened', `Shift #${id}`, null, shift);
  res.status(201).json({ status: 'success', data: shift });
});

exports.getCurrentShift = catchAsync(async (req, res) => {
  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  res.json({ status: 'success', data: shift || null });
});

exports.getShiftHistory = catchAsync(async (req, res) => {
  const shifts = await db('retail_shifts').where({ cashier_id: req.user.id }).orderBy('created_at', 'desc').limit(20);
  res.json({ status: 'success', data: shifts });
});

exports.posCheckout = catchAsync(async (req, res) => {
  const { items, payment_method, payment_ref, discount_percent = 0, customer_phone } = req.body;
  if (!items || items.length === 0) throw new AppError('Cart items are required', 400);

  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) throw new AppError('No open shift. Open a shift first.', 400);

  if (parseFloat(discount_percent) > 5) throw new AppError('Discounts above 5% require manager approval', 400);

  const result = await transaction(async (trx) => {
    let subtotal = 0;
    const resolvedItems = [];
    const vatLines = [];

    for (const item of items) {
      const product = await trx('retail_products').where({ id: item.product_id }).forUpdate().first();
      if (!product) throw new AppError(`Product ID ${item.product_id} not found`, 404);
      if (product.stock_quantity < item.quantity) throw new AppError(`Insufficient stock for "${product.name}"`, 400);
      const lineAmt = product.price * item.quantity;
      subtotal += lineAmt;
      vatLines.push({ itemId: item.product_id, amount: lineAmt });
      resolvedItems.push({ product, quantity: item.quantity });
    }

    const vatCalc = await vatConfigService.computeVatForItems('retail', vatLines);
    const discountAmount = subtotal * (parseFloat(discount_percent) / 100);
    const finalTotal = subtotal + vatCalc.vat - discountAmount;
    const invoice_number = await generateOrderNumber('POS');

    const [txId] = await trx('retail_transactions').insert({
      shift_id: shift.id, invoice_number, subtotal, total_amount: finalTotal,
      payment_method, payment_ref: payment_ref || null,
      discount_percent: parseFloat(discount_percent),
      discount_amount: discountAmount, customer_phone: customer_phone || null,
      created_at: db.fn.now()
    });

    for (const { product, quantity } of resolvedItems) {
      const updated = await trx('retail_products')
        .where({ id: product.id }).where('stock_quantity', '>=', quantity)
        .decrement('stock_quantity', quantity);
      if (!updated) throw new AppError(`Race condition for "${product.name}"`, 409);
    }

    // Invoice is recorded immediately when the sale is made; the receipt is
    // recorded at the same time because payment is collected at the counter.
    const invoiceLines = resolvedItems.map((ri, i) => ({
      itemId: ri.product.id,
      name: ri.product.name,
      qty: ri.quantity,
      unitPrice: ri.product.price,
      costPrice: parseFloat(ri.product.cost_price || 0),
      amount: ri.product.price * ri.quantity,
      rate: vatCalc.rows[i].rate,
      treatment: vatCalc.rows[i].treatment
    }));
    if (discountAmount > 0) {
      invoiceLines.push({ itemId: 0, name: 'Discount', qty: 1, unitPrice: -discountAmount, amount: -discountAmount, rate: 0, treatment: 'zero_rated' });
    }
    const invNo = await generateInvoiceNumber();
    const invRes = await recordInvoiceForOrder(trx, {
      source: 'retail',
      saleId: txId,
      saleType: 'walk_in',
      invoiceNo: invNo,
      customer: null,
      customerTin: null,
      lines: invoiceLines,
      createdBy: req.user.full_name || req.user.fullName || 'POS Cashier'
    });
    await recordReceiptForOrder(trx, {
      invoiceId: invRes.invoiceId,
      amountPaid: finalTotal,
      paymentMethod: payment_method,
      paymentReference: payment_ref || null,
      receivedBy: req.user.full_name || req.user.fullName || 'POS Cashier'
    });

    return { txId, invoice_number, invoice_no: invNo, subtotal, vat_amount: vatCalc.vat, total_amount: finalTotal, discount_amount: discountAmount, resolvedItems };
  });

  // Update shift totals
  const payments = { cash: 0, telebirr: 0, bank_transfer: 0, credit: 0 };
  payments[payment_method] = parseFloat(result.total_amount);
  await db('retail_shifts').where({ id: shift.id }).increment({
    total_sales: result.total_amount, transaction_count: 1,
    cash_collected: payments.cash, telebirr_collected: payments.telebirr,
    transfer_collected: payments.bank_transfer, credit_collected: payments.credit
  });

  log(req, 'POS Sale Completed', `POS Sale ${result.invoice_number}`, null, {
    invoice_number: result.invoice_number,
    total_amount: result.total_amount,
    discount_amount: result.discount_amount,
    payment_method,
    customer_phone: customer_phone || null,
    items: result.resolvedItems.map(i => ({ product_id: i.product.id, name: i.product.name, quantity: i.quantity, unit_price: i.product.price })),
    shift_id: shift.id
  });
  res.status(201).json({ status: 'success', message: 'Sale completed!', data: result });
});

exports.closeShift = catchAsync(async (req, res) => {
  const { physical_cash_counted, difference_reason } = req.body;
  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) throw new AppError('No open shift found', 404);

  const expectedCash = parseFloat(shift.opening_float) + parseFloat(shift.cash_collected);
  const counted = parseFloat(physical_cash_counted || 0);
  const difference = counted - expectedCash;

  await db('retail_shifts').where({ id: shift.id }).update({
    physical_cash_counted: counted, difference_amount: difference,
    difference_reason: difference_reason || null,
    status: 'CLOSED', closed_at: db.fn.now(), updated_at: db.fn.now()
  });

  log(req, 'Shift Closed', `Shift #${shift.id}`, shift, {
    ...shift,
    physical_cash_counted: counted,
    expected_cash: expectedCash,
    difference_amount: difference,
    difference_reason: difference_reason || null,
    status: 'CLOSED',
    cash_to_handover: shift.cash_collected
  });
  res.json({ status: 'success', message: 'Shift closed', data: { opening_float: shift.opening_float, cash_collected: shift.cash_collected, expected_cash: expectedCash, physical_cash_counted: counted, difference, cash_to_handover: shift.cash_collected } });
});

exports.getTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) return res.json({ status: 'success', data: { transactions: [] } });
  const transactions = await db('retail_transactions').where({ shift_id: shift.id }).orderBy('created_at', 'desc');
  res.json({ status: 'success', data: { transactions } });
});

// =============================================================
// INVENTORY / STORE KEEPER Endpoints
// =============================================================

exports.getInventory = catchAsync(async (req, res) => {
  const { search, category_id, low_stock } = req.query;
  let query = db('retail_products as rp')
    .select(
      'rp.id', 'rp.name', 'rp.sku', 'rp.price', 'rp.cost_price', 'rp.category_id',
      'rp.stock_quantity', 'rp.reorder_level', 'rp.expiry_date',
      'rp.product_image', 'rp.is_active', 'rp.created_at', 'rp.updated_at',
      'rc.name as category_name'
    )
    .leftJoin('retail_categories as rc', 'rp.category_id', 'rc.id');
  if (search) query = query.where(q => q.where('rp.name', 'like', `%${search}%`).orWhere('rp.sku', 'like', `%${search}%`));
  if (category_id) query = query.where('rp.category_id', category_id);
  if (low_stock === 'true') query = query.whereRaw('rp.stock_quantity <= rp.reorder_level');
  const products = await query.orderBy('rp.name');
  res.json({ status: 'success', data: products });
});

exports.updateStock = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { quantity, operation = 'set' } = req.body;
  const product = await db('retail_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  let newQty;
  if (operation === 'add') newQty = product.stock_quantity + parseInt(quantity);
  else if (operation === 'subtract') newQty = Math.max(0, product.stock_quantity - parseInt(quantity));
  else newQty = parseInt(quantity);

  await db('retail_products').where({ id }).update({ stock_quantity: newQty, updated_at: db.fn.now() });
  await db('products').where({ sku: product.sku, business_unit: 'retail' }).update({ stock_quantity: newQty });
  log(req, 'Stock Updated', `Product #${id} — ${product.name}`, { ...product, stock_quantity: product.stock_quantity }, { ...product, stock_quantity: newQty, operation });
  res.json({ status: 'success', message: `Stock updated to ${newQty}`, data: { id, new_quantity: newQty, previous: product.stock_quantity } });
});

exports.createProduct = catchAsync(async (req, res) => {
  const { name, sku, category_id, description, price, cost_price, stock_quantity, reorder_level, expiry_date } = req.body;
  if (!name || !sku || !price) throw new AppError('Name, SKU, and price are required', 400);
  const existing = await db('retail_products').where({ sku }).first();
  if (existing) throw new AppError('SKU already exists', 400);
  const [id] = await db('retail_products').insert({
    name, sku, category_id: category_id || null, description: description || null,
    price: parseFloat(price), cost_price: parseFloat(cost_price || 0),
    stock_quantity: parseInt(stock_quantity || 0), reorder_level: parseInt(reorder_level || 10),
    expiry_date: expiry_date || null,
    product_image: imgUrl(req.file), is_active: true,
    created_at: db.fn.now(), updated_at: db.fn.now()
  });
  // Sync to global products table (optional — skip if it fails due to schema constraints)
  try {
    const syncData = {
      name, sku, description: description || null,
      selling_price: parseFloat(price), unit_id: 1,
      stock_quantity: parseInt(stock_quantity || 0), reorder_level: parseInt(reorder_level || 10),
      expiry_date: expiry_date || null,
      product_image: imgUrl(req.file), business_unit: 'retail', is_active: true,
      created_at: db.fn.now()
    };
    if (category_id) syncData.category_id = category_id;
    await db('products').insert(syncData);
  } catch (_) { /* sync is best-effort */ }
  const product = await db('retail_products')
    .select('id', 'name', 'sku', 'price', 'category_id', 'stock_quantity', 'reorder_level', 'expiry_date', 'product_image', 'is_active', 'created_at', 'updated_at')
    .where({ id }).first();
  log(req, 'Product Created', `Product #${id} — ${product.name}`, null, product);
  res.status(201).json({ status: 'success', message: 'Product created', data: product });
});

exports.updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const product = await db('retail_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  // Helper: parse a decimal — returns null if empty/invalid
  const toDecimal = (v) => {
    if (v === undefined || v === '' || v === null) return undefined;
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  };
  // Helper: parse an integer — returns null if empty/invalid
  const toInt = (v) => {
    if (v === undefined || v === '' || v === null) return undefined;
    const n = parseInt(v);
    return isNaN(n) ? undefined : n;
  };

  const updates = {};
  // String fields — only set if non-empty
  ['name', 'sku', 'description'].forEach(k => {
    if (req.body[k] !== undefined && req.body[k] !== '') updates[k] = req.body[k];
  });
  // Nullable fields — allow empty to set null
  if (req.body.category_id !== undefined) updates.category_id = req.body.category_id || null;
  if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

  // Numeric fields — parse and skip if invalid
  const price = toDecimal(req.body.price);
  if (price !== undefined) updates.price = price;

  const cost_price = toDecimal(req.body.cost_price);
  if (cost_price !== undefined) updates.cost_price = cost_price;

  const reorder_level = toInt(req.body.reorder_level);
  if (reorder_level !== undefined) updates.reorder_level = reorder_level;

  if (req.file) updates.product_image = imgUrl(req.file);

  if (Object.keys(updates).length === 0) throw new AppError('No fields to update', 400);
  updates.updated_at = db.fn.now();
  await db('retail_products').where({ id }).update(updates);

  // Sync to global products table (best-effort)
  const prodUpdates = {};
  if (updates.name !== undefined) prodUpdates.name = updates.name;
  if (updates.sku !== undefined) prodUpdates.sku = updates.sku;
  if (updates.category_id !== undefined) prodUpdates.category_id = updates.category_id;
  if (updates.description !== undefined) prodUpdates.description = updates.description;
  if (updates.price !== undefined) prodUpdates.selling_price = updates.price;
  if (updates.reorder_level !== undefined) prodUpdates.reorder_level = updates.reorder_level;
  if (updates.is_active !== undefined) prodUpdates.is_active = updates.is_active;
  if (req.file) prodUpdates.product_image = imgUrl(req.file);
  if (Object.keys(prodUpdates).length > 0) {
    try { await db('products').where({ sku: product.sku, business_unit: 'retail' }).update(prodUpdates); } catch (_) {}
  }

  const updated = await db('retail_products')
    .select('id', 'name', 'sku', 'price', 'category_id', 'stock_quantity', 'reorder_level', 'expiry_date', 'product_image', 'is_active', 'created_at', 'updated_at')
    .where({ id }).first();
  log(req, 'Product Updated', `Product #${id} — ${product.name}`, product, updated);
  res.json({ status: 'success', message: 'Product updated', data: updated });
});

exports.deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const product = await db('retail_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  try {
    await db('retail_products').where({ id }).del();
    try { await db('products').where({ sku: product.sku, business_unit: 'retail' }).del(); } catch (_) {}
    log(req, 'Product Deleted', `Product #${id} — ${product.name}`, product, null);
    res.json({ status: 'success', message: 'Product deleted' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED' || err.message.includes('foreign key constraint fails')) {
      throw new AppError('Cannot delete product because it has associated sales or orders. Please deactivate it or edit it instead.', 400);
    }
    throw err;
  }
});


// =============================================================
// RETAIL MANAGER Endpoints
// =============================================================

exports.getManagerDashboard = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const transactions = await db('retail_transactions').whereRaw(`(created_at)::date = ?`, [today]);
  const total = transactions.reduce((s, t) => s + parseFloat(t.total_amount), 0);
  const byMethod = { cash: 0, bank_transfer: 0, telebirr: 0, credit: 0 };
  transactions.forEach(t => { byMethod[t.payment_method] = (byMethod[t.payment_method] || 0) + parseFloat(t.total_amount); });
  const openShifts = await db('retail_shifts').where({ status: 'OPEN' }).count('id as count').first();
  const lowStock = await db('retail_products').whereRaw('stock_quantity <= reorder_level').where('is_active', true).count('id as count').first();
  const criticalStock = await db('retail_products').whereRaw('stock_quantity <= reorder_level * 0.5').where('is_active', true).count('id as count').first();

  res.json({ status: 'success', data: {
    totalSales: total, transactionCount: transactions.length, cashSales: byMethod.cash,
    creditSales: byMethod.credit, transferSales: byMethod.bank_transfer + byMethod.telebirr,
    avgTransaction: transactions.length > 0 ? total / transactions.length : 0,
    openShifts: parseInt(openShifts.count), lowStockItems: parseInt(lowStock.count), criticalStockItems: parseInt(criticalStock.count)
  }});
});

exports.getSalesTrends = catchAsync(async (req, res) => {
  const { period = 'daily' } = req.query;
  let groupBy, dateFormat;
  if (period === 'weekly') { groupBy = db.raw('to_char(created_at, \'IYYY-WIYYY\')'); dateFormat = 'YYYY-WW'; }
  else if (period === 'monthly') { groupBy = db.raw('to_char(created_at, \'YYYY-MM\')'); dateFormat = 'YYYY-MM'; }
  else { groupBy = db.raw('(created_at)::date'); dateFormat = 'YYYY-MM-DD'; }

  const trends = await db('retail_transactions')
    .select(groupBy, db.raw('SUM(total_amount) as revenue'), db.raw('COUNT(*) as count'))
    .groupBy(groupBy).orderBy('created_at', 'desc').limit(30);
  res.json({ status: 'success', data: { trends, period, dateFormat } });
});

exports.getCashierActivity = catchAsync(async (req, res) => {
  const cashiers = await db('retail_shifts as rs')
    .select('rs.*', 'u.full_name as cashier_name')
    .leftJoin('users as u', 'rs.cashier_id', 'u.id')
    .whereRaw('(rs.created_at)::date = CURRENT_DATE')
    .orderBy('rs.created_at', 'desc');
  res.json({ status: 'success', data: cashiers });
});

exports.approveDiscount = catchAsync(async (req, res) => {
  const { transaction_id, approval_code } = req.body;
  if (approval_code !== 'MGR-APPROVE') throw new AppError('Invalid approval code', 400);
  const tx = await db('retail_transactions').where({ id: transaction_id }).first();
  log(req, 'Discount Approved', `Transaction ${tx ? tx.invoice_number : transaction_id}`, tx, { ...tx, discount_approved: true, approval_code });
  res.json({ status: 'success', message: 'Discount approved' });
});

exports.approveRefund = catchAsync(async (req, res) => {
  const { transaction_id, amount, reason } = req.body;
  const tx = await db('retail_transactions').where({ id: transaction_id }).first();
  if (!tx) throw new AppError('Transaction not found', 404);
  log(req, 'Refund Approved', `Transaction ${tx.invoice_number}`, tx, { ...tx, refund_amount: amount, refund_reason: reason, refund_approved: true });
  res.json({ status: 'success', message: `Refund of ${amount} ETB approved for transaction ${tx.invoice_number}` });
});

exports.verifyShift = catchAsync(async (req, res) => {
  const { shift_id, verified } = req.body;
  const status = verified ? 'VERIFIED' : 'CLOSED';
  const shift = await db('retail_shifts').where({ id: shift_id }).first();
  await db('retail_shifts').where({ id: shift_id }).update({ status, updated_at: db.fn.now() });
  log(req, `Shift ${verified ? 'Verified' : 'Rejected'}`, `Shift #${shift_id}`, shift, { ...shift, status });
  res.json({ status: 'success', message: `Shift ${verified ? 'verified' : 'rejected'}` });
});

// =============================================================
// FINANCE Endpoints
// =============================================================

exports.getReconciliation = catchAsync(async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const shifts = await db('retail_shifts').whereRaw(`(created_at)::date = ?`, [targetDate]).where('status', '!=', 'OPEN');
  const transactions = await db('retail_transactions').whereRaw(`(created_at)::date = ?`, [targetDate]);
  const totalSystem = transactions.reduce((s, t) => s + parseFloat(t.total_amount), 0);
  const byMethod = { cash: 0, bank_transfer: 0, telebirr: 0, credit: 0 };
  transactions.forEach(t => { byMethod[t.payment_method] = (byMethod[t.payment_method] || 0) + parseFloat(t.total_amount); });
  res.json({ status: 'success', data: {
    date: targetDate, totalSystemSales: totalSystem, byMethod,
    shifts, transactionCount: transactions.length,
    totalCashCollected: shifts.reduce((s, sh) => s + parseFloat(sh.cash_collected), 0),
    totalCashCounted: shifts.reduce((s, sh) => s + parseFloat(sh.physical_cash_counted || 0), 0),
    totalDifference: shifts.reduce((s, sh) => s + parseFloat(sh.difference_amount || 0), 0)
  }});
});

exports.recordDeposit = catchAsync(async (req, res) => {
  const { amount, bank_account, reference, notes } = req.body;
  log(req, 'Bank Deposit Recorded', `Deposit ${reference || '—'}`, null, { amount, bank_account, reference, notes, recorded_by: req.user && (req.user.fullName || req.user.full_name || req.user.username) });
  res.status(201).json({ status: 'success', message: `Deposit of ${amount} ETB recorded to ${bank_account}`, data: { amount, bank_account, reference, notes, recorded_at: new Date().toISOString() } });
});

exports.getAuditLog = catchAsync(async (req, res) => {
  const logs = await db('retail_transactions')
    .select('retail_transactions.*', 'u.full_name as cashier_name')
    .leftJoin('users as u', 'retail_transactions.cashier_id', 'u.id')
    .orderBy('retail_transactions.created_at', 'desc').limit(100);
  res.json({ status: 'success', data: logs });
});

exports.approveVoid = catchAsync(async (req, res) => {
  const { transaction_id, reason } = req.body;
  const tx = await db('retail_transactions').where({ id: transaction_id }).first();
  if (!tx) throw new AppError('Transaction not found', 404);
  log(req, 'Transaction Voided', `Transaction ${tx.invoice_number}`, tx, { ...tx, status: 'voided', void_reason: reason || null });
  res.json({ status: 'success', message: `Transaction ${tx.invoice_number} voided. Reason: ${reason || 'No reason given'}` });
});

// =============================================================
// ADMIN: Products & Categories management
// =============================================================

exports.createCategory = catchAsync(async (req, res) => {
  const { name, description, icon_class } = req.body;
  if (!name) throw new AppError('Category name is required', 400);
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const [id] = await db('retail_categories').insert({ name, slug, description: description || null, icon_class: icon_class || null });
  const cat = await db('retail_categories').where({ id }).first();
  log(req, 'Category Created', `Category #${id} — ${cat.name}`, null, cat);
  res.status(201).json({ status: 'success', data: cat });
});


exports.checkoutDirect = catchAsync(async (req, res) => {
  const { sale_type, subtotal, discount, total_amount, payment_method, customer_id, received_by, sender_name, sender_phone, transaction_id, items } = req.body;
  if (!items || !items.length) throw new AppError('Cart is empty', 400);

  // Generate unique sale number from retail_transactions (NOT printing_orders)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = 'RET';
  const lastSale = await db('retail_transactions')
    .where('invoice_number', 'like', `${prefix}-${dateStr}-%`)
    .orderBy('invoice_number', 'desc')
    .first();
  let counter = 1;
  if (lastSale) {
    const parts = lastSale.invoice_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) counter = lastSeq + 1;
  }
  const sale_no = `${prefix}-${dateStr}-${counter.toString().padStart(4, '0')}`;

  await db.transaction(async (trx) => {
    const [transactionId] = await trx('retail_transactions').insert({
      invoice_number: sale_no, shift_id: null, sale_type: sale_type || 'WALK-IN', subtotal, discount_amount: discount || 0, total_amount, payment_method,
      customer_phone: sender_phone, received_by, sender_name, sender_phone, transaction_id, is_submitted: false
    });

    for (const item of items) {
      await trx('retail_transaction_items').insert({
        transaction_id: transactionId, product_id: item.product_id, quantity: item.quantity,
        unit_price: item.unit_price, line_total: item.line_total
      });
      await trx('retail_products').where({ id: item.product_id }).decrement('stock_quantity', item.quantity);
    }

    // Invoice + receipt are recorded at checkout (payment is collected here).
    const vatCalc = await vatConfigService.computeVatForItems('retail', items.map((i) => ({ itemId: i.product_id, amount: i.line_total })));
    const invoiceLines = [];
    for (let idx = 0; idx < items.length; idx++) {
      const i = items[idx];
      const r = vatCalc.rows[idx];
      const prod = await trx('retail_products').where({ id: i.product_id }).first();
      invoiceLines.push({
        itemId: i.product_id,
        name: i.name || i.product_name || `Product #${i.product_id}`,
        qty: i.quantity,
        unitPrice: i.unit_price,
        costPrice: prod ? parseFloat(prod.cost_price || 0) : null,
        amount: i.line_total,
        rate: r.rate,
        treatment: r.treatment
      });
    }
    if (discount) {
      invoiceLines.push({ itemId: 0, name: 'Discount', qty: 1, unitPrice: -discount, amount: -discount, rate: 0, treatment: 'zero_rated' });
    }
    const invNo = await generateInvoiceNumber();
    const invRes = await recordInvoiceForOrder(trx, {
      source: 'retail',
      saleId: transactionId,
      saleType: String(sale_type || 'WALK-IN').toUpperCase() === 'ONLINE' ? 'online' : 'walk_in',
      invoiceNo: invNo,
      customer: sender_name || null,
      customerTin: null,
      lines: invoiceLines,
      createdBy: received_by || req.user.full_name || req.user.fullName || 'Retail Cashier'
    });
    await recordReceiptForOrder(trx, {
      invoiceId: invRes.invoiceId,
      amountPaid: total_amount,
      paymentMethod: payment_method,
      paymentReference: transaction_id || null,
      receivedBy: received_by || req.user.full_name || req.user.fullName || 'Retail Cashier'
    });
  });

  log(req, 'Retail Sale Completed', `Retail Sale ${sale_no}`, null, {
    sale_no, sale_type: sale_type || 'WALK-IN', subtotal, discount: discount || 0, total_amount,
    payment_method, customer_id: customer_id || null, received_by, sender_name: sender_name || null, sender_phone: sender_phone || null,
    transaction_id: transaction_id || null, items
  });
  res.status(201).json({ status: 'success', data: { sale_no } });
});

exports.getRetailSales = catchAsync(async (req, res) => {
  const sales = await db('retail_transactions').orderBy('created_at', 'desc').limit(100);
  res.json({ status: 'success', data: sales });
});

exports.getSubmissionDetails = catchAsync(async (req, res) => {
  const { ref } = req.params;
  const transactions = await db('retail_transactions').where({ submission_ref: ref }).orderBy('created_at', 'asc');
  
  // also fetch items
  for(let t of transactions) {
    t.items = await db('retail_transaction_items as rti')
      .join('retail_products as p', 'rti.product_id', 'p.id')
      .where('rti.transaction_id', t.id)
      .select('p.name', 'rti.quantity', 'rti.unit_price', 'rti.line_total');
  }

  res.json({ status: 'success', data: transactions });
});

exports.submitDailyRetail = catchAsync(async (req, res) => {
  const unsubmitted = await db('retail_transactions').where({ is_submitted: false });
  if (unsubmitted.length === 0) throw new AppError('No unsubmitted retail sales to submit', 400);

  const totalAmount = unsubmitted.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const cashierName = req.user.full_name || req.user.name || req.user.email || 'Retail Cashier';
  const dateStr = new Date().toLocaleDateString('en-GB');
  const sub_no = 'RET-SUB-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString().slice(-4);
  const { generateInvoiceNumber } = require('../../utils/orderNumber');
  const { createSalesInvoice, createSalesReceipt } = require('../../services/invoiceDocument.service');

  await db.transaction(async (trx) => {
    // 1. One audit trail entry for the whole batch
    await trx('retail_audit_trail').insert({
      cashier_id: req.user.id,
      action: 'Submitted to Finance',
      recipient: 'Finance Dept',
      amount: totalAmount,
      notes: `${unsubmitted.length} transaction(s) — ${dateStr} — Ref: ${sub_no}`
    });

    // 2. ONE finance_income_submissions row PER transaction
    //    (Finance sees each separately with exact payment method + amount)
    for (const txn of unsubmitted) {
      const payMethod = txn.payment_method || 'Cash';
      const txnRef = txn.invoice_number || `RET-${txn.id}`;

      await trx('finance_income_submissions').insert({
        reference_no: txnRef,
        department: 'Retail',
        submitted_by: cashierName,
        amount: Number(txn.total_amount),
        status: 'Pending',
        description: `Retail ${txn.sale_type || 'WALK-IN'} sale — ${txnRef} — ${payMethod} — ${dateStr}`,
        manual_details: JSON.stringify({
          batch_ref: sub_no,
          payment_method: payMethod,
          sale_type: txn.sale_type || 'WALK-IN',
          invoice_number: txnRef,
          transaction_id: txn.transaction_id || null,
          customer_phone: txn.customer_phone || null,
          sender_name: txn.sender_name || null
        }),
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });

      // 3. Ensure sales_invoice + sales_receipt exist for this transaction
      //    so it appears in Receipts and VAT & Profit pages.
      const existingInvoice = await trx('sales_invoices')
        .where({ source: 'retail', sale_id: txn.id })
        .andWhereNot('status', 'cancelled')
        .first();

      if (!existingInvoice) {
        // Fetch line items
        const txnItems = await trx('retail_transaction_items as rti')
          .join('retail_products as p', 'rti.product_id', 'p.id')
          .where('rti.transaction_id', txn.id)
          .select('p.id as product_id', 'p.name', 'p.cost_price',
                  'rti.quantity', 'rti.unit_price', 'rti.line_total');

        const lines = txnItems.length > 0
          ? txnItems.map(it => ({
              itemId: it.product_id,
              name: it.name,
              qty: Number(it.quantity),
              unitPrice: Number(it.unit_price),
              costPrice: it.cost_price != null ? Number(it.cost_price) : null,
              amount: Number(it.line_total)
            }))
          : [{
              itemId: 0,
              name: `Retail Sale ${txn.invoice_number || txn.id}`,
              qty: 1,
              unitPrice: Number(txn.subtotal || txn.total_amount),
              costPrice: null,
              amount: Number(txn.subtotal || txn.total_amount)
            }];

        const invNo = txn.invoice_number || await generateInvoiceNumber();
        const invResult = await createSalesInvoice(trx, {
          source: 'retail',
          saleId: txn.id,
          saleType: String(txn.sale_type || 'WALK-IN').toUpperCase() === 'ONLINE' ? 'online' : 'walk_in',
          invoiceNo: invNo,
          customer: txn.sender_name || txn.customer_name || null,
          customerTin: null,
          lines,
          createdBy: cashierName,
          date: txn.created_at
        });

        await createSalesReceipt(trx, {
          invoiceId: invResult.invoiceId,
          amountPaid: Number(txn.total_amount),
          paymentMethod: payMethod,
          paymentReference: txn.transaction_id || null,
          receivedBy: cashierName
        });
      }
    }

    sendFinanceNotification({
      title: 'New Income Submission',
      message: `ETB ${Number(totalAmount || 0).toLocaleString()} Retail daily sales (${unsubmitted.length} txns) submitted for verification (Ref: ${sub_no}).`,
      type: 'finance',
      link: '/finance/pharmacy-sales?tab=list',
      related_entity_id: sub_no
    }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

    // 4. Mark all as submitted
    await trx('retail_transactions').where({ is_submitted: false }).update({
      is_submitted: true,
      submission_ref: sub_no
    });
  });

  log(req, 'Daily Sales Submitted to Finance', `Daily Submission ${sub_no}`, null, {
    sub_no, totalTransactions: unsubmitted.length, totalAmount, date: dateStr,
    transactions: unsubmitted.map(t => ({ id: t.id, invoice_number: t.invoice_number, payment_method: t.payment_method, total_amount: t.total_amount }))
  });
  res.json({
    status: 'success',
    message: 'Submitted successfully to Finance',
    totalTransactions: unsubmitted.length,
    totalAmount
  });
});

exports.getRetailAuditTrail = catchAsync(async (req, res) => {
  const trail = await db('retail_audit_trail as rt')
    .leftJoin('users as u', 'rt.cashier_id', 'u.id')
    .select('rt.*', 'u.full_name as cashier_name')
    .orderBy('rt.created_at', 'desc');
  res.json({ status: 'success', data: trail });
});

exports.getPendingRetailOrders = catchAsync(async (req, res) => {
  const orders = await db('retail_orders as ro')
    .leftJoin('users as c', 'ro.customer_id', 'c.id')
    .select(
      'ro.*',
      // Use stored snapshot first, fall back to live user profile
      db.raw('COALESCE(ro.customer_name,  c.full_name) as customer_name'),
      db.raw('COALESCE(ro.customer_phone, c.phone)     as customer_phone'),
      db.raw('COALESCE(ro.customer_email, c.email)     as customer_email')
    )
    .whereIn('ro.status', ['PROCESSING', 'PENDING'])
    .orderBy('ro.created_at', 'desc');

  for (const order of orders) {
    order.items = await db('retail_order_items as roi')
      .join('retail_products as p', 'roi.product_id', 'p.id')
      .select('roi.*', 'p.name as product_name', 'p.product_image')
      .where('roi.order_id', order.id);
  }

  res.json({ status: 'success', data: orders });
});


exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['PROCESSING', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!allowed.includes(status)) throw new AppError(`Invalid status. Must be one of: ${allowed.join(', ')}`, 400);
  const updated = await db('retail_orders').where({ id }).update({ status, updated_at: db.fn.now() });
  if (!updated) throw new AppError('Order not found', 404);
  
  if (status === 'CANCELLED') {
    // Cancel invoice and receipt
    const inv = await db('sales_invoices').where({ sale_id: id, source: 'retail' }).first();
    if (inv) {
      await db('sales_invoices').where({ id: inv.id }).update({ status: 'cancelled' });
      await db('sales_receipts').where({ invoice_id: inv.id }).update({ status: 'cancelled' });
    }
  }
  
  const order = await db('retail_orders').where({ id }).first();
  log(req, 'Order Status Updated', `Order #${id}`, order, { ...order, status });
  res.json({ status: 'success', message: 'Order status updated' });
});


// ── Branches (Retail) ────────────────────────────────────────────────────────
exports.getBranches = catchAsync(async (req, res) => {
  const branches = await db('retail_branches').orderBy('id', 'asc');
  res.json({ status: 'success', data: branches });
});

exports.createBranch = catchAsync(async (req, res) => {
  const [id] = await db('retail_branches').insert(req.body);
  const branch = await db('retail_branches').where({ id }).first();
  log(req, 'Branch Created', `Branch #${id} — ${branch.name}`, null, branch);
  res.status(201).json({ status: 'success', data: branch });
});

exports.updateBranch = catchAsync(async (req, res) => {
  const before = await db('retail_branches').where({ id: req.params.id }).first();
  await db('retail_branches').where({ id: req.params.id }).update(req.body);
  const branch = await db('retail_branches').where({ id: req.params.id }).first();
  log(req, 'Branch Updated', `Branch #${req.params.id} — ${branch.name}`, before, branch);
  res.json({ status: 'success', data: branch });
});

exports.deleteBranch = catchAsync(async (req, res) => {
  const before = await db('retail_branches').where({ id: req.params.id }).first();
  await db('retail_branches').where({ id: req.params.id }).del();
  log(req, 'Branch Deleted', `Branch #${req.params.id} — ${before ? before.name : ''}`, before, null);
  res.status(204).send();
});

// ── Retail Store Inventory (from general_store_materials, dept = 'Sales') ────
exports.getStoreInventory = catchAsync(async (req, res) => {
  const { search } = req.query;
  let query = db('general_store_materials')
    .where('department', 'Sales')
    .orderBy('id', 'desc');
  if (search) {
    query = query.andWhere(q =>
      q.where('material_name', 'like', `%${search}%`)
       .orWhere('material_id', 'like', `%${search}%`)
    );
  }
  const rows = await query;
  const data = rows.map(r => ({
    ...r,
    id:              r.id,
    product_id:      r.id,
    name:            r.material_name,
    product_name:    r.material_name,
    stock_quantity:  parseFloat(r.quantity_in_store) || 0,
    unit:            r.unit,
    product_unit:    r.unit,
    category:        r.category,
    product_category: r.category,
    unit_value:      parseFloat(r.unit_value) || 0,
    unit_price:      parseFloat(r.unit_value) || 0,
    price:           parseFloat(r.unit_value) || 0,
    total_value:     parseFloat(r.total_value) || 0,
    reorder_level:   parseInt(r.reorder_level) || 10,
    material_id:     r.material_id,
  }));
  res.json({ status: 'success', data });
});

exports.registerStoreItem = catchAsync(async (req, res) => {
  const { material_name, category, unit, quantity_in_store, unit_value, reorder_level } = req.body;
  if (!material_name) throw new AppError('material_name is required', 400);
  const last = await db('general_store_materials').max('id as maxId').first();
  const next = ((last && last.maxId) || 0) + 1;
  const material_id = `RTLMAT-${String(next).padStart(3, '0')}`;
  const qty   = parseFloat(quantity_in_store) || 0;
  const price = parseFloat(unit_value) || 0;
  const total = qty * price;
  const reorder = parseInt(reorder_level) || 10;
  const [id] = await db('general_store_materials').insert({
    material_id, material_name,
    category:        category || 'Other',
    unit:            unit || 'pcs',
    quantity_in_store: qty,
    unit_value:      price,
    total_value:     total,
    reorder_level:   reorder,
    department:      'Sales',
    registered_by:   (req.user && req.user.fullName) || 'Sales Manager',
    date_registered: new Date().toISOString().split('T')[0],
  });
  const row = await db('general_store_materials').where({ id }).first();
  log(req, 'Store Item Registered', `Store Item #${id} — ${row.material_name}`, null, row);
  res.status(201).json({ status: 'success', data: row });
});

exports.updateStoreItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { material_name, category, unit, quantity_in_store, unit_value, reorder_level } = req.body;
  const before = await db('general_store_materials').where({ id, department: 'Sales' }).first();
  const qty   = parseFloat(quantity_in_store) || 0;
  const price = parseFloat(unit_value) || 0;
  const total = qty * price;
  await db('general_store_materials').where({ id, department: 'Sales' }).update({
    material_name, category, unit,
    quantity_in_store: qty,
    unit_value: price,
    total_value: total,
    reorder_level: parseInt(reorder_level) || 10,
    updated_at: db.fn.now(),
  });
  const row = await db('general_store_materials').where({ id }).first();
  log(req, 'Store Item Updated', `Store Item #${id} — ${row ? row.material_name : material_name}`, before, row);
  res.json({ status: 'success', data: row });
});

exports.deleteStoreItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const before = await db('general_store_materials').where({ id, department: 'Sales' }).first();
  await db('general_store_materials').where({ id, department: 'Sales' }).del();
  log(req, 'Store Item Deleted', `Store Item #${id} — ${before ? before.material_name : ''}`, before, null);
  res.status(204).send();
});

// ── Retail Store Requests ──────────────────────────────────────────────────
exports.getStoreRequests = catchAsync(async (req, res) => {
  const requests = await db('sales_store_requests')
    .select('sales_store_requests.*', 'general_store_materials.material_name as product_name')
    .leftJoin('general_store_materials', 'sales_store_requests.material_id', 'general_store_materials.id')
    .orderBy('sales_store_requests.id', 'desc');
  // Map fields to what the frontend expects
  const data = requests.map(r => ({
    ...r,
    shipped_qty: r.quantity_shipped
  }));
  res.json({ status: 'success', data });
});

exports.createStoreRequest = catchAsync(async (req, res) => {
  const { product_id, requested_qty, urgency, signature } = req.body;
  if (!product_id || !requested_qty) throw new AppError('product_id and requested_qty are required', 400);

  const request_code = `RSR-${Math.floor(1000 + Math.random() * 9000)}-${Date.now()}`;
  
  const [id] = await db('sales_store_requests').insert({
    request_code,
    material_id: product_id,
    quantity_requested: requested_qty,
    department: 'Sales',
    created_by_name: (req.user && req.user.fullName) || 'Sales Manager',
    status: 'Pending',
    signature: signature || null
  });
  const row = await db('sales_store_requests').where({ id }).first();
  log(req, 'Store Request Created', `Store Request ${request_code}`, null, row);
  res.status(201).json({ status: 'success', data: row });
});

exports.receiveStoreRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { received_qty } = req.body;
  
  const reqRow = await db('sales_store_requests').where({ id }).first();
  if (!reqRow) throw new AppError('Request not found', 404);
  
  await db('sales_store_requests').where({ id }).update({
    status: 'Received',
    updated_at: db.fn.now()
  });

  log(req, 'Store Request Received', `Store Request ${reqRow.request_code}`, reqRow, { ...reqRow, status: 'Received', received_qty: received_qty || null });
  res.json({ status: 'success', message: 'Request received' });
});

exports.getBranchInventory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const inventory = await db('retail_branch_products')
    .leftJoin('retail_products', 'retail_branch_products.product_id', 'retail_products.id')
    .where('retail_branch_products.branch_id', id)
    .select(
      'retail_branch_products.id',
      'retail_branch_products.branch_id',
      'retail_branch_products.product_id',
      'retail_branch_products.quantity',
      'retail_products.name as product_name',
      'retail_products.stock_quantity as main_stock'
    );
  res.json({ status: 'success', data: inventory });
});

exports.setBranchProductQuantity = catchAsync(async (req, res) => {
  const { branch_id, product_id, quantity, transfer_from_branch_id } = req.body;
  if (!branch_id || !product_id) throw new AppError('branch_id and product_id are required', 400);

  const qty = parseInt(quantity) || 0;

  const existing = await db('retail_branch_products').where({ branch_id, product_id }).first();
  const currentQty = existing ? existing.quantity : 0;
  const difference = qty - currentQty;

  if (difference > 0 && transfer_from_branch_id) {
    const source = await db('retail_branch_products').where({ branch_id: transfer_from_branch_id, product_id }).first();
    if (!source || source.quantity < difference) {
      throw new AppError('Source branch does not have enough stock to transfer', 400);
    }
    await db('retail_branch_products')
      .where({ branch_id: transfer_from_branch_id, product_id })
      .update({ quantity: source.quantity - difference, updated_at: db.fn.now() });
  }

  if (existing) {
    await db('retail_branch_products')
      .where({ branch_id, product_id })
      .update({ quantity: qty, updated_at: db.fn.now() });
  } else {
    await db('retail_branch_products').insert({
      branch_id, product_id, quantity: qty
    });
  }

  log(req, 'Branch Stock Updated', `Branch #${branch_id} — Product #${product_id}`, { branch_id, product_id, quantity: currentQty }, { branch_id, product_id, quantity: qty, transfer_from_branch_id: transfer_from_branch_id || null });
  res.json({ status: 'success', message: 'Product stock updated for branch' });
});// =============================================================
// RETAIL PRODUCT UPDATE REQUESTS (CEO APPROVAL FLOW)
// =============================================================

exports.partialAdjustProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const product = await db('retail_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  const { name, category_id, expiry_date, price, stock } = req.body;

  let immediateUpdates = {};
  let pendingUpdates = {};

  // Immediate: name, category_id, expiry_date
  if (name !== undefined && name !== product.name) immediateUpdates.name = name;
  if (category_id !== undefined && category_id !== product.category_id) immediateUpdates.category_id = category_id || null;
  // Format dates for comparison (Y-M-D)
  const dOld = product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : null;
  const dNew = expiry_date ? new Date(expiry_date).toISOString().split('T')[0] : null;
  if (expiry_date !== undefined && dOld !== dNew) {
    immediateUpdates.expiry_date = expiry_date || null;
  }

  // Pending: price, stock
  if (price !== undefined && parseFloat(price) !== parseFloat(product.price)) pendingUpdates.price = parseFloat(price);
  if (stock !== undefined && parseInt(stock) !== parseInt(product.stock_quantity)) pendingUpdates.stock = parseInt(stock);

  // Apply immediate updates
  if (Object.keys(immediateUpdates).length > 0) {
    immediateUpdates.updated_at = db.fn.now();
    await db('retail_products').where({ id }).update(immediateUpdates);
    
    // Sync to global products
    try {
      const gUpdates = { ...immediateUpdates };
      if (gUpdates.expiry_date === '') gUpdates.expiry_date = null;
      await db('products').where({ sku: product.sku, business_unit: 'retail' }).update(gUpdates);
    } catch (_) {}
  }

  // Apply pending updates via request
  if (Object.keys(pendingUpdates).length > 0) {
    await db('retail_update_requests').insert({
      product_id: id,
      requested_by: req.user ? req.user.id : null,
      old_data: JSON.stringify(product),
      new_data: JSON.stringify(pendingUpdates),
      status: 'PENDING'
    });
  }

  let msg = 'Product details updated successfully.';
  if (Object.keys(pendingUpdates).length > 0 && Object.keys(immediateUpdates).length > 0) {
    msg = 'Basic details updated immediately. Price/Stock changes sent to CEO for approval.';
  } else if (Object.keys(pendingUpdates).length > 0) {
    msg = 'Price/Stock changes sent to CEO for approval.';
  }

  log(req, 'Product Adjusted', `Product #${id} — ${product.name}`, product, { ...product, ...immediateUpdates, ...pendingUpdates });
  res.json({ status: 'success', message: msg });
});


exports.createProductUpdateRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const product = await db('retail_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  const newData = req.body;
  if (!newData || Object.keys(newData).length === 0) {
    throw new AppError('No update data provided', 400);
  }

  // Create the request
  const [reqId] = await db('retail_update_requests').insert({
    product_id: id,
    requested_by: req.user ? req.user.id : null,
    old_data: JSON.stringify(product),
    new_data: JSON.stringify(newData),
    status: 'PENDING'
  });

  const request = await db('retail_update_requests').where({ id: reqId }).first();
  log(req, 'Product Update Requested', `Update Request #${reqId} — Product #${id} (${product.name})`, null, { ...request, product_name: product.name, requested_changes: newData });
  res.status(201).json({ status: 'success', message: 'Update request sent to CEO', data: request });
});

exports.getProductUpdateRequests = catchAsync(async (req, res) => {
  const { status } = req.query;
  let query = db('retail_update_requests')
    .select('retail_update_requests.*', 'retail_products.name as product_name', 'retail_products.sku as product_sku')
    .join('retail_products', 'retail_update_requests.product_id', 'retail_products.id');

  if (status) {
    query = query.where('retail_update_requests.status', status.toUpperCase());
  }

  const requests = await query.orderBy('retail_update_requests.created_at', 'desc');

  // Parse JSON data for frontend convenience
  const parsedRequests = requests.map(r => {
    try { r.old_data = typeof r.old_data === 'string' ? JSON.parse(r.old_data) : r.old_data; } catch(e){}
    try { r.new_data = typeof r.new_data === 'string' ? JSON.parse(r.new_data) : r.new_data; } catch(e){}
    return r;
  });

  res.json({ status: 'success', data: parsedRequests });
});

exports.approveProductUpdateRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Use transaction to ensure both request status and product update succeed
  await transaction(async (trx) => {
    const request = await trx('retail_update_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'PENDING') throw new AppError('Request is not pending', 400);

    const newData = typeof request.new_data === 'string' ? JSON.parse(request.new_data) : request.new_data;

    // Build the update payload for retail_products
    const updates = {};
    if (newData.name !== undefined) updates.name = newData.name;
    if (newData.category_id !== undefined) updates.category_id = newData.category_id || null;
    if (newData.price !== undefined) updates.price = parseFloat(newData.price);
    if (newData.stock !== undefined) updates.stock_quantity = parseInt(newData.stock);
    if (newData.reorder !== undefined) updates.reorder_level = parseInt(newData.reorder);
    
    if (Object.keys(updates).length > 0) {
      updates.updated_at = trx.fn.now();
      await trx('retail_products').where({ id: request.product_id }).update(updates);
    }

    // Mark request as approved
    await trx('retail_update_requests').where({ id }).update({
      status: 'APPROVED',
      approved_by: req.user ? req.user.id : null,
      approved_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });
  });

  const doneReq = await db('retail_update_requests').where({ id }).first();
  const product = await db('retail_products').where({ id: doneReq ? doneReq.product_id : null }).first();
  log(req, 'Product Update Approved', `Update Request #${id} — Product #${doneReq ? doneReq.product_id : ''}${product ? ` (${product.name})` : ''}`, doneReq ? doneReq.old_data : null, doneReq ? doneReq.new_data : null);
  res.json({ status: 'success', message: 'Product update approved and applied' });
});

exports.rejectProductUpdateRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) throw new AppError('Rejection reason is required', 400);

  const request = await db('retail_update_requests').where({ id }).first();
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Request is not pending', 400);

  await db('retail_update_requests').where({ id }).update({
    status: 'REJECTED',
    rejection_reason: reason,
    updated_at: db.fn.now()
  });

  const product = await db('retail_products').where({ id: request.product_id }).first();
  log(req, 'Product Update Rejected', `Update Request #${id} — Product #${request.product_id}${product ? ` (${product.name})` : ''}`, request.old_data, { ...request.new_data, rejection_reason: reason });
  res.json({ status: 'success', message: 'Product update rejected' });
});
