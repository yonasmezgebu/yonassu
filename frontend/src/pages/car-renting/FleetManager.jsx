import React, { useState, useEffect, useCallback } from 'react';
import {
  Car, Plus, Edit2, Trash2, Image as ImageIcon,
  Settings2, Fuel, Users, X, RotateCcw, EyeOff,
  CheckCircle, AlertTriangle, AlertCircle, Info
} from 'lucide-react';
import carService from '../../services/carService';

/* ─── Image URL helper ─── */
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

/* ─── Toast colours & icons ─── */
const TOAST_STYLES = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#14532d', Icon: CheckCircle },
  error:   { bg: '#fff1f2', border: '#fecdd3', icon: '#dc2626', text: '#7f1d1d', Icon: AlertCircle },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', text: '#78350f', Icon: AlertTriangle },
  info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e3a8a', Icon: Info },
};

/* ─── Inline Toast Component ─── */
const Toast = ({ toasts, removeToast }) => (
  <div style={{
    position: 'fixed', top: 24, right: 24, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
      return (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: s.bg, border: `1px solid ${s.border}`,
          borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          minWidth: 300, maxWidth: 380,
          animation: 'slideInToast 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
          pointerEvents: 'all',
        }}>
          <s.Icon size={20} color={s.icon} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            {t.title && <div style={{ fontWeight: 700, fontSize: 14, color: s.text, marginBottom: 2 }}>{t.title}</div>}
            <div style={{ fontSize: 13, color: s.text, lineHeight: 1.5 }}>{t.message}</div>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.icon, padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      );
    })}
  </div>
);

/* ─── Confirmation Dialog ─── */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger = true }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '36px 32px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'slideInToast 0.25s ease forwards',
      }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: danger ? '#fff1f2' : '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            {danger
              ? <AlertTriangle size={24} color="#dc2626" />
              : <CheckCircle size={24} color="#16a34a" />}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: danger ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#059669,#10b981)',
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
            boxShadow: danger ? '0 4px 14px rgba(220,38,38,0.35)' : '0 4px 14px rgba(5,150,105,0.35)',
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════ */
/*                  FLEET MANAGER                    */
/* ══════════════════════════════════════════════════ */
const FleetManager = () => {
  const [cars, setCars] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', dailyRate: '', seats: 4, transmission: 'Manual',
    fuelType: 'Petrol', carType: '', description: '', availability: 'Available',
  });
  const [images, setImages] = useState({ image1: null, image2: null, image3: null });

  /* ─── Toast state ─── */
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  /* ─── Confirm dialog state ─── */
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', action: null, danger: true });
  const askConfirm = (title, message, action, danger = true) =>
    setConfirm({ open: true, title, message, action, danger });
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false, action: null }));
  const doConfirm = async () => {
    if (confirm.action) await confirm.action();
    closeConfirm();
  };

  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await carService.getAllCars();
      if (res.status === 'success') setCars(res.data);
    } catch { addToast('error', 'Load Failed', 'Could not load fleet data. Check your connection.'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, key) => {
    if (e.target.files?.[0]) setImages(prev => ({ ...prev, [key]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(k => data.append(k, formData[k]));
      Object.keys(images).forEach(k => { if (images[k]) data.append(k, images[k]); });

      if (editingCar) {
        await carService.updateCar(editingCar.id, data);
        addToast('success', 'Vehicle Updated', `"${formData.name}" has been updated successfully.`);
      } else {
        await carService.createCar(data);
        addToast('success', 'Vehicle Posted', `"${formData.name}" is now live on the public page!`);
      }
      setIsFormOpen(false);
      setEditingCar(null);
      resetForm();
      fetchCars();
    } catch (error) {
      addToast('error', 'Save Failed', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = (id, name) => {
    askConfirm(
      'Hide Vehicle?',
      `"${name}" will be hidden from customers but can be restored at any time.`,
      async () => {
        try {
          await carService.deleteCar(id);
          addToast('warning', 'Vehicle Hidden', `"${name}" is now hidden from the public page.`);
          fetchCars();
        } catch { addToast('error', 'Action Failed', 'Could not hide this vehicle. Try again.'); }
      },
      false
    );
  };

  const handleHardDelete = (id, name) => {
    askConfirm(
      'Permanently Delete?',
      `This will permanently remove "${name}" and all its data. This cannot be undone.`,
      async () => {
        try {
          await carService.hardDeleteCar(id);
          addToast('error', 'Vehicle Deleted', `"${name}" has been permanently removed.`);
          fetchCars();
        } catch { addToast('error', 'Action Failed', 'Could not delete this vehicle. Try again.'); }
      },
      true
    );
  };

  const handleRestore = (id, name) => {
    askConfirm(
      'Restore Vehicle?',
      `"${name}" will be made visible to customers again on the public Car Rental page.`,
      async () => {
        try {
          await carService.restoreCar(id);
          addToast('success', 'Vehicle Restored', `"${name}" is now visible on the public page.`);
          fetchCars();
        } catch { addToast('error', 'Action Failed', 'Could not restore this vehicle. Try again.'); }
      },
      false
    );
  };

  const openEdit = (car) => {
    setEditingCar(car);
    setFormData({
      name: car.name, dailyRate: car.dailyRate, seats: car.seats,
      transmission: car.transmission, fuelType: car.fuelType,
      carType: car.carType, description: car.description, availability: car.availability,
    });
    setImages({ image1: null, image2: null, image3: null });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', dailyRate: '', seats: 4, transmission: 'Manual', fuelType: 'Petrol', carType: '', description: '', availability: 'Available' });
    setImages({ image1: null, image2: null, image3: null });
  };

  const getStatusColor = (status, isDeleted) => {
    if (isDeleted) return '#6B7280';
    return { Available: '#10B981', Booked: '#3B82F6', Maintenance: '#EF4444' }[status] || '#6B7280';
  };

  /* ─── Keyframe injection ─── */
  useEffect(() => {
    if (document.getElementById('fleet-toast-style')) return;
    const style = document.createElement('style');
    style.id = 'fleet-toast-style';
    style.textContent = `
      @keyframes slideInToast {
        from { opacity: 0; transform: translateX(40px) scale(0.95); }
        to   { opacity: 1; transform: translateX(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  /* ══════ RENDER ══════ */
  return (
    <>
      {/* Toast portal */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        onConfirm={doConfirm}
        onCancel={closeConfirm}
      />

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter',sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Post / Update / Delete Cars</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Manage vehicles shown on the public Car Rental page</p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingCar(null); setIsFormOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg,#059669,#10b981)',
              color: '#fff', padding: '10px 22px', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
            }}
          >
            <Plus size={18} /> Add Vehicle
          </button>
        </div>

        {/* ── Form ── */}
        {isFormOpen && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2rem',
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)', marginBottom: '2rem',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {editingCar ? '✏️ Edit Vehicle' : '🚗 Add New Vehicle'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#94a3b8" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Vehicle Name', name: 'name', placeholder: 'e.g. Toyota Land Cruiser V8', type: 'text', required: true },
                  { label: 'Daily Rate (ETB)', name: 'dailyRate', placeholder: 'e.g. 2500', type: 'number', required: true },
                  { label: 'Seats', name: 'seats', type: 'number', required: true },
                  { label: 'Vehicle Type', name: 'carType', placeholder: 'e.g. SUV, Sedan, Minibus', type: 'text', required: true },
                ].map(f => (
                  <div key={f.name}>
                    <label style={labelStyle}>{f.label}</label>
                    <input required={f.required} type={f.type} name={f.name} value={formData[f.name]} onChange={handleInputChange} placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Transmission</label>
                  <select name="transmission" value={formData.transmission} onChange={handleInputChange} style={inputStyle}>
                    <option>Manual</option><option>Automatic</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fuel Type</label>
                  <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} style={inputStyle}>
                    <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Availability Status</label>
                  <select name="availability" value={formData.availability} onChange={handleInputChange} style={inputStyle}>
                    <option>Available</option><option>Booked</option><option>Maintenance</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder="Vehicle features, condition, extras..." />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ ...labelStyle, marginBottom: 12 }}>Vehicle Images (up to 3)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
                  {[1, 2, 3].map(num => (
                    <label key={num} style={{
                      border: `2px dashed ${images[`image${num}`] ? '#10b981' : '#e2e8f0'}`,
                      borderRadius: 14, padding: '1.25rem', textAlign: 'center',
                      cursor: 'pointer', background: images[`image${num}`] ? '#f0fdf4' : '#f8fafc',
                      transition: 'all 0.2s',
                    }}>
                      <ImageIcon size={22} color={images[`image${num}`] ? '#10b981' : '#94a3b8'} />
                      <div style={{ fontSize: 13, color: images[`image${num}`] ? '#059669' : '#94a3b8', marginTop: 8, fontWeight: 600 }}>
                        {images[`image${num}`] ? images[`image${num}`].name : `Photo ${num}`}
                      </div>
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => handleImageChange(e, `image${num}`)} />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{
                  padding: '10px 22px', borderRadius: 10, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer',
                }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{
                  padding: '10px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#059669,#10b981)',
                  color: '#fff', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
                  opacity: submitting ? 0.7 : 1,
                }}>
                  {submitting ? 'Saving…' : editingCar ? 'Update Vehicle' : 'Post Vehicle'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
              <tr>
                {['Vehicle', 'Rate / Day', 'Specs', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: i === 4 ? 'right' : 'left', fontSize: 13, fontWeight: 700, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading vehicles…</td></tr>
              ) : cars.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Car size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <div style={{ color: '#64748b', fontWeight: 600 }}>No vehicles yet.</div>
                    <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Click "Add Vehicle" above to post your first car.</div>
                  </td>
                </tr>
              ) : (
                cars.map(car => (
                  <tr key={car.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {car.image1 ? <img src={getImageUrl(car.image1)} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Car size={22} color="#94a3b8" />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: car.deleted_at ? '#94a3b8' : '#0f172a', textDecoration: car.deleted_at ? 'line-through' : 'none' }}>{car.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{car.carType}{car.deleted_at && <span style={{ color: '#ef4444', fontWeight: 700 }}> · Hidden</span>}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>ETB {Number(car.dailyRate).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 10, color: '#64748b', fontSize: 12, flexWrap: 'wrap' }}>
                        <span>⚙️ {car.transmission}</span>
                        <span>⛽ {car.fuelType}</span>
                        <span>👥 {car.seats}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                        background: `${getStatusColor(car.availability, car.deleted_at)}18`,
                        color: getStatusColor(car.availability, car.deleted_at),
                      }}>
                        {car.deleted_at ? 'Hidden' : car.availability}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {car.deleted_at ? (
                          <>
                            <button title="Restore" onClick={() => handleRestore(car.id, car.name)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #10b981', background: 'none', color: '#10b981', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              <RotateCcw size={13} /> Restore
                            </button>
                            <button title="Delete Forever" onClick={() => handleHardDelete(car.id, car.name)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #ef4444', background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button title="Edit" onClick={() => openEdit(car)}
                              style={{ background: '#eff6ff', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
                              <Edit2 size={16} />
                            </button>
                            <button title="Hide from customers" onClick={() => handleSoftDelete(car.id, car.name)}
                              style={{ background: '#fffbeb', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                              <EyeOff size={16} />
                            </button>
                            <button title="Delete permanently" onClick={() => handleHardDelete(car.id, car.name)}
                              style={{ background: '#fff1f2', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

export default FleetManager;
