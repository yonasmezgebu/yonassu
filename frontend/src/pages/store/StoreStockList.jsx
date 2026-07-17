import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, Package, AlertTriangle } from 'lucide-react';
import { getInventory } from '../../utils/storeApi';

const statusColors = { 'In Stock': '#166534', 'Low Stock': '#92400e', 'Out of Stock': '#991b1b' };
const statusBg = { 'In Stock': '#dcfce7', 'Low Stock': '#fef3c7', 'Out of Stock': '#fee2e2' };

const StoreStockList = () => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = () => {
    setLoading(true);
    setError(null);
    getInventory()
      .then(response => {
        const items = (response.data || []).map((item, index) => ({
          id: item.id || index + 1,
          name: item.drug_name + (item.strength ? ' ' + item.strength : ''),
          category: item.category || 'General',
          qty: Number(item.quantity),
          reorderLevel: Number(item.min_level || 0),
          unitPrice: Number(item.unit_price || 0),
          totalValue: Number(item.quantity) * Number(item.unit_price || 0),
          location: item.storage_location || '—',
          expiry: item.expiry_date || 'N/A',
          batch: item.batch_no || '—',
          status: Number(item.quantity) <= 0
            ? 'Out of Stock'
            : Number(item.quantity) <= Number(item.min_level || 0)
              ? 'Low Stock'
              : 'In Stock',
        }));
        setData(items);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load inventory');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const categories = ['All', ...new Set(data.map(i => i.category))];
  const locations = ['All', ...new Set(data.map(i => i.location.split('-')[0].trim()))];

  const filtered = data.filter(item => {
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.batch.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || item.category === filterCategory;
    const matchStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchLoc = filterLocation === 'All' || item.location.startsWith(filterLocation);
    return matchSearch && matchCat && matchStatus && matchLoc;
  });

  const totalValue = filtered.reduce((s, i) => s + i.totalValue, 0);
  const lowStockCount = data.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#64748b' }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif", gap: 16 }}>
        <div style={{ fontSize: 16, color: '#991b1b' }}>Error: {error}</div>
        <button onClick={fetchInventory} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package color="#3b82f6" size={28} /> STOCK LIST
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: View Only — Live Inventory Catalog</p>
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

      {/* LOW STOCK BANNER */}
      {lowStockCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 20 }}>
          <AlertTriangle color="#b45309" size={20} />
          <span style={{ color: '#92400e', fontWeight: 600, fontSize: 14 }}>
            ⚠️ {lowStockCount} item(s) are at low or zero stock levels. Please review and reorder.
          </span>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '0 12px' }}>
          <Search size={16} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Name, Category, Barcode/Batch..." style={{ border: 'none', background: 'transparent', outline: 'none', padding: '10px 4px', fontSize: 14, width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="#64748b" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Status</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          {locations.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Items Shown</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>{filtered.length}</div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Value (Filtered)</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>ETB {totalValue.toFixed(2)}</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 16, borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>Low/Out of Stock</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#b91c1c', marginTop: 4 }}>{lowStockCount}</div>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Item Name', 'Category', 'Qty', 'Reorder Level', 'Unit Price', 'Total Value', 'Location', 'Expiry Date', 'Batch #', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.category}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: item.qty <= item.reorderLevel ? '#b91c1c' : '#0f172a' }}>{item.qty}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.reorderLevel}</td>
                <td style={{ padding: '12px 14px' }}>ETB {item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>ETB {item.totalValue.toFixed(2)}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.location}</td>
                <td style={{ padding: '12px 14px', color: item.expiry !== 'N/A' && new Date(item.expiry) < new Date(Date.now() + 90 * 86400000) ? '#b91c1c' : '#64748b' }}>{item.expiry}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748b' }}>{item.batch}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusBg[item.status], color: statusColors[item.status] }}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreStockList;
