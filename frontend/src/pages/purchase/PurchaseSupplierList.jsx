import React, { useState } from 'react';
import { Users, Download, Printer, Star } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const ratingStars = (n) => '★'.repeat(Math.min(5, Math.max(0, Math.round(n / 20)))) + '☆'.repeat(5 - Math.min(5, Math.max(0, Math.round(n / 20))));

const PurchaseSupplierList = () => {
  const [suppliers, setSuppliers] = useState(financeState.suppliers.map(s => ({
    ...s,
    category: s.category || 'Pharmaceutical',
    location: s.location || 'Local',
    rating: s.rating || 75,
    address: s.address || 'Addis Ababa, Ethiopia',
    taxId: s.taxId || 'TAX-000001',
    paymentTerms: s.paymentTerms || 'Net 30',
    status: s.status || 'Active'
  })));
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');

  const filtered = suppliers.filter(s =>
    (filterCat === 'All' || s.category === filterCat) &&
    (filterStatus === 'All' || s.status === filterStatus) &&
    (filterLocation === 'All' || s.location === filterLocation)
  );

  React.useEffect(() => {
    submitNotification('📋 Supplier List Updated', '📋 Supplier List - Click to View', 'success.mp3');
  }, []);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Users color="#3b82f6" size={28} /> SUPPLIER LIST
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Complete supplier database — shared across Store, Finance, and Purchase modules.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1d4ed8' }}>{suppliers.length}</div>
            <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>Total Suppliers</div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Category</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pharmaceutical</option><option>General</option><option>Equipment</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Active</option><option>Inactive</option><option>Pending Verification</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Location</label>
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Local</option><option>International</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Supplier Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Category', 'Tax ID', 'Payment Terms', 'Credit Limit', 'Rating', 'Status'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Credit Limit' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{s.contactPerson}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{s.phone}</td>
                <td style={{ padding: '12px 14px', color: '#3b82f6', fontSize: 13 }}>{s.email}</td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{s.address}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.category === 'Pharmaceutical' ? '#ede9fe' : '#f0fdf4', color: s.category === 'Pharmaceutical' ? '#7c3aed' : '#16a34a' }}>{s.category}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{s.taxId}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{s.paymentTerms}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>${(s.creditLimit || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#f59e0b', fontSize: 14, letterSpacing: 1 }}>{ratingStars(s.rating)}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.status === 'Active' ? '#dcfce7' : s.status === 'Inactive' ? '#fee2e2' : '#fef3c7', color: s.status === 'Active' ? '#16a34a' : s.status === 'Inactive' ? '#dc2626' : '#d97706' }}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No suppliers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseSupplierList;
