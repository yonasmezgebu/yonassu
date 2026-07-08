import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import { Send, Package, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

const STEPS = ['Item', 'Quantity', 'Reason', 'Review'];

export default function StoreRequisitionForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const prefill = location.state?.item || {};

  const [step, setStep] = useState(0);
  const [drugName, setDrugName] = useState(prefill.name || '');
  const [drugId, setDrugId] = useState(prefill.drug_id || prefill.id || '');
  const [availableStock, setAvailableStock] = useState(prefill.stock_quantity || 0);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedReq, setSubmittedReq] = useState(null);

  const canNext = () => {
    if (step === 0) return drugName.trim();
    if (step === 1) return parseInt(quantity) > 0 && parseInt(quantity) <= availableStock;
    if (step === 2) return reason.trim().length >= 5;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const reqNo = `SR-${Date.now()}`;
      const payload = {
        requisition_no: reqNo,
        department: 'Pharmacy',
        requested_by: 'Pharmacy Manager',
        priority: 'Normal',
        remarks: reason,
        items: [{ item_name: drugName, drug_id: drugId || null, quantity: parseInt(quantity) }],
      };
      const res = await apiClient.post('/store/requisitions', payload);
      if (res.success) {
        showToast('Requisition sent to CEO for approval', 'success');
        playSound('success');
        setSubmittedReq({ id: res.data?.id, reqNo, drugName, quantity, reason });
        setDone(true);
      } else {
        showToast(res.message || 'Failed to create requisition', 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done && submittedReq) {
    const today = new Date().toLocaleDateString();
    return (
      <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 640, margin: '0 auto' }}>
        <ToastContainer />
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#059669', color: 'white', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Requisition Submitted</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.85 }}>Sent to CEO for approval</p>
            </div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Requisition #</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{submittedReq.reqNo}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Date</div>
                  <div style={{ fontSize: 14, color: '#1E293B' }}>{today}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Item</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{submittedReq.drugName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Quantity</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{submittedReq.quantity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Reason</span>
                  <span style={{ fontSize: 14, color: '#1E293B' }}>{submittedReq.reason}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Status</span>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Pending (Awaiting CEO)</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate('/pharmacy/store-inventory')}
                style={{ flex: 1, padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: 13 }}>
                Back to Inventory
              </button>
              <button onClick={() => navigate('/pharmacy/store-requisition', { state: { item: { name: drugName, drug_id: drugId, stock_quantity: availableStock } } })}
                style={{ flex: 1, padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Request Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 640, margin: '0 auto' }}>
      <ToastContainer />
      <button onClick={() => navigate('/pharmacy/store-inventory')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back to Store Inventory
      </button>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ background: '#059669', color: 'white', padding: '20px 24px' }}>
          <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={20} /> Store Requisition
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.85 }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', padding: '16px 24px 0', gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
                background: i < step ? '#059669' : i === step ? '#059669' : '#E2E8F0',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <div style={{ fontSize: 10, color: i <= step ? '#059669' : '#94A3B8', fontWeight: i <= step ? 600 : 400 }}>{s}</div>
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: 14, left: '50%', width: '100%', height: 2,
                  background: i < step ? '#059669' : '#E2E8F0', zIndex: -1,
                }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {/* Step 0: Item */}
          {step === 0 && (
            <div>
              <label style={labelStyle}>Drug / Item Name</label>
              <input value={drugName} onChange={e => setDrugName(e.target.value)}
                style={inputStyle} placeholder="Enter drug name" readOnly={!!prefill.name} />
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                Available in Store: <strong style={{ color: '#059669' }}>{availableStock} units</strong>
              </div>
            </div>
          )}

          {/* Step 1: Quantity */}
          {step === 1 && (
            <div>
              <label style={labelStyle}>Quantity to Request</label>
              <input type="number" min={1} max={availableStock} value={quantity}
                onChange={e => setQuantity(e.target.value)}
                style={inputStyle} placeholder={`Enter quantity (max ${availableStock})`} />
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                {parseInt(quantity) > availableStock ? (
                  <span style={{ color: '#EF4444' }}>Cannot exceed available stock ({availableStock})</span>
                ) : parseInt(quantity) > 0 ? (
                  <span style={{ color: '#059669' }}>Requesting {quantity} units</span>
                ) : (
                  <span>Available: {availableStock} units</span>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Reason */}
          {step === 2 && (
            <div>
              <label style={labelStyle}>Reason for Requisition</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                rows={4} style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Why is this stock needed? (min 5 characters)" />
              <div style={{ marginTop: 8, fontSize: 12, color: reason.trim().length >= 5 ? '#059669' : '#EF4444' }}>
                {reason.trim().length >= 5 ? '✓ Good' : `${reason.trim().length}/5 characters minimum`}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#1E293B' }}>Review Your Requisition</h3>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, border: '1px solid #E2E8F0' }}>
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Item</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{drugName}</div>
                </div>
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Quantity</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{quantity}</div>
                </div>
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Reason</div>
                  <div style={{ fontSize: 14, color: '#475569' }}>{reason}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                  <span style={{ display: 'inline-block', background: '#FEF3C7', color: '#92400E', padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>PENDING (Awaiting CEO)</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              style={{ padding: '10px 20px', background: step === 0 ? '#F1F5F9' : 'white', border: '1px solid #E2E8F0', borderRadius: 8, cursor: step === 0 ? 'not-allowed' : 'pointer', color: step === 0 ? '#CBD5E1' : '#475569', fontWeight: 600, fontSize: 13 }}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                style={{ padding: '10px 24px', background: canNext() ? '#059669' : '#E2E8F0', color: canNext() ? 'white' : '#94A3B8', border: 'none', borderRadius: 8, cursor: canNext() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                Next <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '10px 24px', background: submitting ? '#94A3B8' : '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                {submitting ? 'Submitting...' : <><Send size={14} /> Submit to CEO</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
