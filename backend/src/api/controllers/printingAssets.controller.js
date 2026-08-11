const { db } = require('../../config/database');
const centralAudit = require('../../services/centralAudit.service');

// ─── Helpers ───────────────────────────────────────────────────────────────
const ok  = (res, data, msg = 'success') => res.json({ success: true, message: msg, data });
const err = (res, msg, status = 500)     => res.status(status).json({ success: false, message: msg });

/* Non-blocking audit log helper — mirrors hr.controller.js */
const storeLog = (req, action, recordIdentifier, previousValue, newValue) => {
  const u = req.user || {};
  centralAudit.createLog({
    userId:           u.id || null,
    userName:         u.fullName || u.full_name || u.username || 'System',
    role:             Array.isArray(u.roles) ? u.roles.join(', ') : (u.role_names || u.role || 'Unknown'),
    department:       u.departmentName || u.department_name || 'Printing',
    module:           'Printing',
    action,
    recordIdentifier: String(recordIdentifier || ''),
    previousValue,
    newValue,
    ipAddress:        req.ip,
  }).catch(() => {});
  if (req.res) req.res.locals.__centralAudited = true;
};

function genMachineId() {
  return db('printing_assets_machines').max('id as maxId').first().then(r => {
    const next = ((r && r.maxId) || 0) + 1;
    return `PSM-${String(next).padStart(3, '0')}`;
  });
}
function genMaterialId() {
  return db('general_store_materials').max('id as maxId').first().then(r => {
    const next = ((r && r.maxId) || 0) + 1;
    return `PSMAT-${String(next).padStart(3, '0')}`;
  });
}

// ─── STORE MACHINES ─────────────────────────────────────────────────────────
exports.listStoreMachines = async (req, res) => {
  try {
    const { status, department } = req.query;
    let query = db('printing_assets_machines').orderBy('id', 'desc');
    if (status) query = query.where('status', status);
    if (department) query = query.where('department', department);
    const rows = await query;
    ok(res, rows);
  } catch (e) { err(res, e.message); }
};

exports.registerMachine = async (req, res) => {
  try {
    const { machine_name, model_serial, condition_notes, registered_by, date_registered, department } = req.body;
    if (!machine_name) return err(res, 'machine_name is required', 400);
    const machine_id = await genMachineId();
    await db('printing_assets_machines').insert({
      machine_id, machine_name, model_serial, condition_notes,
      department: department || 'Printing',
      registered_by: registered_by || (req.user && req.user.fullName) || 'Store Keeper',
      date_registered: date_registered || new Date().toISOString().split('T')[0],
      status: 'In Store',
    });
    await db('general_movement_log').insert({
      item_type: 'Machine', item_id: machine_id,
      from_location: 'External', to_location: 'Printing Store',
      department: department || 'Printing',
      moved_by: registered_by || (req.user && req.user.fullName) || 'Store Keeper',
      action_type: 'Register', notes: `Machine registered: ${machine_name}`,
    });
    storeLog(req, 'PRINTING_MACHINE_REGISTERED', machine_id, null, {
      machine_name, model_serial, department: department || 'Printing',
    });
    ok(res, { machine_id }, 'Machine registered successfully');
  } catch (e) { err(res, e.message); }
};

exports.updateMachineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, condition_notes } = req.body;
    const machine = await db('printing_assets_machines').where({ id }).first();
    if (!machine) return err(res, 'Machine not found', 404);
    await db('printing_assets_machines').where({ id }).update({ status, condition_notes, updated_at: db.fn.now() });
    storeLog(req, 'PRINTING_MACHINE_STATUS_UPDATED', machine.machine_id || String(id),
      { status: machine.status, condition_notes: machine.condition_notes },
      { status, condition_notes });
    ok(res, null, 'Machine status updated');
  } catch (e) { err(res, e.message); }
};

exports.updateMachineValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { internal_value } = req.body;
    await db('printing_assets_machines').where({ id }).update({ internal_value, updated_at: db.fn.now() });
    const machine = await db('printing_assets_machines').where({ id }).first();
    await db('general_movement_log').insert({
      item_type: 'Machine', item_id: machine ? machine.machine_id : String(id),
      from_location: 'Finance', to_location: 'Finance',
      department: machine ? machine.department : 'Printing',
      action_type: 'Value Update',
      moved_by: (req.user && req.user.fullName) || 'Finance Officer',
      notes: `Internal value updated to ETB ${internal_value}`,
    });
    storeLog(req, 'PRINTING_MACHINE_VALUE_UPDATED', machine ? machine.machine_id : String(id),
      machine ? { internal_value: machine.internal_value } : null,
      { internal_value });
    ok(res, null, 'Internal value updated');
  } catch (e) { err(res, e.message); }
};

// ─── STORE MATERIALS ─────────────────────────────────────────────────────────
exports.listStoreMaterials = async (req, res) => {
  try {
    const { department } = req.query;
    let query = db('general_store_materials').orderBy('id', 'desc');
    if (department) query = query.where('department', department);
    const rows = await query;
    
    const pendingRequests = await db('store_update_approvals').where('status', 'PENDING').select('material_id');
    const pendingIds = pendingRequests.map(r => String(r.material_id));

    const data = rows.map(r => ({
      ...r,
      pending_approval: pendingIds.includes(String(r.id))
    }));

    ok(res, data);
  } catch (e) { err(res, e.message); }
};

