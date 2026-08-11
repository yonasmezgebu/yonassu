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

const CategoryBar = ({ value, max, color }) => (
  <div className="cat-track">
    <div className="cat-fill" style={{ background: color, width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);

/* ─── Global Design System (CSS-only, scoped to this page) ─────────────── */
const GlobalStyles = () => (
  <style>{`
    @keyframes phFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .ph-root {
      --primary:#2563EB; --primary-hover:#1D4ED8; --primary-tint:#EFF6FF;
      --bg-page:#F5F6FA; --bg-card:#FFFFFF; --border:#E5E7EB;
      --text-1:#111827; --text-2:#6B7280; --text-3:#9CA3AF;
      --success:#16A34A; --success-bg:#DCFCE7;
      --danger:#DC2626; --danger-bg:#FEE2E2;
      --warning:#D97706; --warning-bg:#FEF3C7;
      --info:#0284C7; --info-bg:#E0F2FE;
      --gold:#EAB308; --gold-wipe:rgba(234,179,8,.5); --gold-bg:#FEF3C7;
      --radius:10px; --radius-sm:8px;
      --shadow:0 1px 3px rgba(0,0,0,.06);
      --shadow-hover:0 4px 12px rgba(0,0,0,.08);
      font-family:'Inter','Segoe UI',Roboto,-apple-system,sans-serif;
      font-size:14px; line-height:1.5; color:var(--text-1);
      background:var(--bg-page);
      padding:12px; overflow-x:hidden;
    }

    /* ── Typography (rule 2) ── */
    .artistic-3d-title { font-size:clamp(22px,2.2vw,26px); font-weight:600; color:var(--text-1); letter-spacing:-0.01em; line-height:1.3; margin:0; display:flex; align-items:center; gap:8px; }
    .artistic-3d-subtitle { font-size:12px; font-weight:600; color:var(--text-2); text-transform:uppercase; letter-spacing:0.03em; margin:0; text-align:center; }
    .blink-star { display:inline-block; font-size:20px; animation:none !important; }

    /* ── Page header (full-bleed, rule 24) ── */
    .ph-header { display:grid; grid-template-columns:1fr auto; align-items:center; gap:12px; margin:0 0 16px; }
    .ph-header-start { grid-column:1; grid-row:1; justify-self:start; }
    .ph-header-end { grid-column:2; grid-row:1; justify-self:end; }
    .ph-header-center { grid-column:1/-1; grid-row:2; justify-self:center; margin-top:2px; }

    /* ── Buttons (rules 3 + 7): hover spreads from a point across the whole button ── */
    .btn-sync { position:relative; overflow:hidden; display:inline-flex; align-items:center; justify-content:center; gap:8px; height:44px; padding:0 20px; border:none; border-radius:var(--radius-sm); background:var(--primary); color:#fff; font-family:inherit; font-size:14px; font-weight:500; letter-spacing:0.03em; cursor:pointer; box-shadow:var(--shadow); transition:box-shadow 150ms ease, transform 150ms ease; z-index:1; }
    .btn-sync::before { content:''; position:absolute; top:0; left:0; width:100%; height:100%; background:var(--gold); border-radius:inherit; transform:scale(0); transform-origin:top left; transition:transform 300ms cubic-bezier(.4,0,.2,1); z-index:0; }
    .btn-sync:hover::before { transform:scale(1); }
    .btn-sync:hover { box-shadow:var(--shadow-hover); }
    .btn-sync:active { transform:scale(0.97); }
    .btn-sync:disabled { opacity:.5; cursor:default; box-shadow:none; }
    .btn-sync > * { position:relative; z-index:1; }

    /* ── Cards (rule 6) ── */
    .d-card, .d-card-no-hover { position:relative; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px 24px; box-shadow:var(--shadow); transition:box-shadow 150ms ease, transform 150ms ease; animation:phFadeUp .4s ease both; cursor:pointer; overflow:hidden; }
    .d-card:hover, .d-card-no-hover:hover { box-shadow:var(--shadow-hover); transform:translateY(-1px); }
    .d-card::before, .d-card-no-hover::before { content:''; position:absolute; top:0; left:0; width:100%; height:3px; background:var(--gold); transform:scaleX(0); transform-origin:left; transition:transform 200ms ease; }
    .d-card:hover::before, .d-card-no-hover:hover::before { transform:scaleX(1); }

    /* Hero card */
    .ph-hero { background:var(--primary); border-color:var(--primary); color:#fff; }
    .ph-hero::before { display:none; }
    .ph-hero:hover { background:var(--gold); border-color:var(--gold); box-shadow:0 4px 12px rgba(234,179,8,.3); }
    .ph-hero-decor { position:absolute; right:-24px; top:-24px; width:150px; height:150px; border-radius:50%; background:rgba(255,255,255,.08); }
    .ph-hero-icon { position:absolute; right:16px; top:16px; width:44px; height:44px; border-radius:var(--radius-sm); background:rgba(255,255,255,.16); display:flex; align-items:center; justify-content:center; font-size:22px; }
    .ph-hero-label { color:rgba(255,255,255,.8); margin-bottom:10px; }
    .ph-hero-value { color:#fff; font-size:2.25rem; font-weight:700; margin:0 0 12px; }
    .ph-hero-value span { font-size:1rem; font-weight:500; opacity:.8; margin-left:6px; }
    .ph-hero-foot { font-size:13px; font-weight:500; color:rgba(255,255,255,.9); display:flex; align-items:center; gap:8px; }

    /* ── KPI grid (rule 14: fluid auto-fit) ── */
    .ph-kpis { display:grid; grid-template-columns:1fr; gap:12px; margin:0 0 16px; }
    .ph-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; }
    .ph-kpi-label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.03em; color:var(--text-2); }
    .ph-kpi-icon { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:var(--radius-sm); background:#F1F5F9; font-size:18px; }
    .ph-kpi-value { font-size:1.75rem; font-weight:700; letter-spacing:-0.02em; color:var(--text-1); line-height:1.1; margin:12px 0 4px; }
    .ph-kpi-sub { font-size:12px; color:var(--text-2); font-weight:500; }
    .ph-kpi-warn { color:var(--warning); }

    /* ── Row grids ── */
    .ph-row2 { display:grid; grid-template-columns:1fr; gap:16px; margin:0 0 16px; }
    .ph-row3 { display:grid; grid-template-columns:1fr; gap:16px; margin:0 0 16px; }

    /* Card headers */
    .ph-card-head { display:flex; align-items:center; gap:10px; margin:0 0 18px; }
    .ph-card-icon { font-size:18px; line-height:1; }
    .ph-card-title { font-size:16px; font-weight:600; color:var(--text-1); margin:0; }
    .ph-badge { margin-left:auto; display:inline-flex; align-items:center; gap:6px; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:500; background:var(--info-bg); color:var(--info); white-space:nowrap; }

    /* Sub-KPIs */
    .ph-subkpis { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:0 0 18px; }
    .ph-subkpi { background:#F9FAFB; border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 14px; transition:background 150ms ease, box-shadow 150ms ease; cursor:pointer; }
    .ph-subkpi:hover { background:#fff; box-shadow:var(--shadow); }
    .ph-subkpi-icon { font-size:16px; margin-bottom:6px; }
    .ph-subkpi-val { font-size:1.4rem; font-weight:700; line-height:1.1; }
    .ph-subkpi-lbl { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-2); margin-top:4px; }

    /* Status header + rows (rule 9 table styling) */
    .ph-grid-head { display:grid; grid-template-columns:110px 1fr 48px; gap:12px; padding:0 12px; margin:0 0 8px; }
    .ph-grid-head span { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.03em; color:var(--text-2); }
    .ph-grid-head span:last-child { text-align:right; }
    .cat-track { background:#F3F4F6; border-radius:4px; height:6px; overflow:hidden; flex:1; }
    .cat-fill { height:100%; border-radius:4px; transition:width .6s ease; }
    .cat-row { display:grid; grid-template-columns:110px 1fr 48px; gap:12px; align-items:center; padding:10px 12px; border-radius:var(--radius-sm); cursor:pointer; transition:background 150ms ease; }
    .cat-row:hover { background:#F9FAFB; }
    .cat-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
    .cat-name { font-size:13px; font-weight:500; color:var(--text-1); text-transform:capitalize; }
    .cat-count { font-size:13px; font-weight:600; color:var(--text-1); text-align:right; }

    /* Activity feed */
    .ph-activity { display:flex; flex-direction:column; gap:16px; }
    .top-row { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:var(--radius-sm); cursor:pointer; transition:background 150ms ease; }
    .top-row:hover { background:#F9FAFB; }
    .ph-avatar { width:32px; height:32px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; flex-shrink:0; background:var(--primary-tint); font-size:14px; }
    .ph-act-title { font-size:13px; font-weight:600; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ph-act-sub { font-size:12px; color:var(--text-2); }
    .ph-act-date { font-size:12px; font-weight:600; color:var(--text-2); white-space:nowrap; }
    .ph-empty { text-align:center; padding:20px 0; color:var(--text-3); font-size:13px; }

    /* Alert rows */
    .alert-row { display:flex; align-items:center; gap:14px; padding:12px 14px; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg-card); cursor:pointer; transition:box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease; margin:0 0 10px; }
    .alert-row:last-child { margin-bottom:0; }
    .alert-row:hover { box-shadow:var(--shadow-hover); transform:translateY(-1px); border-color:var(--row-c,var(--gold)); }
    .alert-icon { width:40px; height:40px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .alert-title { font-size:13px; font-weight:600; color:var(--text-1); }
    .alert-sub { font-size:12px; color:var(--text-2); }
    .alert-arrow { font-size:16px; color:var(--text-3); }

    /* Quick actions */
    .ph-actions { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
    .qa-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:16px 12px; text-align:center; cursor:pointer; transition:box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease; animation:phFadeUp .4s ease both; }
    .qa-card:hover { box-shadow:var(--shadow-hover); transform:translateY(-1px); border-color:var(--gold); }
    .qa-icon { width:44px; height:44px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; margin:0 auto 10px; font-size:20px; background:#F1F5F9; transition:background 150ms ease; }
    .qa-card:hover .qa-icon { background:var(--gold-bg); }
    .qa-label { font-size:13px; font-weight:600; color:var(--text-1); margin-bottom:2px; }
    .qa-sub { font-size:12px; color:var(--text-2); font-weight:500; }

    /* Loading */
    .ph-loading { display:flex; align-items:center; justify-content:center; min-height:60vh; }

    /* Decor plants — kept, made subtle */
    .decor-plant { position:fixed; pointer-events:none; user-select:none; z-index:0; opacity:.05 !important; animation:none !important; font-size:40px; }

    /* ── Responsive (rule 14/18, mobile-first) ── */
    @media (min-width:480px) {
      .ph-root { padding:16px; }
      .ph-kpis { grid-template-columns:1fr 1fr; }
    }
    @media (min-width:768px) {
      .ph-root { padding:16px; }
      .ph-header { grid-template-columns:1fr auto 1fr; gap:16px; margin-bottom:24px; }
      .ph-header-start { grid-column:auto; grid-row:auto; justify-self:start; }
      .ph-header-center { grid-column:auto; grid-row:auto; justify-self:center; }
      .ph-header-end { grid-column:auto; grid-row:auto; justify-self:end; }
      .btn-sync { height:36px; padding:0 16px; }
      .ph-grid-head { grid-template-columns:150px 1fr 60px; }
      .cat-row { grid-template-columns:150px 1fr 60px; }
    }
    @media (min-width:1024px) {
      .ph-root { padding:24px; }
      .ph-kpis { grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; }
      .ph-row2 { grid-template-columns:3fr 2fr; }
      .ph-row3 { grid-template-columns:1fr 2fr; }
      .ph-subkpis { grid-template-columns:repeat(4,1fr); gap:12px; }
      .ph-actions { gap:12px; }
      .d-card, .d-card-no-hover { padding:20px 24px; }
    }
    @media (min-width:1280px) {
      .ph-root { padding:24px; }
    }
    @media (max-width:479px) {
      .ph-kpi-value { font-size:1.5rem; }
      .qa-card { min-height:120px; }
      .cat-row, .top-row { min-height:48px; }
      .btn-sync { height:44px; }
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
      const [oRes, sRes, pRes] = await Promise.all([
        apiClient.get('/printing/orders', { params: { limit: 100 } }).catch(() => ({ data: [] })),
        apiClient.get('/printing-assets/store/machines').catch(() => ({ data: [] })),
        apiClient.get('/printing-assets/production/machines').catch(() => ({ data: [] }))
      ]);

      const orders = Array.isArray(oRes) ? oRes : (oRes?.data?.orders || oRes?.data || []);
      const storeM = Array.isArray(sRes) ? sRes : (sRes?.data || []);
      const prodM = Array.isArray(pRes) ? pRes : (pRes?.data || []);

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

      setData({ fleetStats, activeOrders, maintenance, orders, allMachines });
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
      <div className="ph-loading">
        <SegmentedSpinner size={40} label="Loading dashboard..." />
      </div>
    </div>
  );

  const { fleetStats, activeOrders, maintenance, orders } = data;

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
    <div className="ph-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <DecorPlants />
      {/* ── HEADER ── */}
      <div className="ph-header">
        <div className="ph-header-start">
          <h1 className="artistic-3d-title">
            Welcome!&nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div className="ph-header-center">
          <p className="artistic-3d-subtitle">
            Printing Management · It&apos;s {timeString}
          </p>
        </div>
        <div className="ph-header-end">
          <button onClick={loadData} className="btn-sync" disabled={refreshing}>
            {refreshing && <SegmentedSpinner size={16} />}
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div className="ph-kpis">
        
        {/* Fleet Value Hero */}
        <div className="d-card ph-hero" onClick={() => nav('/printing-manager/fleet')} style={{ animationDelay: '0.05s' }}>
          <div className="ph-hero-decor" />
          <div className="ph-hero-icon">🖨️</div>
          <div className="ph-kpi-label ph-hero-label">Total Machine Fleet</div>
          <div className="ph-kpi-value ph-hero-value">
            {fleetStats.total} <span>Machines</span>
          </div>
          <div className="ph-hero-foot">📊 Across Store and Production Lines</div>
        </div>

        {/* Prod Machines */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/printing-manager/fleet')}>
          <div className="ph-kpi-top">
            <span className="ph-kpi-label">Production</span>
            <div className="ph-kpi-icon">🏭</div>
          </div>
          <div className="ph-kpi-value">{fleetStats.prod}</div>
          <div className="ph-kpi-sub">Active on floor</div>
        </div>

        {/* Store Machines */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/printing-manager/fleet')}>
          <div className="ph-kpi-top">
            <span className="ph-kpi-label">Store Inventory</span>
            <div className="ph-kpi-icon">📦</div>
          </div>
          <div className="ph-kpi-value">{fleetStats.store}</div>
          <div className="ph-kpi-sub">Stored / Backups</div>
        </div>

        {/* Active Orders */}
        <div className="d-card" style={{ animationDelay: '0.2s' }} onClick={() => nav('/printing-manager/orders')}>
          <div className="ph-kpi-top">
            <span className={`ph-kpi-label${activeOrders.length > 0 ? ' ph-kpi-warn' : ''}`}>Active Orders</span>
            <div className="ph-kpi-icon">{activeOrders.length > 0 ? '⏱️' : '✅'}</div>
          </div>
          <div className={`ph-kpi-value${activeOrders.length > 0 ? ' ph-kpi-warn' : ''}`}>{activeOrders.length}</div>
          <div className="ph-kpi-sub">Currently processing</div>
        </div>
      </div>

      {/* ── ROW 2: MOVEMENT BREAKDOWN + ACTIVITY FEED ── */}
      <div className="ph-row2">
        
        {/* Fleet Status Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div className="ph-card-head">
            <span className="ph-card-icon">🔀</span>
            <h3 className="ph-card-title">Machine Status Breakdown</h3>
            <span className="ph-badge">Real-time</span>
          </div>
          {/* Sub-KPIs */}
          <div className="ph-subkpis">
            {[
              { label: 'Total Machines', val: fleetStats.total,       icon: '🖨️', c: '#2563EB' },
              { label: 'Available Now',  val: fleetStats.available,   icon: '✅', c: '#16A34A' },
              { label: 'In Use',         val: fleetStats.inUse,       icon: '⚙️', c: '#D97706' },
              { label: 'In Maintenance', val: fleetStats.maintenance, icon: '🔧', c: '#DC2626' },
            ].map(k => (
              <div key={k.label} className="ph-subkpi">
                <div className="ph-subkpi-icon">{k.icon}</div>
                <div className="ph-subkpi-val" style={{ color: k.c }}>{k.val}</div>
                <div className="ph-subkpi-lbl">{k.label}</div>
              </div>
            ))}
          </div>
          {/* Header row */}
          <div className="ph-grid-head">
            <span>Status</span>
            <span></span>
            <span>Count</span>
          </div>
          {statuses.map((status, i) => {
            const count = fleetStats[status];
            const c = statusColors[status] || COLORS_ARR[i % COLORS_ARR.length];
            return (
              <div key={status} className="cat-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="cat-dot" style={{ background: c }} />
                  <span className="cat-name">{status}</span>
                </div>
                <CategoryBar value={count} max={maxStatusCount} color={c} />
                <span className="cat-count">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Feed */}
        <div className="ph-activity">
          <div className="d-card-no-hover" style={{ flex: 1, animationDelay: '0.3s' }}>
            <div className="ph-card-head">
              <span className="ph-card-icon">📜</span>
              <h3 className="ph-card-title">Recent Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div className="ph-empty">
                <span style={{ fontSize: 28, marginBottom: 8, opacity: 0.4, display: 'inline-block' }}>📉</span><br />No activity yet
              </div>
            ) : recentActivity.map((l) => {
              const c = l.type === 'Order' ? '#16A34A' : '#D97706';
              const icon = l.type === 'Order' ? '📦' : '🔧';
              return (
                <div key={l.id} className="top-row">
                  <div className="ph-avatar" style={{ background: `${c}1A`, color: c }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div className="ph-act-title">
                      {l.type}: {l.title}
                    </div>
                    <div className="ph-act-sub">{l.sub}</div>
                  </div>
                  <span className="ph-act-date">
                    {l.date ? new Date(l.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div className="ph-row3">
        {/* Alerts */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <h3 className="ph-card-title" style={{ margin: '0 0 14px' }}>⚠ Attention Required</h3>
          {[
            { label: `${fleetStats.maintenance} In Maintenance`, sub: 'Machines currently being serviced', icon: '🔧', bg: '#FEF3C7', c: '#D97706', path: '/printing-manager/fleet' },
            { label: `${activeOrders.length} Active Orders`, sub: 'Check end dates', icon: '⏱️', bg: '#E0F2FE', c: '#0284C7', path: '/printing-manager/orders' }
          ].map(row => (
            <div key={row.label} className="alert-row" style={{ '--row-c': row.c }} onClick={() => nav(row.path)}>
              <div className="alert-icon" style={{ background: row.bg }}><span style={{ fontSize: 18 }}>{row.icon}</span></div>
              <div style={{ flex: 1 }}>
                <div className="alert-title">{row.label}</div>
                <div className="alert-sub">{row.sub}</div>
              </div>
              <span className="alert-arrow">›</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <h3 className="ph-card-title" style={{ margin: '0 0 16px' }}>⚡ Quick Operations</h3>
          <div className="ph-actions">
            {[
              { label: 'View Fleet',      sub: 'All assets',   icon: '🖨️', href: '/printing-manager/fleet' },
              { label: 'New Order',       sub: 'Create order', icon: '📝', href: '/printing-manager/orders/new' },
              { label: 'Maintenance',     sub: 'Requests',     icon: '🔧', href: '/printing-manager/fleet' },
              { label: 'Material Stock',  sub: 'Refills',      icon: '📦', href: '/printing-manager/materials' },
              { label: 'Add Machine',     sub: 'New Asset',    icon: '➕', href: '/printing-manager/fleet' },
              { label: 'Tax Receipts',    sub: 'Billing',      icon: '🧾', href: '/printing-manager/tax' },
              { label: 'Reports',         sub: 'Analytics',    icon: '📊', href: '/printing-manager/reports/finance' }
            ].map((a, i) => (
              <div key={a.label} className="qa-card" onClick={() => nav(a.href)} style={{ animationDelay: `${0.4 + i * 0.04}s` }}>
                <div className="qa-icon">
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                </div>
                <div className="qa-label">{a.label}</div>
                <div className="qa-sub">{a.sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
