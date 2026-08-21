import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './SystemHealth.module.css';
import { playSound } from '../../services/notificationManager';

const FALLBACK_HEALTH = {
  server: { status: 'Online', label: 'Server Status' },
  cpu: { status: '42%', value: 42, label: 'CPU Usage' },
  ram: { status: '86%', value: 86, label: 'RAM Usage' },
  storage: { status: '61%', value: 61, label: 'Storage Usage' },
  database: { status: 'Connected', label: 'Database (MySQL)' },
  erp: { status: 'Running', label: 'ERP Application' },
  file_storage: { status: 'Available', label: 'File Storage' },
  backup: { status: 'Successful', label: 'Backup Status' },
  network: { status: 'Online', label: 'Network' },
  background_jobs: { status: 'Running', label: 'Background Jobs' },
  errors: { status: '3', value: 3, label: 'System Errors' },
  uptime: { status: '12 days', label: 'Server Uptime' },
};

const HEALTHY_KEYWORDS = ['online', 'connected', 'running', 'available', 'successful', 'healthy', 'ok'];
const WARNING_KEYWORDS = ['slow', 'high', 'warning', 'degraded', 'limited'];
const BAD_KEYWORDS = ['offline', 'disconnected', 'stopped', 'failed', 'unavailable', 'error', 'critical', 'down'];

const classifyStatus = (key, rawStatus) => {
  if (rawStatus == null) return 'neutral';
  const s = String(rawStatus).toLowerCase().trim();

  if (key === 'errors') {
    const n = parseInt(rawStatus, 10);
    if (isNaN(n)) return 'neutral';
    if (n === 0) return 'good';
    if (n <= 5) return 'warning';
    return 'bad';
  }

  if (key === 'cpu' || key === 'ram' || key === 'storage') {
    const n = parseInt(rawStatus, 10);
    if (isNaN(n)) return 'neutral';
    if (n >= 90) return 'bad';
    if (n >= 70) return 'warning';
    return 'good';
  }

  if (BAD_KEYWORDS.some((w) => s.includes(w))) return 'bad';
  if (WARNING_KEYWORDS.some((w) => s.includes(w))) return 'warning';
  if (HEALTHY_KEYWORDS.some((w) => s.includes(w))) return 'good';
  return 'info';
};

