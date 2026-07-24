import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Edit2, Trash2,
  EyeOff, CheckCircle, AlertTriangle, AlertCircle,
  X, RotateCcw, Layers,
  RefreshCw, Leaf
} from 'lucide-react';
import carService from '../../services/carService';

/* ══════════════════════════════════════════════════
   GREEN UNIVERSITY PALETTE
══════════════════════════════════════════════════ */
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

/* ── Image URL helper ── */
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

/* ══════════════════════════════════════════════════
   IN-APP TOAST  (No native alert/confirm)
══════════════════════════════════════════════════ */
const TCONF = {
  success: { bg: G.dark,    border: G.leaf,    Icon: CheckCircle },
  error:   { bg: G.error,   border: '#b71c1c', Icon: AlertCircle },
  warning: { bg: G.warning, border: '#e65100', Icon: AlertTriangle },
};

const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => {
      const s = TCONF[t.type] || TCONF.success;
      return (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'all', cursor: 'pointer',
          background: s.bg, color: '#fff', padding: '13px 18px',
          borderLeft: `5px solid ${s.border}`,
          boxShadow: '0 4px 0 rgba(0,0,0,.3), 0 10px 24px rgba(0,0,0,.2)',
          fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700,
          minWidth: 300, animation: 'fmSlideIn .28s ease',
        }}>
          <s.Icon size={16} />
          <span style={{ flex: 1 }}>{t.message}</span>
          <X size={14} style={{ opacity: 0.7 }} />
        </div>
      );
    })}
  </div>
);

