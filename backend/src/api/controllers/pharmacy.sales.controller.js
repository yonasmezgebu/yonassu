const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { HTTP_STATUS } = require('../../utils/constants');
const notificationRepository = require('../../repositories/notification.repository');

function generateReceiptNo(last) {
  const num = last ? parseInt(last.receipt_no.split('-')[2]) + 1 : 1;
  return `REC-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
}

function generateRefNo(last) {
  const num = last ? parseInt(last.reference_no.split('-')[2]) + 1 : 1;
  return `REF-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
}

const salesController = {

  // ── Sales (A2/A3) ──
  createSale: async (req, res) => {
    const { branch_id, worker_id, sale_type, items, payment } = req.body;
    if (!items || items.length === 0) throw new AppError('At least one item required', HTTP_STATUS.BAD_REQUEST);
    if (!payment) throw new AppError('Payment details required', HTTP_STATUS.BAD_REQUEST);

    const worker = await db('pharmacy_workers').where({ id: worker_id, branch_id }).first();
    if (!worker) throw new AppError('Worker not found in this branch', HTTP_STATUS.NOT_FOUND);
    if (!worker.post_permission) throw new AppError('Worker does not have post permission', HTTP_STATUS.FORBIDDEN);

    const branch = await db('pharmacy_branches').where({ id: branch_id, status: 'ACTIVE' }).first();
    if (!branch) throw new AppError('Branch not active', HTTP_STATUS.BAD_REQUEST);

    const lastReceipt = await db('pharmacy_sales').orderBy('id', 'desc').first();
    const receiptNo = generateReceiptNo(lastReceipt);

    const totalProducts = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + (i.unit_price * i.quantity), 0);

    const result = await db.transaction(async (trx) => {
      const [saleId] = await trx('pharmacy_sales').insert({
        branch_id, worker_id, sale_type: sale_type || 'WALK-IN',
        recipient_name: payment.recipient_name || null,
        recipient_phone: payment.recipient_phone || null,
        total_products: totalProducts, total_amount: totalAmount, receipt_no: receiptNo
      });

      const saleItems = items.map(it => ({
        sale_id: saleId, drug_name: it.drug_name,
        quantity: it.quantity, unit_price: it.unit_price,
        total_price: it.unit_price * it.quantity
      }));
      await trx('pharmacy_sale_items').insert(saleItems);

      await trx('pharmacy_payments').insert({
        sale_id: saleId, payment_method: payment.method || 'CASH',
        amount: payment.amount || totalAmount,
        recipient_name: payment.recipient_name || null,
        recipient_phone: payment.recipient_phone || null,
        bank_name: payment.bank_name || null,
        account_holder: payment.account_holder || null,
        account_number: payment.account_number || null,
        telbir_number: payment.telbir_number || null,
        branch_name: branch.name, worker_name: worker.name,
        status: payment.status || 'PAID', receipt_no: receiptNo
      });

      for (const item of items) {
        const drug = await trx('pharmacy_medications').where({ name: item.drug_name }).first();
        if (drug) {
          const newStock = drug.stock_quantity - item.quantity;
          await trx('pharmacy_medications').where({ id: drug.id }).update({ stock_quantity: Math.max(0, newStock) });
        }
      }

      await trx('pharmacy_audit_trail').insert({
        branch_id, worker_id, action: payment.status || 'PAID',
        recipient: payment.recipient_name || 'N/A', amount: payment.amount || totalAmount
      });

      return saleId;
    });

    try {
      await notificationRepository.create({
        roleTarget: 'Pharmacy Manager', title: 'New Sale Created',
        message: `New sale of $${totalAmount.toFixed(2)} by ${worker.name} at ${branch.name}`,
        type: 'sale_created', link: `/pharmacy/sales`
      });
    } catch (e) {}

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { id: result, receipt_no: receiptNo } });
  },

  listSales: async (req, res) => {
    const { branch_id, worker_id, start_date, end_date } = req.query;
    let query = db('pharmacy_sales').orderBy('created_at', 'desc');
    if (branch_id) query = query.where('pharmacy_sales.branch_id', branch_id);
    if (worker_id) query = query.where('pharmacy_sales.worker_id', worker_id);
    if (start_date) query = query.where('pharmacy_sales.created_at', '>=', new Date(start_date));
    if (end_date) query = query.where('pharmacy_sales.created_at', '<=', new Date(end_date));
    const rows = await query;
    res.json({ status: 'success', data: rows });
  },

  getSale: async (req, res) => {
    const sale = await db('pharmacy_sales').where({ id: req.params.id }).first();
    if (!sale) throw new AppError('Sale not found', HTTP_STATUS.NOT_FOUND);
    const items = await db('pharmacy_sale_items').where({ sale_id: sale.id });
    const payment = await db('pharmacy_payments').where({ sale_id: sale.id }).first();
    res.json({ status: 'success', data: { ...sale, items, payment } });
  },

  // ── Branches (A1) ──
  listBranches: async (req, res) => {
    const rows = await db('pharmacy_branches').orderBy('name', 'asc');
    res.json({ status: 'success', data: rows });
  },

  toggleBranch: async (req, res) => {
    const branch = await db('pharmacy_branches').where({ id: req.params.id }).first();
    if (!branch) throw new AppError('Branch not found', HTTP_STATUS.NOT_FOUND);
    const newStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await db('pharmacy_branches').where({ id: branch.id }).update({ status: newStatus });
    await db('pharmacy_branch_toggle_log').insert({
      branch_id: branch.id, action: newStatus, toggled_by: req.user.id
    });
    res.json({ status: 'success', data: { id: branch.id, status: newStatus } });
  },

  // ── Workers (B1) ──
  listWorkers: async (req, res) => {
    const rows = await db('pharmacy_workers').orderBy('name', 'asc');
    res.json({ status: 'success', data: rows });
  },

  toggleWorkerPermission: async (req, res) => {
    const worker = await db('pharmacy_workers').where({ id: req.params.id }).first();
    if (!worker) throw new AppError('Worker not found', HTTP_STATUS.NOT_FOUND);
    const newPerm = !worker.post_permission;
    await db('pharmacy_workers').where({ id: worker.id }).update({ post_permission: newPerm });
    res.json({ status: 'success', data: { id: worker.id, post_permission: newPerm } });
  },

  // ── Reports (A7/A8) ──
  createReport: async (req, res) => {
    const { report_date } = req.body;
    if (!report_date) throw new AppError('report_date is required', HTTP_STATUS.BAD_REQUEST);

    const dateStr = new Date(report_date).toISOString().split('T')[0];
    const startOfDay = `${dateStr} 00:00:00`;
    const endOfDay = `${dateStr} 23:59:59`;

    const sales = await db('pharmacy_sales')
      .where('created_at', '>=', startOfDay).where('created_at', '<=', endOfDay);

    if (sales.length === 0) throw new AppError('No sales found for this date', HTTP_STATUS.BAD_REQUEST);

    const totalSales = sales.length;
    const totalAmount = sales.reduce((s, r) => s + parseFloat(r.total_amount), 0);

    const branchGroups = {};
    for (const s of sales) {
      if (!branchGroups[s.branch_id]) branchGroups[s.branch_id] = { branch_id: s.branch_id, total_sales: 0, total_amount: 0, worker_ids: new Set() };
      branchGroups[s.branch_id].total_sales += 1;
      branchGroups[s.branch_id].total_amount += parseFloat(s.total_amount);
      branchGroups[s.branch_id].worker_ids.add(s.worker_id);
    }

    const payments = await db('pharmacy_payments')
      .whereIn('sale_id', sales.map(s => s.id));
    const payGroups = {};
    for (const p of payments) {
      const key = p.payment_method || 'CASH';
      if (!payGroups[key]) payGroups[key] = { count: 0, total_amount: 0 };
      payGroups[key].count += 1;
      payGroups[key].total_amount += parseFloat(p.amount);
    }

    const result = await db.transaction(async (trx) => {
      const [reportId] = await trx('pharmacy_sales_reports').insert({
        report_date: dateStr, total_sales: totalSales, total_amount: totalAmount,
        status: 'PENDING', submitted_by: req.user.id, submitted_at: db.fn.now()
      });

      for (const bg of Object.values(branchGroups)) {
        await trx('pharmacy_report_branches').insert({
          report_id: reportId, branch_id: bg.branch_id,
          total_sales: bg.total_sales, total_amount: bg.total_amount,
          worker_count: bg.worker_ids.size
        });
      }

      for (const [method, pg] of Object.entries(payGroups)) {
        await trx('pharmacy_report_payments').insert({
          report_id: reportId, payment_type: method,
          count: pg.count, total_amount: pg.total_amount
        });
      }

      return reportId;
    });

    try {
      await notificationRepository.create({
        roleTarget: 'Finance Manager', title: 'Daily Sales Report',
        message: `Daily Sales Report - $${totalAmount.toFixed(2)} total - Review Required`,
        type: 'sales_report', link: `/finance/pharmacy-reports`
      });
    } catch (e) {}

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { id: result, total_sales: totalSales, total_amount: totalAmount } });
  },

  listReports: async (req, res) => {
    const rows = await db('pharmacy_sales_reports').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  getReport: async (req, res) => {
    const report = await db('pharmacy_sales_reports').where({ id: req.params.id }).first();
    if (!report) throw new AppError('Report not found', HTTP_STATUS.NOT_FOUND);
    const branches = await db('pharmacy_report_branches').where({ report_id: report.id });
    const payments = await db('pharmacy_report_payments').where({ report_id: report.id });
    const finance = await db('pharmacy_finance_records').where({ report_id: report.id }).first();
    res.json({ status: 'success', data: { ...report, branches, payments, finance } });
  },

  // ── Finance (A9/A10) ──
  financeDecision: async (req, res) => {
    const { decision, finance_notes } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw new AppError('Decision must be APPROVED or REJECTED', HTTP_STATUS.BAD_REQUEST);

    const report = await db('pharmacy_sales_reports').where({ id: req.params.id }).first();
    if (!report) throw new AppError('Report not found', HTTP_STATUS.NOT_FOUND);
    if (report.status !== 'PENDING') throw new AppError('Report already decided', HTTP_STATUS.BAD_REQUEST);

    await db('pharmacy_sales_reports').where({ id: report.id }).update({
      status: decision, finance_decision: decision,
      finance_notes: finance_notes || null, finance_decided_at: db.fn.now()
    });

    if (decision === 'APPROVED') {
      const revenue = parseFloat(report.total_amount);
      const cogs = revenue * 0.333;
      const profitLoss = revenue - cogs;
      const result = profitLoss >= 0 ? 'PROFIT' : 'LOSS';

      await db('pharmacy_finance_records').insert({
        report_id: report.id, revenue, cogs, profit_loss: profitLoss,
        result, income_recorded: true
      });

      try {
        await notificationRepository.create({
          roleTarget: 'CEO', title: 'Sales Report Approved',
          message: `Sales Report Approved - $${revenue.toFixed(2)} - Profit: $${profitLoss.toFixed(2)}`,
          type: 'success', link: `/ceo/pharmacy-reports`
        });
        await notificationRepository.create({
          roleTarget: 'Pharmacy Manager', title: 'Sales Report Approved',
          message: `Sales Report Approved - $${revenue.toFixed(2)} - Profit: $${profitLoss.toFixed(2)}`,
          type: 'success', link: `/pharmacy/reports`
        });
      } catch (e) {}
    } else {
      try {
        await notificationRepository.create({
          roleTarget: 'CEO', title: 'Sales Report Rejected',
          message: `Sales Report Rejected - Reason: ${finance_notes || 'No reason provided'}`,
          type: 'report_rejected', link: `/ceo/pharmacy-reports`
        });
        await notificationRepository.create({
          roleTarget: 'Pharmacy Manager', title: 'Sales Report Rejected',
          message: `Sales Report Rejected - Reason: ${finance_notes || 'No reason provided'}`,
          type: 'report_rejected', link: `/pharmacy/reports`
        });
      } catch (e) {}
    }

    res.json({ status: 'success', data: { id: report.id, status: decision } });
  },

  // ── Profit/Loss (A13) ──
  getProfitLoss: async (req, res) => {
    const rows = await db('pharmacy_finance_records');
    const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.revenue || 0), 0);
    const totalCogs = rows.reduce((s, r) => s + parseFloat(r.cogs || 0), 0);
    const totalProfitLoss = rows.reduce((s, r) => s + parseFloat(r.profit_loss || 0), 0);
    const overallResult = totalProfitLoss >= 0 ? 'PROFIT' : 'LOSS';
    res.json({
      status: 'success',
      data: { total_revenue: totalRevenue, total_cogs: totalCogs, profit_loss: totalProfitLoss, result: overallResult }
    });
  },

  // ── Audit Trail (A14) ──
  listAuditTrail: async (req, res) => {
    const rows = await db('pharmacy_audit_trail').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  // ── Expired Drugs (B4) ──
  createExpiredDrug: async (req, res) => {
    const { drug_name, quantity, expiry_date, location, action_required } = req.body;
    if (!drug_name || !quantity || !expiry_date) throw new AppError('drug_name, quantity, expiry_date required', HTTP_STATUS.BAD_REQUEST);

    await db('pharmacy_expired_drugs').insert({
      drug_name, quantity, expiry_date, location: location || null,
      action_required: action_required || 'DISPOSE',
      status: 'PENDING', requested_by: req.user.id
    });

    try {
      await notificationRepository.create({
        roleTarget: 'CEO', title: 'Expired Drug Reported',
        message: `Expired drug reported: ${drug_name} x${quantity}`,
        type: 'expired_drug', link: `/ceo/expired-drugs`
      });
      await notificationRepository.create({
        roleTarget: 'Store Manager', title: 'Expired Drug Reported',
        message: `Expired drug: ${drug_name} x${quantity}`,
        type: 'expired_drug', link: `/store/expired-drugs`
      });
      await notificationRepository.create({
        roleTarget: 'Finance Manager', title: 'Expired Drug Reported',
        message: `Expired drug reported: ${drug_name} x${quantity}`,
        type: 'expired_drug', link: `/finance/expired-drugs`
      });
    } catch (e) {}

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { drug_name, quantity, status: 'PENDING' } });
  },

  listExpiredDrugs: async (req, res) => {
    const rows = await db('pharmacy_expired_drugs').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  ceoDecideExpiredDrug: async (req, res) => {
    const { decision, ceo_notes } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw new AppError('Decision must be APPROVED or REJECTED', HTTP_STATUS.BAD_REQUEST);

    const drug = await db('pharmacy_expired_drugs').where({ id: req.params.id }).first();
    if (!drug) throw new AppError('Expired drug record not found', HTTP_STATUS.NOT_FOUND);

    await db('pharmacy_expired_drugs').where({ id: drug.id }).update({
      status: decision, ceo_notes: ceo_notes || null
    });

    res.json({ status: 'success', data: { id: drug.id, drug_name: drug.drug_name, status: decision } });
  },

  // ── Hide Drug (B5) ──
  createDrugHide: async (req, res) => {
    const { drug_id, drug_name, reason, hide_type, auto_show_at, notify_ceo } = req.body;
    if (!drug_name || !reason || !hide_type) throw new AppError('drug_name, reason, hide_type required', HTTP_STATUS.BAD_REQUEST);

    await db('pharmacy_drug_hide_log').insert({
      drug_id: drug_id || null, drug_name, reason,
      hide_type: hide_type || 'TEMPORARY',
      auto_show_at: auto_show_at || null,
      notify_ceo: notify_ceo || false,
      hidden_by: req.user.id
    });

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { drug_name, hide_type } });
  },

  listDrugHide: async (req, res) => {
    const rows = await db('pharmacy_drug_hide_log').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  // ── Customer Queries (B6) ──
  createCustomerQuery: async (req, res) => {
    const { drug_name, channel, response_status, customer_name, customer_phone, notify_on_restock } = req.body;
    if (!drug_name || !channel || !response_status || !customer_name) {
      throw new AppError('drug_name, channel, response_status, customer_name required', HTTP_STATUS.BAD_REQUEST);
    }

    await db('pharmacy_customer_queries').insert({
      drug_name, channel, response_status, customer_name,
      customer_phone: customer_phone || null,
      notify_on_restock: notify_on_restock || false
    });

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { drug_name, customer_name, response_status } });
  },

  listCustomerQueries: async (req, res) => {
    const rows = await db('pharmacy_customer_queries').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  // ── Prescriptions (B7/B9) ──
  createPrescription: async (req, res) => {
    const { customer_name, customer_phone, drug_name, quantity, prescription_file, source, intake_source, special_instructions, branch_pickup } = req.body;
    if (!customer_name || !drug_name || !quantity || !source) {
      throw new AppError('customer_name, drug_name, quantity, source required', HTTP_STATUS.BAD_REQUEST);
    }

    const lastRef = await db('pharmacy_prescriptions').orderBy('id', 'desc').first();
    const referenceNo = generateRefNo(lastRef);

    await db('pharmacy_prescriptions').insert({
      customer_name, customer_phone: customer_phone || null,
      drug_name, quantity, prescription_file: prescription_file || null,
      source, intake_source: intake_source || null,
      special_instructions: special_instructions || null,
      status: 'PENDING', reference_no: referenceNo,
      branch_pickup: branch_pickup || null
    });

    try {
      await notificationRepository.create({
        roleTarget: 'Pharmacy Worker', title: 'Prescription Request',
        message: `New prescription: ${drug_name} x${quantity} for ${customer_name}`,
        type: 'prescription', link: `/pharmacy/prescriptions`
      });
    } catch (e) {}

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { reference_no: referenceNo, status: 'PENDING' } });
  },

  listPrescriptions: async (req, res) => {
    const rows = await db('pharmacy_prescriptions').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  updatePrescriptionStatus: async (req, res) => {
    const { status } = req.body;
    if (!['PREPARED', 'PICKED_UP'].includes(status)) throw new AppError('Status must be PREPARED or PICKED_UP', HTTP_STATUS.BAD_REQUEST);

    const rx = await db('pharmacy_prescriptions').where({ id: req.params.id }).first();
    if (!rx) throw new AppError('Prescription not found', HTTP_STATUS.NOT_FOUND);

    await db('pharmacy_prescriptions').where({ id: rx.id }).update({ status });

    res.json({ status: 'success', data: { id: rx.id, reference_no: rx.reference_no, status } });
  },

  // ── Manager Requests (B2) ──
  createManagerRequest: async (req, res) => {
    const { drug_name, request_type, current_value, requested_value, reason } = req.body;
    if (!drug_name || !request_type || requested_value === undefined) {
      throw new AppError('drug_name, request_type, requested_value required', HTTP_STATUS.BAD_REQUEST);
    }

    await db('pharmacy_manager_requests').insert({
      drug_name, request_type: request_type || 'QUANTITY',
      current_value: current_value || 0, requested_value,
      status: 'PENDING', reason: reason || null, requested_by: req.user.id
    });

    try {
      await notificationRepository.create({
        roleTarget: 'CEO', title: 'Manager Update Request',
        message: `Manager requested ${request_type} change for ${drug_name}: ${current_value} -> ${requested_value}`,
        type: 'info', link: `/ceo/manager-requests`
      });
    } catch (e) {}

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { drug_name, request_type, status: 'PENDING' } });
  },

  listManagerRequests: async (req, res) => {
    const rows = await db('pharmacy_manager_requests').orderBy('created_at', 'desc');
    res.json({ status: 'success', data: rows });
  },

  ceoDecideManagerRequest: async (req, res) => {
    const { ceo_value } = req.body;
    if (ceo_value === undefined || ceo_value === null) throw new AppError('ceo_value is required', HTTP_STATUS.BAD_REQUEST);

    const reqRec = await db('pharmacy_manager_requests').where({ id: req.params.id }).first();
    if (!reqRec) throw new AppError('Manager request not found', HTTP_STATUS.NOT_FOUND);
    if (reqRec.status !== 'PENDING') throw new AppError('Request already decided', HTTP_STATUS.BAD_REQUEST);

    const parsedCeo = parseFloat(ceo_value);
    const parsedRequested = parseFloat(reqRec.requested_value);
    const newStatus = parsedCeo === parsedRequested ? 'APPROVED' : 'REJECTED';

    await db('pharmacy_manager_requests').where({ id: reqRec.id }).update({
      ceo_value: parsedCeo, status: newStatus
    });

    res.json({ status: 'success', data: { id: reqRec.id, status: newStatus } });
  },

  // ── Pharmacy Pending Shipments ──
  getPharmacyPendingShipments: async (req, res) => {
    const rows = await db('approvals as a')
      .leftJoin('issue_vouchers as iv', 'a.id', 'iv.approval_id')
      .leftJoin('grn as g', 'iv.id', 'g.issue_voucher_id')
      .select(
        'a.id', 'a.apr_no', 'a.req_no', 'a.drug_name', 'a.quantity_approved',
        'a.approved_at', 'a.approved_by_name',
        'iv.id as voucher_id', 'iv.status as voucher_status', 'iv.iss_no',
        'iv.quantity_issued', 'iv.issued_at', 'iv.issued_by_name',
        'g.id as grn_id', 'g.status as grn_status', 'g.quantity_received',
        'g.received_at'
      )
      .where('a.decision', 'APPROVED')
      .orderByRaw('COALESCE(g.received_at, iv.issued_at, a.approved_at) desc');

    const mapped = rows.map(r => {
      let shipmentStatus = 'pending_store';
      if (r.grn_status === 'COMPLETED') shipmentStatus = 'received';
      else if (r.voucher_status === 'ISSUED') shipmentStatus = 'shipped';
      else if (r.voucher_id) shipmentStatus = 'accepted';
      return { ...r, shipmentStatus };
    });

    res.json({ status: 'success', data: mapped });
  }
};

module.exports = salesController;
