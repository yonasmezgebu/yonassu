/**
 * VAT Configuration Service
 * Central source of truth for VAT/Tax rules across all ERP modules.
 */

const { db } = require('../config/database');

/* ── helpers ────────────────────────────────────────────────────────────────── */
const withCreator = () =>
  db('vat_configurations as vc')
    .leftJoin('users as u', 'vc.created_by', 'u.id')
    .leftJoin('users as ua', 'vc.approved_by', 'ua.id')
    .select(
      'vc.*',
      'u.full_name as created_by_name',
      'ua.full_name as approved_by_name'
    );

/* ── ensure central VAT tables exist (self-healing, mirrors migration) ───────── */
async function ensureConfigTables() {
  try {
    if (!(await db.schema.hasTable('vat_configurations'))) {
      await db.schema.createTable('vat_configurations', (t) => {
        t.increments('id').unsigned().primary();
        t.string('name', 100).notNullable();
        t.enum('treatment', ['standard', 'exempt', 'zero_rated']).notNullable();
        t.decimal('rate', 5, 4).notNullable().defaultTo(0);
        t.text('description').nullable();
        t.boolean('is_active').defaultTo(true);
        t.date('effective_from').nullable();
        t.boolean('requires_approval').defaultTo(true);
        t.integer('approved_by').unsigned().nullable();
        t.timestamp('approved_at').nullable();
        t.integer('created_by').unsigned().nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.timestamp('updated_at').defaultTo(db.fn.now());
      });
      const now = db.fn.now();
      await db('vat_configurations').insert([
        {
          name: 'VAT', treatment: 'standard', rate: 0.15,
          description: 'Standard VAT — 15%. Applied on most taxable goods and services.',
          is_active: true, effective_from: '2024-01-01', requires_approval: true,
          created_at: now, updated_at: now,
        },
        {
          name: 'VAT', treatment: 'exempt', rate: 0,
          description: 'VAT Exempt — 0%. Exempt classification. Not interchangeable with Zero-Rated.',
          is_active: true, effective_from: '2024-01-01', requires_approval: true,
          created_at: now, updated_at: now,
        },
        {
          name: 'VAT', treatment: 'zero_rated', rate: 0,
          description: 'VAT Zero-Rated — 0%. Zero-rated classification. Not interchangeable with Exempt.',
          is_active: true, effective_from: '2024-01-01', requires_approval: true,
          created_at: now, updated_at: now,
        },
      ]);
    }
    if (!(await db.schema.hasTable('vat_change_history'))) {
      await db.schema.createTable('vat_change_history', (t) => {
        t.increments('id').unsigned().primary();
        t.integer('vat_config_id').unsigned().notNullable()
          .references('id').inTable('vat_configurations').onDelete('CASCADE');
        t.enum('change_type', ['created', 'updated', 'approved', 'rejected', 'deactivated']).notNullable();
        t.decimal('old_rate', 5, 4).nullable();
        t.decimal('new_rate', 5, 4).nullable();
        t.string('old_treatment', 50).nullable();
        t.string('new_treatment', 50).nullable();
        t.date('old_effective_from').nullable();
        t.date('new_effective_from').nullable();
        t.integer('changed_by_id').unsigned().nullable();
        t.string('changed_by_name', 150).nullable();
        t.string('changed_by_role', 100).nullable();
        t.enum('approval_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
        t.integer('approved_by_id').unsigned().nullable();
        t.string('approved_by_name', 150).nullable();
        t.text('notes').nullable();
        t.string('ip_address', 45).nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
    }
  } catch (e) {
    console.error('ensureConfigTables failed:', e.message);
  }
}

/* ── ensure product tax mapping tables exist ─────────────────────────────────── */
async function ensureMappingTables() {
  try {
    if (!(await db.schema.hasTable('product_tax_mappings'))) {
      await db.schema.createTable('product_tax_mappings', (t) => {
        t.increments('id').unsigned().primary();
        t.integer('product_id').unsigned().notNullable();
        t.integer('vat_config_id').unsigned().notNullable();
        t.integer('created_by').unsigned().nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.timestamp('updated_at').defaultTo(db.fn.now());
        t.unique(['product_id']);
      });
    }
    if (!(await db.schema.hasTable('product_tax_mapping_history'))) {
      await db.schema.createTable('product_tax_mapping_history', (t) => {
        t.increments('id').unsigned().primary();
        t.integer('product_id').unsigned().nullable();
        t.string('product_name', 255).nullable();
        t.integer('old_vat_config_id').unsigned().nullable();
        t.string('old_treatment', 50).nullable();
        t.integer('new_vat_config_id').unsigned().nullable();
        t.string('new_treatment', 50).nullable();
        t.integer('changed_by_id').unsigned().nullable();
        t.string('changed_by_name', 150).nullable();
        t.string('changed_by_role', 100).nullable();
        t.string('notes', 255).nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
    }
  } catch (e) {
    console.error('ensureMappingTables failed:', e.message);
  }
}
ensureConfigTables();
ensureMappingTables();

/* Latest pending/approved status for a config — derived from the immutable
   change-history so the audit trail is the single source of truth.          */
const latestHistoryByConfig = async () => {
  const rows = await db('vat_change_history as h')
    .join(
      db.raw('(SELECT vat_config_id, MAX(id) AS max_id FROM vat_change_history GROUP BY vat_config_id) AS l'),
      'l.max_id',
      '=',
      'h.id'
    )
    .select('h.vat_config_id', 'h.approval_status', 'h.change_type');
  const map = {};
  rows.forEach((r) => { map[r.vat_config_id] = r; });
  return map;
};

const decorateWithStatus = async (configs) => {
  if (!configs || !configs.length) return configs;
  const latest = await latestHistoryByConfig();
  return configs.map((c) => {
    const l = latest[c.id];
    return {
      ...c,
      has_pending_change: !!(l && l.approval_status === 'pending'),
      latest_change_type: l ? l.change_type : null,
      latest_approval_status: l ? l.approval_status : null,
    };
  });
};

/* ── getAll ─────────────────────────────────────────────────────────────────── */
const getAll = async () => {
  return decorateWithStatus(await withCreator().orderBy('vc.treatment', 'asc'));
};

/* ── getById ────────────────────────────────────────────────────────────────── */
const getById = async (id) => {
  const row = await withCreator().where('vc.id', id).first();
  if (!row) return null;
  const [decorated] = await decorateWithStatus([row]);
  return decorated;
};

/* ── getHistory ─────────────────────────────────────────────────────────────── */
const getHistory = async (vatConfigId) => {
  let q = db('vat_change_history').select('*').orderBy('created_at', 'desc');
  if (vatConfigId != null) {
    q = q.where('vat_config_id', vatConfigId);
  }
  return q;
};

/* ── createConfig ───────────────────────────────────────────────────────────── */
const createConfig = async (data, user) => {
  // Governance: a new treatment is NOT effective until the CEO approves it.
  const requiresApproval = data.requires_approval !== false;
  const [id] = await db('vat_configurations').insert({
    name: data.name,
    treatment: data.treatment,
    rate: parseFloat(data.rate),
    description: data.description || null,
    is_active: requiresApproval ? false : data.is_active !== false,
    effective_from: data.effective_from || null,
    requires_approval: true,
    created_by: user?.id || null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  // Record creation in history
  await db('vat_change_history').insert({
    vat_config_id: id,
    change_type: 'created',
    new_rate: parseFloat(data.rate),
    new_treatment: data.treatment,
    new_effective_from: data.effective_from || null,
    changed_by_id: user?.id || null,
    changed_by_name: user?.fullName || null,
    changed_by_role: Array.isArray(user?.roles) ? user.roles.join(', ') : (user?.role || null),
    approval_status: requiresApproval ? 'pending' : 'approved',
    notes: data.notes || null,
    ip_address: data.ip || null,
    created_at: db.fn.now(),
  });

  return getById(id);
};

/* ── updateConfig ───────────────────────────────────────────────────────────── */
const updateConfig = async (id, data, user) => {
  const existing = await db('vat_configurations').where('id', id).first();
  if (!existing) throw new Error('VAT configuration not found');

  // Governance: an edited treatment is NOT effective until re-approved.
  await db('vat_configurations').where('id', id).update({
    name: data.name ?? existing.name,
    treatment: data.treatment ?? existing.treatment,
    rate: data.rate != null ? parseFloat(data.rate) : existing.rate,
    description: data.description ?? existing.description,
    is_active: false,
    effective_from: data.effective_from ?? existing.effective_from,
    // reset approval when updated
    approved_by: null,
    approved_at: null,
    updated_at: db.fn.now(),
  });

  // Record update in history
  await db('vat_change_history').insert({
    vat_config_id: id,
    change_type: 'updated',
    old_rate: existing.rate,
    new_rate: data.rate != null ? parseFloat(data.rate) : existing.rate,
    old_treatment: existing.treatment,
    new_treatment: data.treatment ?? existing.treatment,
    old_effective_from: existing.effective_from,
    new_effective_from: data.effective_from ?? existing.effective_from,
    changed_by_id: user?.id || null,
    changed_by_name: user?.fullName || null,
    changed_by_role: Array.isArray(user?.roles) ? user.roles.join(', ') : (user?.role || null),
    approval_status: 'pending',
    notes: data.notes || null,
    ip_address: data.ip || null,
    created_at: db.fn.now(),
  });

  return getById(id);
};

/* ── approveConfig ──────────────────────────────────────────────────────────── */
const approveConfig = async (id, user, notes) => {
  const existing = await db('vat_configurations').where('id', id).first();
  if (!existing) throw new Error('VAT configuration not found');

  await db('vat_configurations').where('id', id).update({
    approved_by: user?.id || null,
    approved_at: db.fn.now(),
    is_active: true, // approval makes the change effective
    updated_at: db.fn.now(),
  });

  await db('vat_change_history').insert({
    vat_config_id: id,
    change_type: 'approved',
    new_rate: existing.rate,
    new_treatment: existing.treatment,
    changed_by_id: user?.id || null,
    changed_by_name: user?.fullName || null,
    changed_by_role: Array.isArray(user?.roles) ? user.roles.join(', ') : (user?.role || null),
    approval_status: 'approved',
    approved_by_id: user?.id || null,
    approved_by_name: user?.fullName || null,
    notes: notes || 'Approved by CEO',
    created_at: db.fn.now(),
  });

  return getById(id);
};

/* ── rejectConfig ───────────────────────────────────────────────────────────── */
const rejectConfig = async (id, user, notes) => {
  const existing = await db('vat_configurations').where('id', id).first();
  if (!existing) throw new Error('VAT configuration not found');

  // Rejected change is NOT effective.
  await db('vat_configurations').where('id', id).update({
    is_active: false,
    updated_at: db.fn.now(),
  });

  const [histId] = await db('vat_change_history').insert({
    vat_config_id: id,
    change_type: 'rejected',
    old_rate: existing.rate,
    old_treatment: existing.treatment,
    changed_by_id: user?.id || null,
    changed_by_name: user?.fullName || null,
    changed_by_role: Array.isArray(user?.roles) ? user.roles.join(', ') : (user?.role || null),
    approval_status: 'rejected',
    approved_by_id: user?.id || null,
    approved_by_name: user?.fullName || null,
    notes: notes || 'Rejected by CEO',
    created_at: db.fn.now(),
  });

  return db('vat_change_history').where('id', histId).first();
};

/* ── toggleActive ───────────────────────────────────────────────────────────── */
const toggleActive = async (id, user) => {
  const existing = await db('vat_configurations').where('id', id).first();
  if (!existing) throw new Error('VAT configuration not found');

  const newActive = !existing.is_active;

  await db('vat_configurations').where('id', id).update({
    is_active: newActive,
    updated_at: db.fn.now(),
  });

  await db('vat_change_history').insert({
    vat_config_id: id,
    change_type: newActive ? 'created' : 'deactivated',
    old_rate: existing.rate,
    new_rate: existing.rate,
    old_treatment: existing.treatment,
    new_treatment: existing.treatment,
    changed_by_id: user?.id || null,
    changed_by_name: user?.fullName || null,
    changed_by_role: Array.isArray(user?.roles) ? user.roles.join(', ') : (user?.role || null),
    approval_status: 'approved',
    notes: newActive ? 'Re-activated' : 'Deactivated',
    created_at: db.fn.now(),
  });

  return getById(id);
};

/* ── Product / Service Tax Mapping ──────────────────────────────────────────── */
const getMappings = async () => {
  return db('product_tax_mappings as ptm')
    .leftJoin('products as p', 'ptm.product_id', 'p.id')
    .leftJoin('vat_configurations as vc', 'ptm.vat_config_id', 'vc.id')
    .select(
      'ptm.id',
      'ptm.product_id',
      'p.name as product_name',
      'p.sku as product_sku',
      'p.selling_price',
      'p.is_active as product_active',
      'ptm.vat_config_id',
      'vc.name as tax_name',
      'vc.treatment',
      'vc.rate',
      'vc.is_active as treatment_active',
      'ptm.created_at'
    )
    .whereNull('p.deleted_at')
    .orderBy('p.name', 'asc');
};

const getMappingProducts = async () => {
  return db('products as p')
    .select('p.id', 'p.name', 'p.sku', 'p.selling_price', 'p.is_active')
    .whereNull('p.deleted_at')
    .orderBy('p.name', 'asc');
};

const upsertMapping = async (data, user) => {
  const product = await db('products').where('id', data.product_id).whereNull('deleted_at').first();
  if (!product) throw new Error('Product not found');

  const treatment = await db('vat_configurations').where('id', data.vat_config_id).first();
  if (!treatment) throw new Error('Tax treatment not found');

  const existing = await db('product_tax_mappings').where('product_id', data.product_id).first();
  let mappingId = existing?.id;

  const oldTreatment = existing
    ? (await db('vat_configurations').where('id', existing.vat_config_id).first())?.treatment || null
    : null;

  await db('product_tax_mapping_history').insert({
    product_id: product.id,
    product_name: product.name,
    old_vat_config_id: existing ? existing.vat_config_id : null,
    old_treatment: oldTreatment,
    new_vat_config_id: treatment.id,
    new_treatment: treatment.treatment,
    changed_by_id: user?.id || null,
    changed_by_name: user?.fullName || null,
    changed_by_role: Array.isArray(user?.roles) ? user.roles.join(', ') : (user?.role || null),
    notes: data.notes || (existing ? 'Updated tax mapping' : 'Assigned tax treatment'),
    created_at: db.fn.now(),
  });

  if (existing) {
    await db('product_tax_mappings')
      .where('id', existing.id)
      .update({ vat_config_id: treatment.id, updated_at: db.fn.now() });
  } else {
    const [id] = await db('product_tax_mappings').insert({
      product_id: product.id,
      vat_config_id: treatment.id,
      created_by: user?.id || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
    mappingId = id;
  }

  return db('product_tax_mappings')
    .leftJoin('products as p', 'product_tax_mappings.product_id', 'p.id')
    .leftJoin('vat_configurations as vc', 'product_tax_mappings.vat_config_id', 'vc.id')
    .select(
      'product_tax_mappings.id',
      'product_tax_mappings.product_id',
      'p.name as product_name',
      'p.sku as product_sku',
      'product_tax_mappings.vat_config_id',
      'vc.name as tax_name',
      'vc.treatment',
      'vc.rate'
    )
    .where('product_tax_mappings.id', mappingId)
    .first();
};

const removeMapping = async (id, user) => {
  const mapping = await db('product_tax_mappings').where('id', id).first();
  if (!mapping) throw new Error('Tax mapping not found');

  const product = await db('products').where('id', mapping.product_id).whereNull('deleted_at').first();

  await db('product_tax_mapping_history').insert({
    product_id: mapping.product_id,
    product_name: product?.name || null,
    old_vat_config_id: mapping.vat_config_id,
    old_treatment: null,
    new_vat_config_id: null,
    new_treatment: null,
    changed_by_id: user?.id || null,
    changed_by_name: user?.fullName || null,
    changed_by_role: Array.isArray(user?.roles) ? user.roles.join(', ') : (user?.role || null),
    notes: 'Removed tax mapping',
    created_at: db.fn.now(),
  });

  await db('product_tax_mappings').where('id', id).del();
  return { id };
};

const getMappingHistory = async () => {
  return db('product_tax_mapping_history').orderBy('created_at', 'desc').limit(200);
};

module.exports = {
  getAll,
  getById,
  getHistory,
  createConfig,
  updateConfig,
  approveConfig,
  rejectConfig,
  toggleActive,
  getMappings,
  getMappingProducts,
  upsertMapping,
  removeMapping,
  getMappingHistory,
};
