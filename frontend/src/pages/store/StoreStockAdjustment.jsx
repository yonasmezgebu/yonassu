import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle, Printer, ShieldAlert, Search } from 'lucide-react';
import { createAdjustment, getAllDrugs } from '../../utils/storeApi';

const StoreStockAdjustment = () => {
  const [adjType, setAdjType] = useState('Damage Write-off');
  const [drugId, setDrugId] = useState('');
  const [drugName, setDrugName] = useState('');
  const [qtyToAdjust, setQtyToAdjust] = useState('');
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState('Store Manager');
  const [ceoCode, setCeoCode] = useState('');
  const [ceoCodeError, setCeoCodeError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const isLargeAdj = +qtyToAdjust >= 100;

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await getAllDrugs();
        setDrugs(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load drugs');
      } finally {
        setLoading(false);
      }
    };
    fetchDrugs();
  }, []);

  const validate = () => {
    const e = {};
    if (!drugId) e.itemName = 'Item name is required';
    if (!qtyToAdjust || isNaN(qtyToAdjust) || +qtyToAdjust <= 0) e.qty = 'Valid quantity required';
    if (!reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (isLargeAdj) {
      if (!ceoCode.trim()) { setCeoCodeError('CEO approval code is required for large adjustments'); return; }
    }

    const adjustment_no = 'ADJ-' + Date.now().toString().slice(-6);
    let qty;
    if (['Counting Correction', 'Return to Supplier'].includes(adjType) && approver === 'Store Manager') {
      qty = Math.abs(Number(qtyToAdjust));
    } else {
      qty = -Math.abs(Number(qtyToAdjust));
    }

    const payload = {
      adjustment_no,
      drug_id: Number(drugId),
      adjustment_type: adjType,
      reason,
      adjustment_qty: qty,
      approval_code: ceoCode || null,
      adjustment_date: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await createAdjustment(payload);
      if (!res.success) throw new Error(res.message);
      setSubmitted({
        adjNumber: adjustment_no,
        adjType,
        itemName: drugName,
        qtyToAdjust,
        reason,
        approver,
        ceoApproved: isLargeAdj,
        date: new Date().toISOString(),
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit adjustment');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading drugs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ef4444' }}>Error: {error}</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #f59e0b', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#f59e0b" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#92400e', margin: '12px 0 4px' }}>Submitted for CEO Approval</h2>
            <p style={{ color: '#64748b' }}>This adjustment is pending CEO review. Inventory will be updated once approved.</p>
          </div>
          <div style={{ background: '#fefce8', borderRadius: 8, padding: 20, border: '1px dashed #f59e0b', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><strong>Adjustment #:</strong> <span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{submitted.adjNumber}</span></div>
              <div><strong>Type:</strong> {submitted.adjType}</div>
              <div><strong>Item:</strong> {submitted.itemName}</div>
              <div><strong>Quantity Adjusted:</strong> {submitted.qtyToAdjust}</div>
              <div><strong>Submitted By:</strong> {submitted.approver}</div>
              <div><strong>Date:</strong> {new Date(submitted.date).toLocaleDateString()}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Reason:</strong> {submitted.reason}</div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⏳</span> Pending CEO decision — you will be notified when approved or rejected.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Note
            </button>
            <button onClick={() => { setSubmitted(null); setDrugId(''); setDrugName(''); setQtyToAdjust(''); setReason(''); setCeoCode(''); setCeoCodeError(''); setErrors({}); setSubmitError(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
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
        <span><strong>Permission Note:</strong> All stock adjustments require CEO approval before being applied to inventory.</span>
      </div>

      {submitError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#b91c1c' }}>
          {submitError}
        </div>
      )}

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
              <select value={drugId} onChange={e => {
                const selected = drugs.find(d => String(d.id) === e.target.value);
                setDrugId(e.target.value);
                setDrugName(selected ? `${selected.name} ${selected.strength} - ${selected.unit}` : '');
              }} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.itemName ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}>
                <option value="">Select item...</option>
                {drugs.map(d => (
                  <option key={d.id} value={d.id}>{d.name} {d.strength} - {d.unit}</option>
                ))}
              </select>
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
              This adjustment exceeds 100 units. You must obtain a valid CEO approval code before submitting. Contact the CEO and enter the provided code below.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>CEO Approval Code *</label>
            <input value={ceoCode} onChange={e => { setCeoCode(e.target.value); setCeoCodeError(''); }} placeholder="Enter CEO approval code..." style={{ width: '100%', padding: '10px 12px', border: `1px solid ${ceoCodeError ? '#ef4444' : '#f59e0b'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box', maxWidth: 360 }} />
            {ceoCodeError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 6 }}>{ceoCodeError}</div>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => { setDrugId(''); setDrugName(''); setQtyToAdjust(''); setReason(''); setCeoCode(''); setErrors({}); setSubmitError(''); }} style={{ padding: '10px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Reset</button>
          <button type="submit" style={{ padding: '10px 28px', background: '#9a3412', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Submit Adjustment</button>
        </div>
      </form>
    </div>
  );
};

export default StoreStockAdjustment;
