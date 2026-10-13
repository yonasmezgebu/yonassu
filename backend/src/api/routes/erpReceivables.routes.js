const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { sendFinanceNotification } = require('../../services/notification.service');

// Finance account type → canonical ledger payment method.
const accountTypeToMethod = (type) =>
  type === 'Bank' ? 'Bank' : type === 'Mobile Wallet' ? 'Telebirr' : 'Cash';

// Normalize a Postgres `date` (returned by node-pg as a JS Date at local
// midnight) to a stable 'YYYY-MM-DD' calendar string, free of timezone shifts.
const toDateOnly = (v) => {
  if (!v) return v;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
};

// Auto-generate a unique invoice number, e.g. INV-20261012-0001.
const generateInvoiceNumber = async (invoiceDate) => {
  const d = String(invoiceDate || new Date().toISOString().slice(0, 10)).slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${d}-`;
  const last = await knex('erp_receivables')
    .where('invoice_number', 'like', `${prefix}%`)
    .orderBy('invoice_number', 'desc')
    .first();
  const lastSeq = last ? parseInt(String(last.invoice_number).split('-').pop(), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
};

// Raise an in-app notification (finance manager bell) once when an invoice with
// an outstanding balance enters its final 3 days before the due date.
const runDueDateReminders = async (req) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in3 = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0];

    const dueSoon = await knex('erp_receivables')
      .where('balance', '>', 0)
      .andWhere('due_reminder_sent', false)
      .whereBetween('due_date', [today, in3]);

    if (!dueSoon.length) return;

    const io = req.app?.get('io');
    for (const r of dueSoon) {
      const dueStr = toDateOnly(r.due_date);
      const days = Math.round((Date.parse(dueStr) - Date.parse(today)) / 86400000);
      const when = days <= 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`;
      await sendFinanceNotification({
        title: 'Accounts Receivable Due Soon',
        message: `Invoice ${r.invoice_number} for ${r.customer_name} (ETB ${Number(r.balance).toLocaleString()}) is due ${when} (${dueStr}).`,
        type: 'finance',
        link: '/finance/accounts-receivable',
        related_entity_id: r.id,
      }, io);
      await knex('erp_receivables').where({ id: r.id }).update({ due_reminder_sent: true });
    }
  } catch (e) {
    console.error('Due date reminder error:', e);
  }
};

/* ────────────────────────────────────────────
   GET /erp-receivables/dashboard
   Aggregate KPI summary cards
──────────────────────────────────────────── */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const today        = now.toISOString().split('T')[0];

    // Total invoiced (ALL records, regardless of status)
    const totalInvoicedRaw = await knex('erp_receivables')
      .sum('amount as total')
      .first();
    const totalInvoiced = parseFloat(totalInvoicedRaw?.total || 0);

    // Total collected / received (ALL time, from payments table)
    const totalCollectedRaw = await knex('erp_receivable_payments')
      .sum('amount as total')
      .first();
    const totalCollected = parseFloat(totalCollectedRaw?.total || 0);

    // Total outstanding balance (only unpaid/partial)
    const totalRaw = await knex('erp_receivables')
      .where('balance', '>', 0)
      .sum('balance as total')
      .first();
    const totalReceivables = parseFloat(totalRaw?.total || 0);

    // Invoiced this month
    const invoicedRaw = await knex('erp_receivables')
      .whereBetween('invoice_date', [startOfMonth, endOfMonth])
      .sum('amount as total')
      .first();
    const invoicedThisMonth = parseFloat(invoicedRaw?.total || 0);

    // Received this month (from payments table)
    const receivedRaw = await knex('erp_receivable_payments')
      .whereBetween('payment_date', [startOfMonth, endOfMonth])
      .sum('amount as total')
      .first();
    const receivedThisMonth = parseFloat(receivedRaw?.total || 0);

    // Overdue receivables (balance > 0 and due date passed)
    const overdueRaw = await knex('erp_receivables')
      .where('due_date', '<', today)
      .where('balance', '>', 0)
      .sum('balance as total')
      .first();
    const overdueReceivables = parseFloat(overdueRaw?.total || 0);

    // Customers with balance
    const customersWithBalanceRaw = await knex('erp_receivables')
      .where('balance', '>', 0)
      .countDistinct('customer_name as count')
      .first();
    const customersWithBalance = parseInt(customersWithBalanceRaw?.count || 0);

    await runDueDateReminders(req);

    res.json({
      success: true,
      data: {
        totalInvoiced,
        totalCollected,
        totalReceivables,
        invoicedThisMonth,
        receivedThisMonth,
        overdueReceivables,
        customersWithBalance,
      }
    });
  } catch (error) {
    console.error('Error fetching receivables dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receivables dashboard.' });
  }
});

/* ────────────────────────────────────────────
   GET /erp-receivables
   List all customer invoices
──────────────────────────────────────────── */
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await knex('erp_receivables').orderBy('created_at', 'desc');
    const data = rows.map(r => ({ ...r, due_date: toDateOnly(r.due_date), invoice_date: toDateOnly(r.invoice_date) }));
    await runDueDateReminders(req);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching receivables:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receivables.' });
  }
});

