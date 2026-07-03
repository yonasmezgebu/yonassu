import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import DecisionCard from '../../components/procurement/DecisionCard';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { ArrowLeft, FileText, Search, RefreshCw } from 'lucide-react';

const STATUS_BADGES = {
  PENDING_CEO_REVIEW: { bg: '#FEF3C7', color: '#92400E', text: 'Pending Review' },
  IN_MARKET: { bg: '#DBEAFE', color: '#1E40AF', text: 'In Market' },
  CEO_REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
};

export default function CEOProcurementDecisions() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiClient.get('/procurement/requests');
      if (res.status === 'success') setRequests(res.data || []);
    } catch (e) { console.error(e); }
  };

  const approve = async (id) => {
    setLoading(true);
    try {
      await apiClient.patch(`/procurement/requests/${id}/ceo-decision`, { decision: 'APPROVED' });
      showToast('Request approved — sent to Market Team', 'success');
      playSound('success');
      setSelected(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const reject = async (id) => {
    if (!rejectNotes.trim()) { showToast('Please enter a rejection reason', 'warning'); return; }
    setLoading(true);
    try {
      await apiClient.patch(`/procurement/requests/${id}/ceo-decision`, { decision: 'REJECTED', ceoNotes: rejectNotes });
      showToast('Request rejected', 'info');
      playSound('info');
      setSelected(null); setRejectNotes(''); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const waitOnRequest = async (id, waitDoc, waitInstr) => {
    setLoading(true);
    try {
      await apiClient.patch(`/procurement/requests/${id}/ceo-decision`, {
        decision: 'WAIT', waitDocument: waitDoc, waitInstructions: waitInstr
      });
      showToast('Request placed on WAIT — Market team assigned', 'info');
      playSound('info');
      setSelected(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const pending = requests.filter(r => r.status === 'PENDING_CEO_REVIEW');
  const decided = requests.filter(r => r.status !== 'PENDING_CEO_REVIEW');

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/ceo/pharmacy-approvals')}
          style={{ background: 'none', border: 'none', color: '#224f94', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Approvals
        </button>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={22} color="#224f94" /> Drug Procurement Decisions
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Review and approve/reject procurement requests from Pharmacy</p>
      </div>

      {selected ? (
        <div>
          <button onClick={() => { setSelected(null); setRejectNotes(''); }}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to list
          </button>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: '#224f94', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>PR: {selected.pr_no}</div>
                <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>{selected.drug_name}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>
                {selected.urgency}
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Unit Price</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{selected.drug_name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{selected.quantity_requested} <span style={{ color: '#64748B', fontSize: 11 }}>{selected.unit_of_measure}</span></td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{parseFloat(selected.estimated_unit_price).toFixed(2)} ETB</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{parseFloat(selected.estimated_total).toFixed(2)} ETB</td>
                  </tr>
                </tbody>
              </table>

              {selected.justification && (
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', marginBottom: 16, borderLeft: '3px solid #224f94' }}>
                  <strong>Justification:</strong> {selected.justification}
                </div>
              )}

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <DecisionCard
                      decision={selected.ceo_decision || 'PENDING'}
                      ceoNotes={selected.ceo_notes}
                      ceoDecidedBy={selected.ceo_decided_by_name}
                      ceoDecidedAt={selected.ceo_decided_at}
                      waitDocument={selected.wait_document}
                      waitInstructions={selected.wait_instructions}
                      onApprove={() => approve(selected.id)}
                      onReject={() => document.getElementById('reject-input')?.focus()}
                      onWait={(doc, instr) => waitOnRequest(selected.id, doc, instr)}
                      loading={loading}
                    />
                {selected.ceo_decision === 'PENDING' && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Rejection Notes</label>
                    <textarea id="reject-input" value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                      placeholder="Enter reason if rejecting..."
                      style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, minHeight: 60, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                    {rejectNotes.trim() && (
                      <button onClick={() => reject(selected.id)} disabled={loading}
                        style={{ marginTop: 8, padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                        Reject with Notes
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 10, padding: '16px 20px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#92400E' }}>{pending.length}</div>
              <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Pending Review</div>
            </div>
            <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 10, padding: '16px 20px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#475569' }}>{decided.length}</div>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Decided</div>
            </div>
          </div>

          <button onClick={load} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 12 }}>
            <RefreshCw size={14} /> Refresh
          </button>

          {pending.length === 0 && decided.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
              No procurement requests yet
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Review ({pending.length})</h3>
                  {pending.map(r => (
                    <div key={r.id} onClick={() => { setSelected(r); setRejectNotes(''); }}
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{r.drug_name}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                          {r.pr_no} &middot; Qty: {r.quantity_requested} {r.unit_of_measure} &middot; {r.requested_by_name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#224f94' }}>{parseFloat(r.estimated_total).toFixed(2)} ETB</span>
                        <span style={{ background: r.urgency === 'CRITICAL' ? '#FEE2E2' : r.urgency === 'HIGH' ? '#FEF3C7' : '#F1F5F9', color: r.urgency === 'CRITICAL' ? '#DC2626' : r.urgency === 'HIGH' ? '#D97706' : '#475569', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{r.urgency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {decided.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Decided ({decided.length})</h3>
                  {decided.map(r => (
                    <div key={r.id} onClick={() => { setSelected(r); setRejectNotes(''); }}
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{r.drug_name}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                          {r.pr_no} &middot; {r.requested_by_name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ background: r.ceo_decision === 'APPROVED' ? '#D1FAE5' : r.ceo_decision === 'WAIT' ? '#FEF3C7' : '#FEE2E2', color: r.ceo_decision === 'APPROVED' ? '#059669' : r.ceo_decision === 'WAIT' ? '#D97706' : '#DC2626', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{r.ceo_decision === 'WAIT' ? '⏳ WAIT' : r.ceo_decision}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
