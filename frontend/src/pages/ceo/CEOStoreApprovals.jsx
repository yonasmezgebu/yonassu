import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Check, X, Search, RefreshCw, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import apiClient from '../../services/apiClient';

/* ─── Fields compared between the current and proposed store state ─── */
const FIELD_ROWS = [
  { key: 'material_name',     label: 'Material Name' },
  { key: 'category',          label: 'Category' },
  { key: 'department',        label: 'Department' },
  { key: 'unit',              label: 'Unit' },
  { key: 'quantity_in_store', label: 'Quantity',          numeric: true },
  { key: 'unit_value',        label: 'Unit Value (ETB)',  numeric: true },
  { key: 'total_value',       label: 'Total Value (ETB)', numeric: true },
  { key: 'reorder_level',     label: 'Reorder Level',     numeric: true },
];

const parseState = (s) => (typeof s === 'string' ? JSON.parse(s) : (s || {}));

const isEmpty = (v) => v === null || v === undefined || v === '';

const formatField = (field, v) => {
  if (isEmpty(v)) return '—';
  if (field.numeric) return Number(v).toLocaleString();
  return String(v);
};

const isFieldChanged = (field, before, after) => {
  if (field.numeric) return Number(before[field.key] || 0) !== Number(after[field.key] || 0);
  return String(before[field.key] ?? '') !== String(after[field.key] ?? '');
};

