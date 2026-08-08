import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, FileText, AlertTriangle, TrendingUp, Package,
  ArrowRight, Clock, HeartPulse, Activity, Star, BarChart2,
  Layers, Tag, DollarSign, RefreshCw, Sparkles, Sprout
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

      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.4s ease', width: '100%' }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome! &nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            {currentDate} · Worker Portal
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button onClick={fetchStats} className="btn-3d" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <SegmentedSpinner size={18} />
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
