const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { sendFinanceNotification, sendPrintingNotification, sendCustomerNotification } = require('../../services/notification.service');
const { recordIncomeToLedger, normalizePaymentMethod } = require('../../utils/financeIncome.service');
const { generateInvoiceNumber, generateReceiptNumber } = require('../../utils/orderNumber');
const vatConfigService = require('../../services/vatConfig.service');

// Record an approved income into the canonical finance ledger (CRV + cashbook +
// revenue book) so it shows up in the Revenue Book, Accounts and Reconciliation.
const recordLedgerIncome = async (trx, { amount, department, manualDetails, receivedFrom, referenceNo, receivableInvoiceNo, receivableExtras = {} }) => {
  try {
    const md = manualDetails || {};
    const method = md.paymentMethod || 'Cash';
    const bankDetails = (String(method).toLowerCase().includes('bank') && (md.bankName || md.accountNumber))
      ? { bankName: md.bankName, accountHolder: md.accountHolder, accountNumber: md.accountNumber, chequeNo: md.chequeNo }
      : undefined;
    const telebirrDetails = (String(method).toLowerCase().includes('telebirr') && md.telebirrNumber)
      ? { telebirrNumber: md.telebirrNumber, fullName: md.fullName || receivedFrom || md.receivedFrom }
      : undefined;

    await recordIncomeToLedger({
      trx,
      date: new Date().toISOString().slice(0, 10),
      receivedFrom: receivedFrom || md.receivedFrom || 'Walk-in Customer',
      amount: parseFloat(amount || 0),
      paymentMethod: method,
      description: `${department} income${receivedFrom || md.receivedFrom ? ` — ${receivedFrom || md.receivedFrom}` : ''}`,
      referenceNo: referenceNo || md.paymentReference || null,
      receivableInvoiceNo,
      bankDetails,
      telebirrDetails,
      department,
      extraReceivableDetails: receivableExtras,
    });
  } catch (e) {
    console.error('Failed to record income into ledger (CRV + cashbook + revenue book):', e.message);
  }
};

// Departments/orders whose module already creates its own sales_invoices /
// sales_receipts at sale time — approving their income must NOT mint a second
// (duplicate) invoice.
const SELF_INVOICING_DEPARTMENTS = new Set([
  'pharmacy', 'retail', 'retail pos', 'printing', 'car rental', 'agrirent',
]);

// Create a sales_invoice + sales_receipt for approved income that has no
// underlying invoiced order (manual / walk-in / general inflow), so it appears
// on the Sales Invoice & Receipt page. Idempotent.
const ensureInvoiceAndReceipt = async (trx, { source, saleId, customer, amount, paymentMethod, paymentReference, description, receivedBy }) => {
  try {
    const existing = await trx('sales_invoices')
      .where({ source, sale_id: saleId })
      .andWhereNot('status', 'cancelled')
      .first();
    if (existing) {
      const receipt = await trx('sales_receipts')
        .where({ invoice_id: existing.id })
        .andWhereNot('status', 'cancelled')
        .first();
      if (!receipt) {
        await trx('sales_receipts').insert({
          id: `REC-${existing.id}-${Date.now().toString().slice(-4)}`,
          receipt_no: await generateReceiptNumber(),
          invoice_id: existing.id,
          amount_paid: amount,
          payment_method: paymentMethod || 'Cash',
          payment_reference: paymentReference || null,
          received_by_name: receivedBy || 'Finance',
          status: 'active',
        });
      }
      return existing.id;
    }

    const invoiceId = `${source}-${saleId}-${Date.now().toString().slice(-4)}`;
    const invoiceNo = await generateInvoiceNumber();
    const saleType = normalizePaymentMethod(paymentMethod) === 'Cash' ? 'walk_in' : 'online';

    // Determine correct tax treatment using vatConfigService. We treat the collected `amount` as the grand total.
    let rate = 0.15;
    let treatment = 'standard';
    try {
      const eff = await vatConfigService.effectiveRateFor(source, saleId);
      if (eff) {
        rate = eff.rate;
        treatment = eff.treatment;
      } else {
        const std = await trx('vat_configurations').where({ treatment: 'standard', is_active: true }).orderBy('updated_at', 'desc').first();
        if (std) rate = parseFloat(std.rate);
      }
    } catch (e) {
      console.warn('Failed to fetch effective rate, defaulting to 15% standard', e.message);
    }

    const subtotal = amount / (1 + rate);
    const vat = amount - subtotal;

    await trx('sales_invoices').insert({
      id: invoiceId,
      invoice_no: invoiceNo,
      source,
      sale_id: saleId,
      customer_name: customer || 'Walk-in Customer',
      customer_tin: null,
      subtotal: subtotal,
      vat_standard: treatment === 'standard' ? vat : 0,
      vat_standard_rate: rate,
      vat_exempt: treatment === 'exempt' ? vat : 0,
      vat_zero_rated: treatment === 'zero_rated' || treatment === 'zero-rated' ? vat : 0,
      vat_total: vat,
      total_amount: amount,
      status: 'active',
      created_by_name: receivedBy || 'Finance',
      sale_type: saleType,
    });

    await trx('sales_invoice_items').insert({
      invoice_id: invoiceId,
      item_id: saleId,
      name: (description || 'Approved Income').slice(0, 255),
      qty: 1,
      unit_price: subtotal,
      cost_price: 0,
      treatment: treatment,
      rate: rate,
      vat_amount: vat,
      subtotal: subtotal,
      total: amount,
    });

    await trx('sales_receipts').insert({
      id: `REC-${invoiceId}-${Date.now().toString().slice(-4)}`,
      receipt_no: await generateReceiptNumber(),
      invoice_id: invoiceId,
      amount_paid: amount,
      payment_method: paymentMethod || 'Cash',
      payment_reference: paymentReference || null,
      received_by_name: receivedBy || 'Finance',
      status: 'active',
    });

    return invoiceId;
  } catch (e) {
    console.error('Failed to mint invoice/receipt for approved income:', e.message);
    return null;
  }
};