/* ─── Enterprise Global Styles ─── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .csa-page {
      font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      color: #111827;
      background: #F5F6FA;
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
    }

    .csa-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }

    /* Back Button */
    .csa-back-bar {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px; background: #FFFFFF;
      padding: 10px 16px; border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    .csa-back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: 13px; font-weight: 500;
      border: 1px solid #E5E7EB; background: #F9FAFB; color: #4B5563;
      font-family: inherit; transition: all 150ms ease-in-out;
    }
    .csa-back-btn:hover {
      background: #F59E0B; color: #FFFFFF; border-color: #F59E0B;
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }
    .csa-back-divider { width: 1px; height: 24px; background: #E5E7EB; }
    .csa-back-label {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 6px;
      font-size: 13px; font-weight: 600;
      border: 1px solid #2563EB; background: #EFF6FF; color: #1E40AF;
    }

    .csa-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 7px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: 1px solid transparent;
      transition: all 150ms ease-in-out;
      white-space: nowrap; min-height: 36px;
      font-family: inherit;
    }
    .csa-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.12); }

    .csa-btn-approve { background: #16A34A; color: #fff; border-color: #15803D; }
    .csa-btn-approve:hover { background: #FFD700; border-color: #FFD700; color: #111827; }

    .csa-btn-reject { background: #FEE2E2; color: #DC2626; border-color: #FECACA; }
    .csa-btn-reject:hover { background: #FFD700; border-color: #FFD700; color: #111827; }

    .csa-btn-secondary { background: #F9FAFB; color: #374151; border-color: #E5E7EB; }
    .csa-btn-secondary:hover { background: #FFD700; border-color: #FFD700; color: #111827; }

    .csa-btn-danger { background: #DC2626; color: #fff; border-color: #B91C1C; }
    .csa-btn-danger:hover { background: #FFD700; border-color: #FFD700; color: #111827; }

    .csa-btn-refresh { background: #fff; color: #374151; border-color: #E5E7EB; }
    .csa-btn-refresh:hover { background: #FFD700; border-color: #FFD700; color: #111827; }

    .csa-search-wrap { position: relative; }
    .csa-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
    .csa-search-input {
      padding: 9px 12px 9px 36px; border: 1px solid #E5E7EB; border-radius: 7px;
      font-size: 13px; font-family: inherit; width: 220px; outline: none;
      transition: border-color 150ms; background: #fff;
    }
    .csa-search-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }

    .csa-update-card {
      background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden;
      transition: box-shadow 150ms ease-in-out;
    }
    .csa-update-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }

    .csa-compare { display: flex; gap: 20px; padding: 20px; background: #F9FAFB; align-items: flex-start; flex-wrap: wrap; }
    .csa-compare-side { flex: 1; min-width: 160px; }
    .csa-compare-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
    .csa-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .csa-stat-box { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
    .csa-stat-box.after { border-color: #A7F3D0; }
    .csa-stat-label { font-size: 11px; color: #6B7280; margin-bottom: 4px; font-weight: 500; }
    .csa-stat-value { font-size: 15px; font-weight: 700; color: #111827; }
    .csa-stat-value.after { color: #065F46; }
    .csa-stat-delta { font-size: 11px; color: #059669; margin-top: 4px; font-weight: 500; }

    .csa-arrow-wrap { display: flex; align-items: center; justify-content: center; padding: 28px 4px 0; }

    .csa-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
    .csa-badge-warning { background: #FEF3C7; color: #D97706; }

    /* Requested-change summary */
    .csa-changes { padding: 16px 20px; background: #FFF7ED; border-bottom: 1px solid #FED7AA; }
    .csa-changes-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
      color: #9A3412; margin-bottom: 10px;
    }
    .csa-change-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 7px 0; border-top: 1px dashed #FED7AA;
    }
    .csa-change-row:first-of-type { border-top: none; }
    .csa-change-field { min-width: 140px; font-size: 12px; font-weight: 700; color: #7C2D12; }
    .csa-change-before { font-size: 13px; color: #9CA3AF; text-decoration: line-through; }
    .csa-change-arrow { color: #EA580C; flex-shrink: 0; }
    .csa-change-after { font-size: 13px; font-weight: 700; color: #B45309; }
    .csa-nochange { font-size: 13px; color: #92400E; }

    /* Full detail table */
    .csa-detail-grid { display: grid; gap: 1px; background: #F3F4F6; border-top: 1px solid #F3F4F6; }
    .csa-detail-row {
      display: grid; grid-template-columns: minmax(150px, 1.2fr) 2fr;
      gap: 12px; padding: 11px 20px; background: #fff; align-items: center;
    }
    .csa-detail-row.changed { background: #FFFBEB; }
    .csa-detail-label { font-size: 12px; font-weight: 600; color: #6B7280; display: flex; align-items: center; gap: 8px; }
    .csa-detail-flag {
      font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em;
      color: #B45309; background: #FEF3C7; border: 1px solid #FDE68A;
      padding: 1px 6px; border-radius: 10px;
    }
    .csa-detail-vals { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; }
    .csa-detail-before { color: #6B7280; }
    .csa-detail-row.changed .csa-detail-before { color: #9CA3AF; text-decoration: line-through; }
    .csa-detail-after { font-weight: 700; color: #111827; }
    .csa-detail-row.changed .csa-detail-after { color: #B45309; }
    .csa-detail-sep { color: #D1D5DB; }

    @media (max-width: 640px) {
      .csa-detail-row { grid-template-columns: 1fr; gap: 4px; }
      .csa-change-field { min-width: 110px; }
    }

    .csa-modal-overlay {
      position: fixed; inset: 0; background: rgba(17,24,39,.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      backdrop-filter: blur(2px);
    }
    .csa-modal {
      background: #fff; border-radius: 12px; width: 440px; max-width: calc(100vw - 32px);
      overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,.18);
      animation: csaModalIn 150ms ease-out;
    }
    @keyframes csaModalIn { from { opacity: 0; transform: scale(.95) translateY(8px); } to { opacity: 1; transform: none; } }
    .csa-modal-header { padding: 18px 20px; border-bottom: 1px solid #E5E7EB; }
    .csa-modal-body { padding: 20px; }
    .csa-modal-footer { padding: 14px 20px; background: #F9FAFB; border-top: 1px solid #F3F4F6; display: flex; justify-content: flex-end; gap: 10px; }

    .csa-toast {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 20px; border-radius: 8px; color: #fff;
      font-size: 13px; font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,.15); z-index: 2000;
      animation: csaToastIn 250ms ease-out;
    }
    @keyframes csaToastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .csa-toast-success { background: #16A34A; }
    .csa-toast-error   { background: #DC2626; }

    .csa-empty { padding: 64px 24px; text-align: center; }

    .csa-textarea {
      width: 100%; box-sizing: border-box;
      padding: 10px 12px; border: 1.5px solid #D1D5DB; border-radius: 7px;
      font-family: inherit; font-size: 13px; resize: vertical; min-height: 90px;
      transition: border-color 150ms;
    }
    .csa-textarea:focus { border-color: #DC2626; outline: none; box-shadow: 0 0 0 3px rgba(220,38,38,.1); }

    @media (max-width: 640px) {
      .csa-compare { flex-direction: column; }
      .csa-search-input { width: 100%; }
    }
  `}</style>
);

const CEOStoreApprovals = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/ceo/store-updates/pending');
      setUpdates(res?.data?.updates || []);
    } catch (e) {
      setError(e.message || 'Failed to load store updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUpdates(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async () => {
    try {
      await apiClient.patch(`/ceo/store-updates/${approvingId}/approve`);
      showToast('Store update approved successfully');
      setApprovingId(null);
      window.dispatchEvent(new Event('refreshNotifications'));
      loadUpdates();
    } catch (e) {
      showToast(e.message || 'Failed to approve update', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { alert('Please enter a rejection reason.'); return; }
    try {
      await apiClient.patch(`/ceo/store-updates/${rejectingId}/reject`, { rejectionReason });
      showToast('Store update rejected');
      setRejectingId(null);
      setRejectionReason('');
      window.dispatchEvent(new Event('refreshNotifications'));
      loadUpdates();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to reject update', 'error');
    }
  };

  const filtered = updates.filter(u => {
    const term = search.toLowerCase();
    const before = parseState(u.before_state);
    const after = parseState(u.after_state);
    const haystack = [
      after.material_name, before.material_name,
      after.category, after.department, after.unit,
      String(u.material_id ?? ''),
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(term);
  });

  const getUpdateLabel = (type) => {
    switch (type) {
      case 'STORE_QUANTITY_UPDATE': return 'Quantity Update';
      case 'STORE_VALUE_UPDATE':    return 'Value Update';
      case 'STORE_MATERIAL_UPDATE': return 'Full Update';
      default: return 'Store Update';
    }
  };

  return (
    <div className="csa-page">
      <GlobalStyles />

      {/* ── Back Bar ── */}
      <div className="csa-back-bar">
        <button className="csa-back-btn" onClick={() => navigate('/ceo/approvals')}>
          <ArrowLeft size={14} /> Back to Approvals Hub
        </button>
        <div className="csa-back-divider" />
        <span className="csa-back-label">
          <Package size={15} /> Store Approvals
        </span>
      </div>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, background: '#F97316', borderRadius: 4 }} />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>
              General Store Updates
            </h1>
          </div>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 13, paddingLeft: 14 }}>
            Review pending inventory updates requiring CEO approval
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="csa-search-wrap">
            <span className="csa-search-icon"><Search size={15} color="#9CA3AF" /></span>
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="csa-search-input"
            />
          </div>
          <button onClick={loadUpdates} className="csa-btn csa-btn-refresh">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="csa-card csa-empty">
          <SegmentedSpinner size={28} color="#F97316" />
          <p style={{ marginTop: 12, color: '#6B7280', fontSize: 13 }}>Loading pending updates…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="csa-card csa-empty">
          <Package size={48} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#374151' }}>No Pending Updates</h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 13 }}>All store updates have been processed.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* summary bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#FFF7ED', borderRadius: 8, border: '1px solid #FED7AA', fontSize: 13, fontWeight: 500, color: '#9A3412' }}>
            <Package size={15} />
            <span><strong>{filtered.length}</strong> pending {filtered.length === 1 ? 'update' : 'updates'} awaiting CEO approval</span>
          </div>

          {filtered.map(u => {
            const before = parseState(u.before_state);
            const after  = parseState(u.after_state);
            const renamed = String(before.material_name ?? '') !== String(after.material_name ?? '');
            const changedFields = FIELD_ROWS.filter(f => isFieldChanged(f, before, after));

            return (
              <div key={u.id} className="csa-update-card">
                {/* card header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="csa-badge csa-badge-warning">{getUpdateLabel(u.update_type)}</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{new Date(u.created_at).toLocaleString()}</span>
                      {u.requested_by != null && (
                        <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>• Requested by #{u.requested_by}</span>
                      )}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {renamed ? (
                        <>
                          <span style={{ color: '#9CA3AF', fontWeight: 500, textDecoration: 'line-through' }}>{before.material_name || '—'}</span>
                          <ArrowRight size={14} style={{ verticalAlign: 'middle', margin: '0 6px', color: '#EA580C' }} />
                          <span>{after.material_name || '—'}</span>
                        </>
                      ) : (
                        <>{after.material_name || before.material_name || '—'}</>
                      )}
                      <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 13, marginLeft: 6 }}>({u.material_id})</span>
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="csa-btn csa-btn-reject" onClick={() => setRejectingId(u.id)}>
                      <X size={13} /> Reject
                    </button>
                    <button className="csa-btn csa-btn-approve" onClick={() => setApprovingId(u.id)}>
                      <Check size={13} /> Approve
                    </button>
                  </div>
                </div>

                {/* Requested changes — only the fields that actually differ */}
                <div className="csa-changes">
                  <div className="csa-changes-title">
                    <AlertTriangle size={13} />
                    {changedFields.length > 0
                      ? `${changedFields.length} requested change${changedFields.length === 1 ? '' : 's'}`
                      : 'Requested changes'}
                  </div>
                  {changedFields.length === 0 ? (
                    <div className="csa-nochange">No field values differ in this request.</div>
                  ) : (
                    changedFields.map(f => (
                      <div key={f.key} className="csa-change-row">
                        <span className="csa-change-field">{f.label}</span>
                        <span className="csa-change-before">{formatField(f, before[f.key])}</span>
                        <ArrowRight size={13} className="csa-change-arrow" />
                        <span className="csa-change-after">{formatField(f, after[f.key])}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Full detail — current vs proposed for every field */}
                <div className="csa-detail-grid">
                  {FIELD_ROWS.map(f => {
                    const changed = isFieldChanged(f, before, after);
                    return (
                      <div key={f.key} className={`csa-detail-row${changed ? ' changed' : ''}`}>
                        <div className="csa-detail-label">
                          {f.label}
                          {changed && <span className="csa-detail-flag">changed</span>}
                        </div>
                        <div className="csa-detail-vals">
                          <span className="csa-detail-before">{formatField(f, before[f.key])}</span>
                          <ArrowRight size={12} className="csa-detail-sep" />
                          <span className="csa-detail-after">{formatField(f, after[f.key])}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectingId && (
        <div className="csa-modal-overlay" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
          <div className="csa-modal" onClick={e => e.stopPropagation()}>
            <div className="csa-modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <X size={18} color="#DC2626" /> Reject Store Update
              </h3>
            </div>
            <div className="csa-modal-body">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Reason for rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain why this update is rejected…"
                className="csa-textarea"
              />
            </div>
            <div className="csa-modal-footer">
              <button className="csa-btn csa-btn-secondary" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
                Cancel
              </button>
              <button className="csa-btn csa-btn-danger" onClick={handleReject}>
                <X size={13} /> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve Modal ── */}
      {approvingId && (
        <div className="csa-modal-overlay" onClick={() => setApprovingId(null)}>
          <div className="csa-modal" onClick={e => e.stopPropagation()}>
            <div className="csa-modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={18} color="#16A34A" /> Confirm Approval
              </h3>
            </div>
            <div className="csa-modal-body">
              <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                Are you sure you want to approve this store inventory update? This will <strong>permanently update</strong> the main store inventory database.
              </p>
            </div>
            <div className="csa-modal-footer">
              <button className="csa-btn csa-btn-secondary" onClick={() => setApprovingId(null)}>
                Cancel
              </button>
              <button className="csa-btn csa-btn-approve" onClick={handleApprove}>
                <Check size={13} /> Approve Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`csa-toast csa-toast-${toast.type}`}>
          {toast.type === 'error' ? <X size={16} /> : <Check size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default CEOStoreApprovals;
