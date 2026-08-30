import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import pharmacyService from '../../services/pharmacyService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

import './PharmacyOverview.css';

const fmt    = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();

/* ── Inline SVG icon set — no emoji, no external lib ── */
const Icon = ({ name, size = 18, color = 'currentColor', style: s = {} }) => {
  const base = { width: size, height: size, display: 'block', flexShrink: 0, ...s };
  const P = {
    'trending-up':    <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    'pill':           <><path d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3"/><path d="m8 11 4-7"/><path d="M10.7 3.3a4.5 4.5 0 1 1 6.4 6.4L12 15l-6.3-6.3"/></>,
    'package':        <><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
    'alert-triangle': <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    'check-circle':   <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    'refresh-cw':     <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>,
    'x-circle':       <><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></>,
    'clock':          <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    'shopping-cart':  <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>,
    'bar-chart-2':    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    'file-text':      <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></>,
    'users':          <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    'tag':            <><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></>,
    'star':           <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    'trending-down':  <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
    'arrow-right':    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    'alert-circle':   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    'zap':            <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    'user':           <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" style={base}>
      {P[name] ?? <circle cx="12" cy="12" r="10"/>}
    </svg>
  );
};

const PharmacyOverview = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const tick = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      setError(null);
      const res     = await pharmacyService.getDashboardStats();
      const payload = res?.data || res || {};
      setStats({
        todaySales:        payload.todaySales        ?? 0,
        todaySalesCount:   payload.todaySalesCount   ?? 0,
        lowStockAlerts:    payload.lowStockAlerts    ?? [],
        expiredList:       payload.expiredList        ?? [],
        categoryBreakdown: payload.categoryBreakdown ?? [],
        grandTotal:        payload.grandTotal         ?? { sku_count: 0, total_quantity: 0, total_value: 0 },
        topSelling:        payload.topSelling         ?? [],
        pendingTransfers:  payload.pendingTransfers   ?? 0,
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
    const id = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  const nav = (path) => navigate(path);

  if (loading) {
    return (
      <div className="loader-screen">
        <SegmentedSpinner size={48} />
        <div style={{ marginTop: 16, fontWeight: 600 }}>Loading Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loader-screen">
        <Icon name="alert-circle" size={40} color="var(--color-danger)" style={{ marginBottom: 16 }} />
        <div style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 16 }}>{error}</div>
        <button onClick={() => fetchData(true)} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  const lowStockCount    = stats?.lowStockAlerts?.length || 0;
  const expiringCount    = stats?.expiredList?.filter(e => e.status === 'expiring').length || 0;
  const expiredCount     = stats?.expiredList?.filter(e => e.status === 'expired').length || 0;
  const pendingTransfers = stats?.pendingTransfers || 0;

  const catBreakdown = stats?.categoryBreakdown || [];
  const grand        = stats?.grandTotal || { sku_count: 0, total_quantity: 0, total_value: 0 };
  const topSelling   = stats?.topSelling || [];
  const maxValue     = Math.max(...catBreakdown.map(c => Number(c.total_value || 0)), 1);
  const firstName    = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager';

  const ALERTS = [
    { label: `${pendingTransfers} Pending Transfers`, sub: 'Stock movements', icon: 'refresh-cw',     bg: 'var(--color-info-bg)',    c: 'var(--color-info)',    path: '/pharmacy/stock-transfer?filter=pending' },
    { label: `${lowStockCount} Low Stock`,            sub: 'Need restocking', icon: 'alert-triangle', bg: 'var(--color-warning-bg)', c: 'var(--color-warning)', path: '/pharmacy/stock-operations?tab=low' },
    { label: `${expiringCount} Expiring Soon`,        sub: 'Within 30 days',  icon: 'clock',          bg: 'var(--color-warning-bg)', c: 'var(--color-warning)', path: '/pharmacy/stock-operations?tab=expiring' },
    { label: `${expiredCount} Expired Items`,         sub: 'Needs disposal',  icon: 'x-circle',       bg: 'var(--color-danger-bg)',  c: 'var(--color-danger)',  path: '/pharmacy/stock-operations?tab=expired' },
  ];

  const QUICK = [
    { label: 'POS Terminal', sub: 'New sale',     icon: 'shopping-cart', bg: 'var(--color-success-bg)', color: 'var(--color-success)', path: '/pharmacy/pos' },
    { label: 'Drug Catalog', sub: 'Browse meds',  icon: 'pill',          bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    path: '/pharmacy/medicines' },
    { label: 'Stock Ops',    sub: 'Manage stock', icon: 'package',       bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', path: '/pharmacy/stock-operations' },
    { label: 'Reports Hub',  sub: 'Analytics',    icon: 'bar-chart-2',   bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    path: '/pharmacy/reports-hub' },
    { label: 'Procurement',  sub: 'Orders',       icon: 'file-text',     bg: 'var(--color-success-bg)', color: 'var(--color-success)', path: '/pharmacy/procurement-requests' },
    { label: 'Staff',        sub: 'Team mgmt',    icon: 'users',         bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    path: '/pharmacy/staff' },
    { label: 'Expiry Mgmt',  sub: 'Review dates', icon: 'clock',         bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', path: '/pharmacy/expiry-management' },
  ];

  return (
    <div className="overview-container">

      {/* ── HEADER ── */}
      <div className="header-row">
        <div>
          <h1 className="page-title">Welcome, {firstName}!</h1>
          <p className="page-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
            PHARMACY MANAGEMENT · IT'S {timeString}
          </p>
        </div>
        <div>
          <button onClick={() => fetchData(false)} className="btn btn-primary" disabled={refreshing}>
            {refreshing
              ? <div className="spinner-ring" style={{ width: 14, height: 14, marginRight: 8 }} />
              : <Icon name="refresh-cw" size={14} style={{ marginRight: 8 }} />}
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI CARDS ── */}
      <div className="grid-kpi">

        <div className="card kpi-card kpi-primary" onClick={() => nav('/pharmacy/sales-list')}>
          <div className="kpi-header">
            <span className="label-text">Today's Revenue</span>
            <div className="kpi-icon"><Icon name="trending-up" size={20} color="currentColor" /></div>
          </div>
          <div className="kpi-value">
            <span style={{ fontSize: 16, opacity: 0.8, marginRight: 4 }}>ETB</span>{fmtInt(stats.todaySales)}
          </div>
          <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="user" size={13} /> {firstName} — {stats.todaySalesCount || 0} transactions
          </div>
        </div>

        <div className="card kpi-card" onClick={() => nav('/pharmacy/medicines')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: 'var(--color-primary)' }}>Total SKUs</span>
            <div className="kpi-icon" style={{ background: 'var(--color-info-bg)' }}>
              <Icon name="pill" size={20} color="var(--color-info)" />
            </div>
          </div>
          <div className="kpi-value">{fmtInt(grand.sku_count)}</div>
          <div className="kpi-sub">Unique medicines</div>
        </div>

        <div className="card kpi-card" onClick={() => nav('/pharmacy/stock-operations')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: 'var(--color-success)' }}>Stock Units</span>
            <div className="kpi-icon" style={{ background: 'var(--color-success-bg)' }}>
              <Icon name="package" size={20} color="var(--color-success)" />
            </div>
          </div>
          <div className="kpi-value">{fmtInt(grand.total_quantity)}</div>
          <div className="kpi-sub">Items in stock</div>
        </div>

        <div className="card kpi-card" onClick={() => nav('/pharmacy/stock-operations?tab=low')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>Low Stock</span>
            <div className="kpi-icon" style={{ background: lowStockCount > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' }}>
              {lowStockCount > 0
                ? <Icon name="alert-triangle" size={20} color="var(--color-warning)" />
                : <Icon name="check-circle"   size={20} color="var(--color-success)" />}
            </div>
          </div>
          <div className="kpi-value" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'inherit' }}>{lowStockCount}</div>
          <div className="kpi-sub">{lowStockCount > 0 ? 'Requires attention' : 'All caught up!'}</div>
        </div>
      </div>

      {/* ── ROW 2: CATEGORY BREAKDOWN + TOP SALES ── */}
      <div className="grid-2">

        <div className="card">
          <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="tag" size={16} color="var(--color-primary)" /> Category Breakdown
          </h3>
          <div className="sub-kpi-grid">
            <div className="sub-kpi"><div className="label-text">Total SKUs</div><div className="sub-kpi-val">{fmtInt(grand.sku_count)}</div></div>
            <div className="sub-kpi"><div className="label-text">Total Stock</div><div className="sub-kpi-val">{fmtInt(grand.total_quantity)}</div></div>
            <div className="sub-kpi"><div className="label-text">Inv. Value</div><div className="sub-kpi-val" style={{ color: 'var(--color-primary)' }}>{fmt(grand.total_value)}</div></div>
          </div>
          <div className="cat-header">
            <div className="label-text">Category</div>
            <div className="label-text cat-hide-mobile" />
            <div className="label-text" style={{ textAlign: 'right' }}>SKUs</div>
            <div className="label-text" style={{ textAlign: 'right' }}>Units</div>
            <div className="label-text" style={{ textAlign: 'right' }}>ETB Value</div>
          </div>
          {catBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>No product data yet</div>
          ) : catBreakdown.map((cat) => {
            const pct = maxValue > 0 ? Math.min(100, (Number(cat.total_value) / maxValue) * 100) : 0;
            return (
              <div key={cat.category} className="cat-row" onClick={() => nav('/pharmacy/medicines?category=' + encodeURIComponent(cat.category))}>
                <div style={{ fontWeight: 500, fontSize: 13, zIndex: 2 }}>{cat.category}</div>
                <div className="cat-hide-mobile progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ textAlign: 'right', fontWeight: 500, fontSize: 13, zIndex: 2 }}>{fmtInt(cat.sku_count)}</div>
                <div style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 500, fontSize: 13, zIndex: 2 }}>{fmtInt(cat.total_quantity)}</div>
                <div style={{ textAlign: 'right', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, zIndex: 2 }}>{fmt(cat.total_value)}</div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="star" size={16} color="var(--color-warning)" /> Top Sales Today
          </h3>
          {topSelling.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <Icon name="trending-down" size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
              No sales yet
            </div>
          ) : topSelling.map((item) => (
            <div key={item.name} className="list-item" onClick={() => nav('/pharmacy/medicines?search=' + encodeURIComponent(item.name))}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="shopping-cart" size={16} color="var(--color-info)" />
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{item.name}</div>
                <div className="list-item-sub">{fmtInt(item.units_sold)} units</div>
              </div>
              <div className="list-item-value" style={{ color: 'var(--color-success)' }}>ETB {fmt(item.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div className="grid-2">

        <div className="card">
          <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alert-circle" size={16} color="var(--color-warning)" /> Attention Required
          </h3>
          {ALERTS.map(row => (
            <div key={row.label} className="list-item" onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={row.icon} size={18} color={row.c} />
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{row.label}</div>
                <div className="list-item-sub">{row.sub}</div>
              </div>
              <Icon name="arrow-right" size={16} color="var(--color-text-muted)" />
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="zap" size={16} color="var(--color-primary)" /> Quick Operations
          </h3>
          <div className="qa-grid">
            {QUICK.map((a) => (
              <div key={a.label} className="qa-item" onClick={() => nav(a.path)}>
                <div className="qa-icon" style={{ background: a.bg, color: a.color }}>
                  <Icon name={a.icon} size={22} color={a.color} />
                </div>
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

export default PharmacyOverview;
