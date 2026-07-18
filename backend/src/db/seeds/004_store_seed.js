exports.seed = async function (knex) {
  const { db } = require('../../config/database');

  // ─── Delete test data if re-running ────────────────────────────
  await knex('store_attendance').del();
  await knex('store_staff').del();
  await knex('store_deliveries').del();
  await knex('store_suppliers').del();
  await knex('store_approved_request_items').del();
  await knex('store_approved_requests').del();
  await knex('store_requisition_items').del();
  await knex('store_requisitions').del();
  await knex('stock_count_items').del();
  await knex('stock_counts').del();
  await knex('stock_adjustments').del();
  await knex('stock_transfer_items').del();
  await knex('stock_transfers').del();
  await knex('stock_issue_items').del();
  await knex('stock_issues').del();
  await knex('stock_receipt_items').del();
  await knex('stock_receipts').del();

  // Reset store_inventory to known state
  await knex('store_inventory').del();

  // ─── DATA ──────────────────────────────────────────────────────
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  // ============================================================
  // RECEIPT 1 — Bulk delivery from ABC Pharma
  // ============================================================
  await knex('stock_receipts').insert({
    id: 1, receipt_no: 'M19-001', supplier_name: 'ABC Pharma Ltd',
    supplier_id: null, purchase_order_ref: 'PO-2026-001',
    delivery_note_ref: 'DN-2026-001', received_by: null,
    receipt_date: lastWeek, remarks: 'Bulk order — all items OK'
  });
  await knex('stock_receipt_items').insert([
    { receipt_id: 1, drug_id: 1, batch_no: 'BX-001', expiry_date: '2027-12-31', manufacture_date: '2026-01-15', quantity: 5000, unit_cost: 2.50, subtotal: 12500.00, storage_location: 'Rack A-1' },
    { receipt_id: 1, drug_id: 2, batch_no: 'PCM-001', expiry_date: '2028-06-30', manufacture_date: '2026-02-01', quantity: 10000, unit_cost: 0.15, subtotal: 1500.00, storage_location: 'Rack A-2' },
    { receipt_id: 1, drug_id: 3, batch_no: 'GL-001', expiry_date: '2028-01-31', manufacture_date: '2026-03-01', quantity: 2000, unit_cost: 0.80, subtotal: 1600.00, storage_location: 'Rack B-1' },
    { receipt_id: 1, drug_id: 4, batch_no: 'IVF-001', expiry_date: '2027-09-30', manufacture_date: '2026-01-10', quantity: 500, unit_cost: 4.50, subtotal: 2250.00, storage_location: 'Rack C-1' },
  ]);

  // ============================================================
  // RECEIPT 2 — Top-up from PharmaCo
  // ============================================================
  await knex('stock_receipts').insert({
    id: 2, receipt_no: 'M19-002', supplier_name: 'PharmaCo Supplies',
    purchase_order_ref: 'PO-2026-002', delivery_note_ref: 'DN-2026-002',
    receipt_date: yesterday, remarks: 'Urgent top-up'
  });
  await knex('stock_receipt_items').insert([
    { receipt_id: 2, drug_id: 1, batch_no: 'BX-002', expiry_date: '2028-03-31', quantity: 2000, unit_cost: 2.55, subtotal: 5100.00, storage_location: 'Rack A-1' },
    { receipt_id: 2, drug_id: 4, batch_no: 'IVF-002', expiry_date: '2027-12-31', quantity: 300, unit_cost: 4.75, subtotal: 1425.00, storage_location: 'Rack C-1' },
  ]);

  // ============================================================
  // RECEIPT 3 — Direct from manufacturer
  // ============================================================
  await knex('stock_receipts').insert({
    id: 3, receipt_no: 'M19-003', supplier_name: 'Ethio Pharma Manufacturing',
    purchase_order_ref: 'PO-2026-003', delivery_note_ref: 'DN-2026-003',
    receipt_date: today, remarks: 'Manufacturer direct'
  });
  await knex('stock_receipt_items').insert([
    { receipt_id: 3, drug_id: 2, batch_no: 'PCM-002', expiry_date: '2028-09-30', quantity: 5000, unit_cost: 0.14, subtotal: 700.00, storage_location: 'Rack A-2' },
    { receipt_id: 3, drug_id: 3, batch_no: 'GL-002', expiry_date: '2028-06-30', quantity: 1000, unit_cost: 0.85, subtotal: 850.00, storage_location: 'Rack B-1' },
  ]);

  // ============================================================
  // ISSUES
  // ============================================================
  await knex('stock_issues').insert([
    { id: 101, issue_no: 'M22-001', department: 'Pharmacy', issued_to: 'Pharmacy Dept', requisition_ref: 'M20-001', approval_ref: 'M21-001', issued_by: null, issue_date: yesterday, remarks: 'Weekly pharmacy supply' },
    { id: 102, issue_no: 'M22-002', department: 'Laboratory', issued_to: 'Lab Manager', requisition_ref: null, approval_ref: null, issued_by: null, issue_date: today, remarks: 'Lab consumables' },
    { id: 103, issue_no: 'M22-003', department: 'Ward-A', issued_to: 'Ward Nurse', requisition_ref: 'M20-003', approval_ref: null, issued_by: null, issue_date: today, remarks: 'Routine ward supply' },
  ]);
  await knex('stock_issue_items').insert([
    { issue_id: 101, drug_id: 1, batch_no: 'BX-001', quantity: 300, unit_cost: 2.50 },
    { issue_id: 101, drug_id: 2, batch_no: 'PCM-001', quantity: 500, unit_cost: 0.15 },
    { issue_id: 102, drug_id: 3, batch_no: 'GL-001', quantity: 100, unit_cost: 0.80 },
    { issue_id: 102, drug_id: 4, batch_no: 'IVF-001', quantity: 50, unit_cost: 4.50 },
    { issue_id: 103, drug_id: 2, batch_no: 'PCM-002', quantity: 200, unit_cost: 0.14 },
    { issue_id: 103, drug_id: 4, batch_no: 'IVF-002', quantity: 30, unit_cost: 4.75 },
  ]);

  // ============================================================
  // TRANSFERS
  // ============================================================
  await knex('stock_transfers').insert({
    id: 301, transfer_no: 'M23-001', from_location: 'Main Store', to_location: 'Pharmacy Store',
    transfer_type: 'Re-stock', authorized_by: 'General Store Keeper', created_by: null,
    transfer_date: yesterday, status: 'Received', remarks: 'Pharmacist requested urgent restock'
  });
  await knex('stock_transfer_items').insert([
    { transfer_id: 301, drug_id: 1, batch_no: 'BX-001', expiry_date: '2027-12-31', quantity: 200 },
    { transfer_id: 301, drug_id: 2, batch_no: 'PCM-001', expiry_date: '2028-06-30', quantity: 300 },
  ]);

  // ============================================================
  // ADJUSTMENTS
  // ============================================================
  await knex('stock_adjustments').insert({
    id: 201, adjustment_no: 'ADJ-001', drug_id: 2,
    batch_no: 'PCM-001', adjustment_type: 'Addition', quantity_before: 9200, quantity_after: 9200, adjustment_qty: 20,
    reason: 'Found unrecorded stock during shelf audit',     approval_code: 'CEO-APPROVED', adjusted_by: null, approved_by: null, status: 'APPROVED',
    adjustment_date: yesterday
  });
  await knex('stock_adjustments').insert({
    id: 202, adjustment_no: 'ADJ-002', drug_id: 4,
    batch_no: 'IVF-001', adjustment_type: 'Deduction', quantity_before: 450, quantity_after: 445, adjustment_qty: 5,
    reason: 'Damaged during handling — disposed', approval_code: 'CEO-APPROVED', adjusted_by: null, approved_by: null, status: 'APPROVED',
    adjustment_date: today
  });

  // ============================================================
  // COUNTS
  // ============================================================
  await knex('stock_counts').insert({
    id: 401, count_no: 'CC-001', count_type: 'Full Count', count_date: lastWeek, counted_by: null, verified_by: null,
    status: 'Verified', remarks: 'Quarterly full inventory count'
  });
  await knex('stock_count_items').insert([
    { count_id: 401, drug_id: 1, batch_no: 'BX-001', system_quantity: 4500, physical_quantity: 4500, variance: 0, reason_code: null },
    { count_id: 401, drug_id: 2, batch_no: 'PCM-001', system_quantity: 9500, physical_quantity: 9520, variance: 20, reason_code: 'OVER' },
    { count_id: 401, drug_id: 3, batch_no: 'GL-001', system_quantity: 1900, physical_quantity: 1900, variance: 0, reason_code: null },
    { count_id: 401, drug_id: 4, batch_no: 'IVF-001', system_quantity: 450, physical_quantity: 450, variance: 0, reason_code: null },
  ]);

  await knex('stock_counts').insert({
    id: 402, count_no: 'CC-002', count_type: 'Cycle Count', count_date: today, counted_by: null, verified_by: null,
    status: 'In Progress', remarks: 'Weekly cycle count — antibiotics only'
  });
  await knex('stock_count_items').insert([
    { count_id: 402, drug_id: 1, batch_no: 'BX-001', system_quantity: 6200, physical_quantity: 6200, variance: 0, reason_code: null },
  ]);

  // ============================================================
  // REQUISITIONS
  // ============================================================
  await knex('store_requisitions').insert([
    { id: 501, requisition_no: 'M20-001', department: 'Pharmacy', requested_by: 'Pharmacy Head', priority: 'High', status: 'Approved', requisition_date: lastWeek, remarks: 'Monthly pharmacy stock request' },
    { id: 502, requisition_no: 'M20-002', department: 'Laboratory', requested_by: 'Lab Manager', priority: 'Normal', status: 'Pending', requisition_date: yesterday, remarks: 'Additional gloves for lab' },
    { id: 503, requisition_no: 'M20-003', department: 'Ward-A', requested_by: 'Head Nurse', priority: 'Urgent', status: 'Issued', requisition_date: today, remarks: 'Urgent ward supply' },
    { id: 504, requisition_no: 'M20-004', department: 'Ward-B', requested_by: 'Nurse Supervisor', priority: 'Normal', status: 'Pending', requisition_date: today, remarks: 'Routine restock' },
  ]);
  await knex('store_requisition_items').insert([
    // M20-001 — Pharmacy — Approved
    { requisition_id: 501, item_name: 'Amoxicillin', drug_id: 1, quantity: 500, quantity_approved: 500, quantity_issued: 300 },
    { requisition_id: 501, item_name: 'Paracetamol', drug_id: 2, quantity: 1000, quantity_approved: 1000, quantity_issued: 500 },
    // M20-002 — Lab — Pending
    { requisition_id: 502, item_name: 'Surgical Gloves', drug_id: 3, quantity: 200, quantity_approved: null, quantity_issued: null },
    // M20-003 — Ward-A — Issued
    { requisition_id: 503, item_name: 'Paracetamol', drug_id: 2, quantity: 300, quantity_approved: 300, quantity_issued: 200 },
    { requisition_id: 503, item_name: 'IV Fluid', drug_id: 4, quantity: 50, quantity_approved: 50, quantity_issued: 30 },
    // M20-004 — Ward-B — Pending
    { requisition_id: 504, item_name: 'Amoxicillin', drug_id: 1, quantity: 200, quantity_approved: null, quantity_issued: null },
    { requisition_id: 504, item_name: 'IV Fluid', drug_id: 4, quantity: 100, quantity_approved: null, quantity_issued: null },
  ]);

  // ============================================================
  // APPROVED REQUESTS
  // ============================================================
  await knex('store_approved_requests').insert({
    id: 601, approval_no: 'M21-001', requisition_id: 501,
    department: 'Pharmacy', approved_by: 'CEO', approval_date: lastWeek,
    stamp_id: 'STAMP-001', status: 'Active',
    remarks: 'Approved per monthly budget'
  });
  await knex('store_approved_request_items').insert([
    { approval_id: 601, item_name: 'Amoxicillin', drug_id: 1, quantity_approved: 500 },
    { approval_id: 601, item_name: 'Paracetamol', drug_id: 2, quantity_approved: 1000 },
  ]);

  // ============================================================
  // STORE INVENTORY — computed from receipts - issues
  // Receipts: 7000 Amox, 15000 PCM, 3000 Gloves, 800 IV Fluid
  // Issues:   300 Amox, 700 PCM, 100 Gloves, 80 IV Fluid
  // Transfer: 200 Amox out, 300 PCM out
  // Adjustment: +20 PCM, -5 IV Fluid
  // Net: 6500 Amox, 14220 PCM, 2900 Gloves, 715 IV Fluid
  // ============================================================
  await knex('store_inventory').insert([
    {
      drug_id: 1, quantity: 6500, min_level: 500, max_level: 8000,
      batch_no: 'BX-002', expiry_date: '2028-03-31', unit_cost: 2.55,
      storage_location: 'Rack A-1',
      last_received_at: db.raw(`'${yesterday} 10:00:00'`),
      last_issued_at: db.raw(`'${today} 09:00:00'`),
    },
    {
      drug_id: 2, quantity: 14220, min_level: 2000, max_level: 15000,
      batch_no: 'PCM-002', expiry_date: '2028-09-30', unit_cost: 0.14,
      storage_location: 'Rack A-2',
      last_received_at: db.raw(`'${today} 08:00:00'`),
      last_issued_at: db.raw(`'${today} 11:00:00'`),
    },
    {
      drug_id: 3, quantity: 2900, min_level: 300, max_level: 4000,
      batch_no: 'GL-002', expiry_date: '2028-06-30', unit_cost: 0.85,
      storage_location: 'Rack B-1',
      last_received_at: db.raw(`'${today} 08:30:00'`),
      last_issued_at: db.raw(`'${today} 10:00:00'`),
    },
    {
      drug_id: 4, quantity: 715, min_level: 200, max_level: 1000,
      batch_no: 'IVF-002', expiry_date: '2027-12-31', unit_cost: 4.75,
      storage_location: 'Rack C-1',
      last_received_at: db.raw(`'${yesterday} 14:00:00'`),
      last_issued_at: db.raw(`'${today} 11:30:00'`),
    },
  ]);

  // ============================================================
  // SUPPLIERS
  // ============================================================
  await knex('store_suppliers').insert([
    { supplier_no: 'SUP-001', name: 'ABC Pharma Distributors', contact_person: 'John Doe', phone: '+1234567890', email: 'john@abcpharma.com', address: '123 Health St, City', tax_id: 'TAX12345', payment_terms: 'Net 30', status: 'Active', delivery_count: 12, balance: 5400.00 },
    { supplier_no: 'SUP-002', name: 'Global Med Supplies', contact_person: 'Jane Smith', phone: '+0987654321', email: 'jane@globalmed.com', address: '456 Care Ave, City', tax_id: 'TAX67890', payment_terms: 'Net 15', status: 'Active', delivery_count: 8, balance: 2100.00 },
    { supplier_no: 'SUP-003', name: 'Office Essentials Ltd', contact_person: 'Mike Johnson', phone: '+1122334455', email: 'mike@officeessentials.com', address: '789 Paper Rd, City', tax_id: 'TAX11223', payment_terms: 'CIA', status: 'Inactive', delivery_count: 3, balance: 0.00 },
  ]);

  // ============================================================
  // DELIVERIES
  // ============================================================
  await knex('store_deliveries').insert([
    { delivery_no: 'DEL-2026-001', supplier_name: 'ABC Pharma Distributors', items_description: 'Surgical Gloves, Masks', quantity_summary: '5,000 units', delivery_date: '2026-07-01', po_reference: 'PO-9901', status: 'Pending' },
    { delivery_no: 'DEL-2026-002', supplier_name: 'Global Med Supplies', items_description: 'Paracetamol 500mg', quantity_summary: '10,000 tabs', delivery_date: '2026-07-01', po_reference: 'PO-9902', status: 'Pending' },
    { delivery_no: 'DEL-2026-003', supplier_name: 'Office Essentials Ltd', items_description: 'A4 Paper, Pens', quantity_summary: '50 boxes', delivery_date: '2026-06-29', po_reference: 'PO-9850', status: 'Received' },
    { delivery_no: 'DEL-2026-004', supplier_name: 'ABC Pharma Distributors', items_description: 'Syringes 5ml', quantity_summary: '2,000 units', delivery_date: '2026-06-28', po_reference: 'PO-9840', status: 'Rejected' },
  ]);

  // ============================================================
  // STAFF
  // ============================================================
  await knex('store_staff').insert([
    { staff_no: 'STF-001', full_name: 'Abebe Kebede', role: 'General Store Keeper', phone: '+251911234567', hire_date: '2020-01-15', performance: 'Excellent', assigned_tasks: 2, status: 'Active' },
    { staff_no: 'STF-002', full_name: 'Selamawit Tadesse', role: 'Store Worker', phone: '+251922345678', hire_date: '2023-05-10', performance: 'Good', assigned_tasks: 5, status: 'Active' },
    { staff_no: 'STF-003', full_name: 'Dawit Mekonnen', role: 'Store Worker', phone: '+251933456789', hire_date: '2024-02-01', performance: 'Needs Improvement', assigned_tasks: 0, status: 'Inactive' },
  ]);

  // ============================================================
  // ATTENDANCE — today for store staff
  // ============================================================
  const staffRows = await knex('store_staff').select('id', 'staff_no');
  const sMap = {};
  staffRows.forEach(s => { sMap[s.staff_no] = s.id; });
  await knex('store_attendance').insert([
    { staff_id: sMap['STF-001'], attendance_date: today, status: 'Present' },
    { staff_id: sMap['STF-002'], attendance_date: today, status: 'Late' },
    { staff_id: sMap['STF-003'], attendance_date: today, status: 'Absent', reason: 'Sick leave — no prior notice' },
  ]);
};
