const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

/* ────────────────────────────────────────────
   GET /finance-equity/dashboard
   Get summary KPI for equity
──────────────────────────────────────────── */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const contResult = await knex('erp_equity_transactions')
      .where('transaction_type', 'Contribution')
      .sum('amount as total')
      .first();
    const contributions = parseFloat(contResult?.total || 0);

    const withResult = await knex('erp_equity_transactions')
      .where('transaction_type', 'Withdrawal')
      .sum('amount as total')
      .first();
    const withdrawals = parseFloat(withResult?.total || 0);

    const profitResult = await knex('erp_equity_transactions')
      .where('transaction_type', 'Net Profit')
      .sum('amount as total')
      .first();
    const netProfit = parseFloat(profitResult?.total || 0);

    const lossResult = await knex('erp_equity_transactions')
      .where('transaction_type', 'Net Loss')
      .sum('amount as total')
      .first();
    const netLoss = parseFloat(lossResult?.total || 0);

    const retainedEarnings = netProfit - netLoss;
    const totalEquity = contributions + retainedEarnings - withdrawals;

    res.json({
      success: true,
      data: {
        totalEquity,
        totalContributions: contributions,
        totalWithdrawals: withdrawals,
        retainedEarnings
      }
    });
  } catch (error) {
    console.error('Error fetching equity dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch equity stats.' });
  }
});

/* ────────────────────────────────────────────
   GET /finance-equity/transactions
   Get all equity transactions (ordered ascending by date for running balance)
──────────────────────────────────────────── */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const data = await knex('erp_equity_transactions').orderBy('transaction_date', 'asc').orderBy('id', 'asc');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching equity transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch equity transactions.' });
  }
});

/* ────────────────────────────────────────────
   POST /finance-equity/contribution
   Add an owner contribution
──────────────────────────────────────────── */
router.post('/contribution', authenticate, async (req, res) => {
  try {
    const { owner_name, transaction_date, amount, description } = req.body;
    
    if (!owner_name || !transaction_date || !amount) {
      return res.status(400).json({ success: false, message: 'Owner, Date, and Amount are required.' });
    }

    const amt = parseFloat(amount);

    const [id] = await knex('erp_equity_transactions').insert({
      owner_name,
      transaction_type: 'Contribution',
      amount: amt,
      transaction_date,
      description
    });

    res.status(201).json({ success: true, message: 'Owner contribution recorded.', data: { id } });
  } catch (error) {
    console.error('Error recording contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to record contribution.' });
  }
});

/* ────────────────────────────────────────────
   POST /finance-equity/withdrawal
   Record an owner withdrawal (Drawing)
──────────────────────────────────────────── */
router.post('/withdrawal', authenticate, async (req, res) => {
  try {
    const { owner_name, transaction_date, amount, description } = req.body;
    
    if (!owner_name || !transaction_date || !amount) {
      return res.status(400).json({ success: false, message: 'Owner, Date, and Amount are required.' });
    }

    const amt = parseFloat(amount);

    const [id] = await knex('erp_equity_transactions').insert({
      owner_name,
      transaction_type: 'Withdrawal',
      amount: amt,
      transaction_date,
      description
    });

    res.status(201).json({ success: true, message: 'Owner withdrawal recorded.', data: { id } });
  } catch (error) {
    console.error('Error recording withdrawal:', error);
    res.status(500).json({ success: false, message: 'Failed to record withdrawal.' });
  }
});

/* ────────────────────────────────────────────
   PUT /finance-equity/:id
   Update an equity transaction
──────────────────────────────────────────── */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_name, transaction_date, amount, description } = req.body;

    const existing = await knex('erp_equity_transactions').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const amt = amount ? parseFloat(amount) : existing.amount;

    await knex('erp_equity_transactions').where({ id }).update({
      owner_name: owner_name || existing.owner_name,
      transaction_date: transaction_date || existing.transaction_date,
      amount: amt,
      description: description !== undefined ? description : existing.description
    });

    res.json({ success: true, message: 'Transaction updated successfully.' });
  } catch (error) {
    console.error('Error updating equity transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to update transaction.' });
  }
});

/* ────────────────────────────────────────────
   DELETE /finance-equity/:id
   Delete an equity transaction
──────────────────────────────────────────── */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await knex('erp_equity_transactions').where({ id }).first();
    
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await knex('erp_equity_transactions').where({ id }).delete();
    res.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (error) {
    console.error('Error deleting equity transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction.' });
  }
});

module.exports = router;