exports.registerMaterial = async (req, res) => {
  try {
    const { material_name, category, unit, quantity_in_store, registered_by, date_registered, department, reorder_level, unit_value } = req.body;
    if (!material_name) return err(res, 'material_name is required', 400);
    const material_id = await genMaterialId();
    const qty = parseFloat(quantity_in_store) || 0;
    const price = parseFloat(unit_value) || 0;
    const total = qty * price;
    const reorder = parseInt(reorder_level) || 10;
    await db('general_store_materials').insert({
      material_id, material_name, category: category || 'Other', unit: unit || 'unit',
      quantity_in_store: qty, unit_value: price, total_value: total, reorder_level: reorder,
      department: department || 'Printing',
      registered_by: registered_by || (req.user && req.user.fullName) || 'Store Keeper',
      date_registered: date_registered || new Date().toISOString().split('T')[0],
    });
    await db('general_movement_log').insert({
      item_type: 'Material', item_id: material_id,
      from_location: 'External', to_location: 'Printing Store',
      quantity: qty,
      department: department || 'Printing',
      moved_by: registered_by || (req.user && req.user.fullName) || 'Store Keeper',
      action_type: 'Register', notes: `Material registered: ${material_name}, qty: ${qty}`,
    });
    storeLog(req, 'PRINTING_MATERIAL_REGISTERED', material_id, null, {
      material_name, category: category || 'Other', unit: unit || 'unit',
      quantity_in_store: qty, department: department || 'Printing',
    });
    ok(res, { material_id }, 'Material registered successfully');
  } catch (e) { err(res, e.message); }
};

exports.updateMaterialQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_in_store, add_quantity } = req.body;
    const mat = await db('general_store_materials').where({ id }).first();
    if (!mat) return err(res, 'Material not found', 404);
    
    const pending = await db('store_update_approvals').where({ material_id: id, status: 'PENDING' }).first();
    if (pending) return err(res, 'An update request is already pending CEO approval for this item.', 400);

    const previousValue = { ...mat };
    let qty = parseFloat(mat.quantity_in_store || 0);
    if (add_quantity !== undefined) qty += parseFloat(add_quantity);
    else if (quantity_in_store !== undefined) qty = parseFloat(quantity_in_store);
    const total_value = qty * parseFloat(mat.unit_value || 0);
    
    const afterValue = { ...mat, quantity_in_store: qty, total_value };

    // Strip internal DB fields — only keep human-readable business fields
    const cleanSnap = (s) => ({
      material_name:    s.material_name,
      category:         s.category,
      department:       s.department,
      unit:             s.unit,
      quantity_in_store: s.quantity_in_store,
      unit_value:       s.unit_value,
      total_value:      s.total_value,
      reorder_level:    s.reorder_level,
    });

    await db('store_update_approvals').insert({
      material_id: id,
      requested_by: req.user ? req.user.id : null,
      update_type: 'STORE_QUANTITY_UPDATE',
      before_state: JSON.stringify(cleanSnap(previousValue)),
      after_state: JSON.stringify(cleanSnap(afterValue))
    });

    storeLog(req, 'PRINTING_MATERIAL_QTY_UPDATE_REQUESTED', mat.material_id,
      { quantity_in_store: previousValue.quantity_in_store },
      { quantity_in_store: qty });
    ok(res, null, 'Quantity update request sent to CEO for approval');
  } catch (e) { err(res, e.message); }
};

exports.updateMaterialValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit_value } = req.body;
    const mat = await db('general_store_materials').where({ id }).first();
    if (!mat) return err(res, 'Material not found', 404);

    const pending = await db('store_update_approvals').where({ material_id: id, status: 'PENDING' }).first();
    if (pending) return err(res, 'An update request is already pending CEO approval for this item.', 400);

    const previousValue = { ...mat };
    const uv = parseFloat(unit_value) || 0;
    const total_value = parseFloat(mat.quantity_in_store || 0) * uv;
    
    const afterValue = { ...mat, unit_value: uv, total_value };

    const cleanSnap = (s) => ({
      material_name:    s.material_name,
      category:         s.category,
      department:       s.department,
      unit:             s.unit,
      quantity_in_store: s.quantity_in_store,
      unit_value:       s.unit_value,
      total_value:      s.total_value,
      reorder_level:    s.reorder_level,
    });

    await db('store_update_approvals').insert({
      material_id: id,
      requested_by: req.user ? req.user.id : null,
      update_type: 'STORE_VALUE_UPDATE',
      before_state: JSON.stringify(cleanSnap(previousValue)),
      after_state: JSON.stringify(cleanSnap(afterValue))
    });

    storeLog(req, 'PRINTING_MATERIAL_VALUE_UPDATE_REQUESTED', mat.material_id,
      { unit_value: previousValue.unit_value },
      { unit_value: uv });
    ok(res, null, 'Unit value update request sent to CEO for approval');
  } catch (e) { err(res, e.message); }
};

