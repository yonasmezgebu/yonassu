import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Plus, Edit2, Trash2, Image as ImageIcon,
  EyeOff, CheckCircle, AlertTriangle, AlertCircle,
  X, DollarSign, Layers, Fuel, Leaf, RefreshCw, Send,
  Wrench, Clock, Wifi
} from 'lucide-react';
import carService from '../../../services/carService';

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

/* ── Machine status badge helper ── */
const getMachineStatusBadge = (car) => {
  const av = (car.availability || '').toLowerCase();
  if (av === 'maintenance' || av === 'in maintenance') {
    return (
      <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '3px 10px', fontSize: 12, fontWeight: 600, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
        <Wrench size={11} /> Maintenance
      </span>
    );
  }
  if (av === 'booked' || av === 'rented' || av === 'out') {
    return (
      <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', fontSize: 12, fontWeight: 600, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
        <Clock size={11} /> Booked
      </span>
    );
  }
  return (
    <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 10px', fontSize: 12, fontWeight: 600, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      <Wifi size={11} /> Available
    </span>
  );
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
const ConfirmModal = ({ open, title, message, danger, onConfirm, onCancel, content }) => {
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
        <p style={{ margin: '0 0 20px', fontSize: 14, color: G.text, lineHeight: 1.6 }}>{message}</p>
        
        {content && <div style={{ marginBottom: 24 }}>{content}</div>}

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
   ASSET REGISTER MAIN
══════════════════════════════════════════════════ */
const AssetRegister = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  /* ── Form State ── */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', dailyRate: '', seats: 4, transmission: 'Manual',
    fuelType: 'Petrol', carType: '', description: '', availability: 'Available',
    securityDeposit: '5000', visibility: 'internal'
  });
  const [images, setImages] = useState({ image1: null, image2: null, image3: null });
  const [existingImages, setExistingImages] = useState({ image1: null, image2: null, image3: null });



  /* ── Toast ── */
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  /* ── Confirm dialog ── */
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', action: null, danger: true, content: null });
  const askConfirm = (title, message, action, danger = true, content = null) =>
    setConfirm({ open: true, title, message, action, danger, content });
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false, action: null, content: null }));
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
    } catch { addToast('error', 'Could not load asset data. Check your connection.'); }
    finally { setLoading(false); setIsRefreshing(false); }
  };

  /* ── Form Logic ── */
  const resetForm = () => {
    setFormData({ name: '', dailyRate: '', seats: 4, transmission: 'Manual', fuelType: 'Petrol', carType: '', description: '', availability: 'Available', securityDeposit: '5000', visibility: 'internal' });
    setImages({ image1: null, image2: null, image3: null });
    setExistingImages({ image1: null, image2: null, image3: null });
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleImageChange = (e, key) => {
    if (e.target.files?.[0]) setImages(p => ({ ...p, [key]: e.target.files[0] }));
  };

  const submitForm = async (visibility = 'internal') => {
    setSubmitting(true);
    try {
      const data = new FormData();
      const submissionData = { ...formData, visibility };
      Object.keys(submissionData).forEach(k => data.append(k, submissionData[k]));
      Object.keys(images).forEach(k => { if (images[k]) data.append(k, images[k]); });
      if (editingCar) {
        await carService.updateCar(editingCar.id, data);
        addToast('success', `✅ "${formData.name}" updated successfully.`);
      } else {
        await carService.createCar(data);
        if (visibility === 'internal') {
          addToast('success', `🔒 "${formData.name}" added to registry.`);
        } else {
          addToast('success', `🚗 "${formData.name}" added to registry and posted live!`);
        }
      }
      setIsFormOpen(false); setEditingCar(null); resetForm(); fetchCars();
    } catch (err) {
      addToast('error', err?.response?.data?.message || 'Save failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  /* ── Actions ── */
  const handlePublish = (id, name) => {
    askConfirm('Publish to Rental Page?', `"${name}" will be made publicly available for customers to rent.`,
      async () => {
        try { await carService.restoreCar(id); addToast('success', `"${name}" is now live on the rental page!`); fetchCars(); }
        catch { addToast('error', 'Could not publish vehicle.'); }
      }, false);
  };
  
  const handleUnpublish = (id, name) => {
    askConfirm('Unpublish from Rental Page?', `"${name}" will be hidden from customers but remain in this register.`,
      async () => {
        try { await carService.deleteCar(id); addToast('warning', `"${name}" has been unpublished.`); fetchCars(); }
        catch { addToast('error', 'Could not unpublish vehicle. Try again.'); }
      }, true);
  };

  const handleHardDelete = (id, name) => {
    askConfirm('Permanently Delete?', `This will permanently remove "${name}" and all its data. This cannot be undone.`,
      async () => {
        try { await carService.hardDeleteCar(id); addToast('error', `"${name}" permanently deleted.`); fetchCars(); }
        catch { addToast('error', 'Could not delete vehicle.'); }
      }, true);
  };


  const openEdit = (car) => {
    setEditingCar(car);
    setFormData({
      name: car.name, dailyRate: car.dailyRate, seats: car.seats,
      transmission: car.transmission, fuelType: car.fuelType,
      carType: car.carType, description: car.description, availability: car.availability,
      securityDeposit: car.securityDeposit !== undefined && car.securityDeposit !== null ? car.securityDeposit : '',
    });
    setImages({ image1: null, image2: null, image3: null });
    setExistingImages({ image1: car.image1, image2: car.image2, image3: car.image3 });
    setIsFormOpen(true);
  };

  /* ── Derived stats ── */
  const totalValue = cars.reduce((sum, c) => sum + parseFloat(c.asset_value || 0), 0);
  const activeCarsCount = cars.filter(c => !c.deleted_at).length;
  const hiddenCarsCount = cars.filter(c => c.deleted_at).length;

  /* ── Keyframes ── */
  useEffect(() => {
    if (document.getElementById('ar-style')) return;
    const s = document.createElement('style');
    s.id = 'ar-style';
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
        input:focus, select:focus, textarea:focus { outline: 2px solid ${G.emerald}; outline-offset: 1px; }
      `}</style>
      <Toast toasts={toasts} remove={removeToast} />
      <ConfirmModal
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={confirm.danger} onConfirm={doConfirm} onCancel={closeConfirm} content={confirm.content}
      />

      {/* ══ FULL-WIDTH CONTAINER ══ */}
      <div style={{
        minHeight: '100vh', background: '#FFFFFF',
        fontFamily: "'Inter',sans-serif", color: G.text,
        width: '100%', margin: 0, padding: 0,
      }}>

        {/* ── TOP HEADER BAR ── */}
        <div style={{
          background: '#FFFFFF', padding: '24px 28px 16px',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>📋</span> Master Asset Register
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                Full inventory of all vehicles. Add assets here to publish to the Rental Post page.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="fm-btn" onClick={() => fetchCars(true)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: G.emerald, color: '#fff', border: 'none',
                padding: '9px 18px', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, borderRadius: 6,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <RefreshCw size={14} style={{ animation: isRefreshing ? 'fmSpin 1s linear infinite' : 'none' }} /> Refresh
              </button>
              <button className="fm-btn" onClick={() => navigate('/car-renting/manager/fleet')} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
                padding: '9px 18px', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, borderRadius: 6,
              }}>
                🚗 Go to Rental Post
              </button>
              <button className="fm-btn" onClick={() => { resetForm(); setEditingCar(null); setIsFormOpen(true); }} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: G.forest, color: '#fff', border: 'none',
                padding: '9px 20px', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, borderRadius: 6,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <Plus size={15} /> Add Vehicle
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI SUMMARY STRIP ── */}
        <div style={{
          background: '#F9FAFB', padding: '16px 28px',
          borderBottom: '1px solid #E5E7EB',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
        }} className="fm-grid">
          {[
            { icon: Layers,     label: 'Total Assets',      value: cars.length,         color: G.emerald  },
            { icon: CheckCircle,label: 'Published Online',  value: activeCarsCount,     color: '#16A34A'  },
            { icon: EyeOff,     label: 'Internal/Hidden',   value: hiddenCarsCount,     color: '#D97706'  },
            { icon: DollarSign, label: 'Total Asset Value', value: `ETB ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, color: G.dark },
          ].map((k, i) => (
            <div key={i} style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB',
              borderLeft: `4px solid ${k.color}`,
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

        {/* ── MAIN CONTENT AREA ── */}
        <div style={{ background: '#F9FAFB', minHeight: 'calc(100vh - 200px)' }}>

          {/* ═══ FORM PANEL ═══ */}
          {isFormOpen && (
            <div style={{
              background: G.white,
              borderBottom: `4px solid ${G.forest}`,
              padding: '28px 28px',
              boxShadow: `0 6px 0 ${G.sage}`,
              animation: 'fmSlideIn .25s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {editingCar ? '✏️ Edit Asset' : '📋 Register New Asset'}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: G.olive }}>
                    {editingCar ? 'Update asset details below' : 'Fill in the details to add a new vehicle to the registry'}
                  </p>
                </div>
                <button className="fm-btn" onClick={() => setIsFormOpen(false)} style={{
                  background: '#FFEBEE', border: `2px solid ${G.error}`,
                  padding: 8, cursor: 'pointer', color: G.error,
                  boxShadow: `0 3px 0 #b71c1c`,
                }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                {/* Grid fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }} className="fm-grid">
                  {[
                    { label: 'Vehicle Name *', name: 'name', placeholder: 'e.g. Toyota Land Cruiser V8', type: 'text', req: true },
                    { label: 'Daily Rate (ETB) *', name: 'dailyRate', placeholder: 'e.g. 2500', type: 'number', req: true },
                    { label: 'Seats *', name: 'seats', placeholder: '4', type: 'number', req: true },
                    { label: 'Vehicle Type *', name: 'carType', placeholder: 'e.g. SUV, Sedan, Tractor', type: 'text', req: true },
                    { label: 'Security Deposit (ETB)', name: 'securityDeposit', placeholder: 'e.g. 5000', type: 'number', req: false },
                  ].map(f => (
                    <div key={f.name}>
                      <label style={lbl}>{f.label}</label>
                      <input required={f.req} type={f.type} name={f.name} value={formData[f.name]}
                        onChange={handleInputChange} placeholder={f.placeholder} style={inp} />
                    </div>
                  ))}
                  <div>
                    <label style={lbl}>Transmission</label>
                    <select name="transmission" value={formData.transmission} onChange={handleInputChange} style={inp}>
                      <option>Manual</option><option>Automatic</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Fuel Type</label>
                    <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} style={inp}>
                      <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Availability Status</label>
                    <select name="availability" value={formData.availability} onChange={handleInputChange} style={inp}>
                      <option>Available</option><option>Booked</option><option>Maintenance</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange}
                    style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="Vehicle features, condition, extras..." />
                </div>

                {/* Images */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...lbl, marginBottom: 10 }}>Vehicle Photos (up to 3)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }} className="fm-grid">
                    {[1, 2, 3].map(num => {
                      const hasNew = !!images[`image${num}`];
                      const hasExisting = !!existingImages[`image${num}`];
                      const hasImg = hasNew || hasExisting;
                      return (
                        <label key={num} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          border: `2px dashed ${hasImg ? G.leaf : G.sage}`,
                          padding: '12px', textAlign: 'center', cursor: 'pointer',
                          background: hasImg ? '#E8F5E9' : G.white,
                          transition: 'all .2s',
                        }}>
                          {hasNew ? (
                            <ImageIcon size={22} color={G.forest} />
                          ) : hasExisting ? (
                            <img src={getImageUrl(existingImages[`image${num}`])} alt="img" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                          ) : (
                            <ImageIcon size={22} color={G.sage} />
                          )}
                          <div style={{ fontSize: 12, color: hasImg ? G.forest : G.sage, marginTop: 8, fontWeight: 700 }}>
                            {hasNew ? images[`image${num}`].name : hasExisting ? 'Current Image' : `Photo ${num}`}
                          </div>
                          <input type="file" style={{ display: 'none' }} accept="image/*"
                            onChange={e => handleImageChange(e, `image${num}`)} />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="fm-btn" onClick={() => setIsFormOpen(false)} style={{
                    padding: '11px 24px', border: `2px solid ${G.sage}`,
                    background: G.white, color: G.text, fontWeight: 700, cursor: 'pointer', fontSize: 13,
                    boxShadow: `0 4px 0 ${G.sage}`,
                  }}>Cancel</button>

                  {!editingCar && (
                    <button type="button" className="fm-btn" onClick={() => submitForm('internal')} disabled={submitting} style={{
                      padding: '11px 24px', border: `2px solid ${G.dark}`,
                      background: submitting ? G.sage : G.dark, color: '#fff',
                      fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      boxShadow: submitting ? 'none' : `0 5px 0 ${G.forest}`,
                      opacity: submitting ? 0.7 : 1,
                    }}>
                      {submitting ? '⏳ Saving…' : '📋 Register Asset Only'}
                    </button>
                  )}

                  <button type="button" className="fm-btn" onClick={() => submitForm('public')} disabled={submitting} style={{
                    padding: '11px 28px', border: `2px solid ${G.dark}`,
                    background: submitting ? G.sage : G.forest, color: '#fff',
                    fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    boxShadow: submitting ? 'none' : `0 5px 0 ${G.dark}`,
                    opacity: submitting ? 0.7 : 1,
                  }}>
                    {submitting ? '⏳ Saving…' : editingCar ? '✅ Update Asset' : '🚀 Register & Publish to Rental'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═══ VEHICLE TABLE ═══ */}
          <div style={{ padding: '24px 28px' }}>

            {/* Table wrapper */}
            <div style={{
              background: G.white, border: `2px solid ${G.sage}`,
              overflow: 'hidden', boxShadow: `0 6px 0 ${G.sage}`,
            }}>
              {/* Table header label */}
              <div style={{
                background: G.dark, padding: '14px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `3px solid ${G.olive}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: G.mint, textTransform: 'uppercase', letterSpacing: 1 }}>
                  📋 Full Master Asset List — {searchQuery
                    ? `${cars.filter(c =>
                        (c.name || '').toLowerCase().includes(searchQuery) ||
                        (c.carType || '').toLowerCase().includes(searchQuery) ||
                        (c.availability || '').toLowerCase().includes(searchQuery) ||
                        (c.fuelType || '').toLowerCase().includes(searchQuery) ||
                        (c.transmission || '').toLowerCase().includes(searchQuery)
                      ).length} of ${cars.length}`
                    : cars.length} Asset{cars.length !== 1 ? 's' : ''}
                  {searchQuery && <span style={{ fontSize: 11, color: G.sage, fontWeight: 600, textTransform: 'none', marginLeft: 8 }}>matching "{searchQuery}"</span>}
                </span>
              </div>

              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: G.emerald }}>
                  <Leaf size={36} color={G.sage} style={{ marginBottom: 12, animation: 'fmSpin 2s linear infinite' }} />
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Loading master asset data…</div>
                </div>
              ) : cars.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <Car size={48} color={G.sage} style={{ marginBottom: 14 }} />
                  <div style={{ fontWeight: 900, fontSize: 16, color: G.dark }}>Registry is empty</div>
                  <div style={{ color: G.olive, fontSize: 13, marginTop: 6 }}>
                    Click "Add Vehicle" to register the first asset.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="fm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#E8F5E9', borderBottom: `2px solid ${G.sage}` }}>
                        {['#', 'Vehicle', 'Daily Rate', 'Asset Value', 'Machine Status', 'Publication Status', 'Actions'].map((h, i) => (
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
                      {(() => {
                        const filteredCars = searchQuery
                          ? cars.filter(c =>
                              (c.name || '').toLowerCase().includes(searchQuery) ||
                              (c.carType || '').toLowerCase().includes(searchQuery) ||
                              (c.availability || '').toLowerCase().includes(searchQuery) ||
                              (c.fuelType || '').toLowerCase().includes(searchQuery) ||
                              (c.transmission || '').toLowerCase().includes(searchQuery)
                            )
                          : cars;
                        if (filteredCars.length === 0) return (
                          <tr><td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: G.olive, fontWeight: 700 }}>No assets match "{searchQuery}"</td></tr>
                        );
                        return filteredCars.map((car, idx) => {
                        const isPublic = !car.deleted_at;
                        return (
                          <tr key={car.id} className="fm-row" style={{
                            borderBottom: `1px solid ${G.sage}`,
                            background: idx % 2 === 0 ? G.white : '#F9FBE7',
                            transition: 'background .15s',
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
                                    ? <img src={getImageUrl(car.image1)} alt={car.name} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Car size={20} color={G.dark} />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 900, fontSize: 14, color: G.dark }}>{car.name}</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: G.olive, marginTop: 2 }}>{car.carType || '—'} • {car.transmission} • {car.fuelType}</div>
                                </div>
                              </div>
                            </td>
                            {/* Rate */}
                            <td data-label="Daily Rate" style={{ padding: '12px 16px', fontWeight: 900, fontSize: 13, color: G.forest, borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              ETB {Number(car.dailyRate || car.daily_rate || 0).toLocaleString()}
                            </td>
                            {/* Asset Value */}
                            <td data-label="Asset Value" style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {parseFloat(car.asset_value || 0) > 0
                                  ? <span style={{ fontWeight: 900, fontSize: 14, color: G.dark }}>ETB {parseFloat(car.asset_value).toLocaleString()}</span>
                                  : <span style={{ fontSize: 11, color: '#BDBDBD', fontStyle: 'italic', fontWeight: 700 }}>Unset</span>}
                              </div>
                            </td>
                            {/* Machine Status */}
                            <td data-label="Machine Status" style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              {getMachineStatusBadge(car)}
                            </td>
                            {/* Publication Status */}
                            <td data-label="Publication Status" style={{ padding: '12px 16px', borderRight: `1px solid ${G.sage}`, whiteSpace: 'nowrap' }}>
                              {isPublic ? (
                                <span style={{ background: '#E8F5E9', color: G.forest, padding: '4px 12px', fontSize: 11, fontWeight: 800, border: `1px solid ${G.forest}30`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle size={12} /> Published
                                </span>
                              ) : (
                                <span style={{ background: '#FFF8E1', color: '#E65100', padding: '4px 12px', fontSize: 11, fontWeight: 800, border: `1px solid #E6510030`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <EyeOff size={12} /> Internal Only
                                </span>
                              )}
                            </td>
                            {/* Actions */}
                            <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {!isPublic ? (
                                  <>
                                    <button className="fm-btn" title="Publish to Rental Page" onClick={() => handlePublish(car.id, car.name)} style={{
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      padding: '6px 12px', border: `2px solid ${G.dark}`,
                                      background: G.forest, color: '#fff', fontSize: 11, fontWeight: 800,
                                      cursor: 'pointer', boxShadow: `0 3px 0 ${G.dark}`, textTransform: 'uppercase'
                                    }}>
                                      <Send size={12} /> Publish
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className="fm-btn" title="Unpublish from Rental Page" onClick={() => handleUnpublish(car.id, car.name)} style={{
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      padding: '6px 12px', border: `2px solid ${G.warning}`,
                                      background: '#FFF8E1', color: '#E65100', fontSize: 11, fontWeight: 800,
                                      cursor: 'pointer', boxShadow: '0 3px 0 #bf360c', textTransform: 'uppercase'
                                    }}>
                                      <EyeOff size={12} /> Unpublish
                                    </button>
                                  </>
                                )}
                                <button className="fm-btn" title="Edit" onClick={() => openEdit(car)} style={{
                                  padding: '7px 10px', border: `2px solid ${G.sky}`,
                                  background: '#E3F2FD', color: '#1565C0', cursor: 'pointer',
                                  boxShadow: '0 3px 0 #0d47a1', display: 'flex', alignItems: 'center',
                                }}>
                                  <Edit2 size={14} />
                                </button>
                                <button className="fm-btn" title="Delete permanently" onClick={() => handleHardDelete(car.id, car.name)} style={{
                                  padding: '7px 10px', border: `2px solid ${G.error}`,
                                  background: '#FFEBEE', color: G.error, cursor: 'pointer',
                                  boxShadow: `0 3px 0 #b71c1c`, display: 'flex', alignItems: 'center',
                                }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })})()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 16, fontSize: 12, color: G.emerald, fontWeight: 600 }}>
              💡 Finance can also view and edit the Asset Value via the Finance Dashboard.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const lbl = {
  display: 'block', fontSize: 12, fontWeight: 800, color: G.dark,
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
};
const inp = {
  width: '100%', padding: '10px 12px', border: `2px solid ${G.sage}`,
  fontSize: 13, boxSizing: 'border-box', background: '#F9FBE7',
  fontFamily: 'inherit', color: G.text, outline: 'none',
};

export default AssetRegister;
