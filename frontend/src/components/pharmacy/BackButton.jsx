import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ to, label = 'Back to Dashboard' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to || '/pharmacy/overview')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', color: '#2563eb',
        cursor: 'pointer', fontSize: 14, fontWeight: 600,
        padding: '8px 0', marginBottom: 8,
      }}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
