import React, { useState, useEffect, useCallback } from 'react';
import { Sprout } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED', blue: '#3b82f6'
};

const COLORS_ARR = [G.forest, G.orange, G.sky, G.purple, G.emerald, G.brown, G.blue];

/* ─── NOTIFICATION STORE (exported for other pages) ─────────────────────── */
let _listeners = [];
let _notifications = [];
export const NotifStore = {
  push(msg, type = 'info', duration = 5000) {
    const n = { id: Date.now(), msg, type, time: new Date() };
    _notifications = [n, ..._notifications].slice(0, 20);
    _listeners.forEach(fn => fn([..._notifications]));
    if (duration > 0) {
      setTimeout(() => NotifStore.dismiss(n.id), duration);
    }
    return n.id;
  },
  subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; },
  get() { return [..._notifications]; },
  dismiss(id) {
    _notifications = _notifications.filter(n => n.id !== id);
    _listeners.forEach(fn => fn([..._notifications]));
  }
};

export function NotifToastContainer() {
  const [notes, setNotes] = useState(NotifStore.get());
  useEffect(() => NotifStore.subscribe(setNotes), []);
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
      <GlobalStyles />
      {notes.map(n => {
        const c = { success: { bg: G.leaf, border: G.dark }, warning: { bg: G.orange, border: '#E65100' }, error: { bg: G.red, border: '#B71C1C' }, info: { bg: G.emerald, border: G.dark } }[n.type] || { bg: G.emerald, border: G.dark };
        return (
          <div key={n.id} style={{ background: c.bg, border: `2px solid ${c.border}`, color: '#fff', padding: '12px 16px', boxShadow: `4px 4px 0 ${c.border}`, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn .25s ease-out' }}>
            <span style={{ flex: 1 }}>{n.msg}</span>
            <button onClick={() => NotifStore.dismiss(n.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 900, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        );
      })}
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
    </div>
  );
}

/* ─── Shared API ─────────────────────────────────────────────────────────── */
const API = '/api/v1/store-inventory';
function hdrs() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') || '') };
}
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/* ─── Global Styles (Enterprise Design) ─────────────────────────────────── */
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
      --hover-gold: #F59E0B;
      --hover-gold-text: #111827;
    }

    body {
      margin: 0;
      background-color: var(--color-bg-page);
    }

    .overview-container {
      box-sizing: border-box;
      margin: 10px auto;
      width: calc(100% - 20px);
      max-width: 1536px;
      min-height: calc(100vh - 20px);
      padding: 24px;
      background-color: var(--color-bg-page);
      font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .overview-container { margin: 6px auto; width: calc(100% - 12px); padding: 16px; min-height: calc(100vh - 12px); }
    }
    @media (max-width: 480px) {
      .overview-container { margin: 4px auto; width: calc(100% - 8px); padding: 12px; min-height: calc(100vh - 8px); }
    }

    /* Typography */
    .page-title { font-size: 28px; font-weight: 600; line-height: 1.3; margin: 0; color: var(--color-text-primary); }
    .page-subtitle { font-size: 14px; font-weight: 400; color: var(--color-text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-header { font-size: 18px; font-weight: 600; line-height: 1.3; color: var(--color-text-primary); margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
    .label-text { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-muted); }

    /* Header row */
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 8px; }

    /* Cards */
    .card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease-in-out; cursor: pointer; }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
    
    .card-no-hover { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all 150ms ease-in-out; }
    
    .card-primary { background: var(--color-primary); color: #fff; border: none; }
    .card-primary .label-text { color: rgba(255,255,255,0.8); }
    .card-primary .kpi-val { color: #fff; }
    .card-primary .kpi-sub { color: rgba(255,255,255,0.9); }
    .card-primary .kpi-icon { background: rgba(255,255,255,0.2); }

    /* Grid layouts */
    .grid-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 24px; }
    @media (min-width: 1280px) { .grid-2 { grid-template-columns: 3fr 2fr; } }

    /* KPI Specifics */
    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .kpi-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .kpi-val { font-size: 32px; font-weight: 700; color: var(--color-text-primary); line-height: 1; margin: 12px 0 8px; }
    .kpi-sub { font-size: 13px; color: var(--color-text-secondary); }

    /* Lists */
    .list-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-bg-card); border-bottom: 1px solid var(--color-border); transition: all 150ms ease-in-out; cursor: pointer; }
    .list-item:last-child { border-bottom: none; }
    .list-item:hover { background: #F9FAFB; }
    .list-item-content { flex: 1; min-width: 0; }
    .list-item-title { font-size: 14px; font-weight: 500; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
    .list-item-sub { font-size: 12px; color: var(--color-text-secondary); }

    /* Buttons */
    .btn { height: 36px; padding: 0 16px; border-radius: 8px; font-weight: 500; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid transparent; transition: all 150ms ease-in-out; font-family: inherit; background-color: var(--color-bg-card); color: var(--color-text-primary); box-shadow: 0 1px 2px rgba(0,0,0,.05); }
    .btn-primary { background: var(--color-primary); color: #fff; border: none; box-shadow: none; }
    .btn:hover:not(:disabled), .btn-primary:hover:not(:disabled) { background-color: var(--hover-gold); color: var(--hover-gold-text); box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* QA Grid */
    .qa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; }
    .qa-item { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 16px 8px; border-radius: 8px; transition: all 150ms ease-in-out; cursor: pointer; border: 1px solid transparent; }
    .qa-item:hover { background: #F9FAFB; transform: translateY(-1px); border-color: var(--color-border); box-shadow: 0 2px 4px rgba(0,0,0,.04); }
    .qa-icon { width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 8px; }

    /* Cat row */
    .cat-row { display: grid; grid-template-columns: 140px 1fr 50px 60px; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--color-border); transition: all 150ms ease-in-out; cursor: pointer; }
    .cat-row:last-child { border-bottom: none; }
    .cat-row:hover { background: #F9FAFB; }
    .cat-header { display: grid; grid-template-columns: 140px 1fr 50px 60px; gap: 12px; padding: 8px 16px; border-bottom: 1px solid var(--color-border); background: #F9FAFB; }
    @media (max-width: 768px) { .cat-row, .cat-header { grid-template-columns: 100px 1fr 80px; } .cat-hide-mobile { display: none; } }

    /* Spinner */
    .spinner-ring { width: 16px; height: 16px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0%, currentColor 100%); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0); animation: spin 1s linear infinite; border: 2px dashed currentColor; border-top-color: transparent; border-left-color: transparent; display: inline-block; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `}</style>
);


const StoreHomeNew = () => {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  
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
      const data = await apiFetch(`${API}/dashboard`);
      const s = data.data || data;
      setStats(s);

      const feed = [
        ...(s.recentReceipts  || []).map(r => ({ action_type: 'Goods Received',  item_id: r.receipt_no,   department: 'Receiving', date_time: r.created_at, _icon: '📥', _color: 'var(--color-success)'    })),
        ...(s.recentIssues    || []).map(r => ({ action_type: 'Goods Issued',    item_id: r.issue_no,     department: 'Issue',     date_time: r.created_at, _icon: '📤', _color: 'var(--color-warning)'  })),
        ...(s.recentTransfers || []).map(r => ({ action_type: 'Stock Transfer',  item_id: r.transfer_no || String(r.id), department: 'Transfer', date_time: r.created_at, _icon: '🔄', _color: 'var(--color-info)' })),
      ].sort((a, b) => new Date(b.date_time) - new Date(a.date_time)).slice(0, 6);
      setRecentLogs(feed);
    } catch (err) {
      console.error('Failed to fetch Pharmacy dashboard data:', err);
      NotifStore.push('Failed to load: ' + err.message, 'error');
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nav = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

  const s             = stats || {};
  const totalItems    = Number(s.totalItems    ?? 0);
  const totalQuantity = Number(s.totalQuantity ?? 0);
  const lowStockItems = s.lowStockItems || [];
  const lowStockCount = lowStockItems.length;
  const pendingRequests = (Number(s.pendingRequisitions) || 0) + (Number(s.pendingTransfers) || 0);

  const breakdownRows = [
    { type: 'Goods Received Today', count: s.todayReceipts  ?? 0, qty: s.todayReceipts  ?? 0, color: 'var(--color-success)'  },
    { type: 'Goods Issued Today',   count: s.todayIssues    ?? 0, qty: s.todayIssues    ?? 0, color: 'var(--color-warning)'  },
    { type: 'Pending Transfers',    count: s.pendingTransfers ?? 0, qty: s.pendingTransfers ?? 0, color: 'var(--color-primary)' },
    { type: 'Pending Requisitions', count: s.pendingRequisitions ?? 0, qty: s.pendingRequisitions ?? 0, color: 'var(--color-info)' },
  ].filter(r => r.count > 0).sort((a, b) => b.count - a.count);
  const maxBreakdown = Math.max(...breakdownRows.map(r => r.count), 1);

  return (
    <div className="overview-container">
      <GlobalStyles />
      <NotifToastContainer />
      
      {/* ── HEADER ── */}
      <div className="header-row">
        <div>
          <h1 className="page-title">Welcome!</h1>
          <p className="page-subtitle">PHARMACY STORE · IT'S {timeString}</p>
        </div>
        <div>
          <button onClick={load} className="btn btn-primary" disabled={refreshing}>
            {refreshing && <div className="spinner-ring" style={{ width: 14, height: 14, marginRight: 8 }}></div>}
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div className="grid-kpi">
        {/* Pharmacy Store Hero */}
        <div className="card card-primary" onClick={() => nav('/pharmacy-store/stock-list')}>
          <div className="kpi-header">
            <span className="label-text">Pharmacy Store</span>
            <div className="kpi-icon">⭐</div>
          </div>
          <div className="kpi-val">{totalQuantity.toLocaleString()}</div>
          <div className="kpi-sub">👋 Hello - Total Stock Count</div>
        </div>

        {/* Pending Requests */}
        <div className="card" onClick={() => nav('/pharmacy-store/goods-issue')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: pendingRequests > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>Pending Requests</span>
            <div className="kpi-icon" style={{ background: pendingRequests > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' }}>
              {pendingRequests > 0 ? '⚠️' : '✅'}
            </div>
          </div>
          <div className="kpi-val" style={{ color: pendingRequests > 0 ? 'var(--color-warning)' : 'inherit' }}>{pendingRequests}</div>
          <div className="kpi-sub">{pendingRequests > 0 ? 'Requires attention' : 'All caught up!'}</div>
        </div>

        {/* Low Stock */}
        <div className="card" onClick={() => nav('/pharmacy-store/stock-list')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>Low Stock</span>
            <div className="kpi-icon" style={{ background: lowStockCount > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' }}>
              {lowStockCount > 0 ? '⚠️' : '✅'}
            </div>
          </div>
          <div className="kpi-val" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'inherit' }}>{lowStockCount}</div>
          <div className="kpi-sub">Items below minimum</div>
        </div>

        {/* Categories */}
        <div className="card" onClick={() => nav('/pharmacy-store/stock-list')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: 'var(--color-info)' }}>Categories</span>
            <div className="kpi-icon" style={{ background: 'var(--color-info-bg)' }}>📦</div>
          </div>
          <div className="kpi-val">{totalItems.toLocaleString()}</div>
          <div className="kpi-sub">Distinct stock lines</div>
        </div>
      </div>

      {/* ── ROW 2: STOCK BREAKDOWN + ACTIVITY FEED ── */}
      <div className="grid-2">
        {/* Stock Breakdown */}
        <div className="card-no-hover">
          <h3 className="section-header">🏢 Stock Breakdown <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Activity stats</span></h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Total Value',  val: Number(s.totalValue || 0).toLocaleString(), icon: '💰' },
              { label: 'Total Drugs',  val: s.totalDrugs || 0,                          icon: '💊' },
              { label: 'Stock Lines',  val: totalItems,                                 icon: '📦' },
              { label: 'Pending Moves',val: pendingRequests,                            icon: '🔄' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--color-bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{k.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{k.val}</div>
                <div className="label-text" style={{ marginTop: '4px' }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className="cat-header">
            <div className="label-text">Activity Type</div>
            <div className="label-text cat-hide-mobile"></div>
            <div className="label-text" style={{ textAlign: 'right' }}>Count</div>
            <div className="label-text" style={{ textAlign: 'right' }}>Vol</div>
          </div>

          {breakdownRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>No activity data yet</div>
          ) : breakdownRows.map((row, i) => (
            <div key={row.type} className="cat-row" onClick={() => nav('/pharmacy-store/stock-movement')}>
              <div style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.color }}></div>
                {row.type}
              </div>
              <div className="cat-hide-mobile" style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-primary)', width: `${maxBreakdown > 0 ? Math.min(100, (row.count / maxBreakdown) * 100) : 0}%` }}></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>{row.count}</div>
              <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>{row.qty}</div>
            </div>
          ))}
        </div>

        {/* Live Activity */}
        <div className="card-no-hover" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="section-header">📜 Live Activity</h3>
          <div style={{ flex: 1 }}>
            {recentLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📉</div>
                No logs yet
              </div>
            ) : recentLogs.map((l, i) => (
              <div key={i} className="list-item" onClick={() => nav('/pharmacy-store/stock-movement')}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px' }}>{l._icon}</span>
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{l.action_type}: {l.item_id}</div>
                </div>
                <div className="label-text">
                  {l.date_time ? new Date(l.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: LOW STOCK ALERTS + QUICK ACTIONS ── */}
      <div className="grid-2">
        {/* Alerts */}
        <div className="card-no-hover">
          <h3 className="section-header">⚠ Attention Required</h3>
          {[
            { label: `${pendingRequests} Pending Requests`, sub: `Requisitions awaiting approval`, icon: '⏳', bg: 'var(--color-info-bg)', c: 'var(--color-info)', path: '/pharmacy-store/goods-issue' },
            { label: `${lowStockCount} Low Stock Items`, sub: 'Below minimum level', icon: '⚠️', bg: 'var(--color-warning-bg)', c: 'var(--color-warning)', path: '/pharmacy-store/stock-list' }
          ].map(row => (
            <div key={row.label} className="list-item" onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, color: row.c, width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '16px' }}>{row.icon}</span>
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{row.label}</div>
                <div className="list-item-sub">{row.sub}</div>
              </div>
              <div style={{ color: 'var(--color-text-muted)' }}>›</div>
            </div>
          ))}

          {lowStockItems.slice(0,3).map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderBottom:'1px solid var(--color-border)' }}>
              <span style={{ fontSize:'13px', fontWeight:600, color:'var(--color-warning)', minWidth:'28px' }}>{item.quantity}</span>
              <span style={{ fontSize:'13px', fontWeight:500, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.drug_name || item.name}</span>
              <span style={{ fontSize:'11px', color:'var(--color-text-muted)' }}>min: {item.min_level || 0}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card-no-hover">
          <h3 className="section-header">⚡ Quick Operations</h3>
          <div className="qa-grid">
            {[
              { label: 'Stock List',       sub: 'Browse drugs',   icon: '📋', bg: 'var(--color-success-bg)', color: 'var(--color-success)',  href: '/pharmacy-store/stock-list' },
              { label: 'Add New Stock',    sub: 'Register drug',  icon: '➕', bg: 'var(--color-info-bg)', color: 'var(--color-info)', href: '/pharmacy-store/add-new-stock' },
              { label: 'Goods Receiving',  sub: 'Receive stock',  icon: '📥', bg: 'var(--color-success-bg)', color: 'var(--color-success)',   href: '/pharmacy-store/goods-receiving' },
              { label: 'Goods Issue',      sub: 'Issue to dept',  icon: '📤', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)',  href: '/pharmacy-store/goods-issue' },
              { label: 'Stock Adjustment', sub: 'Adjust qty',     icon: '📊', bg: 'var(--color-info-bg)', color: 'var(--color-info)',     href: '/pharmacy-store/stock-adjustment' },
              { label: 'Physical Count',   sub: 'Count audit',    icon: '✅', bg: 'var(--color-success-bg)', color: 'var(--color-success)',  href: '/pharmacy-store/physical-count' },
              { label: 'Stock Movement',   sub: 'View history',   icon: '📜', bg: 'var(--color-info-bg)', color: 'var(--color-info)',   href: '/pharmacy-store/stock-movement' }
            ].map((a, i) => (
              <div key={a.label} className="qa-item" onClick={() => nav(a.href)}>
                <div className="qa-icon" style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                <div className="qa-label">{a.label}</div>
                <div className="qa-sub">{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHomeNew;
