const { db } = require('../../config/database');

exports.getAll = async (req, res) => {
  try {
    const rows = await db('warehouses').orderBy('name');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const row = await db('warehouses').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const [id] = await db('warehouses').insert(req.body);
    const row = await db('warehouses').where('id', id).first();
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    await db('warehouses').where('id', req.params.id).update(req.body);
    const row = await db('warehouses').where('id', req.params.id).first();
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db('warehouses').where('id', req.params.id).del();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStoreInventory = async (req, res) => {
  try {
    const rows = await db('store_inventory as si')
      .join('drugs as d', 'si.drug_id', 'd.id')
      .leftJoin('warehouses as w', 'si.warehouse_id', 'w.id')
      .select(
        'si.*',
        'd.name as drug_name', 'd.strength', 'd.unit',
        'w.name as warehouse_name'
      )
      .orderBy('d.name');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
