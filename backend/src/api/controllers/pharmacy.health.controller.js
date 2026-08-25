const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getFileInfo, deleteFile } = require('../middleware/upload.middleware');

function toResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.name,
    subtitle: row.description ? row.description.substring(0, 200) : '',
    content: row.description || '',
    category_id: row.category_id,
    category_name: row.category_name || '',
    branch_id: row.branch_id,
    branch_name: row.branch_name || '',
    price: row.price,
    price_unit: row.price_unit || 'ETB',
    selling_price: row.selling_price,
    manufacturer: row.manufacturer,
    drug_image: row.drug_image,
    cover_image: row.cover_image,
    stock_quantity: row.stock_quantity,
    reorder_level: row.reorder_level,
    is_prescription_required: row.is_prescription_required,
    status: row.is_active ? 'published' : 'draft',
    is_active: row.is_active,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

const healthController = {
  list: async (req, res) => {
    const { status } = req.query;
    let query = db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .leftJoin('branches as pb', 'pm.branch_id', 'pb.id')
      .select('pm.*', 'pc.name as category_name', 'pb.name as branch_name')
      .orderBy('pm.created_at', 'desc');
    if (status === 'published') query = query.where('pm.is_active', true);
    else if (status === 'draft') query = query.where('pm.is_active', false);
    const rows = await query;
    res.json({ status: 'success', data: rows.map(toResponse) });
  },

  getById: async (req, res) => {
    const row = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .leftJoin('branches as pb', 'pm.branch_id', 'pb.id')
      .select('pm.*', 'pc.name as category_name', 'pb.name as branch_name')
      .where('pm.id', req.params.id)
      .first();
    if (!row) throw new AppError('Post not found', 404);
    res.json({ status: 'success', data: toResponse(row) });
  },

  scrape: async (req, res) => {
    const categories = await db('pharmacy_categories').where('is_active', true).orderBy('name');
    const products = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .select('pm.*', 'pc.name as category_name')
      .where('pm.is_active', true)
      .orderBy('pm.name');
    res.json({ status: 'success', data: { categories, products } });
  },

  create: async (req, res) => {
    const { title, subtitle, content, source_url, category_id, branch_id,
            price, price_unit, selling_price, manufacturer,
            stock_quantity, reorder_level, is_prescription_required, status } = req.body;
    if (!title) throw new AppError('Title is required', 400);

    let catId = category_id ? parseInt(category_id) : null;
    if (!catId && req.body.category_name) {
      let cat = await db('pharmacy_categories').where('name', req.body.category_name).first();
      if (cat) catId = cat.id;
    }

    const desc = [subtitle, content, source_url ? `Source: ${source_url}` : ''].filter(Boolean).join('\n\n');

    const data = {
      name: title,
      description: desc || null,
      category_id: catId,
      branch_id: branch_id ? parseInt(branch_id) : null,
      manufacturer: manufacturer || null,
      is_active: status === 'published' ? 1 : 0
    };

    if (price !== undefined) data.price = parseFloat(price);
    if (price_unit !== undefined) data.price_unit = price_unit;
    if (selling_price !== undefined && selling_price !== '') data.selling_price = parseFloat(selling_price);
    if (stock_quantity !== undefined) data.stock_quantity = parseInt(stock_quantity);
    if (reorder_level !== undefined) data.reorder_level = parseInt(reorder_level);
    if (is_prescription_required !== undefined) data.is_prescription_required = is_prescription_required === true || is_prescription_required === 'true';

    if (req.files) {
      if (req.files.drug_image) {
        data.drug_image = getFileInfo(req.files.drug_image[0]).url;
      }
      if (req.files.cover_image) {
        data.cover_image = getFileInfo(req.files.cover_image[0]).url;
      }
    }

    const [id] = await db('pharmacy_medications').insert(data);
    const row = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .leftJoin('branches as pb', 'pm.branch_id', 'pb.id')
      .select('pm.*', 'pc.name as category_name', 'pb.name as branch_name')
      .where('pm.id', id).first();
    res.status(201).json({ status: 'success', data: toResponse(row) });
  },

  update: async (req, res) => {
    const { id } = req.params;
    const existing = await db('pharmacy_medications').where({ id }).first();
    if (!existing) throw new AppError('Post not found', 404);

    const { title, subtitle, content, source_url, category_id, branch_id,
            price, price_unit, selling_price, manufacturer,
            stock_quantity, reorder_level, is_prescription_required, status } = req.body;

    const data = {};
    if (title !== undefined) data.name = title;
    if (subtitle !== undefined || content !== undefined || source_url !== undefined) {
      const parts = [];
      if (subtitle !== undefined) parts.push(subtitle);
      if (content !== undefined) parts.push(content);
      if (source_url !== undefined) parts.push(`Source: ${source_url}`);
      else if (existing.description) parts.push(existing.description);
      data.description = parts.filter(Boolean).join('\n\n');
    }
    if (category_id !== undefined) data.category_id = category_id ? parseInt(category_id) : null;
    if (branch_id !== undefined) data.branch_id = branch_id ? parseInt(branch_id) : null;
    if (manufacturer !== undefined) data.manufacturer = manufacturer;
    if (price !== undefined) data.price = parseFloat(price);
    if (price_unit !== undefined) data.price_unit = price_unit;
    if (selling_price !== undefined && selling_price !== '') data.selling_price = parseFloat(selling_price);
    if (stock_quantity !== undefined) data.stock_quantity = parseInt(stock_quantity);
    if (reorder_level !== undefined) data.reorder_level = parseInt(reorder_level);
    if (is_prescription_required !== undefined) data.is_prescription_required = is_prescription_required === true || is_prescription_required === 'true';
    if (status !== undefined) data.is_active = status === 'published' ? 1 : 0;

    if (req.files) {
      if (req.files.drug_image) {
        data.drug_image = getFileInfo(req.files.drug_image[0]).url;
        if (existing.drug_image) deleteFile(existing.drug_image.replace('/uploads/', 'uploads/'));
      }
      if (req.files.cover_image) {
        data.cover_image = getFileInfo(req.files.cover_image[0]).url;
        if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
      }
    }

    await db('pharmacy_medications').where({ id }).update(data);
    const row = await db('pharmacy_medications as pm')
      .leftJoin('pharmacy_categories as pc', 'pm.category_id', 'pc.id')
      .leftJoin('branches as pb', 'pm.branch_id', 'pb.id')
      .select('pm.*', 'pc.name as category_name', 'pb.name as branch_name')
      .where('pm.id', id).first();
    res.json({ status: 'success', data: toResponse(row) });
  },

  remove: async (req, res) => {
    const { id } = req.params;
    const existing = await db('pharmacy_medications').where({ id }).first();
    if (!existing) throw new AppError('Post not found', 404);
    if (existing.drug_image) deleteFile(existing.drug_image.replace('/uploads/', 'uploads/'));
    if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
    await db('pharmacy_medications').where({ id }).del();
    res.status(204).send();
  },

  publish: async (req, res) => {
    const { id } = req.params;
    const existing = await db('pharmacy_medications').where({ id }).first();
    if (!existing) throw new AppError('Post not found', 404);
    await db('pharmacy_medications').where({ id }).update({ is_active: true });
    res.json({ status: 'success', message: 'Post published' });
  }
};

module.exports = healthController;
