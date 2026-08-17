const { db } = require('../config/database');
const vatConfigService = require('./vatConfig.service');
const SettingsRepository = require('../repositories/settings.repository');

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

// 1. Retail & POS (pos_sales completed + retail_transactions)
const retailDocuments = async () => {
  const docs = [];
  const invoices = await db('sales_invoices')
    .where('source', 'retail')
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
      sourceLabel: 'Retail & POS',
      icon: '🛒',
      color: '#2563EB',
      saleId: inv.sale_id,
      invoiceNo: inv.invoice_no,
      receiptNo: receipt ? receipt.receipt_no : null,
      date: inv.created_at,
      customer: inv.customer_name || 'Walk-in Customer',
      customerTin: inv.customer_tin || '',
      paymentMethod: receipt ? (receipt.payment_method || 'Cash') : 'Pending',
      amountPaid: amountPaid,
      total: total,
      balance: balance,
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
      description: 'Retail & POS sale'
    });
  }
  return docs;
};

// 2. Pharmacy
const pharmacyDocuments = async () => {
  const docs = [];
  const sales = await db('pharmacy_sales').whereNot('sale_type', 'RETURNED').orderBy('created_at', 'desc').select('*');
  for (const s of sales) {
    const raw = await db('pharmacy_sale_items').where('sale_id', s.id);
    const payments = await db('pharmacy_payments').where('sale_id', s.id);
    const amountPaid = payments.reduce((a, p) => a + asNum(p.amount), 0) || asNum(s.total_amount);
    const lines = [];
    for (const it of raw) {
      const drug = await db('pharmacy_medications').where('name', it.drug_name).first();
      lines.push({
        itemId: drug ? drug.id : null,
        name: it.drug_name,
        qty: asNum(it.quantity) || 1,
        unitPrice: asNum(it.unit_price) || 0,
        amount: asNum(it.total_price) || asNum(it.unit_price) * (asNum(it.quantity) || 1)
      });
    }
    if (!lines.length) {
      lines.push({ itemId: null, name: 'Pharmacy Sale', qty: 1, unitPrice: asNum(s.total_amount), amount: asNum(s.total_amount) });
    }
    const pm = payments[0] || {};
    docs.push(await computeDocument({
      source: 'pharmacy', sourceLabel: 'Pharmacy', icon: '💊', color: '#059669',
      saleId: s.id, invoiceNo: s.receipt_no, receiptNo: s.receipt_no,
      date: s.created_at, customer: s.recipient_name || '',
      paymentMethod: pm.payment_method || 'Cash',
      amountPaid,
      seller: pm.worker_name || '', receivedBy: pm.worker_name || '',
      lines, description: 'Pharmacy sale'
    }));
  }
  return docs;
};

// 3. Printing
const printingDocuments = async () => {
  const docs = [];
  const orders = await db('printing_orders')
    .whereNull('deleted_at').whereIn('payment_status', ['Confirmed', 'PAID']).whereNotIn('status_id', [9])
    .orderBy('created_at', 'desc').select('*');
  for (const o of orders) {
    const pt = await db('printing_product_types').where('name', o.product_type).first();
    const qty = asNum(o.quantity) || 1;
    const unitPrice = asNum(o.price_per_unit) || 0;
    const lineAmount = asNum(o.subtotal) || unitPrice * qty;
    const lines = [{
      itemId: pt ? pt.id : null,
      name: `${o.product_type} (${o.paper_type}, ${o.pages_per_copy}pp, ${o.color_printing ? 'Color' : 'B&W'}, ${o.binding_type})`,
      qty,
      unitPrice,
      amount: lineAmount
    }];
    docs.push(await computeDocument({
      source: 'printing', sourceLabel: 'Printing', icon: '🖨️', color: '#D97706',
      saleId: o.id, invoiceNo: o.order_number, date: o.created_at,
      customer: '', paymentMethod: o.payment_method || 'Cash',
      amountPaid: asNum(o.total_price),
      seller: await findUser(o.created_by), receivedBy: await findUser(o.created_by),
      lines, reference: o.payment_reference, description: 'Printing order'
    }));
  }
  return docs;
};

// 4. Car Rental
const rentalDocuments = async () => {
  const docs = [];
  const rows = await db('rental_orders')
    .whereNull('deleted_at').where('payment_status', 'PAID').whereNotIn('status', ['CANCELLED', 'ABANDONED', 'REJECTED'])
    .orderBy('created_at', 'desc').select('*');
  for (const r of rows) {
    const days = asNum(r.total_days) || 1;
    const unitPrice = asNum(r.daily_rate) || 0;
    const rentalAmt = asNum(r.rental_amount) || unitPrice * days;
    const lines = [{ itemId: r.car_id, name: 'Car Rental', qty: days, unitPrice, amount: rentalAmt }];
    docs.push(await computeDocument({
      source: 'car_rental', sourceLabel: 'Car Rental', icon: '🚗', color: '#7C3AED',
      saleId: r.id, invoiceNo: r.order_number, date: r.created_at,
      customer: r.customer_name || '', paymentMethod: r.payment_method || 'Cash',
      amountPaid: asNum(r.total_amount),
      seller: '', receivedBy: '',
      lines, description: 'Car rental order'
    }));
  }
  return docs;
};

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

module.exports = { getCompanyInfo, saveCompanyInfo, buildDocuments };
