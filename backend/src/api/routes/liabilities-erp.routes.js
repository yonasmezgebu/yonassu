const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { sendFinanceNotification } = require('../../services/notification.service');

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

// Auto-generate a unique reference number, e.g. AP-20261012-0001.
const generateReference = async (trx, prefix, refDate) => {
  const d = String(refDate || new Date().toISOString().slice(0, 10)).slice(0, 10).replace(/-/g, '');
  const pad = `${prefix}-${d}-`;
  const last = await trx('erp_liabilities_v4')
    .where('reference_no', 'like', `${pad}%`)
    .orderBy('reference_no', 'desc')
    .first();
  const lastSeq = last ? parseInt(String(last.reference_no).split('-').pop(), 10) || 0 : 0;
  return `${pad}${String(lastSeq + 1).padStart(4, '0')}`;
};

// Map a Finance account type to the cashbook payment method it settles under.
const accountTypeToMethod = (t) => (t === 'Bank' ? 'Bank'
  : t === 'Mobile Wallet' ? 'Telebirr' : 'Cash');

// Current balance of a Finance account, derived from the finance_cashbook
// ledger (opening balance + receipts − payments) exactly like the Bank Accounts
// page, so the payment screen validates against the balance shown there.
const getAccountBalance = async (trx, account) => {
  const method = accountTypeToMethod(account.account_type);
  const rows = await trx('finance_cashbook').where(function () {
    this.where('account_id', account.id);
    this.orWhere(function () {
      this.whereNull('account_id').andWhere('payment_method', method);
    });
  });
  const totalIn  = rows.filter(r => r.type === 'CRV').reduce((s, r) => s + parseFloat(r.receipts || 0), 0);
  const totalOut = rows.filter(r => r.type === 'EV').reduce((s, r) => s + parseFloat(r.payments || 0), 0);
  return parseFloat(account.opening_balance || 0) + totalIn - totalOut;
};

