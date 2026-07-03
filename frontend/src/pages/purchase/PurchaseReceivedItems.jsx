import React, { useState, useEffect } from 'react';
import { Package, Download } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseReceivedItems = () => {
  const [items] = useState([
    { id: 'M19-2026-081', item: 'Paracetamol 500mg', qty: 1000, supplier: 'Global Pharma Supplies', dateReceived: '2026-06-25', receivedBy: 'Store Manager', category: 'Pharmaceutical' },
    { id: 'M19-2026-082', item: 'Surgical Masks', qty: 500, supplier: 'Ethio Medical Distributors', dateReceived: '2026-06-29', receivedBy: 'Pharmacy Staff', category: 'Consumables' }
  ]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    playSound('info');
  }, []);

  const handleExport = () => {
    playSound('success');
    alert('Exporting to PDF/CSV...');
  };

  const filtered = items.filter(i => 
    (filterCat === 'All' || i.category === filterCat) &&
    (!filterSupplier || i.supplier.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Package color="#16a34a" size={28} /> RECEIVED ITEMS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Log of all items received into stock.</p>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier</label>
          <input placeholder="Search supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Category</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option>
            <option>Pharmaceutical</option>
            <option>Consumables</option>
            <option>Equipment</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Item', 'Quantity', 'Supplier', 'Date Received', 'GRN #', 'Received By'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{i.item}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{i.qty.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{i.supplier}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{i.dateReceived}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{i.id}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{i.receivedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseReceivedItems;
