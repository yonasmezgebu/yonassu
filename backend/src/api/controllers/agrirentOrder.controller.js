const { db } = require('../../config/database');
const notificationRepository = require('../../repositories/notification.repository');
const { sendFinanceNotification, sendCustomerNotification } = require('../../services/notification.service');
const { logger } = require('../../config/logger');
const carRentalAudit = require('../../services/carRentalAudit.service');
const vatConfigService = require('../../services/vatConfig.service');
const { generateInvoiceNumber } = require('../../utils/orderNumber');
const { recordInvoiceForOrder, recordReceiptForOrder, findInvoiceForOrder } = require('../../services/invoiceDocument.service');
const { notifyWaitlistForTractor } = require('../../services/agriRentWaitlist.service');

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

// ── HELPER: Rental / payment state ────────────────────────────────────────────
const isPaidStatus = (s) => ['Confirmed', 'PAID', 'PAYMENT_VERIFIED'].includes(s || '');
const isStartReached = (order) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(order.start_date);
  start.setHours(0, 0, 0, 0);
  return start <= today;
};

// 🔒 Prevent the same machine being booked twice while it is actually OUT with a
// customer. A rental only "occupies" the machine from the moment it is released
// (released_at set) until it is returned/completed (completed_at set). Once a
// rental is released AND completed/cancelled the machine is free again, so a
// stale pending row no longer freezes the fleet.
const checkTractorAvailable = async (tractorId) => {
  if (!tractorId) return { ok: true };
  const tractor = await db('tractors').where({ id: tractorId }).first();
  if (!tractor) return { ok: false, message: 'The selected machine was not found.' };

  if (tractor.availability && tractor.availability !== 'Available') {
    return {
      ok: false,
      message: `"${tractor.name}" is currently ${tractor.availability} for another AgriRent order. It becomes bookable again automatically once that rental is released, returned or cancelled. Please choose another machine or contact us.`
    };
  }

  const conflict = await db('agrirent_orders')
    .where({ tractor_id: tractorId })
    .whereNull('deleted_at')
    .where(function () {
      // Released to the field but not yet returned / completed — still occupies.
      this.whereNotNull('released_at').whereNull('completed_at')
        .orWhere('status', 'active');
    })
    .select('order_number', 'id')
    .first();
  if (conflict) {
    return {
      ok: false,
      message: `"${tractor.name}" is already reserved under order ${conflict.order_number}. A booked machine cannot be reserved again until that rental is released and completed.`
    };
  }
  return { ok: true };
};

