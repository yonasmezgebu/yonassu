import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor, Plus, Edit2, Trash2, Image as ImageIcon,
  EyeOff, CheckCircle, AlertTriangle, AlertCircle,
  X, DollarSign, Layers, Fuel, Leaf, RefreshCw, Send,
  Wrench, Clock, Wifi
} from 'lucide-react';
import tractorService from '../../../services/tractorService';
import './TractorRegister.css';

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
const getMachineStatusBadge = (tractor) => {
  const av = (tractor.availability || '').toLowerCase();
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
  success: { bg: '#DCFCE7', border: '#16A34A', Icon: CheckCircle },
  error:   { bg: '#FEE2E2', border: '#DC2626', Icon: AlertCircle },
  warning: { bg: '#FEF3C7', border: '#D97706', Icon: AlertTriangle },
};

const Toast = ({ toasts, remove }) => (
  <div className="tr-toast" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
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
const ConfirmModal = ({ open, title, message, danger, onConfirm, onCancel, content }) => {
  if (!open) return null;
  return (
    <div className="tr-modal" style={{
      position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 20,
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
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>{message}</p>
        
        {content && <div style={{ marginBottom: 24 }}>{content}</div>}

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
   ASSET REGISTER MAIN
══════════════════════════════════════════════════ */
const TractorRegister = () => {
  const navigate = useNavigate();
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  /* ── Form State ── */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTractor, setEditingTractor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', dailyRate: '', transmission: 'Manual',
    fuelType: 'Diesel', tractorType: '', description: '', availability: 'Available',
    visibility: 'internal'
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
  useEffect(() => { fetchTractors(); }, []);


  /* 🔍 Global navbar search listener */
  useEffect(() => {
    const handler = (e) => setSearchQuery((e.detail || '').toLowerCase().trim());
    window.addEventListener('dashboardSearch', handler);
    return () => window.removeEventListener('dashboardSearch', handler);
  }, []);

  const filteredTractors = searchQuery
    ? tractors.filter(t =>
        (t.name || '').toLowerCase().includes(searchQuery) ||
        (t.tractorType || '').toLowerCase().includes(searchQuery) ||
        (t.plate_number || '').toLowerCase().includes(searchQuery) ||
        (t.availability || '').toLowerCase().includes(searchQuery) ||
        (t.fuelType || '').toLowerCase().includes(searchQuery)
      )
    : tractors;

  const fetchTractors = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      const res = await tractorService.getAllTractors();
      if (res.status === 'success') setTractors(res.data);
    } catch { addToast('error', 'Could not load asset data. Check your connection.'); }
    finally { setLoading(false); setIsRefreshing(false); }
  };

  /* ── Form Logic ── */
  const resetForm = () => {
    setFormData({ name: '', dailyRate: '', transmission: 'Manual', fuelType: 'Diesel', tractorType: '', description: '', availability: 'Available', visibility: 'internal' });
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
      if (editingTractor) {
        await tractorService.updateTractor(editingTractor.id, data);
        addToast('success', `✅ "${formData.name}" updated successfully.`);
      } else {
        await tractorService.createTractor(data);
        if (visibility === 'internal') {
          addToast('success', `📋 "${formData.name}" saved to registry (internal only).`);
        } else {
          addToast('success', `🚜 "${formData.name}" added to registry and published to AgriRent!`);
        }
      }
      setIsFormOpen(false); setEditingTractor(null); resetForm(); fetchTractors();
    } catch (err) {
      addToast('error', err?.response?.data?.message || 'Save failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  /* ── Actions ── */
  const handlePublish = (id, name) => {
    askConfirm('Publish to AgriRent?', `"${name}" will be made publicly available on the AgriRent page for customers to hire.`,
      async () => {
        try { await tractorService.restoreTractor(id); addToast('success', `"✅ ${name}" is now live on the AgriRent page!`); fetchTractors(); }
        catch { addToast('error', 'Could not publish machine.'); }
      }, false);
  };
  
  const handleUnpublish = (id, name) => {
    askConfirm('Unpublish from AgriRent?', `"${name}" will be hidden from the public AgriRent page but remain in this register.`,
      async () => {
        try { await tractorService.deleteTractor(id); addToast('warning', `"${name}" has been unpublished from AgriRent.`); fetchTractors(); }
        catch { addToast('error', 'Could not unpublish machine. Try again.'); }
      }, true);
  };

  const handleHardDelete = (id, name) => {
    askConfirm('Permanently Delete?', `This will permanently remove "${name}" and all its data. This cannot be undone.`,
      async () => {
        try { await tractorService.hardDeleteTractor(id); addToast('error', `"${name}" permanently deleted.`); fetchTractors(); }
        catch { addToast('error', 'Could not delete machine.'); }
      }, true);
  };


  const openEdit = (tractor) => {
    setEditingTractor(tractor);
    setFormData({
      name: tractor.name, dailyRate: tractor.dailyRate,
      transmission: tractor.transmission, fuelType: tractor.fuelType,
      tractorType: tractor.tractorType, description: tractor.description, availability: tractor.availability,
    });
    setImages({ image1: null, image2: null, image3: null });
    setExistingImages({ image1: tractor.image1, image2: tractor.image2, image3: tractor.image3 });
    setIsFormOpen(true);
  };

  /* ── Derived stats ── */
  const totalValue = tractors.reduce((sum, c) => sum + parseFloat(c.asset_value || 0), 0);
  const activeTractorsCount = tractors.filter(c => !c.deleted_at).length;
  const hiddenTractorsCount = tractors.filter(c => c.deleted_at).length;

  /* ── Keyframes ── */
  useEffect(() => {
    if (document.getElementById('ar-style')) return;
    const s = document.createElement('style');
    s.id = 'ar-style';
    s.textContent = `
      @keyframes fmSlideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fmSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      .fm-btn { transition: background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
      .fm-btn:hover:not(:disabled) { background: #EAB308 !important; color: #111827 !important; border-color: #B45309 !important; box-shadow: 0 2px 6px rgba(0,0,0,0.12); transform: translateY(-1px); }
      .fm-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
      .fm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .fm-row:hover td { background: #F9FAFB; }
      .fm-kpi:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
      .fm-imgdrop:hover { border-color: #2563EB; background: #F8FAFC; }
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
        input:focus, select:focus, textarea:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      `}</style>
      <Toast toasts={toasts} remove={removeToast} />
      <ConfirmModal
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={confirm.danger} onConfirm={doConfirm} onCancel={closeConfirm} content={confirm.content}
      />

      {/* ══ FULL-WIDTH CONTAINER ══ */}
      <div className="tr-page" style={{
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
                📋 Tractor & Machinery Register
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6B7280' }}>
                Full inventory of all farming machines. Add assets here to publish to the AgriRent page.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="fm-btn" onClick={() => fetchTractors(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 16px', borderRadius: 8,
                background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>
                <RefreshCw size={14} style={{ animation: isRefreshing ? 'fmSpin 1s linear infinite' : 'none' }} /> Refresh
              </button>
              <button className="fm-btn" onClick={() => navigate('/car-renting/manager/agrirent-list')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 16px', borderRadius: 8,
                background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>
                🚜 Go to AgriRent
              </button>
              <button className="fm-btn" onClick={() => { resetForm(); setEditingTractor(null); setIsFormOpen(true); }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 16px', borderRadius: 8,
                background: '#2563EB', color: '#FFFFFF', border: '1px solid transparent',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>
                <Plus size={15} /> Add Machine
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
            { icon: Layers,     label: 'Total Assets',      value: tractors.length,         color: '#0284C7', bg: '#E0F2FE' },
            { icon: CheckCircle,label: 'Published Online',  value: activeTractorsCount,     color: '#16A34A', bg: '#DCFCE7' },
            { icon: EyeOff,     label: 'Internal/Hidden',   value: hiddenTractorsCount,     color: '#D97706', bg: '#FEF3C7' },
            { icon: DollarSign, label: 'Total Asset Value', value: `ETB ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, color: '#2563EB', bg: '#EFF6FF' },
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

          {/* ═══ FORM PANEL ═══ */}
          {isFormOpen && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              padding: '24px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              marginBottom: 16,
              animation: 'fmSlideIn .25s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827', textTransform: 'none', letterSpacing: 'normal' }}>
                    {editingTractor ? '✏️ Edit Asset' : '📋 Register New Asset'}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    {editingTractor ? 'Update asset details below' : 'Fill in the details to add a new machine to the registry'}
                  </p>
                </div>
                <button className="fm-btn" onClick={() => setIsFormOpen(false)} style={{
                  width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
                  background: '#FFFFFF', color: '#6B7280',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                {/* Grid fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }} className="fm-grid">
                  {[
                    { label: 'Machine Name *', name: 'name', placeholder: 'e.g. John Deere 5075E', type: 'text', req: true },
                    { label: 'Daily Rate (ETB) *', name: 'dailyRate', placeholder: 'e.g. 2500', type: 'number', req: true },
                    { label: 'Machine Type *', name: 'tractorType', placeholder: 'e.g. Harvester, Tractor, Seeder', type: 'text', req: true },
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
                      <option>Diesel</option><option>Petrol</option><option>Hybrid</option><option>Electric</option>
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
                    style={{ ...inp, minHeight: 80, resize: 'vertical', padding: '10px 12px' }} placeholder="Machine features, condition, attachments..." />
                </div>

                {/* Images */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...lbl, marginBottom: 10 }}>Machine Photos (up to 3)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }} className="fm-grid">
                    {[1, 2, 3].map(num => {
                      const hasNew = !!images[`image${num}`];
                      const hasExisting = !!existingImages[`image${num}`];
                      const hasImg = hasNew || hasExisting;
                      return (
                        <label key={num} className="fm-imgdrop" style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          border: `1px dashed ${hasImg ? '#16A34A' : '#CBD5E1'}`,
                          borderRadius: 8,
                          padding: '12px', textAlign: 'center', cursor: 'pointer',
                          background: hasImg ? '#F0FDF4' : '#FFFFFF',
                          transition: 'border-color .15s ease, background .15s ease',
                          overflow: 'hidden'
                        }}>
                          {hasNew ? (
                            <ImageIcon size={22} color="#16A34A" />
                          ) : hasExisting ? (
                            <img src={getImageUrl(existingImages[`image${num}`])} alt="img" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                          ) : (
                            <ImageIcon size={22} color="#9CA3AF" />
                          )}
                          <div style={{ fontSize: 12, color: hasImg ? '#16A34A' : '#6B7280', marginTop: 8, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                            {hasNew ? images[`image${num}`].name : hasExisting ? 'Current Image' : `Photo ${num}`}
                          </div>
                          <input type="file" style={{ display: 'none' }} accept="image/*"
                            onChange={e => handleImageChange(e, `image${num}`)} />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button type="button" className="fm-btn" onClick={() => setIsFormOpen(false)} style={{
                    height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #E5E7EB',
                    background: '#FFFFFF', color: '#111827', fontWeight: 500, cursor: 'pointer', fontSize: 14,
                  }}>Cancel</button>

                  {!editingTractor && (
                    <button type="button" className="fm-btn" onClick={() => submitForm('internal')} disabled={submitting} style={{
                      height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #E5E7EB',
                      background: '#FFFFFF', color: '#111827',
                      fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14,
                    }}>
                      {submitting ? '⏳ Saving…' : '📋 Register Asset Only'}
                    </button>
                  )}

                  <button type="button" className="fm-btn" onClick={() => submitForm('public')} disabled={submitting} style={{
                    height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid transparent',
                    background: submitting ? '#9CA3AF' : '#2563EB', color: '#fff',
                    fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14,
                    opacity: submitting ? 0.6 : 1,
                  }}>
                    {submitting ? '⏳ Saving…' : editingTractor ? '✅ Update Machine' : '🚀 Register & Publish to AgriRent'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═══ VEHICLE TABLE ═══ */}
          <div style={{ padding: '16px 0 24px' }}>

            {/* Table wrapper */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB',
              borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {/* Table header label */}
              <div style={{
                background: '#FFFFFF', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', textTransform: 'none', letterSpacing: 'normal' }}>
                  📋 Full Master Asset List — {tractors.length} Asset{tractors.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div style={{ padding: '64px 20px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E5E7EB', borderTop: '4px solid #2563EB', borderRight: '4px solid #2563EB', animation: 'fmSpin 1s linear infinite', margin: '0 auto 16px' }} />
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#6B7280' }}>Loading master asset data…</div>
                </div>
              ) : tractors.length === 0 ? (
                <div style={{ padding: '64px 20px', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Tractor size={26} color="#2563EB" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>No machines in registry</div>
                  <div style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>
                    Click "Add Machine" to register the first farming equipment.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="fm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        {['#', 'Machine', 'Daily Rate', 'Asset Value', 'Machine Status', 'Publication Status', 'Actions'].map((h, i) => (
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
                      {filteredTractors.map((tractor, idx) => {
                        const isPublic = !tractor.deleted_at;
                        return (
                          <tr key={tractor.id} className="fm-row" style={{
                            transition: 'background .15s',
                          }}>
                            {/* # */}
                            <td data-label="#" style={{ padding: '12px 16px', fontSize: 14, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {idx + 1}
                            </td>
                            {/* Machine info */}
                            <td data-label="Machine" style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: 8, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {tractor.image1
                                    ? <img src={getImageUrl(tractor.image1)} alt={tractor.name} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Tractor size={18} color="#2563EB" />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{tractor.name}</div>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginTop: 2 }}>{tractor.tractorType || '—'} • {tractor.transmission} • {tractor.fuelType}</div>
                                </div>
                              </div>
                            </td>
                            {/* Rate */}
                            <td data-label="Daily Rate" style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              ETB {Number(tractor.dailyRate || tractor.daily_rate || 0).toLocaleString()}
                            </td>
                            {/* Asset Value */}
                            <td data-label="Asset Value" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {parseFloat(tractor.asset_value || 0) > 0
                                  ? <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>ETB {parseFloat(tractor.asset_value).toLocaleString()}</span>
                                  : <span style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', fontWeight: 500 }}>Unset</span>}
                              </div>
                            </td>
                            {/* Machine Status */}
                            <td data-label="Machine Status" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              {getMachineStatusBadge(tractor)}
                            </td>
                            {/* Publication Status */}
                            <td data-label="Publication Status" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              {isPublic ? (
                                <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 10px', fontSize: 12, fontWeight: 500, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle size={12} /> Published
                                </span>
                              ) : (
                                <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 10px', fontSize: 12, fontWeight: 500, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <EyeOff size={12} /> Internal Only
                                </span>
                              )}
                            </td>
                            {/* Actions */}
                            <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {!isPublic ? (
                                  <>
                                    <button className="fm-btn" title="Publish to AgriRent page" onClick={() => handlePublish(tractor.id, tractor.name)} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid transparent',
                                      background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500,
                                      cursor: 'pointer',
                                    }}>
                                      <Send size={13} /> Publish
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className="fm-btn" title="Unpublish from AgriRent page" onClick={() => handleUnpublish(tractor.id, tractor.name)} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid transparent',
                                      background: '#FEF3C7', color: '#B45309', fontSize: 13, fontWeight: 500,
                                      cursor: 'pointer',
                                    }}>
                                      <EyeOff size={13} /> Unpublish
                                    </button>
                                  </>
                                )}
                                <button className="fm-btn" title="Edit" onClick={() => openEdit(tractor)} style={{
                                  width: 32, height: 32, borderRadius: 8, border: '1px solid transparent',
                                  background: '#E0F2FE', color: '#0284C7', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Edit2 size={14} />
                                </button>
                                <button className="fm-btn" title="Delete permanently" onClick={() => handleHardDelete(tractor.id, tractor.name)} style={{
                                  width: 32, height: 32, borderRadius: 8, border: '1px solid transparent',
                                  background: '#FEE2E2', color: '#B91C1C', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Trash2 size={14} />
                                </button>
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
              💡 Finance can also view and edit the Asset Value via the Finance Dashboard.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const lbl = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em',
};
const inp = {
  width: '100%', height: 36, padding: '0 12px', border: '1px solid #E5E7EB',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#FFFFFF',
  fontFamily: 'inherit', color: '#111827', outline: 'none',
};

export default TractorRegister;