/* ────────────────────────────────────────────
   POST /erp-receivables
   Add a new Customer Invoice
──────────────────────────────────────────── */
router.post('/', authenticate, async (req, res) => {
  try {
    const { customer_name, invoice_number, invoice_date, due_date, amount, description, phone, email } = req.body;

    if (!customer_name || !phone || !amount || !invoice_date || !due_date) {
      return res.status(400).json({ success: false, message: 'Customer, Phone, Amount, Invoice Date and Due Date are required.' });
    }

    const amt = parseFloat(amount);
    const today = new Date().toISOString().split('T')[0];
    const status = due_date < today ? 'Overdue' : 'Pending';

    // Invoice number is generated automatically when not supplied.
    let invoiceNo = String(invoice_number || '').trim();
    if (!invoiceNo) invoiceNo = await generateInvoiceNumber(invoice_date);

    const [id] = await knex('erp_receivables').insert({
      customer_name,
      invoice_number: invoiceNo,
      invoice_date,
      due_date,
      amount: amt,
      received_amount: 0,
      balance: amt,
      description,
      phone,
      email: email || null,
      status
    });

    res.status(201).json({ success: true, message: 'Customer invoice created.', data: { id, invoice_number: invoiceNo } });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to create invoice.' });
  }
});

/* ────────────────────────────────────────────
   POST /erp-receivables/:id/pay
   Record a payment received — auto-recalculates balance & status
──────────────────────────────────────────── */
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const { payment_date, amount, notes, account_id } = req.body;
    const receivableId = req.params.id;

    if (!amount || !payment_date) {
      return res.status(400).json({ success: false, message: 'Amount and Payment Date are required.' });
    }

    const payAmt = parseFloat(amount);

    const receivable = await knex('erp_receivables').where({ id: receivableId }).first();
    if (!receivable) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (payAmt > parseFloat(receivable.balance)) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds outstanding balance.' });
    }

    // The money must be deposited into a real Finance account (Bank / Cash /
    // Mobile Wallet) identified by its account number — never a hard-coded method.
    if (!account_id) {
      return res.status(400).json({ success: false, message: 'Please select the Finance account that received the payment.' });
    }
    const account = await knex('finance_accounts').where({ id: account_id }).first();
    if (!account) {
      return res.status(400).json({ success: false, message: 'Selected Finance account was not found.' });
    }
    const method = accountTypeToMethod(account.account_type);

    const newReceived = parseFloat(receivable.received_amount) + payAmt;
    const newBalance  = parseFloat(receivable.amount) - newReceived;

    let newStatus = 'Partially Received';
    if (newBalance <= 0) {
      newStatus = 'Received';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (toDateOnly(receivable.due_date) < today) newStatus = 'Overdue';
    }

    await knex.transaction(async trx => {
      const [paymentId] = await trx('erp_receivable_payments').insert({
        receivable_id: receivableId,
        payment_date,
        amount: payAmt,
        payment_method: account.account_name,
        notes,
        account_id: account.id,
        account_name: account.account_name,
      });
      await trx('erp_receivables').where({ id: receivableId }).update({
        received_amount: newReceived,
        balance: newBalance,
        status: newStatus
      });
      // Add the received money to the selected Finance account (ledger of record).
      await trx('finance_cashbook').insert({
        date: payment_date,
        type: 'CRV',
        reference: `AR-${paymentId}`,
        description: `AR payment — ${receivable.invoice_number} (${receivable.customer_name})`.slice(0, 255),
        receipts: payAmt,
        payments: 0,
        payment_method: method,
        account_id: account.id,
        account_name: account.account_name,
        source: 'Accounts Receivable',
        received_from: receivable.customer_name,
      });
    });

    res.json({ success: true, message: 'Payment recorded successfully.' });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
});


/* ────────────────────────────────────────────
   PUT /erp-receivables/:id
   Update invoice details (only if not fully Received)
──────────────────────────────────────────── */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, invoice_number, invoice_date, due_date, amount, description, phone, email } = req.body;

    const existing = await knex('erp_receivables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (existing.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Cannot edit a fully received invoice.' });
    }

    const newAmt = amount ? parseFloat(amount) : parseFloat(existing.amount);
    const alreadyReceived = parseFloat(existing.received_amount);
    if (newAmt < alreadyReceived) {
      return res.status(400).json({ success: false, message: `Amount cannot be less than already received (ETB ${alreadyReceived}).` });
    }
    const newBalance = newAmt - alreadyReceived;

    const today = new Date().toISOString().split('T')[0];
    const normDate = toDateOnly;
    const dueDateFinal = normDate(due_date || existing.due_date);
    const dueChanged = !!due_date && normDate(due_date) !== normDate(existing.due_date);
    let newStatus = existing.status;
    if (newBalance <= 0) {
      newStatus = 'Received';
    } else if (alreadyReceived > 0) {
      newStatus = dueDateFinal < today ? 'Overdue' : 'Partially Received';
    } else {
      newStatus = dueDateFinal < today ? 'Overdue' : 'Pending';
    }

    await knex('erp_receivables').where({ id }).update({
      customer_name:  customer_name  || existing.customer_name,
      invoice_number: invoice_number || existing.invoice_number,
      invoice_date:   invoice_date   || existing.invoice_date,
      due_date:       dueDateFinal,
      amount:         newAmt,
      balance:        newBalance,
      description:    description !== undefined ? description : existing.description,
      phone:          phone !== undefined ? phone : existing.phone,
      email:          email !== undefined ? email : existing.email,
      due_reminder_sent: dueChanged ? false : existing.due_reminder_sent,
      status:         newStatus,
    });

    res.json({ success: true, message: 'Invoice updated successfully.' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to update invoice.' });
  }
});

/* ────────────────────────────────────────────
   DELETE /erp-receivables/:id
   Remove an invoice and its payment history
──────────────────────────────────────────── */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await knex('erp_receivables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    await knex.transaction(async trx => {
      await trx('erp_receivable_payments').where({ receivable_id: id }).delete();
      await trx('erp_receivables').where({ id }).delete();
    });

    res.json({ success: true, message: 'Invoice and payment history deleted.' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to delete invoice.' });
  }
});

module.exports = router;
