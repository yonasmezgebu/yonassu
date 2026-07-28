import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Truck, Leaf, ChevronUp, ChevronDown, Package, RefreshCw } from 'lucide-react';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED',
};

const DEPARTMENTS = ['Printing', 'Car Rental', 'AgriRent', 'IT', 'Maintenance'];
const CATEGORIES  = ['Paper', 'Ink', 'Toner', 'Fuel', 'Lubricant/Oil', 'Spare Parts', 'Tires', 'Cleaning', 'Stationery', 'Chemical', 'Other'];

const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─── Shared UI ─────────────────────────────────────────────────────────── */
const Btn = ({ children, color = G.emerald, onClick, disabled, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: color, color: '#fff', border: 'none',
    borderRadius: 0, padding: small ? '6px 14px' : '10px 22px',
    fontWeight: 900, fontSize: small ? 12 : 14, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, boxShadow: `4px 4px 0 ${color}99`, textTransform: 'uppercase', letterSpacing: 0.5,
  }}>{children}</button>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <input {...props} style={{ width: '100%', padding: '10px 14px', border: `3px solid ${G.sage}`, borderRadius: 0, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', boxShadow: `3px 3px 0 ${G.sage}` }} />
  </div>
);

const Sel = ({ label, value, onChange, options, allowCustom }) => {
  const [custom, setCustom] = useState(false);
  const isOther = value && !DEPARTMENTS.concat(options || []).includes(value);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      {(!custom && !isOther) ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={value} onChange={onChange} style={{ flex: 1, padding: '10px 14px', border: `3px solid ${G.sage}`, borderRadius: 0, fontSize: 14, boxShadow: `3px 3px 0 ${G.sage}` }}>
            <option value="">-- select --</option>
            {(options || DEPARTMENTS).map(d => <option key={d}>{d}</option>)}
          </select>
          {allowCustom && <Btn small color={G.olive} onClick={() => setCustom(true)}>+ Custom</Btn>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={value} onChange={onChange} placeholder="Type department name..." style={{ flex: 1, padding: '10px 14px', border: `3px solid ${G.sage}`, borderRadius: 0, fontSize: 14 }} />
          <Btn small color={G.brown} onClick={() => { setCustom(false); onChange({ target: { value: '' } }); }}>✕</Btn>
        </div>
      )}
    </div>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background: '#fff', borderRadius: 0, padding: 24, border: `3px solid ${G.sage}`, boxShadow: `6px 6px 0 ${G.sage}`, ...style }}>{children}</div>
);

