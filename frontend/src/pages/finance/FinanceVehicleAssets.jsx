import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Car, DollarSign, CheckCircle, AlertCircle, RefreshCw, Save, TrendingUp, X } from 'lucide-react';
import apiClient from '../../services/apiClient';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const G = {
  forest:    '#228B22', dark:      '#1B5E20', emerald:   '#2E8B57',
  leaf:      '#4CAF50', sage:      '#A5D6A7', olive:     '#6B8E23',
  mint:      '#98FF98', lime:      '#8BC34A', brown:     '#8D6E63',
  sky:       '#87CEEB', white:     '#FFFFFF', lightGray: '#F5F5F5',
  darkGray:  '#424242', orange:    '#FF9800', red:       '#F44336',
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, remove }) => (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const bg   = t.type === 'error' ? G.red : t.type === 'warn' ? G.warning : G.forest;
      const Icon = t.type === 'error' ? AlertCircle : t.type === 'warn' ? AlertCircle : CheckCircle;
      return (
        <div key={t.id} style={{
          pointerEvents: 'all', background: bg, color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          minWidth: 280, maxWidth: 380, border: `2px solid ${G.dark}`,
        }}>
          <Icon size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2, pointerEvents: 'all' }}>
            <X size={16} />
          </button>
        </div>
      );
    })}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((msg, type = 'success') => {
    const id = ++idRef.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, push, remove };
}

