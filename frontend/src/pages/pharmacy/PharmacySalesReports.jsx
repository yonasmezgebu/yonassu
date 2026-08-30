import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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

function Table({ headers, children, aligns }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: aligns?.[i] || 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Section({ num, title, caption, children }) {
  return (
    <section id={`report-section-${num}`} className={styles.section}>
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

export default function PharmacySalesReports({ readOnly = false }) {
  const location = useLocation();
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
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success | error
  const [editingTargets, setEditingTargets] = useState(false);

  // Scroll to the section specified in ?section=N query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (!section) return;
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(`report-section-${section}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 300);
      }
    };
    tryScroll();
  }, [location.search, loading]);

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
    if (saveStatus === 'saving') return;
    const payload = [{ branch_id: null, sales_target: Number(overallTarget) || 0, period: 'ALL' }];
    (data?.branch_performance || []).forEach(bp => {
      payload.push({ branch_id: bp.branch_id, sales_target: Number(branchTargets[bp.branch_id]) || 0, period: 'ALL' });
    });
    setSaveStatus('saving');
    setSavedMsg('');
    try {
      await pharmacyService.saveTargets({ targets: payload });
      setSaveStatus('success');
      setSavedMsg('Targets saved successfully!');
      setEditingTargets(false);
      load(); // refresh report to reflect new achievement %
      setTimeout(() => { setSaveStatus('idle'); setSavedMsg(''); }, 4000);
    } catch (e) {
      console.error('save error', e);
      setSaveStatus('error');
      setSavedMsg('Failed to save. Please try again.');
      setTimeout(() => { setSaveStatus('idle'); setSavedMsg(''); }, 4000);
    }
  };

  const cancelEdit = () => {
    setEditingTargets(false);
    loadTargets(); // revert to saved values
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

      {/* ── Section Quick-Jump Nav (visible to CEO for easy navigation) ── */}
      <nav style={{
        display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center',
        padding: '10px 0 14px', borderBottom: '1px solid #e2e8f0', marginBottom: 16
      }}>
        {Array.from({ length: Math.ceil(15 / 7) }).map((_, rIdx) => {
          const rowItems = [
            { n: 1,  label: 'Executive Summary' },
            { n: 2,  label: 'Branch Performance' },
            { n: 3,  label: 'Products & Inventory' },
            { n: 4,  label: 'Profitability' },
            { n: 5,  label: 'Sales by Worker' },
            { n: 6,  label: 'Store Inventory' },
            { n: 7,  label: 'Pharmacy Stock' },
            { n: 8,  label: 'Stock Movements' },
            { n: 9,  label: 'Procurement & Deliveries' },
            { n: 10, label: 'Expiry Management' },
            { n: 11, label: 'Batch Management' },
            { n: 12, label: 'Health Content' },
            { n: 13, label: 'Audit Trail' },
            { n: 14, label: 'Exceptions & Alerts' },
            { n: 15, label: 'Sales Targets' }
          ].slice(rIdx * 7, rIdx * 7 + 7);
          
          return (
            <div key={rIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {rowItems.map((btn, bIdx) => {
                const buttonEl = (
                  <button
                    key={btn.n}
                    onClick={() => {
                      const el = document.getElementById(`report-section-${btn.n}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 20,
                      border: '1px solid #cbd5e1', background: '#f8fafc',
                      fontSize: 12, fontWeight: 500, color: '#475569',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  >
                    <span style={{ fontWeight: 700, color: 'inherit' }}>{btn.n}</span>
                    {btn.label}
                  </button>
                );
                
                return bIdx < rowItems.length - 1
                  ? [buttonEl, <div key={`sep-${btn.n}`} style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />]
                  : buttonEl;
              })}
            </div>
          );
        })}
      </nav>

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
              <Table
                headers={['Branch', 'Transactions', 'Products', 'Revenue', 'Gross Profit', 'Margin %', 'Target', 'Achievement']}
                aligns={['left','right','right','right','right','right','right','right']}
              >
                {branchPerf.map(bp => (
                  <tr key={bp.branch_id}>
                    <td><strong>{bp.branch}</strong></td>
                    <td style={{textAlign:'right'}}>{bp.transactions}</td>
                    <td style={{textAlign:'right'}}>{bp.products}</td>
                    <td style={{textAlign:'right'}}>{money(bp.revenue)}</td>
                    <td style={{textAlign:'right'}}>{money(bp.gross_profit)}</td>
                    <td style={{textAlign:'right'}}>{bp.margin}%</td>
                    <td style={{textAlign:'right'}}>{money(bp.target)}</td>
                    <td style={{textAlign:'right'}}>{bp.achievement !== null ? bp.achievement + '%' : '—'}</td>
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
              <Table headers={['Product', 'Qty', 'Revenue']} aligns={['left','right','right']}>
                {(product.top_by_qty || []).map((p, i) => (
                  <tr key={i}><td>{p.name}</td><td style={{textAlign:'right'}}>{p.qty}</td><td style={{textAlign:'right'}}>{money(p.revenue)}</td></tr>
                ))}
              </Table>
            ) : <Empty text="Sales data will appear here once sales are recorded." />}
            <h3 className={styles.subhead}>Highest Profit Products</h3>
            {(product.top_by_profit || []).length ? (
              <Table headers={['Product', 'Revenue', 'Profit']} aligns={['left','right','right']}>
                {(product.top_by_profit || []).map((p, i) => (
                  <tr key={i}><td>{p.name}</td><td style={{textAlign:'right'}}>{money(p.revenue)}</td><td style={{textAlign:'right'}}>{money(p.revenue - p.cost)}</td></tr>
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
                <Table headers={['Worker', 'Branch', 'Transactions', 'Products Sold', 'Revenue', 'Share']} aligns={['left','left','right','right','right','right']}>
                  {(d.worker_sales || {}).by_worker.map((w, i) => (
                    <tr key={i}>
                      <td><strong>{w.worker_name}</strong></td>
                      <td>{w.branch_id || '—'}</td>
                      <td style={{textAlign:'right'}}>{w.transactions}</td>
                      <td style={{textAlign:'right'}}>{w.products}</td>
                      <td style={{textAlign:'right'}}>{money(w.revenue)}</td>
                      <td style={{textAlign:'right'}}>{pct(w.revenue, (d.worker_sales.by_worker || []).reduce((s, x) => s + (x.revenue || 0), 0))}</td>
                    </tr>
                  ))}
                </Table>
              </>
            ) : <Empty text="No worker sales in this period." />}
            {(d.worker_sales || {}).by_branch?.length ? (
              <>
                <h3 className={styles.subhead}>By Branch</h3>
                <Table headers={['Branch', 'Transactions', 'Products', 'Revenue']} aligns={['left','right','right','right']}>
                  {(d.worker_sales || {}).by_branch.map((b, i) => (
                    <tr key={i}>
                      <td><strong>{b.branch}</strong></td>
                      <td style={{textAlign:'right'}}>{b.transactions}</td>
                      <td style={{textAlign:'right'}}>{b.products}</td>
                      <td style={{textAlign:'right'}}>{money(b.revenue)}</td>
                    </tr>
                  ))}
                </Table>
              </>
            ) : null}
            <h3 className={styles.subhead}>Payment Mix</h3>
            {payMix.length ? (
              <Table headers={['Method', 'Amount', 'Share']} aligns={['left','right','right']}>
                {payMix.map((m, i) => (
                  <tr key={i}>
                    <td><strong>{m.method || 'CASH'}</strong></td>
                    <td style={{textAlign:'right'}}>{money(m.amount)}</td>
                    <td style={{textAlign:'right'}}>{pct(m.amount, exec.revenue)}</td>
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
                <Table headers={['Category', 'SKUs', 'Units', 'Value']} aligns={['left','right','right','right']}>
                  {(d.store_inventory || {}).by_category.map((c, i) => (
                    <tr key={i}><td><strong>{c.category}</strong></td><td style={{textAlign:'right'}}>{c.skus}</td><td style={{textAlign:'right'}}>{fmt(c.units)}</td><td style={{textAlign:'right'}}>{money(c.value)}</td></tr>
                  ))}
                </Table>
              </>
            ) : null}
            {(d.store_inventory || {}).top_by_value?.length ? (
              <>
                <h3 className={styles.subhead}>Highest-Value Store Items</h3>
                <Table headers={['Drug', 'Units', 'Value']} aligns={['left','right','right']}>
                  {(d.store_inventory || {}).top_by_value.map((x, i) => (
                    <tr key={i}><td>{x.name}</td><td style={{textAlign:'right'}}>{x.qty}</td><td style={{textAlign:'right'}}>{money(x.value)}</td></tr>
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
              <Table headers={['Branch', 'SKUs', 'Units', 'Value', 'Low Stock', 'Out of Stock']} aligns={['left','right','right','right','right','right']}>
                {(d.pharmacy_stock || {}).by_branch.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.branch}</strong></td>
                    <td style={{textAlign:'right'}}>{b.skus}</td>
                    <td style={{textAlign:'right'}}>{fmt(b.units)}</td>
                    <td style={{textAlign:'right'}}>{money(b.value)}</td>
                    <td style={{textAlign:'right'}}>{b.low_stock}</td>
                    <td style={{textAlign:'right'}}>{b.out_of_stock}</td>
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
              <Table headers={['Reason', 'Entries', 'In', 'Out']} aligns={['left','right','right','right']}>
                {(d.stock_operations || {}).adjustments.map((a, i) => (
                  <tr key={i}><td>{ellipsis(a.reason)}</td><td style={{textAlign:'right'}}>{a.count}</td><td style={{textAlign:'right'}}>{fmt(a.quantity_in)}</td><td style={{textAlign:'right'}}>{fmt(a.quantity_out)}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No stock movements in this period." />}
            <h3 className={styles.subhead}>Transfer Requests</h3>
            <p className={styles.meta} style={{ marginBottom: '0.75rem' }}>{((d.stock_operations || {}).transfers || {}).count || 0} requests in the selected period</p>
            {((d.stock_operations || {}).transfers || {}).by_status?.length ? (
              <Table headers={['Status', 'Requests']} aligns={['left','right']}>
                {((d.stock_operations || {}).transfers || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td style={{textAlign:'right'}}>{s.count}</td></tr>
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
              <Table headers={['Status', 'Requests']} aligns={['left','right']}>
                {((d.procurement || {}).requests || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td style={{textAlign:'right'}}>{s.count}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No procurement requests in this period." />}
            <h3 className={styles.subhead}>Direct Deliveries by Status</h3>
            {((d.procurement || {}).direct_deliveries || {}).by_status?.length ? (
              <Table headers={['Status', 'Deliveries']} aligns={['left','right']}>
                {((d.procurement || {}).direct_deliveries || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td style={{textAlign:'right'}}>{s.count}</td></tr>
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
              <Stat label="Currently Expired" value={fmt((product.already_expired || []).length)} />
              <Stat label="Near Expiry (90d)" value={fmt((product.near_expiry || []).length)} />
            </div>

            <h3 className={styles.subhead}>Already Expired Stock (Action Required)</h3>
            {(product.already_expired || []).length ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '2px', marginBottom: '1.5rem' }}>
                <Table headers={['Drug', 'Qty', 'Expired On', 'Value']} aligns={['left','right','left','right']}>
                  {(product.already_expired || []).map((n, i) => (
                    <tr key={i}>
                      <td><strong>{n.name}</strong></td>
                      <td style={{textAlign:'right'}}>{n.qty}</td>
                      <td style={{color: '#dc2626', fontWeight: 600}}>{new Date(n.expiry_date).toLocaleDateString()}</td>
                      <td style={{textAlign:'right'}}>{money(n.value)}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            ) : <Empty text="No expired items in stock." />}

            <h3 className={styles.subhead}>Near-Expiry Watchlist</h3>
            {(product.near_expiry || []).length ? (
              <Table headers={['Drug', 'Qty', 'Expiry', 'Value']} aligns={['left','right','left','right']}>
                {(product.near_expiry || []).map((n, i) => (
                  <tr key={i}>
                    <td><strong>{n.name}</strong></td>
                    <td style={{textAlign:'right'}}>{n.qty}</td>
                    <td>{new Date(n.expiry_date).toLocaleDateString()}</td>
                    <td style={{textAlign:'right'}}>{money(n.value)}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty text="No items near expiry." />}

            <h3 className={styles.subhead}>Expired Drug Reports (period)</h3>
            {((d.expiry || {}).reported || {}).by_status?.length ? (
              <Table headers={['Status', 'Reports']} aligns={['left','right']}>
                {((d.expiry || {}).reported || {}).by_status.map((s, i) => (
                  <tr key={i}><td><strong>{s.status}</strong></td><td style={{textAlign:'right'}}>{s.count}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No expired-drug reports in this period." />}
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
              <Table headers={['Batch No', 'Drugs', 'Units', 'Status', 'Earliest Expiry']} aligns={['left','right','right','left','left']}>
                {(d.batches || {}).list.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.batch_no}</strong></td>
                    <td style={{textAlign:'right'}}>{b.drugs}</td>
                    <td style={{textAlign:'right'}}>{fmt(b.units)}</td>
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
            <Table headers={['Metric', 'Value']} aligns={['left','right']}>
              <tr><td>Published posts</td><td style={{textAlign:'right'}}>{fmt((d.health || {}).published)}</td></tr>
              <tr><td>Created in selected period</td><td style={{textAlign:'right'}}>{fmt((d.health || {}).created_in_period)}</td></tr>
              <tr><td>Total medicines registered</td><td style={{textAlign:'right'}}>{fmt((d.health || {}).total_drugs)}</td></tr>
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
              <Table headers={['Action', 'Entries', 'Amount']} aligns={['left','right','right']}>
                {(d.audit || {}).by_action.map((a, i) => (
                  <tr key={i}><td><strong>{a.action}</strong></td><td style={{textAlign:'right'}}>{a.count}</td><td style={{textAlign:'right'}}>{money(a.amount)}</td></tr>
                ))}
              </Table>
            ) : <Empty text="No audit activity in this period." />}
            <h3 className={styles.subhead}>Recent Audit Trail</h3>
            {(d.audit || {}).recent?.length ? (
              <Table headers={['Date & Time', 'Action', 'Worker', 'Branch', 'Amount']} aligns={['left','left','left','left','right']}>
                {(d.audit || {}).recent.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td><strong>{r.action}</strong></td>
                    <td>{r.worker_name}</td>
                    <td>{r.branch_name}</td>
                    <td style={{textAlign:'right'}}>{money(r.amount)}</td>
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
          <Section num="15" title="Sales Targets" caption="Monthly revenue targets used to compute achievement percentages across the report.">

            {/* ── View mode: table showing current saved targets ── */}
            {!editingTargets && (
              <>
                <Table headers={['Branch / Level', 'Sales Target (ETB)', 'Achievement']} aligns={['left','right','right']}>
                  <tr>
                    <td><strong>Overall</strong></td>
                    <td style={{textAlign:'right'}}>{overallTarget ? Number(overallTarget).toLocaleString() : '—'}</td>
                    <td style={{textAlign:'right'}}>
                      {overallTarget && data?.executive
                        ? Math.round((data.executive.revenue / Number(overallTarget)) * 1000) / 10 + '%'
                        : '—'}
                    </td>
                  </tr>
                  {branchPerf.map(bp => (
                    <tr key={bp.branch_id}>
                      <td>{bp.branch}</td>
                      <td style={{textAlign:'right'}}>{branchTargets[bp.branch_id] ? Number(branchTargets[bp.branch_id]).toLocaleString() : '—'}</td>
                      <td style={{textAlign:'right'}}>{bp.achievement !== null ? bp.achievement + '%' : '—'}</td>
                    </tr>
                  ))}
                </Table>

                {/* Save status toast shown after save (outside edit mode) */}
                {savedMsg && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    marginTop: 12, padding: '8px 16px', borderRadius: 8,
                    background: saveStatus === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${saveStatus === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    color: saveStatus === 'success' ? '#15803d' : '#dc2626',
                    fontSize: 14, fontWeight: 500,
                    animation: 'fadeIn 0.2s ease',
                  }}>
                    {saveStatus === 'success' ? '✓' : '✗'} {savedMsg}
                  </div>
                )}

                {!readOnly && (
                  <div style={{ marginTop: 16 }}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => setEditingTargets(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Update Targets
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Edit mode: inputs for each target ── */}
            {editingTargets && !readOnly && (
              <>
                <div className={styles.targetForm}>
                  <div className={styles.targetRow}>
                    <span><strong>Overall</strong> (ETB)</span>
                    <input
                      type="number"
                      value={overallTarget}
                      onChange={e => setOverallTarget(e.target.value)}
                      placeholder="e.g. 500000"
                    />
                  </div>
                  {branchPerf.map(bp => (
                    <div className={styles.targetRow} key={bp.branch_id}>
                      <span>{bp.branch} (ETB)</span>
                      <input
                        type="number"
                        value={branchTargets[bp.branch_id] || ''}
                        onChange={e => setBranchTargets(prev => ({ ...prev, [bp.branch_id]: e.target.value }))}
                        placeholder="e.g. 150000"
                      />
                    </div>
                  ))}
                </div>

                {/* Action bar: Save + Cancel + inline toast */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={saveTargets}
                    disabled={saveStatus === 'saving'}
                    style={{ opacity: saveStatus === 'saving' ? 0.7 : 1 }}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4, animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={14} style={{marginRight:4}} /> Save Targets
                      </>
                    )}
                  </button>

                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={cancelEdit}
                    disabled={saveStatus === 'saving'}
                  >
                    Cancel
                  </button>

                  {/* Inline confirmation toast */}
                  {savedMsg && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '7px 14px', borderRadius: 8,
                      background: saveStatus === 'success' ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${saveStatus === 'success' ? '#bbf7d0' : '#fecaca'}`,
                      color: saveStatus === 'success' ? '#15803d' : '#dc2626',
                      fontSize: 13, fontWeight: 600,
                    }}>
                      {saveStatus === 'success'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                      {savedMsg}
                    </div>
                  )}
                </div>
              </>
            )}
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
    <Table headers={['Metric', 'Amount']} aligns={['left','right']}>
      {items.map(([label, value], i) => (
        <tr key={i}><td>{label}</td><td style={{textAlign:'right'}}><strong>{value}</strong></td></tr>
      ))}
    </Table>
  );
}

/* eslint-disable react/no-unescaped-entities */