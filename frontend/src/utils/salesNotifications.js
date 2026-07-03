export const SALE_NOTIFICATIONS = {
  NEW_SALE: { sound: 'success', toast: 'Sale recorded successfully. Invoice/CRV generated.' },
  QUOTATION_SENT: { sound: 'success', toast: 'Quotation sent to customer.' },
  QUOTATION_ACCEPTED: { sound: 'success', toast: 'Quotation marked as accepted.' },
  QUOTATION_REJECTED: { sound: 'info', toast: 'Quotation marked as rejected.' },
  ORDER_CREATED: { sound: 'success', toast: 'Order created successfully.' },
  ORDER_CANCELLED: { sound: 'success', toast: 'Order cancelled and reason logged.' },
  INVOICE_PAID: { sound: 'success', toast: 'Invoice marked as paid. CRV generated.' },
  RETURN_APPROVED: { sound: 'success', toast: 'Sales return approved. Refund processed.' },
  RETURN_REQUESTED: { sound: 'info', toast: 'Return request submitted.' },
  RETURN_REJECTED: { sound: 'info', toast: 'Return request rejected.' },
  CUSTOMER_ADDED: { sound: 'success', toast: 'Customer created successfully.' },
  CREDIT_REMINDER: { sound: 'info', toast: 'Credit reminder sent to customer.' },

  // Quotes & Orders
  QUOTE_SENT: { sound: 'info', toast: 'Quotation sent to customer', type: 'success' },
  QUOTE_ACCEPTED: { sound: 'success', toast: 'Quotation accepted', type: 'success' },
  ORDER_CANCELLED_NEW: { sound: 'info', toast: 'Order cancelled', type: 'info' },

  // Addendum: Payments
  PAYMENT_RECEIVED: { sound: 'success', toast: '💳 Payment Received', type: 'success' },
  PAYMENT_HISTORY_READY: { sound: 'info', toast: '📊 Payment History Ready', type: 'info' },
  OUTSTANDING_PAYMENTS_READY: { sound: 'info', toast: '⏳ Outstanding Payments Report Ready', type: 'info' },

  // Addendum: Products
  STOCK_UPDATED: { sound: 'info', toast: '📊 Stock Availability Updated', type: 'info' },
  PRICE_LIST_UPDATED: { sound: 'info', toast: '💰 Price List Updated', type: 'info' },
  PROMOTION_CREATED: { sound: 'success', toast: '🎉 New Promotion Created', type: 'success' },

  // Addendum: Approvals
  PENDING_APPROVAL: { sound: 'info', toast: '⏳ Pending Approvals', type: 'info' },
  APPROVAL_APPROVED: { sound: 'success', toast: '✅ Approved', type: 'success' },
  APPROVAL_REJECTED: { sound: 'info', toast: '❌ Rejected', type: 'info' },

  // Addendum: Reports
  SALES_REPORT: { sound: 'info', toast: '📊 Sales Report Ready', type: 'info' },
  DAILY_SALES: { sound: 'info', toast: '⏰ Daily Sales Report Ready', type: 'info' },
  MONTHLY_SALES: { sound: 'info', toast: '📊 Monthly Sales Report Ready', type: 'info' },
  CUSTOMER_REPORT: { sound: 'info', toast: '👤 Customer Report Ready', type: 'info' },
  PRODUCT_PERFORMANCE: { sound: 'info', toast: '🧊 Product Performance Report Ready', type: 'info' },

  // System
  PAGE_LOAD: { sound: null, toast: null },
  ERROR: { sound: 'error', toast: 'An error occurred', type: 'error' },
  INFO: { sound: 'info', toast: 'Action recorded', type: 'info' }
};
