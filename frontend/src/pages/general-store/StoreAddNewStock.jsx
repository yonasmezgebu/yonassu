import React, { useState } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { addNewStock } from '../../utils/storeApi';

const CATEGORIES = [
  'Stationery', 'Cleaning Supplies', 'Office Equipment', 'Electrical',
  'Plumbing', 'Tools & Hardware', 'Safety & PPE', 'Packaging Materials',
  'Furniture', 'IT & Electronics', 'Kitchen & Catering', 'Spare Parts',
  'Fuel & Lubricants', 'Agricultural Inputs', 'Other'
];

const UNITS = [
  'Pieces', 'Packs', 'Boxes', 'Cartons', 'Bags', 'Rolls', 'Bottles',
  'Litres', 'Kilograms', 'Metres', 'Pairs', 'Sets', 'Pallets', 'Drums'
];

const StoreAddNewStock = () => {
  const [form, setForm] = useState({
    name: '', strength: '', unit: '', unit_price: '', category: '',
    therapeutic_use: '', requires_prescription: false,
    batch_no: '', expiry_date: '', near_expiry_days: '90',
    initial_quantity: '', min_level: '', max_level: '', storage_location: ''
  });
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Item name is required';
    if (!form.batch_no.trim()) e.batch_no = 'Batch / Lot No is required';
    if (!form.expiry_date) e.expiry_date = 'Expiry Date is required';
    if (!form.initial_quantity || Number(form.initial_quantity) <= 0) e.initial_quantity = 'Initial quantity must be > 0';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await addNewStock({
        name: form.name.trim(),
        strength: form.strength || null,
        unit: form.unit || null,
        unit_price: form.unit_price ? parseFloat(form.unit_price) : 0,
        category: form.category || null,
        therapeutic_use: form.therapeutic_use || null,
        requires_prescription: false,
        batch_no: form.batch_no.trim(),
        expiry_date: form.expiry_date,
        near_expiry_days: form.near_expiry_days ? Number(form.near_expiry_days) : 90,
        initial_quantity: Number(form.initial_quantity),
        min_level: form.min_level ? Number(form.min_level) : 0,
        max_level: form.max_level ? Number(form.max_level) : 0,
        storage_location: form.storage_location || null,
      });
      if (!res.success) throw new Error(res.message);
      setSubmitted(res.data);
    } catch (err) {
      setSubmitError(err.message || 'Failed to register item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', strength: '', unit: '', unit_price: '', category: '',
      therapeutic_use: '', requires_prescription: false,
      batch_no: '', expiry_date: '', near_expiry_days: '90',
      initial_quantity: '', min_level: '', max_level: '', storage_location: ''
    });
    setErrors({});
    setSubmitError('');
    setSubmitted(null);
  };

  const inp = (extra = {}) => ({
    style: { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', ...extra }
  });
  const errInp = { border: '1.5px solid #ef4444' };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #22c55e', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#22c55e" />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#166534', margin: '12px 0 4px' }}>Stock Item Registered</h2>
          <p style={{ color: '#64748b', marginBottom: 20 }}>The item has been added to the catalog and store inventory.</p>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 20, border: '1px dashed #86efac', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><strong>Name:</strong> {submitted.name}</div>
              <div><strong>Category:</strong> {submitted.category || '-'}</div>
              <div><strong>Unit:</strong> {submitted.unit || '-'}</div>
              <div><strong>Unit Price:</strong> {submitted.unit_price ? `${Number(submitted.unit_price).toFixed(2)} ETB` : '-'}</div>
              <div><strong>Status:</strong> {submitted.status || 'ACTIVE'}</div>
            </div>
          </div>
          <button onClick={resetForm} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            Register Another Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package color="#3b82f6" size={28} /> REGISTER NEW STOCK ITEM
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Add a new item to the general store catalog and set initial inventory.</p>
      </div>

      {submitError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#b91c1c' }}>
          ⚠️ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Item Info ── */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>📦 Item Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Item Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. A4 Paper Ream" {...inp(errors.name ? errInp : {})} />
              {errors.name && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.name}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={set('category')} {...inp()}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Unit of Measure</label>
              <select value={form.unit} onChange={set('unit')} {...inp()}>
                <option value="">Select unit...</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Unit Price (ETB)</label>
              <input type="number" step="0.01" min="0" value={form.unit_price} onChange={set('unit_price')} placeholder="0.00" {...inp()} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Brand / Specification</label>
              <input value={form.strength} onChange={set('strength')} placeholder="e.g. 80gsm, 500 sheets" {...inp()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Description / Notes</label>
              <textarea value={form.therapeutic_use} onChange={set('therapeutic_use')} rows={2} placeholder="Optional description or notes about this item" {...inp({ resize: 'vertical' })} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Batch & Expiry ── */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>🔖 Batch & Traceability</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>Required for full stock traceability. Enter a batch/lot reference and expiry date.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Batch / Lot No *</label>
              <input value={form.batch_no} onChange={set('batch_no')} placeholder="e.g. BATCH-2026-001" {...inp(errors.batch_no ? errInp : {})} />
              {errors.batch_no && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.batch_no}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Expiry Date *</label>
              <input type="date" value={form.expiry_date} onChange={set('expiry_date')} {...inp(errors.expiry_date ? errInp : {})} />
              {errors.expiry_date && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.expiry_date}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Near-Expiry Alert (days)</label>
              <input type="number" min="1" value={form.near_expiry_days} onChange={set('near_expiry_days')} placeholder="90" {...inp()} />
            </div>
          </div>
        </div>

        {/* ── Section 3: Inventory ── */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>📊 Initial Inventory</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>Set opening stock levels for this item.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Initial Quantity *</label>
              <input type="number" min="1" value={form.initial_quantity} onChange={set('initial_quantity')} placeholder="0" {...inp(errors.initial_quantity ? errInp : {})} />
              {errors.initial_quantity && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.initial_quantity}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Min Level (Reorder)</label>
              <input type="number" min="0" value={form.min_level} onChange={set('min_level')} placeholder="0" {...inp()} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Max Level</label>
              <input type="number" min="0" value={form.max_level} onChange={set('max_level')} placeholder="0" {...inp()} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Storage Location</label>
              <input value={form.storage_location} onChange={set('storage_location')} placeholder="e.g. Rack A-1, Shelf 3" {...inp()} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={resetForm} style={{ padding: '10px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            Reset
          </button>
          <button type="submit" disabled={loading} style={{ padding: '10px 28px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? 'Registering...' : <><Package size={15} /> Register Stock Item</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreAddNewStock;
