import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { Truck, CheckCircle, Package, RefreshCw, AlertTriangle } from 'lucide-react';

export default function CEOConfirmDirectDelivery() {
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [issueReported, setIssueReported] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/procurement/requests');
      if (res.status === 'success') setRequests(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const receivedNewDrugs = requests.filter(r =>
    r.status === 'RECEIVED' && r.new_drug_flag === 'YES'
  );

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selected) { showToast('Select a delivery to confirm', 'warning'); return; }
    setConfirming(true);
    try {
      await apiClient.post('/procurement/pharmacy/ceo-confirm-direct', {
        prNo: selected.pr_no,
        issueReported: issueReported || undefined,
      });
      showToast('Direct delivery confirmed successfully', 'success');
      playSound('ceo_confirmed');
      setSelected(null);
      setIssueReported('');
      loadAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to confirm', 'error'); }
    finally { setConfirming(false); }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={22} color="#D97706" /> 🆕 CEO — Confirm Direct Delivery
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Review and confirm new drug shipments received directly by Pharmacy</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color="#D97706" />
            <strong style={{ fontSize: 14, color: '#D97706' }}>{receivedNewDrugs.length}</strong>
            <span style={{ fontSize: 12, color: '#D97706' }}>Awaiting CEO Confirmation</span>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Received — New Drugs</h3>
          {receivedNewDrugs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 13 }}>
              <CheckCircle size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>No direct deliveries awaiting confirmation</div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: 500, overflow: 'auto' }}>
              {receivedNewDrugs.map(r => (
                <div key={r.id} onClick={() => { setSelected(r); setIssueReported(''); }} style={{
                  padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                  background: selected?.id === r.id ? '#FFFBEB' : 'white',
                  borderLeft: selected?.id === r.id ? '3px solid #D97706' : '3px solid transparent'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: '#1E293B' }}>{r.pr_no}</strong>
                    <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>🆕 NEW</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#374151' }}>{r.drug_name} &middot; {r.quantity_requested} {r.unit_of_measure}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Category: {r.drug_category || '—'} &middot; {r.drug_classification || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirm Delivery</h3>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 13 }}>
              Select a received delivery to confirm
            </div>
          ) : (
            <form onSubmit={handleConfirm} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🆕 {selected.pr_no} — {selected.drug_name}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Qty: {selected.quantity_requested} {selected.unit_of_measure} &middot; Category: {selected.drug_category || '—'}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Issue / Discrepancy Report <span style={{ color: '#94A3B8', fontWeight: 400 }}>(leave blank if no issues)</span>
                </label>
                <textarea value={issueReported} onChange={e => setIssueReported(e.target.value)} rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                  placeholder="e.g. Short expiry, damaged packaging, wrong quantity..." />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={confirming}
                  style={{ flex: 1, background: '#D97706', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 13, cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <CheckCircle size={18} /> {confirming ? 'Confirming...' : '✅ Confirm Direct Delivery'}
                </button>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> This confirms receipt and notifies Finance for payment closure
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
