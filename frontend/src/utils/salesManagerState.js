// Mock state for Sales Manager Dashboard to ensure full UI functionality
import { playSound } from './printingSound';
import { SALE_NOTIFICATIONS } from './salesNotifications';

// Utility for formatting cents
export const formatCents = (cents, currency = 'ETB') => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(cents / 100);
};

// Seed Data
let customers = [
  { id: 'CUST-001', name: 'Abebe Kebede', phone: '0911223344', email: 'abebe@example.com', address: 'Bole, Addis Ababa', tax_id: 'TIN-123456', type: 'credit', credit_limit_cents: 5000000, payment_terms_days: 30, created_at: new Date('2026-01-10').toISOString() },
  { id: 'CUST-002', name: 'Sara Bekele', phone: '0922334455', email: 'sara@example.com', address: 'Piassa, Addis Ababa', tax_id: 'TIN-654321', type: 'walk_in', credit_limit_cents: 0, payment_terms_days: 0, created_at: new Date('2026-02-15').toISOString() },
  { id: 'CUST-003', name: 'XYZ Trading PLC', phone: '0112233445', email: 'info@xyztrading.com', address: 'Merkato, Addis Ababa', tax_id: 'TIN-987654', type: 'wholesale', credit_limit_cents: 20000000, payment_terms_days: 45, created_at: new Date('2026-03-01').toISOString() },
  { id: 'CUST-004', name: 'Dawit Tadesse', phone: '0933445566', email: 'dawit@example.com', address: 'CMC, Addis Ababa', tax_id: null, type: 'credit', credit_limit_cents: 1000000, payment_terms_days: 15, created_at: new Date('2026-04-20').toISOString() },
];

let products = [
  { id: 'PROD-001', name: 'Office Desk', sku: 'OD-100', unit_price_cents: 850000, bulk_price_cents: 800000, bulk_min_qty: 10, category: 'Furniture', is_service: false, status: 'active', cost_price_cents: 400000 },
  { id: 'PROD-002', name: 'Ergonomic Chair', sku: 'EC-200', unit_price_cents: 450000, bulk_price_cents: 420000, bulk_min_qty: 20, category: 'Furniture', is_service: false, status: 'active', cost_price_cents: 200000 },
  { id: 'PROD-003', name: 'Laptop Pro 15"', sku: 'LP-300', unit_price_cents: 12000000, bulk_price_cents: null, bulk_min_qty: null, category: 'Electronics', is_service: false, status: 'active', cost_price_cents: 10000000 },
  { id: 'PROD-012', name: 'IT Support Hourly', sku: 'ITS-1200', unit_price_cents: 100000, bulk_price_cents: null, bulk_min_qty: null, category: 'Services', is_service: true, status: 'active', cost_price_cents: null },
];

let stockLevels = [
  { id: 'STK-001', product_id: 'PROD-001', location: 'warehouse', quantity_on_hand: 50, reorder_threshold: 10, updated_at: new Date().toISOString() },
  { id: 'STK-002', product_id: 'PROD-001', location: 'store', quantity_on_hand: 5, reorder_threshold: 5, updated_at: new Date().toISOString() },
  { id: 'STK-003', product_id: 'PROD-002', location: 'warehouse', quantity_on_hand: 120, reorder_threshold: 30, updated_at: new Date().toISOString() },
  { id: 'STK-004', product_id: 'PROD-003', location: 'store', quantity_on_hand: 2, reorder_threshold: 5, updated_at: new Date().toISOString() }, // Below threshold
];

