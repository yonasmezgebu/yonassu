import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info,
  X,
  Plus,
  Monitor,
  Hash,
  RefreshCw,
  Printer
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './PrintingProdMachines.module.css';

const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Status → semantic badge
const STATUS_BADGE = {
  'In Store': 'badgeInfo',
  'Moved to Production': 'badgeInfo',
  'Active/Functional': 'badgeSuccess',
  'Idle in Production': 'badgeWarning',
  'Returned to Store': 'badgeSuccess',
  'Under Maintenance': 'badgeDanger'
};

// Status → print document color
const STATUS_COLOR = {
  'In Store': '#0284C7',
  'Moved to Production': '#0284C7',
  'Active/Functional': '#16A34A',
  'Idle in Production': '#D97706',
  'Returned to Store': '#059669',
  'Under Maintenance': '#DC2626'
};

// Toast System
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';
  const isWarning = type === 'warning';
  const Icon = isError || isWarning ? AlertTriangle : CheckCircle;
  const color = isError ? '#DC2626' : isWarning ? '#D97706' : '#16A34A';
  const tone = isError ? styles.toastError : isWarning ? styles.toastWarning : styles.toastSuccess;

  return (
    <div className={`${styles.toast} ${tone}`}>
      <span className={styles.toastIcon}><Icon size={20} color={color} /></span>
      <span className={styles.toastMsg}>{message}</span>
      <button className={styles.toastClose} onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
};