exports.updateMaterialFull = async (req, res) => {
  try {
    const { id } = req.params;
    const { material_name, category, department, unit, quantity_in_store, unit_value, reorder_level } = req.body;
    const mat = await db('general_store_materials').where({ id }).first();
    if (!mat) return err(res, 'Material not found', 404);

    const pending = await db('store_update_approvals').where({ material_id: id, status: 'PENDING' }).first();
    if (pending) return err(res, 'An update request is already pending CEO approval for this item.', 400);

    const previousValue = { ...mat };
    const qty = parseFloat(quantity_in_store) || 0;
    const uv = parseFloat(unit_value) || 0;
    const total_value = qty * uv;
    const reorder = parseInt(reorder_level) || 10;
    
    const afterValue = {
      ...mat, material_name, category, department, unit,
      quantity_in_store: qty, unit_value: uv, total_value, reorder_level: reorder
    };

    const cleanSnap = (s) => ({
      material_name:    s.material_name,
      category:         s.category,
      department:       s.department,
      unit:             s.unit,
      quantity_in_store: s.quantity_in_store,
      unit_value:       s.unit_value,
      total_value:      s.total_value,
      reorder_level:    s.reorder_level,
    });

    await db('store_update_approvals').insert({
      material_id: id,
      requested_by: req.user ? req.user.id : null,
      update_type: 'STORE_MATERIAL_UPDATE',
      before_state: JSON.stringify(cleanSnap(previousValue)),
      after_state: JSON.stringify(cleanSnap(afterValue))
    });

    storeLog(req, 'PRINTING_MATERIAL_UPDATE_REQUESTED', mat.material_id,
      { material_name: previousValue.material_name, quantity_in_store: previousValue.quantity_in_store },
      { material_name, quantity_in_store: qty, unit_value: uv });
    ok(res, null, 'Update request sent to CEO for approval');
  } catch (e) { err(res, e.message); }
};

// ─── MOVEMENTS (Store → Production) ─────────────────────────────────────────
exports.initiateMachineMoveRequest = async (req, res) => {
  try {
    const { machine_id, job_reference, notes } = req.body;
    if (!machine_id) return err(res, 'machine_id is required', 400);
    const machine = await db('printing_assets_machines').where({ machine_id }).first();
    if (!machine) return err(res, 'Machine not found in store', 404);
    if (machine.status !== 'In Store') return err(res, `Machine is not available (status: ${machine.status})`, 400);
    await db('general_movement_log').insert({
      item_type: 'Machine', item_id: machine_id,
      from_location: 'Printing Store', to_location: 'Printing Production',
      department: machine.department,
      moved_by: (req.user && req.user.fullName) || 'Store Keeper',
      action_type: 'Move to Production',
      notes: (notes || `Move request for job: ${job_reference || 'N/A'}`) + ' | PENDING_APPROVAL',
    });
    storeLog(req, 'PRINTING_MACHINE_MOVE_REQUESTED', machine_id,
      { status: machine.status }, { status: 'Pending Approval', job_reference: job_reference || null });
    ok(res, null, 'Movement request submitted. Awaiting supervisor approval.');
  } catch (e) { err(res, e.message); }
};

exports.initiateMaterialMoveRequest = async (req, res) => {
  try {
    const { material_id, quantity, job_reference, notes } = req.body;
    if (!material_id || !quantity) return err(res, 'material_id and quantity are required', 400);
    const material = await db('general_store_materials').where({ material_id }).first();
    if (!material) return err(res, 'Material not found in store', 404);
    const qty = parseFloat(quantity);
    if (parseFloat(material.quantity_in_store) < qty) return err(res, `Insufficient stock (available: ${material.quantity_in_store})`, 400);
    await db('general_movement_log').insert({
      item_type: 'Material', item_id: material_id,
      from_location: 'Printing Store', to_location: 'Printing Production',
      quantity: qty,
      department: material.department,
      moved_by: (req.user && req.user.fullName) || 'Store Keeper',
      action_type: 'Move to Production',
      notes: (notes || `Move request for job: ${job_reference || 'N/A'}`) + ' | PENDING_APPROVAL',
    });
    storeLog(req, 'PRINTING_MATERIAL_MOVE_REQUESTED', material_id,
      { quantity_in_store: material.quantity_in_store },
      { quantity_requested: qty, job_reference: job_reference || null });
    ok(res, null, 'Material movement request submitted. Awaiting supervisor approval.');
  } catch (e) { err(res, e.message); }
};

exports.directIssueMaterial = async (req, res) => {
  try {
    const { material_id, quantity, department, requested_by, job_reference } = req.body;
    if (!material_id || !quantity || !department || !requested_by) {
      return err(res, 'material_id, quantity, department, and requested_by are required', 400);
    }
    const mat = await db('general_store_materials').where({ material_id }).first();
    if (!mat) return err(res, 'Material not found in store', 404);
    
    const qty = parseFloat(quantity);
    if (parseFloat(mat.quantity_in_store) < qty) {
      return err(res, `Insufficient stock (available: ${mat.quantity_in_store})`, 400);
    }
    
    // Deduct stock
    const newQty = Math.max(0, parseFloat(mat.quantity_in_store) - qty);
    const newTotalValue = newQty * parseFloat(mat.unit_value || 0);
    await db('general_store_materials').where({ material_id }).update({
      quantity_in_store: newQty,
      total_value: newTotalValue,
      updated_at: db.fn.now()
    });
    
    // Log Issue
    const issuedBy = (req.user && req.user.fullName) || 'General Store Keeper';
    await db('general_movement_log').insert({
      item_type: 'Material',
      item_id: material_id,
      from_location: 'General Store',
      to_location: department,
      quantity: qty,
      department: department,
      moved_by: issuedBy,
      approved_by: issuedBy,
      action_type: 'Issue to Department',
      notes: `Requested by: ${requested_by} | Ref: ${job_reference || 'N/A'}`
    });

    storeLog(req, 'PRINTING_MATERIAL_ISSUED', material_id,
      { quantity_in_store: mat.quantity_in_store },
      { quantity_issued: qty, department, requested_by });
    ok(res, { remaining_balance: newQty }, 'Material successfully issued to department.');
  } catch (e) { err(res, e.message); }
};