/* ══════════════════════════════════════════════════
   IN-APP CONFIRM MODAL
══════════════════════════════════════════════════ */
const ConfirmModal = ({ open, title, message, danger, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 20,
    }}>
      <div style={{
        background: G.white, maxWidth: 440, width: '100%',
        border: `3px solid ${danger ? G.error : G.forest}`,
        borderTop: `8px solid ${danger ? G.error : G.forest}`,
        boxShadow: `0 8px 0 ${danger ? '#b71c1c' : G.dark}, 0 16px 32px rgba(0,0,0,.25)`,
        padding: '32px 28px', fontFamily: "'Inter',sans-serif",
        animation: 'fmSlideIn .25s ease',
      }}>
        <div style={{
          width: 48, height: 48, background: danger ? '#FFEBEE' : '#E8F5E9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          {danger ? <AlertTriangle size={26} color={G.error} /> : <CheckCircle size={26} color={G.forest} />}
        </div>
        <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 900, color: G.dark }}>{title}</h3>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: G.text, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="fm-btn" style={{
            padding: '10px 22px', border: `2px solid ${G.sage}`,
            background: G.white, color: G.text, fontWeight: 700, cursor: 'pointer', fontSize: 13,
            boxShadow: `0 4px 0 ${G.sage}`,
          }}>Cancel</button>
          <button onClick={onConfirm} className="fm-btn" style={{
            padding: '10px 22px', border: `2px solid ${danger ? '#b71c1c' : G.dark}`,
            background: danger ? G.error : G.forest, color: '#fff',
            fontWeight: 800, cursor: 'pointer', fontSize: 13,
            boxShadow: `0 4px 0 ${danger ? '#7f0000' : G.dark}`,
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   FLEET MANAGER MAIN
══════════════════════════════════════════════════ */
const FleetManager = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ── Toast ── */
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  /* ── Confirm dialog ── */
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', action: null, danger: true });
  const askConfirm = (title, message, action, danger = true) =>
    setConfirm({ open: true, title, message, action, danger });
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false, action: null }));
  const doConfirm = async () => { if (confirm.action) await confirm.action(); closeConfirm(); };

  /* ── Load ── */
  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      const res = await carService.getAllCars();
      if (res.status === 'success') setCars(res.data);
    } catch { addToast('error', 'Could not load fleet data. Check your connection.'); }
    finally { setLoading(false); setIsRefreshing(false); }
  };

  const handleSoftDelete = (id, name) => {
    askConfirm('Hide Vehicle?', `"${name}" will be hidden from customers but can be restored at any time.`,
      async () => {
        try { await carService.deleteCar(id); addToast('warning', `"${name}" is now hidden.`); fetchCars(); }
        catch { addToast('error', 'Could not hide vehicle. Try again.'); }
      }, false);
  };

  const handleHardDelete = (id, name) => {
    askConfirm('Permanently Delete?', `This will permanently remove "${name}" and all its data. This cannot be undone.`,
      async () => {
        try { await carService.hardDeleteCar(id); addToast('error', `"${name}" permanently deleted.`); fetchCars(); }
        catch { addToast('error', 'Could not delete vehicle.'); }
      }, true);
  };

  const handleRestore = (id, name) => {
    askConfirm('Restore Vehicle?', `"${name}" will become visible to customers again.`,
      async () => {
        try { await carService.restoreCar(id); addToast('success', `"${name}" is now visible!`); fetchCars(); }
        catch { addToast('error', 'Could not restore vehicle.'); }
      }, false);
  };

  /* ── Derived stats ── */
  const activeCars = cars.filter(c => !c.deleted_at);
  const hiddenCars = cars.filter(c => c.deleted_at);
  const availCount = activeCars.filter(c => c.availability === 'Available').length;

  const statusBadge = (car) => {
    if (car.deleted_at) return { label: 'Hidden', bg: '#ECEFF1', color: '#607D8B' };
    const map = {
      Available:   { label: 'Available',   bg: '#E8F5E9', color: G.forest },
      Booked:      { label: 'Booked',      bg: '#E3F2FD', color: '#1565C0' },
      Maintenance: { label: 'Maintenance', bg: '#FFEBEE', color: G.error },
    };
    return map[car.availability] || { label: car.availability, bg: G.lightGray, color: G.text };
  };

  /* ── Keyframes ── */
  useEffect(() => {
    if (document.getElementById('fm-style')) return;
    const s = document.createElement('style');
    s.id = 'fm-style';
    s.textContent = `
      @keyframes fmSlideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fmSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      .fm-btn { transition: transform .08s, box-shadow .08s; }
      .fm-btn:hover { transform: translateY(-2px); }
      .fm-btn:active { transform: translateY(4px) !important; box-shadow: none !important; }
      .fm-row:hover { background: #E8F5E9 !important; }
      @media (max-width: 768px) {
        .fm-table thead { display: none; }
        .fm-table tr { display: block; margin-bottom: 16px; border: 2px solid ${G.sage}; background: #fff; }
        .fm-table td { display: flex; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid ${G.sage}; font-size: 13px; }
        .fm-table td::before { content: attr(data-label); font-weight: 800; color: ${G.dark}; margin-right: 8px; }
        .fm-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(s);
  }, []);

  /* ══════ RENDER ══════ */
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
      `}</style>
      <Toast toasts={toasts} remove={removeToast} />
      <ConfirmModal
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={confirm.danger} onConfirm={doConfirm} onCancel={closeConfirm}
      />

      {/* ══ FULL-WIDTH CONTAINER ══ */}
      <div style={{
        minHeight: '100vh', background: G.forest,
        fontFamily: "'Inter',sans-serif", color: G.text,
        width: '100%', margin: 0, padding: 0,
      }}>

        {/* ── TOP HEADER BAR ── */}
        <div style={{
          background: G.dark, padding: '0 28px',
          borderBottom: `4px solid ${G.olive}`,
        }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${G.mint}, ${G.lime}, ${G.leaf}, ${G.mint})`, backgroundSize: '400% 100%', animation: 'shimmerG 3s linear infinite' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: G.mint, letterSpacing: 1, textTransform: 'uppercase' }}>
                🚗 Rental Post Dashboard
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: G.sage }}>
                Manage vehicles published on the public Car Rental page
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="fm-btn" onClick={() => fetchCars(true)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: G.emerald, color: '#fff', border: `2px solid ${G.olive}`,
                padding: '10px 18px', cursor: 'pointer',
                fontWeight: 800, fontSize: 12, textTransform: 'uppercase',
                boxShadow: `0 5px 0 ${G.dark}`,
              }}>
                <RefreshCw size={14} style={{ animation: isRefreshing ? 'fmSpin 1s linear infinite' : 'none' }} /> Refresh
              </button>
              <button className="fm-btn" onClick={() => navigate('/car-renting/manager/assets')} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: G.lime, color: G.dark, border: `2px solid ${G.olive}`,
                padding: '10px 20px', cursor: 'pointer',
                fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
                boxShadow: `0 5px 0 ${G.dark}`,
              }}>
                📋 Go to Asset Register
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI SUMMARY STRIP ── */}
        <div style={{
          background: G.forest, padding: '20px 28px',
          borderBottom: `3px solid ${G.olive}`,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
        }} className="fm-grid">
          {[
            { icon: Layers,     label: 'Total Vehicles',   value: cars.length,         color: G.mint   },
            { icon: CheckCircle,label: 'Available Now',    value: availCount,          color: G.lime   },
            { icon: EyeOff,     label: 'Hidden/Drafts',    value: hiddenCars.length,   color: '#FFCC80' },
          ].map((k, i) => (
            <div key={i} style={{
              background: G.dark, border: `2px solid ${G.olive}`,
              borderTop: `4px solid ${k.color}`,
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

        {/* ── MAIN CONTENT AREA ── */}
        <div style={{ background: G.lightGray, minHeight: 'calc(100vh - 200px)' }}>
          <div style={{ padding: '24px 28px' }}>

            <div style={{
              background: G.white, border: `2px solid ${G.sage}`,
              overflow: 'hidden', boxShadow: `0 6px 0 ${G.sage}`,
            }}>
              <div style={{
                background: G.dark, padding: '14px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `3px solid ${G.olive}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: G.mint, textTransform: 'uppercase', letterSpacing: 1 }}>
                  🌿 Rental Post Roster — {cars.length} Vehicle{cars.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 11, color: G.sage }}>
                  {activeCars.length} active · {hiddenCars.length} hidden
                </span>
              </div>

              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: G.emerald }}>
                  <Leaf size={36} color={G.sage} style={{ marginBottom: 12, animation: 'fmSpin 2s linear infinite' }} />
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Loading rental vehicles…</div>
                </div>
              ) : cars.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <Car size={48} color={G.sage} style={{ marginBottom: 14 }} />
                  <div style={{ fontWeight: 900, fontSize: 16, color: G.dark }}>No vehicles found</div>
                  <div style={{ color: G.olive, fontSize: 13, marginTop: 6 }}>
                    Go to the Asset Register to add and publish vehicles.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="fm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#E8F5E9', borderBottom: `2px solid ${G.sage}` }}>
                        {['#', 'Vehicle', 'Type', 'Specs', 'Rate / Day', 'Status', 'Visibility Actions'].map((h, i) => (
                          <th key={h} style={{
                            padding: '12px 16px',
                            textAlign: i >= 6 ? 'center' : 'left',
                            fontSize: 11, fontWeight: 900, color: G.dark,
                            textTransform: 'uppercase', letterSpacing: 0.8,
                            borderRight: i < 6 ? `1px solid ${G.sage}` : 'none',
                            whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cars.map((car, idx) => {
                        const badge = statusBadge(car);
                        return (
                          <tr key={car.id} className="fm-row" style={{
                            borderBottom: `1px solid ${G.sage}`,
                            background: idx % 2 === 0 ? G.white : '#F9FBE7',
                            transition: 'background .15s', opacity: car.deleted_at ? 0.7 : 1,
                          }}>
                            {/* # */}
                            <td data-label="#" style={{ padding: '12px 16px', fontSize: 13, color: G.olive, fontWeight: 700, borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              {idx + 1}
                            </td>
                            {/* Vehicle */}
                            <td data-label="Vehicle" style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 46, height: 46, background: G.sage, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {car.image1
                                    ? <img src={getImageUrl(car.image1)} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Car size={20} color={G.dark} />}
                                </div>
                                <div>
                                  <div style={{
                                    fontWeight: 900, fontSize: 14, color: car.deleted_at ? G.olive : G.dark,
                                    textDecoration: car.deleted_at ? 'line-through' : 'none',
                                  }}>{car.name}</div>
                                  {car.deleted_at && <div style={{ fontSize: 10, fontWeight: 800, color: '#607D8B' }}>HIDDEN FROM PUBLIC</div>}
                                </div>
                              </div>
                            </td>
                            {/* Type */}
                            <td data-label="Type" style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: G.olive, borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              {car.carType || '—'}
                            </td>
                            {/* Specs */}
                            <td data-label="Specs" style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}` }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ background: '#E8F5E9', padding: '2px 7px', fontSize: 11, fontWeight: 700, color: G.forest }}>⚙️ {car.transmission}</span>
                                <span style={{ background: '#FFF8E1', padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#E65100' }}>⛽ {car.fuelType}</span>
                                <span style={{ background: '#E3F2FD', padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#1565C0' }}>👥 {car.seats}</span>
                              </div>
                            </td>
                            {/* Rate */}
                            <td data-label="Rate / Day" style={{ padding: '12px 16px', fontWeight: 900, fontSize: 14, color: G.forest, borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              ETB {Number(car.dailyRate || car.daily_rate || 0).toLocaleString()}
                            </td>
                            {/* Status */}
                            <td data-label="Status" style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              <span style={{
                                display: 'inline-block',
                                background: badge.bg, color: badge.color,
                                padding: '4px 12px', fontSize: 11, fontWeight: 800,
                                border: `1px solid ${badge.color}30`,
                              }}>
                                {badge.label}
                              </span>
                            </td>
                            {/* Actions */}
                            <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {car.deleted_at ? (
                                  <>
                                    <button className="fm-btn" title="Restore to public storefront" onClick={() => handleRestore(car.id, car.name)} style={{
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      padding: '6px 12px', border: `2px solid ${G.forest}`,
                                      background: '#E8F5E9', color: G.forest, fontSize: 11, fontWeight: 800,
                                      cursor: 'pointer', boxShadow: `0 3px 0 ${G.dark}`,
                                    }}>
                                      <RotateCcw size={12} /> Publish
                                    </button>
                                    <button className="fm-btn" title="Delete Forever" onClick={() => handleHardDelete(car.id, car.name)} style={{
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      padding: '6px 12px', border: `2px solid ${G.error}`,
                                      background: '#FFEBEE', color: G.error, fontSize: 11, fontWeight: 800,
                                      cursor: 'pointer', boxShadow: `0 3px 0 #b71c1c`,
                                    }}>
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className="fm-btn" title="Hide from customers" onClick={() => handleSoftDelete(car.id, car.name)} style={{
                                      padding: '7px 10px', border: `2px solid ${G.warning}`,
                                      background: '#FFF8E1', color: '#E65100', cursor: 'pointer',
                                      boxShadow: '0 3px 0 #bf360c', display: 'flex', alignItems: 'center',
                                    }}>
                                      <EyeOff size={14} /> Unpublish
                                    </button>
                                  </>
                                )}
                              </div>
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
              💡 To add new vehicles or edit details, please use the Master Asset Register.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FleetManager;
