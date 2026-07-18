import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, FileText, AlertTriangle, TrendingUp, Package,
  ArrowRight, Clock, HeartPulse, Activity, Star, BarChart2,
  Layers, Tag, DollarSign, RefreshCw, Sparkles
} from 'lucide-react';
import api from '../../services/apiClient';

const fmt = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();

// Soft pastel palette matching #E0EFF3 base
const COLORS = ['#4FA3C3', '#5BAD8A', '#E07B54', '#9B72CF', '#D4A843', '#4A90C4'];

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 0, height: 6, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 0, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1s ease'
    }} />
  </div>
);

const PharmacyWorkerHome = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [stats, setStats] = useState({
    todaySales: 0, todaySalesCount: 0,
    lowStockAlerts: [], expiredList: [],
    categoryBreakdown: [], grandTotal: { sku_count: 0, total_quantity: 0, total_value: 0 },
    topSelling: []
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      // apiClient interceptor already returns response.data
      // so 'res' here is the backend body: { status: 'success', data: {...} }
      const res = await api.get('/pharmacy/dashboard');
      const payload = res?.data || res || {};
      setStats({
        todaySales: payload.todaySales ?? 0,
        todaySalesCount: payload.todaySalesCount ?? 0,
        lowStockAlerts: payload.lowStockAlerts ?? [],
        expiredList: payload.expiredList ?? [],
        categoryBreakdown: payload.categoryBreakdown ?? [],
        grandTotal: payload.grandTotal ?? { sku_count: 0, total_quantity: 0, total_value: 0 },
        topSelling: payload.topSelling ?? [],
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 60 seconds for real-time updates
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const pendingPrescriptions = 0;
  const catBreakdown = stats.categoryBreakdown || [];
  const grand = stats.grandTotal || {};
  const topSelling = stats.topSelling || [];
  const maxValue = Math.max(...catBreakdown.map(c => Number(c.total_value || 0)), 1);

  return (
    <div style={{ margin: '-24px', padding: '2rem 2.5rem', minHeight: 'calc(100vh - 64px)', background: '#E0EFF3', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes laserSweep { 0% { left: -150%; } 100% { left: 150%; } }
        @keyframes colorBlink { 0% { color:#E07B54; filter:drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform:scale(1) rotate(0deg); } 25% { color:#D4A843; filter:drop-shadow(0 0 10px rgba(212,168,67,0.8)); transform:scale(1.15) rotate(10deg); } 50% { color:#5BAD8A; filter:drop-shadow(0 0 14px rgba(91,173,138,1)); transform:scale(1.3) rotate(-10deg); } 75% { color:#4FA3C3; filter:drop-shadow(0 0 10px rgba(79,163,195,0.8)); transform:scale(1.15) rotate(5deg); } 100% { color:#E07B54; filter:drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform:scale(1) rotate(0deg); } }
        .blink-star { animation: colorBlink 2.5s infinite ease-in-out; }
        
        /* 3D Header Styles */
        .artistic-3d-title { font-size:3rem; font-weight:900; color:#0d3349; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #4FA3C3, 5px 5px 0 #4FA3C3, 6px 6px 0 #2d7da0, 7px 7px 0 #2d7da0, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
        .artistic-3d-subtitle { font-size:1rem; color:#4A7A9B; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:0.15em; margin:0; text-shadow:1px 1px 0px rgba(255,255,255,0.9); }
        .btn-3d { background:linear-gradient(135deg, #ffffff, #e0eff3); color:#0d3349; border:2px solid #4FA3C3; border-radius:14px; padding:10px 24px; font-weight:900; font-size:14px; cursor:pointer; box-shadow:0px 5px 0px #4FA3C3, 0px 8px 15px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1); transition:all 0.1s cubic-bezier(0.4, 0, 0.2, 1); display:inline-flex; align-items:center; justify-content:center; gap:8px; text-transform:uppercase; letter-spacing:1.5px; margin:0; }
        .btn-3d:active { transform:translateY(6px); box-shadow:0px 0px 0px #4FA3C3, 0px 2px 5px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1); }
        .btn-3d:hover { filter:brightness(1.05); }
        .btn-text-3d { text-shadow:1px 1px 0px rgba(255,255,255,0.8); }

        .dash-card { 
          --hover-color: #4FA3C3;
          position:relative; overflow:hidden; background-color:white; border-radius:0; padding:24px; box-shadow:0 2px 12px rgba(0,80,120,0.07); transition:background-size 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s, transform 0.4s; animation: fadeUp 0.5s ease both; border: none; cursor:pointer;
          background-image: 
            linear-gradient(to right, var(--hover-color), var(--hover-color)),
            linear-gradient(to bottom, var(--hover-color), var(--hover-color)),
            linear-gradient(to left, var(--hover-color), var(--hover-color)),
            linear-gradient(to top, var(--hover-color), var(--hover-color));
          background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          background-repeat: no-repeat;
          background-size: 0% 4px, 4px 0%, 0% 4px, 4px 0%;
        }
        .dash-card::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.4) 20%, rgba(255,0,255,0.4) 50%, rgba(0,255,0,0.4) 80%, transparent 100%); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .dash-card:hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(0,80,120,0.14), 0 0 15px var(--hover-color); background-size: 100% 4px, 4px 100%, 100% 4px, 4px 100%; }
        .dash-card:hover::before { animation: laserSweep 0.8s ease-out; }
        .dash-card-glass { background:rgba(255,255,255,0.65); backdrop-filter:blur(12px); border-radius:0; padding:20px; border:1px solid rgba(255,255,255,0.8); box-shadow:0 2px 12px rgba(0,80,120,0.07); transition:all 0.3s ease; }
        .dash-card-glass:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,80,120,0.12); }
        .action-pill { position:relative; overflow:hidden; background:rgba(255,255,255,0.7); border:1.5px solid rgba(255,255,255,0.9); border-radius:0; padding:20px 16px; text-align:center; cursor:pointer; transition:all 0.3s ease; }
        .action-pill::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,255,0.6), rgba(255,0,255,0.6), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .action-pill:hover { transform:translateY(-4px) scale(1.03); box-shadow:0 10px 25px rgba(0,80,120,0.18), 0 0 15px rgba(255,0,255,0.3); background:white; border-color: rgba(255,0,255,0.5); }
        .action-pill:hover::before { animation: laserSweep 0.8s ease-in-out; }
        .alert-row { display:flex; align-items:center; gap:14px; padding:14px 16px; background:rgba(255,255,255,0.6); border-radius:0; cursor:pointer; transition:all 0.25s ease; border:1.5px solid transparent; margin-bottom:10px; position:relative; overflow:hidden; }
        .alert-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,0,255,0.3), rgba(0,255,255,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .alert-row:hover { background:white; border-color:var(--row-color); transform:translateX(4px); box-shadow:0 4px 14px rgba(0,0,0,0.08); }
        .alert-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
        .cat-row { display:grid; grid-template-columns:160px 1fr 80px 80px 110px; gap:12px; align-items:center; padding:12px 16px; border-radius:0; transition:background 0.2s; cursor:pointer; position:relative; overflow:hidden; }
        .cat-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(0,255,0,0.2), rgba(0,255,255,0.2), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .cat-row:hover { background:rgba(255,255,255,0.6); box-shadow:0 2px 8px rgba(0,80,120,0.05); }
        .cat-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
        .grand-row { display:grid; grid-template-columns:160px 1fr 80px 80px 110px; gap:12px; align-items:center; padding:14px 16px; border-radius:0; background:rgba(79,163,195,0.15); border:1.5px solid rgba(79,163,195,0.35); margin-top:6px; cursor:pointer; position:relative; overflow:hidden; transition:all 0.3s; }
        .grand-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(79,163,195,0.4), rgba(79,163,195,0.4), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .grand-row:hover { background:rgba(79,163,195,0.25); box-shadow:0 4px 12px rgba(0,80,120,0.1); }
        .grand-row:hover::before { animation: laserSweep 0.7s ease-in-out; }
        .top-sell-row { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:0; background:rgba(255,255,255,0.55); margin-bottom:8px; transition:all 0.2s ease; cursor:pointer; position:relative; overflow:hidden; }
        .top-sell-row::before { content:''; position:absolute; top:0; left:-150%; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(212,168,67,0.3), rgba(212,168,67,0.3), transparent); transform:skewX(-25deg); pointer-events:none; z-index:1; }
        .top-sell-row:hover { background:white; box-shadow:0 3px 12px rgba(0,80,120,0.1); border:1px solid rgba(212,168,67,0.4); }
        .top-sell-row:hover::before { animation: laserSweep 0.6s ease-in-out; }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.4s ease', width: '100%' }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome back <Sparkles className="blink-star" size={38} />
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            {currentDate} · Worker Portal
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button onClick={fetchStats} className="btn-3d" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span className="btn-text-3d">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI CARDS ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 18, marginBottom: 20 }}>

        {/* Today Revenue (Wide) */}
        <div className="dash-card" style={{ '--hover-color': '#4FA3C3', '--base-top': '#4FA3C3', color: 'white', background: 'linear-gradient(135deg,#4FA3C3,#2d7da0)' }} onClick={() => navigate('/pharmacy-worker/sales')}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>Today's Revenue</div>
          <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12 }}>
            <span style={{ fontSize: '1.1rem', opacity: 0.75, marginRight: 6 }}>ETB</span>{fmtInt(stats.todaySales)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <Activity size={15} />{stats.todaySalesCount || 0} transactions today
          </div>
          <div style={{ position: 'absolute', right: 24, top: 24, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <TrendingUp size={28} color="white" />
          </div>
        </div>

        {/* Grand Total SKUs */}
        <div className="dash-card" style={{ '--hover-color': '#4FA3C3' }} onClick={() => navigate('/pharmacy-worker/medicines')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total SKUs</div>
            <div style={{ background: '#E8F4F9', borderRadius: 0, padding: 8 }}><Layers size={18} color="#4FA3C3" /></div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0d3349', letterSpacing: '-0.03em', marginTop: 12, marginBottom: 6 }}>{fmtInt(grand.sku_count)}</div>
          <div style={{ fontSize: 12, color: '#7DA8C0', fontWeight: 600 }}>Unique medicines</div>
        </div>

        {/* Grand Total Qty */}
        <div className="dash-card" style={{ '--hover-color': '#5BAD8A' }} onClick={() => navigate('/pharmacy-worker/stock-operations')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Stock Units</div>
            <div style={{ background: '#E8F9F1', borderRadius: 0, padding: 8 }}><Package size={18} color="#5BAD8A" /></div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0d3349', letterSpacing: '-0.03em', marginTop: 12, marginBottom: 6 }}>{fmtInt(grand.total_quantity)}</div>
          <div style={{ fontSize: 12, color: '#7DA8C0', fontWeight: 600 }}>Items in stock</div>
        </div>

        {/* Grand Inventory Value */}
        <div className="dash-card" style={{ '--hover-color': '#E07B54' }} onClick={() => navigate('/pharmacy-worker/stock-operations')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7DA8C0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Inventory Value</div>
            <div style={{ background: '#FFF4EB', borderRadius: 0, padding: 8 }}><DollarSign size={18} color="#E07B54" /></div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d3349', letterSpacing: '-0.02em', marginTop: 12, marginBottom: 6 }}>ETB {fmtInt(grand.total_value)}</div>
          <div style={{ fontSize: 12, color: '#7DA8C0', fontWeight: 600 }}>Total stock value</div>
        </div>
      </div>

      {/* ── ROW 2: CATEGORY BREAKDOWN + TOP SALES ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 20 }}>

        {/* Category Breakdown */}
        <div className="dash-card" style={{ animationDelay: '0.25s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Tag size={18} color="#4FA3C3" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0d3349' }}>Category Breakdown</span>
          </div>

          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px 80px 110px', gap: 12, padding: '6px 16px', marginBottom: 4 }}>
            {['Category', '', 'SKUs', 'Units', 'ETB Value'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: '#9DBDCE', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>

          {catBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9DBDCE', fontSize: 13 }}>No data yet</div>
          ) : catBreakdown.map((cat, i) => (
            <div key={cat.category} className="cat-row" onClick={() => navigate('/pharmacy-worker/medicines?category=' + encodeURIComponent(cat.category))}>
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

          {/* Grand Total Row */}
          {catBreakdown.length > 0 && (
            <div className="grand-row" onClick={() => navigate('/pharmacy-worker/stock-operations')}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0d3349' }}>GRAND TOTAL</span>
              <div />
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0d3349', textAlign: 'right' }}>{fmtInt(grand.sku_count)}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0d3349', textAlign: 'right' }}>{fmtInt(grand.total_quantity)}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#4FA3C3', textAlign: 'right' }}>ETB {fmt(grand.total_value)}</span>
            </div>
          )}
        </div>

        {/* Top Selling Today */}
        <div className="dash-card" style={{ animationDelay: '0.3s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Star size={18} color="#D4A843" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0d3349' }}>Top Sales Today</span>
          </div>
          <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: 4 }}>
            {topSelling.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9DBDCE', fontSize: 13, fontWeight: 600 }}>
                <BarChart2 size={32} style={{ marginBottom: 8, opacity: 0.4 }} /><br />No sales yet today
              </div>
            ) : topSelling.map((item, i) => (
              <div key={item.name} className="top-sell-row" onClick={() => navigate('/pharmacy-worker/medicines?search=' + encodeURIComponent(item.name))}>
                <div style={{ width: 30, height: 30, borderRadius: 0, background: `${COLORS[i % COLORS.length]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: COLORS[i % COLORS.length] }}>#{i + 1}</span>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e4d6b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#9DBDCE', fontWeight: 600 }}>{fmtInt(item.units_sold)} units sold</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#5BAD8A', whiteSpace: 'nowrap' }}>
                  ETB {fmt(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18 }}>

        {/* Alerts */}
        <div className="dash-card" style={{ animationDelay: '0.35s', cursor: 'default' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0d3349', marginBottom: 14 }}>⚠ Attention</div>

          <div className="alert-row" style={{ '--row-color': '#f59e0b' }} onClick={() => navigate('/pharmacy-worker/stock-operations?tab=low')}>
            <div style={{ background: '#FEF3C7', padding: 10, borderRadius: 0 }}><AlertTriangle size={20} color="#d97706" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0d3349' }}>{stats.lowStockAlerts?.length || 0} Low Stock</div>
              <div style={{ fontSize: 11, color: '#9DBDCE', fontWeight: 600 }}>Requires restocking</div>
            </div>
            <ArrowRight size={16} color="#ccc" />
          </div>

          <div className="alert-row" style={{ '--row-color': '#f97316' }} onClick={() => navigate('/pharmacy-worker/stock-operations?tab=expiring')}>
            <div style={{ background: '#FFEDD5', padding: 10, borderRadius: 0 }}><Clock size={20} color="#f97316" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0d3349' }}>{stats.expiredList?.filter(e => e.status === 'expiring').length || 0} Expiring Soon</div>
              <div style={{ fontSize: 11, color: '#9DBDCE', fontWeight: 600 }}>Within 30 days</div>
            </div>
            <ArrowRight size={16} color="#ccc" />
          </div>

          <div className="alert-row" style={{ '--row-color': '#ef4444' }} onClick={() => navigate('/pharmacy-worker/stock-operations?tab=expired')}>
            <div style={{ background: '#FEE2E2', padding: 10, borderRadius: 0 }}><AlertTriangle size={20} color="#ef4444" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0d3349' }}>{stats.expiredList?.filter(e => e.status === 'expired').length || 0} Expired</div>
              <div style={{ fontSize: 11, color: '#9DBDCE', fontWeight: 600 }}>Needs disposal</div>
            </div>
            <ArrowRight size={16} color="#ccc" />
          </div>

          <div className="alert-row" style={{ '--row-color': '#d97706' }} onClick={() => navigate('/pharmacy-worker/rx/pending')}>
            <div style={{ background: '#FEF3C7', padding: 10, borderRadius: 0 }}><FileText size={20} color="#d97706" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0d3349' }}>{pendingPrescriptions} Rx Pending</div>
              <div style={{ fontSize: 11, color: '#9DBDCE', fontWeight: 600 }}>Prescription queue</div>
            </div>
            <ArrowRight size={16} color="#ccc" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-card" style={{ animationDelay: '0.4s', cursor: 'default' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0d3349', marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>

            {[
              { label: 'New Sale', sub: 'Open POS', icon: <ShoppingCart size={26} />, bg: '#E8F9F1', color: '#5BAD8A', path: '/pharmacy-worker/sales' },
              { label: 'Inventory', sub: 'View stock', icon: <Package size={26} />, bg: '#EDE9FE', color: '#8B5CF6', path: '/pharmacy-worker/stock-operations' },
              { label: 'Health Info', sub: 'Publish updates', icon: <HeartPulse size={26} />, bg: '#FDE8F3', color: '#EC4899', path: '/pharmacy-worker/health-publisher' },
              { label: 'Medicines', sub: 'Drug catalog', icon: <Layers size={26} />, bg: '#E8F4F9', color: '#4FA3C3', path: '/pharmacy-worker/medicines' },
              { label: 'Rx Queue', sub: 'Prescriptions', icon: <FileText size={26} />, bg: '#FEF3C7', color: '#D97706', path: '/pharmacy-worker/rx' },
              { label: 'Reports', sub: 'View analytics', icon: <BarChart2 size={26} />, bg: '#F1F5F9', color: '#475569', path: '/pharmacy-worker/stock-operations' },
            ].map((a, i) => (
              <div key={a.label} className="dash-card" onClick={() => navigate(a.path)} style={{ '--hover-color': '#20C997', padding: '28px', textAlign: 'center', animationDelay: `${0.4 + i * 0.05}s` }}>
                <div style={{ width: 52, height: 52, borderRadius: 0, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: a.color, transition: 'all 0.3s' }}>
                  {a.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0d3349', marginBottom: 3 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#9DBDCE', fontWeight: 600 }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyWorkerHome;
