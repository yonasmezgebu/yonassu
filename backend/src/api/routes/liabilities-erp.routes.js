const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// ─── STATUS HELPER ─────────────────────────────────────────────────────────
function computeStatus(amount, paid_amount, due_date) {
  const bal  = parseFloat(amount) - parseFloat(paid_amount || 0);
  if (bal <= 0) return 'Paid';
  const today = new Date().toISOString().split('T')[0];
  const due   = due_date ? String(due_date).split('T')[0] : null;
  if (due && due < today) return 'Overdue';
  if (parseFloat(paid_amount || 0) > 0) return 'Partially Paid';
  return 'Pending';
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
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
        accountsPayable: byType['ACCOUNTS_PAYABLE'] || 0,
        bankLoans:       byType['BANK_LOAN']        || 0,
        taxesDue:        byType['TAX']              || 0,
        salaryOther:     (byType['SALARY'] || 0) + (byType['OTHER'] || 0),
        overdueCount:    parseInt(overdueRow?.c || 0)
      }
    });
  } catch (err) {
    console.error('[LIAB DASH]', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

// ─── PAYMENTS LIST ─────────────────────────────────────────────────────────
router.get('/payments', authenticate, async (req, res) => {
  try {
    const data = await knex('erp_payments_v4')
      .join('erp_liabilities_v4', 'erp_payments_v4.liability_id', 'erp_liabilities_v4.id')
      .leftJoin('erp_suppliers_v4', 'erp_liabilities_v4.party_id', 'erp_suppliers_v4.id')
      .select(
        'erp_payments_v4.*',
        'erp_liabilities_v4.reference_no',
        'erp_liabilities_v4.liability_type',
        knex.raw("COALESCE(erp_suppliers_v4.supplier_name, erp_liabilities_v4.party_name) as party_name")
      )
      .orderBy('erp_payments_v4.created_at', 'desc');
    res.json({ success: true, data });
  } catch (err) {
    console.error('[LIAB PAYMENTS]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
  }
});

// ─── LIST BY TYPE ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    let q = knex('erp_liabilities_v4')
      .leftJoin('erp_suppliers_v4', 'erp_liabilities_v4.party_id', 'erp_suppliers_v4.id')
      .leftJoin('erp_loan_details_v4', 'erp_liabilities_v4.id', 'erp_loan_details_v4.liability_id')
      .leftJoin('erp_tax_details_v4', 'erp_liabilities_v4.id', 'erp_tax_details_v4.liability_id')
      .select(
        'erp_liabilities_v4.*',
        knex.raw("COALESCE(erp_suppliers_v4.supplier_name, erp_liabilities_v4.party_name) as party_name"),
        'erp_loan_details_v4.lender_name',
        'erp_loan_details_v4.interest_rate',
        'erp_loan_details_v4.term_months',
        'erp_loan_details_v4.principal_amount',
        'erp_tax_details_v4.tax_type',
        'erp_tax_details_v4.tax_period'
      )
      .orderBy('erp_liabilities_v4.created_at', 'desc');

    if (type) {
      const types = type.split(',').map(t => t.trim());
      q = types.length > 1 ? q.whereIn('erp_liabilities_v4.liability_type', types) : q.where('erp_liabilities_v4.liability_type', types[0]);
    }
    const data = await q;
    res.json({ success: true, data });
  } catch (err) {
    console.error('[LIAB LIST]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch liabilities.' });
  }
});

// ─── HELPER: GET/CREATE SUPPLIER ──────────────────────────────────────────
async function getOrCreateSupplier(trx, name) {
  if (!name) return null;
  let sup = await trx('erp_suppliers_v4').where('supplier_name', name).first();
  if (sup) return sup.id;
  const [id] = await trx('erp_suppliers_v4').insert({ supplier_name: name });
  return id;
}

