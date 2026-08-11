import React, { useState, useEffect, useCallback } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';
import './RentalDashboard.css';

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', brown: '#8D6E63',
  sky: '#87CEEB', white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  orange: '#FF9800', red: '#F44336', purple: '#7C3AED',
};
const COLORS_ARR = [G.emerald, G.sky, G.orange, G.purple, G.lime, G.red];

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 0, height: 7, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 0, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease'
    }} />
  </div>
);

/* ─── Enterprise Design System ──────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .artistic-3d-title {
      font-size: 26px; font-weight: 600; color: #111827; letter-spacing: -0.02em;
      margin: 0; display: flex; align-items: center; gap: 10px; line-height: 1.3;
    }
    .artistic-3d-subtitle {
      font-size: 13px; color: #6B7280; font-weight: 500; text-align: center;
      text-transform: uppercase; letter-spacing: 0.05em; margin: 0; line-height: 1.5;
    }
    .blink-star { display: inline-block; animation: none; }

    .btn-sync {
      position: relative; background: #2563EB; color: #FFFFFF; border: none;
      height: 36px; padding: 0 16px; border-radius: 8px; font-weight: 500; font-size: 14px;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      margin: 0; box-shadow: none; text-transform: none; letter-spacing: normal;
      transition: background 150ms ease-in-out, transform 150ms ease-in-out;
    }
    .btn-sync:hover { background: #FFC107; color: #111827; }
    .btn-sync:active { transform: scale(0.98); }
    .btn-sync:disabled { opacity: 0.5; cursor: not-allowed; }

    .d-card {
      position: relative; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB;
      border-radius: 10px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      cursor: pointer; animation: fadeUp 150ms ease both;
      transition: box-shadow 150ms ease, transform 150ms ease;
    }
    .d-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

    .d-card-no-hover {
      position: relative; background: #FFFFFF; border: 1px solid #E5E7EB;
      border-radius: 10px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      animation: fadeUp 150ms ease both;
      transition: box-shadow 150ms ease, transform 150ms ease;
    }
    .d-card-no-hover:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

    .alert-row {
      position: relative; display: flex; align-items: center; gap: 14px; padding: 12px 16px;
      background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; cursor: pointer;
      margin-bottom: 10px; transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
    }
    .alert-row:hover { background: #EFF6FF; border-color: #BFDBFE; transform: translateX(2px); }

    .cat-row {
      position: relative; display: grid; grid-template-columns: 150px 1fr 70px; gap: 12px;
      align-items: center; padding: 10px 12px; border-radius: 8px; cursor: pointer;
      transition: background 150ms ease;
    }
    .cat-row:hover { background: #F9FAFB; }

    .top-row {
      position: relative; display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-radius: 8px; background: #F9FAFB; margin-bottom: 8px; cursor: pointer;
      transition: background 150ms ease;
    }
    .top-row:hover { background: #EFF6FF; }

    .qa-card {
      position: relative; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px;
      padding: 18px 14px; text-align: center; cursor: pointer;
      transition: box-shadow 150ms ease, transform 150ms ease;
    }
    .qa-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
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

const RentalDashboard = () => {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(() => {
    setRefreshing(true);
    const assets = rentalState.getAssets();
    const activeOrders = rentalState.getRentalOrders().filter(o => o.status === 'active');
    const maintenance = rentalState.getMaintenanceRecords().filter(m => m.status === 'in_progress');

    const totalFleetValue = assets.reduce((sum, a) => sum + (Number(a.cost) || 150000), 0);

    const fleetStats = {
        total: assets.length,
        cars: assets.filter(a => a.asset_type === 'car').length,
        agri: assets.filter(a => a.asset_type === 'agri_equipment').length,
        available: assets.filter(a => a.status === 'available').length,
        rented: assets.filter(a => a.status === 'rented').length,
        maintenance: assets.filter(a => a.status === 'maintenance').length,
        totalValue: totalFleetValue
    };

    setData({ fleetStats, activeOrders, maintenance, assets });
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  useEffect(() => {
    load();
    const unsub = rentalState.subscribe(load);
    return unsub;
  }, [load]);

  const nav = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

  if (!data) return <div>Loading...</div>;

  const { fleetStats, activeOrders, maintenance } = data;

  const statuses = ['available', 'rented', 'maintenance'];
  const statusColors = { 'available': G.emerald, 'rented': G.orange, 'maintenance': G.red };
  const maxStatusCount = Math.max(...statuses.map(s => fleetStats[s] || 0), 1);

  const recentActivity = [
      ...activeOrders.map(o => ({ id: `ord-${o.id}`, type: 'Rental', title: o.order_number, sub: `Active order`, date: o.start_datetime })),
      ...maintenance.map(m => ({ id: `mnt-${m.id}`, type: 'Maintenance', title: m.description, sub: m.asset_name, date: m.scheduled_date }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div className="rd-page" style={{ margin: '-24px', padding: '2.5rem', minHeight: 'calc(100vh - 64px)', background: '#E8F4EC', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <DecorPlants />

      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%', position:'relative', zIndex:1 }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome!&nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">
            Rental Management · It&apos;s {timeString}
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}>
                              <button onClick={load} className="btn-sync" disabled={refreshing} style={{ opacity: refreshing ? 0.7 : 1 }}>
            {refreshing && <SegmentedSpinner size={16} />}
            <span style={{ zIndex: 1, position: 'relative' }}>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Fleet Value Hero */}
        <div className="d-card" onClick={() => nav('/car-renting/fleet')}
          style={{ background: `linear-gradient(135deg,${G.forest} 0%,${G.dark} 100%)`, color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer', animationDelay: '0.05s' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.18)', borderRadius: 0, padding: 12 }}>
            <span style={{ fontSize: 24 }}>🚗</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>Total Fleet Size</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14 }}>
            {fleetStats.total} <span style={{ fontSize: '1.1rem', opacity: 0.75, marginLeft: 6 }}>Vehicles</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
            <span>📊</span> Across Car and AgriRent Lines
          </div>
        </div>

        {/* Cars */}
        <div className="d-card" style={{ animationDelay: '0.1s' }} onClick={() => nav('/car-renting/fleet')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cars Fleet</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>🚕</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{fleetStats.cars}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Standard vehicles</div>
        </div>

        {/* Agri Equipment */}
        <div className="d-card" style={{ animationDelay: '0.15s' }} onClick={() => nav('/car-renting/fleet')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Agri Equipment</span>
            <div style={{ background: '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>🚜</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: G.dark, letterSpacing: '-0.03em', margin: '12px 0 6px' }}>{fleetStats.agri}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Tractors &amp; Farming</div>
        </div>

        {/* Active Rentals */}
        <div className="d-card" style={{ animationDelay: '0.2s', background: activeOrders.length > 0 ? '#FFF8F0' : undefined }} onClick={() => nav('/car-renting/orders')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: activeOrders.length > 0 ? G.orange : G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active Rentals</span>
            <div style={{ background: activeOrders.length > 0 ? '#FFF4EB' : '#E6F2EB', borderRadius: 0, padding: 8 }}><span style={{ fontSize:18 }}>{activeOrders.length > 0 ? '⏱️' : '✅'}</span></div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: activeOrders.length > 0 ? G.orange : G.dark, margin: '12px 0 6px' }}>{activeOrders.length}</div>
          <div style={{ fontSize: 12, color: G.olive, fontWeight: 600 }}>Currently rented out</div>
        </div>
      </div>

      {/* ── ROW 2: FLEET STATUS BREAKDOWN + ACTIVITY FEED ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>

        {/* Fleet Status Breakdown */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize:18 }}>🔀</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: G.dark }}>Fleet Status Breakdown</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: G.olive, fontWeight: 700 }}>Real-time</span>
          </div>
          {/* Sub-KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Total Fleet',    val: fleetStats.total,       icon: '🚙', c: G.forest },
              { label: 'Available Now',  val: fleetStats.available,   icon: '✅', c: G.emerald },
              { label: 'Rented Out',     val: fleetStats.rented,      icon: '⏱️', c: G.orange },
              { label: 'In Maintenance', val: fleetStats.maintenance, icon: '🔧', c: G.red },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 0, padding: '12px 14px', border: `1.5px solid ${k.c}22` }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.c }}>{k.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.olive, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 60px', gap: 12, padding: '4px 14px', marginBottom: 6 }}>
            {['Status', '', 'Count'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: G.emerald, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          {statuses.map((status, i) => {
            const count = fleetStats[status];
            const c = statusColors[status] || COLORS_ARR[i % COLORS_ARR.length];
            return (
              <div key={status} className="cat-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 0, background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: G.dark, textTransform: 'capitalize' }}>{status}</span>
                </div>
                <CategoryBar value={count} max={maxStatusCount} color={c} />
                <span style={{ fontSize: 13, fontWeight: 700, color: G.dark, textAlign: 'right' }}>{count}</span>
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
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: G.olive, fontSize: 13 }}>
                <span style={{ fontSize:28, marginBottom: 8, opacity: 0.4 }}>📉</span><br />No activity yet
              </div>
            ) : recentActivity.map((l) => {
              const c = l.type === 'Rental' ? G.emerald : G.orange;
              const icon = l.type === 'Rental' ? '🤝' : '🔧';
              return (
                <div key={l.id} className="top-row">
                  <div style={{ width: 32, height: 32, borderRadius: 0, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.type}: {l.title}
                    </div>
                    <div style={{ fontSize: 10, color: G.olive, fontWeight: 600 }}>{l.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: c, whiteSpace: 'nowrap' }}>
                    {l.date ? new Date(l.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18, position:'relative', zIndex:1 }}>
        {/* Alerts */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.35s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 14 }}>⚠ Attention Required</div>
          {[
            { label: `${fleetStats.maintenance} In Maintenance`, sub: `Vehicles currently being serviced`, icon: '🔧', bg: '#FFFBEB', c: '#f59e0b', path: '/car-renting/maintenance' },
            { label: `${activeOrders.length} Active Rentals`, sub: 'Check end dates', icon: '⏱️', bg: '#EFF6FF', c: '#3b82f6', path: '/car-renting/orders' }
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
        </div>

        {/* Quick Actions */}
        <div className="d-card-no-hover" style={{ animationDelay: '0.4s' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.dark, marginBottom: 16 }}>⚡ Quick Operations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'View Fleet',      sub: 'All assets',   icon: '🚙', bg: '#E6F2EB', color: G.forest,  href: '/car-renting/fleet' },
              { label: 'New Rental',      sub: 'Create order', icon: '📝', bg: '#E8F9F1', color: G.emerald, href: '/car-renting/new-order' },
              { label: 'Maintenance',     sub: 'Requests',     icon: '🔧', bg: '#FFF3E0', color: G.orange,  href: '/car-renting/maintenance' },
              { label: 'Fuel & Service',  sub: 'Refills',      icon: '⛽', bg: '#E1F5FE', color: G.sky,     href: '/car-renting/fuel-service' },
              { label: 'Asset Register',  sub: 'New Vehicle',  icon: '➕', bg: '#F1F8E9', color: G.olive,   href: '/car-renting/add-asset' },
              { label: 'Store Requests',  sub: 'Parts/Spares', icon: '📦', bg: '#F3E5F5', color: G.purple,  href: '/car-renting/store-requests' },
              { label: 'Reports',         sub: 'Analytics',    icon: '📊', bg: '#EFEBE9', color: G.brown,   href: '/car-renting/reports' }
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

export default RentalDashboard;
