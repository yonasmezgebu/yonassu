const crypto = require('crypto');
const { db } = require('../../config/database');
const rentalOrderRepository = require('../../repositories/rentalOrder.repository');
const carRepository = require('../../repositories/car.repository');
const notificationRepository = require('../../repositories/notification.repository');
const { sendNotification } = require('../../services/notification.service');
const { sendFinanceNotification, sendCustomerNotification } = require('../../services/notification.service');
const RentalOrder = require('../../models/RentalOrder.model');
const AppError = require('../../utils/AppError');
const { logger } = require('../../config/logger');
const carRentalAudit = require('../../services/carRentalAudit.service');
const vatConfigService = require('../../services/vatConfig.service');
const { generateInvoiceNumber } = require('../../utils/orderNumber');
const { recordInvoiceForOrder, recordReceiptForOrder, findInvoiceForOrder } = require('../../services/invoiceDocument.service');

// ── HELPER: Sync car rental payment to Finance Receivables ───────────────────────
// Mirrors same logic as AgriRent syncToFinance
const syncRentalToFinance = async (order, userId, verifiedAmount) => {
  try {
    // Prevent duplicate entries — upsert by order_number
    const existing = await db('finance_receivables')
      .where('invoice_no', order.order_number || order.orderNumber)
      .first();

    // Resolve car name from join if not already on order object
    let carName = order.car_name || order.carName || 'Car Rental';
    if (!carName || carName === 'Car Rental') {
      const car = await db('cars').where('id', order.car_id || order.carId).select('name').first();
      if (car) carName = car.name;
    }

    const paymentMethod = order.payment_method || order.paymentMethod || 'Unknown';
    const orderNumber = order.order_number || order.orderNumber;
    const customerName = order.customer_name || order.customerName || 'Car Rental Customer';
    const paidAmount = parseFloat(verifiedAmount || order.verified_amount || order.total_amount || order.totalAmount || 0);
    const totalAmount = parseFloat(order.total_amount || order.totalAmount || 0);

    const manualDetails = {
      order_id: order.id,
      order_number: orderNumber,
      car_id: order.car_id || order.carId,
      confirmed_by: userId,
      paymentMethod,
      receivedFrom: customerName,
      amount: paidAmount,
      paymentReference: order.payment_reference || order.paymentReference,
      proofImagePath: order.payment_proof_url || order.paymentProofUrl,
      bankDetails: null,
      telebirrDetails: null,
      financeSignature: true,
      financeName: 'Finance Verified',
      // Car Rental specific contract details
      contractDetails: {
        carName,
        driverName: order.driver_name || order.driverName,
        driverLicense: order.driver_license || order.driverLicense,
        dates: `${new Date(order.pickup_date || order.pickupDate).toLocaleDateString()} → ${new Date(order.return_date || order.returnDate).toLocaleDateString()}`,
        totalDays: order.total_days || order.totalDays,
        dailyRate: order.daily_rate || order.dailyRate,
        rentalAmount: order.rental_amount || order.rentalAmount,
        securityDeposit: order.security_deposit || order.securityDeposit,
        extensionFee: order.extension_fee || order.extensionFee || 0,
        damageFee: order.damage_fee || order.damageFee || 0,
        lateFee: order.late_fee || order.lateFee || 0,
        specialRequests: order.special_requests || order.specialRequests
      }
    };

    const record = {
      customer_name: customerName,
      invoice_no: orderNumber,
      invoice_date: order.created_at || new Date(),
      due_date: order.pickup_date || order.pickupDate || new Date(),
      total_amount: totalAmount,
      amount_paid: paidAmount,
      outstanding_balance: Math.max(0, totalAmount - paidAmount),
      status: paidAmount >= totalAmount ? 'Paid' : 'Partial',
      department_source: 'Car Rental',
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
    logger.error('Failed to sync car rental order to finance_receivables:', e);
  }
};

// 🔒 Prevent the same car being reserved twice while it is actually OUT with a
// customer (or explicitly Booked / under Maintenance). Once a rental has been
// returned (COMPLETED/CLOSED) or cancelled the car is free again, so a stale
// booking row no longer freezes the fleet — mirrors the AgriRent guard.
const checkCarAvailable = async (carId) => {
  if (!carId) return { ok: true };
  const car = await carRepository.findById(carId);
  if (!car) return { ok: false, message: 'The selected vehicle was not found.' };

  if (car.availability && car.availability !== 'Available') {
    return {
      ok: false,
      message: `"${car.name}" is currently ${car.availability} for another rental. It becomes bookable again automatically once that rental is returned, released or cancelled. Please choose another vehicle or contact us.`
    };
  }

  const conflict = await db('rental_orders')
    .where({ car_id: carId })
    .whereNull('deleted_at')
    .whereIn('status', ['ACTIVE', 'ON_TRIP'])
    .select('order_number', 'id')
    .first();
  if (conflict) {
    return {
      ok: false,
      message: `"${car.name}" is already reserved under order ${conflict.order_number}. A booked vehicle cannot be reserved again until that rental is returned and completed.`
    };
  }
  return { ok: true };
};

exports.createOrder = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Calculate total days
    const pickup = new Date(data.pickupDate);
    const returnDate = new Date(data.returnDate);
    const totalDays = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));
    
    if (totalDays <= 0) {
      return res.status(400).json({ status: 'error', message: 'Return date must be after pickup date' });
    }

    const car = await carRepository.findById(data.carId);
    if (!car) {
      return res.status(404).json({ status: 'error', message: 'Car not found' });
    }

    // A car that is booked / under maintenance (or already out on a trip) cannot
    // be reserved again with dates until the current rental is returned/closed.
    const availCheck = await checkCarAvailable(car.id);
    if (!availCheck.ok) {
      return res.status(400).json({ status: 'error', message: availCheck.message });
    }

    const rentalAmount = car.dailyRate * totalDays;
    const securityDeposit = 5000;
    const vatCalc = await vatConfigService.computeVatForItem('car_rental', car.id, rentalAmount);
    const vatAmount = parseFloat(vatCalc.vat.toFixed(2));
    const totalAmount = rentalAmount + vatAmount + securityDeposit;

    const orderNumber = RentalOrder.generateOrderNumber();

    const orderData = {
      car_id: car.id,
      customer_id: req.user.id,
      order_number: orderNumber,
      customer_name: req.user.fullName,
      customer_email: req.user.email,
      customer_phone: req.user.phone || '',
      driver_name: data.driverName || '',
      driver_license: data.driverLicense || '',
      pickup_date: new Date(data.pickupDate),
      return_date: new Date(data.returnDate),
      total_days: totalDays,
      daily_rate: car.dailyRate,
      rental_amount: rentalAmount,
      security_deposit: securityDeposit,
      subtotal: rentalAmount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      pickup_location: data.pickupLocation || '',
      payment_method: data.paymentMethod || 'Cash',
      special_requests: data.specialRequests || '',
      status: 'PENDING_APPROVAL'
    };

    const newOrder = await rentalOrderRepository.create(orderData);

    // Invoice is recorded immediately when the rental reservation is placed.
    try {
      const invNo = await generateInvoiceNumber();
      await recordInvoiceForOrder(db, {
        source: 'car_rental',
        saleId: newOrder.id,
        saleType: 'online',
        invoiceNo: invNo,
        customer: req.user.fullName || req.user.full_name || null,
        customerTin: null,
        lines: [{
          itemId: car.id,
          name: 'Car Rental',
          qty: totalDays,
          unitPrice: car.dailyRate,
          amount: rentalAmount,
          rate: vatCalc.rate,
          treatment: vatCalc.treatment
        }, {
          itemId: 0,
          name: 'Security Deposit',
          qty: 1,
          unitPrice: securityDeposit,
          amount: securityDeposit,
          rate: 0,
          treatment: 'zero_rated'
        }],
        createdBy: req.user.fullName || req.user.full_name || 'Customer Portal'
      });
    } catch (err) {
      logger.error('Failed to record car rental invoice:', err.message);
    }
    
    // Also mark car as 'Booked' temporarily or let the manager do it upon approval. 
    // We'll leave the car as is until approved by the manager.

    // Notify Car Renting Manager
    try {
      await sendNotification('Car Renting Manager', null, {
        title: '🚗 New Online Order',
        message: `New car rental order ${orderData.orderNumber} placed for ETB ${rentalAmount.toLocaleString()}.`,
        type: 'info',
        link: '/car-renting/orders'
      });
    } catch(e) {}
    
    res.status(201).json({
      status: 'success',
      message: 'Rental reservation submitted successfully',
      data: newOrder.toJSON()
    });
  } catch (error) {
    logger.error('Error creating rental order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create rental order' });
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await rentalOrderRepository.findAll();
    res.status(200).json({
      status: 'success',
      data: orders.map(o => o.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch rental orders' });
  }
};

// ── ARCHIVE / HISTORY / DELETE (Manager) ──────────────────────────────────────
const RENTAL_TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'REJECTED'];