// 🚜 Release the machine to the field once the paid line is reached
// (payment confirmed) and the order has been approved. Manual release is done
// through the updateOrderStatus endpoint (status: 'active').
const maybeAutoRelease = async (order) => {
  try {
    if (!order || order.id == null) return false;
    if (!isPaidStatus(order.payment_status)) return false;
    if (!['approved', 'confirmed'].includes(order.status)) return false;
    if (!isStartReached(order)) return false;

    await db('agrirent_orders').where({ id: order.id }).update({
      status: 'active',
      released_at: new Date(),
      updated_at: new Date()
    });
    if (order.tractor_id) {
      await db('tractors').where({ id: order.tractor_id }).update({ availability: 'Booked' });
    }
    if (order.customer_id) {
      try {
        await sendCustomerNotification({
          user_id: order.customer_id,
          title: `AgriRent Order ${order.order_number}`,
          message: 'Payment confirmed — your hired machine has been released and is now active on your field.',
          type: 'agri',
          link: '/customer/farming-orders',
          related_entity_id: order.id
        }, null);
      } catch (e) { /* non-fatal */ }
    }
    logger.info(`AgriRent order ${order.order_number} auto-released (paid line reached)`);
    return true;
  } catch (e) {
    logger.error('Failed to auto-release AgriRent order:', e.message);
    return false;
  }
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

    // A machine that is already reserved cannot be booked again before release
    const availCheck = await checkTractorAvailable(tractorId);
    if (!availCheck.ok) {
      return res.status(400).json({ status: 'error', message: availCheck.message });
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

    // Reserve the machine immediately so it cannot be re-booked before release
    if (tractorId) {
      await db('tractors').where({ id: tractorId }).update({ availability: 'Booked' });
    }

    // Invoice is recorded immediately when the AgriRent booking is placed, with
    // the correct VAT — finance approval then only attaches the receipt (never
    // mints a second/VAT-free invoice).
    try {
      await recordInvoiceForOrder(db, {
        source: 'agrirent',
        saleId: id,
        saleType: /cash/i.test(paymentMethod || '') ? 'walk_in' : 'online',
        invoiceNo: await generateInvoiceNumber(),
        customer: req.user.fullName || req.user.full_name || null,
        customerTin: null,
        lines: [{
          itemId: tractorId || 0,
          name: 'Tractor Rental',
          qty: totalDays,
          unitPrice: dailyRate,
          amount: dailyRate * totalDays,
          rate: vatCalc.rate,
          treatment: vatCalc.treatment
        }],
        createdBy: req.user.fullName || req.user.full_name || 'Customer Portal'
      });
    } catch (err) {
      logger.error('Failed to record AgriRent invoice:', err.message);
    }

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
      paymentMethod, paymentReference, paymentStatus,
      scheduleLater, waitlistId
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ status: 'error', message: 'Customer name and phone are required' });
    }

    const isScheduleLater = scheduleLater === true || scheduleLater === 'true' || (!startDate && !endDate);

    // "Schedule later" walk-ins: created today with NO dates because the machine
    // is still booked by the current order. The manager fills start/end later
    // (PATCH /:id/dates) once the machine is actually available.
    if (!isScheduleLater && (!startDate || !endDate)) {
      return res.status(400).json({ status: 'error', message: 'Start and end dates are required' });
    }

    let paymentScreenshot = null;
    if (req.file) {
      paymentScreenshot = req.file.filename;
    }

    let totalDays = 0;
    let dailyRate = parseFloat(dailyRateOverride || 0);
    let subtotal = 0;
    let vatAmount = 0;
    let totalAmount = 0;

    if (!isScheduleLater) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      if (!dailyRateOverride && tractorId) {
        const tractor = await db('tractors').where({ id: tractorId }).first();
        if (tractor) dailyRate = parseFloat(tractor.dailyRate || tractor.daily_rate || 0);
      }
      const vatCalc = await vatConfigService.computeVatForItem('agrirent', tractorId || null, dailyRate * totalDays);
      vatAmount = parseFloat(vatCalc.vat.toFixed(2));
      totalAmount = dailyRate * totalDays + vatAmount;
    } else {
      // Dates come later — keep the machine unaffected. It is already booked by
      // the CURRENT order, so the normal availability guard would reject us;
      // that is expected and desired here.
      dailyRate = parseFloat(dailyRateOverride || 0);
      if (!dailyRateOverride && tractorId) {
        const tractor = await db('tractors').where({ id: tractorId }).first();
        if (tractor) dailyRate = parseFloat(tractor.dailyRate || tractor.daily_rate || 0);
      }
    }

    // A machine that is already reserved cannot be booked with actual dates
    // before release — but schedule-later holds are allowed (the waitlist
    // customer is simply next in line for that machine).
    if (!isScheduleLater && tractorId) {
      const availCheck = await checkTractorAvailable(tractorId);
      if (!availCheck.ok) {
        return res.status(400).json({ status: 'error', message: availCheck.message });
      }
    }

    const orderNumber = generateOrderNumber();

    const [id] = await db('agrirent_orders').insert({
      order_number: orderNumber,
      tractor_id: tractorId || null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      start_date: isScheduleLater ? null : startDate,
      end_date: isScheduleLater ? null : endDate,
      total_days: totalDays,
      daily_rate: dailyRate,
      subtotal: subtotal,
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
      scheduled_later: isScheduleLater ? true : false,
      waitlist_id: waitlistId || null,
      created_by: req.user.id,
      approved_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Reserve the machine immediately so it cannot be re-booked before release —
    // but NOT for a schedule-later hold (that machine is already booked by the
    // current order; we are simply reserving a place for the next customer).
    if (tractorId && !isScheduleLater) {
      await db('tractors').where({ id: tractorId }).update({ availability: 'Booked' });
    }
    // Walk-in orders that are already paid get released immediately on the paid line
    if (!isScheduleLater && isPaidStatus(paymentStatus || '') && isStartReached({ start_date: startDate })) {
      await maybeAutoRelease({
        id,
        order_number: orderNumber,
        tractor_id: tractorId || null,
        customer_id: null,
        customer_name: null,
        status: 'approved',
        payment_status: paymentStatus,
        start_date: startDate
      });
    }

    // Invoice is recorded immediately (with the correct VAT). Schedule-later
    // holds have no amount yet, so the invoice is minted later via order dates.
    if (!isScheduleLater) {
      try {
        await recordInvoiceForOrder(db, {
          source: 'agrirent',
          saleId: id,
          saleType: /cash/i.test(paymentMethod || '') ? 'walk_in' : 'online',
          invoiceNo: await generateInvoiceNumber(),
          customer: customerName || null,
          customerTin: null,
          lines: [{
            itemId: tractorId || 0,
            name: 'Tractor Rental',
            qty: totalDays,
            unitPrice: dailyRate,
            amount: dailyRate * totalDays,
            rate: vatCalc.rate,
            treatment: vatCalc.treatment
          }],
          createdBy: req.user.fullName || req.user.full_name || 'Car Renting Manager'
        });
      } catch (err) {
        logger.error('Failed to record AgriRent manual invoice:', err.message);
      }
    }

    // Automatically send to Finance Live Income for verification. Skip for
    // schedule-later holds (no amount yet).
    if (!isScheduleLater && (paymentMethod !== 'Cash' || paymentReference || paymentScreenshot)) {
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

    carRentalAudit.log(req, isScheduleLater
      ? 'AgriRent Order Created (Schedule Later)'
      : 'AgriRent Order Created (Manual)', orderNumber, null, {
      order_number: orderNumber, tractor_id: tractorId || null, customer_name: customerName,
      total_days: totalDays, daily_rate: dailyRate, total_amount: totalAmount,
      scheduled_later: !!isScheduleLater, waitlist_id: waitlistId || null,
      field_location: fieldLocation || null, field_size_hectares: fieldSizeHectares || null,
      payment_method: paymentMethod || 'Cash', status: 'approved', is_manual: true
    });

    res.status(201).json({
      status: 'success',
      message: isScheduleLater
        ? 'Schedule-later order created. Fill in the hire dates once the machine is available.'
        : 'Manual order created successfully',
      data: { id, orderNumber, totalAmount, totalDays, scheduledLater: !!isScheduleLater }
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
      .where(function () {
        // Orders belonging to this account (by user id), or recorded under the
        // same email (manual/walk-in orders) must also appear on the dashboard.
        this.where('ao.customer_id', req.user.id)
          .orWhere('ao.customer_email', req.user.email || '');
      })
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

// ── ARCHIVE / HISTORY / DELETE (Manager) ──────────────────────────────────────
const AGRI_TERMINAL_STATUSES = ['completed', 'cancelled'];

// ── MANAGER: Schedule-later orders that still need their hire dates set ──────
// Created for waitlist customers while their machine was still booked. The
// manager fills in start/end dates here (PATCH /:id/dates) once it is free.
exports.getScheduleLaterOrders = async (req, res) => {
  try {
    const orders = await db('agrirent_orders as ao')
      .leftJoin('tractors as t', 'ao.tractor_id', 't.id')
      .where('ao.scheduled_later', true)
      .whereNull('ao.deleted_at')
      .whereNotIn('ao.status', ['completed', 'cancelled', 'rejected'])
      .select(
        'ao.id', 'ao.order_number', 'ao.customer_name', 'ao.customer_phone',
        'ao.customer_email', 'ao.tractor_id', 'ao.payment_method',
        'ao.payment_status', 'ao.farming_purpose', 'ao.field_location',
        'ao.field_size_hectares', 'ao.total_days', 'ao.start_date', 'ao.end_date',
        'ao.daily_rate', 'ao.created_at',
        't.name as tractor_name', 't.availability as tractor_availability'
      )
      .orderBy('ao.created_at', 'desc')
      .limit(200);
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    logger.error('Error fetching schedule-later agrirent orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders awaiting dates' });
  }
};

// ── MANAGER: Set hire start/end dates on a schedule-later order ──────────────
// Called once the machine has returned to 'Available'. This finalizes the
// booking: computes the amount, mints the invoice, submits to finance, and
// marks the machine Booked again for this (confirmed) customer.
exports.setOrderDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, dailyRateOverride } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'Both start and end dates are required' });
    }

    const order = await db('agrirent_orders').where({ id }).whereNull('deleted_at').first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return res.status(400).json({ status: 'error', message: 'End date must be after start date' });
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    let dailyRate = parseFloat(dailyRateOverride || order.daily_rate || 0);
    if (!dailyRateOverride && order.tractor_id) {
      const tractor = await db('tractors').where({ id: order.tractor_id }).first();
      if (tractor) dailyRate = parseFloat(tractor.dailyRate || tractor.daily_rate || 0);
    }
    const vatCalc = await vatConfigService.computeVatForItem('agrirent', order.tractor_id || null, dailyRate * totalDays);
    const vatAmount = parseFloat(vatCalc.vat.toFixed(2));
    const subtotal = dailyRate * totalDays;
    const totalAmount = dailyRate * totalDays + vatAmount;

    await db('agrirent_orders').where({ id }).update({
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      daily_rate: dailyRate,
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      scheduled_later: false,
      updated_at: new Date()
    });

    // Machine is now reserved for this (confirmed) customer.
    if (order.tractor_id) {
      await db('tractors').where({ id: order.tractor_id }).update({ availability: 'Booked' });
    }

    // Mint the invoice now that the amount is known.
    try {
      await recordInvoiceForOrder(db, {
        source: 'agrirent',
        saleId: id,
        saleType: /cash/i.test(order.payment_method || '') ? 'walk_in' : 'online',
        invoiceNo: await generateInvoiceNumber(),
        customer: order.customer_name || null,
        customerTin: null,
        lines: [{
          itemId: order.tractor_id || 0,
          name: 'Tractor Rental',
          qty: totalDays,
          unitPrice: dailyRate,
          amount: dailyRate * totalDays,
          rate: vatCalc.rate,
          treatment: vatCalc.treatment
        }],
        createdBy: req.user.fullName || req.user.full_name || 'Car Renting Manager'
      });
    } catch (err) {
      logger.error('Failed to record AgriRent invoice on date set:', err.message);
    }

    carRentalAudit.log(req, 'AgriRent Order Dates Set', order.order_number, null, {
      start_date: startDate, end_date: endDate, total_days: totalDays, total_amount: totalAmount
    });

    // The availability request is now fulfilled — this customer is confirmed
    // for the machine. Mark it converted (it stayed 'waiting' until now).
    if (order.waitlist_id) {
      try {
        await db('agrirent_waitlist').where({ id: order.waitlist_id }).update({
          status: 'converted',
          converted_order_id: id,
          converted_at: new Date()
        });
      } catch (err) {
        logger.error('Error converting waitlist entry on date set:', err.message);
      }
    }

    const updated = await db('agrirent_orders').where({ id }).first();
    res.status(200).json({
      status: 'success',
      message: 'Hire dates set. The customer is now booked for this machine.',
      data: updated
    });
  } catch (error) {
    logger.error('Error setting agrirent order dates:', error);
    res.status(500).json({ status: 'error', message: 'Failed to set the hire dates' });
  }
};

const agriOrderSelect = () => db('agrirent_orders as ao')
  .leftJoin('tractors as t', 'ao.tractor_id', 't.id')
  .select(
    'ao.*',
    't.name as tractor_name',
    't.tractor_type as tractor_type_label',
    't.image1 as tractor_image'
  )
  .whereNull('ao.deleted_at');

exports.getArchivedOrders = async (req, res) => {
  try {
    // Manual (walk-in) orders live in the rental list already — don't duplicate them in history.
    const orders = await agriOrderSelect()
      .whereNotNull('ao.archived_at')
      .whereNot('ao.is_manual', true)
      .orderBy('ao.created_at', 'desc');
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    logger.error('Error fetching archived agrirent orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch agri rent history' });
  }
};

exports.archiveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('agrirent_orders').where({ id }).whereNull('deleted_at').first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.is_manual) {
      return res.status(400).json({ status: 'error', message: 'Manual orders stay in the rental list and are not moved to history' });
    }
    if (!AGRI_TERMINAL_STATUSES.includes(order.status)) {
      return res.status(400).json({ status: 'error', message: 'Only completed or cancelled orders can be moved to history' });
    }
    if (order.archived_at) {
      return res.status(400).json({ status: 'error', message: 'Order already in history' });
    }
    await db('agrirent_orders').where('id', id).update({ archived_at: db.fn.now(), updated_at: new Date() });
    carRentalAudit.log(req, 'AgriRent order moved to history', order.order_number,
      { status: order.status, tractor_id: order.tractor_id },
      { archived_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: 'Order moved to history' });
  } catch (error) {
    logger.error('Error archiving agrirent order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to move order to history' });
  }
};

