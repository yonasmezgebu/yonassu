import React, { useState } from 'react';
import { Package, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';
import { addNewStock } from '../../utils/storeApi';

const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', mint: '#98FF98',
  brown: '#8D6E63', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336', sky: '#0288D1',
};

const EMPTY = {
  name: '', strength: '', unit: '', unitPrice: '', category: '',
  therapeuticUse: '', requiresPrescription: false,
  batchNo: '', expiryDate: '', nearExpiryDays: '90',
  initialQty: '', minLevel: '', maxLevel: '', storageLocation: '',
};

const StoreAddNewStock = () => {
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // holds last registered drug summary

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const resetForm = () => { setForm({ ...EMPTY }); setConfirmed(null); };

  /* ── Validation ────────────────────────────────────────────────── */
  const validate = () => {
    if (!form.name.trim())    { NotifStore.push('Drug name is required', 'warning'); return false; }
    if (!form.batchNo.trim()) { NotifStore.push('Batch No is required', 'warning'); return false; }
    if (!form.expiryDate)     { NotifStore.push('Expiry Date is required', 'warning'); return false; }
    if (!form.unit)           { NotifStore.push('Unit is required', 'warning'); return false; }
    if (!form.initialQty || Number(form.initialQty) <= 0) {
      NotifStore.push('Initial Quantity must be greater than 0', 'warning');
      return false;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(form.expiryDate) <= today) {
      NotifStore.push('Expiry date must be in the future', 'warning');
      return false;
    }
    return true;
  };

  /* ── Submit ────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await addNewStock({
        name:                   form.name.trim(),
        strength:               form.strength || null,
        unit:                   form.unit,
        unit_price:             form.unitPrice ? parseFloat(form.unitPrice) : 0,
        category:               form.category || null,
        therapeutic_use:        form.therapeuticUse || null,
        requires_prescription:  form.requiresPrescription,
        batch_no:               form.batchNo.trim(),
        expiry_date:            form.expiryDate,
        near_expiry_days:       form.nearExpiryDays ? Number(form.nearExpiryDays) : 90,
        initial_quantity:       Number(form.initialQty),
        min_level:              form.minLevel ? Number(form.minLevel) : 0,
        max_level:              form.maxLevel ? Number(form.maxLevel) : 0,
        storage_location:       form.storageLocation || null,
      });
      if (!res.success) throw new Error(res.message || 'Registration failed');

      // Show in-app confirmation panel
      setConfirmed({
        name:        form.name.trim(),
        batchNo:     form.batchNo.trim(),
        expiryDate:  form.expiryDate,
        unit:        form.unit,
        category:    form.category,
        initialQty:  form.initialQty,
        unitPrice:   form.unitPrice,
        storage:     form.storageLocation,
      });
      NotifStore.push(`✅ "${form.name.trim()}" registered (Batch: ${form.batchNo.trim()})`, 'success');
      setForm({ ...EMPTY });
    } catch (err) {
      NotifStore.push(err.message || 'Failed to register new stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Styles ────────────────────────────────────────────────────── */
  const inp = (required = false) => ({
    width: '100%', padding: '10px 12px',
    border: `2px solid ${required ? G.forest : G.dark}`,
    background: G.white, fontFamily: "'Inter', sans-serif",
    fontSize: 13, outline: 'none', color: G.darkGray, boxSizing: 'border-box',
    borderRadius: 0,
  });
  const lbl = (required = false) => ({
    fontSize: 11, fontWeight: 900, color: required ? G.forest : G.dark,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, display: 'flex',
    alignItems: 'center', gap: 4,
  });

  const SectionHeader = ({ title, sub }) => (
    <div style={{ background: G.dark, color: G.white, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
      {sub && <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{sub}</span>}
    </div>
  );

  const RequiredStar = () => <span style={{ color: G.red, fontWeight: 900 }}>*</span>;

  /* ── Success Confirmation Panel ─────────────────────────────────── */
  const ConfirmBanner = () => confirmed ? (
    <div style={{
      background: '#E8F5E9', border: `3px solid ${G.forest}`,
      boxShadow: `6px 6px 0 ${G.dark}`, marginBottom: 28, padding: 0, overflow: 'hidden',
      animation: 'slideDown 0.4s ease',
    }}>
      <div style={{ background: G.forest, color: G.white, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <CheckCircle size={20} />
        <span style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
          Stock Successfully Registered
        </span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Drug Name',       val: confirmed.name },
            { label: 'Batch No',        val: confirmed.batchNo },
            { label: 'Expiry Date',     val: confirmed.expiryDate ? new Date(confirmed.expiryDate).toLocaleDateString() : '—' },
            { label: 'Unit',            val: confirmed.unit || '—' },
            { label: 'Initial Qty',     val: confirmed.initialQty || '—' },
            { label: 'Unit Price',      val: confirmed.unitPrice ? `ETB ${parseFloat(confirmed.unitPrice).toFixed(2)}` : '—' },
            { label: 'Category',        val: confirmed.category || '—' },
            { label: 'Storage',         val: confirmed.storage || '—' },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: G.white, border: `1px solid ${G.sage}`, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: G.dark }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setConfirmed(null)} style={{ background: G.forest, color: G.white, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, padding: '10px 20px', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
            ＋ Register Another Drug
          </button>
          <button onClick={() => setConfirmed(null)} style={{ background: G.white, color: G.dark, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, padding: '10px 20px', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`, padding: '24px 36px', color: G.white, borderBottom: `4px solid ${G.dark}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: G.leaf, padding: 8, border: `2px solid ${G.white}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
            <Package size={24} color={G.white} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Register New Stock</h1>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Catalog a new drug with batch tracking — Batch No &amp; Expiry Date are required</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 36px', width: '100%', boxSizing: 'border-box' }}>
        {/* Success Banner appears here after submission */}
        <ConfirmBanner />

        <form onSubmit={handleSubmit}>

          {/* ── SECTION 1: Drug Information ── */}
          <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}`, marginBottom: 24 }}>
            <SectionHeader title="Drug Information" sub="* Required fields" />
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div>
                  <label style={lbl(true)}>Drug Name <RequiredStar /></label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Amoxicillin" style={inp(true)} required />
                </div>
                <div>
                  <label style={lbl()}>Strength</label>
                  <input value={form.strength} onChange={set('strength')} placeholder="e.g. 500mg" style={inp()} />
                </div>
                <div>
                  <label style={lbl(true)}>Unit <RequiredStar /></label>
                  <select value={form.unit} onChange={set('unit')} style={inp(true)} required>
                    <option value="">Select unit…</option>
                    {['Tablets', 'Capsules', 'Bottles', 'Vials', 'Ampoules', 'Sachets', 'Pieces', 'Packs', 'Boxes', 'Syringes', 'Tubes'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl()}>Unit Price (ETB)</label>
                  <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={set('unitPrice')} placeholder="0.00" style={inp()} />
                </div>
                <div>
                  <label style={lbl()}>Category</label>
                  <input value={form.category} onChange={set('category')} placeholder="e.g. Antibiotics" style={inp()} />
                </div>
                <div>
                  <label style={lbl()}>Requires Prescription</label>
                  <select value={form.requiresPrescription} onChange={e => setForm(p => ({ ...p, requiresPrescription: e.target.value === 'true' }))} style={inp()}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl()}>Therapeutic Use / Description</label>
                  <input value={form.therapeuticUse} onChange={set('therapeuticUse')} placeholder="e.g. Treatment of bacterial infections" style={inp()} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Batch & Expiry (REQUIRED) ── */}
          <div style={{ background: G.white, border: `3px solid ${G.forest}`, boxShadow: `6px 6px 0 ${G.forest}`, marginBottom: 24 }}>
            <SectionHeader title="📦 Batch & Traceability — Required" sub="Links stock to its delivery for full recall & expiry tracking" />
            <div style={{ padding: 24 }}>
              <div style={{ background: '#FFF8E1', border: `2px solid ${G.orange}`, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#5D4037', fontWeight: 600 }}>
                <AlertTriangle size={16} color={G.orange} />
                Batch No and Expiry Date are required. Each delivery batch must be recorded separately for expiry tracking, audit, and recall capability.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div>
                  <label style={lbl(true)}>Batch No <RequiredStar /></label>
                  <input value={form.batchNo} onChange={set('batchNo')} placeholder="e.g. BT-2025-0042" style={inp(true)} required />
                </div>
                <div>
                  <label style={lbl(true)}>Expiry Date <RequiredStar /></label>
                  <input type="date" value={form.expiryDate} onChange={set('expiryDate')} style={inp(true)} required />
                </div>
                <div>
                  <label style={lbl()}>Alert Days Before Expiry</label>
                  <input type="number" min="1" value={form.nearExpiryDays} onChange={set('nearExpiryDays')} placeholder="e.g. 90" style={inp()} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Initial Inventory ── */}
          <div style={{ background: G.white, border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}`, marginBottom: 28 }}>
            <SectionHeader title="Initial Inventory" sub="Opening stock quantity for this batch" />
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div>
                  <label style={lbl(true)}>Initial Quantity <RequiredStar /></label>
                  <input type="number" min="1" value={form.initialQty} onChange={set('initialQty')} placeholder="e.g. 500" style={inp(true)} required />
                </div>
                <div>
                  <label style={lbl()}>Min Reorder Level</label>
                  <input type="number" min="0" value={form.minLevel} onChange={set('minLevel')} placeholder="e.g. 50" style={inp()} />
                </div>
                <div>
                  <label style={lbl()}>Max Stock Level</label>
                  <input type="number" min="0" value={form.maxLevel} onChange={set('maxLevel')} placeholder="e.g. 1000" style={inp()} />
                </div>
                <div>
                  <label style={lbl()}>Storage Location</label>
                  <input value={form.storageLocation} onChange={set('storageLocation')} placeholder="e.g. Rack A-1, Shelf 3" style={inp()} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={resetForm} style={{
              background: G.lightGray, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`,
              padding: '12px 28px', cursor: 'pointer', fontWeight: 900, fontSize: 14,
              fontFamily: "'Inter', sans-serif", color: G.darkGray,
            }}>
              Clear Form
            </button>
            <button type="submit" disabled={loading} style={{
              background: loading ? G.olive : G.forest,
              border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`,
              color: G.white, padding: '12px 32px', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 900, fontSize: 14, fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.8 : 1,
            }}>
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Registering…
                </>
              ) : (
                <><Plus size={18} /> Register Stock</>
              )}
            </button>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>
    </div>
  );
};

export default StoreAddNewStock;
