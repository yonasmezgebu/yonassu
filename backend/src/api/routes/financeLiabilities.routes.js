const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

/* ────────────────────────────────────────────
   GET /finance-liabilities/dashboard
   Get summary KPI for liabilities
──────────────────────────────────────────── */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const rawTotal = await knex('erp_liabilities').sum('balance as total').first();
    const totalLiabilities = rawTotal?.total || 0;

    const rawAp = await knex('erp_liabilities').where('status', '!=', 'Paid').sum('balance as total').first();
    const accountsPayable = rawAp?.total || 0;

    // We can simulate bank loans and taxes due for now, or just return 0 if not tracking those yet
    const overdueCountRaw = await knex('erp_liabilities').where('status', 'Overdue').count('id as count').first();
    const overdueCount = overdueCountRaw?.count || 0;

    res.json({
      success: true,
      data: {
        totalLiabilities,
        accountsPayable,
        bankLoans: 0,
        taxesDue: 0,
        overdueCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

/* ────────────────────────────────────────────
   GET /finance-liabilities
   Get all supplier bills (Accounts Payable)
──────────────────────────────────────────── */
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await knex('erp_liabilities').orderBy('created_at', 'desc');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch liabilities.' });
  }
});

/* ────────────────────────────────────────────
   POST /finance-liabilities
   Add a new supplier bill
──────────────────────────────────────────── */
router.post('/', authenticate, async (req, res) => {
  try {
    const { supplier_name, invoice_number, invoice_date, due_date, amount, description } = req.body;
    
    if (!supplier_name || !invoice_number || !amount) {
      return res.status(400).json({ success: false, message: 'Supplier, Invoice Number, and Amount are required.' });
    }

    const amt = parseFloat(amount);
    
    // Auto-determine status if due_date is passed
    let status = 'Pending';
    if (new Date(due_date) < new Date()) {
      status = 'Overdue';
    }

    const [id] = await knex('erp_liabilities').insert({
      supplier_name,
      invoice_number,
      invoice_date,
      due_date,
      amount: amt,
      paid_amount: 0,
      balance: amt,
      description,
      status
    });

    res.status(201).json({ success: true, message: 'Supplier bill added.', data: { id } });
  } catch (error) {
    console.error('Error adding liability:', error);
    res.status(500).json({ success: false, message: 'Failed to add liability.' });
  }
});

/* ────────────────────────────────────────────
   POST /finance-liabilities/:id/pay
   Record a payment and recalculate balance
──────────────────────────────────────────── */
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const { payment_date, amount, payment_method, notes } = req.body;
    const liabilityId = req.params.id;

    if (!amount || !payment_date) {
      return res.status(400).json({ success: false, message: 'Amount and Payment Date are required.' });
    }

    const payAmt = parseFloat(amount);

    // Get current liability
    const liability = await knex('erp_liabilities').where({ id: liabilityId }).first();
    if (!liability) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    if (payAmt > liability.balance) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds balance.' });
    }

    const newPaidAmount = parseFloat(liability.paid_amount) + payAmt;
    const newBalance = parseFloat(liability.amount) - newPaidAmount;
    
    let newStatus = 'Partially Paid';
    if (newBalance <= 0) {
      newStatus = 'Paid';
    } else if (new Date(liability.due_date) < new Date()) {
      newStatus = 'Overdue';
    }

    // Run transaction
    await knex.transaction(async trx => {
      // 1. Insert payment record
      await trx('erp_payments').insert({
        liability_id: liabilityId,
        payment_date,
        amount: payAmt,
        payment_method,
        notes
      });

      // 2. Update liability record
      await trx('erp_liabilities')
        .where({ id: liabilityId })
        .update({
          paid_amount: newPaidAmount,
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

module.exports = router;
