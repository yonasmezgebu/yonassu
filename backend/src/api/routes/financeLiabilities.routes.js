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
    const today = new Date().toISOString().split('T')[0];

    const totalRow = await knex('erp_liabilities_v4').sum('balance as t').first();
    const totalLiabilities = parseFloat(totalRow?.t || 0);

    const byTypeRows = await knex('erp_liabilities_v4')
      .select('liability_type')
      .sum('balance as t')
      .groupBy('liability_type');

    const byType = {};
    byTypeRows.forEach(r => { byType[r.liability_type] = parseFloat(r.t || 0); });

    const overdueRow = await knex('erp_liabilities_v4')
      .whereRaw('(due_date)::date < ?', [today])
      .where('balance', '>', 0)
      .count('id as c')
      .first();

    res.json({
      success: true,
      data: {
        totalLiabilities,
        totalOwed: totalLiabilities,
        accountsPayable: byType['ACCOUNTS_PAYABLE'] || 0,
        bankLoans:       byType['BANK_LOAN']        || 0,
        taxesDue:        byType['TAX']              || 0,
        salaryOther:     (byType['SALARY'] || 0) + (byType['OTHER'] || 0),
        overdueCount:    parseInt(overdueRow?.c || 0)
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

      // 3. Record the paid expense in the cashbook so System Balance decreases correctly
      await trx('finance_cashbook').insert({
        date: payment_date,
        type: 'EV',
        reference: liability.invoice_number || `LIAB-${liabilityId}`,
        description: `Liability payment to ${liability.supplier_name}${liability.description ? ': ' + liability.description : ''}`,
        receipts: 0,
        payments: payAmt
      });
    });

    res.json({ success: true, message: 'Payment recorded successfully.' });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
});

module.exports = router;
