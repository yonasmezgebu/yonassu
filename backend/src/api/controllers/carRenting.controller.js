const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const notificationRepository = require('../../repositories/notification.repository');
const Maintenance = require('../../models/Maintenance.model');
const FuelService = require('../../models/FuelService.model');

/* ─── Helper: ensure tables exist ─────────────────────────────── */
async function ensureTables() {
  await db.raw(`CREATE TABLE IF NOT EXISTS \`car_renting_store_requests\` (
    \`id\` int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`request_number\` varchar(50) NOT NULL UNIQUE,
    \`requested_by\` int NOT NULL,
    \`store_handler\` int DEFAULT NULL,
    \`approved_by\` int DEFAULT NULL,
    \`status\` enum('PENDING_STORE','FORWARDED_TO_CEO','APPROVED','REJECTED','SHIPPED','RECEIVED') DEFAULT 'FORWARDED_TO_CEO',
    \`rejection_reason\` text,
    \`notes\` text,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
  await db.raw(`CREATE TABLE IF NOT EXISTS \`car_renting_store_request_items\` (
    \`id\` int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`request_id\` int UNSIGNED NOT NULL,
    \`product_id\` int UNSIGNED NOT NULL,
    \`quantity_requested\` int NOT NULL,
    \`quantity_shipped\` int DEFAULT NULL,
    \`unit_price\` decimal(10,2) DEFAULT NULL,
    \`notes\` text,
    FOREIGN KEY (\`request_id\`) REFERENCES \`car_renting_store_requests\`(\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
  try { await db.raw("ALTER TABLE \`car_renting_store_requests\` ADD \`department\` varchar(50) DEFAULT 'Car Rental'"); } catch (e) {}
}

exports.createStoreRequest = catchAsync(async (req, res) => {
  const { items, notes, department } = req.body;
  if (!items || !items.length) throw new AppError('At least one item required', 400);

  await ensureTables();

  const num = `CRS-${Date.now()}`;
  const [id] = await db('car_renting_store_requests').insert({
    request_number: num, requested_by: req.user.id, notes: notes || null, status: 'FORWARDED_TO_CEO', department: department || 'Car Rental'
  });

  const rows = items.map(i => ({ request_id: id, product_id: i.product_id, quantity_requested: i.quantity_requested }));
  await db('car_renting_store_request_items').insert(rows);

  // Trigger CEO Notification
  try {
    await notificationRepository.create({
      roleTarget: 'CEO',
      title: 'New Car Renting Store Request',
      message: `A new store request (${num}) requires your approval.`,
      type: 'approval',
      link: '/ceo/agri-and-car-rental'
    });
  } catch (e) { console.error('Failed to notify CEO', e); }

  const request = await db('car_renting_store_requests').where({ id }).first();
  res.status(201).json({ status: 'success', data: request });
});

/* ─── UPDATE request items (only while FORWARDED_TO_CEO) ─── */
exports.updateStoreRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { items, notes, department } = req.body;
  if (!items || !items.length) throw new AppError('At least one item required', 400);

  const request = await db('car_renting_store_requests').where({ id }).first();
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'FORWARDED_TO_CEO') {
    throw new AppError(`Cannot edit a request that is already "${request.status}". Only requests pending CEO approval can be updated.`, 400);
  }
  // Ensure the requestor owns this request
  if (request.requested_by !== req.user.id) {
    throw new AppError('Not authorized to edit this request', 403);
  }

  await db.transaction(async (trx) => {
    // Remove old items and insert updated ones
    await trx('car_renting_store_request_items').where({ request_id: id }).delete();
    const rows = items.map(i => ({ request_id: id, product_id: i.product_id, quantity_requested: i.quantity_requested }));
    await trx('car_renting_store_request_items').insert(rows);
    await trx('car_renting_store_requests').where({ id }).update({ notes: notes || null, department: department || 'Car Rental', updated_at: db.fn.now() });
  });

  // Notify CEO that the request was updated
  try {
    await notificationRepository.create({
      roleTarget: 'CEO',
      title: 'Car Renting Store Request Updated',
      message: `Request ${request.request_number} has been updated and still awaits your approval.`,
      type: 'approval',
      link: '/ceo/agri-and-car-rental'
    });
  } catch (e) { console.error('Failed to notify CEO of update', e); }

  const updated = await db('car_renting_store_requests').where({ id }).first();
  res.json({ status: 'success', message: 'Request updated successfully', data: updated });
});

// ==========================================
// MAINTENANCE CONTROLLERS
// ==========================================

exports.createMaintenance = catchAsync(async (req, res) => {
  const {
    asset_id, asset_type, asset_name, type, description,
    estimated_cost_cents, scheduled_date,
    priority, mechanic_name, mechanic_phone, reported_by, images, notes, location
  } = req.body;
  
  if (!asset_id || !asset_type || !type || !description || !estimated_cost_cents || !scheduled_date) {
      throw new AppError('Missing required maintenance fields', 400);
  }

  const record = await Maintenance.create({
      asset_id, asset_type, asset_name: asset_name || 'Unknown',
      type, description, estimated_cost_cents, scheduled_date,
      priority: priority || 'Normal',
      mechanic_name: mechanic_name || null,
      mechanic_phone: mechanic_phone || null,
      reported_by: reported_by || null,
      images: images ? JSON.stringify(images) : null,
      notes: notes || null,
      location: location || null,
      status: 'PENDING_CEO'
  });

  try {
      await notificationRepository.create({
          roleTarget: 'CEO',
          title: 'New Fleet Maintenance Request',
          message: `A maintenance request for asset "${asset_name}" requires your approval before going to Finance.`,
          type: 'approval',
          link: '/ceo/agri-and-car-rental'
      });
  } catch(e) { console.error('Failed to notify CEO', e); }

  res.status(201).json({ status: 'success', data: record });
});


exports.getMaintenance = catchAsync(async (req, res) => {
  const records = await Maintenance.findAll();
  res.json({ status: 'success', data: records });
});

exports.getFinanceMaintenance = catchAsync(async (req, res) => {
  // Finance sees everything, can filter on frontend
  const records = await Maintenance.findAll();
  res.json({ status: 'success', data: records });
});

exports.ceoApproveMaintenance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await Maintenance.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  if(record.status !== 'PENDING_CEO') throw new AppError('Record is not pending CEO approval', 400);

  const updated = await Maintenance.updateStatus(id, 'PENDING_FINANCE');
  
  try {
      await notificationRepository.create({
          roleTarget: 'Finance',
          title: 'New Maintenance Approval Request',
          message: `CEO approved maintenance for ${record.asset_name}. It now requires your financial approval.`,
          type: 'approval',
          link: '/finance/maintenance-approvals'
      });
  } catch(e) { console.error('Failed to notify Finance', e); }

  res.json({ status: 'success', data: updated });
});

exports.financeApproveMaintenance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await Maintenance.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  if(record.status !== 'PENDING_FINANCE') throw new AppError('Record is not pending Finance confirmation', 400);

  const updated = await Maintenance.updateStatus(id, 'FINANCE_READY');

  // Notify Car/Tractor Manager that payment is confirmed and they can prepare
  try {
    await notificationRepository.create({
      roleTarget: 'Car Renting Manager',
      title: 'Maintenance Payment Confirmed by Finance',
      message: `Finance confirmed payment for "${record.asset_name}" maintenance (ETB ${(record.estimated_cost_cents/100).toLocaleString()}). Payment will be released soon.`,
      type: 'info',
      link: '/car-renting/manager/maintenance'
    });
  } catch(e) { console.error('Failed to notify Car Manager', e); }

  // Notify CEO of the confirmation
  try {
    await notificationRepository.create({
      roleTarget: 'CEO',
      title: 'Maintenance Payment Status Update',
      message: `Finance confirmed the budget for "${record.asset_name}" maintenance. Payment voucher will be processed.`,
      type: 'info',
      link: '/ceo/agri-and-car-rental'
    });
  } catch(e) { console.error('Failed to notify CEO', e); }

  res.json({ status: 'success', data: updated });
});

exports.financePayMaintenance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await Maintenance.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  if(record.status !== 'FINANCE_READY') throw new AppError('Record must be confirmed (FINANCE_READY) before payment', 400);

  // Accept full PV payload from frontend form
  const {
    date, paidTo, amount, paymentMethod, description, referenceNo,
    preparedBy, checkedBy, receiverName,
    preparedSignature, checkedSignature, receiverSignature,
    bankDetails, telebirrDetails
  } = req.body;

  const amountETB = parseFloat(amount) || parseFloat((record.estimated_cost_cents / 100).toFixed(2));

  // Generate PV number from the finance_cash_pv table or payables
  let pvNumber;
  try {
    const row = await db('finance_payables').max('id as maxId').first();
    const next = (row?.maxId || 0) + 1;
    pvNumber = `PV-MNT-${String(next).padStart(5, '0')}`;
  } catch(e) { pvNumber = `PV-MNT-${record.id}-${Date.now()}`; }

  // Record in finance_payables (Payables Book) with full PV details
  try {
    await db('finance_payables').insert({
      pv_number:           pvNumber,
      date:                date || db.fn.now(),
      paid_to:             paidTo || record.asset_name,
      category:            `Fleet Maintenance - ${record.asset_type === 'tractor' ? 'AgriRent' : 'Car Rental'}`,
      total_amount:        amountETB,
      amount_paid:         amountETB,
      outstanding_balance: 0,
      payment_method:      paymentMethod || 'Cash',
      description:         description || `Maintenance: ${record.type} — ${record.description}`,
      reference_no:        referenceNo || `MNT-${String(record.id).padStart(4, '0')}`,
      due_date:            record.scheduled_date,
      status:              'Paid',
    });
  } catch(e) { console.error('Failed to record payable:', e); }

  // Also record in finance_pvs table for PV book (used by Reconciliation & Bank system)
  try {
    const pvData = {
      pv_number:          pvNumber,
      date:               date || db.fn.now(),
      paid_to:            paidTo || record.asset_name,
      amount:             amountETB,
      payment_method:     paymentMethod || 'Cash',
      description:        description || `Maintenance: ${record.type} — ${record.description}`,
      reference_no:       referenceNo || `MNT-${String(record.id).padStart(4, '0')}`,
      prepared_by:        preparedBy || null,
      checked_by:         checkedBy || null,
      receiver_name:      receiverName || null,
      prepared_signature: preparedSignature || null,
      checked_signature:  checkedSignature || null,
      receiver_signature: receiverSignature || null,
    };

    if (paymentMethod === 'Bank' && bankDetails) {
      pvData.bank_name = bankDetails.bankName;
      pvData.account_holder = bankDetails.accountHolder;
      pvData.account_number = bankDetails.accountNumber;
      pvData.cheque_no = bankDetails.chequeNo;
    }

    if (paymentMethod === 'Telebirr' && telebirrDetails) {
      pvData.telebirr_number = telebirrDetails.telebirrNumber;
      pvData.telebirr_name = telebirrDetails.fullName;
    }

    await db('finance_pvs').insert(pvData).catch(e => console.error('PV table insert failed (non-fatal):', e.message));
  } catch(e) { console.error('finance_pvs insert error:', e); }

  // Record in Cashbook (as payment) for accurate system balance and reconciliation
  try {
    await db('finance_cashbook').insert({
      date: date || db.fn.now(),
      type: 'PV',
      reference: pvNumber,
      description: description || `Maintenance Payment: ${record.asset_name}`,
      receipts: 0,
      payments: amountETB
    });
  } catch (e) { console.error('finance_cashbook insert error:', e); }

  const updated = await Maintenance.updateStatus(id, 'PAYMENT_RELEASED');

  // Notify Car/Tractor Manager
  try {
    await notificationRepository.create({
      roleTarget: 'Car Renting Manager',
      title: '✅ Maintenance Payment Released',
      message: `Finance released payment (${pvNumber}) for "${record.asset_name}" — ETB ${amountETB.toLocaleString()}. Maintenance work can now proceed.`,
      type: 'success',
      link: '/car-renting/manager/maintenance'
    });
  } catch(e) { console.error('Failed to notify Car Manager', e); }

  // Notify CEO
  try {
    await notificationRepository.create({
      roleTarget: 'CEO',
      title: '✅ Maintenance PV Processed',
      message: `Finance issued Payment Voucher ${pvNumber} for ETB ${amountETB.toLocaleString()} for "${record.asset_name}" maintenance. Recorded in Payables & PV books.`,
      type: 'success',
      link: '/ceo/agri-and-car-rental'
    });
  } catch(e) { console.error('Failed to notify CEO', e); }

  res.json({ status: 'success', data: { ...updated, pvNumber } });
});

exports.completeMaintenance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await Maintenance.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  
  const updated = await Maintenance.updateStatus(id, 'COMPLETED');
  res.json({ status: 'success', data: updated });
});


exports.getStoreRequests = catchAsync(async (req, res) => {
  const { status, department } = req.query;
  try { await ensureTables(); } catch (err) { console.error('Table check failed:', err); }

  let q = db('car_renting_store_requests')
    .select(
      'car_renting_store_requests.*',
      'req_user.full_name as requester_name',
      'store_user.full_name as store_handler_name',
      'ceo_user.full_name as approver_name',
      db.raw('(SELECT COUNT(*) FROM car_renting_store_request_items WHERE request_id = car_renting_store_requests.id) as item_count'),
      db.raw('(SELECT GROUP_CONCAT(product_id) FROM car_renting_store_request_items WHERE request_id = car_renting_store_requests.id) as product_ids')
    )
    .leftJoin('users as req_user', 'car_renting_store_requests.requested_by', 'req_user.id')
    .leftJoin('users as store_user', 'car_renting_store_requests.store_handler', 'store_user.id')
    .leftJoin('users as ceo_user', 'car_renting_store_requests.approved_by', 'ceo_user.id');
  
  if (status) q = q.where('car_renting_store_requests.status', status);
  if (department) {
    if (department === 'Car Rental') {
      // Include records explicitly set to 'Car Rental' AND old records with NULL department
      q = q.where(function () {
        this.where('car_renting_store_requests.department', 'Car Rental')
            .orWhereNull('car_renting_store_requests.department');
      });
    } else {
      q = q.where('car_renting_store_requests.department', department);
    }
  }
  
  const requests = await q.orderBy('car_renting_store_requests.created_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.getStoreRequestDetail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const request = await db('car_renting_store_requests')
    .select(
        'car_renting_store_requests.*',
        'req_user.full_name as requester_name',
        'store_user.full_name as store_handler_name',
        'ceo_user.full_name as approver_name'
    )
    .leftJoin('users as req_user', 'car_renting_store_requests.requested_by', 'req_user.id')
    .leftJoin('users as store_user', 'car_renting_store_requests.store_handler', 'store_user.id')
    .leftJoin('users as ceo_user', 'car_renting_store_requests.approved_by', 'ceo_user.id')
    .where('car_renting_store_requests.id', id).first();

  if (!request) throw new AppError('Request not found', 404);

  const items = await db('car_renting_store_request_items')
    .select(
        'car_renting_store_request_items.*',
        'general_store_materials.material_name as product_name',
        'general_store_materials.quantity_in_store as stock_quantity'
    )
    .leftJoin('general_store_materials', 'car_renting_store_request_items.product_id', 'general_store_materials.id')
    .where('car_renting_store_request_items.request_id', id);

  res.json({ status: 'success', data: { ...request, items } });
});

exports.updateStoreRequestStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status: newStatus, rejection_reason, items: shippedItems } = req.body;

  const request = await db('car_renting_store_requests').where({ id }).first();
  if (!request) throw new AppError('Request not found', 404);

  const updateData = { status: newStatus };
  const userRole = req.user.roles || [];
  const isStore = userRole.includes('Pharmacy Store Keeper') || userRole.includes('General Store Keeper');
  const isCeo = userRole.includes('CEO') || userRole.includes('Admin');

  if (newStatus === 'FORWARDED_TO_CEO' || newStatus === 'SHIPPED') {
    if (isStore) updateData.store_handler = req.user.id;
  }
  if (newStatus === 'APPROVED') {
    updateData.status = 'PENDING_STORE';
    if (isCeo) updateData.approved_by = req.user.id;
  }
  if (newStatus === 'REJECTED') {
    if (isCeo) updateData.approved_by = req.user.id;
    updateData.rejection_reason = rejection_reason || 'Rejected by management';
  }

  await db.transaction(async (trx) => {
    if (newStatus === 'SHIPPED' && shippedItems) {
      for (const item of shippedItems) {
        if (item.quantity_shipped > 0) {
          // Deduct from general store inventory
          await trx('general_store_materials')
            .where('id', item.product_id)
            .decrement('quantity_in_store', item.quantity_shipped);
          
          await trx('car_renting_store_request_items')
            .where({ id: item.id })
            .update({ quantity_shipped: item.quantity_shipped });
        }
      }
    }
    await trx('car_renting_store_requests').where({ id }).update(updateData);
  });

  const updated = await db('car_renting_store_requests').where({ id }).first();
  res.json({ status: 'success', message: `Status updated to ${newStatus}`, data: updated });
});

/* ─── FUEL & SERVICE WORKFLOW ─────────────────────────────────── */

exports.createFuelService = catchAsync(async (req, res) => {
  const data = {
    asset_id: req.body.asset_id,
    asset_type: req.body.asset_type,
    asset_name: req.body.asset_name,
    request_type: req.body.request_type, // 'Fuel' or 'Service'
    description: req.body.description,
    estimated_cost_cents: req.body.estimated_cost_cents,
    requested_date: req.body.requested_date,
    priority: req.body.priority || 'Normal',
    driver_name: req.body.driver_name,
    current_mileage: req.body.current_mileage,
    location: req.body.location,
    notes: req.body.notes,
    reported_by: req.body.reported_by || (req.user ? req.user.name : 'Manager'),
    status: 'PENDING_CEO'
  };

  const record = await FuelService.create(data);

  try {
    await notificationRepository.create({
      roleTarget: 'CEO',
      title: `New ${data.request_type} Request`,
      message: `${data.asset_name} needs ${data.request_type}. Pending your approval.`,
      type: 'approval',
      link: '/ceo/agri-and-car-rental'
    });
  } catch(e) { console.error('Failed to notify CEO', e); }

  res.status(201).json({ status: 'success', data: record });
});

exports.getFuelServices = catchAsync(async (req, res) => {
  const records = await FuelService.findAll();
  res.json({ status: 'success', data: records });
});

exports.ceoApproveFuelService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await FuelService.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  if(record.status !== 'PENDING_CEO') throw new AppError('Record is not pending CEO approval', 400);

  const updated = await FuelService.updateStatus(id, 'PENDING_FINANCE');
  
  try {
    await notificationRepository.create({
      roleTarget: 'Finance',
      title: `New ${record.request_type} Approval Request`,
      message: `CEO approved ${record.request_type} for ${record.asset_name}. Needs financial approval.`,
      type: 'approval',
      link: '/finance/maintenance-approvals'
    });
  } catch(e) { console.error('Failed to notify Finance', e); }

  res.json({ status: 'success', data: updated });
});

exports.financeApproveFuelService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await FuelService.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  if(record.status !== 'PENDING_FINANCE') throw new AppError('Record is not pending Finance confirmation', 400);

  const updated = await FuelService.updateStatus(id, 'FINANCE_READY');

  try {
    await notificationRepository.create({
      roleTarget: 'Car Renting Manager',
      title: `${record.request_type} Payment Confirmed`,
      message: `Finance confirmed payment for "${record.asset_name}" ${record.request_type}. Payment will be released soon.`,
      type: 'info',
      link: '/car-renting/manager/utilization'
    });
  } catch(e) { console.error('Failed to notify Car Manager', e); }

  try {
    await notificationRepository.create({
      roleTarget: 'CEO',
      title: `${record.request_type} Payment Status Update`,
      message: `Finance confirmed the budget for "${record.asset_name}" ${record.request_type}.`,
      type: 'info',
      link: '/ceo/agri-and-car-rental'
    });
  } catch(e) { console.error('Failed to notify CEO', e); }

  res.json({ status: 'success', data: updated });
});

exports.financePayFuelService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await FuelService.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  if(record.status !== 'FINANCE_READY') throw new AppError('Record must be confirmed (FINANCE_READY) before payment', 400);

  const {
    date, paidTo, amount, paymentMethod, description, referenceNo,
    preparedBy, checkedBy, receiverName,
    preparedSignature, checkedSignature, receiverSignature,
    bankDetails, telebirrDetails
  } = req.body;

  const amountETB = parseFloat(amount) || parseFloat((record.estimated_cost_cents / 100).toFixed(2));

  let pvNumber;
  try {
    const row = await db('finance_payables').max('id as maxId').first();
    const next = (row?.maxId || 0) + 1;
    pvNumber = `PV-FS-${String(next).padStart(5, '0')}`;
  } catch(e) { pvNumber = `PV-FS-${record.id}-${Date.now()}`; }

  try {
    await db('finance_payables').insert({
      pv_number:           pvNumber,
      date:                date || db.fn.now(),
      paid_to:             paidTo || record.asset_name,
      category:            `Fuel & Service - ${record.asset_type === 'tractor' ? 'AgriRent' : 'Car Rental'}`,
      total_amount:        amountETB,
      amount_paid:         amountETB,
      outstanding_balance: 0,
      payment_method:      paymentMethod || 'Cash',
      description:         description || `${record.request_type}: ${record.description}`,
      reference_no:        referenceNo || `FS-${String(record.id).padStart(4, '0')}`,
      due_date:            record.requested_date,
      status:              'Paid',
    });
  } catch(e) { console.error('Failed to record payable:', e); }

  try {
    await db('finance_cashbook').insert({
      date:               date || db.fn.now(),
      reference_number:   pvNumber,
      description:        description || `${record.request_type} Payment: ${record.asset_name}`,
      cash_out:           amountETB,
      cash_in:            0,
      balance:            0, 
      payment_method:     paymentMethod || 'Cash',
      transaction_type:   'PV',
      category:           `Fuel & Service - ${record.asset_type === 'tractor' ? 'AgriRent' : 'Car Rental'}`,
      prepared_by:        preparedBy || 'System'
    });
  } catch(e) { console.error('Failed to update cashbook:', e); }

  let detailsStr = '';
  if (paymentMethod === 'Bank Transfer' && bankDetails) {
    detailsStr = `Bank: ${bankDetails.bankName}, Acc: ${bankDetails.accountNumber}, Ref: ${bankDetails.referenceNumber}`;
  } else if (paymentMethod === 'Telebirr' && telebirrDetails) {
    detailsStr = `Telebirr: ${telebirrDetails.phoneNumber}, Ref: ${telebirrDetails.referenceNumber}`;
  }

  const updated = await FuelService.updateStatus(id, 'PAYMENT_RELEASED');

  try {
    await notificationRepository.create({
      roleTarget: 'Car Renting Manager',
      title: `${record.request_type} Payment Released`,
      message: `Payment of ETB ${amountETB.toLocaleString()} released for ${record.asset_name}. PV: ${pvNumber}. ${detailsStr}`,
      type: 'success',
      link: '/car-renting/manager/utilization'
    });
  } catch(e) {}

  res.json({ status: 'success', data: updated, pvNumber });
});

exports.completeFuelService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await FuelService.findById(id);
  if(!record) throw new AppError('Record not found', 404);
  if(record.status !== 'PAYMENT_RELEASED') throw new AppError('Payment must be released before marking as completed', 400);

  const updated = await FuelService.updateStatus(id, 'COMPLETED');
  res.json({ status: 'success', data: updated });
});
