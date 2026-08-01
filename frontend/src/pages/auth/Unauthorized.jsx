import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
const Unauthorized = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const getDashboardPath = () => {
    if (!user?.roles) return '/';
    const userRoles = user.roles.map(r => r.toLowerCase());
    if (userRoles.includes('admin')) return '/admin';
    if (userRoles.includes('ceo')) return '/ceo';
    if (userRoles.includes('finance manager') || userRoles.includes('finance')) return '/finance';
    if (userRoles.includes('purchase')) return '/purchase';
    if (userRoles.includes('pharmacy store keeper')) return '/pharmacy-store';
    if (userRoles.includes('general store keeper')) return '/general-store';
    if (userRoles.includes('sales/cashier')) return '/pharmacy-worker';
    if (userRoles.includes('printing supervisor')) return '/printing-manager';
    if (userRoles.includes('printing manager')) return '/printing-manager';
    if (userRoles.includes('pharmacy manager')) return '/pharmacy';
    if (userRoles.includes('pharmacy worker')) return '/pharmacy-worker';
    if (userRoles.includes('car renting manager')) return '/car-renting';
    if (userRoles.includes('sales manager')) return '/sales/overview';
    if (userRoles.includes('hr manager')) return '/hr';
    if (userRoles.includes('board member')) return '/board';
    if (userRoles.includes('employee')) return '/employee';
    if (userRoles.includes('customer')) return '/customer';
    return '/';
  };
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'Inter, sans-serif',
      background: 'linear-gradient(135deg, #1E3A5F 0%, #10B981 100%)',
      color: 'white', padding: 24, textAlign: 'center'
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Access Denied</h1>
      <p style={{ fontSize: 15, opacity: 0.85, margin: '0 0 32px', maxWidth: 400, lineHeight: 1.6 }}>
        You don't have permission to access this page. Contact your administrator if you believe this is a mistake.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate(getDashboardPath())}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'white', color: '#1E3A5F', fontWeight: 600,
            fontSize: 14, cursor: 'pointer'
          }}>
          Go to My Dashboard
        </button>
        <button onClick={() => { authService.logout(); }}
          style={{
            padding: '10px 24px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)',
            background: 'transparent', color: 'white', fontWeight: 600,
            fontSize: 14, cursor: 'pointer'
          }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};
export default Unauthorized;
