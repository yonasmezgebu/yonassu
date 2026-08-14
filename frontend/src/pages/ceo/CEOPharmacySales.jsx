import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, Activity, Clock,
  Users, ShoppingBag, Pill, BarChart2,
  Layers, Truck, FileWarning, Tag
} from 'lucide-react';
import apiClient from '../../services/apiClient';

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
      --font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }

    .ph-card {
      background: var(--color-bg-card) !important;
      border: 1px solid var(--color-border) !important;
      border-radius: 10px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,.06) !important;
      transition: box-shadow 150ms ease-in-out, transform 150ms ease-in-out !important;
    }
    .ph-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08) !important;
      transform: translateY(-1px) !important;
    }

    .ph-btn-refresh {
      display: flex; align-items: center; gap: 8px; padding: 9px 18px;
      background: var(--color-bg-card); border: 1px solid var(--color-border);
      border-radius: 8px; color: var(--color-text-primary); font-weight: 500;
      cursor: pointer; font-size: 13px; transition: all 150ms ease-in-out;
    }
    .ph-btn-refresh:hover {
      background: #FFD700; border-color: #FFD700; color: #111827;
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(234,179,8,0.25);
    }
    
    .ph-row:hover { background: #F9FAFB !important; transition: background 150ms ease-in-out; }
  `}</style>
);

const C = {
  forest: 'var(--color-success)', dark: 'var(--color-text-primary)', emerald: 'var(--color-success)',
  mint: 'var(--color-success-bg)', white: 'var(--color-bg-card)', lightGray: '#F9FAFB',
  gray: 'var(--color-text-secondary)', darkGray: 'var(--color-text-primary)', border: 'var(--color-border)',
  warning: 'var(--color-warning)', warningLight: 'var(--color-warning-bg)',
  error: 'var(--color-danger)', errorLight: 'var(--color-danger-bg)',
  blue: 'var(--color-primary)', blueLight: '#DBEAFE',
  purple: 'var(--color-primary)', purpleLight: '#EDE9FE',
  orange: 'var(--color-warning)', orangeLight: 'var(--color-warning-bg)',
  indigo: 'var(--color-primary)', indigoLight: '#EEF2FF'
};

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#9B72CF', '#0284C7', '#DC2626'];

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtETB = (n) => `ETB ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KPICard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="ph-card" style={{
    padding: '20px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, background: color, opacity: 0.07, borderRadius: '50%' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</p>
      <div style={{ background: color + '18', padding: 8, borderRadius: 8 }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.darkGray, letterSpacing: -0.5 }}>{value}</h2>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.gray, fontWeight: 500 }}>{sub}</p>}
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, iconColor, children }) => (
  <div className="ph-card" style={{ padding: 24 }}>
    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: C.darkGray, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={17} color={iconColor || C.forest} /> {title}
    </h3>
    {children}
  </div>
);

const BadgeRow = ({ label, value, color }) => (
  <div className="ph-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: C.lightGray, borderRadius: 7, marginBottom: 7, cursor: 'default' }}>
    <span style={{ fontWeight: 600, color: C.darkGray, fontSize: 13 }}>{label}</span>
    <span style={{ fontWeight: 800, color: color || C.darkGray, fontSize: 13 }}>{value}</span>
  </div>
);

/* ─── Category progress bar ─── */
const CatBar = ({ value, max, color }) => (
  <div style={{ background: '#F3F4F6', borderRadius: 4, height: 7, flex: 1, overflow: 'hidden' }}>
    <div style={{ height: '100%', borderRadius: 4, background: color, width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, transition: 'width 0.8s ease' }} />
  </div>
);

