const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');

const dispenseController = {
  createDispense: catchAsync(async (req, res) => {
    const { customer_name, notes, items } = req.body;

    if (!customer_name) throw new AppError('Customer name is required', 400);
    if (!items || !Array.isArray(items) || items.length === 0) throw new AppError('At least one item is required', 400);

    for (const item of items) {
      if (!item.medication_id) throw new AppError('medication_id is required for each item', 400);
      if (!item.quantity || item.quantity < 1) throw new AppError('Quantity must be at least 1 for each item', 400);
    }

    const result = await db.transaction(async (trx) => {
      for (const item of items) {
        const medication = await trx('pharmacy_medications').where({ id: item.medication_id }).first();
        if (!medication) throw new AppError(`Medication #${item.medication_id} not found`, 404);
        if (medication.stock_quantity < item.quantity) {
          throw new AppError(`Insufficient stock for ${medication.name}. Available: ${medication.stock_quantity}`, 400);
        }
      }

      const dispenseItems = [];
      for (const item of items) {
        const medication = await trx('pharmacy_medications').where({ id: item.medication_id }).first();

        await trx('pharmacy_medications')
          .where({ id: item.medication_id })
          .decrement('stock_quantity', item.quantity);

        await trx('pharmacy_stock_movements').insert({
          medication_id: item.medication_id,
          quantity_change: -item.quantity,
          reason: `Issued to customer: ${customer_name}${notes ? ' - ' + notes : ''}`,
          reference_no: `DISP-${Date.now()}`,
          created_by: req.user ? req.user.id : null
        });

        dispenseItems.push({
          medication_id: item.medication_id,
          medication_name: medication.name,
          quantity: item.quantity,
          unit_price: medication.price || medication.unit_price || 0,
          drug_image: medication.drug_image || medication.cover_image || null
        });
      }

      const totalItems = dispenseItems.reduce((s, i) => s + i.quantity, 0);

      const [id] = await trx('pharmacy_dispenses').insert({
        customer_name,
        notes: notes || null,
        items: JSON.stringify(dispenseItems),
        total_items: totalItems,
        dispensed_by: req.user ? req.user.id : null
      });

      return { id, items: dispenseItems, totalItems };
    });

    res.status(201).json({ status: 'success', data: { id: result.id, items: result.items, total_items: result.totalItems } });
  }),

  listDispenses: catchAsync(async (req, res) => {
    const { limit } = req.query;
    let query = db('pharmacy_dispenses').orderBy('created_at', 'desc');
    if (limit) query = query.limit(parseInt(limit));
    const rows = await query;

    const data = rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
    }));

    res.json({ status: 'success', data });
  })
};

module.exports = dispenseController;