// ─── FLAT BUTTON ─────────────────────────────────────────────────────────────
const FlatBtn = ({ children, onClick, color = G.emerald, icon: Icon, disabled, small }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? G.sage : color,
      color: '#fff',
      border: `2px solid ${G.dark}`,
      padding: small ? '7px 14px' : '11px 20px',
      fontWeight: 800,
      fontSize: small ? 12 : 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      transition: 'background 0.2s',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
      textTransform: 'uppercase',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = G.dark; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = color; }}
  >
    {Icon && <Icon size={small ? 13 : 16} />}
    {children}
  </button>
);

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, Icon, sub }) => (
  <div
    style={{
      background: '#fff', border: `2px solid ${G.dark}`,
      padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'background 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#F1F8E9'}
    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: color, padding: 10, border: `2px solid ${G.dark}`, display: 'flex' }}>
        <Icon size={20} color="#fff" />
      </div>
      {sub && <span style={{ fontSize: 11, color: G.olive, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{sub}</span>}
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, lineHeight: 1.1, marginTop: 4 }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 12, color: G.darkGray, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {label}
    </div>
    <div style={{ height: 3, background: color, marginTop: 2 }} />
  </div>
);

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FinanceVehicleAssets() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState({});
  const { toasts, push, remove } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/cars');
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (data?.data || []);
      setCars(list);
      const vals = {};
      list.forEach(c => { vals[c.id] = c.asset_value || ''; });
      setEditValues(vals);
    } catch { 
      push('Failed to load vehicles', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (car) => {
    const val = parseFloat(editValues[car.id]);
    if (isNaN(val) || val < 0) { 
      push('Enter a valid positive value', 'error'); 
      return; 
    }
    setSaving(p => ({ ...p, [car.id]: true }));
    try {
      await apiClient.patch(`/cars/${car.id}/asset-value`, { asset_value: val });
      setCars(prev => prev.map(c => c.id === car.id ? { ...c, asset_value: val } : c));
      push(`${car.name}: ETB ${val.toLocaleString()} saved`);
    } catch { 
      push('Failed to update asset value', 'error'); 
    } finally { 
      setSaving(p => ({ ...p, [car.id]: false })); 
    }
  };

  const totalValue = cars.reduce((sum, c) => sum + parseFloat(c.asset_value || 0), 0);
  const totalCars = cars.length;
  const publishedCount = cars.filter(c => !c.deleted_at).length;
  const internalCount = cars.filter(c => c.deleted_at).length;

  return (
    <div style={{
      background: '#FFFFFF', minHeight: '100vh', width: '100%',
      fontFamily: "'Inter','Segoe UI',sans-serif", boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes fva-spin { 100% { transform: rotate(360deg); } }
        .fva-spin { animation: fva-spin 1s linear infinite; }
        * { box-sizing: border-box; }

        .fva-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .fva-table-row { transition: background 0.15s; }
        .fva-table-row:hover { background: #E8F5E9 !important; }

        .fva-input {
          width: 100%; padding: 10px 12px; border: 2px solid ${G.sage};
          font-weight: 700; font-size: 14px; color: ${G.dark}; background: #fff;
          outline: none; transition: border-color 0.2s;
        }
        .fva-input:focus, .fva-input:not(:placeholder-shown) {
          border-color: ${G.forest};
        }

        @media (max-width: 1100px) { .fva-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 600px)  { .fva-kpi-grid { grid-template-columns: 1fr; } }
      `}</style>

      <ToastContainer toasts={toasts} onClose={remove} />

      {/* ── CONTENT WRAPPER ── */}
      <div style={{ padding: '20px 24px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 20,
          paddingBottom: 14, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: G.forest, padding: '10px 12px', border: `2px solid ${G.dark}`, display: 'flex' }}>
              <Car size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                Vehicle &amp; Rental Asset Valuation
              </div>
              <div style={{ fontSize: 13, color: G.darkGray, marginTop: 2, fontWeight: 500 }}>
                Finance Dashboard · Set and manage financial values for all registered vehicles
              </div>
            </div>
          </div>
          <FlatBtn icon={RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh Ledger'}
          </FlatBtn>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="fva-kpi-grid">
          <StatCard label="Total Registered" value={totalCars} color={G.forest} Icon={Car} />
          <StatCard label="Published" value={publishedCount} color={G.emerald} Icon={CheckCircle} />
          <StatCard label="Internal Only" value={internalCount} color={G.warning} Icon={AlertCircle} />
          <StatCard label="Total Asset Value" value={`ETB ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={G.dark} Icon={DollarSign} />
        </div>

        {/* ── TABLE ── */}
        {loading && cars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: G.forest, fontWeight: 800, fontSize: 18 }}>
            <RefreshCw size={32} className="fva-spin" style={{ display: 'block', margin: '0 auto 14px', color: G.forest }} />
            Loading Ledger…
          </div>
        ) : cars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 40px', background: G.lightGray, border: `2px dashed ${G.sage}` }}>
            <Car size={56} color={G.sage} style={{ marginBottom: 16, display: 'block', margin: '0 auto 14px' }} />
            <div style={{ fontSize: 20, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              No Vehicles Registered
            </div>
          </div>
        ) : (
          <div style={{ border: `2px solid ${G.dark}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1000 }}>
              <thead>
                <tr style={{ background: G.dark }}>
                  {['#', 'Vehicle', 'Type', 'Spec', 'Daily Rate', 'Status', 'Asset Value (ETB)', 'Action'].map((h, hi) => (
                    <th key={h} style={{
                      padding: '15px 18px', fontWeight: 900, textTransform: 'uppercase',
                      letterSpacing: 1, fontSize: 11, color: '#fff',
                      border: `1px solid ${G.forest}`,
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cars.map((car, idx) => (
                  <tr key={car.id} className="fva-table-row" style={{ background: idx % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `1px solid ${G.sage}` }}>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: G.olive, fontWeight: 900, border: `1px solid ${G.sage}` }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '13px 18px', border: `1px solid ${G.sage}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, background: G.sage, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${G.dark}` }}>
                          {car.image1
                            ? <img src={getImageUrl(car.image1)} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Car size={20} color={G.dark} />}
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 14, color: G.dark }}>{car.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: G.darkGray, fontWeight: 700, border: `1px solid ${G.sage}` }}>
                      {car.carType || '—'}
                    </td>
                    <td style={{ padding: '13px 18px', border: `1px solid ${G.sage}` }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, color: G.dark }}>
                        <span style={{ background: G.lightGray, padding: '3px 8px', fontWeight: 800, border: `1px solid ${G.sage}` }}>⚙️ {car.transmission}</span>
                        <span style={{ background: G.lightGray, padding: '3px 8px', fontWeight: 800, border: `1px solid ${G.sage}` }}>⛽ {car.fuelType}</span>
                        <span style={{ background: G.lightGray, padding: '3px 8px', fontWeight: 800, border: `1px solid ${G.sage}` }}>👥 {car.seats}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontWeight: 900, fontSize: 14, color: G.forest, border: `1px solid ${G.sage}` }}>
                      ETB {Number(car.dailyRate || car.daily_rate || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '13px 18px', border: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                      {car.deleted_at ? (
                        <span style={{
                          background: G.warning, color: '#fff',
                          padding: '4px 10px', fontSize: 11, fontWeight: 800,
                          border: `2px solid ${G.dark}`, display: 'inline-block'
                        }}>Internal Only</span>
                      ) : (
                        <span style={{
                          background: G.leaf, color: '#fff',
                          padding: '4px 10px', fontSize: 11, fontWeight: 800,
                          border: `2px solid ${G.dark}`, display: 'inline-block'
                        }}>Published</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 18px', border: `1px solid ${G.sage}` }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter value..."
                        value={editValues[car.id] ?? ''}
                        onChange={e => setEditValues(p => ({ ...p, [car.id]: e.target.value }))}
                        className="fva-input"
                      />
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right', border: `1px solid ${G.sage}` }}>
                      <FlatBtn small icon={Save} color={G.forest} onClick={() => handleSave(car)} disabled={saving[car.id]}>
                        {saving[car.id] ? 'Saving' : 'Save'}
                      </FlatBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: G.dark }}>
                  <td colSpan={6} style={{ padding: '15px 18px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, color: '#fff', border: `1px solid ${G.forest}` }}>
                    Total Fleet Value — {cars.length} Vehicle{cars.length !== 1 ? 's' : ''}
                  </td>
                  <td colSpan={2} style={{ padding: '15px 18px', fontWeight: 900, fontSize: 16, textAlign: 'left', color: G.mint, whiteSpace: 'nowrap', border: `1px solid ${G.forest}` }}>
                    ETB {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
