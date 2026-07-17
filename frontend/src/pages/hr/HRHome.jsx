import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';
import { formatNumber } from '../../utils/formatters';
import {
  Users, UserCheck, Umbrella, Building2, AlertCircle,
  CheckCircle2, ChevronRight, TrendingUp, Clock, Briefcase,
  FileText, Bell, DollarSign, ArrowUpRight, Zap, Star,
  Activity, Calendar, Shield
} from 'lucide-react';

/* ─── Keyframe injection ─── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

@keyframes hrFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hrSlideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes hrScaleIn {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes hrPulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: .7; transform: scale(1.15); }
}
@keyframes hrShimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes hrCountUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hrWelcomeFadeIn {
  0%   { opacity: 0; transform: translateY(16px) scale(0.97); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0px) scale(1);    filter: blur(0px); }
}
@keyframes hrWelcomeFadeOut {
  0%   { opacity: 1; transform: translateY(0px) scale(1);    filter: blur(0px); }
  100% { opacity: 0; transform: translateY(-16px) scale(0.97); filter: blur(4px); }
}
@keyframes hrCursorBlink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0; }
}
@keyframes hrGlowPulse {
  0%,100% { text-shadow: 0 0 20px rgba(165,180,252,0.4), 0 0 40px rgba(129,140,248,0.2); }
  50%      { text-shadow: 0 0 40px rgba(165,180,252,0.8), 0 0 80px rgba(129,140,248,0.5); }
}
@keyframes hrOrbit {
  0%   { transform: rotate(0deg)   translateX(60px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
}
@keyframes hrFloat {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
}
@keyframes hrGlow {
  0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
  50%      { box-shadow: 0 0 40px rgba(99,102,241,0.6); }
}
@keyframes hrProgressFill {
  from { width: 0%; }
  to   { width: var(--target-w); }
}
@keyframes hrBarGrow {
  from { height: 0%; }
  to   { height: var(--target-h); }
}
@keyframes hrSparkle {
  0%   { transform: scale(0) rotate(0deg); opacity: 0; }
  50%  { transform: scale(1) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}
@keyframes hrBounce {
  0%,100% { transform: translateY(0); }
  40%      { transform: translateY(-6px); }
  60%      { transform: translateY(-3px); }
}
.hr-stat-card:hover { transform: translateY(-5px) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important; }
.hr-stat-card { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1) !important; }
.hr-quick-link:hover { transform: translateY(-4px) scale(1.03) !important; }
.hr-quick-link { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important; }
.hr-dept-pill:hover { transform: scale(1.06) !important; filter: brightness(1.05) !important; }
.hr-dept-pill { transition: all 0.25s ease !important; }
.hr-welcome-in  { animation: hrWelcomeFadeIn  0.7s cubic-bezier(0.22,1,0.36,1) both !important; }
.hr-welcome-out { animation: hrWelcomeFadeOut 0.5s cubic-bezier(0.55,0,0.45,1) both !important; }
.hr-welcome-glow { animation: hrGlowPulse 3s ease-in-out infinite !important; }
.hr-action-row:hover { background: #f0f9ff !important; border-color: #38bdf8 !important; transform: translateX(4px) !important; }
.hr-action-row { transition: all 0.2s ease !important; }
`;

/* ─── Welcome text cycle with fade-in / fade-out ─── */
const WELCOME_PHRASES = [
  'Welcome to your portal!',
  'Ready to manage your team?',
  'Your HR hub awaits.',
  "Let's make today count!",
];

