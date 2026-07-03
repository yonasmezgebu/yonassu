import { storeSuccess, storeInfo } from './storeNotifications';
import { mockInventoryState } from './storeTransactionService';
import { financeState } from './financeTransactionService';

// ─── Shared Mock State ───────────────────────────────────────────────────────
export const purchaseState = {
  m4Research: [
    { id: 'M4-1001', date: '2026-06-25', category: 'Pharmaceuticals', supplierName: 'Global Pharma Supplies', productName: 'Paracetamol 500mg', spec: 'Box of 100', marketPrice: 150, offeredPrice: 140, notes: 'Good bulk discount.' },
    { id: 'M4-1002', date: '2026-06-28', category: 'Medical Equipment', supplierName: 'Ethio Medical Distributors', productName: 'Surgical Masks', spec: 'Box of 50', marketPrice: 200, offeredPrice: 210, notes: 'Offered price is higher than market average.' }
  ],
  m5Tenders: [
    { id: 'M5-2001', dateCreated: '2026-06-20', item: 'Amoxicillin 250mg', category: 'Antibiotics', qty: 5000, uom: 'Boxes', closingDate: '2026-07-10', status: 'Open', ceoApproved: false },
    { id: 'M5-2002', dateCreated: '2026-06-15', item: 'Hospital Beds', category: 'Equipment', qty: 20, uom: 'Units', closingDate: '2026-06-30', status: 'Awarded', ceoApproved: true }
  ],
  rfqs: [
    { id: 'RFQ-3001', dateCreated: '2026-06-28', item: 'Office Computers', qty: 5, spec: 'Core i7, 16GB RAM', deliveryDeadline: '2026-07-15', responseDeadline: '2026-07-05', status: 'Open' }
  ],
  m6BidsAndQuotes: [
    { id: 'BID-4001', source_type: 'Tender', referenceId: 'M5-2001', supplierName: 'Global Pharma Supplies', item: 'Amoxicillin 250mg', qty: 5000, unitPrice: 120, deliveryTime: '14 Days', warranty: '1 Year', dateSubmitted: '2026-06-25', status: 'Pending' },
    { id: 'BID-4002', source_type: 'Tender', referenceId: 'M5-2001', supplierName: 'Addis Med Imports', item: 'Amoxicillin 250mg', qty: 5000, unitPrice: 115, deliveryTime: '21 Days', warranty: '1 Year', dateSubmitted: '2026-06-26', status: 'Pending' },
    { id: 'QUO-4003', source_type: 'RFQ', referenceId: 'RFQ-3001', supplierName: 'Tech IT Solutions', item: 'Office Computers', qty: 5, unitPrice: 35000, deliveryTerms: 'Doorstep', validity: '30 Days', dateSubmitted: '2026-06-29', status: 'Pending' }
  ],
  purchaseOrders: [
    { id: 'PO-5001', dateCreated: '2026-06-27', supplierName: 'Global Pharma Supplies', item: 'Paracetamol 500mg', qty: 1000, unitPrice: 140, tax: 0, paymentTerms: 'Net 30', deliveryAddress: 'Main Store', shipMethod: 'Truck', status: 'Sent', m9Ref: 'M9-001' },
    { id: 'PO-5002', dateCreated: '2026-06-20', supplierName: 'Ethio Medical Distributors', item: 'Surgical Masks', qty: 500, unitPrice: 200, tax: 0, paymentTerms: 'Cash on Delivery', deliveryAddress: 'Pharmacy Branch 1', shipMethod: 'Van', status: 'Received', m9Ref: 'M9-999' }
  ],
  returns: [
    { id: 'RET-6001', date: '2026-06-29', poRef: 'PO-5002', supplierName: 'Ethio Medical Distributors', item: 'Surgical Masks', qty: 50, reason: 'Damaged Goods', authNumber: 'AUTH-9921', method: 'Ship', status: 'Shipped' }
  ]
};

// ─── Service Methods ────────────────────────────────────────────────────────

// 1. Convert M20 to Tender
export const createTenderFromRequest = (m20) => {
  const newTender = {
    id: `M5-${Date.now().toString().slice(-4)}`,
    dateCreated: new Date().toISOString().slice(0, 10),
    item: m20.item || 'Various Items',
    category: 'General',
    qty: m20.qty || 1,
    uom: 'Units',
    closingDate: new Date(Date.now() + 14*24*60*60*1000).toISOString().slice(0, 10), // +14 days
    status: 'Open',
    ceoApproved: false
  };
  purchaseState.m5Tenders.push(newTender);
  storeSuccess('📋 New Tender Created', '📋 New Tender - Click to View');
  return newTender;
};

