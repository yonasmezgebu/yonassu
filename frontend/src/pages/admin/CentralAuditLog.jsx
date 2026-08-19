import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import auditService from '../../services/auditService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CentralAuditLog.module.css';

const ACTION_FILTER_GROUPS = [
  { label: 'All Actions', value: '' },
  { label: '─── Authentication ───', value: '__divider__', disabled: true },
  { label: '🔐 Login Success',        value: 'LOGIN_SUCCESS' },
  { label: '🔐 Login Failed',         value: 'LOGIN_FAILED' },
  { label: '🔐 Login Blocked',        value: 'LOGIN_BLOCKED_LOCKOUT' },
  { label: '🔐 Logout',               value: 'LOGOUT' },
  { label: '🔐 Session Evicted',      value: 'SESSION_EVICTED' },
  { label: '─── User Management ───', value: '__divider__', disabled: true },
  { label: '👤 User Created',         value: 'USER_CREATED' },
  { label: '👤 User Registered',      value: 'USER_REGISTERED' },
  { label: '👤 User Updated',         value: 'USER_UPDATED' },
  { label: '👤 User Deleted',         value: 'USER_DELETED' },
  { label: '👤 User Restored',        value: 'USER_RESTORED' },
  { label: '👤 User Promoted',        value: 'USER_PROMOTED_TO_EMPLOYEE' },
  { label: '─── Roles & Permissions ─', value: '__divider__', disabled: true },
  { label: '🔑 Role Assigned',        value: 'ROLE_ASSIGNED' },
  { label: '🔑 Role Removed',         value: 'ROLE_REMOVED' },
  { label: '🔑 Role Revoked',         value: 'ROLE_REVOKED' },
  { label: '🔑 Custom Role Created',  value: 'CUSTOM_ROLE_CREATED' },
  { label: '🔑 Custom Role Assigned', value: 'CUSTOM_ROLE_ASSIGNED' },
  { label: '─── Password ───',        value: '__divider__', disabled: true },
  { label: '🔒 Password Changed',     value: 'PASSWORD_CHANGED' },
  { label: '🔒 Force Password Reset', value: 'FORCE_PASSWORD_RESET' },
  { label: '🔒 Password Reset Done',  value: 'PASSWORD_RESET_COMPLETED' },
  { label: '─── System ───',          value: '__divider__', disabled: true },
  { label: '⚙️ Settings Updated',     value: 'SETTINGS_UPDATED' },
  { label: '⚙️ Backup Created',       value: 'BACKUP_CREATED' },
  { label: '⚙️ Break-Glass Activated',value: 'BREAK_GLASS_ACTIVATED' },
  { label: '─── Operations ───',      value: '__divider__', disabled: true },
  { label: '📦 Stock Adjustment',     value: 'STOCK_ADJUST' },
  { label: '💰 Payment Processed',    value: 'PAYMENT_PROCESSED' },
  { label: '📋 PO Created',           value: 'PO_CREATED' },
  { label: '✅ PO Approved',           value: 'PO_APPROVED' },
  { label: '─── General Procurement ─', value: '__divider__', disabled: true },
  { label: '🚛 Procurement Requested',  value: 'CREATE_GENERAL_PROCUREMENT' },
  { label: '✅ CEO Approved Procurement',value: 'CEO_APPROVE_GENERAL_PROCUREMENT' },
  { label: '⏸ CEO Put on Hold',        value: 'CEO_WAIT_GENERAL_PROCUREMENT' },
  { label: '❌ CEO Rejected Procurement',value: 'CEO_REJECT_GENERAL_PROCUREMENT' },
  { label: '─── Purchase & Sourcing ─', value: '__divider__', disabled: true },
  { label: '📝 Purchase Request Created',value: 'PURCHASE_REQUEST_CREATED' },
  { label: '📝 Purchase Request Approved',value:'PURCHASE_REQUEST_APPROVED' },
  { label: '📋 PO Created',           value: 'PURCHASE_ORDER_CREATED' },
  { label: '✅ PO Approved',          value: 'PURCHASE_ORDER_APPROVED' },
  { label: '🏢 Supplier Registered',  value: 'SUPPLIER_REGISTERED' },
  { label: '📢 Tender Published',     value: 'SMART_TENDER_PUBLISHED' },
  { label: '📄 Quotation Submitted',  value: 'SUPPLIER_QUOTATION_SUBMITTED' },
  { label: '─── Employee Portal ───', value: '__divider__', disabled: true },
  { label: '📋 Task Assigned',        value: 'EMPLOYEE_TASK_ASSIGNED' },
  { label: '📝 Report Submitted',     value: 'EMPLOYEE_REPORT_SUBMITTED' },
];

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
  const [pageInput, setPageInput]     = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;

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
  }, [search, moduleFilter, actionFilter, page]);

  const toggleRow = (id) => setExpandedRow(prev => (prev === id ? null : id));

  const goToPage = (e) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!Number.isNaN(p) && p >= 1) setPage(p);
    setPageInput('');
  };

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
  const FIXED_DESCRIPTIONS = {
    'LOGIN_SUCCESS':              '🔐 User logged in successfully',
    'LOGIN_FAILED':               '🔐 Login attempt failed (wrong password)',
    'LOGIN_BLOCKED_LOCKOUT':      '🔐 Login blocked — account locked out',
    'LOGOUT':                     '🔐 User logged out',
    'SESSION_EVICTED':            '🔐 Session evicted (max concurrent sessions reached)',
    'USER_CREATED':               '👤 New user account created',
    'USER_REGISTERED':            '👤 User self-registered',
    'USER_UPDATED':               '👤 User profile updated',
    'USER_DELETED':               '👤 User account disabled/deleted',
    'USER_RESTORED':              '👤 User account restored',
    'USER_PROMOTED_TO_EMPLOYEE':  '👤 User promoted to Employee status',
    'USERS_EXPORTED':             '👤 User list exported',
    'ROLE_ASSIGNED':              '🔑 Role assigned to user',
    'ROLE_REMOVED':               '🔑 Role removed from user',
    'ROLE_REVOKED':               '🔑 Role revoked from user',
    'CUSTOM_ROLE_CREATED':        '🔑 Custom role created',
    'CUSTOM_ROLE_ASSIGNED':       '🔑 Custom role assigned to user',
    'PASSWORD_CHANGED':           '🔒 Password changed',
    'FORCE_PASSWORD_RESET':       '🔒 Admin forced password reset',
    'PASSWORD_RESET_REQUESTED':   '🔒 Password reset requested',
    'PASSWORD_RESET_COMPLETED':   '🔒 Password reset completed',
    'SETTINGS_UPDATED':           '⚙️ System settings updated',
    'SETTING_UPDATED':            '⚙️ Setting updated',
    'SETTINGS_RESET':             '⚙️ Settings reset to defaults',
    'BACKUP_CREATED':             '⚙️ Database backup created',
    'BACKUP_DELETED':             '⚙️ Backup file deleted',
    'BREAK_GLASS_ACTIVATED':      '🚨 Break-glass emergency access activated',
    'BREAK_GLASS_DEACTIVATED':    '🚨 Break-glass access deactivated',
    'ADMIN_TIER_ASSIGNED':        '🔑 Admin tier assigned',
    'ELEVATION_REQUESTED':        '🔑 Privilege elevation requested',
    'ELEVATION_APPROVED':         '🔑 Privilege elevation approved',
    'ELEVATION_REVOKED':          '🔑 Privilege elevation revoked',
    'AUDIT_LOGS_EXPORTED':        '📋 Audit logs exported',
    // ── General Procurement ──
    'CREATE_GENERAL_PROCUREMENT':              '🚛 New general procurement request submitted (Agri & Car Rental)',
    'CEO_APPROVE_GENERAL_PROCUREMENT':         '✅ CEO approved a general procurement request',
    'CEO_REJECT_GENERAL_PROCUREMENT':          '❌ CEO rejected a general procurement request',
    'CEO_WAIT_GENERAL_PROCUREMENT':            '⏸ CEO placed a general procurement request on hold',
    // ── Purchase & Sourcing ──
    'PURCHASE_REQUEST_CREATED':                '📝 New purchase request created',
    'PURCHASE_REQUEST_UPDATED':                '📝 Purchase request updated',
    'PURCHASE_REQUEST_APPROVED':               '✅ Purchase request approved',
    'PURCHASE_REQUEST_REJECTED':               '❌ Purchase request rejected',
    'PURCHASE_ORDER_CREATED':                  '📋 Purchase order generated',
    'PURCHASE_ORDER_UPDATED':                  '📋 Purchase order updated',
    'PURCHASE_ORDER_APPROVED':                 '✅ Purchase order approved by CEO',
    'SUPPLIER_REGISTERED':                     '🏢 New supplier registered (Directory)',
    'SUPPLIER_UPDATED':                        '🏢 Supplier details updated',
    'SMART_TENDER_PUBLISHED':                  '📢 Smart Tender / Bid published to public portal',
    'SMART_TENDER_CLOSED':                     '📢 Smart Tender / Bid closed',
    'SUPPLIER_QUOTATION_SUBMITTED':            '📄 Supplier quotation received',
    'SUPPLIER_QUOTATION_REVIEWED':             '📄 Supplier quotation reviewed',
    'SUPPLIER_BID_SUBMITTED':                  '📄 Supplier bid submitted',
    // ── Employee Portal ──
    'EMPLOYEE_TASK_ASSIGNED':                  '📋 Task assigned to employee',
    'EMPLOYEE_TASK_UPDATED':                   '📋 Employee task updated',
    'EMPLOYEE_TASK_DELETED':                   '🗑️ Employee task deleted',
    'EMPLOYEE_REPORT_SUBMITTED':               '📝 Employee daily report submitted',
    'EMPLOYEE_PAYSLIP_VIEWED':                 '💵 Employee viewed payslip',
  };

  const SUBJECT_NAMES = [
    ['GENERAL_PROCUREMENT', 'general procurement request'],
    ['PURCHASE_REQUEST', 'purchase request'],
    ['PURCHASE_ORDER',   'purchase order'],
    ['SMART_TENDER',     'smart tender'],
    ['DRUG_TENDER',      'drug tender'],
    ['SUPPLIER_QUOTATION', 'supplier quotation'],
    ['SUPPLIER_BID',     'supplier bid'],
    ['SUPPLIER',         'supplier'],
    ['BANK_TRANSACTION', 'bank transfer'],
    ['STORE_TRANSFER',   'stock transfer'],
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
    // Check fixed descriptions first (auth/user/role/system events)
    if (FIXED_DESCRIPTIONS[upper]) {
      const suffix = record ? ` — ${record}` : '';
      return `${FIXED_DESCRIPTIONS[upper]}${suffix}`;
    }
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
      let s = raw.replace(/_/g, ' ').toLowerCase().trim();
      if (!s) s = 'activity recorded';
      base = s.charAt(0).toUpperCase() + s.slice(1);
    }
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
                : isSuperAdmin || isCEO
                ? 'Append-only system record of all module activities.'
                : 'Personal activity log — record of your actions.'}
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

        {/* Module dropdown — Admin/CEO only, unless hard-locked via props */}
        {(isSuperAdmin || isCEO) && !fixedModule ? (
          <select
            className={styles.filterSelect}
            value={moduleFilter}
            onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Modules</option>
            <option value="Admin">🔐 Admin / Auth</option>
            <option value="HR">👥 HR</option>
            <option value="Finance">💰 Finance</option>
            <option value="Pharmacy">💊 Pharmacy</option>
            <option value="Pharmacy Store">💊 Pharmacy Store</option>
            <option value="Pharmacy Sales">💊 Pharmacy Sales</option>
            <option value="Store">📦 Store</option>
            <option value="Inventory">🗃️ Inventory</option>
            <option value="Procurement">📋 Procurement</option>
            <option value="Sales">🛒 Sales</option>
            <option value="Printing">🖨️ Printing</option>
            <option value="Car Rental">🚗 Car Rental</option>
            <option value="CEO">👔 CEO</option>
          </select>
        ) : null}

        {/* Action filter dropdown — shown to Admin/CEO */}
        {(isSuperAdmin || isCEO) && (
          <select
            className={styles.filterSelect}
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          >
            {ACTION_FILTER_GROUPS.map((opt, i) =>
              opt.disabled ? (
                <option key={i} disabled style={{ color: '#9CA3AF', fontStyle: 'italic' }}>{opt.label}</option>
              ) : (
                <option key={opt.value + i} value={opt.value}>{opt.label}</option>
              )
            )}
          </select>
        )}

        {!isSuperAdmin && !isCEO && !fixedModule && (
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
                            <div className={styles.logDescription}>{describeAction(log.action, log.record_identifier)}</div>
                            {log.record_identifier && log.action !== 'UPDATE' && <div className={styles.recordId}>{log.record_identifier}</div>}
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
                                      <div className={styles.diffTitle}>Update Recorded — No Field Changes</div>
                                      <p className={styles.diffSummary}>
                                        <strong>{describeAction(log.action, log.record_identifier)}</strong> by {log.user_name} ({log.role})
                                        {log.module ? ` · Module: ${log.module}` : ''} · {formatDate(log.created_at)}.
                                      </p>
                                      <pre className={styles.diffCode}>
                                        This action was logged with identical before/after values, so no field-level
                                        differences were captured. The recorded state is shown below so you can review
                                        exactly what was saved.
                                      </pre>
                                      {nObj && (
                                        <pre className={styles.diffCode} style={{ textAlign: 'left', marginTop: 10, background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 6, padding: 10 }}>
                                          {safeParse(nObj)}
                                        </pre>
                                      )}
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
                <form onSubmit={goToPage} className={styles.pageJump}>
                  <input
                    type="number"
                    min="1"
                    value={pageInput}
                    onChange={e => setPageInput(e.target.value)}
                    placeholder="Page #"
                    className={styles.pageInput}
                    title="Enter a page number and press Enter to jump"
                  />
                  <button type="submit" className={styles.pageBtn} title="Go to page">Go</button>
                </form>
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
