const { db } = require('../config/database');

/**
 * Normalize a payment method string to one of: Cash | Bank | Telebirr.
 */
const normalizePaymentMethod = (pm) => {
  const s = String(pm || '').toLowerCase().trim();
  if (!s) return 'Cash';
  if (s.includes('cash')) return 'Cash';
  if (s.includes('internal') || s.includes('inter')) return 'Cash';
  if (
    s.includes('telebirr') || s.includes('telbir') || s.includes('birr') ||
    s.includes('mobile') || s.includes('wallet') || s.includes('mbir')
  ) return 'Telebirr';
  return 'Bank';
};

const accountTypeFor = (pm) => {
  const m = normalizePaymentMethod(pm);
  if (m === 'Bank') return 'Bank';
  if (m === 'Telebirr') return 'Mobile Wallet';
  return 'Cash';
};

/**
 * Resolve the finance account that a payment should be attributed to.
 * Bank payments are matched by provider (from bank name / account number) when
 * possible so Cash / Telebirr / Savings & Bank transfers each land on the right
 * account. Never throws — falls back to the first active account of that type.
 *
 * @returns {Promise<{id:number, account_name:string, account_type:string}|null>}
 */
const resolveLedgerAccount = async (conn, method, bankDetails = null, telebirrDetails = null) => {
  const type = accountTypeFor(method);
  const active = (await conn('finance_accounts')
    .where('status', 'Active')
    .where('account_type', type)
    .orderBy('id', 'asc'))
    || [];
  if (active.length === 0) return null;
  if (active.length === 1) return active[0];

  // For Bank type, try to match the provider tokens against the account's
  // bank_provider and the supplied bank name / account number.
  const bankName = String(
    (bankDetails && (bankDetails.bankName || bankDetails.bank_name)) || ''
  ).toLowerCase();
  const bankAccNo = String(
    (bankDetails && (bankDetails.accountNumber || bankDetails.account_number)) || ''
  ).toLowerCase();

  if (method === 'Bank' && (bankName || bankAccNo)) {
    const providerTokens = [
      { key: 'cbe',     names: ['cbe', 'commercial bank', 'commercial'] },
      { key: 'awash',   names: ['awash'] },
      { key: 'dashen',  names: ['dashen'] },
      { key: 'boa',     names: ['buna', 'bank of abyssinia', 'boa'] },
      { key: 'lib',     names: ['liberty', 'lib'] },
      { key: 'hibret',  names: ['hibret', 'hijra'] },
      { key: 'wegagen', names: ['wegagen'] },
      { key: 'aib',     names: ['awash international', 'aib'] },
    ];
    for (const acc of active) {
      const prov = String(acc.bank_provider || '').toLowerCase();
      if (bankAccNo && String(acc.account_number || '').toLowerCase() === bankAccNo) return acc;
      if (bankName) {
        const tokens = providerTokens.find(t => t.key === prov);
        if (tokens && tokens.names.some(n => bankName.includes(n))) return acc;
      }
    }
  }

  if (method === 'Telebirr' && telebirrDetails) {
    const teleNum = String(telebirrDetails.telebirrNumber || telebirrDetails.telebirr_number || '').toLowerCase();
    for (const acc of active) {
      if (teleNum && String(acc.account_number || '').toLowerCase() === teleNum) return acc;
    }
  }

  return active[0];
};

/**
 * Record income into the canonical finance ledger — ONE write that covers:
 *   1. finance_crvs        — the printable CRV voucher document
 *   2. finance_cashbook    — the single source of truth ledger (per account)
 *   3. finance_receivables — the Revenue Book row (so the same record appears
 *                            in Accounts & Reconciliation and the Revenue Book)
 *
 * @param {object} params
 * @returns {{crvId:number, crvNumber:string, receivableId:number, accountId:number|null,
 *            paymentMethod:string, accountType:string}}
 */
