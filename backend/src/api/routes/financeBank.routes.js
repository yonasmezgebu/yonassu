const express = require('express');
const router = express.Router();
const c = require('../controllers/financeBank.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Accounts CRUD
router.get('/', c.getAccounts);
router.post('/', c.createAccount);
router.put('/:id', c.updateAccount);
router.patch('/:id/toggle-status', c.toggleAccountStatus);

// Cashbook summary (for the overview cards) and per-account transactions
router.get('/cashbook/summary', c.getCashbookSummary);
router.get('/:id/transactions', c.getAccountTransactions);

// Reconciliations
router.get('/reconciliations', c.getReconciliations);
router.post('/reconciliations/global', c.createGlobalReconciliation);
router.post('/reconciliations', c.createReconciliation);
router.get('/reconciliations/:id', c.getReconciliationById);

module.exports = router;
