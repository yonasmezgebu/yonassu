import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './SystemJobs.module.css';

const PAGE_SIZE = 10;

const JOB_TYPES = [
  'Backup',
  'Notification',
  'Report Generation',
  'Data Sync',
  'File Processing',
  'Data Cleanup',
  'Scheduled Reminder',
  'Health Check',
];

const STATUS_ORDER = { RUNNING: 0, FAILED: 1, PAUSED: 2, SUCCESS: 3, PENDING: 4 };

const relativeTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(date);
};

const FALLBACK_JOBS = [
  { id: 1, name: 'Database Backup', type: 'Backup', description: 'Automatic full database backup', status: 'SUCCESS', last_run: new Date(Date.now() - 14 * 3600000).toISOString(), next_run: new Date(Date.now() + 10 * 3600000).toISOString(), schedule: '0 2 * * *' },
  { id: 2, name: 'Email Notifications', type: 'Notification', description: 'Send scheduled email notifications', status: 'SUCCESS', last_run: new Date(Date.now() - 3600000).toISOString(), next_run: new Date(Date.now() + 3600000).toISOString(), schedule: '0 * * * *' },
  { id: 3, name: 'SMS Reminders', type: 'Scheduled Reminder', description: 'Send SMS reminders for upcoming deadlines', status: 'SUCCESS', last_run: new Date(Date.now() - 3 * 3600000).toISOString(), next_run: new Date(Date.now() + 3600000).toISOString(), schedule: '0 15,18 * * *' },
  { id: 4, name: 'Data Synchronization', type: 'Data Sync', description: 'Sync external integrations (payments, accounting)', status: 'FAILED', last_run: new Date(Date.now() - 2 * 3600000).toISOString(), next_run: null, schedule: '*/30 * * * *', error: 'Connection timeout to payment gateway. Retried 3 times.' },
  { id: 5, name: 'System Health Check', type: 'Health Check', description: 'Check database, storage, and service availability', status: 'SUCCESS', last_run: new Date(Date.now() - 10 * 60000).toISOString(), next_run: new Date(Date.now() + 10 * 60000).toISOString(), schedule: '*/10 * * * *' },
  { id: 6, name: 'Report Generation', type: 'Report Generation', description: 'Generate daily sales and finance reports', status: 'PAUSED', last_run: new Date(Date.now() - 86400000).toISOString(), next_run: null, schedule: '0 1 * * *' },
  { id: 7, name: 'File Processing', type: 'File Processing', description: 'Process uploaded documents and generate thumbnails', status: 'SUCCESS', last_run: new Date(Date.now() - 7200000).toISOString(), next_run: new Date(Date.now() + 1800000).toISOString(), schedule: '*/15 * * * *' },
  { id: 8, name: 'Temp Data Cleanup', type: 'Data Cleanup', description: 'Remove temporary and expired session files', status: 'SUCCESS', last_run: new Date(Date.now() - 43200000).toISOString(), next_run: new Date(Date.now() + 43200000).toISOString(), schedule: '0 3 * * *' },
];

const SystemJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleValue, setScheduleValue] = useState('');
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchJobs = useCallback(async () => {
    try {
      const res = await adminService.getSystemJobs();
      const data = res.data?.data || res.data || {};
      setJobs(data.jobs || []);
    } catch (err) {
      setJobs(FALLBACK_JOBS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    timerRef.current = setInterval(fetchJobs, 30000);
    const onFocus = () => fetchJobs();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchJobs]);

  const refresh = async () => {
    setLoading(true);
    await fetchJobs();
  };

  const retryJob = async (job) => {
    try {
      await adminService.retrySystemJob(job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'RUNNING' } : j)));
      showToast(`Retrying "${job.name}"...`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to retry job.', 'error');
    }
  };

  const pauseJob = async (job) => {
    try {
      await adminService.pauseSystemJob(job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'PAUSED' } : j)));
      showToast(`"${job.name}" paused.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to pause job.', 'error');
    }
  };

  const resumeJob = async (job) => {
    try {
      await adminService.resumeSystemJob(job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'SUCCESS' } : j)));
      showToast(`"${job.name}" resumed.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resume job.', 'error');
    }
  };

  const openHistory = async (job) => {
    setExpandedId((prev) => (prev === job.id ? null : job.id));
    if (expandedId === job.id) return;
    setHistoryLoading(true);
    try {
      const res = await adminService.getSystemJobHistory(job.id);
      const data = res.data?.data || res.data || {};
      setHistory(data.history || []);
    } catch (err) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openScheduleModal = (job) => {
    setScheduleModal(job);
    setScheduleValue(job.schedule || '');
  };

  const saveSchedule = async () => {
    if (!scheduleModal) return;
    try {
      await adminService.updateSystemJobSchedule(scheduleModal.id, scheduleValue);
      setJobs((prev) => prev.map((j) => (j.id === scheduleModal.id ? { ...j, schedule: scheduleValue } : j)));
      showToast(`Schedule updated for "${scheduleModal.name}".`);
      setScheduleModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update schedule.', 'error');
    }
  };

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs
      .filter((j) => {
        if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
        if (typeFilter !== 'ALL' && j.type !== typeFilter) return false;
        if (q) {
          const hay = `${j.name || ''} ${j.description || ''} ${j.type || ''} ${j.status || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  }, [jobs, statusFilter, typeFilter, search]);

  useEffect(() => { setPage(1); }, [statusFilter, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = scoped.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = useMemo(() => ({
    ALL: jobs.length,
    SUCCESS: jobs.filter((j) => j.status === 'SUCCESS').length,
    FAILED: jobs.filter((j) => j.status === 'FAILED').length,
    RUNNING: jobs.filter((j) => j.status === 'RUNNING').length,
    PAUSED: jobs.filter((j) => j.status === 'PAUSED').length,
    PENDING: jobs.filter((j) => j.status === 'PENDING').length,
  }), [jobs]);

  const statCards = [
    { key: 'ALL', label: 'Total Jobs', count: counts.ALL, tone: 'neutral' },
    { key: 'SUCCESS', label: 'Success', count: counts.SUCCESS, tone: 'success' },
    { key: 'FAILED', label: 'Failed', count: counts.FAILED, tone: 'failed' },
    { key: 'RUNNING', label: 'Running', count: counts.RUNNING, tone: 'running' },
    { key: 'PAUSED', label: 'Paused', count: counts.PAUSED, tone: 'paused' },
  ];

  const uniqueTypes = useMemo(() => {
    const seen = new Set();
    jobs.forEach((j) => { if (j.type) seen.add(j.type); });
    return Array.from(seen).sort();
  }, [jobs]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>System Jobs</h2>
          <p className={styles.pageSubtitle}>
            Scheduled background tasks — monitor status, retry failures, and manage run schedules.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={refresh}>Refresh</button>
        </div>
      </div>

      <div className={styles.statRow}>
        {statCards.map((card) => (
          <button
            key={card.key}
            className={`${styles.statCard} ${styles[`statTone${card.tone}`]} ${statusFilter === card.key ? styles.statActive : ''}`}
            onClick={() => setStatusFilter(card.key === statusFilter ? 'ALL' : card.key)}
            aria-pressed={statusFilter === card.key}
          >
            <span className={styles.statValue}>{card.count}</span>
            <span className={styles.statLabel}>{card.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabRow}>
          {['ALL', 'SUCCESS', 'FAILED', 'RUNNING', 'PAUSED'].map((key) => (
            <button
              key={key}
              className={`${styles.tab} ${statusFilter === key ? styles.tabActive : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {key === 'ALL' ? 'All' : key.charAt(0) + key.slice(1).toLowerCase()} ({counts[key] || 0})
            </button>
          ))}
        </div>
        <div className={styles.filters}>
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="ALL">All Types</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            className={styles.search}
            type="search"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search jobs"
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading system jobs...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.empty}>
          <div className={`${styles.emptyIcon} ${styles.emptyOk}`}>&#10003;</div>
          <p className={styles.emptyTitle}>No system jobs configured</p>
          <p className={styles.emptyText}>System jobs will appear here once they are scheduled.</p>
        </div>
      ) : scoped.length === 0 ? (
        <div className={styles.empty}>
          <div className={`${styles.emptyIcon} ${styles.emptyFilter}`}>&#9881;</div>
          <p className={styles.emptyTitle}>No matching jobs</p>
          <p className={styles.emptyText}>Try changing the filters or search term.</p>
          <button
            className={styles.btnPrimary}
            onClick={() => { setStatusFilter('ALL'); setTypeFilter('ALL'); setSearch(''); }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={styles.resultInfo}>
          Showing {scoped.length === 1 ? '1 job' : `${scoped.length} jobs`}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Job</th>
                <th>Type</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <React.Fragment key={job.id}>
                  <tr>
                    <td>
                      <div className={styles.jobName}>{job.name}</div>
                      {job.description && <div className={styles.jobDesc}>{job.description}</div>}
                    </td>
                    <td><span className={styles.typeBadge}>{job.type}</span></td>
                    <td>
                      <div className={styles.statusCell}>
                        <span className={`${styles.statusDot} ${styles[`statusDot${job.status}`] || ''}`} />
                        <span className={`${styles.statusLabel} ${styles[`statusLabel${job.status}`] || ''}`}>
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        className={styles.btnGhost}
                        style={{ fontSize: 12, height: 28, padding: '0 10px' }}
                        onClick={() => openScheduleModal(job)}
                        title="Edit schedule"
                      >
                        {job.schedule || 'N/A'}
                      </button>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {job.last_run ? relativeTime(job.last_run) : '-'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {job.next_run ? relativeTime(job.next_run) : (job.status === 'FAILED' ? 'Retry' : '-')}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {job.status === 'FAILED' && (
                          <button
                            className={`${styles.btnIcon} ${styles.btnIconRetry}`}
                            onClick={() => retryJob(job)}
                            title="Retry job"
                          >
                            &#x21BB;
                          </button>
                        )}
                        {(job.status === 'SUCCESS' || job.status === 'RUNNING' || job.status === 'PENDING') && (
                          <button
                            className={`${styles.btnIcon} ${styles.btnIconPause}`}
                            onClick={() => pauseJob(job)}
                            title="Pause job"
                          >
                            &#x23F8;
                          </button>
                        )}
                        {job.status === 'PAUSED' && (
                          <button
                            className={`${styles.btnIcon} ${styles.btnIconResume}`}
                            onClick={() => resumeJob(job)}
                            title="Resume job"
                          >
                            &#x25B6;
                          </button>
                        )}
                        <button
                          className={`${styles.btnIcon} ${styles.btnIconHistory}`}
                          onClick={() => openHistory(job)}
                          title="View execution history"
                        >
                          &#x1F4CB;
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === job.id && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div className={styles.historyPanel}>
                          <h4>Execution History — {job.name}</h4>
                          {historyLoading ? (
                            <div className={styles.loading} style={{ padding: 24 }}>
                              <div className={styles.spinner} />
                            </div>
                          ) : history.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No execution history available.</p>
                          ) : (
                            <table className={styles.historyTable}>
                              <thead>
                                <tr>
                                  <th>Started</th>
                                  <th>Finished</th>
                                  <th>Duration</th>
                                  <th>Status</th>
                                  <th>Error</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((h, i) => (
                                  <tr key={h.id || i}>
                                    <td>{h.started_at ? formatDateTime(h.started_at) : '-'}</td>
                                    <td>{h.finished_at ? formatDateTime(h.finished_at) : '-'}</td>
                                    <td>{h.duration || '-'}</td>
                                    <td>
                                      <div className={styles.statusCell}>
                                        <span className={`${styles.statusDot} ${styles[`statusDot${h.status}`] || ''}`} />
                                        <span className={`${styles.statusLabel} ${styles[`statusLabel${h.status}`] || ''}`}>
                                          {h.status}
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      {h.error ? (
                                        <div className={styles.historyError}>{h.error}</div>
                                      ) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.btnGhost} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>&larr; Prev</button>
          <span className={styles.pageInfo}>Page {safePage} of {totalPages}</span>
          <button className={styles.btnGhost} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next &rarr;</button>
        </div>
      )}

      {scheduleModal && (
        <div className={styles.modalOverlay} onClick={() => setScheduleModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Schedule — {scheduleModal.name}</h3>
              <button className={styles.modalClose} onClick={() => setScheduleModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label>Cron Expression</label>
                <input
                  className={styles.modalInput}
                  type="text"
                  value={scheduleValue}
                  onChange={(e) => setScheduleValue(e.target.value)}
                  placeholder="e.g. 0 2 * * *"
                />
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                Enter a valid cron expression. Example: <code>0 2 * * *</code> means daily at 02:00.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnGhost} onClick={() => setScheduleModal(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveSchedule}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span className={styles.toastIcon}>{toast.type === 'error' ? '\u26A0' : '\u2713'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SystemJobs;