// ─── SUPERVISOR: Pending Moves ───────────────────────────────────────────────
exports.listPendingMoves = async (req, res) => {
  try {
    const rows = await db('general_movement_log')
      .where('action_type', 'Move to Production')
      .where('notes', 'like', '%PENDING_APPROVAL%')
      .whereNull('approved_by')
      .orderBy('date_time', 'desc');
    ok(res, rows);
  } catch (e) { err(res, e.message); }
};

exports.approveMove = async (req, res) => {
  try {
    const { log_id } = req.params;
    const approver = (req.user && req.user.fullName) || req.body.approved_by || 'Supervisor';
    const logEntry = await db('general_movement_log').where({ id: log_id }).first();
    if (!logEntry) return err(res, 'Log entry not found', 404);
    if (logEntry.approved_by) return err(res, 'Already approved', 400);

    await db('general_movement_log').where({ id: log_id }).update({
      approved_by: approver,
      notes: (logEntry.notes || '').replace(' | PENDING_APPROVAL', '') + ' | APPROVED',
      updated_at: db.fn.now(),
    });

    if (logEntry.item_type === 'Machine') {
      await db('printing_assets_machines').where({ machine_id: logEntry.item_id }).update({ status: 'Moved to Production', updated_at: db.fn.now() });
      const existing = await db('printing_production_machines').where({ machine_id: logEntry.item_id }).first();
      if (existing) {
        await db('printing_production_machines').where({ machine_id: logEntry.item_id }).update({ status: 'Active/Functional', moved_date: db.fn.now(), approved_by: approver, updated_at: db.fn.now() });
      } else {
        await db('printing_production_machines').insert({ machine_id: logEntry.item_id, status: 'Active/Functional', moved_date: db.fn.now(), approved_by: approver });
      }
    } else {
      const qty = parseFloat(logEntry.quantity) || 0;
      const mat = await db('general_store_materials').where({ material_id: logEntry.item_id }).first();
      if (mat) {
        const newQty = Math.max(0, parseFloat(mat.quantity_in_store) - qty);
        const total_value = newQty * parseFloat(mat.unit_value || 0);
        await db('general_store_materials').where({ material_id: logEntry.item_id }).update({ quantity_in_store: newQty, total_value, updated_at: db.fn.now() });
      }
      const existing = await db('printing_production_materials').where({ material_id: logEntry.item_id }).orderBy('id', 'desc').first();
      if (existing && parseFloat(existing.quantity_remaining) > 0) {
        await db('printing_production_materials').where({ id: existing.id }).update({
          quantity_moved: db.raw('quantity_moved + ?', [qty]),
          quantity_remaining: db.raw('quantity_remaining + ?', [qty]),
          approved_by: approver,
          updated_at: db.fn.now(),
        });
      } else {
        await db('printing_production_materials').insert({ material_id: logEntry.item_id, quantity_moved: qty, quantity_consumed: 0, quantity_remaining: qty, moved_date: db.fn.now(), approved_by: approver });
      }
    }
    storeLog(req, logEntry.item_type === 'Machine' ? 'PRINTING_MACHINE_MOVE_APPROVED' : 'PRINTING_MATERIAL_MOVE_APPROVED',
      logEntry.id, { action_type: logEntry.action_type, item_id: logEntry.item_id },
      { approved_by: approver, notes: (logEntry.notes || '').replace(' | PENDING_APPROVAL', '') + ' | APPROVED' });
    ok(res, null, 'Move approved successfully');
  } catch (e) { err(res, e.message); }
};

// ─── PRODUCTION MACHINES ─────────────────────────────────────────────────────
exports.listProductionMachines = async (req, res) => {
  try {
    const rows = await db('printing_production_machines as pm')
      .leftJoin('printing_assets_machines as sm', 'pm.machine_id', 'sm.machine_id')
      .select('pm.*', 'sm.machine_name', 'sm.model_serial', 'sm.condition_notes', 'sm.internal_value')
      .orderBy('pm.id', 'desc');
    ok(res, rows);
  } catch (e) { err(res, e.message); }
};

exports.updateProductionMachineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const prod = await db('printing_production_machines').where({ id }).first();
    if (!prod) return err(res, 'Production machine not found', 404);
    await db('printing_production_machines').where({ id }).update({ status, updated_at: db.fn.now() });
    if (status === 'Returned to Store') {
      if (prod) {
        const machine = await db('printing_assets_machines').where({ machine_id: prod.machine_id }).first();
        await db('printing_assets_machines').where({ machine_id: prod.machine_id }).update({ status: 'In Store', updated_at: db.fn.now() });
        await db('general_movement_log').insert({
          item_type: 'Machine', item_id: prod.machine_id,
          from_location: 'Printing Production', to_location: 'Printing Store',
          department: machine ? machine.department : 'Printing',
          moved_by: (req.user && req.user.fullName) || 'Supervisor',
          approved_by: (req.user && req.user.fullName) || 'Supervisor',
          action_type: 'Return to Store', notes: 'Machine returned to store after job completion',
        });
      }
    }
    storeLog(req, 'PRINTING_PROD_MACHINE_STATUS_UPDATED', prod.machine_id,
      { status: prod.status }, { status });
    ok(res, null, 'Production machine status updated');
  } catch (e) { err(res, e.message); }
};

