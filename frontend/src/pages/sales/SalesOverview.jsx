import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  ShieldCheck, Package, AlertTriangle, Clock, ArrowRight, DollarSign,
  Activity, BarChart2, ShoppingCart, TrendingUp, Star,
  ChevronRight, Zap, Layers, Tag, RefreshCw, FileText, Leaf
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import salesService from '../../services/salesService';
import apiClient from '../../services/apiClient';

// ─── Nature palette ──────────────────────────────────────────────────────────
const C  = '#228B22'; // Forest Green
const CD = '#1B5E20'; // Dark Green
const CE = '#2E8B57'; // Emerald Green
const CL = '#4CAF50'; // Leaf Green
const CS = '#A5D6A7'; // Sage Green

const fmt    = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();
const CAT_COLORS = [C, CE, CL, '#6B8E23', '#8BC34A', '#33691E', '#558B2F'];

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(34,139,34,0.12)', borderRadius: 0, height: 7, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 0, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

// ─── Global CSS ──────────────────────────────────────────────────────────────
const DASH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.9)} }
  @keyframes leafBlink {
    0%   { color:${C};   filter:drop-shadow(0 0 6px rgba(34,139,34,.6));  transform:scale(1)    rotate(0deg);  }
    25%  { color:${CL};  filter:drop-shadow(0 0 10px rgba(76,175,80,.8)); transform:scale(1.15) rotate(10deg); }
    50%  { color:${CE};  filter:drop-shadow(0 0 14px rgba(46,139,87,1));  transform:scale(1.3)  rotate(-10deg);}
    75%  { color:#8BC34A;filter:drop-shadow(0 0 10px rgba(139,195,74,.8));transform:scale(1.15) rotate(5deg);  }
    100% { color:${C};   filter:drop-shadow(0 0 6px rgba(34,139,34,.6));  transform:scale(1)    rotate(0deg);  }
  }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }

  .leaf-blink { animation: leafBlink 2.8s infinite ease-in-out; }

  .ov-title {
    font-size:2.9rem; font-weight:900; color:${CD}; letter-spacing:-.02em;
    text-shadow:
      1px 1px 0 #fff, 2px 2px 0 #fff,
      3px 3px 0 ${C},  4px 4px 0 ${C},
      5px 5px 0 ${CD}, 6px 6px 0 ${CD},
      7px 7px 16px rgba(0,0,0,.18);
    margin:0; display:flex; align-items:center; gap:12px; line-height:1.1;
  }
  .ov-sub {
    font-size:.9rem; color:${CE}; font-weight:800; text-transform:uppercase;
    letter-spacing:.15em; margin:0; text-shadow:1px 1px 0 rgba(255,255,255,.9);
  }

  .btn-refresh {
    display:inline-flex; align-items:center; gap:8px;
    padding:11px 24px; background:linear-gradient(135deg,#fff,#F5F5F5);
    color:${CD}; border:2px solid ${C}; border-radius:0; font-weight:900;
    font-size:13px; cursor:pointer; letter-spacing:.08em; text-transform:uppercase;
    box-shadow:0 5px 0 ${CD}, 0 8px 15px rgba(27,94,32,.2), inset 0 2px 0 rgba(255,255,255,1);
    transition:all .1s; font-family:'Inter',sans-serif;
  }
  .btn-refresh:active { transform:translateY(5px); box-shadow:0 0 0 ${CD}; }

  .d-card {
    --hc: ${C};
    position:relative; overflow:hidden; background:#fff; border-radius:0;
    padding:26px; box-shadow:0 2px 14px rgba(27,94,32,.08);
    transition:transform .35s, box-shadow .35s, background-size .35s; animation:fadeUp .5s ease both; cursor:pointer;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 3px, 3px 0%, 0% 3px, 3px 0%;
  }
  .d-card::before {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent 0%,rgba(76,175,80,.35) 25%,rgba(34,139,34,.45) 50%,rgba(76,175,80,.35) 75%,transparent 100%);
    transform:skewX(-25deg); pointer-events:none; z-index:1;
  }
  .d-card:hover {
    transform:translateY(-4px);
    box-shadow:0 12px 32px rgba(27,94,32,.16), 0 0 20px rgba(34,139,34,.18);
    background-size: 100% 3px, 3px 100%, 100% 3px, 3px 100%;
  }
  .d-card:hover::before { animation:laserSweep .75s ease-out; }

  .d-static {
    --hc: ${C};
    position:relative; overflow:hidden; background:#fff; border-radius:0;
    padding:26px; box-shadow:0 2px 14px rgba(27,94,32,.08);
    transition:box-shadow .35s, background-size .35s; animation:fadeUp .5s ease both;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 3px, 3px 0%, 0% 3px, 3px 0%;
  }
  .d-static::before {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(76,175,80,.2),rgba(34,139,34,.25),transparent);
    transform:skewX(-25deg); pointer-events:none; z-index:1;
  }
  .d-static:hover::before { animation:laserSweep 1s ease-out; }
  .d-static:hover { 
    box-shadow:0 6px 22px rgba(27,94,32,.12), 0 0 14px rgba(34,139,34,.1); 
    background-size: 100% 3px, 3px 100%, 100% 3px, 3px 100%;
  }

  .alert-row {
    --hc: var(--row-c, ${C});
    position:relative; overflow:hidden;
    display:flex; align-items:center; gap:14px; padding:13px 16px;
    background:rgba(245,245,245,.7); border-radius:0; cursor:pointer;
    transition:all .2s; border:none; margin-bottom:10px;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 2px, 2px 0%, 0% 2px, 2px 0%;
  }
  .alert-row::before {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(76,175,80,.3),rgba(34,139,34,.3),transparent);
    transform:skewX(-25deg); pointer-events:none; z-index:1;
  }
  .alert-row:hover { 
    background:#fff; transform:translateX(5px); box-shadow:0 4px 14px rgba(0,0,0,.07); 
    background-size: 100% 2px, 2px 100%, 100% 2px, 2px 100%;
  }
  .alert-row:hover::before { animation:laserSweep .6s ease-in-out; }

  .cat-row {
    --hc: ${CS};
    position:relative; overflow:hidden;
    display:grid; grid-template-columns:150px 1fr 70px 80px 120px; gap:12px;
    align-items:center; padding:11px 14px; border-radius:0; transition:all .2s; cursor:pointer;
    border: none;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 2px, 2px 0%, 0% 2px, 2px 0%;
  }
  .cat-row::before {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(76,175,80,.2),rgba(34,139,34,.2),transparent);
    transform:skewX(-25deg); pointer-events:none; z-index:1;
  }
  .cat-row:hover { 
    background:rgba(165,214,167,.1);
    background-size: 100% 2px, 2px 100%, 100% 2px, 2px 100%;
  }
  .cat-row:hover::before { animation:laserSweep .6s ease-in-out; }

  .sub-total-row {
    --hc: ${CE};
    display:grid; grid-template-columns:150px 1fr 70px 80px 120px; gap:12px;
    align-items:center; padding:10px 14px; border-radius:0;
    background:rgba(245,245,245,1); border:none;
    margin-top:4px; margin-bottom:16px;
    transition: all .2s;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 2px, 2px 0%, 0% 2px, 2px 0%;
  }
  .sub-total-row:hover {
    background-size: 100% 2px, 2px 100%, 100% 2px, 2px 100%;
  }

  .grand-row {
    --hc: ${C};
    position:relative; overflow:hidden;
    display:grid; grid-template-columns:150px 1fr 70px 80px 120px; gap:12px;
    align-items:center; padding:14px; border-radius:0;
    background:rgba(34,139,34,.1); border:none;
    margin-top:24px; cursor:default; transition:all .28s;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 3px, 3px 0%, 0% 3px, 3px 0%;
  }
  .grand-row::before {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(34,139,34,.4),rgba(34,139,34,.4),transparent);
    transform:skewX(-25deg); pointer-events:none; z-index:1;
  }
  .grand-row:hover { 
    background:rgba(34,139,34,.15); box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    background-size: 100% 3px, 3px 100%, 100% 3px, 3px 100%;
  }
  .grand-row:hover::before { animation:laserSweep .7s ease-in-out; }

  .top-row {
    --hc: ${C};
    position:relative; overflow:hidden;
    display:flex; align-items:center; gap:12px; padding:11px 14px;
    border-radius:0; background:rgba(165,214,167,.2); margin-bottom:8px;
    transition:all .2s; cursor:pointer; border:none;
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 2px, 2px 0%, 0% 2px, 2px 0%;
  }
  .top-row::before {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(76,175,80,.3),rgba(76,175,80,.3),transparent);
    transform:skewX(-25deg); pointer-events:none; z-index:1;
  }
  .top-row:hover { 
    background:#fff; box-shadow:0 3px 12px rgba(27,94,32,.1); 
    background-size: 100% 2px, 2px 100%, 100% 2px, 2px 100%;
  }
  .top-row:hover::before { animation:laserSweep .6s ease-in-out; }

  .qa-card {
    --hc: ${CE};
    position:relative; overflow:hidden; background:rgba(255,255,255,.75);
    border-radius:0; padding:22px 16px; text-align:center; cursor:pointer;
    transition:all .35s cubic-bezier(.4,0,.2,1);
    background-image:
      linear-gradient(to right,  var(--hc), var(--hc)),
      linear-gradient(to bottom, var(--hc), var(--hc)),
      linear-gradient(to left,   var(--hc), var(--hc)),
      linear-gradient(to top,    var(--hc), var(--hc));
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
    background-repeat: no-repeat;
    background-size: 0% 3px, 3px 0%, 0% 3px, 3px 0%;
  }
  .qa-card::before {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(76,175,80,.55),rgba(34,139,34,.55),transparent);
    transform:skewX(-25deg); pointer-events:none; z-index:1;
  }
  .qa-card:hover {
    transform:translateY(-4px);
    box-shadow:0 10px 24px rgba(27,94,32,.14), 0 0 18px rgba(46,139,87,.18);
    background-size: 100% 3px, 3px 100%, 100% 3px, 3px 100%;
  }
  .qa-card:hover::before { animation:laserSweep .6s ease-out; }
