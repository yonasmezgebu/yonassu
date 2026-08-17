import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './Maintenance.module.css';

const TASKS = [
  {
    key: 'database',
    title: 'Database Maintenance',
    icon: '\uD83D\uDDC4\uFE0F',
    desc: 'Check and optimize database performance, indexes, table health, and fragmentation.',
    actionLabel: 'Run Maintenance',
  },
  {
    key: 'storage',
    title: 'Storage Cleanup',
    icon: '\uD83D\uDCC1',
    desc: 'Identify unnecessary files, review storage usage across the system.',
    actionLabel: 'Run Cleanup',
  },
  {
    key: 'cache',
    title: 'Cache Management',
    icon: '\u26A1',
    desc: 'Clear or rebuild application cache when it becomes stale or oversized.',
    actionLabel: 'Clear Cache',
  },
  {
    key: 'logs',
    title: 'Log Management',
    icon: '\uD83D\uDCCB',
    desc: 'Manage application and system logs, prune old entries beyond retention.',
    actionLabel: 'Prune Logs',
  },
  {
    key: 'integrity',
    title: 'Data Integrity Check',
    icon: '\uD83D\uDD0D',
    desc: 'Detect inconsistent or corrupted data across database tables.',
    actionLabel: 'Run Check',
  },
  {
    key: 'diagnostics',
    title: 'System Diagnostics',
    icon: '\uD83D\uDCCA',
    desc: 'Deep diagnostics on application, database, and background services.',
    actionLabel: 'Run Diagnostics',
  },
  {
    key: 'archive',
    title: 'Archive Old Data',
    icon: '\uD83D\uDCE6',
    desc: 'Move eligible historical data out of active tables under defined rules.',
    actionLabel: 'Run Archive',
  },
  {
    key: 'updates',
    title: 'System Updates',
    icon: '\uD83D\uDD04',
    desc: 'Review and apply approved ERP system updates and security patches.',
    actionLabel: 'Check Updates',
  },
];

const ACTIONS = {
  database: (svc) => svc.runDatabaseMaintenance(),
  storage: (svc) => svc.runStorageCleanup(),
  cache: (svc) => svc.clearCache(),
  logs: (svc) => svc.pruneLogs(90),
  integrity: (svc) => svc.runDataIntegrityCheck(),
  diagnostics: (svc) => svc.runSystemDiagnostics(),
  archive: (svc) => svc.runArchive('all', 365),
  updates: (svc) => svc.getSystemUpdates(),
};