/* ─── Alert item row ─── */
const AlertItem = ({ icon, iconBg, label, sub, count, countColor }) => (
  <div className="ph-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: C.lightGray, borderRadius: 9, marginBottom: 8, cursor: 'default' }}>
    <div style={{ background: iconBg, padding: 9, borderRadius: 8, flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{sub}</div>
    </div>
    <span style={{ fontWeight: 900, fontSize: 18, color: countColor || C.gray }}>{count}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const CEOPharmacySales = () => {
  // Manager data (from CEO endpoint)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Worker data (from pharmacy dashboard endpoint)
  const [workerData, setWorkerData] = useState(null);
  const [workerLoading, setWorkerLoading] = useState(true);

  const loadManagerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/ceo/pharmacy-overview');
      setData(res.data?.data || res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load pharmacy manager data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkerData = useCallback(async () => {
    setWorkerLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/dashboard');
      const payload = res?.data || res || {};
      setWorkerData({
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
      console.error('Worker dashboard load failed:', err);
    } finally {
      setWorkerLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagerData();
    loadWorkerData();
  }, [loadManagerData, loadWorkerData]);

  const refresh = () => { loadManagerData(); loadWorkerData(); };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 12, color: C.gray }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontWeight: 600 }}>Loading Pharmacy Overview...</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.error }}>
      <AlertTriangle size={48} style={{ marginBottom: 16 }} />
      <h2 style={{ margin: 0 }}>Error Loading Data</h2>
      <p>{error}</p>
      <button onClick={refresh} style={{ marginTop: 12, padding: '10px 20px', background: C.forest, color: C.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Retry</button>
    </div>
  );

  const {
    totalSales = 0, currentMonthSales = 0, todaySales = 0, todaySalesCount = 0, customersServed = 0,
    totalMedications = 0, totalStockQuantity = 0, stockValue = 0,
    lowStockCount = 0, lowStockAlerts = [],
    expiryCount = 0, expiredList = [], expiringDetails = [],
    pendingTransfers = 0, pendingReceipts = 0, pendingExpiredReports = 0,
    categoryBreakdown = [], grandTotal = {},
    topSelling = [], fastMoving = [], slowMoving = []
  } = data || {};

  // Worker computed
  const wGrand = workerData?.grandTotal || {};
  const wCatBreakdown = workerData?.categoryBreakdown || [];
  const wTopSelling = workerData?.topSelling || [];
  const wLowStock = workerData?.lowStockAlerts || [];
  const wExpiredList = workerData?.expiredList || [];
  const wExpiringCount = wExpiredList.filter(e => e.status === 'expiring').length;
  const wExpiredCount = wExpiredList.filter(e => e.status === 'expired').length;
  const wMaxValue = Math.max(...wCatBreakdown.map(c => Number(c.total_value || 0)), 1);

  return (
    <div style={{ padding: '24px', maxWidth: 1536, margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif", background: 'var(--color-bg-page)', minHeight: '100vh', boxSizing: 'border-box' }}>
      <GlobalStyles />

      {/* ── SHARED HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 30, background: `linear-gradient(180deg, ${C.forest}, ${C.emerald})`, borderRadius: 4 }} />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.darkGray, letterSpacing: -0.5 }}>Pharmacy Operations Overview</h1>
          </div>
          <p style={{ margin: 0, color: C.gray, fontSize: 13, paddingLeft: 16 }}>CEO view · Pharmacy Manager & Worker dashboards · Real-time</p>
        </div>
        <button onClick={refresh} className="ph-btn-refresh">
          <RefreshCw size={14} /> Refresh All
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — PHARMACY MANAGER DASHBOARD
      ═══════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.forest, flexShrink: 0 }} />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.dark, textTransform: 'uppercase', letterSpacing: 1 }}>Pharmacy Manager Dashboard</h2>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Revenue KPIs */}
      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>💰 Revenue & Sales</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        <KPICard title="All-Time Revenue" value={fmtETB(totalSales)} sub="Total submitted sales" icon={DollarSign} color={C.forest} />
        <KPICard title="This Month" value={fmtETB(currentMonthSales)} sub="Submitted sales this month" icon={TrendingUp} color={C.blue} />
        <KPICard title="Live / Active Sales" value={fmtETB(todaySales)} sub={`${fmt(todaySalesCount)} open sessions`} icon={Activity} color={C.purple} />
        <KPICard title="Customers Served" value={fmt(customersServed)} sub="Unique phone numbers" icon={Users} color={C.orange} />
      </div>

      {/* Inventory KPIs */}
      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>📦 Inventory Status</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        <KPICard title="Total Medications" value={fmt(totalMedications)} sub="Active SKUs" icon={Pill} color={C.indigo} />
        <KPICard title="Total Stock Units" value={fmt(totalStockQuantity)} sub="Across all products" icon={Layers} color={C.emerald} />
        <KPICard title="Total Stock Value" value={fmtETB(stockValue)} sub="Qty × unit price" icon={Package} color={C.forest} />
        <KPICard title="Low Stock Alerts" value={lowStockCount} sub="Below reorder level" icon={AlertTriangle} color={lowStockCount > 0 ? C.error : C.emerald} />
      </div>

      {/* Operational Alerts KPIs */}
      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>⚙️ Operational Alerts</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KPICard title="Expiring (30 days)" value={expiryCount} sub="Near/past expiry" icon={Clock} color={expiryCount > 0 ? C.warning : C.emerald} />
        <KPICard title="Pending Transfers" value={pendingTransfers} sub="Awaiting approval" icon={Truck} color={pendingTransfers > 0 ? C.orange : C.gray} />
        <KPICard title="Pending Receipts" value={pendingReceipts} sub="Shipments in transit" icon={ShoppingBag} color={pendingReceipts > 0 ? C.blue : C.gray} />
        <KPICard title="Expired Reports" value={pendingExpiredReports} sub="Pending review" icon={FileWarning} color={pendingExpiredReports > 0 ? C.error : C.gray} />
      </div>

      {/* Top Selling & Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <SectionCard title="Top Selling (Last 30 Days)" icon={BarChart2} iconColor={C.forest}>
          {topSelling.length === 0 ? (
            <p style={{ color: C.gray, fontSize: 14 }}>No submitted sales data yet.</p>
          ) : topSelling.map((item, i) => (
            <div key={i} className="ph-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: i === 0 ? C.mint : C.lightGray, borderRadius: 7, marginBottom: 7, borderLeft: i === 0 ? `3px solid ${C.forest}` : 'none', cursor: 'default' }}>
              <span style={{ fontWeight: 700, color: C.darkGray, fontSize: 13 }}>#{i + 1} {item.name}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: C.forest, fontSize: 12 }}>{fmt(item.units_sold)} sold</div>
                <div style={{ fontSize: 11, color: C.gray }}>{fmtETB(item.revenue)}</div>
              </div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Low Stock Alerts" icon={AlertTriangle} iconColor={C.error}>
          {lowStockAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.gray }}>
              <Pill size={28} color={C.emerald} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>All medicines are adequately stocked!</p>
            </div>
          ) : lowStockAlerts.map((item, i) => (
            <div key={i} className="ph-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: C.errorLight, borderRadius: 7, marginBottom: 7, borderLeft: `3px solid ${C.error}`, cursor: 'default' }}>
              <span style={{ fontWeight: 600, color: C.darkGray, fontSize: 13 }}>{item.name}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 800, color: C.error, fontSize: 13 }}>{item.stock} left</span>
                <span style={{ fontSize: 11, color: C.gray, display: 'block' }}>Reorder: {item.reorderLevel}</span>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Fast & Slow Moving */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <SectionCard title="Fast-Moving Medicines (30 Days)" icon={TrendingUp} iconColor={C.forest}>
          {fastMoving.length === 0 ? <p style={{ color: C.gray, fontSize: 14 }}>No submitted sales data yet.</p>
            : fastMoving.map((item, i) => <BadgeRow key={i} label={item.drug_name} value={`${fmt(item.total_quantity)} sold`} color={C.forest} />)}
        </SectionCard>
        <SectionCard title="Slow-Moving Medicines (30 Days)" icon={TrendingDown} iconColor={C.warning}>
          {slowMoving.length === 0 ? <p style={{ color: C.gray, fontSize: 14 }}>No sales data to compare.</p>
            : slowMoving.map((item, i) => <BadgeRow key={i} label={item.drug_name} value={`${fmt(item.total_quantity)} sold`} color={C.warning} />)}
        </SectionCard>
      </div>

      {/* Category Breakdown Table */}
      {categoryBreakdown.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SectionCard title="Inventory by Category" icon={Layers} iconColor={C.indigo}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.lightGray }}>
                    {['Category', 'SKUs', 'Total Qty', 'Stock Value'].map((h, i) => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: i === 0 ? 'left' : 'right', color: C.gray, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((row, i) => (
                    <tr key={i} className="ph-row" style={{ borderBottom: `1px solid ${C.border}`, cursor: 'default' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: C.darkGray }}>{row.category}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: C.gray }}>{fmt(row.sku_count)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: C.gray }}>{fmt(row.total_quantity)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: C.forest }}>{fmtETB(row.total_value)}</td>
                    </tr>
                  ))}
                  <tr className="ph-row" style={{ background: C.mint, fontWeight: 900, cursor: 'default' }}>
                    <td style={{ padding: '12px 16px', color: C.dark, fontWeight: 800 }}>TOTAL</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: C.dark }}>{fmt(grandTotal.sku_count)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: C.dark }}>{fmt(grandTotal.total_quantity)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: C.forest }}>{fmtETB(grandTotal.total_value)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Expiry Watchlist */}
      <div style={{ marginBottom: 0 }}>
        <SectionCard title="Critical Expiry Watchlist (Next 90 Days)" icon={Clock} iconColor={C.warning}>
          {expiringDetails.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.gray }}>
              <Pill size={32} color={C.emerald} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>All good! No expiring medicines in the next 90 days.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.lightGray }}>
                    {['Medicine', 'In Stock', 'Value at Risk', 'Expiry Date', 'Status'].map((h, i) => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: i === 0 ? 'left' : i < 4 ? 'right' : 'center', color: C.gray, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expiringDetails.map((item, i) => {
                    const isExpired = new Date(item.expiry_date) < new Date();
                    const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / 86400000);
                    return (
                      <tr key={i} className="ph-row" style={{ borderBottom: `1px solid ${C.border}`, cursor: 'default' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: C.darkGray }}>{item.name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.quantity)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: isExpired ? C.error : C.warning, fontWeight: 700 }}>{fmtETB(item.quantity * (item.unit_price || 0))}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: isExpired ? C.error : C.warning }}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isExpired ? C.errorLight : C.warningLight, color: isExpired ? C.error : C.warning }}>
                            {isExpired ? 'EXPIRED' : `${daysLeft}d left`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════
          HORIZONTAL DIVIDER
      ═══════════════════════════════════════════════════════ */}
      <div style={{ margin: '40px 0 28px', display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, transparent, ${C.border} 10%, ${C.border} 90%, transparent)` }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 1 }}>Pharmacy Worker Dashboard</h2>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        {workerLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.gray, fontSize: 12 }}>
            <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
          </div>
        )}
      </div>

      {workerData && (
        <>
          {/* Worker KPIs */}
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>📊 Worker Overview</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
            <KPICard title="Today's Revenue" value={fmtETB(workerData.todaySales)} sub={`${workerData.todaySalesCount} transactions`} icon={Activity} color={C.blue} />
            <KPICard title="Total SKUs" value={fmt(wGrand.sku_count)} sub="Unique medicines" icon={Layers} color={C.indigo} />
            <KPICard title="Stock Units" value={fmt(wGrand.total_quantity)} sub="Items in stock" icon={Package} color={C.emerald} />
            <KPICard title="Inventory Value" value={fmtETB(wGrand.total_value)} sub="Total stock value" icon={DollarSign} color={C.orange} />
          </div>

          {/* Worker alerts + category breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

            {/* Alerts */}
            <SectionCard title="Worker Attention Required" icon={AlertTriangle} iconColor={C.warning}>
              <AlertItem
                icon={<AlertTriangle size={17} color="#D97706" />}
                iconBg="#FEF3C7"
                label="Low Stock Items"
                sub="Require restocking"
                count={wLowStock.length}
                countColor={wLowStock.length > 0 ? C.warning : C.emerald}
              />
              <AlertItem
                icon={<Clock size={17} color="#D97706" />}
                iconBg="#FEF3C7"
                label="Expiring Soon"
                sub="Within 30 days"
                count={wExpiringCount}
                countColor={wExpiringCount > 0 ? C.warning : C.emerald}
              />
              <AlertItem
                icon={<AlertTriangle size={17} color="#DC2626" />}
                iconBg="#FEE2E2"
                label="Expired Items"
                sub="Needs disposal"
                count={wExpiredCount}
                countColor={wExpiredCount > 0 ? C.error : C.emerald}
              />
              <AlertItem
                icon={<Truck size={17} color="#0284C7" />}
                iconBg="#E0F2FE"
                label="Pending Transfers"
                sub="Stock movements"
                count={workerData.pendingTransfers}
                countColor={workerData.pendingTransfers > 0 ? C.blue : C.emerald}
              />
            </SectionCard>

            {/* Worker Top Sales */}
            <SectionCard title="Worker Top Sales Today" icon={BarChart2} iconColor={C.blue}>
              {wTopSelling.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 28, color: C.gray }}>
                  <BarChart2 size={28} style={{ marginBottom: 8, opacity: 0.35 }} />
                  <p style={{ margin: 0 }}>No sales yet today</p>
                </div>
              ) : wTopSelling.map((item, i) => (
                <div key={item.name} className="ph-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.lightGray, borderRadius: 8, marginBottom: 8, cursor: 'default' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${COLORS[i % COLORS.length]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: 900, color: COLORS[i % COLORS.length], fontSize: 11 }}>#{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: C.gray }}>{fmt(item.units_sold)} units sold</div>
                  </div>
                  <span style={{ fontWeight: 800, color: C.forest, fontSize: 13 }}>ETB {fmt(item.revenue)}</span>
                </div>
              ))}
            </SectionCard>
          </div>

          {/* Worker Category Breakdown */}
          {wCatBreakdown.length > 0 && (
            <SectionCard title="Worker View — Inventory by Category" icon={Tag} iconColor={C.blue}>
              {wCatBreakdown.map((cat, i) => {
                const widthPct = wMaxValue > 0 ? Math.min(100, (Number(cat.total_value) / wMaxValue) * 100) : 0;
                return (
                  <div key={cat.category} className="ph-row" style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px 80px 110px', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 8, marginBottom: 6, background: i % 2 === 0 ? C.lightGray : C.white, border: `1px solid ${C.border}`, cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.darkGray }}>{cat.category}</span>
                    </div>
                    <CatBar value={Number(cat.total_value || 0)} max={wMaxValue} color={COLORS[i % COLORS.length]} />
                    <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.darkGray }}>{fmt(cat.sku_count)}</span>
                    <span style={{ textAlign: 'right', fontSize: 13, color: C.forest, fontWeight: 600 }}>{fmt(cat.total_quantity)}</span>
                    <span style={{ textAlign: 'right', fontSize: 13, color: C.blue, fontWeight: 700 }}>{fmtETB(cat.total_value)}</span>
                  </div>
                );
              })}
              {/* Grand Total Row */}
              <div className="ph-row" style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px 80px 110px', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 8, background: C.mint, border: `1px solid ${C.border}`, marginTop: 6, cursor: 'default' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>GRAND TOTAL</span>
                <div />
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: C.dark }}>{fmt(wGrand.sku_count)}</span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: C.dark }}>{fmt(wGrand.total_quantity)}</span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 900, color: C.forest }}>ETB {fmt(wGrand.total_value)}</span>
              </div>
            </SectionCard>
          )}
        </>
      )}

    </div>
  );
};

export default CEOPharmacySales;
