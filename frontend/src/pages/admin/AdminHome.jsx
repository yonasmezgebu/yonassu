import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatNumber, formatDate } from '../../utils/formatters';
import styles from './AdminHome.module.css';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const DIMENSIONS = [
  { key: 'alerts', label: 'Alert Center', color: '#DC2626', path: '/admin/alerts', icon: '\uD83D\uDD14' },
  { key: 'system_jobs', label: 'System Jobs', color: '#0284C7', path: '/admin/system-jobs', icon: '\u23F0' },
  { key: 'system_health', label: 'System Health', color: '#16A34A', path: '/admin/system-health', icon: '\uD83D\uDCCA' },
  { key: 'import_export', label: 'Import / Export', color: '#7C3AED', path: '/admin/import-export', icon: '\u2B07\uFE0F' },
  { key: 'backups', label: 'Backups', color: '#2563EB', path: '/admin/backups', icon: '\uD83D\uDCC1' },
  { key: 'dr', label: 'Disaster Recovery', color: '#57534e', path: '/admin/dr', icon: '\uD83D\uDEE1\uFE0F' },
  { key: 'maintenance', label: 'Maintenance', color: '#D97706', path: '/admin/maintenance', icon: '\uD83D\uDD27' },
  { key: 'integrations', label: 'Integrations', color: '#059669', path: '/admin/integrations', icon: '\uD83D\uDD17' },
  { key: 'settings', label: 'Settings', color: '#6B7280', path: '/admin/settings', icon: '\u2699\uFE0F' },
];

