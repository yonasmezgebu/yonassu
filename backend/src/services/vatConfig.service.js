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

/* ── ensure product tax mapping tables exist (self-healing, generalized) ─────── */
const MAPPING_SOURCES = [
  'printing', 'pharmacy', 'car_rental', 'agrirent', 'retail', 'tender_sell', 'tender_buy',
];

async function ensureColumn(table, col, ddl) {
  const rows = await db.raw(`SHOW COLUMNS FROM \`${table}\``);
  const existing = new Set(rows[0].map((c) => c.Field));
  if (!existing.has(col)) {
    await db.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${ddl}`);
  }
}

async function ensureMappingTables() {
  try {
    if (!(await db.schema.hasTable('product_tax_mappings'))) {
      await db.schema.createTable('product_tax_mappings', (t) => {
        t.increments('id').unsigned().primary();
        t.string('source', 50).notNullable().defaultTo('retail');
        t.bigInteger('item_id').unsigned().notNullable();
        t.string('item_name', 255).nullable();
        t.integer('vat_config_id').unsigned().notNullable();
        t.integer('product_id').unsigned().nullable(); // legacy
        t.integer('created_by').unsigned().nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.timestamp('updated_at').defaultTo(db.fn.now());
        t.unique(['source', 'item_id']);
      });
    } else {
      await ensureColumn('product_tax_mappings', 'source', "VARCHAR(50) NOT NULL DEFAULT 'retail'");
      await ensureColumn('product_tax_mappings', 'item_id', 'BIGINT UNSIGNED NULL');
      await ensureColumn('product_tax_mappings', 'item_name', 'VARCHAR(255) NULL');
      // Legacy product_id is now optional
      await db.raw('ALTER TABLE `product_tax_mappings` MODIFY `product_id` INT UNSIGNED NULL');
      // Backfill legacy rows that only referenced products.id
      await db.raw(
        'UPDATE product_tax_mappings SET item_id = product_id, item_name = ' +
        '(SELECT p.name FROM products p WHERE p.id = product_tax_mappings.product_id) ' +
        'WHERE item_id IS NULL AND product_id IS NOT NULL'
      );
      // Swap the old UNIQUE(product_id) for UNIQUE(source, item_id)
      try {
        const oldIdx = await db.raw("SHOW INDEX FROM `product_tax_mappings` WHERE `Column_name` = 'product_id' AND `Non_unique` = 0");
        if (oldIdx[0] && oldIdx[0].length) {
          await db.raw(`ALTER TABLE \`product_tax_mappings\` DROP INDEX \`${oldIdx[0][0].Key_name}\``);
        }
        const newIdx = await db.raw("SHOW INDEX FROM `product_tax_mappings` WHERE `Column_name` = 'source' AND `Non_unique` = 0");
        if (!newIdx[0] || !newIdx[0].length) {
          await db.raw('ALTER TABLE `product_tax_mappings` ADD UNIQUE INDEX `uq_mapping_source_item` (`source`, `item_id`)');
        }
      } catch (_) { /* non-critical index migration */ }
    }
    if (!(await db.schema.hasTable('product_tax_mapping_history'))) {
      await db.schema.createTable('product_tax_mapping_history', (t) => {
        t.increments('id').unsigned().primary();
        t.string('source', 50).nullable();
        t.bigInteger('item_id').unsigned().nullable();
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
    } else {
      await ensureColumn('product_tax_mapping_history', 'source', 'VARCHAR(50) NULL');
      await ensureColumn('product_tax_mapping_history', 'item_id', 'BIGINT UNSIGNED NULL');
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

// Mapping is grouped by business module ("source"). Each source maps to the
// products of that module. Tender has two sub-types: Compute & Sell (auction
// sales) and Compute & Buy (procurement).
const mappingBase = () =>
  db('product_tax_mappings as ptm')
    .leftJoin('vat_configurations as vc', 'ptm.vat_config_id', 'vc.id')
    .select(
      'ptm.id',
      'ptm.source',
      'ptm.item_id',
      'ptm.item_name',
      'ptm.vat_config_id',
      'vc.name as tax_name',
      'vc.treatment',
      'vc.rate',
      'vc.is_active as treatment_active',
      'ptm.created_at'
    );

const getMappings = async () => {
  return mappingBase().orderBy('ptm.item_name', 'asc');
};

// Catalog items per source — each is the full list of products inside a module,
// decorated with its current tax mapping if one exists.
const sourceItems = {
  printing: () =>
    db('printing_product_types')
      .select('id', 'name', 'code as sku', 'base_price_per_page as price')
      .orderBy('name', 'asc'),
  pharmacy: () =>
    db('drugs')
      .select('id', 'name', 'drug_code as sku', 'unit_price as price')
      .orderBy('name', 'asc'),
  car_rental: () =>
    db('cars')
      .select('id', 'name', db.raw('NULL as sku'), 'daily_rate as price')
      .whereNull('deleted_at')
      .orderBy('name', 'asc'),
  agrirent: () =>
    db('tractors')
      .select('id', 'name', db.raw('NULL as sku'), 'daily_rate as price')
      .whereNull('deleted_at')
      .orderBy('name', 'asc'),
  retail: () =>
    db('retail_products')
      .select('id', 'name', 'sku', 'price')
      .orderBy('name', 'asc'),
  tender_sell: async () => {
    // Products sold through sales tenders — extracted from each tender's items JSON
    const out = [];
    const seen = new Set();
    const tenders = await db('tenders').select('id', 'items');
    for (const t of tenders) {
      let arr;
      try { arr = typeof t.items === 'string' ? JSON.parse(t.items) : t.items; } catch { continue; }
      if (!Array.isArray(arr)) continue;
      for (const it of arr) {
        const id = it.id != null ? String(it.id) : `t${t.id}:${it.objectType || it.name || ''}`;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({
          id,
          name: it.objectType || it.name || `Tender #${t.id} item`,
          sku: it.unit || null,
          price: it.startPrice != null ? parseFloat(it.startPrice) : null,
        });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  },
  tender_buy: () =>
    db('procurement_tenders')
      .select('id', 'drug_name as name', 'tender_no as sku', 'quantity as price')
      .orderBy('drug_name', 'asc'),
};

const getCatalog = async () => {
  const mappings = await mappingBase();
  const byKey = {};
  mappings.forEach((m) => { byKey[`${m.source}:${m.item_id}`] = m; });

  const decorate = (source, items) => items.map((it) => {
    const m = byKey[`${source}:${it.id}`];
    return {
      id: it.id,
      name: it.name,
      sku: it.sku || null,
      price: it.price != null ? it.price : null,
      mapping: m
        ? {
            mapping_id: m.id,
            vat_config_id: m.vat_config_id,
            treatment: m.treatment,
            rate: m.rate,
            treatment_active: m.treatment_active,
          }
        : null,
    };
  });

  const printing = await sourceItems.printing();
  const pharmacy = await sourceItems.pharmacy();
  const car_rental = await sourceItems.car_rental();
  const agrirent = await sourceItems.agrirent();
  const retail = await sourceItems.retail();
  const tender_sell = await sourceItems.tender_sell();
  const tender_buy = await sourceItems.tender_buy();

  return {
    categories: [
      { key: 'printing', label: 'Commercial Printing', items: decorate('printing', printing) },
      { key: 'pharmacy', label: 'Pharmacy & Health', items: decorate('pharmacy', pharmacy) },
      { key: 'car_rental', label: 'Car Rental', items: decorate('car_rental', car_rental) },
      { key: 'agrirent', label: 'AgriRent', items: decorate('agrirent', agrirent) },
      { key: 'retail', label: 'Retail Store', items: decorate('retail', retail) },
      {
        key: 'tender',
        label: 'Tender',
        subsections: [
          { key: 'tender_sell', label: 'Compute & Sell', items: decorate('tender_sell', tender_sell) },
          { key: 'tender_buy', label: 'Compute & Buy', items: decorate('tender_buy', tender_buy) },
        ],
      },
    ],
  };
};

const getMappingProducts = async () => {
  return db('products as p')
    .select('p.id', 'p.name', 'p.sku', 'p.selling_price', 'p.is_active')
    .whereNull('p.deleted_at')
    .orderBy('p.name', 'asc');
};

const upsertMapping = async (data, user) => {
  const source = data.source;
  const itemId = String(data.item_id ?? '');
  if (!MAPPING_SOURCES.includes(source)) throw new Error('Invalid mapping source');
  if (!itemId) throw new Error('Missing item id');

  const treatment = await db('vat_configurations').where('id', data.vat_config_id).first();
  if (!treatment) throw new Error('Tax treatment not found');

  const existing = await db('product_tax_mappings')
    .where('source', source)
    .where('item_id', itemId)
    .first();

  const oldTreatment = existing
    ? (await db('vat_configurations').where('id', existing.vat_config_id).first())?.treatment || null
    : null;

  const itemName = data.item_name || existing?.item_name || null;

  await db('product_tax_mapping_history').insert({
    source,
    item_id: itemId,
    product_name: itemName,
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

  let mappingId = existing?.id;
  if (existing) {
    await db('product_tax_mappings')
      .where('id', existing.id)
      .update({ vat_config_id: treatment.id, item_name: itemName, updated_at: db.fn.now() });
  } else {
    const [id] = await db('product_tax_mappings').insert({
      source,
      item_id: itemId,
      item_name: itemName,
      vat_config_id: treatment.id,
      product_id: null,
      created_by: user?.id || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
    mappingId = id;
  }

  return mappingBase().where('ptm.id', mappingId).first();
};

const removeMapping = async (id, user) => {
  const mapping = await db('product_tax_mappings').where('id', id).first();
  if (!mapping) throw new Error('Tax mapping not found');

  const oldTreatment = mapping.vat_config_id
    ? (await db('vat_configurations').where('id', mapping.vat_config_id).first())?.treatment || null
    : null;

  await db('product_tax_mapping_history').insert({
    source: mapping.source,
    item_id: mapping.item_id,
    product_name: mapping.item_name || null,
    old_vat_config_id: mapping.vat_config_id,
    old_treatment: oldTreatment,
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

/* ── Shared VAT computation used by every module pricing form ───────────────── */
// Unmapped items fall back to the current default standard VAT rate so totals
// stay consistent with the frontend (vatService.getVatForItem).
const DEFAULT_STANDARD_RATE = 0.15;

// Active VAT configuration for a specific source+item, or null when unmapped.
const effectiveRateFor = async (source, itemId) => {
  if (itemId == null || itemId === '') return null;
  const row = await db('product_tax_mappings as ptm')
    .join('vat_configurations as vc', 'ptm.vat_config_id', 'vc.id')
    .where({ 'ptm.source': source, 'ptm.item_id': String(itemId) })
    .andWhere('vc.is_active', 1)
    .select('vc.treatment', 'vc.rate')
    .first();
  if (!row) return null;
  return { treatment: row.treatment, rate: parseFloat(row.rate) };
};

// Compute VAT for one line. `fallbackRate` (e.g. a product's own vat_rate) is
// used only when the item has no CEO mapping; otherwise the currently active
// standard VAT rate applies (hard-coded 0.15 only when no active standard
// configuration exists at all).
const computeVatForItem = async (source, itemId, amount, fallbackRate = null) => {
  const amt = parseFloat(amount) || 0;
  const eff = await effectiveRateFor(source, itemId);
  let rate;
  let treatment = 'standard';
  if (eff) {
    rate = eff.rate;
    treatment = eff.treatment;
  } else if (fallbackRate != null) {
    rate = parseFloat(fallbackRate);
  } else {
    const std = await db('vat_configurations')
      .where({ treatment: 'standard', is_active: 1 })
      .orderBy('updated_at', 'desc')
      .first();
    rate = std ? parseFloat(std.rate) : DEFAULT_STANDARD_RATE;
  }
  const vat = amt * rate;
  return {
    mapped: !!eff,
    treatment,
    rate,
    sub: amt,
    vat,
    total: amt + vat,
  };
};

// Compute VAT for many lines at once and return aggregated totals.
const computeVatForItems = async (source, lines, fallbackRate = null) => {
  let subtotal = 0, vat = 0;
  const rows = [];
  for (const l of lines) {
    const r = await computeVatForItem(source, l.itemId, l.amount, fallbackRate);
    subtotal += r.sub;
    vat += r.vat;
    rows.push(r);
  }
  return { subtotal, vat, total: subtotal + vat, rows };
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
  getCatalog,
  upsertMapping,
  removeMapping,
  getMappingHistory,
  effectiveRateFor,
  computeVatForItem,
  computeVatForItems,
};
