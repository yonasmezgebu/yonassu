import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './AlertCenter.module.css';

const PAGE_SIZE = 8;
const TYPE_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 };

const RELATED_LINKS = {
  supplier_bill: () => '/finance/supplier-bills',
  user: () => '/admin/users',
};

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

const AlertCenter = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await adminService.getAlerts();
      const data = res.data?.data || res.data || {};
      setAlerts(data.alerts || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch alerts.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    timerRef.current = setInterval(fetchAlerts, 60000);
    const onFocus = () => fetchAlerts();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAlerts]);

  const refresh = async () => {
    setLoading(true);
    await fetchAlerts();
    setLoading(false);
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
      showToast('All alerts marked as read.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update alerts.', 'error');
    }
  };

  const openRelated = (alert) => {
    const linkFn = RELATED_LINKS[alert.related_module];
    if (linkFn) navigate(linkFn(alert.related_record_id));
  };

  const toggleDetails = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const modules = useMemo(() => {
    const seen = new Set();
    alerts.forEach((a) => { if (a.module) seen.add(a.module); });
    return Array.from(seen).sort();
  }, [alerts]);

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts
      .filter((a) => {
        if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
        if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
        if (moduleFilter !== 'ALL' && a.module !== moduleFilter) return false;
        if (q) {
          const hay = `${a.title || ''} ${a.message || ''} ${a.module || ''} ${a.type || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const byType = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
        if (byType !== 0) return byType;
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [alerts, statusFilter, typeFilter, moduleFilter, search]);

  useEffect(() => { setPage(1); }, [statusFilter, typeFilter, moduleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = scoped.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = useMemo(() => {
    const base = alerts.filter(
      (a) => (typeFilter === 'ALL' || a.type === typeFilter) && (moduleFilter === 'ALL' || a.module === moduleFilter)
    );
    return {
      ALL: base.length,
      UNREAD: base.filter((a) => a.status === 'UNREAD').length,
      READ: base.filter((a) => a.status === 'READ').length,
      RESOLVED: base.filter((a) => a.status === 'RESOLVED').length,
    };
  }, [alerts, typeFilter, moduleFilter]);

  const severity = useMemo(() => ({
    CRITICAL: alerts.filter((a) => a.type === 'CRITICAL').length,
    WARNING: alerts.filter((a) => a.type === 'WARNING').length,
    INFO: alerts.filter((a) => a.type === 'INFO').length,
  }), [alerts]);

  const unread = alerts.filter((a) => a.status === 'UNREAD').length;

  const toggleType = (t) => setTypeFilter((prev) => (prev === t ? 'ALL' : t));

  const statCards = [
    { key: 'ALL', label: 'Total Alerts', count: alerts.length, tone: 'neutral' },
    { key: 'CRITICAL', label: 'Critical', count: severity.CRITICAL, tone: 'critical' },
    { key: 'WARNING', label: 'Warnings', count: severity.WARNING, tone: 'warning' },
    { key: 'INFO', label: 'Info', count: severity.INFO, tone: 'info' },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Alert Center</h2>
          <p className={styles.pageSubtitle}>Live, actionable items that need attention — separated from the audit log.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.liveChip}>
            <span className={styles.liveDot} />
            Live
          </span>
          {unread > 0 && <span className={styles.unreadChip}>{unread} Unread</span>}
          {alerts.some((a) => a.status === 'UNREAD') && (
            <button className={styles.btnGhost} onClick={markAllRead}>Mark All Read</button>
          )}
          <button className={styles.btnGhost} onClick={refresh}>Refresh</button>
        </div>
      </div>

      <div className={styles.statRow}>
        {statCards.map((card) => (
          <button
            key={card.key}
            className={`${styles.statCard} ${styles[`statTone${card.tone}`]} ${typeFilter === card.key ? styles.statActive : ''}`}
            onClick={() => card.key === 'ALL' ? setTypeFilter('ALL') : toggleType(card.key)}
            aria-pressed={typeFilter === card.key}
          >
            <span className={styles.statValue}>{card.count}</span>
            <span className={styles.statLabel}>{card.label}</span>
          </button>
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
        <div className={styles.filters}>
          <select
            className={styles.select}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            aria-label="Filter by module"
          >
            <option value="ALL">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            className={styles.search}
            type="search"
            placeholder="Search alerts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search alerts"
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading alerts…</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.empty}>
          <div className={`${styles.emptyIcon} ${styles.emptyOk}`}>&#10003;</div>
          <p className={styles.emptyTitle}>No alerts yet</p>
          <p className={styles.emptyText}>Alerts will appear here as soon as the system detects something that needs attention.</p>
        </div>
      ) : scoped.length === 0 ? (
        <div className={styles.empty}>
          <div className={`${styles.emptyIcon} ${styles.emptyFilter}`}>&#9881;</div>
          <p className={styles.emptyTitle}>No matching alerts</p>
          <p className={styles.emptyText}>Try changing the filters or search term.</p>
          <button
            className={styles.btnPrimary}
            onClick={() => { setStatusFilter('ALL'); setTypeFilter('ALL'); setModuleFilter('ALL'); setSearch(''); }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={styles.resultInfo}>
          Showing {scoped.length === 1 ? '1 alert' : `${scoped.length} alerts`} {moduleFilter !== 'ALL' ? `in ${moduleFilter}` : ''}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <ul className={styles.list}>
          {visible.map((alert) => {
            const severityClass = TYPE_ORDER[alert.type] === 0 ? styles.cardCritical : TYPE_ORDER[alert.type] === 1 ? styles.cardWarning : styles.cardInfo;
            const expanded = expandedId === alert.id;
            return (
              <li key={alert.id} className={`${styles.card} ${severityClass} ${alert.status === 'UNREAD' ? styles.cardUnread : ''}`}>
                <div className={styles.severityBar} />
                <div className={styles.cardMain}>
                  <div className={styles.cardTop}>
                    <span className={styles.typeBadge}>{alert.type}</span>
                    <h3 className={styles.cardTitle}>{alert.title}</h3>
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
                {expanded && (
                  <div className={styles.details}>
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
                      {RELATED_LINKS[alert.related_module] && (
                        <button className={styles.btnGhost} onClick={() => openRelated(alert)}>View Record</button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.btnGhost} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>&larr; Prev</button>
          <span className={styles.pageInfo}>Page {safePage} of {totalPages}</span>
          <button className={styles.btnGhost} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next &rarr;</button>
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

export default AlertCenter;
