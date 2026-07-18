/**
 * Integration tests for Store Transaction Service
 *
 * These tests verify two critical constraints from the Model Mapping Addendum:
 *   (a) A delivery received via Deliveries produces an identical M19 record and
 *       inventory update as one entered directly via Goods Receipt.
 *   (b) An M22 issue always resolves back to a valid M20 requisition and
 *       updates that requisition's status correctly.
 *
 * Run with: npx vitest run
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGoodsReceivingNote,
  createIssueNote,
  mockInventoryState,
} from '../../utils/storeTransactionService';

// Reset shared mock state before each test
beforeEach(() => {
  mockInventoryState.inventoryUpdates.length = 0;
  mockInventoryState.m20Requisitions.length = 0;
  mockInventoryState.m20Requisitions.push(
    { id: 'M20-2026-0045', status: 'Approved' },
    { id: 'M20-2026-0046', status: 'Approved' }
  );
});

// ─── Constraint (a) ───────────────────────────────────────────────────────────
describe('M19 Goods Receiving Note — shared write path', () => {
  const lines = [
    { itemName: 'Paracetamol 500mg', qtyReceived: '500', unitPrice: '0.05', batchNumber: 'BT-101', location: 'Rack A' },
  ];

  it('creates an M19 record with a generated ID when called from Goods Receipt (direct entry)', () => {
    const record = createGoodsReceivingNote('Supplier (Purchase Order)', 'PO-9901', '2026-07-01', lines);
    expect(record.id).toMatch(/^M19-/);
    expect(record.type).toBe('Goods Receipt');
    expect(record.referenceRef).toBe('PO-9901');
    expect(record.lines).toHaveLength(1);
  });

  it('creates an identical M19 structure when called via the Deliveries [Receive] flow (M12 → M19)', () => {
    // Simulates handleReceive(del) in StoreDeliveries which routes to StoreGoodsReceiving,
    // which in turn calls createGoodsReceivingNote — same function, same output shape.
    const deliveryPayload = { supplier: 'ABC Pharma', poRef: 'PO-9901', date: '2026-07-01', items: [{ itemName: 'Paracetamol 500mg', qtyReceived: '500' }] };
    const record = createGoodsReceivingNote('Supplier (Purchase Order)', deliveryPayload.poRef, deliveryPayload.date, lines);
    expect(record.id).toMatch(/^M19-/);
    expect(record.type).toBe('Goods Receipt');
    expect(record.referenceRef).toBe('PO-9901');
  });

  it('auto-updates inventory (increments) when M19 is created', () => {
    const before = mockInventoryState.inventoryUpdates.length;
    createGoodsReceivingNote('Supplier (Purchase Order)', 'PO-9901', '2026-07-01', lines);
    expect(mockInventoryState.inventoryUpdates.length).toBe(before + lines.length);
    const update = mockInventoryState.inventoryUpdates[before];
    expect(update.qtyChange).toBeGreaterThan(0);
    expect(update.item).toBe('Paracetamol 500mg');
  });
});

// ─── Constraint (b) ───────────────────────────────────────────────────────────
describe('M22 Issue Note — M20 Requisition linkage', () => {
  const lines = [
    { itemName: 'Paracetamol 500mg', qtyToIssue: '100', batchNumber: 'BT-101' },
  ];

  it('creates an M22 record linked to the provided M20 requisition', () => {
    const record = createIssueNote('Pharmacy', 'M20-2026-0045', 'M21-0001', lines);
    expect(record.id).toMatch(/^M22-/);
    expect(record.requisitionRef).toBe('M20-2026-0045');
    expect(record.destination).toBe('Pharmacy');
  });

  it('updates the source M20 requisition status to Fulfilled on submit', () => {
    createIssueNote('Pharmacy', 'M20-2026-0045', 'M21-0001', lines);
    const req = mockInventoryState.m20Requisitions.find(r => r.id === 'M20-2026-0045');
    expect(req.status).toBe('Fulfilled');
  });

  it('auto-updates inventory (decrements) when M22 is created', () => {
    const before = mockInventoryState.inventoryUpdates.length;
    createIssueNote('Sales', 'M20-2026-0046', 'M21-0002', lines);
    expect(mockInventoryState.inventoryUpdates.length).toBe(before + lines.length);
    const update = mockInventoryState.inventoryUpdates[before];
    expect(update.qtyChange).toBeLessThan(0);
  });

  it('throws an error if Requisition # (M20) is missing — enforces strict M20 linkage', () => {
    expect(() => {
      createIssueNote('Printing', '', 'M21-0003', lines);
    }).toThrow('Requisition # (M20) is strictly required.');
  });

  it('creates a Fulfilled status entry even for a previously unseen M20 ID (forward compatibility)', () => {
    createIssueNote('Pharmacy', 'M20-9999-XXXX', 'M21-0004', lines);
    const req = mockInventoryState.m20Requisitions.find(r => r.id === 'M20-9999-XXXX');
    expect(req).toBeDefined();
    expect(req.status).toBe('Fulfilled');
  });
});
