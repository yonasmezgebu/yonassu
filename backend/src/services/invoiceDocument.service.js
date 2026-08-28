const { db } = require('../config/database');
const vatConfigService = require('./vatConfig.service');
const SettingsRepository = require('../repositories/settings.repository');
const { generateReceiptNumber } = require('../utils/orderNumber');

const settingsRepo = new SettingsRepository();

const asNum = (v) => parseFloat(v || 0) || 0;
const round2 = (n) => Math.round(n * 100) / 100;
const pad = (n, w = 6) => String(n).padStart(w, '0');

const COMPANY_KEYS = {
  name: 'company_name',
  address: 'company_address',
  phone: 'company_phone',
  tin: 'company_tin',
  vatReg: 'company_vat_reg'
};
const SOURCE_PREFIX = {
  retail: 'RTL',
  pharmacy: 'PHA',
  printing: 'PRT',
  car_rental: 'RNT',
  agrirent: 'AGR',
  tender_sell: 'TSD',
  tender_buy: 'TBY'
};
const DEFAULT_COMPANY = {
  name: 'SUTANA Trading',
  address: '',
  phone: '',
  tin: '',
  vatReg: ''
};

/* ── Company profile (stored in settings table) ──────────────────────────── */
const getCompanyInfo = async () => {
  const out = { ...DEFAULT_COMPANY };
  for (const [field, key] of Object.entries(COMPANY_KEYS)) {
    const v = await settingsRepo.getValue(key, '');
    if (v) out[field] = v;
  }
  return out;
};

const saveCompanyInfo = async (info, userId) => {
  for (const [field, key] of Object.entries(COMPANY_KEYS)) {
    const val = info && info[field] != null ? String(info[field]) : '';
    await settingsRepo.setValue(key, val, 'Company', `Company profile — ${field}`, userId || null);
  }
  return getCompanyInfo();
};

/* ── Per-item tax treatment via the central VAT service ──────────────────── */
// Every line gets its applicable treatment (standard / exempt / zero_rated)
// from the CEO-configured tax mappings — never a hard-coded 15%.
const computeDocument = async ({ source, sourceLabel, icon, color, saleId, invoiceNo, receiptNo, date, customer, paymentMethod, amountPaid, seller, receivedBy, lines, reference, description }) => {
  const { subtotal, vat, rows } = await vatConfigService.computeVatForItems(
    source,
    lines.map((l) => ({ itemId: l.itemId, amount: l.amount }))
  );

  const items = lines.map((l, i) => {
    const r = rows[i];
    return {
      name: l.name,
      qty: l.qty,
      unitPrice: round2(l.unitPrice),
      rate: r.rate,
      treatment: r.treatment,
      vat: round2(r.vat),
      amount: round2(l.amount + r.vat)
    };
  });

  let vatStandard = 0;
  let vatExempt = 0;
  let vatZeroRated = 0;
  let vatStandardRate = 0.15;
  for (const r of rows) {
    if (r.treatment === 'exempt') vatExempt += r.vat;
    else if (r.treatment === 'zero_rated') vatZeroRated += r.vat;
    else { vatStandard += r.vat; vatStandardRate = r.rate; }
  }
  vatStandard = round2(vatStandard);
  vatExempt = round2(vatExempt);
  vatZeroRated = round2(vatZeroRated);

  const total = round2(subtotal + vat);
  const paid = asNum(amountPaid);
  const balance = round2(paid - total);

  return {
    id: `${source}-${saleId}`,
    source,
    sourceLabel,
    icon,
    color,
    saleId,
    invoiceNo: invoiceNo || `${sourceLabel}-${saleId}`,
    receiptNo: receiptNo || `REC-${SOURCE_PREFIX[source] || 'GEN'}-${pad(saleId)}`,
    date,
    customer: customer || 'Walk-in Customer',
    customerTin: '',
    paymentMethod: paymentMethod || 'Cash',
    amountPaid: paid,
    total,
    balance,
    subtotal: round2(subtotal),
    vatStandard,
    vatStandardRate,
    vatExempt,
    vatZeroRated,
    vatTotal: round2(vat),
    items,
    seller: seller || '',
    receivedBy: receivedBy || seller || '',
    reference: reference || null,
    description: description || `Payment for goods/services — ${sourceLabel}`
  };
};

