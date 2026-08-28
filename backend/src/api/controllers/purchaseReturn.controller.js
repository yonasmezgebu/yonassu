const { db } = require('../../config/database');

const genCode = (prefix) =>
  `${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-5)}`;

// ── GET /purchase-returns ─────────────────────────────────────────────────────
exports.getReturns = async (req, res) => {
  try {
    const { status, reason } = req.query;

    let query = db('purchase_returns')
      .leftJoin('users as creator', 'purchase_returns.created_by', 'creator.id')
      .select(
        'purchase_returns.*',
        'creator.name as created_by_name'
      )
      .orderBy('purchase_returns.created_at', 'desc');

    if (status) query = query.where('purchase_returns.status', status);
    if (reason) query = query.where('purchase_returns.reason', reason);

    const returns = await query;
    res.json({ status: 'success', data: returns });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── POST /purchase-returns ────────────────────────────────────────────────────
exports.createReturn = async (req, res) => {
  const { po_ref, supplier_name, item, qty, reason, auth_number, method, notes } = req.body;
  const userId = req.user?.id;

  if (!po_ref || !supplier_name || !item || !qty || !reason) {
    return res.status(400).json({
      status: 'error',
      message: 'po_ref, supplier_name, item, qty, and reason are required'
    });
  }
  if (parseInt(qty, 10) <= 0) {
    return res.status(400).json({ status: 'error', message: 'qty must be a positive number' });
  }

  try {
    const [id] = await db('purchase_returns').insert({
      return_code: genCode('RET'),
      po_ref,
      supplier_name,
      item,
      qty: parseInt(qty, 10),
      reason,
      auth_number: auth_number || null,
      method: method || 'Ship',
      notes: notes || null,
      status: 'Pending',
      created_by: userId || null,
    });

    const newReturn = await db('purchase_returns').where('id', id).first();
    res.status(201).json({ status: 'success', data: newReturn });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      // Auto-create the table if missing
      await db.schema.createTable('purchase_returns', (t) => {
        t.increments('id').primary();
        t.string('return_code', 30).notNullable();
        t.string('po_ref', 100).notNullable();
        t.string('supplier_name', 200).notNullable();
        t.string('item', 300).notNullable();
        t.integer('qty').unsigned().notNullable();
        t.string('reason', 100).notNullable();
        t.string('auth_number', 100).nullable();
        t.string('method', 50).defaultTo('Ship');
        t.text('notes').nullable();
        t.string('status', 50).defaultTo('Pending');
        t.integer('created_by').unsigned().nullable();
        t.timestamps(true, true);
      });
      // retry
      const [id] = await db('purchase_returns').insert({
        return_code: genCode('RET'),
        po_ref,
        supplier_name,
        item,
        qty: parseInt(qty, 10),
        reason,
        auth_number: auth_number || null,
        method: method || 'Ship',
        notes: notes || null,
        status: 'Pending',
        created_by: userId || null,
      });
      const newReturn = await db('purchase_returns').where('id', id).first();
      return res.status(201).json({ status: 'success', data: newReturn });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /purchase-returns/:id/status ────────────────────────────────────────
exports.updateReturnStatus = async (req, res) => {
  const { id } = req.params;
  const { status, auth_number } = req.body;

  const allowed = ['Pending', 'Authorized', 'Shipped', 'Completed', 'Cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ status: 'error', message: `status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const existing = await db('purchase_returns').where('id', parseInt(id, 10)).first();
    if (!existing) return res.status(404).json({ status: 'error', message: 'Return not found' });

    const updates = { status };
    if (auth_number) updates.auth_number = auth_number;
    await db('purchase_returns').where('id', parseInt(id, 10)).update(updates);

    const updated = await db('purchase_returns').where('id', parseInt(id, 10)).first();
    res.json({ status: 'success', data: updated });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── DELETE /purchase-returns/:id ──────────────────────────────────────────────
exports.deleteReturn = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db('purchase_returns').where('id', parseInt(id, 10)).first();
    if (!existing) return res.status(404).json({ status: 'error', message: 'Return not found' });
    if (existing.status !== 'Pending') {
      return res.status(400).json({ status: 'error', message: 'Only Pending returns can be deleted' });
    }
    await db('purchase_returns').where('id', parseInt(id, 10)).del();
    res.json({ status: 'success', message: 'Return deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
