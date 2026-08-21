const { db } = require('../../config/database');

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await db('finance_accounts').orderBy('account_type').orderBy('account_name');

    const allCrvs = await db('finance_crvs');
    const allEvs  = await db('finance_evs');

    const enriched = accounts.map(acc => {
      let method = 'Cash';
      if (acc.account_type === 'Bank') method = 'Bank';
      if (acc.account_type === 'Mobile Wallet') method = 'Telebirr';

      let acrvs = allCrvs.filter(r => (r.payment_method || '').includes(method));
      let aevs  = allEvs.filter(r => (r.payment_method || '').includes(method));

      if (acc.account_type === 'Bank' && acc.bank_provider) {
        const provider = acc.bank_provider.toLowerCase();
        acrvs = acrvs.filter(r => (r.bank_name || '').toLowerCase().includes(provider));
        aevs  = aevs.filter(r => (r.bank_name || '').toLowerCase().includes(provider));
      }

      const totalIn = acrvs.reduce((s, r) => s + parseFloat(r.amount||0), 0);
      const totalOut = aevs.reduce((s, r) => s + parseFloat(r.amount||0), 0);
      
      const netBalance = parseFloat(acc.opening_balance || 0) + totalIn - totalOut;

      return { ...acc, totalIn, totalOut, netBalance };
    });

    // Provide the overall cashbook summary logic
    const cashbook = await db('finance_cashbook');
    const summary = {
      totalCRV:    cashbook.filter(cb => cb.type === 'CRV').reduce((s, cb) => s + parseFloat(cb.receipts||0), 0),
      totalEV:     cashbook.filter(cb => cb.type === 'EV').reduce((s, cb) => s + parseFloat(cb.payments||0), 0),
      totalIncome: cashbook.reduce((s, cb) => s + parseFloat(cb.receipts||0), 0),
      totalOut:    cashbook.reduce((s, cb) => s + parseFloat(cb.payments||0), 0),
      netBalance:  cashbook.reduce((s, cb) => s + parseFloat(cb.receipts||0) - parseFloat(cb.payments||0), 0),
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
    const { from, to } = req.query;

    const acc = await db('finance_accounts').where({ id }).first();
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });

    let method = 'Cash';
    if (acc.account_type === 'Bank') method = 'Bank';
    if (acc.account_type === 'Mobile Wallet') method = 'Telebirr';

    let crvs = await db('finance_crvs').where('payment_method', 'like', `%${method}%`);
    let evs  = await db('finance_evs').where('payment_method', 'like', `%${method}%`);

    // Further filter by bank provider if it's a Bank account and provider is specified
    if (acc.account_type === 'Bank' && acc.bank_provider) {
      const provider = acc.bank_provider.toLowerCase();
      crvs = crvs.filter(r => (r.bank_name || '').toLowerCase().includes(provider));
      evs  = evs.filter(r => (r.bank_name || '').toLowerCase().includes(provider));
    }

    const refs = [
      ...crvs.map(r => r.crv_number),
      ...evs.map(r => r.ev_number)
    ];

    let q = db('finance_cashbook');
    if (refs.length > 0) {
      q = q.whereIn('reference', refs);
    } else {
      q = q.whereRaw('1 = 0'); // No matches
    }

    const allRows = await q.orderBy('date', 'asc');

    let running = parseFloat(acc.opening_balance || 0);
    const enrichedRows = allRows.map(r => {
      running += parseFloat(r.receipts||0) - parseFloat(r.payments||0);
      return { ...r, balance: running };
    });

    let filteredRows = enrichedRows;
    if (from) filteredRows = filteredRows.filter(r => r.date >= from);
    if (to)   filteredRows = filteredRows.filter(r => r.date <= to);

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

    if (!account_id || !period_from || !period_to || actual_balance === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const difference = req.body.override_difference !== undefined 
      ? parseFloat(req.body.override_difference) 
      : parseFloat(actual_balance) - parseFloat(erp_balance || 0);

    const count = await db('finance_reconciliations').count('* as c').first();
    const reconNo = `REC-${new Date().getFullYear()}-${String(parseInt(count.c || 0) + 1).padStart(4, '0')}`;

    let reconId;
    await db.transaction(async trx => {
      [reconId] = await trx('finance_reconciliations').insert({
        reconciliation_no: reconNo,
        account_id,
        period_from,
        period_to,
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
    });

    res.json({ success: true, data: { id: reconId, reconciliation_no: reconNo } });
  } catch (err) {
    console.error('createReconciliation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGlobalReconciliation = async (req, res) => {
  try {
    const { period_from, period_to, accounts_data } = req.body;
    
    if (!period_from || !period_to || !accounts_data || !Array.isArray(accounts_data)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const crypto = require('crypto');
    const groupId = crypto.randomUUID();

    let createdIds = [];
    await db.transaction(async trx => {
      const countRes = await trx('finance_reconciliations').count('* as c').first();
      let baseCount = parseInt(countRes.c || 0);

      for (let i = 0; i < accounts_data.length; i++) {
        const item = accounts_data[i];
        baseCount++;
        const reconNo = `REC-${new Date().getFullYear()}-${String(baseCount).padStart(4, '0')}`;
        
        const [reconId] = await trx('finance_reconciliations').insert({
          reconciliation_no: reconNo,
          account_id: item.account_id,
          period_from,
          period_to,
          erp_balance: item.erp_balance || 0,
          actual_balance: item.actual_balance || 0,
          difference: item.difference || 0,
          status: 'Completed',
          notes: `GLOBAL_SUMMARY:${groupId}`
        });
        createdIds.push(reconId);
      }
    });

    res.json({ success: true, data: createdIds });
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