const findUser = async (id) => {
  if (!id) return '';
  const u = await db('users').where('id', id).first();
  return u ? (u.full_name || u.fullName || '') : '';
};

/* ── Source builders ─────────────────────────────────────────────────────── */

// 1-4. Retail & POS, Pharmacy, Printing, Car Rental
// All read from the persisted sales_invoices / sales_receipts tables so the
// dashboard reflects exactly what the modules recorded (invoice at order time,
// receipt when payment was verified).
const invoiceDocumentsFromSalesInvoices = async ({ source, sourceLabel, icon, color, description }) => {
  const docs = [];
  const invoices = await db('sales_invoices')
    .where('source', source)
    .andWhereNot('status', 'cancelled')
    .orderBy('created_at', 'desc');

  for (const inv of invoices) {
    const items = await db('sales_invoice_items').where('invoice_id', inv.id);
    const receipt = await db('sales_receipts').where('invoice_id', inv.id).andWhereNot('status', 'cancelled').first();

    const lines = items.map(it => ({
      itemId: it.item_id,
      name: it.name,
      qty: it.qty,
      unitPrice: asNum(it.unit_price),
      costPrice: it.cost_price != null ? asNum(it.cost_price) : null,
      rate: asNum(it.rate),
      treatment: it.treatment,
      vat: asNum(it.vat_amount),
      amount: asNum(it.total)
    }));

    const amountPaid = receipt ? asNum(receipt.amount_paid) : 0;
    const total = asNum(inv.total_amount);
    const balance = round2(amountPaid - total);

    docs.push({
      id: inv.id,
      source: inv.source,
      sourceLabel,
      icon,
      color,
      saleId: inv.sale_id,
      invoiceNo: inv.invoice_no,
      receiptNo: receipt ? receipt.receipt_no : null,
      date: inv.created_at,
      customer: inv.customer_name || 'Walk-in Customer',
      customerTin: inv.customer_tin || '',
      paymentMethod: receipt ? (receipt.payment_method || 'Cash') : 'Pending',
      amountPaid,
      total,
      balance,
      subtotal: asNum(inv.subtotal),
      vatStandard: asNum(inv.vat_standard),
      vatStandardRate: asNum(inv.vat_standard_rate) || 0.15,
      vatExempt: asNum(inv.vat_exempt),
      vatZeroRated: asNum(inv.vat_zero_rated),
      vatTotal: asNum(inv.vat_total),
      items: lines,
      seller: inv.created_by_name || '',
      receivedBy: receipt ? (receipt.received_by_name || inv.created_by_name || '') : '',
      reference: receipt ? receipt.payment_reference : null,
      description
    });
  }
  return docs;
};

const retailDocuments = () =>
  invoiceDocumentsFromSalesInvoices({ source: 'retail', sourceLabel: 'Retail & POS', icon: '🛒', color: '#2563EB', description: 'Retail & POS sale' });

const pharmacyDocuments = () =>
  invoiceDocumentsFromSalesInvoices({ source: 'pharmacy', sourceLabel: 'Pharmacy', icon: '💊', color: '#059669', description: 'Pharmacy sale' });

const printingDocuments = () =>
  invoiceDocumentsFromSalesInvoices({ source: 'printing', sourceLabel: 'Printing', icon: '🖨️', color: '#D97706', description: 'Printing order' });

const rentalDocuments = () =>
  invoiceDocumentsFromSalesInvoices({ source: 'car_rental', sourceLabel: 'Car Rental', icon: '🚗', color: '#7C3AED', description: 'Car rental order' });

