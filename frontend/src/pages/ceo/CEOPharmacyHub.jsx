import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Clipboard, Truck } from 'lucide-react';

const pharmacyLinks = [
  {
    label: 'Pharmacy Sales / Finance',
    description: 'View and manage pharmacy sales and finance controls.',
    icon: DollarSign,
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
    path: '/ceo/pharmacy-finance',
  },
  {
    label: 'Procurement & New Drugs',
    description: 'Oversee procurement decisions and new drug approvals.',
    icon: Clipboard,
    color: '#06b6d4',
    bg: '#ecfeff',
    border: '#a5f3fc',
    path: '/ceo/procurement-decisions',
  },
  {
    label: 'Direct Delivery',
    description: 'Manage and track direct delivery operations.',
    icon: Truck,
    color: '#14b8a6',
    bg: '#f0fdfa',
    border: '#99f6e4',
    path: '/ceo/direct-delivery',
  },
];

const CEOPharmacyHub = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
          💊 Pharmacy
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
          Select a section to manage pharmacy operations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {pharmacyLinks.map(({ label, description, icon: Icon, color, bg, border, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '16px',
              backgroundColor: 'white',
              border: `1px solid ${border}`,
              borderRadius: '16px',
              padding: '28px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
            }}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={26} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                {label}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                {description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CEOPharmacyHub;
