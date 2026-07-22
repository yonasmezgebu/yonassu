import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { Clock, Search, RefreshCw, Download, Printer, Bell, Package, Calendar } from 'lucide-react';

export default function SalesWorkerExpiringProducts({ hideHeader = false, refreshTrigger = 0 }) {
  const { showToast, ToastContainer } = useToast();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/sales/products/all');
      
      const now = new Date();
      now.setHours(0,0,0,0);
      const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const expiringItems = (res?.data || res || []).map(item => {
        const qty = parseInt(item.stock_quantity) || 0;
        let daysLeft = null;
        let isExpiring = false;

        if (item.expiry_date) {
          const expDate = new Date(item.expiry_date);
          if (expDate > now && expDate <= in90Days) {
            isExpiring = true;
            daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
          }
        }
        
        return {
          ...item,
          qty,
          daysLeft,
          isExpiring
        };
      }).filter(item => item.isExpiring && item.qty > 0)
        .sort((a, b) => a.daysLeft - b.daysLeft);
      
      setStock(expiringItems);
    } catch (e) {
      showToast('Failed to load expiring products', 'error');
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
    showToast(`Manager Notified: ${item.name} expires in ${item.daysLeft} days.`, 'success');
  };

  return (
    <div style={hideHeader ? {} : { padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <ToastContainer />

      {/* Header */}
      {!hideHeader && (
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #eab308, #ca8a04)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(234,179,8,0.3)' }}>
              <Clock size={20} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Expiring Soon
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Medications expiring within the next 90 days
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
      <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '16px 20px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: '#fef08a', padding: 10, borderRadius: '50%' }}>
          <Clock color="#ca8a04" size={24} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#854d0e' }}>{stock.length} Items Expiring Soon</div>
          <div style={{ color: '#a16207', fontSize: 13, marginTop: 2 }}>Consider promotions or notifying your manager to manage potential waste.</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <label style={labelStyle}>Search Expiring Items</label>
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
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Medication</th>
                <th style={th}>Category</th>
                <th style={th}>Stock Qty</th>
                <th style={th}>Expiry Date</th>
                <th style={th}>Days Left</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No expiring items found.'}
                  </td>
                </tr>
              ) : filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fefce8'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}
                >
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 11 }}>
                      {item.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 800, color: '#1e293b' }}>
                    {item.qty}
                  </td>
                  <td style={{ ...td, color: '#64748b', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={13} color="#94a3b8" />
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{
                      background: item.daysLeft <= 30 ? '#fee2e2' : '#fef3c7',
                      color: item.daysLeft <= 30 ? '#991b1b' : '#92400e',
                      border: `1px solid ${item.daysLeft <= 30 ? '#fca5a5' : '#fde68a'}`,
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block'
                    }}>
                      {item.daysLeft} Days
                    </span>
                  </td>
                  <td style={td}>
                    <button onClick={() => handleNotifyManager(item)} style={{ padding: '6px 12px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <Bell size={12} /> Notify
                    </button>
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

const topBtnStyle = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const th = { padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const td = { padding: '14px 16px', color: '#1e293b', verticalAlign: 'middle' };