// ─── PRODUCTION MATERIALS ─────────────────────────────────────────────────────
exports.listProductionMaterials = async (req, res) => {
  try {
    // Aggregate multiple receipt rows per material into a single consolidated record
    const rows = await db('printing_production_materials as pm')
      .leftJoin('general_store_materials as sm', 'pm.material_id', 'sm.material_id')
      .select(
        'pm.material_id',
        'sm.material_name',
        'sm.category',
        'sm.unit',
        'sm.unit_value',
        'sm.reorder_level',
        db.raw('MIN(pm.id) as id'),
        db.raw('SUM(CAST(pm.quantity_moved AS DECIMAL(18,4))) as quantity_moved'),
        db.raw('SUM(CAST(pm.quantity_consumed AS DECIMAL(18,4))) as quantity_consumed'),
        db.raw('SUM(CAST(pm.quantity_remaining AS DECIMAL(18,4))) as quantity_remaining'),
        db.raw('MAX(pm.approved_by) as approved_by'),
        db.raw('MIN(pm.moved_date) as moved_date'),
        db.raw('MAX(pm.updated_at) as updated_at')
      )
      .groupBy('pm.material_id', 'sm.material_name', 'sm.category', 'sm.unit', 'sm.unit_value', 'sm.reorder_level')
      .orderBy('quantity_remaining', 'asc');
    ok(res, rows);
  } catch (e) { err(res, e.message); }
};


exports.consumeMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_consumed } = req.body;
    const qty = parseFloat(quantity_consumed) || 0;
    if (qty <= 0) return err(res, 'Quantity must be greater than 0', 400);

    // Find by id first to get the material_id, then aggregate across all rows
    const firstRow = await db('printing_production_materials').where({ id }).first();
    if (!firstRow) return err(res, 'Production material not found', 404);
    const material_id = firstRow.material_id;

    // Get total remaining across all rows for this material
    const agg = await db('printing_production_materials')
      .where({ material_id })
      .select(
        db.raw('SUM(CAST(quantity_remaining AS DECIMAL(18,4))) as total_remaining'),
        db.raw('SUM(CAST(quantity_consumed  AS DECIMAL(18,4))) as total_consumed')
      )
      .first();
    const totalRemaining = parseFloat(agg.total_remaining || 0);
    if (qty > totalRemaining) return err(res, `Cannot consume more than remaining (${totalRemaining})`, 400);

    // Deduct from rows that still have remaining, oldest first
    let toDeduct = qty;
    const rows = await db('printing_production_materials')
      .where({ material_id })
      .where(db.raw('CAST(quantity_remaining AS DECIMAL(18,4)) > 0'))
      .orderBy('id', 'asc');

    for (const row of rows) {
      if (toDeduct <= 0) break;
      const rowRemaining = parseFloat(row.quantity_remaining);
      const deductNow = Math.min(rowRemaining, toDeduct);
      await db('printing_production_materials').where({ id: row.id }).update({
        quantity_consumed: db.raw('CAST(quantity_consumed AS DECIMAL(18,4)) + ?', [deductNow]),
        quantity_remaining: db.raw('CAST(quantity_remaining AS DECIMAL(18,4)) - ?', [deductNow]),
        updated_at: db.fn.now()
      });
      toDeduct -= deductNow;
    }

    const mat = await db('general_store_materials').where({ material_id }).first();
    const userName = (req.user && (req.user.fullName || req.user.full_name)) || 'Supervisor';
    await db('general_movement_log').insert({
      item_type: 'Material', item_id: material_id,
      from_location: 'Printing Production', to_location: 'Consumed',
      quantity: qty,
      department: mat ? mat.department : 'Printing',
      moved_by: userName,
      approved_by: userName,
      action_type: 'Consume',
      notes: `Consumed ${qty} ${mat ? mat.unit : 'units'} of ${mat ? mat.material_name : material_id}`,
    });
    storeLog(req, 'PRINTING_MATERIAL_CONSUMED', material_id,
      { quantity_remaining: totalRemaining },
      { quantity_consumed: qty, quantity_remaining: totalRemaining - qty });
    ok(res, { quantity_remaining: totalRemaining - qty }, 'Material consumption logged');
  } catch (e) { err(res, e.message); }
};


// ─── MOVEMENT LOG ─────────────────────────────────────────────────────────────
exports.getMovementLog = async (req, res) => {
  try {
    const { item_type, item_id, department } = req.query;
    let q = db('general_movement_log').orderBy('date_time', 'desc');
    if (item_type) q = q.where({ item_type });
    if (item_id)   q = q.where({ item_id });
    if (department) q = q.where({ department });
    const rows = await q.limit(200);
    ok(res, rows);
  } catch (e) { err(res, e.message); }
};

