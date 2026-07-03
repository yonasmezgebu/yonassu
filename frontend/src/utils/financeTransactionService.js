/**
 * financeTransactionService.js
 * Shared backend-mock service for the Finance Dashboard.
 * All 4 transaction-writing items (CRV, PV, PCV, Journal Entries)
 * call postToLedger() from this module rather than having each
 * maintain its own ledger-write logic.
 */

// ─── Shared Mock State ───────────────────────────────────────────────────────

export const financeState = {
  ledgerEntries: [],
  cashBookEntries: [],
  bankAccounts: [
    { id: 'BANK-001', bankName: 'Commercial Bank of Ethiopia', accountNumber: '1000123456', accountHolder: 'Sutana Company', branch: 'Addis Ababa Main', balance: 485000.00 },
    { id: 'BANK-002', bankName: 'Awash Bank', accountNumber: '2000654321', accountHolder: 'Sutana Company', branch: 'Bole Branch', balance: 120000.00 },
  ],
  cashInHand: 45000.00,
  pettyCashBalance: 8500.00,
  fiscalPeriods: [
    { id: 'FY-2026', year: 2026, startDate: '2026-01-01', endDate: '2026-12-31', status: 'Open',
      periods: Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const startDate = `2026-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(2026, month, 0).toISOString().slice(0, 10);
        return { period: month, name: new Date(2026, i, 1).toLocaleString('en', { month: 'long' }), startDate, endDate, status: month < 6 ? 'Closed' : 'Open' };
      })
    }
  ],
  crvCounter: 1000,
  pvCounter: 2000,
  pcvCounter: 3000,
  journalCounter: 4000,
  invoiceCounter: 5000,
  paymentCounter: 6000,

  // AR/AP Mock State
  customers: [
    { id: 'CUST-001', name: 'Addis Pharmacy LLC', type: 'Company', phone: '0911223344', email: 'contact@addisrx.com', outstandingBalance: 45000 },
    { id: 'CUST-002', name: 'Mekelle General Hospital', type: 'Company', phone: '0922334455', email: 'finance@mekellegh.com', outstandingBalance: 120000 },
  ],
  customerInvoices: [
    { id: 'INV-4999', date: '2026-06-15', customerName: 'Addis Pharmacy LLC', totalAmount: 45000, amountPaid: 0, status: 'Overdue', dueDate: '2026-06-25' },
    { id: 'INV-4998', date: '2026-06-20', customerName: 'Mekelle General Hospital', totalAmount: 120000, amountPaid: 0, status: 'Unpaid', dueDate: '2026-07-20' },
  ],
  
  suppliers: [
    // Simulating Store's Supplier Records with Finance extensions
    { id: 'SUP-001', name: 'Global Pharma Supplies', contactPerson: 'John Doe', phone: '0911000000', email: 'sales@globalpharma.com', creditLimit: 500000, outstandingBalance: 75000 },
    { id: 'SUP-002', name: 'Ethio Medical Distributors', contactPerson: 'Abebe Bikila', phone: '0922000000', email: 'billing@ethiomed.com', creditLimit: 250000, outstandingBalance: 0 },
  ],
  supplierBills: [
    { id: 'BILL-8821', dateReceived: '2026-06-28', supplierName: 'Global Pharma Supplies', totalAmount: 75000, amountPaid: 0, status: 'Unpaid', dueDate: '2026-07-15' },
  ],

  // Procurement (M8-M11) Mock State
  procurements: [
    { id: 'M8-001', requestDate: '2026-06-25', department: 'Pharmacy', item: 'Paracetamol 500mg', status: 'Approved', type: 'Requisition' },
    { id: 'M9-001', requestDate: '2026-06-26', department: 'Pharmacy', requestedAmount: 50000, status: 'Pending Approval', type: 'Fund Request' },
    { id: 'M10-001', poDate: '2026-06-27', supplier: 'Global Pharma Supplies', totalAmount: 75000, status: 'Sent', type: 'Purchase Order' },
    { id: 'M11-001', grnDate: '2026-06-28', supplier: 'Global Pharma Supplies', poReference: 'M10-001', status: 'Received', type: 'Goods Received Note' },
  ],

  // Voucher Approval State — items here appear in Pending/Approved/Rejected Vouchers screens
  pendingVouchers: [
    { id: 'CRV-0990', type: 'CRV', date: '2026-06-29', payeeFrom: 'Mekelle Hospital', amount: 12000, department: 'Finance', createdBy: 'Ayana Bekele', daysPending: 2, approvalStatus: 'Pending Approval' },
    { id: 'PV-1990', type: 'PV', date: '2026-06-28', payeeFrom: 'Addis Electric Co.', amount: 3500, department: 'Admin', createdBy: 'Samuel Tadesse', daysPending: 3, approvalStatus: 'Pending Approval' },
    { id: 'PCV-2990', type: 'PCV', date: '2026-06-30', payeeFrom: 'Office Supplies Vendor', amount: 800, department: 'Pharmacy', createdBy: 'Hana Girma', daysPending: 1, approvalStatus: 'Pending Approval' },
  ],
  approvedVouchers: [
    { id: 'CRV-0985', type: 'CRV', date: '2026-06-25', payeeFrom: 'Addis Pharmacy LLC', amount: 45000, department: 'Finance', approvedBy: 'Finance Manager', approvalDate: '2026-06-26', stampId: 'DS-88221' },
    { id: 'PV-1985', type: 'PV', date: '2026-06-24', payeeFrom: 'Global Pharma Supplies', amount: 35000, department: 'Pharmacy', approvedBy: 'Finance Manager', approvalDate: '2026-06-25', stampId: 'DS-88220' },
  ],
  rejectedVouchers: [
    { id: 'PCV-2980', type: 'PCV', date: '2026-06-20', payeeFrom: 'Unknown Vendor', amount: 5000, department: 'Admin', rejectedBy: 'Finance Manager', rejectionDate: '2026-06-21', rejectionReason: 'Amount exceeds PCV limit of 3,000 ETB.', originalData: { description: 'Urgent office supplies', accountCode: '5004' } },
  ],

  // Default COA for dropdowns
  defaultCOA: [
    { code: '1001', name: 'Cash in Hand',       type: 'Asset' },
    { code: '1002', name: 'Bank Account - CBE',  type: 'Asset' },
    { code: '1003', name: 'Bank Account - Awash',type: 'Asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'Asset' },
    { code: '1200', name: 'Inventory (Store)',    type: 'Asset' },
    { code: '1300', name: 'Pharmacy Stock',       type: 'Asset' },
    { code: '2001', name: 'Accounts Payable',     type: 'Liability' },
    { code: '2002', name: 'Tax Payable',          type: 'Liability' },
    { code: '3001', name: 'Capital',              type: 'Equity' },
    { code: '3002', name: 'Retained Earnings',    type: 'Equity' },
    { code: '4001', name: 'Sales Revenue',        type: 'Income' },
    { code: '4002', name: 'Service Revenue',      type: 'Income' },
    { code: '4003', name: 'Rental Income',        type: 'Income' },
    { code: '5001', name: 'Cost of Goods Sold',   type: 'Expense' },
    { code: '5002', name: 'Salaries',             type: 'Expense' },
    { code: '5003', name: 'Utilities',            type: 'Expense' },
    { code: '5004', name: 'Office Expenses',      type: 'Expense' },
    { code: '5005', name: 'Transportation',       type: 'Expense' },
  ],
};

// ─── Fiscal Period Lock Enforcement ─────────────────────────────────────────
export const assertPeriodOpen = (dateString) => {
  const date = new Date(dateString);
  for (const fy of financeState.fiscalPeriods) {
    for (const period of fy.periods) {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      if (date >= start && date <= end) {
        if (period.status === 'Closed') {
          throw new Error(
            `Fiscal Period ${period.name} ${fy.year} is CLOSED. Transactions dated within a closed period are rejected.`
          );
        }
        return true; // period is open
      }
    }
  }
  return true; // date outside any defined period — allow
};

// ─── Shared Ledger Writer ────────────────────────────────────────────────────
export const postToLedger = (entryData) => {
  const {
    date, description, debitAccount, debitAmount,
    creditAccount, creditAmount, reference, type
  } = entryData;

  // Double-entry balance check
  if (Math.abs(debitAmount - creditAmount) > 0.01) {
    throw new Error(
      `Double-Entry Error: Debit (${debitAmount}) must equal Credit (${creditAmount}).`
    );
  }

  // Fiscal period lock check
  assertPeriodOpen(date);

  const entry = {
    id: `JE-${Date.now().toString().slice(-6)}`,
    date, description, debitAccount, debitAmount,
    creditAccount, creditAmount, reference, type,
    timestamp: new Date().toISOString()
  };
  financeState.ledgerEntries.push(entry);
  return entry;
};

// ─── Bank Balance Updater (shared with Menu Item 5) ──────────────────────────
export const updateBankBalance = (bankId, delta) => {
  const account = financeState.bankAccounts.find(b => b.id === bankId);
  if (!account) throw new Error(`Bank account ${bankId} not found.`);
  account.balance += delta;
  return account.balance;
};

// ─── CRV Creator (Menu Item 1) ───────────────────────────────────────────────
export const createCRV = (data) => {
  const { date, receivedFrom, amount, paymentMethod, accountCode, description, referenceNo, bankDetails, telebirrDetails } = data;

  assertPeriodOpen(date);

  if (paymentMethod === 'Bank' && (!bankDetails?.bankName || !bankDetails?.accountHolder || !bankDetails?.accountNumber)) {
    throw new Error('Bank payments require Bank Name, Account Holder, and Account Number.');
  }
  if (paymentMethod === 'Telebirr' && (!telebirrDetails?.telebirrNumber || !telebirrDetails?.fullName)) {
    throw new Error('Telebirr payments require Telebirr Number and Full Name.');
  }

  const crvNumber = `CRV-${++financeState.crvCounter}`;

  // Auto-generate ledger entry: DR Cash/Bank, CR Revenue Account
  const debitAccount = paymentMethod === 'Bank' ? '1002' : paymentMethod === 'Telebirr' ? '1003' : '1001';
  postToLedger({
    date, description: `CRV ${crvNumber}: ${description}`,
    debitAccount, debitAmount: amount,
    creditAccount: accountCode, creditAmount: amount,
    reference: crvNumber, type: 'CRV'
  });

  // Update Cash Book
  financeState.cashBookEntries.push({
    date, type: 'CRV', reference: crvNumber, description,
    receipts: amount, payments: 0, paymentMethod
  });

  // Update bank balance if Bank payment
  if (paymentMethod === 'Bank') {
    updateBankBalance('BANK-001', amount);
  } else if (paymentMethod === 'Cash') {
    financeState.cashInHand += amount;
  }

  return { crvNumber, amount, date, receivedFrom, paymentMethod };
};

// ─── PV Creator (Menu Item 2) ────────────────────────────────────────────────
export const createPV = (data) => {
  const { date, paidTo, amount, paymentMethod, accountCode, description, invoiceRef, bankDetails, telebirrDetails } = data;

  assertPeriodOpen(date);

  if (paymentMethod === 'Bank' && (!bankDetails?.bankName || !bankDetails?.accountHolder || !bankDetails?.accountNumber)) {
    throw new Error('Bank payments require Bank Name, Account Holder, and Account Number.');
  }

  const pvNumber = `PV-${++financeState.pvCounter}`;

  // Auto-generate ledger entry: DR Expense Account, CR Cash/Bank
  const creditAccount = paymentMethod === 'Bank' ? '1002' : paymentMethod === 'Telebirr' ? '1003' : '1001';
  postToLedger({
    date, description: `PV ${pvNumber}: ${description}`,
    debitAccount: accountCode, debitAmount: amount,
    creditAccount, creditAmount: amount,
    reference: pvNumber, type: 'PV'
  });

  financeState.cashBookEntries.push({
    date, type: 'PV', reference: pvNumber, description,
    receipts: 0, payments: amount, paymentMethod
  });

  if (paymentMethod === 'Bank') {
    updateBankBalance('BANK-001', -amount);
  } else if (paymentMethod === 'Cash') {
    financeState.cashInHand -= amount;
  }

  return { pvNumber, amount, date, paidTo, paymentMethod };
};

// ─── PCV Creator (Menu Item 3) ───────────────────────────────────────────────
export const createPCV = (data) => {
  const { date, paidTo, amount, accountCode, description, reasonForUrgency } = data;

  assertPeriodOpen(date);

  // Hard server-side 3,000 ETB limit
  if (amount > 3000) {
    throw new Error(
      `PCV amount (${amount} ETB) exceeds the maximum petty cash limit of 3,000 ETB. This submission is rejected.`
    );
  }

  const pcvNumber = `PCV-${++financeState.pcvCounter}`;

  // Status starts as Pending — ledger is NOT posted until manager approves
  const pcvRecord = {
    pcvNumber, amount, date, paidTo, accountCode, description,
    reasonForUrgency, status: 'Pending Approval', timestamp: new Date().toISOString()
  };

  return pcvRecord;
};

// ─── PCV Approval (called by manager action) ─────────────────────────────────
export const approvePCV = (pcvRecord) => {
  // Now post to ledger
  postToLedger({
    date: pcvRecord.date,
    description: `PCV ${pcvRecord.pcvNumber}: ${pcvRecord.description}`,
    debitAccount: pcvRecord.accountCode, debitAmount: pcvRecord.amount,
    creditAccount: '1001', creditAmount: pcvRecord.amount, // CR Petty Cash
    reference: pcvRecord.pcvNumber, type: 'PCV'
  });

  financeState.pettyCashBalance -= pcvRecord.amount;
  financeState.cashBookEntries.push({
    date: pcvRecord.date, type: 'PCV', reference: pcvRecord.pcvNumber,
    description: pcvRecord.description, receipts: 0, payments: pcvRecord.amount, paymentMethod: 'Cash'
  });

  return { ...pcvRecord, status: 'Approved' };
};

// ─── Journal Entry Creator (Menu Item 7) ─────────────────────────────────────
export const createJournalEntry = (data) => {
  const { date, description, debitAccount, debitAmount, creditAccount, creditAmount, reference } = data;
  assertPeriodOpen(date);

  // postToLedger enforces double-entry balance
  return postToLedger({
    date, description, debitAccount, debitAmount,
    creditAccount, creditAmount, reference, type: 'Manual Journal'
  });
};

// ─── Receivables (AR) Methods (Items 7 & 8) ────────────────────────────────
export const createCustomerInvoice = (data) => {
  const invoice = {
    id: `INV-${++financeState.invoiceCounter}`,
    ...data,
    status: 'Unpaid',
    amountPaid: 0,
    timestamp: new Date().toISOString()
  };
  financeState.customerInvoices.push(invoice);
  
  // Update customer balance
  const customer = financeState.customers.find(c => c.name === data.customerName);
  if (customer) customer.outstandingBalance += data.totalAmount;
  
  // Debit AR (1100), Credit Sales Revenue (4001)
  postToLedger({
    date: data.date, description: `Invoice ${invoice.id} for ${data.customerName}`,
    debitAccount: '1100', debitAmount: data.totalAmount,
    creditAccount: '4001', creditAmount: data.totalAmount,
    reference: invoice.id, type: 'Invoice'
  });
  
  return invoice;
};

export const receiveCustomerPayment = (data) => {
  // Finds the invoice, updates balance, generates a CRV.
  const invoice = financeState.customerInvoices.find(inv => inv.id === data.invoiceRef);
  if (invoice) {
    invoice.amountPaid += data.amountPaid;
    if (invoice.amountPaid >= invoice.totalAmount) {
      invoice.status = 'Paid';
    }
  }
  
  const customer = financeState.customers.find(c => c.name === data.customerName);
  if (customer) customer.outstandingBalance -= data.amountPaid;
  
  // Generate the actual CRV which posts to ledger and cash book
  // CRV will debit Cash/Bank, and we explicitly tell it to Credit AR (1100)
  const crvData = {
    date: data.date,
    receivedFrom: data.customerName,
    amount: data.amountPaid,
    paymentMethod: data.paymentMethod,
    accountCode: '1100', // Accounts Receivable
    description: `Payment for Invoice ${data.invoiceRef}`,
    referenceNo: data.invoiceRef,
    bankDetails: data.bankDetails,
    telebirrDetails: data.telebirrDetails
  };
  
  return createCRV(crvData);
};

// ─── Payables (AP) Methods (Items 11 & 12) ──────────────────────────────────
export const createSupplierBill = (data) => {
  const bill = {
    id: data.billNo || `BILL-${++financeState.invoiceCounter}`,
    ...data,
    status: 'Unpaid',
    amountPaid: 0,
    timestamp: new Date().toISOString()
  };
  financeState.supplierBills.push(bill);
  
  const supplier = financeState.suppliers.find(s => s.name === data.supplierName);
  if (supplier) supplier.outstandingBalance += data.totalAmount;
  
  // Debit Inventory (1200) / COGS (5001) (assuming Inventory 1200 for now), Credit AP (2001)
  postToLedger({
    date: data.dateReceived, description: `Bill ${bill.id} from ${data.supplierName}`,
    debitAccount: '1200', debitAmount: data.totalAmount,
    creditAccount: '2001', creditAmount: data.totalAmount,
    reference: bill.id, type: 'Bill'
  });
  
  return bill;
};

// For Supplier Payments (Menu 12), the UI will directly call createPV pre-filled with "Supplier Payments" type,
// but we need a wrapper to update the bill and supplier balance.
export const sendSupplierPayment = (data) => {
  const bill = financeState.supplierBills.find(b => b.id === data.billRef);
  if (bill) {
    bill.amountPaid += data.amountPaid;
    if (bill.amountPaid >= bill.totalAmount) {
      bill.status = 'Paid';
    }
  }
  
  const supplier = financeState.suppliers.find(s => s.name === data.supplierName);
  if (supplier) supplier.outstandingBalance -= data.amountPaid;
  
  // PV will credit Cash/Bank, and we explicitly tell it to Debit AP (2001)
  const pvData = {
    date: data.date,
    paidTo: data.supplierName,
    amount: data.amountPaid,
    paymentMethod: data.paymentMethod,
    accountCode: '2001', // Accounts Payable
    description: `Payment for Bill ${data.billRef}`,
    invoiceRef: data.billRef,
    bankDetails: data.bankDetails,
    telebirrDetails: data.telebirrDetails
  };
  
  return createPV(pvData);
};

// ─── MTD Aggregates (for dashboard home) ─────────────────────────────────────
export const getMTDSummary = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const mtdEntries = financeState.ledgerEntries.filter(e => new Date(e.date) >= monthStart);
  const totalIncome = mtdEntries
    .filter(e => ['CRV'].includes(e.type))
    .reduce((sum, e) => sum + e.creditAmount, 0) || 124500;

  const totalExpenses = mtdEntries
    .filter(e => ['PV', 'PCV'].includes(e.type))
    .reduce((sum, e) => sum + e.debitAmount, 0) || 87300;

  const todayStr = now.toISOString().slice(0, 10);
  const todayEntries = financeState.cashBookEntries.filter(e => e.date === todayStr);

  const totalReceivables = financeState.customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const outstandingReceivables = financeState.customerInvoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);
  const totalPayables = financeState.suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);
  const outstandingPayables = financeState.supplierBills.filter(b => b.status === 'Unpaid' || b.status === 'Overdue').reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);

  return {
    cashInHand: financeState.cashInHand,
    bankBalance: financeState.bankAccounts.reduce((s, b) => s + b.balance, 0),
    todayReceipts: todayEntries.reduce((s, e) => s + e.receipts, 0) || 8250,
    todayPayments: todayEntries.reduce((s, e) => s + e.payments, 0) || 3100,
    pettyCashBalance: financeState.pettyCashBalance,
    totalReceivables,
    outstandingReceivables,
    totalPayables,
    outstandingPayables,
    pendingVouchers: financeState.pendingVouchers.length,
    totalIncome,
    totalExpenses,
    netProfitLoss: totalIncome - totalExpenses,
  };
};

// ─── Voucher Approval Actions (Items 25-27) ─────────────────────────────────
export const approveVoucher = (voucherId) => {
  const idx = financeState.pendingVouchers.findIndex(v => v.id === voucherId);
  if (idx === -1) throw new Error(`Voucher ${voucherId} not found in pending list.`);
  const voucher = financeState.pendingVouchers.splice(idx, 1)[0];
  const approved = {
    ...voucher,
    approvalStatus: 'Approved',
    approvedBy: 'Finance Manager',
    approvalDate: new Date().toISOString().slice(0, 10),
    stampId: `DS-${Date.now().toString().slice(-5)}`,
  };
  financeState.approvedVouchers.push(approved);
  return approved;
};

export const rejectVoucher = (voucherId, reason) => {
  const idx = financeState.pendingVouchers.findIndex(v => v.id === voucherId);
  if (idx === -1) throw new Error(`Voucher ${voucherId} not found in pending list.`);
  const voucher = financeState.pendingVouchers.splice(idx, 1)[0];
  const rejected = {
    ...voucher,
    approvalStatus: 'Rejected',
    rejectedBy: 'Finance Manager',
    rejectionDate: new Date().toISOString().slice(0, 10),
    rejectionReason: reason,
    originalData: { payeeFrom: voucher.payeeFrom, amount: voucher.amount, department: voucher.department },
  };
  financeState.rejectedVouchers.push(rejected);
  return rejected;
};

// Resubmit creates a BRAND NEW pending voucher — never mutates the rejected one (audit trail)
export const resubmitVoucher = (rejectedVoucherId) => {
  const original = financeState.rejectedVouchers.find(v => v.id === rejectedVoucherId);
  if (!original) throw new Error(`Rejected voucher ${rejectedVoucherId} not found.`);
  const typePrefix = original.type === 'CRV' ? 'CRV' : original.type === 'PV' ? 'PV' : 'PCV';
  const counter = typePrefix === 'CRV' ? ++financeState.crvCounter : typePrefix === 'PV' ? ++financeState.pvCounter : ++financeState.pcvCounter;
  const newVoucher = {
    id: `${typePrefix}-${counter}`,
    type: original.type,
    date: new Date().toISOString().slice(0, 10),
    payeeFrom: original.originalData.payeeFrom || original.payeeFrom,
    amount: original.originalData.amount || original.amount,
    department: original.department,
    createdBy: original.createdBy,
    daysPending: 0,
    approvalStatus: 'Pending Approval',
    resubmittedFrom: original.id,
  };
  financeState.pendingVouchers.push(newVoucher);
  return newVoucher;
};

// ─── Report Aggregators (Items 20-23) ────────────────────────────────────────
export const getCashFlowReport = (period = 'Month') => {
  // Opening balance: cash + bank at start of period
  const openingCash = 38000;
  const openingBank = 580000;
  const opening = openingCash + openingBank;

  // Aggregate from ledger entries
  const inflows = {
    salesRevenue:  124500,
    serviceIncome: 18000,
    rentalIncome:  12000,
    otherIncome:   5200,
  };
  inflows.total = Object.values(inflows).reduce((a, b) => a + b, 0);

  const outflows = {
    supplierPayments: 75000,
    salaries:         62000,
    utilities:         8500,
    rent:             15000,
    transportation:    4800,
    otherExpenses:     7200,
  };
  outflows.total = Object.values(outflows).reduce((a, b) => a + b, 0);

  const netCashFlow = inflows.total - outflows.total;
  const closing = opening + netCashFlow;

  return { period, opening, inflows, outflows, netCashFlow, closing };
};

export const getProfitLossReport = (period = 'Month') => {
  const revenue = {
    pharmacySales:   124500,
    carRentalIncome: 18000,
    agriRentalIncome: 5000,
    printingIncome:   3200,
    otherIncome:      2500,
  };
  revenue.total = Object.values(revenue).reduce((a, b) => a + b, 0);

  const cogs = {
    pharmacyCOGS: 62000,
    storeCOGS:    18000,
    printingCOGS:  1200,
  };
  cogs.total = Object.values(cogs).reduce((a, b) => a + b, 0);

  const grossProfit = revenue.total - cogs.total;

  const opex = {
    salaries:      62000,
    rent:          15000,
    utilities:      8500,
    transportation: 4800,
    officeExpenses: 3200,
    marketing:      1500,
    otherExpenses:  1800,
  };
  opex.total = Object.values(opex).reduce((a, b) => a + b, 0);

  const operatingIncome = grossProfit - opex.total;
  const taxesInterest = operatingIncome * 0.15;
  const netProfitLoss = operatingIncome - taxesInterest;

  return { period, revenue, cogs, grossProfit, opex, operatingIncome, taxesInterest, netProfitLoss };
};

export const getBalanceSheetReport = () => {
  const cashInHand = financeState.cashInHand;
  const bankBalance = financeState.bankAccounts.reduce((s, b) => s + b.balance, 0);
  const ar = financeState.customers.reduce((s, c) => s + c.outstandingBalance, 0);
  const inventory = 285000;
  const pharmacyStock = 142000;
  const pettyCash = financeState.pettyCashBalance;

  const currentAssets = { cashInHand, bankBalance, accountsReceivable: ar, inventory, pharmacyStock, pettyCash };
  currentAssets.total = Object.values(currentAssets).reduce((a, b) => a + b, 0);

  const nonCurrentAssets = { equipment: 180000, vehicles: 320000, furniture: 45000 };
  nonCurrentAssets.total = Object.values(nonCurrentAssets).reduce((a, b) => a + b, 0);

  const totalAssets = currentAssets.total + nonCurrentAssets.total;

  const ap = financeState.suppliers.reduce((s, sup) => s + sup.outstandingBalance, 0);
  const currentLiabilities = { accountsPayable: ap, bankLoansShort: 50000, taxPayable: 12000 };
  currentLiabilities.total = Object.values(currentLiabilities).reduce((a, b) => a + b, 0);

  const nonCurrentLiabilities = { bankLoansLong: 200000 };
  nonCurrentLiabilities.total = Object.values(nonCurrentLiabilities).reduce((a, b) => a + b, 0);

  const totalLiabilities = currentLiabilities.total + nonCurrentLiabilities.total;

  const pl = getProfitLossReport();
  const equity = { capital: 850000, retainedEarnings: 125000, netProfitLoss: pl.netProfitLoss };
  equity.total = Object.values(equity).reduce((a, b) => a + b, 0);

  const totalLiabilitiesAndEquity = totalLiabilities + equity.total;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

  return { currentAssets, nonCurrentAssets, totalAssets, currentLiabilities, nonCurrentLiabilities, totalLiabilities, equity, totalLiabilitiesAndEquity, isBalanced };
};

export const getIncomeExpenseReport = () => {
  const departmentBreakdown = [
    { dept: 'Pharmacy',  income: 124500, expenses: 82000 },
    { dept: 'Store',     income: 38000,  expenses: 22000 },
    { dept: 'Car Rental',income: 18000,  expenses: 12000 },
    { dept: 'Admin',     income: 0,      expenses: 28500 },
  ];

  const monthlyTrend = [
    { month: 'Jan', income: 98000,  expenses: 72000 },
    { month: 'Feb', income: 102000, expenses: 75000 },
    { month: 'Mar', income: 110000, expenses: 80000 },
    { month: 'Apr', income: 108000, expenses: 82000 },
    { month: 'May', income: 118000, expenses: 84000 },
    { month: 'Jun', income: 124500, expenses: 87300 },
  ];

  const expenseDistribution = [
    { category: 'Salaries',       amount: 62000, color: '#3b82f6' },
    { category: 'Rent',           amount: 15000, color: '#8b5cf6' },
    { category: 'Utilities',      amount: 8500,  color: '#f59e0b' },
    { category: 'Supplies/COGS',  amount: 18000, color: '#10b981' },
    { category: 'Transportation', amount: 4800,  color: '#ef4444' },
    { category: 'Other',          amount: 8000,  color: '#64748b' },
  ];

  const totalIncome = departmentBreakdown.reduce((s, d) => s + d.income, 0);
  const totalExpenses = departmentBreakdown.reduce((s, d) => s + d.expenses, 0);
  const netIncome = totalIncome - totalExpenses;
  const priorNetIncome = 27000;
  const percentChange = ((netIncome - priorNetIncome) / priorNetIncome) * 100;

  return { departmentBreakdown, monthlyTrend, expenseDistribution, totalIncome, totalExpenses, netIncome, percentChange };
};

// ─── Shared Supplier Service ─────────────────────────────────────────────────
// Single write path for all modules (Store, Finance, Purchase).
export const createSupplier = (data) => {
  const newSupplier = {
    id: `SUP-${Date.now().toString().slice(-4)}`,
    status: 'Pending Verification',
    outstandingBalance: 0,
    rating: 0,
    // Purchase-relevant extensions
    category: data.category || 'General',
    location: data.location || 'Local',
    website: data.website || '',
    bankName: data.bankName || '',
    accountNumber: data.accountNumber || '',
    accountHolder: data.accountHolder || '',
    ...data,
  };
  financeState.suppliers.push(newSupplier);
  return newSupplier;
};

export const updateSupplier = (id, updates) => {
  const idx = financeState.suppliers.findIndex(s => s.id === id);
  if (idx === -1) throw new Error(`Supplier ${id} not found`);
  financeState.suppliers[idx] = { ...financeState.suppliers[idx], ...updates };
  return financeState.suppliers[idx];
};