// 2. Convert M20 to RFQ
export const createRFQFromRequest = (m20) => {
  const newRFQ = {
    id: `RFQ-${Date.now().toString().slice(-4)}`,
    dateCreated: new Date().toISOString().slice(0, 10),
    item: m20.item || 'Various Items',
    qty: m20.qty || 1,
    spec: 'Standard specs',
    deliveryDeadline: new Date(Date.now() + 21*24*60*60*1000).toISOString().slice(0, 10),
    responseDeadline: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10),
    status: 'Open'
  };
  purchaseState.rfqs.push(newRFQ);
  storeSuccess('📄 New RFQ Created', '📄 New RFQ - Click to View');
  return newRFQ;
};

// 3. Accept Bid (requires CEO approval logic)
export const acceptBid = (bidId) => {
  const bid = purchaseState.m6BidsAndQuotes.find(b => b.id === bidId);
  if (!bid) throw new Error('Bid not found');

  if (bid.source_type === 'Tender') {
    // Check CEO Approval for the Tender
    const tender = purchaseState.m5Tenders.find(t => t.id === bid.referenceId);
    // In a real app we'd verify a CEO stamp on the bid itself or the tender award. We mock checking `ceoApproved`.
    // For this module, the spec says "block finalization server-side until a CEO approval record exists".
    // We will simulate that unless the user explicitly bypasses or we've mocked it as true, it fails.
    if (tender && !tender.ceoApproved) {
      throw new Error('Server Rejected: Cannot accept Tender Bid without CEO Approval record.');
    }
  }

  bid.status = 'Accepted';
  return bid;
};

// 4. Create PO (Validates M9)
export const createPurchaseOrder = (poData) => {
  // Validate M9 Fund Request against financeState
  if (poData.m9Ref) {
    const fundRequest = financeState.procurements.find(p => p.id === poData.m9Ref && p.type === 'Fund Request');
    if (!fundRequest) throw new Error('Server Rejected: M9 Fund Request not found.');
    if (fundRequest.status !== 'Approved') throw new Error(`Server Rejected: M9 Fund Request is not approved (Current status: ${fundRequest.status}).`);
  }

  const newPO = {
    id: `PO-${Date.now().toString().slice(-4)}`,
    dateCreated: new Date().toISOString().slice(0, 10),
    status: 'Sent',
    ...poData
  };
  purchaseState.purchaseOrders.push(newPO);
  storeSuccess('📋 PO Created', '📋 New PO - Click to View');
  return newPO;
};

// 5. Update PO Status from Receiving
export const receivePO = (poId) => {
  const po = purchaseState.purchaseOrders.find(p => p.id === poId);
  if (po) po.status = 'Received';
  return po;
};

// 6. Create Return Note (Decrements Store Inventory)
export const createReturnNote = (returnData) => {
  const newReturn = {
    id: `RET-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().slice(0, 10),
    status: 'Shipped',
    ...returnData
  };
  purchaseState.returns.push(newReturn);

  // Sync with store inventory
  mockInventoryState.inventoryUpdates.push({
    item: returnData.item,
    qtyChange: -Math.abs(+returnData.qty),
    reason: `Return to Supplier: ${newReturn.id}`
  });

  storeSuccess('🔄 Purchase Return Created', '🔄 Return Created - Click to View');
  return newReturn;
};

export const getPurchaseSummary = () => {
  return {
    totalSuppliers: 2, // financeState.suppliers would be imported to get live count
    totalPOs: purchaseState.purchaseOrders.length,
    pendingRequests: mockInventoryState.m20Requisitions.filter(r => r.status.includes('Pending')).length,
    openTenders: purchaseState.m5Tenders.filter(t => t.status === 'Open').length,
    supplierBids: purchaseState.m6BidsAndQuotes.length,
    pendingDeliveries: 1,
    receivedToday: 2,
    totalSpend: purchaseState.purchaseOrders.reduce((s, p) => s + (p.qty * p.unitPrice), 0),
    budgetRemaining: 150000,
    returns: purchaseState.returns.length
  };
};

// ─── Contracts State ──────────────────────────────────────────────────────────
export const contractsState = {
  contracts: [
    {
      id: 'CON-7001',
      supplierName: 'Global Pharma Supplies',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      value: 500000,
      scope: 'Supply of Pharmaceuticals',
      paymentTerms: 'Net 30',
      specialConditions: 'Price locked for 12 months',
      linkedPrior: null
    },
    {
      id: 'CON-7002',
      supplierName: 'Ethio Medical Distributors',
      startDate: '2026-04-01',
      endDate: '2026-07-25',  // expiring soon
      value: 120000,
      scope: 'Medical Equipment Supply',
      paymentTerms: 'Cash on Delivery',
      specialConditions: 'Quality inspection required on delivery',
      linkedPrior: null
    }
  ]
};

// Auto-compute contract status from dates
export const getContractStatus = (endDate) => {
  const end = new Date(endDate);
  const now = new Date();
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 30) return 'Expiring';
  return 'Active';
};

export const createContract = (data) => {
  const newContract = {
    id: `CON-${Date.now().toString().slice(-4)}`,
    linkedPrior: null,
    ...data
  };
  contractsState.contracts.push(newContract);
  return newContract;
};

export const renewContract = (existingId, newEndDate, newValue) => {
  const existing = contractsState.contracts.find(c => c.id === existingId);
  if (!existing) throw new Error('Contract not found');
  const newContract = {
    id: `CON-${Date.now().toString().slice(-4)}`,
    supplierName: existing.supplierName,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: newEndDate,
    value: newValue || existing.value,
    scope: existing.scope,
    paymentTerms: existing.paymentTerms,
    specialConditions: existing.specialConditions,
    linkedPrior: existingId
  };
  contractsState.contracts.push(newContract);
  return newContract;
};

// ─── Supplier Performance Analytics ──────────────────────────────────────────
export const getSupplierPerformance = (supplierName) => {
  const supplierPOs = purchaseState.purchaseOrders.filter(p => p.supplierName === supplierName);
  const supplierBids = purchaseState.m6BidsAndQuotes.filter(b => b.supplierName === supplierName);
  const supplierReturns = purchaseState.returns.filter(r => r.supplierName === supplierName);

  const totalOrders = supplierPOs.length;
  const totalSpend = supplierPOs.reduce((s, p) => s + (p.qty * p.unitPrice), 0);
  const onTimeCount = supplierPOs.filter(p => p.status === 'Received').length;
  const qualityPassed = Math.max(0, totalOrders - supplierReturns.length);
  const qualityRejected = supplierReturns.length;
  const onTimeRate = totalOrders > 0 ? Math.round((onTimeCount / totalOrders) * 100) : 0;
  const qualityScore = totalOrders > 0 ? Math.round((qualityPassed / Math.max(totalOrders, 1)) * 100) : 100;
  const avgLeadTime = 14; // days (mocked — would derive from PO send date vs M19 receive date in real app)
  const responseTime = supplierBids.length > 0 ? '3 Days' : 'N/A';
  const priceRank = supplierBids.length > 0 ? 'Competitive' : 'N/A';
  const overallRating = Math.round((onTimeRate + qualityScore) / 2);

  return {
    supplierName, totalOrders, totalSpend, onTimeRate, qualityScore,
    qualityPassed, qualityRejected, onTimeCount, avgLeadTime,
    responseTime, priceRank, overallRating
  };
};

// Mock stock inventory for federated availability view
export const mockStoreInventory = [
  { item: 'Paracetamol 500mg', category: 'Pharmaceuticals', storeStock: 2000, pharmacyStock: 450, reorderLevel: 500 },
  { item: 'Surgical Masks',    category: 'Medical Supplies', storeStock: 800, pharmacyStock: 200, reorderLevel: 300 },
  { item: 'Amoxicillin 250mg', category: 'Pharmaceuticals', storeStock: 150, pharmacyStock: 80,  reorderLevel: 500 },
  { item: 'IV Fluids 500ml',   category: 'Medical Supplies', storeStock: 0,   pharmacyStock: 20,  reorderLevel: 100 },
  { item: 'Gloves (box)',      category: 'Disposables',      storeStock: 300, pharmacyStock: 50,  reorderLevel: 200 },
];
