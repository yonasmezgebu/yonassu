import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import auditService from '../../services/auditService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CentralAuditLog.module.css';

const CentralAuditLog = () => {
  const { user } = useAuth();

  /* ── role helpers ── */
  const roleStr = (Array.isArray(user?.roles) ? user.roles.join(',') : (user?.role_names || '')).toLowerCase();
  const deptStr = (user?.department || user?.department_name || '').toLowerCase();

  const isSuperAdmin = roleStr.includes('super admin') || roleStr.includes('admin');
  const isCEO        = roleStr.includes('ceo') || roleStr.includes('owner');
  const isManager    = roleStr.includes('manager') || roleStr.includes('head');
  const isHR         = !isSuperAdmin && !isCEO && (
    roleStr.includes('hr') || deptStr.includes('human resource') || deptStr.includes('hr')
  );
  const isStore      = !isSuperAdmin && !isCEO && roleStr.includes('store');

  // Lock modules based on role
  const lockedModule = isHR ? 'HR' : (isStore ? 'Store' : '');

  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [moduleFilter, setModuleFilter] = useState(lockedModule);
  const [page, setPage]               = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      // Always send the module filter — locked for HR, optional for others
      if (moduleFilter) params.module = moduleFilter;

      // apiClient interceptor already returns response.data, so res = { status, data: [...] }
      const res = await auditService.getLogs(params);
      const logs = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [search, moduleFilter, page]);

  const toggleRow = (id) => setExpandedRow(prev => (prev === id ? null : id));

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const safeParse = (val) => {
    if (!val) return 'None';
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>Security &amp; Compliance</span>
            </div>
            <h1 className={styles.pageTitle}>Central Audit Log</h1>
            <p className={styles.pageSubtitle}>
              {isHR
                ? 'HR department activity log — your department records only.'
                : isStore
                ? 'General Store activity log — your module records only.'
                : 'Append-only system record of all module activities.'}
            </p>
          </div>

          <button className={styles.exportBtn} onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Logs
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search user, record..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Module dropdown is only shown to Admin and CEO */}
        {(isSuperAdmin || isCEO) ? (
          <select
            className={styles.filterSelect}
            value={moduleFilter}
            onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Modules</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Store">Store</option>
            <option value="Procurement">Procurement</option>
            <option value="Sales">Sales</option>
            <option value="Inventory">Inventory</option>
            <option value="Admin">Admin</option>
          </select>
        ) : (
          <div className={styles.lockedBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {isHR ? 'HR Module Only' : (isStore ? 'Store Module Only' : 'Your Module Only')}
          </div>
        )}
      </div>

      <div className={styles.bodyArea}>
        {loading && logs.length === 0 ? (
          <div className={styles.loading}>
            <SegmentedSpinner size={40} label="Loading audit records..." />
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User &amp; Role</th>
                    {!isHR && <th>Module</th>}
                    <th>Action &amp; Record</th>
                    <th>Date &amp; IP</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={isHR ? 4 : 5} className={styles.empty}>No audit logs found.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr>
                          <td>
                            <div className={styles.logUser}>{log.user_name}</div>
                            <div className={styles.logRole}>{log.role} — {log.department}</div>
                          </td>
                          {!isHR && (
                            <td>
                              <span className={`${styles.moduleBadge} ${styles[`moduleBadge--${log.module}`] || ''}`}>{log.module}</span>
                            </td>
                          )}
                          <td>
                            <div className={styles.actionText}>{log.action}</div>
                            {log.action !== 'UPDATE' && <div className={styles.recordId}>{log.record_identifier || '—'}</div>}
                          </td>
                          <td>
                            <div className={styles.logDate}>{formatDate(log.created_at)}</div>
                            <div className={styles.logIp}>{log.ip_address || '—'}</div>
                          </td>
                          <td>
                            <button className={styles.viewBtn} onClick={() => toggleRow(log.id)}>
                              {expandedRow === log.id ? 'Hide Details' : 'View Changes'}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === log.id && (() => {
                          const getObj = (val) => {
                            if (!val) return null;
                            try {
                              const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                              return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : null;
                            } catch { return null; }
                          };
                          const pObj = getObj(log.previous_value);
                          const nObj = getObj(log.new_value);
                          
                          if (pObj || nObj) {
                            const keys = Array.from(new Set([...Object.keys(pObj || {}), ...Object.keys(nObj || {})]));
                            return (
                              <tr className={styles.detailsRow}>
                                <td colSpan={isHR ? 4 : 5}>
                                  <div className={styles.diffTableWrapper}>
                                    <table className={styles.diffTable}>
                                      <thead>
                                        <tr>
                                          <th>Field</th>
                                          <th>Previous Value</th>
                                          <th>New Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {keys.map(key => {
                                          const pv = pObj && pObj[key] !== undefined && pObj[key] !== null ? String(pObj[key]) : '—';
                                          const nv = nObj && nObj[key] !== undefined && nObj[key] !== null ? String(nObj[key]) : '—';
                                          const isChanged = pv !== nv && pObj !== null && nObj !== null;
                                          return (
                                            <tr key={key} className={isChanged ? styles.diffChangedRow : ''}>
                                              <td className={styles.diffField}>{key}</td>
                                              <td className={styles.diffValue}>{pv}</td>
                                              <td className={styles.diffValue}>{nv}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Fallback for arrays or raw strings
                          return (
                            <tr className={styles.detailsRow}>
                              <td colSpan={isHR ? 4 : 5}>
                                <div className={styles.diffContainer}>
                                  <div className={styles.diffBox}>
                                    <div className={styles.diffTitle}>Previous Value</div>
                                    <pre className={styles.diffCode}>{safeParse(log.previous_value)}</pre>
                                  </div>
                                  <div className={styles.diffBox}>
                                    <div className={styles.diffTitle}>New Value</div>
                                    <pre className={styles.diffCode}>{safeParse(log.new_value)}</pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                Showing page {page} {logs.length === 50 ? '(50 records)' : `(${logs.length} records)`}
              </div>
              <div className={styles.pageControls}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className={styles.pageBtn}
                  disabled={logs.length < 50}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default CentralAuditLog;
