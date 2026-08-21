import React, { useState, useEffect, useCallback } from 'react';
import { AlertOctagon, Database, ShieldAlert, Trash2, CheckCircle2, XCircle, Clock, Loader2, Lock, TriangleAlert, ChevronDown, Eraser } from 'lucide-react';
import adminService from '../../services/adminService';
import styles from './DangerZone.module.css';
import { playSound } from '../../services/notificationManager';

const STATUS_META = {
  PENDING:   { label: 'Pending CEO Approval', cls: 'stPending' },
  APPROVED:  { label: 'Approved',             cls: 'stApproved' },
  COMPLETED: { label: 'Executed',             cls: 'stCompleted' },
  REJECTED:  { label: 'Rejected',             cls: 'stRejected' },
  FAILED:    { label: 'Failed',               cls: 'stFailed' },
};

const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

const DangerZone = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showWipeable, setShowWipeable] = useState(false);
  const [clearingTable, setClearingTable] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await adminService.getDangerZoneOverview();
      setOverview(res?.data || null);
    } catch (err) {
      playSound('error'); setToast({ type: 'error', msg: err?.response?.data?.message || 'Failed to load danger zone data' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (confirmText !== 'RESET') {
      playSound('error'); setToast({ type: 'error', msg: 'You must type RESET to confirm this destructive action.' });
      return;
    }
    setSubmitting(true);
    try {
      await adminService.requestDangerZoneReset({ reason, confirmText });
      playSound('success'); setToast({ type: 'success', msg: 'Reset request submitted. Awaiting CEO approval.' });
      setReason('');
      setConfirmText('');
      await load();
    } catch (err) {
      playSound('error'); setToast({ type: 'error', msg: err?.response?.data?.message || 'Failed to submit reset request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const requests = overview?.recentRequests || [];
  const pending = overview?.pendingRequest;

  const handleClearTable = async (table) => {
    if (!window.confirm(`Clear ALL data inside table "${table}"?\n\nThe table itself will NOT be dropped — only its rows are deleted.`)) return;
    setClearingTable(table);
    try {
      const res = await adminService.clearDangerZoneTable(table);
      playSound('success'); setToast({ type: 'success', msg: res?.message || `Cleared "${table}".` });
      await load();
    } catch (err) {
      playSound('error'); setToast({ type: 'error', msg: err?.response?.data?.message || `Failed to clear "${table}".` });
    } finally {
      setClearingTable(null);
    }
  };

  return (
    <div className={styles.root}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>
            <AlertOctagon size={30} style={{ verticalAlign: '-5px', marginRight: 8 }} />
            Danger Zone
          </h1>
          <p className={styles.pageSubtitle}>
            Extreme caution required. This area allows a full reset of all inserted data in the {overview?.database || 'database'} database.
            Every reset requires explicit CEO approval before anything is deleted.
          </p>
        </div>
        <div className={styles.badge}>
          <Lock size={16} /> CEO APPROVAL REQUIRED
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}><Loader2 className={styles.spin} size={28} /> Loading danger zone…</div>
      ) : (
        <>
          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <Database size={24} className={styles.statIcon} />
              <span className={styles.statValue}>{overview.totalTables}</span>
              <span className={styles.statLabel}>Total Tables</span>
            </div>
            <div className={styles.statCard}>
              <Trash2 size={24} className={styles.statIcon} />
              <span className={styles.statValue}>{overview.wipeableTables}</span>
              <span className={styles.statLabel}>Tables (data cleared)</span>
            </div>
            <div className={styles.statCard}>
              <TriangleAlert size={24} className={styles.statIcon} />
              <span className={styles.statValue}>{overview.approxRowsToDelete?.toLocaleString?.() ?? overview.approxRowsToDelete}</span>
              <span className={styles.statLabel}>Approx. Rows to Delete</span>
            </div>
            <div className={styles.statCard}>
              <ShieldAlert size={24} className={styles.statIcon} />
              <span className={styles.statValue}>{overview.protectedTables?.length ?? 0}</span>
              <span className={styles.statLabel}>Protected System Tables</span>
            </div>
          </div>

          {/* Pending banner */}
          {pending ? (
            <div className={styles.pendingBanner}>
              <Clock size={22} />
              <div>
                <strong>A reset request is pending CEO approval.</strong>
                <p>Requested by <b>{pending.requested_by_name}</b> on {fmt(pending.created_at)}. New requests cannot be submitted until this one is decided.</p>
              </div>
            </div>
          ) : null}

          {/* Request form */}
          <form className={styles.card} onSubmit={handleRequest}>
            <div className={styles.cardTitleRow}>
              <Trash2 size={20} className={styles.redIcon} />
              <h2>Request Full Database Reset</h2>
            </div>
            <p className={styles.cardHint}>
              This will permanently delete all inserted/business data inside <b>{overview.wipeableTables} tables</b> (orders, sales, invoices, receipts,
              transactions, audit trails, messages, etc.). <b className={styles.neverDrop}>The tables themselves are NEVER dropped</b> — only the data inside them is
              removed. Protected system tables (users, roles, settings, VAT config, migrations) are never touched.
            </p>
            <label className={styles.fieldLabel}>Reason for reset <span className={styles.req}>*</span></label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the database must be reset (min 10 characters). The CEO will review this before approving."
            />
            <label className={styles.fieldLabel}>
              Type <b className={styles.typeWord}>RESET</b> to confirm <span className={styles.req}>*</span>
            </label>
            <input
              className={styles.input}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              autoComplete="off"
            />
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.dangerBtn}
                disabled={submitting || reason.trim().length < 10 || confirmText !== 'RESET' || !!pending}
              >
                {submitting ? <Loader2 className={styles.spin} size={18} /> : <Trash2 size={18} />}
                Submit Reset Request
              </button>
            </div>
          </form>

          {/* Recent requests */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <Clock size={20} className={styles.redIcon} />
              <h2>Reset Request History</h2>
            </div>
            {requests.length === 0 ? (
              <p className={styles.empty}>No reset requests have been made yet.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Requested By</th>
                      <th>Reason</th>
                      <th>Requested</th>
                      <th>Status</th>
                      <th>Executed</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => {
                      const sm = STATUS_META[r.status] || STATUS_META.PENDING;
                      return (
                        <tr key={r.id}>
                          <td>#{r.id}</td>
                          <td>{r.requested_by_name}</td>
                          <td className={styles.reasonCell}>{r.reason}</td>
                          <td>{fmt(r.created_at)}</td>
                          <td><span className={`${styles.statusPill} ${styles[sm.cls]}`}>{sm.label}</span></td>
                          <td>{fmt(r.executed_at)}</td>
                          <td className={styles.resultCell}>
                            {r.status === 'COMPLETED' ? (
                              <span className={styles.resultOk}>
                                <CheckCircle2 size={14} /> {r.completion_summary?.rowsDeleted ?? 0} rows deleted · {r.completion_summary?.tablesCleared ?? 0} tables emptied · all {r.completion_summary?.tablesStillExist ?? '?'} tables kept
                              </span>
                            ) : r.status === 'FAILED' ? (
                              <span className={styles.resultErr}><XCircle size={14} /> {r.completion_summary?.error || 'failed'}</span>
                            ) : r.status === 'REJECTED' ? (
                              <span className={styles.resultErr}>{r.rejected_reason || 'Rejected'}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Protected tables */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <ShieldAlert size={20} className={styles.greenIcon} />
              <h2>Protected System Tables — {overview.protectedTables?.length ?? 0} (never touched)</h2>
            </div>
            <p className={styles.protectNote}>
              Auth, security, settings, lookups, catalogs, registries, runtime and the danger-zone ledger.
              Only their data is kept — the rest of the database is cleared.
            </p>
            <div className={styles.tableCols}>
              {(overview.protectedTables || []).map((t, i) => (
                <div key={t} className={styles.colItem}>
                  <span className={`${styles.colNum} ${styles.colNumGreen}`}>{i + 1}</span>
                  <span className={styles.colName}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tables whose DATA will be cleared */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <Trash2 size={20} className={styles.redIcon} />
              <h2>Tables to be Emptied — {overview.wipeableTables ?? 0} (data only)</h2>
            </div>
            <p className={styles.wipeNote}>
              The data inside these tables is deleted. The tables themselves remain with their structure intact.
              Hover a row and click the eraser icon to clear just that single table's data.
            </p>
            <button
              className={styles.toggleBtn}
              onClick={() => setShowWipeable((v) => !v)}
            >
              <ChevronDown size={16} style={{ transform: showWipeable ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              {showWipeable ? 'Hide list' : 'Show list of tables to be emptied'}
            </button>
            {showWipeable && (
              <div className={styles.tableCols}>
                {(overview.wipeableTablesList || []).map((t, i) => (
                  <div key={t} className={styles.colItem}>
                    <span className={`${styles.colNum} ${styles.colNumRed}`}>{i + 1}</span>
                    <span className={styles.colNameWipe}>{t}</span>
                    <button
                      className={styles.clearBtn}
                      title={`Clear all data inside "${t}" (table is kept)`}
                      disabled={clearingTable === t}
                      onClick={() => handleClearTable(t)}
                    >
                      {clearingTable === t ? <Loader2 className={styles.spin} size={13} /> : <Eraser size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DangerZone;