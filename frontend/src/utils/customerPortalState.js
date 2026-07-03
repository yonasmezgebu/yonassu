import { CUSTOMER_NOTIFICATIONS, playSound } from './customerNotifications';

// Simple ID generator
const generateId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

// --- SIMULATED BACKEND SESSION ---
// In a real app, this is determined by the JWT on the backend.
// We hardcode it here to simulate identity-scoped requests.
const SESSION_CUSTOMER_ID = 'CUST-001';

// --- SEED DATA ---
let products = [
  { id: 'PROD-1', name: 'Premium Office Desk', category: 'Furniture', unit_price_cents: 850000, status: 'active', stock_level: 15 },
  { id: 'PROD-2', name: 'Ergonomic Chair', category: 'Furniture', unit_price_cents: 450000, status: 'active', stock_level: 0 }, // Out of stock
  { id: 'PROD-3', name: 'A4 Printer Paper (500 sheets)', category: 'Stationery', unit_price_cents: 60000, status: 'active', stock_level: 200 },
  { id: 'PROD-4', name: 'Laptop Stand', category: 'Accessories', unit_price_cents: 250000, status: 'active', stock_level: 45 },
  { id: 'PROD-5', name: 'Legacy Printer', category: 'Electronics', unit_price_cents: 1200000, status: 'inactive', stock_level: 5 }, // Should not be visible
];

let addresses = [
  { id: 'ADDR-1', customer_id: 'CUST-001', label: 'Home', address_line: 'Bole Road, House 123', city: 'Addis Ababa', is_default: true },
  { id: 'ADDR-2', customer_id: 'CUST-001', label: 'Office', address_line: 'Piassa, Business Center 4th Floor', city: 'Addis Ababa', is_default: false },
  { id: 'ADDR-3', customer_id: 'CUST-002', label: 'Warehouse', address_line: 'Kality', city: 'Addis Ababa', is_default: true }, // Not belonging to CUST-001
];

// Reusing Sale semantics. We call them "Orders" in the UI.
let sales = [
  { id: 'SALE-101', customer_id: 'CUST-001', order_number: 'ORD-2026-101', total_cents: 1300000, created_at: new Date(Date.now() - 5*86400000).toISOString() },
  { id: 'SALE-102', customer_id: 'CUST-001', order_number: 'ORD-2026-102', total_cents: 60000, created_at: new Date(Date.now() - 2*86400000).toISOString() },
  { id: 'SALE-999', customer_id: 'CUST-002', order_number: 'ORD-2026-999', total_cents: 5000000, created_at: new Date().toISOString() }, // Cross-tenant trap
];

let saleLines = [
  { id: 'SL-1', sale_id: 'SALE-101', product_id: 'PROD-1', qty: 1, unit_price_cents: 850000, subtotal_cents: 850000 },
  { id: 'SL-2', sale_id: 'SALE-101', product_id: 'PROD-2', qty: 1, unit_price_cents: 450000, subtotal_cents: 450000 },
  { id: 'SL-3', sale_id: 'SALE-102', product_id: 'PROD-3', qty: 1, unit_price_cents: 60000, subtotal_cents: 60000 },
];

let fulfillments = [
  { id: 'FUL-1', sale_id: 'SALE-101', delivery_option: 'delivery', delivery_address_id: 'ADDR-1', fulfillment_status: 'delivered', expected_delivery_date: new Date(Date.now() - 4*86400000).toISOString(), status_updated_at: new Date(Date.now() - 4*86400000).toISOString() },
  { id: 'FUL-2', sale_id: 'SALE-102', delivery_option: 'pickup', delivery_address_id: null, fulfillment_status: 'processing', expected_delivery_date: new Date(Date.now() + 1*86400000).toISOString(), status_updated_at: new Date(Date.now() - 1*86400000).toISOString() },
];

let invoices = [
  { id: 'INV-101', customer_id: 'CUST-001', sale_id: 'SALE-101', total_cents: 1300000, amount_paid_cents: 1300000, status: 'paid', due_date: new Date(Date.now() - 1*86400000).toISOString() },
  { id: 'INV-102', customer_id: 'CUST-001', sale_id: 'SALE-102', total_cents: 60000, amount_paid_cents: 0, status: 'unpaid', due_date: new Date(Date.now() + 5*86400000).toISOString() }, // Current
  { id: 'INV-103', customer_id: 'CUST-001', sale_id: null, total_cents: 150000, amount_paid_cents: 50000, status: 'overdue', due_date: new Date(Date.now() - 10*86400000).toISOString() }, // Overdue balance
  { id: 'INV-999', customer_id: 'CUST-002', sale_id: 'SALE-999', total_cents: 5000000, amount_paid_cents: 0, status: 'unpaid', due_date: new Date().toISOString() }, // Trap
];

