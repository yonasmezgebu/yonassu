import React, { useState, useEffect } from 'react';
import { Truck, Send, Check } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchasePendingDeliveries = () => {
  const [deliveries, setDeliveries] = useState([
    { id: 'PO-5001', supplier: 'Global Pharma Supplies', items: 'Paracetamol 500mg, Amoxicillin', expectedDate: '2026-06-28', daysRemaining: -3 },
    { id: 'PO-5003', supplier: 'MedTech Solutions', items: 'Surgical Gloves, Syringes', expectedDate: '2026-07-05', daysRemaining: 4 }
  ]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  useEffect(() => {
    playSound('info');
  }, []);

  const handleFollowUp = (id) => {
    playSound('success');
    alert(`Follow up sent for ${id}`);
  };

  const handleMarkReceived = (id) => {
    setDeliveries(prev => prev.filter(d => d.id !== id));
    playSound('success');
  };

  const filtered = deliveries.filter(d => 
    (overdueOnly ? d.daysRemaining < 0 : true) &&
    (!filterSupplier || d.supplier.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Truck color="#d97706" size={28} /> PENDING DELIVERIES
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track deliveries expected but not yet received.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier</label>
          <input placeholder="Search supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)} />
            Overdue Only
          </label>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['PO #', 'Supplier', 'Items', 'Expected Date', 'Days Remaining/Overdue', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{d.id}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{d.supplier}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{d.items}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{d.expectedDate}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: d.daysRemaining < 0 ? '#fee2e2' : '#dcfce7', color: d.daysRemaining < 0 ? '#dc2626' : '#16a34a' }}>
                    {d.daysRemaining < 0 ? `${Math.abs(d.daysRemaining)} Days Overdue` : `${d.daysRemaining} Days Remaining`}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleFollowUp(d.id)} style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Send size={14} /> Follow Up</button>
                    <button onClick={() => handleMarkReceived(d.id)} style={{ padding: '4px 8px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Mark Received</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchasePendingDeliveries;
