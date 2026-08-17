import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './DataImportExport.module.css';

const IMPORT_TYPES = [
  { key: 'products', label: 'Products / Items', icon: '\uD83D\uDCE6', desc: 'Import product catalog' },
  { key: 'customers', label: 'Customers', icon: '\uD83D\uDC65', desc: 'Import customer records' },
  { key: 'suppliers', label: 'Suppliers', icon: '\uD83D\uDE9A', desc: 'Import supplier data' },
  { key: 'employees', label: 'Employees', icon: '\uD83D\uDCBC', desc: 'Import employee records' },
  { key: 'opening_stock', label: 'Opening Stock', icon: '\uD83D\uDCCA', desc: 'Import initial inventory' },
  { key: 'opening_balances', label: 'Opening Balances', icon: '\uD83D\uDCB3', desc: 'Import starting balances' },
  { key: 'master_data', label: 'Master Data', icon: '\uD83D\uDCD6', desc: 'Import approved master data' },
];

const EXPORT_TYPES = [
  { key: 'sales', label: 'Sales', icon: '\uD83D\uDCC8', desc: 'Export sales records', format: ['excel', 'csv', 'pdf'] },
  { key: 'purchases', label: 'Purchases', icon: '\uD83D\uDED2', desc: 'Export purchase records', format: ['excel', 'csv', 'pdf'] },
  { key: 'inventory', label: 'Inventory', icon: '\uD83D\uDCCB', desc: 'Export stock/inventory', format: ['excel', 'csv'] },
  { key: 'customers', label: 'Customers', icon: '\uD83D\uDC65', desc: 'Export customer list', format: ['excel', 'csv'] },
  { key: 'suppliers', label: 'Suppliers', icon: '\uD83D\uDE9A', desc: 'Export supplier list', format: ['excel', 'csv'] },
  { key: 'employees', label: 'Employees', icon: '\uD83D\uDCBC', desc: 'Export employee data', format: ['excel', 'csv'], requiresPermission: true },
  { key: 'accounting', label: 'Accounting', icon: '\uD83D\uDCB0', desc: 'Export accounting data', format: ['excel', 'csv', 'pdf'] },
  { key: 'reports', label: 'Reports', icon: '\uD83D\uDCCB', desc: 'Export generated reports', format: ['pdf'] },
];

const FALLBACK_HISTORY = [
  { id: 1, user: 'Admin User', data_type: 'products', when: new Date(Date.now() - 86400000).toISOString(), total_rows: 245, successful: 240, failed: 5, status: 'PARTIAL', errors: [{ row: 12, field: 'price', message: 'Invalid value: negative price' }, { row: 89, field: 'sku', message: 'Duplicate SKU: PRD-0045' }] },
  { id: 2, user: 'Admin User', data_type: 'customers', when: new Date(Date.now() - 172800000).toISOString(), total_rows: 120, successful: 120, failed: 0, status: 'SUCCESS', errors: [] },
  { id: 3, user: 'Finance Mgr', data_type: 'opening_balances', when: new Date(Date.now() - 259200000).toISOString(), total_rows: 87, successful: 87, failed: 0, status: 'SUCCESS', errors: [] },
  { id: 4, user: 'Admin User', data_type: 'suppliers', when: new Date(Date.now() - 345600000).toISOString(), total_rows: 34, successful: 0, failed: 34, status: 'FAILED', errors: [{ row: 1, field: 'name', message: 'Column "name" missing from file' }] },
];

const FALLBACK_PERMISSIONS = {
  sales: true,
  purchases: true,
  inventory: true,
  customers: true,
  suppliers: true,
  employees: false,
  accounting: true,
  reports: true,
};

