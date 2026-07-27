import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: 0, width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {type === 'danger' && <AlertTriangle color="#ef4444" size={24} />}
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
        </div>
        <div style={{ padding: '16px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderRadius: 0, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white',
            color: '#374151', borderRadius: 0, fontWeight: '500', cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{
            padding: '8px 16px', border: 'none', backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
            color: 'white', borderRadius: 0, fontWeight: '500', cursor: 'pointer'
          }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
