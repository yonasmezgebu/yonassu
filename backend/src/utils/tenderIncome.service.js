const { db } = require('../config/database');

/**
 * Create or update a Pending finance_income_submissions entry for an AWARDED
 * Compete & Buy winning bid. Called manually by the Sales Manager after the
 * customer has actually paid.
 *
 * Idempotency key: `TND-BID-{bidId}`.
 * - If no record exists → INSERT a new Pending record.
 * - If a Pending or Rejected record exists → UPDATE it with the new payment
 *   details and reset to Pending (so Finance sees the refreshed info).
 * - If an Approved record exists → INSERT a new record (this is a new payment).
 */
const ensureTenderIncomeSubmission = async ({ bid, tender }) => {
  if (!bid || !tender) return null;

  const subtotal = parseFloat(bid.total_bid_value) || 0;
  const vatAmount = parseFloat(bid.vat_amount) || 0;
  const amount = Math.round((subtotal + vatAmount) * 100) / 100;
  const referenceNo = `TND-BID-${bid.id}`;

  // Resolve payment method (handles "Bank::5" style account refs)
  let formattedPaymentMethod = bid.payment_method || 'Cash';
  if (formattedPaymentMethod.includes('::')) {
    const [type, accId] = formattedPaymentMethod.split('::');
    try {
      const acc = await db('finance_accounts').where('id', accId).first();
      formattedPaymentMethod = acc ? `${type} (${acc.account_number})` : type;
    } catch (_) {
      formattedPaymentMethod = type;
    }
  }

  // Build line-items snapshot
  let itemsSnapshot = [];
  try {
    const arr = typeof bid.items === 'string' ? JSON.parse(bid.items || '[]') : (bid.items || []);
    if (Array.isArray(arr) && arr.length) {
      itemsSnapshot = arr.map((it) => ({
        itemId: it.id != null ? it.id : null,
        quantity: parseFloat(it.quantity || 1) || 1,
        unitPrice: (parseFloat(it.bidPriceBirr || 0) || 0) + ((parseFloat(it.bidPriceCent || 0) || 0) / 100),
      }));
    }
  } catch (_) {}

  if (!itemsSnapshot.length) {
    const qty = parseFloat(bid.quantity_requested || 1) || 1;
    itemsSnapshot = [{ itemId: tender.id, quantity: qty, unitPrice: qty ? subtotal / qty : subtotal }];
  }

  const manualDetails = {
    type: 'tender_sell',
    tenderId: tender.id,
    tenderReference: tender.reference_number || null,
    tenderTitle: tender.title || '',
    bidId: bid.id,
    saleId: `TND-${bid.id}`,
    bidderName: bid.bidder_full_name || null,
    bidderEmail: bid.bidder_email || null,
    bidderPhone: bid.bidder_phone || null,
    subtotal,
    vatAmount,
    amount,
    paymentMethod: formattedPaymentMethod,
    paymentReference: bid.payment_reference || null,
    receivedFrom: bid.bidder_full_name || bid.bidder_email || 'Tender Winner',
    description: `${tender.reference_number || `Tender #${tender.id}`} — ${tender.title || 'Compete & Buy'}`,
    itemsSnapshot,
  };

  const commonFields = {
    department: 'Tender',
    submitted_by: bid.bidder_full_name || bid.bidder_email || 'Tender Winner',
    amount,
    description: `Compete & Buy award — ${tender.reference_number || `Tender #${tender.id}`}: ${tender.title || ''}`,
    status: 'Pending',
    manual_details: JSON.stringify(manualDetails),
    updated_at: db.fn.now(),
  };

  // Check for existing record with this reference
  const existing = await db('finance_income_submissions')
    .where('reference_no', referenceNo)
    .orderBy('id', 'desc')
    .first();

  if (existing) {
    if (existing.status === 'Approved') {
      // Already approved — insert a brand-new pending record so Finance can verify the new payment
      const [id] = await db('finance_income_submissions').insert({
        ...commonFields,
        reference_no: `${referenceNo}-R${Date.now()}`,
        created_at: db.fn.now(),
      });
      return db('finance_income_submissions').where('id', id).first();
    } else {
      // Pending or Rejected — update with the new payment details and reset to Pending
      await db('finance_income_submissions').where('id', existing.id).update(commonFields);
      return db('finance_income_submissions').where('id', existing.id).first();
    }
  }

  // No record at all — create fresh
  const [id] = await db('finance_income_submissions').insert({
    ...commonFields,
    reference_no: referenceNo,
    created_at: db.fn.now(),
  });

  return db('finance_income_submissions').where('id', id).first();
};

module.exports = { ensureTenderIncomeSubmission };