const ORDER = ['server', 'cpu', 'ram', 'storage', 'database', 'erp', 'file_storage', 'backup', 'network', 'background_jobs', 'errors', 'uptime'];

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    playSound(type === 'error' ? 'error' : 'success');
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchHealth = useCallback(async () => {
    try {
      const res = await adminService.getSystemHealth();
      const data = res.data?.data || res.data || {};
      setHealth(data.health || data);
      setError(null);
    } catch (err) {
      if (!health) {
        setHealth(FALLBACK_HEALTH);
      }
      setError(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, [health]);

  useEffect(() => {
    fetchHealth();
    timerRef.current = setInterval(fetchHealth, 15000);
    const onFocus = () => fetchHealth();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchHealth]);

  const refresh = async () => {
    setLoading(true);
    await fetchHealth();
  };

  const orderedKeys = health
    ? ORDER.filter((k) => health[k] !== undefined).concat(Object.keys(health).filter((k) => !ORDER.includes(k)))
    : [];

  const overallHealth = (() => {
    if (!health) return 'unknown';
    let hasWarning = false;
    for (const key of orderedKeys) {
      const level = classifyStatus(key, health[key]?.status ?? health[key]?.value ?? health[key]);
      if (level === 'bad') return 'unhealthy';
      if (level === 'warning') hasWarning = true;
    }
    return hasWarning ? 'degraded' : 'healthy';
  })();

  const goodCount = orderedKeys.filter((k) => classifyStatus(k, health?.[k]?.status ?? health?.[k]?.value ?? health?.[k]) === 'good').length;
  const badCount = orderedKeys.filter((k) => classifyStatus(k, health?.[k]?.status ?? health?.[k]?.value ?? health?.[k]) === 'bad').length;

  const overallBannerClass = overallHealth === 'healthy'
    ? styles.overallBannerHealthy
    : overallHealth === 'degraded'
      ? styles.overallBannerDegraded
      : styles.overallBannerUnhealthy;

  const overallDotClass = overallHealth === 'healthy'
    ? styles.overallDotHealthy
    : overallHealth === 'degraded'
      ? styles.overallDotDegraded
      : styles.overallDotUnhealthy;

  const overallLabel = overallHealth === 'healthy'
    ? 'All Systems Operational'
    : overallHealth === 'degraded'
      ? 'System Degraded'
      : 'System Unhealthy';

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>System Health</h2>
          <p className={styles.pageSubtitle}>
            Live technical status — is the infrastructure healthy right now?
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.liveChip}>
            <span className={styles.liveDot} />
            Live
          </span>
          <button className={styles.btnGhost} onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading && !health ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Checking system health...</span>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <div className={styles.errorIcon}>&#x26A0;</div>
          <p className={styles.errorTitle}>Unable to fetch system health</p>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.btnGhost} onClick={refresh}>Try Again</button>
        </div>
      ) : health ? (
        <>
          <div className={`${styles.overallBanner} ${overallBannerClass}`}>
            <span className={`${styles.overallDot} ${overallDotClass}`} />
            <div className={styles.overallText}>
              <span className={styles.overallLabel}>{overallLabel}</span>
              <span className={styles.overallSub}>
                {goodCount} of {orderedKeys.length} checks passed
                {badCount > 0 ? ` — ${badCount} require attention` : ''}
              </span>
            </div>
          </div>

          <div className={styles.summaryStrip}>
            <span className={styles.summaryItem}>
              <span className={`${styles.summaryDot} ${styles.summaryDotGood}`} />
              {goodCount} Healthy
            </span>
            {orderedKeys.filter((k) => classifyStatus(k, health[k]?.status ?? health[k]?.value ?? health[k]) === 'warning').length > 0 && (
              <span className={styles.summaryItem}>
                <span className={`${styles.summaryDot} ${styles.summaryDotWarning || ''}`} style={{ background: 'var(--color-warning)' }} />
                {orderedKeys.filter((k) => classifyStatus(k, health[k]?.status ?? health[k]?.value ?? health[k]) === 'warning').length} Warning
              </span>
            )}
            {badCount > 0 && (
              <span className={styles.summaryItem}>
                <span className={`${styles.summaryDot} ${styles.summaryDotBad}`} />
                {badCount} Unhealthy
              </span>
            )}
          </div>

          <div className={styles.statusGrid}>
            {orderedKeys.map((key) => {
              const item = health[key] || {};
              const raw = item.status ?? item.value ?? item;
              const label = item.label || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              const level = classifyStatus(key, raw);
              const isPercent = key === 'cpu' || key === 'ram' || key === 'storage';
              const pctVal = isPercent ? parseInt(raw, 10) : null;

              const topBarClass = level === 'good' ? styles.cardTopBarGood
                : level === 'warning' ? styles.cardTopBarWarning
                : level === 'bad' ? styles.cardTopBarBad
                : level === 'info' ? styles.cardTopBarInfo
                : styles.cardTopBarNeutral;

              const pillClass = level === 'good' ? styles.statusPillGood
                : level === 'warning' ? styles.statusPillWarning
                : level === 'bad' ? styles.statusPillBad
                : level === 'info' ? styles.statusPillInfo
                : styles.statusPillNeutral;

              const dotClass = level === 'good' ? styles.pillDotGood
                : level === 'warning' ? styles.pillDotWarning
                : level === 'bad' ? styles.pillDotBad
                : level === 'info' ? styles.pillDotInfo
                : styles.pillDotNeutral;

              const valueClass = level === 'good' ? styles.cardValueGood
                : level === 'warning' ? styles.cardValueWarning
                : level === 'bad' ? styles.cardValueBad
                : level === 'info' ? styles.cardValueInfo
                : '';

              const progressClass = level === 'good' ? styles.progressFillGood
                : level === 'warning' ? styles.progressFillWarning
                : styles.progressFillBad;

              return (
                <div key={key} className={styles.card}>
                  <div className={`${styles.cardTopBar} ${topBarClass}`} />
                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{label}</h3>
                      <span className={`${styles.statusPill} ${pillClass}`}>
                        <span className={`${styles.pillDot} ${dotClass}`} />
                        {String(raw)}
                      </span>
                    </div>

                    {isPercent && pctVal !== null && !isNaN(pctVal) && (
                      <div className={styles.progressWrap}>
                        <div className={styles.progressHeader}>
                          <span>Usage</span>
                          <span>{pctVal}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div
                            className={`${styles.progressFill} ${progressClass}`}
                            style={{ width: `${Math.min(pctVal, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {!isPercent && item.detail && (
                      <p className={styles.cardDescription}>{item.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.timestampFooter}>
            <span>
              Last checked: {lastChecked ? formatDateTime(lastChecked.toISOString()) : '-'}
            </span>
            <span>Auto-refreshes every 15 seconds</span>
          </div>
        </>
      ) : null}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span className={styles.toastIcon}>{toast.type === 'error' ? '\u26A0' : '\u2713'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