// ─── STATS for dashboards ─────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [totalMachines]  = await db('printing_assets_machines').count('id as c');
    const [inStore]        = await db('printing_assets_machines').where('status', 'In Store').count('id as c');
    const [inProduction]   = await db('printing_assets_machines').where('status', 'Moved to Production').count('id as c');
    const [underMaint]     = await db('printing_assets_machines').where('status', 'Under Maintenance').count('id as c');
    const [totalMaterials] = await db('general_store_materials').count('id as c');
    const matValue         = await db('general_store_materials').sum('total_value as v').first();
    const machineValue     = await db('printing_assets_machines').sum('internal_value as v').first();
    const [pendingMoves]   = await db('general_movement_log')
      .where('action_type', 'Move to Production')
      .where('notes', 'like', '%PENDING_APPROVAL%')
      .whereNull('approved_by')
      .count('id as c');
    const [pendingTransfers] = await db('printing_material_requests').where('status', 'PENDING').count('id as c').catch(() => [{ c: 0 }]);
    ok(res, {
      totalMachines: totalMachines.c,
      machinesInStore: inStore.c,
      machinesInProduction: inProduction.c,
      machinesUnderMaintenance: underMaint.c,
      totalMaterials: totalMaterials.c,
      totalMaterialValue: matValue.v || 0,
      totalMachineValue: machineValue.v || 0,
      pendingMoveRequests: pendingMoves.c,
      pendingTransferRequests: pendingTransfers ? pendingTransfers.c : 0,
    });
  } catch (e) { err(res, e.message); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRINTING MATERIAL TRANSFER WORKFLOW (Pharmacy-style)
// Flow: Supervisor requests → CEO approves → Store Keeper ships → Supervisor receives
//       If stock unavailable → WAITING state → Purchase flow triggered
// ═══════════════════════════════════════════════════════════════════════════════
const notificationService = require('../../services/notification.service');
const { transaction } = require('../../config/database');

const genTransferCode = () => `PMR-${String(Date.now()).slice(-8)}`;

// CREATE: Printing Supervisor requests material from General Store
exports.createMaterialRequest = async (req, res) => {
  try {
    const { material_id, quantity_requested, urgency, notes } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.full_name || req.user.name || 'Supervisor';
    if (!material_id || !quantity_requested) return err(res, 'material_id and quantity_requested are required', 400);

    const qty = parseFloat(quantity_requested);
    if (qty <= 0) return err(res, 'Quantity must be greater than 0', 400);

    // Check for existing open request
    const existing = await db('printing_material_requests')
      .where('material_id', material_id)
      .whereIn('status', ['PENDING', 'APPROVED', 'SHIPPED', 'WAITING_PURCHASE'])
      .first()
      .catch(() => null);
    if (existing) return err(res, 'An open request already exists for this material', 400);

    const mat = await db('general_store_materials').where({ material_id }).first();
    if (!mat) return err(res, 'Material not found', 404);

    const storeQty = parseFloat(mat.quantity_in_store || 0);
    // If stock available → PENDING (needs CEO approval)
    // If stock insufficient → WAITING_PURCHASE
    const status = storeQty >= qty ? 'PENDING' : 'WAITING_PURCHASE';

    await db.schema.hasTable('printing_material_requests').then(async (exists) => {
      if (!exists) {
        await db.schema.createTable('printing_material_requests', (t) => {
          t.increments('id').primary();
          t.string('request_code', 50).notNullable();
          t.string('material_id', 50).notNullable();
          t.string('material_name', 200);
          t.decimal('quantity_requested', 10, 2).notNullable();
          t.decimal('quantity_shipped', 10, 2).nullable();
          t.decimal('quantity_received', 10, 2).nullable();
          t.decimal('store_qty_at_request', 10, 2);
          t.string('urgency', 20).defaultTo('MEDIUM');
          t.string('status', 30).defaultTo('PENDING'); // PENDING|APPROVED|REJECTED|SHIPPED|COMPLETED|DISCREPANCY|WAITING_PURCHASE|CANCELLED
          t.text('notes').nullable();
          t.text('rejection_reason').nullable();
          t.integer('created_by').unsigned();
          t.string('created_by_name', 200);
          t.integer('decided_by').unsigned().nullable();
          t.integer('shipped_by').unsigned().nullable();
          t.integer('received_by').unsigned().nullable();
          t.timestamp('decided_at').nullable();
          t.timestamp('shipped_at').nullable();
          t.timestamp('received_at').nullable();
          t.timestamps(true, true);
        });
      }
    });

    const [newId] = await db('printing_material_requests').insert({
      request_code: genTransferCode(),
      material_id,
      material_name: mat.material_name,
      quantity_requested: qty,
      store_qty_at_request: storeQty,
      urgency: urgency || 'MEDIUM',
      status,
      notes: notes || null,
      created_by: userId,
      created_by_name: userName,
      created_at: new Date(),
      updated_at: new Date()
    });

    const newReq = await db('printing_material_requests').where('id', newId).first();

    storeLog(req, 'PRINTING_MATERIAL_REQUEST_CREATED', newReq.request_code, null, {
      material_name: mat.material_name, quantity_requested: qty, status,
    });
    if (status === 'PENDING') {
      try {
        await notificationService.sendNotification('CEO', null, {
          type: 'PRINTING_MATERIAL_REQUEST',
          title: '🖨️ Printing Material Request',
          message: `${userName} is requesting ${qty} ${mat.unit} of ${mat.material_name} from General Store. Awaiting your approval.`,
          related_entity_id: newId,
          link: `/ceo/printing-material-requests`
        });
      } catch (e) { /* non-fatal */ }
    } else {
      // Notify purchase team
      try {
        await notificationService.sendNotification('Purchase', null, {
          type: 'PRINTING_MATERIAL_WAITING',
          title: '⚠️ Printing Material — Insufficient Stock',
          message: `${mat.material_name} is out of stock in General Store. Printing Dept. needs ${qty} ${mat.unit}. Purchase required.`,
          related_entity_id: newId,
          link: `/purchase/printing-requests`
        });
      } catch (e) { /* non-fatal */ }
    }

    ok(res, newReq, status === 'PENDING'
      ? 'Request submitted. Awaiting CEO approval.'
      : '⚠️ Stock insufficient — request is in WAITING_PURCHASE state. Purchase team notified.');
  } catch (e) { err(res, e.message); }
};

// LIST: Get all printing material requests (with filters)
exports.listMaterialRequests = async (req, res) => {
  try {
    await db.schema.hasTable('printing_material_requests').then(async (exists) => {
      if (!exists) return ok(res, []);
      const { status } = req.query;
      let q = db('printing_material_requests')
        .leftJoin('general_store_materials as gsm', 'printing_material_requests.material_id', 'gsm.material_id')
        .select(
          'printing_material_requests.*',
          'gsm.unit', 'gsm.category', 'gsm.unit_value',
          'gsm.quantity_in_store as live_store_qty'
        )
        .orderBy('printing_material_requests.created_at', 'desc');
      if (status) q = q.where('printing_material_requests.status', status);
      const rows = await q;
      ok(res, rows);
    });
  } catch (e) { err(res, e.message); }
};

// CEO: Approve or Reject a request
exports.decideMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;
    const userId = req.user.id;
    if (!['APPROVED', 'REJECTED'].includes(decision)) return err(res, 'decision must be APPROVED or REJECTED', 400);
    if (decision === 'REJECTED' && !reason) return err(res, 'Rejection reason is required', 400);

    const request = await db('printing_material_requests').where({ id }).first();
    if (!request) return err(res, 'Request not found', 404);
    if (!['PENDING', 'WAITING_PURCHASE'].includes(request.status)) return err(res, 'Request is not in a decidable state', 400);

    await db('printing_material_requests').where({ id }).update({
      status: decision,
      decided_by: userId,
      rejection_reason: reason || null,
      decided_at: new Date(),
      updated_at: new Date()
    });

    const updated = await db('printing_material_requests').where({ id }).first();

    if (decision === 'APPROVED') {
      try {
        await notificationService.sendNotification('General Store Keeper', null, {
          type: 'PRINTING_MATERIAL_APPROVED',
          title: '✅ Material Request Approved — Ship Now',
          message: `CEO approved: ${request.quantity_requested} ${request.material_name || request.material_id} → Printing Dept. Please issue to Printing Supervisor.`,
          related_entity_id: id,
          link: `/general-store/printing-requests`
        });
      } catch (e) { /* non-fatal */ }
      try {
        await notificationService.sendNotification('Printing Supervisor', null, {
          type: 'PRINTING_MATERIAL_APPROVED',
          title: '✅ Your Request Was Approved',
          message: `CEO approved your request for ${request.quantity_requested} of ${request.material_name || request.material_id}. General Store will dispatch shortly.`,
          related_entity_id: id,
          link: `/printing-manager/prod/store-materials`
        });
      } catch (e) { /* non-fatal */ }
    } else {
      try {
        await notificationService.sendNotification('Printing Supervisor', request.created_by, {
          type: 'PRINTING_MATERIAL_REJECTED',
          title: '❌ Material Request Rejected',
          message: `Your request for ${request.material_name || request.material_id} was rejected. Reason: ${reason}`,
          related_entity_id: id,
          link: `/printing-manager/prod/store-materials`
        });
      } catch (e) { /* non-fatal */ }
    }

    storeLog(req, 'PRINTING_MATERIAL_REQUEST_DECIDED', request.request_code,
      { status: request.status }, { status: decision, reason: reason || null });
    ok(res, updated, `Request ${decision}`);
  } catch (e) { err(res, e.message); }
};

