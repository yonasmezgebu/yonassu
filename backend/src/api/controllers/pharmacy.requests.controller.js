const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getFileInfo } = require('../middleware/upload.middleware');
const { v4: uuidv4 } = require('uuid');
const { catchAsync } = require('../../utils/catchAsync');
const logPharmacyAction = require('../../utils/pharmacyAuditLogger');
const { sendCustomerNotification } = require('../../services/notification.service');
const vatConfigService = require('../../services/vatConfig.service');

const requestsController = {
  // ==============================
  // CUSTOMER: Submit a new request
  // ==============================
  createRequest: catchAsync(async (req, res) => {
    const { medication_id, quantity, delivery_option, delivery_address, customer_name, customer_email, customer_phone } = req.body;
    const user = req.user;

    if (!medication_id) throw new AppError('Medication ID is required', 400);
    if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1', 400);

    // Get medication info
    const medication = await db('pharmacy_medications').where({ id: medication_id }).first();
    if (!medication) throw new AppError('Medication not found', 404);

    // Generate request number
    const count = await db('prescription_requests').count('id as c').first();
    const request_number = `RX-${String((parseInt(count.c) || 0) + 1).padStart(4, '0')}`;

    const delivery_fee = delivery_option === 'delivery' ? 50 : 0;
    const price_per_unit = parseFloat(medication.selling_price || medication.price || 0);
    const subtotal = price_per_unit * parseInt(quantity);

    let tax_amount = 0;
    try {
      const vatResult = await vatConfigService.computeVatForItem('pharmacy', medication.id || null, subtotal);
      tax_amount = parseFloat(vatResult.vat.toFixed(2));
    } catch (_) {}

    const total_amount = subtotal + tax_amount + delivery_fee;

    let prescription_image = null;
    let paymentScreenshotName = null;
    if (req.files) {
      if (req.files.prescription_image && req.files.prescription_image[0]) {
        prescription_image = getFileInfo(req.files.prescription_image[0]).url;
      }
      if (req.files.paymentScreenshot && req.files.paymentScreenshot[0]) {
        paymentScreenshotName = req.files.paymentScreenshot[0].filename;
      }
    } else if (req.file) { // Fallback if still using .single() for some reason
      prescription_image = getFileInfo(req.file).url;
    }

    const final_customer_name = customer_name || user.fullName || user.full_name;
    const final_customer_email = customer_email || user.email;
    const final_customer_phone = customer_phone || user.phone || null;

    const [id] = await db('prescription_requests').insert({
      request_number,
      customer_id: user.id,
      customer_name: final_customer_name,
      customer_email: final_customer_email,
      customer_phone: final_customer_phone,
      medication_id: parseInt(medication_id),
      medication_name: medication.name,
      quantity: parseInt(quantity),
      price_per_unit,
      subtotal,
      tax_amount,
      total_amount,
      prescription_image,
      delivery_option: delivery_option || 'pickup',
      delivery_address: delivery_address || null,
      delivery_fee,
      status: 'pending',
      requested_at: db.fn.now()
    });

    const request = await db('prescription_requests').where({ id }).first();

    // Automatically send to Finance Live Income for verification
    const { paymentMethod, paymentReference } = req.body;
    if (paymentMethod && (paymentReference || paymentScreenshotName)) {
      const details = {
        request_id: id,
        paymentMethod: paymentMethod,
        receivedFrom: final_customer_name
      };
      if (paymentScreenshotName) details.paymentScreenshot = paymentScreenshotName;

      await db('finance_income_submissions').insert({
        department: 'Pharmacy',
        submitted_by: final_customer_name || 'Customer Portal',
        amount: total_amount,
        reference_no: paymentReference || paymentScreenshotName || 'N/A',
        description: `Customer Pharmacy Request ${request_number} - ${final_customer_name}`,
        status: 'Pending',
        manual_details: JSON.stringify(details),
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      }).catch(err => console.error('Failed to submit pharmacy to finance:', err.message));
    }

    // Emit real-time socket event to pharmacist dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('new-prescription-request', {
        id,
        request_number,
        customer_name: request.customer_name,
        customer_phone: request.customer_phone,
        medication_name: request.medication_name,
        quantity: request.quantity,
        total_amount: request.total_amount,
        delivery_option: request.delivery_option,
        requested_at: request.requested_at
      });
    }

    // Insert notification only for pharmacy-side users (never Admin/CEO —
    // prescriptions are fulfilled on pharmacy dashboards, not admin)
    try {
      const customerName = request.customer_name || 'A customer';
      const adminUsers = await db('users')
        .join('user_roles', 'users.id', 'user_roles.user_id')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .whereIn('roles.name', ['Pharmacy Worker', 'Sales/Cashier', 'Pharmacy Manager'])
        .select('users.id');
      const userIds = [...new Set(adminUsers.map(u => u.id))];
      for (const uid of userIds) {
        await db('notifications').insert({
          user_id: uid,
          title: `New Prescription Request: ${request_number}`,
          message: `${customerName} ordered ${request.medication_name} x${request.quantity}`,
          type: 'pharmacy',
          link: '/pharmacy-worker/sales?tab=online',
          is_read: 0,
          created_at: db.fn.now()
        });
      }
    } catch (_) {}

    res.status(201).json({ status: 'success', data: request });
  }),

  // ==============================
  // CUSTOMER: Get own requests
  // ==============================
  getMyRequests: catchAsync(async (req, res) => {
    const requests = await db('prescription_requests as pr')
      .leftJoin('pharmacy_medications as pm', 'pr.medication_id', 'pm.id')
      .select('pr.*', 'pm.drug_image as medication_image')
      .where({ 'pr.customer_id': req.user.id })
      .where(function() {
        this.where('pr.is_deleted_by_customer', false).orWhereNull('pr.is_deleted_by_customer');
      })
      .orderBy('pr.requested_at', 'desc');

    res.json({ status: 'success', data: requests });
  }),

  // ==============================
  // CUSTOMER: Upload Image to existing request
  // ==============================
  uploadPrescriptionImage: catchAsync(async (req, res) => {
    const { id } = req.params;
    const request = await db('prescription_requests').where({ id, customer_id: req.user.id }).first();

    if (!request) throw new AppError('Request not found', 404);
    if (!req.file) throw new AppError('No image provided', 400);

    const fileInfo = getFileInfo(req.file);
    const imageUrl = fileInfo.url;

    await db('prescription_requests')
      .where({ id })
      .update({ prescription_image: imageUrl });

    const updated = await db('prescription_requests').where({ id }).first();
    res.json({ status: 'success', message: 'Image uploaded successfully', imageUrl, data: updated });
  }),

  // ==============================
  // PHARMACIST: Get all pending requests
  // ==============================
  getPendingRequests: catchAsync(async (req, res) => {
    const requests = await db('prescription_requests as pr')
      .leftJoin('finance_income_submissions as fis', function() {
        this.on('fis.department', '=', db.raw('?', ['Pharmacy']))
          .andOn(db.raw("JSON_EXTRACT(fis.manual_details, '$.request_id')"), '=', 'pr.id')
      })
      .select(
        'pr.*',
        'fis.reference_no as payment_reference',
        'fis.manual_details as payment_manual_details',
        'fis.status as finance_payment_status'   // <-- Approved / Pending / Rejected from Finance
      )
      .where({ 'pr.status': 'pending' })
      .orderBy('pr.requested_at', 'asc');
      
    // Parse manual details to extract method and screenshot
    const formattedRequests = requests.map(req => {
      let method = null;
      let screenshot = null;
      if (req.payment_manual_details) {
        try {
          const details = typeof req.payment_manual_details === 'string' ? JSON.parse(req.payment_manual_details) : req.payment_manual_details;
          method = details.paymentMethod;
          screenshot = details.paymentScreenshot;
        } catch (e) {}
      }
      return {
        ...req,
        payment_method: method || 'CASH',
        payment_screenshot: screenshot,
        finance_payment_status: req.finance_payment_status || null  // null means no Finance entry (cash/walk-in)
      };
    });

    res.json({ status: 'success', data: formattedRequests });
  }),


  // ==============================
  // PHARMACIST: Get ALL requests with filter
  // ==============================
  getAllRequests: catchAsync(async (req, res) => {
    const { status } = req.query;
    let query = db('prescription_requests').orderBy('requested_at', 'desc');
    if (status) query = query.where({ status });
    const requests = await query;
    res.json({ status: 'success', data: requests });
  }),

  // ==============================
  // PHARMACIST: Approve request
  // ==============================
  approveRequest: catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Only pending requests can be approved', 400);

    // Check stock
    const medication = await db('pharmacy_medications').where({ id: request.medication_id }).first();
    if (!medication) throw new AppError('Medication not found', 404);
    if (medication.stock_quantity < request.quantity) {
      throw new AppError(`Insufficient stock. Available: ${medication.stock_quantity}`, 400);
    }

    await db.transaction(async (trx) => {
      // Update request status
      await trx('prescription_requests').where({ id }).update({
        status: 'approved',
        approved_rejected_at: trx.fn.now()
      });

      // Deduct stock
      await trx('pharmacy_medications')
        .where({ id: request.medication_id })
        .decrement('stock_quantity', request.quantity);

      // Log stock movement
      await trx('pharmacy_stock_movements').insert({
        medication_id: request.medication_id,
        quantity_change: -request.quantity,
        reason: `Prescription Request #${request.request_number} approved`,
        reference_no: request.request_number,
        created_by: req.user ? req.user.id : null
      });
    });

    // Customer bell: approved (persisted + live socket + sound)
    sendCustomerNotification({
      user_id: request.customer_id,
      title: 'Prescription Request Approved ✅',
      message: `Your request #${request.request_number} for ${request.medication_name} has been approved and is being prepared.`,
      type: 'pharmacy',
      link: '/customer/prescriptions',
      related_entity_id: request.id
    }, req.app?.get('io')).catch(() => {});

    const updated = await db('prescription_requests').where({ id }).first();

    // Real-time update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('request-status-updated', { id, status: 'approved', request_number: request.request_number });
    }

    logPharmacyAction(req, 'Prescription Request Approved', request.request_number, { status: 'pending' }, { status: 'approved' }, 'Pharmacy Sales');
    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // PHARMACIST: Reject request
  // ==============================
  rejectRequest: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) throw new AppError('Rejection reason is required', 400);

    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Only pending requests can be rejected', 400);

    await db.transaction(async (trx) => {
      await trx('prescription_requests').where({ id }).update({
        status: 'rejected',
        rejection_reason,
        approved_rejected_at: trx.fn.now()
      });
    });

    // Customer bell: rejected (persisted + live socket + sound)
    sendCustomerNotification({
      user_id: request.customer_id,
      title: 'Prescription Request Rejected ❌',
      message: `Your request #${request.request_number} for ${request.medication_name} was rejected. Reason: ${rejection_reason}`,
      type: 'pharmacy',
      link: '/customer/prescriptions',
      related_entity_id: request.id
    }, req.app?.get('io')).catch(() => {});

    const updated = await db('prescription_requests').where({ id }).first();

    const io = req.app.get('io');
    if (io) {
      io.emit('request-status-updated', { id, status: 'rejected', request_number: request.request_number });
    }

    logPharmacyAction(req, 'Prescription Request Rejected', request.request_number, { status: 'pending' }, { status: 'rejected', rejection_reason }, 'Pharmacy Sales');
    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // PHARMACIST: Mark as Ready for Pickup
  // ==============================
  markReady: catchAsync(async (req, res) => {
    const { id } = req.params;
    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);

    await db.transaction(async (trx) => {
      await trx('prescription_requests').where({ id }).update({
        status: 'ready_for_pickup',
        ready_at: trx.fn.now()
      });
    });

    // Customer bell: ready for pickup (persisted + live socket + sound)
    sendCustomerNotification({
      user_id: request.customer_id,
      title: 'Ready for Pickup 📦',
      message: `Your request #${request.request_number} for ${request.medication_name} is ready! Please come collect it.`,
      type: 'pharmacy',
      link: '/customer/prescriptions',
      related_entity_id: request.id
    }, req.app?.get('io')).catch(() => {});

    const updated = await db('prescription_requests').where({ id }).first();

    const io = req.app.get('io');
    if (io) {
      io.emit('request-status-updated', { id, status: 'ready_for_pickup', request_number: request.request_number });
    }

    logPharmacyAction(req, 'Prescription Request Ready', request.request_number, { status: request.status }, { status: 'ready_for_pickup' }, 'Pharmacy Sales');
    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // PHARMACIST: Mark as Picked Up / Delivered
  // ==============================
  markComplete: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, payment_method } = req.body; // 'picked_up' or 'delivered'

    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);

    await db.transaction(async (trx) => {
      await trx('prescription_requests').where({ id }).update({
        status: status || 'picked_up',
        completed_at: trx.fn.now()
      });

      // Record online payments into POS logs
      if (payment_method && request.total_amount) {
        const shift = await trx('pos_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
        if (shift) {
          let completedStatus = await trx('sale_statuses').where('status_code', 'completed').first();
          const pMethodRec = await trx('payment_methods').where('name', payment_method).first();

          if (completedStatus && pMethodRec) {
            const saleSubtotal = parseFloat(request.subtotal || request.price_per_unit * request.quantity || 0);
            const saleTax = parseFloat(request.tax_amount || 0);
            const saleTotal = parseFloat(request.total_amount || 0);

            await trx('pos_sales').insert({
              invoice_number: `ONL-P-${request.request_number}`,
              customer_id: request.customer_id || null,
              subtotal: saleSubtotal,
              tax_amount: saleTax,
              discount_amount: 0,
              total_amount: saleTotal,
              payment_method_id: pMethodRec.id,
              amount_paid: saleTotal,
              change_amount: 0,
              cashier_id: req.user.id,
              sale_date: trx.fn.now(),
              status_id: completedStatus.id,
              notes: `Pharmacy Request #${request.request_number}`
            });

            await trx('pos_shifts').where({ id: shift.id }).update({
              transaction_count: trx.raw('transaction_count + 1'),
              total_sales: trx.raw('COALESCE(total_sales,0) + ?', [saleTotal]),
              cash_collected: payment_method === 'Cash' ? trx.raw('COALESCE(cash_collected,0) + ?', [saleTotal]) : trx.raw('cash_collected'),
              telebirr_collected: payment_method === 'Telebirr' ? trx.raw('COALESCE(telebirr_collected,0) + ?', [saleTotal]) : trx.raw('telebirr_collected'),
              transfer_collected: payment_method === 'Bank Transfer' ? trx.raw('COALESCE(transfer_collected,0) + ?', [saleTotal]) : trx.raw('transfer_collected')
            });
          }
        }
      }
    });

    const updated = await db('prescription_requests').where({ id }).first();
    logPharmacyAction(req, 'Prescription Request Completed', request.request_number, { status: request.status }, { status: status || 'picked_up', payment_method }, 'Pharmacy Sales');
    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // CUSTOMER: Cancel pending request
  // ==============================
  cancelRequest: catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await db('prescription_requests')
      .where({ id, customer_id: req.user.id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Only pending requests can be cancelled', 400);

    await db('prescription_requests').where({ id }).update({ status: 'rejected', rejection_reason: 'Cancelled by customer' });

    res.json({ status: 'success', message: 'Request cancelled' });
  }),

  // Soft delete a pending online order (pharmacy worker). Keeps the record for
  // history/audit but removes it from the Pending Online Orders list (status pending).
  deleteRequestByPharmacy: catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Only pending orders can be deleted', 400);

    await db('prescription_requests')
      .where({ id })
      .update({ status: 'rejected', rejection_reason: 'Deleted by pharmacy' });

    res.json({ status: 'success', message: 'Order deleted' });
  })
};

module.exports = requestsController;
