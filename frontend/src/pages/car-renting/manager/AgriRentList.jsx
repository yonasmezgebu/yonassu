import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor, RefreshCw, DollarSign, CheckCircle, EyeOff,
  Layers, ArrowLeft, Fuel, Settings, Search
} from 'lucide-react';
import tractorService from '../../../services/tractorService';

/* ── Green University Palette ── */
const G = {
  dark:     '#1B5E20',
  forest:   '#228B22',
  emerald:  '#2E8B57',
  leaf:     '#4CAF50',
  sage:     '#A5D6A7',
  olive:    '#6B8E23',
  mint:     '#98FF98',
  lime:     '#8BC34A',
  white:    '#FFFFFF',
  lightGray:'#F5F5F5',
  text:     '#424242',
  warning:  '#FF9800',
  error:    '#F44336',
};

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

const AgriRentList = () => {
  const navigate = useNavigate();
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTractors = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      const res = await tractorService.getAllTractors();
      if (res.status === 'success') setTractors(res.data);
    } catch {
      console.error('Could not load tractor data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTractors(); }, [fetchTractors]);

  const totalValue = tractors.reduce((sum, t) => sum + parseFloat(t.asset_value || 0), 0);
  const publishedCount = tractors.filter(t => !t.deleted_at).length;
  const internalCount = tractors.filter(t => t.deleted_at).length;

  const filtered = tractors.filter(t =>
    !search.trim() ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.tractor_type?.toLowerCase().includes(search.toLowerCase()) ||
    t.availability?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: G.lightGray, fontFamily: "'Inter',sans-serif", color: G.text }}>
      <style>{`
        @keyframes fmSpin { from { transform:rotate(0deg);} to { transform:rotate(360deg);} }
        .ag-btn { transition: transform .08s, box-shadow .08s; }
        .ag-btn:hover { transform: translateY(-2px); }
        .ag-btn:active { transform: translateY(3px) !important; box-shadow: none !important; }
        .ag-row:hover { background: #E8F5E9 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: G.dark, padding: '0 28px', borderBottom: `4px solid ${G.olive}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${G.mint},${G.lime},${G.leaf},${G.mint})` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: G.mint, letterSpacing: 1, textTransform: 'uppercase' }}>
              🚜 AgriRent Machine List
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: G.sage }}>
              Full registry of all farming machines — published and internal
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ag-btn" onClick={() => fetchTractors(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: G.emerald, color: '#fff', border: `2px solid ${G.olive}`,
              padding: '10px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 12, textTransform: 'uppercase',
              boxShadow: `0 5px 0 ${G.dark}`,
            }}>
              <RefreshCw size={14} style={{ animation: isRefreshing ? 'fmSpin 1s linear infinite' : 'none' }} /> Refresh
            </button>
            <button className="ag-btn" onClick={() => navigate('/car-renting/manager/tractor-fleet')} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: G.lime, color: G.dark, border: `2px solid ${G.olive}`,
              padding: '10px 18px', cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
              boxShadow: `0 5px 0 ${G.dark}`,
            }}>
              <ArrowLeft size={14} /> Back to Register
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{
        background: G.forest, padding: '20px 28px', borderBottom: `3px solid ${G.olive}`,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16,
      }}>
        {[
          { icon: Layers,      label: 'Total Machines',    value: tractors.length,       color: G.mint },
          { icon: CheckCircle, label: 'Published (Live)',   value: publishedCount,        color: G.lime },
          { icon: EyeOff,      label: 'Internal Only',     value: internalCount,         color: '#FFCC80' },
          { icon: DollarSign,  label: 'Total Asset Value', value: `ETB ${totalValue.toLocaleString(undefined,{minimumFractionDigits:0})}`, color: G.mint },
        ].map((k, i) => (
          <div key={i} style={{
            background: G.dark, border: `2px solid ${G.olive}`, borderTop: `4px solid ${k.color}`,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: `0 4px 0 ${G.olive}`,
          }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10 }}>
              <k.icon size={20} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.sage, textTransform: 'uppercase', letterSpacing: 0.8 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1.2 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: '20px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: G.white, border: `2px solid ${G.sage}`, padding: '10px 16px', maxWidth: 420 }}>
          <Search size={16} color={G.olive} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, type, status..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', color: G.text }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ padding: '20px 28px' }}>
        <div style={{ background: G.white, border: `2px solid ${G.sage}`, overflow: 'hidden', boxShadow: `0 6px 0 ${G.sage}` }}>
          <div style={{ background: G.dark, padding: '14px 20px', borderBottom: `3px solid ${G.olive}` }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: G.mint, textTransform: 'uppercase', letterSpacing: 1 }}>
              📋 All AgriRent Machines — {filtered.length} machine{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: G.emerald }}>
              <Tractor size={36} color={G.sage} style={{ marginBottom: 12, animation: 'fmSpin 2s linear infinite' }} />
              <div style={{ fontWeight: 700, fontSize: 15 }}>Loading machines…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Tractor size={48} color={G.sage} style={{ marginBottom: 14 }} />
              <div style={{ fontWeight: 900, fontSize: 16, color: G.dark }}>No machines found</div>
              <div style={{ color: G.olive, fontSize: 13, marginTop: 6 }}>
                {search ? 'Try a different search term.' : 'Add machines in the Tractor Register.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#E8F5E9', borderBottom: `2px solid ${G.sage}` }}>
                    {['#', 'Machine', 'Type', 'Transmission', 'Fuel', 'Daily Rate (ETB)', 'Asset Value (ETB)', 'Availability', 'Status'].map((h, i) => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 900, color: G.dark,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        borderRight: i < 8 ? `1px solid ${G.sage}` : 'none',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, idx) => {
                    const isPublic = !t.deleted_at;
                    return (
                      <tr key={t.id} className="ag-row" style={{
                        borderBottom: `1px solid ${G.sage}`,
                        background: idx % 2 === 0 ? G.white : '#F9FBE7',
                        transition: 'background .15s',
                      }}>
                        {/* # */}
                        <td style={{ padding: '12px 16px', fontSize: 13, color: G.olive, fontWeight: 700, borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                          {idx + 1}
                        </td>
                        {/* Machine */}
                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 46, height: 46, background: G.sage, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {t.image1
                                ? <img src={getImageUrl(t.image1)} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Tractor size={20} color={G.dark} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: 14, color: G.dark }}>{t.name}</div>
                            </div>
                          </div>
                        </td>
                        {/* Type */}
                        <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: G.olive, borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                          {t.tractor_type || t.tractorType || '—'}
                        </td>
                        {/* Transmission */}
                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#E8F5E9', padding:'3px 10px', fontSize:11, fontWeight:700, color: G.dark }}>
                            <Settings size={11} /> {t.transmission || '—'}
                          </span>
                        </td>
                        {/* Fuel */}
                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#FFF8E1', padding:'3px 10px', fontSize:11, fontWeight:700, color:'#E65100' }}>
                            <Fuel size={11} /> {t.fuel_type || t.fuelType || '—'}
                          </span>
                        </td>
                        {/* Daily Rate */}
                        <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: 14, color: G.forest, borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                          ETB {Number(t.dailyRate || t.daily_rate || 0).toLocaleString()}
                        </td>
                        {/* Asset Value */}
                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                          {parseFloat(t.asset_value || 0) > 0
                            ? <span style={{ fontWeight: 900, fontSize: 14, color: G.dark }}>ETB {parseFloat(t.asset_value).toLocaleString()}</span>
                            : <span style={{ fontSize: 11, color: '#BDBDBD', fontStyle: 'italic', fontWeight: 700 }}>Not set</span>}
                        </td>
                        {/* Availability */}
                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '3px 10px', fontSize: 11, fontWeight: 800,
                            background: t.availability === 'Available' ? '#E8F5E9' : t.availability === 'Booked' ? '#E3F2FD' : '#FFEBEE',
                            color: t.availability === 'Available' ? G.forest : t.availability === 'Booked' ? '#1565C0' : G.error,
                            border: `1px solid ${t.availability === 'Available' ? G.sage : '#ccc'}`,
                          }}>
                            {t.availability || '—'}
                          </span>
                        </td>
                        {/* Publication Status */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          {isPublic ? (
                            <span style={{ background: '#E8F5E9', color: G.forest, padding: '4px 12px', fontSize: 11, fontWeight: 800, border: `1px solid ${G.forest}30`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={11} /> Published
                            </span>
                          ) : (
                            <span style={{ background: '#FFF8E1', color: '#E65100', padding: '4px 12px', fontSize: 11, fontWeight: 800, border: '1px solid #E6510030', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <EyeOff size={11} /> Internal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: G.emerald, fontWeight: 600 }}>
          💡 Finance can set asset values from the Finance Dashboard → Tractor Assets.
        </div>
      </div>
    </div>
  );
};

export default AgriRentList;
