import React, { useState, useEffect } from 'react';
import { Package, Check, X, Search, Filter } from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import apiClient from '../../services/apiClient';

const CEOStoreApprovals = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

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
    setTimeout(() => setToast(null), 3000);
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
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      await apiClient.patch(`/ceo/store-updates/${rejectingId}/reject`, {
        rejectionReason
      });
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
    return matName.includes(term) || u.material_id.toLowerCase().includes(term);
  });

  const getUpdateLabel = (type) => {
    switch (type) {
      case 'STORE_QUANTITY_UPDATE': return 'Quantity Update';
      case 'STORE_VALUE_UPDATE': return 'Value Update';
      case 'STORE_MATERIAL_UPDATE': return 'Full Update';
      default: return 'Store Update';
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#111827', maxWidth: 1000, margin: '0 auto', padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package color="#f97316" />
            General Store Updates
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>
            Review pending inventory updates requiring CEO approval
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '10px 12px 10px 36px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontSize: 14,
                width: 250,
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={loadUpdates}
            style={{
              padding: '0 16px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: 16, borderRadius: 8, marginBottom: 24 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <SegmentedSpinner size={24} color="#f97316" />
          <div style={{ marginTop: 12, color: '#6B7280' }}>Loading pending updates...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <Package size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: 0, fontSize: 16, color: '#374151' }}>No Pending Updates</h3>
          <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 14 }}>All store updates have been processed.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(u => {
            const before = typeof u.before_state === 'string' ? JSON.parse(u.before_state) : u.before_state;
            const after = typeof u.after_state === 'string' ? JSON.parse(u.after_state) : u.after_state;

            return (
              <div key={u.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, background: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: 4 }}>
                        {getUpdateLabel(u.update_type)}
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{new Date(u.created_at).toLocaleString()}</span>
                    </div>
                    <h3 style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 600 }}>{after.material_name} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 14 }}>({u.material_id})</span></h3>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setRejectingId(u.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                    >
                      <X size={16} /> Reject
                    </button>
                    <button
                      onClick={() => setApprovingId(u.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                    >
                      <Check size={16} /> Approve
                    </button>
                  </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', gap: 40, background: '#FAFAFA' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>Current State</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>Quantity</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{Number(before.quantity_in_store || 0).toLocaleString()} <span style={{fontSize: 12, color: '#9CA3AF', fontWeight: 400}}>{before.unit}</span></div>
                      </div>
                      <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>Unit Value</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>ETB {Number(before.unit_value || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: 8, background: '#E5E7EB', borderRadius: '50%' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#10B981', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>Proposed Update</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: 12, color: '#059669' }}>New Quantity</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#065F46' }}>{Number(after.quantity_in_store || 0).toLocaleString()} <span style={{fontSize: 12, opacity: 0.7, fontWeight: 400}}>{after.unit}</span></div>
                        {before.quantity_in_store !== after.quantity_in_store && (
                          <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                            {after.quantity_in_store > before.quantity_in_store ? '+' : ''}{after.quantity_in_store - before.quantity_in_store} change
                          </div>
                        )}
                      </div>
                      <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: 12, color: '#059669' }}>New Unit Value</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#065F46' }}>ETB {Number(after.unit_value || 0).toLocaleString()}</div>
                        {before.unit_value !== after.unit_value && (
                          <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                            {after.unit_value > before.unit_value ? '+' : ''}{after.unit_value - before.unit_value} change
                          </div>
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

      {rejectingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Reject Update</h3>
            </div>
            <div style={{ padding: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Reason for rejection</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain why this update is rejected..."
                style={{ width: '100%', height: 100, padding: 12, border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, resize: 'vertical' }}
              />
            </div>
            <div style={{ padding: '16px 20px', background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={{ padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {approvingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check color="#10B981" /> Confirm Approval
              </h3>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
                Are you sure you want to approve this store inventory update? This action will permanently update the main store inventory database.
              </p>
            </div>
            <div style={{ padding: '16px 20px', background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setApprovingId(null)}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                style={{ padding: '8px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? '#EF4444' : '#10B981', color: '#fff', padding: '12px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 1000
        }}>
          {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          <span style={{ fontWeight: 500 }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default CEOStoreApprovals;
