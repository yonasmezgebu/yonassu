import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const StageConfirmModal = ({ open, title = 'Confirm Action', message, details, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onClose }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, animation: 'stgIn .25s ease both'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.25)',
          padding: 22, fontFamily: "'Inter','Segoe UI',Roboto,sans-serif"
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: danger ? '#FEE2E2' : '#EFF6FF', color: danger ? '#DC2626' : '#2563EB', flexShrink: 0
            }}>
              <AlertTriangle size={18} />
            </span>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', padding: 4 }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, color: '#374151' }}>{message}</p>

        {details && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: 13, color: '#334155' }}>
            {details}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff',
              color: '#374151', fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              height: 36, padding: '0 18px', borderRadius: 8, border: 'none',
              background: danger ? '#DC2626' : '#2563EB', color: '#fff', fontWeight: 600, fontSize: 13,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, fontFamily: 'inherit'
            }}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageConfirmModal;