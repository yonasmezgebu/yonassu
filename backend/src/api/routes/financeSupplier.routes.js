const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { audit } = require('../../config/logger');

/* ── helpers ── */

// Idempotent table bootstrap (runs once at boot)
(async function ensureTable() {
  try {
    const exists = await knex.schema.hasTable('finance_supplier_bills');
    if (!exists) {
      await knex.schema.createTable('finance_supplier_bills', (t) => {
        t.increments('id').primary();
        t.string('bill_number', 40).unique();
        t.integer('supplier_id').nullable();
        t.string('supplier_name', 200);
        t.date('date_received');
        t.date('due_date').nullable();
        t.string('po_reference', 100).nullable();
        t.decimal('subtotal', 14, 2).defaultTo(0);
        t.decimal('tax_amount', 14, 2).defaultTo(0);
        t.decimal('total_amount', 14, 2).defaultTo(0);
        t.decimal('amount_paid', 14, 2).defaultTo(0);
        t.string('status', 20).defaultTo('Unpaid');
        t.json('items').nullable();
        t.integer('created_by').nullable();
        t.timestamps(true, true);
      });
    }
  } catch (e) {
    console.error('finance_supplier_bills ensureTable failed:', e.message);
  }
})();

const billStatus = (bill, today = new Date()) => {
  const total = parseFloat(bill.total_amount || 0);
  const paid = parseFloat(bill.amount_paid || 0);
  if (paid >= total && total > 0) return 'Paid';
  if (bill.due_date && new Date(bill.due_date) < new Date(today.toISOString().slice(0, 10)) && paid < total) return 'Overdue';
  return 'Unpaid';
};

const parseItems = (bill) => {
  if (bill.items && typeof bill.items === 'string') {
    try { bill.items = JSON.parse(bill.items); } catch (e) { bill.items = []; }
  }
  return bill;
};

router.use(authenticate);

/* ── Suppliers (shared canonical `suppliers` table used by Purchase/Finance) ── */

// GET /finance-supplier/suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const rows = await knex('suppliers')
      .where('is_active', true)
      .whereNull('deleted_at')
      .orderBy('name', 'asc')
      .select('id', 'name', 'contact_person', 'phone', 'email', 'address', 'tax_id', 'created_at');

    const bills = await knex('finance_supplier_bills').select('supplier_id', 'total_amount', 'amount_paid');

    const data = rows.map((s) => {
      const supplierBills = bills.filter((b) => b.supplier_id === s.id);
      const outstandingBalance = supplierBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.amount_paid)), 0);
      return { ...s, outstandingBalance: Math.max(0, outstandingBalance) };
    });
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Error listing suppliers:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch suppliers.' });
  }
});

// POST /finance-supplier/suppliers
router.post('/suppliers', async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, taxId } = req.body;
    if (!name || !phone || !taxId) {
      return res.status(400).json({ status: 'error', message: 'Supplier Name, Phone, and Tax ID are required.' });
    }
    const [id] = await knex('suppliers').insert({
      name, contact_person: contactPerson || null, phone, email: email || null,
      address: address || null, tax_id: taxId || null,
    });

    try {
      await audit('SUPPLIER_CREATED', req.user?.id, {
        resourceId: id,
        beforeState: null,
        afterState: { name, phone, email, taxId },
      });
    } catch (e) {}

    res.status(201).json({ status: 'success', message: 'Supplier added successfully', data: { id, name } });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create supplier.' });
  }
});

/* ── Supplier Bills ── */

// GET /finance-supplier/bills
router.get('/bills', async (req, res) => {
  try {
    let rows = await knex('finance_supplier_bills').orderBy('created_at', 'desc').orderBy('id', 'desc');
    rows = rows.map((r) => { r.status = billStatus(r); return parseItems(r); });
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error listing supplier bills:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch supplier bills.' });
  }
});

// POST /finance-supplier/bills
router.post('/bills', async (req, res) => {
  try {
    const {
      supplierId, supplierName, billNo, dateReceived, dueDate, poRef,
      subtotal, taxAmount, totalAmount, items,
    } = req.body;

    if (!supplierName || !dateReceived || !totalAmount) {
      return res.status(400).json({ status: 'error', message: 'Supplier, Date Received, and Total are required.' });
    }

    const last = await knex('finance_supplier_bills').max('id as maxId').first();
    const next = (last?.maxId || 0) + 1;
    const billNumber = billNo && billNo.trim() ? billNo.trim() : `SB-${String(next).padStart(6, '0')}`;

    const [id] = await knex('finance_supplier_bills').insert({
      bill_number: billNumber,
      supplier_id: supplierId || null,
      supplier_name: supplierName,
      date_received: dateReceived,
      due_date: dueDate || dateReceived,
      po_reference: poRef || null,
      subtotal: parseFloat(subtotal || 0),
      tax_amount: parseFloat(taxAmount || 0),
      total_amount: parseFloat(totalAmount || 0),
      amount_paid: 0,
      status: 'Unpaid',
      items: items && items.length ? JSON.stringify(items) : null,
      created_by: req.user?.id || null,
    });

    try {
      await audit('SUPPLIER_BILL_CREATED', req.user?.id, {
        resourceId: id,
        beforeState: null,
        afterState: { billNumber, supplierName, totalAmount, dueDate },
      });
    } catch (e) {}

    res.status(201).json({ status: 'success', message: 'Supplier bill recorded successfully', data: { id, billNumber } });
  } catch (error) {
    console.error('Error creating supplier bill:', error);
    res.status(500).json({ status: 'error', message: 'Failed to record supplier bill.' });
  }
});

// PUT /finance-supplier/bills/:id/payment
router.put('/bills/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMethod } = req.body;

    const bill = await knex('finance_supplier_bills').where({ id }).first();
    if (!bill) return res.status(404).json({ status: 'error', message: 'Bill not found.' });

    const total = parseFloat(bill.total_amount || 0);
    const paidNow = parseFloat(amountPaid || 0);
    if (paidNow <= 0) return res.status(400).json({ status: 'error', message: 'Payment amount must be greater than zero.' });
    if (paidNow > total - parseFloat(bill.amount_paid || 0)) {
      return res.status(400).json({ status: 'error', message: 'Payment exceeds the outstanding balance.' });
    }

    const newPaid = parseFloat(bill.amount_paid || 0) + paidNow;
    const status = newPaid >= total ? 'Paid' : (bill.due_date && new Date(bill.due_date) < new Date() ? 'Overdue' : 'Unpaid');

    const updates = { amount_paid: newPaid, status };
    if (paymentMethod) updates.payment_method = paymentMethod;

    await knex('finance_supplier_bills').where({ id }).update(updates);
    const updated = await knex('finance_supplier_bills').where({ id }).first();

    try {
      await audit('SUPPLIER_PAYMENT_APPLIED', req.user?.id, {
        resourceId: id,
        beforeState: { amountPaid: parseFloat(bill.amount_paid || 0), status: bill.status },
        afterState: { amountPaid: newPaid, status },
      });
    } catch (e) {}

    res.json({ status: 'success', message: 'Payment applied to bill', data: updated });
  } catch (error) {
    console.error('Error applying bill payment:', error);
    res.status(500).json({ status: 'error', message: 'Failed to apply payment.' });
  }
});

module.exports = router;
