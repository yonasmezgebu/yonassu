import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  ShieldCheck, Package, AlertTriangle, Clock, ArrowRight, DollarSign,
  Users, Activity, BarChart2, ShoppingCart, TrendingUp, Star,
  Stethoscope, ChevronRight, Zap, Layers, Tag, RefreshCw, FileText, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import salesService from '../../services/salesService';

const fmt = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();

const COLORS = ['#4FA3C3', '#5BAD8A', '#E07B54', '#9B72CF', '#8BC34A', '#4A90C4', '#58B09C'];

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 0, height: 7, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 0, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

const SalesOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      setError(null);
      // apiClient interceptor already returns response.data
      // so 'res' here is the backend body: { status: 'success', data: {...} }
      const res = await salesService.getTodaySummary();
      const payload = res?.data || res || {};
      setStats({
        todaySales: payload.total_revenue ?? payload.todaySales ?? 0,
        todaySalesCount: payload.transaction_count ?? payload.todaySalesCount ?? 0,
        lowStockAlerts: payload.lowStockAlerts ?? [],
        expiredList: payload.expiredList ?? [],
        categoryBreakdown: payload.categoryBreakdown ?? [],
        grandTotal: payload.grandTotal ?? { sku_count: 0, total_quantity: 0, total_value: 0 },
        topSelling: payload.topSelling ?? [],
        pendingTransfers: payload.pendingTransfers ?? 0,
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
    // Auto-refresh every 60 seconds so category totals update after sales
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ padding: 40, background: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.9)} }`}</style>
        <Zap size={48} style={{ color: '#4FA3C3', marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ fontSize: 20, color: '#0d3349', fontWeight: 800 }}>Loading Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, background: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <AlertTriangle size={56} color="#ef4444" />
        <div style={{ fontSize: 20, color: '#dc2626', fontWeight: 800 }}>{error}</div>
        <button onClick={() => fetchData(true)} style={{ padding: '14px 32px', background: '#0d3349', color: 'white', border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  const lowStockCount = stats.lowStockAlerts?.length || 0;
  const expiringCount = stats.expiredList?.filter(e => e.status === 'expiring').length || 0;
  const expiredCount = stats.expiredList?.filter(e => e.status === 'expired').length || 0;
  const pendingTransfers = stats.pendingTransfers || 0;
  const catBreakdown = stats.categoryBreakdown || [];
  const grand = stats.grandTotal || {};
  const topSelling = stats.topSelling || [];
  const maxValue = Math.max(...catBreakdown.map(c => Number(c.total_value || 0)), 1);

  return (
    <div style={{ margin: '-24px', padding: '2.5rem', minHeight: 'calc(100vh - 64px)', background: '#F5F5F5', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes laserSweep { 0% { left: -150%; } 100% { left: 150%; } }
        @keyframes colorBlink { 0% { color:#E07B54; filter:drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform:scale(1) rotate(0deg); } 25% { color:#8BC34A; filter:drop-shadow(0 0 10px rgba(212,168,67,0.8)); transform:scale(1.15) rotate(10deg); } 50% { color:#5BAD8A; filter:drop-shadow(0 0 14px rgba(91,173,138,1)); transform:scale(1.3) rotate(-10deg); } 75% { color:#4FA3C3; filter:drop-shadow(0 0 10px rgba(79,163,195,0.8)); transform:scale(1.15) rotate(5deg); } 100% { color:#E07B54; filter:drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform:scale(1) rotate(0deg); } }
        .blink-star { animation: colorBlink 2.5s infinite ease-in-out; }
        
        /* 3D Header Styles */
        .artistic-3d-title { font-size:3rem; font-weight:900; color:#0d3349; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #4FA3C3, 5px 5px 0 #4FA3C3, 6px 6px 0 #2d7da0, 7px 7px 0 #2d7da0, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
        .artistic-3d-subtitle { font-size:1rem; color:#4A7A9B; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:0.15em; margin:0; text-shadow:1px 1px 0px rgba(255,255,255,0.9); }
        .btn-3d { background:linear-gradient(135deg, #ffffff, #F5F5F5); color:#0d3349; border:2px solid #4FA3C3; border-radius: 0; padding:10px 24px; font-weight:900; font-size:14px; cursor:pointer; box-shadow:0px 5px 0px #4FA3C3, 0px 8px 15px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1); transition:all 0.1s cubic-bezier(0.4, 0, 0.2, 1); display:inline-flex; align-items:center; justify-content:center; gap:8px; text-transform:uppercase; letter-spacing:1.5px; margin:0; }
        .btn-3d:active { transform:translateY(6px); box-shadow:0px 0px 0px #4FA3C3, 0px 2px 5px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1); }
        .btn-3d:hover { filter:brightness(1.05); }
        .btn-text-3d { text-shadow:1px 1px 0px rgba(255,255,255,0.8); }

        .d-card { 
          --hover-color: #4FA3C3;
          position:relative; overflow:hidden; background-color:white; border-radius: 0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s, transform 0.4s; animation:fadeUp 0.5s ease both; border:none; cursor:pointer;
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
          --hover-color: #4FA3C3;
          position:relative; overflow:hidden; background:white; border-radius: 0; padding:26px; box-shadow:0 2px 14px rgba(0,80,120,0.08); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s; animation:fadeUp 0.5s ease both;
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
        .alert-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:14px; padding:13px 16px; background:rgba(245,245,245,0.5); border-radius: 0; cursor:pointer; transition:all 0.25s; border:1.5px solid transparent; margin-bottom:10px; }
        .alert-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,0,255,0.3), rgba(0,255,255,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .alert-row:hover { background:white; border-color:var(--row-c); transform:translateX(4px); box-shadow:0 4px 14px rgba(0,0,0,0.08); }
        .alert-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
        .cat-row { position:relative; overflow:hidden; display:grid; grid-template-columns:150px 1fr 70px 80px 120px; gap:12px; align-items:center; padding:11px 14px; border-radius: 0; transition:background 0.2s; cursor:pointer; }
        .cat-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,0,0.2), rgba(0,255,255,0.2), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .cat-row:hover { background:rgba(224,239,243,0.6); box-shadow:0 2px 8px rgba(0,80,120,0.05); }
        .cat-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
        .grand-row { position:relative; overflow:hidden; display:grid; grid-template-columns:150px 1fr 70px 80px 120px; gap:12px; align-items:center; padding:14px; border-radius: 0; background:rgba(79,163,195,0.12); border:1.5px solid rgba(79,163,195,0.3); margin-top:8px; cursor:pointer; transition:all 0.3s; }
        .grand-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(79,163,195,0.4), rgba(79,163,195,0.4), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .grand-row:hover { background:rgba(79,163,195,0.25); box-shadow:0 4px 12px rgba(0,80,120,0.1); }
        .grand-row:hover::before { animation: laserSweep 0.7s ease-in-out; }
        .top-row { position:relative; overflow:hidden; display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius: 0; background:rgba(224,239,243,0.45); margin-bottom:8px; transition:all 0.2s; cursor:pointer; }
        .top-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(212,168,67,0.3), rgba(212,168,67,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .top-row:hover { background:white; box-shadow:0 3px 12px rgba(0,80,120,0.09); border:1px solid rgba(212,168,67,0.4); }
        .top-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
        .qa-card { 
          --hover-color: #20C997;
          --base-top: transparent;
          position:relative; overflow:hidden; background:rgba(255,255,255,0.65); border-radius: 0; padding:22px 16px; text-align:center; cursor:pointer; transition:all 0.4s cubic-bezier(.4,0,.2,1); border:none;
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
        .qa-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,80,120,0.12), 0 0 14px #20C997; background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%, 100% 4px; }
        .qa-card:hover::before { animation: laserSweep 0.6s ease-out; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%' }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Sales HQ. <ShieldCheck className="blink-star" size={38} />
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            Welcome, <span style={{ color: '#0d3349', fontWeight: 900 }}>{user?.name?.split(' ')[0] || 'Manager'}</span>. It's {timeString}.
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button onClick={() => fetchData(false)} className="btn-3d" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span className="btn-text-3d">Sync</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Revenue Hero */}
        <div className="d-card" onClick={() => navigate('/sales-list')}
          style={{ background: 'linear-gradient(135deg,#4FA3C3 0%,#2d7da0 100%)', color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 0, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <TrendingUp size={30} color="white" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>Today's Revenue</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14 }}>
            <span style={{ fontSize: '1.1rem', opacity: 0.75, marginRight: 6 }}>ETB</span>{fmtInt(stats.todaySales)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
            <Activity size={16} />{stats.todaySalesCount || 0} transactions · {stats.customersServed || 0} customers
          </div>
        </div>

        {/* Total SKUs */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => navigate('/sales/products')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total SKUs</span>
            <div style={{ background: '#E8F4F9', borderRadius: 0, padding: 8 }}><Layers size={18} color="#4FA3C3" /></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0d3349', letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{fmtInt(grand.sku_count)}</div>
          <div style={{ fontSize: 12, color: '#7DA8C0', fontWeight: 600 }}>Unique products</div>
        </div>

        {/* Total Stock Units */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => navigate('/sales/stock-operations')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Stock Units</span>
            <div style={{ background: '#E8F9F1', borderRadius: 0, padding: 8 }}><Package size={18} color="#5BAD8A" /></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0d3349', letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{fmtInt(grand.total_quantity)}</div>
          <div style={{ fontSize: 12, color: '#7DA8C0', fontWeight: 600 }}>Items in stock</div>
        </div>

        {/* Inventory Value */}
        <div className="d-card" style={{ animationDelay: '0.2s' }} onClick={() => navigate('/sales/stock-operations')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Inv. Value</span>
            <div style={{ background: '#FFF4EB', borderRadius: 0, padding: 8 }}><DollarSign size={18} color="#E07B54" /></div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0d3349', margin: '12px 0 6px' }}>ETB {fmtInt(grand.total_value)}</div>
          <div style={{ fontSize: 12, color: '#7DA8C0', fontWeight: 600 }}>Total inventory</div>
        </div>
      </div>

      {/* ── ROW 2: CATEGORY + TOP SALES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>

        {/* Category Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Tag size={18} color="#4FA3C3" />
            <span style={{ fontSize: 16, fontWeight: 900, color: '#0d3349' }}>Category Breakdown</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9DBDCE', fontWeight: 700 }}>Live · auto-refreshes</span>
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px 80px 120px', gap: 12, padding: '4px 14px', marginBottom: 6 }}>
            {['Category', '', 'SKUs', 'Units', 'ETB Value'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: '#9DBDCE', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          {catBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#9DBDCE', fontSize: 13 }}>No product data yet</div>
          ) : catBreakdown.map((cat, i) => (
            <div key={cat.category} className="cat-row" onClick={() => navigate('/sales/products?category=' + encodeURIComponent(cat.category))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 0, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e4d6b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</span>
              </div>
              <CategoryBar value={Number(cat.total_value || 0)} max={maxValue} color={COLORS[i % COLORS.length]} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0d3349', textAlign: 'right' }}>{fmtInt(cat.sku_count)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4A7A9B', textAlign: 'right' }}>{fmtInt(cat.total_quantity)}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#4FA3C3', textAlign: 'right' }}>{fmt(cat.total_value)}</span>
            </div>
          ))}
          {catBreakdown.length > 0 && (
            <div className="grand-row" onClick={() => navigate('/sales/stock-operations')}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0d3349' }}>GRAND TOTAL</span>
              <div />
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0d3349', textAlign: 'right' }}>{fmtInt(grand.sku_count)}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0d3349', textAlign: 'right' }}>{fmtInt(grand.total_quantity)}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#4FA3C3', textAlign: 'right' }}>ETB {fmt(grand.total_value)}</span>
            </div>
          )}
        </div>

        {/* Top Sales + Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Top Selling */}
          <div className="d-card-no-hover" style={{ flex: 1, animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Star size={18} color="#8BC34A" />
              <span style={{ fontSize: 15, fontWeight: 900, color: '#0d3349' }}>Top Sales Today</span>
            </div>
            {topSelling.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9DBDCE', fontSize: 13 }}>
                <BarChart2 size={28} style={{ marginBottom: 8, opacity: 0.4 }} /><br />No sales yet
              </div>
            ) : topSelling.map((item, i) => (
              <div key={item.name} className="top-row" onClick={() => navigate('/sales/products?search=' + encodeURIComponent(item.name))}>
                <div style={{ width: 28, height: 28, borderRadius: 0, background: `${COLORS[i % COLORS.length]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: COLORS[i % COLORS.length] }}>#{i + 1}</span>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e4d6b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#9DBDCE', fontWeight: 600 }}>{fmtInt(item.units_sold)} units</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#5BAD8A', whiteSpace: 'nowrap' }}>ETB {fmt(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18 }}>

        {/* Alerts */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0d3349', marginBottom: 14 }}>⚠ Attention Required</div>

          {[
            { label: `${pendingTransfers} Pending Transfers`, sub: 'Stock movements', icon: <ArrowRight size={18} color="#3b82f6" />, bg: '#EFF6FF', c: '#3b82f6', path: '/sales/stock-transfer?filter=pending' },
            { label: `${lowStockCount} Low Stock`, sub: 'Need restocking', icon: <AlertTriangle size={18} color="#f59e0b" />, bg: '#FFFBEB', c: '#f59e0b', path: '/sales/stock-operations?tab=low' },
            { label: `${expiringCount} Expiring Soon`, sub: 'Within 30 days', icon: <Clock size={18} color="#f97316" />, bg: '#FFEDD5', c: '#f97316', path: '/sales/stock-operations?tab=expiring' },
            { label: `${expiredCount} Expired Items`, sub: 'Needs disposal', icon: <AlertTriangle size={18} color="#ef4444" />, bg: '#FEE2E2', c: '#ef4444', path: '/sales/stock-operations?tab=expired' },
          ].map(row => (
            <div key={row.label} className="alert-row" style={{ '--row-c': row.c }} onClick={() => navigate(row.path)}>
              <div style={{ background: row.bg, padding: 9, borderRadius: 0 }}>{row.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0d3349' }}>{row.label}</div>
                <div style={{ fontSize: 11, color: '#9DBDCE', fontWeight: 600 }}>{row.sub}</div>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0d3349', marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'POS Terminal', sub: 'New sale', icon: <ShoppingCart size={24} />, bg: '#E8F9F1', color: '#5BAD8A', path: '/sales/pos' },
              { label: 'product Catalog', sub: 'Browse meds', icon: <Stethoscope size={24} />, bg: '#EDE9FE', color: '#8B5CF6', path: '/sales/products' },
              { label: 'Stock Ops', sub: 'Manage stock', icon: <Package size={24} />, bg: '#E8F4F9', color: '#4FA3C3', path: '/sales/stock-operations' },
              { label: 'Reports Hub', sub: 'Analytics', icon: <BarChart2 size={24} />, bg: '#F1F5F9', color: '#475569', path: '/sales/reports-hub' },
              { label: 'Procurement', sub: 'Orders', icon: <FileText size={24} />, bg: '#FEF3C7', color: '#D97706', path: '/sales/procurement-requests' },
              { label: 'Staff', sub: 'Team mgmt', icon: <Users size={24} />, bg: '#FDE8F3', color: '#EC4899', path: '/sales/staff' },
              { label: 'Expiry Mgmt', sub: 'Review dates', icon: <Clock size={24} />, bg: '#FFEDD5', color: '#f97316', path: '/sales/expiry-management' },
              { label: 'Finance', sub: 'Review & approve', icon: <DollarSign size={24} />, bg: '#ECFDF5', color: '#059669', path: '/sales/finance-review' },
            ].map((a, i) => (
              <div key={a.label} className="qa-card" onClick={() => navigate(a.path)} style={{ animationDelay: `${0.4 + i * 0.04}s` }}>
                <div style={{ width: 46, height: 46, borderRadius: 0, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: a.color }}>
                  {a.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0d3349', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 10, color: '#9DBDCE', fontWeight: 600 }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;