`;

// ────────────────────────────────────────────────────────────────────────────
const SalesOverview = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [timeString, setTimeString] = useState('');

  // live clock
  useEffect(() => {
    const tick = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  // data
  const fetchData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const [res, storeRes, prodRes] = await Promise.all([
        salesService.getTodaySummary().catch(() => ({ data: {} })),
        apiClient.get('/retail/store-inventory').catch(() => ({ data: [] })),
        salesService.getRetailProducts({ limit: 1000 }).catch(() => ({ data: [] }))
      ]);

      const payload = res?.data || res || {};
      
      // Calculate Store Inventory Data
      const storeStock = Array.isArray(storeRes?.data) ? storeRes.data : [];
      let storeTotalSKUs = 0;
      let storeTotalUnits = 0;
      let storeTotalValue = 0;
      const storeCatMap = {};
      
      storeStock.forEach(item => {
        const cat = item.category || item.product_category || 'Uncategorized';
        const qty = Number(item.stock_quantity) || 0;
        const val = qty * Number(item.unit_price || item.price || 0);
        
        storeTotalSKUs += 1;
        storeTotalUnits += qty;
        storeTotalValue += val;
        
        if (!storeCatMap[cat]) storeCatMap[cat] = { sku_count: 0, total_quantity: 0, total_value: 0 };
        storeCatMap[cat].sku_count += 1;
        storeCatMap[cat].total_quantity += qty;
        storeCatMap[cat].total_value += val;
      });
      const storeCategories = Object.keys(storeCatMap).map(k => ({ category: k, ...storeCatMap[k] }));

      // Calculate Stock Operations Data
      const rawProd = Array.isArray(prodRes) ? prodRes : prodRes?.data?.products || prodRes?.data || [];
      let retailTotalSKUs = 0;
      let retailTotalUnits = 0;
      let retailTotalValue = 0;
      const retailCatMap = {};
      
      rawProd.forEach(item => {
        const cat = item.category_name || item.category || 'Uncategorized';
        const qty = Number(item.stock_quantity || 0);
        const val = qty * Number(item.selling_price || item.price || 0);
        
        retailTotalSKUs += 1;
        retailTotalUnits += qty;
        retailTotalValue += val;
        
        if (!retailCatMap[cat]) retailCatMap[cat] = { sku_count: 0, total_quantity: 0, total_value: 0 };
        retailCatMap[cat].sku_count += 1;
        retailCatMap[cat].total_quantity += qty;
        retailCatMap[cat].total_value += val;
      });
      const retailCategories = Object.keys(retailCatMap).map(k => ({ category: k, ...retailCatMap[k] }));

      setStats({
        todaySales:       payload.total_revenue      ?? payload.todaySales      ?? 0,
        todaySalesCount:  payload.transaction_count  ?? payload.todaySalesCount ?? 0,
        customersServed:  payload.customersServed     ?? 0,
        lowStockAlerts:   payload.lowStockAlerts      ?? [],
        expiredList:      payload.expiredList         ?? [],
        topSelling:       payload.topSelling          ?? [],
        pendingTransfers: payload.pendingTransfers    ?? 0,
        
        // newly calculated data
        store: { totalSKUs: storeTotalSKUs, totalUnits: storeTotalUnits, totalValue: storeTotalValue, categories: storeCategories },
        retail: { totalSKUs: retailTotalSKUs, totalUnits: retailTotalUnits, totalValue: retailTotalValue, categories: retailCategories },
        grand: {
          totalSKUs: storeTotalSKUs + retailTotalSKUs,
          totalUnits: storeTotalUnits + retailTotalUnits,
          totalValue: storeTotalValue + retailTotalValue
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const t = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(t);
  }, [fetchData]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding:40, background:'#F5F5F5', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <style>{DASH_CSS}</style>
      <Leaf size={52} style={{ color:C, marginBottom:20, animation:'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ fontSize:20, color:CD, fontWeight:900 }}>Loading Dashboard…</div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ padding:40, background:'#F5F5F5', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <style>{DASH_CSS}</style>
      <AlertTriangle size={56} color="#ef4444" />
      <div style={{ fontSize:20, color:'#dc2626', fontWeight:800 }}>{error}</div>
      <button onClick={() => fetchData(true)} className="btn-refresh">Try Again</button>
    </div>
  );

  // ── Derived ────────────────────────────────────────────────────────────
  const lowStockCount    = stats.lowStockAlerts?.length                           || 0;
  const expiringCount    = stats.expiredList?.filter(e => e.status==='expiring').length || 0;
  const expiredCount     = stats.expiredList?.filter(e => e.status==='expired').length  || 0;
  const pendingTransfers = stats.pendingTransfers || 0;
  const topSelling       = stats.topSelling || [];
  
  const storeCat         = stats.store?.categories || [];
  const retailCat        = stats.retail?.categories || [];
  
  const maxStoreVal      = Math.max(...storeCat.map(c => Number(c.total_value || 0)), 1);
  const maxRetailVal     = Math.max(...retailCat.map(c => Number(c.total_value || 0)), 1);

  return (
    <div style={{
      margin:'-24px', padding:'2.5rem',
      minHeight:'calc(100vh - 64px)',
      background:'#F5F5F5',
      fontFamily:"'Inter','Segoe UI',sans-serif"
    }}>
      <style>{DASH_CSS}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', marginBottom:'2.5rem', animation:'fadeUp .35s ease', width:'100%' }}>
        <div style={{ justifySelf:'start' }}>
          <h1 className="ov-title">
            Sales HQ &nbsp;<ShieldCheck className="leaf-blink" size={36} />
          </h1>
        </div>
        <div style={{ justifySelf:'center' }}>
          <p className="ov-sub">
            Welcome, <span style={{ color:CD, fontWeight:900 }}>{user?.name?.split(' ')[0] || 'Manager'}</span>. It's {timeString}.
          </p>
        </div>
        <div style={{ justifySelf:'end' }}>
          <button onClick={() => fetchData(false)} className="btn-refresh" disabled={refreshing} style={{ opacity:refreshing ? .7 : 1 }}>
            <RefreshCw size={16} style={{ animation:refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Sync
          </button>
        </div>
      </div>

      {/* ── ROW 1 — KPI HERO CARDS ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr', gap:18, marginBottom:18 }}>

        {/* Revenue Hero */}
        <div className="d-card" onClick={() => navigate('/sales/pos')}
          style={{ background:`linear-gradient(135deg,${C} 0%,${CD} 100%)`, color:'white', animationDelay:'.05s',
            backgroundImage:`linear-gradient(135deg,${C} 0%,${CD} 100%)` }}>
          <div style={{ position:'absolute', right:-20, top:-20, width:150, height:150, borderRadius:0, background:'rgba(255,255,255,.07)' }} />
          <div style={{ position:'absolute', right:20, top:20, background:'rgba(255,255,255,.18)', borderRadius:0, padding:12 }}>
            <TrendingUp size={30} color="white" />
          </div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', opacity:.85, marginBottom:10 }}>Today's Revenue</div>
          <div style={{ fontSize:'3rem', fontWeight:900, letterSpacing:'-.04em', lineHeight:1, marginBottom:14 }}>
            <span style={{ fontSize:'1.1rem', opacity:.75, marginRight:6 }}>ETB</span>{fmtInt(stats.todaySales)}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:700, opacity:.9 }}>
            <Activity size={16} />{stats.todaySalesCount || 0} transactions · {stats.customersServed || 0} customers
          </div>
        </div>

        {/* Total SKUs */}
        <div className="d-card" style={{ animationDelay:'.10s' }} onClick={() => navigate('/sales/store-inventory')}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <span style={{ fontSize:10, fontWeight:800, color:CE, textTransform:'uppercase', letterSpacing:'.07em' }}>Total SKUs</span>
            <div style={{ background:'#E8F5E9', borderRadius:0, padding:8 }}><Layers size={18} color={C} /></div>
          </div>
          <div style={{ fontSize:'2.4rem', fontWeight:900, color:CD, letterSpacing:'-.03em', margin:'12px 0 6px' }}>{fmtInt(stats.grand?.totalSKUs)}</div>
          <div style={{ fontSize:12, color:CE, fontWeight:600 }}>Across all inventories</div>
        </div>

        {/* Stock Units */}
        <div className="d-card" style={{ animationDelay:'.15s' }} onClick={() => navigate('/sales/stock-operations')}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <span style={{ fontSize:10, fontWeight:800, color:CE, textTransform:'uppercase', letterSpacing:'.07em' }}>Stock Units</span>
            <div style={{ background:'#F1F8E9', borderRadius:0, padding:8 }}><Package size={18} color={CL} /></div>
          </div>
          <div style={{ fontSize:'2.4rem', fontWeight:900, color:CD, letterSpacing:'-.03em', margin:'12px 0 6px' }}>{fmtInt(stats.grand?.totalUnits)}</div>
          <div style={{ fontSize:12, color:CE, fontWeight:600 }}>Total physical items</div>
        </div>

        {/* Inventory Value */}
        <div className="d-card" style={{ animationDelay:'.20s' }} onClick={() => navigate('/sales/store-inventory')}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <span style={{ fontSize:10, fontWeight:800, color:CE, textTransform:'uppercase', letterSpacing:'.07em' }}>Inv. Value</span>
            <div style={{ background:'#E8F5E9', borderRadius:0, padding:8 }}><DollarSign size={18} color={C} /></div>
          </div>
          <div style={{ fontSize:'1.6rem', fontWeight:900, color:CD, margin:'12px 0 6px' }}>ETB {fmtInt(stats.grand?.totalValue)}</div>
          <div style={{ fontSize:12, color:CE, fontWeight:600 }}>Combined valuation</div>
        </div>
      </div>

      {/* ── ROW 2 — CATEGORY BREAKDOWN + TOP SALES ─────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:18, marginBottom:18 }}>

        {/* Category Breakdown */}
        <div className="d-static" style={{ animationDelay:'.25s' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Tag size={18} color={C} />
            <span style={{ fontSize:16, fontWeight:900, color:CD }}>Inventory Breakdown</span>
            <span style={{ marginLeft:'auto', fontSize:11, color:CE, fontWeight:700 }}>Live · split by location</span>
          </div>
          
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'150px 1fr 70px 80px 120px', gap:12, padding:'4px 14px', marginBottom:6 }}>
            {['Category','','SKUs','Units','ETB Value'].map(h => (
              <div key={h} style={{ fontSize:10, fontWeight:800, color:CE, textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
            ))}
          </div>

          {/* ── STORE INVENTORY ── */}
          <div style={{ fontSize:12, fontWeight:900, color:CD, borderBottom:`2px solid ${C}`, paddingBottom:4, marginBottom:8, marginTop:12, textTransform:'uppercase' }}>Store Inventory</div>
          {storeCat.length === 0 ? (
             <div style={{ textAlign:'center', padding:'10px 0', color:CS, fontSize:12 }}>No store data</div>
          ) : storeCat.map((cat, i) => (
            <div key={cat.category} className="cat-row" onClick={() => navigate('/sales/store-inventory')}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:0, background:CAT_COLORS[i % CAT_COLORS.length], flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:700, color:CD, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.category}</span>
              </div>
              <CategoryBar value={Number(cat.total_value||0)} max={maxStoreVal} color={CAT_COLORS[i % CAT_COLORS.length]} />
              <span style={{ fontSize:13, fontWeight:700, color:CD, textAlign:'right' }}>{fmtInt(cat.sku_count)}</span>
              <span style={{ fontSize:13, fontWeight:600, color:CE, textAlign:'right' }}>{fmtInt(cat.total_quantity)}</span>
              <span style={{ fontSize:12, fontWeight:800, color:C,  textAlign:'right' }}>{fmt(cat.total_value)}</span>
            </div>
          ))}
          <div className="sub-total-row">
             <span style={{ fontSize:12, fontWeight:800, color:CE, textTransform:'uppercase' }}>Store Subtotal</span>
             <div/>
             <span style={{ fontSize:12, fontWeight:800, color:CD, textAlign:'right' }}>{fmtInt(stats.store?.totalSKUs)}</span>
             <span style={{ fontSize:12, fontWeight:800, color:CD, textAlign:'right' }}>{fmtInt(stats.store?.totalUnits)}</span>
             <span style={{ fontSize:12, fontWeight:800, color:CD, textAlign:'right' }}>ETB {fmt(stats.store?.totalValue)}</span>
          </div>

          {/* ── STOCK OPERATIONS ── */}
          <div style={{ fontSize:12, fontWeight:900, color:CD, borderBottom:`2px solid ${C}`, paddingBottom:4, marginBottom:8, marginTop:12, textTransform:'uppercase' }}>Stock Operations</div>
          {retailCat.length === 0 ? (
             <div style={{ textAlign:'center', padding:'10px 0', color:CS, fontSize:12 }}>No operations data</div>
          ) : retailCat.map((cat, i) => (
            <div key={cat.category} className="cat-row" onClick={() => navigate('/sales/stock-operations')}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:0, background:CAT_COLORS[(i+3) % CAT_COLORS.length], flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:700, color:CD, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.category}</span>
              </div>
              <CategoryBar value={Number(cat.total_value||0)} max={maxRetailVal} color={CAT_COLORS[(i+3) % CAT_COLORS.length]} />
              <span style={{ fontSize:13, fontWeight:700, color:CD, textAlign:'right' }}>{fmtInt(cat.sku_count)}</span>
              <span style={{ fontSize:13, fontWeight:600, color:CE, textAlign:'right' }}>{fmtInt(cat.total_quantity)}</span>
              <span style={{ fontSize:12, fontWeight:800, color:C,  textAlign:'right' }}>{fmt(cat.total_value)}</span>
            </div>
          ))}
          <div className="sub-total-row">
             <span style={{ fontSize:12, fontWeight:800, color:CE, textTransform:'uppercase' }}>Operations Subtotal</span>
             <div/>
             <span style={{ fontSize:12, fontWeight:800, color:CD, textAlign:'right' }}>{fmtInt(stats.retail?.totalSKUs)}</span>
             <span style={{ fontSize:12, fontWeight:800, color:CD, textAlign:'right' }}>{fmtInt(stats.retail?.totalUnits)}</span>
             <span style={{ fontSize:12, fontWeight:800, color:CD, textAlign:'right' }}>ETB {fmt(stats.retail?.totalValue)}</span>
          </div>

          {/* ── OVERALL GRAND TOTAL ── */}
          <div className="grand-row">
            <span style={{ fontSize:13, fontWeight:900, color:CD, textTransform:'uppercase' }}>COMBINED TOTAL</span>
            <div />
            <span style={{ fontSize:13, fontWeight:900, color:CD, textAlign:'right' }}>{fmtInt(stats.grand?.totalSKUs)}</span>
            <span style={{ fontSize:13, fontWeight:900, color:CD, textAlign:'right' }}>{fmtInt(stats.grand?.totalUnits)}</span>
            <span style={{ fontSize:14, fontWeight:900, color:C,  textAlign:'right' }}>ETB {fmt(stats.grand?.totalValue)}</span>
          </div>
        </div>

        {/* Top Selling Today */}
        <div className="d-static" style={{ animationDelay:'.30s' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Star size={18} color={CL} />
            <span style={{ fontSize:15, fontWeight:900, color:CD }}>Top Sales Today</span>
          </div>
          {topSelling.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:CS, fontSize:13 }}>
              <BarChart2 size={28} style={{ marginBottom:8, opacity:.4 }} /><br />No sales yet
            </div>
          ) : topSelling.map((item, i) => (
            <div key={item.name} className="top-row"
              onClick={() => navigate('/sales/stock-operations?search=' + encodeURIComponent(item.name))}>
              <div style={{ width:28, height:28, borderRadius:0, background:`${CAT_COLORS[i % CAT_COLORS.length]}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:900, color:CAT_COLORS[i % CAT_COLORS.length] }}>#{i+1}</span>
              </div>
              <div style={{ flex:1, overflow:'hidden' }}>
                <div style={{ fontSize:12, fontWeight:700, color:CD, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize:10, color:CE, fontWeight:600 }}>{fmtInt(item.units_sold)} units</div>
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:C, whiteSpace:'nowrap' }}>ETB {fmt(item.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 3 — ALERTS + QUICK ACTIONS ─────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:18, marginBottom:18 }}>

        {/* Attention Required */}
        <div className="d-static" style={{ animationDelay:'.35s' }}>
          <div style={{ fontSize:15, fontWeight:900, color:CD, marginBottom:14 }}>⚠ Attention Required</div>
          {[
            {
              label:`${pendingTransfers} Pending Transfers`,
              sub:'Stock movements',
              icon:<ArrowRight size={18} color="#3b82f6"/>,
              bg:'#EFF6FF', c:'#3b82f6',
              path:'/sales/stock-operations'
            },
            {
              label:`${lowStockCount} Low Stock`,
              sub:'Need restocking',
              icon:<AlertTriangle size={18} color="#f59e0b"/>,
              bg:'#FFFBEB', c:'#f59e0b',
              path:'/sales/stock-operations?tab=low'
            },
            {
              label:`${expiringCount} Expiring Soon`,
              sub:'Within 30 days',
              icon:<Clock size={18} color="#f97316"/>,
              bg:'#FFEDD5', c:'#f97316',
              path:'/sales/stock-operations?tab=expiring'
            },
            {
              label:`${expiredCount} Expired Items`,
              sub:'Needs disposal',
              icon:<AlertTriangle size={18} color="#ef4444"/>,
              bg:'#FEE2E2', c:'#ef4444',
              path:'/sales/stock-operations?tab=expired'
            },
          ].map(row => (
            <div key={row.label} className="alert-row" style={{ '--row-c':row.c }} onClick={() => navigate(row.path)}>
              <div style={{ background:row.bg, padding:9, borderRadius:0 }}>{row.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:CD }}>{row.label}</div>
                <div style={{ fontSize:11, color:CE, fontWeight:600 }}>{row.sub}</div>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </div>
          ))}
        </div>

        {/* Quick Operations */}
        <div className="d-static" style={{ animationDelay:'.40s' }}>
          <div style={{ fontSize:15, fontWeight:900, color:CD, marginBottom:16 }}>⚡ Quick Operations</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
            {[
              { label:'POS Terminal',    sub:'New sale',         icon:<ShoppingCart size={24}/>, bg:'#E8F5E9', color:C,         path:'/sales/pos' },
              { label:'Stock Ops',       sub:'Manage stock',     icon:<Package size={24}/>,      bg:'#F1F8E9', color:CE,        path:'/sales/stock-operations' },
              { label:'Store Inventory', sub:'View stock',       icon:<BarChart2 size={24}/>,    bg:'#E8F5E9', color:CD,        path:'/sales/store-inventory' },
              { label:'Finance',         sub:'Review & approve', icon:<DollarSign size={24}/>,   bg:'#ECFDF5', color:'#059669', path:'/sales/finance-review' },
              { label:'CEO Report',      sub:'Analytics',        icon:<FileText size={24}/>,     bg:'#F1F8E9', color:C,         path:'/sales/ceo-report' },
            ].map((a, i) => (
              <div key={a.label} className="qa-card" onClick={() => navigate(a.path)} style={{ animationDelay:`${.40 + i*.04}s` }}>
                <div style={{ width:46, height:46, borderRadius:0, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', color:a.color }}>
                  {a.icon}
                </div>
                <div style={{ fontSize:11, fontWeight:800, color:CD, marginBottom:2 }}>{a.label}</div>
                <div style={{ fontSize:10, color:CE, fontWeight:600 }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;

