import React, { useState } from 'react';
import { Package, CheckCircle, ArrowLeft } from 'lucide-react';
import { addNewStock } from '../../utils/storeApi';

const StoreAddNewStock = () => {
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [unit, setUnit] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('');
  const [therapeuticUse, setTherapeuticUse] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [initialQty, setInitialQty] = useState('');
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Drug name is required';
    if (initialQty && (isNaN(initialQty) || Number(initialQty) < 0)) e.initialQty = 'Invalid quantity';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await addNewStock({
        name: name.trim(),
        strength: strength || null,
        unit: unit || null,
        unit_price: unitPrice ? parseFloat(unitPrice) : 0,
        category: category || null,
        therapeutic_use: therapeuticUse || null,
        requires_prescription: requiresPrescription,
        initial_quantity: initialQty ? Number(initialQty) : 0,
        min_level: minLevel ? Number(minLevel) : 0,
        max_level: maxLevel ? Number(maxLevel) : 0,
        storage_location: storageLocation || null,
      });
      if (!res.success) throw new Error(res.message);
      setSubmitted(res.data);
    } catch (err) {
      setSubmitError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #22c55e', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#22c55e" />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#166534', margin: '12px 0 4px' }}>New Stock Item Registered</h2>
          <p style={{ color: '#64748b', marginBottom: 20 }}>The product has been added to the drug catalog and store inventory.</p>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 20, border: '1px dashed #86efac', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><strong>Name:</strong> {submitted.name}</div>
              <div><strong>Strength:</strong> {submitted.strength || '-'}</div>
              <div><strong>Unit:</strong> {submitted.unit || '-'}</div>
              <div><strong>Price:</strong> {submitted.unit_price ? `${Number(submitted.unit_price).toFixed(2)} ETB` : '-'}</div>
              <div><strong>Category:</strong> {submitted.category || '-'}</div>
              <div><strong>Status:</strong> {submitted.status}</div>
            </div>
          </div>
          <button onClick={() => { setSubmitted(null); setName(''); setStrength(''); setUnit(''); setUnitPrice(''); setCategory(''); setTherapeuticUse(''); setRequiresPrescription(false); setInitialQty(''); setMinLevel(''); setMaxLevel(''); setStorageLocation(''); setErrors({}); setSubmitError(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Register Another</button>
        </div>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package color="#3b82f6" size={28} /> REGISTER NEW STOCK ITEM
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Add a new drug/product to the catalog and optionally set initial store inventory.</p>
      </div>

      {submitError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#b91c1c' }}>{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Drug Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Drug Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amoxicillin" style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : '#cbd5e1' }} />
              {errors.name && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.name}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Strength</label>
              <input value={strength} onChange={e => setStrength(e.target.value)} placeholder="e.g. 500mg" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="Bottles">Bottles</option>
                <option value="Vials">Vials</option>
                <option value="Ampoules">Ampoules</option>
                <option value="Sachets">Sachets</option>
                <option value="Pieces">Pieces</option>
                <option value="Packs">Packs</option>
                <option value="Boxes">Boxes</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Unit Price (ETB)</label>
              <input type="number" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Antibiotics" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Requires Prescription</label>
              <select value={requiresPrescription} onChange={e => setRequiresPrescription(e.target.value === 'true')} style={inputStyle}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Therapeutic Use</label>
              <textarea value={therapeuticUse} onChange={e => setTherapeuticUse(e.target.value)} rows={2} placeholder="e.g. Antibiotic used to treat bacterial infections" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Store Inventory (optional)</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>Set initial stock levels for the store. Leave blank to register the drug without stock.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Initial Quantity</label>
              <input type="number" min="0" value={initialQty} onChange={e => setInitialQty(e.target.value)} placeholder="0" style={{ ...inputStyle, borderColor: errors.initialQty ? '#ef4444' : '#cbd5e1' }} />
              {errors.initialQty && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.initialQty}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Min Level</label>
              <input type="number" min="0" value={minLevel} onChange={e => setMinLevel(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Max Level</label>
              <input type="number" min="0" value={maxLevel} onChange={e => setMaxLevel(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Storage Location</label>
              <input value={storageLocation} onChange={e => setStorageLocation(e.target.value)} placeholder="e.g. Rack A-1" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => { setName(''); setStrength(''); setUnit(''); setUnitPrice(''); setCategory(''); setTherapeuticUse(''); setRequiresPrescription(false); setInitialQty(''); setMinLevel(''); setMaxLevel(''); setStorageLocation(''); setErrors({}); setSubmitError(''); }} style={{ padding: '10px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Reset</button>
          <button type="submit" disabled={loading} style={{ padding: '10px 28px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? 'Registering...' : <><Package size={15} /> Register Stock</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreAddNewStock;