// GENERAL STORE: Ship material (deduct from store stock)
exports.shipMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { shipped_qty, requested_by, job_reference } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.full_name || 'Store Keeper';
    if (!shipped_qty || parseFloat(shipped_qty) <= 0) return err(res, 'shipped_qty must be > 0', 400);

    const qty = parseFloat(shipped_qty);

    await transaction(async (trx) => {
      const request = await trx('printing_material_requests').where({ id }).first();
      if (!request) throw new Error('Request not found');
      if (request.status !== 'APPROVED') throw new Error('Request must be APPROVED before shipping');

      const mat = await trx('general_store_materials').where({ material_id: request.material_id }).first();
      if (!mat || parseFloat(mat.quantity_in_store) < qty) {
        throw new Error(`Insufficient store stock. Available: ${mat ? mat.quantity_in_store : 0}`);
      }

      // Deduct from General Store
      const newQty = Math.max(0, parseFloat(mat.quantity_in_store) - qty);
      const newTotal = newQty * parseFloat(mat.unit_value || 0);
      await trx('general_store_materials').where({ material_id: request.material_id }).update({
        quantity_in_store: newQty,
        total_value: newTotal,
        updated_at: db.fn.now()
      });

      await trx('printing_material_requests').where({ id }).update({
        status: 'SHIPPED',
        shipped_by: userId,
        quantity_shipped: qty,
        shipped_at: new Date(),
        updated_at: new Date()
      });

      await trx('general_movement_log').insert({
        item_type: 'Material',
        item_id: request.material_id,
        from_location: 'General Store',
        to_location: 'Printing Department',
        quantity: qty,
        department: 'Printing',
        moved_by: userName,
        approved_by: userName,
        action_type: 'Issue to Department',
        notes: `Shipped for request ${request.request_code} (CEO approved). Requested By: ${requested_by || 'Unknown'} | Ref: ${job_reference || 'None'}`
      });
    });

    const updated = await db('printing_material_requests').where({ id }).first();

    try {
      await notificationService.sendNotification('Printing Supervisor', updated.created_by, {
        type: 'PRINTING_MATERIAL_SHIPPED',
        title: '📦 Material Dispatched — Confirm Receipt',
        message: `General Store shipped ${qty} units of ${updated.material_name || updated.material_id}. Please go to Store Materials and click Receive to confirm.`,
        related_entity_id: id,
        link: `/printing-manager/prod/store-materials`
      });
    } catch (e) { /* non-fatal */ }

    storeLog(req, 'PRINTING_MATERIAL_REQUEST_SHIPPED', updated.request_code,
      { quantity_requested: updated.quantity_requested },
      { quantity_shipped: qty });
    ok(res, updated, 'Material shipped successfully');
  } catch (e) { err(res, e.message); }
};

