import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Global Animations & Enterprise Styles ─── */
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
      
      /* Base fonts */
      --font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }

    /* Edge Spacing */
    .page-wrapper {
      padding: 10px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 60px);
      background: var(--color-bg-page);
    }

    .so-page {
      background: var(--color-bg-page);
      color: var(--color-text-primary);
      font-family: var(--font-family);
      font-size: 16px;
      line-height: 1.5;
      padding: 24px;
      margin: 0 auto;
      max-width: 1600px;
      box-sizing: border-box;
      border-radius: 12px;
    }

    h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 0; }
    
    .so-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); }
    .so-section-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 16px; }
    
    .so-subtitle { font-size: 13px; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }

    /* Buttons */
    .btn {
      border-radius: 8px;
      height: 36px;
      padding: 0 16px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid transparent;
      transition: all 150ms ease-in-out;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--color-primary); color: #FFF; }
    .btn-primary:hover:not(:disabled) { background: #FFD700; color: #000; border-color: #FFD700; }
    
    /* Cards */
    .d-card-static {
      position: relative;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }

    /* Grid Layouts */
    .so-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .so-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .so-row2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
    
    .cat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-radius: 8px; gap: 16px;
      background: var(--color-bg-card); border: 1px solid var(--color-border);
      margin-bottom: 8px;
    }

    /* Tables */
    .table-container { overflow-x: auto; min-width: 100%; border-radius: 8px; border: 1px solid var(--color-border); }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #F9FAFB; padding: 12px 16px; text-transform: uppercase; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); letter-spacing: 0.03em; border-bottom: 1px solid var(--color-border); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); transition: background 150ms ease-in-out; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #F9FAFB; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    th.num { text-align: right; }
    
    @media (max-width: 1024px) {
      .so-kpis { grid-template-columns: repeat(2, 1fr); }
      .so-row2 { grid-template-columns: 1fr; }
      .page-wrapper { padding: 6px; }
      .so-page { padding: 16px; }
    }
    @media (max-width: 768px) {
      .page-wrapper { padding: 4px; }
      .so-page { padding: 12px; }
      .so-title { font-size: 24px; }
      .so-header { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 480px) {
      .so-kpis { grid-template-columns: 1fr; }
    }
  `}</style>
);

const fmt = (n) => Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString();

export default function CEOSales() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [salesRes, historyRes] = await Promise.allSettled([
        apiClient.get('/pos/reports', { params: { range: 'today' } }),
        apiClient.get('/pos/sales', { params: { limit: 6 } })
      ]);
      
      if (salesRes.status === 'fulfilled') {
        setStats(salesRes.value.data?.data || salesRes.value.data);
      }
      if (historyRes.status === 'fulfilled') {
        const h = historyRes.value.data?.data?.sales || [];
        setActivities(h);
      }
    } catch (err) {
      console.error('Failed to fetch CEO sales dashboard data:', err);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const data = stats || {};
  const totalRevenue = parseFloat(data.totalRevenue) || 0;
  const totalOrders = parseInt(data.totalTransactions) || 0;
  const activeCustomers = parseInt(data.uniqueCustomers) || 0;
  const avgOrder = parseFloat(data.averageOrderValue) || 0;
  
  const topProducts = data.topProducts || [];
  const salesByMethod = data.salesByMethod || [];

  return (
    <div className="page-wrapper">
      <div className="so-page">
        <GlobalStyles />
        
        {/* ── HEADER ── */}
        <div className="so-header">
          <div>
            <h1 className="so-title">Sales Overview</h1>
            <p className="so-subtitle">Executive Performance &amp; Metrics · {timeString}</p>
          </div>
          <div>
            <button onClick={load} className="btn btn-primary" disabled={refreshing}>
              {refreshing ? <SegmentedSpinner size={16} /> : <span>↻</span>}
              SYNC DATA
            </button>
          </div>
        </div>

        {/* ── ROW 1: KPI HERO CARDS ── */}
        <div className="so-kpis">
          <div className="d-card-static" style={{ background: 'var(--color-primary)', color: '#FFF' }}>
            <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>Today's Revenue</div>
            <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>ETB {fmtInt(totalRevenue)}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Store &amp; POS Network</div>
          </div>

          <div className="d-card-static">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Transactions</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{fmtInt(totalOrders)}</div>
          </div>

          <div className="d-card-static">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Customers</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{fmtInt(activeCustomers)}</div>
          </div>

          <div className="d-card-static">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Avg Order Value</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)' }}>ETB {fmtInt(avgOrder)}</div>
          </div>
        </div>

        {/* ── ROW 2 ── */}
        <div className="so-row2">
          
          <div className="d-card-static">
            <h2 className="so-section-title">Top Selling Products (Today)</h2>
            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No sales recorded today.</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th className="num">Qty Sold</th>
                      <th className="num">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td className="num">{fmtInt(p.quantity)}</td>
                        <td className="num" style={{ fontWeight: 500 }}>{fmt(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="d-card-static">
              <h2 className="so-section-title">Payment Methods</h2>
              {salesByMethod.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)' }}>No data available.</div>
              ) : (
                salesByMethod.map((m, i) => {
                  const pmIcon = m.name?.toLowerCase().includes('cash') ? '💵'
                    : m.name?.toLowerCase().includes('bank') ? '🏦'
                    : m.name?.toLowerCase().includes('tele') ? '📱'
                    : '💳';
                  return (
                    <div key={i} className="cat-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{pmIcon}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.name || 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmt(m.percentage)}% of today's sales</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>ETB {fmt(m.amount)}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="d-card-static" style={{ flex: 1 }}>
              <h2 className="so-section-title">Recent Sales</h2>
              {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)' }}>No recent sales found.</div>
              ) : (
                activities.slice(0, 5).map((a) => {
                  const pmIcon = a.payment_method_name?.toLowerCase().includes('cash') ? '💵'
                    : a.payment_method_name?.toLowerCase().includes('bank') ? '🏦'
                    : a.payment_method_name?.toLowerCase().includes('tele') ? '📱'
                    : '💳';
                  return (
                    <div key={a.id} className="cat-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>
                          {a.invoice_number || `#${a.id}`}
                          {a.customer_name && <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 6 }}>— {a.customer_name}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span>{pmIcon} {a.payment_method_name || 'Cash'}</span>
                          {a.cashier_name && <span>👤 {a.cashier_name}</span>}
                          <span>🕐 {new Date(a.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-success)', whiteSpace: 'nowrap' }}>ETB {fmt(a.total_amount)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
