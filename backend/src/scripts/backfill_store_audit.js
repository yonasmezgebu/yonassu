/**
 * backfill_store_audit.js
 *
 * One-time script: migrates existing stock_issues, stock_transfers,
 * stock_receipts, and stock_adjustments into central_audit_logs.
 *
 * Run from project backend root:
 *   node src/scripts/backfill_store_audit.js
 */

'use strict';

const { db } = require('../config/database');

async function backfill() {
  console.log('[Backfill] Starting General Store audit log backfill...');

  /* ── 1. Issues to departments ─────────────────────────── */
  console.log('[Backfill] Processing stock_issues...');
  const issues = await db('stock_issues').select('*');
  for (const issue of issues) {
    const items = await db('stock_issue_items').where('issue_id', issue.id).select('*');
    const exists = await db('central_audit_logs')
      .where({ module: 'Store', action: 'STORE_ISSUE_TO_DEPT', record_identifier: issue.issue_no })
      .first();
    if (!exists) {
      await db('central_audit_logs').insert({
        user_id:           issue.issued_by || null,
        user_name:         'System Backfill',
        role:              'Unknown',
        department:        issue.department || 'Unknown',
        module:            'Store',
        action:            'STORE_ISSUE_TO_DEPT',
        record_identifier: issue.issue_no,
        new_value:         JSON.stringify({
          issue_no:   issue.issue_no,
          department: issue.department,
          issued_to:  issue.issued_to,
          issue_date: issue.issue_date,
          remarks:    issue.remarks,
          items,
        }),
        created_at: issue.created_at || new Date(),
      });
      console.log(`  + Issue ${issue.issue_no}`);
    } else {
      console.log(`  - Skip ${issue.issue_no} (already logged)`);
    }
  }

  /* ── 2. Stock transfers ────────────────────────────────── */
  console.log('[Backfill] Processing stock_transfers...');
  const transfers = await db('stock_transfers').select('*');
  for (const t of transfers) {
    const items = await db('stock_transfer_items').where('transfer_id', t.id).select('*');
    const exists = await db('central_audit_logs')
      .where({ module: 'Store', action: 'STORE_MOVEMENT_TRANSFER', record_identifier: t.transfer_no })
      .first();
    if (!exists) {
      await db('central_audit_logs').insert({
        user_id:           t.created_by || null,
        user_name:         'System Backfill',
        role:              'Unknown',
        department:        'Store',
        module:            'Store',
        action:            'STORE_MOVEMENT_TRANSFER',
        record_identifier: t.transfer_no,
        new_value:         JSON.stringify({
          transfer_no:   t.transfer_no,
          from_location: t.from_location,
          to_location:   t.to_location,
          transfer_type: t.transfer_type,
          transfer_date: t.transfer_date,
          status:        t.status,
          remarks:       t.remarks,
          items,
        }),
        created_at: t.created_at || new Date(),
      });
      console.log(`  + Transfer ${t.transfer_no}`);
    } else {
      console.log(`  - Skip ${t.transfer_no} (already logged)`);
    }
  }

  /* ── 3. Stock receipts ─────────────────────────────────── */
  console.log('[Backfill] Processing stock_receipts...');
  const receipts = await db('stock_receipts').select('*');
  for (const r of receipts) {
    const items = await db('stock_receipt_items').where('receipt_id', r.id).select('*');
    const exists = await db('central_audit_logs')
      .where({ module: 'Store', action: 'STORE_RECEIPT', record_identifier: r.receipt_no })
      .first();
    if (!exists) {
      await db('central_audit_logs').insert({
        user_id:           r.received_by || null,
        user_name:         'System Backfill',
        role:              'Unknown',
        department:        'Store',
        module:            'Store',
        action:            'STORE_RECEIPT',
        record_identifier: r.receipt_no,
        new_value:         JSON.stringify({
          receipt_no:    r.receipt_no,
          supplier_name: r.supplier_name,
          receipt_date:  r.receipt_date,
          remarks:       r.remarks,
          items,
        }),
        created_at: r.created_at || new Date(),
      });
      console.log(`  + Receipt ${r.receipt_no}`);
    } else {
      console.log(`  - Skip ${r.receipt_no} (already logged)`);
    }
  }

  /* ── 4. Stock adjustments (group by adjustment_no) ──────── */
  console.log('[Backfill] Processing stock_adjustments...');
  const adjustments = await db('stock_adjustments').where('status', 'APPROVED').select('*');
  const adjByNo = {};
  for (const a of adjustments) {
    if (!adjByNo[a.adjustment_no]) adjByNo[a.adjustment_no] = [];
    adjByNo[a.adjustment_no].push(a);
  }
  for (const [adjNo, lines] of Object.entries(adjByNo)) {
    const exists = await db('central_audit_logs')
      .where({ module: 'Store', action: 'STORE_ADJUSTMENT_APPROVED', record_identifier: adjNo })
      .first();
    if (!exists) {
      await db('central_audit_logs').insert({
        user_id:           lines[0].approved_by || null,
        user_name:         'System Backfill',
        role:              'Unknown',
        department:        'Store',
        module:            'Store',
        action:            'STORE_ADJUSTMENT_APPROVED',
        record_identifier: adjNo,
        new_value:         JSON.stringify({
          adjustment_no: adjNo,
          lines_approved: lines.length,
          lines,
        }),
        created_at: lines[0].approved_at || lines[0].created_at || new Date(),
      });
      console.log(`  + Adjustment ${adjNo}`);
    } else {
      console.log(`  - Skip ${adjNo} (already logged)`);
    }
  }

  console.log('[Backfill] ✅ Completed.');
  process.exit(0);
}

backfill().catch(err => {
  console.error('[Backfill] ❌ Failed:', err.message);
  process.exit(1);
});
