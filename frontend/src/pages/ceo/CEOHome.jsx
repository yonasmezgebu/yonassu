import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED', blue: '#3b82f6'
};

const COLORS_ARR = [G.forest, G.orange, G.sky, G.purple, G.emerald, G.brown, G.blue];

/* ─── Global Animations ─────────────────────────────────────────────────── */
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

const DecorPlants = () => (
  <>
    <GlobalStyles />
    {[
      { e:'🍃', sz:55, op:0.22, top:'1%',    left:'0.5%'  },
      { e:'🌿', sz:48, op:0.18, top:'0%',    right:'0.5%' },
      { e:'🌾', sz:52, op:0.20, bottom:'1%', left:'0.5%'  },
      { e:'🍃', sz:50, op:0.18, bottom:'0%', right:'0.5%' },
    ].map((p,i) => (
      <span key={i} style={{ position:'fixed', fontSize: p.sz, opacity: p.op, top: p.top, left: p.left, right: p.right, bottom: p.bottom, pointerEvents:'none', userSelect:'none', animation:`floatLeaf ${9+i*1.5}s ease-in-out infinite`, animationDelay:`${i*1.2}s`, zIndex:0 }}>{p.e}</span>
    ))}
  </>
);

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
    <div style={{ margin: '-24px', padding: '2.5rem', minHeight: 'calc(100vh - 64px)', background: '#E8F4EC', fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>
      <DecorPlants />
      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%', position:'relative', zIndex:1 }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome! &nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            EXECUTIVE COMMAND CENTER · IT'S {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
                              <button onClick={load} className="btn-sync" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <span style={{ display:'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none', zIndex: 1, position: 'relative' }}>🔄</span>
            <span style={{ zIndex: 1, position: 'relative' }}>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Executive Overview Hero */}
        <div className="d-card" onClick={() => nav('/ceo/reports/executive')}
          style={{ background: `linear-gradient(135deg,${G.forest} 0%,${G.dark} 100%)`, color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <span style={{ fontSize: 24 }}>⭐</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>Executive Overview</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14 }}>
            Active
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
            <span>👋</span> Hello, {firstName} - Full system access granted
          </div>
        </div>

        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/ceo/approvals/pending')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.orange, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending</span>
            <div style={{ background: '#FFF4EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>⚠️</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>0</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Awaiting approval</div>
        </div>

        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/ceo/reports/executive')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Reports</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>📊</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>Active</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Executive reports</div>
        </div>

        <div className="d-card" style={{ animationDelay: '0.2s' }} onClick={() => nav('/ceo/finance')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.purple, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Finance</span>
            <div style={{ background: '#F3E5F5', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>💰</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>Live</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Financial summary</div>
        </div>
      </div>

      {/* ── ROW 2: MODULE ACCESS + RECENT ACTIVITY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Module Access Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize:18 }}>🔐</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: G.dark }}>Module Access Breakdown</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 100px 80px', gap: 12, padding: '4px 14px', marginBottom: 6 }}>
            {['Module', '', 'Status', 'Access'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          
          {[
            { name: 'Sales & CRV', pct: 100, path: '/ceo/sales' },
            { name: 'Purchase & PV', pct: 100, path: '/ceo/purchase' },
            { name: 'HR Records', pct: 100, path: '/ceo/hr' },
            { name: 'Finance (All)', pct: 100, path: '/ceo/finance' },
            { name: 'Inventory M19', pct: 100, path: '/ceo/inventory' }
          ].map((row, i) => {
            const c = COLORS_ARR[i % COLORS_ARR.length];
            return (
              <div key={row.name} className="cat-row" style={{ gridTemplateColumns: '150px 1fr 100px 80px' }} onClick={() => nav(row.path)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 0, background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: G.dark }}>{row.name}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 0, height: 7, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: c, width: '100%' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: G.dark }}>Active</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: G.emerald, textAlign: 'right' }}>Full</span>
              </div>
            );
          })}
        </div>

        {/* Stamp Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="d-card-no-hover" style={{ flex: 1, animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize:18 }}>✅</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: G.dark }}>Digital Stamp Rules</span>
            </div>
            <div style={{ padding: '10px 0', color: G.olive, fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 'bold', color: G.forest, marginBottom: 8 }}>FULL STAMP PERMISSION</div>
              • Can approve/reject ALL requests<br/>
              • Can approve/reject ALL fund requests<br/>
              • Can confirm direct deliveries<br/>
              • Can review tender bids
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* CEO Alerts */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 14 }}>⚠ Action Required</div>
          {[
            { label: `Pending Approvals`, sub: `Connect to API`, icon: '⏳', bg: '#EFF6FF', c: '#3b82f6', path: '/ceo/approvals/pending' },
            { label: `Direct Deliveries`, sub: `Awaiting review`, icon: '🚚', bg: '#FFFBEB', c: '#f59e0b', path: '/ceo/direct-delivery' }
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
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Sales',      sub: 'Module', icon: '💰', bg: '#E6F2EB', color: G.forest,  href: '/ceo/sales' },
              { label: 'Purchase',   sub: 'Module', icon: '🛒', bg: '#E8F9F1', color: G.emerald, href: '/ceo/purchase' },
              { label: 'Finance',    sub: 'Module', icon: '🏦', bg: '#F1F8E9', color: G.olive,   href: '/ceo/finance' },
              { label: 'HR',         sub: 'Module', icon: '👥', bg: '#FFF3E0', color: G.orange,  href: '/ceo/hr' },
              { label: 'Printing',   sub: 'Module', icon: '🖨️', bg: '#E1F5FE', color: G.sky,     href: '/ceo/printing' },
              { label: 'Car Rental', sub: 'Module', icon: '🚗', bg: '#F3E5F5', color: G.purple,  href: '/ceo/car-rental' },
              { label: 'Tenders',    sub: 'Module', icon: '⚖️', bg: '#EFEBE9', color: G.brown,   href: '/ceo/tender-full' },
              { label: 'Reports',    sub: 'Module', icon: '📊', bg: '#E6F2EB', color: G.forest,  href: '/ceo/reports' }
            ].map((a, i) => (
              <div key={a.label} className="qa-card" onClick={() => nav(a.href)} style={{ animationDelay: `${0.4 + i * 0.04}s` }}>
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

export default CEOHome;