// SUPERVISOR: Receive material (add to printing production stock)
exports.receiveMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { received_qty } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName || req.user.full_name || 'Supervisor';
    if (received_qty === undefined || received_qty === null) return err(res, 'received_qty is required', 400);

    const qty = parseFloat(received_qty);

    await transaction(async (trx) => {
      const request = await trx('printing_material_requests').where({ id }).first();
      if (!request) throw new Error('Request not found');
      if (request.status !== 'SHIPPED') throw new Error('Request must be in SHIPPED status to receive');

      const isMatch = qty === parseFloat(request.quantity_shipped);
      const newStatus = isMatch ? 'COMPLETED' : 'DISCREPANCY';

      await trx('printing_material_requests').where({ id }).update({
        status: newStatus,
        received_by: userId,
        quantity_received: qty,
        received_at: new Date(),
        updated_at: new Date(),
        ...((!isMatch) ? { rejection_reason: `DISCREPANCY: received ${qty} but shipped ${request.quantity_shipped}` } : {})
      });

      // ALWAYS record to production materials regardless of match/discrepancy
      const existing = await trx('printing_production_materials')
        .where({ material_id: request.material_id })
        .orderBy('id', 'desc')
        .first();
      if (existing) {
        await trx('printing_production_materials').where({ id: existing.id }).update({
          quantity_moved: db.raw('quantity_moved + ?', [qty]),
          quantity_remaining: db.raw('quantity_remaining + ?', [qty]),
          approved_by: userName,
          updated_at: db.fn.now()
        });
      } else {
        await trx('printing_production_materials').insert({
          material_id: request.material_id,
          quantity_moved: qty,
          quantity_consumed: 0,
          quantity_remaining: qty,
          moved_date: db.fn.now(),
          approved_by: userName
        });
      }

      await trx('general_movement_log').insert({
        item_type: 'Material',
        item_id: request.material_id,
        from_location: 'In Transit',
        to_location: 'Printing Production',
        quantity: qty,
        department: 'Printing',
        moved_by: userName,
        approved_by: userName,
        action_type: 'Received by Printing',
        notes: `Receipt ${isMatch ? 'CONFIRMED' : 'DISCREPANCY'} for ${request.request_code} — received ${qty}, shipped ${request.quantity_shipped}`
      });
    });

    const updated = await db('printing_material_requests').where({ id }).first();
    const isMatch = parseFloat(updated.quantity_received) === parseFloat(updated.quantity_shipped);

    if (isMatch) {
      try {
        await notificationService.sendNotification('CEO', null, {
          type: 'PRINTING_MATERIAL_COMPLETED',
          title: '✅ Printing Material Transfer Completed',
          message: `${updated.material_name || updated.material_id}: ${qty} units received by Printing Dept. Production stock updated.`,
          related_entity_id: id,
          link: `/ceo/printing-material-requests`
        });
        await notificationService.sendNotification('General Store Keeper', null, {
          type: 'PRINTING_MATERIAL_COMPLETED',
          title: '✅ Delivery Confirmed by Printing',
          message: `Printing Dept. confirmed receipt of ${qty} units of ${updated.material_name || updated.material_id}.`,
          related_entity_id: id,
          link: `/general-store/printing-requests`
        });
      } catch (e) { /* non-fatal */ }
    } else {
      try {
        await notificationService.sendNotification('CEO', null, {
          type: 'PRINTING_MATERIAL_DISCREPANCY',
          title: '⚠️ Printing Material Discrepancy',
          message: `Discrepancy in ${updated.request_code}: Shipped ${updated.quantity_shipped} but received ${qty}. Manual review needed.`,
          related_entity_id: id,
          link: `/ceo/printing-material-requests`
        });
      } catch (e) { /* non-fatal */ }
    }

    storeLog(req, isMatch ? 'PRINTING_MATERIAL_REQUEST_RECEIVED' : 'PRINTING_MATERIAL_REQUEST_DISCREPANCY', updated.request_code,
      { quantity_shipped: updated.quantity_shipped },
      { quantity_received: qty, status: updated.status });
    ok(res, updated, isMatch
      ? '✅ Material received. Production stock updated live!'
      : '⚠️ Discrepancy recorded. CEO notified for manual review.');
  } catch (e) { err(res, e.message); }
};

// CANCEL a pending request
exports.cancelMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await db('printing_material_requests').where({ id }).first();
    if (!request) return err(res, 'Request not found', 404);
    if (!['PENDING', 'WAITING_PURCHASE'].includes(request.status)) return err(res, 'Only PENDING or WAITING requests can be cancelled', 400);
    await db('printing_material_requests').where({ id }).update({ status: 'CANCELLED', updated_at: new Date() });
    storeLog(req, 'PRINTING_MATERIAL_REQUEST_CANCELLED', request.request_code,
      { status: request.status }, { status: 'CANCELLED' });
    ok(res, null, 'Request cancelled');
  } catch (e) { err(res, e.message); }
};