// Flat primary button with yellow scatter sweep
const Btn3D = ({ children, onClick, icon: Icon, disabled, className = '', type }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    type={type}
    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSweep} ${className}`}
  >
    {Icon && <Icon size={18} />}
    {children}
  </button>
);

const PrintingProdMachines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Registration Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    machine_name: '',
    model_serial: '',
    condition_notes: ''
  });

  const showMsg = (type, message) => setToast({ type, message });

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      // Using store/machines as it acts as the global registry
      const { data } = await api.get(`${BASE}/store/machines`); 
      setMachines(data.data || []); 
    } catch { 
      setMachines([]); 
      showMsg('error', 'Failed to load machines');
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.machine_name.trim()) return showMsg('error', 'Machine Name is required');
    try {
      await api.post(`${BASE}/store/machines`, formData);
      showMsg('success', 'Machine Registered Successfully');
      setShowModal(false);
      setFormData({ machine_name: '', model_serial: '', condition_notes: '' });
      load();
    } catch (err) {
      showMsg('error', err?.response?.data?.message || 'Registration failed');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`${BASE}/store/machines/${id}/status`, { status });
      showMsg('success', `Status updated to ${status}`);
      load();
    } catch (err) {
      showMsg('error', 'Failed to update status');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=980,height=740');
    if (!printWindow) {
      showMsg('warning', 'Popup blocked. Please allow popups to print.');
      return;
    }

    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const money = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    const statusColor = (s) => STATUS_COLOR[s] || '#111827';

    const rows = machines.map((m, idx) => `
      <tr>
        <td class="no">${idx + 1}</td>
        <td class="left">
          <div class="mid">${esc(m.machine_id)}</div>
          <div class="name">${esc(m.machine_name)}</div>
        </td>
        <td>${esc(m.model_serial || '—')}</td>
        <td class="notes">${esc(m.condition_notes || '—')}</td>
        <td><span class="status" style="color:${statusColor(m.status)}">${esc(m.status)}</span></td>
        <td class="right">${parseFloat(m.internal_value) > 0 ? 'ETB ' + money(parseFloat(m.internal_value)) : 'Pending'}</td>
      </tr>
    `).join('');

    const bodyRows = machines.length
      ? rows + `<tr class="grand"><td colspan="5">Grand Total</td><td class="right">ETB ${money(totalValue)}</td></tr>`
      : `<tr><td colspan="6" class="notes" style="text-align:center;padding:24px;color:#6B7280">No machines registered yet.</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Machine Asset Registry</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111827; margin: 0; padding: 24px; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #2563EB; color: #fff; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 12px; }
  thead th.right { text-align: right; }
  tbody td { border: 1px solid #E5E7EB; padding: 10px 12px; font-size: 13px; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #F9FAFB; }
  .no { width: 42px; text-align: center; color: #6B7280; font-variant-numeric: tabular-nums; }
  .right { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .mid { font-size: 11px; font-weight: 600; color: #2563EB; text-transform: uppercase; letter-spacing: 0.04em; }
  .name { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .notes { max-width: 220px; color: #4B5563; }
  .status { font-weight: 600; }
  .grand td { background: #EFF6FF !important; border-top: 2px solid #2563EB; font-weight: 700; }
  @media print {
    body { padding: 0; }
    thead { display: table-header-group; }
  }
</style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>Machine ID & Name</th>
        <th>Model / Serial</th>
        <th>Condition Notes</th>
        <th>Status</th>
        <th class="right">Value</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 350);
  };

  const totalCount = machines.length;
  const totalValue = machines.reduce((sum, m) => sum + (parseFloat(m.internal_value) || 0), 0);

  return (
    <div className={styles.page}>
      {/* PAGE HEADER */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Monitor size={26} className={styles.pageTitleIcon} /> Printing Machine Asset Registry
          </h1>
          <p className={styles.pageSubtitle}>
            Register new production machines. Value appraisal is managed exclusively by Finance.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Btn3D icon={Plus} className={styles.btnLg} onClick={() => setShowModal(true)}>Register New Machine</Btn3D>
          <button onClick={handlePrint} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSweep}`} title="Print registry">
            <Printer size={16} /> Print
          </button>
          <button onClick={load} disabled={loading} className={styles.iconBtn} title="Refresh" aria-label="Refresh">
            {loading ? <SegmentedSpinner size={20} /> : <RefreshCw size={18} />}
          </button>
        </div>
      </header>

      {/* REGISTRY CONTENT */}
      {loading && machines.length === 0 ? (
        <div className={styles.loadingState}>
          <SegmentedSpinner size={56} label="Loading machines..." />
        </div>
      ) : machines.length === 0 ? (
        <div className={styles.emptyState}>
          <Monitor size={64} className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>No Machines Registered</div>
          <p className={styles.emptyText}>Click "Register New Machine" to add your first asset.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colNo}>No.</th>
                  <th>Machine ID & Name</th>
                  <th>Model / Serial</th>
                  <th>Condition Notes</th>
                  <th>Status</th>
                  <th>Finance Val.</th>
                  <th className={styles.thRight}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m, idx) => (
                  <tr key={m.id}>
                    <td className={styles.colNo}>{idx + 1}</td>
                    <td>
                      <div className={styles.machineId}><Hash size={12} /> {m.machine_id}</div>
                      <div className={styles.machineName}>{m.machine_name}</div>
                    </td>
                    <td className={styles.cellModel}>{m.model_serial || '—'}</td>
                    <td className={styles.cellNotes}>{m.condition_notes || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[STATUS_BADGE[m.status] || 'badgeNeutral']}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      {parseFloat(m.internal_value) > 0 ? (
                        <div className={styles.valueText}>
                          ETB {parseFloat(m.internal_value).toLocaleString()}
                        </div>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>Pending Appraisal</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {m.status !== 'Active/Functional' && (
                          <button onClick={() => updateStatus(m.id, 'Active/Functional')} className={`${styles.actionBtn} ${styles.actActive} ${styles.btnSweep}`}>Set Active</button>
                        )}
                        {m.status !== 'Idle in Production' && (
                          <button onClick={() => updateStatus(m.id, 'Idle in Production')} className={`${styles.actionBtn} ${styles.actIdle} ${styles.btnSweep}`}>Set Idle</button>
                        )}
                        {m.status !== 'Under Maintenance' && (
                          <button onClick={() => updateStatus(m.id, 'Under Maintenance')} className={`${styles.actionBtn} ${styles.actMaint} ${styles.btnSweep}`}>Maint.</button>
                        )}
                        {m.status !== 'Returned to Store' && (
                          <button onClick={() => updateStatus(m.id, 'Returned to Store')} className={`${styles.actionBtn} ${styles.actReturn} ${styles.btnSweep}`}>Return</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>
            <div className={styles.footerStat}>
              <span className={styles.footerLabel}>Total Machines</span>
              <span className={styles.footerValue}>{totalCount}</span>
            </div>
            <div className={styles.footerStat}>
              <span className={styles.footerLabel}>Grand Total Value</span>
              <span className={`${styles.footerValue} ${styles.footerValueMoney}`}>
                ETB {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Register Production Machine</h2>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn} aria-label="Close"><X size={20} /></button>
            </div>
            <form onSubmit={handleRegister} className={styles.modalBody}>
              <div className={styles.infoNote}>
                <Info size={20} className={styles.infoNoteIcon} />
                <span>Asset valuation and price entry are restricted. Finance will appraise and set the value once registered.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="pm-machine-name">Machine Name *</label>
                <input 
                  id="pm-machine-name"
                  autoFocus required
                  value={formData.machine_name} onChange={e => setFormData({...formData, machine_name: e.target.value})}
                  className={styles.formInput}
                  placeholder="e.g. Heidelberg Speedmaster 52"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="pm-model-serial">Model & Serial Number</label>
                <input 
                  id="pm-model-serial"
                  value={formData.model_serial} onChange={e => setFormData({...formData, model_serial: e.target.value})}
                  className={styles.formInput}
                  placeholder="e.g. SM52-2 / SN-9827364"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="pm-notes">Condition / Notes</label>
                <textarea 
                  id="pm-notes"
                  value={formData.condition_notes} onChange={e => setFormData({...formData, condition_notes: e.target.value})}
                  className={`${styles.formInput} ${styles.formTextarea}`}
                  placeholder="Enter current condition or any remarks..."
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSweep}`}>Cancel</button>
                <Btn3D>Submit to Registry</Btn3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PrintingProdMachines;
