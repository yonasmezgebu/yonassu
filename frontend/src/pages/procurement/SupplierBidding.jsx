import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { DollarSign, Send, List, RefreshCw, FileText, Building } from 'lucide-react';

export default function SupplierBidding() {
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('open');
  const [tenders, setTenders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bidForm, setBidForm] = useState({ tenderId: '', unitPrice: '', totalPrice: '', deliveryDays: '', validityDays: '30', notes: '' });

  useEffect(() => { loadOpenTenders(); loadMyBids(); }, []);

  const loadOpenTenders = async () => {
    try { const res = await apiClient.get('/procurement/tenders'); if (res.status === 'success') setTenders((res.data || []).filter(t => t.status === 'OPEN')); } catch (e) { console.error(e); }
  };

  const loadMyBids = async () => {
    try { const res = await apiClient.get('/procurement/bids'); if (res.status === 'success') setMyBids(res.data || []); } catch (e) { console.error(e); }
  };

  const submitBid = async (tenderId) => {
    const form = bidForm[tenderId] || {};
    if (!form.unitPrice || !form.deliveryDays) { showToast('Unit price and delivery days required', 'warning'); return; }
    setLoading(true);
    try {
      await apiClient.post('/procurement/bids', {
        tenderId, unitPrice: parseFloat(form.unitPrice),
        totalAmount: parseFloat(form.totalPrice) || (parseFloat(form.unitPrice) * 1),
        deliveryDays: parseInt(form.deliveryDays), validityPeriod: parseInt(form.validityDays) || 30,
        notes: form.notes || ''
      });
      showToast('Bid submitted successfully!', 'success');
      playSound('success');
      setBidForm(prev => { const n = { ...prev }; delete n[tenderId]; return n; });
      loadOpenTenders(); loadMyBids();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleBidChange = (tenderId, field, value) => {
    setBidForm(prev => {
      const updated = { ...(prev[tenderId] || {}), [field]: value };
      if (field === 'unitPrice' || field === 'totalPrice') {
        const unitPrice = field === 'unitPrice' ? parseFloat(value) : parseFloat(prev[tenderId]?.unitPrice || 0);
        const tender = tenders.find(t => t.id === tenderId);
        if (tender && unitPrice) updated.totalPrice = (unitPrice * tender.quantity).toFixed(2);
      }
      return { ...prev, [tenderId]: updated };
    });
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={22} color="#224f94" /> Supplier Bidding
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>View open tenders and submit your bids</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('open')} style={tabBtn(tab === 'open')}><FileText size={15} /> Open Tenders ({tenders.length})</button>
        <button onClick={() => setTab('my-bids')} style={tabBtn(tab === 'my-bids')}><List size={15} /> My Bids ({myBids.length})</button>
        <button onClick={() => { loadOpenTenders(); loadMyBids(); }} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {tab === 'open' && (
        <div>
          {tenders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
              No open tenders available for bidding
            </div>
          ) : tenders.map(t => (
            <div key={t.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 16 }}>{t.tender_no} — {t.drug_name}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    PR: {t.pr_no} &middot; Qty: {t.quantity} {t.unit_of_measure} &middot; Budget: {parseFloat(t.budget_estimate).toFixed(2)} ETB
                  </div>
                </div>
                <span style={{ background: '#D1FAE5', color: '#059669', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>OPEN</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>Your Unit Price (ETB) *</label>
                  <input type="number" step="0.01" min="0" value={bidForm[t.id]?.unitPrice || ''} onChange={e => handleBidChange(t.id, 'unitPrice', e.target.value)} style={inputStyle()} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>Total Price (ETB)</label>
                  <input type="number" step="0.01" value={bidForm[t.id]?.totalPrice || ''} onChange={e => handleBidChange(t.id, 'totalPrice', e.target.value)} style={inputStyle()} placeholder="Auto" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>Delivery (Days) *</label>
                  <input type="number" min="1" value={bidForm[t.id]?.deliveryDays || ''} onChange={e => handleBidChange(t.id, 'deliveryDays', e.target.value)} style={inputStyle()} placeholder="e.g. 14" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>Validity (Days)</label>
                  <input type="number" min="1" value={bidForm[t.id]?.validityDays || '30'} onChange={e => handleBidChange(t.id, 'validityDays', e.target.value)} style={inputStyle()} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>Notes / Comments</label>
                <textarea value={bidForm[t.id]?.notes || ''} onChange={e => handleBidChange(t.id, 'notes', e.target.value)} style={{ ...inputStyle(), minHeight: 50, resize: 'vertical' }} placeholder="Any additional information..." />
              </div>

              <button onClick={() => submitBid(t.id)} disabled={loading || !bidForm[t.id]?.unitPrice}
                style={{ background: '#224f94', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 12, cursor: (loading || !bidForm[t.id]?.unitPrice) ? 'not-allowed' : 'pointer', opacity: (loading || !bidForm[t.id]?.unitPrice) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} /> Submit Bid
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'my-bids' && (
        <div>
          {myBids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
              You haven't submitted any bids yet
            </div>
          ) : myBids.map(b => (
            <div key={b.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>
                    Bid on {b.drug_name || `Tender #${b.tender_id}`}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Unit: {parseFloat(b.unit_price).toFixed(2)} ETB &middot; Total: {parseFloat(b.total_amount || b.total_price).toFixed(2)} ETB &middot; Delivery: {b.delivery_days} days
                  </div>
                </div>
                <span style={{ background: b.status === 'PENDING' ? '#FEF3C7' : b.status === 'ACCEPTED' ? '#D1FAE5' : '#FEE2E2', color: b.status === 'PENDING' ? '#92400E' : b.status === 'ACCEPTED' ? '#059669' : '#DC2626', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {b.status || 'PENDING'}
                </span>
              </div>
            </div>
          ))}
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
