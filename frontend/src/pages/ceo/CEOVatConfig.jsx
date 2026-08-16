import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Plus, Check, X, RefreshCw, AlertTriangle,
  ChevronDown, ChevronUp, Shield, Clock, History,
  ToggleLeft, ToggleRight, Edit3, FileText, Percent, Package, Trash2
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import styles from './CEOVatConfig.module.css';

/* ─── Helpers ────────────────────────────────────────────── */
const fmtPct = (rate) => `${(parseFloat(rate || 0) * 100).toFixed(2).replace(/\.00$/, '')}%`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtTs = (d) => d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const TREATMENT_META = {
  standard:   { label: 'Standard VAT',   badge: 'badgeStandard', card: 'cardStandard' },
  exempt:     { label: 'VAT Exempt',     badge: 'badgeExempt',   card: 'cardExempt' },
  zero_rated: { label: 'Zero-Rated',     badge: 'badgeZero',     card: 'cardZero' },
};

const TreatmentBadge = ({ treatment }) => {
  const m = TREATMENT_META[treatment] || { label: treatment, badge: 'badgeNeutral' };
  return <span className={`${styles.treatmentBadge} ${styles[m.badge]}`}>{m.label}</span>;
};

const StatusBadge = ({ config }) => {
  if (config.has_pending_change) {
    return <span className={`${styles.statusBadge} ${styles.statusPending}`}><Clock size={10}/> Pending Approval</span>;
  }
  if (config.is_active) {
    return <span className={`${styles.statusBadge} ${styles.statusActive}`}><Check size={10}/> Active</span>;
  }
  return <span className={`${styles.statusBadge} ${styles.statusInactive}`}><X size={10}/> Inactive</span>;
};

