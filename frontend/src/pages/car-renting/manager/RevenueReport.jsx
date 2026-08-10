import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../services/apiClient';
import { useAuth } from '../../../hooks/useAuth';
import {
  RefreshCw, TrendingUp, TrendingDown, DollarSign, Car, Tractor,
  Wrench, Droplets, Download, PieChart, BarChart2, AlertCircle, ShieldAlert
} from 'lucide-react';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';

/* ─── Color Tokens ───────────────────────────────────────────────────────── */
const C = {
  bg:       '#E8F4EC',
  surface:  '#FFFFFF',
  border:   '#C8E6C9',
  forest:   '#228B22',
  dark:     '#1B5E20',
  emerald:  '#2E8B57',
  leaf:     '#4CAF50',
  sage:     '#A5D6A7',
  text:     '#1B2A1B',
  textSec:  '#4A6741',
  orange:   '#E65100',
  red:      '#B71C1C',
  blue:     '#1565C0',
  purple:   '#4A148C',
};

/* ─── Global Styles ──────────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @keyframes rv-fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
    @keyframes rv-spin   { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
    @keyframes rv-bar    { from{width:0}to{width:var(--w)} }

    .rv-page { background:${C.bg}; min-height:100vh; padding:2rem; font-family:'Inter','Segoe UI',sans-serif; }
    .rv-title { font-size:2rem;font-weight:900;color:${C.dark};margin:0 0 4px 0;
                text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 #fff,4px 4px 0 ${C.forest},5px 5px 12px rgba(0,0,0,.12); }
    .rv-sub   { font-size:.875rem;color:${C.textSec};font-weight:600;text-transform:uppercase;letter-spacing:.1em; }

    .rv-card  { background:${C.surface};border-radius:16px;padding:24px;
                border:1.5px solid ${C.border};box-shadow:0 2px 12px rgba(34,139,34,.1);
                animation:rv-fadeUp .4s ease both; }

    .rv-metric-card { background:${C.surface};border-radius:16px;padding:20px 24px;
                      border:1.5px solid ${C.border};box-shadow:0 2px 12px rgba(34,139,34,.09);
                      animation:rv-fadeUp .4s ease both;display:flex;flex-direction:column;gap:4px; }
    .rv-metric-card .lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${C.textSec}; }
    .rv-metric-card .amt { font-size:1.75rem;font-weight:900;line-height:1.1;color:${C.dark}; }
    .rv-metric-card .sub { font-size:11px;color:${C.textSec};margin-top:2px; }
    .rv-metric-card .icon-box { width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:6px; }

    .rv-section-title { font-size:.875rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;
                        color:${C.dark};margin:0 0 16px 0;display:flex;align-items:center;gap:8px; }
    .rv-divider { border:none;border-top:1.5px solid ${C.border};margin:24px 0; }

    .rv-finance-only { background:linear-gradient(135deg,#F3E5F5,#E8EAF6);border:1.5px solid #CE93D8;
                       border-radius:12px;padding:16px;display:flex;align-items:center;gap:10px;
                       font-size:12px;color:${C.purple};font-weight:600; }

    .rv-bar-row { display:flex;align-items:center;gap:12px;margin-bottom:10px; }
    .rv-bar-label { font-size:12px;font-weight:600;color:${C.text};min-width:120px; }
    .rv-bar-track { flex:1;height:10px;background:#F0F7F0;border-radius:20px;overflow:hidden; }
    .rv-bar-fill  { height:100%;border-radius:20px;transition:width 1.2s cubic-bezier(.4,0,.2,1); }
    .rv-bar-val   { font-size:12px;font-weight:700;color:${C.dark};min-width:80px;text-align:right; }

    .rv-month-table { width:100%;border-collapse:collapse;font-size:13px; }
    .rv-month-table thead tr { background:linear-gradient(135deg,${C.dark},${C.forest}); }
    .rv-month-table thead th { color:#fff;padding:10px 14px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.07em; }
    .rv-month-table tbody tr { border-bottom:1px solid #F0F7F0;transition:background .15s; }
    .rv-month-table tbody tr:hover { background:#F7FBF7; }
    .rv-month-table tbody td { padding:10px 14px;color:${C.text};vertical-align:middle; }
    .rv-month-table tbody tr:last-child { border-bottom:none; }

    .rv-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;
              font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s; }
    .rv-btn-primary { background:${C.forest};color:#fff; }
    .rv-btn-primary:hover { background:${C.dark}; }
    .rv-btn-outline { background:#fff;color:${C.forest};border:1.5px solid ${C.forest}; }
    .rv-btn-outline:hover { background:${C.bg}; }

    .rv-filter-bar { background:${C.surface};border-radius:14px;padding:14px 20px;
                     border:1.5px solid ${C.border};display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:1.25rem; }
    .rv-filter-bar label { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${C.textSec};display:block;margin-bottom:4px; }
    .rv-input { padding:8px 12px;border-radius:9px;border:1.5px solid ${C.border};
                font-size:13px;color:${C.text};background:#F7FBF7;outline:none;transition:border-color .2s;font-family:inherit; }
    .rv-input:focus { border-color:${C.forest};background:#fff; }

    .rv-spin { animation:rv-spin 1s linear infinite;display:inline-block; }
    .rv-empty { padding:60px 20px;text-align:center;color:${C.textSec}; }

    .rv-net-positive { color:#2E7D32;font-weight:900; }
    .rv-net-negative { color:${C.red};font-weight:900; }

    @media(max-width:768px){
      .rv-page { padding:1rem; }
      .rv-grid-5,.rv-grid-3,.rv-grid-2 { grid-template-columns:1fr 1fr !important; }
    }
  `}</style>
);

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtCurrency = (v) => {
  const n = Number(v) || 0;
  return 'ETB ' + n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const monthKey = (d) => {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  } catch { return null; }
};

const monthLabel = (k) => {
  try {
    const [y, m] = k.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch { return k; }
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const RevenueReport = () => {
  const { user } = useAuth();
  const userRole = (user?.role || user?.roles?.[0] || '').toLowerCase();
  const isFinance = ['finance', 'finance manager'].includes(userRole) || user?.roles?.some(r => ['finance','finance manager'].includes(r.toLowerCase()));

  const [carOrders,    setCarOrders]    = useState([]);
  const [agriOrders,   setAgriOrders]   = useState([]);
  const [maintenance,  setMaintenance]  = useState([]);
  const [fuelServices, setFuelServices] = useState([]);
  const [assets,       setAssets]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [spinning,     setSpinning]     = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  /* ── Fetch all data ──────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        axios.get('/rental-orders',   { params: { limit: 9999 } }),
        axios.get('/agrirent-orders', { params: { limit: 9999 } }),
        axios.get('/car-renting/maintenance'),
        axios.get('/car-renting/fuel-service'),
        axios.get('/cars',     { params: { limit: 9999 } }),
        axios.get('/tractors', { params: { limit: 9999 } }),
      ]);

      const safeArr = (res, path) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value?.data ?? res.value;
        if (Array.isArray(d)) return d;
        if (path) {
          const parts = path.split('.');
          let cur = d;
          for (const p of parts) { cur = cur?.[p]; if (!cur) return []; }
          return Array.isArray(cur) ? cur : [];
        }
        return d?.orders ?? d?.data ?? d?.records ?? d?.items ?? [];
      };

      setCarOrders(safeArr(results[0]));
      setAgriOrders(safeArr(results[1], 'orders'));
      setMaintenance(safeArr(results[2]));
      setFuelServices(safeArr(results[3]));
      setAssets([...safeArr(results[4]), ...safeArr(results[5])]);
    } catch (err) {
      console.error('RevenueReport load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  /* ── Date filter helper ──────────────────────────────────────────────────── */
  const inRange = (dateStr) => {
    if (!dateStr) return true;
    try {
      const d = new Date(dateStr);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    } catch { return true; }
  };

  /* ── Derived Metrics ─────────────────────────────────────────────────────── */
  const filteredCar  = carOrders.filter(o => inRange(o.pickup_datetime || o.created_at));
  const filteredAgri = agriOrders.filter(o => inRange(o.start_date || o.created_at));
  const filteredMaint = maintenance.filter(o => inRange(o.created_at));
  const filteredFuel  = fuelServices.filter(o => inRange(o.service_date || o.created_at));

  // Revenue from completed/active car orders
  const carRevenue   = filteredCar.filter(o => !['CANCELLED','REJECTED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.rental_amount) || 0), 0);
  const agriRevenue  = filteredAgri.filter(o => !['cancelled','rejected'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.rental_amount) || 0), 0);

  // Additional fees
  const carFees  = filteredCar.reduce((sum, o) => sum + (Number(o.extension_fee) || 0) + (Number(o.damage_fee) || 0) + (Number(o.late_fee) || 0), 0);
  const agriFees = filteredAgri.reduce((sum, o) => sum + (Number(o.extension_fee) || 0) + (Number(o.damage_fee) || 0) + (Number(o.late_fee) || 0), 0);

  // Refunds
  const carRefunds  = filteredCar.filter(o => ['CANCELLED','REJECTED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.refund_amount) || Number(o.amount_paid) || 0), 0);
  const agriRefunds = filteredAgri.filter(o => ['cancelled','rejected'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.refund_amount) || Number(o.amount_paid) || 0), 0);

  const grossRevenue  = carRevenue + agriRevenue;
  const totalFees     = carFees + agriFees;
  const totalRefunds  = carRefunds + agriRefunds;
  const netRevenue    = grossRevenue + totalFees - totalRefunds;

  // Expenses
  const maintExpense = filteredMaint.reduce((sum, m) => sum + (Number(m.cost) || Number(m.amount) || Number(m.finance_amount) || 0), 0);
  const fuelExpense  = filteredFuel.reduce((sum,  f) => sum + (Number(f.cost) || Number(f.amount) || Number(f.total_cost) || 0), 0);
  const totalExpense = maintExpense + fuelExpense;
  const netOperating = netRevenue - totalExpense;

  // Finance-only: asset value & ROA
  const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.purchase_price) || Number(a.asset_value) || Number(a.cost) || 0), 0);
  const roa = totalAssetValue > 0 ? ((netRevenue / totalAssetValue) * 100).toFixed(2) : null;

  /* ── Monthly breakdown ───────────────────────────────────────────────────── */
  const monthlyMap = {};
  const addToMonth = (dateStr, revenue, type) => {
    const k = monthKey(dateStr);
    if (!k) return;
    if (!monthlyMap[k]) monthlyMap[k] = { key: k, car: 0, agri: 0, total: 0, count: 0 };
    monthlyMap[k][type] += revenue;
    monthlyMap[k].total += revenue;
    monthlyMap[k].count++;
  };
  filteredCar.forEach(o  => addToMonth(o.pickup_datetime || o.created_at, Number(o.total_amount) || Number(o.rental_amount) || 0, 'car'));
  filteredAgri.forEach(o => addToMonth(o.start_date     || o.created_at, Number(o.total_amount) || Number(o.rental_amount) || 0, 'agri'));
  const monthlyRows = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key));
  const maxMonthly  = Math.max(...monthlyRows.map(r => r.total), 1);

  /* ── Export CSV ──────────────────────────────────────────────────────────── */
  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Gross Car Revenue', fmtCurrency(carRevenue)],
      ['Gross Agri Revenue', fmtCurrency(agriRevenue)],
      ['Total Gross Revenue', fmtCurrency(grossRevenue)],
      ['Additional Fees', fmtCurrency(totalFees)],
      ['Refunds', fmtCurrency(totalRefunds)],
      ['Net Revenue', fmtCurrency(netRevenue)],
      ['Maintenance Expense', fmtCurrency(maintExpense)],
      ['Fuel & Service Expense', fmtCurrency(fuelExpense)],
      ['Total Operating Expense', fmtCurrency(totalExpense)],
      ['Net Operating Result', fmtCurrency(netOperating)],
      ...(isFinance ? [
        ['Total Asset Value', fmtCurrency(totalAssetValue)],
        ['Return on Asset %', roa ? roa + '%' : 'N/A'],
      ] : []),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'revenue_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Render ──────────────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="rv-page" style={{ display:'flex',alignItems:'center',justifyContent:'center' }}>
      <Styles />
      <div style={{ textAlign:'center', color: C.textSec }}>
        <SegmentedSpinner size={36} />
        <p style={{ marginTop:12,fontWeight:700 }}>Loading revenue data…</p>
      </div>
    </div>
  );

  return (
    <div className="rv-page">
      <Styles />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, animation:'rv-fadeUp .35s ease' }}>
        <div>
          <h1 className="rv-title">💰 Revenue Report</h1>
          <p className="rv-sub">Car &amp; Agri Rental · Financial Performance Overview</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {isFinance && (
            <span style={{ background:'#F3E5F5', color:C.purple, border:`1.5px solid #CE93D8`, borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
              <ShieldAlert size={12} /> Finance View
            </span>
          )}
          <button className="rv-btn rv-btn-outline" onClick={exportCSV}><Download size={14} /> Export CSV</button>
          <button className="rv-btn rv-btn-primary" onClick={async () => { setSpinning(true); await load(); setTimeout(()=>setSpinning(false),600); }} disabled={spinning}>
            <SegmentedSpinner size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="rv-filter-bar">
        <div>
          <label>From Date</label>
          <input type="date" className="rv-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label>To Date</label>
          <input type="date" className="rv-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="rv-btn rv-btn-primary" style={{ marginTop:18 }} onClick={() => {}}>
          Apply Filter
        </button>
        <button className="rv-btn rv-btn-outline" style={{ marginTop:18 }} onClick={() => { setDateFrom(''); setDateTo(''); }}>
          Clear
        </button>
      </div>

      {/* ── REVENUE SECTION ── */}
      <p className="rv-section-title" style={{ marginBottom:12 }}><TrendingUp size={16} color={C.forest} /> Revenue</p>
      <div className="rv-grid-5" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:'1.5rem' }}>
        {[
          { lbl:'Gross Car Revenue',   amt: carRevenue,   iconBg:'#EFF6FF', icon:<Car       size={18} color={C.blue}   />, sub:`${filteredCar.length} orders`  },
          { lbl:'Gross Agri Revenue',  amt: agriRevenue,  iconBg:'#ECFDF5', icon:<Tractor   size={18} color={C.dark}   />, sub:`${filteredAgri.length} orders`  },
          { lbl:'Additional Fees',     amt: totalFees,    iconBg:'#FFF8E1', icon:<BarChart2  size={18} color="#F57F17" />, sub:'Extension / damage / late'       },
          { lbl:'Refunds Issued',      amt: totalRefunds, iconBg:'#FFEBEE', icon:<TrendingDown size={18} color={C.red}/>, sub:'Cancelled orders'                 },
          { lbl:'Net Revenue',         amt: netRevenue,   iconBg:'#E8F5E9', icon:<DollarSign  size={18} color={C.dark}/>, sub:'Gross + Fees − Refunds', highlight: true },
        ].map((m, i) => (
          <div key={i} className="rv-metric-card" style={{ animationDelay:`${i*.06}s`, ...(m.highlight ? { border:`2px solid ${C.forest}`, background:'#F1FAF2' } : {}) }}>
            <div className="icon-box" style={{ background: m.iconBg }}>{m.icon}</div>
            <div className="lbl">{m.lbl}</div>
            <div className="amt" style={{ fontSize: m.highlight ? '1.5rem' : '1.4rem', color: m.lbl.includes('Refunds') ? C.red : C.dark }}>{fmtCurrency(m.amt)}</div>
            <div className="sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── EXPENSE SECTION ── */}
      <hr className="rv-divider" />
      <p className="rv-section-title" style={{ marginBottom:12 }}><Wrench size={16} color={C.orange} /> Operating Expenses</p>
      <div className="rv-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:'1.5rem' }}>
        {[
          { lbl:'Maintenance Expense',  amt: maintExpense,  iconBg:'#FFF3E0', icon:<Wrench   size={18} color={C.orange}/>, sub:`${filteredMaint.length} records`  },
          { lbl:'Fuel & Service Expense',amt: fuelExpense,  iconBg:'#FFFDE7', icon:<Droplets size={18} color="#F9A825" />, sub:`${filteredFuel.length} records`  },
          { lbl:'Net Operating Result', amt: netOperating,  iconBg: netOperating >= 0 ? '#E8F5E9' : '#FFEBEE',
            icon: netOperating >= 0 ? <TrendingUp size={18} color={C.dark}/> : <TrendingDown size={18} color={C.red}/>,
            sub:'Net Revenue − Total Expense', highlight: true },
        ].map((m, i) => (
          <div key={i} className="rv-metric-card" style={{ animationDelay:`${(.3+i*.06)}s`, ...(m.highlight ? { border:`2px solid ${netOperating>=0?C.forest:C.red}` } : {}) }}>
            <div className="icon-box" style={{ background: m.iconBg }}>{m.icon}</div>
            <div className="lbl">{m.lbl}</div>
            <div className="amt" style={{ color: m.lbl.includes('Result') ? (netOperating >= 0 ? C.dark : C.red) : C.dark, fontSize:'1.4rem' }}>
              {fmtCurrency(m.amt)}
            </div>
            <div className="sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── FINANCE-ONLY SECTION ── */}
      {isFinance ? (
        <>
          <hr className="rv-divider" />
          <p className="rv-section-title" style={{ marginBottom:12 }}><ShieldAlert size={16} color={C.purple} /> Asset &amp; Finance Reconciliation <span style={{ background:'#F3E5F5',color:C.purple,borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:700,marginLeft:8 }}>Finance Only</span></p>
          <div className="rv-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'1.5rem' }}>
            <div className="rv-metric-card" style={{ border:`2px solid #CE93D8`, animationDelay:'.5s' }}>
              <div className="icon-box" style={{ background:'#F3E5F5' }}><PieChart size={18} color={C.purple} /></div>
              <div className="lbl">Total Asset / Book Value</div>
              <div className="amt" style={{ color:C.purple }}>{fmtCurrency(totalAssetValue)}</div>
              <div className="sub">{assets.length} registered assets (cars + tractors)</div>
            </div>
            <div className="rv-metric-card" style={{ border:`2px solid #CE93D8`, animationDelay:'.56s' }}>
              <div className="icon-box" style={{ background:'#F3E5F5' }}><TrendingUp size={18} color={C.purple} /></div>
              <div className="lbl">Return on Asset (ROA)</div>
              <div className="amt" style={{ color: Number(roa) >= 0 ? C.purple : C.red }}>
                {roa !== null ? `${roa}%` : 'N/A'}
              </div>
              <div className="sub">Net Revenue ÷ Asset Value × 100</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <hr className="rv-divider" />
          <div className="rv-finance-only">
            <ShieldAlert size={18} />
            <span>Asset purchase price, return on asset %, and finance reconciliation fields are <strong>Finance-only</strong> and not visible in this view.</span>
          </div>
          <div style={{ height: 16 }} />
        </>
      )}

      {/* ── BREAKDOWN CHART ── */}
      <hr className="rv-divider" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Car vs Agri breakdown */}
        <div className="rv-card" style={{ animationDelay:'.6s' }}>
          <p className="rv-section-title"><BarChart2 size={16} color={C.forest} /> Revenue by Type</p>
          {[
            { label:'Car Rental', val: carRevenue,  color: C.blue },
            { label:'Agri Equipment', val: agriRevenue, color: C.dark },
          ].map((r, i) => {
            const pct = grossRevenue > 0 ? Math.round((r.val / grossRevenue) * 100) : 0;
            return (
              <div key={i} className="rv-bar-row">
                <div className="rv-bar-label">{r.label}</div>
                <div className="rv-bar-track">
                  <div className="rv-bar-fill" style={{ width:`${pct}%`, background: r.color }} />
                </div>
                <div className="rv-bar-val">{pct}%</div>
              </div>
            );
          })}
          <div style={{ marginTop:12, display:'flex', justifyContent:'space-between', fontSize:12, color:C.textSec, fontWeight:600 }}>
            <span>Car: {fmtCurrency(carRevenue)}</span>
            <span>Agri: {fmtCurrency(agriRevenue)}</span>
          </div>
        </div>

        {/* Revenue vs Expense */}
        <div className="rv-card" style={{ animationDelay:'.65s' }}>
          <p className="rv-section-title"><TrendingUp size={16} color={C.forest} /> Revenue vs Expense</p>
          {[
            { label:'Net Revenue', val: netRevenue,   color: C.forest },
            { label:'Total Expense', val: totalExpense, color: C.orange },
          ].map((r, i) => {
            const maxV = Math.max(netRevenue, totalExpense, 1);
            const pct  = Math.round((r.val / maxV) * 100);
            return (
              <div key={i} className="rv-bar-row">
                <div className="rv-bar-label">{r.label}</div>
                <div className="rv-bar-track">
                  <div className="rv-bar-fill" style={{ width:`${pct}%`, background: r.color }} />
                </div>
                <div className="rv-bar-val" style={{ color: r.color }}>{fmtCurrency(r.val)}</div>
              </div>
            );
          })}
          <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background: netOperating>=0?'#E8F5E9':'#FFEBEE', fontSize:13, fontWeight:700, color: netOperating>=0?C.dark:C.red, display:'flex', justifyContent:'space-between' }}>
            <span>Net Operating Result</span><span>{fmtCurrency(netOperating)}</span>
          </div>
        </div>
      </div>

      {/* ── MONTHLY TREND TABLE ── */}
      <hr className="rv-divider" />
      <div className="rv-card" style={{ animationDelay:'.7s' }}>
        <p className="rv-section-title"><BarChart2 size={16} color={C.forest} /> Monthly Revenue Trend</p>
        {monthlyRows.length === 0 ? (
          <div className="rv-empty"><AlertCircle size={36} /><br />No data for the selected period.</div>
        ) : (
          <table className="rv-month-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Car Revenue</th>
                <th>Agri Revenue</th>
                <th>Total Revenue</th>
                <th>Share</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((r, i) => {
                const pct = grossRevenue > 0 ? ((r.total / grossRevenue) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={r.key}>
                    <td style={{ fontWeight:700 }}>{monthLabel(r.key)}</td>
                    <td>{fmtCurrency(r.car)}</td>
                    <td>{fmtCurrency(r.agri)}</td>
                    <td style={{ fontWeight:800, color:C.dark }}>{fmtCurrency(r.total)}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:6, background:'#F0F7F0', borderRadius:20, overflow:'hidden', minWidth:60 }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:C.forest, borderRadius:20 }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:C.textSec }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight:600, color:C.textSec }}>{r.count}</td>
                  </tr>
                );
              })}
              <tr style={{ background:'#F1FAF2', fontWeight:800 }}>
                <td><strong>Total</strong></td>
                <td>{fmtCurrency(carRevenue)}</td>
                <td>{fmtCurrency(agriRevenue)}</td>
                <td style={{ color:C.dark }}><strong>{fmtCurrency(grossRevenue)}</strong></td>
                <td>100%</td>
                <td>{filteredCar.length + filteredAgri.length}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default RevenueReport;
