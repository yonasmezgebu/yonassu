import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Boxes,
  Search,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle,
  Package,
  Flame,
  Info,
  TrendingUp,
  Printer,
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './PrintingProdMaterials.module.css';

/* ─── API ─────────────────────────────────────────────────────────────────── */
const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─── Toast ───────────────────────────────────────────────────────────────── */
const Toast = ({ toast }) => toast ? (
  <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : toast.type === 'warning' ? styles.toastWarning : styles.toastError}`}>
    <span className={styles.toastIcon}>
      {toast.type === 'success'
        ? <CheckCircle size={20} color="#16A34A" />
        : <AlertTriangle size={20} color={toast.type === 'warning' ? '#D97706' : '#DC2626'} />}
    </span>
    <span className={styles.toastMsg}>{toast.msg}</span>
  </div>
) : null;

/* ─── Consume Modal ───────────────────────────────────────────────────────── */
const ConsumeModal = ({ mat, onClose, onDone, showToast }) => {
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);
  const remaining = parseFloat(mat.quantity_remaining || 0);

  const submit = async () => {
    const q = parseFloat(qty);
    if (!q || q <= 0) return showToast('error', 'Enter a valid quantity to consume');
    if (q > remaining) return showToast('error', `Cannot consume more than remaining (${remaining} ${mat.unit})`);
    setBusy(true);
    try {
      await api.post(`${BASE}/production/materials/${mat.id}/consume`, { quantity_consumed: q });
      showToast('success', `Logged: ${q} ${mat.unit} consumed from ${mat.material_name}`);
      onDone();
      onClose();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusy(false);
  };

  const statCards = [
    { label: 'Moved In', val: parseFloat(mat.quantity_moved).toLocaleString(), color: '#0284C7' },
    { label: 'Consumed', val: parseFloat(mat.quantity_consumed).toLocaleString(), color: '#D97706' },
    { label: 'Remaining', val: remaining.toLocaleString(), color: remaining < 5 ? '#DC2626' : '#16A34A' },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Log Consumption</h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className={styles.modalBody}>
          <div>
            <div className={styles.modalMeta}>{mat.material_id} · {mat.category}</div>
            <div className={styles.modalName}>{mat.material_name}</div>
          </div>

          <div className={styles.modalStatGrid}>
            {statCards.map(s => (
              <div key={s.label} className={styles.modalStat}>
                <div className={styles.modalStatLabel}>{s.label}</div>
                <div className={styles.modalStatValue} style={{ color: s.color }}>
                  {s.val} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{mat.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="consume-qty">Quantity to Consume ({mat.unit})</label>
            <input
              id="consume-qty"
              type="number" min="0.001" step="0.001" value={qty}
              onChange={e => setQty(e.target.value)}
              className={styles.formInput}
              placeholder="0"
              autoFocus
            />
          </div>

          <button
            onClick={submit}
            disabled={busy || !qty}
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg} ${styles.submitBtn} ${styles.btnSweep}`}
          >
            {busy ? <><SegmentedSpinner size={16} /> Saving...</> : <><Flame size={18} /> Confirm Consumption</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────────────────── */
const PrintingProdMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consumeTarget, setConsumeTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE}/production/materials`);
      setMaterials(data.data || []);
    } catch {
      setMaterials([]);
      showToast('error', 'Failed to load production materials');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  // Auto-refresh every 20s
  useEffect(() => { const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const pct = (m) => parseFloat(m.quantity_moved) > 0
    ? Math.round((parseFloat(m.quantity_consumed) / parseFloat(m.quantity_moved)) * 100)
    : 0;

  const totalMoved     = materials.reduce((s, m) => s + parseFloat(m.quantity_moved    || 0), 0);
  const totalConsumed  = materials.reduce((s, m) => s + parseFloat(m.quantity_consumed || 0), 0);
  const totalRemaining = materials.reduce((s, m) => s + parseFloat(m.quantity_remaining|| 0), 0);
  const criticalCount  = materials.filter(m => parseFloat(m.quantity_remaining) <= parseFloat(m.reorder_level || 5)).length;

  const filtered = materials.filter(m =>
    !searchTerm ||
    (m.material_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.material_id   || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.category      || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overallRate = totalMoved > 0 ? Math.round((totalConsumed / totalMoved) * 100) : 0;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const handlePrint = () => {
    const rows = filtered.map(m => {
      const usage = pct(m);
      const usageColor = usage > 90 ? '#DC2626' : usage > 65 ? '#D97706' : '#16A34A';
      return `<tr>
        <td><strong>${esc(m.material_id)}</strong><br/><span style="color:#6B7280;font-size:11px">${esc(m.material_name)}</span></td>
        <td><span class="chip">${esc(m.category || '—')}</span></td>
        <td class="num">${parseFloat(m.quantity_moved || 0).toLocaleString()} <span class="u">${esc(m.unit || '')}</span></td>
        <td class="num">${parseFloat(m.quantity_consumed || 0).toLocaleString()} <span class="u">${esc(m.unit || '')}</span></td>
        <td class="num">${parseFloat(m.quantity_remaining || 0).toLocaleString()} <span class="u">${esc(m.unit || '')}</span></td>
        <td class="num"><b style="color:${usageColor}">${usage}%</b></td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) { showToast('warning', 'Popup blocked — allow popups for this site to print'); return; }

    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/>