exports.getArchivedOrders = async (req, res, next) => {
  try {
    const orders = await rentalOrderRepository.findAll({ archived: true });
    // Manual (walk-in) orders live in the rental list already — don't duplicate them in history.
    const nonManual = orders.filter(o => !o.isManual && !o.is_manual);
    res.status(200).json({
      status: 'success',
      data: nonManual.map(o => o.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching archived rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch rental order history' });
  }
};

exports.archiveOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    if (order.isManual || order.is_manual) {
      return res.status(400).json({ status: 'error', message: 'Manual orders stay in the rental list and are not moved to history' });
    }
    if (!RENTAL_TERMINAL_STATUSES.includes(order.status)) {
      return res.status(400).json({ status: 'error', message: 'Only completed, cancelled or rejected orders can be moved to history' });
    }
    if (order.archivedAt) {
      return res.status(400).json({ status: 'error', message: 'Order already in history' });
    }
    const updated = await rentalOrderRepository.update(id, { archived_at: db.fn.now() });
    carRentalAudit.log(req, 'Rental order moved to history', order.orderNumber,
      { status: order.status, car_id: order.carId },
      { archived_at: new Date() }
    );
    res.status(200).json({
      status: 'success',
      message: 'Order moved to history',
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error archiving rental order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to move order to history' });
  }
};

exports.bulkArchiveOrders = async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order ids provided' });
    }
    const orders = await db('rental_orders').whereIn('id', ids).whereNull('deleted_at');
    const invalid = orders
      .filter(o => !(o.is_manual || o.isManual))
      .filter(o => !RENTAL_TERMINAL_STATUSES.includes(o.status));
    if (invalid.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Only completed, cancelled or rejected orders can be moved to history`,
        invalidIds: invalid.map(o => o.id)
      });
    }
    const archiveIds = orders
      .filter(o => !(o.is_manual || o.isManual))
      .map(o => o.id);
    const moved = await db('rental_orders')
      .whereIn('id', archiveIds)
      .update({ archived_at: db.fn.now(), updated_at: db.fn.now() });
    carRentalAudit.log(req, `${moved} rental order(s) moved to history`, null,
      { ids },
      { archived_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: `${moved} order(s) moved to history`, moved });
  } catch (error) {
    logger.error('Error bulk archiving rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to move orders to history' });
  }
};

exports.restoreOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id, { includeArchived: true });
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    const updated = await rentalOrderRepository.update(id, { archived_at: null });
    carRentalAudit.log(req, 'Rental order restored from history', order.orderNumber,
      { status: order.status },
      { restored_at: new Date() }
    );
    res.status(200).json({
      status: 'success',
      message: 'Order restored from history',
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error restoring rental order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to restore order' });
  }
};

exports.bulkRestoreOrders = async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order ids provided' });
    }
    const restored = await db('rental_orders')
      .whereIn('id', ids)
      .whereNull('deleted_at')
      .update({ archived_at: null, updated_at: db.fn.now() });
    carRentalAudit.log(req, `${restored} rental order(s) restored from history`, null,
      { ids },
      { restored_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: `${restored} order(s) restored`, restored });
  } catch (error) {
    logger.error('Error bulk restoring rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to restore orders' });
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id, { includeArchived: true });
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    if (!RENTAL_TERMINAL_STATUSES.includes(order.status)) {
      return res.status(400).json({ status: 'error', message: 'Only completed, cancelled or rejected orders can be deleted' });
    }
    await db('rental_orders').where('id', id).update({ deleted_at: db.fn.now(), updated_at: db.fn.now() });
    carRentalAudit.log(req, 'Rental order deleted', order.orderNumber,
      { status: order.status },
      { deleted_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: 'Order deleted' });
  } catch (error) {
    logger.error('Error deleting rental order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete order' });
  }
};

exports.bulkDeleteOrders = async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order ids provided' });
    }
    const orders = await db('rental_orders').whereIn('id', ids).whereNull('deleted_at');
    const invalid = orders.filter(o => !RENTAL_TERMINAL_STATUSES.includes(o.status));
    if (invalid.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Only completed, cancelled or rejected orders can be deleted`,
        invalidIds: invalid.map(o => o.id)
      });
    }
    const deleted = await db('rental_orders')
      .whereIn('id', ids)
      .update({ deleted_at: db.fn.now(), updated_at: db.fn.now() });
    carRentalAudit.log(req, `${deleted} rental order(s) deleted`, null,
      { ids },
      { deleted_at: new Date() }
    );
    res.status(200).json({ status: 'success', message: `${deleted} order(s) deleted`, deleted });
  } catch (error) {
    logger.error('Error bulk deleting rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete orders' });
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    res.status(200).json({
      status: 'success',
      data: order.toJSON()
    });
  } catch (error) {
    logger.error('Error fetching rental order by id:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch rental order' });
  }
};

