const { db } = require('../../config/database');

exports.getCurrentStock = async (req, res) => {
  try {
    const rows = await db('pharmacy_inventory as i')
      .join('drugs as d', 'i.drug_id', 'd.id')
      .select(
        'i.id as inventory_id',
        'i.drug_id',
        'i.quantity',
        'i.reorder_level',
        'd.name',
        'd.strength',
        'd.unit',
        'd.unit_price',
        'd.category'
      )
      .orderBy('d.name', 'asc');
    
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const rows = await db('pharmacy_inventory as i')
      .join('drugs as d', 'i.drug_id', 'd.id')
      .select(
        'i.id as inventory_id',
        'i.drug_id',
        'i.quantity',
        'i.reorder_level',
        'd.name',
        'd.strength',
        'd.unit',
        'd.unit_price',
        'd.category'
      )
      .whereRaw('i.quantity <= i.reorder_level')
      .orderBy('i.quantity', 'asc');
    
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
