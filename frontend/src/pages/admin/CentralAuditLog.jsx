import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import auditService from '../../services/auditService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CentralAuditLog.module.css';

/* ── Inline SVG icon set ── */
const Icon = ({ name, size = 18, color = 'currentColor', style = {} }) => {
  const s = { width: size, height: size, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style };
  const paths = {
    'user':         <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    'clock':        <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    'globe':        <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    'package':      <><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
    'pill':         <><path d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3"/><path d="m8 11 4-7"/><path d="M10.7 3.3a4.5 4.5 0 1 1 6.4 6.4L12 15l-6.3-6.3"/></>,
    'edit':         <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    'plus-circle':  <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>,
    'trash':        <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    'shopping-cart':<><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      {paths[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
};

const ACTION_FILTER_GROUPS = [
  { label: 'All Actions', value: '' },
  { label: '─── Authentication ───', value: '__divider__', disabled: true },
  { label: 'Login Success',        value: 'LOGIN_SUCCESS' },
  { label: 'Login Failed',         value: 'LOGIN_FAILED' },
  { label: 'Login Blocked',        value: 'LOGIN_BLOCKED_LOCKOUT' },
  { label: 'Logout',               value: 'LOGOUT' },
  { label: 'Session Evicted',      value: 'SESSION_EVICTED' },
  { label: '─── User Management ───', value: '__divider__', disabled: true },
  { label: 'User Created',         value: 'USER_CREATED' },
  { label: 'User Registered',      value: 'USER_REGISTERED' },
  { label: 'User Updated',         value: 'USER_UPDATED' },
  { label: 'User Deleted',         value: 'USER_DELETED' },
  { label: 'User Restored',        value: 'USER_RESTORED' },
  { label: 'User Promoted',        value: 'USER_PROMOTED_TO_EMPLOYEE' },
  { label: '─── Roles & Permissions ─', value: '__divider__', disabled: true },
  { label: 'Role Assigned',        value: 'ROLE_ASSIGNED' },
  { label: 'Role Removed',         value: 'ROLE_REMOVED' },
  { label: 'Role Revoked',         value: 'ROLE_REVOKED' },
  { label: 'Custom Role Created',  value: 'CUSTOM_ROLE_CREATED' },
  { label: 'Custom Role Assigned', value: 'CUSTOM_ROLE_ASSIGNED' },
  { label: '─── Password ───',        value: '__divider__', disabled: true },
  { label: 'Password Changed',     value: 'PASSWORD_CHANGED' },
  { label: 'Force Password Reset', value: 'FORCE_PASSWORD_RESET' },
  { label: '─── System Configuration ─', value: '__divider__', disabled: true },
  { label: 'Settings Updated',     value: 'SYSTEM_SETTINGS_UPDATED' },
  { label: 'Feature Flag Toggled', value: 'FEATURE_FLAG_TOGGLED' },
  { label: 'Maintenance Enabled',  value: 'MAINTENANCE_MODE_ENABLED' },
  { label: 'Maintenance Disabled', value: 'MAINTENANCE_MODE_DISABLED' },
  { label: 'Cache Cleared',        value: 'SYSTEM_CACHE_CLEARED' },
  { label: '─── Pharmacy ───',        value: '__divider__', disabled: true },
  { label: 'Medicine Added',       value: 'MEDICINE_ADDED' },
  { label: 'Medicine Updated',     value: 'MEDICINE_UPDATED' },
  { label: 'Sale Made',            value: 'SALE_MADE' },
  { label: 'Pharmacy Sale',        value: 'PHARMACY_SALE' },
  { label: 'Transfer Dispatched',  value: 'TRANSFER_DISPATCHED' },
  { label: 'Stock Received',       value: 'STOCK_RECEIVED' },
  { label: 'Shipment Arrived',     value: 'SHIPMENT_ARRIVED' },
  { label: '─── Procurement & Inventory ─', value: '__divider__', disabled: true },
  { label: 'Purchase Order Issued', value: 'PURCHASE_ORDER_ISSUED' },
  { label: 'Inventory Adjusted',   value: 'INVENTORY_ADJUSTED' },
  { label: 'Supplier Added',       value: 'SUPPLIER_ADDED' },
  { label: '─── HR & Employees ───',  value: '__divider__', disabled: true },
  { label: 'Task Assigned',        value: 'EMPLOYEE_TASK_ASSIGNED' },
  { label: 'Report Submitted',     value: 'EMPLOYEE_REPORT_SUBMITTED' },
];

const CentralAuditLog = ({ fixedModule, mode }) => {
  const location = useLocation();
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
    roleStr.includes('rental manager') || roleStr.includes('renting manager') ||
    roleStr.includes('agri rental') || roleStr.includes('agrirent')
  );

  const lockedModule = fixedModule || (isHR ? 'HR' : (isPharmacy ? 'Pharmacy' : (isStore ? 'Store' : (isCarRental ? 'Car Rental' : ''))));
  const isLocked     = !!lockedModule;
  const financeMode  = mode === 'finance' || mode === 'pharmacy';

  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState(() => location.state?.dashSearchTerm || '');
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

  useEffect(() => {
    const handleDashSearch = (e) => {
      setSearch(e.detail || '');
      setPage(1);
    };
    window.addEventListener('dashboardSearch', handleDashSearch);
    return () => window.removeEventListener('dashboardSearch', handleDashSearch);
  }, []);

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

  const IGNORE_KEYS = new Set([
    'id', 'created_at', 'updated_at', 'timestamp', 'createdAt', 'updatedAt',
    'password', 'currentPassword', 'newPassword', 'two_factor_secret', 'token',
  ]);

  const actionTone = (action = '') => {
    const a = action.toLowerCase();
    if (/created|added|registered|recorded|set$|opened|posted/.test(a)) return 'create';
    if (/updated|changed|toggled|adjusted|extended|modified|renewed|emailed/.test(a)) return 'update';
    if (/deleted|cancelled|rejected|disqualified|voided|removed|retracted|archived|terminated/.test(a)) return 'delete';
    if (/approved|published|submitted|released|sent|completed|converted|finalized|verified|closed|awarded|forwarded|paid|generated|accepted/.test(a)) return 'status';
    return 'other';
  };

  const FIXED_DESCRIPTIONS = {
    'LOGIN_SUCCESS':              'User logged in successfully',
    'LOGIN_FAILED':               'Login attempt failed (wrong password)',
    'LOGIN_BLOCKED_LOCKOUT':      'Login blocked — account locked out',
    'LOGOUT':                     'User logged out',
    'SESSION_EVICTED':            'Session evicted (max concurrent sessions reached)',
    'USER_CREATED':               'New user account created',
    'USER_REGISTERED':            'User self-registered',
    'USER_UPDATED':               'User profile updated',
    'USER_DELETED':               'User account disabled/deleted',
    'USER_RESTORED':              'User account restored',
    'USER_PROMOTED_TO_EMPLOYEE':  'User promoted to Employee status',
    'USERS_EXPORTED':             'User list exported',
    'ROLE_ASSIGNED':              'Role assigned to user',
    'ROLE_REMOVED':               'Role removed from user',
    'ROLE_REVOKED':               'Role revoked from user',
    'CUSTOM_ROLE_CREATED':        'Custom role created',
    'CUSTOM_ROLE_ASSIGNED':       'Custom role assigned to user',
    'PASSWORD_CHANGED':           'Password changed',
    'FORCE_PASSWORD_RESET':       'Admin forced password reset',
    'PASSWORD_RESET_REQUESTED':   'Password reset requested',
    'PASSWORD_RESET_COMPLETED':   'Password reset completed',
    'SETTINGS_UPDATED':           'System settings updated',
    'SETTING_UPDATED':            'Setting updated',
    'SETTINGS_RESET':             'Settings reset to defaults',
    'BACKUP_CREATED':             'Database backup created',
    'BACKUP_DELETED':             'Backup file deleted',
    'BREAK_GLASS_ACTIVATED':      'Break-glass emergency access activated',
    'BREAK_GLASS_DEACTIVATED':    'Break-glass access deactivated',
    'ADMIN_TIER_ASSIGNED':        'Admin tier assigned',
    'ELEVATION_REQUESTED':        'Privilege elevation requested',
    'ELEVATION_APPROVED':         'Privilege elevation approved',
    'ELEVATION_REVOKED':          'Privilege elevation revoked',
    'AUDIT_LOGS_EXPORTED':        'Audit logs exported',
    // ── General Procurement ──
    'CREATE_GENERAL_PROCUREMENT':              'New general procurement request submitted (Agri & Car Rental)',
    'CEO_APPROVE_GENERAL_PROCUREMENT':         'CEO approved a general procurement request',
    'CEO_REJECT_GENERAL_PROCUREMENT':          'CEO rejected a general procurement request',
    'CEO_WAIT_GENERAL_PROCUREMENT':            'CEO placed a general procurement request on hold',
    // ── Purchase & Sourcing ──
    'PURCHASE_REQUEST_CREATED':                'New purchase request created',
    'PURCHASE_REQUEST_UPDATED':                'Purchase request updated',
    'PURCHASE_REQUEST_APPROVED':               'Purchase request approved',
    'PURCHASE_REQUEST_REJECTED':               'Purchase request rejected',
    'PURCHASE_ORDER_CREATED':                  'Purchase order generated',
    'PURCHASE_ORDER_UPDATED':                  'Purchase order updated',
    'PURCHASE_ORDER_APPROVED':                 'Purchase order approved by CEO',
    'SUPPLIER_REGISTERED':                     'New supplier registered (Directory)',
    'SUPPLIER_UPDATED':                        'Supplier details updated',
    'SMART_TENDER_PUBLISHED':                  'Smart Tender / Bid published to public portal',
    'SMART_TENDER_CLOSED':                     'Smart Tender / Bid closed',
    'SUPPLIER_QUOTATION_SUBMITTED':            'Supplier quotation received',
    'SUPPLIER_QUOTATION_REVIEWED':             'Supplier quotation reviewed',
    'SUPPLIER_BID_SUBMITTED':                  'Supplier bid submitted',
    // ── Employee Portal ──
    'EMPLOYEE_TASK_ASSIGNED':                  'Task assigned to employee',
    'EMPLOYEE_TASK_UPDATED':                   'Employee task updated',
    'EMPLOYEE_TASK_DELETED':                   'Employee task deleted',
    'EMPLOYEE_REPORT_SUBMITTED':               'Employee daily report submitted',
    'EMPLOYEE_PAYSLIP_VIEWED':                 'Employee viewed payslip',
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
    // Pharmacy / Medical
    ['MEDICINE',         'medicine'],
    ['PHARMACY_SALE',    'pharmacy sale'],
    ['SALE',             'sale'],
    ['STOCK',            'stock'],
    ['SHIPMENT',         'shipment'],
    ['PRESCRIPTION',     'prescription'],
    ['REQUISITION',      'requisition'],
    ['GRN',              'goods receiving note'],
    ['DISPENSATION',     'dispensation'],
    ['BATCH',            'batch'],
    ['EXPIRY',           'expiry record'],
    ['DRUG',             'drug'],
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

  const MODULE_ENTITY = {
    'Pharmacy':       'pharmacy record',
    'Pharmacy Store': 'pharmacy store item',
    'Pharmacy Sales': 'pharmacy sale',
    'Medicine':       'medicine',
    'Batch':          'batch',
    'Drug':           'drug',
    'Stock':          'stock item',
    'Transfer':       'transfer',
    'Shipment':       'shipment',
    'GRN':            'goods receiving note',
    'Expiry':         'expiry record',
    'Prescription':   'prescription',
    'Requisition':    'requisition',
  };

  const getCrudIcon = (upper) => {
    if (upper === 'CREATE' || upper === 'CREATED') return <Icon name="plus-circle" size={14} color="var(--color-success)" style={{marginRight:4}}/>;
    if (upper === 'UPDATE' || upper === 'UPDATED') return <Icon name="edit" size={14} color="var(--color-primary)" style={{marginRight:4}}/>;
    if (upper === 'DELETE' || upper === 'DELETED') return <Icon name="trash" size={14} color="var(--color-danger)" style={{marginRight:4}}/>;
    return null;
  };

  const describeAction = (action = '', record = '', module_ = '') => {
    const raw = String(action || '').trim();
    const upper = raw.toUpperCase();

    const entityLabel = MODULE_ENTITY[module_] || MODULE_ENTITY[String(module_).split(' ')[1]] || null;
    const isNumericId = record && /^\d+$/.test(String(record).trim());
    const recordSuffix = record
      ? isNumericId
        ? entityLabel
          ? ` — ${entityLabel} #${record}`
          : ` — Record #${record}`
        : ` — ${record}`
      : '';

    if (FIXED_DESCRIPTIONS[upper]) {
      return <span>{FIXED_DESCRIPTIONS[upper]}{recordSuffix}</span>;
    }

    const MODULE_CRUD_LABELS = {
      'Pharmacy':       { C: 'Pharmacy record created',   U: 'Pharmacy record updated',   D: 'Pharmacy record deleted'   },
      'Pharmacy Store': { C: 'Store item created',        U: 'Store item updated',        D: 'Store item deleted'        },
      'Pharmacy Sales': { C: 'Pharmacy sale recorded',    U: 'Pharmacy sale updated',     D: 'Pharmacy sale removed'     },
    };
    const crudMap = MODULE_CRUD_LABELS[module_];
    if (crudMap) {
      if (upper === 'CREATE' || upper === 'CREATED') return <span>{getCrudIcon(upper)}{crudMap.C}{recordSuffix}</span>;
      if (upper === 'UPDATE' || upper === 'UPDATED') return <span>{getCrudIcon(upper)}{crudMap.U}{recordSuffix}</span>;
      if (upper === 'DELETE' || upper === 'DELETED') return <span>{getCrudIcon(upper)}{crudMap.D}{recordSuffix}</span>;
    }
    if (upper === 'UPDATE' || upper === 'UPDATED') return <span>{getCrudIcon(upper)}Record updated{recordSuffix}</span>;
    if (upper === 'CREATE' || upper === 'CREATED') return <span>{getCrudIcon(upper)}Record created{recordSuffix}</span>;
    if (upper === 'DELETE' || upper === 'DELETED') return <span>{getCrudIcon(upper)}Record deleted{recordSuffix}</span>;

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
    return <span>{base}{recordSuffix}</span>;
  };

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeTxt}>
                {fixedModule === 'Pharmacy' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pill" size={14} /> Pharmacy Module</span>
                ) : 'Security & Compliance'}
              </span>
            </div>
            <h1 className={styles.pageTitle}>{fixedModule === 'Pharmacy' ? 'Pharmacy Audit Log' : 'Central Audit Log'}</h1>
            <p className={styles.pageSubtitle}>
              {fixedModule === 'Pharmacy'
                ? 'Pharmacy activity log — medicines, sales, stock, procurement, expiry, batches, transfers and all staff actions within the pharmacy module.'
                : isHR
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
                ? 'Car & Agri Rental activity log — your own activity only.'
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
            <option value="Admin">Admin / Auth</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Pharmacy Store">Pharmacy Store</option>
            <option value="Pharmacy Sales">Pharmacy Sales</option>
            <option value="Store">Store</option>
            <option value="Inventory">Inventory</option>
            <option value="Procurement">Procurement</option>
            <option value="Sales">Sales</option>
            <option value="Printing">Printing</option>
            <option value="Car Rental">Car Rental</option>
            <option value="CEO">CEO</option>
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

        {(!isSuperAdmin && !isCEO && !fixedModule) || fixedModule === 'Pharmacy' ? (
          <div className={styles.lockedBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 6}}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {fixedModule === 'Pharmacy'
              ? 'Pharmacy Module Only (Medicines · Sales · Stock · Procurement · Expiry · Batches)'
              : isHR ? 'HR Module Only'
              : isStore ? 'Store Module Only'
              : isPharmacy ? 'Pharmacy Module Only'
              : isPrinting ? 'Printing Module + Your Activity'
              : isSales ? 'Sales Module + Your Activity'
              : 'Your Module Only'}
          </div>
        ) : null}
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
                              <span className={`${styles.moduleBadge} ${styles[`moduleBadge--${String(log.module || '').replace(/\s+/g, '')}`]} `}>{log.module}</span>
                            </td>
                          )}
                          <td>
                            <div className={`${styles.actionText} ${styles[`actionText--${tone}`]}`}>{log.action}</div>
                            <div className={styles.logDescription}>{describeAction(log.action, log.record_identifier, log.module)}</div>
                            {log.record_identifier && !/^\d+$/.test(String(log.record_identifier).trim()) && log.action !== 'UPDATE' && <div className={styles.recordId}>{log.record_identifier}</div>}
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

                          const looseEqual = (a, b) => {
                            if (a === b) return true;
                            try { return JSON.stringify(a) === JSON.stringify(b); }
                            catch { return String(a) === String(b); }
                          };

                          const renderCell = (v) => {
                            if (v === null || v === undefined || v === '') return '—';
                            if (typeof v === 'object') {
                              return <pre className={styles.diffCode} style={{ margin: 0 }}>{safeParse(v)}</pre>;
                            }
                            return String(v);
                          };

                          const pObj = getObj(log.previous_value);
                          const nObj = getObj(log.new_value);

                          let diffContent = null;
                          if (pObj || nObj) {
                            const keys = Array.from(new Set([...Object.keys(pObj || {}), ...Object.keys(nObj || {})]))
                              .filter(k => !IGNORE_KEYS.has(k));
                            const changedKeys = pObj && nObj
                              ? keys.filter(k => !looseEqual(pObj[k], nObj[k]))
                              : keys;

                            if (changedKeys.length > 0) {
                              diffContent = (
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
                                        const isChanged = pObj != null && nObj != null && !looseEqual(pObj[key], nObj[key]);
                                        return (
                                          <tr key={key} className={isChanged ? styles.diffChangedRow : ''}>
                                            <td className={styles.diffField}>{key}</td>
                                            <td className={isChanged ? `${styles.diffValue} ${styles.diffPrev}` : styles.diffValue}>
                                              {renderCell(pObj ? pObj[key] : undefined)}
                                            </td>
                                            <td className={isChanged ? `${styles.diffValue} ${styles.diffNew}` : styles.diffValue}>
                                              {renderCell(nObj ? nObj[key] : undefined)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            } else {
                              diffContent = (
                                <div className={styles.diffBox} style={{ marginTop: '1rem' }}>
                                  <div className={styles.diffTitle}>Recorded State — No Field Changes</div>
                                  <pre className={styles.diffCode} style={{ textAlign: 'left', marginTop: 8 }}>
                                    {safeParse(nObj || pObj)}
                                  </pre>
                                </div>
                              );
                            }
                          } else if (log.previous_value != null || log.new_value != null) {
                            diffContent = (
                              <div className={styles.diffContainer}>
                                {log.previous_value != null && (
                                  <div className={`${styles.diffBox} ${styles.diffBoxPrev}`}>
                                    <div className={styles.diffTitle}>Previous Value</div>
                                    <pre className={styles.diffCode}>{safeParse(log.previous_value)}</pre>
                                  </div>
                                )}
                                {log.new_value != null && (
                                  <div className={`${styles.diffBox} ${styles.diffBoxNew}`}>
                                    <div className={styles.diffTitle}>New Value</div>
                                    <pre className={styles.diffCode}>{safeParse(log.new_value)}</pre>
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            diffContent = (
                              <div className={styles.diffBox} style={{ marginTop: '1rem' }}>
                                <div className={styles.diffTitle}>No Changes Recorded</div>
                                <div className={styles.diffSummary}>No before/after data was recorded for this action.</div>
                              </div>
                            );
                          }

                          return (
                            <tr className={styles.detailsRow}>
                              <td colSpan={isLocked ? 4 : 5}>
                                <div style={{
                                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                                  borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: diffContent ? '1rem' : 0
                                }}>
                                  <div style={{
                                    width: 10, height: 10, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                                    background: actionTone(log.action) === 'create' ? '#10B981'
                                      : actionTone(log.action) === 'delete' ? '#EF4444'
                                      : actionTone(log.action) === 'status' ? '#8B5CF6'
                                      : '#3B82F6'
                                  }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.25rem' }}>
                                      {describeAction(log.action, log.record_identifier, log.module)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem', alignItems: 'center' }}>
                                      <Icon name="user" size={12} color="#64748b" style={{marginRight: 4}} />
                                      <strong>{log.user_name}</strong>
                                      {log.role && <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '1px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, marginLeft: 4 }}>{log.role}</span>}
                                      {log.department && log.department !== 'Unknown' && (
                                        <span style={{ background: '#E0F2FE', color: '#075985', padding: '1px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>{log.department}</span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                                      <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Icon name="clock" size={12}/> {formatDate(log.created_at)}</span>
                                      {log.ip_address && <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Icon name="globe" size={12}/> IP: {log.ip_address}</span>}
                                      {log.module && <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Icon name="package" size={12}/> Module: {log.module}</span>}
                                    </div>
                                  </div>
                                </div>
                                {diffContent}
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
