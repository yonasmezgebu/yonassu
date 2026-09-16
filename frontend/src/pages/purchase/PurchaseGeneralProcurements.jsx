import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Search, FileText, ClipboardList, XCircle, ExternalLink, Trash2 } from 'lucide-react';
import apiClient from '../../services/apiClient';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    :root {
      --color-primary: #2563EB; --color-bg-page: #F5F6FA; --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB; --color-text-primary: #111827; --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF; --color-success: #16A34A; --color-success-bg: #DCFCE7;
      --color-danger: #DC2626; --color-danger-bg: #FEE2E2; --color-warning: #D97706;
      --color-warning-bg: #FEF3C7; --color-info: #0284C7; --color-info-bg: #E0F2FE;
      --font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
    }
    .pg-wrap { padding: 24px; min-height: calc(100vh - 60px); background: var(--color-bg-page); font-family: var(--font-family); }
    .pg-con { max-width: 1200px; margin: 0 auto; }
    .pg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .pg-title { font-size: 28px; font-weight: 700; margin: 0 0 4px 0; }
    .pg-subtitle { font-size: 15px; color: var(--color-text-secondary); margin: 0; }
    .pg-tabs { display: flex; border-bottom: 2px solid var(--color-border); margin-bottom: 24px; }
    .pg-tab { padding: 12px 20px; font-size: 14px; font-weight: 600; color: var(--color-text-secondary); background: transparent; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; transition: all 150ms; }
    .pg-tab:hover { color: var(--color-text-primary); }
    .pg-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
    .pg-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
    .pg-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .pg-item-name { margin: 0 0 4px 0; font-size: 18px; font-weight: 600; }
    .pg-cost { font-size: 20px; font-weight: 700; color: var(--color-success); white-space: nowrap; }
    .pg-badge { font-size: 12px; font-weight: 500; background: var(--color-bg-page); padding: 2px 10px; border-radius: 4px; color: var(--color-text-secondary); display: inline-block; }
    .pg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; background: #F9FAFB; padding: 16px; border-radius: 8px; border: 1px solid var(--color-border); }
    .pg-label { display: block; font-size: 12px; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px; }
    .pg-value { font-size: 14px; color: var(--color-text-primary); line-height: 1.5; }
    .pg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--color-border); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 150ms; background: var(--color-bg-card); color: var(--color-text-primary); font-family: var(--font-family); }
    .pg-btn:hover:not(:disabled) { background: #F59E0B; color: #111827; box-shadow: 0 4px 12px rgba(245,158,11,0.3); transform: translateY(-1px); border-color: transparent; }
    .pg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pg-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--color-border); font-size: 14px; font-family: var(--font-family); box-sizing: border-box; outline: none; }
    .pg-input:focus { border-color: var(--color-primary); }
    .seg-spin { width: 24px; height: 24px; border: 3px dashed var(--color-primary); border-radius: 50%; animation: spin 1.5s linear infinite; margin: 0 auto 16px auto; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @media (max-width: 768px) { .pg-wrap { padding: 12px; } .pg-card { padding: 16px; } .pg-header { flex-direction: column; align-items: flex-start; } }
  `}</style>
);

const HISTORY_STATUSES = ['PAYMENT_REJECTED', 'PAID', 'COMPLETED'];
const ACTIVE_STATUSES  = ['APPROVED', 'ACCEPTED', 'PAYMENT_REQUESTED', 'FINANCE_CHECKED', 'PAYMENT_APPROVED'];

const StatusBadge = ({ status }) => {
  const map = {
    APPROVED:          { label: 'CEO Approved — Awaiting Acceptance', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    ACCEPTED:          { label: '✓ Accepted by Purchase', bg: '#EDE9FE', color: '#6D28D9' },
    PAYMENT_REQUESTED: { label: '⏳ Payment Requested', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    FINANCE_CHECKED:   { label: '🔎 Finance Checked', bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
    PAYMENT_APPROVED:  { label: '✅ Final Payment Approved', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    PAYMENT_REJECTED:  { label: '❌ Payment Rejected', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
    PAID:              { label: '💰 Fully Paid', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    COMPLETED:         { label: '🏁 Completed via Tender', bg: '#F0FDF4', color: '#166534' },
  };
  const s = map[status] || { label: status, bg: 'var(--color-info-bg)', color: 'var(--color-info)' };
  return <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', background: s.bg, color: s.color }}>{s.label}</span>;
};

// Helper to decide border-left color by status
const cardBorder = (status) => {
  if (status === 'APPROVED') return '4px solid var(--color-success)';
  if (status === 'COMPLETED') return '4px solid #166534';
  if (['ACCEPTED', 'PAYMENT_REQUESTED'].includes(status)) return '4px solid #6D28D9';
  return '4px solid var(--color-info)';
};

const PurchaseGeneralProcurements = () => {
  const navigate = useNavigate();
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('active');
  const [accepting, setAccepting]   = useState(null);

  const [payModal, setPayModal]                   = useState({ open: false, request: null });
  const [requestedAmount, setRequestedAmount]     = useState('');
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [payError, setPayError]                   = useState('');

  const [viewModal, setViewModal] = useState({ open: false, request: null });

  const [tenderModal, setTenderModal]     = useState({ open: false, request: null });
  const [tenderForm, setTenderForm]       = useState({ title: '', description: '', deadline: '', terms_conditions: '', starting_bid_price: '' });
  const [tenderSubmitting, setTenderSubmitting] = useState(false);
  const [tenderError, setTenderError]     = useState('');
  const [tenderSuccess, setTenderSuccess] = useState('');

  const [deleteModal, setDeleteModal] = useState({ open: false, request: null });
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/general-procurement/requests/approved');
      setRequests(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const activeList  = requests.filter(r => ACTIVE_STATUSES.includes(r.status));
  const historyList = requests.filter(r => HISTORY_STATUSES.includes(r.status));

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      await apiClient.put(`/general-procurement/requests/${id}/accept`);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'ACCEPTED' } : r));
    } catch (e) { alert('Failed to accept request.'); }
    finally { setAccepting(null); }
  };

  const handleRequestPayment = async () => {
    if (!payModal.request) return;
    if (!requestedAmount || isNaN(requestedAmount) || Number(requestedAmount) <= 0) {
      setPayError('Please enter a valid requested amount.'); return;
    }
    setPayError('');
    setRequestingPayment(true);
    try {
      await apiClient.put(`/general-procurement/requests/${payModal.request.id}/request-payment`, { requested_amount: Number(requestedAmount) });
      setRequests(prev => prev.map(r => r.id === payModal.request.id ? { ...r, status: 'PAYMENT_REQUESTED', requested_amount: Number(requestedAmount) } : r));
      setPayModal({ open: false, request: null });
    } catch (e) { setPayError(e.response?.data?.message || e.message || 'Failed.'); }
    finally { setRequestingPayment(false); }
  };

  const openTenderModal = (req) => {
    const oneMonthOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setTenderForm({
      title: `Procurement Tender — ${req.item_name}`,
      description: req.item_description
        ? req.item_description
        : `Tender for ${req.item_name} as per General Procurement Request ${req.request_code}.\nQuantity required: ${req.quantity}\nUrgency: ${req.urgency}`,
      deadline: oneMonthOut,
      terms_conditions: `This tender is for the supply of ${req.item_name} (Qty: ${req.quantity}).\nAll bidders must comply with SUTANA procurement policies.\nBid submission deadline is as specified.`,
      starting_bid_price: req.paid_amount || req.estimated_cost || ''
    });
    setTenderError('');
    setTenderSuccess('');
    setTenderModal({ open: true, request: req });
  };

  const handleDeleteRequest = async () => {
    if (!deleteModal.request) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiClient.delete(`/general-procurement/requests/${deleteModal.request.id}`);
      setRequests(prev => prev.filter(r => r.id !== deleteModal.request.id));
      setDeleteModal({ open: false, request: null });
    } catch (e) {
      setDeleteError(e.response?.data?.message || e.message || 'Failed to delete request.');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenTender = async () => {
    if (!tenderModal.request) return;
    setTenderSubmitting(true);
    setTenderError('');
    try {
      // 1. Mark the procurement as COMPLETED (backend generates a placeholder ref)
      await apiClient.put(`/general-procurement/requests/${tenderModal.request.id}/complete-tender`, {
        tender_reference: `PENDING-${tenderModal.request.request_code}`
      });

      // 2. Remove from local state (moves to history)
      setRequests(prev => prev.map(r =>
        r.id === tenderModal.request.id
          ? { ...r, status: 'COMPLETED', tender_reference: `PENDING-${tenderModal.request.request_code}` }
          : r
      ));

      // 3. Close modal and switch to history tab
      setTenderModal({ open: false, request: null });
      setActiveTab('history');

      // 4. Navigate to smart tenders page with pre-filled data
      navigate('/purchase/smart-tenders', {
        state: {
          prefill: {
            title: `Procurement Tender — ${tenderModal.request.item_name}`,
            item_name: tenderModal.request.item_name,
            quantity: String(tenderModal.request.quantity || ''),
            description: tenderModal.request.item_description
              || `Tender for ${tenderModal.request.item_name} as per General Procurement Request ${tenderModal.request.request_code}.\nQuantity required: ${tenderModal.request.quantity}\nUrgency: ${tenderModal.request.urgency}`,
            category: tenderModal.request.module || '',
            starting_bid_price: String(tenderModal.request.paid_amount || tenderModal.request.estimated_cost || ''),
          },
          gpRequestId: tenderModal.request.id,
          gpRequestCode: tenderModal.request.request_code,
        }
      });
    } catch (e) {
      setTenderError(e.response?.data?.message || e.message || 'Failed.');
    } finally {
      setTenderSubmitting(false);
    }
  };

  return (
    <div className="pg-wrap">
      <GlobalStyles />
      <div className="pg-con">
        <div className="pg-header">
          <div>
            <h1 className="pg-title">General Procurement — Purchase Hub</h1>
            <p className="pg-subtitle">CEO-approved requests for Cars, Tractors, Machinery, etc.</p>
          </div>
          <button onClick={fetchRequests} className="pg-btn"><Search size={16} /> Refresh</button>
        </div>

        <div className="pg-tabs">
          <button className={`pg-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active ({activeList.length})</button>
          <button className={`pg-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History ({historyList.length})</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}><div className="seg-spin" />Loading...</div>
        ) : activeTab === 'active' ? (
          activeList.length === 0 ? (
            <div style={{ padding: '48px', background: 'var(--color-bg-card)', borderRadius: '12px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No active general procurements found.</p>
            </div>
          ) : (
            <div>
              {activeList.map(req => (
                <div key={req.id} className="pg-card" style={{ borderLeft: cardBorder(req.status) }}>
                  <div className="pg-card-header">
                    <div>
                      <h3 className="pg-item-name">{req.item_name}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                        <div className="pg-badge">{req.request_code} • {req.module}</div>
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="pg-cost">{req.estimated_cost ? `${Number(req.estimated_cost).toLocaleString()} ETB` : 'Cost TBD'}</div>
                      <button
                        onClick={() => { setDeleteModal({ open: true, request: req }); setDeleteError(''); }}
                        className="pg-btn"
                        title="Delete this active request"
                        style={{ height: '30px', width: '30px', padding: 0, border: '1px solid var(--color-danger)', color: 'var(--color-danger)', background: 'transparent', flexShrink: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="pg-grid">
                    <div><span className="pg-label">Quantity</span><div className="pg-value">{req.quantity}</div></div>
                    <div><span className="pg-label">Urgency</span><div className="pg-value">{req.urgency}</div></div>
                    <div><span className="pg-label">CEO Approved</span><div className="pg-value">{req.decided_at ? new Date(req.decided_at).toLocaleString() : '—'}</div></div>
                    {req.status === 'ACCEPTED' && <div><span className="pg-label">Accepted At</span><div className="pg-value">{req.accepted_at ? new Date(req.accepted_at).toLocaleString() : '—'}</div></div>}
                  </div>
                  <div><span className="pg-label">Item Description</span><p className="pg-value" style={{ margin: '4px 0 0' }}>{req.item_description || 'N/A'}</p></div>
                  {req.ceo_decision_reason && (
                    <div style={{ background: 'var(--color-success-bg)', padding: '12px', borderRadius: '6px', borderLeft: '4px solid var(--color-success)' }}>
                      <span className="pg-label" style={{ color: '#166534' }}>CEO Note</span>
                      <p className="pg-value" style={{ color: '#15803D', margin: '4px 0 0' }}>{req.ceo_decision_reason}</p>
                    </div>
                  )}
                  {req.status === 'APPROVED' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                      <button onClick={() => handleAccept(req.id)} disabled={accepting === req.id} className="pg-btn" style={{ background: 'var(--color-success)', color: '#fff', border: 'none', fontWeight: '600' }}>
                        {accepting === req.id ? <><div className="seg-spin" style={{ width: '16px', height: '16px', border: '2px dashed #fff', margin: 0 }} /> Accepting...</> : <><CheckCircle size={16} /> Accept</>}
                      </button>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Click to confirm receipt and acceptance.</span>
                    </div>
                  )}
                  {req.status === 'ACCEPTED' && (
                    <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6D28D9', marginBottom: '12px' }}>
                        <CheckCircle size={18} /><span style={{ fontSize: '14px', fontWeight: '600' }}>Accepted — Choose next action:</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => { setPayModal({ open: true, request: req }); setRequestedAmount(req.estimated_cost || ''); setPayError(''); }}
                          className="pg-btn"
                          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: '600', flex: '1', minWidth: '180px' }}
                        >
                          💳 Request Payment
                        </button>
                        <button
                          onClick={() => openTenderModal(req)}
                          className="pg-btn"
                          style={{ background: '#166534', color: '#fff', border: 'none', fontWeight: '600', flex: '1', minWidth: '180px' }}
                        >
                          <ExternalLink size={15} /> Complete &amp; Open Tender
                        </button>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Choose <strong>Request Payment</strong> to go through Finance approval, or <strong>Complete &amp; Open Tender</strong> to directly open a procurement tender.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          historyList.length === 0 ? (
            <div style={{ padding: '48px', background: 'var(--color-bg-card)', borderRadius: '12px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              <ClipboardList size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No history records yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Request Code</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Item Name</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Amount Paid</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{req.request_code}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        {req.item_name}
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{req.module}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--color-success)' }}>
                        {req.paid_amount ? `${Number(req.paid_amount).toLocaleString()} ETB` : req.estimated_cost ? `${Number(req.estimated_cost).toLocaleString()} ETB (Est)` : '—'}
                      </td>
                      <td style={{ padding: '16px' }}><StatusBadge status={req.status} /></td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => setViewModal({ open: true, request: req })} className="pg-btn" style={{ height: '30px', fontSize: '12px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}>
                            <FileText size={13} /> View Detail
                          </button>
                          {req.status === 'PAID' && (
                            <button onClick={() => openTenderModal(req)} className="pg-btn" style={{ height: '30px', fontSize: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: '600' }}>
                              <ExternalLink size={13} /> Complete & Open Tender
                            </button>
                          )}
                          {req.status === 'COMPLETED' && req.tender_reference && (
                            <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '9999px', background: '#F0FDF4', color: '#166534', height: '30px', display: 'inline-flex', alignItems: 'center' }}>
                              🔗 {req.tender_reference}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── Payment Request Modal ── */}
      {payModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--color-bg-card)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>Request Payment</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Requesting payment for <strong>{payModal.request?.item_name}</strong>.</p>
            <div style={{ marginBottom: '20px' }}>
              <label className="pg-label" style={{ marginBottom: '6px' }}>Requested Amount (ETB) *</label>
              <input type="number" step="0.01" required value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)} placeholder="Enter exact amount..." className="pg-input" />
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>This is the actual amount you are asking Finance to release.</div>
            </div>
            {payError && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{payError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setPayModal({ open: false, request: null })} disabled={requestingPayment} className="pg-btn" style={{ background: 'transparent' }}>Cancel</button>
              <button onClick={handleRequestPayment} disabled={requestingPayment || !requestedAmount} className="pg-btn" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none' }}>
                {requestingPayment ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Detail Modal ── */}
      {viewModal.open && viewModal.request && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--color-bg-card)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '700px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>{viewModal.request.item_name}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="pg-badge">{viewModal.request.request_code}</div>
                  <div className="pg-badge">{viewModal.request.module}</div>
                  <StatusBadge status={viewModal.request.status} />
                </div>
              </div>
              <div className="pg-cost" style={{ fontSize: '22px' }}>
                {viewModal.request.paid_amount ? `${Number(viewModal.request.paid_amount).toLocaleString()} ETB` : viewModal.request.estimated_cost ? `${Number(viewModal.request.estimated_cost).toLocaleString()} ETB (Est)` : 'Cost TBD'}
              </div>
            </div>
            <div className="pg-grid" style={{ marginBottom: '16px' }}>
              <div><span className="pg-label">Quantity</span><div className="pg-value">{viewModal.request.quantity}</div></div>
              <div><span className="pg-label">Urgency</span><div className="pg-value">{viewModal.request.urgency}</div></div>
              <div><span className="pg-label">Module</span><div className="pg-value">{viewModal.request.module}</div></div>
              <div><span className="pg-label">CEO Approved</span><div className="pg-value">{viewModal.request.decided_at ? new Date(viewModal.request.decided_at).toLocaleString() : '—'}</div></div>
              <div><span className="pg-label">Payment Requested</span><div className="pg-value">{viewModal.request.payment_requested_at ? new Date(viewModal.request.payment_requested_at).toLocaleString() : '—'}</div></div>
              <div><span className="pg-label">Paid At</span><div className="pg-value">{viewModal.request.paid_at ? new Date(viewModal.request.paid_at).toLocaleString() : '—'}</div></div>
              {viewModal.request.tender_reference && (
                <div><span className="pg-label">Tender Reference</span><div className="pg-value" style={{ fontWeight: '700', color: '#166534' }}>{viewModal.request.tender_reference}</div></div>
              )}
            </div>
            {viewModal.request.item_description && (
              <div style={{ marginBottom: '16px' }}>
                <span className="pg-label">Item Description</span>
                <p className="pg-value" style={{ margin: '4px 0 0' }}>{viewModal.request.item_description}</p>
              </div>
            )}
            {viewModal.request.ceo_decision_reason && (
              <div style={{ background: 'var(--color-success-bg)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-success)', marginBottom: '16px' }}>
                <span className="pg-label" style={{ color: '#166534' }}>CEO Notes</span>
                <p className="pg-value" style={{ color: '#15803D', margin: '4px 0 0', whiteSpace: 'pre-line' }}>{viewModal.request.ceo_decision_reason}</p>
              </div>
            )}
            {viewModal.request.finance_note && (
              <div style={{ background: 'var(--color-warning-bg)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-warning)', marginBottom: '16px' }}>
                <span className="pg-label" style={{ color: '#B45309' }}>Finance Note</span>
                <p className="pg-value" style={{ color: '#92400E', margin: '4px 0 0' }}>{viewModal.request.finance_note}</p>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setViewModal({ open: false, request: null })} className="pg-btn" style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete & Open Tender Confirm Modal ── */}
      {tenderModal.open && tenderModal.request && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--color-bg-card)', padding: '28px', borderRadius: '14px', width: '100%', maxWidth: '480px', boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>Complete &amp; Open Tender</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>For: <strong>{tenderModal.request.item_name}</strong> ({tenderModal.request.request_code})</p>
              </div>
              <button onClick={() => setTenderModal({ open: false, request: null })} className="pg-btn" style={{ width: '32px', height: '32px', padding: 0, border: 'none' }}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--color-info-bg)', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--color-info)', lineHeight: '1.6' }}>
              <strong>What will happen:</strong><br />
              1. This procurement will be marked as <strong>Completed</strong> and moved to History.<br />
              2. You will be taken to the <strong>Tender Post page</strong> with item details pre-filled.<br />
              3. Fill in the deadline, terms, bid price &amp; attachments, then <strong>Publish</strong> the tender.
            </div>

            <div style={{ background: '#F9FAFB', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: '600' }}>Will be pre-filled automatically</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Item: </span><strong>{tenderModal.request.item_name}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Qty: </span><strong>{tenderModal.request.quantity}</strong></div>
                <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--color-text-muted)' }}>Category: </span><strong>{tenderModal.request.module || '—'}</strong></div>
                <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--color-text-muted)' }}>Description: </span><em style={{ color: '#374151' }}>from procurement request</em></div>
              </div>
            </div>

            {tenderError && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{tenderError}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setTenderModal({ open: false, request: null })} className="pg-btn" style={{ background: 'transparent' }}>Cancel</button>
              <button onClick={handleOpenTender} disabled={tenderSubmitting} className="pg-btn" style={{ background: '#166534', color: '#fff', border: 'none', fontWeight: '600', minWidth: '190px' }}>
                {tenderSubmitting ? 'Processing...' : <><ExternalLink size={15} /> Confirm &amp; Go to Tender Page</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteModal.open && deleteModal.request && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--color-bg-card)', padding: '28px', borderRadius: '14px', width: '100%', maxWidth: '440px', boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>Delete Procurement</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>For: <strong>{deleteModal.request.item_name}</strong> ({deleteModal.request.request_code})</p>
              </div>
              <button onClick={() => !deleting && setDeleteModal({ open: false, request: null })} className="pg-btn" style={{ width: '32px', height: '32px', padding: 0, border: 'none' }}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--color-danger-bg)', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--color-danger)', lineHeight: '1.6' }}>
              <strong>Warning:</strong> This will permanently delete this active procurement request. This action cannot be undone.
            </div>

            {deleteError && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{deleteError}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeleteModal({ open: false, request: null })} disabled={deleting} className="pg-btn" style={{ background: 'transparent' }}>Cancel</button>
              <button onClick={handleDeleteRequest} disabled={deleting} className="pg-btn" style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', fontWeight: '600', minWidth: '120px' }}>
                {deleting ? 'Deleting...' : <><Trash2 size={15} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseGeneralProcurements;