// For self-invoicing departments the module already created its own
// sales_invoice (with correct VAT) at order time. On finance approval we only
// attach a receipt to that invoice so it shows as PAID (balance 0) on the
// Sales Invoice & Receipt page — approving must never mint a duplicate invoice.
// If the underlying invoice is missing/errored, back-fill a synthetic one so the
// approved submission still appears. Idempotent (keyed on source + sale_id).
const ensureReceiptForInvoicedSubmission = async (trx, { department, manualDetails, amount, receivedBy, allowAdditional = false }) => {
  try {
    const deptKey = String(department || '').toLowerCase().trim();
    const md = manualDetails || {};
    const source = DEPARTMENT_TO_SOURCE[deptKey];
    const orderId = md.order_id;
    if (!source || orderId === undefined || orderId === null) {
      return null;
    }

    let invoice = await trx('sales_invoices')
      .where({ source, sale_id: String(orderId) })
      .andWhereNot('status', 'cancelled')
      .first();

    if (!invoice) {
      const invoiceId = `${source}-${orderId}-${Date.now().toString().slice(-4)}`;
      const invoiceNo = await generateInvoiceNumber();
      const saleType = normalizePaymentMethod(md.paymentMethod || 'Cash') === 'Cash' ? 'walk_in' : 'online';
      
      let rate = 0.15;
      let treatment = 'standard';
      try {
        const eff = await vatConfigService.effectiveRateFor(source, String(orderId));
        if (eff) {
          rate = eff.rate;
          treatment = eff.treatment;
        } else {
          const std = await trx('vat_configurations').where({ treatment: 'standard', is_active: true }).orderBy('updated_at', 'desc').first();
          if (std) rate = parseFloat(std.rate);
        }
      } catch (e) {
        console.warn('Failed to fetch effective rate for invoice backfill', e.message);
      }

      const subtotal = amount / (1 + rate);
      const vat = amount - subtotal;

      await trx('sales_invoices').insert({
        id: invoiceId,
        invoice_no: invoiceNo,
        source,
        sale_id: String(orderId),
        customer_name: md.receivedFrom || `Internal - ${department}`,
        customer_tin: null,
        subtotal: subtotal,
        vat_standard: treatment === 'standard' ? vat : 0,
        vat_standard_rate: rate,
        vat_exempt: treatment === 'exempt' ? vat : 0,
        vat_zero_rated: treatment === 'zero_rated' || treatment === 'zero-rated' ? vat : 0,
        vat_total: vat,
        total_amount: amount,
        status: 'active',
        created_by_name: receivedBy || 'Finance',
        sale_type: saleType,
      });
      await trx('sales_invoice_items').insert({
        invoice_id: invoiceId,
        item_id: orderId,
        name: (`${department} income`).slice(0, 255),
        qty: 1,
        unit_price: subtotal,
        cost_price: 0,
        treatment: treatment,
        rate: rate,
        vat_amount: vat,
        subtotal: subtotal,
        total: amount,
      });
      invoice = await trx('sales_invoices').where({ id: invoiceId }).first();
    }

    const existingReceipt = await trx('sales_receipts')
      .where({ invoice_id: invoice.id })
      .andWhereNot('status', 'cancelled')
      .first();
    if (!existingReceipt || allowAdditional) {
      await trx('sales_receipts').insert({
        id: `REC-${invoice.id}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
        receipt_no: await generateReceiptNumber(),
        invoice_id: invoice.id,
        amount_paid: parseFloat(amount || 0),
        payment_method: md.paymentMethod || 'Cash',
        payment_reference: md.paymentReference || null,
        received_by_name: receivedBy || md.financeName || 'Finance',
        status: 'active',
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });
    }
    return invoice.id;
  } catch (e) {
    console.error('Failed to attach receipt for approved income:', e.message);
    return null;
  }
};

// ── GET all pending/all submissions ──────────────────────────────
router.get('/live-income', authenticate, async (req, res) => {
  try {
    // 1) Manual income submissions (Pharmacy, AgriRent, Walk-In, etc.)
    const submissions = await knex('finance_income_submissions')
      .where('status', 'Pending')
      .orderBy('created_at', 'desc');

    // 2) Car Rental orders that have payment proof uploaded but not yet approved
    //    These may not have a finance_income_submissions record if they were created
    //    before the auto-sync code was added, so we union them here directly.
    const pendingRentals = await knex('rental_orders')
      .whereIn('payment_status', ['PENDING_VERIFICATION', 'UNPAID', 'PENDING'])
      .whereNotIn(
        'id',
        // Avoid duplicating orders already in finance_income_submissions
        knex('finance_income_submissions')
          .where('department', 'Car Rental')
          .where('status', 'Pending')
          .whereNotNull('manual_details')
          .select(knex.raw('(manual_details) ->> \'{order_id}\''))
      )
      .orderBy('updated_at', 'desc');

    // Normalise pending rental orders into the same shape as finance_income_submissions
    const rentalRows = pendingRentals.map(o => ({
      id: `rental-${o.id}`,   // prefix so the frontend can identify the source
      department: 'Car Rental',
      submitted_by: o.customer_name || 'Car Rental Customer',
      amount: parseFloat(o.additional_owed > 0 ? o.additional_owed : o.total_amount || 0),
      currency: 'ETB',
      reference_no: `CAR-PROOF-${o.order_number}`,
      description: `Car Rental Order ${o.order_number} – ${o.customer_name}`,
      status: 'Pending',
      manual_details: JSON.stringify({
        order_id: String(o.id),
        paymentMethod: o.payment_method || 'Bank/Telebirr',
        proofImagePath: o.payment_proof_url,
        amount: parseFloat(o.additional_owed > 0 ? o.additional_owed : o.total_amount || 0),
        receivedFrom: o.customer_name || 'Car Rental Customer',
        paymentReference: o.payment_reference || ''
      }),
      created_at: o.updated_at || o.created_at,
      updated_at: o.updated_at || o.created_at,
      _source: 'rental_order',
      _rental_order_id: o.id
    }));

    // 3) Retail POS Digital Payments that need Finance approval
    const pendingPos = await knex('retail_pos_carts')
      .where('status', 'PENDING_FINANCE')
      .orderBy('updated_at', 'desc');

    const posRows = pendingPos.map(c => ({
      id: `pos-cart-${c.id}`,
      department: 'Retail POS',
      submitted_by: c.cashier_name || 'POS System',
      amount: parseFloat(c.payment_amount || c.total_amount || 0),
      currency: 'ETB',
      reference_no: c.txn_id || c.payment_reference || c.cart_code,
      description: `POS Sale (${c.payment_method}) - ${c.customer_name || 'Walk-in'}`,
      status: 'Pending',
      manual_details: JSON.stringify({
        paymentMethod: c.payment_method,
        paymentReference: c.txn_id || c.payment_reference,
        amount: parseFloat(c.payment_amount || c.total_amount || 0),
        receivedFrom: c.customer_name || 'Walk-in',
        bankName: c.bank_name,
        accountNumber: c.account_number,
        telebirrNumber: c.telbir_number
      }),
      created_at: c.updated_at || c.created_at,
      updated_at: c.updated_at || c.created_at,
      _source: 'retail_pos_cart',
      _pos_cart_id: c.id
    }));

    const all = [...submissions, ...rentalRows, ...posRows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: all });
  } catch (error) {
    console.error('Error fetching income submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch income submissions' });
  }
});

// ── GET detail of one submission + all linked transactions ────────
router.get('/live-income/:id/detail', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // ── Handle synthetic 'rental-{n}' IDs (rental_orders without a submission record)
    if (String(id).startsWith('rental-')) {
      const rentalId = String(id).replace('rental-', '');
      const order = await knex('rental_orders as ro')
        .leftJoin('cars as c', 'ro.car_id', 'c.id')
        .where('ro.id', rentalId)
        .select(
          'ro.*',
          'c.name as car_name'
        )
        .first();
      if (!order) return res.status(404).json({ success: false, message: 'Rental order not found' });

      const amount = parseFloat(order.additional_owed > 0 ? order.additional_owed : order.total_amount || 0);
      const syntheticSubmission = {
        id,
        department: 'Car Rental',
        submitted_by: order.customer_name || 'Car Rental Customer',
        amount,
        currency: 'ETB',
        reference_no: `CAR-PROOF-${order.order_number}`,
        description: `Car Rental Order ${order.order_number} – ${order.customer_name}`,
        status: 'Pending',
        manual_details: JSON.stringify({
          order_id: String(order.id),
          paymentMethod: order.payment_method || 'Bank/Telebirr',
          proofImagePath: order.payment_proof_url,
          amount,
          receivedFrom: order.customer_name || 'Car Rental Customer',
          paymentReference: order.payment_reference || '',
          orderNumber: order.order_number,
          pickupDate: order.pickup_date,
          returnDate: order.return_date,
          totalDays: order.total_days,
          dailyRate: order.daily_rate,
          carName: order.car_name || 'Car',
          driverName: order.driver_name,
          pickupLocation: order.pickup_location,
          specialRequests: order.special_requests,
          additionalOwed: order.additional_owed
        }),
        created_at: order.updated_at || order.created_at,
        updated_at: order.updated_at || order.created_at,
        _source: 'rental_order',
        _rental_order_id: order.id
      };

      return res.json({
        success: true,
        data: {
          submission: syntheticSubmission,
          transactions: [],
          systemTotal: amount,
          transactionCount: 1
        }
      });
    }

    // ── Handle synthetic 'pos-cart-{n}' IDs (retail_pos_carts awaiting finance) ──
    if (String(id).startsWith('pos-cart-')) {
      const cartId = String(id).replace('pos-cart-', '');
      const cart = await knex('retail_pos_carts').where({ id: cartId }).first();
      if (!cart) return res.status(404).json({ success: false, message: 'POS Cart not found' });

      const amount = parseFloat(cart.payment_amount || cart.total_amount || 0);
      const syntheticSubmission = {
        id,
        department: 'Retail POS',
        submitted_by: cart.cashier_name || 'POS System',
        amount,
        currency: 'ETB',
        reference_no: cart.txn_id || cart.payment_reference || cart.cart_code,
        description: `POS Sale (${cart.payment_method}) - ${cart.customer_name || 'Walk-in'}`,
        status: 'Pending',
        manual_details: JSON.stringify({
          paymentMethod: cart.payment_method,
          paymentReference: cart.txn_id || cart.payment_reference,
          amount,
          receivedFrom: cart.customer_name || 'Walk-in',
          bankName: cart.bank_name,
          accountNumber: cart.account_number,
          telebirrNumber: cart.telbir_number
        }),
        created_at: cart.updated_at || cart.created_at,
        updated_at: cart.updated_at || cart.created_at,
        _source: 'retail_pos_cart',
        _pos_cart_id: cart.id
      };

      return res.json({
        success: true,
        data: {
          submission: syntheticSubmission,
          transactions: [],
          systemTotal: amount,
          transactionCount: 1
        }
      });
    }

    // ── Standard finance_income_submissions lookup ─────────────────
    const submission = await knex('finance_income_submissions').where({ id }).first();
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    let transactions = [];

    // For Pharmacy dept — use the sales snapshot from manual_details if present (new format),
    // otherwise fall back to querying pharmacy_sales directly (legacy format)
    if (submission.department === 'Pharmacy') {
      let parsedDetails = null;
      if (submission.manual_details) {
        try { parsedDetails = typeof submission.manual_details === 'string'
          ? JSON.parse(submission.manual_details) : submission.manual_details; } catch (_) {}
      }

      if (parsedDetails && Array.isArray(parsedDetails.sales)) {
        // New format: rich snapshot embedded in manual_details
        transactions = parsedDetails.sales.map(s => ({
          id: s.sale_id,
          receipt_no: s.receipt_no,
          sale_type: s.sale_type,
          recipient_name: s.customer,
          recipient_phone: s.customer_phone,
          total_amount: s.amount,
          payment_method: s.payment_method,
          bank_name: s.bank_name,
          account_holder: s.account_holder,
          account_number: s.account_number,
          telbir_number: s.telbir_number,
          reference_no: s.reference_no,
          screenshot: s.screenshot,
          worker_name: parsedDetails.workerName,
          branch_name: parsedDetails.branchName,
          items: s.items || []
        }));
      } else {
        // Legacy: query pharmacy_sales directly
        const sales = await knex('pharmacy_sales as ps')
          .leftJoin('pharmacy_workers as pw', 'ps.worker_id', 'pw.id')
          .leftJoin('pharmacy_branches as pb', 'ps.branch_id', 'pb.id')
          .leftJoin('pharmacy_payments as pp', 'ps.id', 'pp.sale_id')
          .where('ps.is_submitted', true)
          .select(
            'ps.id', 'ps.receipt_no', 'ps.sale_type', 'ps.recipient_name',
            'ps.recipient_phone', 'ps.total_products', 'ps.total_amount', 'ps.created_at',
            'pw.name as worker_name', 'pb.name as branch_name', 'pp.payment_method',
            'pp.bank_name', 'pp.account_holder', 'pp.account_number', 'pp.telbir_number',
            'pp.recipient_name as pp_recipient_name', 'pp.recipient_phone as pp_recipient_phone'
          )
          .orderBy('ps.created_at', 'asc');

        for (const sale of sales) {
          const items = await knex('pharmacy_sale_items')
            .where('sale_id', sale.id)
            .select('drug_name', 'quantity', 'unit_price', 'total_price');
          transactions.push({ ...sale, items });
        }
      }
    }


    // For Retail dept — fetch the specific order linked to this submission
    if (submission.department === 'Retail') {
      let parsedDetails = null;
      try {
        parsedDetails = typeof submission.manual_details === 'string'
          ? JSON.parse(submission.manual_details) : submission.manual_details;
      } catch (_) {}

      const orderId = parsedDetails && parsedDetails.order_id;

      if (orderId) {
        // Fetch the specific retail order
        const order = await knex('retail_orders').where('id', orderId).first();
        if (order) {
          const items = await knex('retail_order_items as roi')
            .join('retail_products as p', 'roi.product_id', 'p.id')
            .where('roi.order_id', orderId)
            .select(
              'p.name as drug_name',
              'roi.quantity',
              'roi.unit_price',
              'roi.subtotal as total_price'
            );

          transactions.push({
            id: order.id,
            receipt_no: order.invoice_number,
            sale_type: 'online',
            total_amount: parseFloat(order.total_amount || 0),
            payment_method: parsedDetails.paymentMethod || order.payment_method,
            created_at: order.created_at,
            recipient_name: order.customer_name || parsedDetails.receivedFrom || 'Customer',
            recipient_phone: order.customer_phone || parsedDetails.phone || null,
            reference_no: order.payment_ref || parsedDetails.paymentRef || null,
            worker_name: order.customer_name || parsedDetails.receivedFrom || null,
            items
          });
        }
      } else {
        // Fallback: show submission amount as a single synthetic transaction
        transactions.push({
          id: submission.id,
          receipt_no: submission.reference_no,
          sale_type: 'online',
          total_amount: parseFloat(submission.amount || 0),
          payment_method: parsedDetails ? parsedDetails.paymentMethod : null,
          created_at: submission.created_at,
          recipient_name: submission.submitted_by,
          recipient_phone: parsedDetails ? parsedDetails.phone : null,
          reference_no: parsedDetails ? parsedDetails.paymentRef : null,
          worker_name: submission.submitted_by,
          items: []
        });
      }
    }

    // Enhance Car Rental with full order details
    if (submission.department === 'Car Rental' && submission.manual_details) {
      try {
        const parsed = JSON.parse(submission.manual_details);
        if (parsed.order_id) {
          const rentalOrder = await knex('rental_orders as ro')
            .leftJoin('cars as c', 'ro.car_id', 'c.id')
            .where('ro.id', parseInt(parsed.order_id))
            .select(
              'ro.*',
              'c.name as car_name'
            )
            .first();
            
          if (rentalOrder) {
             const enrichedDetails = {
               ...parsed,
               carName: rentalOrder.car_name || 'Car',
               pickupDate: rentalOrder.pickup_date,
               returnDate: rentalOrder.return_date,
               totalDays: rentalOrder.total_days,
               dailyRate: rentalOrder.daily_rate,
               driverName: rentalOrder.driver_name,
               pickupLocation: rentalOrder.pickup_location,
               specialRequests: rentalOrder.special_requests,
               additionalOwed: rentalOrder.additional_owed,
               orderNumber: rentalOrder.order_number
             };
             submission.manual_details = JSON.stringify(enrichedDetails);
          }
        }
      } catch (e) {
        console.error('Failed to parse/fetch car rental details:', e);
      }
    }

    const systemTotal = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0)
      : parseFloat(submission.amount);

    res.json({
      success: true,
      data: {
        submission,
        transactions,
        systemTotal: parseFloat(systemTotal.toFixed(2)),
        transactionCount: transactions.length > 0 ? transactions.length : (submission.manual_details ? 1 : 0)
      }
    });
  } catch (error) {
    console.error('Error fetching submission detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submission detail' });
  }
});

// ── POST submit new income ────────────────────────────────────────
router.post('/live-income', authenticate, async (req, res) => {
  try {
    const { department, amount, reference_no, description, manual_details } = req.body;

    if (!department || !amount) {
      return res.status(400).json({ success: false, message: 'Department and amount are required' });
    }

    const [id] = await knex('finance_income_submissions').insert({
      department,
      submitted_by: (req.user && req.user.fullName) || (manual_details && manual_details.preparedBy) || 'Unknown User',
      amount,
      reference_no,
      description,
      status: 'Pending',
      manual_details: manual_details ? JSON.stringify(manual_details) : null
    });

    sendFinanceNotification({
      title: 'New Income Submission',
      message: `ETB ${Number(amount || 0).toLocaleString()} income recorded for ${department} (Ref: ${reference_no || `INC-${id}`}).`,
      type: 'finance',
      link: '/finance/pharmacy-sales?tab=list',
      related_entity_id: id
    }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

    res.status(201).json({ success: true, message: 'Income submitted successfully', id });
  } catch (error) {
    console.error('Error submitting income:', error);
    res.status(500).json({ success: false, message: 'Failed to submit income' });
  }
});

// ── PUT approve with cash-count reconciliation ────────────────────
router.put('/live-income/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { cash_count, finance_signature, finance_name } = req.body;

    // ── Handle synthetic 'rental-{n}' IDs directly ─────────────────
    if (String(id).startsWith('rental-')) {
      const rentalId = String(id).replace('rental-', '');
      const order = await knex('rental_orders').where({ id: rentalId }).first();
      if (!order) return res.status(404).json({ success: false, message: 'Rental order not found' });

      const systemTotal = parseFloat(order.additional_owed > 0 ? order.additional_owed : order.total_amount || 0);
      const cashVal = cash_count !== undefined && cash_count !== '' ? parseFloat(cash_count) : null;

      // Reconciliation check
      if (cashVal !== null) {
        const diff = Math.abs(cashVal - systemTotal);
        if (diff > 0.01) {
          return res.status(400).json({
            success: false, mismatch: true,
            systemTotal, cashCount: cashVal,
            difference: parseFloat((cashVal - systemTotal).toFixed(2)),
            message: `Cash count mismatch! System shows ETB ${systemTotal.toFixed(2)} but you counted ETB ${cashVal.toFixed(2)}.`
          });
        }
      }

      await knex.transaction(async trx => {
        const extraCharges = parseFloat(order.additional_owed || 0);
        const updateData = { verified_by_finance_at: knex.fn.now(), payment_status: 'PAID' };
        
        if (order.status === 'APPROVED' || order.status === 'PENDING_APPROVAL' || order.status === 'PENDING_VERIFICATION') {
          updateData.status = 'CONFIRMED';
          updateData.verified_amount = systemTotal;
        } 
        
        if (extraCharges > 0) {
          const remaining = Math.max(0, extraCharges - systemTotal);
          updateData.additional_owed = remaining;
          if (remaining > 0) {
             updateData.payment_status = 'PARTIAL';
          } else {
             updateData.payment_status = 'PAID';
          }
        }
        
        await trx('rental_orders').where({ id: rentalId }).update(updateData);

        const financeName = finance_name || (req.user && req.user.fullName) || 'Finance Officer';

        // Insert a real submission record so it shows as Approved in history
        const [newSubId] = await trx('finance_income_submissions').insert({
          department: 'Car Rental',
          submitted_by: order.customer_name || 'Car Rental Customer',
          amount: systemTotal,
          reference_no: `CAR-PROOF-${order.order_number}`,
          description: `Car Rental Order ${order.order_number} – ${order.customer_name}`,
          status: 'Approved',
          manual_details: JSON.stringify({
            order_id: String(order.id),
            paymentMethod: order.payment_method || 'Bank/Telebirr',
            proofImagePath: order.payment_proof_url,
            amount: systemTotal,
            receivedFrom: order.customer_name || 'Car Rental Customer',
            financeSignature: finance_signature || null,
            financeName: financeName
          }),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });

        // Attach a sales_receipt to the existing car_rental sales_invoice so the
        // invoice → receipt transfer completes on the Sales Invoice & Receipt page
        // (invoice is created at booking time with correct VAT). Idempotent.
        await ensureReceiptForInvoicedSubmission(trx, {
          department: 'Car Rental',
          manualDetails: {
            order_id: String(order.id),
            paymentMethod: order.payment_method || 'Bank/Telebirr',
            paymentReference: order.payment_reference,
            receivedFrom: order.customer_name || 'Car Rental Customer',
          },
          amount: systemTotal,
          receivedBy: financeName,
          allowAdditional: extraCharges > 0,
        });

        // Cancel the security deposit's invoices/activations must NOT apply here;
        // record the approved income into the canonical ledger (CRV + cashbook +
        // revenue book), keying the revenue-book row by order number so it merges
        // with (instead of duplicating) the row synced by syncRentalToFinance.
        await recordLedgerIncome(trx, {
          amount: systemTotal,
          department: 'Car Rental',
          manualDetails: { paymentMethod: order.payment_method || 'Bank/Telebirr', paymentReference: order.payment_reference },
          receivedFrom: order.customer_name || 'Car Rental Customer',
          referenceNo: order.payment_reference || `RENTAL-${order.order_number}`,
          receivableInvoiceNo: order.order_number,
          receivableExtras: {
            order_id: String(order.id),
            orderNumber: order.order_number,
            financeSignature: finance_signature || null,
            financeName: financeName,
          },
        });

        // Record the approved payment in bank_payments for reconciliation (keeps
        // Live Income approval consistent with verifyPayment + other departments).
        try {
          const crypto = require('crypto');
          await trx('bank_payments').insert({
            payment_id: crypto.randomUUID(),
            reference: order.payment_reference || `RENTAL-${order.order_number}-${Date.now()}`,
            amount: systemTotal,
            customer_name: order.customer_name || 'Car Rental Customer',
            customer_phone: order.customer_phone || null,
            bank_code: normalizePaymentMethod(order.payment_method || 'Cash') === 'Cash' ? 'CASH' : 'CBE',
            status: 'completed',
            description: `Rental payment - Order ${order.order_number}`,
            completed_at: knex.fn.now(),
            created_at: knex.fn.now()
          });
        } catch (e) {
          console.error('Failed to record rental payment in bank_payments:', e.message);
        }
      });

      sendFinanceNotification({
        title: 'Income Approved',
        message: `Car Rental payment of ETB ${systemTotal.toFixed(2)} approved for Order ${order.order_number}.`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list'
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

      return res.json({ success: true, message: 'Car Rental payment approved and order confirmed successfully.' });
    }

    // ── Handle synthetic 'pos-cart-{n}' IDs ────────────────────────
    if (String(id).startsWith('pos-cart-')) {
      const cartId = String(id).replace('pos-cart-', '');
      const cart = await knex('retail_pos_carts').where({ id: cartId }).first();
      if (!cart) return res.status(404).json({ success: false, message: 'POS Cart not found' });
      if (cart.status !== 'PENDING_FINANCE') return res.status(400).json({ success: false, message: 'Cart is not pending finance' });

      const amount = parseFloat(cart.payment_amount || cart.total_amount || 0);

      await knex.transaction(async trx => {
        // Update cart status to PENDING_STORE so the sales manager can send it to the store
        await trx('retail_pos_carts').where({ id: cartId }).update({
          status: 'PENDING_STORE',
          updated_at: knex.fn.now()
        });

        // Generate store sales requests for inventory release
        let items = [];
        try { if (typeof cart.items === 'string') items = JSON.parse(cart.items); } catch (e) { items = []; }
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.id && !item.product_id && !item.name) continue;
          await trx('store_sales_requests').insert({
            request_code: `${cart.cart_code}-${i + 1}`,
            store_module: 'general_store',
            product_id: item.id || item.product_id,
            product_name: item.name || item.product_name,
            quantity_requested: item.qty || item.quantity || 1,
            customer_name: cart.customer_name || 'Walk-in',
            customer_phone: cart.customer_phone || '',
            requested_by_id: cart.cashier_id,
            requested_by_name: cart.cashier_name,
            notes: `Finance Verified (${cart.payment_method}) — Cart ${cart.cart_code}`,
            status: 'Pending',
            cart_items: JSON.stringify(items),
            digital_signature: finance_signature || null,
          });
        }

        // Insert a real submission record so it shows as Approved in history
        await trx('finance_income_submissions').insert({
          department: 'Retail POS',
          submitted_by: cart.cashier_name || 'POS System',
          amount,
          reference_no: cart.txn_id || cart.payment_reference || cart.cart_code,
          description: `POS Sale (${cart.payment_method}) - ${cart.customer_name || 'Walk-in'}`,
          status: 'Approved',
          manual_details: JSON.stringify({
            paymentMethod: cart.payment_method,
            paymentReference: cart.txn_id || cart.payment_reference,
            amount,
            receivedFrom: cart.customer_name || 'Walk-in',
            financeSignature: finance_signature || null,
            financeName: finance_name || (req.user && req.user.fullName) || 'Finance Officer'
          }),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });

        // Record approved income into the canonical ledger (CRV + cashbook + revenue book)
        await recordLedgerIncome(trx, {
          amount,
          department: 'Retail POS',
          manualDetails: {
            paymentMethod: cart.payment_method,
            paymentReference: cart.txn_id || cart.payment_reference,
            receivedFrom: cart.customer_name || 'Walk-in',
            bankName: cart.bank_name,
            accountNumber: cart.account_number,
            telebirrNumber: cart.telbir_number
          },
          receivedFrom: cart.customer_name || 'Walk-in',
          referenceNo: cart.txn_id || cart.payment_reference || cart.cart_code,
          receivableExtras: {
            cart_id: String(cart.id),
            cart_code: cart.cart_code,
            financeSignature: finance_signature || null,
            financeName: finance_name || (req.user && req.user.fullName) || 'Finance Officer',
          },
        });

        // ── Mint/link Sales Invoice + Receipt so POS approvals show in
        //    Finance Receipts Dashboard (Invoices tab & Receipts tab)
        await ensureInvoiceAndReceipt(trx, {
          source: 'retail',
          saleId: parseInt(cartId, 10) + 800000000, // unique synthetic sale_id for POS carts
          customer: cart.customer_name || 'Walk-in Customer',
          amount,
          paymentMethod: cart.payment_method || 'Cash',
          paymentReference: cart.txn_id || cart.payment_reference || cart.cart_code,
          description: `Retail POS Sale — ${cart.customer_name || 'Walk-in Customer'}`,
          receivedBy: finance_name || (req.user && req.user.fullName) || 'Finance Officer',
        });
      });

      sendFinanceNotification({
        title: 'Income Approved',
        message: `POS digital payment of ETB ${amount} verified for ${cart.customer_name || 'Walk-in'}.`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list'
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

      return res.json({ success: true, message: 'POS digital payment verified and sent to store for release.' });
    }

    // ── Standard finance_income_submissions approval ───────────────
    const submission = await knex('finance_income_submissions').where({ id }).first();
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (submission.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Submission is already processed' });
    }

    // The submission amount is the system truth — the amount recorded here must
    // match the booking, Accounts and Reconciliation exactly. (Previously this
    // re-summed pharmacy_sales, which double-counted against per-sale invoices.)
    const systemTotal = parseFloat(submission.amount);

    // ── Reconciliation check ──────────────────────────────────────
    if (cash_count !== undefined && cash_count !== null && cash_count !== '') {
      const cashVal = parseFloat(cash_count);
      const diff = Math.abs(cashVal - systemTotal);
      const tolerance = 0.01; // allow 1-cent rounding difference

      if (diff > tolerance) {
        return res.status(400).json({
          success: false,
          mismatch: true,
          systemTotal,
          cashCount: cashVal,
          difference: parseFloat((cashVal - systemTotal).toFixed(2)),
          message: `Cash count mismatch! System shows ETB ${systemTotal.toFixed(2)} but you counted ETB ${cashVal.toFixed(2)}. Difference: ETB ${(cashVal - systemTotal).toFixed(2)}. Please recount and try again.`
        });
      }
    }

    // ── All good — approve ────────────────────────────────────────
    await knex.transaction(async trx => {
      let manualDetails = submission.manual_details ? JSON.parse(submission.manual_details) : {};
      manualDetails.financeSignature = finance_signature || null;
      manualDetails.financeName = finance_name || (req.user && req.user.fullName) || 'Finance Officer';
      
      await trx('finance_income_submissions')
        .where({ id })
        .update({ 
          status: 'Approved', 
          updated_at: knex.fn.now(),
          manual_details: JSON.stringify(manualDetails) 
        });

      let customerName = `Internal - ${submission.department}`;
      if (manualDetails.receivedFrom) {
        customerName = manualDetails.receivedFrom;
      }

      // Guard against double-recording: if an AgriRent order was already
      // confirmed + recorded (e.g. verified directly on the order page), never
      // write a second CRV/cashbook pair. The receipt attach below stays
      // idempotent so approving an already-recorded order is still safe. The
      // receivable is keyed by the ORDER NUMBER so it merges with the row
      // syncToFinance pushes (no duplicate in the Revenue Book).
      let skipLedgerRecording = false;
      let receivableInvoiceNo = null;
      try {
        const deptKey = String(submission.department || '').toLowerCase().trim();
        if (deptKey === 'agrirent' && manualDetails.order_id) {
          const ao = await trx('agrirent_orders').where({ id: manualDetails.order_id }).first();
          if (ao) {
            receivableInvoiceNo = ao.order_number;
            if (['Confirmed', 'PAID'].includes(ao.payment_status)) {
              skipLedgerRecording = true;
            }
          }
        }
      } catch (e) {
        skipLedgerRecording = false;
      }

      // Record approved income into the canonical ledger (CRV + cashbook +
      // revenue book) — includes the Receivables Book row via the service.
      let ledgerReceivableId = null;
      if (!skipLedgerRecording) {
        const ledgerResult = await recordLedgerIncome(trx, {
          amount: systemTotal,
          department: submission.department,
          manualDetails,
          receivedFrom: customerName,
          referenceNo: submission.reference_no,
          receivableInvoiceNo,
          receivableExtras: {
            departmentSource: submission.department,
            financeSignature: manualDetails.financeSignature || finance_signature || null,
            financeName: manualDetails.financeName || finance_name || (req.user && req.user.fullName) || 'Finance Officer',
          },
        });
        ledgerReceivableId = ledgerResult ? ledgerResult.receivableId : null;
      }

      // Mint + link a Sales Invoice and Receipt for the approved income so it always
      // shows on the Sales Invoice & Receipt page. Departments whose modules already
      // create their own invoice + receipt at sale time are skipped so approving never
      // creates a duplicate. Everything else (manual walk-ins / general inflow) gets
      // the synthetic invoice. Idempotent (keyed on source + sale_id).
      const deptKey = String(submission.department || '').toLowerCase();
      // For 'retail pos' without an order_id (POS cart approvals from finance_income_submissions),
      // treat as non-self-invoicing so a proper sales_invoice + sales_receipt is always created.
      const isPosWithoutOrder = (deptKey === 'retail pos' || deptKey === 'retailpos') && !manualDetails.order_id;
      const isTender = deptKey === 'tender';
      if (!SELF_INVOICING_DEPARTMENTS.has(deptKey) || isPosWithoutOrder) {
        const newInvoiceId = await ensureInvoiceAndReceipt(trx, {
          source: isPosWithoutOrder ? 'retail' : (isTender ? 'tender' : 'manual'),
          saleId: isPosWithoutOrder ? (parseInt(manualDetails.cart_id || id, 10) + 800000000) : (isTender ? parseInt(manualDetails.bidId, 10) : (500000000 + parseInt(id, 10))),
          customer: customerName,
          amount: systemTotal,
          paymentMethod: manualDetails.paymentMethod || 'Cash',
          paymentReference: submission.reference_no || manualDetails.paymentReference || null,
          description: submission.description,
          receivedBy: manualDetails.financeName || (req.user && req.user.fullName) || 'Finance Officer',
        });
        // Link the generated invoice_no back to the finance_receivables row so that
        // the Revenue Book deduplication (keyed on invoice_no) excludes this ledger row
        // and shows the invoice row (with correct VAT) instead of the legacy row (VAT=0).
        if (newInvoiceId && ledgerReceivableId) {
          try {
            const createdInv = await trx('sales_invoices').where('id', newInvoiceId).select('invoice_no').first();
            if (createdInv && createdInv.invoice_no) {
              await trx('finance_receivables').where('id', ledgerReceivableId).update({ invoice_no: createdInv.invoice_no });
            }
          } catch (e) {
            console.warn('Failed to link invoice_no back to finance_receivables:', e.message);
          }
        }
      } else {
        // Self-invoicing module already recorded the invoice (with VAT) at order
        // time. Approval only attaches the receipt so the invoice shows PAID with
        // balance/owed = 0 — never a second invoice.
        await ensureReceiptForInvoicedSubmission(trx, {
          department: submission.department,
          manualDetails: manualDetails || {},
          amount: systemTotal,
          receivedBy: manualDetails.financeName || (req.user && req.user.fullName) || 'Finance Officer',
        });
      }

      if (submission.department === 'Printing' && submission.manual_details) {
        try {
          const parsed = JSON.parse(submission.manual_details);
          if (parsed.order_id) {
            const currentOrder = await trx('printing_orders').where({ id: parsed.order_id }).first();
            
            const updatePayload = {
              payment_status: 'Confirmed',
              updated_at: knex.fn.now()
            };

            // Only auto-advance to Job Queue if it is currently 'received' (awaiting payment)
            const receivedStatus = await trx('order_statuses').where('status_code', 'received').first();
            const inQueueStatus = await trx('order_statuses').where('status_code', 'in_queue').first();
            
            let statusChanged = false;
            if (currentOrder && receivedStatus && inQueueStatus && currentOrder.status_id === receivedStatus.id) {
              updatePayload.status_id = inQueueStatus.id;
              statusChanged = true;
            }

            await trx('printing_orders')
              .where({ id: parsed.order_id })
              .update(updatePayload);

            // Log history
            if (statusChanged) {
              await trx('order_status_history').insert({
                order_id: parsed.order_id,
                status_id: inQueueStatus.id,
                changed_by: req.user ? req.user.id : null,
                notes: 'Payment confirmed by Finance — moved to Job Queue for printing'
              });
            }

            // Notify Customer
            if (currentOrder && currentOrder.customer_id) {
              const cust = await trx('customers').where('id', currentOrder.customer_id).first();
              if (cust && cust.phone) {
                const portalUser = await trx('users').where('phone', cust.phone).first();
                if (portalUser) {
                  sendCustomerNotification({
                    user_id: portalUser.id,
                    title: 'Print Order Payment Confirmed ✅',
                    message: `Your payment for order ${currentOrder.order_number} was confirmed by Finance. Production is starting.`,
                    type: 'payment_confirmed',
                    link: '/customer/printing-orders',
                    related_entity_id: parsed.order_id
                  }, req.app?.get('io')).catch(() => {});
                }
              }
            }
          }
        } catch(e) {
          console.error('Failed to update printing order payment status:', e);
        }
      }

      // Update Retail order payment_status
      if (submission.department === 'Retail' && submission.manual_details) {
        try {
          const parsed = JSON.parse(submission.manual_details);
          if (parsed.order_id) {
            await trx('retail_orders')
              .where({ id: parsed.order_id })
              .update({
                payment_status: 'PAID',
                updated_at: knex.fn.now()
              });
          }
        } catch(e) {
          console.error('Failed to update retail order payment status:', e);
        }
      }

      // Update AgriRent order payment_status
      if (submission.department === 'AgriRent' && submission.manual_details) {
        try {
          const parsed = JSON.parse(submission.manual_details);
          if (parsed.order_id) {
            await trx('agrirent_orders')
              .where({ id: parsed.order_id })
              .update({
                payment_status: 'Confirmed',
                updated_at: knex.fn.now()
              });
          }
        } catch(e) {
          console.error('Failed to update agrirent order payment status:', e);
        }
      }

      // Update Car Rental order payment_status
      if (submission.department === 'Car Rental' && submission.manual_details) {
        try {
          const parsed = JSON.parse(submission.manual_details);
          if (parsed.order_id) {
            const orderIdInt = parseInt(parsed.order_id);
            // Fetch order to check if we are paying initial or additional
            const order = await trx('rental_orders').where({ id: orderIdInt }).first();
            if (order) {
              const extraCharges = parseFloat(order.additional_owed || 0);
              let updateData = {
                verified_by_finance_at: knex.fn.now(),
                payment_status: 'PAID'
              };

              if (order.status === 'APPROVED' || order.status === 'PENDING_APPROVAL' || order.status === 'PENDING_VERIFICATION') {
                updateData.status = 'CONFIRMED';
                updateData.verified_amount = systemTotal;
              } 
              
              if (extraCharges > 0) {
                const remaining = Math.max(0, extraCharges - systemTotal);
                updateData.additional_owed = remaining;
                if (remaining > 0) {
                  updateData.payment_status = 'PARTIAL';
                } else {
                  updateData.payment_status = 'PAID';
                }
              }

              await trx('rental_orders')
                .where({ id: orderIdInt })
                .update(updateData);
                
              // Log to bank_payments
              try {
                const crypto = require('crypto');
                await trx('bank_payments').insert({
                  payment_id: crypto.randomUUID(),
                  reference: parsed.paymentReference || `RENTAL-${order.order_number}-${Date.now()}`,
                  amount: systemTotal,
                  customer_name: order.customer_name,
                  customer_phone: order.customer_phone,
                  bank_code: 'CBE',
                  status: 'completed',
                  description: `Rental payment - Order ${order.order_number}`,
                  completed_at: knex.fn.now(),
                  created_at: knex.fn.now()
                });
              } catch (bankErr) {
                console.error('Failed to record rental payment to bank_payments:', bankErr);
              }
            }
          }
        } catch(e) {
          console.error('Failed to update car rental order payment status:', e);
        }
      }

      // ── Update Tender bid payment_status when finance approves ─────
      if (submission.department === 'Tender' && submission.reference_no) {
        try {
          // Sales Tender: reference format TND-BID-{bidId} => bids table
          const salesBidMatch = String(submission.reference_no).match(/TND-BID-(\d+)/);
          // Public Tender: reference format PUB-BID-{bidId} => public_bids table
          const pubBidMatch = String(submission.reference_no).match(/PUB-BID-(\d+)/);

          if (salesBidMatch) {
            const bidId = parseInt(salesBidMatch[1]);
            const bid = await trx('bids').where({ id: bidId }).first();
            if (bid) {
              await trx('bids').where({ id: bidId }).update({
                payment_status: 'confirmed',
                updated_at: trx.fn.now()
              });
              if (bid.customer_id) {
                try {
                  const notificationRepository = require('../../repositories/notification.repository');
                  await notificationRepository.create({
                    userId: bid.customer_id,
                    title: '✅ Payment Confirmed — Tender Award',
                    message: `Finance has confirmed your payment for Sales Tender Bid #${bidId}. Your award is now fully processed.`
                  });
                } catch (notifErr) {
                  console.error('Failed to notify customer of tender payment:', notifErr.message);
                }
              }
            }
          } else if (pubBidMatch) {
            const bidId = parseInt(pubBidMatch[1]);
            const bid = await trx('public_bids').where({ id: bidId }).first();
            if (bid) {
              await trx('public_bids').where({ id: bidId }).update({
                payment_status: 'confirmed',
                updated_at: trx.fn.now()
              });
              // Public bids use email-based customer lookup
              if (bid.email) {
                try {
                  const user = await trx('users').where({ email: bid.email }).first();
                  if (user) {
                    const notificationRepository = require('../../repositories/notification.repository');
                    await notificationRepository.create({
                      userId: user.id,
                      title: '✅ Payment Confirmed — Public Tender',
                      message: `Finance has confirmed your payment for Public Tender bid. Your award is now fully processed.`
                    });
                  }
                } catch (notifErr) {
                  console.error('Failed to notify customer of public tender payment:', notifErr.message);
                }
              }
            }
          }
        } catch (e) {
          console.error('Failed to update tender bid payment status on approval:', e);
        }
      }
    });

    sendFinanceNotification({
      title: 'Income Approved',
      message: `ETB ${Number(systemTotal || 0).toLocaleString()} income approved for ${submission.department} (Ref: ${submission.reference_no || `INC-${submission.id}`}).`,
      type: 'finance',
      link: '/finance/pharmacy-sales?tab=list',
      related_entity_id: submission.id
    }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

    // Printing department follows its own income through the bell
    if (String(submission.department || '').toLowerCase() === 'printing') {
      sendPrintingNotification({
        title: 'Income Approved by Finance',
        message: `ETB ${Number(systemTotal || 0).toLocaleString()} Printing income was approved by Finance (Ref: ${submission.reference_no || `INC-${submission.id}`}).`,
        type: 'payment_confirmed',
        link: '/printing-manager/reports/finance',
        related_entity_id: submission.id
      }, req.app?.get('io')).catch(e => console.error('Failed to notify printing:', e.message));
    }

    res.json({
      success: true,
      message: 'Income approved and recorded to Receivables Book',
      systemTotal,
      cashCount: cash_count !== undefined ? parseFloat(cash_count) : systemTotal
    });
  } catch (error) {
    console.error('Error approving income:', error);
    res.status(500).json({ success: false, message: 'Failed to approve income' });
  }
});
// Map an income submission's department to the sales_invoices.source key it is
// recorded under (invoice at order time). Receipts are only added on approval.
const DEPARTMENT_TO_SOURCE = {
  'pharmacy': 'pharmacy',
  'printing': 'printing',
  'retail': 'retail',
  'retail pos': 'retail',
  'retailpos': 'retail',
  'car rental': 'car_rental',
  'agrirent': 'agrirent',
};

