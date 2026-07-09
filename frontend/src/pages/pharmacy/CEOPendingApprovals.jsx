import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw, GitBranch, Building, Pill } from 'lucide-react';
import apiClient from '../../services/apiClient';

const CEOPendingApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/pharmacy/transfers/pending-approvals');
      setRequests(data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await apiClient.patch(`/pharmacy/transfers/${id}/ceo-approve`);
      setMsg({ type: 'success', text: 'Transfer approved and executed' });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || e.message });
    }
    setProcessing(null);
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setProcessing(id);
    try {
      await apiClient.patch(`/pharmacy/transfers/${id}/ceo-reject`, { reason });
      setMsg({ type: 'success', text: 'Transfer rejected' });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || e.message });
    }
    setProcessing(null);
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  return (
    <div className="p-6" style={{ fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#f8fafc 50%,#eff6ff 100%)' }}>
      {msg.text && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 24px', borderRadius: 12, background: msg.type === 'success' ? '#d1fae5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fecaca'}`, color: msg.type === 'success' ? '#065f46' : '#991b1b', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {msg.text}
        </div>
      )}

      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
          <CheckCircle size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>CEO Approvals</h1>
          <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Approve or reject branch transfer requests</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding: '10px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed' }} />
        </div>
      ) : requests.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <CheckCircle size={48} style={{ color: '#86efac', marginBottom: 12 }} />
          <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px', color: '#1e293b' }}>No pending approvals</p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>All branch transfer requests have been processed</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {requests.map(r => (
            <div key={r.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#7c3aed', fontSize: 15 }}>{r.transfer_no || `#${r.id}`}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700 }}>PENDING</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14, color: '#475569' }}>
                    <span><Pill size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> <strong>{r.drug_name}</strong> {r.drug_code ? `(${r.drug_code})` : ''}</span>
                    <span><Building size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {r.from_branch} → {r.to_branch}</span>
                    <span><GitBranch size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Qty: <strong>{r.requested_qty}</strong></span>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Requested by: {r.requested_by_name || 'Unknown'}</span>
                    <span style={{ color: '#64748b', fontSize: 13 }}>{r.requested_date ? new Date(r.requested_date).toLocaleDateString() : ''}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApprove(r.id)} disabled={processing === r.id}
                    style={{ padding: '10px 20px', background: processing === r.id ? '#d1fae5' : '#059669', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: processing === r.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {processing === r.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                    Approve
                  </button>
                  <button onClick={() => handleReject(r.id)} disabled={processing === r.id}
                    style={{ padding: '10px 20px', background: processing === r.id ? '#fef2f2' : '#dc2626', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: processing === r.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {processing === r.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={15} />}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{100%{transform:rotate(360deg);}}`}</style>
    </div>
  );
};

export default CEOPendingApprovals;
