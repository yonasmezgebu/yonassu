import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import auditService from '../../services/auditService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import {
  ShieldCheck, Search, RefreshCcw, Package, ArrowUpCircle,
  ArrowDownCircle, Settings, ChevronDown, ChevronUp, Clock,
  Wifi, AlertTriangle, CheckCircle2, Trash2, Printer,
  Calendar, Filter, X
} from 'lucide-react';
import styles from './PharmacyStoreAuditLog.module.css';

/* ─────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────── */
const MODULE = 'Pharmacy Store';
const IGNORE_KEYS = new Set(['id', 'created_at', 'updated_at', 'password',
  'password_hash', 'deleted_at']);

/* Time-period presets */
const TIME_PERIODS = [
  { key: 'all',     label: 'All Time' },
  { key: 'day',     label: 'Today' },
  { key: 'week',    label: 'This Week' },
  { key: 'month',   label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year',    label: 'This Year' },
];

/* Activity type filter pills */
const ACTIVITY_TYPES = [
  { key: '',                label: 'All Activity',   tone: 'neutral' },
  { key: 'STORE_GOODS_RECEIVED',   label: 'Goods Received', tone: 'success' },
  { key: 'STORE_NEW_ITEM',         label: 'New Stock',      tone: 'success' },
  { key: 'STORE_ISSUE',            label: 'Goods Issued',   tone: 'warning' },
  { key: 'STORE_MOVEMENT_TRANSFER',label: 'Transfers',      tone: 'info' },
  { key: 'STORE_ADJUSTMENT',       label: 'Adjustments',    tone: 'info' },
  { key: 'DELETE',                 label: 'Deletions',      tone: 'danger' },
];

/* ─────────────────────────────────────────────────
   HELPER: compute date range from period key
───────────────────────────────────────────────── */
const getDateRange = (period) => {
  if (period === 'all') return { dateFrom: null, dateTo: null };
  const now  = new Date();
  const from = new Date();
  if (period === 'day') {
    from.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = from.getDay();                 // 0=Sun
    from.setDate(from.getDate() - (day === 0 ? 6 : day - 1));
    from.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    from.setDate(1); from.setHours(0, 0, 0, 0);
  } else if (period === 'quarter') {
    const q = Math.floor(from.getMonth() / 3);
    from.setMonth(q * 3, 1); from.setHours(0, 0, 0, 0);
  } else if (period === 'year') {
    from.setMonth(0, 1); from.setHours(0, 0, 0, 0);
  }
  return {
    dateFrom: from.toISOString().split('T')[0],
    dateTo:   now.toISOString().split('T')[0],
  };
};

/* ─────────────────────────────────────────────────
   HELPER: action metadata
───────────────────────────────────────────────── */
const actionMeta = (action = '') => {
  const u = action.toUpperCase();
  if (u.includes('STORE_GOODS_RECEIVED') || u.includes('RECEIVED'))
    return { tone: 'success', icon: <ArrowDownCircle size={14} />, label: 'IN' };
  if (u.includes('STORE_NEW_ITEM') || u.includes('REGISTERED') || u.includes('CREATE'))
    return { tone: 'success', icon: <ArrowDownCircle size={14} />, label: 'NEW' };
  if (u.includes('DELETE') || u.includes('VOID') || u.includes('REJECT'))
    return { tone: 'danger',  icon: <Trash2 size={14} />,          label: 'DEL' };
  if (u.includes('STORE_ISSUE') || u.includes('SHIPPED'))
    return { tone: 'warning', icon: <ArrowUpCircle size={14} />,   label: 'OUT' };
  if (u.includes('ADJUST') || u.includes('TRANSFER') || u.includes('MOVEMENT') || u.includes('UPDATE'))
    return { tone: 'info',    icon: <Settings size={14} />,        label: 'ADJ' };
  if (u.includes('APPROVE'))
    return { tone: 'success', icon: <CheckCircle2 size={14} />,    label: 'APV' };
  return { tone: 'neutral',   icon: <Package size={14} />,         label: 'LOG' };
};

const formatDate = (iso) => {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  if (isNaN(d)) return { date: '—', time: '' };
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
};

const humanizeKey = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ─────────────────────────────────────────────────
   PARSE snapshot value
───────────────────────────────────────────────── */
const parseSnap = (val) => {
  if (!val) return null;
  try {
    const p = typeof val === 'string' ? JSON.parse(val) : val;
    return typeof p === 'object' && p !== null && !Array.isArray(p) ? p : null;
  } catch { return null; }
};

/* ─────────────────────────────────────────────────
   DiffSnapshot sub-component (used in table + print)
───────────────────────────────────────────────── */
const DiffSnapshot = ({ log }) => {
  const prev = parseSnap(log.previous_value);
  const next = parseSnap(log.new_value);

  if (!prev && !next) {
    return (
      <div className={styles.diffEmpty}>
        <Package size={16} />
        <span>No snapshot data was captured for this action.</span>
      </div>
    );
  }

  const allKeys = Array.from(new Set([
    ...Object.keys(prev || {}),
    ...Object.keys(next || {}),
  ])).filter((k) => !IGNORE_KEYS.has(k));

  if (allKeys.length === 0) {
    return (
      <div className={styles.diffEmpty}>
        <CheckCircle2 size={16} />
        <span>Action recorded — no field-level changes to display.</span>
      </div>
    );
  }

  return (
    <div className={styles.diffWrap}>
      <div className={styles.diffHeader}>
        <span className={styles.diffTitle}>Field-level Snapshot</span>
        <span className={styles.diffSub}>
          {prev && next ? 'Before → After' : next ? 'Created state' : 'Deleted state'}
        </span>
      </div>
      <div className={styles.diffTableScroll}>
        <table className={styles.diffTable}>
          <thead>
            <tr>
              <th className={styles.fieldName}>Field</th>
              <th className={styles.prevTh}>Before</th>
              <th className={styles.newTh}>After</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => {
              const pv = prev && prev[key] != null ? String(prev[key]) : '—';
              const nv = next && next[key] != null ? String(next[key]) : '—';
              const changed = pv !== nv && prev && next;
              return (
                <tr key={key} className={changed ? styles.changedRow : ''}>
                  <td className={styles.fieldName}>{humanizeKey(key)}</td>
                  <td className={`${styles.fieldVal} ${changed ? styles.fieldPrev : ''}`}>{pv}</td>
                  <td className={`${styles.fieldVal} ${changed ? styles.fieldNext : ''}`}>{nv}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   PRINT VIEW — each log entry on its own page
───────────────────────────────────────────────── */
const PrintView = React.forwardRef(({ logs, period, activityKey, search }, ref) => {
  const periodLabel = TIME_PERIODS.find((p) => p.key === period)?.label || 'All Time';
  const actLabel    = ACTIVITY_TYPES.find((a) => a.key === activityKey)?.label || 'All Activity';
  const printedAt   = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div ref={ref} className={styles.printRoot}>
      {logs.map((log, idx) => {
        const meta = actionMeta(log.action);
        const { date, time } = formatDate(log.created_at);
        return (
          <div key={log.id} className={styles.printPage}>
            {/* Print page header */}
            <div className={styles.printPageHeader}>
              <div className={styles.printPageHeaderLeft}>
                <div className={styles.printLogo}>🏥 Pharmacy Store</div>
                <div className={styles.printReportTitle}>Activity Audit Record</div>
              </div>
              <div className={styles.printPageHeaderRight}>
                <div className={styles.printMeta}>Period: <strong>{periodLabel}</strong></div>
                <div className={styles.printMeta}>Filter: <strong>{actLabel}</strong></div>
                {search && <div className={styles.printMeta}>Search: <strong>"{search}"</strong></div>}
                <div className={styles.printMeta}>Printed: {printedAt}</div>
                <div className={styles.printMeta}>Record {idx + 1} of {logs.length}</div>
              </div>
            </div>

            <hr className={styles.printDivider} />

            {/* Log summary card */}
            <div className={styles.printCard}>
              <div className={styles.printCardRow}>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>Action</span>
                  <span className={`${styles.printActionVal} ${styles[`printAction--${meta.tone}`]}`}>
                    {log.action}
                  </span>
                </div>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>Type</span>
                  <span className={`${styles.printBadge} ${styles[`printBadge--${meta.tone}`]}`}>
                    {meta.label}
                  </span>
                </div>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>Record / ID</span>
                  <span className={styles.printValue}>{log.record_identifier || '—'}</span>
                </div>
              </div>

              <div className={styles.printCardRow}>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>User</span>
                  <span className={styles.printValue}>{log.user_name || '—'}</span>
                </div>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>Role</span>
                  <span className={styles.printValue}>{log.role || '—'}</span>
                </div>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>Department</span>
                  <span className={styles.printValue}>{log.department || '—'}</span>
                </div>
              </div>

              <div className={styles.printCardRow}>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>Date</span>
                  <span className={styles.printValue}>{date}</span>
                </div>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>Time</span>
                  <span className={styles.printValue}>{time}</span>
                </div>
                <div className={styles.printField}>
                  <span className={styles.printLabel}>IP Address</span>
                  <span className={styles.printValue}>{log.ip_address || '—'}</span>
                </div>
              </div>
            </div>

            {/* Snapshot diff */}
            <div className={styles.printSnapTitle}>Field-level Snapshot</div>
            <PrintDiff log={log} />

            {/* Page footer */}
            <div className={styles.printPageFooter}>
              <span>Pharmacy Store Audit Log — Confidential</span>
              <span>Page {idx + 1} / {logs.length}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
PrintView.displayName = 'PrintView';

/* Print-optimised diff (no CSS modules for print, all inline-friendly classes) */
const PrintDiff = ({ log }) => {
  const prev = parseSnap(log.previous_value);
  const next = parseSnap(log.new_value);
  if (!prev && !next) {
    return <p className={styles.printNoSnap}>No snapshot data captured for this action.</p>;
  }
  const allKeys = Array.from(new Set([
    ...Object.keys(prev || {}),
    ...Object.keys(next || {}),
  ])).filter((k) => !IGNORE_KEYS.has(k));

  if (allKeys.length === 0) {
    return <p className={styles.printNoSnap}>No field changes — action logged for audit trail.</p>;
  }

  return (
    <table className={styles.printDiffTable}>
      <thead>
        <tr>
          <th>Field</th>
          <th>Before</th>
          <th>After</th>
        </tr>
      </thead>
      <tbody>
        {allKeys.map((key) => {
          const pv = prev && prev[key] != null ? String(prev[key]) : '—';
          const nv = next && next[key] != null ? String(next[key]) : '—';
          const changed = pv !== nv && prev && next;
          return (
            <tr key={key} style={changed ? { background: '#fffbeb' } : {}}>
              <td className={styles.printDiffField}>{humanizeKey(key)}</td>
              <td className={changed ? styles.printDiffPrev : styles.printDiffNeutral}>{pv}</td>
              <td className={changed ? styles.printDiffNext : styles.printDiffNeutral}>{nv}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

/* ─────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────── */
const PharmacyStoreAuditLog = () => {
  const { user } = useAuth();
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [printing,     setPrinting]     = useState(false);
  const [printLogs,    setPrintLogs]    = useState([]);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [period,       setPeriod]       = useState('all');
  const [activityKey,  setActivityKey]  = useState('');
  const [page,         setPage]         = useState(1);
  const [expandedRow,  setExpandedRow]  = useState(null);
  const LIMIT = 50;

  const printRef = useRef(null);

  /* ── fetch logs ── */
  const fetchLogs = useCallback(async (pg, srch, act, per) => {
    try {
      setLoading(true); setError(null);
      const { dateFrom, dateTo } = getDateRange(per);
      const res = await auditService.getLogs({
        page: pg, limit: LIMIT,
        search:   srch   || undefined,
        action:   act    || undefined,
        module:   MODULE,
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
      });
      setLogs(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page, search, activityKey, period);
  }, [page, search, activityKey, period, fetchLogs]);

  /* ── period / activity change helpers ── */
  const handlePeriod = (key) => { setPeriod(key); setPage(1); };
  const handleActivity = (key) => { setActivityKey(key); setPage(1); };
  const handleSearch  = (e) => { setSearch(e.target.value); setPage(1); };
  const clearSearch   = () => { setSearch(''); setPage(1); };

  const toggleRow = (id) => setExpandedRow((p) => (p === id ? null : id));

  /* ── print: fetch ALL matching logs then trigger browser print ── */
  const handlePrint = async () => {
    try {
      setPrinting(true);
      const { dateFrom, dateTo } = getDateRange(period);
      const res = await auditService.getLogs({
        noPagination: true,
        search:       search      || undefined,
        action:       activityKey || undefined,
        module:       MODULE,
        dateFrom:     dateFrom    || undefined,
        dateTo:       dateTo      || undefined,
      });
      const all = Array.isArray(res?.data) ? res.data : [];
      if (all.length === 0) { alert('No records to print for the current filter.'); return; }
      setPrintLogs(all);

      // Wait for React to render the print view then call window.print()
      setTimeout(() => {
        window.print();
        setPrintLogs([]);
        setPrinting(false);
      }, 350);
    } catch (err) {
      alert('Failed to prepare print data: ' + err.message);
      setPrinting(false);
    }
  };

  /* ── derived values ── */
  const periodLabel   = TIME_PERIODS.find((p) => p.key === period)?.label || 'All Time';
  const activityLabel = ACTIVITY_TYPES.find((a) => a.key === activityKey)?.label || 'All Activity';

  /* ── render ── */
  return (
    <>
      {/* ══════ SCREEN VIEW ══════ */}
      <div className={`${styles.page} ${styles.screenOnly}`}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconWrap}>
              <ShieldCheck size={24} className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Pharmacy Store Activity Log</h1>
              <p className={styles.subtitle}>
                Complete audit trail — receipts, issues, adjustments &amp; transfers.
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.statChip}>
              <span className={styles.statNum}>{logs.length}</span>
              <span className={styles.statLabel}>Shown</span>
            </div>
            <button
              className={styles.printBtn}
              onClick={handlePrint}
              disabled={printing}
              title="Print all matching records (one per page)"
            >
              {printing
                ? <RefreshCcw size={15} className={styles.spinning} />
                : <Printer size={15} />}
              {printing ? 'Preparing…' : 'Print Report'}
            </button>
          </div>
        </div>

        {/* ── Time-period filter ── */}
        <div className={styles.periodBar}>
          <Calendar size={14} className={styles.periodBarIcon} />
          <span className={styles.periodBarLabel}>Period:</span>
          {TIME_PERIODS.map((tp) => (
            <button
              key={tp.key}
              className={`${styles.periodBtn} ${period === tp.key ? styles['periodBtn--active'] : ''}`}
              onClick={() => handlePeriod(tp.key)}
            >
              {tp.label}
            </button>
          ))}
        </div>

        {/* ── Activity type filter ── */}
        <div className={styles.activityBar}>
          <Filter size={14} className={styles.periodBarIcon} />
          <span className={styles.periodBarLabel}>Activity:</span>
          {ACTIVITY_TYPES.map((at) => (
            <button
              key={at.key}
              className={`${styles.actBtn} ${styles[`actBtn--${at.tone}`]} ${activityKey === at.key ? styles[`actBtn--${at.tone}--active`] : ''}`}
              onClick={() => handleActivity(at.key)}
            >
              {at.label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by user, action or record ID…"
              value={search}
              onChange={handleSearch}
            />
            {search && (
              <button className={styles.clearBtn} onClick={clearSearch} title="Clear">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className={styles.refreshBtn}
            onClick={() => fetchLogs(page, search, activityKey, period)}
            title="Refresh"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>

        {/* ── Active filter summary ── */}
        {(period !== 'all' || activityKey || search) && (
          <div className={styles.filterSummary}>
            <span className={styles.filterSummaryLabel}>Showing:</span>
            {period !== 'all' && <span className={styles.filterChip}>{periodLabel}</span>}
            {activityKey && <span className={styles.filterChip}>{activityLabel}</span>}
            {search && <span className={styles.filterChip}>"{search}"</span>}
            <button
              className={styles.clearAllBtn}
              onClick={() => { setPeriod('all'); setActivityKey(''); setSearch(''); setPage(1); }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Table body ── */}
        <div className={styles.body}>
          {loading && logs.length === 0 ? (
            <div className={styles.spinnerWrap}>
              <SegmentedSpinner size={40} label="Loading pharmacy store activity…" />
            </div>
          ) : error ? (
            <div className={styles.errorWrap}>
              <AlertTriangle size={32} className={styles.errorIcon} />
              <p className={styles.errorMsg}>{error}</p>
              <button className={styles.refreshBtn}
                onClick={() => fetchLogs(page, search, activityKey, period)}>
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className={styles.emptyWrap}>
              <ShieldCheck size={48} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No Activity Found</p>
              <p className={styles.emptySub}>
                No pharmacy store operations match the current filters.
              </p>
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thType}>Type</th>
                    <th className={styles.thUser}>User</th>
                    <th className={styles.thAction}>Action &amp; Record</th>
                    <th className={styles.thTime}>Date &amp; Time</th>
                    <th className={styles.thIP}>IP</th>
                    <th className={styles.thSnapshot}>Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const meta  = actionMeta(log.action);
                    const { date, time } = formatDate(log.created_at);
                    const isOpen = expandedRow === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className={`${styles.row} ${styles[`row--${meta.tone}`]} ${isOpen ? styles['row--open'] : ''}`}>
                          <td className={styles.tdType}>
                            <span className={`${styles.typeBadge} ${styles[`typeBadge--${meta.tone}`]}`}>
                              {meta.icon}{meta.label}
                            </span>
                          </td>
                          <td className={styles.tdUser}>
                            <div className={styles.userName}>{log.user_name || '—'}</div>
                            <div className={styles.userRole}>{log.role || '—'}</div>
                          </td>
                          <td className={styles.tdAction}>
                            <div className={`${styles.actionCode} ${styles[`actionCode--${meta.tone}`]}`}>
                              {log.action}
                            </div>
                            {log.record_identifier && (
                              <div className={styles.recordId}>
                                <Package size={11} />{log.record_identifier}
                              </div>
                            )}
                          </td>
                          <td className={styles.tdTime}>
                            <div className={styles.timeDate}>{date}</div>
                            <div className={styles.timeHour}><Clock size={11} />{time}</div>
                          </td>
                          <td className={styles.tdIP}>
                            <div className={styles.ipAddr}><Wifi size={11} />{log.ip_address || '—'}</div>
                          </td>
                          <td className={styles.tdSnapshot}>
                            <button
                              className={`${styles.snapBtn} ${isOpen ? styles['snapBtn--open'] : ''}`}
                              onClick={() => toggleRow(log.id)}
                            >
                              {isOpen ? <><ChevronUp size={13} />Close</> : <><ChevronDown size={13} />View</>}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className={styles.diffRow}>
                            <td colSpan={6} className={styles.diffCell}>
                              <DiffSnapshot log={log} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}>← Previous</button>
            <span className={styles.pageInfo}>Page {page}</span>
            <button className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < LIMIT}>Next →</button>
          </div>
        )}
      </div>

      {/* ══════ PRINT VIEW (hidden on screen, visible when printing) ══════ */}
      {printLogs.length > 0 && (
        <PrintView
          ref={printRef}
          logs={printLogs}
          period={period}
          activityKey={activityKey}
          search={search}
        />
      )}
    </>
  );
};

export default PharmacyStoreAuditLog;
