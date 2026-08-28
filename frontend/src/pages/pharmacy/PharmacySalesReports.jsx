import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Layers, Wallet, AlertTriangle, Save, RefreshCw, Download } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import styles from './PharmacySalesReports.module.css';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

const TABS = [
  { key: 'executive', label: 'Executive Dashboard', icon: BarChart3 },
  { key: 'branch', label: 'Branch Performance', icon: TrendingUp },
  { key: 'product', label: 'Product & Inventory Health', icon: Layers },
  { key: 'profit', label: 'Profitability', icon: Wallet },
  { key: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
];

const fmt = (n) => {
  const num = Number(n || 0);
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2);
};

const money = (n) => 'ETB ' + fmt(n);

function Kpi({ label, value, sub }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className={styles.empty}>
      <strong>No data yet</strong>
      {text}
    </div>
  );
}

export default function PharmacySalesReports() {
  const [period, setPeriod] = useState('month');
  const [tab, setTab] = useState('executive');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState([]);
  const [overallTarget, setOverallTarget] = useState('');
  const [branchTargets, setBranchTargets] = useState({});
  const [savedMsg, setSavedMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getExecutivePack({ period });
      setData(res?.data || res);
    } catch (e) {
      console.error('report load error', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadTargets = useCallback(async () => {
    try {
      const res = await pharmacyService.getTargets();
      const rows = res?.data || (Array.isArray(res) ? res : []);
      setTargets(rows);
      const overall = rows.find(r => !r.branch_id);
      setOverallTarget(overall ? String(Number(overall.sales_target || 0)) : '');
      const bt = {};
      rows.forEach(r => { if (r.branch_id) bt[r.branch_id] = String(Number(r.sales_target || 0)); });
      setBranchTargets(bt);
    } catch (e) {
      console.error('target load error', e);
    }
  }, []);

  useEffect(() => { load(); loadTargets(); }, [load, loadTargets]);

  const saveTargets = async () => {
    const payload = [{ branch_id: null, sales_target: overallTarget, period: 'ALL' }];
    (data?.branch_performance || []).forEach(bp => {
      payload.push({ branch_id: bp.branch_id, sales_target: branchTargets[bp.branch_id] || 0, period: 'ALL' });
    });
    try {
      await pharmacyService.saveTargets({ targets: payload });
      setSavedMsg('Targets saved');
      setTimeout(() => setSavedMsg(''), 2500);
      load();
    } catch (e) {
      console.error('save error', e);
    }
  };

  const exec = data?.executive || {};
  const branchPerf = data?.branch_performance || [];
  const product = data?.product_health || {};
  const profit = data?.profitability || {};
  const exceptions = data?.exceptions || [];

  const icons = TABS.find(t => t.key === tab);
  const Icon = icons ? icons.icon : BarChart3;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>CEO Pharmacy Sales Reporting</h1>
          <p className={styles.subtitle}>
            Consolidated reporting across all pharmacy branches · Period: <strong>{data?.period || '—'}</strong>
          </p>
        </div>
        <div className={styles.controls}>
          <select className={styles.select} value={period} onChange={e => setPeriod(e.target.value)}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => {
          const TI = t.icon;
          return (
            <button key={t.key} className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
              <TI size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : tab === 'executive' ? (
        <ExecutiveTab exec={exec} />
      ) : tab === 'branch' ? (
        <BranchTab perf={branchPerf} />
      ) : tab === 'product' ? (
        <ProductTab product={product} />
      ) : tab === 'profit' ? (
        <ProfitTab profit={profit} exec={exec} />
      ) : (
        <ExceptionsTab exceptions={exceptions} onManage={() => setTab('branch')} />
      )}

      {(tab === 'executive' || tab === 'branch') && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Sales Targets</h3>
          <p className={styles.cardSub}>Set overall and per-branch sales targets used to compute achievement.</p>
          <div className={styles.targetForm}>
            <div className={styles.targetRow}>
              <span style={{ width: 130 }} className={styles.muted}>Overall (ETB)</span>
              <input type="number" value={overallTarget} onChange={e => setOverallTarget(e.target.value)} placeholder="e.g. 500000" />
            </div>
            {branchPerf.map(bp => (
              <div className={styles.targetRow} key={bp.branch_id}>
                <span style={{ width: 130 }} className={styles.muted}>{bp.branch}</span>
                <input type="number" value={branchTargets[bp.branch_id] || ''} onChange={e => setBranchTargets(prev => ({ ...prev, [bp.branch_id]: e.target.value }))} placeholder="e.g. 150000" />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className={styles.btn} onClick={saveTargets}><Save size={16} /> Save Targets</button>
              {savedMsg && <span className={styles.pill}>{savedMsg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutiveTab({ exec }) {
  const growth = exec.growth;
  const achievement = exec.achievement;
  return (
    <div>
      <div className={styles.kpis}>
        <Kpi label="Total Revenue" value={money(exec.revenue)} sub={`${exec.transactions} transactions`} />
        <Kpi label="Gross Profit" value={money(exec.gross_profit)} sub={`${exec.margin ?? 0}% margin`} />
        <Kpi label="Avg Order Value" value={money(exec.avg_transaction)} />
        <Kpi label="Inventory Value" value={money(exec.inventory_value)} sub={`${money(exec.expired_value)} expired`} />
      </div>
      <div className={styles.kpis}>
        <Kpi label="Target" value={money(exec.target)} sub={achievement !== null ? `${achievement}% achieved` : 'No target set'} />
        <Kpi label="Sales Growth" value={growth !== null ? growth + '%' : '—'} sub="vs previous period" />
        <Kpi label="Outstanding Receivables" value={money(exec.outstanding_receivables)} sub="Pharmacy ledger" />
      </div>
      {achievement !== null && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Target Achievement</h3>
          <p className={styles.cardSub}>{fmt(exec.revenue)} of {fmt(exec.target)} ETB achieved ({achievement}%)</p>
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ width: Math.min(100, Math.max(0, achievement)) + '%' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function BranchTab({ perf }) {
  return (
    <div>
      <div className={styles.kpis}>
        <Kpi label="Branches" value={perf.length} />
        <Kpi label="Total Target" value={money(perf.reduce((s, b) => s + (b.target || 0), 0))} />
        <Kpi label="Total Revenue" value={money(perf.reduce((s, b) => s + (b.revenue || 0), 0))} />
        <Kpi label="Total Transactions" value={fmt(perf.reduce((s, b) => s + (b.transactions || 0), 0))} />
      </div>
      {perf.length ? perf.map(bp => {
        const achieved = bp.achievement !== null ? bp.achievement : 0;
        return (
          <div className={styles.card} key={bp.branch_id}>
            <div className={styles.row}>
              <div>
                <h3 className={styles.cardTitle}>{bp.branch}</h3>
                <span className={styles.muted}>{bp.transactions} transactions · {bp.products} products</span>
              </div>
              <div className={styles.pill}>
                {bp.achievement !== null ? `${bp.achievement}% of target` : 'No target'}
              </div>
            </div>
            <div className={styles.grid2}>
              <div>
                <div className={styles.muted} style={{ marginBottom: 8 }}>Revenue: {money(bp.revenue)} · Gross Profit: {money(bp.gross_profit)} · Margin: {bp.margin}%</div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <tbody>
                      <tr><td>Revenue</td><td>{money(bp.revenue)}</td></tr>
                      <tr><td>Gross Profit</td><td>{money(bp.gross_profit)}</td></tr>
                      <tr><td>Margin</td><td>{bp.margin}%</td></tr>
                      <tr><td>Target</td><td>{money(bp.target)}</td></tr>
                      <tr><td>Achievement</td><td>{bp.achievement !== null ? bp.achievement + '%' : '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
                {bp.target > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{ width: Math.min(100, Math.max(0, achieved)) + '%' }} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className={styles.muted}>Revenue relative to target:</span>
                <div className={styles.sparkline} style={{ marginTop: 12 }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const ratio = bp.target > 0 ? Math.min(1, bp.revenue / bp.target) : 0.1;
                    const h = Math.max(4, ratio * 56 * (0.4 + (i % 3) * 0.2));
                    return <div className={styles.bar} key={i} style={{ height: h }} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      }) : <Empty text="No branch data available." />}
    </div>
  );
}

function ProductTab({ product }) {
  const topQty = product.top_by_qty || [];
  const topProfit = product.top_by_profit || [];
  const slow = product.slow_moving || [];
  const over = product.overstocked || [];
  const oos = product.out_of_stock || [];
  const near = product.near_expiry || [];
  return (
    <div>
      <div className={styles.kpis}>
        <Kpi label="Inventory Value" value={money(product.inventory_value)} />
        <Kpi label="Out of Stock" value={oos.length} />
        <Kpi label="Near Expiry" value={near.length} />
        <Kpi label="Slow / Overstocked" value={slow.length + over.length} />
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Top Selling Products</h3>
        <p className={styles.cardSub}>By quantity sold (units)</p>
        {topQty.length ? (
          <Table headers={['Product', 'Qty', 'Revenue']}>
            {topQty.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{p.qty}</td>
                <td>{money(p.revenue)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="Sales data will appear here once sales are recorded." />}
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Highest Profit Products</h3>
        <p className={styles.cardSub}>Gross profit generated</p>
        {topProfit.length ? (
          <Table headers={['Product', 'Revenue', 'Profit']}>
            {topProfit.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{money(p.revenue)}</td>
                <td>{money(p.revenue - p.cost)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="Profit data will appear here once sales are recorded." />}
      </div>
      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Slow Moving / Reorder</h3>
          <p className={styles.cardSub}>Items at or below reorder level</p>
          {slow.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {slow.map((s, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <strong>{s.name}</strong> — {s.qty} in stock, reorder at {s.reorder_level} ({money(s.value)})
                </li>
              ))}
            </ul>
          ) : <Empty text="No slow-moving items." />}
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Overstocked</h3>
          <p className={styles.cardSub}>Stock &gt; 3x reorder level</p>
          {over.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {over.map((o, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <strong>{o.name}</strong> — {o.qty} units ({money(o.value)} tied up)
                </li>
              ))}
            </ul>
          ) : <Empty text="No overstocked items." />}
        </div>
      </div>
      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Out of Stock</h3>
          <p className={styles.cardSub}>Items with zero availability</p>
          {oos.length ? (
            <Table headers={['Product', 'Qty']}>
              {oos.map((o, i) => (
                <tr key={i}><td>{o.name}</td><td>{o.qty}</td></tr>
              ))}
            </Table>
          ) : <Empty text="No stock-outs detected." />}
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Near Expiry (90 days)</h3>
          <p className={styles.cardSub}>Value at risk if unsold</p>
          {near.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {near.map((n, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <strong>{n.name}</strong> — x{n.qty}, expires {new Date(n.expiry_date).toLocaleDateString()} ({money(n.value)})
                </li>
              ))}
            </ul>
          ) : <Empty text="No items near expiry." />}
        </div>
      </div>
    </div>
  );
}

function ProfitTab({ profit, exec }) {
  const margin = profit.margin ?? 0;
  return (
    <div>
      <div className={styles.kpis}>
        <Kpi label="Revenue" value={money(profit.revenue)} />
        <Kpi label="COGS" value={money(profit.cogs)} />
        <Kpi label="Gross Profit" value={money(profit.gross_profit)} />
        <Kpi label="Gross Margin" value={margin + '%'} />
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Profitability Overview</h3>
        <p className={styles.cardSub}>Cost of goods sold derived from medication cost prices.</p>
        <Table headers={['Metric', 'Amount']}>
          <tr><td>Revenue (Sales)</td><td>{money(profit.revenue)}</td></tr>
          <tr><td>Cost of Goods Sold</td><td>{money(profit.cogs)}</td></tr>
          <tr><td>Gross Profit</td><td>{money(profit.gross_profit)}</td></tr>
          <tr><td>Gross Margin</td><td>{margin}%</td></tr>
          <tr><td>Expired Inventory Value</td><td>{money(exec.expired_value)}</td></tr>
        </Table>
      </div>
    </div>
  );
}

function ExceptionsTab({ exceptions, onManage }) {
  return (
    <div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Actionable Exceptions</h3>
        <p className={styles.cardSub}>Items and branches that need management attention.</p>
        {exceptions.length ? (
          exceptions.map((e, i) => (
            <div className={styles.alert} key={i}>
              <span className={`${styles.badge} ${e.severity === 'high' ? styles.badgeHigh : e.severity === 'medium' ? styles.badgeMedium : styles.badgeLow}`}>
                {e.severity}
              </span>
              <div style={{ flex: 1 }}>
                <div><strong>{e.issue}</strong> · {e.branch}</div>
                <div className={styles.muted}>{e.impact}</div>
              </div>
              <span className={styles.pill}>{e.action}</span>
            </div>
          ))
        ) : <Empty text="No exceptions currently. All operations look healthy." />}
      </div>
      {exceptions.length > 0 && (
        <button className={styles.btn} onClick={onManage}>
          <TrendingUp size={16} /> View Branch Performance
        </button>
      )}
    </div>
  );
}

function Table({ headers, children }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