// Cancel (clean) any sales_invoice recorded for a submission that has now been
// rejected, together with its receipt. Provisionally-created invoices keyed on
// source + sale_id (either from the module's own order, or the synthetic
// 'manual' invoice minted via ensureInvoiceAndReceipt). Idempotent.
const cancelInvoiceForSubmission = async (trx, submission) => {
  const deptKey = String(submission.department || '').toLowerCase().trim();

  // 1) Invoices keyed by the underlying order (source + order_id) — the common
  //    case for departments whose module recorded an invoice at order time.
  let md = {};
  try {
    md = typeof submission.manual_details === 'string'
      ? JSON.parse(submission.manual_details)
      : (submission.manual_details || {});
  } catch (e) { md = {}; }

  const keyed = [];
  if (md.order_id && DEPARTMENT_TO_SOURCE[deptKey]) {
    keyed.push({ source: DEPARTMENT_TO_SOURCE[deptKey], sale_id: String(md.order_id) });
    if (deptKey === 'retail' || deptKey === 'retail pos' || deptKey === 'retailpos') {
      keyed.push({ source: 'retail', sale_id: String(md.order_id) });
    }
    if (deptKey === 'retail pos' || deptKey === 'retailpos') {
      keyed.push({ source: 'pos', sale_id: String(md.order_id) });
    }
  }
  // 2) Synthetic manual invoices minted on approval keyed to this submission id.
  keyed.push({ source: 'manual', sale_id: String(500000000 + parseInt(submission.id, 10)) });

  for (const k of keyed) {
    const invoices = await trx('sales_invoices')
      .where('source', k.source)
      .where('sale_id', k.sale_id)
      .whereNot('status', 'cancelled')
      .select('id');
    for (const inv of invoices) {
      await trx('sales_invoices').where({ id: inv.id }).update({
        status: 'cancelled',
        updated_at: trx.fn.now(),
      });
      await trx('sales_receipts').where({ invoice_id: inv.id }).update({
        status: 'cancelled',
        updated_at: trx.fn.now(),
      });
    }
  }
};

