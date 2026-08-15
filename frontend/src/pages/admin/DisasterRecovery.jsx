import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './DisasterRecovery.module.css';

const PAGE_SIZE = 6;
const TYPE_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 };

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const relativeTime = (date) => {
  if (!date) return '—';
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

const DisasterRecovery = () => {
  const [drStatus, setDrStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [testModal, setTestModal] = useState(null);
  const [testForm, setTestForm] = useState({ result: 'passed', notes: '' });
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const timerRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await adminService.getDRStatus();
      const data = res.data?.data || res.data || {};
      setDrStatus(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load system health.', 'error');
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await adminService.getAlerts({ module: 'System' });
      const data = res.data?.data || res.data || {};
      setAlerts(data.alerts || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch DR alerts.', 'error');
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await adminService.getBackups();
      const data = res.data?.data || res.data || {};
      setBackups(data.backups || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load backups.', 'error');
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchAlerts(), fetchBackups()]);
    setLoading(false);
  }, [fetchStatus, fetchAlerts, fetchBackups]);

  useEffect(() => {
    refreshAll();
    timerRef.current = setInterval(() => {
      fetchStatus();
      fetchAlerts();
    }, 60000);
    const onFocus = () => {
      fetchStatus();
      fetchAlerts();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshAll, fetchStatus, fetchAlerts]);

  const runBackup = async () => {
    setBusy(true);
    try {
      await adminService.createBackup();
      showToast('Backup started. It will appear in the backup list shortly.');
      await Promise.all([fetchStatus(), fetchBackups(), fetchAlerts()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to run backup.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const initiateTest = async () => {
    setBusy(true);
    try {
      const res = await adminService.initiateDRTest();
      const id = res.data?.data?.id || res.data?.id;
      await fetchStatus();
      setTestForm({ result: 'passed', notes: '' });
      setTestModal(id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to initiate recovery test.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const completeTest = async (e) => {
    e.preventDefault();
    if (!testModal) return;
    setBusy(true);
    try {
      await adminService.completeDRTest(testModal, testForm.result, testForm.notes);
      setTestModal(null);
      setTestForm({ result: 'passed', notes: '' });
      showToast(testForm.result === 'passed' ? 'Recovery test passed — backup is restorable.' : 'Recovery test recorded as failed.');
      await Promise.all([fetchStatus(), fetchAlerts()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete recovery test.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async (e) => {
    e.preventDefault();
    if (!restoreTarget || restoreConfirm !== 'RESTORE') return;
    setBusy(true);
    try {
      await adminService.restoreBackup(restoreTarget.filename);
      setRestoreTarget(null);
      setRestoreConfirm('');
      showToast('Restore initiated. Verify data integrity after completion.');
      await Promise.all([fetchStatus(), fetchAlerts()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start restore.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteBackup = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminService.deleteBackup(deleteTarget.filename);
      setDeleteTarget(null);
      showToast('Backup deleted.');
      await Promise.all([fetchStatus(), fetchBackups()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete backup.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const markRead = async (alert) => {
    try {
      await adminService.markAlertRead(alert.id);
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, status: 'READ' } : a)));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark alert as read.', 'error');
    }
  };

  const resolve = async (alert) => {
    try {
      await adminService.markAlertResolved(alert.id);
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, status: 'RESOLVED' } : a)));
      showToast('Alert resolved.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve alert.', 'error');
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => a.status === 'UNREAD');
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((a) => adminService.markAlertRead(a.id)));
      setAlerts((prev) => prev.map((a) => (a.status === 'UNREAD' ? { ...a, status: 'READ' } : a)));
      showToast('All DR alerts marked as read.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update alerts.', 'error');
    }
  };

  const toggleDetails = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const config = drStatus?.config || {};
  const lastTest = drStatus?.lastTest || null;
  const dbInfo = drStatus?.database || {};
  const server = drStatus?.server || {};
  const backup = drStatus?.backup || {};
  const drill = drStatus?.drill || {};

  const backupTone = backup.status === 'ok' ? 'ok' : backup.status === 'warning' ? 'warning' : backup.status === 'critical' ? 'critical' : 'neutral';

  const healthCards = [
    {
      label: 'Database',
      value: dbInfo.connected ? 'Connected' : 'Disconnected',
      tone: dbInfo.connected ? 'ok' : 'critical',
      detail: `${dbInfo.tableCount || 0} tables`,
      icon: 'DB',
    },
    {
      label: 'Server',
      value: server.uptimeFormatted || '—',
      tone: (server.memoryUsagePercent || 0) > 85 ? 'warning' : 'ok',
      detail: `${server.memoryUsagePercent || 0}% memory used`,
      icon: 'SV',
    },
    {
      label: 'Last Backup',
      value: backup.lastBackup ? relativeTime(backup.lastBackup.created) : 'Never',
      tone: backupTone,
      detail: backup.lastBackupAgeHours != null ? `${backup.lastBackupAgeHours}h old` : 'no backups on disk',
      icon: 'BK',
    },
    {
      label: 'Storage',
      value: dbInfo.totalSizeFormatted || '—',
      tone: backup.status === 'critical' ? 'warning' : 'ok',
      detail: `${backup.totalBackups || 0} backup file(s)`,
      icon: 'ST',
    },
    {
      label: 'Replication',
      value: config.replicationStatus || '—',
      tone: (config.replicationStatus || '').toLowerCase() === 'healthy' ? 'ok' : 'warning',
      detail: `Last sync ${relativeTime(config.lastSync)}`,
      icon: 'RP',
    },
  ];

  const severity = useMemo(() => ({
    CRITICAL: alerts.filter((a) => a.type === 'CRITICAL').length,
    WARNING: alerts.filter((a) => a.type === 'WARNING').length,
    INFO: alerts.filter((a) => a.type === 'INFO').length,
  }), [alerts]);

  const unread = alerts.filter((a) => a.status === 'UNREAD').length;

  const statCards = [
    { key: 'ALL', label: 'System Alerts', count: alerts.length, tone: 'neutral' },
    { key: 'CRITICAL', label: 'Critical', count: severity.CRITICAL, tone: 'critical' },
    { key: 'WARNING', label: 'Warnings', count: severity.WARNING, tone: 'warning' },
    { key: 'INFO', label: 'Info', count: severity.INFO, tone: 'info' },
  ];

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts
      .filter((a) => {
        if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
        if (q) {
          const hay = `${a.title || ''} ${a.message || ''} ${a.type || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const byType = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
        if (byType !== 0) return byType;
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [alerts, statusFilter, search]);

  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const counts = useMemo(() => ({
    ALL: alerts.length,
    UNREAD: alerts.filter((a) => a.status === 'UNREAD').length,
    READ: alerts.filter((a) => a.status === 'READ').length,
    RESOLVED: alerts.filter((a) => a.status === 'RESOLVED').length,
  }), [alerts]);

  const totalPages = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = scoped.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const drillChecks = [
    { key: 'copies', label: '3 copies of data', desc: 'At least 3 backup copies exist', ok: drill.copies >= 3, value: `${drill.copies || 0} copy(s)` },
    { key: 'locations', label: '2 different locations', desc: 'Backup stored on disk and in the cloud', ok: !!drill.twoLocations, value: drill.twoLocations ? 'Disk + Cloud' : 'Disk only' },
    { key: 'offSite', label: '1 off-site copy', desc: 'Cloud/object storage holds an off-site copy', ok: !!drill.offSite, value: drill.offSite ? 'Off-site ready' : 'Not configured' },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Disaster Recovery</h2>
          <p className={styles.pageSubtitle}>System Health · Backup Monitoring · DR Alert Center</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.liveChip}>
            <span className={styles.liveDot} />
            Monitoring
          </span>
          <button className={styles.btnGhost} onClick={refreshAll} disabled={loading}>Refresh</button>
          <button className={styles.btnOutline} onClick={initiateTest} disabled={busy}>
            {busy ? 'Working…' : 'Initiate Recovery Test'}
          </button>
          <button className={styles.btnPrimary} onClick={runBackup} disabled={busy}>
            {busy ? 'Working…' : 'Run Backup Now'}
          </button>
        </div>
      </div>

      {loading && !drStatus ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading disaster recovery status…</span>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>System Health</h3>
                <p className={styles.sectionSubtitle}>Monitoring database, server, backups, storage and replication.</p>
              </div>
            </div>
            <div className={styles.healthGrid}>
              {healthCards.map((card) => (
                <div key={card.label} className={styles.healthCard}>
                  <div className={styles.healthTop}>
                    <span className={styles.healthIcon}>{card.icon}</span>
                    <span className={`${styles.statusPill} ${styles[`statusTone${card.tone}`]}`}>{card.tone === 'ok' ? 'OK' : card.tone === 'warning' ? 'WARN' : card.tone === 'neutral' ? 'N/A' : 'DOWN'}</span>
                  </div>
                  <p className={styles.healthLabel}>{card.label}</p>
                  <p className={styles.healthValue}>{card.value}</p>
                  <p className={styles.healthDetail}>{card.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>DR Alert Center</h3>
                <p className={styles.sectionSubtitle}>System-level alerts that determine whether the service can survive an outage.</p>
              </div>
              <div className={styles.headerActions}>
                <span className={styles.unreadChip}>{unread} Unread</span>
                {unread > 0 && (
                  <button className={styles.btnGhost} onClick={markAllRead}>Mark All Read</button>
                )}
              </div>
            </div>

            <div className={styles.statRow}>
              {statCards.map((card) => (
                <div
                  key={card.key}
                  className={`${styles.statCard} ${styles[`statTone${card.tone}`]} ${statusFilter === card.key ? styles.statActive : ''}`}
                  onClick={() => setStatusFilter((prev) => (prev === card.key ? 'ALL' : card.key))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter((prev) => (prev === card.key ? 'ALL' : card.key)); }}
                  aria-pressed={statusFilter === card.key}
                >
                  <span className={styles.statValue}>{card.count}</span>
                  <span className={styles.statLabel}>{card.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.toolbar}>
              <div className={styles.tabRow}>
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'UNREAD', label: 'Unread' },
                  { key: 'READ', label: 'Read' },
                  { key: 'RESOLVED', label: 'Resolved' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className={`${styles.tab} ${statusFilter === tab.key ? styles.tabActive : ''}`}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    {tab.label} ({counts[tab.key]})
                  </button>
                ))}
              </div>
              <input
                className={styles.search}
                type="search"
                placeholder="Search DR alerts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search DR alerts"
              />
            </div>

            {alerts.length === 0 ? (
              <div className={styles.empty}>
                <div className={`${styles.emptyIcon} ${styles.emptyOk}`}>&#10003;</div>
                <p className={styles.emptyTitle}>No DR alerts</p>
                <p className={styles.emptyText}>No system alerts right now. Alerts for backups, storage, memory and recovery tests appear here.</p>
              </div>
            ) : scoped.length === 0 ? (
              <div className={styles.empty}>
                <div className={`${styles.emptyIcon} ${styles.emptyFilter}`}>&#9881;</div>
                <p className={styles.emptyTitle}>No matching alerts</p>
                <p className={styles.emptyText}>Try changing the status filter or search term.</p>
                <button
                  className={styles.btnPrimary}
                  onClick={() => { setStatusFilter('ALL'); setSearch(''); }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <p className={styles.resultInfo}>
                Showing {scoped.length === 1 ? '1 alert' : `${scoped.length} alerts`} · System module
              </p>
            )}

            {visible.length > 0 && (
              <ul className={styles.list}>
                {visible.map((alert) => {
                  const severityClass = TYPE_ORDER[alert.type] === 0 ? styles.cardCritical : TYPE_ORDER[alert.type] === 1 ? styles.cardWarning : styles.cardInfo;
                  const expanded = expandedId === alert.id;
                  return (
                    <li key={alert.id} className={`${styles.card} ${severityClass} ${alert.status === 'UNREAD' ? styles.cardUnread : ''}`}>
                      <div className={styles.severityBar} />
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div className={styles.cardMain}>
                            <div className={styles.cardTop}>
                              <span className={styles.typeBadge}>{alert.type}</span>
                              <h4 className={styles.cardTitle}>{alert.title}</h4>
                              <span className={`${styles.statusPill} ${styles[`statusPill${alert.status}`]}`}>{alert.status}</span>
                            </div>
                            <p className={styles.cardMessage}>{alert.message}</p>
                            <div className={styles.cardMeta}>
                              <span className={styles.metaChip}>{alert.module}</span>
                              <span className={styles.metaTime}>{relativeTime(alert.created_at)}</span>
                            </div>
                          </div>
                          <div className={styles.cardActions}>
                            <button
                              className={styles.btnDetails}
                              onClick={() => toggleDetails(alert.id)}
                              aria-expanded={expanded}
                            >
                              {expanded ? 'Hide Details' : 'Details'}
                            </button>
                            {alert.status === 'UNREAD' && (
                              <button className={styles.btnRead} onClick={() => markRead(alert)}>Mark Read</button>
                            )}
                            {alert.status !== 'RESOLVED' && (
                              <button className={styles.btnResolve} onClick={() => resolve(alert)}>Resolve</button>
                            )}
                          </div>
                        </div>
                        {expanded && (
                          <div className={styles.details} style={{ marginTop: 0 }}>
                            <div className={styles.detailsGrid}>
                            <div className={styles.detailsItem}>
                              <span className={styles.detailsLabel}>Severity</span>
                              <span className={styles.detailsValue}>{alert.type}</span>
                            </div>
                            <div className={styles.detailsItem}>
                              <span className={styles.detailsLabel}>Module</span>
                              <span className={styles.detailsValue}>{alert.module}</span>
                            </div>
                            <div className={styles.detailsItem}>
                              <span className={styles.detailsLabel}>Status</span>
                              <span className={styles.detailsValue}>{alert.status}</span>
                            </div>
                            <div className={styles.detailsItem}>
                              <span className={styles.detailsLabel}>Created</span>
                              <span className={styles.detailsValue}>{formatDateTime(alert.created_at)}</span>
                            </div>
                            {alert.target_role && (
                              <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Target</span>
                                <span className={styles.detailsValue}>{alert.target_role}</span>
                              </div>
                            )}
                            {alert.related_module && (
                              <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Related Record</span>
                                <span className={styles.detailsValue}>
                                  {alert.related_module}{alert.related_record_id ? ` · ${alert.related_record_id}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={styles.detailsMsg}>
                            <span className={styles.detailsLabel}>Full Details</span>
                            <p className={styles.detailsMsgText}>{alert.message}</p>
                          </div>
                          <div className={styles.detailsFooter}>
                            <span className={styles.detailsRef}>Ref: {alert.fingerprint || alert.id}</span>
                          </div>
                        </div>
                      )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.btnGhost} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>&larr; Prev</button>
                <span className={styles.pageInfo}>Page {safePage} of {totalPages}</span>
                <button className={styles.btnGhost} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next &rarr;</button>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>3-2-1 Backup Rule</h3>
                <p className={styles.sectionSubtitle}>3 copies, 2 different locations, 1 off-site. A backup exists ≠ a backup is restorable — test restores regularly.</p>
              </div>
            </div>
            <div className={styles.drillGrid}>
              {drillChecks.map((item) => (
                <div key={item.key} className={`${styles.drillCard} ${item.ok ? styles.drillOk : styles.drillWarn}`}>
                  <div className={styles.drillIcon}>{item.ok ? '\u2713' : '\u26A0'}</div>
                  <div className={styles.drillBody}>
                    <p className={styles.drillLabel}>{item.label}</p>
                    <p className={styles.drillValue}>{item.value}</p>
                    <p className={styles.drillDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Backup History</h3>
                <p className={styles.sectionSubtitle}>{backup.totalBackups || 0} backup(s) on disk · retention {backup.retentionDays || '—'} days{backup.cloudUploadEnabled ? ' · cloud upload enabled' : ''}</p>
              </div>
              <button className={styles.btnPrimary} onClick={runBackup} disabled={busy}>
                {busy ? 'Working…' : 'Run Backup Now'}
              </button>
            </div>

            {backups.length === 0 ? (
              <div className={styles.empty}>
                <div className={`${styles.emptyIcon} ${styles.emptyFilter}`}>&#9881;</div>
                <p className={styles.emptyTitle}>No backups found</p>
                <p className={styles.emptyText}>Run a backup to create your first recovery point.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Backup File</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr key={b.filename}>
                        <td className={styles.filename}>{b.filename}</td>
                        <td>
                          <span className={styles.badge}>{b.type || 'sql'}</span>
                        </td>
                        <td>{formatBytes(b.size)}</td>
                        <td>{relativeTime(b.created)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.btnGhost} onClick={() => { setRestoreTarget(b); setRestoreConfirm(''); }}>Restore</button>
                            <button className={styles.btnDangerGhost} onClick={() => setDeleteTarget(b)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Recovery Objectives &amp; Test</h3>
                <p className={styles.sectionSubtitle}>Rehearse restores to prove backups can bring the system back online.</p>
              </div>
              <button className={styles.btnOutline} onClick={initiateTest} disabled={busy}>
                {busy ? 'Working…' : 'Initiate Recovery Test'}
              </button>
            </div>

            <div className={styles.objGrid}>
              <div className={styles.objItem}>
                <span className={styles.objLabel}>RPO</span>
                <span className={styles.objValue}>{config.rpo || '—'}</span>
              </div>
              <div className={styles.objItem}>
                <span className={styles.objLabel}>RTO</span>
                <span className={styles.objValue}>{config.rto || '—'}</span>
              </div>
              <div className={styles.objItem}>
                <span className={styles.objLabel}>DR Site</span>
                <span className={styles.objValue}>{config.drSite || '—'}</span>
              </div>
              <div className={styles.objItem}>
                <span className={styles.objLabel}>Last Sync</span>
                <span className={styles.objValue}>{relativeTime(config.lastSync)}</span>
              </div>
            </div>

            {lastTest ? (
              <div className={styles.lastTest}>
                <div className={styles.lastTestRow}>
                  <span className={styles.lastTestLabel}>Last Test #{lastTest.id}</span>
                  <span className={`${styles.statusPill} ${styles[`statusTone${(lastTest.status || '').toLowerCase() === 'passed' || (lastTest.status || '').toLowerCase() === 'complete' ? 'ok' : (lastTest.status || '').toLowerCase() === 'failed' ? 'critical' : 'warning'}`]}`}>
                    {lastTest.status || '—'}
                  </span>
                </div>
                {lastTest.notes && <p className={styles.lastTestNotes}>{lastTest.notes}</p>}
                <p className={styles.lastTestMeta}>
                  Started {relativeTime(lastTest.created_at)}
                  {lastTest.completed_at ? ` · Completed ${relativeTime(lastTest.completed_at)}` : ''}
                </p>
              </div>
            ) : (
              <div className={styles.empty}>
                <div className={`${styles.emptyIcon} ${styles.emptyOk}`}>&#10003;</div>
                <p className={styles.emptyTitle}>No recovery test yet</p>
                <p className={styles.emptyText}>Run a test restore to prove your backup is restorable.</p>
              </div>
            )}
          </section>
        </>
      )}

      {testModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Complete Recovery Test</h3>
            <p className={styles.modalSubtitle}>Record the result of this restore rehearsal.</p>
            <form onSubmit={completeTest}>
              <div className={styles.formGroup}>
                <label htmlFor="dr-result">Result</label>
                <select
                  id="dr-result"
                  value={testForm.result}
                  onChange={(e) => setTestForm({ ...testForm, result: e.target.value })}
                >
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="dr-notes">Notes</label>
                <textarea
                  id="dr-notes"
                  rows={3}
                  value={testForm.notes}
                  onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                  placeholder="What did you verify, and any issues found?"
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary} disabled={busy}>Submit Result</button>
                <button type="button" className={styles.btnOutline} onClick={() => setTestModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restoreTarget && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Restore Backup</h3>
            <p className={styles.modalSubtitle}>
              Type <strong>RESTORE</strong> to confirm restoring <strong>{restoreTarget.filename}</strong>. The system will restart after completion.
            </p>
            <form onSubmit={restoreBackup}>
              <div className={styles.formGroup}>
                <label htmlFor="restore-confirm">Type RESTORE to confirm</label>
                <input
                  id="restore-confirm"
                  type="text"
                  value={restoreConfirm}
                  onChange={(e) => setRestoreConfirm(e.target.value)}
                  placeholder="RESTORE"
                  autoComplete="off"
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary} disabled={restoreConfirm !== 'RESTORE' || busy}>Start Restore</button>
                <button type="button" className={styles.btnOutline} onClick={() => setRestoreTarget(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Delete Backup</h3>
            <p className={styles.modalSubtitle}>
              Delete <strong>{deleteTarget.filename}</strong>? This removes a recovery point and cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button className={styles.btnDanger} onClick={deleteBackup} disabled={busy}>Delete Backup</button>
              <button className={styles.btnOutline} onClick={() => setDeleteTarget(null)}>Cancel</button>
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

export default DisasterRecovery;
