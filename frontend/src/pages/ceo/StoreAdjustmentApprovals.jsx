import React, { useState, useEffect } from 'react';
import { getPendingAdjustments, approveAdjustment, rejectAdjustment } from '../../utils/storeApi';
import { playSound, sendPushNotification } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { CheckCircle, X, AlertCircle, Package, Plus, Minus } from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
  APPROVED: { bg: '#D1FAE5', color: '#065F46', text: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
};

const DigitalStamp = ({ approver, date, label }) => (
  <div style={{
    position: 'absolute', bottom: 40, right: 40,
    border: '3px solid #003366', borderRadius: 8, padding: '10px 16px',
    transform: 'rotate(-10deg)', color: '#003366',
    fontFamily: "'Courier New', monospace", fontWeight: 'bold',
    background: 'rgba(255,255,255,0.85)',
    animation: 'stampAppear 0.5s ease-out',
    zIndex: 10, textAlign: 'center'
  }}>
    <div style={{ fontSize: 12, letterSpacing: 1, borderBottom: '1px solid #003366', paddingBottom: 2, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 11 }}>By: {approver}</div>
    <div style={{ fontSize: 10 }}>{date}</div>
  </div>
);

const StoreAdjustmentApprovals = () => {
  const { showToast, ToastContainer } = useToast();
  const [adjustments, setAdjustments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      const res = await getPendingAdjustments();
      if (res.success) setAdjustments(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadDetail = (adj) => {
    setSelected(adj.id);
    setDetail(adj);
    setShowReject(false);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await approveAdjustment(selected);
      if (res.success) {
        showToast('Adjustment approved and applied to inventory', 'approved');
        playSound('success');
        sendPushNotification(
          'Stock Adjustment Approved',
          `${detail.drug_name} ${detail.strength || ''} — ${detail.adjustment_type} ${Math.abs(detail.adjustment_qty)} units`,
          '/store/stock-adjustments'
        );
        setDetail(d => ({ ...d, status: 'APPROVED', approved_by_name: 'CEO' }));
        loadPending();
      } else {
        showToast(res.message || 'Approval failed', 'error');
      }
    } catch (e) { showToast('Approval failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please provide a rejection reason', 'warning'); return; }
    setActionLoading(true);
    try {
      const res = await rejectAdjustment(selected, rejectReason);
      if (res.success) {
        showToast(`Adjustment rejected: ${rejectReason}`, 'rejected');
        playSound('error');
        sendPushNotification(
          'Stock Adjustment Rejected',
          `${detail.drug_name} ${detail.strength || ''} — ${rejectReason}`,
          '/store/stock-adjustments'
        );
        setDetail(d => ({ ...d, status: 'REJECTED' }));
        setShowReject(false);
        loadPending();
      } else {
        showToast(res.message || 'Rejection failed', 'error');
      }
    } catch (e) { showToast('Rejection failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const pendingCount = adjustments.filter(a => a.status === 'PENDING').length;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <ToastContainer />
      <style>{`@keyframes stampAppear { from { transform: rotate(-10deg) scale(0); opacity: 0; } to { transform: rotate(-10deg) scale(1); opacity: 1; } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#1E293B' }}>Stock Adjustment Approvals</h2>
        {pendingCount > 0 && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{pendingCount} pending</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: '80vh', overflow: 'auto' }}>
          {adjustments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No pending adjustments</div>
          ) : adjustments.map(a => {
            const badge = STATUS_BADGES[a.status] || {};
            return (
              <div key={a.id} onClick={() => loadDetail(a)} style={{
                padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                background: selected === a.id ? '#F0FDF4' : 'white',
                borderLeft: selected === a.id ? '3px solid #059669' : '3px solid transparent',
                transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: '#1E293B' }}>{a.adjustment_no}</strong>
                  <span style={{ background: badge.bg, color: badge.color, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{badge.text}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151' }}>{a.drug_name}{a.strength ? ' ' + a.strength : ''}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                  <span>{a.adjustment_type === 'Addition' ? '+' : '-'}{Math.abs(a.adjustment_qty)}</span>
                  <span>{a.adjustment_type}</span>
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.5rem', position: 'relative', minHeight: 400 }}>
          {!detail ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94A3B8', fontSize: 13 }}>
              Select an adjustment to review
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#1E293B' }}>{detail.adjustment_no}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>{new Date(detail.created_at).toLocaleString()}</p>
                </div>
                <span style={{
                  background: STATUS_BADGES[detail.status]?.bg || '#F1F5F9',
                  color: STATUS_BADGES[detail.status]?.color || '#475569',
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700
                }}>{STATUS_BADGES[detail.status]?.text || detail.status}</span>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Package size={18} color="#2563EB" />
                  <h4 style={{ margin: 0, fontSize: 14, color: '#1E293B' }}>{detail.drug_name}{detail.strength ? ' ' + detail.strength : ''} — {detail.unit || ''}</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: detail.adjustment_type === 'Addition' ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, padding: 12, border: '1px solid ' + (detail.adjustment_type === 'Addition' ? '#BBF7D0' : '#FECACA') }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      {detail.adjustment_type === 'Addition' ? <Plus size={16} color="#059669" /> : <Minus size={16} color="#EF4444" />}
                      <strong style={{ fontSize: 12, color: detail.adjustment_type === 'Addition' ? '#065F46' : '#991B1B' }}>{detail.adjustment_type}</strong>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: detail.adjustment_type === 'Addition' ? '#059669' : '#EF4444' }}>
                      {detail.adjustment_type === 'Addition' ? '+' : '-'}{Math.abs(detail.adjustment_qty)}
                    </div>
                  </div>
                  <div style={{ background: '#EFF6FF', borderRadius: 8, padding: 12, border: '1px solid #DBEAFE' }}>
                    <strong style={{ fontSize: 12, color: '#1E40AF' }}>INVENTORY IMPACT</strong>
                    <div style={{ fontSize: 13, color: '#1E293B', marginTop: 8 }}>
                      <div>Before: <strong>{detail.quantity_before}</strong></div>
                      <div>After: <strong>{detail.quantity_after}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>Reason</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{detail.reason || 'N/A'}</div>
                {detail.batch_no && <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Batch: {detail.batch_no}</div>}
              </div>

              {detail.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={handleApprove} disabled={actionLoading} style={{
                    flex: 1, padding: '12px 20px', background: '#059669', color: 'white', border: 'none',
                    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}><CheckCircle size={18} /> {actionLoading ? 'Processing...' : 'APPROVE \u2714\uFE0F'}</button>
                  <button onClick={() => setShowReject(!showReject)} style={{
                    flex: 1, padding: '12px 20px', background: 'white', color: '#EF4444', border: '1px solid #FCA5A5',
                    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}><X size={18} /> REJECT \u274C</button>
                </div>
              )}

              {showReject && (
                <div style={{ marginTop: 12, background: '#FEF2F2', borderRadius: 8, padding: 12, border: '1px solid #FECACA' }}>
                  <textarea placeholder="Rejection reason (required)..." value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)} rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #FCA5A5', fontSize: 12, resize: 'vertical', marginBottom: 8 }} />
                  <button onClick={handleReject} disabled={actionLoading} style={{
                    padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none',
                    borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: actionLoading ? 'not-allowed' : 'pointer'
                  }}>{actionLoading ? 'Rejecting...' : 'Confirm Reject'}</button>
                </div>
              )}

              {detail.status === 'APPROVED' && <DigitalStamp approver={'CEO'} date={new Date(detail.approved_at || detail.updated_at).toLocaleDateString()} label="APPROVED" />}
              {detail.status === 'REJECTED' && detail.rejection_reason && (
                <div style={{ marginTop: 12, padding: 12, background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                  <strong style={{ fontSize: 12, color: '#991B1B' }}>Rejection Reason:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7F1D1D' }}>{detail.rejection_reason}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreAdjustmentApprovals;