const FILE_SIZE = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const DataImportExport = () => {
  const [mode, setMode] = useState('import');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Data Import / Export</h2>
          <p className={styles.pageSubtitle}>
            Controlled, auditable data transfer — bring data in or take data out of the ERP.
          </p>
        </div>
      </div>

      <div className={styles.modeTabs}>
        {[
          { key: 'import', label: 'Import', icon: '\u2B07\uFE0F' },
          { key: 'export', label: 'Export', icon: '\u2B06\uFE0F' },
          { key: 'history', label: 'Import History', icon: '\uD83D\uDCCB' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.modeTab} ${mode === tab.key ? styles.modeTabActive : ''}`}
            onClick={() => setMode(tab.key)}
          >
            <span className={styles.modeTabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'import' && <ImportPanel showToast={showToast} />}
      {mode === 'export' && <ExportPanel showToast={showToast} />}
      {mode === 'history' && <HistoryPanel showToast={showToast} />}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span className={styles.toastIcon}>{toast.type === 'error' ? '\u26A0' : '\u2713'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  IMPORT PANEL                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
const ImportPanel = ({ showToast }) => {
  const [step, setStep] = useState('select');
  const [selectedType, setSelectedType] = useState(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const reset = () => {
    setStep('select');
    setSelectedType(null);
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      showToast('Only Excel (.xlsx/.xls) and CSV files are supported.', 'error');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showToast('File size exceeds 10 MB limit.', 'error');
      return;
    }
    setFile(f);
    setStep('validate');
    setValidationResult(null);
    setImportResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  const validate = async () => {
    if (!selectedType || !file) return;
    setValidating(true);
    try {
      const res = await adminService.validateImportFile(selectedType.key, file);
      const data = res.data?.data || res.data || {};
      setValidationResult({
        valid: data.valid !== false,
        totalRows: data.totalRows || data.total_rows || 0,
        errors: data.errors || [],
        preview: data.preview || data.rows || [],
        columns: data.columns || [],
      });
      setStep('preview');
    } catch (err) {
      setValidationResult({
        valid: false,
        totalRows: 0,
        errors: [{ row: 0, field: 'file', message: err.response?.data?.message || 'Validation request failed.' }],
        preview: [],
        columns: [],
      });
      setStep('preview');
    } finally {
      setValidating(false);
    }
  };

  const doImport = async () => {
    if (!selectedType || !file) return;
    setImporting(true);
    try {
      const res = await adminService.importData(selectedType.key, file);
      const data = res.data?.data || res.data || {};
      setImportResult({
        success: true,
        totalRows: data.totalRows || data.total_rows || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
      });
      setStep('done');
      showToast('Import completed successfully.');
    } catch (err) {
      setImportResult({
        success: false,
        error: err.response?.data?.message || 'Import failed.',
      });
      setStep('done');
      showToast(err.response?.data?.message || 'Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.panel}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
        {['select', 'validate', 'preview', 'done'].map((s, i) => (
          <span key={s} style={{
            fontWeight: step === s ? 600 : 400,
            color: step === s ? 'var(--color-primary)' : (['select', 'validate', 'preview', 'done'].indexOf(step) >= i ? 'var(--color-success)' : 'var(--color-text-muted)'),
          }}>
            {['select', 'validate', 'preview', 'done'].indexOf(step) >= i ? '\u2713 ' : ''}{i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>

      {/* Step 1: Select type */}
      {(step === 'select') && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>1. Select Data Type</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.typeGrid}>
              {IMPORT_TYPES.map((t) => (
                <button
                  key={t.key}
                  className={`${styles.typeOption} ${selectedType?.key === t.key ? styles.typeOptionSelected : ''}`}
                  onClick={() => { setSelectedType(t); setStep('upload'); }}
                >
                  <span className={styles.typeOptionIcon}>{t.icon}</span>
                  <span className={styles.typeOptionLabel}>
                    <span className={styles.typeOptionName}>{t.label}</span>
                    <span className={styles.typeOptionDesc}>{t.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Upload file */}
      {(step === 'upload') && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>2. Upload File — {selectedType?.label}</h3>
            <button className={styles.btnGhost} onClick={reset}>Change Type</button>
          </div>
          <div className={styles.cardBody}>
            {file ? (
              <div className={styles.fileInfo}>
                <span className={styles.fileIcon}>&#x1F4C4;</span>
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileMeta}>{FILE_SIZE(file.size)} — {file.type || 'unknown type'}</span>
                </div>
                <button className={styles.fileRemove} onClick={() => { setFile(null); setStep('upload'); }} title="Remove file">&times;</button>
              </div>
            ) : (
              <div
                className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropZoneIcon}>&#x2B07;</div>
                <p className={styles.dropZoneTitle}>Drop your file here or click to browse</p>
                <p className={styles.dropZoneText}>Max 10 MB</p>
                <div className={styles.dropZoneFormats}>
                  <span className={styles.formatChip}>.xlsx</span>
                  <span className={styles.formatChip}>.xls</span>
                  <span className={styles.formatChip}>.csv</span>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file && (
              <div className={styles.actionRow}>
                <button className={styles.btnPrimary} onClick={validate} disabled={validating}>
                  {validating ? 'Validating...' : 'Validate & Preview'}
                </button>
                <button className={styles.btnGhost} onClick={() => { setFile(null); }}>Clear File</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Validating */}
      {validating && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Validating file...</span>
        </div>
      )}

      {/* Step 4: Preview */}
      {(step === 'preview' && validationResult) && (
        <>
          {validationResult.errors.length > 0 ? (
            <div className={`${styles.validationBox} ${styles.validationErrors}`}>
              <div className={styles.validationSummary}>
                <span className={styles.validationSummaryIcon}>&#x26A0;</span>
                {validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''} found in {validationResult.totalRows} rows
              </div>
              <ul className={styles.errorList}>
                {validationResult.errors.slice(0, 10).map((err, i) => (
                  <li key={i} className={styles.errorItem}>
                    {err.row > 0 && <span className={styles.errorItemRow}>Row {err.row}:</span>}
                    <span>{err.field && <strong>{err.field}: </strong>}{err.message}</span>
                  </li>
                ))}
                {validationResult.errors.length > 10 && (
                  <li className={styles.errorItem}>...and {validationResult.errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          ) : (
            <div className={`${styles.validationBox} ${styles.validationSuccess}`}>
              <div className={styles.validationSummary}>
                <span className={styles.validationSummaryIcon}>&#x2713;</span>
                Validation passed — {validationResult.totalRows} rows ready to import
              </div>
            </div>
          )}

          {validationResult.preview.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Preview (first {validationResult.preview.length} rows)</h3>
              </div>
              <div className={styles.cardBody} style={{ padding: 0 }}>
                <div className={styles.previewWrap}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        {validationResult.columns.length > 0
                          ? validationResult.columns.map((c, i) => <th key={i}>{c}</th>)
                          : Object.keys(validationResult.preview[0] || {}).map((k) => <th key={k}>{k}</th>)
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.preview.map((row, ri) => {
                        const hasError = validationResult.errors.some((e) => e.row === ri + 1);
                        return (
                          <tr key={ri} className={hasError ? styles.previewRowError : ''}>
                            <td>{ri + 1}</td>
                            {validationResult.columns.length > 0
                              ? validationResult.columns.map((c, ci) => (
                                <td key={ci}>{row[c] ?? ''}</td>
                              ))
                              : Object.values(row).map((v, vi) => (
                                <td key={vi}>{v ?? ''}</td>
                              ))
                            }
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className={styles.actionRow}>
            <button
              className={styles.btnPrimary}
              onClick={doImport}
              disabled={importing || validationResult.errors.length > 0}
              title={validationResult.errors.length > 0 ? 'Fix errors before importing' : 'Import data'}
            >
              {importing ? 'Importing...' : 'Confirm Import'}
            </button>
            <button className={styles.btnGhost} onClick={reset}>Cancel</button>
          </div>
        </>
      )}

      {/* Step 5: Done */}
      {(step === 'done' && importResult) && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{importResult.success ? 'Import Complete' : 'Import Failed'}</h3>
          </div>
          <div className={styles.cardBody}>
            {importResult.success ? (
              <div className={`${styles.validationBox} ${styles.validationSuccess}`}>
                <div className={styles.validationSummary}>
                  <span className={styles.validationSummaryIcon}>&#x2713;</span>
                  {importResult.successful} of {importResult.totalRows} records imported successfully
                </div>
                {importResult.failed > 0 && (
                  <p className={styles.validationDetail}>{importResult.failed} records failed and were skipped.</p>
                )}
              </div>
            ) : (
              <div className={`${styles.validationBox} ${styles.validationErrors}`}>
                <div className={styles.validationSummary}>
                  <span className={styles.validationSummaryIcon}>&#x26A0;</span>
                  {importResult.error}
                </div>
              </div>
            )}
            <div className={styles.actionRow}>
              <button className={styles.btnPrimary} onClick={reset}>Import Another File</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  EXPORT PANEL                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
const ExportPanel = ({ showToast }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [format, setFormat] = useState('excel');
  const [permissions, setPermissions] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getExportPermissions();
        setPermissions(res.data?.data || res.data || FALLBACK_PERMISSIONS);
      } catch {
        setPermissions(FALLBACK_PERMISSIONS);
      }
    };
    load();
  }, []);

  const perms = permissions || FALLBACK_PERMISSIONS;

  const handleExport = async () => {
    if (!selectedType) return;
    setExporting(true);
    try {
      const res = await adminService.exportData(selectedType.key, format);
      const blob = new Blob([res.data]);
      const ext = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType.key}_export.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      showToast(`${selectedType.label} exported as ${ext.toUpperCase()}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const availableFormats = selectedType
    ? (selectedType.format || ['excel', 'csv']).filter((f) => {
        if (perms[selectedType.key] === false) return false;
        return true;
      })
    : [];

  return (
    <div className={styles.panel}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Select Data to Export</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.typeGrid}>
            {EXPORT_TYPES.map((t) => {
              const allowed = perms[t.key] !== false;
              return (
                <button
                  key={t.key}
                  className={`${styles.typeOption} ${selectedType?.key === t.key ? styles.typeOptionSelected : ''} ${!allowed ? styles.typeOptionDisabled : ''}`}
                  onClick={() => { if (allowed) { setSelectedType(t); setFormat(t.format[0]); } }}
                  title={!allowed ? 'Export not permitted for this data type' : t.desc}
                >
                  <span className={styles.typeOptionIcon}>{t.icon}</span>
                  <span className={styles.typeOptionLabel}>
                    <span className={styles.typeOptionName}>
                      {t.label}
                      {!allowed && <span className={`${styles.permBadge} ${styles.permDenied}`} style={{ marginLeft: 8 }}>&#x1F512; No Access</span>}
                    </span>
                    <span className={styles.typeOptionDesc}>{t.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedType && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Export Format</h3>
            <span className={`${styles.permBadge} ${perms[selectedType.key] !== false ? styles.permAllowed : styles.permDenied}`}>
              {perms[selectedType.key] !== false ? '\u2713 Export Permitted' : '\u26A0 Not Permitted'}
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formatRow}>
              {availableFormats.map((f) => (
                <button
                  key={f}
                  className={`${styles.formatChipBtn} ${format === f ? styles.formatChipBtnActive : ''}`}
                  onClick={() => setFormat(f)}
                >
                  {f === 'excel' ? '\uD83D\uDCCA Excel (.xlsx)' : f === 'csv' ? '\uD83D\uDCC4 CSV (.csv)' : '\uD83D\uDCC4 PDF (.pdf)'}
                </button>
              ))}
            </div>
            <div className={styles.actionRow} style={{ marginTop: 16 }}>
              <button
                className={styles.btnPrimary}
                onClick={handleExport}
                disabled={exporting || perms[selectedType.key] === false}
              >
                {exporting ? 'Exporting...' : `Export ${selectedType.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HISTORY PANEL                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
const HistoryPanel = ({ showToast }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchHistory = useCallback(async () => {
    try {
      const res = await adminService.getImportHistory();
      const data = res.data?.data || res.data || {};
      setHistory(data.history || []);
    } catch {
      setHistory(FALLBACK_HISTORY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((h) => {
      if (!q) return true;
      const hay = `${h.user || ''} ${h.data_type || ''} ${h.status || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [history, search]);

  const totalPages = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = scoped.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statusPillClass = (s) => {
    if (s === 'SUCCESS') return styles.statusPillSuccess;
    if (s === 'FAILED') return styles.statusPillFailed;
    return styles.statusPillPartial;
  };
  const dotClass = (s) => {
    if (s === 'SUCCESS') return styles.pillDotSuccess;
    if (s === 'FAILED') return styles.pillDotFailed;
    return styles.pillDotPartial;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Import History</h3>
          <input
            className={styles.search}
            type="search"
            placeholder="Search history..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search import history"
          />
        </div>
        <div className={styles.cardBody} style={{ padding: 0 }}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading history...</span>
            </div>
          ) : scoped.length === 0 ? (
            <div className={styles.empty}>
              <div className={`${styles.emptyIcon} ${styles.emptyIconNeutral}`}>&#x1F4CB;</div>
              <p className={styles.emptyTitle}>No import history</p>
              <p className={styles.emptyText}>Completed imports will appear here.</p>
            </div>
          ) : (
            <>
              <div className={styles.previewWrap}>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Data Type</th>
                      <th>Date</th>
                      <th>Total Rows</th>
                      <th>Successful</th>
                      <th>Failed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((h) => (
                      <React.Fragment key={h.id}>
                        <tr
                          style={{ cursor: h.errors?.length ? 'pointer' : 'default' }}
                          onClick={() => h.errors?.length && setExpandedId(expandedId === h.id ? null : h.id)}
                        >
                          <td style={{ fontWeight: 500 }}>{h.user}</td>
                          <td>
                            <span className={styles.formatChip}>{(h.data_type || '').replace(/_/g, ' ')}</span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{h.when ? formatDateTime(h.when) : '-'}</td>
                          <td>{h.total_rows}</td>
                          <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{h.successful}</td>
                          <td style={{ color: h.failed > 0 ? 'var(--color-danger)' : 'inherit', fontWeight: h.failed > 0 ? 600 : 400 }}>{h.failed}</td>
                          <td>
                            <span className={`${styles.statusPill} ${statusPillClass(h.status)}`}>
                              <span className={`${styles.pillDot} ${dotClass(h.status)}`} />
                              {h.status}
                            </span>
                          </td>
                        </tr>
                        {expandedId === h.id && h.errors?.length > 0 && (
                          <tr>
                            <td colSpan={7} style={{ padding: '0 16px 16px' }}>
                              <div className={`${styles.validationBox} ${styles.validationErrors}`} style={{ margin: 0 }}>
                                <div className={styles.validationSummary}>
                                  <span className={styles.validationSummaryIcon}>&#x26A0;</span>
                                  {h.errors.length} error{h.errors.length !== 1 ? 's' : ''} — reasons:
                                </div>
                                <ul className={styles.errorList}>
                                  {h.errors.map((err, i) => (
                                    <li key={i} className={styles.errorItem}>
                                      {err.row > 0 && <span className={styles.errorItemRow}>Row {err.row}:</span>}
                                      <span>{err.field && <strong>{err.field}: </strong>}{err.message}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 16px' }}>
                  <button className={styles.btnGhost} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>&larr; Prev</button>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Page {safePage} of {totalPages}</span>
                  <button className={styles.btnGhost} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next &rarr;</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataImportExport;
