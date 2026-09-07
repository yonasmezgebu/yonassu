const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { HTTP_STATUS } = require('../../utils/constants');
const notificationRepository = require('../../repositories/notification.repository');
const { sendFinanceNotification } = require('../../services/notification.service');
const vatConfigService = require('../../services/vatConfig.service');
const { generateInvoiceNumber } = require('../../utils/orderNumber');
const { recordInvoiceForOrder, recordReceiptForOrder } = require('../../services/invoiceDocument.service');

function generateReceiptNo(last) {
  try {
    const num = last && last.receipt_no ? parseInt(last.receipt_no.split('-')[2]) + 1 : 1;
    const safeNum = isNaN(num) ? 1 : num;
    return `REC-${new Date().getFullYear()}-${String(safeNum).padStart(3, '0')}`;
  } catch {
    return `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  }
}

function generateRefNo(last) {
  const num = last ? parseInt(last.reference_no.split('-')[2]) + 1 : 1;
  return `REF-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
}

const salesController = {

  // ── Sales (A2/A3) ──
  createSale: async (req, res) => {
    const { branch_id, worker_id, sale_type, items, payment, skip_stock_deduction, is_unsubmitted } = req.body;
    if (!items || items.length === 0) throw new AppError('At least one item required', HTTP_STATUS.BAD_REQUEST);
    if (!payment) throw new AppError('Payment details required', HTTP_STATUS.BAD_REQUEST);

    // Worker is optional — try to find it if provided, but don't fail if absent
    let worker = null;
    if (worker_id) {
      worker = await db('pharmacy_workers').where({ id: worker_id }).first();
    }
    // If no worker found by id, try to pick the first available worker in the branch
    if (!worker && branch_id) {
      worker = await db('pharmacy_workers').where({ branch_id, post_permission: true }).first();
    }
    // Final fallback: any worker at all
    if (!worker) {
      worker = await db('pharmacy_workers').first();
    }

    // Branch lookup — try pharmacy_branches first, then fallback to main branches table
    let branch = null;
    if (branch_id) {
      branch = await db('pharmacy_branches').where({ id: branch_id }).first();
      if (!branch) {
        // Might be an ERP branch id — get name from branches table and map to pharmacy_branches
        const erpBranch = await db('branches').where({ id: branch_id }).first();
        if (erpBranch) {
          branch = await db('pharmacy_branches').where({ name: erpBranch.name }).first();
          if (!branch) {
            // Use the ERP branch data directly as a duck-typed branch
            branch = { id: branch_id, name: erpBranch.name };
          }
        }
      }
    }
    // Final fallback: first available pharmacy branch
    if (!branch) {
      branch = await db('pharmacy_branches').first();
    }
    if (!branch) throw new AppError('No pharmacy branch available', HTTP_STATUS.BAD_REQUEST);

    const lastReceipt = await db('pharmacy_sales').orderBy('id', 'desc').first();
    const receiptNo = generateReceiptNo(lastReceipt);

    const totalProducts = items.reduce((s, i) => s + i.quantity, 0);

    // Central VAT — consistent with the cart/order pricing shown in the pharmacy POS
    let subtotal = 0;
    let vatAmount = 0;
    const vatLineItems = [];
    for (const it of items) {
      const lineSubtotal = (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity) || 1);
      subtotal += lineSubtotal;
      let drug = null;
      if (it.drug_id) drug = await db('pharmacy_medications').where({ id: it.drug_id }).first();
      if (!drug && it.drug_name) drug = await db('pharmacy_medications').where({ name: it.drug_name }).first();
      const vatResult = await vatConfigService.computeVatForItem('pharmacy', drug ? drug.id : null, lineSubtotal);
      const lineVat = parseFloat(vatResult.vat.toFixed(2));
      vatAmount += lineVat;
      vatLineItems.push({ vat_amount: lineVat, rate: vatResult.rate, treatment: vatResult.treatment, cost_price: drug ? parseFloat(drug.price || 0) : 0 });
    }
    const totalAmount = parseFloat((subtotal + vatAmount).toFixed(2));

    const effectiveWorkerId = worker ? worker.id : null;

    const result = await db.transaction(async (trx) => {
      const [saleId] = await trx('pharmacy_sales').insert({
        branch_id, worker_id: effectiveWorkerId, sale_type: sale_type || 'WALK-IN',
        recipient_name: payment.recipient_name || null,
        recipient_phone: payment.recipient_phone || null,
        total_products: totalProducts, subtotal, vat_amount: vatAmount, total_amount: totalAmount, receipt_no: receiptNo,
        is_submitted: !is_unsubmitted
      });

      const saleItems = items.map((it, idx) => ({
        sale_id: saleId, drug_name: it.drug_name,
        quantity: it.quantity, unit_price: it.unit_price,
        total_price: it.unit_price * it.quantity,
        vat_amount: vatLineItems[idx] ? vatLineItems[idx].vat_amount : 0
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
        branch_name: payment.branch_name || branch.name,
        worker_name: payment.worker_name || (worker ? worker.name : 'N/A'),
        status: payment.status || 'PAID', receipt_no: receiptNo
      });

      // ── Auto-post to Finance CRV (Cash Receipt Voucher) ──────────────────
      const methodMap = {
        CASH: 'Cash',
        BANK_TRANSFER: 'Bank',
        TELBIR: 'Telebirr',
        TELEBIRR: 'Telebirr',
      };
      const financePayMethod = methodMap[(payment.method || 'CASH').toUpperCase()] || 'Cash';

      const lastCrv = await trx('finance_crvs').orderBy('id', 'desc').first();
      const nextSeq = (lastCrv?.id || 0) + 1;
      const crvNumber = `CRV-${new Date().getFullYear()}-${String(nextSeq).padStart(4, '0')}`;
      
      const paymentRef = payment.reference_no || (req.file ? req.file.filename : receiptNo);

      const crvData = {
        crv_number: crvNumber,
        date: new Date(),
        received_from: payment.recipient_name || 'Walk-in Customer',
        amount: payment.amount || totalAmount,
        payment_method: financePayMethod,
        description: `Pharmacy Sale — Receipt ${receiptNo} (${branch.name || 'Pharmacy'})`,
        reference_no: paymentRef,
        prepared_by: payment.worker_name || (worker ? worker.name : 'Pharmacy Staff'),
        receiver_name: payment.worker_name || (worker ? worker.name : 'Pharmacy Staff'),
      };

      // Attach bank or telebirr details so finance reconciles correctly
      if (financePayMethod === 'Bank') {
        crvData.bank_name = payment.bank_name || null;
        crvData.account_holder = payment.account_holder || null;
        crvData.account_number = payment.account_number || null;
      }
      if (financePayMethod === 'Telebirr') {
        crvData.telebirr_number = payment.telbir_number || null;
      }
      
      // Save screenshot in manual_details if uploaded
      if (req.file) {
        crvData.manual_details = JSON.stringify({ paymentScreenshot: req.file.filename });
      }

      await trx('finance_crvs').insert(crvData);
      // ─────────────────────────────────────────────────────────────────────


      // Invoice + receipt are recorded at sale time — payment is collected here.
      const invoiceLines = items.map((it, idx) => ({
        itemId: it.drug_id || 0,
        name: it.drug_name,
        qty: parseInt(it.quantity) || 1,
        unitPrice: parseFloat(it.unit_price) || 0,
        costPrice: vatLineItems[idx] ? (vatLineItems[idx].cost_price || 0) : 0,
        amount: (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity) || 1),
        rate: vatLineItems[idx].rate,
        treatment: vatLineItems[idx].treatment
      }));
      const invNo = await generateInvoiceNumber();
      const invRes = await recordInvoiceForOrder(trx, {
        source: 'pharmacy',
        saleId,
        saleType: String(sale_type || 'WALK-IN').toUpperCase() === 'ONLINE' ? 'online' : 'walk_in',
        invoiceNo: invNo,
        customer: payment.recipient_name || null,
        customerTin: null,
        lines: invoiceLines,
        createdBy: worker ? worker.name : (payment.worker_name || 'Pharmacy Staff')
      });
      await recordReceiptForOrder(trx, {
        invoiceId: invRes.invoiceId,
        amountPaid: payment.amount || totalAmount,
        paymentMethod: payment.method || 'CASH',
        paymentReference: null,
        receivedBy: payment.worker_name || (worker ? worker.name : 'Pharmacy Staff')
      });

      // Always deduct stock on every completed sale (online or walk-in)
      for (const item of items) {
        // Try to find drug by id first, then by exact name, then case-insensitive
        let drug = null;
        if (item.drug_id) {
          drug = await trx('pharmacy_medications').where({ id: item.drug_id }).first();
        }
        if (!drug) {
          drug = await trx('pharmacy_medications').where({ name: item.drug_name }).first();
        }
        if (!drug) {
          drug = await trx('pharmacy_medications').whereRaw('LOWER(name) = LOWER(?)', [item.drug_name]).first();
        }
        if (drug) {
          const newStock = Math.max(0, (parseInt(drug.stock_quantity) || 0) - (parseInt(item.quantity) || 0));
          await trx('pharmacy_medications').where({ id: drug.id }).update({ stock_quantity: newStock });
        }
      }

      // Always record audit trail for every sale (walk-in shown as UNSUBMITTED, submitted immediately if not is_unsubmitted)
      if (effectiveWorkerId || branchId) {
        await trx('pharmacy_audit_trail').insert({
          branch_id,
          worker_id: effectiveWorkerId,
          action: is_unsubmitted ? 'PAID' : (payment.status || 'PAID'),
          recipient: payment.recipient_name || 'Walk-in Customer',
          amount: payment.amount || totalAmount
        });
      }

      return saleId;
    });

    res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { id: result, receipt_no: receiptNo } });
  },

  listSales: async (req, res) => {
    const { branch_id, worker_id, start_date, end_date, all: showAll } = req.query;
    let query = db('pharmacy_sales')
      .leftJoin('pharmacy_branches', 'pharmacy_sales.branch_id', 'pharmacy_branches.id')
      .leftJoin('pharmacy_workers', 'pharmacy_sales.worker_id', 'pharmacy_workers.id')
      .leftJoin('pharmacy_payments', 'pharmacy_sales.id', 'pharmacy_payments.sale_id')
      .select(
        'pharmacy_sales.*',
        'pharmacy_branches.name as branch_name',
        'pharmacy_workers.name as worker_name',
        'pharmacy_payments.payment_method',
        'pharmacy_payments.bank_name',
        'pharmacy_payments.account_holder',
        'pharmacy_payments.account_number',
        'pharmacy_payments.telbir_number',
        'pharmacy_payments.recipient_name as payment_recipient_name',
        'pharmacy_payments.recipient_phone as payment_recipient_phone',
        'pharmacy_payments.status as payment_status',
        'pharmacy_payments.receipt_no'
      )
      .orderBy('pharmacy_sales.created_at', 'desc');

    // ?all=true shows both submitted and unsubmitted (for manager/finance views)
    if (!showAll || showAll === 'false') {
      query = query.where(function() {
        this.where('pharmacy_sales.is_submitted', false).orWhereNull('pharmacy_sales.is_submitted');
      });
    }

    if (branch_id) query = query.where('pharmacy_sales.branch_id', branch_id);
    if (worker_id) query = query.where('pharmacy_sales.worker_id', worker_id);
    if (start_date) query = query.where('pharmacy_sales.created_at', '>=', new Date(start_date));
    if (end_date) query = query.where('pharmacy_sales.created_at', '<=', new Date(end_date));
    
    const rows = await query;
    // Attach sale items if there are not too many rows (limit to keep response fast)
    if (rows.length <= 200) {
      for (const row of rows) {
        row.items = await db('pharmacy_sale_items').where({ sale_id: row.id });
      }
    }
    res.json({ status: 'success', data: rows });
  },

  submitDaily: async (req, res) => {
    const { branch_id: reqBranchId, worker_name: reqWorkerName } = req.body || {};

    // Fetch all unsubmitted sales (optionally scoped to branch)
    let salesQuery = db('pharmacy_sales')
      .where(function() { this.where('is_submitted', false).orWhereNull('is_submitted'); });
    if (reqBranchId) salesQuery = salesQuery.where('branch_id', reqBranchId);
    const unsubmitted = await salesQuery;

    if (unsubmitted.length === 0) {
      throw new AppError('No pending sales to submit', HTTP_STATUS.BAD_REQUEST);
    }

    const totalTransactions = unsubmitted.length;
    const totalAmount = unsubmitted.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);

    let workerId = unsubmitted[0].worker_id;
    let branchId = reqBranchId || unsubmitted[0].branch_id || 1;

    // Ensure workerId is valid
    let validWorker = await db('pharmacy_workers').where({ id: workerId || 0 }).first();
    if (!validWorker) {
      validWorker = await db('pharmacy_workers').first();
      if (validWorker) {
        workerId = validWorker.id;
        branchId = validWorker.branch_id || branchId;
      } else {
        workerId = null;
      }
    }
    const workerName = reqWorkerName || (validWorker ? validWorker.name : null) ||
      (req.user ? req.user.fullName || req.user.email : 'Pharmacy Worker');

    // Fetch branch name
    const branch = await db('pharmacy_branches').where({ id: branchId }).first() ||
      await db('branches').where({ id: branchId }).first();
    const branchName = branch ? branch.name : 'Main Pharmacy';

    // Collect full payment details from all unsubmitted sales
    const saleIds = unsubmitted.map(s => s.id);
    const payments = await db('pharmacy_payments').whereIn('sale_id', saleIds);
    const saleItems = await db('pharmacy_sale_items').whereIn('sale_id', saleIds);

    // Build payment breakdown summary
    const methodBreakdown = {};
    for (const p of payments) {
      const m = p.payment_method || 'CASH';
      if (!methodBreakdown[m]) methodBreakdown[m] = { count: 0, amount: 0 };
      methodBreakdown[m].count++;
      methodBreakdown[m].amount += parseFloat(p.amount || 0);
    }

    // Build a rich snapshot for Finance to verify
    const financeDetails = {
      paymentMethod: payments.length > 0 ? (payments[0].payment_method || 'CASH') : 'CASH',
      receivedFrom: workerName,
      paymentReference: null,
      totalTransactions,
      totalAmount,
      branchName,
      workerName,
      submittedAt: new Date().toISOString(),
      methodBreakdown,
      sales: unsubmitted.map(sale => {
        const pmt = payments.find(p => p.sale_id === sale.id);
        const items = saleItems.filter(i => i.sale_id === sale.id);
        return {
          receipt_no: sale.receipt_no,
          sale_id: sale.id,
          amount: sale.total_amount,
          sale_type: sale.sale_type,
          customer: sale.recipient_name || 'Walk-in',
          customer_phone: sale.recipient_phone || null,
          payment_method: pmt ? pmt.payment_method : 'CASH',
          bank_name: pmt ? pmt.bank_name : null,
          account_holder: pmt ? pmt.account_holder : null,
          account_number: pmt ? pmt.account_number : null,
          telbir_number: pmt ? pmt.telbir_number : null,
          reference_no: pmt ? pmt.receipt_no : null,
          screenshot: pmt ? pmt.screenshot_path : null,
          items: items.map(i => ({
            drug_name: i.drug_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.total_price
          }))
        };
      })
    };

    await db.transaction(async (trx) => {
      // 1. Audit trail entry
      await trx('pharmacy_audit_trail').insert({
        branch_id: branchId,
        worker_id: workerId,
        action: 'DAILY_SUBMIT',
        recipient: `Submitted ${totalTransactions} transactions — ETB ${totalAmount.toFixed(2)}`,
        amount: totalAmount
      });

      // 2. Mark all unsubmitted sales as submitted
      await trx('pharmacy_sales')
        .whereIn('id', saleIds)
        .update({ is_submitted: true });

      // 3. Push to Finance Live Income with all payment details
      const refNo = `PHARM-${branchName.replace(/\s+/g, '')}-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-5)}`;
      await trx('finance_income_submissions').insert({
        department: 'Pharmacy',
        submitted_by: workerName,
        amount: totalAmount,
        reference_no: refNo,
        description: `Pharmacy Sales Submission — ${totalTransactions} transaction(s) from ${branchName} by ${workerName}`,
        status: 'Pending',
        manual_details: JSON.stringify(financeDetails),
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    });

    // 4. Fire Finance notification
    try {
      const { sendFinanceNotification } = require('../../services/notification.service');
      sendFinanceNotification({
        title: '💊 Pharmacy Sales Submitted',
        message: `ETB ${totalAmount.toFixed(2)} — ${totalTransactions} transaction(s) from ${branchName} (by ${workerName}). Awaiting Finance approval.`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list'
      }, req.app?.get('io')).catch(() => {});
    } catch (_) {}

    res.json({
      status: 'success',
      data: {
        message: `Daily sales submitted to Finance successfully! ${totalTransactions} transaction(s) — ETB ${totalAmount.toFixed(2)}`,
        totalTransactions,
        totalAmount,
        branchName
      }
    });
  },

  getSale: async (req, res) => {
    const sale = await db('pharmacy_sales')
      .where('id', req.params.id)
      .orWhere('receipt_no', req.params.id)
      .first();
    if (!sale) throw new AppError('Sale not found', HTTP_STATUS.NOT_FOUND);
    const items = await db('pharmacy_sale_items').where({ sale_id: sale.id });
    const payment = await db('pharmacy_payments').where({ sale_id: sale.id }).first();
    res.json({ status: 'success', data: { ...sale, items, payment } });
  },

  processReturn: async (req, res) => {
    const { id } = req.params;
    const { items, reason, refundMethod } = req.body;
    
    if (!items || !items.length) throw new AppError('No items provided for return', HTTP_STATUS.BAD_REQUEST);
    
    const sale = await db('pharmacy_sales').where({ id }).first();
    if (!sale) throw new AppError('Sale not found', HTTP_STATUS.NOT_FOUND);
    if (sale.sale_type === 'CANCELED' || sale.sale_type === 'RETURNED') {
      throw new AppError('Sale is already canceled or returned', HTTP_STATUS.BAD_REQUEST);
    }
    
    let totalRefund = 0;
    
    await db.transaction(async (trx) => {
      // 1. Process items
      for (const reqItem of items) {
        if (!reqItem.returnQty || reqItem.returnQty <= 0) continue;
        
        const saleItem = await trx('pharmacy_sale_items').where({ id: reqItem.id, sale_id: sale.id }).first();
        if (!saleItem) continue;
        if (reqItem.returnQty > saleItem.quantity) throw new AppError(`Cannot return more than purchased for ${saleItem.drug_name}`, HTTP_STATUS.BAD_REQUEST);
        
        const itemRefund = reqItem.returnQty * saleItem.unit_price;
        totalRefund += itemRefund;
        
        // Update stock only if condition is GOOD
        if (reqItem.condition === 'GOOD') {
          // Find drug
          let drug = await trx('pharmacy_medications').where({ name: saleItem.drug_name }).first();
          if (!drug) drug = await trx('pharmacy_medications').whereRaw('LOWER(name) = LOWER(?)', [saleItem.drug_name]).first();
          
          if (drug) {
            const newStock = (parseInt(drug.stock_quantity) || 0) + parseInt(reqItem.returnQty);
            await trx('pharmacy_medications').where({ id: drug.id }).update({ stock_quantity: newStock });
          }
        }
        
        // Deduct from the sale_item quantity
        const newQty = saleItem.quantity - reqItem.returnQty;
        await trx('pharmacy_sale_items').where({ id: saleItem.id }).update({
          quantity: newQty,
          total_price: newQty * saleItem.unit_price
        });
      }
      
      if (totalRefund <= 0) {
        throw new AppError('No valid return quantities provided', HTTP_STATUS.BAD_REQUEST);
      }
      
      // 2. Update Sale totals
      const newTotalProducts = sale.total_products - items.reduce((s, i) => s + (parseInt(i.returnQty) || 0), 0);
      const newTotalAmount = parseFloat(sale.total_amount) - totalRefund;
      const newStatus = newTotalProducts <= 0 ? 'RETURNED' : sale.sale_type;
      
      await trx('pharmacy_sales').where({ id: sale.id }).update({
        total_products: Math.max(0, newTotalProducts),
        total_amount: Math.max(0, newTotalAmount),
        sale_type: newStatus
      });
      
      // Update Payment totals
      const payment = await trx('pharmacy_payments').where({ sale_id: sale.id }).first();
      if (payment) {
        await trx('pharmacy_payments').where({ id: payment.id }).update({
          amount: Math.max(0, parseFloat(payment.amount) - totalRefund)
        });
      }
      
      // 3. Create Audit Trail
      let workerId = sale.worker_id;
      let branchId = sale.branch_id;
      
      // Ensure workerId is a valid pharmacy worker
      let validWorker = await trx('pharmacy_workers').where({ id: workerId || 0 }).first();
      if (!validWorker) {
        validWorker = await trx('pharmacy_workers').first();
        if (validWorker) {
          workerId = validWorker.id;
          branchId = validWorker.branch_id || branchId;
        } else {
          workerId = null;
        }
      }
      
      await trx('pharmacy_audit_trail').insert({
        branch_id: branchId,
        worker_id: workerId,
        action: 'RETURN',
        recipient: `Refund: ${refundMethod} | Reason: ${reason} | Receipt: ${sale.receipt_no}`,
        amount: -totalRefund
      });
    });

    res.json({
      status: 'success',
      data: { message: 'Return processed successfully', totalRefund }
    });
  },

  // ── Branches (A1) ──
  listBranches: async (req, res) => {
    const rows = await db('branches').orderBy('name', 'asc');
    res.json({ status: 'success', data: rows });
  },

  toggleBranch: async (req, res) => {
    const branch = await db('branches').where({ id: req.params.id }).first();
    if (!branch) throw new AppError('Branch not found', HTTP_STATUS.NOT_FOUND);
    const newStatus = !branch.is_active;
    await db('branches').where({ id: branch.id }).update({ is_active: newStatus });
    res.json({ status: 'success', data: { id: branch.id, is_active: newStatus } });
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

  // ── Audit Trail (A14) — enriched with full sale/prescription/stock snapshots ──
  listAuditTrail: async (req, res) => {
    const { worker_id, search, limit = 100 } = req.query;

    // 1. Load raw audit trail entries
    let q = db('pharmacy_audit_trail as at')
      .leftJoin('pharmacy_workers as w', 'at.worker_id', 'w.id')
      .leftJoin('pharmacy_branches as b', 'at.branch_id', 'b.id')
      .select(
        'at.*',
        'w.name as worker_name',
        'b.name as branch_name'
      )
      .orderBy('at.created_at', 'desc')
      .limit(parseInt(limit));

    if (worker_id) q = q.where('at.worker_id', worker_id);
    if (search) {
      q = q.where(function () {
        this.where('at.action', 'like', `%${search}%`)
            .orWhere('at.recipient', 'like', `%${search}%`)
            .orWhere('w.name', 'like', `%${search}%`);
      });
    }

    const rows = await q;

    // 2. For each PAID / CASHOUT entry, find the matching sale and enrich
    const enriched = await Promise.all(rows.map(async (row) => {
      const entry = { ...row };

      if (['PAID', 'CASHOUT', 'RETURN'].includes(row.action)) {
        // Find the sale closest in time to this audit entry for this worker/branch
        const sale = await db('pharmacy_sales as s')
          .leftJoin('pharmacy_payments as p', 's.id', 'p.sale_id')
          .where('s.branch_id', row.branch_id)
          .where(function () {
            if (row.worker_id) this.where('s.worker_id', row.worker_id);
          })
          .where('s.created_at', '<=', row.created_at)
          .orderBy('s.created_at', 'desc')
          .select(
            's.id as sale_id', 's.receipt_no', 's.sale_type', 's.total_products',
            's.total_amount', 's.created_at as sale_date',
            's.recipient_name', 's.recipient_phone',
            'p.payment_method', 'p.bank_name', 'p.telbir_number',
            'p.status as payment_status'
          )
          .first();

        if (sale) {
          const items = await db('pharmacy_sale_items')
            .where({ sale_id: sale.sale_id })
            .select('drug_name', 'quantity', 'unit_price', 'total_price');

          entry.snapshot = {
            receipt_no: sale.receipt_no,
            sale_type: sale.sale_type,
            total_products: sale.total_products,
            total_amount: sale.total_amount,
            sale_date: sale.sale_date,
            customer: sale.recipient_name || 'Walk-in',
            customer_phone: sale.recipient_phone || null,
            payment_method: sale.payment_method || 'CASH',
            bank_name: sale.bank_name || null,
            telbir_number: sale.telbir_number || null,
            payment_status: sale.payment_status || 'PAID',
            items: items || [],
          };
        }
      }

      if (row.action === 'DAILY_SUBMIT') {
        // Attach the most recent submitted batch summary
        const submittedSales = await db('pharmacy_sales')
          .where('is_submitted', true)
          .where('branch_id', row.branch_id)
          .where('created_at', '<=', row.created_at)
          .select('id', 'receipt_no', 'total_amount', 'sale_type', 'created_at')
          .orderBy('created_at', 'desc')
          .limit(50);

        entry.snapshot = {
          submitted_count: submittedSales.length,
          total_amount: row.amount,
          sales: submittedSales,
          note: row.recipient,
        };
      }

      return entry;
    }));

    // 3. Also pull pharmacy prescriptions and stock movements as extra audit events
    let prescriptions = [];
    try {
      let pq = db('pharmacy_prescriptions')
        .select(
          'id', 'reference_no', 'customer_name', 'customer_phone',
          'drug_name', 'quantity', 'status', 'source', 'created_at'
        )
        .orderBy('created_at', 'desc')
        .limit(50);
      prescriptions = (await pq).map(p => ({
        id: `rx-${p.id}`,
        action: `PRESCRIPTION_${p.status}`,
        recipient: `${p.customer_name}${p.customer_phone ? ' · ' + p.customer_phone : ''}`,
        amount: null,
        created_at: p.created_at,
        worker_name: null,
        branch_name: null,
        snapshot: {
          reference_no: p.reference_no,
          drug_name: p.drug_name,
          quantity: p.quantity,
          status: p.status,
          source: p.source,
          customer: p.customer_name,
          customer_phone: p.customer_phone,
        },
      }));
    } catch (e) {}

    let stockMovements = [];
    try {
      stockMovements = (await db('pharmacy_stock_movements as sm')
        .leftJoin('pharmacy_medications as m', 'sm.medication_id', 'm.id')
        .select(
          'sm.id', 'sm.quantity_change', 'sm.reason', 'sm.reference_no',
          'sm.created_at', 'm.name as drug_name', 'm.unit', 'm.stock_quantity'
        )
        .orderBy('sm.created_at', 'desc')
        .limit(30)
      ).map(sm => ({
        id: `stock-${sm.id}`,
        action: sm.quantity_change > 0 ? 'STOCK_IN' : 'STOCK_OUT',
        recipient: sm.reason || 'Stock adjustment',
        amount: null,
        created_at: sm.created_at,
        worker_name: null,
        branch_name: null,
        snapshot: {
          drug_name: sm.drug_name,
          quantity_change: sm.quantity_change,
          reason: sm.reason,
          reference_no: sm.reference_no,
          current_stock: sm.stock_quantity,
          unit: sm.unit,
        },
      }));
    } catch (e) {}

    // 4. Merge + sort by date descending
    const combined = [...enriched, ...prescriptions, ...stockMovements]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ status: 'success', data: combined });
  },

  // ── Expired Drugs (B4) ──
  createExpiredDrug: async (req, res) => {
    const { drug_name, quantity, expiry_date, location, action_required } = req.body;
    if (!drug_name || !quantity || !expiry_date) throw new AppError('drug_name, quantity, expiry_date required', HTTP_STATUS.BAD_REQUEST);

    const safeDate = expiry_date ? expiry_date.split('T')[0] : expiry_date;
    await db('pharmacy_expired_drugs').insert({
      drug_name, quantity, expiry_date: safeDate, location: location || null,
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
        roleTarget: 'Pharmacy Store Keeper', title: 'Expired Drug Reported',
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
    const { status } = req.query;
    let query = db('pharmacy_prescriptions').orderBy('created_at', 'desc');
    if (status) {
      const statuses = status.split(',').map(s => s.trim().toUpperCase());
      query = query.whereIn('status', statuses);
    }
    const rows = await query;
    res.json({ status: 'success', data: rows });
  },

  updatePrescriptionStatus: async (req, res) => {
    const { status, pickup_branch_id } = req.body;
    const VALID_STATUSES = ['PREPARED', 'PICKED_UP', 'CANCELLED'];
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError('Status must be PREPARED, PICKED_UP or CANCELLED', HTTP_STATUS.BAD_REQUEST);
    }

    const rx = await db('pharmacy_prescriptions').where({ id: req.params.id }).first();
    if (!rx) throw new AppError('Prescription not found', HTTP_STATUS.NOT_FOUND);

    const updatePayload = { status };
    if (pickup_branch_id) updatePayload.branch_pickup = pickup_branch_id;
    await db('pharmacy_prescriptions').where({ id: rx.id }).update(updatePayload);

    res.json({ status: 'success', data: { id: rx.id, reference_no: rx.reference_no, status } });
  },

  // ── Manager Requests (B2) ──
  createManagerRequest: async (req, res) => {
    const { drug_name, drug_id, drug_image, request_type, current_value, requested_value, reason } = req.body;
    if (!drug_name || !request_type || requested_value === undefined) {
      throw new AppError('drug_name, request_type, requested_value required', HTTP_STATUS.BAD_REQUEST);
    }

    await db('pharmacy_manager_requests').insert({
      drug_name, drug_id, drug_image,
      request_type: request_type || 'QUANTITY',
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
    const { status } = req.query;
    let query = db('pharmacy_manager_requests').orderBy('created_at', 'desc');
    if (status) {
      query = query.where('status', status);
    }
    const rows = await query;
    // Attach drug_image from pharmacy_medications if drug_id exists
    const withImages = await Promise.all(rows.map(async (r) => {
      if (r.drug_id) {
        try {
          const drug = await db('pharmacy_medications').where({ id: r.drug_id }).select('drug_image').first();
          if (drug && drug.drug_image) r.drug_image = r.drug_image || drug.drug_image;
        } catch {}
      }
      return r;
    }));
    res.json({ status: 'success', data: withImages });
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

    // Auto-apply stock adjustment when CEO approves a QUANTITY request
    if (newStatus === 'APPROVED' && reqRec.request_type === 'QUANTITY' && reqRec.drug_id) {
      const qtyChange = Math.round(parsedCeo - parseFloat(reqRec.current_value || 0));
      if (qtyChange !== 0) {
        const product = await db('pharmacy_medications').where({ id: reqRec.drug_id }).first();
        if (product) {
          const newStock = (product.stock_quantity || 0) + qtyChange;
          if (newStock >= 0) {
            await db('pharmacy_medications').where({ id: reqRec.drug_id }).update({ stock_quantity: newStock });
            await db('pharmacy_stock_movements').insert({
              medication_id: reqRec.drug_id,
              quantity_change: qtyChange,
              reason: `CEO approved adjustment: ${reqRec.reason || 'Manager request'}`,
              reference_no: `CEO-REQ-${reqRec.id}`,
              created_by: req.user ? req.user.id : null
            });
          }
        }
      }
    }

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
