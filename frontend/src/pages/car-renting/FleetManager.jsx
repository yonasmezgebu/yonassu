import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  success: { bg: '#DCFCE7', border: '#16A34A', Icon: CheckCircle },
  error:   { bg: '#FEE2E2', border: '#DC2626', Icon: AlertCircle },
  warning: { bg: '#FEF3C7', border: '#D97706', Icon: AlertTriangle },
};

const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => {
      const s = TCONF[t.type] || TCONF.success;
      return (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'all', cursor: 'pointer',
          background: '#FFFFFF', color: '#111827', padding: '12px 16px',
          borderTop: '1px solid #E5E7EB',
          borderRight: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
          borderLeft: `4px solid ${s.border}`,
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500,
          minWidth: 280, maxWidth: 'calc(100vw - 32px)',
          animation: 'fmSlideIn .28s ease',
        }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <s.Icon size={15} color={s.border} />
          </span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <X size={15} style={{ color: '#9CA3AF', flexShrink: 0 }} />
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 16,
    }}>
      <div style={{
        background: '#FFFFFF', maxWidth: 440, width: '100%',
        borderRadius: 12,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        padding: '24px', fontFamily: "'Inter',sans-serif",
        animation: 'fmSlideIn .25s ease',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: danger ? '#FEE2E2' : '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          {danger ? <AlertTriangle size={22} color="#DC2626" /> : <CheckCircle size={22} color="#2563EB" />}
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#111827' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={onCancel} className="fm-btn" style={{
            height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #E5E7EB',
            background: '#FFFFFF', color: '#111827', fontWeight: 500, cursor: 'pointer', fontSize: 14,
          }}>Cancel</button>
          <button onClick={onConfirm} className="fm-btn" style={{
            height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid transparent',
            background: danger ? '#DC2626' : '#2563EB', color: '#fff',
            fontWeight: 500, cursor: 'pointer', fontSize: 14,
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
  const location = useLocation();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  /* ── Global navbar search listener ── */
  useEffect(() => {
    const handler = (e) => setSearchQuery((e.detail || '').toLowerCase().trim());
    window.addEventListener('dashboardSearch', handler);
    return () => window.removeEventListener('dashboardSearch', handler);
  }, []);

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

  /* ── Filtered list for table ── */
  const filteredCars = searchQuery
    ? cars.filter(c =>
        (c.name || '').toLowerCase().includes(searchQuery) ||
        (c.carType || '').toLowerCase().includes(searchQuery) ||
        (c.availability || '').toLowerCase().includes(searchQuery) ||
        (c.fuelType || '').toLowerCase().includes(searchQuery) ||
        (c.transmission || '').toLowerCase().includes(searchQuery)
      )
    : cars;

  const statusBadge = (car) => {
    if (car.deleted_at) return { label: 'Hidden', bg: '#F3F4F6', color: '#6B7280' };
    const map = {
      Available:   { label: 'Available',   bg: '#DCFCE7', color: '#16A34A' },
      Booked:      { label: 'Booked',      bg: '#E0F2FE', color: '#0284C7' },
      Maintenance: { label: 'Maintenance', bg: '#FEE2E2', color: '#DC2626' },
    };
    return map[car.availability] || { label: car.availability, bg: '#F3F4F6', color: '#6B7280' };
  };

  /* ── Keyframes ── */
  useEffect(() => {
    if (document.getElementById('fm-style')) return;
    const s = document.createElement('style');
    s.id = 'fm-style';
    s.textContent = `
      @keyframes fmSlideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fmSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      .fm-btn { transition: background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
      .fm-btn:hover:not(:disabled) { background: #EAB308 !important; color: #111827 !important; border-color: #B45309 !important; box-shadow: 0 2px 6px rgba(0,0,0,0.12); transform: translateY(-1px); }
      .fm-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
      .fm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .fm-row:hover td { background: #F9FAFB; }
      .fm-kpi:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
      .fm-table { min-width: 700px; }
      @media (max-width: 768px) {
        .fm-btn { min-height: 44px; }
        .fm-table { min-width: 0 !important; width: 100% !important; }
        .fm-table thead { display: none; }
        .fm-table tr { display: block; margin-bottom: 12px; border: 1px solid #E5E7EB; border-radius: 10px; background: #FFFFFF; }
        .fm-table td { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
        .fm-table td::before { content: attr(data-label); font-weight: 500; color: #6B7280; margin-right: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }
        .fm-table tr:last-child td:last-child { border-bottom: none; }
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
        minHeight: '100vh', background: 'transparent',
        fontFamily: "'Inter',sans-serif", color: '#111827',
        width: '100%', margin: 0, padding: 0,
      }}>

        {/* ── TOP HEADER BAR ── */}
        <div style={{
          background: '#FFFFFF', padding: '24px 28px',
          border: '1px solid #E5E7EB',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: 'normal', textTransform: 'none', lineHeight: 1.3 }}>
                🚗 Rental Post Dashboard
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6B7280' }}>
                Manage vehicles published on the public Car Rental page
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="fm-btn" onClick={() => fetchCars(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 16px', borderRadius: 8,
                background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>
                <RefreshCw size={14} style={{ animation: isRefreshing ? 'fmSpin 1s linear infinite' : 'none' }} /> Refresh
              </button>
              <button className="fm-btn" onClick={() => navigate('/car-renting/manager/assets')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 16px', borderRadius: 8,
                background: '#2563EB', color: '#FFFFFF', border: '1px solid transparent',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>
                📋 Go to Asset Register
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI SUMMARY STRIP ── */}
        <div style={{
          background: 'transparent', padding: 0, marginTop: 16,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
        }} className="fm-grid">
          {[
            { icon: Layers,     label: 'Total Vehicles',   value: cars.length,         color: '#0284C7', bg: '#E0F2FE' },
            { icon: CheckCircle,label: 'Available Now',    value: availCount,          color: '#16A34A', bg: '#DCFCE7' },
            { icon: EyeOff,     label: 'Hidden/Drafts',    value: hiddenCars.length,   color: '#D97706', bg: '#FEF3C7' },
          ].map((k, i) => (
            <div key={i} className="fm-kpi" style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB',
              borderRadius: 10,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ background: k.bg, borderRadius: 8, padding: 10 }}>
                <k.icon size={20} color={k.color} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div style={{ background: 'transparent', minHeight: 0 }}>
          <div style={{ padding: '16px 0 24px' }}>

            <div style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB',
              borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                background: '#FFFFFF', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', textTransform: 'none', letterSpacing: 'normal' }}>
                  🌿 Rental Post Roster — {filteredCars.length} Vehicle{filteredCars.length !== 1 ? 's' : ''}
                  {searchQuery && <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, textTransform: 'none', marginLeft: 8 }}>matching "{searchQuery}"</span>}
                </span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  {activeCars.length} active · {hiddenCars.length} hidden
                </span>
              </div>

              {loading ? (
                <div style={{ padding: '64px 20px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E5E7EB', borderTop: '4px solid #2563EB', borderRight: '4px solid #2563EB', animation: 'fmSpin 1s linear infinite', margin: '0 auto 16px' }} />
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#6B7280' }}>Loading rental vehicles…</div>
                </div>
              ) : cars.length === 0 ? (
                <div style={{ padding: '64px 20px', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Car size={26} color="#2563EB" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>No vehicles found</div>
                  <div style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>
                    Go to the Asset Register to add and publish vehicles.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="fm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        {['#', 'Vehicle', 'Type', 'Specs', 'Rate / Day', 'Status', 'Visibility Actions'].map((h, i) => (
                          <th key={h} style={{
                            padding: '12px 16px',
                            textAlign: i >= 6 ? 'center' : 'left',
                            fontSize: 12, fontWeight: 500, color: '#6B7280',
                            textTransform: 'uppercase', letterSpacing: '0.03em',
                            borderRight: 'none',
                            whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCars.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280', fontWeight: 500 }}>
                            No vehicles match "{searchQuery}"
                          </td>
                        </tr>
                      ) : filteredCars.map((car, idx) => {
                        const badge = statusBadge(car);
                        return (
                          <tr key={car.id} className="fm-row" style={{
                            transition: 'background .15s', opacity: car.deleted_at ? 0.65 : 1,
                          }}>
                            {/* # */}
                            <td data-label="#" style={{ padding: '12px 16px', fontSize: 14, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {idx + 1}
                            </td>
                            {/* Vehicle */}
                            <td data-label="Vehicle" style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: 8, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {car.image1
                                    ? <img src={getImageUrl(car.image1)} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Car size={18} color="#2563EB" />}
                                </div>
                                <div>
                                  <div style={{
                                    fontWeight: 600, fontSize: 14, color: car.deleted_at ? '#6B7280' : '#111827',
                                    textDecoration: car.deleted_at ? 'line-through' : 'none',
                                  }}>{car.name}</div>
                                  {car.deleted_at && <div style={{ fontSize: 12, fontWeight: 600, color: '#D97706', marginTop: 2 }}>HIDDEN FROM PUBLIC</div>}
                                </div>
                              </div>
                            </td>
                            {/* Type */}
                            <td data-label="Type" style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#6B7280', whiteSpace: 'nowrap' }}>
                              {car.carType || '—'}
                            </td>
                            {/* Specs */}
                            <td data-label="Specs" style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ background: '#E0F2FE', padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, color: '#0284C7', whiteSpace: 'nowrap' }}>⚙️ {car.transmission}</span>
                                <span style={{ background: '#FEF3C7', padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, color: '#B45309', whiteSpace: 'nowrap' }}>⛽ {car.fuelType}</span>
                                <span style={{ background: '#F3F4F6', padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, color: '#6B7280', whiteSpace: 'nowrap' }}>👥 {car.seats}</span>
                              </div>
                            </td>
                            {/* Rate */}
                            <td data-label="Rate / Day" style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              ETB {Number(car.dailyRate || car.daily_rate || 0).toLocaleString()}
                            </td>
                            {/* Status */}
                            <td data-label="Status" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                background: badge.bg, color: badge.color,
                                padding: '2px 10px', fontSize: 12, fontWeight: 500,
                                borderRadius: 9999,
                              }}>
                                {badge.label}
                              </span>
                            </td>
                            {/* Actions */}
                            <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {car.deleted_at ? (
                                  <>
                                    <button className="fm-btn" title="Restore to public storefront" onClick={() => handleRestore(car.id, car.name)} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid transparent',
                                      background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500,
                                      cursor: 'pointer',
                                    }}>
                                      <RotateCcw size={13} /> Publish
                                    </button>
                                    <button className="fm-btn" title="Delete Forever" onClick={() => handleHardDelete(car.id, car.name)} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid transparent',
                                      background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 500,
                                      cursor: 'pointer',
                                    }}>
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className="fm-btn" title="Hide from customers" onClick={() => handleSoftDelete(car.id, car.name)} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid transparent',
                                      background: '#FEF3C7', color: '#B45309', cursor: 'pointer',
                                      fontSize: 13, fontWeight: 500,
                                    }}>
                                      <EyeOff size={13} /> Unpublish
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
            
            <div style={{ marginTop: 12, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
              💡 To add new vehicles or edit details, please use the Master Asset Register.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FleetManager;
