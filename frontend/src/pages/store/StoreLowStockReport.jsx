import React, { useEffect } from 'react';
import { AlertTriangle, Download, Printer, Filter, Send } from 'lucide-react';
import { storeInfo, storeSuccess } from '../../utils/storeNotifications';

const mockLowStock = [
  { id: 'ITM-005', name: 'Syringes 5ml', qty: 0, reorder: 500, price: 0.10, loc: 'Main Store - Rack B', cat: 'Medical Supplies' },
  { id: 'ITM-003', name: 'A4 Paper', qty: 5, reorder: 10, price: 4.50, loc: 'Office Supply Rm', cat: 'Office Supplies' },
];

const StoreLowStockReport = () => {
  useEffect(() => {
    storeInfo('⚠️ Low Stock Alert - Syringes 5ml', '⚠️ Reorder Required', 'Some items have fallen below their reorder levels.');
  }, []);

  const handleCreateRequisition = (item) => {
    const shortage = item.reorder - item.qty;
    storeSuccess(`Requisition Created for ${item.name}`, '📋 New Requisition Generated', `Pre-filled Model 20 requisition created for ${shortage} units.`);
  };

  const handleNotifyPurchase = (item) => {
    storeInfo(`Alert sent to Purchase for ${item.name}`, '✉️ Purchase Notified', 'The Purchase department has been notified of the shortage.');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#b45309' }}>
            <AlertTriangle color="#f59e0b" size={28} /> LOW STOCK REPORT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Reorder Alert</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Printer size={15} /> Print
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            <Download size={15} /> Export PDF/Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Categories</option>
          <option>Medical Supplies</option>
          <option>Office Supplies</option>
        </select>
        <select style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option>All Locations</option>
          <option>Main Store</option>
          <option>Office Supply Rm</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fef3c7' }}>
              {['Item Name', 'Current Qty', 'Reorder Lvl', 'Shortage', 'Unit Price', 'Value at Risk', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#92400e', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockLowStock.map((item, i) => {
              const shortage = item.reorder - item.qty;
              const valueRisk = shortage * item.price;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.loc}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: item.qty === 0 ? '#b91c1c' : '#b45309' }}>{item.qty}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.reorder}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#b91c1c' }}>{shortage}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: '#b91c1c' }}>${valueRisk.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleCreateRequisition(item)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Create Requisition
                      </button>
                      <button onClick={() => handleNotifyPurchase(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        <Send size={13} /> Notify Purchase
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreLowStockReport;
