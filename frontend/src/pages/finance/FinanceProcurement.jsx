import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, Search, DollarSign, Package } from 'lucide-react';
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

    .fin-gen-wrapper {
      padding: 24px;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      color: var(--color-text-primary);
      width: 100%;
    }
    
    .fin-gen-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .fin-gen-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .fin-gen-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: var(--color-text-primary);
      line-height: 1.3;
    }

    .fin-gen-subtitle {
      font-size: 16px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .fin-gen-tabs {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--color-border);
    }
    .fin-gen-tab {
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-secondary);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .fin-gen-tab:hover {
      color: var(--color-text-primary);
    }
    .fin-gen-tab.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

    .fin-gen-card {
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
    }
    
    .fin-gen-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    .fin-gen-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .fin-gen-item-name {
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

    .fin-gen-cost {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-success);
      white-space: nowrap;
    }

    .fin-gen-badge {
      font-size: 12px;
      font-weight: 500;
      background: var(--color-bg-page);
      padding: 2px 10px;
      border-radius: 4px;
      color: var(--color-text-secondary);
      display: inline-block;
    }

    .fin-gen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      background: #F9FAFB;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
    }

    .fin-gen-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 4px;
    }

    .fin-gen-value {
      font-size: 14px;
      font-weight: 400;
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    .fin-gen-btn {
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
    
    .fin-gen-btn:hover:not(:disabled) {
      background: #F59E0B;
      color: #111827;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      transform: translateY(-1px);
      border-color: transparent;
    }
    
    .fin-gen-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .fin-input {
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

    .fin-input:focus {
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

    @media (max-width: 1024px) { .fin-gen-wrapper { padding: 16px; } }
    @media (max-width: 768px) { 
      .fin-gen-wrapper { padding: 12px; } 
      .fin-gen-card { padding: 20px; }
      .fin-gen-header { flex-direction: column; align-items: flex-start; }
      .fin-gen-card-header { flex-direction: column; gap: 8px; }
      .fin-gen-tabs { overflow-x: auto; white-space: nowrap; }
    }
  `}</style>
);

const FinanceProcurement = () => {
  const [fundRequests, setFundRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending-check'); // 'pending-check', 'pending-payment', 'history'

  // Pay Modal
  const [modal, setModal] = useState({ open: false, request: null });
  const [viewModal, setViewModal] = useState({ open: false, request: null });
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payModal, setPayModal] = useState({ open: false, request: null });
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [fundRes, payRes] = await Promise.all([
        apiClient.get('/public-procurement/fund-requests').catch(() => ({ data: [] })),
        apiClient.get('/public-procurement/payments').catch(() => ({ data: [] }))
      ]);
      setFundRequests(Array.isArray(fundRes?.data?.data ?? fundRes?.data) ? (fundRes?.data?.data ?? fundRes?.data) : []);
      setPayments(Array.isArray(payRes?.data?.data ?? payRes?.data) ? (payRes?.data?.data ?? payRes?.data) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const pendingCheck = fundRequests.filter(r => r.status === 'PENDING_CEO_APPROVAL');
  const pendingPayment = fundRequests.filter(r => r.status === 'APPROVED' || r.status === 'READY_FOR_PAYMENT');
  const history = payments;

  const handlePay = async () => {
    if (!payModal.request) return;
    setPaying(true);
    try {
      await apiClient.post('/public-procurement/payments', {
        fundRequestId: payModal.request.id,
        amount: Number(payAmount),
        notes: payNotes
      });
      fetchRequests();
      setPayModal({ open: false, request: null });
      setPayAmount('');
      setPayNotes('');
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to execute payment.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fin-gen-wrapper">
      <GlobalStyles />
      <div className="fin-gen-container">
        
        <div className="fin-gen-header">
          <div>
            <h1 className="fin-gen-title">Drug & Stock Procurement Finance</h1>
            <p className="fin-gen-subtitle">Manage fund checks and execute final payments for pharmacy and stock procurement.</p>
          </div>
          <button onClick={fetchRequests} className="fin-gen-btn">
            <Search size={16} /> Refresh
          </button>
        </div>

        <div className="fin-gen-tabs">
          <button className={`fin-gen-tab ${activeTab === 'pending-check' ? 'active' : ''}`} onClick={() => setActiveTab('pending-check')}>
            Pending Fund Check ({pendingCheck.length})
          </button>
          <button className={`fin-gen-tab ${activeTab === 'pending-payment' ? 'active' : ''}`} onClick={() => setActiveTab('pending-payment')}>
            Pending Payment ({pendingPayment.length})
          </button>
          <button className={`fin-gen-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            History ({history.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
            <div className="segmented-spinner" />
            Loading...
          </div>
        ) : (
          <div>
            {/* PENDING CHECK */}
            {activeTab === 'pending-check' && pendingCheck.length === 0 && (
              <div style={{ padding: '48px', background: 'var(--color-bg-card)', borderRadius: '12px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                <DollarSign size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '16px' }}>No requests pending CEO fund approval.</p>
              </div>
            )}
            {activeTab === 'pending-check' && pendingCheck.map(req => (
              <div key={req.id} className="fin-gen-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                <div className="fin-gen-card-header">
                  <div>
                    <h3 className="fin-gen-item-name">{req.request_code}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <div className="fin-gen-badge">Tender: {req.tender_no}</div>
                      <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                        ⏳ Waiting for CEO Approval
                      </span>
                    </div>
                  </div>
                  <div className="fin-gen-cost">
                    {req.total_amount ? `${Number(req.total_amount).toLocaleString()} ETB` : 'Cost TBD'}
                  </div>
                </div>

                <div className="fin-gen-grid">
                  <div><span className="fin-gen-label">PR No</span><div className="fin-gen-value">{req.pr_no}</div></div>
                  <div><span className="fin-gen-label">Requested By</span><div className="fin-gen-value">{req.requested_by_name}</div></div>
                  <div><span className="fin-gen-label">Requested At</span><div className="fin-gen-value">{new Date(req.created_at).toLocaleString()}</div></div>
                </div>
              </div>
            ))}

            {/* PENDING PAYMENT */}
            {activeTab === 'pending-payment' && pendingPayment.length === 0 && (
              <div style={{ padding: '48px', background: 'var(--color-bg-card)', borderRadius: '12px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                <DollarSign size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '16px' }}>No requests ready for payment.</p>
              </div>
            )}
            {activeTab === 'pending-payment' && pendingPayment.map(req => (
              <div key={req.id} className="fin-gen-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                <div className="fin-gen-card-header">
                  <div>
                    <h3 className="fin-gen-item-name">{req.request_code}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <div className="fin-gen-badge">Tender: {req.tender_no}</div>
                      <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px', background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                        ⏳ Ready to Pay
                      </span>
                    </div>
                  </div>
                  <div className="fin-gen-cost">
                    {req.total_amount ? `${Number(req.total_amount).toLocaleString()} ETB` : 'Cost TBD'}
                  </div>
                </div>

                <div className="fin-gen-grid">
                  <div><span className="fin-gen-label">PR No</span><div className="fin-gen-value">{req.pr_no}</div></div>
                  <div><span className="fin-gen-label">Requested By</span><div className="fin-gen-value">{req.requested_by_name}</div></div>
                  <div><span className="fin-gen-label">Requested At</span><div className="fin-gen-value">{new Date(req.created_at).toLocaleString()}</div></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                  <button 
                    onClick={() => { setPayModal({ open: true, request: req }); setPayAmount(req.total_amount || ''); setPayNotes(`TXN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9000 + 1000)}`); }}
                    className="fin-gen-btn"
                    style={{ background: 'var(--color-success)', color: '#fff', border: 'none', fontWeight: '600' }}
                  >
                    Execute Payment
                  </button>
                </div>
              </div>
            ))}

            {/* HISTORY */}
            {activeTab === 'history' && history.length === 0 && (
              <div style={{ padding: '48px', background: 'var(--color-bg-card)', borderRadius: '12px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                <Package size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '16px' }}>No payment history available.</p>
              </div>
            )}
            {activeTab === 'history' && history.length > 0 && (
              <div style={{ overflowX: 'auto', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Payment No</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tender No</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Supplier</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(req => (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{req.payment_no}</td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>{req.tender_no}</td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--color-success)' }}>
                          {req.amount ? `${Number(req.amount).toLocaleString()} ETB` : '—'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>{req.supplier_name || 'N/A'}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setViewModal({ open: true, request: req })}
                            className="fin-gen-btn"
                            style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', height: '30px', fontSize: '12px' }}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {payModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'var(--color-bg-card)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>Execute Payment</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              CEO approved this fund request. Enter the final paid amount and any transaction notes to issue payment.
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label className="fin-gen-label" style={{ marginBottom: '8px' }}>Amount Paid (ETB) *</label>
              <input 
                type="number"
                step="0.01"
                value={payAmount} 
                onChange={e => setPayAmount(e.target.value)} 
                className="fin-input" 
                placeholder="Actual amount transferred..." 
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="fin-gen-label" style={{ marginBottom: '8px' }}>Transaction Notes / Ref</label>
              <textarea 
                value={payNotes} 
                onChange={e => setPayNotes(e.target.value)} 
                rows={3} 
                className="fin-input" 
                placeholder="e.g. Bank Transfer Ref #123456" 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setPayModal({ open: false, request: null })}
                disabled={paying}
                className="fin-gen-btn"
                style={{ background: 'transparent' }}
              >
                Cancel
              </button>
              <button 
                onClick={handlePay}
                disabled={paying || !payAmount}
                className="fin-gen-btn"
                style={{ background: 'var(--color-success)', color: '#fff', border: 'none' }}
              >
                {paying ? 'Processing...' : 'Mark as Paid'}
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
                  {viewModal.request.payment_no || viewModal.request.request_code}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="fin-gen-badge">Tender: {viewModal.request.tender_no}</div>
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px',
                    background: 'var(--color-success-bg)',
                    color: 'var(--color-success)'
                  }}>
                    ✅ Paid
                  </span>
                </div>
              </div>
              <div className="fin-gen-cost" style={{ fontSize: '24px' }}>
                {viewModal.request.amount ? `${Number(viewModal.request.amount).toLocaleString()} ETB` : 'Cost TBD'}
              </div>
            </div>

            <div className="fin-gen-grid" style={{ marginBottom: '24px' }}>
              <div><span className="fin-gen-label">Supplier</span><div className="fin-gen-value">{viewModal.request.supplier_name || 'N/A'}</div></div>
              <div><span className="fin-gen-label">Payment Method</span><div className="fin-gen-value">{viewModal.request.payment_method}</div></div>
              <div><span className="fin-gen-label">Reference Note</span><div className="fin-gen-value">{viewModal.request.transaction_ref || viewModal.request.notes || '—'}</div></div>
              <div>
                <span className="fin-gen-label">Paid At</span>
                <div className="fin-gen-value">
                  {viewModal.request.created_at ? new Date(viewModal.request.created_at).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={() => setViewModal({ open: false, request: null })}
                className="fin-gen-btn"
                style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceProcurement;