let payments = [
  { id: 'PAY-1', customer_id: 'CUST-001', invoice_id: 'INV-101', amount_cents: 1300000, method: 'online', status: 'verified', created_at: new Date(Date.now() - 4*86400000).toISOString() },
  { id: 'PAY-2', customer_id: 'CUST-001', invoice_id: 'INV-103', amount_cents: 50000, method: 'cash', status: 'verified', created_at: new Date(Date.now() - 8*86400000).toISOString() },
];

let supportTickets = [
  { id: 'TKT-1', ticket_number: 'TCK-2026-001', customer_id: 'CUST-001', subject_category: 'delivery_issue', related_order_id: 'SALE-101', message: 'Delivery was late.', status: 'resolved', created_at: new Date(Date.now() - 3*86400000).toISOString() },
];

let supportReplies = [
  { id: 'REP-1', ticket_id: 'TKT-1', author_type: 'staff', message: 'We apologize for the delay. We have credited 50 loyalty points to your account.', created_at: new Date(Date.now() - 2*86400000).toISOString() }
];

let loyalty = [
  { customer_id: 'CUST-001', points_balance: 180, updated_at: new Date().toISOString() }
];


// Custom Event Target for triggering re-renders
const stateEventTarget = new EventTarget();

export const customerState = {
  subscribe: (callback) => {
    stateEventTarget.addEventListener('change', callback);
    return () => stateEventTarget.removeEventListener('change', callback);
  },

  notify: (key) => {
    const notif = CUSTOMER_NOTIFICATIONS[key];
    if (notif) {
      if (notif.toast && typeof window !== 'undefined' && window.toast) {
        window.toast[notif.type || 'info'](notif.toast);
      }
      playSound(notif.sound);
    }
    stateEventTarget.dispatchEvent(new Event('change'));
  },

  // --- SECURITY / SCOPING ENGINE ---
  // Every internal query must run through here. 
  // If the UI requests an ID that doesn't belong to SESSION_CUSTOMER_ID, it returns null or empty.
  
  _enforceOwnership: (entity, customIdField = 'customer_id') => {
      if (!entity) return null;
      if (entity[customIdField] !== SESSION_CUSTOMER_ID) {
          console.warn(`SECURITY: Attempted access to cross-tenant entity ${entity.id}`);
          return null; 
      }
      return entity;
  },
  
  _filterOwned: (list, customIdField = 'customer_id') => {
      return list.filter(item => item[customIdField] === SESSION_CUSTOMER_ID);
  },

  // --- GETTERS ---
  getDashboardSummary: () => {
      const mySales = customerState._filterOwned(sales);
      const myInvoices = customerState._filterOwned(invoices);
      
      const totalOrders = mySales.length;
      const completedOrders = mySales.filter(s => {
          const f = fulfillments.find(x => x.sale_id === s.id);
          return f && f.fulfillment_status === 'delivered';
      }).length;
      const pendingOrders = totalOrders - completedOrders;

      const totalSpentCents = mySales.reduce((sum, s) => sum + s.total_cents, 0);
      const outstandingBalanceCents = myInvoices.reduce((sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents), 0);
      
      const myLoyalty = customerState._filterOwned(loyalty)[0]?.points_balance || 0;

      return {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalSpentCents,
          outstandingBalanceCents,
          recentOrders: mySales.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(s => {
              const f = fulfillments.find(x => x.sale_id === s.id);
              return { ...s, fulfillment_status: f?.fulfillment_status || 'unknown' };
          }),
          loyaltyPoints: myLoyalty
      };
  },

  getCatalog: () => {
      // Only active products
      return products.filter(p => p.status === 'active').map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          unit_price_cents: p.unit_price_cents,
          in_stock: p.stock_level > 0
      }));
  },

  getAddresses: () => customerState._filterOwned(addresses),

  getOrders: () => {
      return customerState._filterOwned(sales).map(s => {
          const lines = saleLines.filter(l => l.sale_id === s.id).map(l => {
              const p = products.find(prod => prod.id === l.product_id);
              return { ...l, product_name: p?.name || 'Unknown' };
          });
          const f = fulfillments.find(x => x.sale_id === s.id);
          return { ...s, lines, fulfillment: f };
      }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getOrderById: (id) => {
      const order = customerState._enforceOwnership(sales.find(s => s.id === id));
      if (!order) throw new Error("Order not found or access denied (404)");
      
      const lines = saleLines.filter(l => l.sale_id === order.id).map(l => {
          const p = products.find(prod => prod.id === l.product_id);
          return { ...l, product_name: p?.name || 'Unknown' };
      });
      const f = fulfillments.find(x => x.sale_id === order.id);
      return { ...order, lines, fulfillment: f };
  },

  getInvoices: () => customerState._filterOwned(invoices).sort((a,b) => new Date(b.due_date) - new Date(a.due_date)),
  
  getPayments: () => {
      return customerState._filterOwned(payments).map(p => {
          const inv = invoices.find(i => i.id === p.invoice_id);
          return { ...p, related_sale_id: inv?.sale_id };
      }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getSupportTickets: () => {
      return customerState._filterOwned(supportTickets).map(t => {
          const replies = supportReplies.filter(r => r.ticket_id === t.id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
          return { ...t, replies };
      }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // --- ACTIONS ---
  
  placeOrder: (cartItems, deliveryOption, addressId) => {
      // 1. Validation
      if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");
      if (deliveryOption === 'delivery') {
          const addr = customerState._enforceOwnership(addresses.find(a => a.id === addressId));
          if (!addr) throw new Error("Valid delivery address required for delivery option.");
      }

      let totalCents = 0;
      const linesToInsert = [];

      // 2. Server-side price re-validation (Trust No Client)
      cartItems.forEach(item => {
          const product = products.find(p => p.id === item.product_id && p.status === 'active');
          if (!product) throw new Error(`Product ${item.product_id} is no longer available.`);
          if (product.stock_level < item.qty) throw new Error(`Insufficient stock for ${product.name}.`);
          
          const subtotal = product.unit_price_cents * item.qty;
          totalCents += subtotal;
          
          linesToInsert.push({
              id: generateId('SL'),
              product_id: product.id,
              qty: item.qty,
              unit_price_cents: product.unit_price_cents,
              subtotal_cents: subtotal
          });

          // Deduct stock (simulated)
          product.stock_level -= item.qty;
      });

      // 3. Transactional Insert
      const newOrder = {
          id: generateId('SALE'),
          customer_id: SESSION_CUSTOMER_ID,
          order_number: `ORD-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
          total_cents: totalCents,
          created_at: new Date().toISOString()
      };
      sales.push(newOrder);

      linesToInsert.forEach(l => {
          l.sale_id = newOrder.id;
          saleLines.push(l);
      });

      const fulfill = {
          id: generateId('FUL'),
          sale_id: newOrder.id,
          delivery_option: deliveryOption,
          delivery_address_id: deliveryOption === 'delivery' ? addressId : null,
          fulfillment_status: 'order_placed',
          expected_delivery_date: new Date(Date.now() + 3*86400000).toISOString(),
          status_updated_at: new Date().toISOString()
      };
      fulfillments.push(fulfill);

      // Auto-generate invoice
      invoices.push({
          id: generateId('INV'),
          customer_id: SESSION_CUSTOMER_ID,
          sale_id: newOrder.id,
          total_cents: totalCents,
          amount_paid_cents: 0,
          status: 'unpaid',
          due_date: new Date(Date.now() + 7*86400000).toISOString()
      });

      // Add loyalty points (1 per 100 ETB)
      const myLoyalty = customerState._filterOwned(loyalty)[0];
      if (myLoyalty) {
          myLoyalty.points_balance += Math.floor(totalCents / 10000);
          myLoyalty.updated_at = new Date().toISOString();
      }

      return newOrder;
  },

  payInvoice: (invoiceId, amountCents, method) => {
      const invoice = customerState._enforceOwnership(invoices.find(i => i.id === invoiceId));
      if (!invoice) throw new Error("Invoice not found (404)");
      
      const balance = invoice.total_cents - invoice.amount_paid_cents;
      if (balance <= 0) throw new Error("Invoice is already fully paid.");
      if (amountCents > balance) throw new Error("Payment exceeds outstanding balance.");

      // If online (gateway), it's verified instantly. If cash/bank, it's pending_verification.
      const isInstant = method === 'online';
      
      const payRecord = {
          id: generateId('PAY'),
          customer_id: SESSION_CUSTOMER_ID,
          invoice_id: invoice.id,
          amount_cents,
          method,
          status: isInstant ? 'verified' : 'pending_verification',
          created_at: new Date().toISOString()
      };
      payments.push(payRecord);

      if (isInstant) {
          invoice.amount_paid_cents += amountCents;
          if (invoice.amount_paid_cents >= invoice.total_cents) {
              invoice.status = 'paid';
          }
      }

      return payRecord;
  },

  submitSupportTicket: (category, message, orderId = null) => {
      // If an order ID is provided, verify ownership first!
      if (orderId) {
          customerState.getOrderById(orderId); // Throws if invalid/unowned
      }

      const ticket = {
          id: generateId('TKT'),
          ticket_number: `TCK-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`,
          customer_id: SESSION_CUSTOMER_ID,
          subject_category: category,
          related_order_id: orderId,
          message,
          status: 'open',
          created_at: new Date().toISOString()
      };
      supportTickets.push(ticket);
      return ticket;
  }
};
