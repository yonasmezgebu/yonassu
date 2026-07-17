import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { CheckCircle, Package, RefreshCw, ClipboardCheck } from 'lucide-react';
export default function PharmacyReceive() {
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reqRes, recRes] = await Promise.all([
        apiClient.get('/procurement/requests'),
        apiClient.get('/procurement/receipts'),
      ]);
      if (reqRes.status === 'success') setRequests(reqRes.data || []);
      if (recRes.status === 'success') setReceipts(recRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const shippedRequests = requests.filter(r => r.status === 'SHIPPED');

  const getReceiptForPR = (prNo) => receipts.find(r => r.pr_no === prNo);

  const handleConfirmReceipt = async (receiptId) => {
    setConfirmingId(receiptId);
    try {
      await apiClient.post('/procurement/pharmacy/confirm-receipt', { receiptId });
      showToast('Receipt confirmed — stock updated', 'success');
      playSound('success');
      loadAll();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to confirm receipt', 'error'); }
    finally { setConfirmingId(null); }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={22} color="#059669" /> Pharmacy — Receive Shipments
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Confirm receipt of drugs shipped from the store</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#D1FAE5', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color="#059669" />
            <strong style={{ fontSize: 14, color: '#059669' }}>{shippedRequests.length}</strong>
            <span style={{ fontSize: 12, color: '#059669' }}>In Transit</span>
          </div>
          <div style={{ background: '#E0E7FF', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={16} color="#3730A3" />
            <strong style={{ fontSize: 14, color: '#3730A3' }}>{receipts.length}</strong>
            <span style={{ fontSize: 12, color: '#3730A3' }}>Total Receipts</span>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {shippedRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 13 }}>
          <Package size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No Shipments In Transit</div>
          <div style={{ fontSize: 12 }}>Shipments will appear here once the Store Manager confirms shipment.</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>PR No.</th>
                <th style={thStyle}>Drug</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Receipt</th>
                <th style={thStyle}>Shipped</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shippedRequests.map(pr => {
                const receipt = getReceiptForPR(pr.pr_no);
                return (
                  <tr key={pr.id} style={{ borderBottom: '1px solid #F1F5F9', background: selected === pr.id ? '#F0FDF4' : 'white' }}
                    onClick={() => setSelected(pr.id)}>
                    <td style={tdStyle}><strong>{pr.pr_no}</strong></td>
                    <td style={tdStyle}>{pr.drug_name}</td>
                    <td style={tdStyle}>{pr.quantity_requested}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 11 }}>{receipt?.receipt_no || '—'}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 11, color: '#64748B' }}>
                        {receipt?.received_at ? new Date(receipt.received_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); receipt && handleConfirmReceipt(receipt.id); }}
                        disabled={confirmingId === receipt?.id}
                        style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: confirmingId === receipt?.id ? 'not-allowed' : 'pointer', opacity: confirmingId === receipt?.id ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={14} /> {confirmingId === receipt?.id ? '...' : 'Receive'}
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
  );
}

const thStyle = {
  padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left',
};

const tdStyle = {
  padding: '12px 14px', fontSize: 12, color: '#1E293B',
};
