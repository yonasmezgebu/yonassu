import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Car, DollarSign, CheckCircle, AlertCircle, RefreshCw, Save, TrendingUp, X } from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const G = {
  dark:      '#2563EB', forest:    '#16A34A', emerald:   '#16A34A',
  leaf:      '#16A34A', sage:      '#E5E7EB', olive:     '#D97706',
  mint:      '#16A34A', lime:      '#16A34A', brown:     '#D97706',
  sky:       '#0284C7', white:     '#FFFFFF', lightGray: '#F9FAFB',
  darkGray:  '#4B5563', orange:    '#F59E0B', red:       '#DC2626',
  warning:   '#D97706',
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
        <div key={t.id} className={'fva-toast' + (t.type === 'error' ? ' error' : t.type === 'warn' ? ' warn' : ' success')} style={{
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
    className="fva-btn"
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
    className="fva-stat"
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
    <div className="fva-page" style={{
      background: '#FFFFFF', minHeight: '100vh', width: '100%',
      fontFamily: "'Inter','Segoe UI',sans-serif", boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes fva-spin { 100% { transform: rotate(360deg); } }
        .fva-spin { animation: fva-spin 1s linear infinite; }
        * { box-sizing: border-box; }

        .fva-page { background: #F5F6FA; min-height: 100vh; width: 100%; }
        .fva-content { max-width: 1600px; margin: 0 auto; padding: 0 !important; }

        .fva-header {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px; padding: 24px 24px 16px;
          border-bottom: 1px solid #E5E7EB; background: #fff;
        }
        .fva-header-icon {
          width: 44px; height: 44px; border-radius: 10px; border: 1px solid #E5E7EB !important;
          display: flex !important; align-items: center; justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,.06);
        }
        .fva-header-title { font-size: 26px !important; font-weight: 700 !important; color: #111827; letter-spacing: -0.4px; }
        .fva-header-sub { font-size: 14px; color: #6B7280; margin-top: 2px; font-weight: 400; }

        .fva-stat {
          background: #fff !important; border: 1px solid #E5E7EB !important; border-radius: 10px;
          padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,.06);
          transition: box-shadow .15s ease-in-out, transform .15s ease-in-out;
        }
        .fva-stat:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }

        .fva-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          padding: 24px;
        }

        .fva-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          height: 36px; padding: 0 16px; border-radius: 8px;
          font-weight: 600; font-size: 14px; letter-spacing: 0.01em;
          white-space: nowrap; text-transform: none !important;
          transition: background .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
          cursor: pointer; font-family: inherit;
        }
        .fva-btn:hover:not(:disabled) { background: var(--color-gold) !important; border-color: var(--color-gold) !important; color: var(--color-gold-text) !important; }
        .fva-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
        .fva-btn:disabled { opacity: .5; cursor: not-allowed; }

        .fva-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; background: #fff !important; border-radius: 10px; margin: 24px; padding: 80px 24px !important; color: #6B7280 !important; font-weight: 600; font-size: 15px; }
        .fva-loading span { display: inline-flex; align-items: center; gap: 10px; }

        .fva-empty { background: #fff !important; border: 1px dashed #E5E7EB !important; border-radius: 10px; margin: 24px; padding: 70px 40px !important; }
        .fva-empty-title { font-size: 20px !important; font-weight: 600 !important; color: #111827 !important; text-transform: none !important; letter-spacing: 0 !important; }

        .fva-table-scroll { border: 1px solid #E5E7EB !important; border-radius: 10px; overflow-x: auto; background: #fff; margin: 0 24px; }
        .fva-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 1000px; }
        .fva-table thead tr { background: #F9FAFB !important; }
        .fva-table th, .fva-table td { border-bottom: 1px solid #E5E7EB; border-left: none !important; border-right: none !important; }
        .fva-table th { padding: 12px 18px !important; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; font-size: 12px; color: #6B7280; white-space: nowrap; }
        .fva-table th.fva-th { color: #6B7280 !important; }
        .fva-table th:nth-child(5), .fva-table th:nth-child(7),
        .fva-table td:nth-child(5), .fva-table td:nth-child(7) { text-align: right !important; }
        .fva-table td:nth-child(5), .fva-table td:nth-child(7) { font-variant-numeric: tabular-nums; }
        .fva-table td { padding: 14px 18px !important; font-size: 14px; }
        .fva-table tbody tr { background: #fff !important; transition: background .15s; }
        .fva-table tbody tr:hover { background: #F9FAFB !important; }

        .fva-thumb { border-radius: 8px; border: 1px solid #E5E7EB !important; background: #F9FAFB !important; }
        .fva-chip { background: #F9FAFB !important; border: 1px solid #E5E7EB !important; border-radius: 999px; padding: 3px 10px !important; font-weight: 600 !important; font-size: 12px !important; color: #4B5563 !important; }
        .fva-status { border-radius: 999px; border: none !important; padding: 2px 10px !important; font-size: 12px !important; font-weight: 600 !important; }

        .fva-input {
          width: 100%; height: 36px; padding: 0 12px; border: 1px solid #E5E7EB; border-radius: 8px;
          font-weight: 600; font-size: 14px; color: #111827; background: #fff;
          outline: none; transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
        }
        .fva-input:focus, .fva-input:not(:placeholder-shown) {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }

        .fva-tfoot { background: #F9FAFB !important; }
        .fva-tfoot td { border-bottom: none !important; }
        .fva-tfoot td:first-child { color: #111827 !important; font-weight: 700 !important; text-transform: none !important; font-size: 13px !important; letter-spacing: 0 !important; }
        .fva-tfoot td:last-child { color: #2563EB !important; font-weight: 700 !important; font-size: 16px !important; text-align: right !important; font-variant-numeric: tabular-nums; }

        .fva-toast {
          pointer-events: all; background: #fff !important; color: #111827 !important;
          padding: 12px 16px; display: flex; align-items: center; gap: 12px;
          min-width: 280px; max-width: 380px; border: 1px solid #E5E7EB;
          border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,.08);
          animation: fva-toast-in .2s ease;
        }
        .fva-toast span { font-weight: 600; }
        .fva-toast button { color: #6B7280 !important; border-radius: 6px; }
        .fva-toast button:hover { background: #F9FAFB; }
        .fva-toast.success { border-left: 4px solid #16A34A; }
        .fva-toast.error { border-left: 4px solid #DC2626; }
        .fva-toast.warn { border-left: 4px solid #D97706; }
        .fva-toast.success svg { color: #16A34A; }
        .fva-toast.error svg { color: #DC2626; }
        .fva-toast.warn svg { color: #D97706; }
        @keyframes fva-toast-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }

        @media (max-width: 1024px) { .fva-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .fva-kpi-grid { grid-template-columns: repeat(2, 1fr); padding: 16px; gap: 12px; }
          .fva-content { padding: 0 !important; }
          .fva-header { padding: 16px 16px 12px; }
          .fva-header-title { font-size: 22px !important; }
          .fva-table-scroll { margin: 0 16px; }
          .fva-btn { min-height: 44px; }
        }
        @media (max-width: 600px) {
          .fva-kpi-grid { grid-template-columns: 1fr; }
          .fva-loading, .fva-empty { margin: 16px; }
        }
        @media (max-width: 480px) {
          .fva-table-scroll { margin: 0 12px; }
          .fva-stat { padding: 16px; }
          .fva-btn { padding: 0 14px; }
        }
      `}</style>

      <ToastContainer toasts={toasts} onClose={remove} />

      {/* ── CONTENT WRAPPER ── */}
      <div className="fva-content" style={{ padding: '20px 24px' }}>

        {/* ── PAGE HEADER ── */}
        <div className="fva-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 20,
          paddingBottom: 14, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="fva-header-icon" style={{ background: G.forest, padding: '10px 12px', border: `2px solid ${G.dark}`, display: 'flex' }}>
              <Car size={22} color="#fff" />
            </div>
            <div>
              <div className="fva-header-title" style={{ fontSize: 22, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                Vehicle &amp; Rental Asset Valuation
              </div>
              <div className="fva-header-sub" style={{ fontSize: 13, color: G.darkGray, marginTop: 2, fontWeight: 500 }}>
                Finance Dashboard · Set and manage financial values for all registered vehicles
              </div>
            </div>
          </div>
          <FlatBtn icon={loading ? null : RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
            {loading ? <SegmentedSpinner size={14} /> : 'Refresh Ledger'}
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
          <div className="fva-loading" style={{ textAlign: 'center', padding: '80px 24px', color: G.forest, fontWeight: 800, fontSize: 18 }}>
            <SegmentedSpinner size={32} />
            <span>Loading Ledger…</span>
          </div>
        ) : cars.length === 0 ? (
          <div className="fva-empty" style={{ textAlign: 'center', padding: '70px 40px', background: G.lightGray, border: `2px dashed ${G.sage}` }}>
            <Car size={56} color={G.sage} style={{ marginBottom: 16, display: 'block', margin: '0 auto 14px' }} />
            <div className="fva-empty-title" style={{ fontSize: 20, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              No Vehicles Registered
            </div>
          </div>
        ) : (
          <div className="fva-table-scroll" style={{ border: `2px solid ${G.dark}`, overflowX: 'auto' }}>
            <table className="fva-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1000 }}>
              <thead>
                <tr className="fva-thead" style={{ background: G.dark }}>
                  {['#', 'Vehicle', 'Type', 'Spec', 'Daily Rate', 'Status', 'Asset Value (ETB)', 'Action'].map((h, hi) => (
                    <th key={h} className="fva-th" style={{
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
                        <div className="fva-thumb" style={{ width: 44, height: 44, background: G.sage, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${G.dark}` }}>
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
                        <span className="fva-chip" style={{ background: G.lightGray, padding: '3px 8px', fontWeight: 800, border: `1px solid ${G.sage}` }}>⚙️ {car.transmission}</span>
                        <span className="fva-chip" style={{ background: G.lightGray, padding: '3px 8px', fontWeight: 800, border: `1px solid ${G.sage}` }}>⛽ {car.fuelType}</span>
                        <span className="fva-chip" style={{ background: G.lightGray, padding: '3px 8px', fontWeight: 800, border: `1px solid ${G.sage}` }}>👥 {car.seats}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontWeight: 900, fontSize: 14, color: G.forest, border: `1px solid ${G.sage}` }}>
                      ETB {Number(car.dailyRate || car.daily_rate || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '13px 18px', border: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                      {car.deleted_at ? (
                        <span className="fva-status" style={{
                          background: G.warning, color: '#fff',
                          padding: '4px 10px', fontSize: 11, fontWeight: 800,
                          border: `2px solid ${G.dark}`, display: 'inline-block'
                        }}>Internal Only</span>
                      ) : (
                        <span className="fva-status" style={{
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
                <tr className="fva-tfoot" style={{ background: G.dark }}>
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
