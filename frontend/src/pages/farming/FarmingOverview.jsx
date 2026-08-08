import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED', blue: '#3b82f6'
};

const COLORS_ARR = [G.forest, G.orange, G.sky, G.purple, G.emerald, G.brown, G.blue];

/* ─── Global Animations ─────────────────────────────────────────────────── */

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 0, height: 7, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 0, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

const GlobalStyles = () => (
  <style>{`
    @keyframes floatLeaf { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(7deg); } }
    @keyframes rowIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
    @keyframes laserSweep { 0% { left: -150%; } 100% { left: 150%; } }
    @keyframes colorBlink { 0% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } 25% { color:#8BC34A; filter:drop-shadow(0 0 10px #8BC34Acc); transform:scale(1.15) rotate(10deg); } 50% { color:#2E8B57; filter:drop-shadow(0 0 14px #2E8B57); transform:scale(1.3) rotate(-10deg); } 75% { color:#87CEEB; filter:drop-shadow(0 0 10px #87CEEBcc); transform:scale(1.15) rotate(5deg); } 100% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } }
    .blink-star { animation: colorBlink 2.5s infinite ease-in-out; display:inline-block; }

    .artistic-3d-title { font-size:3rem; font-weight:900; color:#1B5E20; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #228B22, 5px 5px 0 #228B22, 6px 6px 0 #2E8B57, 7px 7px 0 #2E8B57, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
    .artistic-3d-subtitle { font-size:1rem; color:#2E8B57; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:0.15em; margin:0; text-shadow:1px 1px 0px rgba(255,255,255,0.9); }
    .btn-sync { position: relative; background: #FFFFFF; color: #1B5E20; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; overflow: hidden; z-index: 1; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-transform: uppercase; letter-spacing: 1.5px; margin: 0; }
    .btn-sync::before { content: ''; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%; background: conic-gradient(transparent, transparent, transparent, #4CAF50, #228B22); animation: rotate-border 2s linear infinite; z-index: -2; }
    .btn-sync::after { content: ''; position: absolute; inset: 2px; background: #FFFFFF; border-radius: 6px; z-index: -1; }
    .btn-sync:hover::after { background: #F5F5F5; }
    .btn-sync:active { transform: scale(0.97); }
    @keyframes rotate-border { 100% { transform: rotate(360deg); } }

    .d-card {
      --hover-color: #2E8B57;
      position:relative; overflow:hidden; background-color:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s, transform 0.4s; animation:fadeUp 0.5s ease both; border:none; cursor:pointer;
      background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
    }
    .d-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card:hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(0,80,120,0.14), 0 0 18px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card:hover::before { animation: laserSweep 0.8s ease-out; }

    .d-card-no-hover {
      --hover-color: #228B22;
      position:relative; overflow:hidden; background:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s; animation:fadeUp 0.5s ease both;
      background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
    }
    .d-card-no-hover::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.2) 20%, rgba(255,0,255,0.2) 50%, rgba(0,255,0,0.2) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card-no-hover:hover { box-shadow:0 6px 20px rgba(0,80,120,0.12), 0 0 14px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card-no-hover:hover::before { animation: laserSweep 1s ease-out; }

    .alert-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:14px; padding:13px 16px; background:rgba(230,242,235,0.5); border-radius:0; cursor:pointer; transition:all 0.25s; border:1.5px solid transparent; margin-bottom:10px; }
    .alert-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,0,255,0.3), rgba(0,255,255,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .alert-row:hover { background:white; border-color:var(--row-c); transform:translateX(4px); box-shadow:0 4px 14px rgba(0,0,0,0.08); }
    .alert-row:hover::before { animation: laserSweep 0.6s ease-in-out; }

    .cat-row { position:relative; overflow:hidden; display:grid; grid-template-columns:150px 1fr 70px; gap:12px; align-items:center; padding:11px 14px; border-radius:0; transition:background 0.2s; cursor:pointer; }
    .cat-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,0,0.2), rgba(0,255,255,0.2), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .cat-row:hover { background:rgba(230,242,235,0.6); box-shadow:0 2px 8px rgba(0,80,120,0.05); }
    .cat-row:hover::before { animation: laserSweep 0.6s ease-in-out; }

    .top-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:0; background:rgba(230,242,235,0.45); margin-bottom:8px; transition:all 0.2s; cursor:pointer; }
    .top-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(107,142,35,0.3), rgba(107,142,35,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .top-row:hover { background:white; box-shadow:0 3px 12px rgba(0,80,120,0.09); border:1px solid rgba(107,142,35,0.4); }
    .top-row:hover::before { animation: laserSweep 0.6s ease-in-out; }

    .qa-card {
      --hover-color: #2E8B57;
      --base-top: transparent;
      position:relative; overflow:hidden; background:rgba(255,255,255,0.65); border-radius:0; padding:22px 16px; text-align:center; cursor:pointer; transition:all 0.4s cubic-bezier(.4,0,.2,1); border:none;
      background-image: linear-gradient(to right, var(--hover-color), var(--hover-color)), linear-gradient(to bottom, var(--hover-color), var(--hover-color)), linear-gradient(to left, var(--hover-color), var(--hover-color)), linear-gradient(to top, var(--hover-color), var(--hover-color)), linear-gradient(to right, var(--base-top), var(--base-top));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%, 0 0; background-repeat: no-repeat; background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%, 100% 4px;
    }
    .qa-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,255,0.6), rgba(255,0,255,0.6), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .qa-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,80,120,0.12), 0 0 14px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%, 100% 4px; }
    .qa-card:hover::before { animation: laserSweep 0.6s ease-out; }
  `}</style>
);


const FarmingOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const basePath = location.pathname.startsWith('/farming-manager') ? '/farming-manager' : '/farming';
  
  const [stats, setStats] = useState({});
  const [shift, setShift] = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  
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
      const [statsRes, shiftRes, qaRes] = await Promise.all([
        apiClient.get('/farming/overview/stats').catch(() => null),
        apiClient.get('/farming/shifts/current').catch(() => null),
        apiClient.get('/farming/quick-actions').catch(() => null)
      ]);
      if (statsRes?.data?.status === 'success' || statsRes?.data) setStats(statsRes.data?.data || statsRes.data || {});
      if (shiftRes?.data?.status === 'success' || shiftRes?.data) setShift(shiftRes.data?.data || shiftRes.data || null);
      if (qaRes?.data?.status === 'success' || qaRes?.data) {
        setQuickActions(qaRes.data?.data || qaRes.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch Farming dashboard data:', err);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => {
    if (path.startsWith('/farming')) {
      navigate(path.replace('/farming', basePath));
    } else {
      navigate(path);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Manager';
  
  const totalProducts = stats.totalProducts || stats.todayOrders || 0;
  const activeWorkers = stats.activeWorkers || 0;
  const todayRevenue = stats.todayRevenue || 0;
  const lowStockCount = stats.lowStockCount || 0;
  const pendingReorders = stats.pendingReorders || 0;
  
  const breakdown = stats.stockBreakdown || [];
  const maxCatCount = Math.max(...breakdown.map(b => b.count), 1);
  const totalCatCount = breakdown.reduce((acc, b) => acc + b.count, 0);

  const activities = stats.recentActivity || [];

  return (
    <div style={{ margin: '-24px', padding: '2.5rem', minHeight: 'calc(100vh - 64px)', background: '#E8F4EC', fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>
      <GlobalStyles />
      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%', position:'relative', zIndex:1 }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome! &nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            FARMING MANAGEMENT · IT'S {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
                              <button onClick={load} className="btn-sync" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            {refreshing && <SegmentedSpinner size={16} />}
            <span style={{ zIndex: 1, position: 'relative' }}>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Hero Card */}
        <div className="d-card" onClick={() => nav('/farming/products')}
          style={{ background: \`linear-gradient(135deg,\${G.forest} 0%,\${G.dark} 100%)\`, color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <span style={{ fontSize: 24 }}>🌾</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>Farming Overview</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14 }}>
            {totalProducts}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
            <span>👋</span> Hello, {firstName} - Total Products Managed
          </div>
        </div>

        {/* Workers Count */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/farming/workers')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active Workers</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>👨‍🌾</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{activeWorkers.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Currently clocked in</div>
        </div>

        {/* Today's Revenue */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/farming/reports')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Today's Revenue</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>💵</span></div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '18px 0 10px' }}>{todayRevenue.toLocaleString()} ETB</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Daily earnings</div>
        </div>

        {/* Active Shift Info */}
        <div className="d-card" style={{ animationDelay: '0.2s', background: !shift ? '#FFF8F0' : undefined }} onClick={() => nav('/farming/shifts')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: !shift ? G.orange : G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active Shift</span>
            <div style={{ background: !shift ? '#FFF4EB' : '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>{!shift ? '⚠️' : '✅'}</span></div>
          </div>
          <div style={{ fontSize: '2.0rem', fontWeight: 900, color: !shift ? G.orange : G.dark, margin: '16px 0 6px', textTransform: 'capitalize' }}>
            {shift ? shift.shift_type : 'Closed'}
          </div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>{!shift ? 'Requires opening' : 'Currently active'}</div>
        </div>
      </div>

      {/* ── ROW 2: DEPARTMENT BREAKDOWN + ACTIVITY FEED ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Product / Stock Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize:18 }}>📦</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: G.dark }}>Product Breakdown</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: G.olive, fontWeight: 700 }}>Across {breakdown.length} categories</span>
          </div>
          
          {/* Sub-KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Categories',  val: breakdown.length, icon: '🏷️', c: G.forest },
              { label: 'Total Stock', val: totalCatCount,    icon: '📦', c: G.orange },
              { label: 'Low Stock',   val: lowStockCount,    icon: '📉', c: G.red    },
              { label: 'Reorders',    val: pendingReorders,  icon: '⏳', c: G.purple },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 0, padding: '12px 14px', border: \`1.5px solid \${k.c}22\` }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.c }}>{k.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.olive, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px 80px', gap: 12, padding: '4px 14px', marginBottom: 6 }}>
            {['Category', '', 'Stock', '%'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          {breakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: G.olive, fontSize: 13 }}>No category data yet</div>
          ) : breakdown.map((row, i) => {
            const c = COLORS_ARR[i % COLORS_ARR.length];
            const pct = totalCatCount > 0 ? Math.round((row.count / totalCatCount) * 100) : 0;
            return (
              <div key={row.category} className="cat-row" onClick={() => nav('/farming/products')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 0, background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: G.dark }}>{row.category}</span>
                </div>
                <CategoryBar value={row.count} max={maxCatCount} color={c} />
                <span style={{ fontSize: 13, fontWeight: 700, color: G.dark, textAlign: 'right' }}>{row.count}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: G.emerald, textAlign: 'right' }}>{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="d-card-no-hover" style={{ flex: 1, animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize:18 }}>📜</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: G.dark }}>Live Activity</span>
            </div>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: G.olive, fontSize: 13 }}>
                <span style={{ fontSize:28, marginBottom: 8, opacity: 0.4 }}>📉</span><br />No logs yet
              </div>
            ) : activities.map((l) => {
              let c = G.emerald;
              let icon = '✅';
              if (l.type === 'alert') { c = G.red; icon = '⚠️'; }
              if (l.type === 'shift') { c = G.sky; icon = '🕒'; }
              return (
                <div key={l.id} className="top-row">
                  <div style={{ width: 32, height: 32, borderRadius: 0, background: \`\${c}22\`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.action_type}: {l.details}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: c, whiteSpace: 'nowrap' }}>
                    {l.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Farming Alerts */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 14 }}>⚠ Attention Required</div>
          {[
            { label: \`\${lowStockCount} Low Stock\`, sub: \`Items needing reorder\`, icon: '📉', bg: '#FEF2F2', c: '#ef4444', path: '/farming/products' },
            { label: \`\${pendingReorders} Pending Reorders\`, sub: 'Awaiting approval', icon: '⏳', bg: '#FFFBEB', c: '#f59e0b', path: '/farming/store-request' }
          ].map(row => (
            <div key={row.label} className="alert-row" style={{ '--row-c': row.c }} onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, padding: 9, borderRadius: 0 }}><span style={{ fontSize: 18 }}>{row.icon}</span></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: G.dark }}>{row.label}</div>
                <div style={{ fontSize: 11, color: G.olive, fontWeight: 600 }}>{row.sub}</div>
              </div>
              <span style={{ fontSize:14, color:'#ccc' }}>›</span>
            </div>
          ))}
          {/* Shift Alert */}
          {!shift && (
             <div className="alert-row" style={{ '--row-c': '#f97316' }} onClick={() => nav('/farming/shifts')}>
             <div style={{ background: '#FFF3E0', padding: 9, borderRadius: 0 }}><span style={{ fontSize: 18 }}>⚠️</span></div>
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: 13, fontWeight: 800, color: G.dark }}>No Open Shift</div>
               <div style={{ fontSize: 11, color: G.olive, fontWeight: 600 }}>Please open a shift</div>
             </div>
             <span style={{ fontSize:14, color:'#ccc' }}>›</span>
           </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Reorder',        sub: 'Stock',         icon: '📦', bg: '#E6F2EB', color: G.forest,  href: '/farming/store-request' },
              { label: 'Shift Reports',  sub: 'Daily',         icon: '🕒', bg: '#E8F9F1', color: G.emerald, href: '/farming/shifts' },
              { label: 'Crop Calendar',  sub: 'Schedule',      icon: '📅', bg: '#F1F8E9', color: G.olive,   href: '/farming/calendar' },
              { label: 'Store Request',  sub: 'Order items',   icon: '🛒', bg: '#FFF3E0', color: G.orange,  href: '/farming/store-request' },
              { label: 'Products',       sub: 'Manage',        icon: '🌾', bg: '#E1F5FE', color: G.sky,     href: '/farming/products' },
              { label: 'Finance Report', sub: 'Overview',      icon: '💵', bg: '#F3E5F5', color: G.purple,  href: '/farming/reports' }
            ].map((a, i) => (
              <div key={a.label} className="qa-card" onClick={() => nav(a.href)} style={{ animationDelay: \`\${0.4 + i * 0.04}s\` }}>
                <div style={{ width: 46, height: 46, borderRadius: 0, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: a.color }}>
                  <span style={{ fontSize:22 }}>{a.icon}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: G.dark, marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 10, color: G.olive, fontWeight: 600 }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmingOverview;