<title>Production Materials — Stock Report</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; padding: 16px; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  p.meta { font-size: 11px; color: #6B7280; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead { display: table-header-group; }
  th { background: #2563EB; color: #fff; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
  td { border-bottom: 1px solid #E5E7EB; padding: 7px 10px; vertical-align: middle; }
  tbody tr:nth-child(even) { background: #F9FAFB; }
  .chip { display: inline-block; background: #EFF6FF; color: #2563EB; padding: 2px 8px; border-radius: 999px; font-size: 10px; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .u { color: #9CA3AF; font-size: 10px; }
  tfoot td { background: #F3F4F6; font-weight: 700; border-top: 2px solid #2563EB; }
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
</style></head><body>
<h1>Production Materials — Stock Report</h1>
<p class="meta">Printing Department · Generated ${new Date().toLocaleString()} · ${filtered.length} of ${materials.length} materials</p>
<table>
  <thead><tr><th>Material</th><th>Category</th><th>Moved In</th><th>Consumed</th><th>Remaining</th><th>Usage</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr>
    <td>Grand Total (${filtered.length} items)</td>
    <td></td>
    <td class="num">${filtered.reduce((s, m) => s + parseFloat(m.quantity_moved || 0), 0).toLocaleString()}</td>
    <td class="num">${filtered.reduce((s, m) => s + parseFloat(m.quantity_consumed || 0), 0).toLocaleString()}</td>
    <td class="num">${filtered.reduce((s, m) => s + parseFloat(m.quantity_remaining || 0), 0).toLocaleString()}</td>
    <td class="num">${overallRate}%</td>
  </tr></tfoot>
</table>
<script>setTimeout(() => { window.focus(); window.print(); }, 350);</script>
</body></html>`);
    win.document.close();
  };

  return (
    <div className={styles.page}>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Boxes size={26} className={styles.pageTitleIcon} /> Production Materials
          </h1>
          <p className={styles.pageSubtitle}>Printing Department — Live Stock</p>
        </div>
        <div className={styles.headerActions}>
          {criticalCount > 0 && (
            <span className={`${styles.badge} ${styles.badgeDanger} ${styles.criticalBadge}`}>
              <AlertTriangle size={14} /> {criticalCount} Critical
            </span>
          )}
          <button onClick={load} disabled={loading} className={styles.iconBtn} title="Refresh" aria-label="Refresh">
            {loading ? <SegmentedSpinner size={20} /> : <RefreshCw size={18} />}
          </button>
          <button
            onClick={handlePrint}
            disabled={filtered.length === 0}
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSweep}`}
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </header>

      {/* ── KPI CARDS ───────────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Materials in Production', value: materials.length, sub: 'Active materials', color: '#2563EB' },
          { label: 'Total Moved In', value: totalMoved.toLocaleString(), sub: 'Quantity moved in', color: '#0284C7' },
          { label: 'Total Consumed', value: totalConsumed.toLocaleString(), sub: 'Quantity consumed', color: '#D97706' },
          { label: 'Total Remaining', value: totalRemaining.toLocaleString(), sub: 'Quantity on hand', color: '#16A34A' },
        ].map(s => (
          <div key={s.label} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{s.label}</div>
            <div className={styles.kpiValue} style={{ color: s.color }}>{s.value}</div>
            <div className={styles.kpiSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
      <div className={styles.searchCard}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by name, ID or category..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.searchCount}>{filtered.length} / {materials.length} records</span>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSweep}`}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      {loading && materials.length === 0 ? (
        <div className={styles.loadingState}>
          <SegmentedSpinner size={56} label="Loading production stock..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={64} className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>
            {materials.length === 0 ? 'No Production Materials Found' : 'No Results Match Your Search'}
          </div>
          <p className={styles.emptyText}>
            {materials.length === 0
              ? 'Materials appear here automatically when the Printing Supervisor confirms receipt from the Store Materials page.'
              : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <div className={styles.tableInner}>
              <div className={styles.gridHead}>
                {['Material', 'Category', 'Moved In', 'Consumed', 'Remaining', 'Usage %', 'Action'].map((h, i) => (
                  <div key={h} className={`${styles.headCell} ${i >= 2 ? styles.headRight : ''}`}>{h}</div>
                ))}
              </div>

              {filtered.map(m => {
                const usage = pct(m);
                const remaining = parseFloat(m.quantity_remaining || 0);
                const reorder = parseFloat(m.reorder_level || 5);
                const isCrit = remaining <= reorder;
                const usageColor = usage > 90 ? '#DC2626' : usage > 65 ? '#D97706' : '#16A34A';
                const usageClass = usage > 90 ? styles.usageDanger : usage > 65 ? styles.usageWarn : styles.usageOk;

                return (
                  <div key={m.id} className={`${styles.gridRow} ${isCrit ? styles.gridRowCrit : ''}`}>
                    {/* Material */}
                    <div className={`${styles.cell} ${styles.cellStack}`}>
                      <div className={styles.matId}>{m.material_id}</div>
                      <div className={styles.matName}>{m.material_name}</div>
                      {m.unit && <div className={styles.matUnit}>Unit: {m.unit}</div>}
                      {m.moved_date && (
                        <div className={styles.matDate}>Last updated: {new Date(m.updated_at || m.moved_date).toLocaleDateString()}</div>
                      )}
                      {isCrit && (
                        <span className={`${styles.badge} ${styles.badgeDanger} ${styles.critBadge}`}>
                          <AlertTriangle size={12} /> Critical Low
                        </span>
                      )}
                    </div>

                    {/* Category */}
                    <div className={styles.cell}>
                      <span className={styles.catPill}>{m.category || '—'}</span>
                    </div>

                    {/* Moved */}
                    <div className={`${styles.cell} ${styles.cellRight}`}>
                      <div>
                        <div className={`${styles.val} ${styles.valMoved}`}>{parseFloat(m.quantity_moved).toLocaleString()}</div>
                        <div className={styles.valUnit}>{m.unit}</div>
                      </div>
                    </div>

                    {/* Consumed */}
                    <div className={`${styles.cell} ${styles.cellRight}`}>
                      <div>
                        <div className={`${styles.val} ${styles.valConsumed}`}>{parseFloat(m.quantity_consumed).toLocaleString()}</div>
                        <div className={styles.valUnit}>{m.unit}</div>
                      </div>
                    </div>

                    {/* Remaining */}
                    <div className={`${styles.cell} ${styles.cellRight}`}>
                      <div>
                        <div className={`${styles.val} ${isCrit ? styles.valRemainingCrit : styles.valRemaining}`}>{remaining.toLocaleString()}</div>
                        <div className={styles.valUnit}>{m.unit}</div>
                      </div>
                    </div>

                    {/* Usage */}
                    <div className={`${styles.cell} ${styles.cellUsage}`}>
                      <div className={`${styles.usagePct} ${usageClass}`}>{usage}%</div>
                      <div className={styles.usageBarTrack}>
                        <div className={styles.usageBarFill} style={{ width: `${Math.min(usage, 100)}%`, background: usageColor }} />
                      </div>
                    </div>

                    {/* Action */}
                    <div className={`${styles.cell} ${styles.cellAction}`}>
                      <button
                        onClick={() => setConsumeTarget(m)}
                        disabled={remaining <= 0}
                        className={`${styles.logBtn} ${styles.btnSweep}`}
                      >
                        {remaining <= 0 ? 'Depleted' : 'Log Use'}
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className={styles.gridTotal}>
                <div className={`${styles.cell} ${styles.totalLabel}`}>Grand Total ({filtered.length} items)</div>
                <div className={styles.cell} />
                <div className={`${styles.cell} ${styles.cellRight}`}>
                  <div className={`${styles.val} ${styles.valMoved}`}>{filtered.reduce((s, m) => s + parseFloat(m.quantity_moved || 0), 0).toLocaleString()}</div>
                </div>
                <div className={`${styles.cell} ${styles.cellRight}`}>
                  <div className={`${styles.val} ${styles.valConsumed}`}>{filtered.reduce((s, m) => s + parseFloat(m.quantity_consumed || 0), 0).toLocaleString()}</div>
                </div>
                <div className={`${styles.cell} ${styles.cellRight}`}>
                  <div className={`${styles.val} ${styles.valRemaining}`}>{filtered.reduce((s, m) => s + parseFloat(m.quantity_remaining || 0), 0).toLocaleString()}</div>
                </div>
                <div className={`${styles.cell} ${styles.cellUsage}`}>
                  <div className={`${styles.usagePct} ${overallRate > 90 ? styles.usageDanger : overallRate > 65 ? styles.usageWarn : styles.usageOk}`}>{overallRate}%</div>
                </div>
                <div className={styles.cell} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INFO PANEL ──────────────────────────────────────────────── */}
      {!loading && materials.length > 0 && (
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <Info size={18} /> How Materials Appear Here
            </div>
            <div className={styles.steps}>
              {[
                { step: '1', text: 'Supervisor requests material from the Store Materials page', color: '#2563EB' },
                { step: '2', text: 'CEO approves the request', color: '#1D4ED8' },
                { step: '3', text: 'General Store Keeper ships the material', color: '#0284C7' },
                { step: '4', text: 'Supervisor confirms receipt — material appears here automatically', color: '#16A34A' },
              ].map(s => (
                <div key={s.step} className={styles.stepRow}>
                  <div className={styles.stepNum} style={{ background: s.color }}>{s.step}</div>
                  <div className={styles.stepText}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <TrendingUp size={18} /> Summary Breakdown
            </div>
            <div className={styles.summaryList}>
              {[
                { label: 'Total Materials', val: materials.length, color: '#111827' },
                { label: 'Critical / Low Stock', val: criticalCount, color: criticalCount > 0 ? '#DC2626' : '#16A34A' },
                { label: 'Total Moved In', val: `${totalMoved.toLocaleString()} units`, color: '#0284C7' },
                { label: 'Total Consumed', val: `${totalConsumed.toLocaleString()} units`, color: '#D97706' },
                { label: 'Total Remaining', val: `${totalRemaining.toLocaleString()} units`, color: '#16A34A' },
                { label: 'Overall Usage Rate', val: `${totalMoved > 0 ? Math.round((totalConsumed / totalMoved) * 100) : 0}%`, color: '#6B7280' },
              ].map(r => (
                <div key={r.label} className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>{r.label}</span>
                  <span className={styles.summaryValue} style={{ color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────── */}
      {consumeTarget && (
        <ConsumeModal
          mat={consumeTarget}
          onClose={() => setConsumeTarget(null)}
          onDone={load}
          showToast={showToast}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default PrintingProdMaterials;
