const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');

const asNum = (v) => parseFloat(v || 0) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

const makeModule = (key, label, icon, color) => ({
  key,
  label,
  icon,
  color,
  invoices: 0,
  receipts: 0,
  value: 0,
  online: { invoices: 0, value: 0 },
  walkIn: { invoices: 0, value: 0 }
});

const getDashboard = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const inRange = (qb, col) => {
    let q = qb;
    if (startDate) q = q.where(col, '>=', new Date(startDate));
    if (endDate) q = q.where(col, '<=', new Date(endDate));
    return q;
  };

  // ── 1. Retail & POS (pos_sales completed + retail_transactions) ──
  const retail = makeModule('retail', 'Retail & POS', '🛒', '#2563EB');
  const completedSale = await db('sale_statuses').where('status_code', 'completed').first();
  const posRows = completedSale
    ? await inRange(db('pos_sales').where({ status_id: completedSale.id }).whereNull('deleted_at'), 'sale_date')
        .select('total_amount', 'sale_type')
    : [];
  const retRows = await inRange(db('retail_transactions'), 'created_at').select('total_amount', 'sale_type');
  const retailEntries = [
    ...posRows.map((r) => ({ v: asNum(r.total_amount), online: String(r.sale_type).toLowerCase() === 'online' })),
    ...retRows.map((r) => ({ v: asNum(r.total_amount), online: String(r.sale_type).toUpperCase() === 'ONLINE' }))
  ];
  retail.invoices = retailEntries.length;
  retail.receipts = retailEntries.length;
  retail.value = round2(retailEntries.reduce((s, e) => s + e.v, 0));
  for (const e of retailEntries) {
    if (e.online) { retail.online.invoices += 1; retail.online.value += e.v; }
    else { retail.walkIn.invoices += 1; retail.walkIn.value += e.v; }
  }
  retail.online.value = round2(retail.online.value);
  retail.walkIn.value = round2(retail.walkIn.value);

  // ── 2. Pharmacy (sales excluding returns; payments = receipts) ──
  const pharmacy = makeModule('pharmacy', 'Pharmacy', '💊', '#059669');
  const phRows = await inRange(db('pharmacy_sales').whereNot('sale_type', 'RETURNED'), 'created_at').select('total_amount', 'sale_type');
  const phPayments = await db('pharmacy_payments').whereIn('status', ['PAID', 'CASHOUT']).count({ n: '*' }).first();
  pharmacy.invoices = phRows.length;
  pharmacy.receipts = phPayments ? parseInt(phPayments.n || 0, 10) : 0;
  pharmacy.value = round2(phRows.reduce((s, r) => s + asNum(r.total_amount), 0));
  for (const r of phRows) {
    const isOnline = String(r.sale_type).toUpperCase() === 'ONLINE';
    const v = asNum(r.total_amount);
    if (isOnline) { pharmacy.online.invoices += 1; pharmacy.online.value += v; }
    else { pharmacy.walkIn.invoices += 1; pharmacy.walkIn.value += v; }
  }
  pharmacy.online.value = round2(pharmacy.online.value);
  pharmacy.walkIn.value = round2(pharmacy.walkIn.value);

  // ── 3. Printing (payment confirmed) ──
  const printing = makeModule('printing', 'Printing', '🖨️', '#D97706');
  const printRows = await inRange(
    db('printing_orders')
      .whereNull('deleted_at')
      .whereIn('payment_status', ['Confirmed', 'PAID'])
      .whereNotIn('status_id', [9]),
    'created_at'
  ).select('total_price');
  printing.invoices = printRows.length;
  printing.receipts = printRows.length;
  printing.value = round2(printRows.reduce((s, r) => s + asNum(r.total_price), 0));

  // ── 4. Car Rental (paid, not cancelled/abandoned/rejected) ──
  const rental = makeModule('rental', 'Car Rental', '🚗', '#7C3AED');
  const rentRows = await inRange(
    db('rental_orders')
      .whereNull('deleted_at')
      .where('payment_status', 'PAID')
      .whereNotIn('status', ['CANCELLED', 'ABANDONED', 'REJECTED']),
    'created_at'
  ).select('total_amount');
  rental.invoices = rentRows.length;
  rental.receipts = rentRows.length;
  rental.value = round2(rentRows.reduce((s, r) => s + asNum(r.total_amount), 0));

  // ── 5. AgriRent (payment confirmed + completed) ──
  const agrirent = makeModule('agrirent', 'AgriRent', '🚜', '#16A34A');
  const agriRows = await inRange(
    db('agrirent_orders')
      .whereNull('deleted_at')
      .whereIn('payment_status', ['Confirmed', 'PAID'])
      .where('status', 'completed'),
    'created_at'
  ).select('total_amount', 'is_manual');
  agrirent.invoices = agriRows.length;
  agrirent.receipts = agriRows.length;
  agrirent.value = round2(agriRows.reduce((s, r) => s + asNum(r.total_amount), 0));
  for (const r of agriRows) {
    const v = asNum(r.total_amount);
    if (r.is_manual) { agrirent.walkIn.invoices += 1; agrirent.walkIn.value += v; }
    else { agrirent.online.invoices += 1; agrirent.online.value += v; }
  }
  agrirent.online.value = round2(agrirent.online.value);
  agrirent.walkIn.value = round2(agrirent.walkIn.value);

  // ── 6. Tender Sell (awarded bids, CEO approved) ──
  const tenderSell = makeModule('tenderSell', 'Tender Sell (Sales)', '📤', '#0EA5E9');
  const sellRows = await inRange(
    db('bids').where('status', 'awarded').where('ceo_approval_status', 'approved'),
    'submitted_at'
  ).select('total_bid_value');
  tenderSell.invoices = sellRows.length;
  tenderSell.receipts = sellRows.length;
  tenderSell.value = round2(sellRows.reduce((s, r) => s + asNum(r.total_bid_value), 0));

  // ── 7. Tender Buy (approved fund requests; payments = receipts) ──
  const tenderBuy = makeModule('tenderBuy', 'Tender Buy (Procurement)', '📥', '#EF4444');
  const [buyFunds, drugFunds, buyPayments] = await Promise.all([
    inRange(db('public_fund_requests').whereIn('status', ['READY_FOR_PAYMENT', 'PAID', 'APPROVED']), 'created_at').select('total_amount'),
    inRange(db('procurement_fund_requests').where('status', 'approved'), 'created_at').select('total_amount'),
    db('public_payments').where('status', 'PAID').count({ n: '*' }).first()
  ]);
  tenderBuy.invoices = buyFunds.length + drugFunds.length;
  tenderBuy.receipts = buyPayments ? parseInt(buyPayments.n || 0, 10) : 0;
  tenderBuy.value = round2([...buyFunds, ...drugFunds].reduce((s, r) => s + asNum(r.total_amount), 0));

  // ── Summary ──
  const modules = [retail, pharmacy, printing, rental, agrirent, tenderSell, tenderBuy];
  const totalInvoices = modules.reduce((s, m) => s + m.invoices, 0);
  const totalReceipts = modules.reduce((s, m) => s + m.receipts, 0);
  const totalValue = round2(modules.reduce((s, m) => s + m.value, 0));
  const online = {
    invoices: modules.reduce((s, m) => s + m.online.invoices, 0),
    value: round2(modules.reduce((s, m) => s + m.online.value, 0))
  };
  const walkIn = {
    invoices: modules.reduce((s, m) => s + m.walkIn.invoices, 0),
    value: round2(modules.reduce((s, m) => s + m.walkIn.value, 0))
  };

  res.json({
    status: 'success',
    data: {
      generatedAt: new Date().toISOString(),
      summary: { totalInvoices, totalReceipts, totalValue, online, walkIn },
      modules
    }
  });
});

module.exports = { getDashboard };
