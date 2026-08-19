import React, { useState, useEffect, useCallback } from 'react';
import { AlertOctagon, CheckCircle2, XCircle, Clock, Loader2, ShieldAlert, Trash2, Lock } from 'lucide-react';
import ceoService from '../../services/ceoService';
import styles from './CEODangerZone.module.css';

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

const CEODangerZone = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await ceoService.getDangerZoneRequests();
      setRequests(res?.data || []);
    } catch (err) {
      setToast({ type: 'error', msg: err?.response?.data?.message || 'Failed to load danger zone requests' });
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

  const handleApprove = async (req) => {
    if (!window.confirm(`Approve and execute the full database reset requested by ${req.requested_by_name}?\n\nReason: ${req.reason}\n\nALL inserted/business data will be permanently deleted.`)) return;
    setActingId(req.id);
    try {
      const res = await ceoService.approveDangerZoneReset(req.id);
      setToast({ type: 'success', msg: res?.message || 'Reset approved and executed.' });
      await load();
    } catch (err) {
      setToast({ type: 'error', msg: err?.response?.data?.message || 'Failed to approve reset.' });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (req) => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setToast({ type: 'error', msg: 'Please enter a rejection reason (min 5 characters).' });
      return;
    }
    setActingId(req.id);
    try {
      const res = await ceoService.rejectDangerZoneReset(req.id, rejectReason);
      setToast({ type: 'success', msg: res?.message || 'Reset request rejected.' });
      setRejectingId(null);
      setRejectReason('');
      await load();
    } catch (err) {
      setToast({ type: 'error', msg: err?.response?.data?.message || 'Failed to reject reset.' });
    } finally {
      setActingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === 'PENDING');

  return (
    <div className={styles.root}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>
            <AlertOctagon size={30} style={{ verticalAlign: '-5px', marginRight: 8 }} />
            Danger Zone Approvals
          </h1>
          <p className={styles.pageSubtitle}>
            As CEO you hold the final authority over database resets. Review each request carefully —
            approving it will permanently delete all inserted/business data across the entire database.
          </p>
        </div>
        <div className={styles.badge}><ShieldAlert size={16} /> CEO AUTHORITY</div>
      </div>

      <div className={styles.pendingSummary}>
        <Clock size={20} />
        <span>
          <b>{pending.length}</b> reset request{pending.length === 1 ? '' : 's'} awaiting your decision
        </span>
      </div>

      {loading ? (
        <div className={styles.loading}><Loader2 className={styles.spin} size={28} /> Loading requests…</div>
      ) : requests.length === 0 ? (
        <div className={styles.empty}>
          <CheckCircle2 size={40} style={{ color: '#16A34A', marginBottom: 8 }} />
          <p>No database reset requests have been submitted.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {requests.map((req) => {
            const sm = STATUS_META[req.status] || STATUS_META.PENDING;
            const isPending = req.status === 'PENDING';
            const isActing = actingId === req.id;
            return (
              <div key={req.id} className={`${styles.requestCard} ${isPending ? styles.requestCardPending : ''}`}>
                <div className={styles.reqHeader}>
                  <div className={styles.reqIcon}><Trash2 size={20} /></div>
                  <div className={styles.reqInfo}>
                    <div className={styles.reqTitle}>
                      #{req.id} — Full Database Reset
                      <span className={`${styles.statusPill} ${styles[sm.cls]}`}>{sm.label}</span>
                    </div>
                    <div className={styles.reqMeta}>
                      Requested by <b>{req.requested_by_name}</b> on {fmt(req.created_at)}
                      {req.approved_by_name ? ` · decided by ${req.approved_by_name} on ${fmt(req.approved_at)}` : ''}
                    </div>
                  </div>
                </div>
                <div className={styles.reqReason}><strong>Reason:</strong> {req.reason}</div>

                {req.status === 'REJECTED' && req.rejected_reason && (
                  <div className={styles.rejectBox}><strong>Rejection reason:</strong> {req.rejected_reason}</div>
                )}
                {req.status === 'COMPLETED' && req.completion_summary && (
                  <div className={styles.resultBox}>
                    <CheckCircle2 size={16} />
                    Executed — {req.completion_summary.rowsDeleted ?? 0} rows removed from {req.completion_summary.tablesCleared ?? 0} tables on {fmt(req.executed_at)} · all {req.completion_summary.tablesStillExist ?? '?'} tables kept (structure unchanged)
                  </div>
                )}
                {req.status === 'FAILED' && (
                  <div className={styles.failBox}>
                    <XCircle size={16} /> Execution failed: {req.completion_summary?.error || 'unknown error'}
                  </div>
                )}

                {isPending && (
                  <div className={styles.actions}>
                    <div className={styles.approveActions}>
                      <button
                        className={styles.approveBtn}
                        disabled={isActing}
                        onClick={() => handleApprove(req)}
                      >
                        {isActing ? <Loader2 className={styles.spin} size={16} /> : <CheckCircle2 size={16} />}
                        Approve &amp; Execute Reset
                      </button>
                      <button
                        className={styles.rejectBtn}
                        disabled={isActing}
                        onClick={() => setRejectingId(rejectingId === req.id ? null : req.id)}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                    {rejectingId === req.id && (
                      <div className={styles.rejectForm}>
                        <input
                          className={styles.input}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason (min 5 characters)"
                        />
                        <button
                          className={styles.confirmRejectBtn}
                          disabled={isActing || rejectReason.trim().length < 5}
                          onClick={() => handleReject(req)}
                        >
                          {isActing ? <Loader2 className={styles.spin} size={16} /> : <XCircle size={16} />}
                          Confirm Rejection
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.notice}>
        <Lock size={16} />
        Only data inside transactional tables is removed on approval — <b>no table is ever dropped</b>. All system-necessary tables (users, roles, settings, security, lookups, catalogs, registries, VAT config, migrations) are protected and never touched.
      </div>
    </div>
  );
};

export default CEODangerZone;