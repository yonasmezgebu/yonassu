import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import pharmacyService from '../../services/pharmacyService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

import './PharmacyOverview.css';

const fmt = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();

const PharmacyOverview = () => {
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
      const res = await pharmacyService.getDashboardStats();
      const payload = res?.data || res || {};
      setStats({
        todaySales: payload.todaySales ?? 0,
        todaySalesCount: payload.todaySalesCount ?? 0,
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
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const nav = (path) => { navigate(path); };

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
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 16 }}>{error}</div>
        <button onClick={() => fetchData(true)} className="btn btn-primary">
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const lowStockCount = stats?.lowStockAlerts?.length || 0;
  const expiringCount = stats?.expiredList?.filter(e => e.status === 'expiring').length || 0;
  const expiredCount = stats?.expiredList?.filter(e => e.status === 'expired').length || 0;
  const pendingTransfers = stats?.pendingTransfers || 0;
  
  const catBreakdown = stats?.categoryBreakdown || [];
  const grand = stats?.grandTotal || { sku_count: 0, total_quantity: 0, total_value: 0 };
  const topSelling = stats?.topSelling || [];
  const maxValue = Math.max(...catBreakdown.map(c => Number(c.total_value || 0)), 1);

  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager';

  return (
    <div className="overview-container">
      {/* ── HEADER ── */}
      <div className="header-row">
        <div>
          <h1 className="page-title">Welcome!</h1>
          <p className="page-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
            PHARMACY MANAGEMENT · IT'S {timeString}
          </p>
        </div>
        <div>
          <button onClick={() => fetchData(false)} className="btn btn-primary" disabled={refreshing}>
            {refreshing && <div className="spinner-ring" style={{ width: 14, height: 14, marginRight: 8 }}></div>}
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div className="grid-kpi">
        {/* Revenue Hero */}
        <div className="card kpi-card kpi-primary" onClick={() => nav('/pharmacy/sales-list')}>
          <div className="kpi-header">
            <span className="label-text">Today's Revenue</span>
            <div className="kpi-icon">📈</div>
          </div>
          <div className="kpi-value">
            <span style={{ fontSize: 16, opacity: 0.8, marginRight: 4 }}>ETB</span>{fmtInt(stats.todaySales)}
          </div>
          <div className="kpi-sub">
            👋 Hello, {firstName} - {stats.todaySalesCount || 0} transactions
          </div>
        </div>

        {/* Total SKUs */}
        <div className="card kpi-card" onClick={() => nav('/pharmacy/medicines')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: 'var(--color-primary)' }}>Total SKUs</span>
            <div className="kpi-icon" style={{ background: 'var(--color-info-bg)' }}>💊</div>
          </div>
          <div className="kpi-value">{fmtInt(grand.sku_count)}</div>
          <div className="kpi-sub">Unique medicines</div>
        </div>

        {/* Total Stock Units */}
        <div className="card kpi-card" onClick={() => nav('/pharmacy/stock-operations')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: 'var(--color-success)' }}>Stock Units</span>
            <div className="kpi-icon" style={{ background: 'var(--color-success-bg)' }}>📦</div>
          </div>
          <div className="kpi-value">{fmtInt(grand.total_quantity)}</div>
          <div className="kpi-sub">Items in stock</div>
        </div>

        {/* Alerts / Low Stock */}
        <div className="card kpi-card" onClick={() => nav('/pharmacy/stock-operations?tab=low')}>
          <div className="kpi-header">
            <span className="label-text" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>Low Stock</span>
            <div className="kpi-icon" style={{ background: lowStockCount > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' }}>
              {lowStockCount > 0 ? '⚠️' : '✅'}
            </div>
          </div>
          <div className="kpi-value" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'inherit' }}>{lowStockCount}</div>
          <div className="kpi-sub">{lowStockCount > 0 ? 'Requires attention' : 'All caught up!'}</div>
        </div>
      </div>

      {/* ── ROW 2: CATEGORY BREAKDOWN + ACTIVITY FEED ── */}
      <div className="grid-2">
        {/* Category Breakdown */}
        <div className="card">
          <h3 className="section-header">🏷️ Category Breakdown</h3>
          
          <div className="sub-kpi-grid">
            <div className="sub-kpi">
              <div className="label-text">Total SKUs</div>
              <div className="sub-kpi-val">{fmtInt(grand.sku_count)}</div>
            </div>
            <div className="sub-kpi">
              <div className="label-text">Total Stock</div>
              <div className="sub-kpi-val">{fmtInt(grand.total_quantity)}</div>
            </div>
            <div className="sub-kpi">
              <div className="label-text">Inv. Value</div>
              <div className="sub-kpi-val" style={{ color: 'var(--color-primary)' }}>{fmt(grand.total_value)}</div>
            </div>
          </div>

          <div className="cat-header">
            <div className="label-text">Category</div>
            <div className="label-text cat-hide-mobile"></div>
            <div className="label-text" style={{ textAlign: 'right' }}>SKUs</div>
            <div className="label-text" style={{ textAlign: 'right' }}>Units</div>
            <div className="label-text" style={{ textAlign: 'right' }}>ETB Value</div>
          </div>

          {catBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>No product data yet</div>
          ) : catBreakdown.map((cat, i) => {
            const widthPct = maxValue > 0 ? Math.min(100, (Number(cat.total_value) / maxValue) * 100) : 0;
            return (
              <div key={cat.category} className="cat-row" onClick={() => nav('/pharmacy/medicines?category=' + encodeURIComponent(cat.category))}>
                <div style={{ fontWeight: 500, fontSize: 13, zIndex: 2 }}>{cat.category}</div>
                <div className="cat-hide-mobile progress-track">
                  <div className="progress-fill" style={{ width: `${widthPct}%` }}></div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 500, fontSize: 13, zIndex: 2 }}>{fmtInt(cat.sku_count)}</div>
                <div style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 500, fontSize: 13, zIndex: 2 }}>{fmtInt(cat.total_quantity)}</div>
                <div style={{ textAlign: 'right', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, zIndex: 2 }}>{fmt(cat.total_value)}</div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Feed (Top Sales) */}
        <div className="card">
          <h3 className="section-header">⭐ Top Sales Today</h3>
          {topSelling.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📉</div>
              No sales yet
            </div>
          ) : topSelling.map((item, i) => (
            <div key={item.name} className="list-item" onClick={() => nav('/pharmacy/medicines?search=' + encodeURIComponent(item.name))}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14 }}>🛒</span>
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{item.name}</div>
                <div className="list-item-sub">{fmtInt(item.units_sold)} units</div>
              </div>
              <div className="list-item-value" style={{ color: 'var(--color-success)' }}>
                ETB {fmt(item.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ── */}
      <div className="grid-2">
        {/* Alerts */}
        <div className="card">
          <h3 className="section-header">⚠ Attention Required</h3>
          {[
            { label: pendingTransfers + ' Pending Transfers', sub: 'Stock movements', icon: '🔄', bg: 'var(--color-info-bg)', c: 'var(--color-info)', path: '/pharmacy/stock-transfer?filter=pending' },
            { label: lowStockCount + ' Low Stock', sub: 'Need restocking', icon: '⚠️', bg: 'var(--color-warning-bg)', c: 'var(--color-warning)', path: '/pharmacy/stock-operations?tab=low' },
            { label: expiringCount + ' Expiring Soon', sub: 'Within 30 days', icon: '⏳', bg: 'var(--color-warning-bg)', c: 'var(--color-warning)', path: '/pharmacy/stock-operations?tab=expiring' },
            { label: expiredCount + ' Expired Items', sub: 'Needs disposal', icon: '❌', bg: 'var(--color-danger-bg)', c: 'var(--color-danger)', path: '/pharmacy/stock-operations?tab=expired' },
          ].map(row => (
            <div key={row.label} className="list-item" onClick={() => nav(row.path)}>
              <div style={{ background: row.bg, padding: 8, borderRadius: 8, color: row.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16 }}>{row.icon}</span>
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{row.label}</div>
                <div className="list-item-sub">{row.sub}</div>
              </div>
              <div style={{ color: 'var(--color-text-muted)' }}>›</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="section-header">⚡ Quick Operations</h3>
          <div className="qa-grid">
            {[
              { label: 'POS Terminal', sub: 'New sale',      icon: '🛒', bg: 'var(--color-success-bg)', color: 'var(--color-success)',  path: '/pharmacy/pos' },
              { label: 'Drug Catalog', sub: 'Browse meds',   icon: '💊', bg: 'var(--color-info-bg)', color: 'var(--color-info)', path: '/pharmacy/medicines' },
              { label: 'Stock Ops',    sub: 'Manage stock',  icon: '📦', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)',   path: '/pharmacy/stock-operations' },
              { label: 'Reports Hub',  sub: 'Analytics',     icon: '📊', bg: 'var(--color-info-bg)', color: 'var(--color-info)',  path: '/pharmacy/reports-hub' },
              { label: 'Procurement',  sub: 'Orders',        icon: '📝', bg: 'var(--color-success-bg)', color: 'var(--color-success)',     path: '/pharmacy/procurement-requests' },
              { label: 'Staff',        sub: 'Team mgmt',     icon: '👥', bg: 'var(--color-info-bg)', color: 'var(--color-info)',  path: '/pharmacy/staff' },
              { label: 'Expiry Mgmt',  sub: 'Review dates',  icon: '⏳', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)',   path: '/pharmacy/expiry-management' },
              { label: 'Finance',      sub: 'Approve',       icon: '💵', bg: 'var(--color-success-bg)', color: 'var(--color-success)',    path: '/pharmacy/finance-review' },
            ].map((a, i) => (
              <div key={a.label} className="qa-item" onClick={() => nav(a.path)}>
                <div className="qa-icon" style={{ background: a.bg, color: a.color }}>
                  {a.icon}
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
