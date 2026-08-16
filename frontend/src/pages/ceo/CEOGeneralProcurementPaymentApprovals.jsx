import React, { useState, useEffect } from 'react';
import { Search, DollarSign, FileText, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    :root {
      --color-primary: #2563EB;
      --color-primary-hover: #1D4ED8;
      --color-bg-page: #F5F6FA;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF;
      --color-success: #16A34A;
      --color-success-bg: #DCFCE7;
      --color-danger: #DC2626;
      --color-danger-bg: #FEE2E2;
      --color-warning: #D97706;
      --color-warning-bg: #FEF3C7;
      --color-info: #0284C7;
      --color-info-bg: #E0F2FE;
      --font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }

    .ceo-pay-wrapper {
      padding: 24px;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      color: var(--color-text-primary);
      width: 100%;
    }
    
    .ceo-pay-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .ceo-pay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .ceo-pay-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: var(--color-text-primary);
      line-height: 1.3;
    }

    .ceo-pay-subtitle {
      font-size: 16px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .ceo-pay-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 150ms ease-in-out;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
      border-left: 4px solid var(--color-primary);
    }
    
    .ceo-pay-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    .ceo-pay-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .ceo-pay-item-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.3;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .ceo-pay-cost {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-success);
      white-space: nowrap;
    }

    .ceo-pay-badge {
      font-size: 12px;
      font-weight: 500;
      background: var(--color-bg-page);
      padding: 2px 10px;
      border-radius: 4px;
      color: var(--color-text-secondary);
      display: inline-block;
    }

    .ceo-pay-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      background: #F9FAFB;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
    }

    .ceo-pay-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 4px;
    }

    .ceo-pay-value {
      font-size: 14px;
      font-weight: 400;
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    .ceo-pay-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 36px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease-in-out;
      background: var(--color-bg-card);
      color: var(--color-text-primary);
    }
    
    .ceo-pay-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ceo-pay-btn-approve {
      background: var(--color-success);
      color: #fff;
      border: none;
    }
    .ceo-pay-btn-approve:hover:not(:disabled) {
      background: #15803D;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
    }

    .ceo-pay-btn-reject {
      background: var(--color-danger);
      color: #fff;
      border: none;
    }
    .ceo-pay-btn-reject:hover:not(:disabled) {
      background: #B91C1C;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .ceo-input {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      font-size: 14px;
      transition: all 150ms ease;
      box-sizing: border-box;
      font-family: var(--font-family);
    }

    .ceo-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    /* Segmented Spinner */
    .segmented-spinner {
      width: 24px;
      height: 24px;
      border: 3px dashed var(--color-primary);
      border-radius: 50%;
      animation: spin 1.5s linear infinite;
      margin: 0 auto 16px auto;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    @media (max-width: 1024px) { .ceo-pay-wrapper { padding: 16px; } }
    @media (max-width: 768px) { 
      .ceo-pay-wrapper { padding: 12px; } 
      .ceo-pay-card { padding: 20px; }
      .ceo-pay-header { flex-direction: column; align-items: flex-start; }
      .ceo-pay-card-header { flex-direction: column; gap: 8px; }
    }
  `}</style>
);

const CEOGeneralProcurementPaymentApprovals = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState({ open: false, request: null, action: '' }); // action: APPROVE, REJECT
  const [viewModal, setViewModal] = useState({ open: false, request: null }); // for viewing history details
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Pending: FINANCE_CHECKED requests waiting for CEO payment decision
      const pendingRes = await apiClient.get('/general-procurement/requests/payment/pending');
      const pending = pendingRes.data?.data ?? pendingRes.data ?? [];
      setPendingRequests(Array.isArray(pending) ? pending : []);

      // History: all requests that have already been decided (approved or rejected)
      const allRes = await apiClient.get('/general-procurement/requests/finance/all');
      const all = allRes.data?.data ?? allRes.data ?? [];
      const allArr = Array.isArray(all) ? all : [];
      setHistoryRequests(allArr.filter(r => r.status === 'PAYMENT_APPROVED' || r.status === 'PAYMENT_REJECTED' || r.status === 'PAID'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleDecide = async () => {
    if (!modal.request) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/general-procurement/requests/${modal.request.id}/payment-decide`, { 
        decision: modal.action,
        reason
      });
      // Move request from pending list to history list immediately (optimistic update)
      const decided = {
        ...modal.request,
        status: modal.action === 'APPROVE' ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED'
      };
      setPendingRequests(prev => prev.filter(r => r.id !== modal.request.id));
      setHistoryRequests(prev => [decided, ...prev]);
      setModal({ open: false, request: null, action: '' });
      setReason('');
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to process payment decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ceo-pay-wrapper">
      <GlobalStyles />
      <div className="ceo-pay-container">
        
        {/* Back navigation */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/ceo/approvals')}
            className="ceo-pay-btn"
            style={{ background: 'transparent', border: '1px solid var(--color-border)', gap: '6px' }}
          >
            <ArrowLeft size={15} /> Back to Approvals Hub
          </button>
        </div>

        <div className="ceo-pay-header">
          <div>
            <h1 className="ceo-pay-title">Final Payment Approvals</h1>
            <p className="ceo-pay-subtitle">Final CEO approval for general procurement fund releases checked by Finance.</p>
          </div>
          <button onClick={fetchRequests} className="ceo-pay-btn" style={{ background: '#fff', border: '1px solid var(--color-border)' }}>
            <Search size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
            <div className="segmented-spinner" />
            Loading...
          </div>
        ) : pendingRequests.length === 0 ? (
          <div style={{ padding: '48px', background: 'var(--color-bg-card)', borderRadius: '12px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            <DollarSign size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '16px' }}>No pending payment approvals.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Request Code</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Item Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Requested Amount</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{req.request_code}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      {req.item_name}
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{req.module}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--color-success)' }}>
                      {req.requested_amount ? `${Number(req.requested_amount).toLocaleString()} ETB` : req.estimated_cost ? `${Number(req.estimated_cost).toLocaleString()} ETB (Est)` : 'Cost TBD'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                        Finance Checked
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setViewModal({ open: true, request: req })}
                        className="ceo-pay-btn"
                        style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', height: '30px', fontSize: '12px' }}
                      >
                        Review & Decide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="ceo-pay-title" style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Payment Decision History</h2>
            <p className="ceo-pay-subtitle">All requests you have approved or rejected — including final paid records.</p>
          </div>
        </div>

        {historyRequests.length === 0 ? (
          <div style={{ padding: '32px', background: 'var(--color-bg-card)', borderRadius: '12px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            No decision history yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Request Code</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Item Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.map(req => {
                  const isRejected = req.status === 'PAYMENT_REJECTED';
                  const isPaid     = req.status === 'PAID';
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{req.request_code}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        {req.item_name}
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{req.module}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--color-success)' }}>
                        {req.paid_amount ? `${Number(req.paid_amount).toLocaleString()} ETB` : req.requested_amount ? `${Number(req.requested_amount).toLocaleString()} ETB` : '—'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '9999px',
                          background: isRejected ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                          color: isRejected ? 'var(--color-danger)' : 'var(--color-success)'
                        }}>
                          {isRejected ? '❌ Payment Rejected' : isPaid ? '✅ Fully Paid' : '✅ Payment Approved'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => setViewModal({ open: true, request: req })}
                          className="ceo-pay-btn"
                          style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', height: '30px', fontSize: '12px' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--color-bg-card)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>
              {modal.action === 'APPROVE' ? 'Approve Final Payment' : 'Reject Payment'}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              You are about to {modal.action.toLowerCase()} the payment for <strong>{modal.request?.item_name}</strong>.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label className="ceo-pay-label" style={{ marginBottom: '8px' }}>
                {modal.action === 'REJECT' ? 'Rejection Reason (Required)' : 'Approval Note (Optional)'}
              </label>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                rows={4} 
                className="ceo-input" 
                placeholder={modal.action === 'REJECT' ? "State the reason for rejection..." : "Add any final instructions..."}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setModal({ open: false, request: null, action: '' })}
                disabled={submitting}
                className="ceo-pay-btn"
                style={{ background: 'transparent' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDecide}
                disabled={submitting || (modal.action === 'REJECT' && !reason.trim())}
                className={`ceo-pay-btn ceo-pay-btn-${modal.action.toLowerCase()}`}
              >
                {submitting ? 'Processing...' : modal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewModal.open && viewModal.request && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--color-bg-card)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '700px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {viewModal.request.item_name}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="ceo-pay-badge">{viewModal.request.request_code}</div>
                  <div className="ceo-pay-badge">{viewModal.request.module}</div>
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px',
                    background: viewModal.request.status === 'PAYMENT_REJECTED' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                    color: viewModal.request.status === 'PAYMENT_REJECTED' ? 'var(--color-danger)' : 'var(--color-success)'
                  }}>
                    {viewModal.request.status === 'PAYMENT_REJECTED' ? '❌ Payment Rejected' : viewModal.request.status === 'PAID' ? '✅ Fully Paid' : '✅ Payment Approved'}
                  </span>
                </div>
              </div>
              <div className="ceo-pay-cost" style={{ fontSize: '24px' }}>
                {viewModal.request.status === 'PAID' && viewModal.request.paid_amount
                  ? `${Number(viewModal.request.paid_amount).toLocaleString()} ETB`
                  : viewModal.request.requested_amount
                  ? `${Number(viewModal.request.requested_amount).toLocaleString()} ETB`
                  : viewModal.request.estimated_cost
                  ? `${Number(viewModal.request.estimated_cost).toLocaleString()} ETB (Est)`
                  : 'Cost TBD'}
              </div>
            </div>

            {viewModal.request.finance_note && (
              <div style={{ background: 'var(--color-warning-bg)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-warning)', marginBottom: '16px' }}>
                <span className="ceo-pay-label" style={{ color: '#B45309', marginBottom: '4px' }}>
                  <FileText size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                  Finance Department Note
                </span>
                <p className="ceo-pay-value" style={{ color: '#92400E', margin: '4px 0 0', fontWeight: '500' }}>{viewModal.request.finance_note}</p>
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '8px', opacity: 0.8 }}>
                  Checked at {viewModal.request.finance_checked_at ? new Date(viewModal.request.finance_checked_at).toLocaleString() : '—'}
                </div>
              </div>
            )}

            {viewModal.request.ceo_decision_reason && (
              <div style={{
                background: viewModal.request.status === 'PAYMENT_REJECTED' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                padding: '16px', borderRadius: '8px', marginBottom: '16px',
                borderLeft: `4px solid ${viewModal.request.status === 'PAYMENT_REJECTED' ? 'var(--color-danger)' : 'var(--color-success)'}`
              }}>
                <span className="ceo-pay-label" style={{ color: viewModal.request.status === 'PAYMENT_REJECTED' ? 'var(--color-danger)' : 'var(--color-success)', marginBottom: '4px' }}>
                  CEO Decision Note
                </span>
                <p className="ceo-pay-value" style={{ margin: '4px 0 0', fontWeight: '500', whiteSpace: 'pre-line' }}>{viewModal.request.ceo_decision_reason}</p>
                <div style={{ fontSize: '12px', color: 'inherit', marginTop: '8px', opacity: 0.8 }}>
                  Decided at {viewModal.request.payment_decided_at ? new Date(viewModal.request.payment_decided_at).toLocaleString() : '—'}
                </div>
              </div>
            )}

            <div className="ceo-pay-grid" style={{ marginBottom: '24px' }}>
              <div><span className="ceo-pay-label">Quantity</span><div className="ceo-pay-value">{viewModal.request.quantity}</div></div>
              <div><span className="ceo-pay-label">Urgency</span><div className="ceo-pay-value">{viewModal.request.urgency}</div></div>
              <div><span className="ceo-pay-label">Module</span><div className="ceo-pay-value">{viewModal.request.module}</div></div>
              <div>
                <span className="ceo-pay-label">Payment Requested</span>
                <div className="ceo-pay-value">
                  {viewModal.request.payment_requested_at ? new Date(viewModal.request.payment_requested_at).toLocaleString() : '—'}
                </div>
              </div>
              <div>
                <span className="ceo-pay-label">Decision At</span>
                <div className="ceo-pay-value">
                  {viewModal.request.payment_decided_at ? new Date(viewModal.request.payment_decided_at).toLocaleString() : '—'}
                </div>
              </div>
              {viewModal.request.status === 'PAID' && (
                <div>
                  <span className="ceo-pay-label">Paid At</span>
                  <div className="ceo-pay-value">
                    {viewModal.request.paid_at ? new Date(viewModal.request.paid_at).toLocaleString() : '—'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={() => setViewModal({ open: false, request: null })}
                className="ceo-pay-btn"
                style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}
              >
                Close Details
              </button>
              
              {viewModal.request.status === 'FINANCE_CHECKED' && (
                <>
                  <button 
                    onClick={() => { setModal({ open: true, request: viewModal.request, action: 'REJECT' }); setReason(''); setViewModal({ open: false, request: null }); }}
                    className="ceo-pay-btn ceo-pay-btn-reject"
                  >
                    <XCircle size={16} /> Reject Payment
                  </button>
                  <button 
                    onClick={() => { setModal({ open: true, request: viewModal.request, action: 'APPROVE' }); setReason(''); setViewModal({ open: false, request: null }); }}
                    className="ceo-pay-btn ceo-pay-btn-approve"
                  >
                    <CheckCircle size={16} /> Approve Payment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOGeneralProcurementPaymentApprovals;
