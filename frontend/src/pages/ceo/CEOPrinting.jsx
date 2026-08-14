import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const COLORS_ARR = ['#16A34A', '#0284C7', '#D97706', '#7C3AED', '#8BC34A', '#DC2626'];

const CategoryBar = ({ value, max, color }) => (
  <div className="cat-track">
    <div className="cat-fill" style={{ background: color, width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

const GlobalStyles = () => (
  <style>{`
    :root {
      --color-primary: #2563EB;
      --color-bg-page: #F3F4F6;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #4B5563;
      --color-text-muted: #9CA3AF;
      
      --color-success: #16A34A;
      --color-success-bg: #DCFCE7;
      --color-danger: #DC2626;
      --color-danger-bg: #FEE2E2;
      --color-warning: #D97706;
      --color-warning-bg: #FEF3C7;
      --color-info: #0284C7;
      --color-info-bg: #E0F2FE;
      
      /* Base fonts */
      --font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }
    
    @keyframes phFadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Edge Spacing */
    .page-wrapper {
      padding: 10px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 60px);
      background: var(--color-bg-page);
    }

    .so-page {
      background: var(--color-bg-page);
      color: var(--color-text-primary);
      font-family: var(--font-family);
      font-size: 16px;
      line-height: 1.5;
      padding: 24px;
      margin: 0 auto;
      max-width: 1600px;
      box-sizing: border-box;
      border-radius: 12px;
      animation: phFadeUp 0.4s ease both;
    }

    h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 0; }
    
    .so-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); }
    .so-section-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 16px; }
    
    .so-subtitle { font-size: 13px; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }

    /* Buttons */
    .btn {
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
      border: 1px solid transparent;
      transition: all 150ms ease-in-out;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--color-primary); color: #FFF; }
    .btn-primary:hover:not(:disabled) { 
      background: #FFD700; 
      color: #000; 
      border-color: #FFD700; 
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
    }
    
    /* Cards */
    .d-card, .d-card-static {
      position: relative;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      transition: all 150ms ease-in-out;
      cursor: default;
      animation: phFadeUp 0.4s ease both;
    }
    
    .d-card:nth-child(1) { animation-delay: 0.05s; }
    .d-card:nth-child(2) { animation-delay: 0.1s; }
    .d-card:nth-child(3) { animation-delay: 0.15s; }
    .d-card:nth-child(4) { animation-delay: 0.2s; }

    .d-card:hover, .d-card-static:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
      transform: translateY(-1px);
      border-color: #FFD700;
    }

    /* Grid Layouts */
    .so-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .so-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .so-row2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
    .so-row3 { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 24px; }
    
    .cat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-radius: 8px; gap: 16px;
      background: var(--color-bg-card); border: 1px solid var(--color-border);
      margin-bottom: 8px;
      transition: all 150ms ease-in-out;
      cursor: default;
    }
    .cat-row:hover { 
      background: #FFD70015; 
      border-color: #FFD700; 
      transform: translateY(-1px); 
      box-shadow: 0 4px 12px rgba(0,0,0,.08); 
    }

    .qa-card {
      background: var(--color-bg-card); border: 1px solid var(--color-border);
      border-radius: 10px; padding: 16px; text-align: center;
      transition: all 150ms ease-in-out;
    }
    .ph-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }

    /* Tables */
    .table-container { overflow-x: auto; min-width: 100%; border-radius: 8px; border: 1px solid var(--color-border); }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #F9FAFB; padding: 12px 16px; text-transform: uppercase; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); letter-spacing: 0.03em; border-bottom: 1px solid var(--color-border); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); transition: background 150ms ease-in-out; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #F9FAFB; }
    
    @media (max-width: 1024px) {
      .so-kpis { grid-template-columns: repeat(2, 1fr); }
      .so-row2 { grid-template-columns: 1fr; }
      .so-row3 { grid-template-columns: 1fr; }
      .page-wrapper { padding: 6px; }
      .so-page { padding: 16px; }
    }
    @media (max-width: 768px) {
      .page-wrapper { padding: 4px; }
      .so-page { padding: 12px; }
      .so-title { font-size: 24px; }
      .so-header { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 480px) {
      .so-kpis { grid-template-columns: 1fr; }
    }
  `}</style>
);

export default function CEOPrinting({ isApprovalMode = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [oRes, sRes, pRes, statsRes] = await Promise.all([
        apiClient.get('/printing/orders', { params: { limit: 100 } }).catch(() => ({ data: [] })),
        apiClient.get('/printing-assets/store/machines').catch(() => ({ data: [] })),
        apiClient.get('/printing-assets/production/machines').catch(() => ({ data: [] })),
        apiClient.get('/printing-assets/stats').catch(() => ({ data: {} }))
      ]);

      const orders = Array.isArray(oRes) ? oRes : (oRes?.data?.orders || oRes?.data || []);
      const storeM = Array.isArray(sRes) ? sRes : (sRes?.data || []);
      const prodM = Array.isArray(pRes) ? pRes : (pRes?.data || []);
      const stats = statsRes?.data?.data || statsRes?.data || {};

      const allMachines = [...storeM, ...prodM];
      const activeOrders = orders.filter(o => {
        const s = (o.status_name || '').toLowerCase();
        return s.includes('pend') || s.includes('progress') || s.includes('received');
      });
      
      const maintenance = allMachines.filter(m => (m.status || '').toLowerCase() === 'maintenance');

      const fleetStats = {
        total: allMachines.length,
        prod: prodM.length,
        store: storeM.length,
        available: allMachines.filter(m => (m.status || '').toLowerCase() === 'available' || (m.status || '').toLowerCase() === 'active').length,
        inUse: allMachines.filter(m => (m.status || '').toLowerCase() === 'in_use' || (m.status || '').toLowerCase() === 'rented').length,
        maintenance: maintenance.length,
      };

      setData({ fleetStats, activeOrders, maintenance, orders, allMachines, stats });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlobalStyles />
      <SegmentedSpinner size={40} label="Loading printing data..." />
    </div>
  );

  const { fleetStats, activeOrders, maintenance, orders, stats } = data;

  const statuses = ['available', 'inUse', 'maintenance'];
  const statusColors = { 'available': '#16A34A', 'inUse': '#D97706', 'maintenance': '#DC2626' };
  const maxStatusCount = Math.max(...statuses.map(s => fleetStats[s] || 0), 1);
  
  const recentOrders = [...orders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
  const recentActivity = [
      ...recentOrders.map(o => ({ id: `ord-${o.id}`, type: 'Order', title: o.order_number, sub: o.product_type, date: o.created_at })),
      ...maintenance.map(m => ({ id: `mnt-${m.id}`, type: 'Maintenance', title: m.machine_name || m.brand, sub: m.model_number, date: m.updated_at || new Date() }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  if (isApprovalMode) {
    return (
      <div className="page-wrapper">
        <div className="so-page">
          <GlobalStyles />
          {/* Back bar */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/ceo/approvals')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'transparent', border: '1px solid #2563EB',
                color: '#2563EB', padding: '6px 14px', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, borderRadius: 4,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2563EB'; }}
            >
              ← Back to Approvals Hub
            </button>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Administration / Approvals Hub / Printing Approvals</span>
          </div>
          <div className="so-header">
            <div>
              <h1 className="so-title">CEO Printing Approvals</h1>
              <p className="so-subtitle">Review internal printing and publishing requests</p>
            </div>
          </div>
          <div className="d-card-static" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>✅</span>
            <h2 style={{ fontSize: 20, color: 'var(--color-text-primary)' }}>No Pending Printing Approvals</h2>
            <p>All printing requests are currently resolved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="so-page">
        <GlobalStyles />
        
        {/* ── HEADER ── */}
        <div className="so-header">
          <div>
            <h1 className="so-title">Printing Operations Overview</h1>
            <p className="so-subtitle">Executive Production &amp; Fleet Metrics · {timeString}</p>
          </div>
          <div>
            <button onClick={loadData} className="btn btn-primary" disabled={refreshing}>
              {refreshing ? <SegmentedSpinner size={16} /> : <span>↻</span>}
              SYNC DATA
            </button>
          </div>
        </div>

        {/* ── ROW 1: KPI HERO CARDS ── */}
        <div className="so-kpis">
          
          <div className="d-card" style={{ background: 'var(--color-primary)', color: '#FFF' }}>
            <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>Total Machine Fleet</div>
            <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>{fleetStats.total}</div>
            <div style={{ fontSize: 14, opacity: 0.9, fontWeight: 600 }}>Value: ETB {Number(stats.totalMachineValue || 0).toLocaleString()}</div>
          </div>

          <div className="d-card">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Production Machines</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{fleetStats.prod}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Active on floor</div>
          </div>

          <div className="d-card">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Material Inventory</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{stats.totalMaterials || 0} Items</div>
            <div style={{ fontSize: 14, color: 'var(--color-success)', fontWeight: 600 }}>Value: ETB {Number(stats.totalMaterialValue || 0).toLocaleString()}</div>
          </div>

          <div className="d-card">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Active Orders</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: activeOrders.length > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)', marginBottom: 4 }}>{activeOrders.length}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Currently processing</div>
          </div>
        </div>

        {/* ── ROW 2: MOVEMENT BREAKDOWN + ACTIVITY FEED ── */}
        <div className="so-row2">
          
          <div className="d-card-static">
            <h2 className="so-section-title">Machine Status Breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, background: 'var(--color-bg-page)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Available</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>{fleetStats.available}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--color-bg-page)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>In Use</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-warning)' }}>{fleetStats.inUse}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {statuses.map((status, i) => {
              const count = fleetStats[status];
              const c = statusColors[status] || COLORS_ARR[i % COLORS_ARR.length];
              return (
                <div key={status} className="cat-row" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{status.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>{count}</div>
                </div>
              );
            })}
            </div>
          </div>

          <div className="d-card-static">
            <h2 className="so-section-title">Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)' }}>No recent activity.</div>
              ) : recentActivity.map((l) => (
                <div key={l.id} className="cat-row" style={{ cursor: 'default' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>
                      {l.type}: {l.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{l.sub}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {l.date ? new Date(l.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="d-card-static">
          <h2 className="so-section-title">Attention Required</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: `${fleetStats.maintenance} In Maintenance`, sub: 'Machines currently being serviced', icon: '🔧', bg: 'var(--color-warning-bg)', c: 'var(--color-warning)' },
              { label: `${activeOrders.length} Active Orders`, sub: 'Check end dates', icon: '⏱️', bg: 'var(--color-info-bg)', c: 'var(--color-info)' }
            ].map(row => (
              <div key={row.label} className="cat-row" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{row.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{row.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
