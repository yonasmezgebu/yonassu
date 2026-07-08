import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, ClipboardCheck, Send, ArrowRight } from 'lucide-react';

const cards = [
  { label: 'Goods Receiving',   path: '/pharmacy/goods-receiving',   icon: Truck,          desc: 'Receive goods against purchase orders', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Pending Shipments', path: '/pharmacy/pending-shipments', icon: Send,           desc: 'View and manage pending shipments',     color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Receive Shipment',  path: '/pharmacy/receive-shipment',  icon: ClipboardCheck, desc: 'Confirm and receive drug shipments',    color: '#059669', bg: '#ecfdf5' },
  { label: 'Direct Delivery',   path: '/pharmacy/direct-delivery',   icon: Package,        desc: 'Record direct deliveries',              color: '#8b5cf6', bg: '#f5f3ff' },
];

const ReceivingHub = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 28, fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc 0%,#f0fdf4 100%)' }}>
      <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ marginBottom: 28, animation: 'fadeSlide 0.4s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
            <Truck size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Receiving</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Manage goods receiving, shipments, and deliveries</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, animation: 'fadeSlide 0.5s ease-out' }}>
        {cards.map(c => (
          <div key={c.path} onClick={() => navigate(c.path)}
            style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = c.color; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <c.icon size={24} color={c.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{c.desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: c.color, fontWeight: 600, fontSize: 13, marginTop: 'auto' }}>
              Open <ArrowRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceivingHub;
