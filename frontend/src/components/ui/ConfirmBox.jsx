import React from 'react';
import Modal from './Modal';

const ConfirmBox = ({ open, title = 'Confirm', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', busy = false, onConfirm, onClose }) => {
  if (!open) return null;
  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="sm">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
              background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer'
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1
            }}
          >
            {busy ? `${confirmLabel}...` : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmBox;