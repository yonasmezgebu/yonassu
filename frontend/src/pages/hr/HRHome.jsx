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
  <div style={{ background: 'var(--color-border)', borderRadius: 99, height: 8, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 99, background: color || 'var(--color-primary)',
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

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

    @keyframes phFadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Edge Spacing */
    .page-wrapper {
      padding: 24px;
      box-sizing: border-box;
      width: 100%;
      min-height: calc(100vh - 60px);
      background: var(--color-bg-page);
    }
    
    @media (max-width: 1024px) { .page-wrapper { padding: 16px; } }
    @media (max-width: 768px) { .page-wrapper { padding: 12px; } }

    .so-page {
      background: var(--color-bg-page);
      color: var(--color-text-primary);
      font-family: var(--font-family);
      font-size: 14px;
      line-height: 1.5;
      margin: 0 auto;
      max-width: 1600px;
      box-sizing: border-box;
      animation: phFadeUp 0.4s ease both;
    }

    h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 0; }
    
    .so-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); }
    .so-section-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 16px; }
    
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
      background: #FFF;
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn:hover:not(:disabled) { background: #FFD700; color: #000; border-color: #FFD700; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3); }
    
    .btn-primary { background: var(--color-primary); color: #FFF; border-color: transparent; }
    .btn-primary:hover:not(:disabled) { background: #FFD700; color: #000; border-color: #FFD700; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3); }

    /* Cards */
    .d-card, .d-card-static, .d-card-no-hover {
      position: relative;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      transition: all 150ms ease-in-out;
      cursor: default;
    }
    
    .d-card:hover, .d-card-static:hover, .d-card-no-hover:hover, .qa-card:hover, .alert-row:hover, .cat-row:hover, .top-row:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
      transform: translateY(-1px);
      border-color: #FFD700;
      background: #FFFBEB;
    }

    /* ── Sub Components ─────────────────────────────────────────── */
    .alert-row {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      background: var(--color-bg-card); border-radius: 8px; border: 1px solid var(--color-border);
      cursor: pointer; margin-bottom: 8px; transition: all 150ms ease;
    }
    
    .cat-row {
      display: grid; grid-template-columns: 150px 1fr 70px 80px; gap: 12px; align-items: center;
      padding: 10px 16px; border-radius: 8px; cursor: pointer; transition: all 150ms ease; border: 1px solid transparent;
    }

    .top-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 16px;
      background: var(--color-bg-card); border-radius: 8px; border: 1px solid var(--color-border);
      margin-bottom: 8px; cursor: pointer; transition: all 150ms ease;
    }
    
    .qa-card {
      background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 8px;
      padding: 16px 12px; text-align: center; cursor: pointer; transition: all 150ms ease;
    }

    /* Layout */
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .grid-2-chart { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; margin-bottom: 24px; }
    .grid-3-split { display: grid; grid-template-columns: 0.5fr 0.5fr 1fr; gap: 16px; margin-bottom: 24px; }
    .grid-3-2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; margin-bottom: 24px; }
    .grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 24px; }
    
    @media (max-width: 1024px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr); }
      .grid-3, .grid-3-split, .grid-3-2, .grid-1-2 { grid-template-columns: 1fr; }
      .grid-2, .grid-2-chart { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .grid-4 { grid-template-columns: 1fr; }
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
    <div style={{ margin: '-24px', padding: '24px', minHeight: 'calc(100vh - 60px)', background: 'var(--color-bg-page)', fontFamily: "var(--font-family)", overflowX: 'hidden' }}>
      <GlobalStyles />

      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: 24, marginTop: 8, animation: 'phFadeUp 0.35s ease', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            🌿 Welcome, {firstName}!
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, margin: 0 }}>
            Universal HR Hub · It&apos;s {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button onClick={load} className="btn btn-primary" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1, gap: 8 }}>
            {refreshing && <SegmentedSpinner size={16} />}
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 16, marginBottom: 16, position: 'relative', zIndex: 1 }}>

        {/* Health Score Hero */}
        <div className="d-card" onClick={() => nav('/hr/employees')}
          style={{ background: `linear-gradient(135deg, ${G.forest} 0%, ${G.dark} 100%)`, color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer', borderColor: 'transparent' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 10 }}>
            <span style={{ fontSize: 22 }}>⭐</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85, marginBottom: 12 }}>Workforce Health Score</div>
          <div style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12 }}>
            {attendanceRate}<span style={{ fontSize: '1.5rem', opacity: 0.75, marginLeft: 6 }}>%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, opacity: 0.9 }}>
            <span>👋</span> Hello, {firstName} — Today&apos;s Attendance Rate
          </div>
        </div>

        {/* Total Staff */}
        <div className="d-card" style={{ cursor: 'pointer' }} onClick={() => nav('/hr/employees')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Staff</span>
            <div style={{ background: 'var(--color-success-bg)', borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>👥</span></div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>{activeCount.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Employees on payroll</div>
        </div>

        {/* Present Today */}
        <div className="d-card" style={{ cursor: 'pointer' }} onClick={() => nav('/hr/todays-activities')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present Today</span>
            <div style={{ background: 'var(--color-success-bg)', borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>✅</span></div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>{presentCount.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Currently clocked in</div>
        </div>

        {/* Pending Approvals */}
        <div className="d-card" style={{ cursor: 'pointer', borderColor: pendingCount > 0 ? 'var(--color-warning)' : undefined }} onClick={() => nav('/hr/employee-info')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: pendingCount > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Approvals</span>
            <div style={{ background: pendingCount > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)', borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>{pendingCount > 0 ? '⚠️' : '✅'}</span></div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: pendingCount > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)', marginBottom: 6 }}>{pendingCount}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{pendingCount > 0 ? 'Requires attention' : 'All caught up!'}</div>
        </div>
      </div>

      {/* ── ROW 2: DEPARTMENT BREAKDOWN + ACTIVITY FEED ── */}
      <div className="grid-3-2">

        {/* Department Breakdown */}
        <div className="d-card-no-hover">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🏢</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Department Headcount</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Across {totalDepts} departments</span>
          </div>
          {/* Sub-KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Active Depts',   val: totalDepts,   icon: '🏢', c: G.forest },
              { label: 'Total Employees', val: activeCount,  icon: '👥', c: G.orange },
              { label: 'On Leave',        val: onLeaveCount, icon: '🌴', c: G.sky    },
              { label: 'Leave Requests',  val: pendingCount, icon: '⏳', c: G.purple },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--color-bg-page)', borderRadius: 8, padding: '12px 14px', border: `1px solid ${k.c}30` }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: k.c }}>{k.val}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px 80px', gap: 12, padding: '4px 16px', marginBottom: 8 }}>
            {['Department', '', 'Count', '%'].map((h, hi) => (
              <div key={`header-${hi}`} style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {deptBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>No department data yet</div>
          ) : deptBreakdown.map((row, i) => {
            const c = COLORS_ARR[i % COLORS_ARR.length];
            const pct = activeCount > 0 ? Math.round((row.count / activeCount) * 100) : 0;
            return (
              <div key={`dept-${row.department || 'Unknown'}-${i}`} className="cat-row" onClick={() => nav('/hr/employees')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.department}</span>
                </div>
                <CategoryBar value={row.count} max={maxDeptCount} color={c} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'right' }}>{row.count}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)', textAlign: 'right' }}>{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="d-card-no-hover" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>📜</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Live Activity</span>
            </div>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }}>📉</span>No logs yet
              </div>
            ) : activities.map((l, i) => {
              const c = l.type === 'hire' ? G.emerald : G.orange;
              const icon = l.type === 'hire' ? '👋' : '🚶';
              return (
                <div key={l.id} className="top-row" onClick={() => nav('/hr/todays-activities')}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.action_type}: {l.employee_id}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c, whiteSpace: 'nowrap' }}>
                    {l.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div className="grid-1-2">

        {/* HR Alerts */}
        <div className="d-card-no-hover">
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 14 }}>⚠ Attention Required</div>
          {[
            { label: `${pendingCount} Pending Requests`, sub: `Leaves awaiting approval`, icon: '⏳', bg: 'var(--color-info-bg)', c: 'var(--color-info)', path: '/hr/employee-info' },
            { label: `${onLeaveCount} Staff on Leave`, sub: 'Currently not in office', icon: '🌴', bg: 'var(--color-warning-bg)', c: 'var(--color-warning)', path: '/hr/employee-info' }
          ].map(row => (
            <div key={row.label} className="alert-row" onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, padding: 10, borderRadius: 8 }}><span style={{ fontSize: 18 }}>{row.icon}</span></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{row.sub}</div>
              </div>
              <span style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>›</span>
            </div>
          ))}
          {/* Pending leaves mini-list */}
          {pendingLeaves.slice(0,3).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: `1px solid var(--color-border)` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-warning)', minWidth: 28 }}>{item.employee_id}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>Leave Request</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{new Date(item.start_date || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover">
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Employees',     sub: 'Directory',     icon: '👥', bg: '#E6F2EB', color: G.forest,  href: '/hr/employees' },
              { label: 'Payroll',       sub: 'Monthly',       icon: '💵', bg: '#E8F9F1', color: G.emerald, href: '/hr/monthly-payroll' },
              { label: 'Deductions',    sub: 'Manage',        icon: '🛡️', bg: '#F1F8E9', color: G.olive,   href: '/hr/deductions' },
              { label: 'Salary List',   sub: 'Records',       icon: '📄', bg: '#FFF3E0', color: G.orange,  href: '/hr/salary-list' },
              { label: 'HR Policies',   sub: 'View rules',    icon: '💼', bg: '#E1F5FE', color: G.sky,     href: '/hr/hr-policies' },
              { label: 'Announcements', sub: 'Broadcast',     icon: '🔔', bg: '#F3E5F5', color: G.purple,  href: '/hr/announcements' },
              { label: 'Requests',      sub: 'Pending items', icon: '⏳', bg: '#EFEBE9', color: G.brown,   href: '/hr/employee-info' }
            ].map((a) => (
              <div key={a.label} className="qa-card" onClick={() => nav(a.href)}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRHome;