exports.getCustomerOrders = async (req, res, next) => {
  try {
    // Orders belonging to this account (by user id), or recorded under the same
    // email (manual/walk-in orders) must also appear on the customer dashboard.
    const allOrders = await rentalOrderRepository.findAll({
      filters: { customerId: req.user.id, customerEmail: req.user.email }
    });
    const orders = allOrders.filter(o => !o.is_deleted_by_customer);
    res.status(200).json({
      status: 'success',
      data: orders.map(o => o.toJSON ? o.toJSON() : o)
    });
  } catch (error) {
    logger.error('Error fetching customer rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch your rental orders' });
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, managerNote } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const extraData = {};
    if (managerNote) extraData.manager_note = managerNote;
    
    if (status === 'APPROVED') extraData.approved_at = new Date();
    if (status === 'REJECTED') extraData.rejected_at = new Date();
    if (status === 'ACTIVE' && !order.rentalStartTime) extraData.rental_start_time = new Date();

    const updated = await rentalOrderRepository.updateStatus(id, status, extraData);

    carRentalAudit.log(req, `Rental Order ${String(status).toLowerCase()}`, order.orderNumber,
      { status: order.status, car_id: order.carId },
      { status, managerNote: managerNote || null }
    );

    // If approved/active, update car status to Booked
    if (['APPROVED', 'ON_TRIP', 'ACTIVE'].includes(status)) {
       await carRepository.update(order.carId, { availability: 'Booked' });
    } else if (['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(status)) {
       await carRepository.update(order.carId, { availability: 'Available' });
    }

    res.status(200).json({
      status: 'success',
      message: `Order ${status.toLowerCase()} successfully`,
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error updating rental order status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order status' });
  }
};

// ── MANAGER: Start the rental (car handed over → ACTIVE, day counter begins) ──
exports.startRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    const order = await rentalOrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    if (['COMPLETED', 'CANCELLED', 'REJECTED', 'CLOSED'].includes(order.status)) {
      return res.status(400).json({ status: 'error', message: 'This order is already finished and cannot be started' });
    }
    if (order.status === 'ACTIVE') {
      return res.status(400).json({ status: 'error', message: 'This rental is already active' });
    }

    const extra = {};
    if (order.manager_note) extra.manager_note = order.manager_note;
    if (notes) extra.manager_note = `${extra.manager_note ? extra.manager_note + '\n' : ''}[Started] ${notes}`;

    const updated = await rentalOrderRepository.update(id, {
      status: 'ACTIVE',
      rental_start_time: new Date(),
      ...extra
    });

    if (order.carId) {
      await carRepository.update(order.carId, { availability: 'Booked' });
    }

    carRentalAudit.log(req, 'Rental Started', order.orderNumber,
      { status: order.status, car_id: order.carId },
      { status: 'ACTIVE', rental_start_time: new Date(), notes: notes || null });

    try {
      await notificationRepository.create({
        userId: order.customerId,
        title: 'Rental Started',
        message: `Your rental ${order.orderNumber} is officially started. Enjoy your trip! Expected return: ${new Date(order.returnDate).toLocaleDateString()}.`
      });
    } catch (e) { /* non-fatal */ }

    res.status(200).json({
      status: 'success',
      message: 'Rental started — day counter is now running',
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error starting rental:', error);
    res.status(500).json({ status: 'error', message: 'Failed to start rental' });
  }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id);
    
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const isFinanceStaff = req.user.roles && req.user.roles.some(r => ['Finance', 'Admin', 'CEO'].includes(r));
    
    if (order.customerId !== req.user.id && !isFinanceStaff) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    if (!isFinanceStaff && order.status !== 'APPROVED' && order.additionalOwed <= 0) {
      return res.status(400).json({ status: 'error', message: 'Payment proof not required for this order currently' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No proof file provided' });
    }

    const proofUrl = `/uploads/receipts/${req.file.filename}`;
    
    const updateData = {
      payment_proof_url: proofUrl,
      payment_status: 'PENDING_VERIFICATION'
    };

    const updated = await rentalOrderRepository.update(id, updateData);

    // Automatically send to Finance Live Income for verification
    try {
      await db('finance_income_submissions').insert({
        department: 'Car Rental',
        submitted_by: order.customerName || 'Car Rental Customer',
        amount: order.additionalOwed > 0 ? order.additionalOwed : order.totalAmount,
        reference_no: `CAR-PROOF-${order.orderNumber}`,
        description: `Car Rental Order ${order.orderNumber} - ${order.customerName}`,
        status: 'Pending',
        manual_details: JSON.stringify({
          order_id: id,
          paymentMethod: order.paymentMethod || 'Bank/Telebirr',
          proofImagePath: proofUrl,
          amount: order.additionalOwed > 0 ? order.additionalOwed : order.totalAmount,
          receivedFrom: order.customerName || 'Car Rental Customer'
        }),
        created_at: new Date(),
        updated_at: new Date()
      });
      sendFinanceNotification({
        title: 'New Income Submission',
        message: `ETB ${Number(order.additionalOwed > 0 ? order.additionalOwed : order.totalAmount).toLocaleString()} Car Rental order income submitted for verification (Ref: CAR-PROOF-${order.orderNumber}).`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list',
        related_entity_id: order.orderNumber
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
    } catch (err) {
      logger.error('Failed to submit Car Rental proof to finance live income:', err.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment proof uploaded successfully',
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error uploading payment proof:', error);
    res.status(500).json({ status: 'error', message: 'Failed to upload payment proof' });
  }
};

// ── MANAGER: Create a manual / walk-in car rental order ──────────────────────
// Mirrors AgriRent createManualOrder — used by CarRentalCreateOrder.jsx
exports.createManualOrder = async (req, res) => {
  try {
    const {
      carId, customerName, customerPhone, customerEmail,
      startDate, endDate, pickupLocation, notes,
      paymentMethod, paymentReference,
      driverName, driverLicense, scheduleLater, waitlistId
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ status: 'error', message: 'Customer name and phone are required' });
    }

    const isScheduleLater = scheduleLater === true || scheduleLater === 'true' || (!startDate && !endDate);

    // "Schedule later" waitlist holds: created today with NO dates because the
    // car is still booked by the current rental. The manager fills pickup/return
    // dates later (PATCH /:id/dates) once the car is actually available.
    if (!isScheduleLater && (!startDate || !endDate)) {
      return res.status(400).json({ status: 'error', message: 'Start and end dates are required' });
    }

    // Handle payment proof file upload (field name: paymentProof)
    let proofUrl = null;
    if (req.file) {
      proofUrl = `/uploads/receipts/${req.file.filename}`;
    }

    if (!isScheduleLater && !paymentReference && !proofUrl) {
      return res.status(400).json({ status: 'error', message: 'Either payment reference or screenshot is required' });
    }

    const pickup = startDate ? new Date(startDate) : null;
    const returnDate = endDate ? new Date(endDate) : null;
    const totalDays = pickup && returnDate ? Math.max(1, Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24))) : 0;

    // Fetch car details
    let dailyRate = 0;
    let carName = '';
    let licensePlate = '';
    if (carId) {
      const car = await db('cars').where({ id: parseInt(carId) }).first();
      if (car) {
        dailyRate = parseFloat(car.dailyRate || car.daily_rate || car.price_per_day || 0);
        carName = `${car.brand || ''} ${car.model || ''}`.trim() || car.name || 'Car';
        licensePlate = car.licensePlate || car.license_plate || '';
      }
      // A booked / maintenance car cannot be booked again with dates here — but
      // schedule-later holds are allowed (the waitlist customer is next in line).
      if (!isScheduleLater) {
        const availCheck = await checkCarAvailable(parseInt(carId));
        if (!availCheck.ok) {
          return res.status(400).json({ status: 'error', message: availCheck.message });
        }
      }
    }

    const rentalAmount  = dailyRate * totalDays;
    const securityDeposit = 0; // manager-created orders may not require deposit
    const vatCalc = !isScheduleLater
      ? await vatConfigService.computeVatForItem('car_rental', carId ? parseInt(carId) : null, rentalAmount)
      : { vat: 0, rate: null, treatment: null };
    const vatAmount = parseFloat(vatCalc.vat.toFixed(2));
    const totalAmount   = rentalAmount + vatAmount + securityDeposit;

    const orderNumber = RentalOrder.generateOrderNumber();

    const [orderId] = await db('rental_orders').insert({
      customer_id:      req.body.customerId ? parseInt(req.body.customerId) : null,
      car_id:           carId ? parseInt(carId) : null,
      customer_name:    customerName,
      customer_phone:   customerPhone,
      customer_email:   customerEmail || null,
      driver_name:      driverName || customerName,
      driver_license:   driverLicense || null,
      order_number:     orderNumber,
      pickup_date:      pickup,
      return_date:      returnDate,
      total_days:       totalDays,
      daily_rate:       dailyRate,
      rental_amount:    rentalAmount,
      security_deposit: securityDeposit,
      subtotal:         rentalAmount,
      vat_amount:       vatAmount,
      total_amount:     totalAmount,
      pickup_location:  pickupLocation || null,
      special_requests: notes || null,
      payment_method:   paymentMethod || 'Bank/Telebirr',
      payment_reference: paymentReference || null,
      payment_proof_url: proofUrl,
      payment_status:   isScheduleLater ? 'UNPAID' : (proofUrl || paymentReference ? 'PENDING_VERIFICATION' : 'UNPAID'),
      status:           'APPROVED', // manager-created = already approved
      is_manual:        true,
      scheduled_later:  isScheduleLater ? true : false,
      waitlist_id:      waitlistId || null,
      approved_at:      new Date(),
      created_at:       new Date(),
      updated_at:       new Date()
    });

    // Invoice + Finance submission are minted later (via order dates) for a
    // schedule-later hold — there is no amount yet. Only a real booking with
    // dates is invoiced immediately.
    if (!isScheduleLater) {
      // Invoice is recorded immediately when the (manual/walk-in) order is placed.
      try {
        const invNo = await generateInvoiceNumber();
        await recordInvoiceForOrder(db, {
          source: 'car_rental',
          saleId: orderId,
          saleType: 'walk_in',
          invoiceNo: invNo,
          customer: customerName || null,
          customerTin: null,
          lines: [{
            itemId: carId ? parseInt(carId) : 0,
            name: carName || 'Car Rental',
            qty: totalDays,
            unitPrice: dailyRate,
            amount: rentalAmount,
            rate: vatCalc.rate,
            treatment: vatCalc.treatment
          }],
          createdBy: req.user.fullName || req.user.full_name || 'Car Renting Manager'
        });
      } catch (err) {
        logger.error('Failed to record manual car rental invoice:', err.message);
      }

      // Auto-submit to Finance Live Income for payment verification
      try {
        await db('finance_income_submissions').insert({
          department:   'Car Rental',
          submitted_by: req.user.fullName || req.user.full_name || 'Car Renting Manager',
          amount:       totalAmount,
          reference_no: paymentReference || (proofUrl ? `CAR-PROOF-${orderNumber}` : `CAR-${orderNumber}`),
          description:  `Car Rental Order ${orderNumber} – ${customerName}`,
          status:       'Pending',
          manual_details: JSON.stringify({
            order_id:         String(orderId),
            orderNumber,
            paymentMethod:    paymentMethod || 'Bank/Telebirr',
            paymentReference: paymentReference || null,
            proofImagePath:   proofUrl,
            amount:           totalAmount,
            receivedFrom:     customerName,
            // Car / booking details so Finance can see full context
            carName,
            licensePlate,
            pickupDate:   startDate,
            returnDate:   endDate,
            totalDays,
            dailyRate,
            driverName:   driverName || customerName,
            pickupLocation: pickupLocation || null
          }),
          created_at: new Date(),
          updated_at: new Date()
        });
      } catch (err) {
        logger.error('Failed to submit manual Car Rental to finance live income:', err.message);
      }

      // Notify Finance
      sendFinanceNotification({
        title: 'New Income Submission',
        message: `ETB ${Number(totalAmount || 0).toLocaleString()} Car Rental order income submitted for verification (Ref: ${paymentReference || `CAR-${orderNumber}`}).`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list',
        related_entity_id: orderNumber
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
    }

    carRentalAudit.log(req, isScheduleLater
      ? 'Rental Order Created (Schedule Later)'
      : 'Rental Order Created (Manual)', orderNumber, null, {
      order_number: orderNumber, car_id: carId ? parseInt(carId) : null, customer_name: customerName,
      total_days: totalDays, daily_rate: dailyRate, rental_amount: rentalAmount, total_amount: totalAmount,
      payment_method: paymentMethod || 'Bank/Telebirr', status: 'APPROVED', is_manual: true,
      scheduled_later: !!isScheduleLater, waitlist_id: waitlistId || null
    });

    res.status(201).json({
      status: 'success',
      message: isScheduleLater
        ? 'Reservation created for the waitlist customer. Fill in the pickup/return dates once the vehicle is available.'
        : 'Car Rental order created and sent to Finance for verification',
      data: { id: orderId, orderNumber, totalAmount, totalDays, scheduledLater: !!isScheduleLater }
    });
  } catch (error) {
    logger.error('Error creating manual car rental order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create order' });
  }
};

// ── MANAGER: Schedule-later orders that still need their rental dates set ─────
// Created for waitlist customers while their car was still rented out. The
// manager fills in pickup/return dates here (PATCH /:id/dates) once it is free.
exports.getScheduleLaterOrders = async (req, res) => {
  try {
    const orders = await db('rental_orders as ro')
      .leftJoin('cars as c', 'ro.car_id', 'c.id')
      .where('ro.scheduled_later', true)
      .whereNull('ro.deleted_at')
      .whereNotIn('ro.status', ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED', 'ABANDONED'])
      .select(
        'ro.id', 'ro.order_number', 'ro.customer_name', 'ro.customer_phone',
        'ro.customer_email', 'ro.car_id', 'ro.payment_method',
        'ro.payment_status', 'ro.driver_name', 'ro.driver_license', 'ro.pickup_location',
        'ro.total_days', 'ro.pickup_date', 'ro.return_date',
        'ro.daily_rate', 'ro.created_at',
        'c.name as car_name', 'c.availability as car_availability', 'c.daily_rate as car_daily_rate'
      )
      .orderBy('ro.created_at', 'desc')
      .limit(200);
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    logger.error('Error fetching schedule-later car rental orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders awaiting dates' });
  }
};

// ── MANAGER: Set pickup/return dates on a schedule-later order ────────────────
// Called once the car has returned to 'Available'. This finalizes the booking:
// computes the amount, mints the invoice, re-marks the car Booked for this
// (confirmed) customer and converts the waitlist entry.
exports.setOrderDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, dailyRateOverride } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'Both pickup and return dates are required' });
    }

    const order = await db('rental_orders').where({ id }).whereNull('deleted_at').first();
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return res.status(400).json({ status: 'error', message: 'Return date must be after pickup date' });
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    let dailyRate = parseFloat(dailyRateOverride || order.daily_rate || 0);
    if (!dailyRateOverride && order.car_id) {
      const car = await db('cars').where({ id: order.car_id }).first();
      if (car) dailyRate = parseFloat(car.dailyRate || car.daily_rate || car.price_per_day || 0);
    }
    const vatCalc = await vatConfigService.computeVatForItem('car_rental', order.car_id || null, dailyRate * totalDays);
    const vatAmount = parseFloat(vatCalc.vat.toFixed(2));
    const rentalAmount = dailyRate * totalDays;
    const totalAmount = rentalAmount + vatAmount + parseFloat(order.security_deposit || 0);

    await db('rental_orders').where({ id }).update({
      pickup_date: startDate,
      return_date: endDate,
      total_days: totalDays,
      daily_rate: dailyRate,
      rental_amount: rentalAmount,
      subtotal: rentalAmount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      scheduled_later: false,
      updated_at: new Date()
    });

    // Car is now reserved for this (confirmed) customer.
    if (order.car_id) {
      await db('cars').where({ id: order.car_id }).update({ availability: 'Booked' });
    }

    // Mint the invoice now that the amount is known.
    try {
      const car = order.car_id ? await db('cars').where({ id: order.car_id }).select('name').first() : null;
      await recordInvoiceForOrder(db, {
        source: 'car_rental',
        saleId: id,
        saleType: 'walk_in',
        invoiceNo: await generateInvoiceNumber(),
        customer: order.customer_name || null,
        customerTin: null,
        lines: [{
          itemId: order.car_id || 0,
          name: car?.name || 'Car Rental',
          qty: totalDays,
          unitPrice: dailyRate,
          amount: rentalAmount,
          rate: vatCalc.rate,
          treatment: vatCalc.treatment
        }],
        createdBy: req.user.fullName || req.user.full_name || 'Car Renting Manager'
      });
    } catch (err) {
      logger.error('Failed to record car rental invoice on date set:', err.message);
    }

    carRentalAudit.log(req, 'Rental Order Dates Set', order.order_number, null, {
      start_date: startDate, end_date: endDate, total_days: totalDays, total_amount: totalAmount
    });

    // The availability request is now fulfilled — this customer is confirmed
    // for the car. Mark it converted (it stayed 'waiting' until now).
    if (order.waitlist_id) {
      try {
        await db('car_waitlist').where({ id: order.waitlist_id }).update({
          status: 'converted',
          converted_order_id: id,
          converted_at: new Date()
        });
      } catch (err) {
        logger.error('Error converting car waitlist entry on date set:', err.message);
      }
    }

    const updated = await db('rental_orders').where({ id }).first();
    res.status(200).json({
      status: 'success',
      message: 'Rental dates set. The customer is now booked for this vehicle.',
      data: updated
    });
  } catch (error) {
    logger.error('Error setting car rental order dates:', error);
    res.status(500).json({ status: 'error', message: 'Failed to set the rental dates' });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const orders = await rentalOrderRepository.findPendingFinanceActions();
    res.status(200).json({
      status: 'success',
      data: orders.map(o => o.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching pending payments:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch pending payments' });
  }
};

exports.searchOrders = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    const rows = await db('rental_orders as ro')
      .leftJoin('cars as c', 'ro.car_id', 'c.id')
      .select('ro.*', 'c.name as car_name', 'c.image1 as car_image')
      .whereNull('ro.deleted_at')
      .andWhere(function() {
        this.where('ro.order_number', 'like', `%${q}%`)
          .orWhere('ro.customer_name', 'like', `%${q}%`)
          .orWhere('ro.customer_phone', 'like', `%${q}%`);
      })
      .orderBy('ro.created_at', 'desc')
      .limit(20);
    res.status(200).json({
      status: 'success',
      data: rows.map(r => new RentalOrder(r).toJSON())
    });
  } catch (error) {
    logger.error('Error searching orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to search orders' });
  }
};
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, verifiedAmount, referenceNumber, notes } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    let updateData = {};
    let notificationTitle = '';
    let notificationMessage = '';
    
    if (isVerified) {
      if (order.status === 'APPROVED') {
        // Initial Payment
        updateData = {
          payment_status: 'PAID',
          status: 'CONFIRMED',
          verified_amount: verifiedAmount,
          payment_reference: referenceNumber,
          finance_notes: notes,
          verified_by: req.user.id,
          verified_by_finance_at: new Date()
        };
        notificationTitle = 'Payment Confirmed';
        notificationMessage = `Payment for order ${order.orderNumber} is confirmed. Your rental is CONFIRMED.`;
      } else if (order.additionalOwed > 0) {
        // Additional Payment (Extension / Late Fee)
        const remaining = Math.max(0, order.additionalOwed - verifiedAmount);
        updateData = {
          additional_owed: remaining,
          payment_reference: referenceNumber,
          finance_notes: notes,
          verified_by: req.user.id,
          verified_by_finance_at: new Date()
        };
        // If fully paid additional amount, change payment status back to paid
        if (remaining === 0) {
          updateData.payment_status = 'PAID';
        }
        notificationTitle = 'Additional Payment Confirmed';
        notificationMessage = `Additional payment of ${verifiedAmount} ETB for order ${order.orderNumber} is confirmed. Remaining balance: ${remaining} ETB.`;
      } else if (order.refundAmount > 0) {
        // Processing Refund
        updateData = {
          refund_amount: 0,
          finance_notes: notes,
          verified_by: req.user.id,
          verified_by_finance_at: new Date()
        };
        notificationTitle = 'Refund Processed';
        notificationMessage = `Your refund of ${order.refundAmount} ETB for order ${order.orderNumber} has been processed.`;
      }
    } else {
      updateData = {
        payment_status: 'PAYMENT_REJECTED', // distinct status — not UNPAID, not PENDING_VERIFICATION
        payment_proof_url: null,            // CRITICAL: clear proof so finance doesn't see it again on refresh
        finance_notes: notes,
        verified_by: req.user.id,
        verified_by_finance_at: new Date()
      };
      notificationTitle = 'Payment Rejected';
      notificationMessage = `Your payment for order ${order.orderNumber} was rejected. Reason: ${notes}. Please upload a new proof.`;
    }

    if (notificationTitle) {
      // Customer bell: persisted + live socket + decision-aware sound
      try {
        await sendCustomerNotification({
          user_id: order.customerId,
          title: notificationTitle,
          message: notificationMessage,
          type: isVerified ? 'rental' : 'rental',
          link: '/customer/rentals',
          related_entity_id: order.id
        }, req.app?.get('io'));
      } catch (e) { /* non-fatal */ }
      // Notify manager that finance acted on the payment
      try {
        await sendNotification('Car Renting Manager', null, {
          title: isVerified ? '✅ Payment Verified (Finance)' : '❌ Payment Rejected (Finance)',
          message: isVerified
            ? `Finance verified payment for order ${order.orderNumber}`
            : `Finance rejected payment for order ${order.orderNumber}`,
          type: isVerified ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
          link: '/car-renting/orders'
        });
      } catch(e) {}
    }

    // Record verified payment in bank_payments for reconciliation report
    if (isVerified && verifiedAmount > 0 && order.refundAmount <= 0) {
      try {
        await db('bank_payments').insert({
          payment_id: crypto.randomUUID(),
          reference: referenceNumber || `RENTAL-${order.orderNumber}-${Date.now()}`,
          amount: verifiedAmount,
          customer_name: order.customerName,
          customer_phone: order.customerPhone,
          bank_code: 'CBE',
          status: 'completed',
          description: `Rental payment - Order ${order.orderNumber}`,
          completed_at: db.fn.now(),
          created_at: db.fn.now()
        });
      } catch (err) {
        logger.error('Failed to record rental payment in bank_payments:', err.message);
      }

      // ── Sync to Finance Receivables (same flow as AgriRent) ──
      if (order.status === 'APPROVED' || order.additionalOwed > 0) {
        await syncRentalToFinance(
          await db('rental_orders').where({ id: order.id }).first(),
          req.user.id,
          verifiedAmount
        );
      }

      // ── Record the sales receipt for the verified payment ──
      try {
        let invoice = await findInvoiceForOrder(db, 'car_rental', order.id);
        if (!invoice) {
          const invNo = await generateInvoiceNumber();
          const created = await recordInvoiceForOrder(db, {
            source: 'car_rental',
            saleId: order.id,
            saleType: 'online',
            invoiceNo: invNo,
            customer: order.customerName || null,
            customerTin: null,
            lines: [{
              itemId: order.carId || 0,
              name: 'Car Rental',
              qty: parseFloat(order.totalDays) || 1,
              unitPrice: parseFloat(order.dailyRate) || 0,
              amount: parseFloat(order.rentalAmount) || 0
            }, {
              itemId: 0,
              name: 'Security Deposit',
              qty: 1,
              unitPrice: parseFloat(order.securityDeposit) || 0,
              amount: parseFloat(order.securityDeposit) || 0,
              rate: 0,
              treatment: 'zero_rated'
            }],
            createdBy: req.user.fullName || req.user.full_name || 'Finance Officer'
          });
          invoice = { id: created.invoiceId };
        }
        await recordReceiptForOrder(db, {
          invoiceId: invoice.id,
          amountPaid: verifiedAmount,
          paymentMethod: order.paymentMethod || order.payment_method || 'Cash',
          paymentReference: referenceNumber || null,
          receivedBy: req.user.fullName || req.user.full_name || 'Finance Officer'
        });
      } catch (err) {
        logger.error('Failed to record car rental receipt:', err.message);
      }

      // ── Record income into the canonical ledger (CRV + cashbook + revenue book) ──
      // Keyed by order number so the revenue-book row merges with any row already
      // synced via syncRentalToFinance instead of double-counting the Revenue Book.
      try {
        const { recordIncomeToLedger } = require('../../utils/financeIncome.service');
        await recordIncomeToLedger({
          receivedFrom: order.customerName || 'Car Rental Customer',
          amount: verifiedAmount,
          paymentMethod: order.paymentMethod || order.payment_method || 'Cash',
          description: `Car Rental income — ${order.orderNumber}`,
          referenceNo: referenceNumber || `RENTAL-${order.orderNumber}`,
          receivableInvoiceNo: order.orderNumber,
          department: 'Car Rental',
          extraReceivableDetails: { order_id: String(order.id), orderNumber: order.orderNumber },
        });
      } catch (err) {
        logger.error('Failed to record rental income into ledger:', err.message);
      }
    }

    const updated = await rentalOrderRepository.update(id, updateData);

    res.status(200).json({
      status: 'success',
      message: isVerified ? 'Action processed successfully' : 'Payment rejected',
      data: updated.toJSON()
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({ status: 'error', message: 'Failed to verify payment' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    
    const isManager = req.user.roles && req.user.roles.some(r =>
      ['Admin', 'CEO', 'Car Rental Manager', 'Car Renting Manager', 'Agri Rental Manager'].includes(r)
    );
    if (order.customerId !== req.user.id && req.user.departmentId !== 2 && !isManager) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    // Customers cannot cancel ACTIVE orders; managers can cancel any non-terminal order
    const alreadyTerminal = ['COMPLETED', 'CLOSED', 'CANCELLED'].includes(order.status);
    const customerBlockedActive = !isManager && order.status === 'ACTIVE';
    if (alreadyTerminal || customerBlockedActive) {
      return res.status(400).json({ status: 'error', message: 'Order cannot be cancelled at this stage' });
    }

    if (!reason) {
      return res.status(400).json({ status: 'error', message: 'Cancellation reason is required' });
    }

    let updated;
    if (isManager) {
      // Manager directly cancels the order
      updated = await rentalOrderRepository.update(id, {
        status: 'CANCELLED',
        cancellation_reason: reason
      });
      carRentalAudit.log(req, 'Rental Order Cancelled', order.orderNumber, order.toJSON(), updated.toJSON());
      // Release the car back to Available
      if (order.carId) {
        await carRepository.update(order.carId, { availability: 'Available' });
      }
      await notificationRepository.create({
        userId: order.customerId,
        title: 'Order Cancelled by Manager',
        message: `Your rental order ${order.orderNumber} was cancelled by the manager. Reason: ${reason}`
      });
    } else {
      // Customer requests a cancellation (manager must approve)
      updated = await rentalOrderRepository.update(id, { 
        is_cancellation_requested: true,
        cancellation_reason: reason
      });
      await sendNotification('Car Renting Manager', null, { title: 'Cancellation Request', message: `Customer ${order.customerName} requested to cancel Order ${order.orderNumber}. Reason: ${reason}`, type: 'info', link: '/car-renting/orders' });
    }

    res.status(200).json({ status: 'success', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error requesting order cancellation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to request cancellation' });
  }
};

exports.approveCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    if (!isApproved) {
      const updated = await rentalOrderRepository.update(id, { 
        is_cancellation_requested: false,
        cancellation_reason: null
      });
      carRentalAudit.log(req, 'Rental Order Cancellation Rejected', order.orderNumber, order.toJSON(), updated.toJSON());
      await notificationRepository.create({
        userId: order.customerId,
        title: 'Cancellation Rejected',
        message: `Your request to cancel order ${order.orderNumber} was rejected by the manager.`
      });
      return res.status(200).json({ status: 'success', data: updated.toJSON() });
    }

    const updateData = { 
      status: 'CANCELLED',
      is_cancellation_requested: false 
    };
    
    if (order.paymentStatus === 'PAID') {
      updateData.refund_amount = order.totalAmount;
      await notificationRepository.create({
        roleTarget: 'FINANCE',
        title: 'Refund Required',
        message: `Order ${order.orderNumber} was cancelled and requires a refund of ${order.totalAmount}.`,
        type: 'general',
        link: '/finance/ev'
      });
    }

    const updated = await rentalOrderRepository.update(id, updateData);
    await carRepository.update(order.carId, { availability: 'Available' });
    carRentalAudit.log(req, 'Rental Order Cancellation Approved', order.orderNumber, order.toJSON(), updated.toJSON());

    await notificationRepository.create({
      userId: order.customerId,
      title: 'Order Cancelled',
      message: `Your order ${order.orderNumber} has been successfully cancelled.`
    });

    res.status(200).json({ status: 'success', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error approving cancellation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to approve cancellation' });
  }
};

exports.extendOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    
    const order = await rentalOrderRepository.findById(id);
    if (!order || order.customerId !== req.user.id) return res.status(404).json({ status: 'error', message: 'Order not found' });
    
    if (order.status !== 'ACTIVE') {
      return res.status(400).json({ status: 'error', message: 'Only active rentals can be extended' });
    }

    await rentalOrderRepository.update(id, { pending_extension_days: days });

    const extensionFee = days * order.dailyRate;
    
    await sendNotification('Car Renting Manager', null, { title: 'Extension Request', message: `Customer ${order.customerId} requested a ${days}-day extension for Order ${order.orderNumber}.`, type: 'info', link: '/car-renting/orders' });

    res.status(200).json({ status: 'success', message: 'Extension requested successfully' });
  } catch (error) {
    logger.error('Error requesting extension:', error);
    res.status(500).json({ status: 'error', message: 'Failed to request extension' });
  }
};

exports.approveExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, days } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    if (!isApproved) {
      await rentalOrderRepository.update(id, { pending_extension_days: null });
      carRentalAudit.log(req, 'Rental Order Extension Rejected', order.orderNumber, { pending_extension_days: order.pending_extension_days }, { pending_extension_days: null });
      await notificationRepository.create({
        userId: order.customerId,
        title: 'Extension Rejected',
        message: `Your extension request for ${order.orderNumber} was rejected.`
      });
      return res.status(200).json({ status: 'success', message: 'Extension rejected' });
    }

    const currentReturnDate = new Date(order.returnDate);
    currentReturnDate.setDate(currentReturnDate.getDate() + parseInt(days));
    const extensionFee = parseInt(days) * order.dailyRate;

    const updated = await rentalOrderRepository.update(id, {
      return_date: currentReturnDate,
      extended_return_date: currentReturnDate,
      extension_fee: extensionFee,
      total_amount: order.totalAmount + extensionFee,
      additional_owed: order.additionalOwed ? order.additionalOwed + extensionFee : extensionFee,
      pending_extension_days: null,
      payment_status: 'UNPAID' // Reset so finance sees it and customer can upload new proof
    });

    carRentalAudit.log(req, 'Rental Order Extension Approved', order.orderNumber, {
      return_date: order.returnDate, extension_fee: order.extension_fee, total_amount: order.totalAmount, pending_extension_days: order.pending_extension_days
    }, {
      return_date: currentReturnDate, extension_fee: extensionFee, total_amount: order.totalAmount + extensionFee, pending_extension_days: null, payment_status: 'UNPAID'
    });

    // Notify customer
    await notificationRepository.create({
      userId: order.customerId,
      title: 'Extension Approved — Payment Required',
      message: `Your extension for order ${order.orderNumber} is approved (+${days} days). Additional fee: ${extensionFee.toLocaleString()} ETB. Please submit proof of payment.`
    });

    // Notify finance
    await notificationRepository.create({
      roleTarget: 'FINANCE',
      title: 'Extension Fee Pending Verification',
      message: `Order ${order.orderNumber} has an approved extension. Additional fee of ${extensionFee.toLocaleString()} ETB is pending payment from customer.`,
      type: 'general',
      link: '/finance/pharmacy-sales?tab=list'
    });

    res.status(200).json({ status: 'success', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error approving extension:', error);
    res.status(500).json({ status: 'error', message: 'Failed to approve extension' });
  }
};

exports.processReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { damageFee, fuelFee, lateFee, odometer, notes } = req.body;

    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const extraCharges = parseFloat(damageFee || 0) + parseFloat(fuelFee || 0) + parseFloat(lateFee || 0);
    const existingAdditional = parseFloat(order.additionalOwed || 0);
    const newAdditional = existingAdditional + extraCharges;
    
    let refund = 0;
    let netDue = newAdditional;

    // Subtract deposit if applicable
    if (order.securityDeposit > 0) {
      if (order.securityDeposit >= netDue) {
        refund = order.securityDeposit - netDue;
        netDue = 0;
      } else {
        netDue = netDue - order.securityDeposit;
        refund = 0;
      }
    }

    const updated = await rentalOrderRepository.update(id, {
      status: 'COMPLETED',
      damage_fee: damageFee || 0,
      fuel_fee: fuelFee || 0,
      late_fee: lateFee || 0,
      actual_return_time: new Date(),
      actual_return_odometer: odometer,
      additional_owed: netDue,
      refund_amount: refund,
      manager_note: notes
    });

    carRentalAudit.log(req, 'Rental Order Return Processed', order.orderNumber, {
      status: order.status, additional_owed: order.additionalOwed, security_deposit: order.securityDeposit
    }, {
      status: 'COMPLETED', damage_fee: damageFee || 0, fuel_fee: fuelFee || 0, late_fee: lateFee || 0,
      actual_return_odometer: odometer, additional_owed: netDue, refund_amount: refund, manager_note: notes
    });

    await carRepository.update(order.carId, { availability: 'Available' });

    await notificationRepository.create({
      userId: order.customerId,
      title: 'Car Returned - Final Invoice',
      message: `Return processed for ${order.orderNumber}. Refund: ${refund} ETB. Additional Owed: ${netDue} ETB.`
    });

    res.status(200).json({ status: 'success', message: 'Return processed', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error processing return:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process return' });
  }
};

exports.markNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.status !== 'CONFIRMED') return res.status(400).json({ status: 'error', message: 'Only confirmed orders can be marked as No-Show' });

    const noShowFee = order.dailyRate;
    const totalPaid = order.totalAmount;
    const refundAmount = totalPaid - noShowFee;

    const updated = await rentalOrderRepository.update(id, {
      status: 'CANCELLED',
      manager_note: 'Manually marked as No-Show by Manager',
      refund_amount: Math.max(0, refundAmount)
    });

    carRentalAudit.log(req, 'Rental Order No-Show', order.orderNumber, order.toJSON(), updated.toJSON());

    await carRepository.update(order.carId, { availability: 'Available' });
    
    await notificationRepository.create({
      userId: order.customerId,
      title: 'Order Cancelled - No Show',
      message: `Your order ${order.orderNumber} was marked as No-Show by the manager. A no-show fee of ETB ${noShowFee} was charged. Refund: ETB ${Math.max(0, refundAmount)}.`
    });

    res.status(200).json({ status: 'success', message: 'Order marked as No-Show', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error marking no show:', error);
    res.status(500).json({ status: 'error', message: 'Failed to mark order as No-Show' });
  }
};

exports.updatePickupRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    
    const order = await rentalOrderRepository.findById(id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    
    // Both customer and manager can update this
    const updated = await rentalOrderRepository.update(id, { pickup_remarks: remarks });
    carRentalAudit.log(req, 'Rental Order Pickup Remarks Updated', order.orderNumber, { pickup_remarks: order.pickup_remarks }, { pickup_remarks: remarks });
    res.status(200).json({ status: 'success', message: 'Pickup remarks updated', data: updated.toJSON() });
  } catch (error) {
    logger.error('Error updating pickup remarks:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update pickup remarks' });
  }
};
