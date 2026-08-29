import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Save } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import styles from './PharmacySalesReports.module.css';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
  { value: 'all', label: 'All Time' },
];

const toDateInput = (d) => d.toISOString().slice(0, 10);

const fmt = (n) => {
  const num = Number(n || 0);
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2);
};

const money = (n) => 'ETB ' + fmt(n);

const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '—');

const ellipsis = (s) => (s && String(s).length > 46 ? String(s).slice(0, 46) + '…' : s || '—');

const todayStr = toDateInput(new Date());
const firstOfMonth = new Date(); firstOfMonth.setDate(1);
const firstOfMonthStr = toDateInput(firstOfMonth);

function Stat({ label, value, sub }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

function Table({ headers, children }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Section({ num, title, caption, children }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionNum}>{num}</span>
        {title}
      </h2>
      {caption && <p className={styles.caption}>{caption}</p>}
      {children}
    </section>
  );
}

function Empty({ text }) {
  return <p className={styles.empty}>{text}</p>;
}

export default function PharmacySalesReports() {
  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState(firstOfMonthStr);
  const [to, setTo] = useState(todayStr);
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overallTarget, setOverallTarget] = useState('');
  const [branchTargets, setBranchTargets] = useState({});
  const [savedMsg, setSavedMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { period };
      if (period === 'custom') { params.from = from; params.to = to; }
      if (branchId) params.branch_id = branchId;
      const res = await pharmacyService.getCompleteReport(params);
      setData(res?.data || res);
    } catch (e) {
      console.error('report load error', e);
    } finally {
      setLoading(false);
    }
  }, [period, from, to, branchId]);

  const loadTargets = useCallback(async () => {
    try {
      const res = await pharmacyService.getTargets();
      const rows = res?.data || (Array.isArray(res) ? res : []);
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

  useEffect(() => {
    pharmacyService.getBranches()
      .then(res => setBranches(res?.data || res || []))
      .catch(() => {});
  }, []);

  const saveTargets = async () => {
    const payload = [{ branch_id: null, sales_target: overallTarget, period: 'ALL' }];
    (data?.branch_performance || []).forEach(bp => {
      payload.push({ branch_id: bp.branch_id, sales_target: branchTargets[bp.branch_id] || 0, period: 'ALL' });
    });
    try {
      await pharmacyService.saveTargets({ targets: payload });
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 2500);
      load();
    } catch (e) {
      console.error('save error', e);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById('report-print-root');
    if (!el) return;
    const css = Array.from(document.querySelectorAll('style[data-vite-dev-id]'))
      .filter(s => (s.dataset.viteDevId || '').includes('PharmacySalesReports.module.css'))
      .map(s => s.textContent)
      .join('\n');
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Pharmacy Manager — Complete Report</title>
<style>
@page { size: A4 landscape; margin: 10mm; }
body { margin: 0; }
${css}
</style>
</head>
<body>${el.outerHTML}
<script>window.onload = function () { setTimeout(function () { window.print(); }, 400); };<\/script>
</body>
</html>`;
    const w = window.open('', '_blank', 'width=1100,height=800');
    if (!w) { window.print(); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const d = data || {};
  const exec = d.executive || {};
  const branchPerf = d.branch_performance || [];
  const product = d.product_health || {};
  const profit = d.profitability || {};
  const payMix = d.payment_mix || [];
  const exceptions = d.exceptions || [];

  return (
    <div className={styles.page} id="report-print-root">
      <header className={styles.header}>
        <h1 className={styles.title}>Pharmacy Manager — Complete Report</h1>
        <p className={styles.meta}>
          Consolidated across Pharmacy (Store · Stock Operations · Procurement · Direct Delivery ·
          Adjustments · Expiry · Batches · Health) and Worker Sales
        </p>
        <div className={styles.toolbar}>
          <div className={styles.fieldGroup}>
            <label htmlFor="rp-period">Period</label>
            <select id="rp-period" className={styles.select} value={period} onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {period === 'custom' && (
            <div className={styles.fieldGroup}>
              <label>Range</label>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <input type="date" className={styles.input} value={from} onChange={e => setFrom(e.target.value)} title="From" />
                <input type="date" className={styles.input} value={to} onChange={e => setTo(e.target.value)} title="To" />
              </div>
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label htmlFor="rp-branch">Branch</label>
            <select id="rp-branch" className={styles.select} value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
        </div>
        <p className={styles.meta} style={{ marginTop: '1rem' }}>
          Period: <strong>{d.period || '—'}</strong> · Generated: {new Date().toLocaleString()}
        </p>
      </header>

      <hr className={styles.rule} />

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : (
        <>
          {/* 1 — Executive Summary */}
          <Section num="1" title="Executive Summary" caption="Headline sales and inventory figures for the selected period.">
            <div className={styles.stats}>
              <Stat label="Total Revenue" value={money(exec.revenue)} sub={`${exec.transactions} transactions`} />
              <Stat label="Gross Profit" value={money(exec.gross_profit)} sub={`${exec.margin ?? 0}% margin`} />
              <Stat label="Avg Order Value" value={money(exec.avg_transaction)} />
              <Stat label="Sales Growth" value={exec.growth !== null ? exec.growth + '%' : '—'} sub="vs previous period" />
              <Stat label="Inventory Value" value={money(exec.inventory_value)} sub={`${money(exec.expired_value)} expired`} />
              <Stat label="Target" value={money(exec.target)} sub={exec.achievement !== null ? `${exec.achievement}% achieved` : 'No target set'} />
              <Stat label="Receivables" value={money(exec.outstanding_receivables)} sub="Pharmacy ledger" />
            </div>
            {exec.achievement !== null && (
              <>
                <p className={styles.meta} style={{ marginBottom: '0.5rem' }}>
                  Target achievement: {fmt(exec.revenue)} of {fmt(exec.target)} ETB ({exec.achievement}%)
                </p>
                <div className={styles.progress} style={{ height: '0.5rem', borderRadius: '999px', background: 'hsl(var(--muted))', overflow: 'hidden', maxWidth: '640px' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, exec.achievement))}%`, background: 'hsl(var(--primary))' }} />
                </div>
              </>
            )}
          </Section>

          <hr className={styles.rule} />

          {/* 2 — Branch Performance */}
          <Section num="2" title="Branch Performance" caption="Revenue, target and achievement per pharmacy branch.">
            {branchPerf.length ? (
              <div className={styles.stats}>
                <Stat label="Branches" value={branchPerf.length} />
                <Stat label="Total Target" value={money(branchPerf.reduce((s, b) => s + (b.target || 0), 0))} />
                <Stat label="Total Revenue" value={money(branchPerf.reduce((s, b) => s + (b.revenue || 0), 0))} />
                <Stat label="Transactions" value={fmt(branchPerf.reduce((s, b) => s + (b.transactions || 0), 0))} />
              </div>
            ) : null}
            {branchPerf.length ? (
              <Table headers={['Branch', 'Transactions', 'Products', 'Revenue', 'Gross Profit', 'Margin %', 'Target', 'Achievement']}>
                {branchPerf.map(bp => (
                  <tr key={bp.branch_id}>
                    <td><strong>{bp.branch}</strong></td>
                    <td>{bp.transactions}</td>
                    <td>{bp.products}</td>
                    <td className={styles.pushed}>{money(bp.revenue)}</td>
                    <td className={styles.pushed}>{money(bp.gross_profit)}</td>
                    <td>{bp.margin}%</td>
                    <td className={styles.pushed}>{money(bp.target)}</td>
                    <td>{bp.achievement !== null ? bp.achievement + '%' : '—'}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty text="No branch data available." />}
          </Section>

          <hr className={styles.rule} />

          {/* 3 — Products & Inventory Health */}
          <Section num="3" title="Products & Inventory Health" caption="Best and worst moving products across all branches.">
            <div className={styles.stats}>
              <Stat label="Inventory Value" value={money(product.inventory_value)} />
              <Stat label="Out of Stock" value={fmt((product.out_of_stock || []).length)} />
              <Stat label="Near Expiry" value={fmt((product.near_expiry || []).length)} />
              <Stat label="Slow / Overstocked" value={fmt((product.slow_moving || []).length + (product.overstocked || []).length)} />
            </div>
            <h3 className={styles.subhead}>Top Selling Products</h3>
            {(product.top_by_qty || []).length ? (
              <Table headers={['Product', 'Qty', 'Revenue']}>
                {(product.top_by_qty || []).map((p, i) => (
                  <tr key={i}><td>{p.name}</td><td>{p.qty}</td><td className={styles.pushed}>{money(p.revenue)}</td></tr>
                ))}
              </Table>
            ) : <Empty text="Sales data will appear here once sales are recorded." />}
            <h3 className={styles.subhead}>Highest Profit Products</h3>
            {(product.top_by_profit || []).length ? (
              <Table headers={['Product', 'Revenue', 'Profit']}>
                {(product.top_by_profit || []).map((p, i) => (
                  <tr key={i}><td>{p.name}</td><td className={styles.pushed}>{money(p.revenue)}</td><td className={styles.pushed}>{money(p.revenue - p.cost)}</td></tr>
                ))}
              </Table>
            ) : <Empty text="Profit data will appear here once sales are recorded." />}
            <div className={styles.grid}>
              <div>
                <h3 className={styles.subhead}>Slow Moving / Reorder</h3>
                {(product.slow_moving || []).length ? (
                  <ul className={styles.list}>
                    {(product.slow_moving || []).map((s, i) => (
                      <li key={i} className={styles.listItem}>
                        <strong>{s.name}</strong>
                        <span className={styles.meta}>{s.qty} in stock, reorder at {s.reorder_level} ({money(s.value)})</span>
                      </li>
                    ))}
                  </ul>
                ) : <Empty text="No slow-moving items." />}
              </div>
              <div>
                <h3 className={styles.subhead}>Overstocked</h3>
                {(product.overstocked || []).length ? (
                  <ul className={styles.list}>
                    {(product.overstocked || []).map((o, i) => (
                      <li key={i} className={styles.listItem}>
                        <strong>{o.name}</strong>
                        <span className={styles.meta}>{o.qty} units ({money(o.value)} tied up)</span>
                      </li>
                    ))}
                  </ul>
                ) : <Empty text="No overstocked items." />}
              </div>
            </div>
            <div className={styles.grid}>
              <div>
                <h3 className={styles.subhead}>Out of Stock</h3>
                {(product.out_of_stock || []).length ? (
                  <ul className={styles.list}>
                    {(product.out_of_stock || []).map((o, i) => (
                      <li key={i} className={styles.listItem}>
                        <strong>{o.name}</strong>
                        <span className={styles.meta}>reorder at {o.reorder_level}</span>
                      </li>
                    ))}
                  </ul>
                ) : <Empty text="No stock-outs detected." />}
              </div>
              <div>
                <h3 className={styles.subhead}>Near Expiry (90 days)</h3>
                {(product.near_expiry || []).length ? (
                  <ul className={styles.list}>
                    {(product.near_expiry || []).map((n, i) => (
                      <li key={i} className={styles.listItem}>
                        <strong>{n.name}</strong>
                        <span className={styles.meta}>x{n.qty}, expires {new Date(n.expiry_date).toLocaleDateString()} ({money(n.value)})</span>
                      </li>
                    ))}
                  </ul>
                ) : <Empty text="No items near expiry." />}
              </div>
            </div>
          </Section>

          <hr className={styles.rule} />

          {/* 4 — Profitability */}
          <Section num="4" title="Profitability" caption="Cost of goods sold derived from medication cost prices.">
            <ExtStats
              items={[
                ['Revenue', money(profit.revenue)],
                ['COGS', money(profit.cogs)],
                ['Gross Profit', money(profit.gross_profit)],
                ['Gross Margin', (profit.margin ?? 0) + '%'],
                ['Expired Inventory Value', money(exec.expired_value)],
              ]}
            />
          </Section>

          <hr className={styles.rule} />

          {/* 5 — Worker Sales */}
          <Section num="5" title="Sales by Worker & Branch" caption="Who sold what, and how it was paid, during the selected period.">
            {(d.worker_sales || {}).by_worker?.length ? (
              <>
                <h3 className={styles.subhead}>By Worker</h3>
                <Table headers={['Worker', 'Branch', 'Transactions', 'Products Sold', 'Revenue', 'Share']}>
                  {(d.worker_sales || {}).by_worker.map((w, i) => (
                    <tr key={i}>
                      <td><strong>{w.worker_name}</strong></td>
                      <td>{w.branch_id || '—'}</td>
                      <td>{w.transactions}</td>
                      <td>{w.products}</td>
                      <td className={styles.pushed}>{money(w.revenue)}</td>
                      <td>{pct(w.revenue, (d.worker_sales.by_worker || []).reduce((s, x) => s + (x.revenue || 0), 0))}</td>
                    </tr>
                  ))}
                </Table>
              </>
            ) : <Empty text="No worker sales in this period." />}
            {(d.worker_sales || {}).by_branch?.length ? (
              <>
                <h3 className={styles.subhead}>By Branch</h3>
                <Table headers={['Branch', 'Transactions', 'Products', 'Revenue']}>
                  {(d.worker_sales || {}).by_branch.map((b, i) => (
                    <tr key={i}>
                      <td><strong>{b.branch}</strong></td>
                      <td>{b.transactions}</td>
                      <td>{b.products}</td>
                      <td className={styles.pushed}>{money(b.revenue)}</td>
                    </tr>
                  ))}
                </Table>
              </>
            ) : null}
            <h3 className={styles.subhead}>Payment Mix</h3>
            {payMix.length ? (
              <Table headers={['Method', 'Amount', 'Share']}>
                {payMix.map((m, i) => (
                  <tr key={i}>
                    <td><strong>{m.method || 'CASH'}</strong></td>
                    <td className={styles.pushed}>{money(m.amount)}</td>
                    <td>{pct(m.amount, exec.revenue)}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty text="No payments recorded in this period." />}
          </Section>

          <hr className={styles.rule} />

          {/* 6 — Store Inventory (medical store) */}
          <Section num="6" title="Store Inventory" caption="Medical store / warehouse stock. This is completely separate data from the Pharmacy stock below.">
            <div className={styles.stats}>
              <Stat label="SKUs" value={fmt((d.store_inventory || {}).total_skus)} sub={`${fmt((d.store_inventory || {}).total_units)} units`} />
              <Stat label="Store Value" value={money((d.store_inventory || {}).inventory_value)} />
              <Stat label="Reserved" value={fmt((d.store_inventory || {}).reserved_quantity)} />
              <Stat label="Low / Out of Stock" value={`${fmt((d.store_inventory || {}).low_stock)} / ${fmt((d.store_inventory || {}).out_of_stock)}`} />
            </div>
            {(d.store_inventory || {}).by_category?.length ? (
              <>
                <h3 className={styles.subhead}>Store Inventory by Category</h3>
                <Table headers={['Category', 'SKUs', 'Units', 'Value']}>
                  {(d.store_inventory || {}).by_category.map((c, i) => (
                    <tr key={i}><td><strong>{c.category}</strong></td><td>{c.skus}</td><td>{fmt(c.units)}</td><td className={styles.pushed}>{money(c.value)}</td></tr>
                  ))}
                </Table>
              </>
            ) : null}
            {(d.store_inventory || {}).top_by_value?.length ? (
              <>
                <h3 className={styles.subhead}>Highest-Value Store Items</h3>
                <Table headers={['Drug', 'Units', 'Value']}>
                  {(d.store_inventory || {}).top_by_value.map((x, i) => (
                    <tr key={i}><td>{x.name}</td><td>{x.qty}</td><td className={styles.pushed}>{money(x.value)}</td></tr>
                  ))}
                </Table>
              </>
            ) : null}
          </Section>

          <hr className={styles.rule} />

          {/* 7 — Pharmacy Stock (front dispensary: main + branches) */}
          <Section num="7" title="Pharmacy Stock" caption="Front dispensary stock. Main = unassigned in-house units. Branches = drugs held outside the main store, assigned to pharmacy branches.">
            <div className={styles.stats}>
              <Stat label="Total SKUs" value={fmt((d.pharmacy_stock || {}).total_skus)} sub={`${fmt((d.pharmacy_stock || {}).total_units)} units`} />
              <Stat label="Main Pharmacy" value={money((d.pharmacy_stock || {}).main_value)} sub={`${fmt((d.pharmacy_stock || {}).main_units)} units · ${fmt((d.pharmacy_stock || {}).main_skus)} SKUs`} />
              <Stat label="Branches (outside store)" value={money((d.pharmacy_stock || {}).branch_value)} sub={`${fmt((d.pharmacy_stock || {}).branch_units)} units · ${fmt((d.pharmacy_stock || {}).branch_skus)} SKUs`} />
              <Stat label="Total Value" value={money((d.pharmacy_stock || {}).inventory_value)} />
            </div>
            <h3 className={styles.subhead}>Drugs Held Outside the Store, by Pharmacy Branch</h3>
            {(d.pharmacy_stock || {}).by_branch?.length ? (
              <Table headers={['Branch', 'SKUs', 'Units', 'Value', 'Low Stock', 'Out of Stock']}>
                {(d.pharmacy_stock || {}).by_branch.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.branch}</strong></td>
                    <td>{b.skus}</td>
                    <td>{fmt(b.units)}</td>
                    <td className={styles.pushed}>{money(b.value)}</td>
                    <td>{b.low_stock}</td>
                    <td>{b.out_of_stock}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty text="No branch-assigned stock found." />}
          </Section>

          <hr className={styles.rule} />

          {/* 8 — Stock Operations (movements) */}
          <Section num="8" title="Stock Operations — Movements & Transfers" caption="Movements, adjustments and transfer requests for the selected period.">
            <div className={styles.stats}>
              <Stat label="Movements (period)" value={fmt((d.stock_operations || {}).count)} sub={`In ${fmt((d.stock_operations || {}).quantity_in)} · Out ${fmt((d.stock_operations || {}).quantity_out)}`} />
            </div>
            <h3 className={styles.subhead}>Stock Movements / Adjustments</h3>
            {(d.stock_operations || {}).adjustments?.length ? (
              <Table headers={['Reason', 'Entries', 'In', 'Out']}>
                {(d.stock_operations || {}).adjustments.map((a, i) => (
                  <tr key={i}><td>{ellipsis(a.reason)}</td><td>{a.count}</td><td>{fmt(a.quantity_in)}</td><td>{fmt(a.quantity_out)}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No stock movements in this period." />}
            <h3 className={styles.subhead}>Transfer Requests</h3>
            <p className={styles.meta} style={{ marginBottom: '0.75rem' }}>{((d.stock_operations || {}).transfers || {}).count || 0} requests in the selected period</p>
            {((d.stock_operations || {}).transfers || {}).by_status?.length ? (
              <Table headers={['Status', 'Requests']}>
                {((d.stock_operations || {}).transfers || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td>{s.count}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No transfer requests in this period." />}
          </Section>

          <hr className={styles.rule} />

          {/* 9 — Procurement & Direct Delivery */}
          <Section num="9" title="Procurement & Direct Delivery" caption="Drug procurements and supplier deliveries recorded in the period.">
            <div className={styles.stats}>
              <Stat label="Procurement Requests" value={fmt(((d.procurement || {}).requests || {}).count)} sub={`${fmt(((d.procurement || {}).requests || {}).new_drugs)} new drug`} />
              <Stat label="Est. Total" value={money(((d.procurement || {}).requests || {}).total_estimated)} />
              <Stat label="Direct Deliveries" value={fmt(((d.procurement || {}).direct_deliveries || {}).count)} />
              <Stat label="Delivery Value" value={money(((d.procurement || {}).direct_deliveries || {}).total_amount)} />
            </div>
            <h3 className={styles.subhead}>Procurement Requests by Status</h3>
            {((d.procurement || {}).requests || {}).by_status?.length ? (
              <Table headers={['Status', 'Requests']}>
                {((d.procurement || {}).requests || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td>{s.count}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No procurement requests in this period." />}
            <h3 className={styles.subhead}>Direct Deliveries by Status</h3>
            {((d.procurement || {}).direct_deliveries || {}).by_status?.length ? (
              <Table headers={['Status', 'Deliveries']}>
                {((d.procurement || {}).direct_deliveries || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td>{s.count}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No direct deliveries in this period." />}
          </Section>

          <hr className={styles.rule} />

          {/* 10 — Expiry Management */}
          <Section num="10" title="Expiry Management" caption="Reported expired drugs and the near-expiry watchlist.">
            <div className={styles.stats}>
              <Stat label="Reported Expired" value={fmt(((d.expiry || {}).reported || {}).count)} sub={`${fmt(((d.expiry || {}).reported || {}).total_quantity)} units`} />
              <Stat label="Expired Value Now" value={money(exec.expired_value)} />
              <Stat label="Near Expiry (90d)" value={fmt((product.near_expiry || []).length)} />
            </div>
            <h3 className={styles.subhead}>Expired Drug Reports (period)</h3>
            {((d.expiry || {}).reported || {}).by_status?.length ? (
              <Table headers={['Status', 'Reports']}>
                {((d.expiry || {}).reported || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td>{s.count}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No expired-drug reports in this period." />}
            <h3 className={styles.subhead}>Near-Expiry Watchlist</h3>
            {(product.near_expiry || []).length ? (
              <Table headers={['Drug', 'Qty', 'Expiry', 'Value']}>
                {(product.near_expiry || []).map((n, i) => (
                  <tr key={i}>
                    <td><strong>{n.name}</strong></td>
                    <td>{n.qty}</td>
                    <td>{new Date(n.expiry_date).toLocaleDateString()}</td>
                    <td className={styles.pushed}>{money(n.value)}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty text="No items near expiry." />}
          </Section>

          <hr className={styles.rule} />

          {/* 11 — Batch Management */}
          <Section num="11" title="Batch Management" caption="Summaries of the batch groups currently held in the store.">
            <div className={styles.stats}>
              <Stat label="Batches" value={fmt((d.batches || {}).total)} />
              <Stat label="Active" value={fmt((d.batches || {}).active)} />
              <Stat label="With Expired Stock" value={fmt((d.batches || {}).expired)} />
            </div>
            {(d.batches || {}).list?.length ? (
              <Table headers={['Batch No', 'Drugs', 'Units', 'Status', 'Earliest Expiry']}>
                {(d.batches || {}).list.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.batch_no}</strong></td>
                    <td>{b.drugs}</td>
                    <td>{fmt(b.units)}</td>
                    <td>{b.expired > 0 ? 'Expired (part)' : 'Active'}</td>
                    <td>{b.expiry_min ? new Date(b.expiry_min).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty text="No batches available." />}
          </Section>

          <hr className={styles.rule} />

          {/* 12 — Health Content */}
          <Section num="12" title="Health Content" caption="Medicines published through the Health Publisher and customer-facing content.">
            <div className={styles.stats}>
              <Stat label="Published Posts" value={fmt((d.health || {}).published)} />
              <Stat label="Created in Period" value={fmt((d.health || {}).created_in_period)} />
              <Stat label="Total Drugs" value={fmt((d.health || {}).total_drugs)} />
            </div>
            <Table headers={['Metric', 'Value']}>
              <tr><td>Published posts</td><td>{fmt((d.health || {}).published)}</td></tr>
              <tr><td>Created in selected period</td><td>{fmt((d.health || {}).created_in_period)}</td></tr>
              <tr><td>Total medicines registered</td><td>{fmt((d.health || {}).total_drugs)}</td></tr>
            </Table>
          </Section>

          <hr className={styles.rule} />

          {/* 13 — Audit Trail */}
          <Section num="13" title="Audit Trail" caption="Cash and stock actions recorded in the pharmacy audit trail.">
            <div className={styles.stats}>
              <Stat label="Entries" value={fmt((d.audit || {}).count)} sub="in selected period" />
              <Stat label="Logged Amount" value={money((d.audit || {}).total_amount)} />
              <Stat label="Action Types" value={fmt(((d.audit || {}).by_action || []).length)} />
            </div>
            <h3 className={styles.subhead}>Activity by Action</h3>
            {(d.audit || {}).by_action?.length ? (
              <Table headers={['Action', 'Entries', 'Amount']}>
                {(d.audit || {}).by_action.map((a, i) => (
                  <tr key={i}><td><strong>{a.action}</strong></td><td>{a.count}</td><td className={styles.pushed}>{money(a.amount)}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No audit activity in this period." />}
            <h3 className={styles.subhead}>Recent Audit Trail</h3>
            {(d.audit || {}).recent?.length ? (
              <Table headers={['Date & Time', 'Action', 'Worker', 'Branch', 'Amount']}>
                {(d.audit || {}).recent.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td><strong>{r.action}</strong></td>
                    <td>{r.worker_name}</td>
                    <td>{r.branch_name}</td>
                    <td className={styles.pushed}>{money(r.amount)}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty text="No audit entries in this period." />}
          </Section>

          <hr className={styles.rule} />

          {/* 14 — Exceptions */}
          <Section num="14" title="Exceptions" caption="Items and branches that need management attention.">
            {exceptions.length ? (
              exceptions.map((e, i) => (
                <div className={styles.exception} key={i}>
                  <span className={`${styles.exceptionTag} ${e.severity === 'high' ? styles.tagHigh : e.severity === 'medium' ? styles.tagMedium : styles.tagLow}`}>
                    {e.severity}
                  </span>
                  <div>
                    <div><strong>{e.issue}</strong> · {e.branch}</div>
                    <div className={styles.meta}>{e.impact}</div>
                  </div>
                  <span className={styles.pushed}>{e.action}</span>
                </div>
              ))
            ) : <Empty text="No exceptions currently. All operations look healthy." />}
          </Section>

          {/* 15 — Sales Targets */}
          <hr className={styles.rule} />
          <Section num="15" title="Sales Targets" caption="Targets used to compute achievement on this report.">
            <div className={styles.targetForm}>
              <div className={styles.targetRow}>
                <span>Overall (ETB)</span>
                <input type="number" value={overallTarget} onChange={e => setOverallTarget(e.target.value)} placeholder="e.g. 500000" />
              </div>
              {branchPerf.map(bp => (
                <div className={styles.targetRow} key={bp.branch_id}>
                  <span>{bp.branch}</span>
                  <input type="number" value={branchTargets[bp.branch_id] || ''} onChange={e => setBranchTargets(prev => ({ ...prev, [bp.branch_id]: e.target.value }))} placeholder="e.g. 150000" />
                </div>
              ))}
            </div>
            <div className={styles.targetActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={saveTargets}>
                <Save size={16} /> Save Targets
              </button>
              {savedMsg && <span className={styles.meta} style={{ marginLeft: '0.75rem' }}>{savedMsg}</span>}
            </div>
          </Section>
        </>
      )}

      <footer className={styles.footer}>
        SUTANA · Pharmacy Manager Complete Report · Period: {d.period || '—'} · Range: {d.range ? `${d.range.start} → ${d.range.end}` : '—'} · Printed {new Date().toLocaleString()}
      </footer>
    </div>
  );
}

function ExtStats({ items }) {
  return (
    <Table headers={['Metric', 'Amount']}>
      {items.map(([label, value], i) => (
        <tr key={i}><td>{label}</td><td className={styles.pushed}><strong>{value}</strong></td></tr>
      ))}
    </Table>
  );
}

/* eslint-disable react/no-unescaped-entities */