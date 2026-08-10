const { db } = require('../backend/src/config/database');
const audit = require('../backend/src/services/centralAudit.service');

async function backfillStoreAuditLogs() {
  console.log('Starting store audit log backfill...');
  try {
    // 1. Backfill Issues
    console.log('Backfilling stock_issues...');
    const issues = await db('stock_issues');
    for (const issue of issues) {
      const items = await db('stock_issue_items').where('issue_id', issue.id);
      
      const logExists = await db('central_audit_logs')
        .where({ module: 'Store', action: 'STORE_ISSUE_TO_DEPT', record_identifier: issue.issue_no })
        .first();
        
      if (!logExists) {
        await db('central_audit_logs').insert({
          user_id: issue.issued_by || null,
          user_name: 'System Backfill',
          role: 'Unknown',
          department: issue.department || 'Unknown',
          module: 'Store',
          action: 'STORE_ISSUE_TO_DEPT',
          record_identifier: issue.issue_no,
          new_value: JSON.stringify({ issue_no: issue.issue_no, department: issue.department, issued_to: issue.issued_to, items, remarks: issue.remarks }),
          created_at: issue.created_at || new Date(),
        });
      }
    }

    // 2. Backfill Transfers
    console.log('Backfilling stock_transfers...');
    const transfers = await db('stock_transfers');
    for (const transfer of transfers) {
      const items = await db('stock_transfer_items').where('transfer_id', transfer.id);
      
      const logExists = await db('central_audit_logs')
        .where({ module: 'Store', action: 'STORE_MOVEMENT_TRANSFER', record_identifier: transfer.transfer_no })
        .first();
        
      if (!logExists) {
         await db('central_audit_logs').insert({
          user_id: transfer.created_by || null,
          user_name: 'System Backfill',
          role: 'Unknown',
          department: 'Unknown',
          module: 'Store',
          action: 'STORE_MOVEMENT_TRANSFER',
          record_identifier: transfer.transfer_no,
          new_value: JSON.stringify({ transfer_no: transfer.transfer_no, from_location: transfer.from_location, to_location: transfer.to_location, transfer_type: transfer.transfer_type, items, remarks: transfer.remarks }),
          created_at: transfer.created_at || new Date(),
        });
      }
    }

    // 3. Backfill Receipts
    console.log('Backfilling stock_receipts...');
    const receipts = await db('stock_receipts');
    for (const receipt of receipts) {
       const items = await db('stock_receipt_items').where('receipt_id', receipt.id);
       
       const logExists = await db('central_audit_logs')
        .where({ module: 'Store', action: 'STORE_RECEIPT', record_identifier: receipt.receipt_no })
        .first();
        
      if (!logExists) {
         await db('central_audit_logs').insert({
          user_id: receipt.received_by || null,
          user_name: 'System Backfill',
          role: 'Unknown',
          department: 'Unknown',
          module: 'Store',
          action: 'STORE_RECEIPT',
          record_identifier: receipt.receipt_no,
          new_value: JSON.stringify({ receipt_no: receipt.receipt_no, supplier: receipt.supplier_name, items, remarks: receipt.remarks }),
          created_at: receipt.created_at || new Date(),
        });
      }
    }
    
    // 4. Backfill Adjustments
    console.log('Backfilling stock_adjustments...');
    const adjustments = await db('stock_adjustments').where('status', 'APPROVED');
    // Group by adjustment_no
    const adjGroups = {};
    for(const adj of adjustments) {
        if(!adjGroups[adj.adjustment_no]) adjGroups[adj.adjustment_no] = [];
        adjGroups[adj.adjustment_no].push(adj);
    }
    
    for (const adjNo in adjGroups) {
       const logExists = await db('central_audit_logs')
        .where({ module: 'Store', action: 'STORE_ADJUSTMENT_APPROVED', record_identifier: adjNo })
        .first();
        
      if (!logExists) {
         await db('central_audit_logs').insert({
          user_id: adjGroups[adjNo][0].approved_by || null,
          user_name: 'System Backfill',
          role: 'Unknown',
          department: 'Unknown',
          module: 'Store',
          action: 'STORE_ADJUSTMENT_APPROVED',
          record_identifier: adjNo,
          new_value: JSON.stringify({ adjustment_no: adjNo, lines_approved: adjGroups[adjNo].length }),
          created_at: adjGroups[adjNo][0].approved_at || new Date(),
        });
      }
    }

    console.log('Backfill complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

backfillStoreAuditLogs();