/* ─── Toast ──────────────────────────────────────────────── */
const Toast = ({ msg, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const isError = msg?.type === 'error';
  return (
    <div className={`${styles.toast} ${isError ? styles.toastError : styles.toastSuccess}`} role="status">
      {isError ? <AlertTriangle size={16}/> : <Check size={16}/>}
      <span>{msg?.text}</span>
      <button className={styles.toastClose} onClick={onClose} aria-label="Dismiss"><X size={14}/></button>
    </div>
  );
};

/* ─── Modal ──────────────────────────────────────────────── */
const Modal = ({ title, subtitle, children, onClose }) => (
  <div className={styles.overlay} onClick={onClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div className={styles.modalHeader}>
        <div>
          <h2 className={styles.modalTitle}>{title}</h2>
          {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
        </div>
        <button className={styles.iconBtn} onClick={onClose} aria-label="Close"><X size={18}/></button>
      </div>
      <div className={styles.modalBody}>{children}</div>
    </div>
  </div>
);

/* ─── Spinner ────────────────────────────────────────────── */
const Spinner = ({ size = 14 }) => <span className={styles.spinner} style={{ width: size, height: size }}/>;

/* ─── Form Field ─────────────────────────────────────────── */
const Field = ({ label, hint, children }) => (
  <div className={styles.field}>
    <label className={styles.fieldLabel}>{label}</label>
    {children}
    {hint && <p className={styles.fieldHint}>{hint}</p>}
  </div>
);

/* ─── Vat Form ───────────────────────────────────────────── */
const VatForm = ({ initial, standardRate, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    name: initial?.name || 'VAT',
    treatment: initial?.treatment || 'standard',
    rate: initial ? (parseFloat(initial.rate) * 100).toFixed(2)
      : (initial?.treatment === 'standard' ? '' : '0'),
    description: initial?.description || '',
    effective_from: initial?.effective_from ? initial.effective_from.slice(0, 10) : new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onTreatmentChange = (treatment) => {
    set('treatment', treatment);
    if (treatment !== 'standard') {
      set('rate', '0');
    } else if (!initial) {
      // Never hard-code a rate — prefill from the current Standard config if present.
      set('rate', standardRate != null ? standardRate : '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rateDecimal = parseFloat(form.rate) / 100;
    onSave({ ...form, rate: rateDecimal });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Tax Name">
        <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </Field>
      <Field label="Tax Treatment" hint="Standard: rate × price = VAT. Exempt: no VAT, exempt classification. Zero-Rated: no VAT, zero-rated classification.">
        <select className={styles.input} value={form.treatment} onChange={(e) => onTreatmentChange(e.target.value)}>
          <option value="standard">Standard VAT</option>
          <option value="exempt">VAT Exempt</option>
          <option value="zero_rated">VAT Zero-Rated</option>
        </select>
      </Field>
      <Field label="Rate (%)" hint="Stored as a percentage. Fully configurable — never hard-coded.">
        <input
          className={styles.input}
          type="number" step="0.01" min="0" max="100"
          value={form.rate} onChange={(e) => set('rate', e.target.value)}
          placeholder={form.treatment === 'standard' ? 'e.g. 15' : '0'}
          required />
      </Field>
      <Field label="Effective From">
        <input className={styles.input} type="date" value={form.effective_from} onChange={(e) => set('effective_from', e.target.value)} required />
      </Field>
      <Field label="Description">
        <textarea className={`${styles.input} ${styles.textarea}`} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      {initial && (
        <Field label="Change Notes (required for audit trail)">
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Describe why this change is being made..."
            required />
        </Field>
      )}
      <div className={styles.governanceNote}>
        <Shield size={14}/>
        <span>Governance: every rate change requires CEO or Finance approval before it becomes effective, and is permanently recorded in the Tax Change History.</span>
      </div>
      <div className={styles.formActions}>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>Cancel</button>
        <button type="submit" className={styles.btnPrimary} disabled={saving}>
          {saving ? <Spinner/> : <Check size={14}/>}
          {initial ? 'Save Changes' : 'Create Treatment'}
        </button>
      </div>
    </form>
  );
};

/* ─── History Panel ──────────────────────────────────────── */
const HistoryPanel = ({ history, loading }) => {
  const meta = {
    created:     { cls: 'hCreated', label: 'Created' },
    updated:     { cls: 'hUpdated', label: 'Updated' },
    approved:    { cls: 'hApproved', label: 'Approved' },
    rejected:    { cls: 'hRejected', label: 'Rejected' },
    deactivated: { cls: 'hDeactivated', label: 'Deactivated' },
  };

  if (loading) {
    return (
      <div className={styles.emptyState}><Spinner size={20}/><span>Loading history...</span></div>
    );
  }
  if (!history.length) {
    return (
      <div className={styles.emptyState}><History size={26}/><span>No history records yet.</span></div>
    );
  }

  return (
    <div className={styles.timeline}>
      {history.map((h) => {
        const m = meta[h.change_type] || { cls: 'hNeutral', label: h.change_type };
        return (
          <div key={h.id} className={styles.timelineItem}>
            <span className={`${styles.timelineDot} ${styles[m.cls]}`}/>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTop}>
                <span className={`${styles.timelineLabel} ${styles[m.cls]}`}>{m.label}</span>
                <span className={styles.timelineTime}>{fmtTs(h.created_at)}</span>
                <span className={`${styles.approvalPill} ${h.approval_status === 'approved' ? styles.pillGreen : h.approval_status === 'rejected' ? styles.pillRed : styles.pillAmber}`}>
                  {h.approval_status}
                </span>
              </div>
              <div className={styles.timelineActor}>
                <strong>{h.changed_by_name || '—'}</strong>
                {h.changed_by_role && <span> · {h.changed_by_role}</span>}
              </div>
              {(h.old_rate != null || h.new_rate != null) && (
                <div className={styles.diffRow}>
                  {h.old_rate != null && <span className={styles.diffOld}>Rate: {fmtPct(h.old_rate)}</span>}
                  {h.new_rate != null && <span className={styles.diffNew}>→ {fmtPct(h.new_rate)}</span>}
                  {h.old_treatment && h.new_treatment && h.old_treatment !== h.new_treatment && (
                    <span className={styles.diffMeta}>Treatment: {h.old_treatment} → {h.new_treatment}</span>
                  )}
                </div>
              )}
              {(h.old_effective_from || h.new_effective_from) && (
                <div className={styles.diffRow}>
                  <span className={styles.diffMeta}>Effective date: {fmtDate(h.old_effective_from)} → {fmtDate(h.new_effective_from)}</span>
                </div>
              )}
              {h.notes && (
                <div className={styles.notesBox}>“{h.notes}”</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Mapping Modal ──────────────────────────────────────── */
const MappingForm = ({ catalog, configs, fixed, onSave, onCancel, saving }) => {
  const [source, setSource]     = useState(fixed?.source || '');
  const [itemId, setItemId]     = useState(fixed?.item ? String(fixed.item.id) : '');
  const [vatConfigId, setVatConfigId] = useState(fixed?.item?.mapping?.vat_config_id ?? '');
  const [notes, setNotes]       = useState('');

  const flatSources = [];
  (catalog || []).forEach((cat) => {
    if (cat.subsections) {
      cat.subsections.forEach((s) => flatSources.push({ key: s.key, label: `${cat.label} — ${s.label}` }));
    } else {
      flatSources.push({ key: cat.key, label: cat.label });
    }
  });

  const itemsFor = (src) => {
    for (const cat of catalog || []) {
      if (cat.subsections) {
        const s = cat.subsections.find((x) => x.key === src);
        if (s) return s.items;
      } else if (cat.key === src) {
        return cat.items;
      }
    }
    return [];
  };

  const items = source ? itemsFor(source) : [];

  const submit = (e) => {
    e.preventDefault();
    if (!itemId || !vatConfigId) return;
    const item = items.find((i) => String(i.id) === String(itemId)) || fixed?.item;
    onSave({
      source: fixed?.source || source,
      item_id: itemId,
      item_name: item?.name || '',
      vat_config_id: Number(vatConfigId),
      notes,
    });
  };

  return (
    <form onSubmit={submit}>
      {!fixed && (
        <Field label="Product Category">
          <select
            className={styles.input}
            value={source}
            onChange={(e) => { setSource(e.target.value); setItemId(''); }}
            required>
            <option value="">Select a category...</option>
            {flatSources.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </Field>
      )}
      {!fixed ? (
        <Field label="Product / Service">
          <select className={styles.input} value={itemId} onChange={(e) => setItemId(e.target.value)} required>
            <option value="">Select a product...</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}{i.mapping ? ` — currently ${i.mapping.treatment}` : ''}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Product / Service">
          <input className={styles.input} value={fixed.item.name} disabled readOnly />
        </Field>
      )}
      <Field label="Tax Treatment">
        <select className={styles.input} value={vatConfigId} onChange={(e) => setVatConfigId(e.target.value)} required>
          <option value="">Select a treatment...</option>
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {TREATMENT_META[c.treatment]?.label || c.name} — {fmtPct(c.rate)}{c.has_pending_change ? ' (pending)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <textarea className={`${styles.input} ${styles.textarea}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note for the mapping audit trail" />
      </Field>
      <div className={styles.formActions}>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>Cancel</button>
        <button type="submit" className={styles.btnPrimary} disabled={saving}>
          {saving ? <Spinner/> : <Check size={14}/>}
          Apply Treatment
        </button>
      </div>
    </form>
  );
};

/* ─── Category mapping table ─────────────────────────────── */
const MappingTable = ({ title, source, items, onApply, onRemove, savingId, emptyNote }) => (
  <div className={styles.categoryBlock}>
    <div className={styles.categoryTitle}>
      <span>{title}</span>
      <span className={styles.categoryCount}>{items.length} item{items.length === 1 ? '' : 's'}</span>
    </div>
    {items.length === 0 ? (
      <div className={styles.emptyState}><Package size={22}/><span>{emptyNote || 'No products in this category yet.'}</span></div>
    ) : (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product / Service</th>
              <th>Ref</th>
              <th>Price</th>
              <th>Applied Treatment</th>
              <th>Rate</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={`${source}:${it.id}`} className={styles.row}>
                <td><strong className={styles.cellName}>{it.name}</strong></td>
                <td className={styles.cellMuted}>{it.sku || '—'}</td>
                <td className={styles.cellRate}>{it.price != null ? `ETB ${Number(it.price).toLocaleString()}` : '—'}</td>
                <td>{it.mapping ? <TreatmentBadge treatment={it.mapping.treatment}/> : <span className={styles.cellMuted}>Not applied</span>}</td>
                <td className={styles.cellRate}>{it.mapping ? fmtPct(it.mapping.rate) : '—'}</td>
                <td>
                  <div className={styles.rowActions}>
                    <button className={styles.btnGhostSm} onClick={() => onApply(source, it)}>
                      <Edit3 size={12}/> {it.mapping ? 'Change' : 'Apply'}
                    </button>
                    {it.mapping && (
                      <button
                        className={styles.btnGhostSm}
                        onClick={() => onRemove(it.mapping.mapping_id, it.name)}
                        disabled={savingId === it.mapping.mapping_id}
                        title="Remove mapping">
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const CEOVatConfig = () => {
  const [configs, setConfigs]       = useState([]);
  const [history, setHistory]       = useState([]);
  const [catalog, setCatalog]       = useState([]);
  const [mappingHistory, setMappingHistory] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError]           = useState(null);
  const [toast, setToast]           = useState(null);
  const [modal, setModal]           = useState(null);
  const [mapModal, setMapModal]     = useState(null);
  const [savingId, setSavingId]     = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab]   = useState('rates');
  const [search, setSearch]         = useState('');
  const [mapSearch, setMapSearch]   = useState('');

  const notify = (text, type = 'success') => setToast({ text, type });

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchConfigs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/vat-config');
      const data = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? []);
      setConfigs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load VAT configurations. ' + (e?.response?.data?.message || e.message));
    } finally { setLoading(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await apiClient.get('/vat-config/history');
      const data = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? []);
      setHistory(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally { setHistLoading(false); }
  }, []);

  const fetchCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const res = await apiClient.get('/vat-config/mappings/catalog');
      const data = res?.data?.data ?? res?.data ?? res;
      const cats = Array.isArray(data) ? data : (data?.categories || []);
      setCatalog(Array.isArray(cats) ? cats : []);
    } catch { /* silent */ } finally { setCatalogLoading(false); }
  }, []);

  const fetchMappingHistory = useCallback(async () => {
    try {
      const res = await apiClient.get('/vat-config/mappings/history');
      const data = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? []);
      setMappingHistory(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchConfigs(); fetchHistory(); fetchCatalog(); fetchMappingHistory();
  }, [fetchConfigs, fetchHistory, fetchCatalog, fetchMappingHistory]);

  const refreshAll = () => { fetchConfigs(); fetchHistory(); fetchCatalog(); fetchMappingHistory(); };

  /* ── Config actions ────────────────────────────────────── */
  const handleCreate = async (form) => {
    setSavingId('new');
    try {
      await apiClient.post('/vat-config', form);
      notify('VAT treatment created. Pending approval.');
      setModal(null); refreshAll();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to create treatment', 'error');
    } finally { setSavingId(null); }
  };

  const handleUpdate = async (id, form) => {
    setSavingId(id);
    try {
      await apiClient.put(`/vat-config/${id}`, form);
      notify('VAT treatment updated. Change is pending approval.');
      setModal(null); refreshAll();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to update', 'error');
    } finally { setSavingId(null); }
  };

  const handleApprove = async (id) => {
    setSavingId(id);
    try {
      await apiClient.post(`/vat-config/${id}/approve`, { notes: 'Approved by CEO' });
      notify('VAT treatment approved and now effective.');
      refreshAll();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to approve', 'error');
    } finally { setSavingId(null); }
  };

  const handleReject = async (id) => {
    setSavingId(id);
    try {
      await apiClient.post(`/vat-config/${id}/reject`, { notes: 'Rejected by CEO' });
      notify('VAT treatment rejected. Not effective.', 'error');
      refreshAll();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to reject', 'error');
    } finally { setSavingId(null); }
  };

  const handleToggle = async (id) => {
    setSavingId(id);
    try {
      await apiClient.patch(`/vat-config/${id}/toggle`);
      notify('Status updated.');
      refreshAll();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to update status', 'error');
    } finally { setSavingId(null); }
  };

  /* ── Mapping actions ───────────────────────────────────── */
  const handleSaveMapping = async (payload) => {
    setSavingId('map');
    try {
      await apiClient.post('/vat-config/mappings', payload);
      notify('Tax treatment applied and recorded.');
      setMapModal(null); fetchCatalog(); fetchMappingHistory();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to apply treatment', 'error');
    } finally { setSavingId(null); }
  };

  const handleRemoveMapping = async (id) => {
    setSavingId(id);
    try {
      await apiClient.delete(`/vat-config/mappings/${id}`);
      notify('Tax mapping removed.');
      fetchCatalog(); fetchMappingHistory();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to remove mapping', 'error');
    } finally { setSavingId(null); }
  };

  const handleApplyTreatment = (source, item) => {
    setMapModal({ mode: 'apply', source, item });
  };

  const handleRemoveItemMapping = (id, name) => {
    if (!window.confirm(`Remove the tax mapping for "${name}"?`)) return;
    handleRemoveMapping(id);
  };

  /* ── Derived ───────────────────────────────────────────── */
  const standardConfig = configs.find((c) => c.treatment === 'standard');
  const standardRatePct = standardConfig ? (parseFloat(standardConfig.rate) * 100).toFixed(2).replace(/\.00$/, '') : null;

  const filteredConfigs = configs.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.treatment || '').toLowerCase().includes(q);
  });

  const catalogCategories = Array.isArray(catalog) ? catalog : [];
  const q = mapSearch.trim().toLowerCase();
  const filteredCatalog = catalogCategories.map((cat) => {
    const keep = (items) => !q ? items : items.filter((i) =>
      (i.name || '').toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q));
    if (cat.subsections) {
      return { ...cat, subsections: cat.subsections.map((s) => ({ ...s, items: keep(s.items) })) };
    }
    return { ...cat, items: keep(cat.items) };
  });

  const sumMapped = (items) => items.filter((i) => i.mapping).length;
  const mappedTotal = catalogCategories.reduce((acc, cat) => {
    if (cat.subsections) return acc + cat.subsections.reduce((a, s) => a + sumMapped(s.items), 0);
    return acc + sumMapped(cat.items);
  }, 0);

  const TABS = [
    ['rates', 'VAT Rates & Treatments'],
    ['mapping', 'Product / Service Tax Mapping'],
    ['dates', 'Effective Dates'],
    ['history', 'Tax Change History'],
  ];

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Tax &amp; VAT Configuration</h1>
          <p className={styles.pageSubtitle}>
            Central source of truth — Sales, Purchase, Pharmacy and all other modules read VAT rules from here.
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setModal('create')}>
          <Plus size={15}/> New VAT Treatment
        </button>
      </div>

      {/* ── Governance Banner ───────────────────────────── */}
      <div className={styles.governanceBanner}>
        <Shield size={18}/>
        <div>
          <p className={styles.governanceTitle}>Governance Policy</p>
          <p className={styles.governanceText}>
            The CEO Dashboard is the <strong>only authorized interface</strong> for changing VAT configuration.
            Changing a rate requires CEO or Finance permission, every change requires approval before it becomes
            effective, and each change is permanently recorded with old value, new value, changed by, date/time,
            effective date and approval status. Rates are never hard-coded.
          </p>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────── */}
      <div className={styles.summaryGrid}>
        {Object.entries(TREATMENT_META).map(([key, meta]) => {
          const cfg = configs.find((c) => c.treatment === key);
          return (
            <div key={key} className={`${styles.summaryCard} ${styles[meta.card]}`}>
              <div className={styles.summaryTop}>
                <span className={styles.summaryLabel}>{meta.label}</span>
                <TreatmentBadge treatment={key}/>
              </div>
              <div className={styles.summaryRate}>{cfg ? fmtPct(cfg.rate) : '—'}</div>
              <div className={styles.summaryCalc}>
                {key === 'standard' && `Price × ${cfg ? fmtPct(cfg.rate) : 'rate'} = VAT. Total = Price + VAT.`}
                {key === 'exempt' && '0 — no VAT, exempt classification.'}
                {key === 'zero_rated' && '0 — no VAT, zero-rated classification.'}
              </div>
              <div className={styles.summaryStatus}>
                {cfg ? <StatusBadge config={cfg}/> : <span className={styles.summaryUnset}>Not configured</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className={styles.tabs}>
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── VAT Rates & Treatments ──────────────────────── */}
      {activeTab === 'rates' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>VAT Rates &amp; Treatments</h2>
              <p className={styles.sectionSub}>Treatments are distinct — Exempt and Zero-Rated are never interchangeable.</p>
            </div>
            <input
              className={`${styles.input} ${styles.searchBox}`}
              placeholder="Search treatments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.emptyState}><Spinner size={22}/><span>Loading...</span></div>
          ) : error ? (
            <div className={styles.emptyStateError}><AlertTriangle size={20}/><span>{error}</span></div>
          ) : filteredConfigs.length === 0 ? (
            <div className={styles.emptyState}><Percent size={26}/><span>No VAT treatments found.</span></div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tax Name</th>
                    <th>Treatment</th>
                    <th>Rate</th>
                    <th>Effective From</th>
                    <th>Status</th>
                    <th>Approved By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConfigs.map((cfg) => {
                    const isExpanded = expandedId === cfg.id;
                    return (
                      <React.Fragment key={cfg.id}>
                        <tr className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}>
                          <td><strong className={styles.cellName}>{cfg.name}</strong></td>
                          <td><TreatmentBadge treatment={cfg.treatment}/></td>
                          <td className={styles.cellRate}>{fmtPct(cfg.rate)}</td>
                          <td className={styles.cellMuted}>{fmtDate(cfg.effective_from)}</td>
                          <td><StatusBadge config={cfg}/></td>
                          <td className={styles.cellMuted}>
                            {cfg.approved_by ? (cfg.approved_by_name || 'Approved') : '—'}
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              {cfg.has_pending_change && (
                                <>
                                  <button
                                    className={styles.btnApprove}
                                    onClick={() => handleApprove(cfg.id)}
                                    disabled={savingId === cfg.id}>
                                    {savingId === cfg.id ? <Spinner/> : <Check size={12}/>} Approve
                                  </button>
                                  <button
                                    className={styles.btnReject}
                                    onClick={() => handleReject(cfg.id)}
                                    disabled={savingId === cfg.id}>
                                    <X size={12}/> Reject
                                  </button>
                                </>
                              )}
                              <button
                                className={styles.btnGhostSm}
                                onClick={() => setModal({ type: 'edit', config: cfg })}>
                                <Edit3 size={12}/> Edit
                              </button>
                              <button
                                className={styles.btnGhostSm}
                                onClick={() => handleToggle(cfg.id)}
                                disabled={savingId === cfg.id}
                                title={cfg.is_active ? 'Deactivate' : 'Activate'}>
                                {cfg.is_active ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                              </button>
                              <button
                                className={styles.btnGhostSm}
                                onClick={() => setExpandedId(isExpanded ? null : cfg.id)}>
                                {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className={styles.detailRow}>
                            <td colSpan={7}>
                              <div className={styles.detailGrid}>
                                <div>
                                  <div className={styles.detailLabel}>Description</div>
                                  <div className={styles.detailValue}>{cfg.description || '—'}</div>
                                </div>
                                <div>
                                  <div className={styles.detailLabel}>Created By</div>
                                  <div className={styles.detailValue}>{cfg.created_by_name || '—'}</div>
                                </div>
                                <div>
                                  <div className={styles.detailLabel}>How Modules Use This</div>
                                  <div className={styles.detailValue}>
                                    {cfg.treatment === 'standard' && `Price × ${fmtPct(cfg.rate)} = VAT amount. Total = Price + VAT.`}
                                    {cfg.treatment === 'exempt' && 'VAT = 0. Transaction is classified as Exempt — not interchangeable with Zero-Rated.'}
                                    {cfg.treatment === 'zero_rated' && 'VAT = 0. Transaction is classified as Zero-Rated — not interchangeable with Exempt.'}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Product / Service Tax Mapping ───────────────── */}
      {activeTab === 'mapping' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Product / Service Tax Mapping</h2>
              <p className={styles.sectionSub}>
                Products are classified by module — Commercial Printing, Pharmacy &amp; Health, Car Rental, AgriRent,
                Retail Store, and Tender (Compute &amp; Sell / Compute &amp; Buy). Apply a tax treatment to each product;
                the rate is always read from the central configuration.
              </p>
            </div>
            <div className={styles.cardHeaderActions}>
              <input
                className={`${styles.input} ${styles.searchBox}`}
                placeholder="Search products..."
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
              />
              <button className={styles.btnPrimary} onClick={() => setMapModal({ mode: 'new' })}>
                <Plus size={15}/> Assign Treatment
              </button>
            </div>
          </div>

          {catalogLoading ? (
            <div className={styles.emptyState}><Spinner size={22}/><span>Loading products by category...</span></div>
          ) : filteredCatalog.length === 0 ? (
            <div className={styles.emptyState}><Package size={26}/><span>No product categories available.</span></div>
          ) : (
            <div className={styles.categoryList}>
              <div className={styles.mappingSummary}>
                <span><strong>{mappedTotal}</strong> of all products have a tax treatment applied</span>
              </div>
              {filteredCatalog.map((cat) => (
                <div key={cat.key}>
                  <div className={styles.categoryHeader}>
                    <span>{cat.label}</span>
                  </div>
                  {cat.subsections ? (
                    cat.subsections.map((s) => (
                      <MappingTable
                        key={s.key}
                        title={`${s.label}`}
                        source={s.key}
                        items={s.items}
                        onApply={handleApplyTreatment}
                        onRemove={handleRemoveItemMapping}
                        savingId={savingId}
                      />
                    ))
                  ) : (
                    <MappingTable
                      title="All products"
                      source={cat.key}
                      items={cat.items}
                      onApply={handleApplyTreatment}
                      onRemove={handleRemoveItemMapping}
                      savingId={savingId}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Effective Dates ─────────────────────────────── */}
      {activeTab === 'dates' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Effective Dates</h2>
              <p className={styles.sectionSub}>When each treatment becomes (or became) effective, tracked with the approval history.</p>
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyState}><Spinner size={22}/><span>Loading...</span></div>
          ) : configs.length === 0 ? (
            <div className={styles.emptyState}><Clock size={26}/><span>No treatments configured.</span></div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Treatment</th>
                    <th>Current Rate</th>
                    <th>Effective From</th>
                    <th>Status</th>
                    <th>Approved At</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg) => (
                    <tr key={cfg.id} className={styles.row}>
                      <td><TreatmentBadge treatment={cfg.treatment}/></td>
                      <td className={styles.cellRate}>{fmtPct(cfg.rate)}</td>
                      <td className={styles.cellMuted}>{fmtDate(cfg.effective_from)}</td>
                      <td><StatusBadge config={cfg}/></td>
                      <td className={styles.cellMuted}>{cfg.approved_at ? fmtTs(cfg.approved_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tax Change History ──────────────────────────── */}
      {activeTab === 'history' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Tax Change History</h2>
              <p className={styles.sectionSub}>Immutable audit trail — every VAT change records old value, new value, changed by, date/time, effective date and approval status.</p>
            </div>
          </div>
          <HistoryPanel history={history} loading={histLoading}/>
        </div>
      )}

      {/* ── Config Modals ───────────────────────────────── */}
      {modal === 'create' && (
        <Modal title="New VAT Treatment" subtitle="Created as pending — not effective until approved." onClose={() => setModal(null)}>
          <VatForm
            standardRate={standardRatePct}
            saving={savingId === 'new'}
            onCancel={() => setModal(null)}
            onSave={handleCreate}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title={`Edit — ${modal.config.name}`} subtitle="Changes become effective only after CEO approval." onClose={() => setModal(null)}>
          <VatForm
            initial={modal.config}
            standardRate={standardRatePct}
            saving={savingId === modal.config.id}
            onCancel={() => setModal(null)}
            onSave={(form) => handleUpdate(modal.config.id, form)}
          />
        </Modal>
      )}

      {/* ── Mapping Modal ───────────────────────────────── */}
      {mapModal && (
        <Modal
          title={mapModal.mode === 'apply' ? `Apply Treatment — ${mapModal.item.name}` : 'Assign Tax Treatment'}
          subtitle="Choose a category and product, then apply a tax treatment. The change is recorded in the mapping audit trail."
          onClose={() => setMapModal(null)}>
          <MappingForm
            catalog={catalogCategories}
            configs={configs}
            fixed={mapModal.mode === 'apply' ? { source: mapModal.source, item: mapModal.item } : null}
            saving={savingId === 'map'}
            onCancel={() => setMapModal(null)}
            onSave={handleSaveMapping}
          />
        </Modal>
      )}

      {/* ── Toast ───────────────────────────────────────── */}
      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default CEOVatConfig;
