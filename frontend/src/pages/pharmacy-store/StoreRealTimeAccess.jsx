import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, RefreshCw, Filter, ArrowUpRight, ArrowRightLeft, Sliders, ClipboardCheck, Package } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const G = {
  forest:'#228B22', dark:'#1B5E20', emerald:'#2E8B57', leaf:'#4CAF50',
  sage:'#A5D6A7', olive:'#6B8E23', mint:'#98FF98',
  brown:'#8D6E63', white:'#FFFFFF', lightGray:'#F5F5F5',
  darkGray:'#424242', orange:'#FF9800', red:'#F44336', sky:'#0288D1',
};
const API = '/api/v1/store-inventory';
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

const TYPE_META = {
  RECEIPT:    { label: 'Receipt',    color: G.leaf,    bg: '#E8F5E9', icon: <Package size={20} /> },
  ISSUE:      { label: 'Issue',      color: G.orange,  bg: '#FFF3E0', icon: <ArrowUpRight size={20} /> },
  TRANSFER:   { label: 'Transfer',   color: G.brown,   bg: '#EFEBE9', icon: <ArrowRightLeft size={20} /> },
  ADJUSTMENT: { label: 'Adjustment', color: G.emerald, bg: '#E0F2F1', icon: <Sliders size={20} /> },
  COUNT:      { label: 'Count',      color: G.sky,     bg: '#E3F2FD', icon: <ClipboardCheck size={20} /> },
};

const StoreRealTimeAccess = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`${API}/movements`);
      // sort by newest first
      const acts = (d.data || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setActivities(acts);
    } catch (e) { NotifStore.push('Failed to load activities: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? activities : activities.filter(a => (a.movement_type || a.type || '').toUpperCase() === filter);

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: G.sky, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <Activity size={24} color={G.white} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Real-Time Access</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Live activity feed across all store operations</p>
            </div>
          </div>
          <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.5)`, color: G.white, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
            <SegmentedSpinner size={14} />
            Refresh Feed
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, background: G.white, padding: '14px 20px', border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, alignItems: 'center' }}>
          <Filter size={16} color={G.olive} />
          <span style={{ fontWeight: 900, color: G.dark, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>Filter Feed:</span>
          {['ALL', 'RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'COUNT'].map(f => {
            const isActive = filter === f;
            const meta = TYPE_META[f] || { color: G.dark };
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', border: `2px solid ${isActive ? G.dark : G.sage}`, background: isActive ? G.dark : G.white, color: isActive ? G.white : meta.color, cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: "'Inter', sans-serif", boxShadow: isActive ? `2px 2px 0 ${G.sage}` : 'none', transition: 'all .1s' }}>
                {f === 'ALL' ? 'All Activity' : meta.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <SegmentedSpinner size={24} />
            <div style={{ color: G.forest, fontWeight: 800 }}>Loading live feed…</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((a, i) => {
              const typeRaw = (a.movement_type || a.type || '').toUpperCase();
              const meta = TYPE_META[typeRaw] || { label: typeRaw, color: G.darkGray, bg: G.lightGray, icon: <Activity size={20} /> };
              return (
                <div key={a.id || i}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', background: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${meta.color}`, transition: 'transform 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${meta.color}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `4px 4px 0 ${meta.color}`; }}
                  onClick={() => navigate('/pharmacy-store/stock-movement')}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: meta.bg, border: `2px solid ${meta.color}`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 900, color: G.dark, fontSize: 15 }}>{a.reference_no || a.ref_no || `REF-${a.id}`}</span>
                      <span style={{ padding: '3px 8px', background: meta.bg, border: `1px solid ${meta.color}`, color: meta.color, fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {meta.label}
                      </span>
                    </div>
                    <div style={{ color: G.darkGray, fontSize: 13 }}>
                      <strong>{a.drug_name || 'Multiple items'}</strong> — {a.quantity_in ? `Received ${a.quantity_in}` : a.quantity_out ? `Issued ${a.quantity_out}` : 'Updated inventory'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: G.olive, fontSize: 12 }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                    </div>
                    <div style={{ color: G.darkGray, fontSize: 11, marginTop: 2 }}>
                      {a.created_at ? new Date(a.created_at).toLocaleTimeString() : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: G.sage, fontWeight: 800, border: `3px dashed ${G.sage}`, background: G.white }}>
                No recent activity found matching your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreRealTimeAccess;
