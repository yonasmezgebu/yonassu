const { db } = require('../../config/database');

exports.getAll = async (req, res) => {
  try {
    const rows = await db('announcements as a')
      .join('users as u', 'a.created_by', 'u.id')
      .select('a.*', 'u.full_name as author')
      .where(function () {
        if (req.user.role === 'Pharmacy Worker' || req.user.role === 'Pharmacy Manager') {
          this.where('target_audience', 'All Branches')
            .orWhere('target_branch_id', req.user.branch_id);
        }
      })
      .orderBy('a.published_at', 'desc');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const row = await db('announcements').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, message, target_audience, target_branch_id } = req.body;
    const [id] = await db('announcements').insert({
      title,
      message,
      created_by: req.user.id,
      target_audience: target_audience || 'All Branches',
      target_branch_id: target_branch_id || null,
    });
    const row = await db('announcements').where('id', id).first();
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    await db('announcements').where('id', req.params.id).update(req.body);
    const row = await db('announcements').where('id', req.params.id).first();
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db('announcements').where('id', req.params.id).del();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
