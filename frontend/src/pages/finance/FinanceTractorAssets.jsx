import React, { useState, useEffect, useCallback } from 'react';
import { Tractor, DollarSign, CheckCircle, AlertCircle, RefreshCw, Save, TrendingUp } from 'lucide-react';
import apiClient from '../../services/apiClient';

/* ── Green University Palette ── */
const G = {
  dark:    '#1B5E20',
  forest:  '#228B22',
  emerald: '#2E8B57',
  leaf:    '#4CAF50',
  sage:    '#A5D6A7',
  olive:   '#6B8E23',
  mint:    '#98FF98',
  lime:    '#8BC34A',
  brown:   '#8D6E63',
  sky:     '#87CEEB',
  white:   '#FFFFFF',
  lightGray: '#F5F5F5',
  text:    '#424242',
  warning: '#FF9800',
  error:   '#F44336',
};

/* ── In-App Toast ── */
const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} onClick={() => remove(t.id)} style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        background: t.type === 'success' ? G.dark : t.type === 'error' ? G.error : G.warning,
        color: '#fff', padding: '12px 18px', borderRadius: 0,
        borderLeft: `5px solid ${t.type === 'success' ? G.leaf : t.type === 'error' ? '#b71c1c' : '#e65100'}`,
        boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2)',
        fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
        minWidth: 300, animation: 'slideInToast 0.3s ease',
      }}>
        {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

export default function FinanceTractorAssets() {
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState({});
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg: msg, type, message: msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/tractors');
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (data?.data || []);
      setTractors(list);
      const vals = {};
      list.forEach(c => { vals[c.id] = c.asset_value || ''; });
      setEditValues(vals);
    } catch { addToast('Failed to load vehicles', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (tractor) => {
    const val = parseFloat(editValues[tractor.id]);
    if (isNaN(val) || val < 0) { addToast('Enter a valid positive value', 'error'); return; }
    setSaving(p => ({ ...p, [tractor.id]: true }));
    try {
      await apiClient.patch(`/tractors/${tractor.id}/asset-value`, { asset_value: val });
      // Immediately update local state so KPI totals and table reflect the new value right away
      setTractors(prev => prev.map(c => c.id === tractor.id ? { ...c, asset_value: val } : c));
      addToast(`✅ ${tractor.name}: ETB ${val.toLocaleString()} saved`, 'success');
    } catch { addToast('Failed to update asset value', 'error'); }
    finally { setSaving(p => ({ ...p, [tractor.id]: false })); }
  };

  const totalValue = tractors.reduce((sum, c) => sum + parseFloat(c.asset_value || 0), 0);
  const totalTractors = tractors.length;
  const publishedCount = tractors.filter(c => !c.deleted_at).length;
  const internalCount = tractors.filter(c => c.deleted_at).length;

  return (
    <div style={{ minHeight: '100vh', background: G.lightGray, fontFamily: "'Inter', sans-serif", color: G.text }}>
      <style>{`
        @keyframes slideInToast { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        .av-btn { transition: transform 0.08s, box-shadow 0.08s; }
        .av-btn:hover { transform: translateY(-2px); }
        .av-btn:active { transform: translateY(3px) !important; box-shadow: none !important; }
        .av-row:hover { background: #e8f5e9 !important; }
        input[type=number]:focus { outline: 2px solid ${G.emerald}; outline-offset: 1px; }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      {/* ── Header ── */}
      <div style={{ background: G.dark, padding: '24px 32px', borderBottom: `4px solid ${G.olive}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: G.mint, letterSpacing: 1, textTransform: 'uppercase' }}>
              🚜 Tractor & Machinery Asset Valuation
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: G.sage }}>
              Set and manage financial values for all registered farming machines (AgriRent)
            </p>
          </div>
          <button className="av-btn" onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: G.emerald, color: '#fff', border: `2px solid ${G.olive}`,
            padding: '10px 20px', borderRadius: 0, cursor: 'pointer',
            fontWeight: 800, fontSize: 13, textTransform: 'uppercase',
            boxShadow: `0 5px 0 ${G.dark}`,
          }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* ── KPI Summary ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
          {[
            { label: 'Total Registered Assets', value: totalTractors, icon: Tractor, color: G.forest, bg: G.sage },
            { label: 'Published', value: publishedCount, icon: CheckCircle, color: G.dark, bg: '#C8E6C9' },
            { label: 'Internal Only', value: internalCount, icon: AlertCircle, color: G.warning, bg: '#FFF8E1' },
            { label: 'Total Asset Value', value: `ETB ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: G.emerald, bg: '#E8F5E9' },
          ].map((k, i) => (
            <div key={i} style={{
              background: G.white, border: `2px solid ${G.sage}`,
              borderTop: `5px solid ${k.color}`, padding: '20px 24px',
              boxShadow: `0 4px 0 ${G.sage}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</div>
                </div>
                <div style={{ background: k.bg, padding: 10 }}>
                  <k.icon size={22} color={k.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={{ background: G.white, border: `2px solid ${G.sage}`, overflow: 'hidden', boxShadow: `0 6px 0 ${G.sage}` }}>
          {/* Table Header */}
          <div style={{ background: G.dark, padding: '14px 20px', borderBottom: `3px solid ${G.olive}` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: G.mint, textTransform: 'uppercase', letterSpacing: 1 }}>
              📋 Tractor & Machine Asset Register
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: G.emerald }}>
              <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>🌿</div>
              <div style={{ fontWeight: 700 }}>Loading machines...</div>
            </div>
          ) : tractors.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: G.olive }}>
              <Tractor size={48} color={G.sage} style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: 16 }}>No machines registered yet</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#E8F5E9', borderBottom: `2px solid ${G.sage}` }}>
                  {['#', 'Machine', 'Type', 'Spec', 'Daily Rate', 'Status', 'Asset Value (ETB)', 'Action'].map((h, i) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: i >= 6 ? 'center' : 'left',
                      fontSize: 11, fontWeight: 900, color: G.dark,
                      textTransform: 'uppercase', letterSpacing: 0.8,
                      borderRight: i < 7 ? `1px solid ${G.sage}` : 'none',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tractors.map((tractor, idx) => (
                  <tr key={tractor.id} className="av-row" style={{
                    borderBottom: `1px solid ${G.sage}`,
                    background: idx % 2 === 0 ? G.white : '#F9FBE7',
                    transition: 'background 0.15s',
                  }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: G.olive, fontWeight: 700, borderRight: `1px solid ${G.sage}` }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, background: G.sage, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {tractor.image1
                            ? <img src={getImageUrl(tractor.image1)} alt={tractor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Tractor size={20} color={G.dark} />}
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 14, color: G.dark }}>{tractor.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: G.olive, fontWeight: 700, borderRight: `1px solid ${G.sage}` }}>{tractor.tractorType || '—'}</td>
                    <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}` }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: G.text }}>
                        <span style={{ background: '#E8F5E9', padding: '2px 8px', fontWeight: 700 }}>⚙️ {tractor.transmission}</span>
                        <span style={{ background: '#FFF8E1', padding: '2px 8px', fontWeight: 700 }}>⛽ {tractor.fuelType}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: 14, color: G.forest, borderRight: `1px solid ${G.sage}` }}>
                      ETB {Number(tractor.dailyRate || tractor.daily_rate || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                      {tractor.deleted_at ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#FFF8E1', color: '#E65100',
                          padding: '4px 10px', fontSize: 11, fontWeight: 800,
                          border: '1px solid #E6510030',
                        }}>🔒 Internal Only</span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#E8F5E9', color: G.forest,
                          padding: '4px 10px', fontSize: 11, fontWeight: 800,
                          border: `1px solid ${G.forest}30`,
                        }}>✅ Published</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}` }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter value..."
                        value={editValues[tractor.id] ?? ''}
                        onChange={e => setEditValues(p => ({ ...p, [tractor.id]: e.target.value }))}
                        style={{
                          width: '100%', padding: '8px 10px', border: `2px solid ${G.sage}`,
                          fontWeight: 700, fontSize: 13, color: G.dark, background: '#F9FBE7',
                          boxSizing: 'border-box', borderRadius: 0, outline: 'none',
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button className="av-btn" onClick={() => handleSave(tractor)} disabled={saving[tractor.id]} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: saving[tractor.id] ? G.sage : G.forest, color: '#fff',
                        border: `2px solid ${G.dark}`, padding: '8px 16px',
                        cursor: saving[tractor.id] ? 'not-allowed' : 'pointer',
                        fontWeight: 800, fontSize: 12, textTransform: 'uppercase',
                        boxShadow: saving[tractor.id] ? 'none' : `0 4px 0 ${G.dark}`,
                        opacity: saving[tractor.id] ? 0.7 : 1,
                      }}>
                        <Save size={13} />
                        {saving[tractor.id] ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
