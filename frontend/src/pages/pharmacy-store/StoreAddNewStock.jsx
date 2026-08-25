import React, { useState } from 'react';
import { Package, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';
import { addNewStock } from '../../utils/storeApi';

/* ── Enterprise CSS ─────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --cp:           #2563EB;
    --cp-h:         #1D4ED8;
    --cbg:          #F5F6FA;
    --ccard:        #FFFFFF;
    --cborder:      #E5E7EB;
    --ct1:          #111827;
    --ct2:          #6B7280;
    --ctm:          #9CA3AF;
    --cok:          #16A34A;
    --cok-bg:       #DCFCE7;
    --cdanger:      #DC2626;
    --cdanger-bg:   #FEE2E2;
    --cwarn:        #D97706;
    --cwarn-bg:     #FEF3C7;
    --cinfo:        #0284C7;
    --cinfo-bg:     #E0F2FE;
    --gold:         #F59E0B;
    --gold-text:    #111827;
  }

  /* ── Page Wrapper ── */
  .ans-page {
    box-sizing: border-box;
    margin: 10px auto;
    width: calc(100% - 20px);
    max-width: 1400px;
    min-height: calc(100vh - 20px);
    padding: 24px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1);
    line-height: 1.5;
    padding-bottom: 48px;
  }
  @media (max-width: 1024px) {
    .ans-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px; }
  }
  @media (max-width: 480px) {
    .ans-page { margin: 4px auto; width: calc(100% - 8px); padding: 12px; }
  }

  /* ── Page Header ── */
  .ans-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--cborder);
  }
  .ans-header-icon {
    background: #EFF6FF;
    color: var(--cp);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-shrink: 0;
  }
  .ans-page-title {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    line-height: 1.3;
    margin: 0 0 2px;
    color: var(--ct1);
  }
  .ans-page-sub {
    font-size: 13px;
    color: var(--ct2);
    margin: 0;
  }

  /* ── Success Banner ── */
  .ans-confirm {
    background: var(--cok-bg);
    border: 1px solid var(--cok);
    border-radius: 10px;
    margin-bottom: 24px;
    overflow: hidden;
    animation: ansSlideIn 300ms ease-out;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  @keyframes ansSlideIn {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ans-confirm-hd {
    background: var(--cok);
    color: #fff;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
  }
  .ans-confirm-body { padding: 20px; }
  .ans-confirm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }
  .ans-confirm-item {
    background: var(--ccard);
    border: 1px solid var(--cborder);
    border-radius: 8px;
    padding: 12px 14px;
  }
  .ans-confirm-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--ctm);
    margin-bottom: 4px;
  }
  .ans-confirm-val {
    font-size: 14px;
    font-weight: 600;
    color: var(--ct1);
  }
  .ans-confirm-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* ── Form Card ── */
  .ans-card {
    background: var(--ccard);
    border: 1px solid var(--cborder);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    margin-bottom: 20px;
    overflow: hidden;
    transition: box-shadow 150ms ease;
  }
  .ans-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }

  /* ── Section Header ── */
  .ans-sec-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: #F9FAFB;
    border-bottom: 1px solid var(--cborder);
  }
  .ans-sec-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ct1);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .ans-sec-sub {
    font-size: 12px;
    color: var(--ctm);
    font-weight: 400;
  }

  .ans-sec-body { padding: 20px 24px; }
  @media (max-width: 480px) { .ans-sec-body { padding: 16px; } }

  /* ── Alert Row inside section ── */
  .ans-info-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: var(--cwarn-bg);
    border: 1px solid var(--cwarn);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #78350F;
    font-weight: 500;
    line-height: 1.5;
  }
  .ans-info-row svg { flex-shrink: 0; margin-top: 2px; }

  /* ── Form Grid ── */
  .ans-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .ans-fg { display: flex; flex-direction: column; gap: 5px; }
  .ans-fg.full { grid-column: 1 / -1; }

  /* ── Labels ── */
  .ans-label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .03em;
    color: var(--ct2);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ans-req { color: var(--cdanger); font-weight: 600; }

  /* ── Inputs ── */
  .ans-input {
    height: 36px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid var(--cborder);
    font-size: 14px;
    font-family: inherit;
    color: var(--ct1);
    background: var(--ccard);
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  .ans-input:focus {
    border-color: var(--cp);
    box-shadow: 0 0 0 3px rgba(37,99,235,.10);
  }
  .ans-input.required-field { border-color: rgba(37,99,235,.35); }
  .ans-input.required-field:focus { border-color: var(--cp); }
  select.ans-input { appearance: auto; cursor: pointer; }

  /* ── Action Bar ── */
  .ans-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  /* ── Buttons ── */
  .ans-btn {
    height: 40px;
    padding: 0 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--cborder);
    background: var(--ccard);
    color: var(--ct1);
    font-family: inherit;
    transition: all 150ms ease-in-out;
    white-space: nowrap;
    min-width: 44px;
    justify-content: center;
  }
  .ans-btn:hover:not(:disabled) {
    background: var(--gold);
    color: var(--gold-text);
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(0,0,0,.10);
    transform: translateY(-1px);
  }
  .ans-btn:disabled { opacity: .5; cursor: not-allowed; }

  .ans-btn-primary {
    background: var(--cp);
    color: #fff;
    border-color: var(--cp);
  }
  .ans-btn-primary:hover:not(:disabled) {
    background: var(--gold);
    color: var(--gold-text);
    border-color: transparent;
  }

  .ans-btn-success {
    background: var(--cok);
    color: #fff;
    border-color: var(--cok);
  }
  .ans-btn-success:hover:not(:disabled) {
    background: var(--gold);
    color: var(--gold-text);
    border-color: transparent;
  }

  /* ── Spinner ── */
  .ans-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    animation: ans-spin 700ms linear infinite;
    flex-shrink: 0;
  }
  @keyframes ans-spin { to { transform: rotate(360deg); } }
