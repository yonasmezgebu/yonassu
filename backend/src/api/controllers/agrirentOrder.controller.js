const { db } = require('../../config/database');
const notificationRepository = require('../../repositories/notification.repository');
const { sendFinanceNotification, sendCustomerNotification } = require('../../services/notification.service');
const { logger } = require('../../config/logger');
const carRentalAudit = require('../../services/carRentalAudit.service');
const vatConfigService = require('../../services/vatConfig.service');

// ── HELPER: Sync to Finance ───────────────────────────────────────────────────
const syncToFinance = async (order, userId) => {
  try {
    // Prevent duplicate entries by checking invoice_no
    const existing = await db('finance_receivables').where('invoice_no', order.order_number).first();
    
    // Use the exact payment method from the order
    const paymentMethod = order.payment_method || 'Unknown';

    const manualDetails = {
      order_id: order.id,
      order_number: order.order_number,
      tractor_id: order.tractor_id,
      confirmed_by: userId,
      paymentMethod,
      receivedFrom: order.customer_name || 'AgriRent Customer',
      amount: order.total_amount,
      paymentReference: order.payment_reference,
      proofImagePath: order.payment_screenshot,
      bankDetails: null,
      telebirrDetails: null,
      // Flag that this is a system auto-verified record
      financeSignature: true,
      financeName: 'System Auto-Verified',
      
      // AgriRent specific details
      contractDetails: {
        location: order.field_location,
        hectares: order.field_size_hectares,
        purpose: order.farming_purpose,
        days: order.total_days,
        dates: `${new Date(order.start_date).toLocaleDateString()} - ${new Date(order.end_date).toLocaleDateString()}`
      }
    };

    const record = {
      customer_name: order.customer_name || 'AgriRent Customer',
      invoice_no: order.order_number,
      invoice_date: order.created_at || new Date(),
      due_date: order.start_date || new Date(),
      total_amount: order.total_amount,
      amount_paid: order.total_amount,
      outstanding_balance: 0,
      status: 'Paid',
      department_source: 'AgriRent',
      manual_details: JSON.stringify(manualDetails),
      updated_at: new Date()
    };

    if (existing) {
      await db('finance_receivables').where('id', existing.id).update(record);
    } else {
      record.created_at = new Date();
      await db('finance_receivables').insert(record);
    }
  } catch (e) {
    logger.error('Failed to sync AgriRent order to finance_receivables:', e);
  }
};

const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `AGR-${ts}-${rnd}`;
};

