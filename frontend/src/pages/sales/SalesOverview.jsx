import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import salesService from '../../services/salesService';
import printingService from '../../services/printingService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  primary: '#2563EB', primaryHover: '#1D4ED8', primaryBg: '#EFF6FF',
  success: '#16A34A', successBg: '#DCFCE7',
  danger: '#DC2626', dangerBg: '#FEE2E2',
  warning: '#D97706', warningBg: '#FEF3C7',
  info: '#0284C7', infoBg: '#E0F2FE',
  text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
  border: '#E5E7EB', bgPage: '#F5F6FA', bgCard: '#FFFFFF',
  amber: '#EAB308', amberDark: '#78350F', amberBg: '#FEFCE8',
  track: '#F3F4F6', white: '#FFFFFF'
};

const COLORS_ARR = ['#2563EB', '#0284C7', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#DC2626'];

/* ─── Global Animations ─────────────────────────────────────────────────── */

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: '#F3F4F6', borderRadius: 999, height: 8, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 999, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

const GlobalStyles = () => (
  <style>{`
    :root {
      --primary:#2563EB; --primary-hover:#1D4ED8; --primary-bg:#EFF6FF;
      --success:#16A34A; --success-bg:#DCFCE7;
      --danger:#DC2626; --danger-bg:#FEE2E2;
      --warning:#D97706; --warning-bg:#FEF3C7;
      --info:#0284C7; --info-bg:#E0F2FE;
      --bg-page:#F5F6FA; --bg-card:#FFFFFF; --border:#E5E7EB;
      --text:#111827; --text-sec:#6B7280; --text-muted:#9CA3AF;
      --amber:#EAB308; --amber-dark:#78350F; --amber-bg:#FEFCE8;
      --card-shadow:0 1px 3px rgba(0,0,0,.06);
      --card-shadow-hover:0 4px 12px rgba(0,0,0,.08), 0 0 0 1px rgba(234,179,8,.20), 0 2px 12px rgba(234,179,8,.18);
      --ring:0 0 0 3px rgba(234,179,8,.30);
    }
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes rowIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes softPulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }

    .so-page {
      background:var(--bg-page); color:var(--text);
      font-family:'Inter','Segoe UI',system-ui,-apple-system,Roboto,sans-serif;
      font-size:14px; line-height:1.5;
      min-height:calc(100vh - 64px); padding:20px; margin:-24px; overflow-x:hidden;
    }
    .so-title { font-size:26px; font-weight:600; color:var(--text); letter-spacing:-.01em; line-height:1.3; margin:0; display:flex; align-items:center; gap:12px; }
    .so-subtitle { font-size:12px; font-weight:500; color:var(--text-muted); text-transform:uppercase; letter-spacing:.03em; margin:0; }
    .blink-star { animation:softPulse 2.5s ease-in-out infinite; display:inline-block; }

    .so-header { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; margin:0 0 24px; width:100%; animation:fadeUp .35s ease; }
    .so-kpis { display:grid; grid-template-columns:2.5fr 1fr 1fr 1fr; gap:16px; margin-bottom:16px; }
    .so-row2 { display:grid; grid-template-columns:3fr 2fr; gap:16px; margin-bottom:16px; }
    .so-row3 { display:grid; grid-template-columns:1fr 2fr; gap:16px; margin-bottom:16px; }
    .so-subkpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
    .so-actions { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }

    .d-card, .d-card-no-hover {
      position:relative; background:var(--bg-card); border:1px solid var(--border); border-radius:10px;
      padding:20px; box-shadow:var(--card-shadow);
      transition:box-shadow .15s ease, transform .15s ease, border-color .15s ease;
      animation:fadeUp .5s ease both; cursor:pointer;
    }
    .d-card:hover, .d-card-no-hover:hover { border-color:var(--amber); box-shadow:var(--card-shadow-hover); transform:translateY(-1px); }
    .d-card:focus-visible, .d-card-no-hover:focus-visible, .btn-sync:focus-visible { outline:none; box-shadow:var(--ring); }

    .so-table-card { overflow-x:auto; }

    .btn-sync {
      position:relative; display:flex; align-items:center; justify-content:center; gap:8px;
      height:36px; padding:0 16px; border-radius:8px; border:1px solid transparent;
      background:var(--primary); color:#fff; font-weight:500; font-size:14px; letter-spacing:.01em;
      cursor:pointer; box-shadow:var(--card-shadow);
      transition:background .15s ease, color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .btn-sync:hover { background:var(--amber); border-color:var(--amber); color:var(--amber-dark); box-shadow:0 4px 12px rgba(234,179,8,.30); }
    .btn-sync:active { transform:scale(.97); }
    .btn-sync:disabled { opacity:.5; cursor:not-allowed; }

    .alert-row {
      display:flex; align-items:center; gap:12px; padding:12px 16px; margin-bottom:8px;
      background:var(--bg-card); border:1px solid var(--border); border-radius:10px; cursor:pointer;
      transition:all .15s ease; animation:rowIn .4s ease both;
    }
    .alert-row:hover { background:var(--amber-bg); border-color:var(--amber); transform:translateX(3px); box-shadow:0 3px 10px rgba(234,179,8,.15); }

    .cat-row {
      display:grid; grid-template-columns:150px 1fr 70px 80px; gap:12px; align-items:center;
      padding:12px 14px; border-radius:8px; cursor:pointer;
      transition:background .15s ease, box-shadow .15s ease; animation:rowIn .4s ease both;
    }
    .cat-row:hover { background:var(--amber-bg); box-shadow:0 2px 8px rgba(234,179,8,.12); }

    .top-row {
      display:flex; align-items:center; gap:12px; padding:12px 14px; margin-bottom:8px;
      background:var(--bg-card); border:1px solid var(--border); border-radius:10px; cursor:pointer;
      transition:all .15s ease; animation:rowIn .4s ease both;
    }
    .top-row:hover { background:var(--amber-bg); border-color:var(--amber); box-shadow:0 3px 10px rgba(234,179,8,.15); }

    .qa-card {
      position:relative; background:var(--bg-card); border:1px solid var(--border); border-radius:10px;
      padding:16px 14px; text-align:center; cursor:pointer;
      transition:all .15s ease; animation:fadeUp .4s ease both;
    }
    .qa-card:hover { border-color:var(--amber); background:var(--amber-bg); transform:translateY(-1px); box-shadow:0 4px 12px rgba(234,179,8,.16); }

    @media (max-width:1280px) { .so-kpis { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:1024px) {
      .so-row2, .so-row3 { grid-template-columns:1fr; }
      .so-header { grid-template-columns:1fr auto; }
    }
    @media (max-width:768px) {
      .so-page { padding:16px; }
      .so-header { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; }
      .so-subtitle { width:100%; order:3; }
      .so-subkpis { grid-template-columns:repeat(2,1fr); }
      .so-actions { grid-template-columns:repeat(2,1fr); }
      .btn-sync { min-height:44px; }
      .alert-row, .top-row { min-height:48px; }
      .qa-card { padding:16px 10px; }
      .cat-row { grid-template-columns:140px 1fr 60px 70px; min-width:560px; }
    }
    @media (max-width:480px) {
      .so-page { padding:12px; }
      .so-kpis { grid-template-columns:1fr; }
      .so-subkpis { grid-template-columns:1fr; }
      .so-actions { grid-template-columns:repeat(2,1fr); gap:12px; }
      .so-title { font-size:24px; }
    }
  `}</style>
);


const fmt = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();

const SalesOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [printingStats, setPrintingStats] = useState(null);
  const [activities, setActivities] = useState([]);
  
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
    try {
      const [salesRes, printStatsRes, printOrdersRes] = await Promise.allSettled([
        salesService.getSalesReports({ range: 'today' }),
        printingService.getStatistics(),
        printingService.getOrders({ limit: 6 })
      ]);
      
      if (salesRes.status === 'fulfilled') {
        setStats(salesRes.value.data?.data || salesRes.value.data);
      }
      if (printStatsRes.status === 'fulfilled') {
        setPrintingStats(printStatsRes.value.data?.data);
      }
      if (printOrdersRes.status === 'fulfilled') {
        const orders = printOrdersRes.value.data?.data?.orders || [];
        setActivities(orders);
      }
    } catch (err) {
      console.error('Failed to fetch sales dashboard data:', err);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => { navigate(path); };

  const data = stats || {};
  const totalRevenue = parseFloat(data.totalRevenue) || 0;
  const totalOrders = parseInt(data.totalTransactions) || 0;
  const activeCustomers = parseInt(data.uniqueCustomers) || 0;
  
  const monthlyRevenue = printingStats?.monthlyRevenue?.[0]?.revenue || 0;
  const pendingCount = parseInt(printingStats?.pendingOrders) || 0;
  const pastDueCount = parseInt(printingStats?.pastDueOrders) || 0;
  
  const topProducts = data.topProducts || [];
  const totalProductsSold = topProducts.length || 0;
  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Manager';
  
  const maxProdRev = Math.max(...topProducts.map(p => p.revenue || 0), 1);

  return (
    <div className="so-page">
      <GlobalStyles />
      {/* ── HEADER ── */}
      <div className="so-header">
        <div style={{ justifySelf: 'start' }}>
          <h1 className="so-title">
            Welcome! &nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="so-subtitle">
            SALES MANAGEMENT · IT'S {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
                    <button onClick={load} className="btn-sync" disabled={refreshing} style={{ opacity: refreshing ? 0.5 : 1 }}>
            {refreshing && <SegmentedSpinner size={16} />}
            <span style={{ zIndex: 1, position: 'relative' }}>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div className="so-kpis">

        {/* Revenue Hero */}
        <div className="d-card" onClick={() => nav('/sales/pos')}
          style={{ background: 'linear-gradient(135deg, ' + G.primary + ' 0%, ' + G.primaryHover + ' 100%)', color: '#fff', position: 'relative', overflow: 'hidden', cursor: 'pointer', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: 22 }}>⭐</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85, marginBottom: 10 }}>Sales Overview</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 14, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontSize: '1.1rem', opacity: 0.75, marginRight: 6 }}>ETB</span>{fmtInt(totalRevenue)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, opacity: 0.9 }}>
            <span>👋</span> Hello, {firstName} — Today's Total Revenue
          </div>
        </div>

        {/* Total Invoices */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/sales/pos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: G.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoices</span>
            <div style={{ background: G.primaryBg, borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>🧾</span></div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: G.text, letterSpacing: '-0.02em', margin: '12px 0 6px', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(totalOrders)}</div>
          <div style={{ fontSize: 12, color: G.textSec, fontWeight: 500 }}>Orders processed today</div>
        </div>

        {/* Active Customers */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/sales/pos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: G.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Customers</span>
            <div style={{ background: G.primaryBg, borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>👥</span></div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: G.text, letterSpacing: '-0.02em', margin: '12px 0 6px', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(activeCustomers)}</div>
          <div style={{ fontSize: 12, color: G.textSec, fontWeight: 500 }}>Served today</div>
        </div>

        {/* This Month */}
        <div className="d-card" style={{ animationDelay: '0.2s' }} onClick={() => nav('/sales/finance-review')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: G.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</span>
            <div style={{ background: G.primaryBg, borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>📈</span></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: G.text, margin: '16px 0 6px', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(monthlyRevenue)}</div>
          <div style={{ fontSize: 12, color: G.textSec, fontWeight: 500 }}>Monthly revenue (ETB)</div>
        </div>
      </div>

      {/* ── ROW 2: REVENUE BREAKDOWN + ACTIVITY FEED ── */}
      <div className="so-row2">

        {/* Revenue Breakdown */}
        <div className="d-card-no-hover so-table-card" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📦</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: G.text }}>Top Products Breakdown</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: G.textSec, fontWeight: 500 }}>Across {totalProductsSold} top sellers</span>
          </div>
          {/* Sub-KPIs */}
          <div className="so-subkpis">
            {[
              { label: 'Avg Order',    val: fmt(data.averageOrderValue), icon: '💵', c: G.primary },
              { label: 'Products',     val: totalProductsSold,           icon: '🏷️', c: G.success },
              { label: 'Transactions', val: totalOrders,                 icon: '🔄', c: G.info    },
              { label: 'Pending',      val: pendingCount,                icon: '⏳', c: G.warning },
            ].map(k => (
              <div key={k.label} style={{ background: G.bgCard, borderRadius: 10, padding: '12px 14px', border: '1px solid ' + k.c + '33' }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: k.c, overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}>{k.val}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: G.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px 80px', gap: 12, padding: '0 14px 8px', marginBottom: 4, borderBottom: '1px solid ' + G.border }}>
            {['Product', '', 'Units', 'Revenue'].map((h, hi) => (
              <div key={h + hi} style={{ fontSize: 12, fontWeight: 500, color: G.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: hi === 3 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: G.textSec, fontSize: 13 }}>No product sales yet</div>
          ) : topProducts.map((row, i) => {
            const c = COLORS_ARR[i % COLORS_ARR.length];
            return (
              <div key={row.name} className="cat-row" onClick={() => nav('/sales/store-inventory')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                </div>
                <CategoryBar value={row.revenue} max={maxProdRev} color={c} />
                <span style={{ fontSize: 13, fontWeight: 600, color: G.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(row.quantity)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: G.success, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(row.revenue)}</span>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="d-card-no-hover" style={{ flex: 1, animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>📜</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: G.text }}>Recent Orders</span>
            </div>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: G.textSec, fontSize: 13 }}>
                <span style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>📉</span><br />No orders yet
              </div>
            ) : activities.map((l) => {
              const c = l.status_code === 'delivered' ? G.success : l.status_code === 'in_progress' ? G.info : G.warning;
              const icon = l.status_code === 'delivered' ? '✅' : '⏳';
              return (
                <div key={l.id} className="top-row" onClick={() => nav(`/printing/orders/${l.id}`)}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: G.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.order_number} — {l.customer_name}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(l.total_price)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div className="so-row3">

        {/* Sales Alerts */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: G.text, marginBottom: 14 }}>⚠ Attention Required</div>
          {[
            { label: `${pendingCount} Pending Orders`, sub: `Orders awaiting fulfillment`, icon: '⏳', bg: '#E0F2FE', c: '#0284C7', path: '/printing/orders' },
            { label: `${pastDueCount} Past Due`, sub: 'Orders beyond deadline', icon: '🚨', bg: '#FEF3C7', c: '#D97706', path: '/printing/orders' }
          ].map(row => (
            <div key={row.label} className="alert-row" style={{ '--row-c': row.c }} onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, padding: 9, borderRadius: 8 }}><span style={{ fontSize: 18 }}>{row.icon}</span></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{row.label}</div>
                <div style={{ fontSize: 12, color: G.textSec, fontWeight: 500 }}>{row.sub}</div>
              </div>
              <span style={{ fontSize: 14, color: G.textMuted }}>›</span>
            </div>
          ))}
          {/* Quick info list */}
          {activities.slice(0,3).map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderTop:`1px solid ${G.border}` }}>
              <span style={{ fontSize:12, fontWeight:600, color:G.warning, minWidth:28, fontVariantNumeric:'tabular-nums' }}>{item.order_number}</span>
              <span style={{ fontSize:12, fontWeight:600, color:G.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{item.product_type || 'Custom Order'}</span>
              <span style={{ fontSize:12, color:G.textSec }}>{item.status_name}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: G.text, marginBottom: 16 }}>⚡ Quick Operations</div>
          <div className="so-actions">
            {[
              { label: 'New Sale',       sub: 'POS System',    icon: '🛒', bg: G.primaryBg, color: G.primary, href: '/sales/pos' },
              { label: 'Invoices',       sub: 'Manage',        icon: '🧾', bg: G.primaryBg, color: G.primary, href: '/printing/orders' },
              { label: 'Customers',      sub: 'Directory',     icon: '👥', bg: G.primaryBg, color: G.primary, href: '/sales/customers' },
              { label: 'Reports',        sub: 'Analytics',     icon: '📊', bg: G.primaryBg, color: G.primary, href: '/sales/ceo-report' },
              { label: 'Store Inv',      sub: 'View stock',    icon: '📦', bg: G.primaryBg, color: G.primary, href: '/sales/store-inventory' },
              { label: 'Finance',        sub: 'Review',        icon: '💵', bg: G.primaryBg, color: G.primary, href: '/sales/finance-review' },
              { label: 'Stock Ops',      sub: 'Manage stock',  icon: '🔄', bg: G.primaryBg, color: G.primary, href: '/sales/stock-operations' }
            ].map((a, i) => (
              <div key={a.label} className="qa-card" onClick={() => nav(a.href)} style={{ animationDelay: `${0.4 + i * 0.04}s` }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: a.color }}>
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.text, marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: G.textSec, fontWeight: 500 }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;
