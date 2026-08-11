import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, FileText, AlertTriangle, TrendingUp, Package,
  ArrowRight, Clock, HeartPulse, Activity, Star, BarChart2,
  Layers, Tag, DollarSign, RefreshCw
} from 'lucide-react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './PharmacyWorkerHome.module.css';

const fmt = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#9B72CF', '#0284C7', '#DC2626'];

const CategoryBar = ({ value, max, color }) => (
  <div className={styles.barTrack}>
    <div
      className={styles.barFill}
      style={{
        background: color,
        width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      }}
    />
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
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const pendingPrescriptions = 0;
  const catBreakdown = stats.categoryBreakdown || [];
  const grand = stats.grandTotal || {};
  const topSelling = stats.topSelling || [];
  const maxValue = Math.max(...catBreakdown.map(c => Number(c.total_value || 0)), 1);

  return (
    <div className={styles.pageWrapper}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pharmacy Worker Overview</h1>
          <p className={styles.subtitle}>{currentDate} · Worker Portal</p>
        </div>
        <button
          className={styles.syncButton}
          onClick={fetchStats}
          disabled={refreshing}
          title="Refresh dashboard data"
        >
          {refreshing
            ? <SegmentedSpinner size={16} />
            : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* ── ROW 1: KPI CARDS ───────────────────────────── */}
      <div className={styles.kpiGrid}>

        {/* Today Revenue */}
        <div
          className={styles.card}
          style={{ background: '#2563EB', borderColor: '#2563EB', color: '#fff', position: 'relative', overflow: 'hidden' }}
          onClick={() => navigate('/pharmacy-worker/sales')}
        >
          <div className={styles.kpiLabel} style={{ color: 'rgba(255,255,255,0.75)' }}>Today's Revenue</div>
          <div className={styles.kpiValue} style={{ fontSize: 32, color: '#fff', margin: '12px 0' }}>
            <span style={{ fontSize: 14, opacity: 0.8, marginRight: 6 }}>ETB</span>
            {fmtInt(stats.todaySales)}
          </div>
          <div className={styles.kpiSubtext} style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Activity size={14} />
            {stats.todaySalesCount || 0} transactions today
          </div>
          <div style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 10 }}>
            <TrendingUp size={24} color="#fff" />
          </div>
        </div>

        {/* Total SKUs */}
        <div className={styles.card} onClick={() => navigate('/pharmacy-worker/medicines')}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Total SKUs</span>
            <div className={styles.kpiIcon} style={{ background: '#EFF6FF' }}>
              <Layers size={18} color="#2563EB" />
            </div>
          </div>
          <div className={styles.kpiValue}>{fmtInt(grand.sku_count)}</div>
          <div className={styles.kpiSubtext}>Unique medicines</div>
        </div>

        {/* Stock Units */}
        <div className={styles.card} onClick={() => navigate('/pharmacy-worker/stock-operations')}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Stock Units</span>
            <div className={styles.kpiIcon} style={{ background: '#DCFCE7' }}>
              <Package size={18} color="#16A34A" />
            </div>
          </div>
          <div className={styles.kpiValue}>{fmtInt(grand.total_quantity)}</div>
          <div className={styles.kpiSubtext}>Items in stock</div>
        </div>

        {/* Inventory Value */}
        <div className={styles.card} onClick={() => navigate('/pharmacy-worker/stock-operations')}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Inventory Value</span>
            <div className={styles.kpiIcon} style={{ background: '#FEF3C7' }}>
              <DollarSign size={18} color="#D97706" />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ fontSize: 22 }}>ETB {fmtInt(grand.total_value)}</div>
          <div className={styles.kpiSubtext}>Total stock value</div>
        </div>
      </div>

      {/* ── ROW 2: CATEGORY BREAKDOWN + TOP SALES ──────── */}
      <div className={styles.mainGrid}>

        {/* Category Breakdown */}
        <div className={styles.cardNoHover}>
          <div className={styles.sectionTitle}>
            <Tag size={16} color="#2563EB" />
            Category Breakdown
          </div>
          <div className={styles.tableContainer}>
            <div className={styles.tableInner}>
              <div className={styles.tableHeader}>
                <div>Category</div>
                <div></div>
                <div style={{ textAlign: 'right' }}>SKUs</div>
                <div style={{ textAlign: 'right' }}>Units</div>
                <div style={{ textAlign: 'right' }}>ETB Value</div>
              </div>

              {catBreakdown.length === 0 ? (
                <div className={styles.emptyState}>No inventory data yet</div>
              ) : catBreakdown.map((cat, i) => (
                <div
                  key={cat.category}
                  className={styles.tableRow}
                  onClick={() => navigate('/pharmacy-worker/medicines?category=' + encodeURIComponent(cat.category))}
                >
                  <div className={styles.tableCell} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    {cat.category}
                  </div>
                  <CategoryBar value={Number(cat.total_value || 0)} max={maxValue} color={COLORS[i % COLORS.length]} />
                  <div className={styles.tableCellRight}>{fmtInt(cat.sku_count)}</div>
                  <div className={styles.tableCellMuted}>{fmtInt(cat.total_quantity)}</div>
                  <div className={styles.tableCellPrimary}>{fmt(cat.total_value)}</div>
                </div>
              ))}

              {catBreakdown.length > 0 && (
                <div
                  className={styles.grandTotalRow}
                  onClick={() => navigate('/pharmacy-worker/stock-operations')}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>GRAND TOTAL</div>
                  <div />
                  <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(grand.sku_count)}</div>
                  <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(grand.total_quantity)}</div>
                  <div style={{ textAlign: 'right', color: '#2563EB', fontVariantNumeric: 'tabular-nums' }}>ETB {fmt(grand.total_value)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Selling Today */}
        <div className={styles.cardNoHover}>
          <div className={styles.sectionTitle}>
            <Star size={16} color="#D97706" />
            Top Sales Today
          </div>
          <div className={styles.topSellList}>
            {topSelling.length === 0 ? (
              <div className={styles.emptyState}>
                <BarChart2 size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                <br />No sales yet today
              </div>
            ) : topSelling.map((item, i) => (
              <div
                key={item.name}
                className={styles.topSellRow}
                onClick={() => navigate('/pharmacy-worker/medicines?search=' + encodeURIComponent(item.name))}
              >
                <div
                  className={styles.rankBadge}
                  style={{ background: `${COLORS[i % COLORS.length]}18`, color: COLORS[i % COLORS.length] }}
                >
                  #{i + 1}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className={styles.topSellName}>{item.name}</div>
                  <div className={styles.topSellSub}>{fmtInt(item.units_sold)} units sold</div>
                </div>
                <div className={styles.topSellVal}>ETB {fmt(item.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: ALERTS + QUICK ACTIONS ──────────────── */}
      <div className={styles.alertActionGrid}>

        {/* Alerts */}
        <div className={styles.cardNoHover}>
          <div className={styles.sectionTitle}>
            <AlertTriangle size={16} color="#D97706" />
            Attention Required
          </div>

          <div
            className={styles.alertRow}
            onClick={() => navigate('/pharmacy-worker/stock-operations?tab=low')}
          >
            <div className={styles.alertIcon} style={{ background: '#FEF3C7' }}>
              <AlertTriangle size={18} color="#D97706" />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.alertTitle}>{stats.lowStockAlerts?.length || 0} Low Stock Items</div>
              <div className={styles.alertSub}>Requires restocking</div>
            </div>
            <ArrowRight size={14} color="#9CA3AF" />
          </div>

          <div
            className={styles.alertRow}
            onClick={() => navigate('/pharmacy-worker/stock-operations?tab=expiring')}
          >
            <div className={styles.alertIcon} style={{ background: '#FEF3C7' }}>
              <Clock size={18} color="#D97706" />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.alertTitle}>{stats.expiredList?.filter(e => e.status === 'expiring').length || 0} Expiring Soon</div>
              <div className={styles.alertSub}>Within 30 days</div>
            </div>
            <ArrowRight size={14} color="#9CA3AF" />
          </div>

          <div
            className={styles.alertRow}
            onClick={() => navigate('/pharmacy-worker/stock-operations?tab=expired')}
          >
            <div className={styles.alertIcon} style={{ background: '#FEE2E2' }}>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.alertTitle}>{stats.expiredList?.filter(e => e.status === 'expired').length || 0} Expired</div>
              <div className={styles.alertSub}>Needs disposal</div>
            </div>
            <ArrowRight size={14} color="#9CA3AF" />
          </div>

          <div
            className={styles.alertRow}
            onClick={() => navigate('/pharmacy-worker/rx/pending')}
          >
            <div className={styles.alertIcon} style={{ background: '#E0F2FE' }}>
              <FileText size={18} color="#0284C7" />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.alertTitle}>{pendingPrescriptions} Rx Pending</div>
              <div className={styles.alertSub}>Prescription queue</div>
            </div>
            <ArrowRight size={14} color="#9CA3AF" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.cardNoHover}>
          <div className={styles.sectionTitle}>
            ⚡ Quick Operations
          </div>
          <div className={styles.quickActionGrid}>
            {[
              { label: 'New Sale',    sub: 'Open POS',        icon: <ShoppingCart size={22} />, bg: '#DCFCE7', color: '#16A34A', path: '/pharmacy-worker/sales' },
              { label: 'Inventory',  sub: 'View stock',       icon: <Package size={22} />,      bg: '#EDE9FE', color: '#7C3AED', path: '/pharmacy-worker/stock-operations' },
              { label: 'Health Info',sub: 'Publish updates',  icon: <HeartPulse size={22} />,   bg: '#FCE7F3', color: '#DB2777', path: '/pharmacy-worker/health-publisher' },
              { label: 'Medicines',  sub: 'Drug catalog',     icon: <Layers size={22} />,       bg: '#EFF6FF', color: '#2563EB', path: '/pharmacy-worker/medicines' },
              { label: 'Rx Queue',   sub: 'Prescriptions',    icon: <FileText size={22} />,     bg: '#FEF3C7', color: '#D97706', path: '/pharmacy-worker/rx' },
              { label: 'Reports',    sub: 'View analytics',   icon: <BarChart2 size={22} />,    bg: '#F1F5F9', color: '#475569', path: '/pharmacy-worker/stock-operations' },
            ].map((a) => (
              <div
                key={a.label}
                className={styles.qaCard}
                onClick={() => navigate(a.path)}
              >
                <div className={styles.qaIcon} style={{ background: a.bg, color: a.color }}>
                  {a.icon}
                </div>
                <div className={styles.qaTitle}>{a.label}</div>
                <div className={styles.qaSub}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PharmacyWorkerHome;
