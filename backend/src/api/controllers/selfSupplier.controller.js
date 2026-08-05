const { db } = require('../../config/database');

/**
 * POST /api/suppliers
 * Customer self-registers as a supplier
 */
exports.registerSupplier = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company_name, category, business_address, description } = req.body;

    if (!category || !business_address) {
      return res.status(400).json({ status: 'error', message: 'Category and business address are required.' });
    }

    // Check if already registered
    const existing = await db('self_registered_suppliers').where({ user_id: userId }).first();
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'You are already registered as a supplier.' });
    }

    // Snapshot user details at registration time
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    await db('self_registered_suppliers').insert({
      user_id: userId,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      company_name: company_name || null,
      category,
      business_address,
      description: description || null,
      status: 'Active',
    });

    const newSupplier = await db('self_registered_suppliers').where({ user_id: userId }).first();

    return res.status(201).json({
      status: 'success',
      message: 'You are now registered as a supplier. Companies can contact you to purchase your products.',
      data: newSupplier,
    });
  } catch (error) {
    console.error('Error registering supplier:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * GET /api/suppliers/me
 * Get the current user's supplier profile
 */
exports.getMySupplierProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const supplier = await db('self_registered_suppliers')
      .leftJoin('users', 'self_registered_suppliers.user_id', 'users.id')
      .select('self_registered_suppliers.*', 'users.profile_photo')
      .where({ 'self_registered_suppliers.user_id': userId })
      .first();
    return res.json({ status: 'success', data: supplier || null });
  } catch (error) {
    console.error('Error fetching supplier profile:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * GET /api/suppliers
 * All self-registered suppliers (for Purchase Manager)
 */
exports.getAllSuppliers = async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let query = db('self_registered_suppliers')
      .leftJoin('users', 'self_registered_suppliers.user_id', 'users.id')
      .select('self_registered_suppliers.*', 'users.profile_photo')
      .orderBy('self_registered_suppliers.created_at', 'desc');

    if (status) query = query.where('self_registered_suppliers.status', status);
    if (category) query = query.where('self_registered_suppliers.category', 'like', `%${category}%`);
    if (search) {
      query = query.where(function () {
        this.where('self_registered_suppliers.full_name', 'like', `%${search}%`)
          .orWhere('self_registered_suppliers.email', 'like', `%${search}%`)
          .orWhere('self_registered_suppliers.company_name', 'like', `%${search}%`)
          .orWhere('self_registered_suppliers.category', 'like', `%${search}%`);
      });
    }

    const suppliers = await query;
    return res.json({ status: 'success', data: suppliers });
  } catch (error) {
    console.error('Error fetching all suppliers:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * PUT /api/suppliers/:id/verify
 * Staff fills in Stage 2 verification data → status becomes 'Verified'
 */
exports.verifySupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tax_id, payment_terms, credit_limit,
      location_type, bank_name, bank_account, bank_holder, website
    } = req.body;

    const supplier = await db('self_registered_suppliers').where({ id }).first();
    if (!supplier) return res.status(404).json({ status: 'error', message: 'Supplier not found' });

    await db('self_registered_suppliers').where({ id }).update({
      tax_id: tax_id || null,
      payment_terms: payment_terms || null,
      credit_limit: credit_limit || null,
      location_type: location_type || null,
      bank_name: bank_name || null,
      bank_account: bank_account || null,
      bank_holder: bank_holder || null,
      website: website || null,
      status: 'Verified',
      updated_at: db.fn.now(),
    });

    const updated = await db('self_registered_suppliers').where({ id }).first();
    return res.json({ status: 'success', message: 'Supplier verified successfully', data: updated });
  } catch (error) {
    console.error('Error verifying supplier:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * PATCH /api/suppliers/:id/status
 * Quick status change (Pending / Verified / Active / Rejected)
 */
exports.updateSupplierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['Pending', 'Verified', 'Active', 'Rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status value' });
    }
    await db('self_registered_suppliers').where({ id }).update({ status, updated_at: db.fn.now() });
    const updated = await db('self_registered_suppliers').where({ id }).first();
    return res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error updating supplier status:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