// ── PUBLIC: Customer submits an online order ─────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const {
      tractorId, startDate, endDate, fieldLocation, fieldSizeHectares,
      farmingPurpose, specialInstructions, paymentMethod, paymentReference
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'Start and end dates are required' });
    }
    
    let paymentScreenshot = null;
    if (req.file) {
      paymentScreenshot = req.file.filename;
    }

    if (!paymentReference && !paymentScreenshot) {
      return res.status(400).json({ status: 'error', message: 'Either Payment reference or screenshot is required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    let dailyRate = 0;
    let tractorName = '';
    if (tractorId) {
      const tractor = await db('tractors').where({ id: tractorId }).first();
      if (tractor) {
        dailyRate = parseFloat(tractor.dailyRate || tractor.daily_rate || 0);
        tractorName = tractor.name;
      }
    }

    const vatCalc = await vatConfigService.computeVatForItem('agrirent', tractorId || null, dailyRate * totalDays);
    const vatAmount = parseFloat(vatCalc.vat.toFixed(2));
    const totalAmount = dailyRate * totalDays + vatAmount;
    const orderNumber = generateOrderNumber();

    const [id] = await db('agrirent_orders').insert({
      order_number: orderNumber,
      tractor_id: tractorId || null,
      customer_id: req.user.id,
      customer_name: req.user.fullName || req.user.full_name,
      customer_phone: req.user.phone || '',
      customer_email: req.user.email || '',
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      daily_rate: dailyRate,
      subtotal: dailyRate * totalDays,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      field_location: fieldLocation || null,
      field_size_hectares: fieldSizeHectares || null,
      farming_purpose: farmingPurpose || null,
      special_instructions: specialInstructions || null,
      payment_method: paymentMethod || 'Telebirr',
      payment_reference: paymentReference || null,
      payment_screenshot: paymentScreenshot,
      payment_status: 'Pending',
      status: 'pending',
      is_manual: false,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Automatically send to Finance Live Income for verification
    try {
      await db('finance_income_submissions').insert({
        department: 'AgriRent',
        submitted_by: req.user.fullName || req.user.full_name || 'AgriRent Customer',
        amount: totalAmount,
        reference_no: paymentReference || 'SCREENSHOT_UPLOADED',
        description: `AgriRent Order ${orderNumber} - ${req.user.fullName || req.user.full_name || 'Customer'}`,
        status: 'Pending',
        manual_details: JSON.stringify({
          order_id: id,
          paymentMethod: paymentMethod || 'Telebirr',
          paymentReference: paymentReference || null,
          proofImagePath: paymentScreenshot,
          amount: totalAmount,
          receivedFrom: req.user.fullName || req.user.full_name || 'Customer'
        }),
        created_at: new Date(),
        updated_at: new Date()
      });
      sendFinanceNotification({
        title: 'New Income Submission',
        message: `ETB ${totalAmount.toLocaleString()} AgriRent order income submitted for verification (Ref: ${paymentReference || 'SCREENSHOT_UPLOADED'}).`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list',
        related_entity_id: id
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
    } catch (err) {
      logger.error('Failed to submit AgriRent to finance live income:', err.message);
    }

    // Notify manager
    try {
      await notificationRepository.create({
        roleTarget: 'Car Renting Manager',
        title: '🚜 New AgriRent Order',
        message: `Order ${orderNumber} submitted by ${req.user.fullName || req.user.full_name} for machine: ${tractorName || 'TBD'}. Payment ref: ${paymentReference}.`
      });
    } catch (e) { /* non-fatal */ }

    res.status(201).json({
      status: 'success',
      message: 'AgriRent order submitted successfully',
      data: { id, orderNumber, totalAmount, totalDays }
    });
  } catch (error) {
    logger.error('Error creating agrirent order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create order' });
  }
};

// ── MANAGER: Create manual order ─────────────────────────────────────────────
exports.createManualOrder = async (req, res) => {
  try {
    const {
      tractorId, customerName, customerPhone, customerEmail,
      startDate, endDate, dailyRateOverride, fieldLocation,
      fieldSizeHectares, farmingPurpose, specialInstructions,
      paymentMethod, paymentReference, paymentStatus
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ status: 'error', message: 'Customer name and phone are required' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'Start and end dates are required' });
    }

    let paymentScreenshot = null;
    if (req.file) {
      paymentScreenshot = req.file.filename;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    let dailyRate = parseFloat(dailyRateOverride || 0);
    if (!dailyRateOverride && tractorId) {
      const tractor = await db('tractors').where({ id: tractorId }).first();
      if (tractor) dailyRate = parseFloat(tractor.dailyRate || tractor.daily_rate || 0);
    }

    const vatCalc = await vatConfigService.computeVatForItem('agrirent', tractorId || null, dailyRate * totalDays);
    const vatAmount = parseFloat(vatCalc.vat.toFixed(2));
    const totalAmount = dailyRate * totalDays + vatAmount;
    const orderNumber = generateOrderNumber();

    const [id] = await db('agrirent_orders').insert({
      order_number: orderNumber,
      tractor_id: tractorId || null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      daily_rate: dailyRate,
      subtotal: dailyRate * totalDays,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      field_location: fieldLocation || null,
      field_size_hectares: fieldSizeHectares || null,
      farming_purpose: farmingPurpose || null,
      special_instructions: specialInstructions || null,
      payment_method: paymentMethod || 'Cash',
      payment_reference: paymentReference || null,
      payment_screenshot: paymentScreenshot,
      payment_status: paymentStatus || 'Pending',
      status: 'approved', // manual = auto-approved
      is_manual: true,
      created_by: req.user.id,
      approved_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Automatically send to Finance Live Income for verification (if not Cash or if explicitly entered payment details)
    if (paymentMethod !== 'Cash' || paymentReference || paymentScreenshot) {
      try {
        await db('finance_income_submissions').insert({
          department: 'AgriRent',
          submitted_by: req.user.fullName || req.user.full_name || 'Car Renting Manager',
          amount: totalAmount,
          reference_no: paymentReference || 'SCREENSHOT_UPLOADED',
          description: `AgriRent Order ${orderNumber} - ${customerName}`,
          status: 'Pending',
          manual_details: JSON.stringify({
            order_id: id,
            paymentMethod: paymentMethod || 'Cash',
            paymentReference: paymentReference || null,
            proofImagePath: paymentScreenshot,
            amount: totalAmount,
            receivedFrom: customerName
          }),
          created_at: new Date(),
          updated_at: new Date()
        });
        sendFinanceNotification({
          title: 'New Income Submission',
          message: `ETB ${totalAmount.toLocaleString()} AgriRent manual order income submitted for verification (Ref: ${paymentReference || 'SCREENSHOT_UPLOADED'}).`,
          type: 'finance',
          link: '/finance/pharmacy-sales?tab=list',
          related_entity_id: id
        }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
      } catch (err) {
        logger.error('Failed to submit manual AgriRent to finance live income:', err.message);
      }
    }

    carRentalAudit.log(req, 'AgriRent Order Created (Manual)', orderNumber, null, {
      order_number: orderNumber, tractor_id: tractorId || null, customer_name: customerName,
      total_days: totalDays, daily_rate: dailyRate, total_amount: totalAmount,
      field_location: fieldLocation || null, field_size_hectares: fieldSizeHectares || null,
      payment_method: paymentMethod || 'Cash', status: 'approved', is_manual: true
    });

    res.status(201).json({
      status: 'success',
      message: 'Manual order created successfully',
      data: { id, orderNumber, totalAmount, totalDays }
    });
  } catch (error) {
    logger.error('Error creating manual agrirent order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create manual order' });
  }
};

// ── MANAGER/FINANCE: Get single order ────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('agrirent_orders as ao')
      .leftJoin('tractors as t', 'ao.tractor_id', 't.id')
      .leftJoin('users as u', 'ao.created_by', 'u.id')
      .select(
        'ao.*',
        't.name as tractor_name',
        't.tractor_type as tractor_type_label',
        't.image1 as tractor_image',
        'u.full_name as created_by_name'
      )
      .where('ao.id', id)
      .whereNull('ao.deleted_at')
      .first();

    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    logger.error('Error fetching agrirent order by id:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch order' });
  }
};

// ── CUSTOMER: Get my orders ───────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await db('agrirent_orders as ao')
      .leftJoin('tractors as t', 'ao.tractor_id', 't.id')
      .select(
        'ao.*',
        't.name as tractor_name',
        't.tractor_type as tractor_type_label',
        't.image1 as tractor_image'
      )
      .where('ao.customer_id', req.user.id)
      .where(function() {
        this.where('ao.is_deleted_by_customer', false).orWhereNull('ao.is_deleted_by_customer');
      })
      .whereNull('ao.deleted_at')
      .orderBy('ao.created_at', 'desc');

    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    logger.error('Error fetching customer agrirent orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch your orders' });
  }
};

