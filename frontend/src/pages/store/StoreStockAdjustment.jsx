import React, { useState } from 'react';
import { Sliders, CheckCircle, Printer, ShieldAlert } from 'lucide-react';
import { notifyStockAdjustment } from '../../utils/storeNotifications';

const LARGE_ADJ_THRESHOLD = 100; // qty threshold requiring CEO approval
const CEO_APPROVAL_CODE = 'CEO-2026-ADJ'; // mock verification code

const StoreStockAdjustment = () => {
  const [adjType, setAdjType] = useState('Damage Write-off');
  const [itemName, setItemName] = useState('');
  const [qtyToAdjust, setQtyToAdjust] = useState('');
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState('Store Manager');
  const [ceoCode, setCeoCode] = useState('');
  const [ceoCodeError, setCeoCodeError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});

  const isLargeAdj = +qtyToAdjust >= LARGE_ADJ_THRESHOLD;

  const validate = () => {
    const e = {};
    if (!itemName.trim()) e.itemName = 'Item name is required';
    if (!qtyToAdjust || isNaN(qtyToAdjust) || +qtyToAdjust <= 0) e.qty = 'Valid quantity required';
    if (!reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (isLargeAdj) {
      if (!ceoCode.trim()) { setCeoCodeError('CEO approval code is required for large adjustments'); return; }
      if (ceoCode.trim() !== CEO_APPROVAL_CODE) { setCeoCodeError('Invalid CEO approval code. Please verify with the CEO.'); return; }
    }

    const adjNumber = `ADJ-${Date.now().toString().slice(-6)}`;
    setSubmitted({ adjNumber, adjType, itemName, qtyToAdjust, reason, approver, ceoApproved: isLargeAdj, date: new Date().toISOString() });
    notifyStockAdjustment(adjType, itemName, qtyToAdjust);
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #f97316', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#f97316" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#9a3412', margin: '12px 0 4px' }}>Stock Adjustment Completed</h2>
            <p style={{ color: '#64748b' }}>Adjustment Note generated and inventory updated.</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><strong>Adjustment #:</strong> <span style={{ fontFamily: 'monospace', color: '#f97316' }}>{submitted.adjNumber}</span></div>
              <div><strong>Type:</strong> {submitted.adjType}</div>
              <div><strong>Item:</strong> {submitted.itemName}</div>
              <div><strong>Quantity Adjusted:</strong> {submitted.qtyToAdjust}</div>
              <div><strong>Approver:</strong> {submitted.approver}</div>
              <div><strong>Date:</strong> {new Date(submitted.date).toLocaleDateString()}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Reason:</strong> {submitted.reason}</div>
            </div>
            {submitted.ceoApproved && (
              <div style={{ marginTop: 16, padding: 12, background: '#dcfce7', border: '1px solid #22c55e', borderRadius: 6, fontSize: 13, color: '#166534' }}>
                ✅ Large adjustment — CEO approval verified and recorded.
              </div>
            )}
            <div style={{ marginTop: 24, padding: 16, background: '#fff7ed', border: '2px solid #f97316', borderRadius: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#9a3412' }}>
              ⚙️ ADJUSTMENT NOTE — {submitted.adjNumber} | Approver: {submitted.approver}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Note
            </button>
            <button onClick={() => { setSubmitted(null); setItemName(''); setQtyToAdjust(''); setReason(''); setCeoCode(''); setCeoCodeError(''); setErrors({}); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Adjustment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders color="#f97316" size={28} /> STOCK ADJUSTMENT
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Adjustment Note — Manager Access Only</p>
      </div>

      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
        <ShieldAlert color="#f97316" size={18} />
        <span><strong>Permission Note:</strong> Adjustments ≥ {LARGE_ADJ_THRESHOLD} units require a valid CEO approval code before submission.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Adjustment Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Adjustment Type *</label>
              <select value={adjType} onChange={e => setAdjType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                <option>Damage Write-off</option>
                <option>Expiry Write-off</option>
                <option>Counting Correction</option>
                <option>Theft / Loss</option>
                <option>Return to Supplier</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Approver *</label>
              <select value={approver} onChange={e => setApprover(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                <option>Store Manager</option>
                <option>CEO</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Item Name *</label>
              <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Enter item name" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.itemName ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.itemName && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.itemName}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Quantity to Adjust *
                {isLargeAdj && <span style={{ color: '#f97316', fontWeight: 700, marginLeft: 8 }}>⚠️ Large Adjustment — CEO Approval Required</span>}
              </label>
              <input type="number" value={qtyToAdjust} onChange={e => setQtyToAdjust(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.qty ? '#ef4444' : isLargeAdj ? '#f97316' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.qty && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.qty}</span>}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reason for Adjustment *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Describe the reason for this adjustment..." style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.reason ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
              {errors.reason && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.reason}</span>}
            </div>
          </div>
        </div>

        {/* CEO Approval Gate */}
        {isLargeAdj && (
          <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ShieldAlert color="#b45309" size={20} />
              <h3 style={{ margin: 0, color: '#92400e', fontSize: 15 }}>CEO Approval Required</h3>
            </div>
            <p style={{ color: '#78350f', fontSize: 13, margin: '0 0 12px' }}>
              This adjustment exceeds {LARGE_ADJ_THRESHOLD} units. You must obtain a valid CEO approval code before submitting. Contact the CEO and enter the provided code below.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>CEO Approval Code *</label>
            <input value={ceoCode} onChange={e => { setCeoCode(e.target.value); setCeoCodeError(''); }} placeholder="Enter CEO approval code..." style={{ width: '100%', padding: '10px 12px', border: `1px solid ${ceoCodeError ? '#ef4444' : '#f59e0b'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box', maxWidth: 360 }} />
            {ceoCodeError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 6 }}>{ceoCodeError}</div>}
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 8 }}>Demo code: <code style={{ fontFamily: 'monospace', background: '#fde68a', padding: '2px 6px', borderRadius: 4 }}>{CEO_APPROVAL_CODE}</code></div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => { setItemName(''); setQtyToAdjust(''); setReason(''); setCeoCode(''); setErrors({}); }} style={{ padding: '10px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Reset</button>
          <button type="submit" style={{ padding: '10px 28px', background: '#9a3412', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Submit Adjustment</button>
        </div>
      </form>
    </div>
  );
};

export default StoreStockAdjustment;
