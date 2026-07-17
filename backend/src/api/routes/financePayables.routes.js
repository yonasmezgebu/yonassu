const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

/* ── helpers ── */
const generatePVNumber = async () => {
  const row = await knex('finance_payables').max('id as maxId').first();
  const next = (row?.maxId || 0) + 1;
  return `PAY-${String(next).padStart(6, '0')}`;
};

/* ────────────────────────────────────────────
   POST /finance-payables
   Create a new payment and record directly to Payables Book
──────────────────────────────────────────── */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      date, paidTo, category, amount, paymentMethod,
      description, referenceNo, dueDate,
      bankDetails, telebirrDetails,
      preparedBy, checkedBy, payeeName,
      preparedSignature, checkedSignature, payeeSignature,
    } = req.body;

    if (!paidTo || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Date, Paid To, and Amount are required.' });
    }

    const pvNumber = await generatePVNumber();
    const amountNum = parseFloat(amount);

    const [id] = await knex('finance_payables').insert({
      pv_number: pvNumber,
      date,
      paid_to: paidTo,
      category: category || 'General',
      total_amount: amountNum,
      amount_paid: amountNum,       // fully paid on creation
      outstanding_balance: 0,
      payment_method: paymentMethod || 'Cash',
      description,
      reference_no: referenceNo,
      due_date: dueDate || date,
      status: 'Paid',
      bank_details:     bankDetails     ? JSON.stringify(bankDetails)     : null,
      telebirr_details: telebirrDetails ? JSON.stringify(telebirrDetails) : null,
      prepared_by:        preparedBy,
      checked_by:         checkedBy,
      payee_name:         payeeName,
      prepared_signature: preparedSignature,
      checked_signature:  checkedSignature,
      payee_signature:    payeeSignature,
    });

    res.status(201).json({
      success: true,
      message: 'Payment approved and recorded to Payables Book.',
      data: { id, pvNumber },
    });
  } catch (error) {
    console.error('Error creating payable:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment record.' });
  }
});

/* ────────────────────────────────────────────
   GET /finance-payables
   Fetch all payables (Payables Book)
──────────────────────────────────────────── */
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await knex('finance_payables').orderBy('date', 'desc');
    // Parse JSON columns back to objects
    const data = rows.map(r => ({
      ...r,
      bank_details:     r.bank_details     ? JSON.parse(r.bank_details)     : null,
      telebirr_details: r.telebirr_details ? JSON.parse(r.telebirr_details) : null,
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching payables:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payables.' });
  }
});

/* ────────────────────────────────────────────
   GET /finance-payables/:id
   Fetch single payable record
──────────────────────────────────────────── */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const row = await knex('finance_payables').where({ id: req.params.id }).first();
    if (!row) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({
      success: true,
      data: {
        ...row,
        bank_details:     row.bank_details     ? JSON.parse(row.bank_details)     : null,
        telebirr_details: row.telebirr_details ? JSON.parse(row.telebirr_details) : null,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch record.' });
  }
});

module.exports = router;
