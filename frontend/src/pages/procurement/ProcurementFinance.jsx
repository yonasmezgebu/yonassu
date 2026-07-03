import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import DecisionCard from '../../components/procurement/DecisionCard';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { DollarSign, Send, CheckCircle, RefreshCw, List, FileText, Truck, ClipboardCheck } from 'lucide-react';

export default function ProcurementFinance() {
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('funds');
  const [awardedTenders, setAwardedTenders] = useState([]);
  const [fundRequests, setFundRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fund request form
  const [fundForm, setFundForm] = useState({ tenderId: '', totalAmount: '', notes: '' });
  // Payment form
  const [payForm, setPayForm] = useState({ fundRequestId: '', amount: '', paymentMethod: 'BANK_TRANSFER', reference: '', paymentDate: '', notes: '' });
  // Receipt form
  const [recForm, setRecForm] = useState({ paymentId: '', deliveryNote: '', receivedBy: '', notes: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [tendersRes, fundsRes, paysRes, recsRes] = await Promise.all([
        apiClient.get('/procurement/tenders'),
        apiClient.get('/procurement/fund-requests'),
        apiClient.get('/procurement/payments'),
        apiClient.get('/procurement/receipts'),
      ]);
      if (tendersRes.status === 'success') setAwardedTenders((tendersRes.data || []).filter(t => t.status === 'AWARDED'));
      if (fundsRes.status === 'success') setFundRequests(fundsRes.data || []);
      if (paysRes.status === 'success') setPayments(paysRes.data || []);
      if (recsRes.status === 'success') setReceipts(recsRes.data || []);
    } catch (e) { console.error(e); }
  };

  const createFundRequest = async (e) => {
    e.preventDefault();
    if (!fundForm.tenderId) { showToast('Select an awarded tender', 'warning'); return; }
    setLoading(true);
    try {
      await apiClient.post('/procurement/fund-requests', {
        tenderId: parseInt(fundForm.tenderId),
        totalAmount: parseFloat(fundForm.totalAmount) || 0,
        notes: fundForm.notes,
      });
      showToast('Fund request submitted for CEO approval', 'success');
      playSound('success');
      setFundForm({ tenderId: '', totalAmount: '', notes: '' });
      loadAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const createPayment = async (e) => {
    e.preventDefault();
    if (!payForm.fundRequestId) { showToast('Select an approved fund request', 'warning'); return; }
    setLoading(true);
    try {
      await apiClient.post('/procurement/payments', {
        fundRequestId: parseInt(payForm.fundRequestId),
        amount: parseFloat(payForm.amount) || 0,
        paymentMethod: payForm.paymentMethod,
        transactionRef: payForm.reference || undefined,
        paymentDate: payForm.paymentDate || undefined,
        notes: payForm.notes,
      });
      showToast('Payment recorded successfully', 'success');
      playSound('success');
      setPayForm({ fundRequestId: '', amount: '', paymentMethod: 'BANK_TRANSFER', reference: '', paymentDate: '', notes: '' });
      loadAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const createReceipt = async (e) => {
    e.preventDefault();
    if (!recForm.paymentId) { showToast('Select a payment', 'warning'); return; }
    setLoading(true);
    try {
      await apiClient.post('/procurement/receipts', {
        paymentId: parseInt(recForm.paymentId),
        deliveryNote: recForm.deliveryNote,
        receivedBy: recForm.receivedBy,
        notes: recForm.notes,
      });
      showToast('Receipt confirmed', 'success');
      playSound('success');
      setRecForm({ paymentId: '', deliveryNote: '', receivedBy: '', notes: '' });
      loadAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const approvedFunds = fundRequests.filter(f => f.status === 'APPROVED');

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={22} color="#224f94" /> Procurement Finance
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Fund requests, payments, and receipt confirmation</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setTab('funds')} style={tabBtn(tab === 'funds')}><Send size={15} /> M8/M9: Fund Requests ({fundRequests.length})</button>
        <button onClick={() => setTab('payments')} style={tabBtn(tab === 'payments')}><DollarSign size={15} /> M10: Payments ({payments.length})</button>
        <button onClick={() => setTab('receipts')} style={tabBtn(tab === 'receipts')}><Truck size={15} /> M11/M12: Receipts ({receipts.length})</button>
        <button onClick={() => setTab('overview')} style={tabBtn(tab === 'overview')}><FileText size={15} /> Overview</button>
        <button onClick={loadAll} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {tab === 'funds' && (
        <div>
          <form onSubmit={createFundRequest} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1E293B' }}>Create Fund Request</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Awarded Tender *</label>
                <select value={fundForm.tenderId} onChange={e => {
                  const t = awardedTenders.find(x => x.id === parseInt(e.target.value));
                  setFundForm(prev => ({ ...prev, tenderId: e.target.value, totalAmount: t ? t.budget_estimate : '' }));
                }} style={inputStyle()} required>
                  <option value="">— Select —</option>
                  {awardedTenders.map(t => (
                    <option key={t.id} value={t.id}>{t.tender_no} — {t.drug_name} ({parseFloat(t.budget_estimate).toFixed(2)} ETB)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Total Amount (ETB)</label>
                <input type="number" step="0.01" value={fundForm.totalAmount} onChange={e => setFundForm(prev => ({ ...prev, totalAmount: e.target.value }))} style={inputStyle()} placeholder="0.00" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea value={fundForm.notes} onChange={e => setFundForm(prev => ({ ...prev, notes: e.target.value }))} style={{ ...inputStyle(), minHeight: 50, resize: 'vertical' }} placeholder="Additional information..." />
            </div>
            <button type="submit" disabled={loading}
              style={{ background: '#224f94', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={14} /> Submit Fund Request
            </button>
          </form>

          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Fund Requests ({fundRequests.length})
          </h3>
          {fundRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: 13 }}>No fund requests yet</div>
          ) : fundRequests.map(f => (
            <div key={f.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{f.tender_no} — {parseFloat(f.total_amount).toFixed(2)} ETB</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>PR: {f.pr_no} &middot; By: {f.requested_by_name}</div>
                </div>
                <span style={{ background: f.status === 'APPROVED' ? '#D1FAE5' : f.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7', color: f.status === 'APPROVED' ? '#059669' : f.status === 'REJECTED' ? '#DC2626' : '#92400E', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                  {f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'payments' && (
        <div>
          <form onSubmit={createPayment} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1E293B' }}>Issue Payment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Approved Fund Request *</label>
                <select value={payForm.fundRequestId} onChange={e => setPayForm(prev => ({ ...prev, fundRequestId: e.target.value }))} style={inputStyle()} required>
                  <option value="">— Select —</option>
                  {approvedFunds.map(f => (
                    <option key={f.id} value={f.id}>{f.tender_no} — {parseFloat(f.total_amount).toFixed(2)} ETB</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Amount (ETB)</label>
                <input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(prev => ({ ...prev, amount: e.target.value }))} style={inputStyle()} placeholder="0.00" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Payment Method</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm(prev => ({ ...prev, paymentMethod: e.target.value }))} style={inputStyle()}>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="MOBILE">Mobile Money</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Reference No.</label>
                <input type="text" value={payForm.reference} onChange={e => setPayForm(prev => ({ ...prev, reference: e.target.value }))} style={inputStyle()} placeholder="e.g. CHQ-001" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Payment Date</label>
                <input type="datetime-local" value={payForm.paymentDate} onChange={e => setPayForm(prev => ({ ...prev, paymentDate: e.target.value }))} style={inputStyle()} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea value={payForm.notes} onChange={e => setPayForm(prev => ({ ...prev, notes: e.target.value }))} style={{ ...inputStyle(), minHeight: 50, resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={14} /> Record Payment
            </button>
          </form>

          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Payments ({payments.length})
          </h3>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: 13 }}>No payments yet</div>
          ) : payments.map(p => (
            <div key={p.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{p.payment_no || `PAY-${p.id}`} — {parseFloat(p.amount).toFixed(2)} ETB</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{p.payment_method} &middot; Ref: {p.reference || '—'}</div>
                </div>
                <span style={{ background: p.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7', color: p.status === 'COMPLETED' ? '#059669' : '#92400E', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                  {p.status || 'PENDING'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'receipts' && (
        <div>
          <form onSubmit={createReceipt} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1E293B' }}>Confirm Receipt</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Payment *</label>
                <select value={recForm.paymentId} onChange={e => setRecForm(prev => ({ ...prev, paymentId: e.target.value }))} style={inputStyle()} required>
                  <option value="">— Select —</option>
                  {payments.filter(p => p.status !== 'RECEIVED').map(p => (
                    <option key={p.id} value={p.id}>{p.payment_no || `PAY-${p.id}`} — {parseFloat(p.amount).toFixed(2)} ETB</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Delivery Note</label>
                <input type="text" value={recForm.deliveryNote} onChange={e => setRecForm(prev => ({ ...prev, deliveryNote: e.target.value }))} style={inputStyle()} placeholder="DN-001" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Received By</label>
                <input type="text" value={recForm.receivedBy} onChange={e => setRecForm(prev => ({ ...prev, receivedBy: e.target.value }))} style={inputStyle()} placeholder="Name" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ background: '#0891B2', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardCheck size={14} /> Confirm Receipt
            </button>
          </form>

          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Receipts ({receipts.length})
          </h3>
          {receipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: 13 }}>No receipts yet</div>
          ) : receipts.map(r => (
            <div key={r.id} style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#065F46' }}>Receipt {r.id} — {r.delivery_note || '—'}</div>
              <div style={{ fontSize: 11, color: '#047857' }}>By: {r.received_by || r.received_by_name} &middot; Note: {r.notes || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '16px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#92400E' }}>{awardedTenders.length}</div>
              <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Awarded Tenders</div>
            </div>
            <div style={{ background: '#DBEAFE', borderRadius: 10, padding: '16px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1E40AF' }}>{fundRequests.length}</div>
              <div style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>Fund Requests</div>
            </div>
            <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '16px', border: '1px solid #A7F3D0' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{payments.length}</div>
              <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Payments</div>
            </div>
            <div style={{ background: '#E0E7FF', borderRadius: 10, padding: '16px', border: '1px solid #C7D2FE' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3730A3' }}>{receipts.length}</div>
              <div style={{ fontSize: 12, color: '#3730A3', fontWeight: 600 }}>Receipts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inputStyle() {
  return { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', outline: 'none' };
}
function tabBtn(active) {
  return {
    background: active ? '#224f94' : 'white',
    color: active ? 'white' : '#475569',
    border: active ? 'none' : '1px solid #E2E8F0',
    borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
  };
}
