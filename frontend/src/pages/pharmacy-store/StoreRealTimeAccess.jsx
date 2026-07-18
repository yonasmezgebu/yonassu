import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, RefreshCw, Filter, X } from 'lucide-react';
import { getRecentActivities, getAdjustments } from '../../utils/storeApi';

const typeStyles = {
  Receipt: { bg: '#dcfce7', color: '#166534', icon: '📥' },
  Issue: { bg: '#fff7ed', color: '#9a3412', icon: '📤' },
  Transfer: { bg: '#ecfeff', color: '#0e7490', icon: '🔄' },
  Adjustment: { bg: '#f3e8ff', color: '#6d28d9', icon: '⚖️' },
};

const getTypePath = (type, id) => {
    const m = { Receipt: 'goods-received-today', Issue: 'goods-issued-today', Transfer: 'transfers-list', Adjustment: 'stock-adjustment' };
    return '/store/' + (m[type] || 'overview');
  };

const adjStatusStyle = (s) => {
  const m = { PENDING: { bg: '#fef3c7', color: '#92400e' }, APPROVED: { bg: '#dcfce7', color: '#166534' }, REJECTED: { bg: '#fee2e2', color: '#991b1b' } };
  return m[s] || { bg: '#f1f5f9', color: '#475569' };
};

const StoreRealTimeAccess = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [adjDetail, setAdjDetail] = useState(null);
  const [adjLoading, setAdjLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getRecentActivities()
      .then(r => { setActivities(r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRowClick = (a) => {
    if (a.type !== 'Adjustment') {
      navigate(getTypePath(a.type, a.id));
      return;
    }
    setAdjLoading(true);
    getAdjustments()
      .then(r => {
        const found = (r.data || []).find(adj => adj.id === a.id || adj.adjustment_no === a.ref_no);
        setAdjDetail(found || a);
        setAdjLoading(false);
      })
      .catch(() => { setAdjDetail(a); setAdjLoading(false); });
  };

  const filtered = filter === 'All' ? activities : activities.filter(a => a.type === filter);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity color="#06b6d4" size={28} /> REAL-TIME ACCESS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Live activity feed across all store operations</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        {['All', 'Receipt', 'Issue', 'Transfer', 'Adjustment'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid ' + (filter === f ? '#0f172a' : '#cbd5e1'), background: filter === f ? '#0f172a' : 'white', color: filter === f ? 'white' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {f === 'All' ? 'All Types' : typeStyles[f]?.icon + ' ' + f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((a, i) => {
            const ts = typeStyles[a.type] || { bg: '#f1f5f9', color: '#475569', icon: '📋' };
            return (
              <div key={a.type + '-' + a.id + '-' + i} onClick={() => handleRowClick(a)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', transition: 'box-shadow 0.15s', borderLeft: '4px solid ' + ts.color }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                <span style={{ fontSize: 24 }}>{ts.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{a.ref_no || '#' + a.id}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{a.type} — {a.ref_name || '—'}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: ts.bg, color: ts.color }}>{a.type}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No activities found</div>}
        </div>
      )}

      {/* Adjustment Detail Modal */}
      {adjDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setAdjDetail(null); setAdjLoading(false); }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 520, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚖️ {adjDetail.adjustment_no || adjDetail.ref_no || 'Adjustment'}
              </h2>
              <button onClick={() => setAdjDetail(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            {adjLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Loading details...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
                  <div><strong>Drug:</strong> {adjDetail.drug_name || '—'}{adjDetail.strength ? ' (' + adjDetail.strength + ')' : ''}</div>
                  <div><strong>Status:</strong> <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: adjStatusStyle(adjDetail.status).bg, color: adjStatusStyle(adjDetail.status).color }}>{adjDetail.status || '—'}</span></div>
                  <div><strong>Type:</strong> {adjDetail.adjustment_type || '—'}</div>
                  <div><strong>Date:</strong> {adjDetail.adjustment_date ? new Date(adjDetail.adjustment_date).toLocaleString() : adjDetail.created_at ? new Date(adjDetail.created_at).toLocaleString() : '—'}</div>
                  <div><strong>Qty Before:</strong> {adjDetail.quantity_before ?? '—'}</div>
                  <div><strong>Qty After:</strong> {adjDetail.quantity_after ?? '—'}</div>
                  <div><strong>Adjustment Qty:</strong> <span style={{ fontWeight: 700, color: adjDetail.adjustment_qty > 0 ? '#15803d' : '#b91c1c' }}>{adjDetail.adjustment_qty > 0 ? '+' : ''}{adjDetail.adjustment_qty ?? '—'}</span></div>
                  <div><strong>Unit:</strong> {adjDetail.unit || '—'}</div>
                </div>
                {adjDetail.reason && <div style={{ fontSize: 13, color: '#475569', marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 6 }}><strong>Reason:</strong> {adjDetail.reason}</div>}
                {adjDetail.rejection_reason && <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 6 }}><strong>Rejection Reason:</strong> {adjDetail.rejection_reason}</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreRealTimeAccess;
