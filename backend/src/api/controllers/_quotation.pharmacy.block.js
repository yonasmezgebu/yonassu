const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');

exports.listPharmacyIncoming = catchAsync(async (req, res) => {
  const { status } = req.query;
  let query = db('pharmacy_store_incoming as psi').orderBy('psi.created_at', 'desc');
  if (status && status !== 'All') query = query.where('psi.status', status);
  const rows = await query;
  res.json({ status: 'success', data: rows });
});

exports.getPharmacyIncoming = catchAsync(async (req, res) => {
  const header = await db('pharmacy_store_incoming').where({ id: req.params.id }).first();
  if (!header) throw AppError.notFound('Pharmacy incoming shipment not found');
  const items = await db('pharmacy_store_incoming_items').where({ incoming_id: header.id }).orderBy('id');
  res.json({ status: 'success', data: { ...header, items } });
});

exports.acceptPharmacyIncomingItem = catchAsync(async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id, itemId } = req.params;
    const item = await trx('pharmacy_store_incoming_items').where({ id: itemId, incoming_id: id }).first();
    if (!item) throw AppError.notFound('Pharmacy incoming item not found');
    if (item.status === 'received') throw AppError.badRequest('Item already received');

    const name = item.item_description;
    const strength = item.strength || null;
    const unitCost = parseFloat(item.unit_price) || 0;
    const qty = parseFloat(item.quantity) || 0;
    const batchNo = item.batch_no || null;
    const expiry = item.expiry_date || null;
    const unit = item.unit || 'unit';

    // Resolve (or create) the drug in the pharmacy catalogue
    let drug = await trx('drugs')
      .where({ name })
      .andWhere(function () {
        this.where('strength', strength).orWhere(function () { this.whereNull('strength'); });
      })
      .first();
    let drugId;
    if (drug) {
      drugId = drug.id;
      await trx('drugs').where('id', drugId).update({
        ...(item.unit ? { unit: item.unit } : {}),
        updated_at: trx.fn.now()
      });
    } else {
      [drugId] = await trx('drugs').insert({
        name,
        category: item.category || 'General',
        strength,
        unit,
        unit_price: unitCost,
        selling_price: unitCost,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    // One pharmacy_inventory row per batch + strength + expiry
    let inv = await trx('pharmacy_inventory')
      .where({ drug_id: drugId, batch_no: batchNo })
      .andWhere(function () {
        this.where('strength', strength).orWhere(function () { this.whereNull('strength'); });
      })
      .andWhere(function () {
        this.where('expiry_date', expiry).orWhere(function () { this.whereNull('expiry_date'); });
      })
      .first();
    if (inv) {
      await trx('pharmacy_inventory').where('id', inv.id).update({
        quantity: trx.raw('quantity + ?', [qty]),
        unit_cost: unitCost || inv.unit_cost,
        updated_at: trx.fn.now()
      });
    } else {
      await trx('pharmacy_inventory').insert({
        drug_id: drugId,
        quantity: qty,
        batch_no: batchNo,
        strength,
        expiry_date: expiry,
        reorder_level: 0,
        unit_cost: unitCost,
        branch_id: item.branch_id || null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    await trx('pharmacy_store_incoming_items').where({ id: itemId }).update({
      status: 'received',
      received_by: req.user.id,
      received_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    // When all lines are received, mark the shipment received
    const pending = await trx('pharmacy_store_incoming_items')
      .where({ incoming_id: id }).whereNot('status', 'received').first();
    await trx('pharmacy_store_incoming').where({ id }).update({
      status: pending ? 'partial' : 'received',
      updated_at: trx.fn.now()
    });

    await res.locals.audit?.('PHARMACY_STORE_INCOMING_ITEM_RECEIVED', {
      resource: 'pharmacy_store_incoming',
      resourceId: String(id),
      recordIdentifier: item.item_description,
      afterState: { drug_id: drugId, batch_no: batchNo, strength, quantity: qty, expiry_date: expiry, unit_cost: unitCost }
    });

    await trx.commit();
    res.json({ status: 'success', message: 'Item received into pharmacy inventory', data: { drug_id: drugId } });
  } catch (e) {
    await trx.rollback();
    throw e;
  }
});
