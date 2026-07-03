import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { Truck, CheckCircle, Package, RefreshCw, FileText } from 'lucide-react';

export default function DirectDelivery() {
  const { showToast, ToastContainer } = useToast();
  const [payments, setPayments] = useState([]);
  const [prMap, setPrMap] = useState({});
  const [selectedPayment, setSelectedPayment] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [payRes, prRes] = await Promise.all([
        apiClient.get('/procurement/payments'),
        apiClient.get('/procurement/requests'),
      ]);
      if (payRes.status === 'success') setPayments(payRes.data || []);
      if (prRes.status === 'success') {
        const map = {};
        (prRes.data || []).forEach(pr => { map[pr.pr_no] = pr; });
        setPrMap(map);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const newDrugPayments = payments.filter(p => {
    const pr = prMap[p.pr_no];
    return pr && pr.status === 'PAYMENT_MADE' && pr.new_drug_flag === 'YES';
  });

  const handleReceive = async (e) => {
    e.preventDefault();
    if (!selectedPayment) { showToast('Select a delivery to receive', 'warning'); return; }
    setConfirming(selectedPayment);
    try {
      await apiClient.post('/procurement/pharmacy/direct-delivery', {
        paymentId: parseInt(selectedPayment),
        deliveryNote: deliveryNote || undefined,
        notes: notes || undefined,
      });
      showToast('Direct delivery received — stock updated, CEO notified', 'success');
      playSound('direct_delivery');
      setSelectedPayment('');
      setDeliveryNote('');
      setNotes('');
      loadAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to receive delivery', 'error'); }
    finally { setConfirming(null); }
  };

  const selectedPay = payments.find(p => p.id === parseInt(selectedPayment));
  const selectedPr = selectedPay ? prMap[selectedPay.pr_no] : null;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={22} color="#059669" /> 🆕 Direct Delivery — New Drugs
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Receive new drug shipments directly from supplier (bypass store)</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#D1FAE5', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color="#059669" />
            <strong style={{ fontSize: 14, color: '#059669' }}>{newDrugPayments.length}</strong>
            <span style={{ fontSize: 12, color: '#059669' }}>Awaiting Direct Delivery</span>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Paid New Drug Requests</h3>
          {newDrugPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 13 }}>
              <Package size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>No new drug deliveries pending</div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: 500, overflow: 'auto' }}>
              {newDrugPayments.map(p => {
                const pr = prMap[p.pr_no];
                return (
                  <div key={p.id} onClick={() => { setSelectedPayment(p.id.toString()); setDeliveryNote(''); setNotes(''); }} style={{
                    padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                    background: selectedPayment === p.id.toString() ? '#F0FDF4' : 'white',
                    borderLeft: selectedPayment === p.id.toString() ? '3px solid #059669' : '3px solid transparent'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13, color: '#1E293B' }}>{p.pr_no}</strong>
                      <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                        🆕 NEW
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{pr?.drug_name || '—'} &middot; {pr?.quantity_requested || 0} units</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Payment: {p.payment_no || `PAY-${p.id}`} &middot; {parseFloat(p.amount).toFixed(2)} ETB</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Receive Direct Delivery</h3>
          {!selectedPay ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 13 }}>
              Select a paid request to receive delivery
            </div>
          ) : (
            <form onSubmit={handleReceive} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🆕 {selectedPay.pr_no}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{selectedPr?.drug_name || '—'} &middot; {selectedPr?.quantity_requested || 0} units &middot; {parseFloat(selectedPay.amount).toFixed(2)} ETB</div>
                {selectedPr && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 11 }}>
                    <span style={{ background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: 4 }}>{selectedPr.drug_category || '—'}</span>
                    <span style={{ background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: 4 }}>{selectedPr.drug_classification || '—'}</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Delivery Note No.</label>
                <input type="text" value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} style={inputStyle()} placeholder="e.g. DN-001" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle(), minHeight: 50, resize: 'vertical' }} placeholder="Additional notes..." />
              </div>

              <button type="submit" disabled={confirming === selectedPay.id}
                style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 13, cursor: confirming === selectedPay.id ? 'not-allowed' : 'pointer', opacity: confirming === selectedPay.id ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} /> {confirming === selectedPay.id ? 'Receiving...' : '📦 Receive Direct Delivery'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function inputStyle() {
  return { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', outline: 'none' };
}
