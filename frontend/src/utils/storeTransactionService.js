import { storeSuccess } from './storeNotifications';

/**
 * Shared transaction service for creating Store Document Models and updating inventory.
 * In a real application, this would interface with a backend API.
 * Currently it simulates the server-side logic required by the Addendum.
 */

// Mock in-memory state for testing logic
export const mockInventoryState = {
  inventoryUpdates: [],
  m20Requisitions: [
    { id: 'M20-2026-0045', status: 'Approved' },
    { id: 'M20-2026-0046', status: 'Approved' }
  ],
  tasks: [
    { id: 'TSK-101', name: 'Restock Shelf B', assignedBy: 'Manager', priority: 'High', deadline: '2026-07-02', daysRemaining: 1, status: 'Pending', completedOn: null },
    { id: 'TSK-102', name: 'Clean POS Area', assignedBy: 'Admin', priority: 'Medium', deadline: '2026-07-01', daysRemaining: 0, status: 'In Progress', completedOn: null },
    { id: 'TSK-103', name: 'Monthly Expiry Check', assignedBy: 'Manager', priority: 'High', deadline: '2026-06-25', daysRemaining: -6, status: 'Completed', completedOn: '2026-06-26' }
  ]
};

export const createGoodsReceivingNote = (source, referenceRef, receiptDate, lines) => {
  const m19Number = `M19-${Date.now().toString().slice(-6)}`;
  
  // 1. Generate M19 record
  const m19Record = {
    id: m19Number,
    type: 'Goods Receipt',
    source,
    referenceRef,
    receiptDate,
    lines,
    timestamp: new Date().toISOString()
  };

  // 2. Auto-update inventory (increment)
  lines.forEach(line => {
    mockInventoryState.inventoryUpdates.push({
      item: line.itemName,
      qtyChange: +line.qtyReceived,
      reason: `M19 Receipt: ${m19Number}`
    });
  });

  // 3. Fire consistent success notifications (mocking the multi-channel push)
  storeSuccess('📥 Goods Received - ' + source, '📥 New Stock Added', `M19-${m19Number} created successfully.`);
  
  return m19Record;
};

export const createIssueNote = (destination, requisitionRef, approvalRef, lines, isPharmacyDispense = false) => {
  const m22Number = `M22-${Date.now().toString().slice(-6)}`;

  // 1. Enforce Requisition Linkage (unless it's a pharmacy dispense to a customer)
  if (!requisitionRef && !isPharmacyDispense) {
    throw new Error('Requisition # (M20) is strictly required.');
  }

  // 2. Generate M22 record
  const m22Record = {
    id: m22Number,
    type: 'Goods Issue',
    destination,
    requisitionRef,
    approvalRef,
    lines,
    timestamp: new Date().toISOString()
  };

  // 3. Auto-update inventory (decrement)
  lines.forEach(line => {
    mockInventoryState.inventoryUpdates.push({
      item: line.itemName,
      qtyChange: -Math.abs(+line.qtyToIssue),
      reason: `M22 Issue: ${m22Number}`
    });
  });

  // 4. Mark source Requisition (M20) as fulfilled (if provided)
  if (requisitionRef) {
    const req = mockInventoryState.m20Requisitions.find(r => r.id === requisitionRef);
    if (req) {
      req.status = 'Fulfilled';
    } else {
      // If not found in mock, just append to simulate update
      mockInventoryState.m20Requisitions.push({ id: requisitionRef, status: 'Fulfilled' });
    }
  }

  // 5. Fire notification
  storeSuccess(`📦 Goods Issued to ${destination}`, '📦 New Issue Note Generated', `M22-${m22Number} created successfully.`);

  return m22Record;
};

// ----------------------------------------------------
// New Finance & Task Mocks for Pharmacy Worker Dashboard
// ----------------------------------------------------

export const createCRV = (paymentMethod, amount, reference, customerDetails) => {
  const crvNumber = `CRV-${Date.now().toString().slice(-6)}`;
  
  if (!['Cash', 'Bank Transfer', 'Telebirr'].includes(paymentMethod)) {
    throw new Error('Invalid payment method for CRV.');
  }

  // Hard validation check
  if (paymentMethod === 'Cash' && (!customerDetails.name || !customerDetails.phone)) {
    throw new Error('Cash payments require Recipient Full Name and Phone.');
  }
  if (paymentMethod === 'Bank Transfer' && (!customerDetails.bankName || !customerDetails.accountHolder || !customerDetails.accountNumber || !customerDetails.phone)) {
    throw new Error('Bank payments require Bank Name, Account Holder, Account Number, and Phone.');
  }
  if (paymentMethod === 'Telebirr' && (!customerDetails.telebirrNumber || !customerDetails.name || !customerDetails.phone)) {
    throw new Error('Telebirr payments require Telebirr Number, Full Name, and Phone.');
  }

  const crvRecord = {
    id: crvNumber,
    paymentMethod,
    amount,
    reference,
    customerDetails,
    status: 'PAID',
    timestamp: new Date().toISOString()
  };

  storeSuccess(`💰 Payment Collected`, '💰 Payment Recorded - Click to View', `CRV-${crvNumber} generated for ${amount}.`);
  return crvRecord;
};

export const updateTaskStatus = (taskId, newStatus) => {
  const task = mockInventoryState.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    if (newStatus === 'Completed') {
      task.completedOn = new Date().toISOString().slice(0, 10);
      storeSuccess('✅ Task Completed', 'Task status updated to Completed', `${taskId} marked as completed.`);
    }
  }
  return task;
};
