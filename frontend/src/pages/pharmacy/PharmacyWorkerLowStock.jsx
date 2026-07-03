import React, { useState } from 'react';
import { AlertCircle, Download, Bell, ShoppingBag } from 'lucide-react';
import { receiveNotification } from '../../utils/pharmacyNotifications';
import { mockInventoryState } from '../../utils/storeTransactionService';

const MOCK_LOW_STOCK = [
  { name: 'Ciprofloxacin', category: 'Antibiotic', qty: 30, reorderLevel: 100, shortage: 70, unitPrice: 22.00, location: 'Shelf A-2' },
  { name: 'Ibuprofen', category: 'Analgesic', qty: 0, reorderLevel: 50, shortage: 50, unitPrice: 8.50, location: 'Shelf B-4' },
  { name: 'Atenolol', category: 'Cardiovascular', qty: 15, reorderLevel: 80, shortage: 65, unitPrice: 14.00, location: 'Shelf C-2' },
  { name: 'Omeprazole', category: 'Gastric', qty: 40, reorderLevel: 100, shortage: 60, unitPrice: 9.00, location: 'Shelf D-1' },
  { name: 'Cough Syrup', category: 'Respiratory', qty: 5, reorderLevel: 30, shortage: 25, unitPrice: 12.00, location: 'Shelf B-1' },
];

const PharmacyWorkerLowStock = () => {
  const [requested, setRequested] = useState([]);

  React.useEffect(() => {
    receiveNotification('⚠️ Low Stock Alert', 'Reorder Required - Click to View');
  }, []);

  const handleNotifyManager = (item) => {
    alert(`Direct alert sent to Pharmacy Manager: ${item.name} is below reorder level (current: ${item.qty}, minimum: ${item.reorderLevel}).`);
  };

  const handleRequestFromStore = (item) => {
    // Write to M20 Requisition table (same path as Store/Inventory modules)
    const newRequisition = {
      id: `M20-${Date.now().toString().slice(-6)}`,
      itemName: item.name,
      quantityRequested: item.shortage,
      requestedBy: 'Pharmacy Worker',
      department: 'Pharmacy',
      status: 'Pending',
      timestamp: new Date().toISOString()
    };
    mockInventoryState.m20Requisitions.push(newRequisition);
    setRequested(prev => [...prev, item.name]);
    receiveNotification('⚠️ Low Stock Alert', 'Reorder Required - Click to View');
    alert(`M20 Requisition (${newRequisition.id}) submitted for ${item.shortage} units of ${item.name} from Store.`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#92400e' }}>
            <AlertCircle color="#f59e0b" size={28} /> LOW STOCK
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Reorder Alert</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
          <Download size={15} /> Export PDF
        </button>
      </div>

      {/* Summary Banner */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 16, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertCircle color="#f59e0b" />
        <div>
          <strong style={{ color: '#92400e' }}>{MOCK_LOW_STOCK.length} items</strong>
          <span style={{ color: '#78350f', marginLeft: 4 }}>are below their reorder level. Use the actions below to notify your Manager or request stock directly from the Store.</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
              {['Medicine Name', 'Category', 'Current Qty', 'Reorder Level', 'Shortage', 'Unit Price', 'Location', 'Actions'].map(col => (
                <th key={col} style={{ padding: '11px 16px', textAlign: 'left', color: '#78350f', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_LOW_STOCK.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 12 }}>{item.category}</span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: item.qty === 0 ? '#dc2626' : '#d97706' }}>{item.qty}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{item.reorderLevel}</td>
                <td style={{ padding: '12px 16px', color: '#dc2626', fontWeight: 700 }}>-{item.shortage}</td>
                <td style={{ padding: '12px 16px' }}>${item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{item.location}</td>
                <td style={{ padding: '12px 16px' }}>
                  {requested.includes(item.name) ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#047857', background: '#d1fae5', padding: '4px 8px', borderRadius: 4 }}>
                      M20 Submitted
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleNotifyManager(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <Bell size={12} /> Notify Manager
                      </button>
                      <button onClick={() => handleRequestFromStore(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <ShoppingBag size={12} /> Request from Store (M20)
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyWorkerLowStock;
