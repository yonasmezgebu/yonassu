import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { playSound, sendPushNotification } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { CheckCircle, X, AlertCircle, Clock, Package, Truck, DollarSign } from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
  APPROVED: { bg: '#DBEAFE', color: '#1E40AF', text: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
  SHIPPED: { bg: '#F3E8FF', color: '#6B21A8', text: 'Shipped' },
  COMPLETED: { bg: '#D1FAE5', color: '#065F46', text: 'Completed' },
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

const PharmacyTransferApprovals = () => {
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await apiClient.get('/pharmacy/transfers');
      if (res.status === 'success') setRequests(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadDetail = async (id) => {
    setSelected(id);
    setShowReject(false);
    try {
      const res = await apiClient.get(`/pharmacy/transfers/${id}`);
      if (res.status === 'success') setDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/pharmacy/transfers/${selected}/approve`);
      if (res.status === 'success') {
        showToast('Request approved. Store Manager notified.', 'approved');
        playSound('success');
        sendPushNotification('Pharmacy Transfer Approved', `${detail.drug_name} — Ship requested units to Pharmacy`, `/store/pharmacy-shipments/${selected}`);
        setDetail(d => ({ ...d, status: 'APPROVED', approved_by_name: 'You' }));
        loadRequests();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Approval failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please provide a rejection reason', 'warning'); return; }
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/pharmacy/transfers/${selected}/reject`, { reason: rejectReason });
      if (res.status === 'success') {
        showToast(`Request rejected: ${rejectReason}`, 'rejected');
        playSound('error');
        sendPushNotification('Pharmacy Transfer Rejected', `${detail.drug_name} — ${rejectReason}`, `/pharmacy/transfers`);
        setDetail(d => ({ ...d, status: 'REJECTED' }));
        setShowReject(false);
        loadRequests();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Rejection failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <ToastContainer />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#1E293B' }}>Pharmacy Transfer Approvals</h2>
        {pendingCount > 0 && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{pendingCount} pending</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: List */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: '80vh', overflow: 'auto' }}>
          {requests.map(r => {
            const badge = STATUS_BADGES[r.status] || {};
            return (
              <div key={r.id} onClick={() => loadDetail(r.id)} style={{
                padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                background: selected === r.id ? '#F0FDF4' : 'white',
                borderLeft: selected === r.id ? '3px solid #059669' : '3px solid transparent',
                transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: '#1E293B' }}>{r.request_number}</strong>
                  <span style={{ background: badge.bg, color: badge.color, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{badge.text}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151' }}>{r.drug_name}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                  <span>Qty: {r.quantity_requested}</span>
                  <span>Urgency: {r.urgency}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detail */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.5rem', position: 'relative', minHeight: 400 }}>
          {!detail ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94A3B8', fontSize: 13 }}>
              Select a request to review
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#1E293B' }}>{detail.request_number}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>Requested by {detail.created_by_name}</p>
                </div>
                <span style={{
                  background: STATUS_BADGES[detail.status]?.bg || '#F1F5F9',
                  color: STATUS_BADGES[detail.status]?.color || '#475569',
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700
                }}>{STATUS_BADGES[detail.status]?.text || detail.status}</span>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1E293B' }}>{detail.drug_name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#EFF6FF', borderRadius: 8, padding: 12, border: '1px solid #DBEAFE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Package size={16} color="#2563EB" /> <strong style={{ fontSize: 12, color: '#1E40AF' }}>STORE INVENTORY</strong>
                    </div>
                    <div style={{ fontSize: 13, color: '#1E293B' }}>
                      <div>Available: <strong>{detail.current_store_stock || detail.store_qty_before}</strong></div>
                      <div>Unit Price: <strong>{detail.store_unit_price ? `${detail.store_unit_price} ETB` : 'N/A'}</strong></div>
                      <div>Total Value: <strong>{detail.store_unit_price ? `${(detail.store_unit_price * (detail.current_store_stock || 0)).toLocaleString()} ETB` : 'N/A'}</strong></div>
                    </div>
                  </div>
                  <div style={{ background: '#FDF2F8', borderRadius: 8, padding: 12, border: '1px solid #FCE7F3' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <AlertCircle size={16} color="#EC4899" /> <strong style={{ fontSize: 12, color: '#9D174D' }}>PHARMACY INVENTORY</strong>
                    </div>
                    <div style={{ fontSize: 13, color: '#1E293B' }}>
                      <div>Current Qty: <strong>{detail.current_pharmacy_stock || detail.pharmacy_qty_before}</strong></div>
                      <div>Reorder Level: <strong>{detail.pharmacy_reorder_level}</strong></div>
                      <div>Shortage: <strong style={{ color: '#EF4444' }}>{(detail.pharmacy_reorder_level - (detail.current_pharmacy_stock || 0)) > 0 ? `-${detail.pharmacy_reorder_level - (detail.current_pharmacy_stock || 0)}` : 'None'}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>Requested Qty: {detail.quantity_requested}</div>
                <div style={{ fontSize: 12, color: '#065F46' }}>Urgency: <strong>{detail.urgency}</strong></div>
                {detail.notes && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>Notes: {detail.notes}</div>}
              </div>

              {detail.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={handleApprove} disabled={actionLoading} style={{
                    flex: 1, padding: '12px 20px', background: '#059669', color: 'white', border: 'none',
                    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}><CheckCircle size={18} /> {actionLoading ? 'Processing...' : 'APPROVE ✅'}</button>
                  <button onClick={() => setShowReject(!showReject)} style={{
                    flex: 1, padding: '12px 20px', background: 'white', color: '#EF4444', border: '1px solid #FCA5A5',
                    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}><X size={18} /> REJECT ❌</button>
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

              {detail.approved_by_name && <DigitalStamp approver={detail.approved_by_name} date={new Date().toLocaleDateString()} label="APPROVED" />}
              {detail.rejection_reason && (
                <div style={{ marginTop: 12, padding: 12, background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                  <strong style={{ fontSize: 12, color: '#991B1B' }}>Rejection Reason:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7F1D1D' }}>{detail.rejection_reason}</p>
                </div>
              )}

              {detail.shipment_number && (
                <div style={{ marginTop: 12, padding: 12, background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={16} color="#6B21A8" />
                    <strong style={{ fontSize: 12, color: '#6B21A8' }}>Shipment #{detail.shipment_number}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#4C1D95', marginTop: 4 }}>Shipped: {detail.quantity_shipped} units</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyTransferApprovals;
