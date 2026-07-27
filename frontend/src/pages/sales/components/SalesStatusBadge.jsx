import React from 'react';

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
    case 'approved':
    case 'accepted':
    case 'refunded':
      return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
    case 'pending':
    case 'processing':
    case 'unpaid':
    case 'requested':
    case 'sent':
      return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
    case 'cancelled':
    case 'rejected':
    case 'overdue':
    case 'expired':
      return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
    case 'draft':
      return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    default:
      return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  }
};

const SalesStatusBadge = ({ status }) => {
  if (!status) return null;
  const { bg, text, border } = getStatusColor(status);
  
  return (
    <span style={{
      backgroundColor: bg,
      color: text,
      border: `1px solid ${border}`,
      padding: '2px 8px',
      borderRadius: 0,
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'capitalize',
      display: 'inline-flex',
      alignItems: 'center',
      whiteSpace: 'nowrap'
    }}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default SalesStatusBadge;
