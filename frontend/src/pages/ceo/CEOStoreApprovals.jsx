import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Check, X, Search, RefreshCw, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import apiClient from '../../services/apiClient';

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
    const after = typeof u.after_state === 'string' ? JSON.parse(u.after_state) : (u.after_state || {});
    const matName = (after.material_name || '').toLowerCase();
    return matName.includes(term) || (u.material_id || '').toLowerCase().includes(term);
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
            const before = typeof u.before_state === 'string' ? JSON.parse(u.before_state) : (u.before_state || {});
            const after  = typeof u.after_state  === 'string' ? JSON.parse(u.after_state)  : (u.after_state  || {});
            const qtyDelta = (after.quantity_in_store || 0) - (before.quantity_in_store || 0);
            const valDelta = (after.unit_value || 0) - (before.unit_value || 0);

            return (
              <div key={u.id} className="csa-update-card">
                {/* card header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className="csa-badge csa-badge-warning">{getUpdateLabel(u.update_type)}</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{new Date(u.created_at).toLocaleString()}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {after.material_name || '—'}
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

                {/* before / after comparison */}
                <div className="csa-compare">
                  <div className="csa-compare-side">
                    <div className="csa-compare-label" style={{ color: '#6B7280' }}>Current State</div>
                    <div className="csa-compare-grid">
                      <div className="csa-stat-box">
                        <div className="csa-stat-label">Quantity</div>
                        <div className="csa-stat-value">
                          {Number(before.quantity_in_store || 0).toLocaleString()}
                          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 4 }}>{before.unit}</span>
                        </div>
                      </div>
                      <div className="csa-stat-box">
                        <div className="csa-stat-label">Unit Value</div>
                        <div className="csa-stat-value">ETB {Number(before.unit_value || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="csa-arrow-wrap">
                    <div style={{ padding: 8, background: '#E5E7EB', borderRadius: '50%' }}>
                      <ArrowRight size={16} color="#6B7280" />
                    </div>
                  </div>

                  <div className="csa-compare-side">
                    <div className="csa-compare-label" style={{ color: '#059669' }}>Proposed Update</div>
                    <div className="csa-compare-grid">
                      <div className="csa-stat-box after">
                        <div className="csa-stat-label" style={{ color: '#059669' }}>New Quantity</div>
                        <div className="csa-stat-value after">
                          {Number(after.quantity_in_store || 0).toLocaleString()}
                          <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>{after.unit}</span>
                        </div>
                        {qtyDelta !== 0 && (
                          <div className="csa-stat-delta">{qtyDelta > 0 ? '+' : ''}{qtyDelta} change</div>
                        )}
                      </div>
                      <div className="csa-stat-box after">
                        <div className="csa-stat-label" style={{ color: '#059669' }}>New Unit Value</div>
                        <div className="csa-stat-value after">ETB {Number(after.unit_value || 0).toLocaleString()}</div>
                        {valDelta !== 0 && (
                          <div className="csa-stat-delta">{valDelta > 0 ? '+' : ''}{valDelta} change</div>
                        )}
                      </div>
                    </div>
                  </div>
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