// ─── ADD ACCOUNTS PAYABLE ──────────────────────────────────────────────────
router.post('/add-ap', authenticate, async (req, res) => {
  try {
    const { supplier_name, invoice_number, invoice_date, due_date, amount, description } = req.body;
    if (!supplier_name || !invoice_number || !amount) {
      return res.status(400).json({ success: false, message: 'Supplier, Invoice No, and Amount required.' });
    }
    const amt = parseFloat(amount);
    await knex.transaction(async trx => {
      const party_id = await getOrCreateSupplier(trx, supplier_name);
      await trx('erp_liabilities_v4').insert({
        liability_type: 'ACCOUNTS_PAYABLE',
        reference_no: invoice_number,
        party_id,
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        issue_date: invoice_date || null,
        due_date: due_date || null,
        status: computeStatus(amt, 0, due_date)
      });
    });
    res.status(201).json({ success: true, message: 'Supplier Bill created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADD BANK LOAN ─────────────────────────────────────────────────────────
router.post('/add-loan', authenticate, async (req, res) => {
  try {
    const { lender_name, loan_no, loan_date, principal_amount, interest_rate, term_months, due_date, description } = req.body;
    if (!lender_name || !loan_no || !principal_amount) {
      return res.status(400).json({ success: false, message: 'Lender, Loan No, and Principal required.' });
    }
    const amt = parseFloat(principal_amount);
    await knex.transaction(async trx => {
      const [liability_id] = await trx('erp_liabilities_v4').insert({
        liability_type: 'BANK_LOAN',
        reference_no: loan_no,
        party_name: lender_name, // Bank Name
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        issue_date: loan_date || null,
        due_date: due_date || null,
        status: computeStatus(amt, 0, due_date)
      });
      await trx('erp_loan_details_v4').insert({
        liability_id,
        lender_name,
        interest_rate: interest_rate || null,
        term_months: term_months || null,
        principal_amount: amt
      });
    });
    res.status(201).json({ success: true, message: 'Bank Loan created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADD TAX ───────────────────────────────────────────────────────────────
router.post('/add-tax', authenticate, async (req, res) => {
  try {
    const { tax_type, tax_ref, period, amount_due, due_date, description } = req.body;
    if (!tax_type || !tax_ref || !amount_due) {
      return res.status(400).json({ success: false, message: 'Tax Type, Ref No, and Amount required.' });
    }
    const amt = parseFloat(amount_due);
    await knex.transaction(async trx => {
      const [liability_id] = await trx('erp_liabilities_v4').insert({
        liability_type: 'TAX',
        reference_no: tax_ref,
        party_name: 'Tax Authority',
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        due_date: due_date || null,
        status: computeStatus(amt, 0, due_date)
      });
      await trx('erp_tax_details_v4').insert({
        liability_id,
        tax_type,
        tax_period: period || null
      });
    });
    res.status(201).json({ success: true, message: 'Tax Liability created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADD SALARY/OTHER ──────────────────────────────────────────────────────
router.post('/add-other', authenticate, async (req, res) => {
  try {
    const { liability_type, party_name, reference_no, amount, due_date, description } = req.body;
    if (!party_name || !reference_no || !amount) {
      return res.status(400).json({ success: false, message: 'Party Name, Reference, and Amount required.' });
    }
    const amt = parseFloat(amount);
    await knex.transaction(async trx => {
      await trx('erp_liabilities_v4').insert({
        liability_type: liability_type || 'OTHER', // SALARY or OTHER
        reference_no,
        party_name,
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        due_date: due_date || null,
        status: computeStatus(amt, 0, due_date)
      });
    });
    res.status(201).json({ success: true, message: 'Liability created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── RECORD PAYMENT ────────────────────────────────────────────────────────
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const { amount, payment_date, payment_method, notes } = req.body;
    const pAmt  = parseFloat(amount);
    const pDate = payment_date || new Date().toISOString().split('T')[0];

    if (!pAmt || pAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    await knex.transaction(async trx => {
      const liab = await trx('erp_liabilities_v4').where('id', req.params.id).first();
      if (!liab) throw new Error('Record not found.');

      const curBal = parseFloat(liab.balance);
      if (pAmt > curBal) throw new Error('Payment exceeds remaining balance of ETB ' + curBal + '.');

      const newPaid = parseFloat(liab.paid_amount || 0) + pAmt;
      const newBal  = parseFloat(liab.amount) - newPaid;
      const newStat = computeStatus(liab.amount, newPaid, liab.due_date);

      await trx('erp_liabilities_v4').where('id', liab.id).update({
        paid_amount: newPaid,
        balance:     newBal < 0 ? 0 : newBal,
        status:      newStat
      });

      await trx('erp_payments_v4').insert({
        liability_id:   liab.id,
        payment_date:   pDate,
        amount:         pAmt,
        payment_method: payment_method || 'Cash',
        notes:          notes || null
      });
    });

    res.json({ success: true, message: 'Payment recorded successfully.' });
  } catch (err) {
    console.error('[LIAB PAY]', err);
    res.status(400).json({ success: false, message: err.message || 'Payment failed.' });
  }
});

// ─── DELETE LIABILITY ────────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await knex.transaction(async trx => {
      await trx('erp_payments_v4').where('liability_id', id).del();
      await trx('erp_loan_details_v4').where('liability_id', id).del();
      await trx('erp_tax_details_v4').where('liability_id', id).del();
      const deleted = await trx('erp_liabilities_v4').where('id', id).del();
      if (!deleted) throw new Error('Record not found.');
    });
    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete record.' });
  }
});

module.exports = router;
