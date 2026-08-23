const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const OrderModel = require('../../models/Order.model');
const { generateOrderNumber, generateInvoiceNumber } = require('../../utils/orderNumber');
const vatConfigService = require('../../services/vatConfig.service');
const { recordInvoiceForOrder, recordReceiptForOrder, findInvoiceForOrder } = require('../../services/invoiceDocument.service');
const { sendFinanceNotification, sendPrintingNotification } = require('../../services/notification.service');
const deleteFile = (path) => console.log('Deleted file:', path);
const calculatePrintingPrice = (params) => {
  const model = new OrderModel({
    paperType: params.paperType,
    pagesPerCopy: params.pagesPerCopy,
    quantity: params.quantity,
    colorPrinting: params.colorPrinting,
    bindingType: params.bindingType
  });
  return model.calculatePrice();
};
// VAT-inclusive printing total, keyed by printing product type (code). Falls
// back to the default standard rate when the type has no CEO tax mapping.
const applyPrintingVat = async (productType, baseTotal) => {
  const pt = await db('printing_product_types').where('code', productType).first();
  const r = await vatConfigService.computeVatForItem('printing', pt ? pt.id : null, baseTotal);
  const vat = parseFloat(r.vat.toFixed(2));
  return { baseTotal, vat, total: baseTotal + vat };
};
// Build invoice lines for a printing order using the already-computed pricing/VAT
// so the invoice total always matches the order total (subtotal + binding + VAT).
const buildPrintingInvoiceLines = async ({ productType, paperType, pagesPerCopy, colorPrinting, bindingType, quantity, pricing, vatPricing }) => {
  const pt = await db('printing_product_types').where('code', productType || 'Book').first();
  const qty = parseInt(quantity) || 1;
  const base = parseFloat(pricing.subtotal) || 0;
  const binding = parseFloat(pricing.bindingCost) || 0;
  const taxable = parseFloat(pricing.totalPrice) || (base + binding);
  const vatRate = taxable > 0 && parseFloat(vatPricing.vat) > 0 ? parseFloat((parseFloat(vatPricing.vat) / taxable).toFixed(4)) : 0;
  const treatment = vatRate === 0 ? 'zero_rated' : 'standard';
  const spec = `${productType || 'Book'} (${paperType || 'A4'}, ${parseInt(pagesPerCopy) || 1}pp, ${colorPrinting === true || colorPrinting === 'true' ? 'Color' : 'B&W'}, ${bindingType || 'None'})`;
  const lines = [{
    itemId: pt ? pt.id : null,
    name: spec,
    qty,
    unitPrice: parseFloat(pricing.pricePerUnit) || 0,
    amount: base,
    rate: vatRate,
    treatment
  }];
  if (binding > 0) {
    lines.push({
      itemId: pt ? pt.id : null,
      name: `${bindingType || 'Binding'} (${spec})`,
      qty,
      unitPrice: parseFloat(binding) / qty,
      amount: binding,
      rate: vatRate,
      treatment
    });
  }
  return lines;
};
exports.getAllOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 25, status, search, startDate, endDate } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('users as u', 'po.created_by', 'u.id')
    .select(
      'po.id', 'po.order_number', 'po.total_price', 'po.quantity',
      'po.product_type', 'po.paper_type', 'po.color_printing', 'po.pages_per_copy',
      'po.due_date', 'po.binding_type', 'po.special_instructions',
      'po.attachments', 'po.subtotal', 'po.vat_amount',
      'po.created_at', 'po.completed_at', 'po.updated_at',
      'os.status_name', 'os.status_code', 'os.color_hex',
      'c.name as customer_name', 'c.phone as customer_phone',
      'u.full_name as created_by_name'
    )
    .whereNull('po.deleted_at');
  if (status) query = query.where('os.status_code', status);
  if (search) {
    query = query.where(function() {
      this.where('po.order_number', 'like', `%${search}%`)
        .orWhere('c.name', 'like', `%${search}%`);
    });
  }
  if (startDate && endDate) {
    const endOfDay = endDate.includes(':') ? endDate : `${endDate} 23:59:59`;
    if (status === 'delivered') {
      query = query.where(function() {
        this.whereBetween('po.completed_at', [startDate, endOfDay])
            .orWhereBetween('po.updated_at', [startDate, endOfDay]);
      });
    } else {
      query = query.whereBetween('po.created_at', [startDate, endOfDay]);
    }
  }
  const total = await query.clone().clearSelect().count('po.id as count').first();
  const orders = await query.orderBy('po.due_date', 'asc').limit(parseInt(limit)).offset(offset);
  res.json({
    status: 'success',
    data: {
      orders,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(total.count),
        totalPages: Math.ceil(total.count / parseInt(limit))
      }
    }
  });
});
exports.getPendingOrders = catchAsync(async (req, res) => {
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const cancelledStatus = await db('order_statuses').where('status_code', 'cancelled').first();
  const orders = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .select('po.*', 'os.status_name', 'os.color_hex', 'c.name as customer_name')
    .whereNull('po.deleted_at')
    .whereNotIn('po.status_id', [deliveredStatus?.id || 8, cancelledStatus?.id || 9])
    .orderBy('po.due_date', 'asc');
  res.json({ status: 'success', data: { orders } });
});
exports.getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('users as u', 'po.created_by', 'u.id')
    .select(
      'po.*',
      'os.status_name', 'os.status_code', 'os.color_hex',
      'c.name as customer_name', 'c.phone as customer_phone',
      'u.full_name as created_by_name'
    )
    .where('po.id', id)
    .whereNull('po.deleted_at')
    .first();
  if (!order) throw new AppError('Order not found', 404);
  res.json({ status: 'success', data: { order } });
});
exports.createOrder = catchAsync(async (req, res) => {
  const {
    customer,        
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting,
    bindingType,
    dueDate,
    specialInstructions,
    paymentMethod,
    paymentReference
  } = req.body;
  const userId = req.user.id;
  let resolvedCustomerId = req.body.customerId || null;
  let resolvedCustomerTypeId = parseInt(customer?.customerTypeId) || 1;
  if (!resolvedCustomerId && customer?.phone) {
    const existing = await db('customers').where('phone', customer.phone).whereNull('deleted_at').first();
    if (!existing) {
      const [newId] = await db('customers').insert({
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone,
        customer_type_id: resolvedCustomerTypeId,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      resolvedCustomerId = newId;
    } else {
      resolvedCustomerId = existing.id;
      resolvedCustomerTypeId = existing.customer_type_id || resolvedCustomerTypeId;
    }
  } else if (resolvedCustomerId) {
    const existingCustomer = await db('customers').where('id', resolvedCustomerId).first();
    if (existingCustomer) resolvedCustomerTypeId = existingCustomer.customer_type_id || resolvedCustomerTypeId;
  }
  const OrderModel = require('../../models/Order.model');
  const orderModel = new OrderModel({
    paperType: paperType || 'A4',
    pagesPerCopy: parseInt(pagesPerCopy) || 1,
    quantity: parseInt(quantity) || 1,
    colorPrinting: colorPrinting === true || colorPrinting === 'true',
    bindingType: bindingType || 'None'
  });
  const pricing = orderModel.calculatePrice();
  const vatPricing = await applyPrintingVat(productType || 'Book', pricing.totalPrice);
  const orderNumber = await generateOrderNumber('PRT');
  const initialStatus = await db('order_statuses').where('status_code', 'in_queue').first();
  const invoiceLines = await buildPrintingInvoiceLines({
    productType, paperType, pagesPerCopy, colorPrinting, bindingType, quantity, pricing, vatPricing
  });
  const orderId = await db.transaction(async (trx) => {
    const [oid] = await trx('printing_orders').insert({
      order_number: orderNumber,
      customer_id: resolvedCustomerId,
      customer_type_id: resolvedCustomerTypeId,
      product_type: productType || 'Book',
      paper_type: paperType || 'A4',
      pages_per_copy: parseInt(pagesPerCopy) || 1,
      color_printing: colorPrinting === true || colorPrinting === 'true' ? 1 : 0,
      binding_type: bindingType || 'None',
      quantity: parseInt(quantity) || 1,
      special_instructions: specialInstructions || null,
      due_date: dueDate ? new Date(dueDate).toISOString().slice(0, 10) : null,
      price_per_unit: pricing.pricePerUnit,
      binding_cost: pricing.bindingCost,
      subtotal: pricing.subtotal,
      vat_amount: vatPricing.vat,
      total_price: vatPricing.total,
      status_id: initialStatus?.id || 1,
      payment_method: paymentMethod || null,
      payment_reference: paymentReference || null,
      payment_status: paymentMethod && paymentReference ? 'Pending' : 'Pending',
      created_by: userId,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Invoice is recorded immediately when the order is placed.
    const invNo = await generateInvoiceNumber();
    await recordInvoiceForOrder(trx, {
      source: 'printing',
      saleId: oid,
      saleType: 'walk_in',
      invoiceNo: invNo,
      customer: customer?.name || null,
      customerTin: null,
      lines: invoiceLines,
      createdBy: req.user.full_name || req.user.fullName || 'Printing Cashier'
    });
    return oid;
  });

  // Automatically send to Finance Live Income for verification
  if (paymentMethod && paymentReference) {
    await db('finance_income_submissions').insert({
      department: 'Printing',
      submitted_by: req.user.full_name || req.user.name || 'Printing Cashier',
      amount: vatPricing.total,
      reference_no: paymentReference,
      description: `Printing Order ${orderNumber} - ${customer?.name || 'Walk-in'}`,
      status: 'Pending',
      manual_details: JSON.stringify({
        order_id: orderId,
        paymentMethod: paymentMethod,
        receivedFrom: customer?.name || 'Walk-in Customer'
      }),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    }).catch(err => console.error('Failed to submit to finance:', err.message));

    sendFinanceNotification({
      title: 'New Income Submission',
      message: `ETB ${vatPricing.total.toLocaleString()} Printing income submitted for verification (Ref: ${paymentReference}).`,
      type: 'finance',
      link: '/finance/pharmacy-sales?tab=list',
      related_entity_id: orderId
    }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
  }

  await audit('PRINTING_ORDER_CREATED', userId, {
    ip: req.ip,
    resourceId: orderId,
    afterState: {
      order_number: orderNumber,
      customer_id: resolvedCustomerId,
      product_type: productType || 'Book',
      quantity: parseInt(quantity) || 1,
      total_price: pricing.totalPrice,
      status: initialStatus?.status_code || 'in_queue'
    }
  });
  if (req.res) req.res.locals.__centralAudited = true;

  // NOTIFY PRINTING DEPARTMENT (navbar bell)
  try {
    await sendPrintingNotification({
      title: 'New Printing Order',
      message: `Order ${orderNumber} has been created${customer?.name ? ` for ${customer.name}` : ''}.`,
      type: 'printing_order',
      link: '/printing-manager/jobs/queue',
      related_entity_id: orderId
    }, req.app?.get('io'));
  } catch (notifErr) {
    console.error('Failed to notify printing staff:', notifErr.message);
  }

  // INVENTORY CHECK: warn if paper stock is low for this order
  try {
    const paperProduct = await db('products')
      .where('name', 'like', `%${paperType || order.paper_type}%`)
      .where('is_active', true)
      .first();
    if (paperProduct) {
      const stock = await db('inventory').where('product_id', paperProduct.id).first();
      const estimatedSheets = (parseInt(pagesPerCopy) || 1) * (parseInt(quantity) || 1);
      if (stock && parseInt(stock.quantity) < estimatedSheets) {
        console.warn(`LOW STOCK: ${paperType} paper has ${stock.quantity} units, order needs ~${estimatedSheets}`);
      }
    }
  } catch (stockErr) {
    console.error('Stock check failed:', stockErr.message);
  }

  res.status(201).json({ status: 'success', data: { orderId, orderNumber } });
});
exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { statusId, status, notes } = req.body;  
  const userId = req.user.id;
  const order = await db('printing_orders').where('id', id).first();
  if (!order) throw new AppError('Order not found', 404);
  let statusRow;
  if (statusId && !isNaN(parseInt(statusId))) {
    statusRow = await db('order_statuses').where('id', parseInt(statusId)).first();
  } else if (status) {
    statusRow = await db('order_statuses')
      .where('status_code', status)
      .orWhere('status_name', status)
      .first();
  }
  if (!statusRow) throw new AppError(`Status '${status || statusId}' not found`, 400);
  const newStatusId = statusRow.id;
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const deliveredId = deliveredStatus?.id || 8;
  const updateData = {
    status_id: newStatusId,
    updated_at: db.fn.now()
  };
  if (newStatusId === deliveredId) {
    updateData.completed_at = db.fn.now();
  }
  await db('printing_orders').where('id', id).update(updateData);
  await db('order_status_history').insert({
    order_id: id,
    from_status: order.status_id ? (await db('order_statuses').where('id', order.status_id).first())?.status_code || null : null,
    to_status: statusRow.status_code,
    note: notes || null,
    changed_by: userId,
    changed_at: db.fn.now(),
  }).catch(err => console.error('Status history insert failed:', err.message));
  if (order.customer_id) {
    // Insert into customer_notifications (for Customer Portal view)
    await db('customer_notifications').insert({
      customer_id: order.customer_id,
      title: 'Order Status Update',
      message: `Your order ${order.order_number} is now ${statusRow.status_name}.`,
      type: 'order_update',
      link_url: `/customer/orders/${id}/track`,
      created_at: db.fn.now()
    }).catch(err => console.error('Customer notification failed:', err.message));

    // Also insert into user_notifications for the internal user linked to this customer (if any)
    // This ensures Admins/Employees who placed orders via the ERP dashboard also get navbar alerts
    const linkedCustomer = await db('customers').where('id', order.customer_id).first();
    if (linkedCustomer && linkedCustomer.user_id) {
      await db('user_notifications').insert({
        user_id: linkedCustomer.user_id,
        title: 'Order Status Update',
        message: `Your printing order ${order.order_number} is now ${statusRow.status_name}.`,
        type: 'order_update',
        link_url: `/customer/orders/${id}/track`,
        created_at: db.fn.now()
      }).catch(err => console.error('User notification failed:', err.message));
    }
  }
  // INVENTORY INTEGRATION: decrement stock when order moves to in_progress
  const inProgressStatus = await db('order_statuses').where('status_code', 'in_progress').first();
  if (inProgressStatus && newStatusId === inProgressStatus.id) {
    try {
      const paperProduct = await db('products')
        .where('name', 'like', `%${order.paper_type}%`)
        .where('is_active', true)
        .first();
      if (paperProduct) {
        const currentStock = await db('inventory').where('product_id', paperProduct.id).first();
        const currentQty = currentStock ? parseInt(currentStock.quantity) : 0;
        const sheetsConsumed = (order.pages_per_copy || 1) * (order.quantity || 1);
        await db('inventory_movements').insert({
          product_id: paperProduct.id,
          quantity_change: -sheetsConsumed,
          quantity_before: currentQty,
          quantity_after: Math.max(0, currentQty - sheetsConsumed),
          transaction_type: 'Production',
          reference_type: 'printing_order',
          reference_id: order.id,
          reason: `Paper consumed for order ${order.order_number}`,
          performed_by: userId,
          created_at: db.fn.now()
        });
        await db('inventory')
          .where('product_id', paperProduct.id)
          .update({ quantity: db.raw('GREATEST(quantity - ?, 0)', [sheetsConsumed]) });
        // AUTO-PURCHASE TRIGGER: if stock drops below reorder level
        if (paperProduct.reorder_level > 0 && (currentQty - sheetsConsumed) <= paperProduct.reorder_level) {
          const supplierId = paperProduct.supplier_id;
          const existingPending = await db('purchase_orders')
            .where('supplier_id', supplierId)
            .where('status', 'pending')
            .first();
          if (!existingPending) {
            const poNumber = 'PO-PRT-' + Date.now().toString(36).toUpperCase();
            await db('purchase_orders').insert({
              order_number: poNumber,
              supplier_id: supplierId || 1,
              status: 'pending',
              total_amount: paperProduct.selling_price * paperProduct.reorder_level,
              ordered_by: userId,
              notes: `Auto-generated: ${paperProduct.name} below reorder level after printing order ${order.order_number}`,
              created_at: db.fn.now(),
              updated_at: db.fn.now()
            });
            console.log(`Auto PO ${poNumber} generated for ${paperProduct.name}`);
          }
        }
      }
    } catch (invErr) {
      console.error('Inventory movement / auto-PO failed:', invErr.message);
    }
  }

  let oldStatusCode = null;
  if (order.status_id) {
    const oldStatusRow = await db('order_statuses').where('id', order.status_id).first();
    oldStatusCode = oldStatusRow?.status_code || null;
  }
  await audit('PRINTING_ORDER_STATUS_UPDATED', userId, {
    ip: req.ip, resourceId: id,
    beforeState: { status_code: oldStatusCode },
    afterState: { status_code: statusRow.status_code, completed_at: newStatusId === deliveredId ? new Date().toISOString() : null }
  });
  if (req.res) req.res.locals.__centralAudited = true;
  res.json({ status: 'success', message: 'Order status updated successfully', data: { statusCode: statusRow.status_code, statusName: statusRow.status_name } });
});
exports.verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await db('printing_orders').where('id', id).whereNull('deleted_at').first();
  if (!order) throw new AppError('Order not found', 404);

  if (['Confirmed', 'PAID'].includes(order.payment_status)) {
    throw new AppError('Payment already confirmed for this order', 400);
  }

  await db.transaction(async (trx) => {
    await trx('printing_orders').where('id', id).update({
      payment_status: 'Confirmed',
      updated_at: db.fn.now()
    });

    let invoice = await findInvoiceForOrder(trx, 'printing', id);
    if (!invoice) {
      // Back-fill the invoice for orders created before invoice recording existed.
      const lines = await buildPrintingInvoiceLines({
        productType: order.product_type,
        paperType: order.paper_type,
        pagesPerCopy: order.pages_per_copy,
        colorPrinting: order.color_printing,
        bindingType: order.binding_type,
        quantity: order.quantity,
        pricing: { pricePerUnit: order.price_per_unit, subtotal: order.subtotal, bindingCost: order.binding_cost },
        vatPricing: { vat: order.vat_amount }
      });
      const invNo = await generateInvoiceNumber();
      const created = await recordInvoiceForOrder(trx, {
        source: 'printing',
        saleId: id,
        saleType: 'walk_in',
        invoiceNo: invNo,
        customer: null,
        customerTin: null,
        lines,
        createdBy: req.user.full_name || req.user.fullName || 'Finance Officer'
      });
      invoice = { id: created.invoiceId };
    }

    await recordReceiptForOrder(trx, {
      invoiceId: invoice.id,
      amountPaid: parseFloat(order.total_price) || 0,
      paymentMethod: order.payment_method || 'Cash',
      paymentReference: order.payment_reference || null,
      receivedBy: req.user.full_name || req.user.fullName || 'Finance Officer'
    });
  });

  await audit('PRINTING_PAYMENT_VERIFIED', req.user.id, {
    ip: req.ip,
    resourceId: id,
    details: {
      order_number: order.order_number,
      total_price: order.total_price,
      payment_status: 'Confirmed'
    }
  });
  if (req.res) req.res.locals.__centralAudited = true;

  // Notify Printing Supervisor — finance confirmed the payment
  sendPrintingNotification({
    title: 'Payment Confirmed by Finance',
    message: `Payment of ETB ${Number(order.total_price || 0).toLocaleString()} for order ${order.order_number} was confirmed. You can start production.`,
    type: 'payment_confirmed',
    link: '/printing-manager/jobs/queue',
    related_entity_id: id
  }, req.app?.get('io')).catch(e => console.error('Failed to notify printing supervisor:', e.message));

  res.json({ status: 'success', message: 'Payment verified and receipt recorded', data: { orderId: id, payment_status: 'Confirmed' } });
});

exports.uploadAttachments = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const order = await db('printing_orders')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }
  let attachments = order.attachments || [];
  if (typeof attachments === 'string') {
    attachments = JSON.parse(attachments);
  }
  const newAttachments = req.files.map(file => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    path: file.path,
    uploadedBy: userId,
    uploadedAt: new Date().toISOString()
  }));
  attachments.push(...newAttachments);
  await db('printing_orders')
    .where('id', id)
    .update({
      attachments: JSON.stringify(attachments),
      updated_at: db.fn.now()
    });
  await audit('PRINTING_ORDER_ATTACHMENTS_UPLOADED', userId, {
    ip,
    resourceId: id,
    details: {
      fileCount: newAttachments.length,
      filenames: newAttachments.map(f => f.originalName)
    }
  });
  if (req.res) req.res.locals.__centralAudited = true;
  res.json({
    status: 'success',
    message: `${newAttachments.length} file(s) uploaded successfully`,
    data: {
      attachments: newAttachments.map(a => ({
        id: a.id,
        filename: a.filename,
        originalName: a.originalName,
        size: a.size,
        uploadedAt: a.uploadedAt
      }))
    }
  });
});
exports.deleteAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const order = await db('printing_orders')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  let attachments = order.attachments || [];
  if (typeof attachments === 'string') {
    attachments = JSON.parse(attachments);
  }
  const attachmentToDelete = attachments.find(a => a.id === attachmentId);
  if (!attachmentToDelete) {
    throw new AppError('Attachment not found', 404);
  }
  deleteFile(attachmentToDelete.path);
  const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
  await db('printing_orders')
    .where('id', id)
    .update({
      attachments: updatedAttachments.length > 0 ? JSON.stringify(updatedAttachments) : null,
      updated_at: db.fn.now()
    });
  await audit('PRINTING_ORDER_ATTACHMENT_DELETED', userId, {
    ip,
    resourceId: id,
    details: {
      attachmentId,
      filename: attachmentToDelete.originalName
    }
  });
  if (req.res) req.res.locals.__centralAudited = true;
  res.json({
    status: 'success',
    message: 'Attachment deleted successfully'
  });
});
exports.getOrderHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await db('printing_orders')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const history = await db('order_status_history as osh')
    .leftJoin('users as u', 'osh.changed_by', 'u.id')
    .select(
      'osh.*',
      'u.full_name as changed_by_name'
    )
    .where('osh.order_id', id)
    .orderBy('osh.changed_at', 'desc');
  res.json({
    status: 'success',
    data: { history }
  });
});
exports.getRemainingTaxAllowance = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const order = await db('printing_orders')
    .where('id', orderId)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (order.product_type !== 'TaxReceipt') {
    throw new AppError('This order is not a tax receipt order', 400);
  }
  const taxReceipt = await db('tax_receipts')
    .where('order_id', orderId)
    .whereNull('deleted_at')
    .first();
  if (!taxReceipt) {
    throw new AppError('No tax receipt record found for this order', 404);
  }
  res.json({
    status: 'success',
    data: {
      orderId: parseInt(orderId),
      orderNumber: order.order_number,
      serialNumber: taxReceipt.serial_number,
      totalApproved: taxReceipt.approval_amount_total,
      usedCount: taxReceipt.used_count,
      remaining: taxReceipt.remaining,
      canPrintMore: taxReceipt.remaining > 0,
      maxPrintQuantity: Math.min(order.quantity - taxReceipt.used_count, taxReceipt.remaining)
    }
  });
});
exports.printTaxReceipt = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { approvalAmountTotal, approvedDate, approvalDocument } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const order = await db('printing_orders')
    .leftJoin('customers', 'printing_orders.customer_id', 'customers.id')
    .leftJoin('customer_types', 'printing_orders.customer_type_id', 'customer_types.id')
    .select(
      'printing_orders.*',
      'customers.name as customer_name',
      'customers.tax_id',
      'customer_types.name as customer_type_name'
    )
    .where('printing_orders.id', orderId)
    .whereNull('printing_orders.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const serialNumber = `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  let taxReceipt = await db('tax_receipts')
    .where('order_id', orderId)
    .whereNull('deleted_at')
    .first();
  let newUsedCount, newRemaining;
  if (!taxReceipt) {
    const [receiptId] = await db('tax_receipts').insert({
      serial_number: serialNumber,
      order_id: orderId,
      customer_name: order.customer_name || 'Walk-in Customer',
      customer_type_id: order.customer_type_id || 1,
      approval_amount_total: parseInt(approvalAmountTotal),
      used_count: 1,
      remaining: parseInt(approvalAmountTotal) - 1,
      approved_date: approvedDate,
      approval_document: approvalDocument || '',
      printed_by: userId,
      ip_address: ip,
      printed_at: db.fn.now()
    });
    newUsedCount = 1;
    newRemaining = parseInt(approvalAmountTotal) - 1;
    taxReceipt = { id: receiptId, approval_amount_total: parseInt(approvalAmountTotal) };
  } else {
    // Already exists — increment usage
    newUsedCount  = taxReceipt.used_count + 1;
    newRemaining  = taxReceipt.remaining - 1;
    await db('tax_receipts')
      .where('id', taxReceipt.id)
      .update({
        used_count: newUsedCount,
        remaining: newRemaining,
        printed_by: userId,
        ip_address: ip,
        printed_at: db.fn.now()
      });
  }
  await audit('TAX_RECEIPT_PRINTED', userId, {
    ip,
    resourceId: orderId,
    details: { serialNumber, customerName: order.customer_name, usedCount: newUsedCount, remaining: newRemaining }
  });
  if (req.res) req.res.locals.__centralAudited = true;
  res.json({
    status: 'success',
    message: 'Tax receipt printed successfully',
    data: {
      receipt: {
        serialNumber,
        orderNumber: order.order_number,
        customerName: order.customer_name || 'Walk-in Customer',
        customerType: order.customer_type_name,
        taxId: order.tax_id,
        approvalAmountTotal: taxReceipt.approval_amount_total,
        usedCount: newUsedCount,
        remaining: newRemaining,
        approvedDate,
        printedAt: new Date().toISOString(),
        printedBy: req.user.full_name
      },
      canPrintMore: newRemaining > 0
    }
  });
});
exports.getAllTaxReceipts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    startDate,
    endDate
  } = req.query;
  const offset = (page - 1) * limit;
  let query = db('tax_receipts as tr')
    .leftJoin('printing_orders as po', 'tr.order_id', 'po.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
    .leftJoin('users as u', 'tr.printed_by', 'u.id')
    .select(
      'tr.*',
      'po.order_number',
      'c.name as customer_name',
      'c.phone as customer_phone',
      'ct.name as customer_type_name',
      'u.full_name as printed_by_name'
    )
    .whereNull('tr.deleted_at');
  if (startDate && endDate) {
    query = query.whereBetween('tr.printed_at', [startDate, endDate]);
  }
  const total = await query.clone().clearSelect().count('tr.id as total').first();
  const receipts = await query
    .orderBy('tr.printed_at', 'desc')
    .limit(limit)
    .offset(offset);
  res.json({
    status: 'success',
    data: {
      receipts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getPrintingStatistics = catchAsync(async (req, res) => {
  const statusCounts = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select('os.status_name', 'os.status_code', 'os.color_hex', db.raw('COUNT(*) as count'))
    .whereNull('po.deleted_at')
    .groupBy('po.status_id', 'os.status_name', 'os.status_code', 'os.color_hex');
  const monthlyRevenue = await db('printing_orders')
    .select(
      db.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
      db.raw('SUM(total_price) as revenue'),
      db.raw('COUNT(*) as order_count')
    )
    .whereNull('deleted_at')
    .where('status_id', '!=', (await db('order_statuses').where('status_code', 'received').first())?.id)
    .groupBy(db.raw('DATE_FORMAT(created_at, "%Y-%m")'))
    .orderBy('month', 'desc')
    .limit(6);
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const pendingCount = await db('printing_orders')
    .where('status_id', '!=', deliveredStatus?.id)
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const pastDueCount = await db('printing_orders')
    .where('due_date', '<', db.fn.now())
    .where('status_id', '!=', deliveredStatus?.id)
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const customerTypeBreakdown = await db('printing_orders as po')
    .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
    .select('ct.name', 'ct.color_code', db.raw('COUNT(*) as count'), db.raw('SUM(po.total_price) as total_revenue'))
    .whereNull('po.deleted_at')
    .groupBy('po.customer_type_id', 'ct.name', 'ct.color_code')
    .orderBy('count', 'desc');
  res.json({
    status: 'success',
    data: {
      statusBreakdown: statusCounts,
      monthlyRevenue,
      pendingOrders: parseInt(pendingCount.count),
      pastDueOrders: parseInt(pastDueCount.count),
      customerTypeBreakdown,
      totalOrders: statusCounts.reduce((sum, s) => sum + parseInt(s.count), 0)
    }
  });
});
exports.calculatePrice = catchAsync(async (req, res) => {
  const {
    paperType,
    pagesPerCopy,
    quantity,
    colorPrinting = false,
    bindingType = 'None',
    productType
  } = req.query;
  if (!paperType || !pagesPerCopy || !quantity) {
    throw new AppError('Missing required parameters: paperType, pagesPerCopy, quantity', 400);
  }
  const priceCalculation = calculatePrintingPrice({
    paperType,
    pagesPerCopy: parseInt(pagesPerCopy),
    quantity: parseInt(quantity),
    bindingType,
    colorPrinting: colorPrinting === 'true'
  });
  const vatPricing = await applyPrintingVat(productType || 'Book', priceCalculation.totalPrice);
  res.json({
    status: 'success',
    data: {
      calculation: {
        paperType,
        pagesPerCopy: parseInt(pagesPerCopy),
        quantity: parseInt(quantity),
        colorPrinting: colorPrinting === 'true',
        bindingType
      },
      pricePerUnit: priceCalculation.pricePerUnit,
      bindingCost: priceCalculation.bindingCost,
      subtotal: priceCalculation.subtotal,
      vatAmount: vatPricing.vat,
      totalPrice: vatPricing.total,
      formula: {
        basePricePerPage: paperType === 'A4' ? 0.50 : paperType === 'A5' ? 0.75 : 1.00,
        colorMultiplier: colorPrinting === 'true' ? 2.0 : 1.0,
        bindingCostPerCopy: bindingType === 'Spiral' ? 500 : bindingType === 'Thermal' ? 300 : 0
      }
    }
  });
});
exports.createCustomerOrder = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const {
    productType, quantity, paperType, pagesPerCopy,
    colorPrinting, bindingType, dueDate, specialInstructions,
    paymentMethod, paymentReference
  } = req.body;

  const OrderModel = require('../../models/Order.model');
  const orderModel = new OrderModel({
    paperType: paperType || 'A4',
    pagesPerCopy: parseInt(pagesPerCopy) || 1,
    quantity: parseInt(quantity) || 1,
    colorPrinting: colorPrinting === true || colorPrinting === 'true',
    bindingType: bindingType || 'None'
  });
  const pricing = orderModel.calculatePrice();
  const vatPricing = await applyPrintingVat(productType || 'Book', pricing.totalPrice);
  const orderNumber = await generateOrderNumber('PRT');
  const initialStatus = await db('order_statuses').where('status_code', 'in_queue').first();

  const user = await db('users').where('id', userId).first();
  let customerId = null;
  if (user) {
    const existing = await db('customers').where('phone', user.phone).whereNull('deleted_at').first();
    if (existing) {
      customerId = existing.id;
    } else {
      const [newId] = await db('customers').insert({
        name: user.full_name || 'Customer',
        phone: user.phone || '',
        customer_type_id: 1,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      customerId = newId;
    }
  }

  let attachmentsStr = null;
  if (req.file) {
    const newAttachment = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      path: req.file.path,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    };
    attachmentsStr = JSON.stringify([newAttachment]);
  }

  const invoiceLines = await buildPrintingInvoiceLines({
    productType, paperType, pagesPerCopy, colorPrinting, bindingType, quantity, pricing, vatPricing
  });
  const orderId = await db.transaction(async (trx) => {
    const [oid] = await trx('printing_orders').insert({
      order_number: orderNumber,
      customer_id: customerId,
      customer_type_id: 1,
      product_type: productType || 'Book',
      paper_type: paperType || 'A4',
      pages_per_copy: parseInt(pagesPerCopy) || 1,
      color_printing: colorPrinting === true || colorPrinting === 'true' ? 1 : 0,
      binding_type: bindingType || 'None',
      quantity: parseInt(quantity) || 1,
      special_instructions: specialInstructions || null,
      due_date: dueDate ? new Date(dueDate).toISOString().slice(0, 10) : null,
      price_per_unit: pricing.pricePerUnit,
      binding_cost: pricing.bindingCost,
      subtotal: pricing.subtotal,
      vat_amount: vatPricing.vat,
      total_price: vatPricing.total,
      status_id: initialStatus?.id || 1,
      payment_method: paymentMethod || null,
      payment_reference: paymentReference || null,
      payment_status: paymentMethod && paymentReference ? 'Pending' : 'Pending',
      attachments: attachmentsStr,
      created_by: userId,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Invoice is recorded immediately when the online order is placed.
    const invNo = await generateInvoiceNumber();
    await recordInvoiceForOrder(trx, {
      source: 'printing',
      saleId: oid,
      saleType: 'online',
      invoiceNo: invNo,
      customer: user?.full_name || user?.fullName || null,
      customerTin: null,
      lines: invoiceLines,
      createdBy: user?.full_name || user?.fullName || 'Customer Portal'
    });
    return oid;
  });

  // Automatically send to Finance Live Income for verification
  if (paymentMethod && paymentReference) {
    await db('finance_income_submissions').insert({
      department: 'Printing',
      submitted_by: user.full_name || 'Customer Portal',
      amount: vatPricing.total,
      reference_no: paymentReference,
      description: `Customer Printing Order ${orderNumber} - ${user.full_name || 'Customer'}`,
      status: 'Pending',
      manual_details: JSON.stringify({
        order_id: orderId,
        paymentMethod: paymentMethod,
        receivedFrom: user.full_name || 'Customer'
      }),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    }).catch(err => console.error('Failed to submit to finance:', err.message));

    sendFinanceNotification({
      title: 'New Income Submission',
      message: `ETB ${vatPricing.total.toLocaleString()} Printing (customer portal) income submitted for verification (Ref: ${paymentReference}).`,
      type: 'finance',
      link: '/finance/pharmacy-sales?tab=list',
      related_entity_id: orderId
    }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
  }

  // Notify Printing Supervisor — new online order from the customer portal
  try {
    await sendPrintingNotification({
      title: 'New Online Print Order',
      message: `${user?.full_name || 'A customer'} placed online order ${orderNumber} (${productType || 'Book'} x${quantity || 1}${paperType ? ', ' + paperType : ''}).`,
      type: 'printing_order',
      link: '/printing-manager/jobs/queue',
      related_entity_id: orderId
    }, req.app?.get('io'));
  } catch (e) { console.error('Failed to notify printing supervisor:', e.message); }

  await audit('PRINTING_ORDER_CREATED', userId, {
    ip: req.ip,
    resourceId: orderId,
    details: {
      source: 'customer_portal',
      order_number: orderNumber,
      total_price: vatPricing.total,
      status: initialStatus?.status_code || 'in_queue'
    }
  });
  if (req.res) req.res.locals.__centralAudited = true;

  res.status(201).json({ status: 'success', message: 'Order placed successfully', data: { orderId, orderNumber, totalPrice: vatPricing.total } });
});

exports.getCustomerOrders = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user = await db('users').where('id', userId).first();
  if (!user) throw new AppError('User not found', 404);

  const customer = await db('customers').where('phone', user.phone).whereNull('deleted_at').first();
  if (!customer) {
    return res.json({ status: 'success', data: { orders: [] } });
  }

  const orders = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select('po.*', 'os.status_name', 'os.status_code', 'os.color_hex')
    .where('po.customer_id', customer.id)
    .whereNull('po.deleted_at')
    .orderBy('po.created_at', 'desc');

  res.json({ status: 'success', data: { orders } });
});

exports.getCustomerTypes = catchAsync(async (req, res) => {
  const customerTypes = await db('customer_types')
    .select('id', 'name', 'color_code', 'icon_name', 'sort_order')
    .orderBy('sort_order', 'asc');
  res.json({
    status: 'success',
    data: { customerTypes }
  });
});
exports.getOrderStatuses = catchAsync(async (req, res) => {
  const statuses = await db('order_statuses')
    .select('id', 'status_code', 'status_name', 'color_hex', 'sort_order')
    .orderBy('sort_order', 'asc');
  res.json({
    status: 'success',
    data: { statuses }
  });
});
exports.getPaperTypes = catchAsync(async (req, res) => {
  const paperTypes = [
    { code: 'A3', name: 'A3', description: '297mm x 420mm' },
    { code: 'A4', name: 'A4', description: '210mm x 297mm' },
    { code: 'A5', name: 'A5', description: '148mm x 210mm' }
  ];
  res.json({
    status: 'success',
    data: { paperTypes }
  });
});
exports.getBindingTypes = catchAsync(async (req, res) => {
  const bindingTypes = [
    { code: 'None', name: 'No Binding', price: 0 },
    { code: 'Spiral', name: 'Spiral Binding', price: 500 },
    { code: 'Thermal', name: 'Thermal Binding', price: 300 }
  ];
  res.json({
    status: 'success',
    data: { bindingTypes }
  });
});
exports.getProductTypes = catchAsync(async (req, res) => {
  let productTypes;
  try {
    productTypes = await db('printing_product_types')
      .select('id', 'code', 'name', 'base_price_per_page', 'color_multiplier', 'is_active')
      .where('is_active', true)
      .orderBy('sort_order', 'asc');
  } catch (e) {
    productTypes = [];
  }
  if (!productTypes || productTypes.length === 0) {
    productTypes = [
      { code: 'Book', name: 'Book Printing', base_price_per_page: 0.50, color_multiplier: 2.00, is_active: true },
      { code: 'Module', name: 'Module Printing', base_price_per_page: 0.60, color_multiplier: 2.00, is_active: true },
      { code: 'Exam', name: 'Exam Paper Printing', base_price_per_page: 0.75, color_multiplier: 2.50, is_active: true },
      { code: 'Brochure', name: 'Brochure Printing', base_price_per_page: 0.40, color_multiplier: 1.50, is_active: true },
      { code: 'TaxReceipt', name: 'Government Tax Receipt', base_price_per_page: 0.30, color_multiplier: 1.00, is_active: true }
    ];
  }
  res.json({
    status: 'success',
    data: { productTypes }
  });
});

exports.closeShift = catchAsync(async (req, res) => {
  const worker_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const sales = await db('printing_orders')
    .where('status_id', deliveredStatus?.id || 8)
    .whereRaw('DATE(created_at) = ?', [today]);
  const totalSales = sales.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  const financeUser = await db('users').join('user_roles', 'users.id', 'user_roles.user_id').join('roles', 'user_roles.role_id', 'roles.id').where('roles.name', 'Finance').first() || { user_id: 3 };
  const [handoverId] = await db('cash_handovers').insert({
    from_user_id: worker_id,
    to_user_id: financeUser.user_id,
    handover_type: 'PRINTING_TO_FINANCE',
    total_cash: totalSales,
    total_amount: totalSales,
    notes: 'Printing Daily Sales Handover',
    status: 'PENDING',
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });
  await audit('PRINTING_SHIFT_CLOSED', worker_id, {
    ip: req.ip,
    resourceId: handoverId,
    details: {
      handoverType: 'PRINTING_TO_FINANCE',
      totalSales,
      handoverTo: financeUser.user_id
    }
  });
  if (req.res) req.res.locals.__centralAudited = true;
  res.json({ status: 'success', message: 'Printing daily sales handed over to finance.' });
});

// ── PUBLIC: Track order by order number (no auth required) ────────
exports.trackOrder = catchAsync(async (req, res) => {
  const { orderNumber } = req.params;
  const order = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .select(
      'po.order_number', 'po.product_type', 'po.quantity', 'po.paper_type',
      'po.color_printing', 'po.binding_type', 'po.due_date', 'po.total_price',
      'po.created_at', 'po.completed_at', 'po.updated_at',
      'os.status_name', 'os.status_code', 'os.color_hex', 'os.sort_order',
      'c.name as customer_name'
    )
    .where('po.order_number', orderNumber)
    .whereNull('po.deleted_at')
    .first();
  if (!order) throw new AppError('Order not found. Please check the order number and try again.', 404);

  // Fetch status history
  const history = await db('order_status_history as osh')
    .leftJoin('printing_orders as po', 'osh.order_id', 'po.id')
    .leftJoin('order_statuses as os', 'osh.status_id', 'os.id')
    .select('os.status_name', 'os.status_code', 'os.color_hex', 'osh.created_at', 'osh.notes')
    .where('po.order_number', orderNumber)
    .orderBy('osh.created_at', 'asc');

  // All possible steps in order
  const allSteps = [
    { code: 'received',    name: 'Order Received',     icon: 'inbox' },
    { code: 'in_queue',    name: 'Job Queue',           icon: 'list' },
    { code: 'in_design',   name: 'In Design',           icon: 'pen-line' },
    { code: 'file_check',  name: 'File Check',          icon: 'file-check' },
    { code: 'in_printing', name: 'In Printing',         icon: 'printer' },
    { code: 'finishing',   name: 'Finishing',           icon: 'scissors' },
    { code: 'ready',       name: 'Ready for Pickup',    icon: 'package-check' },
    { code: 'delivered',   name: 'Delivered',           icon: 'check-circle' },
  ];

  const currentSortOrder = order.sort_order || 1;
  const steps = allSteps.map((step, idx) => {
    const histEntry = history.find(h => h.status_code === step.code);
    const stepOrder = idx + 1;
    return {
      ...step,
      completed: stepOrder < currentSortOrder,
      active: step.code === order.status_code,
      timestamp: histEntry?.created_at || null,
      notes: histEntry?.notes || null,
    };
  });

  res.json({
    status: 'success',
    data: { order, steps }
  });
});
