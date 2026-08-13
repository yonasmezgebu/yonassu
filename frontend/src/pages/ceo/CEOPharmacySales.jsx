import React, { useState, useEffect } from 'react';
import {
  Package, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, Activity, Clock,
  Users, ShoppingBag, Pill, ArrowRight, BarChart2,
  Layers, Truck, FileWarning
} from 'lucide-react';
import apiClient from '../../services/apiClient';

const C = {
  forest: '#16a34a', dark: '#14532d', emerald: '#059669',
  mint: '#f0fdf4', white: '#FFFFFF', lightGray: '#F9FAFB',
  gray: '#6B7280', darkGray: '#111827', border: '#E5E7EB',
  warning: '#d97706', warningLight: '#FEF3C7',
  error: '#dc2626', errorLight: '#FEE2E2',
  blue: '#2563eb', blueLight: '#DBEAFE',
  purple: '#7c3aed', purpleLight: '#EDE9FE',
  orange: '#ea580c', orangeLight: '#FFF7ED',
  indigo: '#4f46e5', indigoLight: '#EEF2FF'
};

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtETB = (n) => `ETB ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KPICard = ({ title, value, sub, icon: Icon, color, bg }) => (
  <div style={{
    background: C.white, borderRadius: 16, padding: '20px 24px',
    border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: color, opacity: 0.07, borderRadius: '50%' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</p>
      <div style={{ background: bg || color + '18', padding: 10, borderRadius: 10 }}>
        <Icon size={20} color={color} />
      </div>
    </div>
    <div>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.darkGray, letterSpacing: -0.5 }}>{value}</h2>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.gray, fontWeight: 500 }}>{sub}</p>}
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, iconColor, children }) => (
  <div style={{
    background: C.white, borderRadius: 16, padding: 24,
    border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  }}>
    <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.darkGray, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={18} color={iconColor || C.forest} /> {title}
    </h3>
    {children}
  </div>
);

const BadgeRow = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.lightGray, borderRadius: 8, marginBottom: 8 }}>
    <span style={{ fontWeight: 600, color: C.darkGray, fontSize: 14 }}>{label}</span>
    <span style={{ fontWeight: 800, color: color || C.darkGray, fontSize: 14 }}>{value}</span>
  </div>
);

const CEOPharmacySales = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/ceo/pharmacy-overview');
      setData(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load pharmacy data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
      <button onClick={loadData} style={{ marginTop: 12, padding: '10px 20px', background: C.forest, color: C.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
        Retry
      </button>
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

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 4, height: 32, background: `linear-gradient(180deg, ${C.forest}, ${C.emerald})`, borderRadius: 4 }} />
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.darkGray, letterSpacing: -0.5 }}>Pharmacy Operations Overview</h1>
          </div>
          <p style={{ margin: 0, color: C.gray, fontSize: 14, paddingLeft: 16 }}>Live data from Pharmacy Manager dashboard · All metrics are real-time</p>
        </div>
        <button onClick={loadData} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10,
          color: C.darkGray, fontWeight: 600, cursor: 'pointer', fontSize: 14
        }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Row 1: Revenue KPIs */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>💰 Revenue & Sales</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
          <KPICard title="All-Time Revenue" value={fmtETB(totalSales)} sub="Total submitted sales" icon={DollarSign} color={C.forest} />
          <KPICard title="This Month" value={fmtETB(currentMonthSales)} sub="Submitted sales this month" icon={TrendingUp} color={C.blue} />
          <KPICard title="Live / Active Sales" value={fmtETB(todaySales)} sub={`${fmt(todaySalesCount)} open sessions`} icon={Activity} color={C.purple} />
          <KPICard title="Customers Served" value={fmt(customersServed)} sub="Unique phone numbers" icon={Users} color={C.orange} />
        </div>
      </div>

      {/* Row 2: Inventory KPIs */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>📦 Inventory Status</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
          <KPICard title="Total Medications" value={fmt(totalMedications)} sub="Active SKUs" icon={Pill} color={C.indigo} />
          <KPICard title="Total Stock Units" value={fmt(totalStockQuantity)} sub="Across all products" icon={Layers} color={C.emerald} />
          <KPICard title="Total Stock Value" value={fmtETB(stockValue)} sub="Qty × unit price" icon={Package} color={C.forest} />
          <KPICard title="Low Stock Alerts" value={lowStockCount} sub="Below reorder level" icon={AlertTriangle} color={lowStockCount > 0 ? C.error : C.emerald} />
        </div>
      </div>

      {/* Row 3: Operations KPIs */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>⚙️ Operational Alerts</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
          <KPICard title="Expiring (30 days)" value={expiryCount} sub="Medicines near/past expiry" icon={Clock} color={expiryCount > 0 ? C.warning : C.emerald} />
          <KPICard title="Pending Transfers" value={pendingTransfers} sub="Awaiting approval" icon={Truck} color={pendingTransfers > 0 ? C.orange : C.gray} />
          <KPICard title="Pending Receipts" value={pendingReceipts} sub="Shipments in transit" icon={ShoppingBag} color={pendingReceipts > 0 ? C.blue : C.gray} />
          <KPICard title="Expired Reports" value={pendingExpiredReports} sub="Pending review" icon={FileWarning} color={pendingExpiredReports > 0 ? C.error : C.gray} />
        </div>
      </div>

      {/* Row 4: 2-col panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Top Selling */}
        <SectionCard title="Top Selling (Last 30 Days)" icon={BarChart2} iconColor={C.forest}>
          {topSelling.length === 0 ? (
            <p style={{ color: C.gray, fontSize: 14 }}>No submitted sales data yet.</p>
          ) : topSelling.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: i === 0 ? C.mint : C.lightGray, borderRadius: 8, marginBottom: 8, borderLeft: i === 0 ? `3px solid ${C.forest}` : 'none' }}>
              <div>
                <span style={{ fontWeight: 700, color: C.darkGray, fontSize: 14 }}>#{i + 1} {item.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: C.forest, fontSize: 13 }}>{fmt(item.units_sold)} sold</div>
                <div style={{ fontSize: 12, color: C.gray }}>{fmtETB(item.revenue)}</div>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Low Stock Alerts */}
        <SectionCard title="Low Stock Alerts" icon={AlertTriangle} iconColor={C.error}>
          {lowStockAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.gray }}>
              <Pill size={28} color={C.emerald} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>All medicines are adequately stocked!</p>
            </div>
          ) : lowStockAlerts.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.errorLight, borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${C.error}` }}>
              <span style={{ fontWeight: 600, color: C.darkGray, fontSize: 14 }}>{item.name}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 800, color: C.error, fontSize: 14 }}>{item.stock} left</span>
                <span style={{ fontSize: 12, color: C.gray, display: 'block' }}>Reorder: {item.reorderLevel}</span>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Row 5: Fast vs Slow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <SectionCard title="Fast-Moving Medicines (30 Days)" icon={TrendingUp} iconColor={C.forest}>
          {fastMoving.length === 0 ? (
            <p style={{ color: C.gray, fontSize: 14 }}>No submitted sales data yet.</p>
          ) : fastMoving.map((item, i) => (
            <BadgeRow key={i} label={item.drug_name} value={`${fmt(item.total_quantity)} sold`} color={C.forest} />
          ))}
        </SectionCard>
        <SectionCard title="Slow-Moving Medicines (30 Days)" icon={TrendingDown} iconColor={C.warning}>
          {slowMoving.length === 0 ? (
            <p style={{ color: C.gray, fontSize: 14 }}>No sales data to compare.</p>
          ) : slowMoving.map((item, i) => (
            <BadgeRow key={i} label={item.drug_name} value={`${fmt(item.total_quantity)} sold`} color={C.warning} />
          ))}
        </SectionCard>
      </div>

      {/* Row 6: Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionCard title="Inventory by Category" icon={Layers} iconColor={C.indigo}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: C.lightGray, borderRadius: 8 }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: C.gray, fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: C.gray, fontWeight: 700 }}>SKUs</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: C.gray, fontWeight: 700 }}>Total Qty</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: C.gray, fontWeight: 700 }}>Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: C.darkGray }}>{row.category}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: C.gray }}>{fmt(row.sku_count)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: C.gray }}>{fmt(row.total_quantity)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: C.forest }}>{fmtETB(row.total_value)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: C.mint, fontWeight: 900 }}>
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

      {/* Row 7: Expiry Watchlist */}
      <SectionCard title="Critical Expiry Watchlist (Next 90 Days)" icon={Clock} iconColor={C.warning}>
        {expiringDetails.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.gray }}>
            <Pill size={36} color={C.emerald} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>All good! No expiring medicines in the next 90 days.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.lightGray }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: C.gray, fontWeight: 700 }}>Medicine</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: C.gray, fontWeight: 700 }}>In Stock</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: C.gray, fontWeight: 700 }}>Stock Value at Risk</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: C.gray, fontWeight: 700 }}>Expiry Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: C.gray, fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiringDetails.map((item, i) => {
                  const isExpired = new Date(item.expiry_date) < new Date();
                  const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / 86400000);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: C.darkGray }}>{item.name}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.quantity)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: isExpired ? C.error : C.warning, fontWeight: 700 }}>
                        {fmtETB(item.quantity * (item.unit_price || 0))}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: isExpired ? C.error : C.warning }}>
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: isExpired ? C.errorLight : C.warningLight,
                          color: isExpired ? C.error : C.warning
                        }}>
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
  );
};

export default CEOPharmacySales;