let promotions = [
  { id: 'PROM-001', promotion_number: 'PR-1001', name: 'Summer Sale', description: '10% off furniture', discount_type: 'percentage', discount_value: 10, start_date: new Date(Date.now() - 86400000 * 10).toISOString(), end_date: new Date(Date.now() + 86400000 * 20).toISOString(), deactivated_at: null },
  { id: 'PROM-002', promotion_number: 'PR-1002', name: 'Back to School', description: 'Flat 500 ETB off electronics', discount_type: 'fixed', discount_value: 50000, start_date: new Date(Date.now() + 86400000 * 15).toISOString(), end_date: new Date(Date.now() + 86400000 * 45).toISOString(), deactivated_at: null },
  { id: 'PROM-003', promotion_number: 'PR-1003', name: 'Old Stock Clearance', description: '20% off', discount_type: 'percentage', discount_value: 20, start_date: new Date(Date.now() - 86400000 * 60).toISOString(), end_date: new Date(Date.now() - 86400000 * 10).toISOString(), deactivated_at: null },
];

let promotionProducts = [
  { id: 'PP-001', promotion_id: 'PROM-001', product_id: 'PROD-001' },
  { id: 'PP-002', promotion_id: 'PROM-001', product_id: 'PROD-002' },
  { id: 'PP-003', promotion_id: 'PROM-002', product_id: 'PROD-003' },
];