const AdminHome = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, healthRes, drRes, alertsRes] = await Promise.allSettled([
          adminService.getDashboardStats(),
          adminService.getSystemHealth(),
          adminService.getDRStatus(),
          adminService.getUnreadAlertCount(),
        ]);
        setDashboardData({
          stats: statsRes.status === 'fulfilled' ? statsRes.value?.data : null,
          health: healthRes.status === 'fulfilled' ? healthRes.value?.data : null,
          dr: drRes.status === 'fulfilled' ? drRes.value?.data : null,
          unreadAlerts: alertsRes.status === 'fulfilled' ? alertsRes.value?.data?.data?.unread || 0 : 0,
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const dimStatuses = useMemo(() => {
    const d = dashboardData;
    const drOk = d.dr?.lastTest?.status === 'passed';
    const alertCount = d.unreadAlerts || 0;
    return {
      alerts: { status: alertCount > 0 ? 'warning' : 'ok', count: alertCount },
      system_jobs: { status: 'ok', count: 0 },
      system_health: { status: 'ok', count: 0 },
      import_export: { status: 'ok', count: 0 },
      backups: { status: 'ok', count: 0 },
      dr: { status: drOk ? 'ok' : 'warning', count: d.dr?.lastTest ? 1 : 0 },
      maintenance: { status: 'ok', count: 0 },
      integrations: { status: 'ok', count: 0 },
      settings: { status: 'ok', count: 0 },
    };
  }, [dashboardData]);

  const dimStatusClass = { ok: styles.dimOk, warning: styles.dimWarning, info: styles.dimInfoS };
  const healthClass = { healthy: styles.fillHealthy, warning: styles.fillWarning, critical: styles.fillCritical };

  if (loading) return (
    <div className={styles.loading}>
      <div className="spinner-fiori" />
      <span>Loading dashboard...</span>
    </div>
  );

  const { stats, health } = dashboardData;
  const userStats = stats?.userStats || {};
  const sysHealth = health || {};
  const graphs = stats?.graphs || {};
  const backup = stats?.backupStatus || {};

  const bh = backup.backupHistory || graphs.backupHistory || { successful: 0, total: 30 };
  const backupPct = bh.total > 0 ? Math.round((bh.successful / bh.total) * 100) : 0;
  const backupColor = backupPct >= 97 ? '#10b981' : backupPct >= 90 ? '#f59e0b' : '#ef4444';

  const cpuVal = Math.round(sysHealth.cpu?.usage || 0);
  const memVal = Math.round(sysHealth.memory?.usage || 0);
  const diskVal = Math.round(sysHealth.disk?.usage || sysHealth.storage?.value || 0);

  return (
    <div className={styles.root}>
      {/* ── KPI Cards ── */}
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span className={styles.statLabel}>Total Users</span></div>
          <div className={styles.statValue}>{formatNumber(userStats.total || 0)}</div>
          <span className={`${styles.statBadge} ${styles.badgeInfo}`}>+{formatNumber(userStats.newToday || 0)} this month</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span className={styles.statLabel}>Active Sessions</span></div>
          <div className={styles.statValue}>{stats?.activeSessions || 0}</div>
          <span className={`${styles.statBadge} ${(stats?.activeSessions || 0) > 20 ? styles.badgeWarning : styles.badgeUp}`}>
            {(stats?.activeSessions || 0) > 20 ? 'High' : 'Normal'}
          </span>
        </div>
        <div className={`${styles.statCard} ${styles.accentPurple}`}>
          <div className={styles.statContent}>
            <h3>{formatNumber(userStats.newToday || 0)}</h3>
            <p>New Today</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.accentOrange}`}>
          <div className={styles.statContent}>
            <h3>{DIMENSIONS.length}</h3>
            <p>Admin Modules</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span className={styles.statLabel}>Unread Alerts</span></div>
          <div className={styles.statValue}>{dashboardData.unreadAlerts || 0}</div>
          {(dashboardData.unreadAlerts || 0) > 0 && (
            <span className={`${styles.statBadge} ${styles.badgeWarning}`}>Review required</span>
          )}
          {(dashboardData.unreadAlerts || 0) === 0 && (
            <span className={`${styles.statBadge} ${styles.badgeUp}`}>All clear</span>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span className={styles.statLabel}>Pending Actions</span></div>
          <div className={styles.statValue}>
            {((stats?.pendingActions?.pendingOrders?.count || 0) + (stats?.pendingActions?.lowStockItems || 0))}
          </div>
          {((stats?.pendingActions?.pendingOrders?.count || 0) + (stats?.pendingActions?.lowStockItems || 0)) > 0 && (
            <span className={`${styles.statBadge} ${styles.badgeDown}`}>Action needed</span>
          )}
        </div>
      </div>

      <div className={styles.twoColGrid}>
        <div className={styles.widget}>
          <h2>System Modules</h2>
          <div className={styles.dimensionGrid}>
            {DIMENSIONS.map(dim => {
              const s = dimStatuses[dim.key] || { status: 'info', count: 0 };
              return (
                <Link to={dim.path} key={dim.key} className={`${styles.dimensionCard} ${dimStatusClass[s.status] || styles.dimInfoS}`}>
                  <div className={styles.dimIndicator} style={{ backgroundColor: dim.color }} />
                  <div className={styles.dimInfo}>
                    <span className={styles.dimLabel}>{dim.icon} {dim.label}</span>
                    <span className={styles.dimCount}>
                      {s.count > 0 ? `${s.count} item${s.count !== 1 ? 's' : ''}` : 'Operational'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={styles.widget}>
          <h2>System Status</h2>
          <div className={styles.healthMetrics}>
            <div className={styles.healthBar}>
              <label>CPU ({cpuVal}%)</label>
              <div className={styles.progressBg}>
                <div className={`${styles.progressFill} ${healthClass[sysHealth.cpu?.status || 'healthy'] || styles.fillHealthy}`} style={{ width: `${cpuVal}%` }} />
              </div>
            </div>
            <div className={styles.healthBar}>
              <label>Memory ({memVal}%)</label>
              <div className={styles.progressBg}>
                <div className={`${styles.progressFill} ${healthClass[sysHealth.memory?.status || 'healthy'] || styles.fillHealthy}`} style={{ width: `${memVal}%` }} />
              </div>
            </div>
            <div className={styles.healthBar}>
              <label>Disk ({diskVal}%)</label>
              <div className={styles.progressBg}>
                <div className={`${styles.progressFill} ${healthClass[sysHealth.disk?.status || 'healthy'] || styles.fillHealthy}`} style={{ width: `${diskVal}%` }} />
              </div>
            </div>
          </div>
          <h3 className={styles.alertsTitle}>System Alerts</h3>
          <div className={styles.alertList}>
            {(dashboardData.unreadAlerts || 0) > 0 && (
              <Link to="/admin/alerts" className={`${styles.alertItem} ${styles.alertWarning}`}>
                {dashboardData.unreadAlerts} unread alert{dashboardData.unreadAlerts !== 1 ? 's' : ''} — Review required
              </Link>
            )}
            {dimStatuses.dr?.status === 'warning' && (
              <Link to="/admin/dr" className={`${styles.alertItem} ${styles.alertWarning}`}>DR: No recent test passed</Link>
            )}
            {(dashboardData.unreadAlerts || 0) === 0 && dimStatuses.dr?.status === 'ok' && (
              <div className={`${styles.alertItem} ${styles.alertOk}`}>All systems operational</div>
            )}
          </div>
        </div>
      </div>

      {/* ── 6 Graphs ── */}
      <div className={styles.chartsGrid}>
        <div className="card">
          <h3 className={styles.graphTitle}>System Uptime</h3>
          <p className={styles.graphSub}>6-month availability trend</p>
          {graphs.uptimeHistory && graphs.uptimeHistory.length > 0 && (
            <>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphs.uptimeHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[96, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'Uptime']} />
                    <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`${styles.statBadge} ${styles.badgeUp}`}>
                  {graphs.uptimeHistory[graphs.uptimeHistory.length - 1]?.uptime.toFixed(1)}% &#x2713; Good
                </span>
                <span className={styles.graphTarget}>Target: 99%</span>
              </div>
            </>
          )}
          {!graphs.uptimeHistory && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              No uptime data available yet.
            </div>
          )}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h3 className={styles.graphTitle} style={{ textAlign: 'left' }}>Backup Success Rate</h3>
          <p className={styles.graphSub} style={{ textAlign: 'left' }}>30-day rolling</p>
          {bh.total > 0 && (
            <>
              <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 12px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Successful', value: bh.successful },
                      { name: 'Failed', value: Math.max(0, bh.total - bh.successful) }
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value">
                      <Cell fill={backupColor} />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div className={styles.donutValue} style={{ color: backupColor }}>{backupPct}%</div>
                  <div className={styles.donutLabel}>success</div>
                </div>
              </div>
              <div className={styles.graphMeta}>
                <strong>{bh.successful}/{bh.total}</strong> Successful
              </div>
              <div className={styles.graphMetaSmall} style={{ marginTop: 4 }}>
                Last: {bh.lastSuccess ? formatDate(bh.lastSuccess) : 'N/A'} &middot; Next: {backup.nextBackup || 'Not scheduled'}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3 className={styles.graphTitle}>Intrusion Attempts</h3>
          <p className={styles.graphSub}>Failed logins (last 7 days)</p>
          {graphs.intrusionHistory && graphs.intrusionHistory.length > 0 && (
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs.intrusionHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={v => [v, 'Attempts']} />
                  <Bar dataKey="attempts" radius={[4, 4, 0, 0]}>
                    {graphs.intrusionHistory.map((entry, idx) => (
                      <Cell key={idx} fill={entry.attempts > 10 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className={styles.chartLegend}>
            <span>Total: <strong>{graphs.intrusionHistory?.reduce((s, d) => s + d.attempts, 0) || 0}</strong></span>
            <span>Critical: <strong style={{ color: '#ef4444' }}>{graphs.intrusionHistory?.filter(d => d.attempts > 10).length || 0}</strong></span>
          </div>
        </div>

        <div className="card">
          <h3 className={styles.graphTitle}>CPU &amp; Memory Usage</h3>
          <p className={styles.graphSub}>24-hour trend</p>
          {graphs.cpuMemHistory && graphs.cpuMemHistory.length > 0 && (
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphs.cpuMemHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" name="CPU" />
                  <Area type="monotone" dataKey="memory" stroke="#10b981" fill="rgba(16,185,129,0.15)" name="Memory" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className={styles.chartLegend}>
            <span>CPU: <strong>{cpuVal}%</strong></span>
            <span>RAM: <strong>{memVal}%</strong></span>
            <span>Disk: <strong>{diskVal}%</strong></span>
          </div>
        </div>

        <div className="card">
          <h3 className={styles.graphTitle}>Patch Compliance</h3>
          <p className={styles.graphSub}>Systems patch status</p>
          {graphs.patchCompliance && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div className={styles.progressRow}>
                  <span>Overall</span>
                  <span>{graphs.patchCompliance.patched}/{graphs.patchCompliance.patched + graphs.patchCompliance.unpatched} patched</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFillInline} style={{ width: `${(graphs.patchCompliance.patched / (graphs.patchCompliance.patched + graphs.patchCompliance.unpatched || 1)) * 100}%`, background: '#10b981' }} />
                </div>
              </div>
              <div>
                <div className={styles.progressRow}>
                  <span>Critical Systems</span>
                  <span>{graphs.patchCompliance.criticalPatched}% patched</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFillInline} style={{ width: `${graphs.patchCompliance.criticalPatched}%`, background: '#3b82f6' }} />
                </div>
              </div>
              <div className={styles.graphMetaSmall} style={{ marginTop: 8 }}>
                Target: 95% &middot; {graphs.patchCompliance.unpatched > 0 ? `${graphs.patchCompliance.unpatched} system(s) need update` : 'All systems up to date'}
              </div>
            </>
          )}
          {!graphs.patchCompliance && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              No patch data available yet.
            </div>
          )}
        </div>

        <div className="card">
          <h3 className={styles.graphTitle}>Incident MTTR</h3>
          <p className={styles.graphSub}>Mean time to resolution (6-month trend)</p>
          {graphs.mttrHistory && graphs.mttrHistory.length > 0 && (
            <>
              <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphs.mttrHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 8]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip formatter={v => [`${v.toFixed(1)} hrs`, 'MTTR']} />
                    <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`${styles.statBadge} ${styles.badgeUp}`}>
                  {graphs.mttrHistory[graphs.mttrHistory.length - 1]?.hours.toFixed(1)} hrs &#x2713; Good
                </span>
                <span className={styles.graphTarget}>Target: &lt; 4 hrs</span>
              </div>
            </>
          )}
          {!graphs.mttrHistory && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              No MTTR data available yet.
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.widget} ${styles.quickAccess}`}>
        <h2>Quick Access</h2>
        <div className={styles.quickLinks}>
          {DIMENSIONS.map(dim => (
            <Link key={dim.key} to={dim.path} className={styles.quickLink} style={{ borderLeftColor: dim.color }}>
              <span>{dim.icon} {dim.label}</span>
              <span className={styles.arrow}>&rarr;</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── System Health Row ── */}
      <div className="card" style={{ marginBottom: 20, padding: 24 }}>
        <h3 className={styles.graphTitle}>System Health</h3>
        <div className={styles.healthGrid}>
          {[
            { label: 'CPU Usage', value: cpuVal, status: sysHealth.cpu?.status || 'healthy' },
            { label: 'Memory Usage', value: memVal, status: sysHealth.memory?.status || 'healthy' },
            { label: 'Disk Usage', value: diskVal, status: sysHealth.disk?.status || 'healthy' }
          ].map(item => (
            <div key={item.label}>
              <div className={styles.progressRow}>
                <span>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.value}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFillInline} style={{
                  width: `${Math.min(item.value, 100)}%`,
                  background: item.value > 80 ? '#ef4444' : item.value > 60 ? '#f59e0b' : '#10b981'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Audit Logs ── */}
      <div className="card" style={{ padding: 24 }}>
        <div className={styles.tableHeaderRow}>
          <h3 className={styles.sectionTitle}>Recent Audit Logs</h3>
          <Link to="/admin/audit" className={styles.viewAll}>View All &rarr;</Link>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.auditTable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentAudits || []).map(log => (
                <tr key={log.id}>
                  <td className={styles.auditCellTime}>{formatDate(log.created_at)}</td>
                  <td className={styles.auditCellUser}>{log.full_name || 'System'}</td>
                  <td>
                    <span className={`${styles.actionBadge} ${log.action?.includes('FAIL') ? styles.actionBadgeFail : ''}`}>{log.action}</span>
                  </td>
                  <td className={styles.auditCellResource}>{log.resource || '-'}</td>
                  <td className={styles.auditCellIp}>{log.ip_address}</td>
                </tr>
              ))}
              {(stats?.recentAudits || []).length === 0 && (
                <tr><td colSpan={5} className={styles.auditEmpty}>No recent activity found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