const renderDetails = (key, details) => {
  if (!details) return null;
  if (key === 'database' && details.tables) {
    return (
      <table className={styles.expandTable}>
        <thead><tr><th>Table</th><th>Rows</th><th>Status</th></tr></thead>
        <tbody>
          {details.tables.map((t, i) => (
            <tr key={i}><td>{t.name}</td><td>{t.rows?.toLocaleString()}</td><td>{t.status}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (key === 'storage' && details.usage) {
    return (
      <table className={styles.expandTable}>
        <thead><tr><th>Path</th><th>Size</th><th>Category</th></tr></thead>
        <tbody>
          {details.usage.map((u, i) => (
            <tr key={i}><td>{u.path}</td><td>{u.size}</td><td>{u.category}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (key === 'cache' && details.items) {
    return (
      <table className={styles.expandTable}>
        <thead><tr><th>Cache Key</th><th>Size</th><th>TTL</th></tr></thead>
        <tbody>
          {details.items.map((c, i) => (
            <tr key={i}><td>{c.key}</td><td>{c.size}</td><td>{c.ttl}s</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (key === 'logs' && details.pruned) {
    return (
      <ul className={styles.taskResultList}>
        {details.pruned.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    );
  }
  if ((key === 'integrity' || key === 'diagnostics') && details.checks) {
    return (
      <table className={styles.expandTable}>
        <thead><tr><th>Check</th><th>Result</th><th>Detail</th></tr></thead>
        <tbody>
          {details.checks.map((c, i) => (
            <tr key={i}><td>{c.name}</td><td>{c.result}</td><td>{c.detail}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (key === 'archive' && details.archived) {
    return (
      <table className={styles.expandTable}>
        <thead><tr><th>Data Type</th><th>Records Moved</th><th>Destination</th></tr></thead>
        <tbody>
          {details.archived.map((a, i) => (
            <tr key={i}><td>{a.dataType}</td><td>{a.count?.toLocaleString()}</td><td>{a.destination}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (key === 'updates' && details.updates) {
    return (
      <table className={styles.expandTable}>
        <thead><tr><th>Version</th><th>Type</th><th>Released</th><th>Status</th></tr></thead>
        <tbody>
          {details.updates.map((u, i) => (
            <tr key={i}><td>{u.version}</td><td>{u.type}</td><td>{u.released ? formatDateTime(u.released) : '-'}</td><td>{u.status}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  return null;
};

const Maintenance = () => {
  const [taskStates, setTaskStates] = useState(() => {
    const init = {};
    TASKS.forEach((t) => {
      init[t.key] = { status: 'idle', result: null, details: null, expanded: false, lastRun: null };
    });
    return init;
  });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const setStatus = (key, status, result = null, details = null) => {
    setTaskStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        result,
        details,
        lastRun: status === 'done' || status === 'error' ? new Date() : prev[key].lastRun,
      },
    }));
  };

  const toggleExpand = (key) => {
    setTaskStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], expanded: !prev[key].expanded },
    }));
  };

  const runTask = async (key) => {
    setStatus(key, 'running');
    try {
      const res = await ACTIONS[key](adminService);
      const d = res.data?.data || res.data || {};
      setStatus(key, 'done', { message: d.message || TASKS.find((t) => t.key === key)?.title + ' completed.' }, d);
      showToast(TASKS.find((t) => t.key === key)?.title + ' completed.');
    } catch (err) {
      const msg = err.response?.data?.message || TASKS.find((t) => t.key === key)?.title + ' failed.';
      setStatus(key, 'error', { message: msg });
      showToast(msg, 'error');
    }
  };

  const runningCount = Object.values(taskStates).filter((s) => s.status === 'running').length;
  const doneCount = Object.values(taskStates).filter((s) => s.status === 'done').length;

  const badgeClass = (s) => {
    if (s === 'running') return styles.badgeRunning;
    if (s === 'done') return styles.badgeDone;
    if (s === 'error') return styles.badgeError;
    return styles.badgeIdle;
  };
  const dotClass = (s) => {
    if (s === 'running') return styles.badgeDotRunning;
    if (s === 'done') return styles.badgeDotDone;
    if (s === 'error') return styles.badgeDotError;
    return styles.badgeDotIdle;
  };
  const topClass = (s) => {
    if (s === 'running') return styles.taskCardTopRunning;
    if (s === 'done') return styles.taskCardTopDone;
    if (s === 'error') return styles.taskCardTopError;
    return styles.taskCardTopIdle;
  };
  const statusLabel = (s) => {
    if (s === 'running') return 'Running';
    if (s === 'done') return 'Completed';
    if (s === 'error') return 'Failed';
    return 'Ready';
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Maintenance</h2>
          <p className={styles.pageSubtitle}>
            Technical housekeeping — clean, check, and optimize the running system.
          </p>
        </div>
      </div>

      <div className={styles.warningBanner}>
        <span className={styles.warningBannerIcon}>&#x26A0;</span>
        Maintenance actions never remove business records. They only clean system files, check integrity, and optimize performance.
      </div>

      {runningCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--color-info)', fontWeight: 600 }}>
          <span className={styles.spinner} />
          {runningCount} task{runningCount !== 1 ? 's' : ''} running...
        </div>
      )}

      <div className={styles.taskGrid}>
        {TASKS.map((task) => {
          const state = taskStates[task.key];
          return (
            <div key={task.key} className={styles.taskCard}>
              <div className={`${styles.taskCardTop} ${topClass(state.status)}`} />
              <div className={styles.taskCardBody}>
                <div className={styles.taskCardHeader}>
                  <span className={styles.taskIcon}>{task.icon}</span>
                  <div className={styles.taskCardInfo}>
                    <h3 className={styles.taskCardTitle}>{task.title}</h3>
                    <p className={styles.taskCardDesc}>{task.desc}</p>
                  </div>
                  <span className={`${styles.taskStatusBadge} ${badgeClass(state.status)}`}>
                    <span className={`${styles.badgeDot} ${dotClass(state.status)}`} />
                    {statusLabel(state.status)}
                  </span>
                </div>

                {state.result && (
                  <div className={`${styles.taskResult} ${state.status === 'done' ? styles.taskResultSuccess : state.status === 'error' ? styles.taskResultError : styles.taskResultInfo}`}>
                    <span className={styles.taskResultTitle}>{state.result.message}</span>
                    {state.details && renderDetails(task.key, state.details)}
                  </div>
                )}
              </div>

              <div className={styles.taskCardFooter}>
                <span className={styles.taskCardMeta}>
                  {state.lastRun ? `Last run: ${formatDateTime(state.lastRun.toISOString())}` : 'Not run yet'}
                </span>
                <div className={styles.taskCardActions}>
                  {state.details && (
                    <button
                      className={`${styles.btnGhost} ${styles.btnSmall}`}
                      onClick={() => toggleExpand(task.key)}
                    >
                      {state.expanded ? 'Hide Details' : 'Details'}
                    </button>
                  )}
                  <button
                    className={`${styles.btnPrimary} ${styles.btnSmall}`}
                    onClick={() => runTask(task.key)}
                    disabled={state.status === 'running'}
                  >
                    {state.status === 'running' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={styles.spinner} /> Running...
                      </span>
                    ) : task.actionLabel}
                  </button>
                </div>
              </div>

              {state.expanded && state.details && (
                <div className={styles.taskExpand}>
                  {renderDetails(task.key, state.details)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span className={styles.toastIcon}>{toast.type === 'error' ? '\u26A0' : '\u2713'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Maintenance;