// Raise an in-app notification (finance bell) once when a liability with an
// outstanding balance enters its final 3 days before the due date.
const runDueDateReminders = async (req) => {
  try {
    const now = new Date();
    const today = toDateOnly(now);
    const in3 = toDateOnly(new Date(now.getTime() + 3 * 86400000));

    const dueSoon = await knex('erp_liabilities_v4')
      .where('balance', '>', 0)
      .andWhere('due_reminder_sent', false)
      .whereBetween('due_date', [today, in3]);

    if (!dueSoon.length) return;

    const io = req.app?.get('io');
    for (const r of dueSoon) {
      const dueStr = toDateOnly(r.due_date);
      const days = Math.round((Date.parse(dueStr) - Date.parse(today)) / 86400000);
      const when = days <= 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`;
      const party = r.party_name || r.reference_no;
      await sendFinanceNotification({
        title: 'Liability Due Soon',
        message: `${r.liability_type} ${r.reference_no} for ${party} (ETB ${Number(r.balance).toLocaleString()}) is due ${when} (${dueStr}). Please settle this payment.`,
        type: 'finance',
        link: '/finance/liabilities',
        related_entity_id: r.id,
      }, io);
      await knex('erp_liabilities_v4').where({ id: r.id }).update({ due_reminder_sent: true });
    }
  } catch (e) {
    console.error('Liability due date reminder error:', e);
  }
};

// ─── STATUS HELPER ─────────────────────────────────────────────────────────
function computeStatus(amount, paid_amount, due_date) {
  const bal  = parseFloat(amount) - parseFloat(paid_amount || 0);
  if (bal <= 0) return 'Paid';
  const today = toDateOnly(new Date());
  const due   = due_date ? toDateOnly(due_date) : null;
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

    await runDueDateReminders(req);

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
    const rows = data.map(r => ({ ...r, payment_date: toDateOnly(r.payment_date) }));
    res.json({ success: true, data: rows });
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
    const rows = await q;
    const data = rows.map(r => ({ ...r, due_date: toDateOnly(r.due_date), issue_date: toDateOnly(r.issue_date) }));
    await runDueDateReminders(req);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[LIAB LIST]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch liabilities.' });
  }
});

// ─── HELPER: GET/CREATE SUPPLIER ──────────────────────────────────────────
async function getOrCreateSupplier(trx, name, phone, email) {
  if (!name) return null;
  let sup = await trx('erp_suppliers_v4').where('supplier_name', name).first();
  if (sup) {
    const upd = {};
    if (phone) upd.phone = phone;
    if (email) upd.email = email;
    if (Object.keys(upd).length) await trx('erp_suppliers_v4').where('id', sup.id).update(upd);
    return sup.id;
  }
  const [id] = await trx('erp_suppliers_v4').insert({ supplier_name: name, phone: phone || null, email: email || null });
  return id;
}

// ─── ADD ACCOUNTS PAYABLE ──────────────────────────────────────────────────
const addApHandler = async (req, res) => {
  try {
    const { supplier_name, invoice_number, invoice_date, due_date, amount, description, phone, email } = req.body;
    if (!supplier_name || !amount) {
      return res.status(400).json({ success: false, message: 'Supplier and Amount required.' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Supplier phone number is required.' });
    }
    const amt = parseFloat(amount);
    await knex.transaction(async trx => {
      const party_id = await getOrCreateSupplier(trx, supplier_name, phone, email);
      const ref = invoice_number || await generateReference(trx, 'AP', invoice_date);
      await trx('erp_liabilities_v4').insert({
        liability_type: 'ACCOUNTS_PAYABLE',
        reference_no: ref,
        party_id,
        party_name: supplier_name,
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        issue_date: invoice_date || null,
        due_date: due_date || null,
        phone: phone || null,
        email: email || null,
        status: computeStatus(amt, 0, due_date)
      });
    });
    res.status(201).json({ success: true, message: 'Supplier Bill created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
router.post('/add-ap', authenticate, addApHandler);
router.post('/accounts-payable', authenticate, addApHandler);

// ─── ADD BANK LOAN ─────────────────────────────────────────────────────────
const addLoanHandler = async (req, res) => {
  try {
    const { lender_name, loan_no, loan_date, principal_amount, interest_rate, term_months, due_date, description, phone, email } = req.body;
    if (!lender_name || !principal_amount) {
      return res.status(400).json({ success: false, message: 'Lender and Principal required.' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Lender phone number is required.' });
    }
    const amt = parseFloat(principal_amount);
    await knex.transaction(async trx => {
      const ref = loan_no || await generateReference(trx, 'LN', loan_date || due_date);
      const [liability_id] = await trx('erp_liabilities_v4').insert({
        liability_type: 'BANK_LOAN',
        reference_no: ref,
        party_name: lender_name, // Bank Name
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        issue_date: loan_date || null,
        due_date: due_date || null,
        phone: phone || null,
        email: email || null,
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
};
router.post('/add-loan', authenticate, addLoanHandler);
router.post('/loans', authenticate, addLoanHandler);

// ─── ADD TAX ───────────────────────────────────────────────────────────────
const addTaxHandler = async (req, res) => {
  try {
    const { tax_type, tax_ref, period, amount_due, due_date, description, phone, email } = req.body;
    if (!tax_type || !amount_due) {
      return res.status(400).json({ success: false, message: 'Tax Type and Amount required.' });
    }
    const amt = parseFloat(amount_due);
    await knex.transaction(async trx => {
      const ref = tax_ref || await generateReference(trx, 'TAX', due_date);
      const [liability_id] = await trx('erp_liabilities_v4').insert({
        liability_type: 'TAX',
        reference_no: ref,
        party_name: 'Tax Authority',
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        due_date: due_date || null,
        phone: phone || null,
        email: email || null,
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
};
router.post('/add-tax', authenticate, addTaxHandler);
router.post('/taxes', authenticate, addTaxHandler);

// ─── ADD SALARY/OTHER ──────────────────────────────────────────────────────
const addOtherHandler = async (req, res) => {
  try {
    const { liability_type, liability_type_sub, party_name, reference_no, amount, due_date, description, phone, email } = req.body;
    if (!party_name || !amount) {
      return res.status(400).json({ success: false, message: 'Party Name and Amount required.' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Party phone number is required.' });
    }
    const type = liability_type || liability_type_sub || 'OTHER';
    const amt = parseFloat(amount);
    await knex.transaction(async trx => {
      const ref = reference_no || await generateReference(trx, type === 'SALARY' ? 'SAL' : 'OTH', due_date);
      await trx('erp_liabilities_v4').insert({
        liability_type: type, // SALARY or OTHER
        reference_no: ref,
        party_name,
        description: description || null,
        amount: amt,
        paid_amount: 0,
        balance: amt,
        due_date: due_date || null,
        phone: phone || null,
        email: email || null,
        status: computeStatus(amt, 0, due_date)
      });
    });
    res.status(201).json({ success: true, message: 'Liability created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
router.post('/add-other', authenticate, addOtherHandler);
router.post('/salary-other', authenticate, addOtherHandler);

// ─── RECORD PAYMENT ────────────────────────────────────────────────────────
// The money must leave a real Finance account (Bank / Cash / Mobile Wallet).
// A payment may be split across several accounts when one is not enough; the
// ledger is only written after every selected account has sufficient funds.
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const { amount, payment_date, payment_method, notes, account_id, allocations } = req.body;
    const pDate = payment_date || new Date().toISOString().split('T')[0];

    // Normalise the request into a list of { account_id, amount } lines.
    let raw = [];
    if (Array.isArray(allocations) && allocations.length) raw = allocations;
    else if (account_id) raw = [{ account_id, amount }];

    const lines = [];
    for (const a of raw) {
      if (!a.account_id) {
        return res.status(400).json({ success: false, message: 'Please select a Finance account for every payment line.' });
      }
      const amt = parseFloat(a.amount);
      if (!amt || amt <= 0) {
        return res.status(400).json({ success: false, message: 'Each payment line needs an amount greater than zero.' });
      }
      lines.push({ account_id: a.account_id, amount: amt });
    }

    const pAmt = lines.length ? lines.reduce((s, a) => s + a.amount, 0) : parseFloat(amount);

    if (!pAmt || pAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    await knex.transaction(async trx => {
      const liab = await trx('erp_liabilities_v4').where('id', req.params.id).first();
      if (!liab) throw new Error('Record not found.');

      const curBal = parseFloat(liab.balance);
      if (pAmt > curBal) throw new Error('Payment exceeds remaining balance of ETB ' + curBal + '.');

      // Verify each selected account actually has the money before moving any.
      // Amounts are grouped per account so the same account used on several
      // lines is validated against its balance as a single total.
      const accountsById = new Map();
      const perAccount = new Map();
      for (const line of lines) {
        const key = String(line.account_id);
        perAccount.set(key, (perAccount.get(key) || 0) + line.amount);
      }
      for (const [accId, totalAmt] of perAccount) {
        const account = await trx('finance_accounts').where('id', accId).first();
        if (!account) throw new Error('Selected Finance account was not found.');
        accountsById.set(accId, account);
        const available = await getAccountBalance(trx, account);
        if (totalAmt > available + 0.005) {
          throw new Error(`Insufficient balance in "${account.account_name}" — available ETB ${available.toFixed(2)}. Reduce the amount or pay from another account.`);
        }
      }

      const newPaid = parseFloat(liab.paid_amount || 0) + pAmt;
      const newBal  = parseFloat(liab.amount) - newPaid;
      const newStat = computeStatus(liab.amount, newPaid, liab.due_date);

      await trx('erp_liabilities_v4').where('id', liab.id).update({
        paid_amount: newPaid,
        balance:     newBal < 0 ? 0 : newBal,
        status:      newStat
      });

      if (lines.length) {
        for (const line of lines) {
          const account = accountsById.get(String(line.account_id));
          const amt = line.amount;
          const method = accountTypeToMethod(account.account_type);
          const [paymentId] = await trx('erp_payments_v4').insert({
            liability_id:   liab.id,
            payment_date:   pDate,
            amount:         amt,
            payment_method: account.account_name,
            notes:          notes || null,
            account_id:     account.id,
            account_name:   account.account_name,
          });
          // Record the outgoing money on the selected Finance account ledger.
          await trx('finance_cashbook').insert({
            date:           pDate,
            type:           'EV',
            reference:      `LBL-${paymentId}`,
            description:    `Liability payment — ${liab.reference_no} (${liab.party_name || liab.liability_type})`.slice(0, 255),
            receipts:       0,
            payments:       amt,
            payment_method: method,
            account_id:     account.id,
            account_name:   account.account_name,
            source:         'Liabilities',
          });
        }
      } else {
        // Legacy path (no Finance account supplied) — record the payment only.
        await trx('erp_payments_v4').insert({
          liability_id:   liab.id,
          payment_date:   pDate,
          amount:         pAmt,
          payment_method: payment_method || 'Cash',
          notes:          notes || null
        });
      }
    });

    res.json({ success: true, message: 'Payment recorded successfully.' });
  } catch (err) {
    console.error('[LIAB PAY]', err);
    res.status(400).json({ success: false, message: err.message || 'Payment failed.' });
  }
});

// ─── UPDATE LIABILITY ────────────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const existing = await knex('erp_liabilities_v4').where('id', id).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    if (existing.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'A fully paid liability cannot be edited.' });
    }

    const type = existing.liability_type;
    const party_name = b.party_name ?? b.supplier_name ?? b.lender_name ?? existing.party_name;
    const reference_no = b.reference_no ?? b.invoice_number ?? b.loan_no ?? b.tax_ref ?? existing.reference_no;

    let amtRaw;
    if (b.amount !== undefined) amtRaw = b.amount;
    else if (b.principal_amount !== undefined) amtRaw = b.principal_amount;
    else if (b.amount_due !== undefined) amtRaw = b.amount_due;
    else amtRaw = existing.amount;

    const amt = parseFloat(amtRaw);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: 'A valid amount is required.' });
    }
    const paid = parseFloat(existing.paid_amount || 0);
    if (amt < paid) {
      return res.status(400).json({ success: false, message: 'Amount cannot be less than the already paid amount (ETB ' + paid + ').' });
    }
    const balance = amt - paid;

    const issueRaw = b.issue_date ?? b.invoice_date ?? b.loan_date ?? existing.issue_date;
    const dueRaw = b.due_date !== undefined ? b.due_date : existing.due_date;
    const dueChanged = b.due_date !== undefined && toDateOnly(b.due_date) !== toDateOnly(existing.due_date);
    const status = computeStatus(amt, paid, dueRaw);

    await knex.transaction(async trx => {
      const upd = {
        party_name,
        reference_no,
        amount: amt,
        balance,
        issue_date: issueRaw ? toDateOnly(issueRaw) : null,
        due_date: dueRaw ? toDateOnly(dueRaw) : null,
        description: b.description !== undefined ? b.description : existing.description,
        phone: b.phone !== undefined ? b.phone : existing.phone,
        email: b.email !== undefined ? b.email : existing.email,
        due_reminder_sent: dueChanged ? false : existing.due_reminder_sent,
        status,
      };

      if (type === 'ACCOUNTS_PAYABLE' && b.supplier_name) {
        upd.party_id = await getOrCreateSupplier(trx, b.supplier_name, b.phone, b.email);
        upd.party_name = b.supplier_name;
      }
      if ((type === 'SALARY' || type === 'OTHER') && (b.liability_type || b.liability_type_sub)) {
        upd.liability_type = b.liability_type || b.liability_type_sub;
      }

      await trx('erp_liabilities_v4').where('id', id).update(upd);

      if (type === 'BANK_LOAN') {
        const ld = {
          lender_name: b.lender_name ?? party_name,
          interest_rate: b.interest_rate ?? null,
          term_months: b.term_months || null,
          principal_amount: amt,
        };
        const existsLoan = await trx('erp_loan_details_v4').where('liability_id', id).first();
        if (existsLoan) await trx('erp_loan_details_v4').where('liability_id', id).update(ld);
        else await trx('erp_loan_details_v4').insert({ liability_id: id, ...ld });
      } else if (type === 'TAX') {
        const td = {
          tax_type: b.tax_type ?? existing.party_name,
          tax_period: b.period ?? null,
        };
        const existsTax = await trx('erp_tax_details_v4').where('liability_id', id).first();
        if (existsTax) await trx('erp_tax_details_v4').where('liability_id', id).update(td);
        else await trx('erp_tax_details_v4').insert({ liability_id: id, ...td });
      }
    });

    res.json({ success: true, message: 'Record updated successfully.' });
  } catch (err) {
    console.error('[LIAB UPDATE]', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update record.' });
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