// ── PUT /live-income/:id/reject — Finance rejects a submission ────
router.put('/live-income/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Handle synthetic rental-N IDs
    if (String(id).startsWith('rental-')) {
      const rentalId = String(id).replace('rental-', '');
      const order = await knex('rental_orders').where({ id: rentalId }).first();
      if (!order) return res.status(404).json({ success: false, message: 'Rental order not found' });
      await knex('rental_orders').where({ id: rentalId }).update({
        payment_status: 'REJECTED',
        finance_notes: reason,
        updated_at: knex.fn.now()
      });
      await cancelInvoiceForSubmission(knex, {
        id: String(rentalId),
        department: 'Car Rental',
        manual_details: JSON.stringify({ order_id: String(rentalId) })
      });
      sendFinanceNotification({
        title: 'Income Rejected',
        message: `Car Rental payment for Order ${order.order_number} rejected: ${reason}`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list'
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
      return res.json({ success: true, message: 'Payment rejected.' });
    }

    // Handle synthetic pos-cart-N IDs
    if (String(id).startsWith('pos-cart-')) {
      const cartId = String(id).replace('pos-cart-', '');
      await knex('retail_pos_carts').where({ id: cartId }).update({
        status: 'REJECTED_BY_FINANCE',
        notes: `Finance Rejected: ${reason}`,
        updated_at: knex.fn.now()
      });
      await cancelInvoiceForSubmission(knex, {
        id: String(cartId),
        department: 'Retail POS',
        manual_details: JSON.stringify({ order_id: String(cartId) })
      });
      sendFinanceNotification({
        title: 'Income Rejected',
        message: `POS digital payment rejected: ${reason}`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list'
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
      return res.json({ success: true, message: 'POS Digital Payment rejected.' });
    }

    // Handle synthetic agrirent-N IDs
    if (String(id).startsWith('agrirent-')) {
      const agriId = String(id).replace('agrirent-', '');
      await knex('agrirent_orders').where({ id: agriId }).update({
        payment_status: 'REJECTED',
        notes: reason,
        updated_at: knex.fn.now()
      });
      sendFinanceNotification({
        title: 'Income Rejected',
        message: `AgriRent payment rejected: ${reason}`,
        type: 'finance',
        link: '/finance/pharmacy-sales?tab=list'
      }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));
      return res.json({ success: true, message: 'Payment rejected.' });
    }

    // Standard submission
    const submission = await knex('finance_income_submissions').where({ id }).first();
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (submission.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Submission is already processed' });
    }
    await knex('finance_income_submissions').where({ id }).update({
      status: 'Rejected',
      rejection_reason: reason,
      updated_at: knex.fn.now()
    });

    // Clean the Sales & Invoice page — cancel any invoice previously recorded
    // for this submission (and its receipt) so it no longer appears as unpaid.
    try {
      await cancelInvoiceForSubmission(knex, submission);
    } catch (e) {
      console.error('Failed to cancel invoice for rejected submission:', e.message);
    }
    sendFinanceNotification({
      title: 'Income Rejected',
      message: `ETB ${Number(submission.amount || 0).toLocaleString()} income for ${submission.department} rejected: ${reason}`,
      type: 'finance',
      link: '/finance/pharmacy-sales?tab=list',
      related_entity_id: submission.id
    }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

    // Printing department follows its own income through the bell
    if (String(submission.department || '').toLowerCase() === 'printing') {
      try {
        const md = typeof submission.manual_details === 'string'
          ? JSON.parse(submission.manual_details)
          : (submission.manual_details || {});
        if (md && md.order_id) {
          await knex('printing_orders').where({ id: md.order_id }).update({
            payment_status: 'Rejected',
            finance_notes: reason,
            updated_at: knex.fn.now()
          });
        }
      } catch (e) { console.error('Printing update fail:', e); }
    }

    // ── Update Tender bid payment_status when finance rejects ─────
    if (String(submission.department || '').toLowerCase() === 'tender' && submission.reference_no) {
      try {
        const salesBidMatch = String(submission.reference_no).match(/TND-BID-(\d+)/);
        const pubBidMatch = String(submission.reference_no).match(/PUB-BID-(\d+)/);

        if (salesBidMatch) {
          const bidId = parseInt(salesBidMatch[1]);
          const bid = await knex('bids').where({ id: bidId }).first();
          if (bid) {
            await knex('bids').where({ id: bidId }).update({
              payment_status: 'rejected',
              updated_at: knex.fn.now()
            });
            if (bid.customer_id) {
              try {
                const notificationRepository = require('../../repositories/notification.repository');
                await notificationRepository.create({
                  userId: bid.customer_id,
                  title: '❌ Payment Rejected — Tender Award',
                  message: `Finance has rejected your payment for Sales Tender Bid #${bidId}. Reason: ${reason}. Please contact the finance department.`
                });
              } catch (notifErr) {
                console.error('Failed to notify customer of tender payment rejection:', notifErr.message);
              }
            }
          }
        } else if (pubBidMatch) {
          const bidId = parseInt(pubBidMatch[1]);
          const bid = await knex('public_bids').where({ id: bidId }).first();
          if (bid) {
            await knex('public_bids').where({ id: bidId }).update({
              payment_status: 'rejected',
              updated_at: knex.fn.now()
            });
            if (bid.email) {
              try {
                const user = await knex('users').where({ email: bid.email }).first();
                if (user) {
                  const notificationRepository = require('../../repositories/notification.repository');
                  await notificationRepository.create({
                    userId: user.id,
                    title: '❌ Payment Rejected — Public Tender',
                    message: `Finance has rejected your payment for a Public Tender bid. Reason: ${reason}. Please contact the finance department.`
                  });
                }
              } catch (notifErr) {
                console.error('Failed to notify customer of public tender payment rejection:', notifErr.message);
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to update tender bid payment status on rejection:', e);
      }
    }

    res.json({ success: true, message: 'Submission rejected successfully.' });
  } catch (error) {
    console.error('Error rejecting income:', error);
    res.status(500).json({ success: false, message: 'Failed to reject income' });
  }
});

// ── GET all records (Revenue Book) ─────────────────────────────
router.get('/book', authenticate, async (req, res) => {
  const asNum = (v) => parseFloat(v || 0) || 0;
  const round2 = (n) => Math.round(n * 100) / 100;
  const SOURCE_LABEL = { retail: 'Retail & POS', pharmacy: 'Pharmacy',
    printing: 'Printing', car_rental: 'Car Rental', agrirent: 'AgriRent', tender: 'Tender', manual: 'Manual Entry' };
  try {
    // 1. All sales invoices (Retail, Pharmacy, Printing, Car Rental, AgriRent, Manual)
    const invoices = await knex('sales_invoices as si')
      .leftJoin('sales_receipts as sr', 'sr.invoice_id', 'si.id')
      .whereNot('si.status', 'cancelled')
      .where(function () {
        this.whereNull('sr.id').orWhereNot('sr.status', 'cancelled');
      })
      .orderBy('si.created_at', 'desc')
      .select(
        'si.id', 'si.invoice_no', 'si.source', 'si.sale_type', 'si.sale_id', 'si.customer_name',
        'si.subtotal', 'si.vat_standard', 'si.vat_exempt', 'si.vat_zero_rated',
        'si.vat_total', 'si.total_amount', 'si.created_at',
        'sr.id as receipt_id', 'sr.receipt_no', 'sr.amount_paid', 'sr.payment_method'
      );

    // Aggregate COGS per invoice from items table
    const cogsByInvoice = {};
    const itemAgg = await knex('sales_invoice_items')
      .select('invoice_id')
      .select(knex.raw('SUM(subtotal) as selling_sum'))
      .select(knex.raw('SUM(COALESCE(cost_price, 0) * qty) as cogs_sum'))
      .select(knex.raw('SUM(vat_amount) as vat_sum'))
      .select(knex.raw('SUM(CASE WHEN treatment = \'standard\' THEN (COALESCE(cost_price, 0) * qty * rate) ELSE 0 END) as input_vat_sum'))
      .groupBy('invoice_id');
    for (const row of itemAgg) {
      cogsByInvoice[row.invoice_id] = {
        selling: asNum(row.selling_sum),
        cogs: asNum(row.cogs_sum),
        outputVat: asNum(row.vat_sum),
        inputVat: asNum(row.input_vat_sum),
      };
    }

    // ── Patch COGS for online retail invoices where items had cost_price=0 ──
    // These were created as a lump-sum "Retail income" item; real cost lives in
    // retail_order_items × retail_products.
    try {
      const onlineRetailInvs = invoices.filter(
        inv => inv.source === 'retail' && inv.sale_type === 'online' &&
               (cogsByInvoice[inv.id]?.cogs || 0) === 0
      );
      for (const inv of onlineRetailInvs) {
        const realItems = await knex('retail_order_items as roi')
          .join('retail_products as rp', 'roi.product_id', 'rp.id')
          .where('roi.order_id', inv.sale_id)
          .select(knex.raw('SUM(roi.quantity * COALESCE(rp.cost_price, 0)) as real_cogs'))
          .first();
        const realCogs = asNum(realItems?.real_cogs);
        if (realCogs > 0 && cogsByInvoice[inv.id]) {
          cogsByInvoice[inv.id].cogs = realCogs;
          cogsByInvoice[inv.id].selling = asNum(inv.subtotal);
        } else if (realCogs > 0) {
          cogsByInvoice[inv.id] = { selling: asNum(inv.subtotal), cogs: realCogs, outputVat: 0, inputVat: 0 };
        }
      }
    } catch (_) { /* ignore enrichment errors */ }

    const invoiceRows = invoices.map(inv => {
      const agg = cogsByInvoice[inv.id] || { selling: 0, cogs: 0, outputVat: 0, inputVat: 0 };
      const totalAmount = asNum(inv.total_amount);
      const amountPaid = asNum(inv.amount_paid);
      const isPaid = !!inv.receipt_id || amountPaid >= totalAmount - 0.01;
      return {
        id: inv.id,
        _source_type: 'invoice',
        invoice_no: inv.invoice_no,
        receipt_no: inv.receipt_no || null,
        customer_name: inv.customer_name || 'Walk-in Customer',
        department_source: SOURCE_LABEL[inv.source] || inv.source,
        invoice_date: inv.created_at,
        due_date: inv.created_at,
        selling_price: round2(agg.selling || asNum(inv.subtotal)),
        cogs: round2(agg.cogs),
        gross_profit: round2((agg.selling || asNum(inv.subtotal)) - agg.cogs),
        subtotal: asNum(inv.subtotal),
        input_vat: round2(agg.inputVat),
        output_vat: round2(agg.outputVat || asNum(inv.vat_total)),
        vat_standard: asNum(inv.vat_standard),
        vat_exempt: asNum(inv.vat_exempt),
        vat_zero_rated: asNum(inv.vat_zero_rated),
        vat_total: asNum(inv.vat_total),
        total_amount: totalAmount,
        amount_paid: isPaid ? totalAmount : amountPaid,
        outstanding_balance: isPaid ? 0 : round2(totalAmount - amountPaid),
        status: isPaid ? 'Paid' : 'Unpaid',
        payment_method: inv.payment_method || null,
        manual_details: null,
      };
    });

    // 2. Finance receivables (manual/ledger entries that are NOT already in sales_invoices)
    const invoiceNos = invoiceRows.map(r => r.invoice_no).filter(Boolean);
    let legacyQuery = knex('finance_receivables').orderBy('invoice_date', 'desc');
    if (invoiceNos.length > 0) {
      legacyQuery = legacyQuery.where(function () {
        this.whereNull('invoice_no').orWhereNotIn('invoice_no', invoiceNos);
      });
    }
    const legacyRows = await legacyQuery;

    // Build a dedup key set from invoiceRows so that legacy rows whose linked sales invoice
    // is already represented in invoiceRows are not shown again with VAT=0.
    // Keyed by 'customerName_totalAmount' — covers the case where finance_receivables.invoice_no
    // was null when the row was created (e.g. Tender payments approved before the linking fix).
    const invoiceRowDedup = new Set(
      invoiceRows.map(r => `${String(r.customer_name || '').toLowerCase().trim()}_${round2(r.total_amount)}`)
    );

    const legacyMapped = legacyRows
      .filter(r => {
        // If invoice_no is present it was already excluded by the SQL WHERE NOT IN clause.
        // For rows with invoice_no=null, check if a matching invoiceRow already covers it.
        if (r.invoice_no) return true; // should not happen (excluded by SQL), but keep as safety
        const dedupKey = `${String(r.customer_name || '').toLowerCase().trim()}_${round2(asNum(r.total_amount))}`;
        return !invoiceRowDedup.has(dedupKey);
      })
      .map(r => {
        const total = asNum(r.total_amount);
        const paid = asNum(r.amount_paid);
        const isPaid = r.status === 'Paid' || paid >= total - 0.01;
        return {
          id: `rec-${r.id}`,
          _source_type: 'receivable',
          invoice_no: r.invoice_no,
          receipt_no: null,
          customer_name: r.customer_name,
          department_source: r.department_source,
          invoice_date: r.invoice_date,
          due_date: r.due_date,
          selling_price: total,
          cogs: 0,
          gross_profit: total,
          subtotal: total,
          input_vat: 0,
          output_vat: 0,
          vat_standard: 0,
          vat_exempt: 0,
          vat_zero_rated: 0,
          vat_total: 0,
          total_amount: total,
          amount_paid: paid,
          outstanding_balance: isPaid ? 0 : round2(total - paid),
          status: isPaid ? 'Paid' : (r.status || 'Unpaid'),
          payment_method: null,
          manual_details: r.manual_details,
        };
      });

    const all = [...invoiceRows, ...legacyMapped].sort(
      (a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)
    );
    res.json({ success: true, data: all });
  } catch (error) {
    console.error('Error fetching revenue book:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue book' });
  }
});

// ── GET detail of a revenue book entry ───────────────────────────
router.get('/book/:id/detail', authenticate, async (req, res) => {
  const asNum = (v) => parseFloat(v || 0) || 0;
  const round2 = (n) => Math.round(n * 100) / 100;
  try {
    const { id } = req.params;

    // invoice-based entry (id = sales_invoices.id)
    const inv = await knex('sales_invoices').where('id', id).first();
    if (inv) {
      const receipt = await knex('sales_receipts')
        .where('invoice_id', id).andWhereNot('status', 'cancelled').first();
      const items = await knex('sales_invoice_items').where('invoice_id', id);

      let totalCogs = 0, totalSelling = 0, outputVat = 0;
      const enrichedItems = items.map(item => {
        const qty = asNum(item.qty);
        const up = asNum(item.unit_price);
        const cp = item.cost_price != null ? asNum(item.cost_price) : 0;
        const vat = asNum(item.vat_amount);
        totalSelling += round2(qty * up);
        totalCogs += round2(qty * cp);
        outputVat += vat;
        return { name: item.name, qty, unit_price: up, cost_price: cp,
          line_total: round2(qty * up), cogs: round2(qty * cp),
          gross_profit: round2(qty * up - qty * cp), vat_amount: vat, treatment: item.treatment };
      });
      outputVat = round2(outputVat);

      // ── Enrich with data from the originating source table ──
      let customerPhone = null, customerEmail = null, salesManagerName = inv.created_by_name || null;
      try {
        const saleId = inv.sale_id;
        if (inv.source === 'retail') {
          if (inv.sale_type === 'online') {
            const row = await knex('retail_orders as ro')
              .where('ro.id', saleId)
              .select('ro.customer_phone', 'ro.customer_email')
              .first();
            if (row) { customerPhone = row.customer_phone; customerEmail = row.customer_email; }
            
            // Enrich actual product items instead of generic 'Retail income'
            const realItems = await knex('retail_order_items as roi')
              .join('retail_products as rp', 'roi.product_id', 'rp.id')
              .where('roi.order_id', saleId)
              .select('rp.name', 'roi.quantity', 'roi.unit_price', 'roi.subtotal', 'rp.cost_price');
            
            if (realItems && realItems.length > 0) {
              enrichedItems.length = 0; // clear generic items
              totalSelling = 0; totalCogs = 0;
              for (const rItem of realItems) {
                const qty = asNum(rItem.quantity);
                const up = asNum(rItem.unit_price);
                const cp = rItem.cost_price != null ? asNum(rItem.cost_price) : 0;
                totalSelling += round2(qty * up);
                totalCogs += round2(qty * cp);
                enrichedItems.push({
                   name: rItem.name, qty, unit_price: up, cost_price: cp,
                   line_total: round2(qty * up), cogs: round2(qty * cp),
                   gross_profit: round2(qty * up - qty * cp), vat_amount: 0, treatment: 'standard'
                });
              }
            }
          } else {
            const row = await knex('retail_transactions as rt')
              .leftJoin('retail_shifts as rs', 'rt.shift_id', 'rs.id')
              .leftJoin('users as u', 'rs.cashier_id', 'u.id')
              .where('rt.id', saleId)
              .select('rt.customer_phone', 'u.full_name as manager_name')
              .first();
            if (row) { customerPhone = row.customer_phone; salesManagerName = row.manager_name || salesManagerName; }
          }
        } else if (inv.source === 'pos') {
          const row = await knex('pos_sales as ps')
            .leftJoin('customers as c', 'ps.customer_id', 'c.id')
            .leftJoin('users as u', 'ps.cashier_id', 'u.id')
            .where('ps.id', saleId)
            .select('c.phone as customer_phone', 'c.email as customer_email', 'u.full_name as manager_name')
            .first();
          if (row) { customerPhone = row.customer_phone; customerEmail = row.customer_email; salesManagerName = row.manager_name || salesManagerName; }
        } else if (inv.source === 'printing') {
          const row = await knex('printing_orders as po')
            .leftJoin('users as u', 'po.user_id', 'u.id')
            .where('po.id', saleId)
            .select('po.customer_phone', 'po.customer_email', 'u.full_name as manager_name')
            .first();
          if (row) { customerPhone = row.customer_phone; customerEmail = row.customer_email; salesManagerName = row.manager_name || salesManagerName; }
        } else if (inv.source === 'car_rental') {
          const row = await knex('car_rental_orders as cr')
            .leftJoin('users as u', 'cr.user_id', 'u.id')
            .where('cr.id', saleId)
            .select('cr.customer_phone', 'cr.customer_email', 'u.full_name as manager_name')
            .first();
          if (row) { customerPhone = row.customer_phone; customerEmail = row.customer_email; salesManagerName = row.manager_name || salesManagerName; }
        } else if (inv.source === 'tender') {
          // Pull bidder info from finance_income_submissions.manual_details (the original submission record)
          // which has the full bidder details saved at submission time.
          try {
            const submission = await knex('finance_income_submissions')
              .where('department', 'Tender')
              .where('status', 'Approved')
              .whereRaw('(manual_details) ->> \'{bidId}\' = ?', [String(saleId)])
              .select('manual_details')
              .first();
            if (submission && submission.manual_details) {
              const smd = JSON.parse(submission.manual_details);
              if (smd.bidderPhone) customerPhone = smd.bidderPhone;
              if (smd.bidderEmail) customerEmail = smd.bidderEmail;
              if (smd.bidderName && !inv.customer_name) inv.customer_name = smd.bidderName;
            }
          } catch (_) { /* ignore */ }
          // Fallback: try direct bids table lookup
          if (!customerPhone && !customerEmail) {
            const row = await knex('bids').where('id', saleId)
              .select('bidder_phone', 'bidder_email', 'bidder_full_name').first();
            if (row) {
              customerPhone = row.bidder_phone;
              customerEmail = row.bidder_email;
              if (row.bidder_full_name && !inv.customer_name) inv.customer_name = row.bidder_full_name;
            }
          }
        }
      } catch (_) { /* ignore enrichment errors */ }

      const totalAmount = asNum(inv.total_amount);
      const amountPaid = receipt ? asNum(receipt.amount_paid) : 0;
      const isPaid = !!receipt;
      const SOURCE_LABEL = { retail: 'Retail & POS', pharmacy: 'Pharmacy',
        printing: 'Printing', car_rental: 'Car Rental', agrirent: 'AgriRent', tender: 'Tender', manual: 'Manual Entry' };

      // Read cpo_refunded flag from sales_invoices.notes
      let invoiceNotes = {};
      try { if (inv.notes) invoiceNotes = JSON.parse(inv.notes); } catch (_) {}

      // For tender, build rich manual_details with full bidder + tender info
      let manualDetailsObj = receipt ? {
        paymentMethod: receipt.payment_method,
        receivedFrom: inv.customer_name || 'Walk-in Customer',
        amount: amountPaid, reference: receipt.payment_reference,
        crvNumber: receipt.receipt_no,
        department: SOURCE_LABEL[inv.source] || inv.source,
      } : null;

      if (inv.source === 'tender' && manualDetailsObj) {
        // Enrich with full tender/bidder details from finance_income_submissions
        try {
          const submission = await knex('finance_income_submissions')
            .where('department', 'Tender')
            .where('status', 'Approved')
            .whereRaw('(manual_details) ->> \'{bidId}\' = ?', [String(inv.sale_id)])
            .select('manual_details')
            .first();
          if (submission && submission.manual_details) {
            const smd = JSON.parse(submission.manual_details);
            manualDetailsObj = {
              ...manualDetailsObj,
              type: 'tender_sell',
              bidderName: smd.bidderName || inv.customer_name,
              bidderPhone: smd.bidderPhone || customerPhone,
              bidderEmail: smd.bidderEmail || customerEmail,
              tenderReference: smd.tenderReference,
              tenderTitle: smd.tenderTitle,
              tenderId: smd.tenderId,
              bidId: smd.bidId,
              cpoAmount: smd.amount || amountPaid,
              cpo_refunded: invoiceNotes.cpo_refunded || false,
              refunded_at: invoiceNotes.refunded_at || null,
              refunded_by: invoiceNotes.refunded_by || null,
            };
          }
        } catch (_) { /* ignore */ }
      }

      const receivable = {
        id, customer_name: inv.customer_name || 'Walk-in Customer',
        customer_phone: customerPhone,
        customer_email: customerEmail,
        sales_manager_name: salesManagerName,
        invoice_no: inv.invoice_no, invoice_date: inv.created_at, due_date: inv.created_at,
        department_source: SOURCE_LABEL[inv.source] || inv.source,
        total_amount: totalAmount, amount_paid: amountPaid,
        outstanding_balance: isPaid ? 0 : round2(totalAmount - amountPaid),
        status: isPaid ? 'Paid' : 'Unpaid',
        selling_price: round2(totalSelling), cogs: round2(totalCogs),
        gross_profit: round2(totalSelling - totalCogs),
        subtotal: asNum(inv.subtotal), output_vat: outputVat, input_vat: 0,
        vat_standard: asNum(inv.vat_standard), vat_exempt: asNum(inv.vat_exempt),
        vat_zero_rated: asNum(inv.vat_zero_rated), vat_total: asNum(inv.vat_total),
        manual_details: manualDetailsObj ? JSON.stringify(manualDetailsObj) : null,
        cpo_refunded: invoiceNotes.cpo_refunded || false,
      };

      return res.json({ success: true, data: {
        receivable,
        transactions: [{ id: inv.id, receipt_no: receipt ? receipt.receipt_no : inv.invoice_no,
          sale_type: 'SALE', total_amount: totalAmount,
          payment_method: receipt ? receipt.payment_method : 'Pending',
          worker_name: salesManagerName,
          recipient_name: inv.customer_name,
          recipient_phone: customerPhone,
          customer_email: customerEmail,
          created_at: inv.created_at, items: enrichedItems }],
        systemTotal: totalAmount, transactionCount: 1
      }});
    }

    // Finance receivable (manual/ledger entry)
    let legacyId = id;
    if (String(id).startsWith('rec-')) {
      legacyId = String(id).replace('rec-', '');
    }
    const receivable = await knex('finance_receivables').where('id', legacyId).first();
    if (!receivable) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    let transactions = [];
    if (receivable.department_source === 'Pharmacy') {
      const sales = await knex('pharmacy_sales as ps')
        .leftJoin('pharmacy_workers as pw', 'ps.worker_id', 'pw.id')
        .leftJoin('pharmacy_branches as pb', 'ps.branch_id', 'pb.id')
        .leftJoin('pharmacy_payments as pp', 'ps.id', 'pp.sale_id')
        .where('ps.is_submitted', true)
        .select('ps.id', 'ps.receipt_no', 'ps.sale_type', 'ps.recipient_name', 'ps.recipient_phone',
          'ps.total_products', 'ps.total_amount', 'ps.created_at',
          'pw.name as worker_name', 'pb.name as branch_name',
          'pp.payment_method', 'pp.bank_name', 'pp.account_holder', 'pp.account_number',
          'pp.telbir_number', 'pp.recipient_name as pp_recipient_name', 'pp.recipient_phone as pp_recipient_phone')
        .orderBy('ps.created_at', 'asc');
      for (const sale of sales) {
        const items = await knex('pharmacy_sale_items').where('sale_id', sale.id)
          .select('drug_name', 'quantity', 'unit_price', 'total_price');
        transactions.push({ ...sale, items });
      }
    }
    // Map legacy receivable to standard format expected by UI
    const mappedReceivable = {
      ...receivable,
      id, // restore the 'rec-' prefix
      customer_name: receivable.customer_name || 'Manual Entry',
      invoice_no: receivable.invoice_no,
      invoice_date: receivable.invoice_date,
      due_date: receivable.due_date,
      department_source: receivable.department_source,
      total_amount: asNum(receivable.total_amount),
      amount_paid: asNum(receivable.amount_paid),
      outstanding_balance: asNum(receivable.outstanding_balance),
      status: receivable.status,
      selling_price: asNum(receivable.total_amount),
      cogs: 0,
      gross_profit: asNum(receivable.total_amount),
      subtotal: asNum(receivable.total_amount),
      output_vat: 0,
      input_vat: 0,
      vat_standard: 0,
      vat_exempt: 0,
      vat_zero_rated: 0,
      vat_total: 0,
      manual_details: receivable.manual_details
    };

    res.json({ success: true, data: {
      receivable: mappedReceivable, transactions,
      systemTotal: parseFloat(mappedReceivable.total_amount), transactionCount: transactions.length
    }});
  } catch (error) {
    console.error('Error fetching revenue book detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch detail' });
  }
});

// ── PATCH /book/:id/mark-refunded — mark CPO tender deposit as refunded ───
router.patch('/book/:id/mark-refunded', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { refunded } = req.body; // boolean: true = mark refunded, false = unmark

    const inv = await knex('sales_invoices').where('id', id).first();
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (inv.source !== 'tender') return res.status(400).json({ success: false, message: 'Only tender CPO deposits can be marked as refunded' });

    let notes = {};
    try { if (inv.notes) notes = JSON.parse(inv.notes); } catch (_) {}

    const isRefunded = refunded !== false; // default true if not explicitly false
    notes.cpo_refunded = isRefunded;
    if (isRefunded) {
      notes.refunded_at = new Date().toISOString();
      notes.refunded_by = (req.user && (req.user.fullName || req.user.full_name)) || 'Finance Officer';
    } else {
      delete notes.refunded_at;
      delete notes.refunded_by;
    }

    await knex('sales_invoices').where('id', id).update({ notes: JSON.stringify(notes), updated_at: knex.fn.now() });

    return res.json({ success: true, message: isRefunded ? 'CPO marked as refunded' : 'CPO refund mark removed', cpo_refunded: isRefunded });
  } catch (error) {
    console.error('Error marking CPO refunded:', error);
    res.status(500).json({ success: false, message: 'Failed to update refund status' });
  }
});

module.exports = router;