// 5. AgriRent
const agrirentDocuments = async () => {
  const docs = [];
  const rows = await db('agrirent_orders')
    .whereNull('deleted_at').whereIn('payment_status', ['Confirmed', 'PAID']).where('status', 'completed')
    .orderBy('created_at', 'desc').select('*');
  for (const r of rows) {
    const days = asNum(r.total_days) || 1;
    const unitPrice = asNum(r.daily_rate) || 0;
    const amount = asNum(r.subtotal) || unitPrice * days;
    const lines = [{ itemId: r.tractor_id, name: 'Tractor Rental', qty: days, unitPrice, amount }];
    docs.push(await computeDocument({
      source: 'agrirent', sourceLabel: 'AgriRent', icon: '🚜', color: '#16A34A',
      saleId: r.id, invoiceNo: r.order_number, date: r.created_at,
      customer: r.customer_name || '', paymentMethod: r.payment_method || 'Telebirr',
      amountPaid: asNum(r.total_amount),
      seller: await findUser(r.created_by), receivedBy: await findUser(r.created_by),
      lines, reference: r.payment_reference, description: 'AgriRent order'
    }));
  }
  return docs;
};

// 6. Tender Sell (awarded bids)
const tenderSellDocuments = async () => {
  const docs = [];
  const rows = await db('bids').where('status', 'awarded').where('ceo_approval_status', 'approved')
    .orderBy('submitted_at', 'desc').select('*');
  for (const b of rows) {
    const tender = await db('tenders').where('id', b.tender_id).first();
    let itemsArr = [];
    try { itemsArr = JSON.parse(b.items) || []; } catch { itemsArr = []; }
    let lines;
    if (itemsArr.length) {
      lines = itemsArr.map((it) => {
        const u = (asNum(it.bidPriceBirr) || 0) + (asNum(it.bidPriceCent) || 0) / 100;
        const q = asNum(it.quantity) || 1;
        return { itemId: it.id, name: (tender && tender.item_name) || 'Tender item', qty: q, unitPrice: u, amount: u * q };
      });
    } else {
      lines = [{
        itemId: b.tender_id,
        name: tender ? tender.title : 'Tender',
        qty: 1,
        unitPrice: asNum(b.total_bid_value),
        amount: asNum(b.total_bid_value)
      }];
    }
    docs.push(await computeDocument({
      source: 'tender_sell', sourceLabel: 'Tender Sell', icon: '📤', color: '#0EA5E9',
      saleId: b.id, invoiceNo: tender ? tender.reference_number : `TND-${b.tender_id}`,
      date: b.submitted_at, customer: b.bidder_full_name || b.bidder_email || '',
      paymentMethod: 'Cash / Bank', amountPaid: asNum(b.total_bid_value),
      seller: '', receivedBy: '',
      lines, description: 'Tender award sale'
    }));
  }
  return docs;
};

// 7. Tender Buy (approved fund requests)
const tenderBuyDocuments = async () => {
  const docs = [];
  const funds = await db('public_fund_requests').whereIn('status', ['READY_FOR_PAYMENT', 'PAID', 'APPROVED'])
    .orderBy('created_at', 'desc').select('*');
  for (const f of funds) {
    const raw = await db('public_fund_request_items').where('fund_request_id', f.id);
    const pays = await db('public_payments').where('fund_request_id', f.id).where('status', 'PAID');
    const amountPaid = pays.reduce((a, p) => a + asNum(p.amount), 0) || asNum(f.total_amount);
    const lines = [];
    for (const it of raw) {
      const t = await db('public_tenders').where('id', it.public_tender_id).first();
      lines.push({
        itemId: it.public_tender_id,
        name: (t && t.title) || 'Tender item',
        qty: 1,
        unitPrice: asNum(it.amount),
        amount: asNum(it.amount)
      });
    }
    if (!lines.length) {
      lines.push({ itemId: null, name: 'Procurement', qty: 1, unitPrice: asNum(f.total_amount), amount: asNum(f.total_amount) });
    }
    docs.push(await computeDocument({
      source: 'tender_buy', sourceLabel: 'Tender Buy', icon: '📥', color: '#EF4444',
      saleId: f.id, invoiceNo: f.request_code, date: f.created_at,
      customer: await findUser(f.created_by), paymentMethod: 'Bank Transfer',
      amountPaid,
      seller: '', receivedBy: '',
      lines, description: 'Tender procurement'
    }));
  }

  const pfunds = await db('procurement_fund_requests').where('status', 'approved')
    .orderBy('created_at', 'desc').select('*');
  for (const f of pfunds) {
    const lines = [{ itemId: f.tender_id, name: 'Drug Procurement', qty: 1, unitPrice: asNum(f.total_amount), amount: asNum(f.total_amount) }];
    docs.push(await computeDocument({
      source: 'tender_buy', sourceLabel: 'Tender Buy', icon: '📥', color: '#EF4444',
      saleId: f.id, invoiceNo: f.pr_no || f.tender_no, date: f.created_at,
      customer: f.requested_by_name || '', paymentMethod: 'Bank Transfer',
      amountPaid: asNum(f.total_amount),
      seller: '', receivedBy: '',
      lines, description: 'Drug procurement'
    }));
  }
  return docs;
};

