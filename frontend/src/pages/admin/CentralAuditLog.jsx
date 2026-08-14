import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import auditService from '../../services/auditService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CentralAuditLog.module.css';

const CentralAuditLog = ({ fixedModule, mode }) => {
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
  
  const isPharmacy   = !isSuperAdmin && !isCEO && (
    roleStr.includes('pharmacy') || deptStr.includes('pharmacy')
  );
  // Ensure "pharmacy store" doesn't trigger isStore by checking !isPharmacy
  const isStore      = !isSuperAdmin && !isCEO && !isPharmacy && roleStr.includes('store');
  
  const isSales      = !isSuperAdmin && !isCEO && (
    roleStr.includes('sales') || deptStr.includes('sales') || deptStr.includes('retail')
  );
  const isPrinting   = !isSuperAdmin && !isCEO && (
    roleStr.includes('printing') || deptStr.includes('printing')
  );
  const isCarRental  = !isSuperAdmin && !isCEO && (
    roleStr.includes('car rental') || roleStr.includes('car renting') ||
    deptStr.includes('car rental') || deptStr.includes('car renting')
  );

  // Lock modules based on role — HR and Store are locked to their module.
  // Printing follows the Sales pattern: module records plus own activity.
  const lockedModule = fixedModule || (isHR ? 'HR' : (isPharmacy ? 'Pharmacy' : (isStore ? 'Store' : '')));
  const isLocked     = !!lockedModule;

  // Finance dashboard mode — renders a clear, human-readable message for every
  // activity (including transfers/payments) instead of the generic fallback.
  const financeMode  = mode === 'finance';

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
    if (val === null || val === undefined || val === '') return '—';
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(val);
    }
  };

  // Fields that add no audit value — skip them in the change diff
  const IGNORE_KEYS = new Set([
    'id', 'created_at', 'updated_at', 'timestamp', 'createdAt', 'updatedAt',
    'password', 'currentPassword', 'newPassword', 'two_factor_secret', 'token',
  ]);

  // Tone per action — drives the row + action label colors
  const actionTone = (action = '') => {
    const a = action.toLowerCase();
    if (/created|added|registered|recorded|set$|opened|posted/.test(a)) return 'create';
    if (/updated|changed|toggled|adjusted|extended|modified|renewed|emailed/.test(a)) return 'update';
    if (/deleted|cancelled|rejected|disqualified|voided|removed|retracted|archived|terminated/.test(a)) return 'delete';
    if (/approved|published|submitted|released|sent|completed|converted|finalized|verified|closed|awarded|forwarded|paid|generated|accepted/.test(a)) return 'status';
    return 'other';
  };

  // Build a clear, human-readable sentence for any activity so records are never
  // shown as a bare code or the old "simple event" placeholder. Subjects are
  // matched longest-first so e.g. "BANK_TRANSACTION_CREATED" reads as a bank
  // transfer, "PO_PAYMENT_PROCESSED" as a purchase order payment, etc.
  const SUBJECT_NAMES = [
    ['BANK_TRANSACTION', 'bank transfer'],
    ['STORE_TRANSFER',   'stock transfer'],
    ['PURCHASE_ORDER',   'purchase order'],
    ['PO_PAYMENT',       'purchase order payment'],
    ['INVOICE_PAYMENT',  'invoice payment'],
    ['PETTY_CASH',       'petty cash'],
    ['TRANSFER',         'transfer'],
    ['PAYROLL',          'payroll'],
    ['SALARY',           'salary'],
    ['BUDGET',           'budget'],
    ['EXPENSE',          'expense'],
    ['PAYMENT',          'payment'],
    ['INVOICE',          'invoice'],
    ['PAYABLE',          'payable'],
    ['RECEIVABLE',       'receivable'],
    ['CASH',             'cash'],
    ['BANK',             'bank'],
  ];
  const VERB_NAMES = {
    CREATED: 'created', ADDED: 'added', REGISTERED: 'registered', RECORDED: 'recorded',
    SUBMITTED: 'submitted', POSTED: 'posted', OPENED: 'opened', GENERATED: 'generated',
    UPDATED: 'updated', CHANGED: 'changed', MODIFIED: 'modified', EDITED: 'edited',
    ADJUSTED: 'adjusted', TOGGLED: 'toggled', EXTENDED: 'extended', RENEWED: 'renewed',
    DELETED: 'deleted', REMOVED: 'removed', VOIDED: 'voided', CANCELLED: 'cancelled',
    REJECTED: 'rejected', ARCHIVED: 'archived', TERMINATED: 'terminated',
    APPROVED: 'approved', PUBLISHED: 'published', RELEASED: 'released', SENT: 'sent',
    COMPLETED: 'completed', CONVERTED: 'converted', FINALIZED: 'finalized',
    VERIFIED: 'verified', CLOSED: 'closed', AWARDED: 'awarded', FORWARDED: 'forwarded',
    ACCEPTED: 'accepted', PROCESSED: 'processed', DISBURSED: 'disbursed',
    RECEIVED: 'received', CONFIRMED: 'confirmed', PAID: 'paid',
    TRANSFERRED: 'transferred', RETURNED: 'returned', RESUMED: 'resumed',
  };

  const describeAction = (action = '', record = '') => {
    const raw = String(action || '').trim();
    const upper = raw.toUpperCase();
    let base = raw;
    let matched = false;
    for (const [prefix, name] of SUBJECT_NAMES) {
      if (!upper.startsWith(prefix)) continue;
      const rest = upper.slice(prefix.length).replace(/^_+/, '');
      let verb = '';
      for (const [v, label] of Object.entries(VERB_NAMES)) {
        if (rest.startsWith(v)) { verb = label; break; }
      }
      if (verb) base = `${name} ${verb}`;
      else if (rest) base = `${name} ${rest.toLowerCase().replace(/_+/g, ' ')}`;
      else base = `${name} recorded`;
      matched = true;
      break;
    }
    if (!matched) {
      let s = raw.replace(/^[A-Z][A-Z0-9]*_/, '');
      base = s.toLowerCase().replace(/_+/g, ' ').trim();
      if (!base) base = 'Activity recorded';
    }
    base = base.charAt(0).toUpperCase() + base.slice(1);
    const suffix = record ? ` — ${record}` : '';
    return `${base}${suffix}`;
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
                : isPharmacy
                ? 'Pharmacy activity log — your module records only.'
                : isPrinting
                ? 'Printing department activity log — all printing module records plus your own actions.'
                : isSales
                ? 'Sales activity log — all sales module records plus your own actions.'
                : isCarRental
                ? 'Car & Agri Rental activity log — your department records only.'
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

        {/* Module dropdown is only shown to Admin and CEO, unless hard-locked via props */}
        {(isSuperAdmin || isCEO) && !fixedModule ? (
          <select
            className={styles.filterSelect}
            value={moduleFilter}
            onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Modules</option>
            <option value="HR">HR</option>
            <option value="Printing">Printing</option>
            <option value="Finance">Finance</option>
            <option value="Pharmacy Store">Pharmacy Store</option>
            <option value="Pharmacy Sales">Pharmacy Sales</option>
            <option value="Pharmacy">Pharmacy (Legacy)</option>
            <option value="Store">Store</option>
            <option value="Car Rental">Car Rental</option>
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
            {isHR ? 'HR Module Only' : (isStore ? 'Store Module Only' : (isPharmacy ? 'Pharmacy Module Only' : (isPrinting ? 'Printing Module + Your Activity' : (isSales ? 'Sales Module + Your Activity' : 'Your Module Only'))))}
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
                    {!isLocked && <th>Module</th>}
                    <th>Action &amp; Record</th>
                    <th>Date &amp; IP</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={isLocked ? 4 : 5} className={styles.empty}>No audit logs found.</td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const tone = actionTone(log.action);
                      return (
                      <React.Fragment key={log.id}>
                        <tr className={styles[`row--${tone}`]}>
                          <td>
                            <div className={styles.logUser}>{log.user_name}</div>
                            <div className={styles.logRole}>{log.role} — {log.department}</div>
                          </td>
                          {!isLocked && (
                            <td>
                              <span className={`${styles.moduleBadge} ${styles[`moduleBadge--${String(log.module || '').replace(/\s+/g, '')}`] || ''}`}>{log.module}</span>
                            </td>
                          )}
                          <td>
                            <div className={`${styles.actionText} ${styles[`actionText--${tone}`] || ''}`}>{log.action}</div>
                            {financeMode && (
                              <div className={styles.logDescription}>{describeAction(log.action, log.record_identifier)}</div>
                            )}
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
                            const keys = Array.from(new Set([...Object.keys(pObj || {}), ...Object.keys(nObj || {})]))
                              .filter(k => !IGNORE_KEYS.has(k));
                            const changedKeys = pObj && nObj
                              ? keys.filter(k => String(pObj[k] ?? '') !== String(nObj[k] ?? ''))
                              : keys;
                            return (
                              <tr className={styles.detailsRow}>
                                <td colSpan={isLocked ? 4 : 5}>
                                  {changedKeys.length === 0 ? (
                                    <div className={styles.diffBox} style={{ textAlign: 'center' }}>
                                      <div className={styles.diffTitle}>Value Snapshot</div>
                                      <pre className={styles.diffCode}>No field values changed in this update (recorded for reference only).</pre>
                                    </div>
                                  ) : (
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
                                        {changedKeys.map(key => {
                                          const pv = pObj && pObj[key] !== undefined && pObj[key] !== null ? String(pObj[key]) : '—';
                                          const nv = nObj && nObj[key] !== undefined && nObj[key] !== null ? String(nObj[key]) : '—';
                                          const isChanged = pv !== nv && pObj !== null && nObj !== null;
                                          return (
                                            <tr key={key} className={isChanged ? styles.diffChangedRow : ''}>
                                              <td className={styles.diffField}>{key}</td>
                                              <td className={isChanged ? `${styles.diffValue} ${styles.diffPrev}` : styles.diffValue}>{pv}</td>
                                              <td className={isChanged ? `${styles.diffValue} ${styles.diffNew}` : styles.diffValue}>{nv}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          }

                          // Fallback for arrays or raw strings
                          const hasAnyValue = log.previous_value != null || log.new_value != null;
                          return (
                            <tr className={styles.detailsRow}>
                              <td colSpan={isLocked ? 4 : 5}>
                                {!hasAnyValue ? (
                                  <div className={styles.diffBox} style={{ textAlign: 'center' }}>
                                    <div className={styles.diffTitle}>Activity Detail</div>
                                    {financeMode ? (
                                      <>
                                        <p className={styles.diffSummary}>{describeAction(log.action, log.record_identifier)}</p>
                                        <pre className={styles.diffCode}>
                                          Performed by {log.user_name} ({log.role}){log.department && log.department !== 'Unknown' ? ` · ${log.department}` : ''} · {formatDate(log.created_at)}
                                          {log.ip_address ? ` · IP ${log.ip_address}` : ''}
                                        </pre>
                                      </>
                                    ) : (
                                      <pre className={styles.diffCode}>This is a simple event log. No extended payload or before/after snapshot was recorded for this specific action.</pre>
                                    )}
                                  </div>
                                ) : (
                                  <div className={styles.diffContainer}>
                                    {log.previous_value != null && (
                                      <div className={styles.diffBox}>
                                        <div className={styles.diffTitle}>Previous Value</div>
                                        <pre className={styles.diffCode}>{safeParse(log.previous_value)}</pre>
                                      </div>
                                    )}
                                    {log.new_value != null && (
                                      <div className={styles.diffBox}>
                                        <div className={styles.diffTitle}>{log.previous_value == null ? 'Action Payload (Snapshot)' : 'New Value'}</div>
                                        <pre className={styles.diffCode}>{safeParse(log.new_value)}</pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                         })()}
                      </React.Fragment>
                      );
                    })
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
