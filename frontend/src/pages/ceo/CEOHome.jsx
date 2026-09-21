import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

/* ─── Global Styles (Enterprise UI System) ──────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    :root {
      --color-primary: #2563EB;
      --color-primary-hover: #1D4ED8;
      --color-bg-page: #F5F6FA;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF;
      --color-success: #16A34A;
      --color-success-bg: #DCFCE7;
      --color-danger: #DC2626;
      --color-danger-bg: #FEE2E2;
      --color-warning: #D97706;
      --color-warning-bg: #FEF3C7;
      --color-info: #0284C7;
      --color-info-bg: #E0F2FE;
      --font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }

    .ceo-dashboard-wrapper {
      padding: 24px;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      color: var(--color-text-primary);
    }
    
    .ceo-dashboard-container {
      max-width: 1536px;
      margin: 0 auto;
    }

    .ceo-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 150ms ease-in-out;
    }
    .ceo-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }
    .ceo-card.clickable {
      cursor: pointer;
    }

    .ceo-btn {
      border-radius: 8px;
      height: 36px;
      padding: 0 16px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      transition: all 150ms ease-in-out;
    }
    .ceo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ceo-btn:hover:not(:disabled) {
      background: #FFD700;
      color: #000;
      border-color: #FFD700;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255,215,0,0.3);
    }
    .ceo-btn-primary {
      background: var(--color-primary);
      color: #FFFFFF;
      border-color: var(--color-primary);
    }

    .ceo-page-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: var(--color-text-primary);
    }
    .ceo-section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: var(--color-text-primary);
    }
    .ceo-label-header {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .ceo-body-text {
      font-size: 16px;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .ceo-grid-kpi {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .ceo-grid-main {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .ceo-list-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      transition: all 150ms ease-in-out;
      cursor: pointer;
      border-radius: 8px;
    }
    .ceo-list-row:last-child {
      border-bottom: none;
    }
    .ceo-list-row:hover {
      background: var(--color-bg-page);
    }
    
    .ceo-badge {
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }

    @media (max-width: 1024px) {
      .ceo-dashboard-wrapper { padding: 16px; }
      .ceo-grid-main { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .ceo-dashboard-wrapper { padding: 12px; }
      .ceo-grid-kpi { grid-template-columns: 1fr; }
      .ceo-list-row { flex-direction: column; align-items: flex-start; gap: 8px; }
      .ceo-badge { align-self: flex-start; }
    }
  `}</style>
);

const mockBarData = [
  { name: 'Sales', value: 85 },
  { name: 'Purchases', value: 42 },
  { name: 'Finance', value: 100 },
  { name: 'HR', value: 95 },
  { name: 'Inventory', value: 65 }
];

const mockPieData = [
  { name: 'Active', value: 75, color: '#16A34A' },
  { name: 'Pending', value: 15, color: '#D97706' },
  { name: 'Issues', value: 10, color: '#DC2626' }
];

const CEOHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    // Real API integration would go here. For now it's live-ready.
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => { navigate(path); };
  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Executive';

  return (
    <div className="ceo-dashboard-wrapper">
      <GlobalStyles />
      <div className="ceo-dashboard-container">
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="ceo-page-title">Command Center</h1>
            <p className="ceo-body-text" style={{ margin: 0 }}>Welcome back, {firstName} · {timeString}</p>
          </div>
          <button onClick={load} className="ceo-btn ceo-btn-primary" disabled={refreshing}>
            {refreshing ? <SegmentedSpinner size={16} color="#FFF" /> : <span style={{ fontSize: 16 }}>↻</span>}
            <span>Sync Dashboard</span>
          </button>
        </div>

        {/* 1. NUMBER REPRESENTATION (KPI HERO CARDS) */}
        <div className="ceo-grid-kpi">
          <div className="ceo-card clickable" onClick={() => nav('/ceo/reports')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="ceo-label-header">System Access</span>
              <div style={{ background: 'var(--color-success-bg)', borderRadius: 8, padding: 6, color: 'var(--color-success)' }}>
                <span style={{ fontSize: 18 }}>🛡️</span>
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 8 }}>Full</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Executive overview active</div>
          </div>

          <div className="ceo-card clickable" onClick={() => nav('/ceo/approvals')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="ceo-label-header">Pending Approvals</span>
              <div style={{ background: 'var(--color-warning-bg)', borderRadius: 8, padding: 6, color: 'var(--color-warning)' }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 8 }}>12</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Awaiting review</div>
          </div>

          <div className="ceo-card clickable" onClick={() => nav('/ceo/finance')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="ceo-label-header">Finance Health</span>
              <div style={{ background: 'var(--color-info-bg)', borderRadius: 8, padding: 6, color: 'var(--color-info)' }}>
                <span style={{ fontSize: 18 }}>💰</span>
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 8 }}>Stable</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Live financial summary</div>
          </div>

          <div className="ceo-card clickable" onClick={() => nav('/ceo/hr')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="ceo-label-header">Workforce</span>
              <div style={{ background: 'var(--color-success-bg)', borderRadius: 8, padding: 6, color: 'var(--color-success)' }}>
                <span style={{ fontSize: 18 }}>👥</span>
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 8 }}>98%</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Attendance rate today</div>
          </div>
        </div>

        {/* GRAPHS AND CHARTS */}
        <div className="ceo-grid-main">
          {/* 2. GRAPH REPRESENTATION (Bar Chart) */}
          <div className="ceo-card">
            <h2 className="ceo-section-title">Module Activity Level</h2>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#F5F6FA' }}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. CHART REPRESENTATION (Donut Chart) */}
          <div className="ceo-card">
            <h2 className="ceo-section-title">System Status Overview</h2>
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={mockPieData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                    {mockPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                {mockPieData.map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }} />
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS & ALERTS */}
        <div className="ceo-grid-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
          
          {/* Quick Operations */}
          <div className="ceo-card">
            <h2 className="ceo-section-title">Quick Operations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Sales Module',      path: '/ceo/sales' },
                { label: 'Purchase Module',   path: '/ceo/purchase' },
                { label: 'Finance Module',    path: '/ceo/finance' },
                { label: 'HR Module',         path: '/ceo/hr' },
                { label: 'Printing Module',   path: '/ceo/printing' },
                { label: 'Car Rental Module', path: '/ceo/agri-and-car-rental' },
                { label: 'Tenders Module',    path: '/ceo/tenders' },
                { label: 'Executive Reports', path: '/ceo/reports' }
              ].map(action => (
                <button key={action.label} className="ceo-btn" onClick={() => nav(action.path)} style={{ width: '100%', justifyContent: 'flex-start' }}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>


        </div>

      </div>
    </div>
  );
};

export default CEOHome;
