import React, { useState, useEffect, useCallback } from 'react';
import { History, GitBranch, Loader2, Search } from 'lucide-react';
import apiClient from '../../services/apiClient';

const spin = { animation: 'spin 1s linear infinite' };
const fade = { animation: 'fadeSlide 0.4s ease-out' };

const statusStyle = (status) => {
  const map = {
    PENDING_APPROVAL: { bg: '#fef3c7', color: '#92400e' },
    COMPLETED:        { bg: '#d1fae5', color: '#065f46' },
    REJECTED:         { bg: '#fef2f2', color: '#991b1b' },
    SHIPPED:          { bg: '#dbeafe', color: '#1e40af' },
    CANCELLED:        { bg: '#f1f5f9', color: '#475569' },
  };
  return map[status] || { bg: '#f0fdf4', color: '#065f46' };
};

const PharmacyStockTransfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/branch-transfers');
      setTransfers(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const filteredTransfers = transfers.filter(t => {
    const q = search.toLowerCase();
    return (
      (t.transfer_no && t.transfer_no.toLowerCase().includes(q)) ||
      (t.drug_name && t.drug_name.toLowerCase().includes(q)) ||
      (t.from_branch && t.from_branch.toLowerCase().includes(q)) ||
      (t.to_branch && t.to_branch.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#f8fafc 50%,#eff6ff 100%)' }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, ...fade, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' }}>
            <History size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Stock Transfer History</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: 14 }}>View logs of all stock assigned or transferred between branches</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
            <input 
              type="text" 
              placeholder="Search transfers..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, width: 220, outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* ══ Transfer History Table ══ */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', ...fade }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Transfer #', 'Drug', 'From', 'Qty', 'To', 'Requested By', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '14px', textAlign: h === 'Qty' ? 'center' : 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <SegmentedSpinner size={32} />
                </td></tr>
              ) : filteredTransfers.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <GitBranch size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                  <p style={{ fontWeight: 700, margin: 0, fontSize: 16 }}>No transfer history found</p>
                  <p style={{ margin: '4px 0 0', fontSize: 14 }}>Stock assignments and transfers will appear here</p>
                </td></tr>
              ) : filteredTransfers.map((t, idx) => {
                const s = statusStyle(t.status);
                return (
                  <tr key={t.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafbfc' }}>
                    <td style={{ padding: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#0891b2' }}>{t.transfer_no || t.id}</td>
                    <td style={{ padding: '14px', fontWeight: 600 }}>{t.drug_name || '—'}</td>
                    <td style={{ padding: '14px', color: '#64748b' }}>{t.from_branch || 'Main Storage'}</td>
                    <td style={{ padding: '14px', textAlign: 'center', fontWeight: 800 }}>{t.requested_qty || t.quantity || 0}</td>
                    <td style={{ padding: '14px', color: '#64748b' }}>{t.to_branch || '—'}</td>
                    <td style={{ padding: '14px', color: '#64748b' }}>{t.requested_by_name || 'System'}</td>
                    <td style={{ padding: '14px', color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {t.requested_date || t.created_at ? new Date(t.requested_date || t.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800, background: s.bg, color: s.color }}>
                        {t.status === 'PENDING_APPROVAL' ? 'Pending' : t.status || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStockTransfer;
