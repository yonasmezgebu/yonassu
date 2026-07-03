import React, { useState } from 'react';
import { Search, Download, Plus, FileText } from 'lucide-react';
import { purchaseState } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseMarketResearch = () => {
  const [researchList, setResearchList] = useState([...purchaseState.m4Research]);
  const [filterCat, setFilterCat] = useState('All');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [category, setCategory] = useState('Pharmaceuticals');
  const [supplierName, setSupplierName] = useState('');
  const [productName, setProductName] = useState('');
  const [spec, setSpec] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      id: `M4-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      category, supplierName, productName, spec,
      marketPrice: parseFloat(marketPrice),
      offeredPrice: parseFloat(offeredPrice),
      notes
    };
    purchaseState.m4Research.push(newRecord);
    setResearchList([...purchaseState.m4Research]);
    setShowModal(false);
    submitNotification('📊 Market Research Added', '📊 Market Research - Click to View', 'success.mp3');
  };

  const filtered = researchList.filter(r => 
    (filterCat === 'All' || r.category === filterCat) &&
    (!filterSupplier || r.supplierName.toLowerCase().includes(filterSupplier.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0284c7' }}>
            <Search color="#0ea5e9" size={28} /> MARKET RESEARCH (M4)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track market research and supplier price benchmarking.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Add Research
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Category</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pharmaceuticals</option><option>Medical Equipment</option><option>Office Supplies</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier Search</label>
          <input placeholder="Search supplier..." value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Research #', 'Date', 'Category', 'Supplier', 'Product', 'Market Price', 'Offered Price', 'Difference', 'Notes'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col.includes('Price') || col === 'Difference' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const diff = r.marketPrice - r.offeredPrice;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{r.id}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.category}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>{r.supplierName}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>
                    <div>{r.productName}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.spec}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>${r.marketPrice}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>${r.offeredPrice}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: diff >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                    {diff > 0 ? `-$${Math.abs(diff)}` : `+$${Math.abs(diff)}`}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{r.notes}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No research data found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 600 }}>
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={20} /> Record Market Research</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }} required>
                  <option>Pharmaceuticals</option><option>Medical Equipment</option><option>Office Supplies</option>
                </select></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier Name *</label>
                <input value={supplierName} onChange={e => setSupplierName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Product Name *</label>
                <input value={productName} onChange={e => setProductName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Specification *</label>
                <input value={spec} onChange={e => setSpec(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Market Price *</label>
                <input type="number" value={marketPrice} onChange={e => setMarketPrice(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Offered Price *</label>
                <input type="number" value={offeredPrice} onChange={e => setOfferedPrice(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseMarketResearch;
