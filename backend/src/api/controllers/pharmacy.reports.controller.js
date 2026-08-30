const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { HTTP_STATUS } = require('../../utils/constants');

const reportsController = {

  // ─────────────────────────────────────────────────
  // CEO REPORT
  // GET /pharmacy-reports/ceo
  // ─────────────────────────────────────────────────
  getCEOReport: async (req, res) => {
    const { date } = req.query; // optional date filter e.g. 2025-07-30

    // 1. Direct Deliveries (pending CEO decision or CEO-actioned)
    let deliveriesQ = db('pharmacy_direct_deliveries as dd')
      .select(
        'dd.id', 'dd.delivery_no', 'dd.supplier_name', 'dd.drug_name',
        'dd.quantity', 'dd.total_amount', 'dd.status',
        'dd.ceo_notes', 'dd.created_at', 'dd.updated_at'
      )
      .orderBy('dd.created_at', 'desc');

    if (date) {
      deliveriesQ = deliveriesQ.whereRaw('DATE(dd.created_at) = ?', [date]);
    }

    const deliveries = await deliveriesQ;

    // 2. Manager Requests (price/quantity change requests)
    const managerRequests = await db('pharmacy_manager_requests')
      .orderBy('created_at', 'desc')
      .select(
        'id', 'drug_name', 'drug_id', 'drug_image',
        'request_type', 'current_value', 'requested_value',
        'ceo_value', 'reason', 'status', 'created_at', 'requested_by'
      );

    // 3. Expired Drugs
    const expiredDrugs = await db('pharmacy_expired_drugs')
      .select(
        'id', 'drug_name', 'quantity', 'expiry_date', 'action_required',
        'status', 'ceo_notes', 'created_at'
      )
      .orderBy('created_at', 'desc');

    // 4. Drug Hide Log (CEO-notified only)
    let hideLog = [];
    try {
      hideLog = await db('pharmacy_drug_hide_log')
        .where('notify_ceo', 1)
        .select(
          'id', 'drug_id', 'drug_name',
          'hide_type', 'reason', 'auto_show_at',
          'created_at'
        )
        .orderBy('created_at', 'desc');
    } catch (e) {
      // Table may not have notify_ceo column — graceful fallback
      hideLog = [];
    }

    res.json({
      status: 'success',
      data: {
        deliveries,
        managerRequests,
        expiredDrugs,
        hideLog
      }
    });
  },

  // POST /pharmacy-reports/ceo/delivery/:id/decide
  ceoDecideDelivery: async (req, res) => {
    const { id } = req.params;
    const { action, ceo_notes } = req.body; // action: 'CONFIRM' | 'REJECT'
    if (!['CONFIRM', 'REJECT'].includes(action)) {
      throw new AppError('action must be CONFIRM or REJECT', HTTP_STATUS.BAD_REQUEST);
    }
    const delivery = await db('pharmacy_direct_deliveries').where({ id }).first();
    if (!delivery) throw new AppError('Delivery not found', HTTP_STATUS.NOT_FOUND);

    const newStatus = action === 'CONFIRM' ? 'CEO_CONFIRMED' : 'CEO_REJECTED';
    await db('pharmacy_direct_deliveries').where({ id }).update({
      status: newStatus,
      ceo_notes: ceo_notes || null,
      updated_at: db.fn.now()
    });

    res.json({ status: 'success', data: { id, status: newStatus } });
  },

  // POST /pharmacy-reports/ceo/manager-request/:id/decide
  ceoDecideManagerRequest: async (req, res) => {
    const { id } = req.params;
    const { ceo_value } = req.body;
    if (ceo_value === undefined || ceo_value === null) {
      throw new AppError('ceo_value is required', HTTP_STATUS.BAD_REQUEST);
    }
    const request = await db('pharmacy_manager_requests').where({ id }).first();
    if (!request) throw new AppError('Manager request not found', HTTP_STATUS.NOT_FOUND);

    const parsedCeo = parseFloat(ceo_value);
    const parsedRequested = parseFloat(request.requested_value);
    const newStatus = parsedCeo === parsedRequested ? 'APPROVED' : 'REJECTED';

    await db('pharmacy_manager_requests').where({ id }).update({
      ceo_value: parsedCeo,
      status: newStatus
    });

    res.json({ status: 'success', data: { id, status: newStatus, ceo_value: parsedCeo } });
  },

  // POST /pharmacy-reports/ceo/expired-drug/:id/decide
  ceoDecideExpiredDrug: async (req, res) => {
    const { id } = req.params;
    const { action, ceo_notes } = req.body; // 'APPROVE' | 'REJECT'
    if (!['APPROVE', 'REJECT'].includes(action)) {
      throw new AppError('action must be APPROVE or REJECT', HTTP_STATUS.BAD_REQUEST);
    }
    const record = await db('pharmacy_expired_drugs').where({ id }).first();
    if (!record) throw new AppError('Expired drug record not found', HTTP_STATUS.NOT_FOUND);

    await db('pharmacy_expired_drugs').where({ id }).update({
      status: action === 'APPROVE' ? 'CEO_APPROVED' : 'CEO_REJECTED',
      ceo_notes: ceo_notes || null,
      updated_at: db.fn.now()
    });

    res.json({ status: 'success', data: { id, action } });
  },

  // ─────────────────────────────────────────────────
  // FINANCE REVIEW
  // GET /pharmacy-reports/finance
  // ─────────────────────────────────────────────────
  getFinanceReview: async (req, res) => {
    const { date } = req.query;

    // 1. Sales Reports
    let salesQ = db('pharmacy_sales_reports as psr')
      .leftJoin('users as u', 'psr.submitted_by', 'u.id')
      .select(
        'psr.id', 'psr.report_date', 'psr.total_sales',
        'psr.total_amount', 'psr.status',
        'psr.finance_decision', 'psr.finance_notes', 'psr.finance_decided_at',
        db.raw('COALESCE(u.full_name, "Unknown") as submitted_by_name')
      )
      .orderBy('psr.report_date', 'desc');

    if (date) {
      salesQ = salesQ.whereRaw('DATE(psr.report_date) = ?', [date]);
    }

    const salesReports = await salesQ;

    // 2. Finance Records (P&L)
    let financeRecordsQ = db('pharmacy_finance_records as pfr')
      .select(
        'pfr.id', 'pfr.report_id', 'pfr.revenue', 'pfr.cogs',
        'pfr.profit_loss', 'pfr.result', 'pfr.income_recorded', 'pfr.created_at'
      )
      .orderBy('pfr.created_at', 'desc');

    if (date) {
      financeRecordsQ = financeRecordsQ.whereRaw('DATE(pfr.created_at) = ?', [date]);
    }

    const financeRecords = await financeRecordsQ;

    // 3. Direct Deliveries awaiting payment (CEO_CONFIRMED, not yet FINANCE_PAID)
    const pendingPaymentDeliveries = await db('pharmacy_direct_deliveries')
      .whereIn('status', ['CEO_CONFIRMED', 'FINANCE_PAID'])
      .select(
        'id', 'delivery_no', 'supplier_name', 'drug_name',
        'total_amount', 'status', 'finance_payable_id', 'created_at'
      )
      .orderBy('created_at', 'desc');

    // 4. Payments
    let paymentsQ = db('pharmacy_payments as pp')
      .select(
        'pp.id', 'pp.payment_method', 'pp.amount', 'pp.status',
        'pp.receipt_no', 'pp.created_at',
        db.raw('COALESCE(pp.worker_name, "Unknown") as worker_name'),
        db.raw('COALESCE(pp.branch_name, "—") as branch_name')
      )
      .orderBy('pp.created_at', 'desc');

    if (date) {
      paymentsQ = paymentsQ.whereRaw('DATE(pp.created_at) = ?', [date]);
    }

    const payments = await paymentsQ;

    // 5. Audit Trail (PAID/CASHOUT)
    let auditQ = db('pharmacy_audit_trail as pat')
      .leftJoin('pharmacy_workers as pw', 'pat.worker_id', 'pw.id')
      .leftJoin('pharmacy_branches as pb', 'pat.branch_id', 'pb.id')
      .whereIn('pat.action', ['PAID', 'CASHOUT', 'FINANCE_PAID'])
      .select(
        'pat.id', 'pat.action', 'pat.amount',
        'pat.created_at',
        db.raw('COALESCE(pw.name, "Unknown") as worker_name'),
        db.raw('COALESCE(pb.name, "—") as branch_name')
      )
      .orderBy('pat.created_at', 'desc')
      .limit(100);

    if (date) {
      auditQ = auditQ.whereRaw('DATE(pat.created_at) = ?', [date]);
    }

    let auditTrail = [];
    try {
      auditTrail = await auditQ;
    } catch (e) {
      auditTrail = [];
    }

    res.json({
      status: 'success',
      data: {
        salesReports,
        financeRecords,
        pendingPaymentDeliveries,
        payments,
        auditTrail
      }
    });
  },

  // PATCH /pharmacy-reports/finance/sales-report/:id/decide
  financeDecideSalesReport: async (req, res) => {
    const { id } = req.params;
    const { decision, notes } = req.body; // decision: 'APPROVED' | 'REJECTED'
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      throw new AppError('decision must be APPROVED or REJECTED', HTTP_STATUS.BAD_REQUEST);
    }
    const report = await db('pharmacy_sales_reports').where({ id }).first();
    if (!report) throw new AppError('Sales report not found', HTTP_STATUS.NOT_FOUND);

    await db('pharmacy_sales_reports').where({ id }).update({
      status: decision,
      finance_decision: decision,
      finance_notes: notes || null,
      finance_decided_at: db.fn.now()
    });

    res.json({ status: 'success', data: { id, decision } });
  },

  // PATCH /pharmacy-reports/finance/delivery/:id/mark-paid
  financeMarkDeliveryPaid: async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const delivery = await db('pharmacy_direct_deliveries').where({ id }).first();
    if (!delivery) throw new AppError('Delivery not found', HTTP_STATUS.NOT_FOUND);
    if (delivery.status !== 'CEO_CONFIRMED') {
      throw new AppError('Delivery must be CEO_CONFIRMED to mark as paid', HTTP_STATUS.BAD_REQUEST);
    }

    await db('pharmacy_direct_deliveries').where({ id }).update({
      status: 'FINANCE_PAID',
      updated_at: db.fn.now()
    });

    // Log in audit trail
    try {
      await db('pharmacy_audit_trail').insert({
        action: 'FINANCE_PAID',
        amount: delivery.total_amount,
        recipient: notes || `Finance paid delivery #${delivery.delivery_no}`,
        worker_id: req.user?.id || null,
        created_at: db.fn.now()
      });
    } catch (e) {}

    res.json({ status: 'success', data: { id, status: 'FINANCE_PAID' } });
  },

  // ─────────────────────────────────────────────────
  // DAILY SUMMARY
  // GET /pharmacy-reports/daily-summary
  // ─────────────────────────────────────────────────
  getDailySummary: async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const date = req.query.date || today;

    // 1. Sales Report for the day
    const salesReport = await db('pharmacy_sales_reports')
      .whereRaw('DATE(report_date) = ?', [date])
      .select('id', 'total_sales', 'total_amount', 'status', 'submitted_by', 'report_date')
      .first();

    // 2. Per-branch totals
    let branchTotals = [];
    if (salesReport) {
      branchTotals = await db('pharmacy_report_branches as prb')
        .leftJoin('pharmacy_branches as pb', 'prb.branch_id', 'pb.id')
        .where('prb.report_id', salesReport.id)
        .select(
          'prb.id', 'prb.branch_id',
          db.raw('COALESCE(pb.name, CONCAT("Branch #", prb.branch_id)) as branch_name'),
          'prb.total_sales', 'prb.total_amount', 'prb.worker_count'
        );
    }

    // 3. Per-payment-type totals
    let paymentTotals = [];
    if (salesReport) {
      paymentTotals = await db('pharmacy_report_payments as prp')
        .where('prp.report_id', salesReport.id)
        .select('prp.payment_type', 'prp.count', 'prp.total_amount');
    }

    // 4. Individual sales for the day from pharmacy_sales
    const individualSales = await db('pharmacy_sales as ps')
      .leftJoin('pharmacy_branches as pb', 'ps.branch_id', 'pb.id')
      .leftJoin('pharmacy_workers as pw', 'ps.worker_id', 'pw.id')
      .whereRaw('DATE(ps.created_at) = ?', [date])
      .select(
        'ps.id', 'ps.receipt_no', 'ps.sale_type', 'ps.total_products',
        'ps.total_amount', 'ps.created_at',
        db.raw('COALESCE(pb.name, "Main") as branch_name'),
        db.raw('COALESCE(pw.name, "Unassigned") as worker_name')
      )
      .orderBy('ps.created_at', 'desc')
      .limit(200);

    // 5. Individual sales count & total (fallback if no sales_report)
    const salesAgg = await db('pharmacy_sales')
      .whereRaw('DATE(created_at) = ?', [date])
      .select(
        db.raw('COUNT(*) as total_sales'),
        db.raw('COALESCE(SUM(total_amount), 0) as total_amount'),
        db.raw('COALESCE(SUM(total_products), 0) as total_products_sold')
      )
      .first();

    // 6. Inventory alerts
    const lowStockCount = await db('pharmacy_inventory')
      .whereRaw('quantity <= reorder_level AND quantity > 0')
      .count('id as count')
      .first()
      .catch(() => ({ count: 0 }));

    const outOfStockCount = await db('pharmacy_inventory')
      .where('quantity', 0)
      .count('id as count')
      .first()
      .catch(() => ({ count: 0 }));

    // Expired from medications table
    const todayStr = today;
    const expiredCount = await db('pharmacy_medications')
      .where('expiry_date', '<', todayStr)
      .andWhere('stock_quantity', '>', 0)
      .count('id as count')
      .first()
      .catch(() => ({ count: 0 }));

    // 7. Tasks
    let tasks = [];
    try {
      tasks = await db('pharmacy_tasks as pt')
        .leftJoin('pharmacy_branches as pb', 'pt.branch_id', 'pb.id')
        .whereIn('pt.status', ['PENDING', 'OVERDUE'])
        .select(
          'pt.id', 'pt.title', 'pt.priority', 'pt.status', 'pt.due_date', 'pt.branch_id',
          db.raw('COALESCE(pb.name, "Main") as branch_name')
        )
        .orderBy('pt.due_date', 'asc');
    } catch (e) {
      tasks = [];
    }

    res.json({
      status: 'success',
      data: {
        date,
        salesReport,
        branchTotals,
        paymentTotals,
        individualSales,
        totals: {
          total_sales: Number(salesReport?.total_sales || salesAgg?.total_sales || 0),
          total_amount: parseFloat(salesReport?.total_amount || salesAgg?.total_amount || 0),
          total_products_sold: Number(salesAgg?.total_products_sold || 0)
        },
        inventoryAlerts: {
          low_stock: Number(lowStockCount?.count || 0),
          out_of_stock: Number(outOfStockCount?.count || 0),
          expired: Number(expiredCount?.count || 0)
        },
        tasks
      }
    });
  },

  // ─────────────────────────────────────────────────
  // CEO PHARMACY SALES REPORTING PACK (5 reports)
  // GET /pharmacy-reports/executive?period=&from=&to=
  // ─────────────────────────────────────────────────
  getExecutivePack: async (req, res) => {
    const { period = 'month', from, to } = req.query;
    const { start, end, prevStart, prevEnd, label } = resolvePeriod(period, from, to);

    // ── 0. Targets ──
    const targetRows = await db('pharmacy_targets').select('*');
    const overallTarget = Number(targetRows.find(t => (t.period === 'ALL' || t.period === period) && !t.branch_id)?.sales_target || 0);
    const branchTargets = {};
    targetRows.forEach(t => { if (t.branch_id) branchTargets[t.branch_id] = Number(t.sales_target); });

    // ── 1. Sales basic aggregates ──
    const sales = await db('pharmacy_sales')
      .where('created_at', '>=', start).where('created_at', '<=', end);

    let revenue = 0, transactions = 0, totalProducts = 0;
    const branchSales = {};
    for (const s of sales) {
      revenue += parseFloat(s.total_amount || 0);
      transactions += 1;
      totalProducts += parseInt(s.total_products || 0);
      const bId = s.branch_id;
      if (!branchSales[bId]) branchSales[bId] = { revenue: 0, transactions: 0, products: 0 };
      branchSales[bId].revenue += parseFloat(s.total_amount || 0);
      branchSales[bId].transactions += 1;
      branchSales[bId].products += parseInt(s.total_products || 0);
    }

    // Previous-period sales for growth %
    const prevSales = await db('pharmacy_sales')
      .where('created_at', '>=', prevStart).where('created_at', '<=', prevEnd);
    let prevRevenue = 0;
    prevSales.forEach(s => { prevRevenue += parseFloat(s.total_amount || 0); });

    // ── 2. Gross profit / COGS from sale items ──
    let cogs = 0, grossProfit = 0;
    const productAgg = {}; // drug_name -> {qty, revenue, cost, name}
    if (sales.length) {
      const saleIds = sales.map(s => s.id);
      const items = await db('pharmacy_sale_items').whereIn('sale_id', saleIds);
      for (const it of items) {
        const qty = parseInt(it.quantity || 0);
        const rev = parseFloat(it.total_price || 0);
        // Cost from pharmacy_medications.price (COST), matched by name
        const cost = await getDrugCost(it.drug_name, it.drug_id);
        const lineCost = cost * qty;
        cogs += lineCost;
        const key = it.drug_name || 'Unknown';
        if (!productAgg[key]) productAgg[key] = { name: key, qty: 0, revenue: 0, cost: 0 };
        productAgg[key].qty += qty;
        productAgg[key].revenue += rev;
        productAgg[key].cost += lineCost;
      }
    }
    grossProfit = revenue - cogs;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const avgTransaction = transactions > 0 ? revenue / transactions : 0;

    // ── 3. Inventory health ──
    const meds = await db('pharmacy_medications')
      .select('id', 'name', 'price', 'selling_price', 'stock_quantity', 'reorder_level', 'expiry_date', 'is_active', 'is_hidden');
    const invByDrug = {};
    const invRows = await db('pharmacy_inventory').select('drug_id', 'quantity', 'reorder_level', 'branch_id', 'expiry_date');
    invRows.forEach(r => {
      if (!invByDrug[r.drug_id]) invByDrug[r.drug_id] = { qty: 0, reorder: 0 };
      invByDrug[r.drug_id].qty += parseInt(r.quantity || 0);
      invByDrug[r.drug_id].reorder = r.reorder_level || invByDrug[r.drug_id].reorder;
    });

    let inventoryValue = 0;
    const stockHealth = [];
    const nearExpiry = [];
    const already_expired = [];
    const outOfStock = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nearThreshold = new Date(today); nearThreshold.setDate(nearThreshold.getDate() + 90);

    const effectiveStock = (m) => {
      const q = parseInt(m.stock_quantity || 0);
      if (q > 0) return q;
      const inv = invByDrug[m.id];
      return inv ? parseInt(inv.qty || 0) : 0;
    };
    const effectiveReorder = (m) => {
      const r = parseInt(m.reorder_level || 0);
      if (r > 0) return r;
      const inv = invByDrug[m.id];
      return inv ? parseInt(inv.reorder || 0) : 0;
    };

    meds.filter(m => m.is_active !== false).forEach(m => {
      const qty = effectiveStock(m);
      const cost = parseFloat(m.price || 0);
      inventoryValue += qty * cost;
      stockHealth.push({
        name: m.name, qty, cost, value: qty * cost,
        reorder_level: effectiveReorder(m),
        expiry_date: m.expiry_date || null,
        selling_price: parseFloat(m.selling_price || m.price || 0)
      });
      // Out of stock
      if (qty <= 0) outOfStock.push({ name: m.name, qty, reorder_level: effectiveReorder(m), value: 0 });
      // Near expiry
      if (m.expiry_date) {
        const exp = new Date(m.expiry_date);
        if (exp >= today && exp <= nearThreshold && qty > 0) {
          nearExpiry.push({ name: m.name, qty, expiry_date: exp, value: qty * cost, cost });
        }
        if (exp < today && qty > 0) {
          already_expired.push({ name: m.name, qty, expiry_date: exp, value: qty * cost, cost });
        }
      }
    });
    const expiredValue = stockHealth
      .filter(x => x && x.expiry_date && new Date(x.expiry_date) < today)
      .reduce((s, x) => s + x.value, 0);

    // ── 4. Top products / slow-moving / overstocked ──
    const topByQty = Object.values(productAgg).sort((a, b) => b.qty - a.qty).slice(0, 10);
    const topByProfit = Object.values(productAgg).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost)).slice(0, 10);
    const slowMoving = stockHealth
      .filter(x => x.qty <= x.reorder_level && x.qty > 0)
      .sort((a, b) => (a.qty / (a.reorder_level || 1)) - (b.qty / (b.reorder_level || 1)))
      .slice(0, 10);
    const overstocked = stockHealth
      .filter(x => x.qty > 0)
      .map(x => ({ ...x, ratio: x.reorder_level > 0 ? x.qty / x.reorder_level : 0 }))
      .filter(x => x.ratio > 3)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);

    // ── 5. Branch performance + exceptions ──
    const branches = await db('pharmacy_branches').orderBy('name', 'asc');
    const branchProfits = {};
    for (const b of branches) {
      branchProfits[b.id] = await computeBranchProfit(b.id, sales);
    }
    const branchPerf = branches.map(b => {
      const d = branchSales[b.id] || { revenue: 0, transactions: 0, products: 0 };
      const target = branchTargets[b.id] || 0;
      const achievement = target > 0 ? (d.revenue / target) * 100 : null;
      const halfTarget = target > 0 ? target / 2 : null;
      const gp = branchProfits[b.id] || 0;
      const m = d.revenue > 0 ? (gp / d.revenue) * 100 : 0;
      return {
        branch_id: b.id, branch: b.name, revenue: d.revenue,
        transactions: d.transactions, products: d.products, target,
        achievement: achievement === null ? null : Math.round(achievement * 10) / 10,
        margin: Math.round(m * 10) / 10,
        gross_profit: Math.round(gp * 100) / 100,
        half_target: halfTarget
      };
    });

    // Exceptions — what needs a decision
    const exceptions = [];
    branchPerf.forEach(bp => {
      if (bp.target > 0 && bp.achievement !== null && bp.achievement < 100 && bp.revenue < bp.half_target) {
        exceptions.push({ issue: 'Sales below target', branch: bp.branch, impact: `${Math.round(100 - bp.achievement)}% below target`, action: 'Management review', severity: 'high' });
      }
    });
    outOfStock.forEach(o => {
      exceptions.push({ issue: 'Stock-out', branch: 'Main Inventory', impact: `${o.name} (reorder at ${o.reorder_level})`, action: 'Reorder', severity: 'high' });
    });
    nearExpiry.slice(0, 5).forEach(e => {
      const days = Math.floor((new Date(e.expiry_date) - today) / 86400000);
      exceptions.push({ issue: 'Near expiry', branch: 'Main Inventory', impact: `${e.name} x${e.qty} expires in ${days}d (${e.cost * e.qty} ETB)`, action: 'Promotion/return', severity: 'medium' });
    });
    overstocked.slice(0, 5).forEach(o => {
      exceptions.push({ issue: 'Slow-moving / overstocked', branch: 'Main Inventory', impact: `${o.name} x${o.qty} (${o.value} ETB tied up)`, action: 'Reduce purchasing', severity: 'low' });
    });
    // Receivables placeholder (pharmacy has no customer credit ledger)
    const outstandingReceivables = 0;

    // Payment mix
    let paymentMix = [];
    if (sales.length) {
      const payRows = await db('pharmacy_payments').whereIn('sale_id', sales.map(s => s.id));
      const mix = {};
      payRows.forEach(p => { const k = p.payment_method || 'CASH'; mix[k] = (mix[k] || 0) + parseFloat(p.amount || 0); });
      paymentMix = Object.entries(mix).map(([method, amount]) => ({ method, amount }));
    }

    res.json({
      status: 'success',
      data: {
        period: label,
        range: { start, end },
        executive: {
          revenue: Math.round(revenue * 100) / 100,
          target: overallTarget,
          achievement: overallTarget > 0 ? Math.round((revenue / overallTarget) * 1000) / 10 : null,
          gross_profit: Math.round(grossProfit * 100) / 100,
          margin: Math.round(margin * 10) / 10,
          growth: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10 : null,
          transactions,
          avg_transaction: Math.round(avgTransaction * 100) / 100,
          inventory_value: Math.round(inventoryValue * 100) / 100,
          expired_value: Math.round(expiredValue * 100) / 100,
          outstanding_receivables: outstandingReceivables
        },
        branch_performance: branchPerf,
        product_health: {
          top_by_qty: topByQty,
          top_by_profit: topByProfit,
          slow_moving: slowMoving,
          overstocked: overstocked,
          out_of_stock: outOfStock,
          near_expiry: nearExpiry,
          already_expired: already_expired,
          inventory_value: Math.round(inventoryValue * 100) / 100
        },
        profitability: {
          revenue: Math.round(revenue * 100) / 100,
          cogs: Math.round(cogs * 100) / 100,
          gross_profit: Math.round(grossProfit * 100) / 100,
          margin: Math.round(margin * 10) / 10
        },
        exceptions,
        payment_mix: paymentMix
      }
    });
  },

  // ─────────────────────────────────────────────────
  // COMPLETE MANAGER REPORT (covers all Pharmacy sections
  // + Sales > Worker Sales). Period-filtered.
  // GET /pharmacy-reports/complete?period=&from=&to=&branch_id=
  // ─────────────────────────────────────────────────
  getCompleteReport: async (req, res) => {
    const { period = 'month', from, to, branch_id } = req.query;
    const { start, end, prevStart, prevEnd, label } = resolvePeriod(period, from, to);
    const branchFilter = branch_id ? Number(branch_id) : null;

    // ── 0. Targets ──
    const targetRows = await db('pharmacy_targets').select('*');
    const overallTarget = Number(targetRows.find(t => (t.period === 'ALL' || t.period === period) && !t.branch_id)?.sales_target || 0);
    const branchTargets = {};
    targetRows.forEach(t => { if (t.branch_id) branchTargets[t.branch_id] = Number(t.sales_target); });

    // ── 1. Sales within period (un-submitted = live sales) ──
    const sales = await db('pharmacy_sales')
      .where('created_at', '>=', start).where('created_at', '<=', end);
    const scoped = branchFilter ? sales.filter(s => Number(s.branch_id) === branchFilter) : sales;

    let revenue = 0, transactions = 0, totalProducts = 0;
    const branchSales = {};
    for (const s of scoped) {
      revenue += parseFloat(s.total_amount || 0);
      transactions += 1;
      totalProducts += parseInt(s.total_products || 0);
      const bId = s.branch_id;
      if (!branchSales[bId]) branchSales[bId] = { revenue: 0, transactions: 0, products: 0 };
      branchSales[bId].revenue += parseFloat(s.total_amount || 0);
      branchSales[bId].transactions += 1;
      branchSales[bId].products += parseInt(s.total_products || 0);
    }

    // Previous-period sales (growth %)
    const prevSales = await db('pharmacy_sales')
      .where('created_at', '>=', prevStart).where('created_at', '<=', prevEnd);
    let prevRevenue = 0;
    prevSales.forEach(s => { if (!branchFilter || Number(s.branch_id) === branchFilter) prevRevenue += parseFloat(s.total_amount || 0); });

    // ── 2. Gross profit / COGS / product aggregation ──
    let cogs = 0, grossProfit = 0;
    const productAgg = {};
    if (scoped.length) {
      const items = await db('pharmacy_sale_items').whereIn('sale_id', scoped.map(s => s.id));
      for (const it of items) {
        const qty = parseInt(it.quantity || 0);
        const rev = parseFloat(it.total_price || 0);
        const cost = await getDrugCost(it.drug_name, it.drug_id);
        const lineCost = cost * qty;
        cogs += lineCost;
        const key = it.drug_name || 'Unknown';
        if (!productAgg[key]) productAgg[key] = { name: key, qty: 0, revenue: 0, cost: 0 };
        productAgg[key].qty += qty;
        productAgg[key].revenue += rev;
        productAgg[key].cost += lineCost;
      }
    }
    grossProfit = revenue - cogs;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const avgTransaction = transactions > 0 ? revenue / transactions : 0;

    // ── 3. Inventory health (medications snapshot) ──
    const meds = await db('pharmacy_medications')
      .select('id', 'name', 'price', 'selling_price', 'stock_quantity', 'reorder_level', 'expiry_date', 'is_active', 'is_hidden', 'category_id', 'batch_no', 'created_at', 'drug_image');
    const invByDrug = {};
    const invRows = await db('pharmacy_inventory').select('drug_id', 'quantity', 'reorder_level', 'branch_id', 'expiry_date', 'batch_no');
    invRows.forEach(r => {
      if (!invByDrug[r.drug_id]) invByDrug[r.drug_id] = { qty: 0, reorder: 0 };
      invByDrug[r.drug_id].qty += parseInt(r.quantity || 0);
      invByDrug[r.drug_id].reorder = r.reorder_level || invByDrug[r.drug_id].reorder;
    });

    let inventoryValue = 0;
    const stockHealth = [];
    const nearExpiry = [];
    const already_expired = [];
    const outOfStock = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const nearThreshold = new Date(today); nearThreshold.setDate(nearThreshold.getDate() + 90);

    const effectiveStock = (m) => {
      const q = parseInt(m.stock_quantity || 0);
      if (q > 0) return q;
      const inv = invByDrug[m.id];
      return inv ? parseInt(inv.qty || 0) : 0;
    };
    const effectiveReorder = (m) => {
      const r = parseInt(m.reorder_level || 0);
      if (r > 0) return r;
      const inv = invByDrug[m.id];
      return inv ? parseInt(inv.reorder || 0) : 0;
    };

    meds.filter(m => m.is_active !== false).forEach(m => {
      const qty = effectiveStock(m);
      const cost = parseFloat(m.price || 0);
      inventoryValue += qty * cost;
      stockHealth.push({ id: m.id, name: m.name, qty, cost, value: qty * cost, reorder_level: effectiveReorder(m), expiry_date: m.expiry_date || null, category_id: m.category_id });
      if (qty <= 0) outOfStock.push({ name: m.name, qty, reorder_level: effectiveReorder(m), value: 0 });
      if (m.expiry_date) {
        const exp = new Date(m.expiry_date);
        if (exp >= today && exp <= nearThreshold && qty > 0) nearExpiry.push({ name: m.name, qty, expiry_date: exp, value: qty * cost, cost });
        if (exp < today && qty > 0) already_expired.push({ name: m.name, qty, expiry_date: exp, value: qty * cost, cost });
      }
    });
    const expiredValue = stockHealth.filter(x => x && x.expiry_date && new Date(x.expiry_date) < today).reduce((s, x) => s + x.value, 0);

    // ── 4. Top / slow / overstocked ──
    const topByQty = Object.values(productAgg).sort((a, b) => b.qty - a.qty).slice(0, 10);
    const topByProfit = Object.values(productAgg).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost)).slice(0, 10);
    const slowMoving = stockHealth.filter(x => x.qty <= x.reorder_level && x.qty > 0).sort((a, b) => (a.qty / (a.reorder_level || 1)) - (b.qty / (b.reorder_level || 1))).slice(0, 10);
    const overstocked = stockHealth.filter(x => x.qty > 0).map(x => ({ ...x, ratio: x.reorder_level > 0 ? x.qty / x.reorder_level : 0 })).filter(x => x.ratio > 3).sort((a, b) => b.ratio - a.ratio).slice(0, 10);

    // ── 5. Branch performance ──
    const branches = await db('pharmacy_branches').orderBy('name', 'asc');
    const branchProfits = {};
    for (const b of branches) branchProfits[b.id] = await computeBranchProfit(b.id, scoped);
    const branchPerf = branches.map(b => {
      const d = branchSales[b.id] || { revenue: 0, transactions: 0, products: 0 };
      const target = branchTargets[b.id] || 0;
      const achievement = target > 0 ? (d.revenue / target) * 100 : null;
      const halfTarget = target > 0 ? target / 2 : null;
      const gp = branchProfits[b.id] || 0;
      const m = d.revenue > 0 ? (gp / d.revenue) * 100 : 0;
      return {
        branch_id: b.id, branch: b.name, revenue: d.revenue, transactions: d.transactions,
        products: d.products, target, achievement: achievement === null ? null : Math.round(achievement * 10) / 10,
        margin: Math.round(m * 10) / 10, gross_profit: Math.round(gp * 100) / 100, half_target: halfTarget
      };
    });

    // ── 6. Exceptions ──
    const exceptions = [];
    branchPerf.forEach(bp => {
      if (bp.target > 0 && bp.achievement !== null && bp.achievement < 100 && bp.revenue < bp.half_target) {
        exceptions.push({ issue: 'Sales below target', branch: bp.branch, impact: `${Math.round(100 - bp.achievement)}% below target`, action: 'Management review', severity: 'high' });
      }
    });
    outOfStock.forEach(o => exceptions.push({ issue: 'Stock-out', branch: 'Main Inventory', impact: `${o.name} (reorder at ${o.reorder_level})`, action: 'Reorder', severity: 'high' }));
    nearExpiry.slice(0, 5).forEach(e => {
      const days = Math.floor((new Date(e.expiry_date) - today) / 86400000);
      exceptions.push({ issue: 'Near expiry', branch: 'Main Inventory', impact: `${e.name} x${e.qty} expires in ${days}d`, action: 'Promotion/return', severity: 'medium' });
    });
    overstocked.slice(0, 5).forEach(o => exceptions.push({ issue: 'Slow-moving / overstocked', branch: 'Main Inventory', impact: `${o.name} x${o.qty}`, action: 'Reduce purchasing', severity: 'low' }));

    // ── 7. Payment mix (period / branch) ──
    let paymentMix = [];
    if (scoped.length) {
      const payRows = await db('pharmacy_payments').whereIn('sale_id', scoped.map(s => s.id));
      const mix = {};
      payRows.forEach(p => { const k = p.payment_method || 'CASH'; mix[k] = (mix[k] || 0) + parseFloat(p.amount || 0); });
      paymentMix = Object.entries(mix).map(([method, amount]) => ({ method, amount }));
    }

    // ── 8. STORE INVENTORY (medical store / warehouse — SEPARATE dataset) ──
    const storeInv = await db('store_inventory as si')
      .leftJoin('drugs as d', 'si.drug_id', 'd.id')
      .leftJoin('drug_categories as dc', 'd.category_id', 'dc.id')
      .select('si.drug_id', 'si.quantity', 'si.reorder_level', 'si.min_level', 'si.max_level',
        'si.reserved_quantity', 'si.unit_cost', 'si.selling_price', 'si.expiry_date',
        'si.storage_location', 'si.stock_status', 'si.batch_no', 'd.name',
        db.raw('COALESCE(dc.name, d.category) as category'));

    let storeUnits = 0, storeReserved = 0, storeValue = 0;
    const storeCatMap = {};
    const storeDrugSet = new Set();
    const storeHealth = [];
    storeInv.forEach(r => {
      const qty = parseInt(r.quantity || 0);
      const cost = parseFloat(r.unit_cost || r.selling_price || 0);
      storeUnits += qty;
      storeReserved += parseInt(r.reserved_quantity || 0);
      storeValue += qty * cost;
      if (r.drug_id) storeDrugSet.add(Number(r.drug_id));
      storeHealth.push({
        drug_id: r.drug_id, name: r.name, qty, cost, value: qty * cost,
        reorder_level: parseInt(r.reorder_level || r.min_level || 0),
        expiry_date: r.expiry_date || null, storage_location: r.storage_location || null,
        stock_status: r.stock_status || null
      });
      const key = r.category || 'Uncategorized';
      if (!storeCatMap[key]) storeCatMap[key] = { category: key, skus: new Set(), units: 0, value: 0 };
      storeCatMap[key].skus.add(Number(r.drug_id));
      storeCatMap[key].units += qty;
      storeCatMap[key].value += qty * cost;
    });
    const storeByCategory = Object.values(storeCatMap).map(c => ({ category: c.category, skus: c.skus.size, units: c.units, value: Math.round(c.value * 100) / 100 })).sort((a, b) => b.value - a.value);
    const storeLowStock = storeHealth.filter(r => r.qty > 0 && r.qty <= r.reorder_level).length;
    const storeOutOfStock = storeHealth.filter(r => r.qty <= 0).length;

    // ── 9. PHARMACY STOCK (front dispensary — main vs branch "outside store") ──
    const invAll = await db('pharmacy_inventory as pi')
      .leftJoin('pharmacy_medications as pm', 'pi.drug_id', 'pm.id')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .select('pi.*', 'pm.name as drug_name', 'pm.price as cost_price', 'pm.category_id', 'pc.name as category_name');
    const invScoped = branchFilter ? invAll.filter(r => Number(r.branch_id) === branchFilter) : invAll;
    const mainInv = invScoped.filter(r => !r.branch_id);
    const branchInv = invScoped.filter(r => r.branch_id);

    let mainUnits = 0, mainValue = 0;
    const mainDrugSet = new Set();
    mainInv.forEach(r => {
      const qty = parseInt(r.quantity || 0);
      mainUnits += qty;
      mainValue += qty * parseFloat(r.cost_price || 0);
      if (r.drug_id) mainDrugSet.add(Number(r.drug_id));
    });
    let branchUnits = 0, branchValue = 0;
    const branchDrugSet = new Set();
    const branchStockMap = {};
    branchInv.forEach(r => {
      const qty = parseInt(r.quantity || 0);
      const cost = parseFloat(r.cost_price || 0);
      branchUnits += qty;
      branchValue += qty * cost;
      if (r.drug_id) branchDrugSet.add(Number(r.drug_id));
      const id = Number(r.branch_id);
      if (!branchStockMap[id]) branchStockMap[id] = { branch_id: id, skus: new Set(), units: 0, value: 0, low_stock: 0, out_of_stock: 0 };
      const b = branchStockMap[id];
      b.skus.add(Number(r.drug_id));
      b.units += qty;
      b.value += qty * cost;
      if (qty > 0 && qty <= parseInt(r.reorder_level || 0)) b.low_stock += 1;
      if (qty <= 0) b.out_of_stock += 1;
    });
    const pbRows = await db('pharmacy_branches').select('id', 'name');
    const pbNames = {};
    pbRows.forEach(b => pbNames[b.id] = b.name);
    const branchStock = Object.values(branchStockMap).map(b => ({
      branch_id: b.branch_id, branch: pbNames[b.branch_id] || `Branch #${b.branch_id}`,
      skus: b.skus.size, units: b.units, value: Math.round(b.value * 100) / 100,
      low_stock: b.low_stock, out_of_stock: b.out_of_stock
    })).sort((a, b) => b.value - a.value);
    const pharmacyStockValue = mainValue + branchValue;

    // ── 10. Stock movements & adjustments (period) ──
    const movements = await db('pharmacy_stock_movements as psm')
      .leftJoin('pharmacy_medications as pm', 'psm.medication_id', 'pm.id')
      .where('psm.created_at', '>=', start).where('psm.created_at', '<=', end)
      .select('psm.id', 'psm.quantity_change', 'psm.reason', 'psm.reference_no', 'psm.created_at', 'psm.created_by', db.raw('COALESCE(pm.name, "—") as drug_name'));
    let qtyIn = 0, qtyOut = 0;
    const reasonMap = {};
    movements.forEach(m => {
      const q = parseInt(m.quantity_change || 0);
      if (q >= 0) qtyIn += q; else qtyOut += Math.abs(q);
      const key = (m.reason || 'Adjustment').trim() || 'Adjustment';
      if (!reasonMap[key]) reasonMap[key] = { reason: key, count: 0, quantity_in: 0, quantity_out: 0 };
      reasonMap[key].count += 1;
      if (q >= 0) reasonMap[key].quantity_in += q; else reasonMap[key].quantity_out += Math.abs(q);
    });
    const adjustments = Object.values(reasonMap).sort((a, b) => b.count - a.count);

    const transfers = await db('pharmacy_transfer_requests')
      .where('created_at', '>=', start).where('created_at', '<=', end)
      .select('id', 'status', 'request_number', 'drug_name', 'quantity_requested', 'quantity_shipped', 'urgency', 'created_at');
    const transferByStatus = {};
    transfers.forEach(t => { const k = t.status || 'UNKNOWN'; transferByStatus[k] = (transferByStatus[k] || 0) + 1; });

    // ── 11. Procurement & direct deliveries (period) ──
    const prRows = await db('procurement_requests')
      .where('created_at', '>=', start).where('created_at', '<=', end)
      .select('id', 'pr_no', 'drug_name', 'quantity_requested', 'estimated_total', 'status', 'urgency', 'request_type', 'created_at');
    const prByStatus = {};
    let prTotal = 0;
    prRows.forEach(p => { const s = p.status || 'UNKNOWN'; prByStatus[s] = (prByStatus[s] || 0) + 1; prTotal += parseFloat(p.estimated_total || 0); });
    const prNewDrugs = prRows.filter(p => p.request_type === 'NEW_DRUG' || p.new_drug_flag).length;

    const ddRows = await db('pharmacy_direct_deliveries')
      .where('created_at', '>=', start).where('created_at', '<=', end)
      .select('id', 'delivery_no', 'supplier_name', 'drug_name', 'quantity', 'total_amount', 'status', 'delivery_date', 'created_at');
    const ddByStatus = {};
    let ddTotal = 0;
    ddRows.forEach(d => { const s = d.status || 'UNKNOWN'; ddByStatus[s] = (ddByStatus[s] || 0) + 1; ddTotal += parseFloat(d.total_amount || 0); });

    // ── 12. Expired drugs reported (period) ──
    const reportedExpiry = await db('pharmacy_expired_drugs')
      .where('created_at', '>=', start).where('created_at', '<=', end)
      .select('id', 'drug_name', 'quantity', 'expiry_date', 'action_required', 'status', 'created_at');
    const expByStatus = {};
    let expQty = 0;
    reportedExpiry.forEach(e => { const s = e.status || 'UNKNOWN'; expByStatus[s] = (expByStatus[s] || 0) + 1; expQty += parseInt(e.quantity || 0); });

    // ── 13. Batches (from medications) ──
    const batchByNo = {};
    meds.filter(m => m.is_active !== false).forEach(m => {
      const bn = (m.batch_no || 'BATCH-0001').trim();
      if (!batchByNo[bn]) batchByNo[bn] = { batch_no: bn, drugs: 0, units: 0, expired: 0, active: 0, expiry_min: null };
      const qty = effectiveStock(m);
      batchByNo[bn].drugs += 1;
      batchByNo[bn].units += qty;
      if (m.expiry_date) {
        const exp = new Date(m.expiry_date);
        if (exp < today) batchByNo[bn].expired += 1; else batchByNo[bn].active += 1;
        if (!batchByNo[bn].expiry_min || exp < batchByNo[bn].expiry_min) batchByNo[bn].expiry_min = exp;
      }
    });
    const batches = Object.values(batchByNo).map(b => ({ ...b, status: b.expired > 0 ? 'Expired (part)' : 'Active' })).sort((a, b) => (a.expiry_min || 0) - (b.expiry_min || 0));

    // ── 14. Health content (published posts = published medications) ──
    const publishedPosts = meds.filter(m => m.is_active !== false && m.drug_image);
    const healthCreated = meds.filter(m => m.created_at && new Date(m.created_at) >= start && new Date(m.created_at) <= end).length;

    // ── 15. Worker sales ──
    const workers = await db('pharmacy_workers').select('id', 'name', 'branch_id');
    const workerById = {};
    workers.forEach(w => workerById[w.id] = w);
    const byWorker = {};
    scoped.forEach(s => {
      const w = s.worker_id ? workerById[s.worker_id] : null;
      const key = w ? w.id : 'unassigned';
      if (!byWorker[key]) byWorker[key] = { worker_id: key, worker_name: w ? w.name : 'Unassigned', branch_id: w ? w.branch_id : s.branch_id || null, transactions: 0, revenue: 0, products: 0 };
      byWorker[key].transactions += 1;
      byWorker[key].revenue += parseFloat(s.total_amount || 0);
      byWorker[key].products += parseInt(s.total_products || 0);
    });
    const workerSales = Object.values(byWorker).sort((a, b) => b.revenue - a.revenue);
    const branchNames = {};
    branches.forEach(b => branchNames[b.id] = b.name);
    const byBranch = Object.entries(branchSales).map(([id, d]) => ({
      branch_id: Number(id), branch: branchNames[Number(id)] || `Branch #${id}`,
      revenue: d.revenue, transactions: d.transactions, products: d.products
    })).sort((a, b) => b.revenue - a.revenue);

    // ── 16. Audit trail (period) ──
    let auditQ = db('pharmacy_audit_trail as pat')
      .leftJoin('pharmacy_workers as pw', 'pat.worker_id', 'pw.id')
      .leftJoin('pharmacy_branches as pb', 'pat.branch_id', 'pb.id')
      .where('pat.created_at', '>=', start).where('pat.created_at', '<=', end)
      .select('pat.id', 'pat.action', 'pat.amount', 'pat.recipient', 'pat.created_at', db.raw('COALESCE(pw.name, "Unknown") as worker_name'), db.raw('COALESCE(pb.name, "—") as branch_name'), 'pat.branch_id');
    if (branchFilter) auditQ = auditQ.where('pat.branch_id', branchFilter);
    const auditRows = await auditQ.orderBy('pat.created_at', 'desc').limit(200);
    const auditByAction = {};
    let auditSum = 0;
    auditRows.forEach(a => { const k = a.action || 'UNKNOWN'; if (!auditByAction[k]) auditByAction[k] = { action: k, count: 0, amount: 0 }; auditByAction[k].count += 1; auditByAction[k].amount += parseFloat(a.amount || 0); auditSum += parseFloat(a.amount || 0); });

    res.json({
      status: 'success',
      data: {
        period: label,
        range: { start, end },
        executive: {
          revenue: Math.round(revenue * 100) / 100,
          target: overallTarget,
          achievement: overallTarget > 0 ? Math.round((revenue / overallTarget) * 1000) / 10 : null,
          gross_profit: Math.round(grossProfit * 100) / 100,
          margin: Math.round(margin * 10) / 10,
          growth: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10 : null,
          transactions,
          avg_transaction: Math.round(avgTransaction * 100) / 100,
          inventory_value: Math.round(inventoryValue * 100) / 100,
          expired_value: Math.round(expiredValue * 100) / 100,
          outstanding_receivables: 0
        },
        branch_performance: branchPerf,
        product_health: {
          top_by_qty: topByQty, top_by_profit: topByProfit, slow_moving: slowMoving,
          overstocked: overstocked, near_expiry: nearExpiry, already_expired: already_expired, out_of_stock: outOfStock,
          inventory_value: Math.round(inventoryValue * 100) / 100
        },
        profitability: {
          revenue: Math.round(revenue * 100) / 100, cogs: Math.round(cogs * 100) / 100,
          gross_profit: Math.round(grossProfit * 100) / 100, margin: Math.round(margin * 10) / 10
        },
        payment_mix: paymentMix,
        exceptions,
        store_inventory: {
          total_skus: storeDrugSet.size,
          total_units: storeUnits,
          reserved_quantity: storeReserved,
          inventory_value: Math.round(storeValue * 100) / 100,
          low_stock: storeLowStock,
          out_of_stock: storeOutOfStock,
          expired_count: storeHealth.filter(x => x.expiry_date && new Date(x.expiry_date) < today && x.qty > 0).length,
          expired_value: Math.round(storeHealth.filter(x => x.expiry_date && new Date(x.expiry_date) < today).reduce((s, x) => s + x.value, 0) * 100) / 100,
          by_category: storeByCategory,
          top_by_value: storeHealth.slice().sort((a, b) => b.value - a.value).slice(0, 10)
        },
        pharmacy_stock: {
          main_skus: mainDrugSet.size,
          main_units: mainUnits,
          main_value: Math.round(mainValue * 100) / 100,
          branch_skus: branchDrugSet.size,
          branch_units: branchUnits,
          branch_value: Math.round(branchValue * 100) / 100,
          total_units: mainUnits + branchUnits,
          inventory_value: Math.round(pharmacyStockValue * 100) / 100,
          total_skus: new Set([...mainDrugSet, ...branchDrugSet]).size,
          by_branch: branchStock
        },
        stock_operations: {
          count: movements.length,
          quantity_in: qtyIn,
          quantity_out: qtyOut,
          adjustments,
          transfers: { count: transfers.length, by_status: Object.entries(transferByStatus).map(([status, count]) => ({ status, count })) }
        },
        procurement: {
          requests: {
            count: prRows.length,
            total_estimated: Math.round(prTotal * 100) / 100,
            new_drugs: prNewDrugs,
            by_status: Object.entries(prByStatus).map(([status, count]) => ({ status, count }))
          },
          direct_deliveries: {
            count: ddRows.length,
            total_amount: Math.round(ddTotal * 100) / 100,
            by_status: Object.entries(ddByStatus).map(([status, count]) => ({ status, count }))
          }
        },
        expiry: {
          reported: {
            count: reportedExpiry.length,
            total_quantity: expQty,
            by_status: Object.entries(expByStatus).map(([status, count]) => ({ status, count }))
          }
        },
        batches: {
          total: Object.keys(batchByNo).length,
          active: Object.values(batchByNo).filter(b => b.expired === 0).length,
          expired: Object.values(batchByNo).filter(b => b.expired > 0).length,
          list: batches.slice(0, 20)
        },
        health: {
          published: publishedPosts.length,
          created_in_period: healthCreated,
          total_drugs: meds.length
        },
        worker_sales: { by_worker: workerSales, by_branch: byBranch, payment_mix: paymentMix },
        audit: {
          count: auditRows.length,
          total_amount: Math.round(auditSum * 100) / 100,
          by_action: Object.values(auditByAction).sort((a, b) => b.amount - a.amount),
          recent: auditRows.slice(0, 20)
        }
      }
    });
  },

  // GET/PUT pharmacy report targets
  getTargets: async (req, res) => {
    const rows = await db('pharmacy_targets').select('*');
    res.json({ status: 'success', data: rows });
  },

  saveTargets: async (req, res) => {
    const { targets } = req.body; // [{branch_id|null, sales_target}]
    if (!Array.isArray(targets)) throw new AppError('targets must be an array', HTTP_STATUS.BAD_REQUEST);

    // Replace all targets for the given period
    await db('pharmacy_targets').del();
    if (targets.length) {
      const rows = targets.map(t => ({
        branch_id: t.branch_id || null,
        sales_target: parseFloat(t.sales_target || 0),
        period: t.period || 'ALL'
      }));
      await db('pharmacy_targets').insert(rows);
    }
    res.json({ status: 'success', message: 'Targets saved' });
  }
};

// ── Helpers ──

function resolvePeriod(period, from, to) {
  const now = new Date();
  const d = (n) => { const x = new Date(now); x.setDate(now.getDate() - n); x.setHours(0,0,0,0); return x; };
  let start, end, prevStart = d(30), prevEnd = d(0), label = 'Custom';
  end = new Date(now); end.setHours(23,59,59,999);

  if (period === 'today') { start = d(0); prevStart = new Date(start); prevStart.setDate(prevStart.getDate()-1); prevEnd = start; }
  else if (period === 'week') { start = d(6); prevStart = d(13); prevEnd = d(7); }
  else if (period === 'month') { start = d(29); prevStart = d(59); prevEnd = d(30); }
  else if (period === 'quarter') { start = d(89); prevStart = d(179); prevEnd = d(90); }
  else if (period === 'year') { start = d(364); prevStart = d(729); prevEnd = d(365); }
  else if (period === 'all') { start = new Date('2000-01-01'); prevStart = new Date('1999-01-01'); prevEnd = new Date('1999-12-31'); }
  else if (from && to) { start = new Date(from); start.setHours(0,0,0,0); end = new Date(to); end.setHours(23,59,59,999); const len = end - start; prevStart = new Date(start.getTime() - len); prevEnd = new Date(start.getTime() - 1); }

  const fmt = (x) => x.toISOString().slice(0, 10);
  label = periodMap[period] || (from && to ? `${fmt(start)} → ${fmt(end)}` : 'Custom');
  return { start, end, prevStart, prevEnd, label };
}

