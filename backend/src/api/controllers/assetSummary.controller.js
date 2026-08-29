const { db } = require('../../config/database');

// Consolidated Assets Summary across the 5 asset modules:
// 1. General Store Valuation      (consumables)
// 2. Printing Machines Valuation  (fixed assets)
// 3. Pharmacy Store & Stock
// 4. Vehicle & Rental Assets
// 5. Tractor Assets
// Each category total matches the value shown on its own sub-page so that the
// grand total reconciles with what finance sees on the individual pages.
exports.getAssetSummary = async (req, res) => {
  try {
    // 1. General Store — consumables (sum of stored total_value)
    const [gmCount] = await db('general_store_materials').count('id as c');
    const [gmVal] = await db('general_store_materials').sum('total_value as v');
    const generalStore = {
      key: 'generalStore',
      label: 'General Store Valuation',
      count: parseInt(gmCount.c || 0, 10),
      value: parseFloat(gmVal.v || 0),
      description: 'Consumables & materials across departments',
      icon: 'package'
    };

    // 2. Printing Machines — fixed assets
    const [pmCount] = await db('printing_assets_machines').count('id as c');
    const [pmVal] = await db('printing_assets_machines').sum('internal_value as v');
    const printingMachines = {
      key: 'printingMachines',
      label: 'Printing Machines Valuation',
      count: parseInt(pmCount.c || 0, 10),
      value: parseFloat(pmVal.v || 0),
      description: 'Registered printing fixed assets (book value)',
      icon: 'printer'
    };

    // 3. Pharmacy Store & Stock — valuation uses drugs.unit_price (selling), matching the sub-page
    const storeRows = await db('store_inventory as si')
      .join('drugs as d', 'si.drug_id', 'd.id')
      .select(db.raw('COALESCE(si.quantity,0) as qty'), db.raw('COALESCE(d.unit_price,0) as price'));
    const storeValue = storeRows.reduce((s, r) => s + parseFloat(r.qty || 0) * parseFloat(r.price || 0), 0);
    const storeCount = storeRows.length;

    const stockRows = await db('pharmacy_inventory as i')
      .join('drugs as d', 'i.drug_id', 'd.id')
      .select(db.raw('COALESCE(i.quantity,0) as qty'), db.raw('COALESCE(d.unit_price,0) as price'));
    const stockValue = stockRows.reduce((s, r) => s + parseFloat(r.qty || 0) * parseFloat(r.price || 0), 0);
    const stockCount = stockRows.length;

    const pharmacy = {
      key: 'pharmacy',
      label: 'Pharmacy Store & Stock',
      count: storeCount + stockCount,
      value: storeValue + stockValue,
      description: `Medical store (${storeCount}) + pharmacy shelf (${stockCount}) stock`,
      icon: 'pill',
      breakdown: [
        { label: 'Medical Store', count: storeCount, value: storeValue },
        { label: 'Pharmacy Stock', count: stockCount, value: stockValue },
      ]
    };

    // 4. Vehicle & Rental Assets
    const vehicles = await db('cars').select('asset_value', 'deleted_at');
    const vehicleCount = vehicles.length;
    const publishedVehicles = vehicles.filter(v => !v.deleted_at).length;
    const vehicleValue = vehicles.reduce((s, v) => s + parseFloat(v.asset_value || 0), 0);
    const vehiclesCat = {
      key: 'vehicles',
      label: 'Vehicle & Rental Assets',
      count: vehicleCount,
      value: vehicleValue,
      published: publishedVehicles,
      description: `${publishedVehicles} published of ${vehicleCount} registered`,
      icon: 'car'
    };

    // 5. Tractor Assets
    const tractors = await db('tractors').select('asset_value', 'deleted_at');
    const tractorCount = tractors.length;
    const publishedTractors = tractors.filter(t => !t.deleted_at).length;
    const tractorValue = tractors.reduce((s, t) => s + parseFloat(t.asset_value || 0), 0);
    const tractorsCat = {
      key: 'tractors',
      label: 'Tractor Assets',
      count: tractorCount,
      value: tractorValue,
      published: publishedTractors,
      description: `${publishedTractors} published of ${tractorCount} registered`,
      icon: 'truck'
    };

    const categories = [generalStore, printingMachines, pharmacy, vehiclesCat, tractorsCat];
    const grandTotal = categories.reduce((s, c) => s + c.value, 0);

    return res.json({
      status: 'success',
      data: {
        computedAt: new Date(),
        categories,
        grandTotal,
        totals: {
          generalStore: generalStore.value,
          printingMachines: printingMachines.value,
          pharmacy: pharmacy.value,
          vehicles: vehiclesCat.value,
          tractors: tractorsCat.value,
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
