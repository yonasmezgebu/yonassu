const { db } = require('../../config/database');

exports.getCEOReport = async (req, res) => {
  try {
    // 1. Pending Update Requests (product price/data changes)
    const updateRequests = await db('retail_update_requests')
      .select('retail_update_requests.*', 'retail_products.name as product_name', 'retail_products.sku as product_sku')
      .leftJoin('retail_products', 'retail_update_requests.product_id', 'retail_products.id')
      .orderBy('retail_update_requests.created_at', 'desc')
      .limit(100);

    // 2. Branch Overview
    const branches = await db('retail_branches')
      .select('id', 'name', 'code', 'manager_name', 'is_active', 'location')
      .orderBy('name', 'asc');

    // 3. Orders Overview (counts & total revenue by branch)
    // We'll aggregate from retail_orders
    const ordersOverview = await db('retail_orders')
      .select('status')
      .count('id as count')
      .sum('total_amount as revenue')
      .groupBy('status');

    // 4. Catalog Overview (exclude cost_price)
    const productsOverview = await db('retail_products')
      .select('id', 'name', 'sku', 'category', 'price', 'stock_quantity', 'is_active', 'reorder_level')
      .orderBy('stock_quantity', 'asc')
      .limit(100); // just top 100 or low stock

    return res.status(200).json({
      success: true,
      data: {
        updateRequests,
        branches,
        ordersOverview,
        productsOverview
      }
    });
  } catch (error) {
    console.error('getCEOReport Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching CEO Report', error: error.message });
  }
};

exports.ceoApproveRetailUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body; // action: 'APPROVE' or 'REJECT'
    
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    const request = await db('retail_update_requests').where({ id }).first();
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Request is not pending.' });

    await db.transaction(async (trx) => {
      await trx('retail_update_requests').where({ id }).update({
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        rejection_reason: action === 'REJECT' ? rejection_reason : null,
        approved_by: req.user.id,
        updated_at: new Date()
      });

      // If approved, update the product
      if (action === 'APPROVE') {
        const newData = JSON.parse(request.new_data || '{}');
        await trx('retail_products').where({ id: request.product_id }).update({
          ...newData,
          updated_at: new Date()
        });
      }
    });

    return res.status(200).json({ success: true, message: `Request ${action.toLowerCase()} successfully.` });
  } catch (error) {
    console.error('ceoApproveRetailUpdate Error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing update', error: error.message });
  }
};

exports.getFinanceReview = async (req, res) => {
  try {
    const userRole = (req.user?.roles || []).map(r => r.toLowerCase());
    const isFinance = userRole.includes('finance') || userRole.includes('finance manager');

    // 1. Shift Reconciliation
    const shifts = await db('retail_shifts')
      .select('*')
      .orderBy('opened_at', 'desc')
      .limit(50);

    // 2. POS Cart Submissions
    const posCarts = await db('retail_pos_carts')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(100);

    // 3. Transactions Overview
    const transactions = await db('retail_transactions')
      .select('invoice_number', 'total_amount', 'payment_method', 'payment_ref', 'is_submitted', 'submission_ref', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(100);

    // 4. Products with Margin (Finance ONLY)
    let margins = [];
    if (isFinance) {
      margins = await db('retail_products')
        .select('id', 'name', 'sku', 'price', 'cost_price')
        .whereNotNull('cost_price')
        .orderBy('name', 'asc');
    }

    // 5. Audit Trail
    const auditTrail = await db('retail_audit_trail')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(50)
      .catch(() => []); // Might not exist

    return res.status(200).json({
      success: true,
      data: {
        shifts,
        posCarts,
        transactions,
        margins, // Empty array if not finance
        auditTrail
      }
    });
  } catch (error) {
    console.error('getFinanceReview Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching Finance Review', error: error.message });
  }
};

exports.financeVerifyShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    await db('retail_shifts').where({ id }).update({
      status: status || 'CLOSED_VERIFIED',
      updated_at: new Date()
    });

    return res.status(200).json({ success: true, message: 'Shift verified successfully.' });
  } catch (error) {
    console.error('financeVerifyShift Error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying shift', error: error.message });
  }
};

exports.financeVerifyPOSCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    await db('retail_pos_carts').where({ id }).update({
      status: status || 'VERIFIED',
      notes,
      updated_at: new Date()
    });

    return res.status(200).json({ success: true, message: 'POS Cart verified successfully.' });
  } catch (error) {
    console.error('financeVerifyPOSCart Error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying POS cart', error: error.message });
  }
};

exports.getDailySummary = async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    
    // Build date boundaries
    const startOfDay = `${targetDate} 00:00:00`;
    const endOfDay = `${targetDate} 23:59:59`;

    // 1. Today's Transactions
    const transactions = await db('retail_transactions')
      .whereBetween('created_at', [startOfDay, endOfDay]);

    const txTotals = {
      total_sales: transactions.length,
      total_amount: transactions.reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0)
    };

    // 2. Today's Shifts
    const shifts = await db('retail_shifts')
      .whereBetween('opened_at', [startOfDay, endOfDay]);

    // 3. Today's Orders
    const orders = await db('retail_orders')
      .select('status', 'payment_status')
      .count('id as count')
      .sum('total_amount as amount')
      .whereBetween('created_at', [startOfDay, endOfDay])
      .groupBy('status', 'payment_status');

    // Branch Breakdown (from transactions)
    const branchBreakdown = await db('retail_transactions')
      .select('branch_name', 'branch_id')
      .count('id as count')
      .sum('total_amount as total')
      .whereBetween('created_at', [startOfDay, endOfDay])
      .groupBy('branch_name', 'branch_id');

    // 4. Low Stock Alerts
    const lowStock = await db('retail_products')
      .select('id', 'name', 'sku', 'stock_quantity', 'reorder_level')
      .whereRaw('stock_quantity <= reorder_level')
      .where('is_active', true)
      .limit(50);

    return res.status(200).json({
      success: true,
      data: {
        txTotals,
        transactions,
        shifts,
        orders,
        branchBreakdown,
        lowStock
      }
    });
  } catch (error) {
    console.error('getDailySummary Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching Daily Summary', error: error.message });
  }
};
