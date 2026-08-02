const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeStatus(balance, due_date) {
  const b = parseFloat(balance);
  if (b <= 0) return 'Paid';
  const today = new Date().toISOString().split('T')[0];
  if (due_date < today) return 'Overdue';
  return 'Pending';
}

// ─── GET /liabilities-v2/dashboard ─────────────────────────────────────────
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const sumByType = await knex('liabilities')
      .select('liability_type')
      .sum('balance as total')
      .groupBy('liability_type');

    const byType = {};
    sumByType.forEach(r => { byType[r.liability_type] = parseFloat(r.total || 0); });

    const totalRaw = await knex('liabilities').sum('balance as total').first();
    const totalLiabilities = parseFloat(totalRaw?.total || 0);

    const overdueRaw = await knex('liabilities')
      .where('due_date', '<', today)
      .where('balance', '>', 0)
      .count('id as count')
      .first();
    const overdueCount = parseInt(overdueRaw?.count || 0);

    res.json({
      success: true,
      data: {
        totalLiabilities,
        accountsPayable:  byType['ACCOUNTS_PAYABLE'] || 0,
        bankLoans:        byType['BANK_LOAN']         || 0,
        taxesDue:         byType['TAX']               || 0,
        salaryOther:      (byType['SALARY'] || 0) + (byType['OTHER'] || 0),
        overdueCount
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

// ─── GET /liabilities-v2 — list all, optionally filter by type ──────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    let q = knex('liabilities').orderBy('created_at', 'desc');
    if (type) {
      const types = type.split(',');
      if (types.length > 1) {
        q = q.whereIn('liability_type', types);
      } else {
        q = q.where('liability_type', type);
      }
    }
    const data = await q;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch liabilities.' });
  }
});

