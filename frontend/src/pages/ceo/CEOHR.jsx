import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { useAuth } from '../../hooks/useAuth';

const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57',
  olive: '#6B8E23', brown: '#8D6E63', sky: '#87CEEB',
  orange: '#FF9800', purple: '#7C3AED', blue: '#3b82f6',
};
const COLORS_ARR = [G.forest, G.orange, G.sky, G.purple, G.emerald, G.brown, G.blue];

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: '#E5E7EB', borderRadius: 99, height: 8, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 99, background: color || '#2563EB',
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 150ms ease-in-out',
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
      to   { opacity: 1; transform: translateY(0); }
    }
    
    .hr-page-wrapper {
      padding: 10px; /* Safe edge margin desktop */
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      animation: phFadeUp 0.35s ease;
    }
    
    .hr-page-content {
      background: var(--color-bg-page);
      padding: 24px;
      margin: 0 auto;
      max-width: 1536px;
      line-height: 1.5;
      font-size: 16px;
      color: var(--color-text-primary);
    }

    h1, h2, h3, h4, h5, h6 { 
      line-height: 1.3; 
      margin: 0; 
    }

    .hr-btn {
      border-radius: 8px; height: 36px; padding: 0 16px; font-weight: 500; font-size: 14px;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      border: 1px solid var(--color-border); transition: all 150ms ease-in-out;
      background: #FFF; color: var(--color-text-primary);
    }
    .hr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .hr-btn:hover:not(:disabled) { 
      background: #FFD700; color: #000; border-color: #FFD700; 
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(234,179,8,0.3); 
    }
    
    .hr-btn-primary { 
      background: var(--color-primary); color: #FFF; border-color: transparent; 
    }
    .hr-btn-primary:hover:not(:disabled) { 
      background: #FFD700; color: #000; border-color: #FFD700; 
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(234,179,8,0.3); 
    }
    
    .hr-card {
      background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 10px;
      padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease-in-out; cursor: default;
    }
    .hr-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px);
    }
    
    .hr-alert-row {
      display: flex; align-items: center; gap: 16px; padding: 16px;
      background: var(--color-bg-card); border-radius: 8px; border: 1px solid var(--color-border);
      cursor: default; margin-bottom: 16px; transition: all 150ms ease-in-out;
    }
    
    .hr-cat-row {
      display: grid; grid-template-columns: 180px 1fr 80px 80px; gap: 16px; align-items: center;
      padding: 12px 16px; border-bottom: 1px solid var(--color-border); 
      cursor: default; transition: all 150ms ease-in-out;
    }
    .hr-cat-row:last-child {
      border-bottom: none;
    }
    
    .hr-top-row {
      display: flex; align-items: center; gap: 16px; padding: 12px 16px;
      background: var(--color-bg-card); border-radius: 8px; border: 1px solid var(--color-border);
      margin-bottom: 8px; cursor: default; transition: all 150ms ease-in-out;
    }
    
    .hr-alert-row:hover, .hr-cat-row:hover, .hr-top-row:hover {
      background: #F9FAFB; 
      box-shadow: inset 2px 0 0 var(--color-primary);
    }
    
    .hr-grid-kpi  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .hr-grid-main { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; margin-bottom: 24px; }
    .hr-grid-bot  { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px; }
    .hr-sub-kpis  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    
    .label-header {
      font-size: 14px; font-weight: 500; color: var(--color-text-muted); 
      text-transform: uppercase; letter-spacing: 0.03em; line-height: 1.3;
    }

    @media (max-width: 1024px) {
      .hr-page-wrapper { padding: 6px; }
      .hr-page-content { padding: 16px; }
      .hr-grid-kpi { grid-template-columns: repeat(2, 1fr); }
      .hr-grid-main, .hr-grid-bot { grid-template-columns: 1fr; }
      .hr-sub-kpis { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .hr-page-wrapper { padding: 4px; }
      .hr-page-content { padding: 12px; }
      .hr-grid-kpi { grid-template-columns: 1fr; }
      .hr-sub-kpis { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .hr-cat-row { grid-template-columns: 120px 1fr 60px 60px; gap: 8px; padding: 12px 8px; }
    }
  `}</style>
);

export default function CEOHR() {
  const { user } = useAuth();
  const [data, setData]           = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const tick = () =>
      setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await api.get('/ceo/hr-overview');
      setData(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load HR data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const firstName  = user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'CEO';

  const activeCount    = data?.headcount?.active           || 0;
  const presentCount   = data?.attendance?.present         || 0;
  const onLeaveCount   = data?.leaves?.approvedThisMonth   || 0;
  const pendingCount   = data?.leaves?.pendingCount        || 0;
  const pendingLeaves  = data?.leaves?.recent              || [];
  const recentHires    = data?.recentHires                 || [];
  const deptBreakdown  = data?.departments                 || [];
  const totalDepts     = deptBreakdown.length;
  const attendanceRate = activeCount > 0 ? Math.round((presentCount / activeCount) * 100) : 0;
  const maxDeptCount   = Math.max(...deptBreakdown.map(d => d.count), 1);

  return (
    <div className="hr-page-wrapper">
      <div className="hr-page-content">
        <GlobalStyles />

        {/* HEADER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: 32, gap: 16 }}>
          <div style={{ justifySelf: 'start' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              🌿 Welcome, {firstName}!
            </h1>
          </div>
          <div style={{ justifySelf: 'center' }}>
            <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', fontWeight: 500, margin: 0 }}>
              Universal HR Hub · It&apos;s {timeString}
            </p>
          </div>
          <div style={{ justifySelf: 'end' }}>
            <button onClick={load} className="hr-btn hr-btn-primary" disabled={refreshing}>
              {refreshing && <SegmentedSpinner size={16} />}
              <span>SYNC</span>
            </button>
          </div>
        </div>

        {/* LOADING */}
        {refreshing && !data && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 16 }}>
            <SegmentedSpinner size={40} color="var(--color-primary)" />
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 16, fontWeight: 500 }}>Loading Workforce Data…</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 10, padding: 24, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Failed to load HR data</div>
              <div style={{ fontSize: 16, opacity: 0.9 }}>{error}</div>
              <button onClick={load} className="hr-btn" style={{ marginTop: 12 }}>Retry</button>
            </div>
          </div>
        )}

        {/* MAIN DASHBOARD */}
        {!error && data && (
          <>
            {/* ── ROW 1: KPI HERO CARDS ── */}
            <div className="hr-grid-kpi">

              {/* Health Score Hero */}
              <div className="hr-card"
                style={{ background: `linear-gradient(135deg, ${G.forest} 0%, ${G.dark} 100%)`, color: 'white', position: 'relative', overflow: 'hidden', borderColor: 'transparent' }}>
                <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 22 }}>⭐</span>
                </div>
                <div className="label-header" style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 12 }}>Workforce Health Score</div>
                <div style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 16 }}>
                  {attendanceRate}<span style={{ fontSize: '1.5rem', opacity: 0.75, marginLeft: 6 }}>%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, opacity: 0.9 }}>
                  <span>👋</span> Hello, {firstName} — Today&apos;s Attendance
                </div>
              </div>

              {/* Total Staff */}
              <div className="hr-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="label-header">Total Staff</span>
                  <div style={{ background: 'var(--color-success-bg)', borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>👥</span></div>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6, lineHeight: 1 }}>{activeCount.toLocaleString()}</div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Employees on payroll</div>
              </div>

              {/* Present Today */}
              <div className="hr-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="label-header">Present Today</span>
                  <div style={{ background: 'var(--color-success-bg)', borderRadius: 8, padding: 8 }}><span style={{ fontSize: 18 }}>✅</span></div>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6, lineHeight: 1 }}>{presentCount.toLocaleString()}</div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Currently clocked in</div>
              </div>

              {/* Pending Approvals */}
              <div className="hr-card" style={{ borderColor: pendingCount > 0 ? 'var(--color-warning)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="label-header" style={{ color: pendingCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>Pending Approvals</span>
                  <div style={{ background: pendingCount > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)', borderRadius: 8, padding: 8 }}>
                    <span style={{ fontSize: 18 }}>{pendingCount > 0 ? '⚠️' : '✅'}</span>
                  </div>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: pendingCount > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)', marginBottom: 6, lineHeight: 1 }}>{pendingCount}</div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{pendingCount > 0 ? 'Requires attention' : 'All caught up!'}</div>
              </div>
            </div>

            {/* ── ROW 2: DEPARTMENTS + RECENT HIRES ── */}
            <div className="hr-grid-main">

              {/* Dept Breakdown */}
              <div className="hr-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <span style={{ fontSize: 24 }}>🏢</span>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>Department Headcount</h2>
                  <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Across {totalDepts} depts</span>
                </div>
                <div className="hr-sub-kpis">
                  {[
                    { label: 'Active Depts',    val: totalDepts,   icon: '🏢', c: G.forest },
                    { label: 'Total Employees', val: activeCount,  icon: '👥', c: G.orange },
                    { label: 'On Leave',        val: onLeaveCount, icon: '🌴', c: G.sky    },
                    { label: 'Leave Requests',  val: pendingCount, icon: '⏳', c: G.purple },
                  ].map(k => (
                    <div key={k.label} style={{ background: 'var(--color-bg-page)', borderRadius: 8, padding: '16px', border: `1px solid ${k.c}30` }}>
                      <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: k.c }}>{k.val}</div>
                      <div className="label-header" style={{ marginTop: 6, fontSize: 12 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 80px', gap: 16, padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid var(--color-border)', borderRadius: '8px 8px 0 0' }}>
                  {['Department', '', 'Count', '%'].map((h, i) => (
                    <div key={i} className="label-header" style={{ textAlign: (h === 'Count' || h === '%') ? 'right' : 'left' }}>{h}</div>
                  ))}
                </div>
                {deptBreakdown.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>No department data yet</div>
                ) : deptBreakdown.map((row, i) => {
                  const c = COLORS_ARR[i % COLORS_ARR.length];
                  const pct = activeCount > 0 ? Math.round((row.count / activeCount) * 100) : 0;
                  return (
                    <div key={i} className="hr-cat-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: c, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.department}</span>
                      </div>
                      <CategoryBar value={row.count} max={maxDeptCount} color={c} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' }}>{row.count}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-success)', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Recent Hires */}
              <div className="hr-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <span style={{ fontSize: 24 }}>🚀</span>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>Recent Hires</h2>
                </div>
                {recentHires.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
                    <span style={{ fontSize: 32, display: 'block', marginBottom: 12, opacity: 0.4 }}>📭</span>No recent hires
                  </div>
                ) : recentHires.slice(0, 7).map((hire, i) => (
                  <div key={hire.id || i} className="hr-top-row">
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: `${G.emerald}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                      👋
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hire.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{hire.role} · {hire.dept}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: G.emerald, whiteSpace: 'nowrap' }}>
                      {hire.hireDate ? new Date(hire.hireDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ROW 3: ALERTS ── */}
            <div className="hr-grid-bot">

              {/* Alerts */}
              <div className="hr-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <span style={{ fontSize: 24 }}>⚠</span>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>Attention Required</h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {[
                    { label: `${pendingCount} Pending Requests`, sub: 'Leaves awaiting approval', icon: '⏳', bg: 'var(--color-info-bg)' },
                    { label: `${onLeaveCount} Staff on Leave`,   sub: 'Currently not in office',  icon: '🌴', bg: 'var(--color-warning-bg)' },
                  ].map(row => (
                    <div key={row.label} className="hr-alert-row">
                      <div style={{ background: row.bg, padding: 12, borderRadius: 8 }}><span style={{ fontSize: 24 }}>{row.icon}</span></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.label}</div>
                        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>{row.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {pendingLeaves.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div className="label-header" style={{ marginBottom: 16 }}>Recent Leaves</div>
                    {pendingLeaves.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 12px', borderTop: '1px solid var(--color-border)', transition: 'all 150ms ease' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-warning)', minWidth: 32 }}>{item.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.type || 'Leave Request'}</span>
                        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                          {item.start_date ? new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
