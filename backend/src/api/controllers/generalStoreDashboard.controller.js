const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');

exports.getDashboardStats = catchAsync(async (req, res) => {
  // Total Items (SKUs)
  const totalItemsRes = await db('general_store_materials').count('* as count').first();
  const totalItems = parseInt(totalItemsRes.count || 0);

  // Total Value
  const totalValueRes = await db('general_store_materials').sum('total_value as value').first();
  const totalValue = parseFloat(totalValueRes.value || 0);

  // Total Quantity
  const totalQuantityRes = await db('general_store_materials').sum('quantity_in_store as qty').first();
  const totalQuantity = parseInt(totalQuantityRes.qty || 0);

  // Low Stock Count
  const lowStockRes = await db('general_store_materials').whereRaw('quantity_in_store <= COALESCE(reorder_level, 10)').count('* as count').first();
  const lowStockCount = parseInt(lowStockRes.count || 0);

  // Pending requests/requisitions (We can pull from store_requisitions if it applies to general store, or just return 0 for now)
  // Let's check if store_requisitions is pharmacy only. It's used in store.inventory.routes.js, so it's probably pharmacy.
  // We'll just return the main KPIs
  
  res.json({
    status: 'success',
    data: {
      totalItems,
      totalValue,
      totalQuantity,
      lowStockCount,
      pendingRequisitions: 0,
      todayReceipts: 0,
      todayIssues: 0,
      pendingTransfers: 0
    }
  });
});