exports.bulkArchiveOrders = async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order ids provided' });
    }
    const orders = await db('agrirent_orders').whereIn('id', ids).whereNull('deleted_at');
    const invalid = orders
      .filter(o => !o.is_manual)
      .filter(o => !AGRI_TERMINAL_STATUSES.includes(o.status));
    if (invalid.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Only completed or cancelled orders can be moved to history',
        invalidIds: invalid.map(o => o.id)
      });
    }
    const archiveIds = orders.filter(o => !o.is_manual).map(o => o.id);
    const moved = await db('agrirent_orders')
      .whereIn('id', archiveIds)
      .update({ archived_at: db.fn.now(), updated_at: new Date() });
    carRentalAudit.log(req, `${moved} agrirent order(s) moved to history`, null,
      { ids },
      { archived_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: `${moved} order(s) moved to history`, moved });
  } catch (error) {
    logger.error('Error bulk archiving agrirent orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to move orders to history' });
  }
};

exports.restoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('agrirent_orders').where({ id }).whereNull('deleted_at').first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    await db('agrirent_orders').where('id', id).update({ archived_at: null, updated_at: new Date() });
    carRentalAudit.log(req, 'AgriRent order restored from history', order.order_number,
      { status: order.status },
      { restored_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: 'Order restored from history' });
  } catch (error) {
    logger.error('Error restoring agrirent order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to restore order' });
  }
};

