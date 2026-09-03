import React from 'react';
import { getStatusStyle, STATUS_LABELS } from './printingStageConfig';

export const StatusBadge = ({ code, name }) => {
  const st = getStatusStyle(code);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
      borderRadius: 20, background: st.bg, color: st.color, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap'
    }}>
      {STATUS_LABELS[code] || name || code}
    </span>
  );
};

export const PaymentBadge = ({ order }) => {
  const ps = order?.payment_status;
  if (ps === 'Confirmed') return <span style={{ display: 'inline-flex', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#14532d', fontWeight: 700, fontSize: 12 }}>✅ Confirmed</span>;
  if (ps === 'Rejected') return <span style={{ display: 'inline-flex', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#fee2e2', color: '#7f1d1d', fontWeight: 700, fontSize: 12 }}>❌ Rejected</span>;
  return <span style={{ display: 'inline-flex', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#fffbeb', color: '#92400e', fontWeight: 700, fontSize: 12 }}>⏳ Pending</span>;
};

export const DueCell = ({ due_date }) => {
  if (!due_date) return '—';
  const ms = new Date(due_date) - new Date();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return (
    <span style={{ color: days < 0 ? '#dc2626' : days === 0 ? '#d97706' : '#16a34a', fontWeight: 700, fontSize: 12 }}>
      {days < 0 ? `Overdue (${Math.abs(days)}d)` : days === 0 ? 'Due Today' : `${days}d`}
    </span>
  );
};