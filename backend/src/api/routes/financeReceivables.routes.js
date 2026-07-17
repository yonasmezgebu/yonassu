const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// GET pending live income submissions
router.get('/live-income', authenticate, async (req, res) => {
  try {
    const submissions = await knex('finance_income_submissions')
      .where('status', 'Pending')
      .orderBy('created_at', 'desc');
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching income submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch income submissions' });
  }
});

// POST submit new income
router.post('/live-income', authenticate, async (req, res) => {
  try {
    const { department, amount, reference_no, description } = req.body;
    
    if (!department || !amount) {
      return res.status(400).json({ success: false, message: 'Department and amount are required' });
    }

    const [id] = await knex('finance_income_submissions').insert({
      department,
      submitted_by: req.user ? req.user.name : 'Unknown User',
      amount,
      reference_no,
      description,
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'Income submitted successfully', id });
  } catch (error) {
    console.error('Error submitting income:', error);
    res.status(500).json({ success: false, message: 'Failed to submit income' });
  }
});

// PUT approve income and record to receivables
router.put('/live-income/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await knex('finance_income_submissions').where({ id }).first();
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Submission is already processed' });
    }

    await knex.transaction(async trx => {
      // 1. Mark submission as Approved
      await trx('finance_income_submissions').where({ id }).update({ status: 'Approved', updated_at: knex.fn.now() });

      // 2. Create entry in finance_receivables
      await trx('finance_receivables').insert({
        customer_name: `Internal - ${submission.department}`,
        invoice_no: submission.reference_no || `REC-${Date.now()}`,
        invoice_date: knex.fn.now(),
        due_date: knex.fn.now(),
        total_amount: submission.amount,
        amount_paid: submission.amount,
        outstanding_balance: 0,
        status: 'Paid',
        department_source: submission.department
      });
    });

    res.json({ success: true, message: 'Income approved and recorded to Receivables Book' });
  } catch (error) {
    console.error('Error approving income:', error);
    res.status(500).json({ success: false, message: 'Failed to approve income' });
  }
});

// GET all receivables for the Receivables Book
router.get('/book', authenticate, async (req, res) => {
  try {
    const receivables = await knex('finance_receivables')
      .orderBy('invoice_date', 'desc');
    res.json({ success: true, data: receivables });
  } catch (error) {
    console.error('Error fetching receivables:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receivables' });
  }
});

module.exports = router;
