import React, { useState, useEffect } from 'react';
import { Sliders, Search, Save, CheckCircle, XCircle, AlertTriangle, ClipboardList } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import { useToast } from '../../components/Toast';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import './StockOperations.css';

const PharmacyStockAdjustment = () => {
  const { showToast, ToastContainer } = useToast();
  const [drugs, setDrugs] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState('add');
  const [adjReason, setAdjReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [spinning, setSpinning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRaw, movRaw] = await Promise.all([
        pharmacyService.getAllProducts(),
        pharmacyService.getStockMovements()
      ]);
      setDrugs(Array.isArray(prodRaw) ? prodRaw : prodRaw?.data || []);
      setMovements(Array.isArray(movRaw) ? movRaw : movRaw?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); setSpinning(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => {
    setSpinning(true);
    loadData();
  };

  const selectedDrug = drugs.find(d => d.id === parseInt(selectedId));

  const doSubmit = async () => {
    if (!selectedId || !adjQty || !adjReason.trim()) return;
    setSaving(true);
    try {
      const qty = adjType === 'remove' ? -Math.abs(parseInt(adjQty)) : Math.abs(parseInt(adjQty));
      const requestedVal = (selectedDrug.stock_quantity || 0) + qty;

      if (requestedVal < 0) {
        setMsg({ type: 'error', text: 'Stock cannot go below 0' });
        setSaving(false);
        return;
      }

      await pharmacyService.createManagerRequest({
        drug_id: selectedDrug.id,
        drug_name: selectedDrug.name,
        drug_image: selectedDrug.drug_image,
        request_type: 'QUANTITY',
        current_value: selectedDrug.stock_quantity || 0,
        requested_value: requestedVal,
        reason: adjReason
      });
      setMsg({ type: 'success', text: `Adjustment requested for ${selectedDrug?.name} ${qty >= 0 ? '+' : ''}${qty}. Pending CEO approval.` });
      setAdjQty('');
      setAdjReason('');
      loadData();
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Adjustment failed' });
    } finally { setSaving(false); setTimeout(() => setMsg({ type: '', text: '' }), 5000); }
  };

  const filteredMovements = movements.filter(m => {
    const qtyChange = parseInt(m.quantity_change || m.quantity || 0);
    const mType = (m.type || (qtyChange >= 0 ? 'add' : 'remove')).toLowerCase();
    if (typeFilter && mType !== typeFilter.toLowerCase()) return false;
    const q = search.toLowerCase();
    return (m.drug_name || '').toLowerCase().includes(q) ||
           (m.reason || m.notes || '').toLowerCase().includes(q) ||
           mType.includes(q) ||
           (m.reference || m.reference_no || '').toLowerCase().includes(q);
  });

  const isFormReady = selectedId && adjQty && adjReason.trim() && !saving;

  return (
    <div className="pso-root">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Inline msg toast */
        .adj-toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          background: var(--color-bg-card);
          border-left: 4px solid var(--color-success);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          padding: 14px 20px; min-width: 280px;
          animation: slideIn .2s ease;
          display: flex; gap: 12px; align-items: center;
          font-size: 14px; font-weight: 500;
          color: var(--color-text-primary);
        }
        .adj-toast.error { border-left-color: var(--color-danger); }

        /* Adjustment type radio cards */
        .adj-type-card {
          flex: 1; display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; cursor: pointer;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg-page);
          transition: all var(--transition);
          font-size: 14px; font-weight: 500;
          color: var(--color-text-secondary);
        }
        .adj-type-card:hover { border-color: var(--color-primary); background: var(--color-bg-card); }
        .adj-type-card.active-add {
          background: var(--color-success-bg);
          border-color: var(--color-success);
          color: var(--color-success);
          font-weight: 600;
        }
        .adj-type-card.active-remove {
          background: var(--color-danger-bg);
          border-color: var(--color-danger);
          color: var(--color-danger);
          font-weight: 600;
        }
        .adj-type-card input[type="radio"] { accent-color: var(--color-primary); }

        /* Audit log row hover */
        .audit-row:hover { background: var(--color-bg-page) !important; }
        .audit-row { transition: background var(--transition); }
      `}</style>

      <ToastContainer />

      {/* Inline msg toast */}
      {msg.text && (
        <div className={`adj-toast ${msg.type === 'error' ? 'error' : ''}`}>
          {msg.type === 'success'
            ? <CheckCircle size={18} color="var(--color-success)" />
            : <XCircle size={18} color="var(--color-danger)" />}
          <span style={{ flex: 1 }}>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <Sliders size={20} />
          </div>
          <div>
            <h1 className="pso-title">Stock Adjustment</h1>
            <p className="pso-subtitle">Audit · Reconcile · Track</p>
          </div>
        </div>
        <div className="pso-header-right">
          <button onClick={handleRefresh} className="pso-btn-refresh" disabled={spinning || loading}>
            <SegmentedSpinner size={15} spinning={spinning || loading} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="pso-content">
        <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

          {/* Error banner */}
          {error && (
            <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <XCircle size={16} /> {error}
            </div>
          )}

          {/* Top 2-col grid: Form + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,.9fr)', gap: 24, marginBottom: 24 }}>

            {/* ── Adjustment Form ── */}
            <div className="card-container" style={{ padding: 24, borderTop: '4px solid var(--color-primary)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} color="var(--color-primary)" /> New Adjustment Request
              </h3>

              <div style={{ marginBottom: 16 }}>
                <label className="pso-label">Select Drug <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select
                  className="pso-input"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  <option value="">Choose a drug...</option>
                  {drugs.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Stock: {d.stock_quantity || 0})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDrug && (
                <div style={{ padding: '12px 16px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 20 }}>
                  <span>Current Stock: <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{selectedDrug.stock_quantity || 0}</strong></span>
                  <span>Reorder Level: <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{selectedDrug.reorder_level || 10}</strong></span>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="pso-label">Adjustment Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['add', 'remove'].map(t => (
                    <label
                      key={t}
                      className={`adj-type-card ${adjType === t ? (t === 'add' ? 'active-add' : 'active-remove') : ''}`}
                    >
                      <input type="radio" value={t} checked={adjType === t} onChange={() => setAdjType(t)} />
                      {t === 'add' ? '+ Add Stock' : '− Remove Stock'}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="pso-label">Quantity <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="pso-input"
                  type="number"
                  min={1}
                  value={adjQty}
                  onChange={e => setAdjQty(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="pso-label">Reason <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  className="pso-input"
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  placeholder="Why is this adjustment needed?"
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
              </div>

              <button
                disabled={!isFormReady}
                onClick={doSubmit}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, opacity: !isFormReady ? 0.5 : 1, cursor: !isFormReady ? 'not-allowed' : 'pointer' }}
              >
                {saving
                  ? <><SegmentedSpinner size={16} spinning={true} /> Requesting...</>
                  : <><Save size={16} /> Request Adjustment</>
                }
              </button>
            </div>

            {/* ── Right column: Stats + Reminder ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Quick stats */}
              <div className="card-container" style={{ padding: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Quick Stats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Total Drugs', value: drugs.length, color: 'var(--color-primary)', bg: 'var(--color-info-bg)' },
                    { label: 'Recent Adjustments', value: movements.slice(0, 50).length, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
                  ].map(c => (
                    <div key={c.label} style={{ background: c.bg, padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: c.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{c.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{loading ? '—' : c.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--color-warning)', marginBottom: 8, fontSize: 14 }}>
                  <AlertTriangle size={16} /> Approval Required
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                  All stock adjustments require Manager / CEO approval before stock is actually modified. Always provide a clear reason for audit compliance.
                </div>
              </div>
            </div>
          </div>

          {/* ── Audit Log ── */}
          <div className="card-container" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Log header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card)', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} color="var(--color-primary)" /> Adjustment &amp; Movement Audit Log
              </span>
              <span className="pso-badge">
                {loading ? <><SegmentedSpinner size={12} spinning={true} /> Loading...</> : `${filteredMovements.length} Records`}
              </span>
            </div>

            {/* Search toolbar */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, background: 'var(--color-bg-page)', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={15} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="pso-input"
                  type="text"
                  placeholder="Search audit log..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <select
                className="pso-input"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 140 }}
              >
                <option value="">All Types</option>
                <option value="add">Add (+)</option>
                <option value="remove">Remove (−)</option>
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="pso-table" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Drug</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Qty Change</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <SegmentedSpinner size={24} spinning={true} />
                        <div style={{ marginTop: 12 }}>Loading audit log...</div>
                      </td>
                    </tr>
                  ) : filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <ClipboardList size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>No adjustments recorded yet</p>
                      </td>
                    </tr>
                  ) : filteredMovements.map((m, idx) => {
                    const qtyChange = parseInt(m.quantity_change || m.quantity || 0);
                    const isAdd = (m.type || '').toLowerCase() === 'add' || (m.type || '').toLowerCase() === 'in' || qtyChange >= 0;
                    return (
                      <tr key={m.id || idx} className="audit-row">
                        <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontSize: 13 }}>
                          {m.created_at ? new Date(m.created_at).toLocaleString() : '—'}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {m.drug_name || 'Unknown'}
                        </td>
                        <td>
                          <span className="pso-badge" style={{
                            background: isAdd ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                            color: isAdd ? 'var(--color-success)' : 'var(--color-danger)',
                          }}>
                            {isAdd ? 'ADD' : 'REMOVE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isAdd ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {isAdd ? '+' : ''}{qtyChange}
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                          {m.reason || m.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PharmacyStockAdjustment;
