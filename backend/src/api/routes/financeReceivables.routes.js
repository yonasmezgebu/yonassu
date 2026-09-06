const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { sendFinanceNotification, sendPrintingNotification, sendCustomerNotification } = require('../../services/notification.service');
const { recordIncomeToLedger, normalizePaymentMethod } = require('../../utils/financeIncome.service');
const { generateInvoiceNumber, generateReceiptNumber } = require('../../utils/orderNumber');

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

    await trx('sales_invoices').insert({
      id: invoiceId,
      invoice_no: invoiceNo,
      source,
      sale_id: saleId,
      customer_name: customer || 'Walk-in Customer',
      customer_tin: null,
      subtotal: amount,
      vat_standard: 0,
      vat_standard_rate: 0.15,
      vat_exempt: 0,
      vat_zero_rated: 0,
      vat_total: 0,
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
      unit_price: amount,
      cost_price: 0,
      treatment: 'zero_rated',
      rate: 0,
      vat_amount: 0,
      subtotal: amount,
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
      await trx('sales_invoices').insert({
        id: invoiceId,
        invoice_no: invoiceNo,
        source,
        sale_id: String(orderId),
        customer_name: md.receivedFrom || `Internal - ${department}`,
        customer_tin: null,
        subtotal: amount,
        vat_standard: 0,
        vat_standard_rate: 0.15,
        vat_exempt: 0,
        vat_zero_rated: 0,
        vat_total: 0,
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
        unit_price: amount,
        cost_price: 0,
        treatment: 'zero_rated',
        rate: 0,
        vat_amount: 0,
        subtotal: amount,
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
          .select(knex.raw("JSON_UNQUOTE(JSON_EXTRACT(manual_details, '$.order_id'))"))
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

    // For Pharmacy dept — fetch the real individual sale transactions if it's not a manual walk-in
    if (submission.department === 'Pharmacy' && !submission.manual_details) {
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

    // For Retail dept — fetch submitted retail_transactions
    if (submission.department === 'Retail') {
      const retailSales = await knex('retail_transactions as rt')
        .leftJoin('users as u', 'rt.received_by', 'u.id')
        .where('rt.is_submitted', true)
        .select(
          'rt.id', 'rt.invoice_number as receipt_no', 'rt.sale_type',
          'rt.total_amount', 'rt.payment_method', 'rt.created_at',
          'rt.sender_name as recipient_name', 'rt.sender_phone as recipient_phone',
          'u.full_name as worker_name'
        )
        .orderBy('rt.created_at', 'asc');

      for (const sale of retailSales) {
        const items = await knex('retail_transaction_items as rti')
          .join('retail_products as p', 'rti.product_id', 'p.id')
          .where('rti.transaction_id', sale.id)
          .select('p.name as drug_name', 'rti.quantity', 'rti.unit_price', 'rti.line_total as total_price');
        transactions.push({ ...sale, items });
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
      if (!skipLedgerRecording) {
        await recordLedgerIncome(trx, {
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
      }

      // Mint + link a Sales Invoice and Receipt for the approved income so it always
// shows on the Sales Invoice & Receipt page. Departments whose modules already
// create their own invoice + receipt at sale time are skipped so approving never
// creates a duplicate. Everything else (manual walk-ins / general inflow) gets
// the synthetic invoice. Idempotent (keyed on source + sale_id).
const deptKey = String(submission.department || '').toLowerCase();
if (!SELF_INVOICING_DEPARTMENTS.has(deptKey)) {
  await ensureInvoiceAndReceipt(trx, {
    source: 'manual',
    saleId: 500000000 + parseInt(id, 10),
    customer: customerName,
    amount: systemTotal,
    paymentMethod: manualDetails.paymentMethod || 'Cash',
    paymentReference: submission.reference_no || manualDetails.paymentReference || null,
    description: submission.description,
    receivedBy: manualDetails.financeName || (req.user && req.user.fullName) || 'Finance Officer',
  });
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
  'retail pos': 'pos',
  'retailpos': 'pos',
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
      } catch (e) {
        console.error('Failed to propagate printing rejection:', e.message);
      }
      sendPrintingNotification({
        title: 'Income Rejected by Finance',
        message: `ETB ${Number(submission.amount || 0).toLocaleString()} Printing income was rejected by Finance. Reason: ${reason}`,
        type: 'payment_rejected',
        link: '/printing-manager/reports/finance',
        related_entity_id: submission.id
      }, req.app?.get('io')).catch(e => console.error('Failed to notify printing:', e.message));
    }
    res.json({ success: true, message: 'Submission rejected.' });
  } catch (error) {
    console.error('Error rejecting income submission:', error);
    res.status(500).json({ success: false, message: 'Failed to reject submission' });
  }
});

// ── GET all receivables (Receivables Book) ────────────────────────
router.get('/book', authenticate, async (req, res) => {
  try {
    const receivables = await knex('finance_receivables')
      .orderBy('invoice_date', 'desc');
    res.json({ success: true, data: receivables });
  } catch (error) {
    console.error('Error fetching receivables:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receivables' });
  }
});

// ── GET detail of a receivable book entry ─────────────────────────
router.get('/book/:id/detail', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const receivable = await knex('finance_receivables').where({ id }).first();
    
    if (!receivable) {
      return res.status(404).json({ success: false, message: 'Receivable not found' });
    }

    let transactions = [];
    if (receivable.department_source === 'Pharmacy') {
      // In this system, pharmacy sales are aggregated. We fetch the submitted ones.
      // Ideally, they should be linked by a submission ID, but this is the current behavior.
      const sales = await knex('pharmacy_sales as ps')
        .leftJoin('pharmacy_workers as pw', 'ps.worker_id', 'pw.id')
        .leftJoin('pharmacy_branches as pb', 'ps.branch_id', 'pb.id')
        .leftJoin('pharmacy_payments as pp', 'ps.id', 'pp.sale_id')
        .where('ps.is_submitted', true)
        .select(
          'ps.id',
          'ps.receipt_no',
          'ps.sale_type',
          'ps.recipient_name',
          'ps.recipient_phone',
          'ps.total_products',
          'ps.total_amount',
          'ps.created_at',
          'pw.name as worker_name',
          'pb.name as branch_name',
          'pp.payment_method',
          'pp.bank_name',
          'pp.account_holder',
          'pp.account_number',
          'pp.telbir_number',
          'pp.recipient_name as pp_recipient_name',
          'pp.recipient_phone as pp_recipient_phone'
        )
        .orderBy('ps.created_at', 'asc');

      for (const sale of sales) {
        const items = await knex('pharmacy_sale_items')
          .where('sale_id', sale.id)
          .select('drug_name', 'quantity', 'unit_price', 'total_price');
        transactions.push({ ...sale, items });
      }
    }

    res.json({
      success: true,
      data: {
        receivable,
        transactions,
        systemTotal: parseFloat(receivable.total_amount),
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('Error fetching receivable detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch detail' });
  }
});

module.exports = router;
