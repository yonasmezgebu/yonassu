const { db } = require('../../config/database');

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

// Does a cashbook row belong to this account? Accounting is keyed on account_id
// for new records; legacy rows without account_id fall back to payment method
// (+ provider for bank) so nothing silently disappears.
const matchesAccount = (row, acc) => {
  if (row.account_id != null && String(row.account_id) === String(acc.id)) return true;
  if (row.account_id != null) return false;

  const method = acc.account_type === 'Bank' ? 'Bank'
    : acc.account_type === 'Mobile Wallet' ? 'Telebirr' : 'Cash';
  const rowMethod = String(row.payment_method || '').toLowerCase();
  if (rowMethod !== method.toLowerCase()) return false;

  if (acc.account_type === 'Bank' && acc.bank_provider) {
    const provider = String(acc.bank_provider).toLowerCase();
    if (provider !== '-' && rowMethod === 'bank') {
      // Without a bank_name on the row, attribute to the account silently only
      // if it is the only bank account of that provider family.
      return true;
    }
  }
  return true;
};

const accountMethod = (acc) => (acc.account_type === 'Bank' ? 'Bank'
  : acc.account_type === 'Mobile Wallet' ? 'Telebirr' : 'Cash');

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await db('finance_accounts').orderBy('account_type').orderBy('account_name');

    // finance_cashbook is the single source of truth for money movement.
    const ledger = await db('finance_cashbook');

    const enriched = accounts.map(acc => {
      const rows = ledger.filter(r => matchesAccount(r, acc));
      const totalIn  = rows.filter(r => r.type === 'CRV').reduce((s, r) => s + parseFloat(r.receipts||0), 0);
      const totalOut = rows.filter(r => r.type === 'EV').reduce((s, r)  => s + parseFloat(r.payments||0), 0);
      const netBalance = parseFloat(acc.opening_balance || 0) + totalIn - totalOut;
      const pendingRecon = rows.filter(r => !r.is_reconciled);
      return {
        ...acc, totalIn, totalOut, netBalance,
        pendingReconCount: pendingRecon.length,
        pendingReconTotal: pendingRecon.reduce((s, r) => s + (parseFloat(r.receipts||0) - parseFloat(r.payments||0)), 0),
      };
    });

    const summary = {
      totalCRV:    ledger.filter(cb => cb.type === 'CRV').reduce((s, cb) => s + parseFloat(cb.receipts||0), 0),
      totalEV:     ledger.filter(cb => cb.type === 'EV').reduce((s, cb)  => s + parseFloat(cb.payments||0), 0),
      totalIncome: ledger.reduce((s, cb) => s + parseFloat(cb.receipts||0), 0),
      totalOut:    ledger.reduce((s, cb) => s + parseFloat(cb.payments||0), 0),
      netBalance:  ledger.reduce((s, cb) => s + parseFloat(cb.receipts||0) - parseFloat(cb.payments||0), 0),
    };

    res.json({ success: true, data: enriched, summary });
  } catch (err) {
    console.error('getAccounts error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { account_name, account_type, bank_provider, account_number, branch, currency, opening_balance, opening_balance_date, description } = req.body;

    if (!account_name || !account_type || !currency || opening_balance === undefined || !opening_balance_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [id] = await db('finance_accounts').insert({
      account_name, account_type, bank_provider, account_number, branch,
      currency, opening_balance, opening_balance_date, description, status: 'Active'
    });

    const account = await db('finance_accounts').where({ id }).first();
    res.json({ success: true, data: account });
  } catch (err) {
    console.error('createAccount error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    await db('finance_accounts').where({ id }).update({ ...fields, updated_at: db.fn.now() });
    const account = await db('finance_accounts').where({ id }).first();
    res.json({ success: true, data: account });
  } catch (err) {
    console.error('updateAccount error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleAccountStatus = async (req, res) => {
  try {
    const acc = await db('finance_accounts').where({ id: req.params.id }).first();
    if (!acc) return res.status(404).json({ success: false, message: 'Not found' });
    const newStatus = acc.status === 'Active' ? 'Inactive' : 'Active';
    await db('finance_accounts').where({ id: req.params.id }).update({ status: newStatus, updated_at: db.fn.now() });
    res.json({ success: true, data: { status: newStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CASHBOOK SUMMARY (used by the page overview) ────────────────────────────

exports.getCashbookSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = db('finance_cashbook');
    if (from) query = query.where('date', '>=', from);
    if (to)   query = query.where('date', '<=', to);

    const rows = await query.orderBy('date', 'asc').orderBy('id', 'asc');

    // Running balance
    let running = 0;
    const withBalance = rows.map(r => {
      running += parseFloat(r.receipts||0) - parseFloat(r.payments||0);
      return { ...r, balance: running };
    });

    const totalCRV = rows.filter(r => r.type === 'CRV').reduce((s, r) => s + parseFloat(r.receipts||0), 0);
    const totalEV  = rows.filter(r => r.type === 'EV').reduce((s, r)  => s + parseFloat(r.payments||0), 0);
    const totalIncome = rows.reduce((s, r) => s + parseFloat(r.receipts||0), 0);
    const totalOut    = rows.reduce((s, r) => s + parseFloat(r.payments||0), 0);

    res.json({
      success: true,
      data: withBalance,
      summary: { totalCRV, totalEV, totalIncome, totalOut, netBalance: totalIncome - totalOut }
    });
  } catch (err) {
    console.error('getCashbookSummary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get cashbook rows for a specific account (for reconciliation)
exports.getAccountTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, reconcile } = req.query;

    const acc = await db('finance_accounts').where({ id }).first();
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });

    const method = accountMethod(acc);

    // finance_cashbook is the single source of truth: rows are attributed via
    // account_id when present, else by payment method for legacy rows.
    const allRows = await db('finance_cashbook')
      .where(function () {
        this.where('account_id', acc.id);
        this.orWhere(function () {
          this.whereNull('account_id');
          this.where('payment_method', method);
        });
      })
      .orderBy('date', 'asc')
      .orderBy('id', 'asc');

    let running = parseFloat(acc.opening_balance || 0);
    const enrichedRows = allRows.map(r => {
      running += parseFloat(r.receipts||0) - parseFloat(r.payments||0);
      return { ...r, balance: running };
    });

    let filteredRows = enrichedRows;
    if (from) filteredRows = filteredRows.filter(r => r.date >= from);
    if (to)   filteredRows = filteredRows.filter(r => r.date <= to);

    // Reconcile mode → only rows not yet reconciled
    if (reconcile === '1' || reconcile === 'true') {
      filteredRows = enrichedRows.filter(r => !r.is_reconciled);
    }

    let erpBalance = parseFloat(acc.opening_balance || 0);
    const rowsUpToTo = enrichedRows.filter(r => !to || r.date <= to);
    if (rowsUpToTo.length > 0) {
      erpBalance = rowsUpToTo[rowsUpToTo.length - 1].balance;
    }

    res.json({ success: true, data: filteredRows, account: acc, erpBalance });
  } catch (err) {
    console.error('getAccountTransactions error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RECONCILIATIONS ─────────────────────────────────────────────────────────

exports.getReconciliations = async (req, res) => {
  try {
    const recons = await db('finance_reconciliations')
      .join('finance_accounts', 'finance_reconciliations.account_id', '=', 'finance_accounts.id')
      .select('finance_reconciliations.*', 'finance_accounts.account_name', 'finance_accounts.account_type', 'finance_accounts.currency')
      .orderBy('finance_reconciliations.created_at', 'desc');
    res.json({ success: true, data: recons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createReconciliation = async (req, res) => {
  try {
    const { account_id, period_from, period_to, erp_balance, actual_balance, notes, items } = req.body;

    if (!account_id || actual_balance === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const acc = await db('finance_accounts').where({ id: account_id }).first();
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });

    const difference = req.body.override_difference !== undefined
      ? parseFloat(req.body.override_difference)
      : parseFloat(actual_balance) - parseFloat(erp_balance || 0);

    // Determine which cashbook rows are being reconciled now.
    const targetRefs = [];
    if (items && items.length > 0) {
      for (const it of items) {
        if (!it.reference) return res.status(400).json({ success: false, message: 'Reconciliation items require a reference' });
        targetRefs.push({ reference: it.reference, type: it.type || 'CRV' });
      }
    } else {
      // No items → default to all non-reconciled rows for this account
      const method = accountMethod(acc);
      const pendingRows = await db('finance_cashbook')
        .where('is_reconciled', false)
        .where(function () {
          this.where('account_id', account_id);
          this.orWhere(function () {
            this.whereNull('account_id');
            this.where('payment_method', method);
          });
        })
        .select('reference', 'type');
      for (const r of pendingRows) targetRefs.push({ reference: r.reference, type: r.type || 'CRV' });
    }

    // Derive the period from the rows being reconciled when not supplied
    let pFrom = period_from;
    let pTo = period_to;
    if (!pFrom || !pTo) {
      const refList = targetRefs.map(t => t.reference);
      const dateRows = refList.length
        ? await db('finance_cashbook').whereIn('reference', refList).select(db.raw('MIN(date) as min_date'), db.raw('MAX(date) as max_date')).first()
        : null;
      const today = new Date().toISOString().slice(0, 10);
      pFrom = pFrom || (dateRows && dateRows.min_date) || today;
      pTo = pTo || (dateRows && dateRows.max_date) || today;
    }

    const count = await db('finance_reconciliations').count('* as c').first();
    const reconNo = `REC-${new Date().getFullYear()}-${String(parseInt(count.c || 0) + 1).padStart(4, '0')}`;

    let reconId;
    await db.transaction(async trx => {
      [reconId] = await trx('finance_reconciliations').insert({
        reconciliation_no: reconNo,
        account_id,
        period_from: pFrom,
        period_to: pTo,
        erp_balance: erp_balance || 0,
        actual_balance,
        difference,
        status: 'Completed',
        notes
      });

      if (items && items.length > 0) {
        await trx('finance_recon_items').insert(items.map(it => ({
          reconciliation_id: reconId,
          transaction_date:  (it.date || '').toString().slice(0, 10),
          reference_no:      it.reference,
          transaction_type:  it.type,
          description:       it.description,
          erp_amount:        it.erp_amount,
          actual_amount:     it.actual_amount,
          difference:        it.difference,
          match_status:      it.match_status
        })));
      }

      // Mark the reconciled cashbook rows as reconciled
      if (targetRefs.length > 0) {
        for (const t of targetRefs) {
          await trx('finance_cashbook')
            .where({ reference: t.reference, type: t.type })
            .update({ is_reconciled: true, reconciled_at: trx.fn.now() });
        }
      }
    });

    res.json({ success: true, data: { id: reconId, reconciliation_no: reconNo }, reconciledCount: targetRefs.length });
  } catch (err) {
    console.error('createReconciliation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGlobalReconciliation = async (req, res) => {
  try {
    const { period_from, period_to, accounts_data } = req.body;
    
    if (!accounts_data || !Array.isArray(accounts_data)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Always reconcile every non-reconciled cashbook record. When no period was
    // provided, derive it from the soon-to-be-reconciled rows.
    let pFrom = period_from;
    let pTo = period_to;
    if (!pFrom || !pTo) {
      const dateRow = await db('finance_cashbook')
        .where('is_reconciled', false)
        .select(db.raw('MIN(date) as min_date'), db.raw('MAX(date) as max_date'))
        .first();
      const today = new Date().toISOString().slice(0, 10);
      pFrom = pFrom || (dateRow && dateRow.min_date) || today;
      pTo = pTo || (dateRow && dateRow.max_date) || today;
    }

    const crypto = require('crypto');
    const groupId = crypto.randomUUID();

    let createdIds = [];
    let reconciledCount = 0;
    await db.transaction(async trx => {
      const countRes = await trx('finance_reconciliations').count('* as c').first();
      let baseCount = parseInt(countRes.c || 0);

      for (let i = 0; i < accounts_data.length; i++) {
        const item = accounts_data[i];
        baseCount++;
        const reconNo = `REC-${new Date().getFullYear()}-${String(baseCount).padStart(4, '0')}`;
        const diff = item.difference !== undefined && item.difference !== null
          ? parseFloat(item.difference)
          : parseFloat(item.actual_balance || 0) - parseFloat(item.erp_balance || 0);

        const [reconId] = await trx('finance_reconciliations').insert({
          reconciliation_no: reconNo,
          account_id: item.account_id,
          period_from: pFrom,
          period_to: pTo,
          erp_balance: item.erp_balance || 0,
          actual_balance: item.actual_balance || 0,
          difference: diff,
          status: 'Completed',
          notes: `GLOBAL_SUMMARY:${groupId}`
        });
        createdIds.push(reconId);
      }

      // Mark every non-reconciled cashbook record as reconciled
      const updateRes = await trx('finance_cashbook')
        .where('is_reconciled', false)
        .update({ is_reconciled: true, reconciled_at: trx.fn.now() });
      reconciledCount = updateRes;
    });

    res.json({ success: true, data: createdIds, reconciledCount });
  } catch (err) {
    console.error('createGlobalReconciliation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReconciliationById = async (req, res) => {
  try {
    const recon = await db('finance_reconciliations')
      .join('finance_accounts', 'finance_reconciliations.account_id', '=', 'finance_accounts.id')
      .select('finance_reconciliations.*', 'finance_accounts.account_name', 'finance_accounts.account_type', 'finance_accounts.currency')
      .where('finance_reconciliations.id', req.params.id)
      .first();
    if (!recon) return res.status(404).json({ success: false, message: 'Not found' });

    const items = await db('finance_recon_items').where({ reconciliation_id: req.params.id });
    res.json({ success: true, data: { ...recon, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
