const { db } = require('../config/database');

/**
 * Create a Pending finance_income_submissions entry for an AWARDED Compete &
 * Buy winning bid, so Finance can verify the payment on the Revenue Live
 * Income page — exactly like every other income module. Idempotent: keyed on
 * reference_no `TND-BID-{bidId}`.
 *
 * The recorded amount is the VAT-inclusive grand total the winning customer
 * pays (total_bid_value + vat_amount) — matches the bid form's "Grand Total
 * (incl. VAT)" so all downstream finance numbers stay correct.
 */
const ensureTenderIncomeSubmission = async ({ bid, tender }) => {
  if (!bid || !tender) return null;

  const subtotal = parseFloat(bid.total_bid_value) || 0;
  const vatAmount = parseFloat(bid.vat_amount) || 0;
  const amount = Math.round((subtotal + vatAmount) * 100) / 100;
  const referenceNo = `TND-BID-${bid.id}`;

  const existing = await db('finance_income_submissions').where('reference_no', referenceNo).first();
  if (existing) return existing;

  // Line-items snapshot (for documentation). Buy tenders are usually
  // multi-item (`items` JSON), falling back to the single-item form.
  let itemsSnapshot = [];
  try {
    const arr = typeof bid.items === 'string' ? JSON.parse(bid.items || '[]') : (bid.items || []);
    if (Array.isArray(arr) && arr.length) {
      itemsSnapshot = arr.map((it) => ({
        itemId: it.id != null ? it.id : null,
        quantity: parseFloat(it.quantity || 1) || 1,
        unitPrice: ((parseFloat(it.bidPriceBirr || 0) || 0) + ((parseFloat(it.bidPriceCent || 0) || 0) / 100)),
      }));
    }
  } catch (_) { /* keep empty snapshot */ }

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
    paymentMethod: 'Cash',
    receivedFrom: bid.bidder_full_name || bid.bidder_email || 'Tender Winner',
    description: `${tender.reference_number || `Tender #${tender.id}`} — ${tender.title || 'Compete & Buy'}`,
    itemsSnapshot,
  };

  const [id] = await db('finance_income_submissions').insert({
    department: 'Tender',
    submitted_by: bid.bidder_full_name || bid.bidder_email || 'Tender Winner',
    amount,
    reference_no: referenceNo,
    description: `Compete & Buy award — ${tender.reference_number || `Tender #${tender.id}`}: ${tender.title || ''}`,
    status: 'Pending',
    manual_details: JSON.stringify(manualDetails),
  });

  return db('finance_income_submissions').where('id', id).first();
};

module.exports = { ensureTenderIncomeSubmission };