import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import { ClipboardList, CheckCircle, XCircle, Clock, RefreshCw, Search, Package } from 'lucide-react';

export default function CEOStoreRequisitions() {
  const { showToast, ToastContainer } = useToast();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [reviewing, setReviewing] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequisitions = async (status) => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : '';
      const res = await apiClient.get(`/store/requisitions${params}`);
      setRequisitions(res.data || []);
    } catch (e) {
      console.error(e);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequisitions(filter); }, [filter]);

  const handleDecision = async (req, decision) => {
    setActionLoading(true);
    try {
      await apiClient.put(`/store/requisitions/${req.id}/status`, {
        status: decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Wait',
        decided_by: 'CEO',
        rejection_reason: decision === 'reject' ? (reviewing?.rejectReason || 'Rejected by CEO') : undefined,
      });
      const label = decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Set to Wait';
      showToast(`Requisition ${req.requisition_no} ${label}`, 'success');
      playSound('success');
      setReviewing(null);
      fetchRequisitions(filter);
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const STATUS_BADGES = {
    Pending: { bg: '#FEF3C7', color: '#92400E', text: '⏳ Pending' },
    Approved: { bg: '#D1FAE5', color: '#065F46', text: '✅ Approved' },
    Rejected: { bg: '#FEE2E2', color: '#991B1B', text: '❌ Rejected' },
    Wait: { bg: '#DBEAFE', color: '#1E40AF', text: '⏸️ Wait' },
    Issued: { bg: '#F1F5F9', color: '#475569', text: '📦 Issued' },
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#F8FAFC' }}>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#0F172A' }}>
            <ClipboardList size={26} color="#059669" /> Store Requisitions
          </h1>
          <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: 13 }}>
            Review and approve/reject/wait pharmacy store requisitions
          </p>
        </div>
        <button onClick={() => fetchRequisitions(filter)}
          style={{ padding: '8px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['Pending', 'Approved', 'Rejected', 'Wait', 'Issued'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 12,
              background: filter === s ? (STATUS_BADGES[s]?.bg || '#F1F5F9') : 'white',
              color: filter === s ? (STATUS_BADGES[s]?.color || '#475569') : '#64748B',
              boxShadow: filter === s ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {STATUS_BADGES[s]?.text || s}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
        ) : requisitions.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94A3B8' }}>
            <Package size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
            <p style={{ fontWeight: 600, margin: 0 }}>No {filter.toLowerCase()} requisitions</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>Req #</th>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Dept</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map((r, idx) => {
                const badge = STATUS_BADGES[r.status] || STATUS_BADGES.Pending;
                const firstItem = r.items?.[0];
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#FAFBFC' }}>
                    <td style={tdStyle}><strong>{r.requisition_no}</strong></td>
                    <td style={tdStyle}>{firstItem?.item_name || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{firstItem?.quantity || '—'}</td>
                    <td style={tdStyle}>{r.department || '—'}</td>
                    <td style={{ ...tdStyle, color: '#64748B', fontSize: 12 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: badge.bg, color: badge.color, padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {badge.text}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => setReviewing({ ...r, rejectReason: '' })}
                        style={{ padding: '5px 12px', background: '#0F172A', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} color="#059669" /> Review Requisition
              </h3>
              <button onClick={() => setReviewing(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>&times;</button>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 20, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Requisition #</span><br /><strong>{reviewing.requisition_no}</strong></div>
                <div><span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Dept</span><br /><strong>{reviewing.department}</strong></div>
              </div>
              <div style={{ marginTop: 12 }}>
                {(reviewing.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #E2E8F0' }}>
                    <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>x{item.quantity}</span>
                  </div>
                ))}
              </div>
              {reviewing.remarks && (
                <div style={{ marginTop: 12, padding: 8, background: '#FFFBEB', borderRadius: 4, borderLeft: '3px solid #F59E0B', fontSize: 12, color: '#92400E' }}>
                  <strong>Reason:</strong> {reviewing.remarks}
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 11, color: '#64748B' }}>Status: </span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>{reviewing.status}</span>
              </div>
            </div>

            {reviewing.status === 'Pending' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Rejection Reason (required if rejecting)</label>
                  <textarea value={reviewing.rejectReason || ''} onChange={e => setReviewing({ ...reviewing, rejectReason: e.target.value })}
                    rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Enter reason..." />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleDecision(reviewing, 'approve')} disabled={actionLoading}
                    style={{ flex: 1, padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: actionLoading ? 0.6 : 1 }}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => handleDecision(reviewing, 'wait')} disabled={actionLoading}
                    style={{ flex: 1, padding: '10px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: actionLoading ? 0.6 : 1 }}>
                    <Clock size={16} /> Wait
                  </button>
                  <button onClick={() => handleDecision(reviewing, 'reject')} disabled={actionLoading || !reviewing.rejectReason}
                    style={{ flex: 1, padding: '10px', background: (actionLoading || !reviewing.rejectReason) ? '#E2E8F0' : '#EF4444', color: (actionLoading || !reviewing.rejectReason) ? '#94A3B8' : 'white', border: 'none', borderRadius: 8, cursor: (actionLoading || !reviewing.rejectReason) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            )}

            {reviewing.status !== 'Pending' && (
              <div style={{ textAlign: 'center', padding: 12, background: '#F1F5F9', borderRadius: 8, color: '#64748B', fontSize: 13 }}>
                This requisition has already been {reviewing.status.toLowerCase()}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
