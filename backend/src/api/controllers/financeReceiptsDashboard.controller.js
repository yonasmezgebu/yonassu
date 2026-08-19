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

  // Modules whose invoices/receipts are recorded in the shared
  // sales_invoices / sales_receipts tables (invoice at order time, receipt at
  // payment verification). Online vs walk-in comes from sales_invoices.sale_type.
  const invoiceBuilder = async ({ source, sourceLabel, icon, color }) => {
    const m = makeModule(source, sourceLabel, icon, color);
    const invoices = await inRange(
      db('sales_invoices').where('source', source).andWhereNot('status', 'cancelled'),
      'created_at'
    ).select('sale_type', 'total_amount');
    m.invoices = invoices.length;
    m.value = round2(invoices.reduce((s, r) => s + asNum(r.total_amount), 0));
    for (const r of invoices) {
      const isOnline = String(r.sale_type || '').toLowerCase() === 'online';
      if (isOnline) { m.online.invoices += 1; m.online.value += asNum(r.total_amount); }
      else { m.walkIn.invoices += 1; m.walkIn.value += asNum(r.total_amount); }
    }
    m.online.value = round2(m.online.value);
    m.walkIn.value = round2(m.walkIn.value);

    const receipts = await inRange(
      db('sales_receipts as r')
        .join('sales_invoices as i', 'r.invoice_id', 'i.id')
        .where('i.source', source)
        .andWhereNot('i.status', 'cancelled')
        .andWhereNot('r.status', 'cancelled'),
      'r.created_at'
    ).count({ n: '*' }).first();
    m.receipts = receipts ? parseInt(receipts.n || 0, 10) : 0;
    return m;
  };

  // ── 1. Retail & POS ──
  const retail = await invoiceBuilder({ source: 'retail', sourceLabel: 'Retail & POS', icon: '🛒', color: '#2563EB' });
  // ── 2. Pharmacy ──
  const pharmacy = await invoiceBuilder({ source: 'pharmacy', sourceLabel: 'Pharmacy', icon: '💊', color: '#059669' });
  // ── 3. Printing ──
  const printing = await invoiceBuilder({ source: 'printing', sourceLabel: 'Printing', icon: '🖨️', color: '#D97706' });
  // ── 4. Car Rental ──
  const rental = await invoiceBuilder({ source: 'car_rental', sourceLabel: 'Car Rental', icon: '🚗', color: '#7C3AED' });

  // ── 5. AgriRent (kept on its own order table — outside the unified scope) ──
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
