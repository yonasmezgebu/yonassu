import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { Package, Search, Filter, RefreshCw, Download, Printer, Box, AlertTriangle } from 'lucide-react';

const STATUS_OPTS = [
  { value: 'All', label: 'All Status' },
  { value: 'In Stock', label: 'In Stock' },
  { value: 'Low Stock', label: 'Low Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' },
];

export default function PharmacyWorkerCurrentStock() {
  const { showToast, ToastContainer } = useToast();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/products/all');
      
      const mapped = (res.data?.data || []).map(item => {
        const qty = parseInt(item.stock_quantity) || 0;
        const reorder = parseInt(item.reorder_level) || 0;
        let status = 'In Stock';
        if (qty === 0) status = 'Out of Stock';
        else if (qty <= reorder) status = 'Low Stock';
        
        return {
          ...item,
          status,
          qty,
          reorder,
          price: parseFloat(item.price) || 0,
        };
      });
      
      setStock(mapped);
    } catch (e) {
      showToast('Failed to load pharmacy stock', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const filtered = stock.filter(item => {
    const matchSearch = !search
      || (item.name || '').toLowerCase().includes(search.toLowerCase())
      || (item.generic_name || '').toLowerCase().includes(search.toLowerCase())
      || (item.category_name || '').toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const totalValue = filtered.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
  const lowStockCount = stock.filter(s => s.status === 'Low Stock').length;
  const outOfStockCount = stock.filter(s => s.status === 'Out of Stock').length;

  return (
    <div style={{ padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            <Package size={20} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Current Stock
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Live view of pharmacy medications inventory
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={topBtnStyle}>
            <Download size={13} /> Export PDF
          </button>
          <button style={topBtnStyle} onClick={() => window.print()}>
            <Printer size={13} /> Print List
          </button>
          <button onClick={fetchStock} style={topBtnStyle}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Items" value={stock.length} icon={<Box size={18} />} color="#3b82f6" bg="#eff6ff" />
        <StatCard label="Total Value (ETB)" value={totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} icon={<Package size={18} />} color="#059669" bg="#ecfdf5" />
        <StatCard label="Low Stock" value={lowStockCount} icon={<AlertTriangle size={18} />} color="#d97706" bg="#fffbeb" />
        <StatCard label="Out of Stock" value={outOfStockCount} icon={<AlertTriangle size={18} />} color="#e11d48" bg="#fff1f2" />
      </div>

      {/* Filters Bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Search Medications</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, generic name, or category..."
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ width: 220 }}>
          <label style={labelStyle}>Filter by Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{...inputStyle, paddingLeft: 12}}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Medication</th>
                <th style={th}>Category</th>
                <th style={th}>Price</th>
                <th style={th}>Stock Qty</th>
                <th style={th}>Reorder Level</th>
                <th style={th}>Expiry Date</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No medications found.'}
                  </td>
                </tr>
              ) : filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}
                >
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.drug_image ? (
                          <img src={`http://localhost:5000/uploads/products/${item.drug_image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={16} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{item.generic_name || 'No generic name'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, color: '#475569' }}>
                    <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 11 }}>
                      {item.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{item.price.toFixed(2)} {item.price_unit || 'ETB'}</td>
                  <td style={{ ...td, fontWeight: 800, color: item.status === 'Out of Stock' ? '#e11d48' : item.status === 'Low Stock' ? '#d97706' : '#059669' }}>
                    {item.qty}
                  </td>
                  <td style={{ ...td, color: '#64748b' }}>{item.reorder}</td>
                  <td style={{ ...td, color: '#64748b' }}>
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={td}>
                    <span style={{
                      ...getStatusStyle(item.status),
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block'
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

const getStatusStyle = (status) => {
  if (status === 'In Stock') return { background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' };
  if (status === 'Low Stock') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
  if (status === 'Out of Stock') return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
};

const topBtnStyle = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const th = { padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const td = { padding: '14px 16px', color: '#1e293b', verticalAlign: 'middle' };
