import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED',
};
const COLORS_ARR = [G.emerald, G.sky, G.orange, G.purple, G.lime, G.red];

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
    .btn-primary:hover:not(:disabled) { background: #FFD700; color: #000; border-color: #FFD700; }
    
    /* Cards */
    .d-card {
      position: relative;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      transition: all 150ms ease-in-out;
      cursor: pointer;
    }
    .d-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
      transform: translateY(-1px);
      border-color: #FFD700;
    }
    
    .d-card-static {
      position: relative;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }

    /* Grid Layouts */
    .so-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .so-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .so-row2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
    .so-row3 { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 24px; }
    
    .cat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-radius: 8px; cursor: pointer; gap: 16px;
      background: var(--color-bg-card); border: 1px solid var(--color-border);
      margin-bottom: 8px;
      transition: all 150ms ease-in-out;
    }
    .cat-row:hover { background: #FFD70015; border-color: #FFD700; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }

    .qa-card {
      background: var(--color-bg-card); border: 1px solid var(--color-border);
      border-radius: 10px; padding: 16px; text-align: center; cursor: pointer;
      transition: all 150ms ease-in-out;
    }
    .qa-card:hover { border-color: #FFD700; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .ph-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }

    /* Tables */
    .table-container { overflow-x: auto; min-width: 100%; border-radius: 8px; border: 1px solid var(--color-border); }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #F9FAFB; padding: 12px 16px; text-transform: uppercase; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); letter-spacing: 0.03em; border-bottom: 1px solid var(--color-border); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); transition: background 150ms ease-in-out; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #F9FAFB; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    th.num { text-align: right; }
    
    /* Badges */
    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .badge-success { background: var(--color-success-bg); color: var(--color-success); }
    
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

const DecorPlants = () => (
  <>
    <GlobalStyles />
    {[
      { e:'🍃', sz:55, op:0.22, top:'1%',    left:'0.5%'  },
      { e:'🌿', sz:48, op:0.18, top:'0%',    right:'0.5%' },
      { e:'🌾', sz:52, op:0.20, bottom:'1%', left:'0.5%'  },
      { e:'🍃', sz:50, op:0.18, bottom:'0%', right:'0.5%' },
    ].map((p,i) => (
      <span key={i} className="decor-plant" style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}>{p.e}</span>
    ))}
  </>
);

export default function PrintingHome() {
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

  const nav = (path) => navigate(path);

  if (!data) return (
    <div className="ph-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <GlobalStyles />
      <div className="ph-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 'calc(100vh - 64px)' }}>
        <SegmentedSpinner size={48} label="Loading dashboard..." center />
      </div>
    </div>
  );

  const { fleetStats, activeOrders, maintenance, orders, stats } = data;

  // Breakdown by status
  const statuses = ['available', 'inUse', 'maintenance'];
  const statusColors = { 'available': '#16A34A', 'inUse': '#D97706', 'maintenance': '#DC2626' };
  const maxStatusCount = Math.max(...statuses.map(s => fleetStats[s] || 0), 1);
  
  // Recent Activity mock (Orders + Maintenance)
  const recentOrders = [...orders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
  const recentActivity = [
      ...recentOrders.map(o => ({ id: `ord-${o.id}`, type: 'Order', title: o.order_number, sub: o.product_type, date: o.created_at })),
      ...maintenance.map(m => ({ id: `mnt-${m.id}`, type: 'Maintenance', title: m.machine_name || m.brand, sub: m.model_number, date: m.updated_at || new Date() }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div className="page-wrapper">
      <div className="so-page">
        <GlobalStyles />
        
        {/* ── HEADER ── */}
        <div className="so-header">
          <div>
            <h1 className="so-title">Printing Overview</h1>
            <p className="so-subtitle">Production &amp; Fleet Metrics · {timeString}</p>
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
          
          {/* Fleet Value Hero */}
          <div className="d-card" onClick={() => nav('/printing-manager/fleet')} style={{ background: 'var(--color-primary)', color: '#FFF' }}>
            <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>Total Machine Fleet</div>
            <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>{fleetStats.total}</div>
            <div style={{ fontSize: 14, opacity: 0.9, fontWeight: 600 }}>Value: ETB {Number(stats.totalMachineValue || 0).toLocaleString()}</div>
          </div>

          {/* Prod Machines */}
          <div className="d-card" onClick={() => nav('/printing-manager/fleet')}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Production Machines</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{fleetStats.prod}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Active on floor</div>
          </div>

          {/* Store Machines */}
          <div className="d-card" onClick={() => nav('/printing-manager/fleet')}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Material Inventory</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{stats.totalMaterials || 0} Items</div>
            <div style={{ fontSize: 14, color: 'var(--color-success)', fontWeight: 600 }}>Value: ETB {Number(stats.totalMaterialValue || 0).toLocaleString()}</div>
          </div>

          {/* Active Orders */}
          <div className="d-card" onClick={() => nav('/printing-manager/orders')}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Active Orders</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: activeOrders.length > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)', marginBottom: 4 }}>{activeOrders.length}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Currently processing</div>
          </div>
        </div>

        {/* ── ROW 2: MOVEMENT BREAKDOWN + ACTIVITY FEED ── */}
        <div className="so-row2">
          
          {/* Fleet Status Breakdown */}
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

          {/* Recent Activity Feed */}
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

        {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
        <div className="so-row3">
          {/* Alerts */}
          <div className="d-card-static">
            <h2 className="so-section-title">Attention Required</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: `${fleetStats.maintenance} In Maintenance`, sub: 'Machines currently being serviced', icon: '🔧', bg: 'var(--color-warning-bg)', c: 'var(--color-warning)', path: '/printing-manager/fleet' },
                { label: `${activeOrders.length} Active Orders`, sub: 'Check end dates', icon: '⏱️', bg: 'var(--color-info-bg)', c: 'var(--color-info)', path: '/printing-manager/orders' }
              ].map(row => (
                <div key={row.label} className="cat-row" onClick={() => nav(row.path)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{row.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{row.sub}</div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--color-text-muted)' }}>›</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="d-card-static">
            <h2 className="so-section-title">Quick Operations</h2>
            <div className="ph-actions">
              {[
                { label: 'View Fleet',      sub: 'All assets',   icon: '🖨️', href: '/printing-manager/fleet' },
                { label: 'New Order',       sub: 'Create order', icon: '📝', href: '/printing-manager/orders/new' },
                { label: 'Maintenance',     sub: 'Requests',     icon: '🔧', href: '/printing-manager/fleet' },
                { label: 'Material Stock',  sub: 'Refills',      icon: '📦', href: '/printing-manager/materials' },
                { label: 'Tax Receipts',    sub: 'Billing',      icon: '🧾', href: '/printing-manager/tax' },
                { label: 'Reports',         sub: 'Analytics',    icon: '📊', href: '/printing-manager/reports/finance' }
              ].map((a, i) => (
                <div key={a.label} className="qa-card" onClick={() => nav(a.href)}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{a.sub}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
