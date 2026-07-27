import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { AlertTriangle, Search, RefreshCw, Download, Printer, Bell, ShoppingBag, Package, TrendingDown } from 'lucide-react';
import { receiveNotification } from '../../utils/pharmacyNotifications';

export default function SalesWorkerLowStock({ hideHeader = false, refreshTrigger = 0 }) {
  const { showToast, ToastContainer } = useToast();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [requested, setRequested] = useState([]);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/sales/products/all');
      
      const lowStockItems = (res?.data || res || []).map(item => {
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
      }).filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock');
      
      setStock(lowStockItems);
      
      if (lowStockItems.length > 0) {
        receiveNotification('⚠️ Low Stock Alert', 'Reorder Required - Please review low stock items.');
      }
    } catch (e) {
      showToast('Failed to load low stock items', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);
  useEffect(() => { if (refreshTrigger > 0) fetchStock(); }, [refreshTrigger, fetchStock]);

  const filtered = stock.filter(item => {
    return !search
      || (item.name || '').toLowerCase().includes(search.toLowerCase())
      || (item.generic_name || '').toLowerCase().includes(search.toLowerCase())
      || (item.category_name || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleNotifyManager = (item) => {
    showToast(`Manager Notified: ${item.name} is below reorder level.`, 'success');
  };

  const handleRequestFromStore = (item) => {
    const qtyNeeded = item.reorder > item.qty ? item.reorder - item.qty + 10 : 20; // arbitrary buffer for M20
    setRequested(prev => [...prev, item.id]);
    showToast(`M20 Requisition submitted for ${qtyNeeded} units of ${item.name}`, 'success');
  };

  return (
    <div style={hideHeader ? {} : { padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <ToastContainer />

      {/* Header */}
      {!hideHeader && (
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 0, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
              <TrendingDown size={20} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Low Stock Alerts
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Items below their reorder level
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
      )}

      {/* Summary Banner */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '16px 20px', borderRadius: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: '#fef3c7', padding: 10, borderRadius: 0 }}>
          <AlertTriangle color="#d97706" size={24} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#92400e' }}>{stock.length} Items Require Attention</div>
          <div style={{ color: '#b45309', fontSize: 13, marginTop: 2 }}>These items are below their reorder level or out of stock. Use the actions to request M20 from the store.</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ background: 'white', borderRadius: 0, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <label style={labelStyle}>Search Low Stock Items</label>
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

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 0, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Medication</th>
                <th style={th}>Category</th>
                <th style={th}>Stock Qty</th>
                <th style={th}>Reorder Level</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No low stock items.'}
                  </td>
                </tr>
              ) : filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid #f1f5f9', background: item.status === 'Out of Stock' ? '#fff1f2' : (idx % 2 === 0 ? 'white' : '#fafbfc'), transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = item.status === 'Out of Stock' ? '#ffe4e6' : '#fefce8'}
                  onMouseLeave={e => e.currentTarget.style.background = item.status === 'Out of Stock' ? '#fff1f2' : (idx % 2 === 0 ? 'white' : '#fafbfc')}
                >
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 0, background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.image ? (
                          <>
                            <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}><Package size={16} color="#94a3b8" /></div>
                          </>
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
                    <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: 0, fontSize: 11 }}>
                      {item.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 800, color: item.status === 'Out of Stock' ? '#e11d48' : '#d97706' }}>
                    {item.qty}
                  </td>
                  <td style={{ ...td, color: '#64748b' }}>{item.reorder}</td>
                  <td style={td}>
                    <span style={{
                      ...getStatusStyle(item.status),
                      padding: '4px 10px', borderRadius: 0, fontSize: 11, fontWeight: 700, display: 'inline-block'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={td}>
                    {requested.includes(item.id) ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '6px 12px', borderRadius: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShoppingBag size={12} /> M20 Submitted
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleNotifyManager(item)} style={{ padding: '6px 12px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 0, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <Bell size={12} /> Notify
                        </button>
                        <button onClick={() => handleRequestFromStore(item)} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: 0, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 6px rgba(59,130,246,0.3)' }}>
                          <ShoppingBag size={12} /> Request M20
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
    </div>
  );
}

const getStatusStyle = (status) => {
  if (status === 'Low Stock') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
  if (status === 'Out of Stock') return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
};

const topBtnStyle = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 0, cursor: 'pointer', color: '#475569', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const th = { padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const td = { padding: '14px 16px', color: '#1e293b', verticalAlign: 'middle' };
