import React, { useState, useEffect } from 'react';
import { Layers, Download, Plus, ArrowRight } from 'lucide-react';
import { mockStoreInventory } from '../../utils/purchaseTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useNavigate } from 'react-router-dom';

const PurchaseStockAvailability = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    // Federated query from both Store and Pharmacy inventory sources
    setInventory(mockStoreInventory);
    submitNotification('📊 Stock Availability Updated', '📊 Stock Availability - Click to View', 'info.mp3');
  }, []);

  const categories = ['All', ...new Set(mockStoreInventory.map(i => i.category))];

  const filtered = inventory
    .map(i => ({
      ...i,
      totalStock: i.storeStock + i.pharmacyStock,
      shortage: Math.max(0, i.reorderLevel - (i.storeStock + i.pharmacyStock)),
      excess: Math.max(0, (i.storeStock + i.pharmacyStock) - i.reorderLevel * 2)
    }))
    .filter(i =>
      (filterCat === 'All' || i.category === filterCat) &&
      (!search || i.item.toLowerCase().includes(search.toLowerCase()))
    );

  const handleCreateRequest = (item) => {
    // Navigate to Purchase Requests — in production would pre-fill the form
    navigate('/purchase/requests');
    submitNotification(`📝 Purchase Request initiated for ${item.item}`, '📝 New Purchase Request', 'info.mp3');
  };

  const handleTransfer = (item) => {
    navigate('/store/stock-transfer');
    submitNotification(`🔄 Stock Transfer initiated for ${item.item}`, '🔄 Stock Transfer', 'info.mp3');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Layers color="#06b6d4" size={28} /> STOCK AVAILABILITY
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Federated real-time view across Store and Pharmacy inventory sources.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a' }}>{inventory.length}</div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Items Tracked</div>
        </div>
        <div style={{ background: '#dcfce7', borderRadius: 8, border: '1px solid #bbf7d0', padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#16a34a' }}>{inventory.filter(i => i.storeStock + i.pharmacyStock >= i.reorderLevel).length}</div>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Adequately Stocked</div>
        </div>
        <div style={{ background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#dc2626' }}>{inventory.filter(i => i.storeStock + i.pharmacyStock < i.reorderLevel).length}</div>
          <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>Below Reorder Level</div>
        </div>
        <div style={{ background: '#fef9c3', borderRadius: 8, border: '1px solid #fde047', padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#ca8a04' }}>{inventory.filter(i => i.storeStock + i.pharmacyStock === 0).length}</div>
          <div style={{ fontSize: 12, color: '#a16207', fontWeight: 600 }}>Out of Stock</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Search Item</label>
          <input placeholder="Search item name..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: 260 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Category</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Item Name', 'Category', 'Store Stock', 'Pharmacy Stock', 'Total', 'Reorder Level', 'Shortage / Excess', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: ['Store Stock', 'Pharmacy Stock', 'Total', 'Reorder Level'].includes(col) ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => {
              const isShortage = i.shortage > 0;
              const isOutOfStock = i.totalStock === 0;
              return (
                <tr key={i.item} style={{ borderBottom: '1px solid #f1f5f9', background: isOutOfStock ? '#fef2f2' : isShortage ? '#fffbeb' : 'transparent' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                    {isOutOfStock && <span style={{ fontSize: 10, marginRight: 4, padding: '1px 6px', background: '#fee2e2', color: '#dc2626', borderRadius: 8, fontWeight: 700 }}>OUT OF STOCK</span>}
                    {i.item}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{i.category}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>{i.storeStock.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>{i.pharmacyStock.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: isOutOfStock ? '#dc2626' : isShortage ? '#d97706' : '#16a34a' }}>
                    {i.totalStock.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>{i.reorderLevel.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {i.shortage > 0 ? (
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>⬇ -{i.shortage.toLocaleString()} Shortage</span>
                    ) : i.excess > 0 ? (
                      <span style={{ fontWeight: 600, color: '#0369a1' }}>⬆ +{i.excess.toLocaleString()} Excess</span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ OK</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {i.shortage > 0 && (
                        <button onClick={() => handleCreateRequest(i)} style={{ padding: '5px 10px', fontSize: 11, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Plus size={11} /> Create Request
                        </button>
                      )}
                      {i.storeStock > 0 && i.pharmacyStock < i.reorderLevel && (
                        <button onClick={() => handleTransfer(i)} style={{ padding: '5px 10px', fontSize: 11, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <ArrowRight size={11} /> Transfer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No items found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseStockAvailability;
