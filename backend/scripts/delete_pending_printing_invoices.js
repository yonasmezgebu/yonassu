/**
 * One-time script: deletes all 'printing' source invoices that are NOT yet paid.
 * Run with: node scripts/delete_pending_printing_invoices.js
 */
const { db } = require('../src/config/database');

async function main() {
  try {
    const pending = await db('sales_invoices')
      .where('source', 'printing')
      .whereNotIn('status', ['Paid', 'paid', 'PAID'])
      .whereNot('status', 'cancelled')
      .select('id', 'invoice_no', 'status', 'total_amount');

    console.log(`Found ${pending.length} pending printing invoice(s):`);
    pending.forEach(inv =>
      console.log(` - ID: ${inv.id} | invoice_no: ${inv.invoice_no} | status: ${inv.status} | total: ${inv.total_amount}`)
    );

    if (pending.length === 0) {
      console.log('Nothing to delete.');
      await db.destroy();
      return;
    }

    const ids = pending.map(inv => inv.id);

    // 1. Delete related receipts (FK: sales_receipts.invoice_id → sales_invoices.id)
    const deletedReceipts = await db('sales_receipts').whereIn('invoice_id', ids).delete();
    console.log(`Deleted ${deletedReceipts} receipt row(s).`);

    // 2. Delete related invoice items (FK: sales_invoice_items.invoice_id → sales_invoices.id)
    const deletedItems = await db('sales_invoice_items').whereIn('invoice_id', ids).delete();
    console.log(`Deleted ${deletedItems} invoice item row(s).`);

    // 3. Delete the invoices
    const deleted = await db('sales_invoices').whereIn('id', ids).delete();
    console.log(`✅ Deleted ${deleted} pending printing invoice(s).`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.destroy();
  }
}

main();