/* ── Shared helpers: create sales_invoices + sales_receipts for any module ── */

// Compute VAT for a set of invoice lines. Each line may carry an explicit
// `rate`/`treatment` override (e.g. a module already computed its own VAT or a
// zero-rated delivery fee); otherwise the central VAT service resolves it.
const computeVatForLines = async (source, lines, fallbackRate = null) => {
  let subtotal = 0, vat = 0;
  const rows = [];
  for (const l of lines) {
    const amount = asNum(l.amount);
    let r;
    if (l.rate != null) {
      const rate = parseFloat(l.rate);
      const treatment = l.treatment || (rate === 0 ? 'zero_rated' : 'standard');
      r = { treatment, rate, sub: amount, vat: amount * rate, total: amount + amount * rate };
    } else {
      r = await vatConfigService.computeVatForItem(source, l.itemId, amount, fallbackRate);
    }
    subtotal += r.sub;
    vat += r.vat;
    rows.push(r);
  }
  return { subtotal, vat, total: subtotal + vat, rows };
};

const createSalesInvoice = async (trx, { source, saleId, saleType, invoiceNo, date, customer, customerTin, lines, createdBy, fallbackRate }) => {
  const { subtotal, vat, rows } = await computeVatForLines(source, lines, fallbackRate);

  let vatStandard = 0, vatExempt = 0, vatZeroRated = 0, vatStandardRate = 0.15;
  for (const r of rows) {
    if (r.treatment === 'exempt') vatExempt += r.vat;
    else if (r.treatment === 'zero_rated') vatZeroRated += r.vat;
    else { vatStandard += r.vat; vatStandardRate = r.rate; }
  }

  const invoiceId = `${source}-${saleId}-${Date.now().toString().slice(-4)}`;
  const total = round2(subtotal + vat);

  const invoiceRow = {
    id: invoiceId,
    invoice_no: invoiceNo,
    source,
    sale_id: saleId,
    customer_name: customer || 'Walk-in Customer',
    customer_tin: customerTin || null,
    subtotal: round2(subtotal),
    vat_standard: round2(vatStandard),
    vat_standard_rate: vatStandardRate,
    vat_exempt: round2(vatExempt),
    vat_zero_rated: round2(vatZeroRated),
    vat_total: round2(vat),
    total_amount: total,
    status: 'active',
    created_by_name: createdBy || 'System',
    created_at: date || db.fn.now(),
    updated_at: db.fn.now()
  };
  if (saleType) invoiceRow.sale_type = saleType;
  await trx('sales_invoices').insert(invoiceRow);

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const r = rows[i];
    await trx('sales_invoice_items').insert({
      invoice_id: invoiceId,
      item_id: l.itemId || 0,
      name: l.name,
      qty: l.qty || 1,
      unit_price: round2(l.unitPrice),
      cost_price: l.costPrice != null ? round2(l.costPrice) : null,
      treatment: r.treatment,
      rate: r.rate,
      vat_amount: round2(r.vat),
      subtotal: round2(l.amount),
      total: round2(l.amount + r.vat)
    });
    if (round2(r.vat) > 0 || round2(l.amount) > 0) {
      await trx('vat_transactions').insert({
        type: 'output',
        source,
        source_id: saleId,
        item_name: l.name,
        qty: l.qty || 1,
        selling_price: round2(l.unitPrice),
        cost_price: l.costPrice != null ? round2(l.costPrice) : 0,
        vat_rate: r.rate || 0,
        vat_amount: round2(r.vat),
        treatment: r.treatment || 'standard',
        reference_no: invoiceNo
      });
    }
  }

  return { invoiceId, total };
};

