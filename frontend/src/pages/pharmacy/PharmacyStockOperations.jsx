import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package, TrendingDown, Clock, AlertTriangle, RefreshCw, Box,
  Activity, Zap, Layers, FlaskConical
} from 'lucide-react';

import PharmacyInventoryView    from './PharmacyInventoryView';
import PharmacyWorkerLowStock   from './PharmacyWorkerLowStock';
import PharmacyWorkerExpiringMedicines from './PharmacyWorkerExpiringMedicines';
import ExpiredDrugReport        from './ExpiredDrugReport';

/* ─── colour tokens ─────────────────────────────────────── */
const LIME  = '#E5FBAD';   // light lime green
const PEACH = '#FEFACE';   // light peach
const DARK  = '#2A3F08';   // deep olive text / borders
const MID   = '#50760F';   // mid olive accent
const GOLD  = '#D4A843';
const GOLD2 = '#9A701E';

/* ─── tab definitions ───────────────────────────────────── */
const TABS = [
  { id: 'current',  label: 'Current Stock',  Icon: Package,       blinkColor: '#16a34a' },
  { id: 'low',      label: 'Low Stock',       Icon: TrendingDown,  blinkColor: '#dc2626' },
  { id: 'expiring', label: 'Expiring Soon',   Icon: Clock,         blinkColor: '#d97706' },
  { id: 'expired',  label: 'Expired',         Icon: AlertTriangle, blinkColor: '#9333ea' },
];

export default function PharmacyStockOperations() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTab     = searchParams.get('tab');
  const [tab, setTab]         = useState(urlTab || 'current');
  const [spinning, setSpinning] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshRef = useRef(null);

  useEffect(() => {
    if (urlTab && urlTab !== tab) setTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (t) => {
    setTab(t);
    navigate(`?tab=${t}`, { replace: true });
  };

  const handleRefresh = () => {
    setSpinning(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <div style={{
      padding: 0, margin: 0, minHeight: '100vh', width: '100%',
      background: LIME, fontFamily: "'Inter','Segoe UI',sans-serif",
      overflowX: 'hidden'
    }}>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes rowSlide { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes blink    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(1.22)} }
        @keyframes spin     { 100%{transform:rotate(360deg)} }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes pulseBar { 0%,100%{width:0%} 50%{width:100%} }
        @keyframes borderMarch {
          0%   { box-shadow: inset 4px 0 0 ${GOLD}; }
          25%  { box-shadow: inset 0 4px 0 ${GOLD}; }
          50%  { box-shadow: inset -4px 0 0 ${GOLD}; }
          75%  { box-shadow: inset 0 -4px 0 ${GOLD}; }
          100% { box-shadow: inset 4px 0 0 ${GOLD}; }
        }
        .tab-btn { transition: background .18s, color .18s, box-shadow .18s; }
        .tab-btn:hover:not(.tab-active) { background: rgba(42,63,8,.08) !important; }
        .action-btn { transition: transform .12s, box-shadow .12s; }
        .action-btn:hover { transform: translateY(-2px) !important; }
        .action-btn:active { transform: translateY(2px) !important; box-shadow: none !important; }
        .row-hover:hover { background: ${LIME} !important; }
      `}</style>

      {/* ══ TOP HEADER BAR ══════════════════════════════════ */}
      <div style={{
        background: DARK, borderBottom: `4px solid ${GOLD}`,
        padding: '0 24px', animation: 'fadeUp .3s ease'
      }}>
        {/* marching-border accent line */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${GOLD},${LIME},${PEACH},${GOLD})`,
          backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
          {/* Left – title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, background: GOLD, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${GOLD2}`, boxShadow: `4px 4px 0 ${GOLD2}`
            }}>
              <Activity size={24} color={DARK} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: LIME, margin: 0, lineHeight: 1.1 }}>
                Stock Operations
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '3px',
                textTransform: 'uppercase', color: GOLD }}>
                Manage • Track • Audit
              </p>
            </div>
          </div>

          {/* Centre – blinking stat pills */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[
              { icon: <Zap size={13}/>, label: 'LIVE DATA', color: '#4ade80' },
              { icon: <Layers size={13}/>, label: 'STOCK OPS', color: GOLD },
              { icon: <FlaskConical size={13}/>, label: 'PHARMACY', color: '#38bdf8' },
            ].map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', background: 'rgba(255,255,255,.06)',
                border: `1px solid rgba(255,255,255,.12)`, color: p.color,
                fontSize: 10, fontWeight: 800, letterSpacing: '1.5px',
                animation: `blink ${1.4 + i * 0.4}s ease-in-out infinite`
              }}>
                {p.icon} {p.label}
              </div>
            ))}
          </div>

          {/* Right – single Refresh button */}
          <button
            ref={refreshRef}
            onClick={handleRefresh}
            className="action-btn"
            style={{
              background: LIME, color: DARK, border: `3px solid ${GOLD2}`,
              padding: '10px 22px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
              boxShadow: `4px 4px 0 ${GOLD2}`, display: 'inline-flex',
              alignItems: 'center', gap: 8, textTransform: 'uppercase',
              letterSpacing: '1.5px'
            }}
          >
            <SegmentedSpinner size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ TAB BAR ═════════════════════════════════════════ */}
      <div style={{
        background: DARK, borderBottom: `4px solid ${GOLD2}`,
        padding: '0 24px', display: 'flex', gap: 0,
        animation: 'slideIn .35s ease'
      }}>
        {TABS.map(({ id, label, Icon, blinkColor }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`tab-btn${active ? ' tab-active' : ''}`}
              style={{
                flex: 1, padding: '13px 16px',
                border: 'none', borderBottom: active ? `4px solid ${GOLD}` : '4px solid transparent',
                background: active ? GOLD : 'transparent',
                color: active ? DARK : 'rgba(229,251,173,.65)',
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                boxShadow: active ? `inset 0 -4px 0 ${GOLD2}` : 'none',
              }}
            >
              <span style={active
                ? { color: DARK }
                : { animation: `blink ${1.8}s ease-in-out infinite`, color: blinkColor }
              }>
                <Icon size={15} />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ══ CONTENT AREA ════════════════════════════════════ */}
      <div style={{ padding: '0 0 32px' }}>
        <div style={{
          background: PEACH,
          border: `0 solid ${DARK}`,
          borderTop: `3px solid ${DARK}`,
          minHeight: 520,
          boxShadow: `6px 6px 0 rgba(42,63,8,.18)`,
          animation: 'fadeUp .4s ease'
        }}>
          {tab === 'current'  && <PharmacyInventoryView  hideHeader={true} themeColors={{ LIME, PEACH, DARK, GOLD, GOLD2 }} refreshTrigger={refreshTrigger} />}
          {tab === 'low'      && <PharmacyWorkerLowStock        hideHeader={true} refreshTrigger={refreshTrigger} />}
          {tab === 'expiring' && <PharmacyWorkerExpiringMedicines hideHeader={true} refreshTrigger={refreshTrigger} />}
          {tab === 'expired'  && <ExpiredDrugReport              hideHeader={true} refreshTrigger={refreshTrigger} />}
        </div>
      </div>
    </div>
  );
}
