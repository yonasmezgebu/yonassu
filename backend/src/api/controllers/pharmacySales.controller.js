const { db } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const logPharmacyAction = require('../../utils/pharmacyAuditLogger');
const vatConfigService = require('../../services/vatConfig.service');
const { generateInvoiceNumber } = require('../../utils/orderNumber');
const { recordInvoiceForOrder, recordReceiptForOrder, findInvoiceForOrder } = require('../../services/invoiceDocument.service');
const { sendFinanceNotification } = require('../../services/notification.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(prefix) {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  return `${prefix}-${ts}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function computeVat(amount, rate) {
  return parseFloat(((amount * rate) / 100).toFixed(2));
}

// ─── DRUGS (public catalog) ────────────────────────────────────────────────────

exports.listDrugs = async (req, res) => {
  try {
    const { search, category, requires_prescription } = req.query;
    let query = db('drugs')
      .select('id', 'name', 'strength', 'unit', 'unit_price', 'category',
              'classification', 'therapeutic_use', 'requires_prescription', 'vat_rate', 'status')
      .where('status', 'ACTIVE');

    // exclude hidden drugs
    query = query.whereNotIn('id', db('drug_visibility').select('drug_id').where('is_hidden', true));

    if (search) query = query.where('name', 'like', `%${search}%`);
    if (category) query = query.where('category', category);
    if (requires_prescription !== undefined) {
      query = query.where('requires_prescription', requires_prescription === 'true' ? 1 : 0);
    }

    const drugs = await query.orderBy('name');
    return res.json({ success: true, data: drugs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDrug = async (req, res) => {
  try {
    const drug = await db('drugs').where('id', req.params.id).first();
    if (!drug) return res.status(404).json({ success: false, message: 'Drug not found' });
    return res.json({ success: true, data: drug });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CUSTOMER AUTH ─────────────────────────────────────────────────────────────

exports.customerRegister = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { full_name, phone, email, password, preferred_language } = req.body;
    if (!full_name || !phone || !password)
      return res.status(400).json({ success: false, message: 'full_name, phone and password are required' });

    const existing = await db('customers').where('phone', phone).first();
    if (existing) return res.status(409).json({ success: false, message: 'Phone already registered' });

    const hash = await bcrypt.hash(password, 10);

    // customers table uses 'name' not 'full_name' and requires customer_type_id
    const defaultType = await db('customer_types').first();
    if (!defaultType)
      return res.status(500).json({ success: false, message: 'No customer_types found in database. Please seed.' });

    const [id] = await db('customers').insert({
      name: full_name,
      phone,
      email: email || null,
      preferred_language: preferred_language || 'en',
      password_hash: hash,
      customer_type_id: defaultType.id,
    });

    return res.status(201).json({ success: true, data: { id, name: full_name, phone } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.customerLogin = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { phone, password } = req.body;
    const customer = await db('customers').where('phone', phone).first();
    if (!customer || !customer.password_hash)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, customer.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { customerId: customer.id, phone: customer.phone, role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'sutana-secret',
      { expiresIn: '7d' }
    );
    return res.json({ success: true, token, data: { id: customer.id, name: customer.name, phone: customer.phone } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PRESCRIPTIONS ─────────────────────────────────────────────────────────────

exports.submitPrescription = async (req, res) => {
  try {
    const { drug_id, drug_name_text, branch_id, special_instructions, quantity_requested, submission_type } = req.body;
    const customerId = req.customer?.id || null;
    const submittedBy = customerId || req.user?.id;

    if (!submittedBy)
      return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!branch_id)
      return res.status(400).json({ success: false, message: 'branch_id is required' });
    if (!req.body.file_url && !req.file)
      return res.status(400).json({ success: false, message: 'Prescription file is required' });

    const file_url = req.body.file_url || (req.file ? `/uploads/${req.file.filename}` : null);
    const reference_code = generateCode('RX');

    const [id] = await db('prescriptions').insert({
      customer_id: customerId,
      submitted_by: submittedBy,
      submission_type: submission_type || 'ONLINE_UPLOAD',
      file_url,
      drug_id: drug_id || null,
      drug_name_text: drug_name_text || null,
      branch_id,
      special_instructions: special_instructions || null,
      quantity_requested: quantity_requested || 1,
      status: 'SUBMITTED',
      reference_code,
    });

    return res.status(201).json({ success: true, data: { id, reference_code } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listPrescriptions = async (req, res) => {
  try {
    const { branch_id, status } = req.query;
    let query = db('prescriptions as p')
      .leftJoin('customers as c', 'p.customer_id', 'c.id')
      .leftJoin('drugs as d', 'p.drug_id', 'd.id')
      .leftJoin('branches as b', 'p.branch_id', 'b.id')
      .select(
        'p.*',
        'c.name as customer_name', 'c.phone as customer_phone',
        'd.name as drug_name',
        'b.name as branch_name'
      );
    if (branch_id) query = query.where('p.branch_id', branch_id);
    if (status) query = query.where('p.status', status);
    const rows = await query.orderBy('p.created_at', 'desc');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['SUBMITTED', 'READY_FOR_PICKUP', 'FULFILLED', 'CANCELLED'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: `status must be one of: ${valid.join(', ')}` });
    await db('prescriptions').where('id', req.params.id).update({ status });
    return res.json({ success: true, message: 'Prescription status updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.trackPrescription = async (req, res) => {
  try {
    const { reference_code } = req.params;
    const rx = await db('prescriptions as p')
      .leftJoin('branches as b', 'p.branch_id', 'b.id')
      .select('p.reference_code', 'p.status', 'p.created_at', 'b.name as branch_name')
      .where('p.reference_code', reference_code)
      .first();
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });
    return res.json({ success: true, data: rx });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── BRANCHES ──────────────────────────────────────────────────────────────────

exports.listBranches = async (req, res) => {
  try {
    const rows = await db('branches').where('is_active', true).orderBy('name');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const [id] = await db('branches').insert({ name, code: code || null });
    return res.status(201).json({ success: true, data: { id, name } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleBranch = async (req, res) => {
  try {
    const branch = await db('branches').where('id', req.params.id).first();
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    await db('branches').where('id', req.params.id).update({ is_active: !branch.is_active });
    return res.json({ success: true, message: `Branch ${branch.is_active ? 'deactivated' : 'activated'}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── WORKERS ───────────────────────────────────────────────────────────────────

exports.listWorkers = async (req, res) => {
  try {
    const rows = await db('workers as w')
      .join('users as u', 'w.user_id', 'u.id')
      .leftJoin('branches as b', 'w.branch_id', 'b.id')
      .select('w.id', 'u.full_name', 'u.email', 'w.can_post', 'b.name as branch_name', 'w.branch_id');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignWorker = async (req, res) => {
  try {
    const { user_id, branch_id, can_post } = req.body;
    if (!user_id || !branch_id)
      return res.status(400).json({ success: false, message: 'user_id and branch_id are required' });
    const existing = await db('workers').where('user_id', user_id).first();
    if (existing) {
      await db('workers').where('user_id', user_id).update({ branch_id, can_post: can_post ?? existing.can_post });
      logPharmacyAction(req, 'Worker Updated', `Worker User#${user_id}`, { branch_id: existing.branch_id, can_post: existing.can_post }, { branch_id, can_post: can_post ?? existing.can_post }, 'Pharmacy Sales');
      return res.json({ success: true, message: 'Worker updated' });
    }
    const [id] = await db('workers').insert({ user_id, branch_id, can_post: can_post ?? false });
    logPharmacyAction(req, 'Worker Assigned', `Worker User#${user_id}`, null, { branch_id, can_post: can_post ?? false }, 'Pharmacy Sales');
    return res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SALES (POS) ───────────────────────────────────────────────────────────────

exports.submitOnlineOrder = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { branch_id, items, prescription_id } = req.body;
    const customer_id = req.customer?.id;

    if (!branch_id || !items || !items.length) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'branch_id and items are required' });
    }

    let subtotal = 0;
    let totalVat = 0;
    const enrichedItems = [];
    for (const item of items) {
      const drug = await trx('drugs').where('id', item.drug_id).first();
      if (!drug) throw new Error(`Drug ${item.drug_id} not found`);
      if (drug.requires_prescription && !prescription_id)
        throw new Error(`Drug "${drug.name}" requires a prescription`);

      const unitPrice = parseFloat(drug.unit_price);
      const lineSubtotal = parseFloat((unitPrice * item.quantity).toFixed(2));
      const vatResult = await vatConfigService.computeVatForItem('pharmacy', item.drug_id, lineSubtotal, parseFloat(drug.vat_rate || 0));
      const vatAmount = parseFloat(vatResult.vat.toFixed(2));
      const lineTotal = parseFloat((lineSubtotal + vatAmount).toFixed(2));
      subtotal += lineSubtotal;
      totalVat += vatAmount;
      enrichedItems.push({
        drug_id: item.drug_id,
        name: drug.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        vat_rate: parseFloat(drug.vat_rate || 0),
        vat_amount: vatAmount,
        line_subtotal: lineSubtotal,
        line_total: lineTotal,
        rate: vatResult.rate,
        treatment: vatResult.treatment
      });
    }
    const totalAmount = parseFloat((subtotal + totalVat).toFixed(2));
    const sale_code = generateCode('ORD');

    const [saleId] = await trx('sales').insert({
      sale_code,
      branch_id,
      worker_id: null, // Online order has no initial worker
      sale_type: 'ONLINE',
      customer_id: customer_id || null,
      prescription_id: prescription_id || null,
      subtotal,
      vat_amount: totalVat,
      total_amount: totalAmount,
      status: 'PENDING_VERIFICATION',
    });

    for (const ei of enrichedItems) {
      await trx('sale_items').insert({ sale_id: saleId, ...ei });
    }

    // Invoice is recorded immediately when the online order is placed.
    const invNo = await generateInvoiceNumber();
    await recordInvoiceForOrder(trx, {
      source: 'pharmacy',
      saleId,
      saleType: 'online',
      invoiceNo: invNo,
      customer: req.customer?.name || null,
      customerTin: null,
      lines: enrichedItems.map((ei) => ({
        itemId: ei.drug_id,
        name: ei.name,
        qty: ei.quantity,
        unitPrice: ei.unit_price,
        amount: ei.line_subtotal,
        rate: ei.rate,
        treatment: ei.treatment
      })),
      createdBy: req.customer?.name || 'Customer Portal'
    });

    await trx.commit();
    return res.status(201).json({ success: true, data: { sale_id: saleId, sale_code, total_amount: totalAmount } });
  } catch (err) {
    await trx.rollback();
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.listPendingOnlineOrders = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = db('sales as s')
      .leftJoin('customers as c', 's.customer_id', 'c.id')
      .leftJoin('prescriptions as p', 's.prescription_id', 'p.id')
      .select('s.*', 'c.name as customer_name', 'c.phone as customer_phone', 'p.reference_code as prescription_ref')
      .where('s.status', 'PENDING_VERIFICATION')
      .where('s.sale_type', 'ONLINE');

    if (branch_id) query = query.where('s.branch_id', branch_id);

    const rows = await query.orderBy('s.created_at', 'asc');

    // Attach items
    for (const row of rows) {
      row.items = await db('sale_items as si').join('drugs as d', 'si.drug_id', 'd.id')
        .select('si.*', 'd.name as drug_name', 'd.unit').where('si.sale_id', row.id);
    }

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.processPendingOrder = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { worker_id, payment } = req.body;
    const saleId = req.params.id;

    if (!worker_id) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: 'worker_id is required' });
    }

    const sale = await trx('sales').where('id', saleId).where('status', 'PENDING_VERIFICATION').first();
    if (!sale) {
      await trx.rollback();
      return res.status(404).json({ success: false, message: 'Pending online order not found' });
    }

    // Deduct inventory
    const items = await trx('sale_items').where('sale_id', saleId);
    for (const item of items) {
      const inv = await trx('pharmacy_inventory').where('drug_id', item.drug_id).first();
      if (inv) {
        await trx('pharmacy_inventory').where('drug_id', item.drug_id).decrement('quantity', item.quantity);
      }
    }

    // Record payment
    const receipt_code = generateCode('RCPT');
    let paymentData = { sale_id: saleId, receipt_code, amount: sale.total_amount };
    if (payment) {
      paymentData = { ...paymentData, ...payment };
      paymentData.amount = sale.total_amount;
    } else {
      paymentData.method = 'CASH';
    }
    paymentData.status = 'PAID';
    paymentData.verification_status = payment?.method === 'CASH' ? 'VERIFIED' : 'UNVERIFIED';

    const [paymentId] = await trx('payments').insert(paymentData);

    // Receipt is recorded once the online payment is verified/processed.
    let workerRow = await trx('pharmacy_workers').where('id', worker_id).first();
    if (!workerRow) workerRow = await trx('workers').where('id', worker_id).first();
    const workerName = workerRow ? (workerRow.name || workerRow.full_name || workerRow.fullName || null) : null;
    let invoice = await findInvoiceForOrder(trx, 'pharmacy', saleId);
    if (!invoice) {
      const backfillLines = items.map((it) => ({
        itemId: it.drug_id,
        name: `Drug #${it.drug_id}`,
        qty: it.quantity,
        unitPrice: it.unit_price,
        amount: it.line_subtotal,
        rate: parseFloat(it.vat_rate || 0) / 100,
        treatment: parseFloat(it.vat_rate || 0) === 0 ? 'zero_rated' : 'standard'
      }));
      const invNo = await generateInvoiceNumber();
      const created = await recordInvoiceForOrder(trx, {
        source: 'pharmacy',
        saleId,
        saleType: 'online',
        invoiceNo: invNo,
        customer: null,
        customerTin: null,
        lines: backfillLines,
        createdBy: workerName || 'Pharmacy Staff'
      });
      invoice = { id: created.invoiceId };
    }
    await recordReceiptForOrder(trx, {
      invoiceId: invoice.id,
      amountPaid: sale.total_amount,
      paymentMethod: paymentData.method || 'CASH',
      paymentReference: paymentData.reference || receipt_code,
      receivedBy: workerName || 'Pharmacy Staff'
    });

    // Update sale status
    await trx('sales').where('id', saleId).update({
      status: 'COMPLETED',
      worker_id: worker_id
    });

    await trx.commit();
    logPharmacyAction(req, 'Online Order Processed', receipt_code, { status: 'PENDING_VERIFICATION' }, { status: 'COMPLETED', sale_id: saleId, worker_id, payment_id: paymentId }, 'Pharmacy Sales');
    return res.json({ success: true, data: { sale_id: saleId, receipt_code, payment_id: paymentId } });
  } catch (err) {
    await trx.rollback();
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.createSale = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { branch_id, worker_id, sale_type, customer_id, prescription_id, items, payment } = req.body;

    if (!branch_id || !worker_id || !items || !items.length)
      return res.status(400).json({ success: false, message: 'branch_id, worker_id, and items are required' });

    // validate prescription for controlled drugs
    for (const item of items) {
      const drug = await trx('drugs').where('id', item.drug_id).first();
      if (!drug) throw new Error(`Drug ${item.drug_id} not found`);
      if (drug.requires_prescription && !prescription_id)
        throw new Error(`Drug "${drug.name}" requires a prescription`);
    }

    // compute totals
    let subtotal = 0;
    let totalVat = 0;
    const enrichedItems = [];
    for (const item of items) {
      const drug = await trx('drugs').where('id', item.drug_id).first();
      const unitPrice = parseFloat(drug.unit_price);
      const lineSubtotal = parseFloat((unitPrice * item.quantity).toFixed(2));
      const vatResult = await vatConfigService.computeVatForItem('pharmacy', item.drug_id, lineSubtotal, parseFloat(drug.vat_rate || 0));
      const vatAmount = parseFloat(vatResult.vat.toFixed(2));
      const lineTotal = parseFloat((lineSubtotal + vatAmount).toFixed(2));
      subtotal += lineSubtotal;
      totalVat += vatAmount;
      enrichedItems.push({
        drug_id: item.drug_id,
        name: drug.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        vat_rate: parseFloat(drug.vat_rate || 0),
        vat_amount: vatAmount,
        line_subtotal: lineSubtotal,
        line_total: lineTotal,
        rate: vatResult.rate,
        treatment: vatResult.treatment
      });
    }
    const totalAmount = parseFloat((subtotal + totalVat).toFixed(2));
    const sale_code = generateCode('SALE');

    const [saleId] = await trx('sales').insert({
      sale_code, branch_id, worker_id,
      sale_type: sale_type || 'WALK_IN',
      customer_id: customer_id || null,
      prescription_id: prescription_id || null,
      subtotal, vat_amount: totalVat, total_amount: totalAmount,
      status: 'COMPLETED',
    });

    for (const ei of enrichedItems) {
      await trx('sale_items').insert({ sale_id: saleId, ...ei });
    }

    // deduct from pharmacy_inventory
    for (const item of items) {
      const inv = await trx('pharmacy_inventory').where('drug_id', item.drug_id).first();
      if (inv) {
        await trx('pharmacy_inventory').where('drug_id', item.drug_id).decrement('quantity', item.quantity);
      }
    }

    // record payment
    const receipt_code = generateCode('RCPT');
    let paymentData = { sale_id: saleId, receipt_code, amount: totalAmount };
    if (payment) {
      paymentData = { ...paymentData, ...payment };
      paymentData.amount = totalAmount; // always system-computed
    } else {
      paymentData.method = 'CASH';
    }
    paymentData.status = 'PAID';
    paymentData.verification_status = payment?.method === 'CASH' ? 'VERIFIED' : 'UNVERIFIED';

    const [paymentId] = await trx('payments').insert(paymentData);

    // Invoice + receipt are recorded at sale time — payment is collected here.
    const invNo = await generateInvoiceNumber();
    const invRes = await recordInvoiceForOrder(trx, {
      source: 'pharmacy',
      saleId,
      saleType: String(sale_type || 'WALK_IN').toUpperCase() === 'ONLINE' ? 'online' : 'walk_in',
      invoiceNo: invNo,
      customer: customer_id ? (await trx('customers').where('id', customer_id).first())?.name || null : null,
      customerTin: null,
      lines: enrichedItems.map((ei) => ({
        itemId: ei.drug_id,
        name: ei.name,
        qty: ei.quantity,
        unitPrice: ei.unit_price,
        amount: ei.line_subtotal,
        rate: ei.rate,
        treatment: ei.treatment
      })),
      createdBy: req.user?.fullName || req.user?.full_name || 'Pharmacy Staff'
    });
    await recordReceiptForOrder(trx, {
      invoiceId: invRes.invoiceId,
      amountPaid: totalAmount,
      paymentMethod: paymentData.method || 'CASH',
      paymentReference: paymentData.reference || receipt_code,
      receivedBy: req.user?.fullName || req.user?.full_name || 'Pharmacy Staff'
    });

    await trx.commit();

    logPharmacyAction(req, 'Sale Created', sale_code, null, { sale_id: saleId, subtotal, vat_amount: totalVat, total_amount: totalAmount, items: enrichedItems }, 'Pharmacy Sales');

    return res.status(201).json({
      success: true,
      data: {
        sale_id: saleId, sale_code, receipt_code,
        subtotal, vat_amount: totalVat, total_amount: totalAmount,
        payment_id: paymentId
      }
    });
  } catch (err) {
    await trx.rollback();
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.listSales = async (req, res) => {
  try {
    const { branch_id, worker_id, date_from, date_to, status } = req.query;
    let query = db('sales as s')
      .leftJoin('customers as c', 's.customer_id', 'c.id')
      .leftJoin('workers as w', 's.worker_id', 'w.id')
      .leftJoin('users as u', 'w.user_id', 'u.id')
      .leftJoin('branches as b', 's.branch_id', 'b.id')
      .select('s.*', 'c.name as customer_name', 'u.full_name as worker_name', 'b.name as branch_name');
    if (branch_id) query = query.where('s.branch_id', branch_id);
    if (worker_id) query = query.where('s.worker_id', worker_id);
    if (status) query = query.where('s.status', status);
    if (date_from) query = query.where('s.created_at', '>=', date_from);
    if (date_to) query = query.where('s.created_at', '<=', date_to);
    const rows = await query.orderBy('s.created_at', 'desc').limit(200);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSale = async (req, res) => {
  try {
    const sale = await db('sales as s')
      .leftJoin('customers as c', 's.customer_id', 'c.id')
      .leftJoin('branches as b', 's.branch_id', 'b.id')
      .select('s.*', 'c.name as customer_name', 'b.name as branch_name')
      .where('s.id', req.params.id).first();
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    const items = await db('sale_items as si').join('drugs as d', 'si.drug_id', 'd.id')
      .select('si.*', 'd.name as drug_name', 'd.unit').where('si.sale_id', req.params.id);
    const payments = await db('payments').where('sale_id', req.params.id);
    return res.json({ success: true, data: { ...sale, items, payments } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.voidSale = async (req, res) => {
  try {
    const { reason } = req.body;
    const sale = await db('sales').where('id', req.params.id).first();
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    if (sale.status !== 'COMPLETED')
      return res.status(400).json({ success: false, message: 'Only COMPLETED sales can be voided' });
    // restore inventory
    const items = await db('sale_items').where('sale_id', req.params.id);
    for (const item of items) {
      await db('pharmacy_inventory').where('drug_id', item.drug_id).increment('quantity', item.quantity);
    }
    await db('sales').where('id', req.params.id).update({ status: 'VOIDED' });
    logPharmacyAction(req, 'Sale Voided', sale.sale_code, { status: sale.status }, { status: 'VOIDED', reason }, 'Pharmacy Sales');
    return res.json({ success: true, message: 'Sale voided and inventory restored' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

exports.verifyPayment = async (req, res) => {
  try {
    const { verification_status, mismatch_reason } = req.body;
    const valid = ['VERIFIED', 'MISMATCH'];
    if (!valid.includes(verification_status))
      return res.status(400).json({ success: false, message: 'verification_status must be VERIFIED or MISMATCH' });
    if (verification_status === 'MISMATCH' && !mismatch_reason)
      return res.status(400).json({ success: false, message: 'mismatch_reason is required when status is MISMATCH' });
    await db('payments').where('id', req.params.id).update({ verification_status, mismatch_reason: mismatch_reason || null });
    return res.json({ success: true, message: 'Payment verification updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordCashHandover = async (req, res) => {
  try {
    const { worker_id, branch_id, payment_id, amount, handed_to } = req.body;
    if (!worker_id || !amount || !handed_to)
      return res.status(400).json({ success: false, message: 'worker_id, amount, and handed_to are required' });
    const [id] = await db('cash_handovers').insert({
      worker_id, branch_id: branch_id || null, payment_id: payment_id || null,
      amount, handed_to, handed_over_at: new Date(), status: 'SETTLED'
    });
    return res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listHandovers = async (req, res) => {
  try {
    const { branch_id, worker_id } = req.query;
    let query = db('cash_handovers as ch')
      .leftJoin('workers as w', 'ch.worker_id', 'w.id')
      .leftJoin('users as u', 'w.user_id', 'u.id')
      .leftJoin('users as r', 'ch.handed_to', 'r.id')
      .select('ch.*', 'u.full_name as worker_name', 'r.full_name as received_by');
    if (branch_id) query = query.where('ch.branch_id', branch_id);
    if (worker_id) query = query.where('ch.worker_id', worker_id);
    const rows = await query.orderBy('ch.created_at', 'desc');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DAILY SALES REPORTS ──────────────────────────────────────────────────────

exports.submitDailyReport = async (req, res) => {
  try {
    const { branch_id, report_date } = req.body;
    const submittedBy = req.user?.id;
    if (!report_date) return res.status(400).json({ success: false, message: 'report_date is required' });

    // auto-aggregate from sales table
    const dateStr = report_date;
    let salesQuery = db('sales').whereRaw('DATE(created_at) = ?', [dateStr]).where('status', 'COMPLETED');
    if (branch_id) salesQuery = salesQuery.where('branch_id', branch_id);

    const [agg] = await salesQuery.select(db.raw('COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as total'));
    const [id] = await db('daily_sales_reports').insert({
      branch_id: branch_id || null,
      report_date: dateStr,
      total_sales_count: agg.cnt,
      total_amount: agg.total,
      submitted_by: submittedBy,
      status: 'PENDING_FINANCE',
    });
    logPharmacyAction(req, 'Daily Report Submitted', `Branch #${branch_id} - ${dateStr}`, null, { total_sales_count: agg.cnt, total_amount: agg.total }, 'Pharmacy Sales');
    await sendFinanceNotification({
      title: 'New Sales Report Pending',
      message: `Daily sales report for ${dateStr} (ETB ${Number(agg.total || 0).toLocaleString()}, ${agg.cnt} sales) submitted for finance review.`,
      type: 'finance',
      link: '/finance/pharmacy-sales',
      related_entity_id: id
    }, req.app?.get('io')).catch(e => console.error('Failed to notify Finance:', e));
    return res.status(201).json({ success: true, data: { id, total_sales_count: agg.cnt, total_amount: agg.total } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listDailyReports = async (req, res) => {
  try {
    const { status, branch_id } = req.query;
    let query = db('daily_sales_reports as r')
      .leftJoin('users as u', 'r.submitted_by', 'u.id')
      .leftJoin('branches as b', 'r.branch_id', 'b.id')
      .select('r.*', 'u.full_name as submitted_by_name', 'b.name as branch_name');
    if (status) query = query.where('r.status', status);
    if (branch_id) query = query.where('r.branch_id', branch_id);
    const rows = await query.orderBy('r.report_date', 'desc');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.decideReport = async (req, res) => {
  try {
    const { status, finance_decision_reason } = req.body;
    const valid = ['APPROVED', 'REJECTED'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'status must be APPROVED or REJECTED' });
    await db('daily_sales_reports').where('id', req.params.id).update({
      status, finance_decision_reason: finance_decision_reason || null,
      decided_by: req.user?.id, decided_at: new Date()
    });
    logPharmacyAction(req, 'Daily Report ' + status, `Report #${req.params.id}`, { status: 'PENDING_FINANCE' }, { status, reason: finance_decision_reason }, 'Pharmacy Sales');
    return res.json({ success: true, message: `Report ${status.toLowerCase()}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CHANGE REQUESTS (Price / Quantity) ───────────────────────────────────────

exports.createChangeRequest = async (req, res) => {
  try {
    const { drug_id, target_type, current_value, requested_value, reason } = req.body;
    if (!drug_id || !target_type || current_value === undefined || requested_value === undefined || !reason)
      return res.status(400).json({ success: false, message: 'drug_id, target_type, current_value, requested_value, reason are required' });
    const validTypes = ['DRUG_PRICE', 'DRUG_QUANTITY'];
    if (!validTypes.includes(target_type))
      return res.status(400).json({ success: false, message: `target_type must be one of: ${validTypes.join(', ')}` });

    const [id] = await db('change_requests').insert({
      requested_by: req.user.id, drug_id, target_type, current_value, requested_value, reason, status: 'PENDING'
    });
    return res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listChangeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('change_requests as cr')
      .join('users as u', 'cr.requested_by', 'u.id')
      .join('drugs as d', 'cr.drug_id', 'd.id')
      .leftJoin('users as dec', 'cr.decided_by', 'dec.id')
      .select('cr.*', 'u.full_name as requested_by_name', 'd.name as drug_name', 'dec.full_name as decided_by_name');
    if (status) query = query.where('cr.status', status);
    const rows = await query.orderBy('cr.created_at', 'desc');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.decideChangeRequest = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { status, decision_reason } = req.body;
    const valid = ['APPROVED', 'REJECTED'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'status must be APPROVED or REJECTED' });

    const cr = await trx('change_requests').where('id', req.params.id).first();
    if (!cr) { await trx.rollback(); return res.status(404).json({ success: false, message: 'Change request not found' }); }
    if (cr.status !== 'PENDING') { await trx.rollback(); return res.status(400).json({ success: false, message: 'Already decided' }); }

    if (status === 'APPROVED') {
      if (cr.target_type === 'DRUG_PRICE') {
        await trx('drugs').where('id', cr.drug_id).update({ unit_price: cr.requested_value });
      } else if (cr.target_type === 'DRUG_QUANTITY') {
        await trx('pharmacy_inventory').where('drug_id', cr.drug_id).increment('quantity', cr.requested_value - cr.current_value);
      }
    }

    await trx('change_requests').where('id', req.params.id).update({
      status, decision_reason: decision_reason || null, decided_by: req.user?.id, decided_at: new Date()
    });

    await trx.commit();
    logPharmacyAction(req, 'Change Request ' + status, `Request #${req.params.id}`, { status: 'PENDING' }, { status, reason: decision_reason }, 'Pharmacy Sales');
    return res.json({ success: true, message: `Change request ${status.toLowerCase()}` });
  } catch (err) {
    await trx.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── EXPIRED DRUG REPORTS ─────────────────────────────────────────────────────

exports.reportExpiredDrug = async (req, res) => {
  try {
    const { drug_id, location, quantity, expiry_date, requested_action } = req.body;
    if (!drug_id || !location || !quantity || !expiry_date || !requested_action)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    const [id] = await db('expired_drug_reports').insert({
      drug_id, location, quantity, expiry_date, requested_action,
      reported_by: req.user.id, status: 'PENDING'
    });
    return res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listExpiredReports = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('expired_drug_reports as er')
      .join('drugs as d', 'er.drug_id', 'd.id')
      .join('users as u', 'er.reported_by', 'u.id')
      .leftJoin('users as dec', 'er.decided_by', 'dec.id')
      .select('er.*', 'd.name as drug_name', 'u.full_name as reported_by_name', 'dec.full_name as decided_by_name');
    if (status) query = query.where('er.status', status);
    const rows = await query.orderBy('er.created_at', 'desc');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.decideExpiredReport = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { status, decision_reason } = req.body;
    const valid = ['APPROVED', 'REJECTED'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'status must be APPROVED or REJECTED' });

    const report = await trx('expired_drug_reports').where('id', req.params.id).first();
    if (!report) { await trx.rollback(); return res.status(404).json({ success: false, message: 'Report not found' }); }

    if (status === 'APPROVED') {
      // deduct from the appropriate inventory
      if (report.location === 'PHARMACY') {
        await trx('pharmacy_inventory').where('drug_id', report.drug_id).decrement('quantity', report.quantity);
      } else {
        await trx('store_inventory').where('drug_id', report.drug_id).decrement('quantity', report.quantity);
      }
    }

    await trx('expired_drug_reports').where('id', req.params.id).update({
      status, decision_reason: decision_reason || null, decided_by: req.user?.id, decided_at: new Date()
    });

    await trx.commit();
    logPharmacyAction(req, 'Expired Drug Report ' + status, `Report #${req.params.id}`, { status: 'PENDING' }, { status, reason: decision_reason }, 'Pharmacy Sales');
    return res.json({ success: true, message: `Report ${status.toLowerCase()}` });
  } catch (err) {
    await trx.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DRUG VISIBILITY ──────────────────────────────────────────────────────────

exports.hideDrug = async (req, res) => {
  try {
    const { reason, mode, auto_restore_at } = req.body;
    if (!reason || !mode)
      return res.status(400).json({ success: false, message: 'reason and mode are required' });
    const validModes = ['TEMPORARY', 'PERMANENT'];
    if (!validModes.includes(mode))
      return res.status(400).json({ success: false, message: `mode must be TEMPORARY or PERMANENT` });

    const existing = await db('drug_visibility').where('drug_id', req.params.drug_id).where('is_hidden', true).first();
    if (existing) return res.status(409).json({ success: false, message: 'Drug is already hidden' });

    const [id] = await db('drug_visibility').insert({
      drug_id: req.params.drug_id, hidden_by: req.user.id, reason, mode,
      auto_restore_at: (mode === 'TEMPORARY' && auto_restore_at) ? auto_restore_at : null,
      is_hidden: true
    });
    logPharmacyAction(req, 'Drug Hidden', `Drug #${req.params.drug_id}`, { visibility: 'VISIBLE' }, { visibility: 'HIDDEN', reason, mode });
    return res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.restoreDrug = async (req, res) => {
  try {
    const updated = await db('drug_visibility')
      .where('drug_id', req.params.drug_id).where('is_hidden', true)
      .update({ is_hidden: false });
    if (!updated) return res.status(404).json({ success: false, message: 'No active hide record found' });
    logPharmacyAction(req, 'Drug Restored', `Drug #${req.params.drug_id}`, { visibility: 'HIDDEN' }, { visibility: 'VISIBLE' });
    return res.json({ success: true, message: 'Drug visibility restored' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listHiddenDrugs = async (req, res) => {
  try {
    const rows = await db('drug_visibility as dv')
      .join('drugs as d', 'dv.drug_id', 'd.id')
      .join('users as u', 'dv.hidden_by', 'u.id')
      .select('dv.*', 'd.name as drug_name', 'u.full_name as hidden_by_name')
      .where('dv.is_hidden', true);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

exports.salesStats = async (req, res) => {
  try {
    const { branch_id, date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);

    let baseQuery = db('sales').where('status', 'COMPLETED').whereRaw('DATE(created_at) = ?', [today]);
    if (branch_id) baseQuery = baseQuery.where('branch_id', branch_id);

    const [todayStats] = await baseQuery.clone().select(
      db.raw('COUNT(*) as total_sales'),
      db.raw('COALESCE(SUM(total_amount), 0) as total_revenue'),
      db.raw('COALESCE(SUM(vat_amount), 0) as total_vat')
    );

    const [monthStats] = await db('sales')
      .where('status', 'COMPLETED')
      .whereRaw('MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())')
      .modify(q => { if (branch_id) q.where('branch_id', branch_id); })
      .select(db.raw('COUNT(*) as total_sales'), db.raw('COALESCE(SUM(total_amount), 0) as total_revenue'));

    const pendingReports = await db('daily_sales_reports').where('status', 'PENDING_FINANCE').count('id as cnt').first();
    const pendingChanges = await db('change_requests').where('status', 'PENDING').count('id as cnt').first();
    const pendingExpired = await db('expired_drug_reports').where('status', 'PENDING').count('id as cnt').first();

    return res.json({
      success: true, data: {
        today: { ...todayStats, date: today },
        month: monthStats,
        pending_reports: pendingReports.cnt,
        pending_change_requests: pendingChanges.cnt,
        pending_expired_reports: pendingExpired.cnt,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
