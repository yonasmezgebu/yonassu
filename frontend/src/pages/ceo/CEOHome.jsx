import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Package, AlertTriangle, Users, Briefcase, Bell, Calendar, Clock, DollarSign, ArrowRight } from 'lucide-react';

const CEOHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const summaryMetrics = [
    { label: 'Total Revenue Today', value: '$4,250', icon: <DollarSign size={20} color="#10b981" />, bg: '#dcfce7' },
    { label: 'Total Revenue This Month', value: '$124,500', icon: <TrendingUp size={20} color="#3b82f6" />, bg: '#dbeafe' },
    { label: 'Total Revenue This Year', value: '$1,450,000', icon: <TrendingUp size={20} color="#6366f1" />, bg: '#e0e7ff' },
    { label: 'Total Stock Value', value: '$850,000', icon: <Package size={20} color="#f59e0b" />, bg: '#fef3c7' },
    { label: 'Pending Approvals', value: '12', icon: <Clock size={20} color="#ef4444" />, bg: '#fee2e2' },
    { label: 'Low Stock Alerts', value: '8', icon: <AlertTriangle size={20} color="#f97316" />, bg: '#ffedd5' },
    { label: 'Expiry Alerts', value: '3', icon: <AlertTriangle size={20} color="#ec4899" />, bg: '#fce7f3' },
    { label: 'Total Employees', value: '14', icon: <Users size={20} color="#8b5cf6" />, bg: '#ede9fe' },
    { label: 'Total Departments', value: '10', icon: <Briefcase size={20} color="#64748b" />, bg: '#f1f5f9' },
  ];

  const notificationBadges = [
    { label: '🔴 Pending CEO Approvals', count: 5, path: '/ceo/manager-requests' },
    { label: '🟡 New Pharmacy Requests', count: 3, path: '/ceo/pharmacy' },
    { label: '🟢 Tender Bids Ready for Review', count: 2, path: '/ceo/tender-bids' },
    { label: '🔵 Fund Requests Awaiting Decision', count: 1, path: '/ceo/fund-approvals' },
    { label: '🟣 Direct Delivery Confirmations', count: 1, path: '/ceo/direct-delivery' },
  ];

  const QUICK_ACCESS = [
    { id: 1, name: 'Sales', type: 'Management', model: 'CRV + Sales Report', path: '/ceo/sales' },
    { id: 2, name: 'Purchase', type: 'Management', model: 'PV + PO', path: '/ceo/purchase' },
    { id: 3, name: 'Inventory', type: 'View', model: 'M19 + M22', path: '/ceo/inventory' },
    { id: 4, name: 'Finance', type: 'Management', model: 'CRV + PV + PCV', path: '/ceo/finance' },
    { id: 5, name: 'HR', type: 'Management', model: 'Employee Records', path: '/ceo/hr' },
    { id: 6, name: 'Pharmacy (M20–M22)', type: 'Management', model: 'M20 + M21 + M22', path: '/ceo/pharmacy' },
    { id: 7, name: 'Drug Procurement (PR)', type: 'Management', model: 'M20 + Tender', path: '/ceo/procurement' },
    { id: 8, name: 'New Drug Requests', type: 'Management', model: 'M20', path: '/ceo/new-drugs' },
    { id: 9, name: 'Confirm Direct Delivery', type: 'Management', model: 'M19', path: '/ceo/direct-delivery' },
    { id: 10, name: 'Pharmacy Manager Requests', type: 'Management', model: 'M20 + M21 + M22', path: '/ceo/manager-requests' },
    { id: 11, name: 'Tender Bids (M7)', type: 'Management', model: 'M7', path: '/ceo/tender-bids' },
    { id: 12, name: 'Fund Approvals (M9)', type: 'Management', model: 'M9', path: '/ceo/fund-approvals' },
    { id: 13, name: 'Printing', type: 'Management', model: 'Orders', path: '/ceo/printing' },
    { id: 14, name: 'Car Rental', type: 'Management', model: 'Bookings', path: '/ceo/car-rental' },
    { id: 15, name: 'Tender', type: 'Management', model: 'M7', path: '/ceo/tender-full' },
  ];

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
            🏛️ CEO DASHBOARD - SUTANA BUSINESS
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: 16 }}>
            👤 Welcome, <strong style={{ color: '#0f172a' }}>{user?.name || 'CEO SUTANA'}</strong> • 📅 {time.toLocaleDateString()} {time.toLocaleTimeString()}
          </p>
          <div style={{ marginTop: 12, display: 'inline-block', background: '#e2e8f0', color: '#1e293b', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' }}>
            📊 Full Business Overview
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 24 }}>
        📌 ALL 15 BUSINESS MENUS
      </h2>

      {/* SUMMARY BLOCK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {summaryMetrics.map((m, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: m.bg, padding: 12, borderRadius: 8 }}>
              {m.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* NOTIFICATION BADGES */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 16 }}>🔔 Real-Time Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notificationBadges.map((badge, i) => (
              <div key={i} onClick={() => navigate(badge.path)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{badge.label}</span>
                <span style={{ background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 14, fontWeight: 'bold' }}>{badge.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STAMP ACCESS BLOCK */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 16 }}>🔐 Digital Stamp Access</h3>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#22c55e', padding: 8, borderRadius: '50%' }}><ShieldCheck color="white" size={24}/></div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#166534' }}>FULL ACCESS</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#15803d', fontSize: 14, lineHeight: '2' }}>
              <li>✅ CEO has FULL stamp permission</li>
              <li>✅ Can approve/reject ALL requests</li>
              <li>✅ Can approve/reject ALL fund requests</li>
              <li>✅ Can approve/reject ALL tender bids</li>
              <li>✅ Can confirm direct deliveries</li>
            </ul>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS TABLE */}
      <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 16 }}>🚀 Quick Access Summary</h3>
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#475569' }}>#</th>
              <th style={{ padding: '12px 16px', color: '#475569' }}>Menu Item</th>
              <th style={{ padding: '12px 16px', color: '#475569' }}>Type</th>
              <th style={{ padding: '12px 16px', color: '#475569' }}>Model</th>
              <th style={{ padding: '12px 16px', color: '#475569' }}>Status</th>
              <th style={{ padding: '12px 16px', color: '#475569' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {QUICK_ACCESS.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{row.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>{row.name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{row.type}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{row.model}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>Active</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => navigate(row.path)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', color: '#334155' }}>
                    Open <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default CEOHome;
