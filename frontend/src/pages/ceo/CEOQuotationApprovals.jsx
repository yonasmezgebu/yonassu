import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft, Building2, AlertTriangle } from 'lucide-react';
import apiClient from '../../services/apiClient';

const CEOQuotationApprovals = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [itemsMap, setItemsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/purchase/quotations/pending-ceo');
      const data = Array.isArray(res?.data) ? res.data : [];
      setQuotations(data);
      // Fetch items for each quotation
      const itemsResults = {};
      await Promise.all(data.map(async (q) => {
        try {
          const iRes = await apiClient.get(`/purchase/quotations/${q.id}/items`);
          itemsResults[q.id] = Array.isArray(iRes?.data) ? iRes.data : [];
        } catch { itemsResults[q.id] = []; }
      }));
      setItemsMap(itemsResults);
    } catch (err) {
      showToast('Failed to load pending quotations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await apiClient.post(`/purchase/quotations/${id}/ceo-approve`, { action: 'approve' });
      showToast('Quotation approved successfully');
      fetchPending();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      await apiClient.post(`/purchase/quotations/${rejectModal.id}/ceo-approve`, {
        action: 'reject',
        reason: rejectReason
      });
      showToast('Quotation rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchPending();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: 24, width: '95%', maxWidth: 'none', margin: '0 auto', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
          background: toast.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: toast.type === 'error' ? '#B91C1C' : '#15803D',
          border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/ceo/approvals')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8,
          display: 'flex', alignItems: 'center', color: '#6B7280'
        }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#111827' }}>Purchase Quotation Approvals</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0 0' }}>Review and approve quotations submitted by the Purchase Manager</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          Loading pending quotations...
        </div>
      ) : quotations.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, background: '#FFFFFF', borderRadius: 12,
          border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <CheckCircle size={48} color="#16A34A" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>All Clear</h3>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>No quotations pending your approval.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {quotations.map(q => {
            const items = itemsMap[q.id] || [];
            const vatPct = parseFloat(q.vat_rate || 0);
            const vatAmt = parseFloat(q.vat_amount || 0);
            const viewSubtotal = items.length > 0
              ? items.reduce((s, i) => s + parseFloat(i.line_total || 0), 0)
              : parseFloat(q.total_amount || 0) - vatAmt;
            return (
              <div key={q.id} style={{
                background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden'
              }}>
                {/* Card Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={16} color="#D97706" />
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14, color: '#2563EB' }}>{q.quotation_no}</span>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>•</span>
                    <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>Pending CEO Approval</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#9CA3AF', marginBottom: 4 }}>Supplier</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={14} /> {q.supplier_name}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#9CA3AF', marginBottom: 4 }}>Agreed Via</div>
                      <div style={{ fontSize: 14, color: '#111827' }}>{q.agreed_via} on {q.date_agreed ? new Date(q.date_agreed).toLocaleDateString() : '—'}</div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#9CA3AF', marginBottom: 8 }}>Item Details ({items.length || q.item_count || 1} item{(items.length || q.item_count || 1) !== 1 ? 's' : ''})</div>
                    {items.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '6px 0', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>#</th>
                            <th style={{ padding: '6px 0', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Item</th>
                            <th style={{ padding: '6px 0', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Qty</th>
                            <th style={{ padding: '6px 0', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Cost Price</th>
                            <th style={{ padding: '6px 0', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '8px 0', fontWeight: 600, color: '#2563EB' }}>{item.line_no}</td>
                              <td style={{ padding: '8px 0', fontWeight: 500 }}>{item.item_description}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right' }}>{item.quantity} {item.unit}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right' }}>ETB {parseFloat(item.unit_price).toLocaleString()}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>ETB {parseFloat(item.line_total).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ fontSize: 13, color: '#6B7280' }}>{q.item_description}</div>
                    )}
                  </div>

                  {/* Totals */}
                  <div style={{ marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <tbody>
                        <tr><td style={{ padding: '4px 0', color: '#6B7280' }}>Subtotal</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>ETB {viewSubtotal.toLocaleString()}</td></tr>
                        {vatPct > 0 && (
                          <tr><td style={{ padding: '4px 0', color: '#6B7280' }}>VAT ({vatPct}%)</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>ETB {vatAmt.toLocaleString()}</td></tr>
                        )}
                        <tr style={{ borderTop: '2px solid #E5E7EB' }}>
                          <td style={{ padding: '8px 0 0 0', fontWeight: 700, color: '#111827' }}>Total Amount</td>
                          <td style={{ padding: '8px 0 0 0', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#111827' }}>ETB {parseFloat(q.total_amount).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {q.notes && (
                    <div style={{ marginBottom: 16, background: '#FEF3C7', padding: '10px 14px', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 13, color: '#92400E', fontStyle: 'italic' }}>
                      {q.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                      disabled={actionLoading === q.id}
                      onClick={() => handleApprove(q.id)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 16px', background: '#16A34A', color: '#FFFFFF', border: 'none',
                        borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: actionLoading === q.id ? 'not-allowed' : 'pointer',
                        opacity: actionLoading === q.id ? 0.6 : 1
                      }}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      disabled={actionLoading === q.id}
                      onClick={() => { setRejectModal(q); setRejectReason(''); }}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 16px', background: '#FFFFFF', color: '#DC2626', border: '2px solid #DC2626',
                        borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 12, padding: 24, width: 420, maxWidth: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <AlertTriangle size={20} color="#DC2626" />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Reject {rejectModal.quotation_no}</h3>
            </div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rejection Reason</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why this quotation is being rejected..."
              style={{
                width: '100%', padding: 12, border: '1px solid #D1D5DB', borderRadius: 8,
                fontSize: 14, resize: 'vertical', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setRejectModal(null)} style={{
                flex: 1, padding: '10px 16px', background: '#F3F4F6', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151'
              }}>Cancel</button>
              <button onClick={handleReject} style={{
                flex: 1, padding: '10px 16px', background: '#DC2626', color: '#FFFFFF', border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CEOQuotationApprovals;
