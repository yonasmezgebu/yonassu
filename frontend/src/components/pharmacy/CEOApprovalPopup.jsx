import React, { useState } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.6)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const dialogStyle = {
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  width: '100%',
  maxWidth: 520,
  maxHeight: '85vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', sans-serif",
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 24px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  fontWeight: 700,
  fontSize: '1rem',
  color: '#1e293b',
};

const bodyStyle = {
  padding: 24,
  overflowY: 'auto',
  flex: 1,
};

const closeBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#64748b',
  padding: 4,
  borderRadius: 6,
};

const labelStyle = {
  fontWeight: 600,
  fontSize: '0.875rem',
  color: '#475569',
  marginBottom: 6,
  display: 'block',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 80,
  resize: 'vertical',
};

const checkboxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 0',
  fontSize: '0.95rem',
  color: '#1e293b',
  cursor: 'pointer',
};

const btnPrimaryStyle = {
  padding: '12px 24px',
  background: '#224f94',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
};

const btnCancelStyle = {
  ...btnPrimaryStyle,
  background: '#f1f5f9',
  color: '#475569',
};

const successStyle = {
  textAlign: 'center',
  padding: '24px 0',
};

const CEOApprovalPopup = ({ drugName, currentValue, requestType, onClose, onSubmit }) => {
  const [step, setStep] = useState('checklist');
  const [checkedItems, setCheckedItems] = useState({ quantity: false, price: false });
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCheckToggle = (key) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProceed = () => {
    if (!checkedItems.quantity && !checkedItems.price) return;
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!requestedValue || !reason) return;
    setSubmitting(true);
    try {
      await pharmacyService.createManagerRequest({
        drug_name: drugName,
        request_type: requestType || (checkedItems.quantity ? 'QUANTITY' : 'PRICE'),
        current_value: currentValue,
        requested_value: parseFloat(requestedValue),
        reason,
      });
      setSuccess(true);
      if (onSubmit) onSubmit();
    } catch (err) {
      alert('Failed to send request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span>🔐 CONFIRMATION POPUP</span>
          <button style={closeBtnStyle} onClick={onClose}><X size={20} /></button>
        </div>
        <div style={bodyStyle}>
          {success ? (
            <div style={successStyle}>
              <CheckCircle size={48} color="#10b981" />
              <h3 style={{ margin: '16px 0 8px', color: '#059669' }}>Request Sent Successfully!</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Your request has been submitted for CEO approval.
              </p>
              <button style={{ ...btnPrimaryStyle, marginTop: 24, width: 'auto', display: 'inline-flex' }} onClick={onClose}>
                Close
              </button>
            </div>
          ) : step === 'checklist' ? (
            <>
              <p style={{ color: '#475569', marginBottom: 16, fontSize: '0.95rem' }}>
                You are about to update:
              </p>
              <div style={checkboxStyle}>
                <input
                  type="checkbox"
                  checked={checkedItems.quantity}
                  onChange={() => handleCheckToggle('quantity')}
                  style={{ width: 18, height: 18 }}
                />
                <span>DRUG QUANTITY</span>
              </div>
              <div style={checkboxStyle}>
                <input
                  type="checkbox"
                  checked={checkedItems.price}
                  onChange={() => handleCheckToggle('price')}
                  style={{ width: 18, height: 18 }}
                />
                <span>DRUG PRICE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginTop: 16 }}>
                <AlertTriangle size={20} color="#b45309" />
                <span style={{ fontSize: '0.85rem', color: '#92400e' }}>This requires CEO approval</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button style={btnCancelStyle} onClick={onClose}>CANCEL</button>
                <button
                  style={{ ...btnPrimaryStyle, opacity: checkedItems.quantity || checkedItems.price ? 1 : 0.5 }}
                  disabled={!checkedItems.quantity && !checkedItems.price}
                  onClick={handleProceed}
                >
                  SEND REQUEST TO CEO
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: '#475569', marginBottom: 16, fontSize: '0.95rem' }}>
                Complete the details below to send your request to the CEO.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Drug Name</label>
                <input style={inputStyle} value={drugName} disabled />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Current Value</label>
                <input style={inputStyle} value={currentValue} disabled />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Requested Value *</label>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.01"
                  value={requestedValue}
                  onChange={e => setRequestedValue(e.target.value)}
                  placeholder="Enter your requested value"
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Reason *</label>
                <textarea
                  style={textareaStyle}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why this change is needed..."
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={btnCancelStyle} onClick={() => setStep('checklist')}>BACK</button>
                <button
                  style={{ ...btnPrimaryStyle, opacity: requestedValue && reason ? 1 : 0.5 }}
                  disabled={!requestedValue || !reason || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : 'SEND REQUEST TO CEO'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {submitting && (
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      )}
    </div>
  );
};

export default CEOApprovalPopup;
