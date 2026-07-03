import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Package, AlertTriangle, Truck, Clock, ArrowRight, DollarSign, Users, Activity, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PharmacyOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const NOTIFICATIONS = [
    { label: 'Pending Transfers', count: 3, color: '#3b82f6', bg: '#eff6ff', path: '/pharmacy/stock-transfer' },
    { label: 'Low Stock Items', count: 12, color: '#f59e0b', bg: '#fffbeb', path: '/pharmacy/inventory' },
    { label: 'Expiring Soon', count: 5, color: '#ef4444', bg: '#fef2f2', path: '/pharmacy/expiry-management' },
    { label: 'Pending Shipments', count: 2, color: '#10b981', bg: '#dcfce7', path: '/pharmacy/goods-receiving' },
  ];

  const QUICK_ACCESS = [
    { label: 'Drug Catalog', desc: 'View all 1,200+ medicines', icon: <Package size={20}/>, path: '/pharmacy/medicines', color: '#8b5cf6' },
    { label: 'Stock Transfer', desc: 'Transfer drugs between branches', icon: <ArrowRight size={20}/>, path: '/pharmacy/stock-transfer', color: '#06b6d4' },
    { label: 'Issue Medicines', desc: 'Walk-in & Online Orders (M22)', icon: <Truck size={20}/>, path: '/pharmacy/issue-medicines', color: '#10b981' },
    { label: 'Expiry Check', desc: 'Monitor expiring batches', icon: <Clock size={20}/>, path: '/pharmacy/expiry-management', color: '#ef4444' },
  ];

  const SALES_AND_OPS_LINKS = [
    { label: '1. Sales List', path: '/pharmacy/sales-list', icon: <DollarSign size={18}/> },
    { label: '2. POS', path: '/pharmacy/pos', icon: <DollarSign size={18}/> },
    { label: '3. Sales History', path: '/pharmacy/sales-history', icon: <Clock size={18}/> },
    { label: '4. Sales Return', path: '/pharmacy/sales-return', icon: <ArrowRight size={18}/> },
    { label: '5. Staff Mgmt', path: '/pharmacy/staff', icon: <Users size={18}/> },
    { label: '6. Staff List', path: '/pharmacy/staff-list', icon: <Users size={18}/> },
    { label: '7. Assign Tasks', path: '/pharmacy/assign-tasks', icon: <ShieldCheck size={18}/> },
    { label: '8. Attendance', path: '/pharmacy/attendance', icon: <Clock size={18}/> },
    { label: '9. Reports Hub', path: '/pharmacy/reports-hub', icon: <BarChart2 size={18}/> },
    { label: '10. Inventory Report', path: '/pharmacy/inventory-report', icon: <Package size={18}/> },
    { label: '11. Sales Report', path: '/pharmacy/sales-report', icon: <DollarSign size={18}/> },
    { label: '12. Expiry Report', path: '/pharmacy/expiry-report', icon: <AlertTriangle size={18}/> },
    { label: '13. Stock Movement', path: '/pharmacy/stock-movement', icon: <Activity size={18}/> },
    { label: '14. Daily Summary', path: '/pharmacy/daily-summary', icon: <BarChart2 size={18}/> },
  ];

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
            💊 PHARMACY MANAGER DASHBOARD
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>
            👤 Welcome, <strong style={{ color: '#1e293b' }}>{user?.name || 'Pharmacy Manager'}</strong> • {time.toLocaleDateString()} {time.toLocaleTimeString()}
          </p>
        </div>
        
        {/* Stamp Access Block */}
        <div style={{ background: 'white', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ background: '#dcfce7', padding: 8, borderRadius: 8 }}>
            <ShieldCheck size={24} color="#166534" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Digital Stamp Status</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#166534' }}>ACTIVE (Level: Manager)</div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION BADGES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {NOTIFICATIONS.map((n, i) => (
          <div key={i} onClick={() => navigate(n.path)}
            style={{ background: 'white', borderRadius: 12, padding: 20, border: `1px solid ${n.color}30`, borderBottom: `4px solid ${n.color}`, cursor: 'pointer', transition: 'transform 0.15s', ':hover': { transform: 'translateY(-2px)' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{n.label}</span>
              <div style={{ background: n.bg, color: n.color, padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 800 }}>LIVE</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#1e293b' }}>{n.count}</div>
          </div>
        ))}
      </div>

      {/* QUICK ACCESS GRID */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#1e293b' }}>⚡ Inventory Quick Access</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {QUICK_ACCESS.map((q, i) => (
          <div key={i} onClick={() => navigate(q.path)}
            style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ background: `${q.color}15`, color: q.color, padding: 12, borderRadius: 10 }}>
              {q.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{q.label}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{q.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SALES & OPS LINKS */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#1e293b' }}>📈 Sales & Operations Links</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {SALES_AND_OPS_LINKS.map((link, i) => (
          <div key={i} onClick={() => navigate(link.path)}
            style={{ background: 'white', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
            <div style={{ color: '#0284c7' }}>{link.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#334155' }}>{link.label}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PharmacyOverview;