// Idempotent wrappers used by the module controllers — safe to call even when
// an invoice/receipt already exists for the same order.
const findInvoiceForOrder = (trx, source, saleId) =>
  trx('sales_invoices').where({ source, sale_id: saleId }).andWhereNot('status', 'cancelled').first();

const recordInvoiceForOrder = async (trx, params) => {
  const existing = await findInvoiceForOrder(trx, params.source, params.saleId);
  if (existing) return { invoiceId: existing.id, total: asNum(existing.total_amount), existed: true };
  return createSalesInvoice(trx, params);
};

const recordReceiptForOrder = async (trx, { invoiceId, amountPaid, paymentMethod, paymentReference, receivedBy }) => {
  const existing = await trx('sales_receipts').where({ invoice_id: invoiceId }).andWhereNot('status', 'cancelled').first();
  if (existing) return { receiptId: existing.id, receiptNo: existing.receipt_no, existed: true };
  return createSalesReceipt(trx, { invoiceId, amountPaid, paymentMethod, paymentReference, receivedBy });
};

const createSalesReceipt = async (trx, { invoiceId, amountPaid, paymentMethod, paymentReference, receivedBy }) => {
  const receiptId = `REC-${invoiceId}-${Date.now().toString().slice(-4)}`;
  const receiptNo = await generateReceiptNumber();

  await trx('sales_receipts').insert({
    id: receiptId,
    receipt_no: receiptNo,
    invoice_id: invoiceId,
    amount_paid: round2(amountPaid),
    payment_method: paymentMethod || 'Cash',
    payment_reference: paymentReference || null,
    received_by_name: receivedBy || 'System',
    status: 'active',
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  return { receiptId, receiptNo };
};

/* ── Main: build all invoice + receipt documents ─────────────────────────── */
// status: 'all' | 'unpaid' | 'paid' (default 'all')
// customer: optional string to filter by customer name (case-insensitive)
// sources: optional array of source keys to include (default all)
const buildDocuments = async ({ status = 'all', customer = '', sources = null } = {}) => {
  const buildFns = {
    retail: retailDocuments,
    pharmacy: pharmacyDocuments,
    printing: printingDocuments,
    car_rental: rentalDocuments,
    agrirent: agrirentDocuments,
    tender_sell: tenderSellDocuments,
    tender_buy: tenderBuyDocuments
  };
  const keys = sources && sources.length ? sources : Object.keys(buildFns);
  const [company, ...results] = await Promise.all([
    getCompanyInfo(),
    ...keys.map((k) => buildFns[k]())
  ]);
  let documents = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (customer) {
    const q = customer.toLowerCase();
    documents = documents.filter((d) => (d.customer || '').toLowerCase().includes(q));
  }
  if (status === 'unpaid') {
    documents = documents.filter((d) => d.balance < -0.001);
  } else if (status === 'paid') {
    documents = documents.filter((d) => d.balance >= -0.001);
  }
  return { company, documents };
};

module.exports = {
  getCompanyInfo,
  saveCompanyInfo,
  buildDocuments,
  createSalesInvoice,
  createSalesReceipt,
  recordInvoiceForOrder,
  recordReceiptForOrder,
  findInvoiceForOrder
};
