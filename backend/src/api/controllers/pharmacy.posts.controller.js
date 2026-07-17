const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getFileInfo, deleteFile } = require('../middleware/upload.middleware');
const settingsRepository = new (require('../../repositories/settings.repository'))();

const MANAGER_ROLES = ['Pharmacy Manager', 'Admin', 'CEO'];

async function checkWorkerCanPost(req) {
  const isManager = req.user.roles?.some(r => MANAGER_ROLES.includes(r));
  if (isManager) return;
  const val = await settingsRepository.getValue('pharmacy_worker_can_add_products', true);
  if (!val) throw new AppError('Product posting is disabled by manager', 403);
}

const postsController = {
  list: async (req, res) => {
    const posts = await db('pharmacy_product_posts as p')
      .leftJoin('users as u', 'p.posted_by', 'u.id')
      .leftJoin('pharmacy_medications as pm', 'p.product_id', 'pm.id')
      .select(
        'p.*',
        'u.full_name as posted_by_name',
        'pm.name as product_name',
        'pm.drug_image as product_drug_image',
        'pm.price as product_price'
      )
      .orderBy('p.created_at', 'desc');
    res.json({ status: 'success', data: posts });
  },

  publicList: async (req, res) => {
    const posts = await db('pharmacy_product_posts as p')
      .leftJoin('users as u', 'p.posted_by', 'u.id')
      .leftJoin('pharmacy_medications as pm', 'p.product_id', 'pm.id')
      .select(
        'p.*',
        'u.full_name as posted_by_name',
        'pm.name as product_name',
        'pm.drug_image as product_drug_image',
        'pm.price as product_price'
      )
      .where('p.is_active', true)
      .orderBy('p.created_at', 'desc');
    res.json({ status: 'success', data: posts });
  },

  getById: async (req, res) => {
    const post = await db('pharmacy_product_posts as p')
      .leftJoin('users as u', 'p.posted_by', 'u.id')
      .leftJoin('pharmacy_medications as pm', 'p.product_id', 'pm.id')
      .select(
        'p.*',
        'u.full_name as posted_by_name',
        'pm.name as product_name',
        'pm.drug_image as product_drug_image',
        'pm.price as product_price'
      )
      .where('p.id', req.params.id)
      .first();
    if (!post) throw new AppError('Post not found', 404);
    res.json({ status: 'success', data: post });
  },

  create: async (req, res) => {
    await checkWorkerCanPost(req);
    const { title, description, product_id } = req.body;
    if (!title) throw new AppError('Title is required', 400);

    let image_url = null;
    if (req.file) {
      image_url = getFileInfo(req.file).url;
    }

    const [id] = await db('pharmacy_product_posts').insert({
      title,
      description: description || null,
      product_id: product_id || null,
      image_url,
      posted_by: req.user.id
    });

    const post = await db('pharmacy_product_posts').where({ id }).first();
    res.status(201).json({ status: 'success', data: post });
  },

  update: async (req, res) => {
    await checkWorkerCanPost(req);
    const { id } = req.params;
    const existing = await db('pharmacy_product_posts').where({ id }).first();
    if (!existing) throw new AppError('Post not found', 404);

    const { title, description, product_id, is_active } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (product_id !== undefined) updateData.product_id = product_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (req.file) {
      updateData.image_url = getFileInfo(req.file).url;
      if (existing.image_url) {
        deleteFile(existing.image_url.replace('/uploads/', 'uploads/'));
      }
    }

    await db('pharmacy_product_posts').where({ id }).update(updateData);
    const post = await db('pharmacy_product_posts').where({ id }).first();
    res.json({ status: 'success', data: post });
  },

  remove: async (req, res) => {
    await checkWorkerCanPost(req);
    const { id } = req.params;
    const existing = await db('pharmacy_product_posts').where({ id }).first();
    if (!existing) throw new AppError('Post not found', 404);

    if (existing.image_url) {
      deleteFile(existing.image_url.replace('/uploads/', 'uploads/'));
    }

    await db('pharmacy_product_posts').where({ id }).del();
    res.status(204).send();
  }
};

module.exports = postsController;
