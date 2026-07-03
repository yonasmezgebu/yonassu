import { RENTAL_NOTIFICATIONS, playSound } from './rentalNotifications';

// Simple ID generator
const generateId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

// Mock Data Stores
let assets = [
  { id: 'AST-C1', asset_type: 'car', category: 'suv', name: 'Toyota Land Cruiser V8', make: 'Toyota', model: 'Land Cruiser', year: 2023, identifier: 'AA-12345', purchase_date: '2023-01-15', purchase_price_cents: 800000000, daily_rate_cents: 1500000, hourly_rate_cents: null, deposit_amount_cents: 5000000, status: 'available', location: 'Addis Ababa', created_at: '2023-01-15T00:00:00Z' },
  { id: 'AST-C2', asset_type: 'car', category: 'sedan', name: 'Hyundai Elantra', make: 'Hyundai', model: 'Elantra', year: 2022, identifier: 'AA-98765', purchase_date: '2022-06-20', purchase_price_cents: 350000000, daily_rate_cents: 600000, hourly_rate_cents: 80000, deposit_amount_cents: 2000000, status: 'rented', location: 'Addis Ababa', created_at: '2022-06-20T00:00:00Z' },
  { id: 'AST-C3', asset_type: 'car', category: 'van', name: 'Toyota Hiace', make: 'Toyota', model: 'Hiace', year: 2021, identifier: 'AA-44556', purchase_date: '2021-03-10', purchase_price_cents: 450000000, daily_rate_cents: 800000, hourly_rate_cents: 100000, deposit_amount_cents: 2500000, status: 'available', location: 'Addis Ababa', created_at: '2021-03-10T00:00:00Z' },
  { id: 'AST-C4', asset_type: 'car', category: 'truck', name: 'Isuzu NPR', make: 'Isuzu', model: 'NPR', year: 2020, identifier: 'AA-11223', purchase_date: '2020-11-05', purchase_price_cents: 600000000, daily_rate_cents: 1200000, hourly_rate_cents: 150000, deposit_amount_cents: 3000000, status: 'maintenance', location: 'Garage A', created_at: '2020-11-05T00:00:00Z' },
  { id: 'AST-C5', asset_type: 'car', category: 'suv', name: 'Nissan Patrol', make: 'Nissan', model: 'Patrol', year: 2024, identifier: 'AA-99887', purchase_date: '2024-02-01', purchase_price_cents: 900000000, daily_rate_cents: 1800000, hourly_rate_cents: null, deposit_amount_cents: 6000000, status: 'available', location: 'Addis Ababa', created_at: '2024-02-01T00:00:00Z' },
  
  { id: 'AST-A1', asset_type: 'agri_equipment', category: 'tractor', name: 'John Deere 5075E', make: 'John Deere', model: '5075E', year: 2022, identifier: 'SN-JD-001', purchase_date: '2022-08-15', purchase_price_cents: 400000000, daily_rate_cents: 1000000, hourly_rate_cents: 150000, deposit_amount_cents: 2000000, status: 'available', location: 'Bishoftu', created_at: '2022-08-15T00:00:00Z' },
  { id: 'AST-A2', asset_type: 'agri_equipment', category: 'harvester', name: 'Claas Lexion 760', make: 'Claas', model: 'Lexion 760', year: 2021, identifier: 'SN-CL-002', purchase_date: '2021-05-10', purchase_price_cents: 1200000000, daily_rate_cents: 3500000, hourly_rate_cents: null, deposit_amount_cents: 10000000, status: 'rented', location: 'Adama', created_at: '2021-05-10T00:00:00Z' },
  { id: 'AST-A3', asset_type: 'agri_equipment', category: 'plough', name: 'Kverneland Plough', make: 'Kverneland', model: 'PN100', year: 2020, identifier: 'SN-KV-003', purchase_date: '2020-02-20', purchase_price_cents: 50000000, daily_rate_cents: 200000, hourly_rate_cents: 30000, deposit_amount_cents: 500000, status: 'available', location: 'Bishoftu', created_at: '2020-02-20T00:00:00Z' },
  { id: 'AST-A4', asset_type: 'agri_equipment', category: 'sprayer', name: 'Hardi Commander', make: 'Hardi', model: 'Commander', year: 2023, identifier: 'SN-HA-004', purchase_date: '2023-04-12', purchase_price_cents: 250000000, daily_rate_cents: 800000, hourly_rate_cents: 100000, deposit_amount_cents: 1500000, status: 'available', location: 'Hawassa', created_at: '2023-04-12T00:00:00Z' },
  { id: 'AST-A5', asset_type: 'agri_equipment', category: 'tractor', name: 'New Holland T7', make: 'New Holland', model: 'T7', year: 2024, identifier: 'SN-NH-005', purchase_date: '2024-01-05', purchase_price_cents: 600000000, daily_rate_cents: 1400000, hourly_rate_cents: 180000, deposit_amount_cents: 3000000, status: 'available', location: 'Bishoftu', created_at: '2024-01-05T00:00:00Z' },
];

let customers = [
  { id: 'CUST-001', name: 'Abebe Kebede', phone: '0911123456', address: 'Addis Ababa', license_number: 'DL-12345', certification: null },
  { id: 'CUST-002', name: 'Chala Agricultural PLC', phone: '0922234567', address: 'Adama', license_number: 'DL-23456', certification: 'CERT-AGRI-1' },
];

const now = new Date();
const yesterday = new Date(now.getTime() - 86400000);
const tomorrow = new Date(now.getTime() + 86400000);
const nextWeek = new Date(now.getTime() + 7 * 86400000);

let rentalOrders = [
  { id: 'RO-1001', order_number: 'RO-2026-1001', rental_type: 'car', asset_id: 'AST-C2', customer_id: 'CUST-001', status: 'active', cancel_reason: null, start_datetime: yesterday.toISOString(), end_datetime: tomorrow.toISOString(), actual_return_datetime: null, duration_unit: 'days', duration_value: 2, daily_hourly_rate_cents: 600000, additional_services: { insurance: true, fuel: false, operator: false, delivery: false }, subtotal_cents: 1200000, deposit_required_cents: 2000000, total_cost_cents: 1250000, created_by: 'Admin', created_at: yesterday.toISOString() },
  { id: 'RO-1002', order_number: 'RO-2026-1002', rental_type: 'agri', asset_id: 'AST-A2', customer_id: 'CUST-002', status: 'active', cancel_reason: null, start_datetime: yesterday.toISOString(), end_datetime: nextWeek.toISOString(), actual_return_datetime: null, duration_unit: 'days', duration_value: 8, daily_hourly_rate_cents: 3500000, additional_services: { insurance: true, fuel: false, operator: true, delivery: true }, subtotal_cents: 28000000, deposit_required_cents: 10000000, total_cost_cents: 29000000, created_by: 'Admin', created_at: yesterday.toISOString() },
  { id: 'RO-1003', order_number: 'RO-2026-1003', rental_type: 'car', asset_id: 'AST-C1', customer_id: 'CUST-001', status: 'completed', cancel_reason: null, start_datetime: new Date(now.getTime() - 10 * 86400000).toISOString(), end_datetime: new Date(now.getTime() - 8 * 86400000).toISOString(), actual_return_datetime: new Date(now.getTime() - 8 * 86400000).toISOString(), duration_unit: 'days', duration_value: 2, daily_hourly_rate_cents: 1500000, additional_services: {}, subtotal_cents: 3000000, deposit_required_cents: 5000000, total_cost_cents: 3000000, created_by: 'Admin', created_at: new Date(now.getTime() - 11 * 86400000).toISOString() },
];

let pickups = [
  { id: 'PU-1001', rental_order_id: 'RO-1001', deposit_paid_cents: 2000000, amount_paid_cents: 1250000, payment_method: 'bank', pickup_datetime: yesterday.toISOString(), processed_by: 'Admin' },
  { id: 'PU-1002', rental_order_id: 'RO-1002', deposit_paid_cents: 10000000, amount_paid_cents: 29000000, payment_method: 'bank', pickup_datetime: yesterday.toISOString(), processed_by: 'Admin' },
  { id: 'PU-1003', rental_order_id: 'RO-1003', deposit_paid_cents: 5000000, amount_paid_cents: 3000000, payment_method: 'cash', pickup_datetime: new Date(now.getTime() - 10 * 86400000).toISOString(), processed_by: 'Admin' },
];

let returnRecords = [
  { id: 'RT-1003', rental_order_id: 'RO-1003', return_datetime: new Date(now.getTime() - 8 * 86400000).toISOString(), condition_notes: 'Returned in good condition', damage_reported: false, late_fee_cents: 0, additional_charges_cents: 0, refund_deposit_cents: 5000000, processed_by: 'Admin' }
];

let maintenanceRecords = [
  { id: 'MN-1001', asset_id: 'AST-C4', type: 'repair', description: 'Engine knocking noise', cost_cents: 1500000, scheduled_date: yesterday.toISOString(), completion_date: null, status: 'in_progress', created_by: 'Admin' }
];

let assetStatusHistory = [
  { id: 'ASH-1', asset_id: 'AST-C2', previous_status: 'available', new_status: 'rented', reason: 'Pickup processed for RO-1001', changed_by: 'Admin', changed_at: yesterday.toISOString() },
  { id: 'ASH-2', asset_id: 'AST-A2', previous_status: 'available', new_status: 'rented', reason: 'Pickup processed for RO-1002', changed_by: 'Admin', changed_at: yesterday.toISOString() },
  { id: 'ASH-3', asset_id: 'AST-C4', previous_status: 'available', new_status: 'maintenance', reason: 'Maintenance started (MN-1001)', changed_by: 'Admin', changed_at: yesterday.toISOString() },
  { id: 'ASH-4', asset_id: 'AST-C1', previous_status: 'available', new_status: 'rented', reason: 'Pickup processed for RO-1003', changed_by: 'Admin', changed_at: new Date(now.getTime() - 10 * 86400000).toISOString() },
  { id: 'ASH-5', asset_id: 'AST-C1', previous_status: 'rented', new_status: 'available', reason: 'Return processed for RO-1003', changed_by: 'Admin', changed_at: new Date(now.getTime() - 8 * 86400000).toISOString() },
];

// Custom Event Target for triggering re-renders
const stateEventTarget = new EventTarget();

export const rentalState = {
  subscribe: (callback) => {
    stateEventTarget.addEventListener('change', callback);
    return () => stateEventTarget.removeEventListener('change', callback);
  },

  notify: (key) => {
    const notif = RENTAL_NOTIFICATIONS[key];
    if (notif) {
      if (notif.toast && typeof window !== 'undefined' && window.toast) {
        window.toast[notif.type || 'info'](notif.toast);
      }
      playSound(notif.sound);
    }
    stateEventTarget.dispatchEvent(new Event('change'));
  },

  // --- Getters ---
  getAssets: () => [...assets],
  getCustomers: () => [...customers],
  getRentalOrders: () => [...rentalOrders],
  getPickups: () => [...pickups],
  getReturnRecords: () => [...returnRecords],
  getMaintenanceRecords: () => [...maintenanceRecords],
  getAssetStatusHistory: () => [...assetStatusHistory],

  // --- Core Methods & Status Machine Transitions ---
  
  // 1. Log Status History (Internal)
  _logStatusChange: (assetId, oldStatus, newStatus, reason) => {
    assetStatusHistory.push({
      id: generateId('ASH'),
      asset_id: assetId,
      previous_status: oldStatus,
      new_status: newStatus,
      reason,
      changed_by: 'Current User',
      changed_at: new Date().toISOString()
    });
  },

  // 2. Overlap Checker
  checkOverlap: (assetId, reqStart, reqEnd, excludeOrderId = null) => {
    const s = new Date(reqStart);
    const e = new Date(reqEnd);
    return rentalOrders.some(ro => {
      if (excludeOrderId && ro.id === excludeOrderId) return false;
      if (ro.asset_id !== assetId) return false;
      if (!['pending', 'confirmed', 'active'].includes(ro.status)) return false;
      const roStart = new Date(ro.start_datetime);
      const roEnd = new Date(ro.end_datetime);
      return (roStart < e && roEnd > s); // Overlap logic
    });
  },

  // 3. New Order (Advance or Immediate)
  createOrder: (orderData, isImmediatePickup = false) => {
    // 3a. Validation
    const asset = assets.find(a => a.id === orderData.asset_id);
    if (!asset) throw new Error("Asset not found");
    const customer = customers.find(c => c.id === orderData.customer_id);
    if (!customer) throw new Error("Customer not found");

    if (asset.asset_type === 'car' && !customer.license_number) {
        throw new Error("License number is required for car rentals.");
    }

    if (rentalState.checkOverlap(asset.id, orderData.start_datetime, orderData.end_datetime)) {
        throw new Error("Asset is not available for the requested dates. Overlap detected.");
    }

    if (isImmediatePickup && asset.status !== 'available') {
        throw new Error("Cannot process immediate pickup on asset that is not currently 'available'.");
    }

    // 3b. Calculations
    const start = new Date(orderData.start_datetime);
    const end = new Date(orderData.end_datetime);
    let durationValue = 0;
    
    if (orderData.duration_unit === 'days') {
        durationValue = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (durationValue === 0) durationValue = 1; // Minimum 1 day
    } else {
        durationValue = Math.ceil((end - start) / (1000 * 60 * 60));
        if (durationValue === 0) durationValue = 1;
    }

    const rate = orderData.duration_unit === 'days' ? asset.daily_rate_cents : asset.hourly_rate_cents;
    if (!rate) throw new Error(`Asset does not have a defined rate for ${orderData.duration_unit}`);

    const subtotal = rate * durationValue;
    
    // Simplistic add-on costs for demo
    let addOnCost = 0;
    if (orderData.additional_services?.insurance) addOnCost += 50000;
    if (orderData.additional_services?.operator) addOnCost += 150000 * durationValue;

    const newOrder = {
      id: generateId('RO'),
      order_number: `RO-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
      rental_type: asset.asset_type,
      asset_id: asset.id,
      customer_id: customer.id,
      status: isImmediatePickup ? 'active' : 'pending',
      cancel_reason: null,
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      actual_return_datetime: null,
      duration_unit: orderData.duration_unit,
      duration_value: durationValue,
      daily_hourly_rate_cents: rate,
      additional_services: orderData.additional_services || {},
      subtotal_cents: subtotal,
      deposit_required_cents: asset.deposit_amount_cents,
      total_cost_cents: subtotal + addOnCost,
      created_by: 'Current User',
      created_at: new Date().toISOString()
    };

    rentalOrders.push(newOrder);

    // If immediate, process pickup silently inside transaction
    if (isImmediatePickup) {
        if (!orderData.payment_details) throw new Error("Payment details required for immediate pickup.");
        
        pickups.push({
            id: generateId('PU'),
            rental_order_id: newOrder.id,
            deposit_paid_cents: newOrder.deposit_required_cents,
            amount_paid_cents: newOrder.total_cost_cents,
            payment_method: orderData.payment_details.method,
            pickup_datetime: new Date().toISOString(),
            processed_by: 'Current User'
        });

        // Flip Asset Status
        const oldStatus = asset.status;
        asset.status = 'rented';
        rentalState._logStatusChange(asset.id, oldStatus, 'rented', `Pickup processed for ${newOrder.order_number}`);
    }

    return newOrder;
  },

  // 4. Process Pickup (on existing pending/confirmed order)
  processPickup: (orderId, paymentMethod) => {
    const order = rentalOrders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    if (!['pending', 'confirmed'].includes(order.status)) throw new Error("Order is not pending/confirmed");

    const asset = assets.find(a => a.id === order.asset_id);
    if (asset.status !== 'available') throw new Error("Asset is currently not available for pickup");

    // Transition
    order.status = 'active';

    pickups.push({
        id: generateId('PU'),
        rental_order_id: order.id,
        deposit_paid_cents: order.deposit_required_cents,
        amount_paid_cents: order.total_cost_cents,
        payment_method: paymentMethod,
        pickup_datetime: new Date().toISOString(),
        processed_by: 'Current User'
    });

    const oldStatus = asset.status;
    asset.status = 'rented';
    rentalState._logStatusChange(asset.id, oldStatus, 'rented', `Pickup processed for ${order.order_number}`);
  },

  // 5. Process Return
  processReturn: (orderId, returnData) => {
    const order = rentalOrders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== 'active') throw new Error("Order is not active");

    const asset = assets.find(a => a.id === order.asset_id);
    const actualReturnDate = new Date(returnData.return_datetime || new Date());
    const startDate = new Date(order.start_datetime);
    const expectedEndDate = new Date(order.end_datetime);

    if (actualReturnDate < startDate) throw new Error("Return date cannot be before start date");

    order.actual_return_datetime = actualReturnDate.toISOString();
    
    // Calculate Late Fee (Demo logic: 1.5x daily rate per day late)
    let lateFee = 0;
    if (actualReturnDate > expectedEndDate) {
        const daysLate = Math.ceil((actualReturnDate - expectedEndDate) / (1000 * 60 * 60 * 24));
        if (order.duration_unit === 'days') lateFee = daysLate * order.daily_hourly_rate_cents * 1.5;
    }

    const addCharges = returnData.additional_charges_cents || 0;
    
    const pickup = pickups.find(p => p.rental_order_id === order.id);
    const depositPaid = pickup ? pickup.deposit_paid_cents : 0;
    
    // Floor refund at 0
    let refund = depositPaid - lateFee - addCharges;
    if (refund < 0) refund = 0;
    
    returnRecords.push({
        id: generateId('RT'),
        rental_order_id: order.id,
        return_datetime: actualReturnDate.toISOString(),
        condition_notes: returnData.condition_notes,
        damage_reported: returnData.damage_reported,
        late_fee_cents: lateFee,
        additional_charges_cents: addCharges,
        refund_deposit_cents: refund,
        processed_by: 'Current User'
    });

    order.status = 'completed';

    // Flip asset status
    const oldStatus = asset.status;
    const newStatus = returnData.damage_reported ? 'maintenance' : 'available';
    asset.status = newStatus;
    rentalState._logStatusChange(asset.id, oldStatus, newStatus, `Return processed for ${order.order_number}. Damage: ${returnData.damage_reported}`);
    
    // If damage reported, auto-create maintenance record
    if (returnData.damage_reported) {
        maintenanceRecords.push({
            id: generateId('MN'),
            asset_id: asset.id,
            type: 'repair',
            description: `Auto-generated from damage report on ${order.order_number}`,
            cost_cents: 0,
            scheduled_date: new Date().toISOString(),
            completion_date: null,
            status: 'in_progress',
            created_by: 'System'
        });
    }
  },

  // 6. Cancel Order
  cancelOrder: (orderId, reason) => {
    const order = rentalOrders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    if (!['pending', 'confirmed'].includes(order.status)) throw new Error("Only pending or confirmed orders can be cancelled");
    if (!reason) throw new Error("Cancellation reason required");

    order.status = 'cancelled';
    order.cancel_reason = reason;
  },

  // 7. Maintenance
  createMaintenance: (data) => {
    const asset = assets.find(a => a.id === data.asset_id);
    
    const rec = {
      id: generateId('MN'),
      ...data,
      created_by: 'Current User'
    };
    maintenanceRecords.push(rec);

    if (rec.status === 'in_progress' && asset.status !== 'maintenance') {
        const oldStatus = asset.status;
        asset.status = 'maintenance';
        rentalState._logStatusChange(asset.id, oldStatus, 'maintenance', `Maintenance started (${rec.id})`);
    }
  },

  completeMaintenance: (recordId) => {
      const rec = maintenanceRecords.find(m => m.id === recordId);
      if (!rec) throw new Error("Record not found");
      rec.status = 'completed';
      rec.completion_date = new Date().toISOString();

      const asset = assets.find(a => a.id === rec.asset_id);
      if (asset && asset.status === 'maintenance') {
          asset.status = 'available';
          rentalState._logStatusChange(asset.id, 'maintenance', 'available', `Maintenance completed (${rec.id})`);
      }
  },
  
  // 8. Add Asset
  addAsset: (data) => {
      const newAsset = {
          id: generateId('AST'),
          ...data,
          status: 'available',
          created_at: new Date().toISOString()
      };
      assets.push(newAsset);
      return newAsset;
  },

  // --- Reports Aggregation Engine ---
  generateRentalReport: (params) => {
    const { dateFrom, dateTo, assetType, customerId, groupBy = [] } = params;
    
    // 1. Filter Completed Orders
    let filteredOrders = rentalOrders.filter(o => o.status === 'completed');
    if (dateFrom) filteredOrders = filteredOrders.filter(o => new Date(o.end_datetime) >= new Date(dateFrom));
    if (dateTo) filteredOrders = filteredOrders.filter(o => new Date(o.end_datetime) <= new Date(dateTo));
    if (assetType) filteredOrders = filteredOrders.filter(o => o.rental_type === assetType);
    if (customerId) filteredOrders = filteredOrders.filter(o => o.customer_id === customerId);

    // 2. Metrics
    const totalRentals = filteredOrders.length;
    const totalRevenueCents = filteredOrders.reduce((sum, o) => sum + o.total_cost_cents, 0);
    const totalRentalDays = filteredOrders.reduce((sum, o) => {
        if (o.duration_unit === 'days') return sum + o.duration_value;
        return sum + Math.ceil(o.duration_value / 24); // Convert hours to days
    }, 0);

    // 3. Growth Calculator (Revenue)
    const calculateGrowth = () => {
        if (!dateFrom || !dateTo) return null;
        const df = new Date(dateFrom);
        const dt = new Date(dateTo);
        const duration = dt - df;
        const priorStart = new Date(df.getTime() - duration);
        const priorEnd = new Date(dt.getTime() - duration);

        let priorOrders = rentalOrders.filter(o => o.status === 'completed' && new Date(o.end_datetime) >= priorStart && new Date(o.end_datetime) <= priorEnd);
        if (assetType) priorOrders = priorOrders.filter(o => o.rental_type === assetType);
        
        const priorTotal = priorOrders.reduce((sum, o) => sum + o.total_cost_cents, 0);
        if (priorTotal === 0) return null; 
        
        return ((totalRevenueCents - priorTotal) / priorTotal) * 100;
    };

    // 4. Groupings
    const groupings = {};
    
    groupBy.forEach(field => {
        const groupMap = new Map();
        
        if (field === 'asset') {
            filteredOrders.forEach(o => {
                const asset = assets.find(a => a.id === o.asset_id);
                const current = groupMap.get(o.asset_id) || { name: asset?.name, type: asset?.asset_type, category: asset?.category, revenue: 0, rental_days: 0, rentals: 0 };
                groupMap.set(o.asset_id, {
                    name: asset?.name, type: asset?.asset_type, category: asset?.category,
                    revenue: current.revenue + o.total_cost_cents,
                    rental_days: current.rental_days + (o.duration_unit === 'days' ? o.duration_value : Math.ceil(o.duration_value/24)),
                    rentals: current.rentals + 1
                });
            });
        } else if (field === 'customer') {
            filteredOrders.forEach(o => {
                const cust = customers.find(c => c.id === o.customer_id);
                const current = groupMap.get(o.customer_id) || { name: cust?.name, revenue: 0, rentals: 0 };
                groupMap.set(o.customer_id, { name: cust?.name, revenue: current.revenue + o.total_cost_cents, rentals: current.rentals + 1 });
            });
        } else if (field === 'time') {
             filteredOrders.forEach(o => {
                const d = new Date(o.end_datetime);
                const key = d.toISOString().substring(0, 7); // month
                const current = groupMap.get(key) || { revenue: 0, rentals: 0 };
                groupMap.set(key, { revenue: current.revenue + o.total_cost_cents, rentals: current.rentals + 1 });
            });
        } else if (field === 'type') {
            filteredOrders.forEach(o => {
                const current = groupMap.get(o.rental_type) || { revenue: 0, rentals: 0 };
                groupMap.set(o.rental_type, { revenue: current.revenue + o.total_cost_cents, rentals: current.rentals + 1 });
            });
        }
        
        groupings[field] = Array.from(groupMap.entries()).map(([key, val]) => ({ key, ...val }));
    });

    return {
        metrics: {
            totalRentals,
            totalRevenueCents,
            totalRentalDays,
            revenueGrowthPct: calculateGrowth()
        },
        groupings,
        rawOrders: filteredOrders
    };
  }
};
