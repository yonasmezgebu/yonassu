import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertOctagon, Database, ShieldAlert, Trash2, CheckCircle2, XCircle, Clock, Loader2, Lock, TriangleAlert, ChevronDown, ChevronRight, Eraser, AlertTriangle, X, Search, Layers, HardDrive, Filter } from 'lucide-react';
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
  const [showWipeable, setShowWipeable] = useState(true);
  const [clearingTable, setClearingTable] = useState(null);
  const [search, setSearch] = useState('');
  const [showProtected, setShowProtected] = useState(false);
  // module -> expanded state
  const [expanded, setExpanded] = useState({});
  const [collapsedZero, setCollapsedZero] = useState(true);

  const toggleModule = (mod) => setExpanded((s) => ({ ...s, [mod]: !s[mod] }));

  const wipeableGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (overview?.wipeableByModule || [])
      .map((g) => {
        const tables = g.tables.filter((t) => {
          const n = (typeof t === 'string' ? t : t.name).toLowerCase();
          return !q || n.includes(q);
        });
        return { ...g, tables };
      })
      .filter((g) => g.tables.length > 0);
  }, [overview, search]);

  const wipeableTotalRows = useMemo(
    () => (overview?.wipeableByModule || []).reduce((s, g) =>
      s + g.tables.reduce((a, t) => a + ((typeof t === 'object' && t.approxRows) || 0), 0), 0),
    [overview]
  );

  // Confirm modal: store table name waiting for confirmation
  const [confirmTable, setConfirmTable] = useState(null);

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

  /** Called when user clicks the erase button on a table row */
  const handleClearTable = (table) => {
    setConfirmTable(table); // show modal
  };

  /** Called when user confirms deletion in the modal */
  const handleConfirmDelete = async () => {
    const table = confirmTable;
    setConfirmTable(null);
    if (!table) return;
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

      {/* ── In-app delete confirmation modal ─────────────── */}
      {confirmTable && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <div className={styles.confirmIconRow}>
              <AlertTriangle size={36} className={styles.confirmIcon} />
            </div>
            <h3 className={styles.confirmTitle}>Clear Table Data?</h3>
            <p className={styles.confirmMsg}>
              You are about to permanently delete <strong>ALL rows</strong> inside&nbsp;
              <code className={styles.confirmTable}>{confirmTable}</code>.
            </p>
            <p className={styles.confirmNote}>
              The table structure is <strong>kept intact</strong> — only the data will be erased. This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={() => setConfirmTable(null)}
              >
                <X size={15} /> Cancel
              </button>
              <button
                className={styles.confirmDelete}
                onClick={handleConfirmDelete}
              >
                <Eraser size={15} /> Yes, Clear Table
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* 🔍 MONITOR & DELETE — Can Delete Data */}
          <div className={styles.canDeleteCard}>
            <div className={styles.canDeleteHead}>
              <div className={styles.canDeleteTitleRow}>
                <Trash2 size={20} className={styles.redIcon} />
                <h2>Can Delete Data</h2>
                <span className={styles.canDeleteCount}>{overview.wipeableTables ?? 0} tables</span>
                <span className={styles.canDeleteRows}>~{wipeableTotalRows.toLocaleString()} rows</span>
              </div>
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Search tables… (e.g. pos, sales, crv)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className={styles.searchClear} onClick={() => setSearch('')} title="Clear search"><X size={14} /></button>
                )}
              </div>
            </div>

            <p className={styles.wipeNote}>
              Data inside these tables can be deleted (structure is kept). Search to filter, then click <b>Delete Data</b> on any row.
              Modules with <b>0 rows</b> are collapsed automatically to keep the list scannable.
            </p>

            <div className={styles.wipeToolbar}>
              <button
                className={`${styles.toggleBtn} ${search ? styles.toggleBtnActive : ''}`}
                onClick={() => { setShowWipeable((v) => !v); }}
              >
                {showWipeable ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {showWipeable ? 'Collapse all' : 'Expand all'}
              </button>
              <button
                className={`${styles.toggleBtn} ${collapsedZero ? styles.toggleBtnActive : ''}`}
                onClick={() => setCollapsedZero((v) => !v)}
              >
                <Filter size={15} />
                {collapsedZero ? 'Auto-collapse empty (0 rows) — ON' : 'Auto-collapse empty (0 rows) — OFF'}
              </button>
            </div>

            {showWipeable && (
              <div className={styles.moduleList}>
                {wipeableGroups.length === 0 ? (
                  <p className={styles.empty}>No tables match your search.</p>
                ) : (
                  wipeableGroups.map((group) => {
                    const moduleRows = group.tables.reduce((a, t) => a + ((typeof t === 'object' && t.approxRows) || 0), 0);
                    const defaultExpanded = search ? true : !(collapsedZero && moduleRows === 0);
                    const isOpen = expanded[group.module] ?? defaultExpanded;
                    return (
                      <div key={group.module} className={styles.moduleGroup}>
                        <button className={styles.moduleHeader} onClick={() => toggleModule(group.module)}>
                          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          <span className={styles.moduleName}>{group.module}</span>
                          <span className={styles.moduleSub}>
                            <Layers size={13} /> {group.tables.length}
                            <HardDrive size={13} style={{ marginLeft: 8 }} /> ~{moduleRows.toLocaleString()} rows
                          </span>
                          <span className={`${styles.moduleCount} ${moduleRows === 0 ? styles.moduleCountZero : ''}`}>{moduleRows === 0 ? '0 rows' : `${group.tables.length} tables`}</span>
                        </button>
                        {isOpen && (
                          <div className={styles.tableCols}>
                            {group.tables.map((entry, i) => {
                              const tName = typeof entry === 'string' ? entry : entry.name;
                              const tRows = typeof entry === 'object' ? entry.approxRows : 0;
                              return (
                                <div key={tName} className={styles.colItem}>
                                  <span className={`${styles.colNum} ${styles.colNumRed}`}>{i + 1}</span>
                                  <div className={styles.colNameWrap}>
                                    <span className={styles.colNameWipe}>{tName}</span>
                                    <span className={`${styles.rowPill} ${tRows === 0 ? styles.rowPillZero : ''}`}>
                                      {tRows > 0 ? `~${tRows.toLocaleString()} rows` : '0 rows'}
                                    </span>
                                  </div>
                                  <button
                                    className={styles.clearBtn}
                                    title={`Delete all data inside "${tName}" (table structure is kept)`}
                                    disabled={!!clearingTable}
                                    onClick={() => handleClearTable(tName)}
                                  >
                                    {clearingTable === tName
                                      ? <><Loader2 className={styles.spin} size={13} /> Deleting…</>
                                      : <><Eraser size={13} /> Delete Data</>}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

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

          {/* Protected tables — cannot be deleted */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <ShieldAlert size={20} className={styles.greenIcon} />
              <h2>Cannot Delete Data — {overview.protectedTables?.length ?? 0} protected tables</h2>
            </div>
            <p className={styles.protectNote}>
              Auth, security, settings, lookups, catalogs, registries, runtime and the danger-zone ledger.
              Their data is never touched. Grouped by module, alphabetically within each module.
            </p>
            <button
              className={styles.toggleBtn}
              onClick={() => setShowProtected((v) => !v)}
            >
              {showProtected ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {showProtected ? 'Collapse protected tables' : 'Expand protected tables'}
            </button>
            {showProtected &&
              (overview.protectedByModule || []).map((group) => (
                <div key={group.module} className={styles.moduleGroup}>
                  <h3 className={styles.moduleHeader}>
                    {group.module}
                    <span className={styles.moduleCount}>{group.tables.length}</span>
                  </h3>
                  <div className={styles.tableCols}>
                    {group.tables.map((t, i) => (
                      <div key={t} className={styles.colItem}>
                        <span className={`${styles.colNum} ${styles.colNumGreen}`}>{i + 1}</span>
                        <span className={styles.colName}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DangerZone;