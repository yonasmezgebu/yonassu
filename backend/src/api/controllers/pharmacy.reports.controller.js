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
      .leftJoin('pharmacy_medications as pm', 'dd.drug_id', 'pm.id')
      .select(
        'dd.id', 'dd.delivery_no', 'dd.supplier', 'dd.drug_name',
        'dd.quantity', 'dd.total_amount', 'dd.status',
        'dd.ceo_notes', 'dd.created_at', 'dd.updated_at',
        'pm.drug_image'
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
    const expiredDrugs = await db('pharmacy_expired_drugs as ped')
      .leftJoin('pharmacy_medications as pm', 'ped.medication_id', 'pm.id')
      .select(
        'ped.id', 'ped.medication_id',
        db.raw('COALESCE(pm.name, ped.drug_name) as drug_name'),
        'ped.quantity', 'ped.expiry_date', 'ped.action_required',
        'ped.status', 'ped.ceo_notes', 'ped.created_at',
        'pm.drug_image'
      )
      .orderBy('ped.created_at', 'desc');

    // 4. Drug Hide Log (CEO-notified only)
    let hideLog = [];
    try {
      hideLog = await db('pharmacy_drug_hide_log as pdhl')
        .leftJoin('pharmacy_medications as pm', 'pdhl.medication_id', 'pm.id')
        .where('pdhl.notify_ceo', 1)
        .select(
          'pdhl.id', 'pdhl.medication_id',
          db.raw('COALESCE(pm.name, pdhl.drug_name) as drug_name'),
          'pdhl.hide_type', 'pdhl.reason', 'pdhl.auto_show_date',
          'pdhl.created_at', 'pm.drug_image'
        )
        .orderBy('pdhl.created_at', 'desc');
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
        'pfr.profit_loss', 'pfr.result', 'pfr.finance_decision',
        'pfr.finance_notes', 'pfr.income_recorded', 'pfr.created_at'
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
        'id', 'delivery_no', 'supplier', 'drug_name',
        'total_amount', 'status', 'finance_payable_id', 'created_at'
      )
      .orderBy('created_at', 'desc');

    // 4. Payments
    let paymentsQ = db('pharmacy_payments as pp')
      .leftJoin('users as u', 'pp.worker_id', 'u.id')
      .leftJoin('pharmacy_branches as pb', 'pp.branch_id', 'pb.id')
      .select(
        'pp.id', 'pp.payment_method', 'pp.amount', 'pp.status',
        'pp.receipt_no', 'pp.created_at',
        db.raw('COALESCE(u.full_name, "Unknown") as worker_name'),
        db.raw('COALESCE(pb.name, "—") as branch_name')
      )
      .orderBy('pp.created_at', 'desc');

    if (date) {
      paymentsQ = paymentsQ.whereRaw('DATE(pp.created_at) = ?', [date]);
    }

    const payments = await paymentsQ;

    // 5. Audit Trail (PAID/CASHOUT)
    let auditQ = db('pharmacy_audit_trail as pat')
      .leftJoin('users as u', 'pat.user_id', 'u.id')
      .leftJoin('pharmacy_branches as pb', 'pat.branch_id', 'pb.id')
      .whereIn('pat.action', ['PAID', 'CASHOUT', 'FINANCE_PAID'])
      .select(
        'pat.id', 'pat.action', 'pat.amount', 'pat.notes',
        'pat.created_at',
        db.raw('COALESCE(u.full_name, "Unknown") as user_name'),
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
        notes: notes || `Finance paid delivery #${delivery.delivery_no}`,
        user_id: req.user?.id || null,
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
      .leftJoin('users as u', 'pw.user_id', 'u.id')
      .whereRaw('DATE(ps.created_at) = ?', [date])
      .select(
        'ps.id', 'ps.receipt_no', 'ps.sale_type', 'ps.total_products',
        'ps.total_amount', 'ps.created_at',
        db.raw('COALESCE(pb.name, "Main") as branch_name'),
        db.raw('COALESCE(u.full_name, pw.name, "Unassigned") as worker_name')
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
      .whereRaw('quantity_on_hand <= reorder_level AND quantity_on_hand > 0')
      .count('id as count')
      .first()
      .catch(() => ({ count: 0 }));

    const outOfStockCount = await db('pharmacy_inventory')
      .where('quantity_on_hand', 0)
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
  }
};

module.exports = reportsController;