// ── MANAGER: Get all orders ───────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 25, status, paymentStatus, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db('agrirent_orders as ao')
      .leftJoin('tractors as t', 'ao.tractor_id', 't.id')
      .select(
        'ao.*',
        't.name as tractor_name',
        't.tractor_type as tractor_type_label'
      )
      .whereNull('ao.deleted_at');

    if (status) query = query.where('ao.status', status);
    if (paymentStatus) query = query.where('ao.payment_status', paymentStatus);
    if (search) {
      query = query.where(function() {
        this.where('ao.order_number', 'like', `%${search}%`)
          .orWhere('ao.customer_name', 'like', `%${search}%`)
          .orWhere('ao.customer_phone', 'like', `%${search}%`);
      });
    }

    const [{ total }] = await query.clone().clearSelect().count('ao.id as total');
    const orders = await query.orderBy('ao.created_at', 'desc').limit(parseInt(limit)).offset(offset);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          total: parseInt(total),
          totalPages: Math.ceil(parseInt(total) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching agrirent orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
  }
};

// ── MANAGER: Update order status ──────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerNote } = req.body;

    const order = await db('agrirent_orders').where({ id }).first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const updateData = {
      status,
      manager_note: managerNote || order.manager_note,
      updated_at: new Date()
    };
    if (status === 'approved') updateData.approved_at = new Date();
    if (status === 'cancelled') updateData.cancelled_at = new Date();

    await db('agrirent_orders').where({ id }).update(updateData);

    // Update tractor availability
    if (order.tractor_id) {
      if (['active', 'approved', 'confirmed'].includes(status)) {
        await db('tractors').where({ id: order.tractor_id }).update({ availability: 'Booked' });
      } else if (['completed', 'cancelled', 'rejected'].includes(status)) {
        await db('tractors').where({ id: order.tractor_id }).update({ availability: 'Available' });
      }
    }

    // Notify customer
    const messages = {
      approved: 'Your AgriRent order has been approved! Await payment confirmation.',
      confirmed: 'Payment confirmed! Your machine will be dispatched on the scheduled date.',
      active: 'Your hired machine is now active on your field.',
      completed: 'AgriRent service completed. Thank you!',
      cancelled: `Your AgriRent order was cancelled. ${managerNote ? 'Note: ' + managerNote : ''}`
    };

    if (order.customer_id && messages[status]) {
      try {
        await sendCustomerNotification({
          user_id: order.customer_id,
          title: `AgriRent Order ${order.order_number}`,
          message: messages[status],
          type: 'agri',
          link: '/customer/farming-orders',
          related_entity_id: order.id
        }, req.app?.get('io'));
      } catch (e) { /* non-fatal */ }
    }

    const updated = await db('agrirent_orders').where({ id }).first();
    carRentalAudit.log(req, `AgriRent Order ${String(status).toLowerCase()}`, order.order_number,
      { status: order.status, manager_note: order.manager_note },
      { status, manager_note: managerNote || order.manager_note }
    );
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating agrirent order status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order status' });
  }
};