function WelcomeText() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    let timer;
    if (phase === 'in') {
      // After fade-in (0.7s) → hold for 2.8s
      timer = setTimeout(() => setPhase('hold'), 700);
    } else if (phase === 'hold') {
      timer = setTimeout(() => setPhase('out'), 2800);
    } else if (phase === 'out') {
      // After fade-out (0.5s) → advance to next phrase
      timer = setTimeout(() => {
        setIdx(i => (i + 1) % WELCOME_PHRASES.length);
        setPhase('in');
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [phase]);

  const cls = phase === 'out' ? 'hr-welcome-out' : 'hr-welcome-in';

  return (
    <span
      key={idx}
      className={`hr-welcome-glow ${cls}`}
      style={{
        display: 'inline-block',
        background: 'linear-gradient(90deg, #a5b4fc, #818cf8, #c4b5fd, #f0abfc)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {WELCOME_PHRASES[idx]}
      <span
        style={{
          display: 'inline-block',
          width: 3,
          height: '0.85em',
          background: '#a5b4fc',
          marginLeft: 4,
          verticalAlign: 'middle',
          borderRadius: 2,
          animation: 'hrCursorBlink 1.1s step-end infinite',
        }}
      />
    </span>
  );
}

/* ─── Animated number counter ─── */
function AnimatedNumber({ target, duration = 1200, prefix = '', suffix = '' }) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return <span>{prefix}{current.toLocaleString()}{suffix}</span>;
}

/* ─── Circular progress ring ─── */
function RingProgress({ pct, size = 80, stroke = 7, color = '#6366f1' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDash((pct / 100) * circ), 300);
    return () => clearTimeout(t);
  }, [pct, circ]);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

/* ─── Mini sparkline bar chart ─── */
function SparkBars({ data = [40,65,50,80,60,90,70], color = '#6366f1' }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: color, borderRadius: 3,
          height: `${(v / max) * 100}%`,
          opacity: i === data.length - 1 ? 1 : 0.45 + (i / data.length) * 0.4,
          animation: `hrBarGrow 0.6s ease ${i * 0.08}s both`,
          '--target-h': `${(v / max) * 100}%`,
        }} />
      ))}
    </div>
  );
}

const HRHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
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
          text: `${log.action_type === 'CLOCK_IN' ? 'Clocked in' : 'Clocked out'} — ${log.employee_id}`,
          time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: log.action_type === 'CLOCK_IN' ? 'hire' : 'leave'
        })).slice(0, 6));
        const lvData = leavesRes?.data?.leaves || leavesRes?.leaves || [];
        setPendingLeaves(lvData);
      } catch (err) {
        console.error('Failed to fetch HR dashboard data:', err);
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 80);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <style>{STYLE}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15, fontFamily: 'Inter,sans-serif' }}>Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  const data = summary || {};
  const activeCount   = parseInt(data.activeEmployees) || 0;
  const presentCount  = parseInt(data.presentToday)   || 0;
  const attendanceRate = activeCount > 0 ? Math.round((presentCount / activeCount) * 100) : 0;
  const onLeaveCount  = parseInt(data.onLeaveCount)   || 0;
  const totalDepts    = (data.departmentBreakdown || []).length || 0;
  const pendingCount  = parseInt(data.pendingLeaves)  || pendingLeaves.length;
  const firstName = user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Manager';

  const deptColors = [
    { bg: 'linear-gradient(135deg,#6366f1,#818cf8)', light: 'rgba(99,102,241,0.15)' },
    { bg: 'linear-gradient(135deg,#10b981,#34d399)', light: 'rgba(16,185,129,0.15)' },
    { bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', light: 'rgba(245,158,11,0.15)' },
    { bg: 'linear-gradient(135deg,#ef4444,#f87171)', light: 'rgba(239,68,68,0.15)' },
    { bg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', light: 'rgba(139,92,246,0.15)' },
    { bg: 'linear-gradient(135deg,#06b6d4,#22d3ee)', light: 'rgba(6,182,212,0.15)' },
    { bg: 'linear-gradient(135deg,#ec4899,#f472b6)', light: 'rgba(236,72,153,0.15)' },
  ];

  const quickLinks = [
    { label: 'Employees',    icon: Users,       path: '/hr/employees',       grad: 'linear-gradient(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.4)'  },
    { label: 'Payroll',      icon: DollarSign,  path: '/hr/monthly-payroll', grad: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.4)'  },
    { label: 'Deductions',   icon: Shield,      path: '/hr/deductions',      grad: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.4)'  },
    { label: 'Salary List',  icon: FileText,    path: '/hr/salary-list',     grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.4)'  },
    { label: 'Policies',     icon: Briefcase,   path: '/hr/hr-policies',     grad: 'linear-gradient(135deg,#06b6d4,#0891b2)', glow: 'rgba(6,182,212,0.4)'   },
    { label: 'Announcements',icon: Bell,        path: '/hr/announcements',   grad: 'linear-gradient(135deg,#ec4899,#db2777)', glow: 'rgba(236,72,153,0.4)'  },
  ];

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter',sans-serif", overflowX: 'hidden' }}>
      <style>{STYLE}</style>

      {/* ══════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 65%, #4f46e5 100%)',
        padding: '48px 40px 80px',
        overflow: 'hidden',
        animation: visible ? 'hrFadeUp 0.6s ease both' : 'none',
      }}>
        {/* Grid texture */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

        {/* Glowing orbs */}
        <div style={{ position:'absolute', top:-80, right:-60, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.35) 0%,transparent 70%)', pointerEvents:'none', animation:'hrFloat 6s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:-100, left:100, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.25) 0%,transparent 70%)', pointerEvents:'none', animation:'hrFloat 8s ease-in-out 2s infinite' }} />
        <div style={{ position:'absolute', top:30, left:'40%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(236,72,153,0.15) 0%,transparent 70%)', pointerEvents:'none', animation:'hrFloat 7s ease-in-out 1s infinite' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:24 }}>
          <div style={{ animation: visible ? 'hrSlideIn 0.6s ease 0.1s both' : 'none' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:20, padding:'5px 16px', marginBottom:16, backdropFilter:'blur(8px)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#a5f3fc', display:'inline-block', boxShadow:'0 0 8px #a5f3fc', animation:'hrPulse 2s ease-in-out infinite' }} />
              <span style={{ color:'#e0f2fe', fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>HR Command Center</span>
            </div>
            <h1 style={{ margin:'0 0 10px', fontSize:42, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1.2 }}>
              <WelcomeText />
              <br/>
              <span style={{ fontSize:28, fontWeight:600, color:'rgba(255,255,255,0.6)', letterSpacing:'-0.01em' }}>
                Hi, <span style={{ color:'#fff', fontWeight:800 }}>{firstName}</span> 👋
              </span>
            </h1>
            <p style={{ margin:0, color:'rgba(196,181,253,0.85)', fontSize:16, fontWeight:400 }}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>

          {/* Hero stats chips */}
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', animation: visible ? 'hrFadeUp 0.6s ease 0.25s both' : 'none' }}>
            {[
              { label:'Total Staff',   val: activeCount,    icon:'👥', bg:'rgba(99,102,241,0.3)'  },
              { label:'Present Today', val: presentCount,   icon:'✅', bg:'rgba(16,185,129,0.3)'  },
              { label:'On Leave',      val: onLeaveCount,   icon:'🌴', bg:'rgba(245,158,11,0.3)'  },
              { label:'Pending',       val: pendingCount,   icon:'⏳', bg:'rgba(239,68,68,0.3)'   },
            ].map((chip, i) => (
              <div key={i} style={{ background: chip.bg, backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'14px 20px', minWidth:110, animation: visible ? `hrScaleIn 0.5s ease ${0.15 + i * 0.08}s both` : 'none' }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{chip.icon}</div>
                <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1 }}>
                  <AnimatedNumber target={chip.val} duration={1000 + i * 150} />
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:600, marginTop:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{chip.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAIN CONTENT (pulled up over hero)
      ══════════════════════════════════════════ */}
      <div style={{ padding:'0 32px 48px', marginTop:'-44px', position:'relative', zIndex:2 }}>

        {/* ── STAT CARDS ROW ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20, marginBottom:32 }}>

          {/* Card 1 – Total Employees */}
          <div className="hr-stat-card" onClick={() => navigate('/hr/employees')}
            style={{ background:'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)', borderRadius:24, padding:28, cursor:'pointer', boxShadow:'0 8px 32px rgba(99,102,241,0.35)', position:'relative', overflow:'hidden', animation: visible ? 'hrFadeUp 0.5s ease 0.3s both' : 'none' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
            <div style={{ position:'absolute', bottom:-30, left:-10, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Users size={24} color="#fff" />
                </div>
                <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'4px 10px', display:'flex', alignItems:'center', gap:4 }}>
                  <TrendingUp size={12} color="#a5f3fc" />
                  <span style={{ color:'#a5f3fc', fontSize:11, fontWeight:700 }}>Active</span>
                </div>
              </div>
              <div style={{ fontSize:40, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:6 }}>
                <AnimatedNumber target={activeCount} duration={1200} />
              </div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600 }}>Total Employees</div>
              <SparkBars data={[55,62,58,70,65,80,activeCount > 0 ? 100 : 70]} color="rgba(255,255,255,0.6)" />
            </div>
          </div>

          {/* Card 2 – Attendance */}
          <div className="hr-stat-card"
            style={{ background:'linear-gradient(135deg,#10b981 0%,#059669 100%)', borderRadius:24, padding:28, boxShadow:'0 8px 32px rgba(16,185,129,0.35)', position:'relative', overflow:'hidden', animation: visible ? 'hrFadeUp 0.5s ease 0.38s both' : 'none' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <UserCheck size={24} color="#fff" />
                </div>
                <div style={{ position:'relative' }}>
                  <RingProgress pct={attendanceRate} size={64} stroke={6} color="rgba(255,255,255,0.9)" />
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                    {attendanceRate}%
                  </div>
                </div>
              </div>
              <div style={{ fontSize:40, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:6 }}>
                <AnimatedNumber target={presentCount} duration={1100} suffix=" staff" />
              </div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600 }}>Present Today</div>
              <div style={{ marginTop:14, height:5, background:'rgba(255,255,255,0.2)', borderRadius:10, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:10, background:'rgba(255,255,255,0.9)', width:`${attendanceRate}%`, transition:'width 1.4s cubic-bezier(0.4,0,0.2,1) 0.5s' }} />
              </div>
            </div>
          </div>

          {/* Card 3 – On Leave */}
          <div className="hr-stat-card"
            style={{ background:'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', borderRadius:24, padding:28, boxShadow:'0 8px 32px rgba(245,158,11,0.35)', position:'relative', overflow:'hidden', animation: visible ? 'hrFadeUp 0.5s ease 0.46s both' : 'none' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Umbrella size={24} color="#fff" />
                </div>
                <span style={{ fontSize:28 }}>🌴</span>
              </div>
              <div style={{ fontSize:40, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:6 }}>
                <AnimatedNumber target={onLeaveCount} duration={1000} />
              </div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600 }}>On Leave Today</div>
              <div style={{ marginTop:10, color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600 }}>
                Across {totalDepts} department{totalDepts !== 1 ? 's' : ''}
              </div>
              <SparkBars data={[30,45,35,50,42,55,onLeaveCount > 0 ? 80 : 40]} color="rgba(255,255,255,0.6)" />
            </div>
          </div>

          {/* Card 4 – Pending Approvals */}
          <div className="hr-stat-card" onClick={() => navigate('/hr/employee-info')}
            style={{ background:'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', borderRadius:24, padding:28, cursor:'pointer', boxShadow:'0 8px 32px rgba(239,68,68,0.35)', position:'relative', overflow:'hidden', animation: visible ? 'hrFadeUp 0.5s ease 0.54s both' : 'none' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
            {pendingCount > 0 && (
              <div style={{ position:'absolute', top:16, right:16, width:10, height:10, borderRadius:'50%', background:'#fef08a', boxShadow:'0 0 12px #fef08a', animation:'hrPulse 1.5s ease-in-out infinite' }} />
            )}
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <AlertCircle size={24} color="#fff" />
                </div>
                <ArrowUpRight size={20} color="rgba(255,255,255,0.7)" />
              </div>
              <div style={{ fontSize:40, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:6 }}>
                <AnimatedNumber target={pendingCount} duration={900} />
              </div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600 }}>Pending Approvals</div>
              <div style={{ marginTop:10, color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600 }}>
                {pendingCount > 0 ? '⚡ Requires your attention' : '✅ All caught up!'}
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK NAVIGATION LINKS ── */}
        <div style={{ background:'#fff', borderRadius:24, padding:'28px 32px', marginBottom:28, boxShadow:'0 4px 24px rgba(0,0,0,0.05)', animation: visible ? 'hrFadeUp 0.5s ease 0.6s both' : 'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Zap size={16} color="#fff" />
              </div>
              Quick Access
            </h2>
            <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>All HR Sections</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:16 }}>
            {quickLinks.map((ql, i) => {
              const Icon = ql.icon;
              return (
                <div key={i} className="hr-quick-link" onClick={() => navigate(ql.path)}
                  style={{ background: ql.grad, borderRadius:18, padding:'20px 16px', cursor:'pointer', textAlign:'center', boxShadow:`0 6px 20px ${ql.glow}`, animation: visible ? `hrScaleIn 0.4s ease ${0.65 + i * 0.07}s both` : 'none', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-15, right:-15, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
                  <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <Icon size={22} color="#fff" />
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{ql.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── LOWER GRID ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:24 }}>

          {/* LEFT: Departments + Pending Leaves */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

            {/* Department Breakdown */}
            <div style={{ background:'#fff', borderRadius:24, padding:'28px 32px', boxShadow:'0 4px 24px rgba(0,0,0,0.05)', animation: visible ? 'hrFadeUp 0.5s ease 0.7s both' : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Building2 size={16} color="#fff" />
                  </div>
                  Department Headcount
                </h2>
                <button onClick={() => navigate('/hr/employees')}
                  style={{ background:'#eff6ff', border:'none', color:'#4f46e5', fontWeight:700, fontSize:13, cursor:'pointer', padding:'7px 14px', borderRadius:10, display:'flex', alignItems:'center', gap:5, transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#e0e7ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; }}>
                  View All <ArrowUpRight size={14} />
                </button>
              </div>

              {data.departmentBreakdown && data.departmentBreakdown.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {data.departmentBreakdown.map((dept, idx) => {
                    const dc = deptColors[idx % deptColors.length];
                    const pct = activeCount > 0 ? Math.round((dept.count / activeCount) * 100) : 0;
                    return (
                      <div key={idx} className="hr-dept-pill"
                        style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 20px', background:'#f8fafc', borderRadius:14, cursor:'default', animation: visible ? `hrSlideIn 0.4s ease ${0.75 + idx * 0.06}s both` : 'none' }}>
                        <div style={{ width:42, height:42, borderRadius:12, background: dc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 12px ${dc.light}` }}>
                          <Building2 size={18} color="#fff" />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                            <span style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>{dept.department}</span>
                            <span style={{ fontWeight:800, color:'#1e293b', fontSize:15 }}>{dept.count}</span>
                          </div>
                          <div style={{ height:6, background:'#e2e8f0', borderRadius:10, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:10, background: dc.bg, width:`${pct}%`, transition:`width 1.2s cubic-bezier(0.4,0,0.2,1) ${0.8 + idx * 0.1}s` }} />
                          </div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:'#64748b', flexShrink:0 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'32px', color:'#94a3b8', fontSize:14, background:'#f8fafc', borderRadius:16 }}>
                  No department data available yet.
                </div>
              )}
            </div>

            {/* Pending Leave Requests */}
            <div style={{ background:'#fff', borderRadius:24, padding:'28px 32px', boxShadow:'0 4px 24px rgba(0,0,0,0.05)', animation: visible ? 'hrFadeUp 0.5s ease 0.8s both' : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <AlertCircle size={16} color="#fff" />
                  </div>
                  Leave Requests
                  {pendingCount > 0 && (
                    <span style={{ background:'#fee2e2', color:'#dc2626', fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20, animation:'hrPulse 2s ease-in-out infinite' }}>
                      {pendingCount} Pending
                    </span>
                  )}
                </h2>
                <button onClick={() => navigate('/hr/employee-info')}
                  style={{ background:'#fff7ed', border:'none', color:'#d97706', fontWeight:700, fontSize:13, cursor:'pointer', padding:'7px 14px', borderRadius:10, display:'flex', alignItems:'center', gap:5 }}>
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pendingLeaves.length > 0 ? pendingLeaves.slice(0, 5).map((item, i) => (
                  <div key={i} className="hr-action-row"
                    onClick={() => navigate('/hr/employee-info')}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', border:'1px solid #e2e8f0', borderRadius:14, cursor:'pointer', background:'#fff', animation: visible ? `hrSlideIn 0.4s ease ${0.85 + i * 0.07}s both` : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Calendar size={16} color="#d97706" />
                      </div>
                      <div>
                        <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>Leave Request — {item.employee_id}</div>
                        <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginTop:2 }}>
                          {new Date(item.start_date || new Date()).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ background:'#fef3c7', color:'#d97706', padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em' }}>Pending</span>
                      <ChevronRight size={16} color="#cbd5e1" />
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign:'center', padding:'28px', background:'#f0fdf4', borderRadius:16, border:'1px dashed #86efac' }}>
                    <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom:10 }} />
                    <p style={{ margin:0, fontWeight:700, color:'#166534', fontSize:14 }}>All caught up! No pending requests.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Activity Feed + Stats Summary */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

            {/* Activity Timeline */}
            <div style={{ background:'#fff', borderRadius:24, padding:'28px', boxShadow:'0 4px 24px rgba(0,0,0,0.05)', flex:1, animation: visible ? 'hrFadeUp 0.5s ease 0.75s both' : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Activity size={16} color="#fff" />
                  </div>
                  Live Activity
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'hrPulse 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize:11, fontWeight:700, color:'#10b981' }}>LIVE</span>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:0, position:'relative' }}>
                <div style={{ position:'absolute', left:19, top:0, bottom:0, width:2, background:'linear-gradient(to bottom, #6366f1, transparent)', opacity:0.2, borderRadius:2 }} />
                {activities.length > 0 ? activities.map((act, idx) => {
                  const isIn = act.type === 'hire';
                  const color = isIn ? '#10b981' : '#f59e0b';
                  const bg = isIn ? '#dcfce7' : '#fef3c7';
                  return (
                    <div key={act.id} style={{ display:'flex', gap:14, position:'relative', zIndex:1, paddingBottom: idx < activities.length - 1 ? 20 : 0, animation: visible ? `hrSlideIn 0.4s ease ${0.8 + idx * 0.08}s both` : 'none' }}>
                      <div style={{ width:38, height:38, borderRadius:'50%', background: bg, border:`3px solid #fff`, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Clock size={15} color={color} />
                      </div>
                      <div style={{ paddingTop:8, flex:1, minWidth:0 }}>
                        <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{act.text}</p>
                        <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{act.time}</span>
                      </div>
                      <div style={{ paddingTop:8, flexShrink:0 }}>
                        <span style={{ fontSize:10, fontWeight:800, color: color, background: bg, padding:'3px 8px', borderRadius:8, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                          {isIn ? 'In' : 'Out'}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8', fontSize:13 }}>
                    <Clock size={28} color="#cbd5e1" style={{ marginBottom:10 }} />
                    <p style={{ margin:0, fontWeight:600 }}>No activity recorded today.</p>
                  </div>
                )}
              </div>

              <button onClick={() => navigate('/hr/todays-activities')}
                style={{ width:'100%', marginTop:20, padding:'13px', background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', border:'1px solid #e2e8f0', borderRadius:12, color:'#475569', fontWeight:700, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg,#eff6ff,#e0e7ff)'; e.currentTarget.style.color='#4f46e5'; e.currentTarget.style.borderColor='#c7d2fe'; }}
                onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg,#f8fafc,#f1f5f9)'; e.currentTarget.style.color='#475569'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                Full Activity Log <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Summary Stats panel */}
            <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#312e81 100%)', borderRadius:24, padding:'28px', boxShadow:'0 8px 32px rgba(15,23,42,0.3)', position:'relative', overflow:'hidden', animation: visible ? 'hrFadeUp 0.5s ease 0.9s both' : 'none' }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(99,102,241,0.2)', pointerEvents:'none', animation:'hrFloat 5s ease-in-out infinite' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <Star size={18} color="#fbbf24" />
                  <span style={{ fontSize:14, fontWeight:800, color:'#fff', letterSpacing:'0.02em' }}>Workforce Health Score</span>
                </div>
                <div style={{ fontSize:54, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:6 }}>
                  <AnimatedNumber target={attendanceRate} duration={1300} suffix="%" />
                </div>
                <div style={{ color:'rgba(165,180,252,0.8)', fontSize:13, fontWeight:600, marginBottom:20 }}>
                  Today's Attendance Rate
                </div>
                {[
                  { label:'Depts Active', val: totalDepts,   color:'#a5b4fc' },
                  { label:'On Payroll',   val: activeCount,  color:'#6ee7b7' },
                  { label:'On Leave',     val: onLeaveCount, color:'#fcd34d' },
                ].map((s, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)', fontWeight:600 }}>{s.label}</span>
                    <span style={{ fontSize:18, fontWeight:800, color: s.color }}>
                      <AnimatedNumber target={s.val} duration={1100 + i * 100} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRHome;
