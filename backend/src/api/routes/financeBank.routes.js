const express = require('express');
const router = express.Router();
const c = require('../controllers/financeBank.controller');
const { authenticate } = require('../middleware/auth.middleware');

// ── Public: list bank/telebirr accounts so customers can choose payment method ──
router.get('/', c.getAccounts);

// ── All other routes require authentication ──────────────────────────────────
// Accounts CRUD
router.post('/', authenticate, c.createAccount);
router.put('/:id', authenticate, c.updateAccount);
router.patch('/:id/toggle-status', authenticate, c.toggleAccountStatus);

// Cashbook summary (for the overview cards) and per-account transactions
router.get('/cashbook/summary', authenticate, c.getCashbookSummary);
router.get('/:id/transactions', authenticate, c.getAccountTransactions);

// Reconciliations
router.get('/reconciliations', authenticate, c.getReconciliations);
router.post('/reconciliations/global', authenticate, c.createGlobalReconciliation);
router.post('/reconciliations', authenticate, c.createReconciliation);
router.get('/reconciliations/:id', authenticate, c.getReconciliationById);

module.exports = router;