// ── MANAGER: Update payment status ───────────────────────────────────────────
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const order = await db('agrirent_orders').where({ id }).first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    if (order.payment_status === 'Confirmed' && paymentStatus !== 'Confirmed') {
      return res.status(400).json({ status: 'error', message: 'Payment is already confirmed and recorded in Finance.' });
    }

    await db('agrirent_orders').where({ id }).update({
      payment_status: paymentStatus,
      updated_at: new Date()
    });

    carRentalAudit.log(req, 'AgriRent Order Payment Status Changed', order.order_number,
      { payment_status: order.payment_status },
      { payment_status: paymentStatus }
    );

    // If confirmed, push to finance book automatically
    if (paymentStatus === 'Confirmed') {
      await syncToFinance(order, req.user.id);
    }

    res.status(200).json({ status: 'success', message: 'Payment status updated' });
  } catch (error) {
    logger.error('Error updating payment status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update payment status' });
  }
};

// ── FINANCE: Verify payment ───────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, notes } = req.body;

    const order = await db('agrirent_orders').where({ id }).first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const updateData = {
      payment_status: isVerified ? 'Confirmed' : 'Rejected',
      finance_notes: notes || null,
      verified_by: req.user.id,
      verified_at: new Date(),
      updated_at: new Date()
    };

    if (isVerified) {
      updateData.status = 'confirmed';
      // Push to finance book automatically when finance verifies
      await syncToFinance(order, req.user.id);
    }

    await db('agrirent_orders').where({ id }).update(updateData);

    if (order.customer_id) {
      try {
        await notificationRepository.create({
          userId: order.customer_id,
          title: isVerified ? '✅ Payment Confirmed' : '❌ Payment Rejected',
          message: isVerified
            ? `Your payment for AgriRent order ${order.order_number} has been confirmed. Rental is now confirmed.`
            : `Your payment for ${order.order_number} was rejected. ${notes ? 'Reason: ' + notes : 'Please contact us.'}`
        });
      } catch (e) { /* non-fatal */ }
    }

    const updated = await db('agrirent_orders').where({ id }).first();
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error verifying agrirent payment:', error);
    res.status(500).json({ status: 'error', message: 'Failed to verify payment' });
  }
};

// ── FINANCE: Get pending payments ─────────────────────────────────────────────
exports.getPendingPayments = async (req, res) => {
  try {
    const orders = await db('agrirent_orders as ao')
      .leftJoin('tractors as t', 'ao.tractor_id', 't.id')
      .select('ao.*', 't.name as tractor_name')
      .where('ao.payment_status', 'Pending')
      .whereNotNull('ao.payment_reference')
      .whereNull('ao.deleted_at')
      .orderBy('ao.created_at', 'desc');

    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    logger.error('Error fetching pending agrirent payments:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch pending payments' });
  }
};
