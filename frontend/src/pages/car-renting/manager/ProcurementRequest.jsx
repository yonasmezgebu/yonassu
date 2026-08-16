import React, { useState, useEffect } from 'react';
import { Send, FileText, Eye, X } from 'lucide-react';
import apiClient from '../../../services/apiClient';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
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

    .proc-wrapper {
      padding: 24px;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      color: var(--color-text-primary);
      width: 100%;
    }
    
    .proc-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .proc-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .proc-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: var(--color-text-primary);
      line-height: 1.3;
    }

    .proc-subtitle {
      font-size: 16px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .proc-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 150ms ease-in-out;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .proc-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    .proc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .proc-label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-text-muted);
    }

    .proc-input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      font-size: 14px;
      transition: all 150ms ease;
      box-sizing: border-box;
    }
    
    textarea.proc-input {
      height: auto;
      padding: 12px;
    }

    .proc-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .proc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 44px;
      padding: 0 16px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease-in-out;
      background: var(--color-primary);
      color: #fff;
    }
    
    .proc-btn:hover:not(:disabled) {
      background: #F59E0B; /* Gold background on hover */
      color: #111827; /* Dark text for contrast on gold */
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      transform: translateY(-1px);
    }
    
    .proc-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .proc-alert {
      padding: 16px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
    }
    .proc-alert-success {
      background: var(--color-success-bg);
      color: var(--color-success);
      border-left: 4px solid var(--color-success);
    }
    .proc-alert-danger {
      background: var(--color-danger-bg);
      color: var(--color-danger);
      border-left: 4px solid var(--color-danger);
    }

    /* Segmented Spinner */
    .segmented-spinner {
      width: 20px;
      height: 20px;
      border: 3px dashed currentColor;
      border-radius: 50%;
      animation: spin 1.5s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .proc-wrapper { padding: 16px; }
    }
    @media (max-width: 768px) {
      .proc-wrapper { padding: 12px; }
      .proc-card { padding: 20px; }
    }
  `}</style>
);

const ProcurementRequest = () => {
  const [form, setForm] = useState({
    item_name: '',
    item_description: '',
    quantity: 1,
    estimated_cost: '',
    urgency: 'MEDIUM',
    justification: '',
    requester_signature: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState({ open: false, request: null });
  const [myRequests, setMyRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchMyRequests = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiClient.get(`/general-procurement/requests/my?module=${encodeURIComponent('Agri & Car Rental')}`);
      setMyRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const getStatusDisplay = (status) => {
    const map = {
      PENDING: { label: 'Waiting CEO Approval', bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
      WAIT: { label: 'On Hold by CEO', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
      APPROVED: { label: 'CEO Approved — Awaiting Purchase', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
      REJECTED: { label: 'Rejected by CEO', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
      ACCEPTED: { label: 'Purchase Accepted — Ready for Finance', bg: '#EDE9FE', color: '#6D28D9' },
      PAYMENT_REQUESTED: { label: 'Payment Requested — Finance Review', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
      FINANCE_CHECKED: { label: 'Finance Checked — Final CEO Approval', bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
      PAYMENT_APPROVED: { label: 'Final Payment Approved', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
      PAYMENT_REJECTED: { label: 'Payment Rejected', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
    };
    return map[status] || { label: status, bg: 'var(--color-border)', color: 'var(--color-text-secondary)' };
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(''); setSuccess('');
    try {
      await apiClient.post('/general-procurement/request', {
        ...form,
        module: 'Agri & Car Rental'
      });
      setSuccess('Procurement request submitted successfully to the CEO Approval Hub.');
      setForm({ item_name: '', item_description: '', quantity: 1, estimated_cost: '', urgency: 'MEDIUM', justification: '', requester_signature: '' });
      fetchMyRequests();
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="proc-wrapper">
      <GlobalStyles />
      <div className="proc-container">
        <div className="proc-header">
          <FileText size={32} color="var(--color-primary)" />
          <div>
            <h1 className="proc-title">New Procurement Request</h1>
            <p className="proc-subtitle">Request new cars, tractors, or machinery. Needs CEO approval.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="proc-card">
          <div className="proc-grid">
            <div>
              <label className="proc-label">Item Name *</label>
              <input required name="item_name" value={form.item_name} onChange={handleChange} placeholder="e.g. Toyota Hilux 2026" className="proc-input" />
            </div>
            <div>
              <label className="proc-label">Quantity *</label>
              <input required type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} className="proc-input" />
            </div>
          </div>

          <div>
            <label className="proc-label">Item Description / Specs</label>
            <textarea name="item_description" value={form.item_description} onChange={handleChange} rows="3" placeholder="Engine size, color, purpose..." className="proc-input" />
          </div>

          <div className="proc-grid">
            <div>
              <label className="proc-label">Estimated Total Cost (ETB)</label>
              <input type="number" step="0.01" name="estimated_cost" value={form.estimated_cost} onChange={handleChange} placeholder="Optional" className="proc-input" />
            </div>
            <div>
              <label className="proc-label">Urgency</label>
              <select name="urgency" value={form.urgency} onChange={handleChange} className="proc-input">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="proc-label">Justification for Purchase *</label>
            <textarea required name="justification" value={form.justification} onChange={handleChange} rows="4" placeholder="Why do we need this?" className="proc-input" />
          </div>

          <div>
            <label className="proc-label">Manager Signature (Full Name) *</label>
            <input required name="requester_signature" value={form.requester_signature} onChange={handleChange} placeholder="Type your full name to sign" className="proc-input" style={{ fontFamily: 'cursive', fontSize: '18px' }} />
          </div>

          {success && <div className="proc-alert proc-alert-success" style={{ margin: '8px 0 0 0' }}>{success}</div>}
          {error && <div className="proc-alert proc-alert-danger" style={{ margin: '8px 0 0 0' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
            <button type="submit" disabled={submitting} className="proc-btn" style={{ minWidth: '240px' }}>
              {submitting ? <><div className="segmented-spinner" /> Submitting...</> : <><Send size={18} /> Submit to CEO for Approval</>}
            </button>
          </div>
        </form>

        <div className="proc-header" style={{ marginTop: '48px', marginBottom: '16px' }}>
          <div>
            <h2 className="proc-title" style={{ fontSize: '20px' }}>Request History</h2>
            <p className="proc-subtitle">Track the status of your previous procurement requests.</p>
          </div>
        </div>

        <div className="proc-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              <div className="segmented-spinner" style={{ margin: '0 auto 16px' }} /> Loading history...
            </div>
          ) : myRequests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No previous requests found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Request Code</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Item Name</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Quantity</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-card)', transition: 'background 150ms ease' }} onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'} onMouseOut={e => e.currentTarget.style.background = 'var(--color-bg-card)'}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{req.request_code}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-primary)' }}>{req.item_name}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-primary)' }}>{req.quantity}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '16px' }}>
                        {(() => {
                          const badge = getStatusDisplay(req.status);
                          return (
                            <span style={{ 
                              fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '9999px',
                              background: badge.bg, color: badge.color
                            }}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button onClick={() => setDetailModal({ open: true, request: req })} className="proc-btn" style={{ padding: '4px 12px', height: 'auto', fontSize: '12px' }}>
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detailModal.open && detailModal.request && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="proc-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', margin: 0 }}>
            <button onClick={() => setDetailModal({ open: false, request: null })} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={24} />
            </button>
            <h2 className="proc-title" style={{ fontSize: '20px', marginBottom: '24px' }}>Request Details</h2>
            
            <div className="proc-grid" style={{ marginBottom: '16px' }}>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Item Name</strong><div style={{ fontSize: '14px' }}>{detailModal.request.item_name}</div></div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Request Code</strong><div style={{ fontSize: '14px' }}>{detailModal.request.request_code}</div></div>
            </div>
            <div className="proc-grid" style={{ marginBottom: '16px' }}>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Quantity</strong><div style={{ fontSize: '14px' }}>{detailModal.request.quantity}</div></div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Urgency</strong><div style={{ fontSize: '14px' }}>{detailModal.request.urgency}</div></div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Item Description</strong>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)' }}>{detailModal.request.item_description || 'N/A'}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Justification</strong>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)' }}>{detailModal.request.justification || 'N/A'}</p>
            </div>

            {detailModal.request.ceo_decision_reason && (
              <div style={{ background: 'var(--color-warning-bg)', padding: '12px', borderRadius: '6px', borderLeft: '4px solid var(--color-warning)', marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#92400E', textTransform: 'uppercase', marginBottom: '2px' }}>CEO Note / Reason</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#B45309' }}>{detailModal.request.ceo_decision_reason}</p>
              </div>
            )}
            
            {detailModal.request.ceo_document_url && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--color-info-bg)', borderRadius: '6px', color: '#1E3A8A' }}>
                <FileText size={18} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Attached Document:</span>
                <a href={detailModal.request.ceo_document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--color-primary)', textDecoration: 'underline' }}>View Document</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementRequest;
