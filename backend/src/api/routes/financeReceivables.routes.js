const express = require('express');
const router = express.Router();
const { db: knex } = require('../../config/database');
const { authenticate } = require('../middleware/auth.middleware');

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
      .where('payment_status', 'PENDING_VERIFICATION')
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

    const all = [...submissions, ...rentalRows]
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
      const order = await knex('rental_orders').where({ id: rentalId }).first();
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
          dailyRate: order.daily_rate
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
        } else if (extraCharges > 0) {
          const remaining = Math.max(0, extraCharges - systemTotal);
          updateData.additional_owed = remaining;
          if (remaining > 0) updateData.payment_status = 'PARTIAL';
        }
        await trx('rental_orders').where({ id: rentalId }).update(updateData);

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
            financeName: finance_name || (req.user && req.user.fullName) || 'Finance Officer'
          }),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });

        await trx('finance_receivables').insert({
          customer_name: order.customer_name || 'Car Rental Customer',
          invoice_no: `CAR-${order.order_number}`,
          invoice_date: knex.fn.now(),
          due_date: knex.fn.now(),
          total_amount: systemTotal,
          amount_paid: systemTotal,
          outstanding_balance: 0,
          status: 'Paid',
          department_source: 'Car Rental',
          manual_details: JSON.stringify({ order_id: String(order.id), orderNumber: order.order_number })
        });

        try {
          const crypto = require('crypto');
          await trx('bank_payments').insert({
            payment_id: crypto.randomUUID(),
            reference: order.payment_reference || `RENTAL-${order.order_number}-${Date.now()}`,
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
          console.error('Failed to record rental payment to bank_payments:', bankErr.message);
        }
      });

      return res.json({ success: true, message: 'Car Rental payment approved and order confirmed successfully.' });
    }

    // ── Standard finance_income_submissions approval ───────────────
    const submission = await knex('finance_income_submissions').where({ id }).first();
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (submission.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Submission is already processed' });
    }

    let systemTotal = parseFloat(submission.amount);
    if (submission.department === 'Pharmacy' && !submission.manual_details) {
      const result = await knex('pharmacy_sales')
        .where('is_submitted', true)
        .sum('total_amount as total');
      systemTotal = parseFloat(result[0].total || 0);
    }

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

      await trx('finance_receivables').insert({
        customer_name: customerName,
        invoice_no: submission.reference_no || `REC-${Date.now()}`,
        invoice_date: knex.fn.now(),
        due_date: knex.fn.now(),
        total_amount: systemTotal,
        amount_paid: systemTotal,
        outstanding_balance: 0,
        status: 'Paid',
        department_source: submission.department,
        manual_details: JSON.stringify(manualDetails)
      });

      // Update Printing order payment_status ONLY — do NOT touch status_id
      // (Changing status_id here resets the order's workflow position which causes data loss)
      if (submission.department === 'Printing' && submission.manual_details) {
        try {
          const parsed = JSON.parse(submission.manual_details);
          if (parsed.order_id) {
            // Find the in_queue status so confirmed order enters the print job queue
            const inQueueStatus = await trx('order_statuses').where('status_code', 'in_queue').first();

            const updatePayload = {
              payment_status: 'Confirmed',
              updated_at: knex.fn.now()
            };

            // Auto-advance to Job Queue so supervisor can see and process
            if (inQueueStatus) {
              updatePayload.status_id = inQueueStatus.id;
            }

            await trx('printing_orders')
              .where({ id: parsed.order_id })
              .update(updatePayload);

            // Log history
            if (inQueueStatus) {
              await trx('order_status_history').insert({
                order_id: parsed.order_id,
                status_id: inQueueStatus.id,
                changed_by: req.user ? req.user.id : null,
                notes: 'Payment confirmed by Finance — moved to Job Queue for printing'
              });
            }
          }
        } catch(e) {
          console.error('Failed to update printing order payment status:', e);
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
            // Fetch order to check if we are paying initial or additional
            const order = await trx('rental_orders').where({ id: parsed.order_id }).first();
            if (order) {
              const extraCharges = parseFloat(order.additional_owed || 0);
              let updateData = {
                verified_by_finance_at: knex.fn.now()
              };

              if (order.status === 'APPROVED' || order.status === 'PENDING_APPROVAL') {
                updateData.payment_status = 'PAID';
                updateData.status = 'CONFIRMED';
                updateData.verified_amount = systemTotal;
              } else if (extraCharges > 0) {
                const remaining = Math.max(0, extraCharges - systemTotal);
                updateData.additional_owed = remaining;
                if (remaining === 0) {
                  updateData.payment_status = 'PAID';
                }
              }

              await trx('rental_orders')
                .where({ id: parsed.order_id })
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
