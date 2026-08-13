import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, AlertTriangle, TrendingDown, Building2,
  Download, Package, CreditCard, Clock, ChevronRight, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';
import apiClient from '../../services/apiClient';
import styles from './CEOPurchase.module.css';

const COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

const CEOPurchase = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    apiClient.get('/ceo/purchase-overview')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load purchase data.'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = val =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val || 0);

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const statusBadge = s => {
    const map = {
      PENDING:    'orange', APPROVED: 'blue', CEO_REVIEW: 'blue',
      ORDERED:    'blue',   PARTIAL: 'amber', OVERDUE: 'red',
    };
    return <span className={`${styles.badge} ${styles[map[s] || 'gray']}`}>{s}</span>;
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading Purchase Intelligence…</p>
    </div>
  );

  if (error) return (
    <div className={styles.page}>
      <div style={{ padding: 32, background: '#fee2e2', borderRadius: 16, color: '#b91c1c', fontWeight: 700 }}>
        {error}
      </div>
    </div>
  );

  const maxDebt = data.supplierDebts.length > 0
    ? Math.max(...data.supplierDebts.map(s => parseFloat(s.debt))) : 1;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>📦 Purchase Overview</h1>
          <p>Live procurement intelligence — all purchase orders, supplier debts & spend trends</p>
        </div>
        <button className={styles.exportBtn} onClick={() => window.print()}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.blue}`}>
          <div className={styles.kpiLabel}>Total All-Time Spend</div>
          <div className={styles.kpiValue}>{fmt(data.totalSpend)}</div>
          <div className={styles.kpiSub}>Across all purchase orders</div>
          <ShoppingCart size={90} className={styles.kpiIcon} />
        </div>
        <div className={`${styles.kpiCard} ${styles.indigo}`}>
          <div className={styles.kpiLabel}>This Month's Spend</div>
          <div className={styles.kpiValue}>{fmt(data.monthSpend)}</div>
          <div className={styles.kpiSub}>Purchase orders this month</div>
          <TrendingDown size={90} className={styles.kpiIcon} />
        </div>
        <div className={`${styles.kpiCard} ${styles.amber}`}>
          <div className={styles.kpiLabel}>Pending POs</div>
          <div className={styles.kpiValue}>{data.pendingCount}</div>
          <div className={styles.kpiSub}>Value: {fmt(data.pendingValue)}</div>
          <Clock size={90} className={styles.kpiIcon} />
        </div>
        <div className={`${styles.kpiCard} ${styles.red}`}>
          <div className={styles.kpiLabel}>Total Supplier Debt</div>
          <div className={styles.kpiValue}>{fmt(data.totalSupplierDebt)}</div>
          <div className={styles.kpiSub}>{data.supplierDebts?.length || 0} suppliers with outstanding balance</div>
          <CreditCard size={90} className={styles.kpiIcon} />
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className={styles.chartsRow}>

        {/* 6-Month Spend vs Paid Trend */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}><TrendingDown size={18} /> 6-Month Spend vs Paid Trend</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.spendTrends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip formatter={v => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="Spend" stroke="#3b82f6" fill="url(#gSpend)" strokeWidth={2} />
                <Area type="monotone" dataKey="Paid"  stroke="#10b981" fill="url(#gPaid)"  strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Major Suppliers Bar Chart */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}><Building2 size={18} /> Top Suppliers This Month</h3>
          {data.majorSuppliers?.length === 0
            ? <p className={styles.empty}>No purchases this month yet.</p>
            : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.majorSuppliers.slice(0, 5)} layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="supplier_name" width={100} tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="total_volume" name="Volume" radius={[0, 4, 4, 0]}>
                    {data.majorSuppliers.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Tables Row: Supplier Debts + Pending POs ── */}
      <div className={styles.tablesRow}>

        {/* Supplier Debts */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}><AlertTriangle size={18} color="#f59e0b" /> Supplier Debts</h3>
          {data.supplierDebts?.length === 0
            ? <p className={styles.empty}>✅ No outstanding supplier debts!</p>
            : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Unpaid POs</th>
                  <th>Amount Owed</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                {data.supplierDebts.map((s, i) => {
                  const pct = Math.min(100, (parseFloat(s.debt) / maxDebt) * 100);
                  return (
                    <tr key={i}>
                      <td>
                        <span className={styles.bold}>{s.supplier_name || 'Unknown'}</span>
                        <br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{s.supplier_phone || ''}</span>
                      </td>
                      <td>{s.unpaid_po_count} POs</td>
                      <td>
                        <span className={styles.red}>{fmt(s.debt)}</span>
                        <div className={styles.progressWrap}>
                          <div className={styles.progressBar} style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f43f5e,#fbbf24)' }} />
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{fmtDate(s.oldest_po)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pending Purchase Orders */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}><Clock size={18} color="#6366f1" /> Pending Purchase Orders</h3>
          {data.pendingPOs?.length === 0
            ? <p className={styles.empty}>No pending purchase orders.</p>
            : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingPOs.map((po, i) => (
                  <tr key={i}>
                    <td className={styles.bold}>{po.po_number || `#${po.id}`}</td>
                    <td className={styles.amber}>{fmt(po.total_amount)}</td>
                    <td>{statusBadge(po.status || 'PENDING')}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(po.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Tables Row: Major Suppliers (full) + Requisitions ── */}
      <div className={styles.tablesRow}>

        {/* Major Suppliers Table */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}><Package size={18} color="#3b82f6" /> Major Suppliers (This Month)</h3>
          {data.majorSuppliers?.length === 0
            ? <p className={styles.empty}>No supplier purchases recorded this month.</p>
            : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>POs</th>
                  <th>Total Volume</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {data.majorSuppliers.map((s, i) => {
                  const outstanding = parseFloat(s.total_volume) - parseFloat(s.paid_volume);
                  return (
                    <tr key={i}>
                      <td>
                        <span className={styles.bold}>{s.supplier_name || 'Unknown'}</span>
                        <br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{s.supplier_phone || ''}</span>
                      </td>
                      <td>{s.po_count}</td>
                      <td className={styles.bold}>{fmt(s.total_volume)}</td>
                      <td className={styles.green}>{fmt(s.paid_volume)}</td>
                      <td className={outstanding > 0 ? styles.red : styles.green}>{fmt(outstanding)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Finance Payables */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}><FileText size={18} color="#f43f5e" /> Finance Payables
            <span style={{ marginLeft: 'auto', fontSize: 14, color: '#f43f5e', fontWeight: 700 }}>
              {fmt(data.totalFinancePayable)} due
            </span>
          </h3>
          {data.financePayables?.length === 0
            ? <p className={styles.empty}>No outstanding finance payables.</p>
            : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Payee</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.financePayables.map((fp, i) => (
                  <tr key={i}>
                    <td className={styles.bold}>{fp.payee_name || '—'}</td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{fp.description || '—'}</td>
                    <td className={styles.red}>{fmt(fp.amount)}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(fp.due_date)}</td>
                    <td>{statusBadge(fp.status || 'PENDING')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Pending Requisitions ── */}
      {data.pendingRequisitions?.length > 0 && (
        <div className={`${styles.card} ${styles.fullRow}`}>
          <h3 className={styles.cardTitle}><ChevronRight size={18} color="#8b5cf6" /> Purchase Requisitions Awaiting CEO Action</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PR No.</th>
                <th>Item / Drug</th>
                <th>Qty</th>
                <th>Urgency</th>
                <th>Department</th>
                <th>Requested By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.pendingRequisitions.map((pr, i) => (
                <tr key={i}>
                  <td className={styles.bold}>{pr.pr_number || `#${pr.id}`}</td>
                  <td>{pr.drug_name || '—'}</td>
                  <td>{pr.quantity_requested}</td>
                  <td>
                    <span className={`${styles.badge} ${pr.urgency === 'HIGH' ? styles.red : styles.orange}`}>
                      {pr.urgency}
                    </span>
                  </td>
                  <td>{pr.requesting_dept || '—'}</td>
                  <td>{pr.requested_by_name || '—'}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(pr.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default CEOPurchase;
