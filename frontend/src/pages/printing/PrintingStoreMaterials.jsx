import React, { useState, useEffect, useCallback, Fragment } from 'react';
import axios from 'axios';
import {
  Boxes,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle,
  Package,
  Clock,
  ShoppingCart,
  Send,
  PackageCheck,
  Ban,
  Printer,
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './PrintingStoreMaterials.module.css';

/* ─── API ─────────────────────────────────────────────────────────────────── */
const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─── Status → semantic badge ─────────────────────────────────────────────── */
const STATUS_BADGE = {
  PENDING:          'badgeWarning',
  APPROVED:         'badgeInfo',
  REJECTED:         'badgeDanger',
  SHIPPED:          'badgeInfo',
  COMPLETED:        'badgeSuccess',
  DISCREPANCY:      'badgeDanger',
  WAITING_PURCHASE: 'badgeWarning',
  CANCELLED:        'badgeNeutral',
};
const STATUS_LABEL = {
  PENDING:          'Waiting Approval',
  APPROVED:         'CEO Approved',
  REJECTED:         'Rejected',
  SHIPPED:          'Shipped · Receive Now',
  COMPLETED:        'Completed',
  DISCREPANCY:      'Discrepancy',
  WAITING_PURCHASE: 'Waiting Purchase',
  CANCELLED:        'Cancelled',
};

const StatusBadge = ({ status }) => (
  <span className={`${styles.badge} ${styles[STATUS_BADGE[status] || 'badgeNeutral']}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

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

/* ── Request Modal ────────────────────────────────────────────────────────── */
const RequestModal = ({ mat, onClose, onSubmit, showToast }) => {
  const [qty, setQty] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const storeQty = parseFloat(mat.quantity_in_store || 0);
  const requested = parseFloat(qty) || 0;
  const willWait = requested > storeQty;

  const submit = async () => {
    if (!qty || parseFloat(qty) <= 0) return showToast('error', 'Enter a valid quantity');
    setBusy(true);
    try {
      await api.post(`${BASE}/material-requests`, {
        material_id: mat.material_id, quantity_requested: parseFloat(qty), urgency, notes
      });
      showToast('success', 'Request submitted successfully!');
      onSubmit();
      onClose();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusy(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Request Material</h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className={styles.modalBody}>
          <div>
            <div className={styles.modalMeta}>{mat.material_id}</div>
            <div className={styles.modalName}>{mat.material_name}</div>
          </div>

          <div className={styles.modalStatGrid}>
            <div className={styles.modalStat}>
              <div className={styles.modalStatLabel}>Available Store Stock</div>
              <div className={styles.modalStatValue} style={{ color: storeQty > 0 ? '#16A34A' : '#DC2626' }}>
                {storeQty.toLocaleString()} <span className={styles.modalStatUnit}>{mat.unit}</span>
              </div>
            </div>
            <div className={styles.modalStat}>
              <div className={styles.modalStatLabel}>Reorder Level</div>
              <div className={styles.modalStatValue}>{mat.reorder_level || 0}</div>
            </div>
          </div>

          {willWait && (
            <div className={styles.warningNote}>
              <AlertTriangle size={18} className={styles.warningNoteIcon} />
              <span>Stock insufficient. Request will go to WAITING PURCHASE and notify procurement.</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="req-qty">Quantity to Request ({mat.unit})</label>
            <input
              id="req-qty"
              type="number" min="0.01" step="0.01" value={qty}
              onChange={e => setQty(e.target.value)}
              className={styles.formInput}
              placeholder="0"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="req-urgency">Urgency</label>
            <select
              id="req-urgency"
              value={urgency}
              onChange={e => setUrgency(e.target.value)}
              className={`${styles.formInput} ${styles.formSelect}`}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High (Urgent)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="req-notes">Notes (Optional)</label>
            <textarea
              id="req-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className={`${styles.formInput} ${styles.formTextarea}`}
              placeholder="Job reference, purpose..."
            />
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg} ${styles.submitBtn} ${styles.btnSweep}`}
          >
            {busy
              ? <><SegmentedSpinner size={16} /> Submitting...</>
              : willWait
                ? <><ShoppingCart size={18} /> Request (Requires Purchase)</>
                : <><Send size={18} /> Send to CEO for Approval</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Receive Modal ────────────────────────────────────────────────────────── */
const ReceiveModal = ({ request, onClose, onDone, showToast }) => {
  const [qty, setQty] = useState(String(request.quantity_shipped || ''));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`${BASE}/material-requests/${request.id}/receive`, { received_qty: parseFloat(qty) });
      showToast('success', 'Receipt confirmed!');
      onDone();
      onClose();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusy(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Confirm Receipt</h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className={styles.modalBody}>
          <div>
            <div className={styles.modalMeta}>{request.request_code}</div>
            <div className={styles.modalName}>{request.material_name}</div>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoBoxLabel}>Quantity Shipped by Store</div>
            <div className={styles.infoBoxValue} style={{ color: '#0284C7' }}>
              {request.quantity_shipped} <span className={styles.modalStatUnit}>{request.unit}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="recv-qty">Quantity Actually Received</label>
            <input
              id="recv-qty"
              type="number" min="0" step="0.01" value={qty}
              onChange={e => setQty(e.target.value)}
              className={styles.formInput}
            />
            {parseFloat(qty) !== parseFloat(request.quantity_shipped) && qty && (
              <div className={styles.warningNote}>
                <AlertTriangle size={16} className={styles.warningNoteIcon} />
                <span>Mismatch: A discrepancy will be flagged for CEO review.</span>
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg} ${styles.submitBtn} ${styles.btnSweep}`}
          >
            {busy ? <><SegmentedSpinner size={16} /> Confirming...</> : <><PackageCheck size={18} /> Confirm Receipt Now</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────────────── */
const PrintingStoreMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState(null);
  const [receiveModal, setReceiveModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([
        api.get(`${BASE}/store/materials?department=Printing`),
        api.get(`${BASE}/material-requests`).catch(() => ({ data: { data: [] } }))
      ]);
      setMaterials(mRes.data.data || []);
      setRequests(rRes.data.data || []);
    } catch { setMaterials([]); setRequests([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const activeReqMap = {};
  requests.forEach(r => {
    if (!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(r.status)) {
      activeReqMap[r.material_id] = r;
    }
  });

  const pending = requests.filter(r => r.status === 'PENDING').length;
  const shipped = requests.filter(r => r.status === 'SHIPPED').length;
  const waiting = requests.filter(r => r.status === 'WAITING_PURCHASE').length;

  const totalStockQty = materials.reduce((s, m) => s + parseFloat(m.quantity_in_store || 0), 0);
  const totalStockValue = materials.reduce((s, m) => s + (parseFloat(m.quantity_in_store || 0) * parseFloat(m.unit_value || 0)), 0);
  const fmtMoney = (v) => `ETB ${Math.round(v).toLocaleString()}`;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const handlePrint = () => {
    const rows = materials.map(m => {
      const storeQty = parseFloat(m.quantity_in_store || 0);
      const low = storeQty <= parseFloat(m.reorder_level || 0);
      const activeReq = activeReqMap[m.material_id];
      return `<tr>
        <td><strong>${esc(m.material_id)}</strong><br/><span style="color:#6B7280;font-size:11px">${esc(m.material_name)}</span></td>
        <td><span class="chip">${esc(m.category || '—')}</span></td>
        <td class="num">${storeQty.toLocaleString()} <span class="u">${esc(m.unit || '')}</span>${low ? ' <span class="flag">Low</span>' : ''}</td>
        <td class="num">ETB ${parseFloat(m.unit_value || 0).toLocaleString()}</td>
        <td>${activeReq ? esc(STATUS_LABEL[activeReq.status] || activeReq.status) : '—'}</td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) { showToast('warning', 'Popup blocked — allow popups for this site to print'); return; }

    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/>
<title>Store Materials — Stock Report</title>
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
  .flag { display: inline-block; background: #FEF3C7; color: #B45309; padding: 1px 7px; border-radius: 999px; font-size: 9px; font-weight: 600; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .u { color: #9CA3AF; font-size: 10px; }
  tfoot td { background: #F3F4F6; font-weight: 700; border-top: 2px solid #2563EB; }
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
</style></head><body>
<h1>Store Materials — Stock Report</h1>
<p class="meta">Printing Department Hub · Generated ${new Date().toLocaleString()} · ${materials.length} materials</p>
<table>
  <thead><tr><th>Material</th><th>Category</th><th>Store Stock</th><th>Unit Value</th><th>Active Request</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr>
    <td>Grand Total (${materials.length} items)</td>
    <td></td>
    <td class="num">${totalStockQty.toLocaleString()}</td>
    <td class="num">${fmtMoney(totalStockValue)}</td>
    <td></td>
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
            <Boxes size={26} className={styles.pageTitleIcon} /> Store Materials
          </h1>
          <p className={styles.pageSubtitle}>Printing Department Hub</p>
        </div>
        <div className={styles.headerActions}>
          {pending > 0 && (
            <span className={`${styles.badge} ${styles.badgeWarning} ${styles.headerBadge}`}>
              <Clock size={14} /> {pending} Pending
            </span>
          )}
          {shipped > 0 && (
            <span className={`${styles.badge} ${styles.badgeInfo} ${styles.headerBadge}`}>
              <Package size={14} /> {shipped} Shipped
            </span>
          )}
          {waiting > 0 && (
            <span className={`${styles.badge} ${styles.badgeNeutral} ${styles.headerBadge}`}>
              <ShoppingCart size={14} /> {waiting} Waiting
            </span>
          )}
          <button onClick={load} disabled={loading} className={styles.iconBtn} title="Refresh" aria-label="Refresh">
            {loading ? <SegmentedSpinner size={20} /> : <RefreshCw size={18} />}
          </button>
          <button
            onClick={handlePrint}
            disabled={materials.length === 0}
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSweep}`}
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </header>

      {/* ── WORKFLOW STRIP ──────────────────────────────────────────── */}
      <div className={styles.workflowCard}>
        <span className={styles.workflowTitle}>Workflow</span>
        <div className={styles.workflowSteps}>
          {[
            'Request',
            'CEO Approve',
            'Store Ships',
            'You Receive',
            'Stock Updated',
          ].map((label, i) => (
            <Fragment key={label}>
              {i > 0 && <span className={styles.workflowArrow}>→</span>}
              <span className={styles.workflowStep}>{label}</span>
            </Fragment>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      {loading && materials.length === 0 ? (
        <div className={styles.loadingState}>
          <SegmentedSpinner size={56} label="Loading printing store materials..." />
        </div>
      ) : materials.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={64} className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>No Materials Assigned to Printing</div>
          <p className={styles.emptyText}>
            Materials appear here once the General Store assigns stock to the Printing department.
          </p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Material ID / Name</th>
                  <th>Category</th>
                  <th className={styles.thRight}>Store Stock</th>
                  <th className={styles.thRight}>Unit Value</th>
                  <th>Active Request Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => {
                  const activeReq = activeReqMap[m.material_id];
                  const low = parseFloat(m.quantity_in_store) <= parseFloat(m.reorder_level || 0);
                  const storeQty = parseFloat(m.quantity_in_store || 0);

                  const canRequest = !activeReq;
                  const canReceive = activeReq && activeReq.status === 'SHIPPED';

                  return (
                    <tr key={m.id} style={activeReq ? { background: 'rgba(37,99,235,0.03)' } : undefined}>
                      {/* Material ID & Name */}
                      <td>
                        <div className={styles.matId}>{m.material_id}</div>
                        <div className={styles.matName}>{m.material_name}</div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={styles.catPill}>{m.category}</span>
                      </td>

                      {/* Store Stock */}
                      <td className={styles.tdRight}>
                        <div className={`${styles.val} ${low ? styles.valCrit : ''}`}>
                          {storeQty.toLocaleString()} <span className={styles.valUnit}>{m.unit}</span>
                        </div>
                        {low && (
                          <div className={styles.lowTag}>
                            <AlertTriangle size={12} /> Low (Min {m.reorder_level})
                          </div>
                        )}
                      </td>

                      {/* Unit Value */}
                      <td className={styles.tdRight}>
                        <div className={styles.money}>
                          ETB {parseFloat(m.unit_value || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Active Request Status */}
                      <td>
                        {activeReq ? (
                          <div>
                            <StatusBadge status={activeReq.status} />
                            <div className={styles.reqMeta}>Ref: <b>{activeReq.request_code}</b></div>
                            <div className={styles.reqDetail}>
                              Req: {activeReq.quantity_requested} {activeReq.unit}
                              {activeReq.quantity_shipped && ` | Ship: ${activeReq.quantity_shipped} ${activeReq.unit}`}
                            </div>
                            {activeReq.rejection_reason && !activeReq.status.includes('DISC') && (
                              <div className={styles.rejNote}>
                                <AlertTriangle size={12} /> {activeReq.rejection_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={styles.noneText}>—</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.rowActions}>
                          {canRequest && (
                            <button
                              onClick={() => setRequestModal(m)}
                              className={`${styles.actionBtn} ${storeQty > 0 ? styles.actPrimary : styles.actNeutral} ${styles.btnSweep}`}
                            >
                              {storeQty > 0
                                ? <><Send size={14} /> Request Material</>
                                : <><ShoppingCart size={14} /> Request (Purchase)</>}
                            </button>
                          )}
                          {canReceive && (
                            <button
                              onClick={() => setReceiveModal(activeReq)}
                              className={`${styles.actionBtn} ${styles.actInfo} ${styles.btnSweep}`}
                            >
                              <PackageCheck size={14} /> Confirm Receipt
                            </button>
                          )}
                          {activeReq && ['PENDING', 'WAITING_PURCHASE'].includes(activeReq.status) && (
                            <button
                              onClick={async () => {
                                if (!window.confirm('Cancel this request?')) return;
                                try {
                                  await api.post(`${BASE}/material-requests/${activeReq.id}/cancel`);
                                  showToast('success', 'Request cancelled.');
                                  load();
                                } catch (e) { showToast('error', e.response?.data?.message || e.message); }
                              }}
                              className={`${styles.actionBtn} ${styles.actDanger} ${styles.btnSweep}`}
                            >
                              <Ban size={14} /> Cancel Request
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <span className={styles.footerStat}>
              <span className={styles.footerLabel}>Grand Total</span>
              <span className={styles.footerValue}>{materials.length} items</span>
            </span>
            <span className={styles.footerStat}>
              <span className={styles.footerLabel}>Total Store Stock</span>
              <span className={styles.footerValue}>{totalStockQty.toLocaleString()}</span>
            </span>
            <span className={styles.footerStat}>
              <span className={styles.footerLabel}>Total Value</span>
              <span className={`${styles.footerValue} ${styles.footerValueMoney}`}>{fmtMoney(totalStockValue)}</span>
            </span>
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────── */}
      {requestModal && <RequestModal mat={requestModal} onClose={() => setRequestModal(null)} onSubmit={load} showToast={showToast} />}
      {receiveModal && <ReceiveModal request={receiveModal} onClose={() => setReceiveModal(null)} onDone={load} showToast={showToast} />}

      <Toast toast={toast} />
    </div>
  );
};

export default PrintingStoreMaterials;
