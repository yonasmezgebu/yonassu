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
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Inter',sans-serif", color: G.text }}>
      <style>{`
        @keyframes fmSpin { from { transform:rotate(0deg);} to { transform:rotate(360deg);} }
        .ag-btn { transition: transform .08s, box-shadow .08s; }
        .ag-btn:hover { transform: translateY(-2px); }
        .ag-btn:active { transform: translateY(3px) !important; box-shadow: none !important; }
        .ag-row:hover { background: #F0FDF4 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: '#FFFFFF', padding: '24px 28px 16px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🚜</span> AgriRent Machine List
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              Full registry of all farming machines — published and internal
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ag-btn" onClick={() => fetchTractors(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: G.emerald, color: '#fff', border: 'none',
              padding: '9px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13, borderRadius: 6,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <RefreshCw size={14} style={{ animation: isRefreshing ? 'fmSpin 1s linear infinite' : 'none' }} /> Refresh
            </button>
            <button className="ag-btn" onClick={() => navigate('/car-renting/manager/tractor-fleet')} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
              padding: '9px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13, borderRadius: 6,
            }}>
              <ArrowLeft size={14} /> Back to Register
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{
        background: '#F9FAFB', padding: '16px 28px', borderBottom: '1px solid #E5E7EB',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12,
      }}>
        {[
          { icon: Layers,      label: 'Total Machines',    value: tractors.length,       color: G.emerald },
          { icon: CheckCircle, label: 'Published (Live)',   value: publishedCount,        color: '#16A34A' },
          { icon: EyeOff,      label: 'Internal Only',     value: internalCount,         color: '#D97706' },
          { icon: DollarSign,  label: 'Total Asset Value', value: `ETB ${totalValue.toLocaleString(undefined,{minimumFractionDigits:0})}`, color: G.dark },
        ].map((k, i) => (
          <div key={i} style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB', borderLeft: `4px solid ${k.color}`,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ background: `${k.color}15`, padding: 10, borderRadius: 8 }}>
              <k.icon size={20} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: '16px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1px solid #D1D5DB', padding: '9px 16px', maxWidth: 420, borderRadius: 8 }}>
          <Search size={16} color='#9CA3AF' />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, type, status..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', color: G.text }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ padding: '16px 28px 28px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', overflow: 'hidden', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#F9FAFB', padding: '12px 20px', borderBottom: '2px solid #E5E7EB' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
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
                  <tr style={{ background: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
                    {['#', 'Machine', 'Type', 'Transmission', 'Fuel', 'Daily Rate (ETB)', 'Asset Value (ETB)', 'Availability', 'Status'].map((h, i) => (
                      <th key={h} style={{
                        padding: '11px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: '#374151',
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        borderRight: i < 8 ? '1px solid #E5E7EB' : 'none',
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

        <div style={{ marginTop: 14, fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
          💡 Finance can set asset values from the Finance Dashboard → Tractor Assets.
        </div>
      </div>
    </div>
  );
};

export default AgriRentList;
