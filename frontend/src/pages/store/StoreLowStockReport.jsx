import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Printer, Filter, Send, Info } from 'lucide-react';
import { getInventory } from '../../utils/storeApi';
import { storeInfo } from '../../utils/storeNotifications';

const StoreLowStockReport = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventory({ low_stock: 'true' }).then(r => { setItems(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleNotifyPurchase = (item) => {
    storeInfo('Alert sent to Purchase for ' + item.drug_name, 'Purchase Notified', 'The Purchase department has been notified of the shortage. To create a formal requisition, please contact your department manager.');
  };

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

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
        </select>
      </div>
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fef3c7' }}>
              {['Item Name', 'Current Qty', 'Reorder Lvl', 'Shortage', 'Unit Price', 'Value at Risk', 'Notify'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#92400e', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(i => {
              const q = Number(i.quantity);
              const reorder = Number(i.min_level || 0);
              const shortage = Math.max(reorder - q, 0);
              const valueRisk = shortage * Number(i.unit_price);
              return (
                <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{i.drug_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{i.storage_location || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: q === 0 ? '#b91c1c' : '#b45309' }}>{q}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{reorder}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#b91c1c' }}>{shortage}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>ETB {Number(i.unit_price).toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: '#b91c1c' }}>ETB {valueRisk.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => handleNotifyPurchase(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Send size={13} /> Notify Purchase
                      </button>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Requests must be created by your department manager</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No low stock items — all inventory levels are healthy</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreLowStockReport;