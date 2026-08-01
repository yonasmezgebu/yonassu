import React, { useState, useEffect, useCallback } from 'react';
import { Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';

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
    
    /* 3D Header Styles */
    .artistic-3d-title { font-size:3rem; font-weight:900; color:#1B5E20; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #228B22, 5px 5px 0 #228B22, 6px 6px 0 #2E8B57, 7px 7px 0 #2E8B57, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
    .artistic-3d-subtitle { font-size:1rem; color:#2E8B57; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:0.15em; margin:0; text-shadow:1px 1px 0px rgba(255,255,255,0.9); }
    /* GLOWING BORDER SYNC BUTTON */
    .btn-sync {
      position: relative; background: #FFFFFF; color: #1B5E20; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; overflow: hidden; z-index: 1; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-transform: uppercase; letter-spacing: 1.5px;
    }
    .btn-sync::before {
      content: ''; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%; background: conic-gradient(transparent, transparent, transparent, #4CAF50, #228B22); animation: rotate-border 2s linear infinite; z-index: -2;
    }
    .btn-sync::after {
      content: ''; position: absolute; inset: 2px; background: #FFFFFF; border-radius: 6px; z-index: -1;
    }
    .btn-sync:hover::after { background: #F5F5F5; }
    .btn-sync:active { transform: scale(0.97); }
    @keyframes rotate-border { 100% { transform: rotate(360deg); } }

    .d-card { 
      --hover-color: #2E8B57;
      position:relative; overflow:hidden; background-color:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s, transform 0.4s; animation:fadeUp 0.5s ease both; border:none; cursor:pointer;
      background-image:
        linear-gradient(to right, var(--hover-color), var(--hover-color)),
        linear-gradient(to bottom, var(--hover-color), var(--hover-color)),
        linear-gradient(to left, var(--hover-color), var(--hover-color)),
        linear-gradient(to top, var(--hover-color), var(--hover-color));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%;
      background-repeat: no-repeat;
      background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
    }
    .d-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card:hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(0,80,120,0.14), 0 0 18px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card:hover::before { animation: laserSweep 0.8s ease-out; }
    
    .d-card-no-hover { 
      --hover-color: #228B22;
      position:relative; overflow:hidden; background:white; border-radius:0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s; animation:fadeUp 0.5s ease both;
      background-image:
        linear-gradient(to right, var(--hover-color), var(--hover-color)),
        linear-gradient(to bottom, var(--hover-color), var(--hover-color)),
        linear-gradient(to left, var(--hover-color), var(--hover-color)),
        linear-gradient(to top, var(--hover-color), var(--hover-color));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%;
      background-repeat: no-repeat;
      background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
    }
    .d-card-no-hover::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.2) 20%, rgba(255,0,255,0.2) 50%, rgba(0,255,0,0.2) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .d-card-no-hover:hover { box-shadow:0 6px 20px rgba(0,80,120,0.12), 0 0 14px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
    .d-card-no-hover:hover::before { animation: laserSweep 1s ease-out; }
    
    .alert-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:14px; padding:13px 16px; background:rgba(230,242,235,0.5); border-radius:0; cursor:pointer; transition:all 0.25s; border:1.5px solid transparent; margin-bottom:10px; }
    .alert-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,0,255,0.3), rgba(0,255,255,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .alert-row:hover { background:white; border-color:var(--row-c); transform:translateX(4px); box-shadow:0 4px 14px rgba(0,0,0,0.08); }
    .alert-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
    
    .cat-row { position:relative; overflow:hidden; display:grid; grid-template-columns:150px 1fr 70px 80px; gap:12px; align-items:center; padding:11px 14px; border-radius:0; transition:background 0.2s; cursor:pointer; }
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
      background-image:
        linear-gradient(to right, var(--hover-color), var(--hover-color)),
        linear-gradient(to bottom, var(--hover-color), var(--hover-color)),
        linear-gradient(to left, var(--hover-color), var(--hover-color)),
        linear-gradient(to top, var(--hover-color), var(--hover-color)),
        linear-gradient(to right, var(--base-top), var(--base-top));
      background-position: 0 0, 100% 0, 100% 100%, 0 100%, 0 0;
      background-repeat: no-repeat;
      background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%, 100% 4px;
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

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 0, height: 7, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 0, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

const HRHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  
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
      const [summaryRes, activitiesRes, leavesRes] = await Promise.all([
        hrService.getSummary().catch(() => null),
        hrService.getTodayActivities().catch(() => null),
        hrService.getLeaveRequests({ status: 'pending' }).catch(() => null)
      ]);
      setSummary(summaryRes?.data || summaryRes || {});
      const actData = activitiesRes?.data || activitiesRes || {};
      const logs = actData.logs || [];
      setActivities(logs.map((log, i) => ({
        id: log.record_id || i,
        action_type: log.action_type === 'CLOCK_IN' ? 'Clock In' : 'Clock Out',
        employee_id: log.employee_id,
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: log.action_type === 'CLOCK_IN' ? 'hire' : 'leave',
        date_time: log.timestamp
      })).slice(0, 6));
      const lvData = leavesRes?.data?.leaves || leavesRes?.leaves || [];
      setPendingLeaves(lvData);
    } catch (err) {
      console.error('Failed to fetch HR dashboard data:', err);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => { navigate(path); };

  const data = summary || {};
  const activeCount   = parseInt(data.activeEmployees) || 0;
  const presentCount  = parseInt(data.presentToday)   || 0;
  const attendanceRate = activeCount > 0 ? Math.round((presentCount / activeCount) * 100) : 0;
  const onLeaveCount  = parseInt(data.onLeaveCount)   || 0;
  
  const deptBreakdown = data.departmentBreakdown || [];
  const totalDepts    = deptBreakdown.length || 0;
  const pendingCount  = parseInt(data.pendingLeaves)  || pendingLeaves.length;
  const firstName = user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Manager';
  
  const maxDeptCount = Math.max(...deptBreakdown.map(d => d.count), 1);

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
            Universal HR Hub · It&apos;s {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button onClick={load} className="btn-sync" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <span style={{ display:'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            SYNC
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Health Score Hero */}
        <div className="d-card" onClick={() => nav('/hr/employees')}
          style={{ background: `linear-gradient(135deg,${G.forest} 0%,${G.dark} 100%)`, color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <span style={{ fontSize: 24 }}>⭐</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>Workforce Health Score</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14 }}>
            {attendanceRate}<span style={{ fontSize: '1.5rem', opacity: 0.75, marginLeft: 6 }}>%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
            <span>👋</span> Hello, {firstName} - Today's Attendance Rate
          </div>
        </div>

        {/* Total Staff */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/hr/employees')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Staff</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>👥</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{activeCount.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Employees on payroll</div>
        </div>

        {/* Present Today */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/hr/todays-activities')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Present Today</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>✅</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{presentCount.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Currently clocked in</div>
        </div>

        {/* Pending Approvals */}
        <div className="d-card" style={{ animationDelay: '0.2s', background: pendingCount > 0 ? '#FFF8F0' : undefined }} onClick={() => nav('/hr/employee-info')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: pendingCount > 0 ? G.orange : G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending Approvals</span>
            <div style={{ background: pendingCount > 0 ? '#FFF4EB' : '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>{pendingCount > 0 ? '⚠️' : '✅'}</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: pendingCount > 0 ? G.orange : G.dark, margin: '12px 0 6px' }}>{pendingCount}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>{pendingCount > 0 ? 'Requires attention' : 'All caught up!'}</div>
        </div>
      </div>

      {/* ── ROW 2: DEPARTMENT BREAKDOWN + ACTIVITY FEED ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Department Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize:18 }}>🏢</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: G.dark }}>Department Headcount</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: G.olive, fontWeight: 700 }}>Across {totalDepts} departments</span>
          </div>
          {/* Sub-KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Active Depts',  val: totalDepts,   icon: '🏢', c: G.forest },
              { label: 'Total Payroll', val: activeCount,  icon: '👥', c: G.orange },
              { label: 'On Leave',      val: onLeaveCount, icon: '🌴', c: G.sky    },
              { label: 'Leave Requests',val: pendingCount, icon: '⏳', c: G.purple },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 0, padding: '12px 14px', border: `1.5px solid ${k.c}22` }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.c }}>{k.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.olive, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px 80px', gap: 12, padding: '4px 14px', marginBottom: 6 }}>
            {['Department', '', 'Count', '%'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          {deptBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: G.olive, fontSize: 13 }}>No department data yet</div>
          ) : deptBreakdown.map((row, i) => {
            const c = COLORS_ARR[i % COLORS_ARR.length];
            const pct = activeCount > 0 ? Math.round((row.count / activeCount) * 100) : 0;
            return (
              <div key={row.department} className="cat-row" onClick={() => nav('/hr/employees')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 0, background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: G.dark }}>{row.department}</span>
                </div>
                <CategoryBar value={row.count} max={maxDeptCount} color={c} />
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
            ) : activities.map((l, i) => {
              const c = l.type === 'hire' ? G.emerald : G.orange;
              const icon = l.type === 'hire' ? '👋' : '🚶';
              return (
                <div key={l.id} className="top-row" onClick={() => nav('/hr/todays-activities')}>
                  <div style={{ width: 32, height: 32, borderRadius: 0, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.action_type}: {l.employee_id}
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

      {/* ── ROW 3: LOW STOCK ALERTS + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* HR Alerts */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 14 }}>⚠ Attention Required</div>
          {[
            { label: `${pendingCount} Pending Requests`, sub: `Leaves awaiting approval`, icon: '⏳', bg: '#EFF6FF', c: '#3b82f6', path: '/hr/employee-info' },
            { label: `${onLeaveCount} Staff on Leave`, sub: 'Currently not in office', icon: '🌴', bg: '#FFFBEB', c: '#f59e0b', path: '/hr/employee-info' }
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
          {/* Pending leaves mini-list */}
          {pendingLeaves.slice(0,3).map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderTop:`1px solid ${G.sage}44` }}>
              <span style={{ fontSize:12, fontWeight:800, color:G.orange, minWidth:28 }}>{item.employee_id}</span>
              <span style={{ fontSize:12, fontWeight:700, color:G.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>Leave Request</span>
              <span style={{ fontSize:10, color:G.olive }}>{new Date(item.start_date || new Date()).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Employees',      sub: 'Directory',     icon: '👥', bg: '#E6F2EB', color: G.forest,  href: '/hr/employees' },
              { label: 'Payroll',        sub: 'Monthly',       icon: '💵', bg: '#E8F9F1', color: G.emerald, href: '/hr/monthly-payroll' },
              { label: 'Deductions',     sub: 'Manage',        icon: '🛡️', bg: '#F1F8E9', color: G.olive,   href: '/hr/deductions' },
              { label: 'Salary List',    sub: 'Records',       icon: '📄', bg: '#FFF3E0', color: G.orange,  href: '/hr/salary-list' },
              { label: 'HR Policies',    sub: 'View rules',    icon: '💼', bg: '#E1F5FE', color: G.sky,     href: '/hr/hr-policies' },
              { label: 'Announcements',  sub: 'Broadcast',     icon: '🔔', bg: '#F3E5F5', color: G.purple,  href: '/hr/announcements' },
              { label: 'Requests',       sub: 'Pending items', icon: '⏳', bg: '#EFEBE9', color: G.brown,   href: '/hr/employee-info' }
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

export default HRHome;
