import React, { useState, useEffect, useCallback } from 'react';
import { Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

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
  <div style={{ background: '#E5E7EB', borderRadius: 4, height: 6, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 4, background: '#2563EB',
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

const GlobalStyles = () => (
  <style>{`
    /* ── Design Tokens ───────────────────────────────────────── */
    :root {
      --color-primary:        #2563EB;
      --color-primary-hover:  #1D4ED8;
      --color-bg-page:        #F5F6FA;
      --color-bg-card:        #FFFFFF;
      --color-border:         #E5E7EB;
      --color-text-primary:   #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted:     #9CA3AF;
      --color-success:        #16A34A;
      --color-success-bg:     #DCFCE7;
      --color-danger:         #DC2626;
      --color-danger-bg:      #FEE2E2;
      --color-warning:        #D97706;
      --color-warning-bg:     #FEF3C7;
      --color-info:           #0284C7;
      --color-info-bg:        #E0F2FE;
    }

    /* ── Animations ─────────────────────────────────────────── */
    @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes rowIn    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }

    /* ── Page Wrapper ───────────────────────────────────────── */
    .hr-home-wrap {
      margin: 0;
      padding: 24px;
      min-height: calc(100vh - 60px);
      background: var(--color-bg-page);
      font-family: 'Inter','Segoe UI','Roboto',-apple-system,sans-serif;
      color: var(--color-text-primary);
      box-sizing: border-box;
      overflow-x: hidden;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .hr-home-header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      margin-bottom: 24px;
      animation: fadeUp .3s ease;
    }
    .hr-home-title {
      font-size: 26px !important;
      font-weight: 600 !important;
      color: var(--color-text-primary) !important;
      letter-spacing: -0.01em !important;
      text-shadow: none !important;
      margin: 0 !important;
      display: flex;
      align-items: center;
      gap: 10px;
      line-height: 1.3 !important;
    }
    .hr-home-subtitle {
      font-size: 13px !important;
      color: var(--color-text-secondary) !important;
      font-weight: 500 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      text-shadow: none !important;
    }

    /* ── Sync Button ────────────────────────────────────────── */
    .btn-sync {
      position: relative !important;
      background: var(--color-primary) !important;
      color: #fff !important;
      border: none !important;
      padding: 0 20px !important;
      height: 36px !important;
      border-radius: 8px !important;
      font-weight: 500 !important;
      font-size: 13px !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      letter-spacing: 0.5px !important;
      text-transform: none !important;
      transition: background 150ms ease-in-out, box-shadow 150ms ease-in-out !important;
      box-shadow: none !important;
      overflow: hidden !important;
      z-index: 1 !important;
    }
    .btn-sync::before { display: none !important; }
    .btn-sync::after  { display: none !important; }
    .btn-sync:hover   { background: var(--color-primary-hover) !important; box-shadow: 0 4px 12px rgba(37,99,235,0.25) !important; }
    .btn-sync:active  { transform: scale(0.98) !important; }
    .btn-sync:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }

    /* ── KPI Cards (d-card) ─────────────────────────────────── */
    .d-card {
      position: relative !important;
      overflow: hidden !important;
      background: var(--color-bg-card) !important;
      border-radius: 10px !important;
      padding: 20px 24px !important;
      border: 1px solid var(--color-border) !important;
      box-shadow: 0 1px 3px rgba(0,0,0,.06) !important;
      cursor: pointer !important;
      transition: box-shadow 150ms ease, transform 150ms ease !important;
      animation: fadeUp .4s ease both !important;
      background-image: none !important;
    }
    .d-card::before { display: none !important; }
    .d-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08) !important;
      transform: translateY(-1px) !important;
      background-color: #FAFBFF !important;
    }

    /* Hero KPI Card (dark blue) */
    .d-card[style*="linear-gradient"] {
      background: var(--color-primary) !important;
      background-image: none !important;
      border-color: var(--color-primary) !important;
      color: #fff !important;
    }
    .d-card[style*="linear-gradient"]:hover {
      background: var(--color-primary-hover) !important;
      box-shadow: 0 4px 16px rgba(37,99,235,.3) !important;
    }

    /* ── Section Cards (d-card-no-hover) ────────────────────── */
    .d-card-no-hover {
      position: relative !important;
      overflow: hidden !important;
      background: var(--color-bg-card) !important;
      border-radius: 10px !important;
      padding: 20px 24px !important;
      border: 1px solid var(--color-border) !important;
      box-shadow: 0 1px 3px rgba(0,0,0,.06) !important;
      transition: box-shadow 150ms ease !important;
      animation: fadeUp .45s ease both !important;
      background-image: none !important;
    }
    .d-card-no-hover::before { display: none !important; }
    .d-card-no-hover:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08) !important;
      background-color: #FAFBFF !important;
    }

    /* ── Alert Rows ─────────────────────────────────────────── */
    .alert-row {
      position: relative !important;
      overflow: hidden !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 12px 14px !important;
      background: var(--color-bg-page) !important;
      border-radius: 8px !important;
      border: 1px solid var(--color-border) !important;
      cursor: pointer !important;
      margin-bottom: 8px !important;
      transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease !important;
    }
    .alert-row::before { display: none !important; }
    .alert-row:hover {
      background: #FFFBEB !important;
      border-color: var(--color-warning) !important;
      box-shadow: 0 2px 8px rgba(217,119,6,.12) !important;
      transform: none !important;
    }

    /* ── Category / Department Rows ─────────────────────────── */
    .cat-row {
      position: relative !important;
      overflow: hidden !important;
      display: grid !important;
      grid-template-columns: 150px 1fr 70px 80px !important;
      gap: 12px !important;
      align-items: center !important;
      padding: 10px 14px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      transition: background 150ms ease !important;
    }
    .cat-row::before { display: none !important; }
    .cat-row:hover { background: #FFFBEB !important; }

    /* ── Activity Rows ──────────────────────────────────────── */
    .top-row {
      position: relative !important;
      overflow: hidden !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 10px 12px !important;
      border-radius: 6px !important;
      background: var(--color-bg-page) !important;
      border: 1px solid var(--color-border) !important;
      margin-bottom: 6px !important;
      cursor: pointer !important;
      transition: background 150ms ease, border-color 150ms ease !important;
    }
    .top-row::before { display: none !important; }
    .top-row:hover {
      background: #FFFBEB !important;
      border-color: #FCD34D !important;
    }

    /* ── Quick Action Cards ─────────────────────────────────── */
    .qa-card {
      position: relative !important;
      overflow: hidden !important;
      background: var(--color-bg-card) !important;
      border: 1px solid var(--color-border) !important;
      border-radius: 8px !important;
      padding: 16px 10px !important;
      text-align: center !important;
      cursor: pointer !important;
      transition: box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease !important;
      background-image: none !important;
    }
    .qa-card::before { display: none !important; }
    .qa-card:hover {
      border-color: var(--color-primary) !important;
      box-shadow: 0 4px 12px rgba(37,99,235,.12) !important;
      transform: translateY(-1px) !important;
      background: #EFF6FF !important;
    }

    /* ── Sub-KPI mini boxes ─────────────────────────────────── */
    .hr-kpi-mini {
      background: var(--color-bg-page) !important;
      border-radius: 8px !important;
      padding: 12px 14px !important;
      border: 1px solid var(--color-border) !important;
      transition: box-shadow 150ms ease, transform 150ms ease !important;
    }
    .hr-kpi-mini:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08) !important;
      transform: translateY(-1px) !important;
    }

    /* ── Typography Overrides ───────────────────────────────── */
    .artistic-3d-title {
      font-size: 26px !important;
      font-weight: 600 !important;
      color: var(--color-text-primary) !important;
      letter-spacing: -0.01em !important;
      text-shadow: none !important;
      margin: 0 !important;
      line-height: 1.3 !important;
    }
    .artistic-3d-subtitle {
      font-size: 13px !important;
      color: var(--color-text-secondary) !important;
      font-weight: 500 !important;
      text-transform: none !important;
      letter-spacing: 0 !important;
      text-shadow: none !important;
      margin: 0 !important;
    }
    .blink-star {
      animation: none !important;
      filter: none !important;
      transform: none !important;
      display: inline !important;
    }

    /* ── Responsiveness ─────────────────────────────────────── */
    @media (max-width: 1280px) {
      .hr-home-wrap { padding: 20px; }
    }
    @media (max-width: 1024px) {
      .hr-home-header { grid-template-columns: 1fr auto; }
      .hr-home-header > div:nth-child(2) { display: none; }
    }
    @media (max-width: 768px) {
      .hr-home-wrap { padding: 16px; }
      .hr-home-header { display: flex; justify-content: space-between; align-items: center; }
      .cat-row { grid-template-columns: 120px 1fr 55px !important; }
      .cat-row > span:last-child { display: none; }
    }
    @media (max-width: 480px) {
      .hr-home-wrap { padding: 12px; }
      .artistic-3d-title { font-size: 20px !important; }
    }
  `}</style>
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
      setActivities(logs.map((log, i) => {
        const rawAction = log.action || log.action_type || 'System Action';
        const isPositive = rawAction.includes('Clock In') || rawAction.includes('CLOCK_IN') || rawAction.includes('Created') || rawAction.includes('Approved') || rawAction.includes('Hired');
        return {
          id: log.id || log.record_id || i,
          action_type: rawAction,
          employee_id: log.user_name || log.record_identifier || log.employee_id || 'System',
          time: new Date(log.created_at || log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: isPositive ? 'hire' : 'leave',
          date_time: log.created_at || log.timestamp
        };
      }).slice(0, 6));
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
    <div style={{ margin: '-24px', padding: '24px', minHeight: 'calc(100vh - 60px)', background: '#F5F6FA', fontFamily: "'Inter','Segoe UI','Roboto',-apple-system,sans-serif", overflowX: 'hidden' }}>
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
            Universal HR Hub · It&apos;s {timeString}
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
            {['Department', '', 'Count', '%'].map((h, hi) => (
              <div key={`header-${hi}`} style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          {deptBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: G.olive, fontSize: 13 }}>No department data yet</div>
          ) : deptBreakdown.map((row, i) => {
            const c = COLORS_ARR[i % COLORS_ARR.length];
            const pct = activeCount > 0 ? Math.round((row.count / activeCount) * 100) : 0;
            return (
              <div key={`dept-${row.department || 'Unknown'}-${i}`} className="cat-row" onClick={() => nav('/hr/employees')}>
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
