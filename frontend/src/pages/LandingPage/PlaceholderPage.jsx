import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = () => {
  const navigate = useNavigate();
  return (
    <div className="public-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, color: '#1a2b4b', marginBottom: 12 }}>Coming Soon</h1>
      <p style={{ color: '#6B7280', fontSize: 16, marginBottom: 24 }}>This page is under construction.</p>
      <button onClick={() => navigate('/')} style={{ padding: '12px 28px', border: 'none', borderRadius: 12, background: '#1a2b4b', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Back to Home</button>
    </div>
  );
};

export default PlaceholderPage;