// Helper to generate IDs
const generateId = (prefix) => {
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${num}`;
};

// Documents
let quotations = [
  { id: 'QUOT-2026-0001', quotation_number: 'QT-2026-0001', customer_id: 'CUST-001', status: 'accepted', validity_until: '2026-07-15', terms: 'Payment on delivery', subtotal_cents: 1300000, tax_cents: 195000, total_cents: 1495000, created_by: 'Admin', created_at: new Date('2026-06-20').toISOString() },
  { id: 'QUOT-2026-0002', quotation_number: 'QT-2026-0002', customer_id: 'CUST-003', status: 'pending_approval', validity_until: '2026-07-20', terms: 'Net 30', subtotal_cents: 24000000, tax_cents: 3600000, total_cents: 27600000, created_by: 'Admin', created_at: new Date('2026-06-28').toISOString() },
];

let quotationLines = [
  { id: 'QL-001', quotation_id: 'QUOT-2026-0001', product_id: 'PROD-001', description: 'Office Desk', qty: 1, unit_price_cents: 850000, discount_cents: 0, line_total_cents: 850000 },
];

let orders = [
  { id: 'ORD-2026-0001', order_number: 'SO-2026-0001', customer_id: 'CUST-001', source_quotation_id: 'QUOT-2026-0001', order_type: 'online', status: 'completed', cancel_reason: null, total_cents: 1495000, created_at: new Date('2026-06-25').toISOString() },
];

let sales = [
  { id: 'SALE-2026-0001', sale_number: 'SL-2026-0001', customer_id: 'CUST-001', source_order_id: 'ORD-2026-0001', payment_type: 'credit', subtotal_cents: 1300000, discount_cents: 0, tax_cents: 195000, total_cents: 1495000, amount_received_cents: 0, balance_due_cents: 1495000, status: 'completed', department: 'printing', created_by: 'Admin', created_at: new Date('2026-06-26').toISOString() },
  { id: 'SALE-2026-0002', sale_number: 'SL-2026-0002', customer_id: 'CUST-004', source_order_id: null, payment_type: 'credit', subtotal_cents: 2500000, discount_cents: 0, tax_cents: 375000, total_cents: 2875000, amount_received_cents: 0, balance_due_cents: 2875000, status: 'pending_approval', department: 'pharmacy', created_by: 'Cashier 1', created_at: new Date().toISOString() }, // Over limit
];

let saleLines = [
  { id: 'SLINE-001', sale_id: 'SALE-2026-0001', product_id: 'PROD-001', qty: 1, unit_price_cents: 850000, discount_cents: 0, line_total_cents: 850000 },
];

let invoices = [
  { id: 'INV-2026-0001', invoice_number: 'INV-2026-0001', sale_id: 'SALE-2026-0001', customer_id: 'CUST-001', status: 'unpaid', due_date: new Date(Date.now() - 86400000 * 5).toISOString(), total_cents: 1495000, amount_paid_cents: 500000, created_at: new Date('2026-06-26').toISOString() }, // Overdue
];

let payments = [
  { id: 'PAY-001', payment_number: 'PMT-1001', customer_id: 'CUST-001', invoice_id: 'INV-2026-0001', amount_cents: 500000, method: 'bank', bank_name: 'CBE', bank_account_holder: 'Abebe Kebede', bank_account_number: '1000123456789', bank_phone: null, telbir_number: null, telbir_full_name: null, telbir_phone: null, received_by: 'Admin', created_at: new Date('2026-06-28').toISOString() },
  { id: 'PAY-002', payment_number: 'PMT-1002', customer_id: 'CUST-002', invoice_id: null, amount_cents: 1035000, method: 'cash', bank_name: null, bank_account_holder: null, bank_account_number: null, bank_phone: null, telbir_number: null, telbir_full_name: null, telbir_phone: null, received_by: 'Admin', created_at: new Date().toISOString() },
  { id: 'PAY-003', payment_number: 'PMT-1003', customer_id: 'CUST-003', invoice_id: null, amount_cents: 250000, method: 'telbir', bank_name: null, bank_account_holder: null, bank_account_number: null, bank_phone: null, telbir_number: '0911223344', telbir_full_name: 'XYZ Trading', telbir_phone: '0911223344', received_by: 'Admin', created_at: new Date().toISOString() },
];

let returns = [];
let returnLines = [];

let approvalRequests = [
  { id: 'APP-001', request_number: 'REQ-1001', type: 'quotation', source_entity_type: 'quotation', source_entity_id: 'QUOT-2026-0002', customer_id: 'CUST-003', amount_cents: 27600000, status: 'pending', requested_by: 'Admin', requested_at: new Date('2026-06-28').toISOString(), decided_by: null, decided_at: null, rejection_reason: null, stamp_id: null },
  { id: 'APP-002', request_number: 'REQ-1002', type: 'credit_sale', source_entity_type: 'sale', source_entity_id: 'SALE-2026-0002', customer_id: 'CUST-004', amount_cents: 2875000, status: 'pending', requested_by: 'Admin', requested_at: new Date().toISOString(), decided_by: null, decided_at: null, rejection_reason: null, stamp_id: null }, // Triggered by limit breach
];

let auditLogs = [
  { id: 'AUD-001', entity_type: 'Quotation', entity_id: 'QUOT-2026-0001', action: 'CREATED', actor_id: 'Admin', diff: null, created_at: new Date('2026-06-20').toISOString() }
];

export const salesState = {
  // --- Getters ---
  getCustomers: () => [...customers],
  getProducts: () => [...products],
  getStockLevels: () => [...stockLevels],
  getPromotions: () => promotions.map(p => {
    let computed_status = 'active';
    const now = new Date();
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    if (p.deactivated_at) computed_status = 'deactivated';
    else if (now < start) computed_status = 'scheduled';
    else if (now > end) computed_status = 'expired';
    return { ...p, computed_status };
  }),
  getQuotations: () => quotations.map(q => ({ ...q, lines: quotationLines.filter(l => l.quotation_id === q.id) })),
  getOrders: () => [...orders],
  getSales: () => sales.map(s => ({ ...s, lines: saleLines.filter(l => l.sale_id === s.id) })),
  
  getInvoices: () => invoices.map(inv => {
    const isOverdue = inv.status === 'unpaid' && new Date(inv.due_date) < new Date();
    return { ...inv, computed_status: isOverdue ? 'overdue' : inv.status };
  }),
  
  getPayments: () => [...payments],
  getReturns: () => returns.map(r => ({ ...r, lines: returnLines.filter(l => l.return_id === r.id) })),
  getApprovalRequests: () => [...approvalRequests],
  getAuditLogs: () => [...auditLogs],

  getCustomerStatement: (customerId, from, to) => {
    let transactions = [];
    
    sales.filter(s => s.customer_id === customerId && s.status === 'completed').forEach(s => {
       transactions.push({ date: s.created_at, type: 'Sale', ref: s.sale_number, debit_cents: s.total_cents, credit_cents: 0 });
    });
    
    payments.filter(p => p.customer_id === customerId).forEach(p => {
        transactions.push({ date: p.created_at, type: 'Payment', ref: p.payment_number, debit_cents: 0, credit_cents: p.amount_cents });
    });

    returns.filter(r => r.customer_id === customerId && r.status === 'approved').forEach(r => {
        transactions.push({ date: r.created_at, type: 'Return', ref: r.return_number, debit_cents: 0, credit_cents: r.refund_amount_cents });
    });

    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let balance = 0;
    transactions = transactions.map(t => {
      balance += t.debit_cents - t.credit_cents;
      return { ...t, balance_cents: balance };
    });

    if (from) transactions = transactions.filter(t => new Date(t.date) >= new Date(from));
    if (to) transactions = transactions.filter(t => new Date(t.date) <= new Date(to));

    return { customer_id: customerId, transactions, closing_balance_cents: balance };
  },

  getDashboardSummary: () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const todaySales = sales.filter(s => s.created_at.startsWith(today) && s.status === 'completed');
    const todaySalesCents = todaySales.reduce((sum, s) => sum + s.total_cents, 0);
    
    const revenueMtdCents = sales.filter(s => s.created_at.startsWith(thisMonth) && s.status === 'completed').reduce((sum, s) => sum + s.total_cents, 0);
    const outstandingCreditCents = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents), 0);

    return {
      todaySalesCents,
      todayOrders: orders.filter(o => o.created_at.startsWith(today)).length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      totalCustomers: customers.length,
      creditCustomers: customers.filter(c => c.type === 'credit' || c.type === 'wholesale').length,
      outstandingCreditCents,
      revenueMtdCents,
      revenueGrowthPct: 15.4,
      salesTarget: { targetCents: 50000000, achievedCents: revenueMtdCents },
      topProductsToday: [
        { productId: 'PROD-001', name: 'Office Desk', qtySold: 5 },
      ]
    };
  },

  // --- Reports Aggregation Engine ---
  generateReport: (params) => {
    const { dateFrom, dateTo, granularity = 'day', department, customerId, productCategory, paymentMethod, groupBy = [] } = params;
    
    // 1. Filter Sales
    let filteredSales = sales.filter(s => s.status === 'completed');
    if (dateFrom) filteredSales = filteredSales.filter(s => new Date(s.created_at) >= new Date(dateFrom));
    if (dateTo) filteredSales = filteredSales.filter(s => new Date(s.created_at) <= new Date(dateTo));
    if (department) filteredSales = filteredSales.filter(s => s.department === department);
    if (customerId) filteredSales = filteredSales.filter(s => s.customer_id === customerId);
    if (paymentMethod) filteredSales = filteredSales.filter(s => s.payment_type === paymentMethod);

    const saleIds = new Set(filteredSales.map(s => s.id));

    // 2. Filter Lines & Join Products
    let filteredLines = saleLines.filter(l => saleIds.has(l.sale_id)).map(l => {
      const prod = products.find(p => p.id === l.product_id);
      const sale = filteredSales.find(s => s.id === l.sale_id);
      return {
          ...l,
          product_name: prod ? prod.name : 'Unknown',
          product_category: prod ? prod.category : 'Unknown',
          cost_price_cents: prod ? prod.cost_price_cents : null,
          sale_date: sale.created_at,
          sale_department: sale.department,
          sale_payment_type: sale.payment_type,
          sale_created_by: sale.created_by,
          customer_id: sale.customer_id
      };
    });

    if (productCategory) {
        filteredLines = filteredLines.filter(l => l.product_category === productCategory);
    }

    // 3. Overall Metrics
    const totalSalesCents = filteredSales.reduce((sum, s) => sum + s.total_cents, 0);
    const transactionCount = filteredSales.length;
    const averageTransactionValueCents = transactionCount > 0 ? Math.round(totalSalesCents / transactionCount) : 0;
    
    // Profit & Margin (ignoring lines without cost)
    let totalGrossProfitCents = 0;
    let profitIncludedRevenueCents = 0;
    let missingCostFlags = false;

    filteredLines.forEach(l => {
        if (l.cost_price_cents != null) {
            totalGrossProfitCents += l.line_total_cents - (l.qty * l.cost_price_cents);
            profitIncludedRevenueCents += l.line_total_cents;
        } else {
            missingCostFlags = true;
        }
    });
    
    const grossMarginPct = profitIncludedRevenueCents > 0 ? (totalGrossProfitCents / profitIncludedRevenueCents) * 100 : 0;

    // 4. Growth Calculation Helper
    const calculateGrowth = () => {
        if (!dateFrom || !dateTo) return null; // Needs explicit window
        const df = new Date(dateFrom);
        const dt = new Date(dateTo);
        const duration = dt - df;
        const priorStart = new Date(df.getTime() - duration);
        const priorEnd = new Date(dt.getTime() - duration);

        let priorSales = sales.filter(s => s.status === 'completed' && new Date(s.created_at) >= priorStart && new Date(s.created_at) <= priorEnd);
        if (department) priorSales = priorSales.filter(s => s.department === department);
        
        const priorTotal = priorSales.reduce((sum, s) => sum + s.total_cents, 0);
        if (priorTotal === 0) return null; // N/A to avoid Infinity
        
        return ((totalSalesCents - priorTotal) / priorTotal) * 100;
    };

    // 5. Groupings
    const groupings = {};
    
    groupBy.forEach(field => {
        const groupMap = new Map();
        
        if (field === 'time') {
            filteredSales.forEach(s => {
                const d = new Date(s.created_at);
                let key;
                if (granularity === 'hour') key = d.getHours().toString().padStart(2, '0') + ':00';
                else if (granularity === 'day') key = d.toISOString().split('T')[0];
                else if (granularity === 'month') key = d.toISOString().substring(0, 7);
                else key = d.toISOString();

                const current = groupMap.get(key) || { revenue: 0, count: 0 };
                groupMap.set(key, { revenue: current.revenue + s.total_cents, count: current.count + 1 });
            });
        } else if (field === 'department') {
            filteredSales.forEach(s => {
                const current = groupMap.get(s.department || 'other') || { revenue: 0, count: 0 };
                groupMap.set(s.department || 'other', { revenue: current.revenue + s.total_cents, count: current.count + 1 });
            });
        } else if (field === 'paymentMethod') {
             filteredSales.forEach(s => {
                const current = groupMap.get(s.payment_type) || { revenue: 0, count: 0 };
                groupMap.set(s.payment_type, { revenue: current.revenue + s.total_cents, count: current.count + 1 });
            });
        } else if (field === 'cashier') {
            filteredSales.forEach(s => {
                const current = groupMap.get(s.created_by) || { revenue: 0, count: 0 };
                groupMap.set(s.created_by, { revenue: current.revenue + s.total_cents, count: current.count + 1 });
            });
        } else if (field === 'product') {
            filteredLines.forEach(l => {
                const current = groupMap.get(l.product_id) || { name: l.product_name, category: l.product_category, revenue: 0, qty: 0, profit: 0 };
                const cost = l.cost_price_cents != null ? l.cost_price_cents * l.qty : 0;
                groupMap.set(l.product_id, {
                    name: l.product_name,
                    category: l.product_category,
                    revenue: current.revenue + l.line_total_cents,
                    qty: current.qty + l.qty,
                    profit: l.cost_price_cents != null ? current.profit + (l.line_total_cents - cost) : current.profit
                });
            });
        } else if (field === 'customer') {
            filteredSales.forEach(s => {
                const cust = customers.find(c => c.id === s.customer_id);
                const current = groupMap.get(s.customer_id) || { name: cust?.name, type: cust?.type, revenue: 0, count: 0 };
                groupMap.set(s.customer_id, { name: cust?.name, type: cust?.type, revenue: current.revenue + s.total_cents, count: current.count + 1 });
            });
        }
        
        groupings[field] = Array.from(groupMap.entries()).map(([key, val]) => ({ key, ...val }));
    });

    return {
        metrics: {
            totalSalesCents,
            transactionCount,
            averageTransactionValueCents,
            growthPct: calculateGrowth(),
            grossMarginPct,
            missingCostFlags
        },
        groupings,
        rawFilteredSales: filteredSales, // For advanced ops
        rawFilteredLines: filteredLines
    };
  },

  scheduleReport: (reportType, frequency, params) => {
    // Simulates saving a background cron job
    const newSchedule = {
        id: generateId('SCHED'),
        reportType,
        frequency,
        params,
        lastRunAt: null,
        nextRunAt: new Date(Date.now() + 86400000).toISOString() // Fake next day
    };
    auditLogs.push({ id: generateId('AUD'), entity_type: 'ReportSchedule', entity_id: newSchedule.id, action: 'CREATED', actor_id: 'Current User', diff: JSON.stringify({ frequency }), created_at: new Date().toISOString() });
    salesState.notify('INFO'); // Generic fallback
    console.log(`Scheduled ${reportType} report for ${frequency}.`);
    return newSchedule;
  },

  // --- Mutations ---
  notify: (key) => {
    const notif = SALE_NOTIFICATIONS[key];
    if(notif) {
      if(notif.sound) playSound(notif.sound);
    }
  },

  createSale: (saleData, lineItems) => {
    const customer = customers.find(c => c.id === saleData.customer_id);
    if (!customer) throw new Error("Customer not found");

    let subtotal_cents = 0;
    const computedLines = lineItems.map(li => {
      // Apply active promotions here conceptually before calculating line total
      // For mock simplicity, we assume discount_cents is already passed in
      const line_total = (li.unit_price_cents - (li.discount_cents || 0)) * li.qty;
      subtotal_cents += line_total;
      return { ...li, line_total_cents: line_total, id: generateId('SLINE') };
    });

    const total_cents = subtotal_cents - (saleData.discount_cents || 0) + (saleData.tax_cents || 0);
    const amount_received_cents = saleData.amount_received_cents || 0;
    let balance_due_cents = total_cents - amount_received_cents;

    const newSale = {
      id: generateId('SALE'),
      sale_number: `SL-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
      customer_id: saleData.customer_id,
      source_order_id: saleData.source_order_id || null,
      payment_type: saleData.payment_type,
      department: saleData.department || 'other',
      created_by: 'Current User',
      subtotal_cents,
      discount_cents: saleData.discount_cents || 0,
      tax_cents: saleData.tax_cents || 0,
      total_cents,
      amount_received_cents,
      balance_due_cents,
      status: 'completed',
      created_at: new Date().toISOString()
    };

    let needsApproval = false;

    // Credit limit check -> auto trigger approval request instead of hard crash
    if (saleData.payment_type === 'credit') {
      const currentOutstanding = invoices
        .filter(inv => inv.customer_id === customer.id && inv.status === 'unpaid')
        .reduce((sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents), 0);
      
      if (currentOutstanding + total_cents > customer.credit_limit_cents) {
        needsApproval = true;
        newSale.status = 'pending_approval';
      }
    }

    sales.push(newSale);
    computedLines.forEach(l => saleLines.push({ ...l, sale_id: newSale.id }));

    if (needsApproval) {
      const req = {
        id: generateId('APP'),
        request_number: `REQ-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
        type: 'credit_sale',
        source_entity_type: 'sale',
        source_entity_id: newSale.id,
        customer_id: customer.id,
        amount_cents: total_cents,
        status: 'pending',
        requested_by: 'Current User',
        requested_at: new Date().toISOString(),
        decided_by: null, decided_at: null, rejection_reason: null, stamp_id: null
      };
      approvalRequests.push(req);
      salesState.notify('PENDING_APPROVAL');
      return newSale; // Stops here, invoice and payment created on approval
    }

    salesState._finalizeSale(newSale, customer, balance_due_cents, amount_received_cents);
    return newSale;
  },

  _finalizeSale: (newSale, customer, balance_due_cents, amount_received_cents) => {
    if (newSale.payment_type === 'credit' && balance_due_cents > 0) {
      invoices.push({
        id: generateId('INV'),
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
        sale_id: newSale.id,
        customer_id: customer.id,
        status: 'unpaid',
        due_date: new Date(Date.now() + 86400000 * customer.payment_terms_days).toISOString(),
        total_cents: balance_due_cents,
        amount_paid_cents: 0,
        created_at: new Date().toISOString()
      });
    }

    if (amount_received_cents > 0) {
      salesState.receivePayment(null, amount_received_cents, 'cash', {}, customer.id, newSale.id);
    }

    if(newSale.source_order_id) {
        const order = orders.find(o => o.id === newSale.source_order_id);
        if(order) order.status = 'completed';
    }

    salesState.notify('NEW_SALE');
  },

  createQuotation: (data, lines) => {
    let subtotal_cents = 0;
    const computedLines = lines.map(li => {
      const line_total = (li.unit_price_cents - (li.discount_cents || 0)) * li.qty;
      subtotal_cents += line_total;
      return { ...li, line_total_cents: line_total, id: generateId('QL') };
    });
    const total_cents = subtotal_cents - (data.discount_cents || 0) + (data.tax_cents || 0);

    const newQuotation = {
      id: generateId('QUOT'),
      quotation_number: `QT-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
      ...data,
      subtotal_cents,
      total_cents,
      status: 'draft',
      created_at: new Date().toISOString()
    };
    
    // Example approval trigger: large quotations over 10M ETB
    if (total_cents > 1000000000) { 
        newQuotation.status = 'pending_approval';
        approvalRequests.push({
            id: generateId('APP'),
            request_number: `REQ-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
            type: 'quotation',
            source_entity_type: 'quotation',
            source_entity_id: newQuotation.id,
            customer_id: data.customer_id,
            amount_cents: total_cents,
            status: 'pending',
            requested_by: 'Current User',
            requested_at: new Date().toISOString(),
            decided_by: null, decided_at: null, rejection_reason: null, stamp_id: null
        });
        salesState.notify('PENDING_APPROVAL');
    }

    quotations.push(newQuotation);
    computedLines.forEach(l => quotationLines.push({ ...l, quotation_id: newQuotation.id }));
    return newQuotation;
  },

  updateQuotationStatus: (id, status) => {
    const q = quotations.find(q => q.id === id);
    if(q) {
        q.status = status;
        if(status === 'sent') salesState.notify('QUOTE_SENT');
        if(status === 'accepted') salesState.notify('QUOTE_ACCEPTED');
    }
    return q;
  },

  convertQuotationToOrder: (quotationId) => {
    const q = quotations.find(q => q.id === quotationId);
    if(!q) throw new Error("Quotation not found");
    if(q.status !== 'accepted') throw new Error("Only accepted quotations can be converted");
    
    const newOrder = {
      id: generateId('ORD'),
      order_number: `SO-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
      customer_id: q.customer_id,
      source_quotation_id: q.id,
      order_type: 'online',
      status: 'pending',
      cancel_reason: null,
      total_cents: q.total_cents,
      created_at: new Date().toISOString()
    };
    orders.push(newOrder);
    salesState.notify('NEW_SALE'); // Assuming order sound
    return newOrder;
  },

  cancelOrder: (orderId, reason) => {
    const o = orders.find(o => o.id === orderId);
    if(o) {
        o.status = 'cancelled';
        o.cancel_reason = reason;
        salesState.notify('ORDER_CANCELLED_NEW');
    }
    return o;
  },

  // --- Approvals Addendum ---
  processApproval: (requestId, action, reason = null) => {
      const req = approvalRequests.find(a => a.id === requestId);
      if(!req) throw new Error("Request not found");
      if(req.status !== 'pending') throw new Error("Only pending requests can be processed");

      let source = null;
      if (req.source_entity_type === 'sale') source = sales.find(s => s.id === req.source_entity_id);
      if (req.source_entity_type === 'quotation') source = quotations.find(q => q.id === req.source_entity_id);

      if(!source) throw new Error("Source entity no longer exists");
      if(source.status !== 'pending_approval') throw new Error("Source entity is not pending approval");

      req.status = action;
      req.decided_by = 'Manager';
      req.decided_at = new Date().toISOString();

      if (action === 'approved') {
          req.stamp_id = generateId('STAMP');
          auditLogs.push({ id: generateId('AUD'), entity_type: 'Approval', entity_id: req.id, action: 'APPROVED', actor_id: 'Manager', diff: req.stamp_id, created_at: new Date().toISOString() });
          
          if (req.source_entity_type === 'sale') {
              source.status = 'completed';
              salesState._finalizeSale(source, customers.find(c => c.id === source.customer_id), source.balance_due_cents, source.amount_received_cents);
          } else if (req.source_entity_type === 'quotation') {
              source.status = 'draft';
          }
          salesState.notify('APPROVAL_APPROVED');
      } else {
          req.rejection_reason = reason;
          source.status = 'rejected';
          salesState.notify('APPROVAL_REJECTED');
      }
      return req;
  },

  // --- Payments Addendum ---
  receivePayment: (invoiceId, amountCents, method, methodDetails, customerId = null, saleId = null) => {
    if (amountCents <= 0) throw new Error("Amount must be greater than 0");

    let custId = customerId;

    if (invoiceId) {
        const inv = invoices.find(i => i.id === invoiceId);
        if(!inv) throw new Error("Invoice not found");
        custId = inv.customer_id;
        
        // Guard against overpayment
        const remaining = inv.total_cents - inv.amount_paid_cents;
        if (amountCents > remaining) {
            throw new Error(`Overpayment not allowed. Remaining balance is ${formatCents(remaining)}`);
        }

        inv.amount_paid_cents += amountCents;
        if(inv.amount_paid_cents === inv.total_cents) {
            inv.status = 'paid';
        }
    }

    if (method === 'bank' && !methodDetails.bank_account_number) throw new Error("Bank account number is required for bank transfer");
    if (method === 'telbir' && !methodDetails.telbir_number) throw new Error("Telebirr number is required");

    const newPayment = {
        id: generateId('PAY'),
        payment_number: `PMT-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
        customer_id: custId,
        invoice_id: invoiceId || null,
        amount_cents: amountCents,
        method: method,
        bank_name: methodDetails.bank_name || null,
        bank_account_holder: methodDetails.bank_account_holder || null,
        bank_account_number: methodDetails.bank_account_number || null,
        bank_phone: methodDetails.bank_phone || null,
        telbir_number: methodDetails.telbir_number || null,
        telbir_full_name: methodDetails.telbir_full_name || null,
        telbir_phone: methodDetails.telbir_phone || null,
        received_by: 'Current User',
        created_at: new Date().toISOString()
    };
    payments.push(newPayment);
    
    // Create CRV for backward compatibility with base spec if saleId exists
    if(saleId) {
        crvs.push({
            id: generateId('CRV'), crv_number: `CRV-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
            sale_id: saleId, amount_cents: amountCents, created_at: new Date().toISOString()
        });
    }

    salesState.notify('PAYMENT_RECEIVED');
    return newPayment;
  },

  createReturn: (data) => {
    const sourceSale = sales.find(s => s.id === data.source_sale_id);
    if(!sourceSale) throw new Error("Source sale not found");
    if (data.refund_amount_cents > sourceSale.amount_received_cents) {
        throw new Error("Cannot refund more than what was paid.");
    }

    const newReturn = {
        id: generateId('RET'),
        return_number: `RTN-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
        ...data,
        status: 'approved',
        created_at: new Date().toISOString()
    };
    returns.push(newReturn);
    salesState.notify('RETURN_APPROVED'); // assumed generic return approved toast
    return newReturn;
  },
  
  createCustomer: (data) => {
      const newCustomer = { id: generateId('CUST'), ...data, created_at: new Date().toISOString() };
      customers.push(newCustomer);
      salesState.notify('CUSTOMER_ADDED');
      return newCustomer;
  }
};