`;

/* ─── Constants ─────────────────────────────────────────────────── */
const EMPTY = {
  name: '', strength: '', unit: '', unitPrice: '', category: '',
  therapeuticUse: '', requiresPrescription: false,
  batchNo: '', expiryDate: '', nearExpiryDays: '90',
  initialQty: '', minLevel: '', maxLevel: '', storageLocation: '',
};

const StoreAddNewStock = () => {
  const [form, setForm]         = useState({ ...EMPTY });
  const [loading, setLoading]   = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const resetForm = () => { setForm({ ...EMPTY }); setConfirmed(null); };

  /* ── Validation ── */
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

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await addNewStock({
        name:                  form.name.trim(),
        strength:              form.strength || null,
        unit:                  form.unit,
        unit_price:            form.unitPrice ? parseFloat(form.unitPrice) : 0,
        category:              form.category || null,
        therapeutic_use:       form.therapeuticUse || null,
        requires_prescription: form.requiresPrescription,
        batch_no:              form.batchNo.trim(),
        expiry_date:           form.expiryDate,
        near_expiry_days:      form.nearExpiryDays ? Number(form.nearExpiryDays) : 90,
        initial_quantity:      Number(form.initialQty),
        min_level:             form.minLevel ? Number(form.minLevel) : 0,
        max_level:             form.maxLevel ? Number(form.maxLevel) : 0,
        storage_location:      form.storageLocation || null,
      });
      if (!res.success) throw new Error(res.message || 'Registration failed');
      setConfirmed({
        name:       form.name.trim(),
        batchNo:    form.batchNo.trim(),
        expiryDate: form.expiryDate,
        unit:       form.unit,
        category:   form.category,
        initialQty: form.initialQty,
        unitPrice:  form.unitPrice,
        storage:    form.storageLocation,
      });
      NotifStore.push(`✅ "${form.name.trim()}" registered (Batch: ${form.batchNo.trim()})`, 'success');
      setForm({ ...EMPTY });
    } catch (err) {
      NotifStore.push(err.message || 'Failed to register new stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ans-page">
      <style>{CSS}</style>

      {/* ── PAGE HEADER ── */}
      <div className="ans-header">
        <div className="ans-header-icon">
          <Package size={26} color="var(--cp)" />
        </div>
        <div>
          <h1 className="ans-page-title">Register New Stock</h1>
          <p className="ans-page-sub">
            Catalog a new drug with batch tracking — Batch No &amp; Expiry Date are required
          </p>
        </div>
      </div>

      {/* ── SUCCESS CONFIRMATION PANEL ── */}
      {confirmed && (
        <div className="ans-confirm">
          <div className="ans-confirm-hd">
            <CheckCircle size={20} />
            Stock Successfully Registered
          </div>
          <div className="ans-confirm-body">
            <div className="ans-confirm-grid">
              {[
                { label: 'Drug Name',   val: confirmed.name },
                { label: 'Batch No',    val: confirmed.batchNo },
                { label: 'Expiry Date', val: confirmed.expiryDate ? new Date(confirmed.expiryDate).toLocaleDateString() : '—' },
                { label: 'Unit',        val: confirmed.unit || '—' },
                { label: 'Initial Qty', val: confirmed.initialQty || '—' },
                { label: 'Cost Price',  val: confirmed.unitPrice ? `ETB ${parseFloat(confirmed.unitPrice).toFixed(2)}` : '—' },
                { label: 'Category',    val: confirmed.category || '—' },
                { label: 'Storage',     val: confirmed.storage || '—' },
              ].map(({ label, val }) => (
                <div key={label} className="ans-confirm-item">
                  <div className="ans-confirm-label">{label}</div>
                  <div className="ans-confirm-val">{val}</div>
                </div>
              ))}
            </div>
            <div className="ans-confirm-actions">
              <button onClick={() => setConfirmed(null)} className="ans-btn ans-btn-success">
                <Plus size={16} /> Register Another Drug
              </button>
              <button onClick={() => setConfirmed(null)} className="ans-btn">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FORM ── */}
      <form onSubmit={handleSubmit}>

        {/* ── SECTION 1: Drug Information ── */}
        <div className="ans-card">
          <div className="ans-sec-hd">
            <h2 className="ans-sec-title">Drug Information</h2>
            <span className="ans-sec-sub">* Required fields</span>
          </div>
          <div className="ans-sec-body">
            <div className="ans-form-grid">

              <div className="ans-fg">
                <label className="ans-label">Drug Name <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Amoxicillin"
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Strength</label>
                <input
                  className="ans-input"
                  value={form.strength}
                  onChange={set('strength')}
                  placeholder="e.g. 500mg"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Unit <span className="ans-req">*</span></label>
                <select
                  className="ans-input required-field"
                  value={form.unit}
                  onChange={set('unit')}
                  required
                >
                  <option value="">Select unit…</option>
                  {['Tablets','Capsules','Bottles','Vials','Ampoules','Sachets','Pieces','Packs','Boxes','Syringes','Tubes'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="ans-fg">
                <label className="ans-label">Cost Price (ETB)</label>
                <input
                  className="ans-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unitPrice}
                  onChange={set('unitPrice')}
                  placeholder="0.00"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Category</label>
                <input
                  className="ans-input"
                  value={form.category}
                  onChange={set('category')}
                  placeholder="e.g. Antibiotics"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Requires Prescription</label>
                <select
                  className="ans-input"
                  value={form.requiresPrescription}
                  onChange={e => setForm(p => ({ ...p, requiresPrescription: e.target.value === 'true' }))}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="ans-fg full">
                <label className="ans-label">Therapeutic Use / Description</label>
                <input
                  className="ans-input"
                  value={form.therapeuticUse}
                  onChange={set('therapeuticUse')}
                  placeholder="e.g. Treatment of bacterial infections"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── SECTION 2: Batch & Traceability ── */}
        <div className="ans-card">
          <div className="ans-sec-hd">
            <h2 className="ans-sec-title">📦 Batch &amp; Traceability — Required</h2>
            <span className="ans-sec-sub">Links stock to its delivery for full recall &amp; expiry tracking</span>
          </div>
          <div className="ans-sec-body">
            <div className="ans-info-row">
              <AlertTriangle size={16} color="var(--cwarn)" />
              Batch No and Expiry Date are required. Each delivery batch must be recorded separately for expiry tracking, audit, and recall capability.
            </div>
            <div className="ans-form-grid">

              <div className="ans-fg">
                <label className="ans-label">Batch No <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  value={form.batchNo}
                  onChange={set('batchNo')}
                  placeholder="e.g. BT-2025-0042"
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Expiry Date <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  type="date"
                  value={form.expiryDate}
                  onChange={set('expiryDate')}
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Alert Days Before Expiry</label>
                <input
                  className="ans-input"
                  type="number"
                  min="1"
                  value={form.nearExpiryDays}
                  onChange={set('nearExpiryDays')}
                  placeholder="e.g. 90"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── SECTION 3: Initial Inventory ── */}
        <div className="ans-card">
          <div className="ans-sec-hd">
            <h2 className="ans-sec-title">Initial Inventory</h2>
            <span className="ans-sec-sub">Opening stock quantity for this batch</span>
          </div>
          <div className="ans-sec-body">
            <div className="ans-form-grid">

              <div className="ans-fg">
                <label className="ans-label">Initial Quantity <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  type="number"
                  min="1"
                  value={form.initialQty}
                  onChange={set('initialQty')}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Min Reorder Level</label>
                <input
                  className="ans-input"
                  type="number"
                  min="0"
                  value={form.minLevel}
                  onChange={set('minLevel')}
                  placeholder="e.g. 50"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Max Stock Level</label>
                <input
                  className="ans-input"
                  type="number"
                  min="0"
                  value={form.maxLevel}
                  onChange={set('maxLevel')}
                  placeholder="e.g. 1000"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Storage Location</label>
                <input
                  className="ans-input"
                  value={form.storageLocation}
                  onChange={set('storageLocation')}
                  placeholder="e.g. Rack A-1, Shelf 3"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="ans-actions">
          <button type="button" onClick={resetForm} className="ans-btn" disabled={loading}>
            Clear Form
          </button>
          <button type="submit" className="ans-btn ans-btn-primary" disabled={loading}>
            {loading ? (
              <><span className="ans-spinner" /> Registering…</>
            ) : (
              <><Plus size={16} /> Register Stock</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default StoreAddNewStock;