exports.bulkRestoreOrders = async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order ids provided' });
    }
    const restored = await db('agrirent_orders')
      .whereIn('id', ids)
      .whereNull('deleted_at')
      .update({ archived_at: null, updated_at: new Date() });
    carRentalAudit.log(req, `${restored} agrirent order(s) restored from history`, null,
      { ids },
      { restored_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: `${restored} order(s) restored`, restored });
  } catch (error) {
    logger.error('Error bulk restoring agrirent orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to restore orders' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('agrirent_orders').where({ id }).whereNull('deleted_at').first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (!AGRI_TERMINAL_STATUSES.includes(order.status)) {
      return res.status(400).json({ status: 'error', message: 'Only completed or cancelled orders can be deleted' });
    }
    await db('agrirent_orders').where('id', id).update({ deleted_at: db.fn.now(), updated_at: new Date() });
    carRentalAudit.log(req, 'AgriRent order deleted', order.order_number,
      { status: order.status },
      { deleted_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: 'Order deleted' });
  } catch (error) {
    logger.error('Error deleting agrirent order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete order' });
  }
};

exports.bulkDeleteOrders = async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order ids provided' });
    }
    const orders = await db('agrirent_orders').whereIn('id', ids).whereNull('deleted_at');
    const invalid = orders.filter(o => !AGRI_TERMINAL_STATUSES.includes(o.status));
    if (invalid.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Only completed or cancelled orders can be deleted',
        invalidIds: invalid.map(o => o.id)
      });
    }
    const deleted = await db('agrirent_orders')
      .whereIn('id', ids)
      .update({ deleted_at: db.fn.now(), updated_at: new Date() });
    carRentalAudit.log(req, `${deleted} agrirent order(s) deleted`, null,
      { ids },
      { deleted_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: `${deleted} order(s) deleted`, deleted });
  } catch (error) {
    logger.error('Error bulk deleting agrirent orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete orders' });
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
    if (status === 'active' && !order.released_at) updateData.released_at = new Date();
    if (status === 'completed') updateData.completed_at = new Date();
    if (status === 'cancelled') updateData.cancelled_at = new Date();

    await db('agrirent_orders').where({ id }).update(updateData);

    // Update tractor availability
    if (order.tractor_id) {
      if (['active', 'approved', 'confirmed'].includes(status)) {
        await db('tractors').where({ id: order.tractor_id }).update({ availability: 'Booked' });
      } else if (['completed', 'cancelled', 'rejected'].includes(status)) {
        await db('tractors').where({ id: order.tractor_id }).update({ availability: 'Available' });
        // Machine is back in the yard — wake up customers waiting for it.
        notifyWaitlistForTractor(order.tractor_id, req.app?.get('io'));
      }
    }

    // Release automatically once the manager approves a paid order whose
    // start date has been reached (the paid line has been reached).
    if (status === 'approved') {
      const refreshed = await db('agrirent_orders').where({ id }).first();
      await maybeAutoRelease(refreshed);
    }

    // Notify customer
    const messages = {
      approved: 'Your AgriRent order has been approved! Await payment confirmation.',
      confirmed: 'Payment confirmed! Your machine will be dispatched on the scheduled date.',
      active: 'Your hired machine has been released and is now active on your field.',
      completed: 'AgriRent service completed — the machine has been released back. Thank you!',
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
      // Release the machine once the paid line is reached
      await maybeAutoRelease({ ...order, payment_status: 'Confirmed' });
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

    if (isVerified && ['Confirmed', 'PAID'].includes(order.payment_status)) {
      return res.status(400).json({ status: 'error', message: 'Payment is already confirmed and recorded in Finance.' });
    }

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

      // Attach the sales receipt to the order-time invoice (created at order time
      // with the correct VAT), so the invoice shows PAID — never a duplicate.
      try {
        let invoice = await findInvoiceForOrder(db, 'agrirent', order.id);
        if (!invoice) {
          const invNo = await generateInvoiceNumber();
          const vatCalc = await vatConfigService.computeVatForItem('agrirent', order.tractor_id || null, parseFloat(order.subtotal || 0));
          const created = await recordInvoiceForOrder(db, {
            source: 'agrirent',
            saleId: order.id,
            saleType: /cash/i.test(order.payment_method || '') ? 'walk_in' : 'online',
            invoiceNo: invNo,
            customer: order.customer_name || null,
            customerTin: null,
            lines: [{
              itemId: order.tractor_id || 0,
              name: 'Tractor Rental',
              qty: parseFloat(order.total_days) || 1,
              unitPrice: parseFloat(order.daily_rate) || 0,
              amount: parseFloat(order.subtotal) || 0,
              rate: vatCalc.rate,
              treatment: vatCalc.treatment
            }],
            createdBy: req.user.fullName || req.user.full_name || 'Finance Officer'
          });
          invoice = { id: created.invoiceId };
        }
        await recordReceiptForOrder(db, {
          invoiceId: invoice.id,
          amountPaid: parseFloat(order.total_amount) || 0,
          paymentMethod: order.payment_method || 'Cash',
          paymentReference: order.payment_reference || null,
          receivedBy: req.user.fullName || req.user.full_name || 'Finance Officer'
        });
      } catch (err) {
        logger.error('Failed to record AgriRent receipt:', err.message);
      }

      // Record income into the canonical ledger (CRV + cashbook + revenue book).
      // Keyed by order number so the revenue-book row merges with syncToFinance.
      try {
        const { recordIncomeToLedger } = require('../../utils/financeIncome.service');
        await recordIncomeToLedger({
          receivedFrom: order.customer_name || 'AgriRent Customer',
          amount: parseFloat(order.total_amount) || 0,
          paymentMethod: order.payment_method || 'Cash',
          description: `AgriRent income − ${order.order_number}`,
          referenceNo: order.payment_reference || `AGR-${order.order_number}`,
          receivableInvoiceNo: order.order_number,
          department: 'AgriRent',
          extraReceivableDetails: { order_id: String(order.id), orderNumber: order.order_number },
        });
      } catch (err) {
        logger.error('Failed to record AgriRent income into ledger:', err.message);
      }
    }

    await db('agrirent_orders').where({ id }).update(updateData);

    // Release the machine automatically once the paid line is reached
    // (payment verified on an approved/due order).
    if (isVerified) {
      await maybeAutoRelease({ ...order, payment_status: 'Confirmed' });
    }

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