const DeptBadge = ({ dept }) => {
  const colors = { Printing: G.forest, 'Car Rental': G.sky, AgriRent: G.lime, Sales: G.orange, Retail: G.purple, IT: G.emerald, Maintenance: G.brown };
  const c = colors[dept] || G.olive;
  return <span style={{ background: c, color: '#fff', padding: '4px 10px', borderRadius: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>{dept}</span>;
};

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
    .btn-3d { background:linear-gradient(135deg, #ffffff, #e6f2eb); color:#1B5E20; border:2px solid #228B22; border-radius:14px; padding:10px 24px; font-weight:900; font-size:14px; cursor:pointer; box-shadow:0px 5px 0px #228B22, 0px 8px 15px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1); transition:all 0.1s cubic-bezier(0.4, 0, 0.2, 1); display:inline-flex; align-items:center; justify-content:center; gap:8px; text-transform:uppercase; letter-spacing:1.5px; margin:0; }
    .btn-3d:active { transform:translateY(6px); box-shadow:0px 0px 0px #228B22, 0px 2px 5px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1); }
    .btn-3d:hover { filter:brightness(1.05); }
    .btn-text-3d { text-shadow:1px 1px 0px rgba(255,255,255,0.8); }

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
    
    .cat-row { position:relative; overflow:hidden; display:grid; grid-template-columns:150px 1fr 70px 80px 120px; gap:12px; align-items:center; padding:11px 14px; border-radius:0; transition:background 0.2s; cursor:pointer; }
    .cat-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,0,0.2), rgba(0,255,255,0.2), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .cat-row:hover { background:rgba(230,242,235,0.6); box-shadow:0 2px 8px rgba(0,80,120,0.05); }
    .cat-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
    
    .grand-row { position:relative; overflow:hidden; display:grid; grid-template-columns:150px 1fr 70px 80px 120px; gap:12px; align-items:center; padding:14px; border-radius:0; background:rgba(46,139,87,0.12); border:1.5px solid rgba(46,139,87,0.3); margin-top:8px; cursor:pointer; transition:all 0.3s; }
    .grand-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(46,139,87,0.4), rgba(46,139,87,0.4), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
    .grand-row:hover { background:rgba(46,139,87,0.25); box-shadow:0 4px 12px rgba(0,80,120,0.1); }
    .grand-row:hover::before { animation: laserSweep 0.7s ease-in-out; }
    
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

/* ─── 1. HOME ───────────────────────────────────────────────────────────── */
export const GSHome = () => {
  const [stats, setStats] = useState(null);
  const [logs,  setLogs]  = useState([]);
  const [mats,  setMats]  = useState([]);
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
      const [rStats, rLogs, rMats] = await Promise.allSettled([
        api.get('/api/v1/printing-assets/stats'),
        api.get('/api/v1/printing-assets/log'),
        api.get('/api/v1/printing-assets/store/materials'),
      ]);
      if (rStats.status === 'fulfilled') setStats(rStats.value.data.data || null);
      if (rLogs.status  === 'fulfilled') setLogs((rLogs.value.data.data || []).slice(0, 8));
      if (rMats.status  === 'fulfilled') {
        const allMats = rMats.value.data.data || [];
        // Exclude Sales/Retail — those belong to the Sales Manager dashboard
        setMats(allMats.filter(m => m.department !== 'Sales' && m.department !== 'Retail'));
      }

    } catch {}
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

  // ── Derived KPIs from General Store data
  const totalMaterialValue = Number(stats?.totalMaterialValue ?? 0);
  const totalMachineValue  = Number(stats?.totalMachineValue  ?? 0);
  const totalValue         = totalMaterialValue + totalMachineValue;
  const pendingMoves       = stats?.pendingMoveRequests ?? 0;
  const totalMaterials     = stats?.totalMaterials ?? 0;    // number of material lines
  const machinesInStore    = stats?.machinesInStore ?? 0;
  const machinesInProd     = stats?.machinesInProduction ?? 0;
  const machinesUnderMaint = stats?.machinesUnderMaintenance ?? 0;

  // ── Derived from materials list
  const lowStock  = mats.filter(m => parseFloat(m.quantity_in_store) <= parseFloat(m.reorder_level || 0));
  const totalQty  = mats.reduce((s, m) => s + parseFloat(m.quantity_in_store || 0), 0);
  const lowStockCount = lowStock.length;

  // ── Action-type breakdown for the table
  const logActions = ['Register', 'Move to Production', 'Issue to Department', 'Consume'];
  const logActionColors = { 'Register': G.forest, 'Move to Production': G.orange, 'Issue to Department': G.purple, 'Consume': G.brown };
  const actionBreakdown = logActions.map(a => {
    const rows = logs.filter(l => l.action_type === a);
    return {
      type: a,
      count: rows.length,
      total_qty: rows.reduce((s, l) => s + Math.abs(Number(l.quantity || 0)), 0),
    };
  }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  const maxActionCount = Math.max(...actionBreakdown.map(d => d.count), 1);

  // ── Department breakdown from materials
  const deptBreakdown = DEPARTMENTS.map(d => {
    const dMats = mats.filter(m => m.department === d);
    return {
      department: d,
      sku_count:      dMats.length,
      total_quantity: dMats.reduce((s, m) => s + parseFloat(m.quantity_in_store || 0), 0),
      total_value:    dMats.reduce((s, m) => s + parseFloat(m.total_value || 0), 0),
    };
  }).filter(d => d.sku_count > 0).sort((a, b) => b.total_value - a.total_value);
  const maxDeptValue = Math.max(...deptBreakdown.map(c => Number(c.total_value || 0)), 1);

  // ── Log action icons
  const logIcon  = { 'Register': '📦', 'Move to Production': '🏭', 'Return to Store': '↩️', 'Issue to Department': '📤', 'Value Update': '💰', 'Consume': '⚙️' };
  const logColor = { 'Register': G.forest, 'Move to Production': G.orange, 'Return to Store': G.sky, 'Issue to Department': G.purple, 'Value Update': G.emerald, 'Consume': G.brown };

  return (
    <div style={{ margin: '-24px', padding: '2.5rem', minHeight: 'calc(100vh - 64px)', background: '#E8F4EC', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <DecorPlants />
      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%', position:'relative', zIndex:1 }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Store HQ. <span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            Universal General Store · It&apos;s {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button onClick={load} className="btn-3d" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <span style={{ display:'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            <span className="btn-text-3d">Sync</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Store Value Hero */}
        <div className="d-card" onClick={() => nav('/general-store/inventory')}
          style={{ background: `linear-gradient(135deg,${G.forest} 0%,${G.dark} 100%)`, color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <span style={{ fontSize: 24 }}>💰</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>Total Store Value</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14 }}>
            <span style={{ fontSize: '1.1rem', opacity: 0.75, marginRight: 6 }}>ETB</span>{Number(totalValue).toLocaleString(undefined,{maximumFractionDigits:0})}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
            <span>📊</span> Across {totalMaterials} distinct item lines
          </div>
        </div>

        {/* Stock SKUs */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/general-store/inventory')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Stock Lines</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>📦</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{totalMaterials.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Unique SKU lines</div>
        </div>

        {/* Stock Units */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/general-store/inventory')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Qty</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>📋</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{Number(totalQty).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Total units in store</div>
        </div>

        {/* Low Stock Alert */}
        <div className="d-card" style={{ animationDelay: '0.2s', background: lowStockCount > 0 ? '#FFF8F0' : undefined }} onClick={() => nav('/general-store/inventory')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: lowStockCount > 0 ? G.orange : G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Low Stock</span>
            <div style={{ background: lowStockCount > 0 ? '#FFF4EB' : '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>{lowStockCount > 0 ? '⚠️' : '✅'}</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: lowStockCount > 0 ? G.orange : G.dark, margin: '12px 0 6px' }}>{lowStockCount}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Items below min level</div>
        </div>
      </div>

      {/* ── ROW 2: MOVEMENT BREAKDOWN + ACTIVITY FEED ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Action Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize:18 }}>🔀</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: G.dark }}>Store Activity Breakdown</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: G.olive, fontWeight: 700 }}>Based on recent logs</span>
          </div>
          {/* Sub-KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Total Machines', val: (machinesInStore + machinesInProd + machinesUnderMaint), icon: '🖨️', c: G.forest },
              { label: 'In Production',  val: machinesInProd,       icon: '🏭', c: G.orange },
              { label: 'Under Maint.',   val: machinesUnderMaint,   icon: '🔧', c: G.sky    },
              { label: 'Pending Moves',  val: pendingMoves,         icon: '🔄', c: G.purple },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 0, padding: '12px 14px', border: `1.5px solid ${k.c}22` }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.c }}>{k.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.olive, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 60px 80px', gap: 12, padding: '4px 14px', marginBottom: 6 }}>
            {['Action', '', 'Count', 'Total Qty'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          {actionBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: G.olive, fontSize: 13 }}>No log data yet</div>
          ) : actionBreakdown.map((row, i) => {
            const c = logActionColors[row.type] || COLORS_ARR[i % COLORS_ARR.length];
            return (
              <div key={row.type} className="cat-row" onClick={() => nav('/general-store/logs')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 0, background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: G.dark }}>{row.type}</span>
                </div>
                <CategoryBar value={row.count} max={maxActionCount} color={c} />
                <span style={{ fontSize: 13, fontWeight: 700, color: G.dark, textAlign: 'right' }}>{row.count}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: G.emerald, textAlign: 'right' }}>{Number(row.total_qty).toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="d-card-no-hover" style={{ flex: 1, animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize:18 }}>📜</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: G.dark }}>Recent Activity</span>
            </div>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: G.olive, fontSize: 13 }}>
                <span style={{ fontSize:28, marginBottom: 8, opacity: 0.4 }}>📉</span><br />No logs yet
              </div>
            ) : logs.slice(0,6).map((l, i) => {
              const c = logColor[l.action_type] || COLORS_ARR[i % COLORS_ARR.length];
              const icon = logIcon[l.action_type] || '📌';
              return (
                <div key={l.id} className="top-row" onClick={() => nav('/general-store/logs')}>
                  <div style={{ width: 32, height: 32, borderRadius: 0, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.action_type}: {l.item_id}
                    </div>
                    <div style={{ fontSize: 10, color: G.olive, fontWeight: 600 }}>{l.department}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: c, whiteSpace: 'nowrap' }}>
                    {l.date_time ? new Date(l.date_time).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: LOW STOCK ALERTS + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Low Stock Items */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 14 }}>⚠ Attention Required</div>
          {[
            { label: `${pendingMoves} Pending Actions`, sub: `Movements awaiting approval`, icon: '🔄', bg: '#EFF6FF', c: '#3b82f6', path: '/general-store/logs' },
            { label: `${lowStock.length} Low Stock Items`, sub: 'Below minimum level', icon: '⚠️', bg: '#FFFBEB', c: '#f59e0b', path: '/general-store/inventory' }
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
          {/* Low stock mini-list */}
          {lowStock.slice(0,3).map(item => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderTop:`1px solid ${G.sage}44` }}>
              <span style={{ fontSize:12, fontWeight:800, color:G.orange, minWidth:28 }}>{item.quantity_in_store}</span>
              <span style={{ fontSize:12, fontWeight:700, color:G.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{item.material_name}</span>
              <span style={{ fontSize:10, color:G.olive }}>min:{item.reorder_level||0}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'View Inventory',  sub: 'Browse items', icon: '📋', bg: '#E6F2EB', color: G.forest,  href: '/general-store/inventory' },
              { label: 'Register Item',   sub: 'New stock',    icon: '➕', bg: '#E8F9F1', color: G.emerald, href: '/general-store/register' },
              { label: 'Issue Item',      sub: 'To dept',      icon: '📤', bg: '#F1F8E9', color: G.olive,   href: '/general-store/issue' },
              { label: 'Stock Alerts',    sub: 'Low stock',    icon: '🔔', bg: '#FFF3E0', color: G.orange,  href: '/general-store/inventory' },
              { label: 'Move Logs',       sub: 'History',      icon: '📜', bg: '#E1F5FE', color: G.sky,     href: '/general-store/logs' },
              { label: 'Valuation',       sub: 'Asset value',  icon: '📊', bg: '#F3E5F5', color: G.purple,  href: '/general-store/valuation' },
              { label: 'Reports',         sub: 'Print audit',  icon: '🖨️', bg: '#EFEBE9', color: G.brown,   href: '/general-store/reports' }
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


/* ─── 2. INVENTORY LIST ─────────────────────────────────────────────────── */
export const GSInventory = () => {
  const [items, setItems]     = useState([]);
  const [dept, setDept]       = useState('');
  const [cat, setCat]         = useState('');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [customDept, setCustomDept] = useState(false);
  const [focused, setFocused] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dept) params.department = dept;
      const r = await api.get('/api/v1/printing-assets/store/materials', { params });
      // Exclude Sales/Retail items — those are managed in the Sales Manager dashboard
      const all = r.data.data || [];
      setItems(all.filter(i => i.department !== 'Sales' && i.department !== 'Retail'));
    } catch { setItems([]); }
    setLoading(false);
  }, [dept]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i =>
    (!cat || i.category === cat) &&
    (!search || i.material_name.toLowerCase().includes(search.toLowerCase()) || i.material_id.toLowerCase().includes(search.toLowerCase()))
  );

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); };

  const submitUpdate = async () => {
    if (!updatingItem.material_name.trim()) return showToast('error', 'Item Name required');
    setSaving(true);
    try {
      await api.put(`/api/v1/printing-assets/store/materials/${updatingItem.id}`, updatingItem);
      showToast('success', `"${updatingItem.material_name}" successfully updated!`);
      setTimeout(() => { setUpdatingItem(null); load(); }, 1500);
    } catch (e) { showToast('error', e.response?.data?.message || 'Update failed'); }
    setSaving(false);
  };

  if (updatingItem) {
    const qty = parseFloat(updatingItem.quantity_in_store) || 0;
    const price = parseFloat(updatingItem.unit_value) || 0;
    const total = qty * price;
    
    const S = (k) => ({
      width: '100%', padding: '16px 20px', fontSize: 16, fontWeight: 700,
      border: `3px solid ${focused === k ? G.forest : G.sage}`, borderRadius: 0,
      outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
      color: G.darkGray, background: '#fff',
      boxShadow: focused === k ? `inset 0 4px 10px ${G.forest}33, 6px 6px 0 ${G.sage}` : `4px 4px 0 ${G.sage}`,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    });

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: `linear-gradient(145deg, ${G.light}, ${G.white})`, overflowY: 'auto', fontFamily: "'Inter',sans-serif" }}>
        {['🌿','🌱','🍃','🌲','🌾','🍀'].map((e, i) => (
          <span key={i} style={{ position: 'fixed', fontSize: 120 + i * 20, opacity: 0.04, top: `${[5,60,20,70,10,50][i]}%`, left: `${[2,80,45,10,70,85][i]}%`, pointerEvents: 'none' }}>{e}</span>
        ))}
        
        <div style={{ background: G.dark, padding: '30px 40px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `6px solid ${G.forest}`, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: 1 }}>Update Material: {updatingItem.material_id}</h1>
            <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: 16 }}>University General Store Inventory Control</p>
          </div>
          <button onClick={() => setUpdatingItem(null)} style={{ background: G.red, color: '#fff', border: 'none', padding: '16px 32px', fontSize: 18, fontWeight: 900, cursor: 'pointer', borderRadius: 0, boxShadow: '4px 4px 0 #7f0000', textTransform: 'uppercase' }}>✕ Cancel</button>
        </div>

        <div style={{ maxWidth: 900, margin: '40px auto', position: 'relative', zIndex: 1, padding: '0 20px' }}>
          <div style={{ background: '#fff', border: `4px solid ${G.forest}`, boxShadow: `8px 8px 0 ${G.dark}`, marginBottom: 30 }}>
            <div style={{ background: `linear-gradient(90deg,${G.forest},${G.emerald})`, padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>📋</span><span style={{ color: '#fff', fontWeight: 900, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Material Details</span>
            </div>
            <div style={{ padding: '30px 30px 10px' }}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Item Name</label>
                <input value={updatingItem.material_name} onChange={e => setUpdatingItem({...updatingItem, material_name: e.target.value})} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} style={S('name')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Category</label>
                  <select value={updatingItem.category} onChange={e => setUpdatingItem({...updatingItem, category: e.target.value})} onFocus={() => setFocused('cat')} onBlur={() => setFocused(null)} style={{...S('cat'), cursor: 'pointer'}}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Department</label>
                  <div style={{ display: 'flex' }}>
                    {!customDept ? (
                      <>
                        <select value={updatingItem.department} onChange={e => setUpdatingItem({...updatingItem, department: e.target.value})} onFocus={() => setFocused('dept')} onBlur={() => setFocused(null)} style={{...S('dept'), flex: 1, cursor: 'pointer', borderRight: 'none'}}>
                          <option value="">-- Select --</option>
                          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <button onClick={() => setCustomDept(true)} style={{ background: G.olive, color: '#fff', border: 'none', padding: '0 20px', fontWeight: 900, cursor: 'pointer', boxShadow: `4px 4px 0 ${G.dark}`, fontSize: 20 }}>+</button>
                      </>
                    ) : (
                      <>
                        <input value={updatingItem.department} onChange={e => setUpdatingItem({...updatingItem, department: e.target.value})} placeholder="Type dept…" onFocus={() => setFocused('dept')} onBlur={() => setFocused(null)} style={{...S('dept'), flex: 1, borderRight: 'none'}} />
                        <button onClick={() => { setCustomDept(false); setUpdatingItem({...updatingItem, department: 'Printing'}); }} style={{ background: G.red, color: '#fff', border: 'none', padding: '0 20px', fontWeight: 900, cursor: 'pointer', boxShadow: `4px 4px 0 #7f0000`, fontSize: 20 }}>✕</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: `4px solid ${G.emerald}`, boxShadow: `8px 8px 0 ${G.olive}`, marginBottom: 30 }}>
            <div style={{ background: `linear-gradient(90deg,${G.emerald},${G.leaf})`, padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>📦</span><span style={{ color: '#fff', fontWeight: 900, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Inventory & Pricing</span>
            </div>
            <div style={{ padding: '30px 30px 10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {[['unit','Unit (e.g. roll)','text'],['quantity_in_store','Qty in Store','number'],['unit_value','Price/Unit (ETB)','number'],['reorder_level','Reorder Level','number']].map(([k, lbl, type]) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{lbl}</label>
                    <input type={type} value={updatingItem[k]} onChange={e => setUpdatingItem({...updatingItem, [k]: e.target.value})} onFocus={() => setFocused(k)} onBlur={() => setFocused(null)} style={S(k)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: G.dark, padding: '24px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `4px solid ${G.forest}`, boxShadow: `8px 8px 0 ${G.dark}`, marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 12, color: G.sage, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Live Calculation</div>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 900 }}>ETB {total.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
            </div>
            <button onClick={submitUpdate} disabled={saving} style={{ background: `linear-gradient(135deg,${G.lime},${G.leaf})`, color: G.dark, border: 'none', padding: '20px 50px', fontSize: 20, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', borderRadius: 0, boxShadow: `6px 6px 0 ${G.forest}`, textTransform: 'uppercase', transition: 'transform 0.1s', transform: saving ? 'translate(2px, 2px)' : 'none' }}>
              {saving ? '⏳ UPDATING...' : '✅ SAVE CHANGES'}
            </button>
          </div>
          
          {toast && (
            <div style={{ position: 'fixed', bottom: 40, right: 40, background: toast.type === 'success' ? `linear-gradient(135deg,${G.leaf},${G.emerald})` : `linear-gradient(135deg,${G.red},#b71c1c)`, border: `4px solid ${toast.type === 'success' ? G.dark : '#7f0000'}`, boxShadow: `8px 8px 0 ${toast.type === 'success' ? G.dark : '#7f0000'}`, color: '#fff', fontWeight: 900, fontSize: 16, padding: '20px 30px', display: 'flex', gap: 16, alignItems: 'center', animation: 'toastIn .3s ease', zIndex: 10000 }}>
              <span style={{ fontSize: 28 }}>{toast.type === 'success' ? '✅' : '❌'}</span>
              <span>{toast.msg}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const deptColors = { Printing: G.forest, 'Car Rental': G.sky, AgriRent: G.lime, Sales: G.orange, Retail: '#7C3AED', IT: G.emerald, Maintenance: G.brown };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: `linear-gradient(160deg, #eafaea, #f0f9f0 50%, ${G.light})`, fontFamily: "'Inter',sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes rowIn { from { opacity:0; transform: translateX(-18px); } to { opacity:1; transform: translateX(0); } }
        @keyframes floatLeaf { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(6deg); } }
        @keyframes pulseGreen { 0%,100% { box-shadow: 6px 6px 0 ${G.dark}; } 50% { box-shadow: 8px 8px 0 ${G.forest}; } }
        @keyframes toastSlide { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .inv-row:hover { background: ${G.sage}33 !important; transform: scaleX(1.001); transition: background 0.15s, transform 0.15s; }
        .upd-btn:hover { background: linear-gradient(135deg, ${G.lime}, ${G.leaf}) !important; transform: translate(-2px,-2px) !important; box-shadow: 6px 6px 0 ${G.dark} !important; }
      `}</style>

      <DecorPlants />


      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>

        {/* ── HEADER BAR ── */}
        <div style={{ background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 55%, ${G.emerald} 100%)`, padding: '28px 40px', borderBottom: `6px solid ${G.lime}`, boxShadow: `0 8px 32px ${G.dark}55`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <span style={{ fontSize: 40 }}>📦</span>
              <div>
                <h1 style={{ margin:0, fontSize:32, fontWeight:900, color:'#fff', letterSpacing:1, textTransform:'uppercase' }}>Consumables Inventory</h1>
                <p style={{ margin:'6px 0 0', color: G.sage, fontSize:14, fontWeight:600, letterSpacing:0.5 }}>University General Store · All Departments · All Materials</p>
              </div>
            </div>
          </div>
          <button onClick={load} style={{ background:`linear-gradient(135deg,${G.lime},${G.leaf})`, color: G.dark, border:`3px solid ${G.dark}`, borderRadius:0, padding:'16px 36px', fontSize:16, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5, cursor:'pointer', boxShadow:`6px 6px 0 ${G.dark}`, transition:'transform 0.1s, box-shadow 0.1s' }} onMouseDown={e=>{e.currentTarget.style.transform='translate(3px,3px)';e.currentTarget.style.boxShadow='0 0 0 #000';}} onMouseUp={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`6px 6px 0 ${G.dark}`;}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`6px 6px 0 ${G.dark}`;}}>
            🔄 REFRESH
          </button>
        </div>

        {/* ── STAT PILLS ── */}
        <div style={{ background: G.dark, padding:'14px 40px', display:'flex', gap:32, borderBottom:`4px solid ${G.forest}` }}>
          {[
            { label:'Total Items', value: items.length, icon:'📋', color: G.lime },
            { label:'Low Stock',   value: items.filter(m=>parseFloat(m.quantity_in_store)<=parseFloat(m.reorder_level||10)).length, icon:'⚠️', color: G.orange },
            { label:'Filtered',    value: filtered.length, icon:'🔍', color: G.sky },
            { label:'Departments', value: [...new Set(items.map(m=>m.department))].length, icon:'🏢', color: G.sage },
          ].map(s=>(
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <div>
                <div style={{ color: s.color, fontWeight:900, fontSize:22, lineHeight:1 }}>{s.value}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTER ROW ── */}
        <div style={{ background:'#fff', borderBottom:`4px solid ${G.sage}`, padding:'20px 40px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24, boxShadow:'0 4px 12px rgba(0,0,0,0.05)' }}>
          {[
            { label:'🏢 DEPARTMENT', val:dept, set:setDept, opts:[{v:'',l:'All Departments'},...DEPARTMENTS.map(d=>({v:d,l:d}))] },
            { label:'🏷️ CATEGORY',   val:cat,  set:setCat,  opts:[{v:'',l:'All Categories'}, ...CATEGORIES.map(c=>({v:c,l:c}))] },
          ].map(f=>(
            <div key={f.label}>
              <div style={{ fontSize:11, fontWeight:900, color:G.olive, letterSpacing:1.5, marginBottom:8 }}>{f.label}</div>
              <select value={f.val} onChange={e=>f.set(e.target.value)} style={{ width:'100%', padding:'13px 16px', border:`3px solid ${G.sage}`, borderRadius:0, fontSize:14, fontWeight:700, color:G.darkGray, outline:'none', boxShadow:`4px 4px 0 ${G.sage}`, cursor:'pointer', background:'#fff' }}>
                {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <div style={{ fontSize:11, fontWeight:900, color:G.olive, letterSpacing:1.5, marginBottom:8 }}>🔍 SEARCH</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Item name or ID…" style={{ width:'100%', padding:'13px 16px', border:`3px solid ${G.sage}`, borderRadius:0, fontSize:14, fontWeight:700, color:G.darkGray, outline:'none', boxSizing:'border-box', boxShadow:`4px 4px 0 ${G.sage}`, background:'#fff' }} />
          </div>
        </div>

        {/* ── TABLE ── */}
        <div style={{ padding:'20px 0 0 0' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:80, color:G.olive, fontSize:18, fontWeight:700 }}>🌱 Loading inventory…</div>
          ) : (
            <div style={{ borderTop:`4px solid ${G.dark}`, borderBottom:`4px solid ${G.dark}`, width:'100%', overflowX:'hidden' }}>

              {/* Table Header */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.2fr 1.2fr 0.9fr 0.9fr 0.9fr 1.1fr 1.2fr 0.9fr 1.1fr', width:'100%', background:`linear-gradient(90deg,${G.dark},${G.forest})`, borderBottom:`4px solid ${G.lime}` }}>
                {['ID','ITEM NAME','CATEGORY','DEPARTMENT','IN STORE','REORDER','UNIT','UNIT PRICE','TOTAL VALUE','STATUS','ACTION'].map(h=>(
                  <div key={h} style={{ padding:'18px 10px', color:'#fff', fontWeight:900, fontSize:11, letterSpacing:1.2, textTransform:'uppercase', borderRight:`2px solid ${G.forest}88`, wordBreak:'keep-all' }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{ padding:60, textAlign:'center', color:G.olive, fontSize:16, fontWeight:700, background:'#fff' }}>
                  🌿 No items found. Adjust your filters or register new items.
                </div>
              ) : filtered.map((m, i) => {
                const low = parseFloat(m.quantity_in_store) <= parseFloat(m.reorder_level || 10);
                const reorderLvl = parseInt(m.reorder_level) || 10;
                const deptC = deptColors[m.department] || G.olive;
                return (
                  <div key={m.id} className="inv-row" style={{
                    display:'grid', gridTemplateColumns:'1fr 2fr 1.2fr 1.2fr 0.9fr 0.9fr 0.9fr 1.1fr 1.2fr 0.9fr 1.1fr',
                    width:'100%',
                    background: low ? `${G.orange}08` : (i%2===0 ? '#f7fff7' : '#fff'),
                    borderBottom:`2px solid ${G.sage}55`,
                    borderLeft: low ? `5px solid ${G.orange}` : `5px solid transparent`,
                    animation:`rowIn 0.25s ease both`,
                    animationDelay:`${i*0.04}s`,
                  }}>
                    {/* ID */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center' }}>
                      <span style={{ background:`${G.dark}`, color:'#fff', padding:'4px 8px', fontSize:10, fontWeight:900, letterSpacing:0.5 }}>{m.material_id}</span>
                    </div>
                    {/* Name */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', fontWeight:800, color:G.dark, fontSize:14 }}>{m.material_name}</div>
                    {/* Category */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center' }}>
                      <span style={{ background:`${G.lime}28`, color:G.olive, padding:'5px 10px', fontSize:11, fontWeight:800, border:`2px solid ${G.lime}66` }}>{m.category}</span>
                    </div>
                    {/* Department */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center' }}>
                      <span style={{ background:`${deptC}20`, color:deptC, padding:'5px 10px', fontSize:11, fontWeight:800, border:`2px solid ${deptC}55` }}>{m.department}</span>
                    </div>
                    {/* In Store */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', fontWeight:900, fontSize:18, color: low ? G.red : G.forest }}>{parseFloat(m.quantity_in_store).toLocaleString()}</div>
                    {/* Reorder */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', fontWeight:700, color: low ? G.red : G.olive }}>{reorderLvl}</div>
                    {/* Unit */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', color:G.darkGray, fontWeight:600 }}>{m.unit}</div>
                    {/* Unit Price */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', fontWeight:700, color: m.unit_value > 0 ? G.dark : G.orange }}>
                      {m.unit_value > 0 ? `ETB ${parseFloat(m.unit_value).toLocaleString()}` : '— Not Set'}
                    </div>
                    {/* Total Value */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center', fontWeight:800, color:G.forest, fontSize:14 }}>
                      {m.total_value > 0 ? `ETB ${parseFloat(m.total_value).toLocaleString()}` : '—'}
                    </div>
                    {/* Status */}
                    <div style={{ padding:'14px 12px', display:'flex', alignItems:'center' }}>
                      {low
                        ? <span style={{ background:`${G.orange}22`, color:G.orange, padding:'6px 10px', fontSize:11, fontWeight:900, border:`2px solid ${G.orange}`, display:'flex', alignItems:'center', gap:4 }}>⚠ LOW</span>
                        : <span style={{ background:`${G.leaf}22`, color:G.forest, padding:'6px 10px', fontSize:11, fontWeight:900, border:`2px solid ${G.leaf}`, display:'flex', alignItems:'center', gap:4 }}>✓ OK</span>
                      }
                    </div>
                    {/* Update Button */}
                    <div style={{ padding:'8px', display:'flex', alignItems:'center' }}>
                      <button
                        className="upd-btn"
                        onClick={() => setUpdatingItem({...m})}
                        style={{ background:`linear-gradient(135deg,${G.emerald},${G.forest})`, color:'#fff', border:`3px solid ${G.dark}`, borderRadius:0, padding:'12px 0', width:'100%', fontWeight:900, fontSize:12, textTransform:'uppercase', letterSpacing:1.2, cursor:'pointer', boxShadow:`4px 4px 0 ${G.dark}`, transition:'all 0.12s' }}
                        onMouseDown={e=>{e.currentTarget.style.transform='translate(4px,4px)';e.currentTarget.style.boxShadow='0 0 0 #000';}}
                        onMouseUp={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`4px 4px 0 ${G.dark}`;}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`4px 4px 0 ${G.dark}`;}}
                      >✏ UPDATE</button>
                    </div>
                  </div>
                );
              })}

              {/* Footer summary */}
              {filtered.length > 0 && (
                <div style={{ background:G.dark, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`4px solid ${G.lime}` }}>
                  <span style={{ color:G.sage, fontWeight:700, fontSize:13 }}>Showing {filtered.length} of {items.length} items</span>
                  <span style={{ color:G.lime, fontWeight:900, fontSize:14 }}>
                    TOTAL STORE VALUE: ETB {filtered.reduce((s,m)=>s+parseFloat(m.total_value||0),0).toLocaleString(undefined,{minimumFractionDigits:2})}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:40, right:40, background: toast.type==='success' ? `linear-gradient(135deg,${G.leaf},${G.emerald})` : `linear-gradient(135deg,${G.red},#b71c1c)`, border:`4px solid ${toast.type==='success'?G.dark:'#7f0000'}`, boxShadow:`8px 8px 0 ${toast.type==='success'?G.dark:'#7f0000'}`, color:'#fff', fontWeight:900, fontSize:16, padding:'20px 30px', display:'flex', gap:16, alignItems:'center', animation:'toastSlide .3s ease', zIndex:10000, borderRadius:0 }}>
          <span style={{ fontSize:28 }}>{toast.type==='success'?'✅':'❌'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

/* ─── 3. REGISTER NEW ITEM ──────────────────────────────────────────────── */
export const GSRegisterItem = () => {
  const [form, setForm]   = useState({ material_name: '', category: 'Paper', unit: 'roll', quantity_in_store: 0, department: 'Printing', unit_value: 0, reorder_level: 10 });
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [focused, setFocused] = useState(null);
  const [customDept, setCustomDept] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const qty     = parseFloat(form.quantity_in_store) || 0;
  const price   = parseFloat(form.unit_value) || 0;
  const total   = qty * price;
  const reorder = parseInt(form.reorder_level) || 10;

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); };

  const submit = async () => {
    if (!form.material_name.trim()) return showToast('error', 'Item Name is required');
    if (!form.department)           return showToast('error', 'Department is required');
    setSaving(true);
    try {
      await api.post('/api/v1/printing-assets/store/materials', form);
      showToast('success', `"${form.material_name}" registered — ETB ${total.toLocaleString(undefined,{minimumFractionDigits:2})} total`);
      setForm({ material_name: '', category: 'Paper', unit: 'roll', quantity_in_store: 0, department: 'Printing', unit_value: 0, reorder_level: 10 });
      setCustomDept(false);
    } catch (e) { showToast('error', e.response?.data?.message || 'Registration failed'); }
    setSaving(false);
  };

  const S = (k) => ({
    width: '100%', padding: '13px 16px', fontSize: 14, fontWeight: 600,
    border: `2px solid ${focused === k ? G.forest : '#cde8cd'}`,
    borderRadius: 0, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Inter',sans-serif", color: G.darkGray, background: '#fff',
    boxShadow: focused === k ? `inset 0 2px 6px ${G.forest}22, 4px 4px 0 ${G.sage}` : `3px 3px 0 ${G.sage}`,
    transition: 'all 0.18s',
  });

  const SH = ({ icon, label, gradient }) => (
    <div style={{ background: gradient, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(160deg,#f0f7f0,#e8f5e9 50%,#f5f5f5)', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
      {['🌿','🌱','🍃','🌲','🌾','🍀'].map((e, i) => (
        <span key={i} style={{ position: 'absolute', fontSize: 90 + i * 14, opacity: 0.035, top: `${[5,58,22,72,8,48][i]}%`, left: `${[1,84,44,9,68,92][i]}%`, pointerEvents: 'none', userSelect: 'none' }}>{e}</span>
      ))}

      <style>{`
        @keyframes toastIn  { from { opacity:0; transform:translateX(50px) scale(.9); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes shimmer  { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin     { to { transform:rotate(360deg); } }
        .rbtn:hover:not(:disabled)  { transform:translate(-2px,-2px)!important; box-shadow:8px 8px 0 ${G.dark}!important; }
        .rbtn:active:not(:disabled) { transform:translate(2px,2px)!important;  box-shadow:2px 2px 0 ${G.dark}!important; }
        .sec { animation: fadeInUp .4s ease both; }
      `}</style>

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg,${G.dark} 0%,${G.forest} 55%,${G.emerald} 100%)`, padding: '30px 40px 24px', boxShadow: `0 6px 0 ${G.dark}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', right:36, top:'50%', transform:'translateY(-50%)', fontSize:110, opacity:.07 }}>🌲</div>
        <div style={{ position:'absolute', right:160, top:'25%', fontSize:64, opacity:.05 }}>🌿</div>
        <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>
          <div style={{ width:52, height:52, background:'rgba(255,255,255,0.13)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, border:'2px solid rgba(255,255,255,0.28)' }}>➕</div>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:900, color:'#fff', letterSpacing:-.5 }}>Register New Item</h1>
            <p style={{ margin:'4px 0 0', color:'rgba(255,255,255,0.72)', fontSize:13 }}>Add consumables to the Universal General Store · Any Department</p>
          </div>
        </div>
        <div style={{ marginTop:18, height:4, background:'rgba(255,255,255,0.12)' }}>
          <div style={{ height:'100%', width: form.material_name && form.department ? '100%' : form.material_name ? '60%' : '20%', background:`linear-gradient(90deg,${G.lime},${G.leaf})`, backgroundSize:'200% auto', animation:'shimmer 2s linear infinite', transition:'width .5s ease' }} />
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 370px', minHeight:'calc(100vh - 136px)' }}>

        {/* LEFT: FORM */}
        <div style={{ padding:'28px 28px 28px 40px' }}>

          {/* 1. Basic Info */}
          <div className="sec" style={{ background:'#fff', border:`3px solid ${G.forest}`, boxShadow:`6px 6px 0 ${G.dark}`, marginBottom:22 }}>
            <SH icon="📋" label="Basic Information" gradient={`linear-gradient(90deg,${G.forest},${G.emerald})`} />
            <div style={{ padding:'22px 22px 6px' }}>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:900, color:G.olive, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Item Name *</label>
                <input value={form.material_name} onChange={e => set('material_name', e.target.value)} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} placeholder="e.g. Engine Oil 5W-30, A4 Copy Paper…" style={S('name')} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:900, color:G.olive, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} onFocus={() => setFocused('cat')} onBlur={() => setFocused(null)} style={{ ...S('cat'), cursor:'pointer' }}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:900, color:G.olive, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Department *</label>
                  <div style={{ display:'flex' }}>
                    {!customDept ? (
                      <>
                        <select value={form.department} onChange={e => set('department', e.target.value)} onFocus={() => setFocused('dept')} onBlur={() => setFocused(null)} style={{ ...S('dept'), flex:1, cursor:'pointer' }}>
                          <option value="">-- Select --</option>
                          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <button onClick={() => setCustomDept(true)} style={{ background:G.olive, color:'#fff', border:'none', padding:'0 14px', fontWeight:800, cursor:'pointer', boxShadow:`3px 3px 0 ${G.dark}`, borderLeft:`2px solid ${G.dark}`, fontSize:16 }}>+</button>
                      </>
                    ) : (
                      <>
                        <input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Type dept…" onFocus={() => setFocused('dept')} onBlur={() => setFocused(null)} style={{ ...S('dept'), flex:1 }} />
                        <button onClick={() => { setCustomDept(false); set('department','Printing'); }} style={{ background:G.red, color:'#fff', border:'none', padding:'0 14px', fontWeight:900, cursor:'pointer', boxShadow:`3px 3px 0 #7f0000`, borderLeft:`2px solid #7f0000`, fontSize:16 }}>✕</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Stock & Unit */}
          <div className="sec" style={{ background:'#fff', border:`3px solid ${G.emerald}`, boxShadow:`6px 6px 0 ${G.olive}`, marginBottom:22, animationDelay:'.1s' }}>
            <SH icon="📦" label="Stock & Unit" gradient={`linear-gradient(90deg,${G.emerald},${G.leaf})`} />
            <div style={{ padding:'22px 22px 6px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[['unit','Unit of Measure','roll, litre, box…','text'],['quantity_in_store','Opening Quantity','0','number']].map(([k,lbl,ph,type]) => (
                  <div key={k}>
                    <label style={{ display:'block', fontSize:11, fontWeight:900, color:G.olive, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>{lbl}</label>
                    <input type={type} min="0" value={form[k]} placeholder={ph} onChange={e => set(k, e.target.value)} onFocus={() => setFocused(k)} onBlur={() => setFocused(null)} style={S(k)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Pricing & Reorder */}
          <div className="sec" style={{ background:'#fff', border:`3px solid ${G.lime}`, boxShadow:`6px 6px 0 ${G.olive}`, marginBottom:28, animationDelay:'.2s' }}>
            <SH icon="💰" label="Pricing & Reorder Control" gradient={`linear-gradient(90deg,${G.olive},${G.lime})`} />
            <div style={{ padding:'22px 22px 6px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[['unit_value','Price of 1 Unit (ETB)'],['reorder_level','Reorder Level (min qty)']].map(([k,lbl]) => (
                  <div key={k}>
                    <label style={{ display:'block', fontSize:11, fontWeight:900, color:G.olive, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>{lbl}</label>
                    <input type="number" min="0" step={k==='unit_value'?'0.01':'1'} value={form[k]} onChange={e => set(k, e.target.value)} onFocus={() => setFocused(k)} onBlur={() => setFocused(null)} style={{ ...S(k), fontWeight:800 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SUBMIT + TOAST */}
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <button className="rbtn" onClick={submit} disabled={saving} style={{
              background: saving ? G.olive : `linear-gradient(135deg,${G.forest},${G.emerald})`,
              color:'#fff', border:`3px solid ${G.dark}`, borderRadius:0, padding:'16px 44px',
              fontWeight:900, fontSize:16, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow:`6px 6px 0 ${G.dark}`, transition:'all .15s ease', letterSpacing:.5,
              display:'flex', alignItems:'center', gap:10, minWidth:210, justifyContent:'center',
            }}>
              {saving
                ? <><span style={{ display:'inline-block', animation:'spin 1s linear infinite', border:'2px solid rgba(255,255,255,.35)', borderTopColor:'#fff', borderRadius:'50%', width:15, height:15 }} />Registering…</>
                : '🌱 Register Item'}
            </button>
            {toast && (
              <div style={{
                display:'flex', alignItems:'center', gap:10, padding:'14px 20px',
                background: toast.type==='success' ? `linear-gradient(135deg,${G.leaf},${G.emerald})` : `linear-gradient(135deg,${G.red},#b71c1c)`,
                border:`3px solid ${toast.type==='success' ? G.dark : '#7f0000'}`,
                boxShadow:`4px 4px 0 ${toast.type==='success' ? G.dark : '#7f0000'}`,
                color:'#fff', fontWeight:800, fontSize:13, animation:'toastIn .3s ease', maxWidth:400,
              }}>
                <span style={{ fontSize:20 }}>{toast.type==='success' ? '✅' : '❌'}</span>
                <span>{toast.msg}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: STICKY PANEL */}
        <div style={{ padding:'28px 40px 28px 0', alignSelf:'start', position:'sticky', top:0 }}>
          {/* Live Calc */}
          <div style={{ border:`3px solid ${G.forest}`, boxShadow:`6px 6px 0 ${G.dark}`, background:'#fff', marginBottom:20 }}>
            <div style={{ background:G.dark, padding:'12px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <span>📊</span>
              <span style={{ color:'#fff', fontWeight:900, fontSize:11, letterSpacing:1.8, textTransform:'uppercase' }}>Live Calculation</span>
            </div>
            <div style={{ padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:12, marginBottom:12, borderBottom:`2px solid ${G.sage}`, fontSize:13 }}>
                <span style={{ color:G.olive, fontWeight:700 }}>Qty × Unit Price</span>
                <span style={{ color:G.darkGray }}>{qty} × ETB {price.toFixed(2)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <span style={{ fontSize:13, color:G.dark, fontWeight:800 }}>TOTAL VALUE</span>
                <span style={{ fontSize:24, fontWeight:900, color: total > 0 ? G.forest : G.sage }}>ETB {total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </div>
              <div style={{ background:`${G.lime}1a`, border:`2px solid ${G.lime}`, padding:'10px 14px', borderLeft:`5px solid ${G.olive}` }}>
                <div style={{ fontSize:10, fontWeight:900, color:G.olive, marginBottom:4, letterSpacing:1 }}>⚡ REORDER TRIGGER</div>
                <div style={{ fontSize:12, color:G.darkGray }}>Alert fires at <strong style={{ color:G.forest }}>{reorder} {form.unit || 'units'}</strong></div>
              </div>
            </div>
          </div>
          {/* Preview */}
          <div style={{ border:`3px solid ${G.emerald}`, boxShadow:`6px 6px 0 ${G.olive}`, background:'#fff', marginBottom:20 }}>
            <div style={{ background:`linear-gradient(90deg,${G.emerald},${G.leaf})`, padding:'12px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <span>🌿</span>
              <span style={{ color:'#fff', fontWeight:900, fontSize:11, letterSpacing:1.8, textTransform:'uppercase' }}>Item Preview</span>
            </div>
            <div style={{ padding:'14px 18px' }}>
              {[['Name',form.material_name||'\u2014',true],['Category',form.category],['Department',form.department||'\u2014'],['Unit',form.unit||'\u2014'],['Qty',qty.toLocaleString()],['Unit Price',`ETB ${price.toFixed(2)}`]].map(([lbl,val,bold]) => (
                <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${G.sage}44`, fontSize:13 }}>
                  <span style={{ color:G.olive, fontWeight:700 }}>{lbl}</span>
                  <span style={{ color:G.dark, fontWeight: bold ? 900 : 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Tips */}
          <div style={{ border:`2px solid ${G.sage}`, borderLeft:`5px solid ${G.lime}`, background:`${G.sage}1a`, padding:'14px 16px' }}>
            <div style={{ fontSize:10, fontWeight:900, color:G.olive, marginBottom:8, letterSpacing:1.2 }}>🌱 TIPS</div>
            {['Total value auto-calculated: Qty × Price','Reorder level triggers low-stock alerts','Click "+" to enter a custom department'].map((t,i) => (
              <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:G.darkGray, marginBottom:5 }}>
                <span style={{ color:G.leaf, fontWeight:900 }}>▶</span>{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── 4. ISSUE TO DEPARTMENT ────────────────────────────────────────────── */
export const GSIssueItem = () => {
  const [materials, setMaterials] = useState([]);
  const [requests, setRequests]   = useState([]);
  const [carRequests, setCarRequests] = useState([]);
  const [carShipModal, setCarShipModal] = useState(null);
  const [carShipQtys, setCarShipQtys] = useState({});
  const [form, setForm]           = useState({ material_id: '', quantity: '', job_reference: '', department: '', requested_by: '', request_id: null });
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [focused, setFocused]     = useState(null);
  
  // History State
  const [allHistory, setAllHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('All');
  const [expandedRows, setExpandedRows] = useState({});
  const [rowDetails, setRowDetails] = useState({});
  const [rowDetailLoading, setRowDetailLoading] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); };

  const load = useCallback(async () => {
    try {
      const [rMat, rReq, rCarReq] = await Promise.all([
        api.get('/api/v1/printing-assets/store/materials'),
        api.get('/api/v1/printing-assets/material-requests').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/car-renting/store-requests').catch(() => ({ data: { data: [] } }))
      ]);
      setMaterials(rMat.data.data || []);
      setRequests((rReq.data.data || []).filter(r => r.status === 'APPROVED'));
      
      const allCarAgri = rCarReq.data?.data || [];
      setCarRequests(allCarAgri.filter(r => r.status === 'PENDING_STORE'));
      
      const hist = allCarAgri.filter(r => r.status !== 'PENDING_STORE');
      hist.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllHistory(hist);
    } catch (err) {
      console.error('Error loading materials:', err);
      showToast('error', 'Failed to load materials from the store.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = materials.find(m => m.material_id === form.material_id);

  const submit = async () => {
    if (!form.material_id) return showToast('error', 'Please select a material to issue.');
    if (!form.quantity || parseFloat(form.quantity) <= 0) return showToast('error', 'Please enter a valid quantity.');
    if (!form.department) return showToast('error', 'Please select the destination department.');
    if (!form.requested_by.trim()) return showToast('error', 'Please enter the name of the person requesting.');
    
    if (selected && parseFloat(form.quantity) > parseFloat(selected.quantity_in_store)) {
      return showToast('error', `Cannot issue more than available (${selected.quantity_in_store} ${selected.unit}).`);
    }

    setSaving(true);
    try {
      if (form.request_id) {
        // Ship request flow
        await api.post(`/api/v1/printing-assets/material-requests/${form.request_id}/ship`, { 
          shipped_qty: form.quantity,
          requested_by: form.requested_by,
          job_reference: form.job_reference
        });
        showToast('success', `✅ Successfully shipped ${form.quantity} ${selected?.unit}!`);
      } else {
        // Direct issue flow
        await api.post('/api/v1/printing-assets/issue/material', form);
        showToast('success', `✅ Successfully issued ${form.quantity} ${selected?.unit} to ${form.department}!`);
      }
      setForm({ material_id: '', quantity: '', job_reference: '', department: '', requested_by: '', request_id: null });
      load(); // refresh available balances
    } catch (e) { showToast('error', e.response?.data?.message || 'Error issuing material'); }
    setSaving(false);
  };

  const handlePrepareShip = (r) => {
    setForm({
      material_id: r.material_id,
      quantity: r.quantity_requested,
      department: r.department || 'Printing',
      requested_by: r.created_by_name || '',
      job_reference: 'Req ' + r.request_code,
      request_id: r.id
    });
    // Scroll down to form
    const formEl = document.getElementById('issue_details_section');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShipCarRequest = async () => {
    if (!carShipModal) return;
    const shippedItems = (carShipModal.items || []).map(it => ({
      id: it.id,
      product_id: it.product_id,
      quantity_shipped: parseInt(carShipQtys[it.id]) || 0,
    })).filter(it => it.quantity_shipped > 0);

    if (!shippedItems.length) {
      showToast('error', 'Please set at least one shipped quantity');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/v1/car-renting/store-requests/${carShipModal.id}/status`, {
        status: 'SHIPPED',
        items: shippedItems,
      });
      showToast('success', 'Car/Agri items shipped successfully! Inventory updated.');
      setCarShipModal(null);
      load();
    } catch (e) {
      showToast('error', e.response?.data?.message || 'Failed to ship');
    }
    setSaving(false);
  };

  const S = (k) => ({
    width: '100%', padding: '16px 20px', fontSize: 16, fontWeight: 700,
    border: `3px solid ${focused === k ? G.forest : G.sage}`, borderRadius: 0,
    outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
    color: G.darkGray, background: '#fff',
    boxShadow: focused === k ? `inset 0 4px 10px ${G.forest}33, 6px 6px 0 ${G.sage}` : `4px 4px 0 ${G.sage}`,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const toggleRowDetail = async (id) => {
    const isOpen = !!expandedRows[id];
    if (isOpen) {
      setExpandedRows(prev => ({ ...prev, [id]: false }));
      return;
    }
    setExpandedRows(prev => ({ ...prev, [id]: true }));
    if (!rowDetails[id]) {
      setRowDetailLoading(prev => ({ ...prev, [id]: true }));
      try {
        const res = await api.get(`/api/v1/car-renting/store-requests/${id}`);
        setRowDetails(prev => ({ ...prev, [id]: res.data?.data || res.data }));
      } catch {
        showToast('error', 'Failed to load detail');
        setExpandedRows(prev => ({ ...prev, [id]: false }));
      } finally {
        setRowDetailLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  const filteredHistory = historyFilter === 'All'
    ? allHistory
    : historyFilter === 'Car Rental'
      ? allHistory.filter(r => r.department === 'Car Rental' || !r.department)
      : allHistory.filter(r => r.department === 'AgriRent');

  const STATUS = {
    PENDING_STORE:    { label: 'Pending Store',  color: '#f59e0b',  bg: '#FFF8E1' },
    FORWARDED_TO_CEO: { label: 'With CEO',       color: '#3b82f6',  bg: '#E3F2FD' },
    APPROVED:         { label: 'CEO Approved',   color: '#10b981',  bg: '#F1F8E9' },
    REJECTED:         { label: 'Rejected',       color: '#ef4444',  bg: '#FFEBEE' },
    SHIPPED:          { label: 'Shipped',        color: '#059669',  bg: '#E8F5E9' },
    RECEIVED:         { label: 'Received',       color: '#065f46',  bg: '#E8F5E9' },
  };

  const StatusBadge = ({ status }) => {
    const cfg = STATUS[status] || { label: status, color: G.darkGray, bg: '#f1f5f9' };
    return (
      <span style={{
        background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}`,
        padding: '4px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: 0.5, borderRadius: 0, display: 'inline-block',
      }}>{cfg.label}</span>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: `linear-gradient(160deg, #eafaea, #f0f9f0 50%, ${G.light})`, fontFamily: "'Inter',sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes floatLeaf { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(6deg); } }
        @keyframes toastSlide { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }
      `}</style>

      <DecorPlants />

      {/* Ship Confirm Modal for Car/Agri Requests */}
      {carShipModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', maxWidth: 540, width: '100%', padding: 28, borderTop: `5px solid ${G.emerald}`, boxShadow: '6px 6px 0 rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: G.darkGray }}>Confirm Shipment</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: G.darkGray }}>Enter the quantity to ship for each item. Inventory will be deducted automatically.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: G.dark }}>
                  {['Product', 'Requested', 'Ship Qty'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(carShipModal.items || []).map((it, i) => (
                  <tr key={it.id} style={{ borderBottom: `1px solid ${G.sage}`, background: i % 2 === 0 ? '#fff' : `${G.sage}22` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{it.product_name}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 900, color: G.forest }}>{it.quantity_requested}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <input
                        type="number" min="0" max={it.quantity_requested}
                        value={carShipQtys[it.id] || 0}
                        onChange={e => setCarShipQtys(prev => ({ ...prev, [it.id]: e.target.value }))}
                        style={{ width: 70, padding: '6px 8px', border: `2px solid ${G.sage}`, fontWeight: 800, fontSize: 14, outline: 'none', borderRadius: 0, textAlign: 'center' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button disabled={saving} onClick={() => setCarShipModal(null)} style={{ padding: '10px 20px', background: 'none', border: `2px solid ${G.darkGray}`, fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', borderRadius: 0 }}>Cancel</button>
              <button disabled={saving} onClick={handleShipCarRequest} style={{ padding: '10px 20px', background: G.emerald, border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${G.dark}`, borderRadius: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {saving ? 'Processing...' : 'Confirm Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 60px 0' }}>
        
        {/* ── HEADER BAR ── */}
        <div style={{ background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 55%, ${G.emerald} 100%)`, padding: '28px 40px', borderBottom: `6px solid ${G.lime}`, boxShadow: `0 8px 32px ${G.dark}55`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize: 40 }}>📤</span>
            <div>
              <h1 style={{ margin:0, fontSize:32, fontWeight:900, color:'#fff', letterSpacing:1, textTransform:'uppercase' }}>Issue to Department</h1>
              <p style={{ margin:'6px 0 0', color: G.sage, fontSize:14, fontWeight:600, letterSpacing:0.5 }}>Formal process of releasing material from General Store stock</p>
            </div>
          </div>
        </div>

        {/* ── APPROVED REQUESTS (SHIPPING PENDING) ── */}
        {requests.length > 0 && (
          <div style={{ padding: '40px 40px 0 40px' }}>
            <div style={{ background: '#fff', border: `4px solid ${G.orange}`, boxShadow: `8px 8px 0 ${G.dark}`, marginBottom: 0 }}>
              <div style={{ background: `linear-gradient(90deg,${G.orange},#F57C00)`, padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>📦</span><span style={{ color: '#fff', fontWeight: 900, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Approved Requests (Ready to Ship)</span>
              </div>
              <div style={{ padding: '20px 30px' }}>
                {requests.map(r => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', borderBottom:`2px solid ${G.sage}44`, flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ fontWeight:900, color:G.dark, fontSize:15 }}>{r.material_name}</div>
                      <div style={{ fontSize:12, color:G.olive, fontWeight:700 }}>Request: {r.request_code} | Dept: {r.department || 'Printing'} | Qty: {r.quantity_requested} {r.unit}</div>
                    </div>
                    <button onClick={() => handlePrepareShip(r)} style={{ background: G.purple || '#7C3AED', color: '#fff', border: 'none', padding: '10px 20px', fontSize: 14, fontWeight: 900, cursor: 'pointer', borderRadius: 0, boxShadow: `4px 4px 0 #4C1D95`, textTransform: 'uppercase' }}>
                      📦 PREPARE SHIPMENT
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CAR / AGRI RENTAL APPROVED REQUESTS ── */}
        {carRequests.length > 0 && (
          <div style={{ padding: '40px 40px 0 40px' }}>
            <div style={{ background: '#fff', border: `4px solid ${G.sky}`, boxShadow: `8px 8px 0 ${G.dark}`, marginBottom: 0 }}>
              <div style={{ background: `linear-gradient(90deg,${G.sky},#1565C0)`, padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>🚚</span><span style={{ color: '#fff', fontWeight: 900, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Car & AgriRental Requests (Ready to Ship)</span>
              </div>
              <div style={{ padding: '20px 30px' }}>
                {carRequests.map(r => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', borderBottom:`2px solid ${G.sage}44`, flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ fontWeight:900, color:G.dark, fontSize:15 }}>Request {r.request_number}</div>
                      <div style={{ fontSize:12, color:G.olive, fontWeight:700 }}>Dept: {r.department || 'Car Rental'} | Items: {r.item_count} | Notes: {r.notes || 'None'}</div>
                    </div>
                    <button onClick={async () => {
                      try {
                        const res = await api.get(`/api/v1/car-renting/store-requests/${r.id}`);
                        const data = res.data?.data || res.data;
                        const qtys = {};
                        (data.items || []).forEach(it => { qtys[it.id] = it.quantity_requested; });
                        setCarShipQtys(qtys);
                        setCarShipModal(data);
                      } catch(e) {
                        showToast('error', 'Failed to load request detail');
                      }
                    }} style={{ background: G.sky, color: '#fff', border: 'none', padding: '10px 20px', fontSize: 14, fontWeight: 900, cursor: 'pointer', borderRadius: 0, boxShadow: `4px 4px 0 #0D47A1`, textTransform: 'uppercase' }}>
                      🚚 SHIP REQUEST
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN FORM ── */}
        <div style={{ padding: '40px 40px 0 40px' }} id="issue_details_section">
          
          <div style={{ background: '#fff', border: `4px solid ${G.forest}`, boxShadow: `8px 8px 0 ${G.dark}`, marginBottom: 40 }}>
            <div style={{ background: `linear-gradient(90deg,${G.forest},${G.emerald})`, padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>📝</span><span style={{ color: '#fff', fontWeight: 900, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Issue Details</span>
            </div>
            
            <div style={{ padding: '30px 40px' }}>
              
              {/* Item Selection */}
              <div style={{ marginBottom: 30 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Select Material / Item *</label>
                <select value={form.material_id} onChange={e => set('material_id', e.target.value)} onFocus={() => setFocused('mat')} onBlur={() => setFocused(null)} style={{...S('mat'), cursor: 'pointer'}}>
                  <option value="">-- Choose an item from store --</option>
                  {materials.map(m => <option key={m.id} value={m.material_id}>{m.material_name} — Avail: {parseFloat(m.quantity_in_store).toLocaleString()} {m.unit}</option>)}
                </select>
                
                {selected && (
                  <div style={{ marginTop: 12, background: `${G.lime}15`, border: `2px solid ${G.lime}55`, padding: '12px 16px', display: 'flex', gap: 40, fontWeight: 700, color: G.dark, fontSize: 14 }}>
                    <div><span style={{ color: G.olive, fontSize: 11, textTransform: 'uppercase' }}>Category:</span> <br/>{selected.category}</div>
                    <div><span style={{ color: G.olive, fontSize: 11, textTransform: 'uppercase' }}>Current Dept:</span> <br/>{selected.department}</div>
                    <div><span style={{ color: G.olive, fontSize: 11, textTransform: 'uppercase' }}>Available Balance:</span> <br/><span style={{ color: parseFloat(selected.quantity_in_store) <= 0 ? G.red : G.forest, fontSize: 22, fontWeight: 900 }}>{parseFloat(selected.quantity_in_store).toLocaleString()} {selected.unit}</span></div>
                  </div>
                )}
              </div>

              {/* Quantity & Department & Personnel & Reference — all in one row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 30, marginBottom: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Quantity Issued *</label>
                  <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="e.g. 5" onFocus={() => setFocused('qty')} onBlur={() => setFocused(null)} style={S('qty')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Issued To (Department) *</label>
                  <select value={form.department} onChange={e => set('department', e.target.value)} onFocus={() => setFocused('dept')} onBlur={() => setFocused(null)} style={{...S('dept'), cursor: 'pointer'}}>
                    <option value="">-- Select Destination --</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Requested By (Supervisor) *</label>
                  <input value={form.requested_by} onChange={e => set('requested_by', e.target.value)} placeholder="Name of requester" onFocus={() => setFocused('req')} onBlur={() => setFocused(null)} style={S('req')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Purpose / Job Reference</label>
                  <input value={form.job_reference} onChange={e => set('job_reference', e.target.value)} placeholder="Optional: Job#123" onFocus={() => setFocused('job')} onBlur={() => setFocused(null)} style={S('job')} />
                </div>
              </div>

            </div>
          </div>

          {/* ── ACTION BAR ── */}
          <div style={{ background: G.dark, padding: '24px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `4px solid ${G.forest}`, boxShadow: `8px 8px 0 ${G.dark}`, marginBottom: 40 }}>
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>✓ Auto-deducts from stock balance</div>
              <div style={{ color: G.sage, fontSize: 13, fontWeight: 600 }}>✓ Logs movement history with date/time</div>
            </div>
            <button onClick={submit} disabled={saving} style={{ background: `linear-gradient(135deg,${G.lime},${G.leaf})`, color: G.dark, border: 'none', padding: '20px 80px', fontSize: 20, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', borderRadius: 0, boxShadow: `6px 6px 0 ${G.forest}`, textTransform: 'uppercase', transition: 'transform 0.1s', transform: saving ? 'translate(2px, 2px)' : 'none' }}>
              {saving ? '⏳ PROCESSING...' : '📤 ISSUE MATERIAL NOW'}
            </button>
          </div>

          {/* ══ PAST REQUESTS (FLOW HISTORY) — CAR & AGRI RENTAL ══ */}
          <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ borderLeft: `5px solid #0ea5e9`, paddingLeft: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: G.darkGray, textTransform: 'uppercase' }}>
                Past Car & Agri Rental Requests (Flow History)
              </h2>
              <div style={{ fontSize: 12, color: G.darkGray, marginTop: 2, fontWeight: 600 }}>
                {allHistory.length} total record{allHistory.length !== 1 ? 's' : ''} across departments
              </div>
            </div>
            {/* Department Filter Buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Car Rental', 'AgriRent'].map(f => {
                const isActive = historyFilter === f;
                const col = f === 'Car Rental' ? '#0ea5e9' : f === 'AgriRent' ? G.olive : G.darkGray;
                const Icon = f === 'Car Rental' ? Truck : f === 'AgriRent' ? Leaf : null;
                return (
                  <button key={f} onClick={() => setHistoryFilter(f)} style={{
                    padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    background: isActive ? col : '#fff',
                    color: isActive ? '#fff' : col,
                    border: `2px solid ${isActive ? col : G.sage}`,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    boxShadow: isActive ? `0 3px 8px ${col}40` : 'none',
                  }}>
                    {Icon && <Icon size={12} />}
                    {f}
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.3)' : col,
                      color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, fontWeight: 900,
                    }}>
                      {f === 'All' ? allHistory.length : f === 'Car Rental'
                        ? allHistory.filter(r => r.department === 'Car Rental' || !r.department).length
                        : allHistory.filter(r => r.department === 'AgriRent').length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#fff', border: `4px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}` }}>
            {filteredHistory.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: G.darkGray }}>
                <Package size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 800 }}>No history records{historyFilter !== 'All' ? ` for ${historyFilter}` : ''}</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.dark, color: '#fff' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>#</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Request #</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Department</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Items</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((r, i) => {
                    const isOpen = !!expandedRows[r.id];
                    const det = rowDetails[r.id];
                    const loadingDet = !!rowDetailLoading[r.id];
                    const dept = r.department || 'Car Rental';
                    const deptColor = dept === 'AgriRent' ? G.olive : '#0ea5e9';
                    const DeptIcon = dept === 'AgriRent' ? Leaf : Truck;

                    return (
                      <React.Fragment key={r.id}>
                        <tr style={{ borderBottom: isOpen ? 'none' : `1px solid ${G.sage}`, background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          <td style={{ padding: '11px 14px', color: G.darkGray, fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 900, color: G.forest, fontFamily: 'monospace', fontSize: 12 }}>{r.request_number}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{
                              background: dept === 'AgriRent' ? '#f0fdf4' : '#e0f2fe',
                              color: deptColor, border: `1.5px solid ${deptColor}`,
                              padding: '3px 10px', fontSize: 11, fontWeight: 800,
                              textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}>
                              <DeptIcon size={11} />{dept}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', color: G.darkGray, fontWeight: 700 }}>{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ background: '#e2e8f0', border: `1px solid #cbd5e1`, color: G.forest, padding: '3px 10px', fontWeight: 800, fontSize: 12 }}>{r.item_count || '—'}</span>
                          </td>
                          <td style={{ padding: '11px 14px' }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: '11px 14px' }}>
                            <button onClick={() => toggleRowDetail(r.id)} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'none',
                              border: `1.5px solid ${isOpen ? G.forest : '#0ea5e9'}`, color: isOpen ? G.forest : '#0ea5e9',
                              fontWeight: 800, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', borderRadius: 0,
                            }}>
                              {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {isOpen ? 'View Less' : 'View More'}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={7} style={{ padding: 0, borderBottom: `2px solid ${G.forest}` }}>
                              <div style={{ background: '#F0F7F0', borderLeft: `5px solid ${deptColor}`, padding: '18px 28px' }}>
                                {loadingDet ? (
                                  <div style={{ padding: '20px', textAlign: 'center', color: G.darkGray }}><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</div>
                                ) : det ? (
                                  <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
                                      {[
                                        { label: 'Department', value: dept },
                                        { label: 'Requested By', value: det.requester_name || '—' },
                                        { label: 'CEO Approved By', value: det.approver_name || '—' },
                                        { label: 'Store Handler', value: det.store_handler_name || '—' },
                                      ].map(f => (
                                        <div key={f.label} style={{ borderLeft: `3px solid ${G.sage}`, paddingLeft: 12 }}>
                                          <div style={{ fontSize: 10, fontWeight: 800, color: G.darkGray, textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: G.dark }}>{f.value}</div>
                                        </div>
                                      ))}
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                      <thead>
                                        <tr style={{ background: G.dark }}>
                                          {['#', 'Product', 'Qty Requested', 'Qty Shipped', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '8px 12px', color: '#fff', fontWeight: 800, fontSize: 10, textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(det.items || []).map((it, idx) => (
                                          <tr key={idx} style={{ borderBottom: `1px solid ${G.sage}`, background: '#fff' }}>
                                            <td style={{ padding: '8px 12px', color: G.darkGray }}>{idx + 1}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 800 }}>{it.product_name}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 900, color: G.forest }}>{it.quantity_requested}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 800, color: G.emerald }}>{it.quantity_shipped ?? '—'}</td>
                                            <td style={{ padding: '8px 12px' }}>
                                              {it.quantity_shipped ? <span style={{ color: G.emerald, fontWeight: 800, fontSize: 10 }}>✓ SHIPPED</span> : <span style={{ color: G.darkGray, fontSize: 10 }}>—</span>}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </>
                                ) : (
                                  <div style={{ color: G.red, fontSize: 13, fontWeight: 700 }}>Failed to load details.</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:40, right:40, background: toast.type==='success' ? `linear-gradient(135deg,${G.leaf},${G.emerald})` : `linear-gradient(135deg,${G.red},#b71c1c)`, border:`4px solid ${toast.type==='success'?G.dark:'#7f0000'}`, boxShadow:`8px 8px 0 ${toast.type==='success'?G.dark:'#7f0000'}`, color:'#fff', fontWeight:900, fontSize:16, padding:'20px 30px', display:'flex', gap:16, alignItems:'center', animation:'toastSlide .3s ease', zIndex:10000, borderRadius:0 }}>
          <span style={{ fontSize:28 }}>{toast.type==='success'?'✅':'❌'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

/* ─── 5. MOVEMENT LOGS ──────────────────────────────────────────────────── */
export const GSLogs = () => {
  const [logs, setLogs]       = useState([]);
  const [dept, setDept]       = useState('');
  const [type, setType]       = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dept) params.department = dept;
      if (type) params.item_type = type;
      const r = await api.get('/api/v1/printing-assets/log', { params });
      setLogs(r.data.data || []);
    } catch { setLogs([]); }
    setLoading(false);
  }, [dept, type]);

  useEffect(() => { load(); }, [load]);

  const selS = { padding: '12px 16px', fontSize: 14, fontWeight: 700, border: `3px solid ${G.sage}`, borderRadius: 0, outline: 'none', color: G.darkGray, background: '#fff', boxShadow: `4px 4px 0 ${G.sage}`, cursor: 'pointer' };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: `linear-gradient(160deg, #eafaea, #f0f9f0 50%, ${G.light})`, fontFamily: "'Inter',sans-serif", overflow: 'hidden' }}>
      <DecorPlants />
      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 55%, ${G.emerald} 100%)`, padding: '28px 40px', borderBottom: `6px solid ${G.lime}`, boxShadow: `0 8px 32px ${G.dark}55`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize: 40 }}>📋</span>
            <div>
              <h1 style={{ margin:0, fontSize:32, fontWeight:900, color:'#fff', letterSpacing:1, textTransform:'uppercase' }}>Movement Logs</h1>
              <p style={{ margin:'6px 0 0', color: G.sage, fontSize:14, fontWeight:600, letterSpacing:0.5 }}>Complete audit trail across all departments</p>
            </div>
          </div>
          <button onClick={load} style={{ background: G.lime, color: G.dark, border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 900, cursor: 'pointer', borderRadius: 0, boxShadow: `4px 4px 0 ${G.leaf}`, textTransform: 'uppercase' }}>🔄 Refresh</button>
        </div>

        {/* Filters */}
        <div style={{ padding: '30px 40px 10px', display: 'flex', gap: 20 }}>
          <select value={dept} onChange={e => setDept(e.target.value)} style={selS}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} style={selS}>
            <option value="">All Types</option>
            <option>Material</option>
            <option>Machine</option>
          </select>
        </div>

        {/* Grid Table */}
        <div style={{ padding: '20px 0 0 0' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:80, color:G.olive, fontSize:18, fontWeight:700 }}>🌱 Loading logs…</div>
          ) : (
            <div style={{ borderTop:`4px solid ${G.dark}`, borderBottom:`4px solid ${G.dark}`, width:'100%', overflowX:'hidden' }}>
              
              {/* Header Row */}
              <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr 0.8fr 1fr 1fr 1.5fr', width:'100%', background:`linear-gradient(90deg,${G.dark},${G.forest})`, borderBottom:`4px solid ${G.lime}` }}>
                {['DATE','TYPE','ITEM ID','ACTION','DEPT','FROM','TO','QTY','BY','APPROVED','NOTES'].map(h=>(
                  <div key={h} style={{ padding:'18px 10px', color:'#fff', fontWeight:900, fontSize:11, letterSpacing:1.2, textTransform:'uppercase', borderRight:`2px solid ${G.forest}88`, wordBreak:'keep-all' }}>{h}</div>
                ))}
              </div>

              {/* Data Rows */}
              {logs.filter(l => l.action_type === 'Issue to Department').length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: G.sage, background:'#fff', fontWeight: 700 }}>No issue records found for this filter.</div>
              ) : logs.filter(l => l.action_type === 'Issue to Department').map((l, i) => (
                <div key={l.id} style={{
                  display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr 0.8fr 1fr 1fr 1.5fr',
                  width:'100%', background: i%2===0 ? '#f7fff7' : '#fff',
                  borderBottom:`2px solid ${G.sage}55`, borderLeft: `5px solid transparent`,
                  animation:`rowIn 0.25s ease both`, animationDelay:`${i*0.04}s`
                }}>
                  <div style={{ padding:'14px 10px', fontSize:12, fontWeight:600, color:G.darkGray, display:'flex', alignItems:'center' }}>{new Date(l.date_time).toLocaleString()}</div>
                  <div style={{ padding:'14px 10px', display:'flex', alignItems:'center' }}><span style={{ background:`${G.sky}33`, color:G.dark, padding:'4px 10px', fontWeight:800, fontSize:10, textTransform:'uppercase' }}>{l.item_type}</span></div>
                  <div style={{ padding:'14px 10px', fontSize:13, fontWeight:900, color:G.dark, display:'flex', alignItems:'center' }}>{l.item_id}</div>
                  <div style={{ padding:'14px 10px', fontSize:12, fontWeight:800, color:G.forest, display:'flex', alignItems:'center' }}>{l.action_type}</div>
                  <div style={{ padding:'14px 10px', display:'flex', alignItems:'center' }}><DeptBadge dept={l.department || '?'} /></div>
                  <div style={{ padding:'14px 10px', fontSize:12, fontWeight:600, color:G.darkGray, display:'flex', alignItems:'center' }}>{l.from_location}</div>
                  <div style={{ padding:'14px 10px', fontSize:12, fontWeight:600, color:G.darkGray, display:'flex', alignItems:'center' }}>{l.to_location}</div>
                  <div style={{ padding:'14px 10px', fontSize:13, fontWeight:900, color:G.dark, display:'flex', alignItems:'center' }}>{l.quantity > 0 ? parseFloat(l.quantity).toLocaleString() : '—'}</div>
                  <div style={{ padding:'14px 10px', fontSize:12, fontWeight:600, color:G.olive, display:'flex', alignItems:'center' }}>{l.moved_by || '—'}</div>
                  <div style={{ padding:'14px 10px', fontSize:12, fontWeight:800, color:l.approved_by ? G.leaf : G.orange, display:'flex', alignItems:'center' }}>{l.approved_by || 'Pending'}</div>
                  <div style={{ padding:'14px 10px', fontSize:12, fontWeight:500, color:G.darkGray, display:'flex', alignItems:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={l.notes}>{l.notes?.replace(' | PENDING_APPROVAL', '').replace(' | APPROVED', '') || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── 6. VALUATION ──────────────────────────────────────────────────────── */
export const GSValuation = () => {
  const [items, setItems]   = useState([]);
  const [dept, setDept]     = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dept) params.department = dept;
      const r = await api.get('/api/v1/printing-assets/store/materials', { params });
      setItems(r.data.data || []);
    } catch { setItems([]); }
    setLoading(false);
  }, [dept]);

  useEffect(() => { load(); }, [load]);

  const grouped = items.reduce((acc, m) => {
    const d = m.department || 'Unknown';
    if (!acc[d]) acc[d] = { count: 0, total: 0 };
    acc[d].count++;
    acc[d].total += parseFloat(m.total_value || 0);
    return acc;
  }, {});

  const grandTotal = items.reduce((s, m) => s + parseFloat(m.total_value || 0), 0);
  const selS = { padding: '12px 16px', fontSize: 14, fontWeight: 700, border: `3px solid ${G.sage}`, borderRadius: 0, outline: 'none', color: G.darkGray, background: '#fff', boxShadow: `4px 4px 0 ${G.sage}`, cursor: 'pointer' };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: `linear-gradient(160deg, #eafaea, #f0f9f0 50%, ${G.light})`, fontFamily: "'Inter',sans-serif", overflow: 'hidden' }}>
      <DecorPlants />
      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 60px 0' }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 55%, ${G.emerald} 100%)`, padding: '28px 40px', borderBottom: `6px solid ${G.lime}`, boxShadow: `0 8px 32px ${G.dark}55`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize: 40 }}>💰</span>
            <div>
              <h1 style={{ margin:0, fontSize:32, fontWeight:900, color:'#fff', letterSpacing:1, textTransform:'uppercase' }}>Inventory Valuation</h1>
              <p style={{ margin:'6px 0 0', color: G.sage, fontSize:14, fontWeight:600, letterSpacing:0.5 }}>Stock value grouped by department</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 40, alignItems: 'center' }}>
            <select value={dept} onChange={e => setDept(e.target.value)} style={selS}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={load} style={{ background: G.lime, color: G.dark, border: 'none', padding: '14px 24px', fontSize: 14, fontWeight: 900, cursor: 'pointer', borderRadius: 0, boxShadow: `4px 4px 0 ${G.leaf}`, textTransform: 'uppercase' }}>🔄 Refresh</button>
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: 60, color: G.olive, fontWeight: 700, fontSize: 18 }}>🌱 Calculating Valuation…</div> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, marginBottom: 40 }}>
                {Object.entries(grouped).map(([d, v]) => (
                  <div key={d} style={{ background: '#fff', border: `4px solid ${G.forest}`, borderRadius: 0, boxShadow: `8px 8px 0 ${G.sage}`, padding: '24px' }}>
                    <div style={{ marginBottom: 16 }}><DeptBadge dept={d} /></div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: G.dark, marginBottom: 4, letterSpacing: -0.5 }}>ETB {v.total.toLocaleString()}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.olive, textTransform: 'uppercase', letterSpacing: 1 }}>{v.count} item line(s)</div>
                  </div>
                ))}
              </div>
              <div style={{ background: `linear-gradient(135deg,${G.dark},${G.forest})`, border: `4px solid ${G.lime}`, borderRadius: 0, boxShadow: `8px 8px 0 ${G.dark}`, padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 24, color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5 }}>🏪 Grand Total Store Value</div>
                <div style={{ fontWeight: 900, fontSize: 42, color: G.lime, textShadow: `2px 2px 0 ${G.dark}` }}>ETB {grandTotal.toLocaleString()}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── 7. LOW STOCK ALERTS ───────────────────────────────────────────────── */
export const GSAlerts = () => {
  const [items, setItems]   = useState([]);

  useEffect(() => {
    api.get('/api/v1/printing-assets/store/materials').then(r => setItems(r.data.data || [])).catch(() => {});
  }, []);

  const low = items.filter(m => parseFloat(m.quantity_in_store) <= parseFloat(m.reorder_level || 10));

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: `linear-gradient(160deg, #fff5f5, #ffebee 50%, #fff)`, fontFamily: "'Inter',sans-serif", overflow: 'hidden' }}>
      <DecorPlants />
      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(90deg, #b71c1c 0%, ${G.red} 55%, #ff5252 100%)`, padding: '28px 40px', borderBottom: `6px solid #ff1744`, boxShadow: `0 8px 32px rgba(183,28,28,0.4)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize: 40 }}>⚠️</span>
            <div>
              <h1 style={{ margin:0, fontSize:32, fontWeight:900, color:'#fff', letterSpacing:1, textTransform:'uppercase' }}>Low Stock Alerts</h1>
              <p style={{ margin:'6px 0 0', color: '#ffcdd2', fontSize:14, fontWeight:600, letterSpacing:0.5 }}>Items at or below their automatic reorder levels</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ background: '#fff', border: `4px solid ${G.dark}`, borderRadius: 0, padding: '16px 24px', boxShadow: `6px 6px 0 ${G.dark}`, marginBottom: 30, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 900, color: G.dark, fontSize: 16, textTransform: 'uppercase' }}>System Status:</span>
            <span style={{ color: G.darkGray, fontSize: 14, fontWeight: 600 }}>Tracking individual item thresholds automatically.</span>
            {low.length > 0 && <span style={{ background: G.red, color: '#fff', padding: '6px 16px', borderRadius: 0, fontWeight: 900, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${G.dark}` }}>{low.length} items low!</span>}
          </div>

          {low.length === 0 ? (
            <div style={{ background: '#fff', border: `4px solid ${G.forest}`, padding: 60, textAlign: 'center', color: G.leaf, fontSize: 24, fontWeight: 900, boxShadow: `8px 8px 0 ${G.sage}` }}>✅ All items are well-stocked</div>
          ) : (
            <div style={{ borderTop:`4px solid ${G.dark}`, borderBottom:`4px solid ${G.dark}`, width:'100%', overflowX:'hidden' }}>
              
              {/* Header Row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr 1.5fr 1fr 1fr', width:'100%', background:`linear-gradient(90deg,#b71c1c,${G.red})`, borderBottom:`4px solid #ff1744` }}>
                {['ID', 'ITEM', 'DEPARTMENT', 'CATEGORY', 'IN STORE', 'UNIT'].map(h=>(
                  <div key={h} style={{ padding:'18px 10px', color:'#fff', fontWeight:900, fontSize:11, letterSpacing:1.2, textTransform:'uppercase', borderRight:`2px solid rgba(0,0,0,0.2)`, wordBreak:'keep-all' }}>{h}</div>
                ))}
              </div>

              {/* Data Rows */}
              {low.map((m, i) => (
                <div key={m.id} style={{
                  display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr 1.5fr 1fr 1fr',
                  width:'100%', background: i%2===0 ? '#fff5f5' : '#fff',
                  borderBottom:`2px solid #ffcdd2`, borderLeft: `5px solid ${G.red}`,
                  animation:`rowIn 0.25s ease both`, animationDelay:`${i*0.04}s`
                }}>
                  <div style={{ padding:'14px 10px', fontSize:13, fontWeight:800, color:G.olive, display:'flex', alignItems:'center' }}>{m.material_id}</div>
                  <div style={{ padding:'14px 10px', fontSize:14, fontWeight:900, color:G.dark, display:'flex', alignItems:'center' }}>{m.material_name}</div>
                  <div style={{ padding:'14px 10px', display:'flex', alignItems:'center' }}><DeptBadge dept={m.department} /></div>
                  <div style={{ padding:'14px 10px', fontSize:13, fontWeight:600, color:G.darkGray, display:'flex', alignItems:'center' }}>{m.category}</div>
                  <div style={{ padding:'14px 10px', fontSize:18, fontWeight:900, color:G.red, display:'flex', alignItems:'center' }}>{parseFloat(m.quantity_in_store).toLocaleString()}</div>
                  <div style={{ padding:'14px 10px', fontSize:13, fontWeight:600, color:G.darkGray, display:'flex', alignItems:'center' }}>{m.unit}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
