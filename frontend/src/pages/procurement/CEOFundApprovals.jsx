import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import DecisionCard from '../../components/procurement/DecisionCard';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { DollarSign, List, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CEOFundApprovals() {
  const { showToast, ToastContainer } = useToast();
  const [funds, setFunds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ceoNotes, setCeoNotes] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await apiClient.get('/procurement/fund-requests'); if (res.status === 'success') setFunds(res.data || []); } catch (e) { console.error(e); }
  };

  const decide = async (decision) => {
    setLoading(true);
    try {
      await apiClient.patch(`/procurement/fund-requests/${selected.id}/ceo-decision`, { decision, ceoNotes });
      showToast(`Fund request ${decision}`, decision === 'APPROVED' ? 'success' : 'info');
      playSound(decision === 'APPROVED' ? 'success' : 'info');
      setSelected(null); setCeoNotes(''); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const pending = funds.filter(f => f.status === 'PENDING_CEO_APPROVAL');
  const decided = funds.filter(f => f.status !== 'PENDING_CEO_APPROVAL');

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={22} color="#224f94" /> Fund Request Approvals
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Approve or reject procurement fund requests</p>
      </div>

      <button onClick={load} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 12 }}>
        <RefreshCw size={14} /> Refresh
      </button>

      {selected ? (
        <div>
          <button onClick={() => setSelected(null)}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{selected.tender_no}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>PR: {selected.pr_no} &middot; Amount: {parseFloat(selected.total_amount).toFixed(2)} ETB &middot; By: {selected.requested_by_name}</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>CEO Notes</label>
              <textarea value={ceoNotes} onChange={e => setCeoNotes(e.target.value)}
                placeholder="Approval or rejection notes..."
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, minHeight: 60, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <DecisionCard
              decision="PENDING"
              onApprove={() => decide('APPROVED')}
              onReject={() => decide('REJECTED')}
              loading={loading}
            />
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 10, padding: '16px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#92400E' }}>{pending.length}</div>
              <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Pending</div>
            </div>
            <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 10, padding: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#475569' }}>{decided.length}</div>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Decided</div>
            </div>
          </div>

          {pending.length === 0 && decided.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>No fund requests yet</div>
          ) : (
            <>
              {pending.map(f => (
                <div key={f.id} onClick={() => setSelected(f)}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{f.tender_no}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{parseFloat(f.total_amount).toFixed(2)} ETB &middot; {f.requested_by_name}</div>
                  </div>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>PENDING</span>
                </div>
              ))}
              {decided.map(f => (
                <div key={f.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{f.tender_no}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{parseFloat(f.total_amount).toFixed(2)} ETB</div>
                  </div>
                  <span style={{ background: f.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2', color: f.status === 'APPROVED' ? '#059669' : '#DC2626', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{f.status}</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