const recordIncomeToLedger = async ({
  trx,
  date,
  receivedFrom,
  amount,
  paymentMethod,
  description,
  referenceNo,
  receivableInvoiceNo,
  bankDetails,
  telebirrDetails,
  department = 'Manual CRV',
  extraCrvFields = {},
  extraReceivableDetails = {},
}) => {
  const conn = trx || db;
  const method = normalizePaymentMethod(paymentMethod);
  const today = new Date().toISOString().slice(0, 10);
  const pmtDate = date || today;

  const account = await resolveLedgerAccount(conn, method, bankDetails, telebirrDetails);

  const last = await conn('finance_crvs').orderBy('id', 'desc').first();
  const seq = (last && last.id ? last.id : 0) + 1;
  const crvNumber = `CRV-${pmtDate.slice(0, 4)}-${String(seq).padStart(4, '0')}`;

  const crvData = {
    crv_number: crvNumber,
    date: pmtDate,
    received_from: receivedFrom || 'Unknown',
    amount: parseFloat(amount || 0),
    payment_method: method,
    description: description || 'Income',
    reference_no: referenceNo || null,
  };

  if (method === 'Bank' && bankDetails) {
    crvData.bank_name = bankDetails.bankName || bankDetails.bank_name || null;
    crvData.account_holder = bankDetails.accountHolder || bankDetails.account_holder || null;
    crvData.account_number = bankDetails.accountNumber || bankDetails.account_number || null;
    crvData.cheque_no = bankDetails.chequeNo || bankDetails.cheque_no || null;
  }

  if (method === 'Telebirr' && telebirrDetails) {
    crvData.telebirr_number = telebirrDetails.telebirrNumber || telebirrDetails.telebirr_number || null;
    crvData.telebirr_name = telebirrDetails.fullName || telebirrDetails.telebirr_name || receivedFrom || null;
  }

  const [crvId] = await conn('finance_crvs').insert({ ...crvData, ...extraCrvFields });

  await conn('finance_cashbook').insert({
    date: crvData.date,
    type: 'CRV',
    reference: crvNumber,
    description: `${crvData.description}`.slice(0, 255),
    receipts: crvData.amount,
    payments: 0,
    payment_method: method,
    account_id: account ? account.id : null,
    account_name: account ? account.account_name : null,
    source: department,
    received_from: crvData.received_from,
  });

  const receivableKey = receivableInvoiceNo || referenceNo || crvNumber;
  const manualDetails = {
    paymentMethod: method,
    receivedFrom: crvData.received_from,
    amount: crvData.amount,
    reference: referenceNo || crvNumber,
    crvNumber,
    department,
    ...extraReceivableDetails,
  };

  // Revenue Book (finance_receivables) — never duplicate a row for the same
  // department + invoice number. Modules that pre-charge an order (e.g. Car
  // Rental booking) may already have synced a row keyed by their order number;
  // approving the income must UPDATE that row to Paid instead of inserting a
  // second one (which would double-count the Revenue Book / outstanding AR).
  const existingReceivable = await conn('finance_receivables')
    .where('invoice_no', receivableKey)
    .andWhere('department_source', department)
    .first();

  let receivableId = null;
  if (existingReceivable) {
    await conn('finance_receivables').where('id', existingReceivable.id).update({
      customer_name: crvData.received_from,
      invoice_date: crvData.date,
      due_date: crvData.date,
      amount_paid: crvData.amount,
      outstanding_balance: 0,
      status: 'Paid',
      manual_details: JSON.stringify(manualDetails),
      updated_at: new Date(),
    });
    receivableId = existingReceivable.id;
  } else {
    const [insertedId] = await conn('finance_receivables').insert({
      customer_name: crvData.received_from,
      invoice_no: receivableInvoiceNo,
      invoice_date: crvData.date,
      due_date: crvData.date,
      total_amount: crvData.amount,
      amount_paid: crvData.amount,
      outstanding_balance: 0,
      status: 'Paid',
      department_source: department,
      manual_details: JSON.stringify(manualDetails),
    });
    receivableId = insertedId;
  }

  return {
    crvId,
    crvNumber,
    receivableId,
    accountId: account ? account.id : null,
    paymentMethod: method,
    accountType: accountTypeFor(method),
  };
};

module.exports = {
  normalizePaymentMethod,
  accountTypeFor,
  resolveLedgerAccount,
  recordIncomeToLedger,
};