// ─── POST /liabilities-v2/accounts-payable ──────────────────────────────────
router.post('/accounts-payable', authenticate, async (req, res) => {
  try {
    const { party_name, reference_no, issue_date, due_date, amount, description } = req.body;
    if (!party_name || !reference_no || !amount || !due_date)
      return res.status(400).json({ success: false, message: 'Supplier, Invoice No, Amount and Due Date are required.' });

    const amt = parseFloat(amount);
    const status = computeStatus(amt, due_date);
    const finalIssueDate = issue_date ? issue_date : null;

    const [id] = await knex('liabilities').insert({
      liability_type: 'ACCOUNTS_PAYABLE', reference_no, party_name, description,
      amount: amt, paid_amount: 0, balance: amt, issue_date: finalIssueDate, due_date, status
    });
    res.status(201).json({ success: true, message: 'Supplier bill added.', data: { id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add bill.' });
  }
});

// ─── POST /liabilities-v2/loans ─────────────────────────────────────────────
router.post('/loans', authenticate, async (req, res) => {
  try {
    const { lender_name, reference_no, issue_date, due_date, amount, description, interest_rate, term_months } = req.body;
    if (!lender_name || !reference_no || !amount || !due_date)
      return res.status(400).json({ success: false, message: 'Lender, Loan No, Amount and Due Date are required.' });

    const amt = parseFloat(amount);
    const status = computeStatus(amt, due_date);
    const finalIssueDate = issue_date ? issue_date : null;

    await knex.transaction(async trx => {
      const [id] = await trx('liabilities').insert({
        liability_type: 'BANK_LOAN', reference_no, party_name: lender_name, description,
        amount: amt, paid_amount: 0, balance: amt, issue_date: finalIssueDate, due_date, status
      });
      await trx('loan_details').insert({
        liability_id: id, lender_name, interest_rate: parseFloat(interest_rate || 0),
        term_months: parseInt(term_months || 0), principal_amount: amt
      });
    });
    res.status(201).json({ success: true, message: 'Loan added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add loan.' });
  }
});

// ─── POST /liabilities-v2/taxes ─────────────────────────────────────────────
router.post('/taxes', authenticate, async (req, res) => {
  try {
    const { tax_type, tax_period, reference_no, due_date, amount, description } = req.body;
    if (!tax_type || !reference_no || !amount || !due_date)
      return res.status(400).json({ success: false, message: 'Tax Type, Reference, Amount and Due Date are required.' });

    const amt = parseFloat(amount);
    const status = computeStatus(amt, due_date);

    await knex.transaction(async trx => {
      const [id] = await trx('liabilities').insert({
        liability_type: 'TAX', reference_no, party_name: tax_type, description,
        amount: amt, paid_amount: 0, balance: amt, issue_date: null, due_date, status
      });
      await trx('tax_details').insert({ liability_id: id, tax_type, tax_period });
    });
    res.status(201).json({ success: true, message: 'Tax liability added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add tax.' });
  }
});

// ─── POST /liabilities-v2/salary-other ──────────────────────────────────────
router.post('/salary-other', authenticate, async (req, res) => {
  try {
    const { liability_type_sub, party_name, reference_no, due_date, amount, description } = req.body;
    if (!party_name || !reference_no || !amount || !due_date)
      return res.status(400).json({ success: false, message: 'Party Name, Reference, Amount and Due Date are required.' });

    const amt = parseFloat(amount);
    const status = computeStatus(amt, due_date);
    const ltype = liability_type_sub === 'Salary' ? 'SALARY' : 'OTHER';

    const [id] = await knex('liabilities').insert({
      liability_type: ltype, reference_no, party_name, description,
      amount: amt, paid_amount: 0, balance: amt, issue_date: null, due_date, status
    });
    res.status(201).json({ success: true, message: 'Liability added.', data: { id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add liability.' });
  }
});

// ─── POST /liabilities-v2/:id/pay — unified payment recording ───────────────
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const { payment_date, amount, payment_method, notes } = req.body;
    const liabilityId = req.params.id;

    if (!amount || !payment_date || !payment_method)
      return res.status(400).json({ success: false, message: 'Amount, Date and Method are required.' });

    const payAmt = parseFloat(amount);
    const liability = await knex('liabilities').where({ id: liabilityId }).first();
    if (!liability) return res.status(404).json({ success: false, message: 'Liability not found.' });
    if (payAmt > parseFloat(liability.balance))
      return res.status(400).json({ success: false, message: 'Payment exceeds outstanding balance.' });

    const newPaid    = parseFloat(liability.paid_amount) + payAmt;
    const newBalance = parseFloat(liability.amount) - newPaid;

    let newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
    if (newBalance > 0 && liability.due_date < new Date().toISOString().split('T')[0]) newStatus = 'Overdue';

    await knex.transaction(async trx => {
      await trx('liability_payments').insert({ liability_id: liabilityId, payment_date, amount: payAmt, payment_method, notes });
      await trx('liabilities').where({ id: liabilityId }).update({ paid_amount: newPaid, balance: newBalance, status: newStatus });
    });

    res.json({ success: true, message: 'Payment recorded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
});

// ─── GET /liabilities-v2/payments — unified payment history ─────────────────
router.get('/payments', authenticate, async (req, res) => {
  try {
    const data = await knex('liability_payments as lp')
      .join('liabilities as l', 'lp.liability_id', 'l.id')
      .select(
        'lp.id', 'lp.payment_date', 'lp.amount', 'lp.payment_method', 'lp.notes',
        'l.reference_no', 'l.liability_type', 'l.party_name'
      )
      .orderBy('lp.payment_date', 'desc');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
  }
});

// ─── PUT /liabilities-v2/:id — Update ────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      party_name, reference_no, due_date, amount, description, 
      interest_rate, term_months, tax_type, tax_period, liability_type_sub,
      supplier_name, lender_name, tax_ref
    } = req.body;
    
    const liability = await knex('liabilities').where({ id }).first();
    if (!liability) return res.status(404).json({ success: false, message: 'Liability not found.' });
    
    const final_amount = amount ? parseFloat(amount) : parseFloat(liability.amount);
    const paid = parseFloat(liability.paid_amount);
    const new_balance = final_amount - paid;
    const final_due = due_date || liability.due_date;
    const status = computeStatus(new_balance, final_due);

    // Normalize party_name from specific fields if missing
    let final_party_name = party_name || liability.party_name;
    if (liability.liability_type === 'ACCOUNTS_PAYABLE' && supplier_name) final_party_name = supplier_name;
    if (liability.liability_type === 'BANK_LOAN' && lender_name) final_party_name = lender_name;
    if (liability.liability_type === 'TAX' && tax_type) final_party_name = tax_type;
    
    let final_ref = reference_no || liability.reference_no;
    if (liability.liability_type === 'TAX' && tax_ref) final_ref = tax_ref;

    await knex.transaction(async trx => {
      await trx('liabilities').where({ id }).update({
        party_name: final_party_name,
        reference_no: final_ref,
        amount: final_amount,
        balance: new_balance,
        status: status,
        due_date: final_due,
        description: description !== undefined ? description : liability.description
      });
      
      if (liability.liability_type === 'BANK_LOAN') {
        const updateObj = { principal_amount: final_amount };
        if (interest_rate !== undefined) updateObj.interest_rate = parseFloat(interest_rate || 0);
        if (term_months !== undefined) updateObj.term_months = parseInt(term_months || 0);
        if (lender_name) updateObj.lender_name = lender_name;
        await trx('loan_details').where({ liability_id: id }).update(updateObj);
      }
      
      if (liability.liability_type === 'TAX') {
        const updateObj = {};
        if (tax_type !== undefined) updateObj.tax_type = tax_type;
        if (tax_period !== undefined) updateObj.tax_period = tax_period;
        if (Object.keys(updateObj).length > 0) {
          await trx('tax_details').where({ liability_id: id }).update(updateObj);
        }
      }
      
      if (liability.liability_type === 'SALARY' || liability.liability_type === 'OTHER') {
        if (liability_type_sub) {
          await trx('liabilities').where({ id }).update({ liability_type: liability_type_sub.toUpperCase() });
        }
      }
    });

    res.json({ success: true, message: 'Liability updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update liability.' });
  }
});

// ─── DELETE /liabilities-v2/:id — Delete ──────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await knex.transaction(async trx => {
      await trx('loan_details').where({ liability_id: id }).del();
      await trx('tax_details').where({ liability_id: id }).del();
      await trx('liability_payments').where({ liability_id: id }).del();
      await trx('liabilities').where({ id }).del();
    });
    res.json({ success: true, message: 'Liability deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete liability.' });
  }
});

module.exports = router;