const periodMap = {
  today: 'Today', week: 'This Week', month: 'This Month', quarter: 'This Quarter',
  year: 'This Year', all: 'All Time'
};

let _medCostCache = null;
async function getDrugCost(name, id) {
  if (!_medCostCache) {
    const meds = await db('pharmacy_medications').select('id', 'name', 'price');
    _medCostCache = meds.map(m => ({ id: m.id, name: String(m.name || '').toLowerCase().trim(), cost: parseFloat(m.price || 0) }));
  }
  if (id) {
    const exact = _medCostCache.find(m => m.id === id);
    if (exact) return exact.cost;
  }
  const n = String(name || '').toLowerCase().trim();
  const hit = _medCostCache.find(m => m.name === n) || _medCostCache.find(m => m.name.includes(n) || n.includes(m.name));
  return hit ? hit.cost : 0;
}

async function computeBranchProfit(branchId, sales) {
  let gp = 0;
  const branchSales = sales.filter(s => s.branch_id === branchId);
  if (!branchSales.length) return 0;
  const ids = branchSales.map(s => s.id);
  const revenue = branchSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
  let cogs = 0;
  const items = await db('pharmacy_sale_items').whereIn('sale_id', ids);
  for (const it of items) {
    const qty = parseInt(it.quantity || 0);
    const cost = await getDrugCost(it.drug_name, it.drug_id);
    cogs += cost * qty;
  }
  return revenue - cogs;
}

module.exports = reportsController;
