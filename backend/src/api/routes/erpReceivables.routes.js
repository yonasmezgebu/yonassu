const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

/* ────────────────────────────────────────────
   GET /erp-receivables/dashboard
   Aggregate KPI summary cards
──────────────────────────────────────────── */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Total outstanding balance
    const totalRaw = await knex('erp_receivables')
      .where('status', '!=', 'Received')
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

    // Overdue receivables
    const today = now.toISOString().split('T')[0];
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

    res.json({
      success: true,
      data: {
        totalReceivables,
        invoicedThisMonth,
        receivedThisMonth,
        overdueReceivables,
        customersWithBalance
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
    const data = await knex('erp_receivables').orderBy('created_at', 'desc');
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
    const { customer_name, invoice_number, invoice_date, due_date, amount, description } = req.body;

    if (!customer_name || !invoice_number || !amount || !invoice_date || !due_date) {
      return res.status(400).json({ success: false, message: 'Customer, Invoice No, Amount, Invoice Date and Due Date are required.' });
    }

    const amt = parseFloat(amount);
    const today = new Date().toISOString().split('T')[0];
    const status = due_date < today ? 'Overdue' : 'Pending';

    const [id] = await knex('erp_receivables').insert({
      customer_name,
      invoice_number,
      invoice_date,
      due_date,
      amount: amt,
      received_amount: 0,
      balance: amt,
      description,
      status
    });

    res.status(201).json({ success: true, message: 'Customer invoice created.', data: { id } });
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
    const { payment_date, amount, payment_method, notes } = req.body;
    const receivableId = req.params.id;

    if (!amount || !payment_date || !payment_method) {
      return res.status(400).json({ success: false, message: 'Amount, Payment Date, and Method are required.' });
    }

    const payAmt = parseFloat(amount);

    const receivable = await knex('erp_receivables').where({ id: receivableId }).first();
    if (!receivable) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (payAmt > parseFloat(receivable.balance)) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds outstanding balance.' });
    }

    const newReceived = parseFloat(receivable.received_amount) + payAmt;
    const newBalance  = parseFloat(receivable.amount) - newReceived;

    let newStatus = 'Partially Received';
    if (newBalance <= 0) {
      newStatus = 'Received';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (receivable.due_date < today) newStatus = 'Overdue';
    }

    await knex.transaction(async trx => {
      await trx('erp_receivable_payments').insert({
        receivable_id: receivableId,
        payment_date,
        amount: payAmt,
        payment_method,
        notes
      });
      await trx('erp_receivables').where({ id: receivableId }).update({
        received_amount: newReceived,
        balance: newBalance,
        status: newStatus
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
    const { customer_name, invoice_number, invoice_date, due_date, amount, description } = req.body;

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
    const dueDateFinal = due_date || existing.due_date;
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
