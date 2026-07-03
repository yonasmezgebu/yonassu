import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import DecisionCard from '../../components/procurement/DecisionCard';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { AlertTriangle, FileText, Search, RefreshCw, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function CEOProcurementNewDrug() {
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
      if (res.status === 'success') setRequests((res.data || []).filter(r => r.request_type === 'NEW_DRUG' || r.new_drug_flag === 'YES'));
    } catch (e) { console.error(e); }
  };

  const approve = async (id) => {
    setLoading(true);
    try {
      await apiClient.patch(`/procurement/requests/${id}/ceo-decision`, { decision: 'APPROVED' });
      showToast('New drug request approved — sent to Market Team', 'success');
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
      showToast('New drug request rejected', 'info');
      playSound('info');
      setSelected(null); setRejectNotes(''); load();
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
          <AlertTriangle size={22} color="#059669" /> New Drug Requests
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Review new drug requests (not currently available in stock)</p>
      </div>

      {selected ? (
        <div>
          <button onClick={() => { setSelected(null); setRejectNotes(''); }}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to list
          </button>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>🆕 NEW DRUG</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>PR: {selected.pr_no}</div>
                <div style={{ fontSize: 12, color: '#A7F3D0', marginTop: 4 }}>{selected.drug_name}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>
                {selected.urgency}
              </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#F0FDF4', borderRadius: 8, padding: 12, border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: 4 }}>⚠️ STOCK STATUS</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626' }}>NOT AVAILABLE</div>
                  <div style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>This is a NEW DRUG — no existing stock</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Request Info</div>
                  <div style={{ fontSize: 13, color: '#1E293B' }}>Qty: <strong>{selected.quantity_requested}</strong> {selected.unit_of_measure}</div>
                  <div style={{ fontSize: 13, color: '#1E293B' }}>Est. Total: <strong>{selected.estimated_total ? `${parseFloat(selected.estimated_total).toFixed(2)} ETB` : '—'}</strong></div>
                  <div style={{ fontSize: 13, color: '#1E293B' }}>By: <strong>{selected.requested_by_name}</strong></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{selected.drug_category || '—'}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Classification</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{selected.drug_classification || '—'}</div>
                </div>
              </div>

              {selected.therapeutic_use && (
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569', marginBottom: 16, borderLeft: '3px solid #059669' }}>
                  <strong>Therapeutic Use:</strong> {selected.therapeutic_use}
                </div>
              )}

              {selected.request_reason && (
                <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 16, borderLeft: '3px solid #F59E0B' }}>
                  <strong>Reason for Request:</strong> {selected.request_reason}
                </div>
              )}

              {selected.justification && (
                <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1E40AF', marginBottom: 16, borderLeft: '3px solid #3B82F6' }}>
                  <strong>Justification:</strong> {selected.justification}
                </div>
              )}

              {selected.wait_document && (
                <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 16, borderLeft: '3px solid #D97706' }}>
                  <strong>WAIT — Document:</strong> {selected.wait_document}<br />
                  {selected.wait_instructions && <><strong>Instructions:</strong> {selected.wait_instructions}</>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <DecisionCard
                  decision={selected.ceo_decision || 'PENDING'}
                  ceoNotes={selected.ceo_notes}
                  ceoDecidedBy={selected.ceo_decided_by_name}
                  ceoDecidedAt={selected.ceo_decided_at}
                  onApprove={() => approve(selected.id)}
                  onReject={() => document.getElementById('reject-input-nd')?.focus()}
                  loading={loading}
                />
                {selected.ceo_decision === 'PENDING' && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Rejection Notes</label>
                    <textarea id="reject-input-nd" value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
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
            <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 10, padding: '16px 20px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{pending.length}</div>
              <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Pending New Drug Review</div>
            </div>
            <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 10, padding: '16px 20px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#475569' }}>{decided.length}</div>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Decided</div>
            </div>
          </div>

          <button onClick={load} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 12 }}>
            <RefreshCw size={14} /> Refresh
          </button>

          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 14 }}>
              <AlertTriangle size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No New Drug Requests</div>
              <div style={{ fontSize: 12 }}>New drug requests from Pharmacy will appear here.</div>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Review ({pending.length})</h3>
                  {pending.map(r => (
                    <div key={r.id} onClick={() => { setSelected(r); setRejectNotes(''); }}
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #059669' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ background: '#D1FAE5', color: '#059669', padding: '1px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>🆕 NEW</span>
                          <span style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{r.drug_name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                          {r.pr_no} &middot; Qty: {r.quantity_requested} {r.unit_of_measure} &middot; {r.requested_by_name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{r.estimated_total ? `${parseFloat(r.estimated_total).toFixed(2)} ETB` : '—'}</span>
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
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #059669' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ background: '#D1FAE5', color: '#059669', padding: '1px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>🆕 NEW</span>
                          <span style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{r.drug_name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{r.pr_no} &middot; {r.requested_by_name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ background: r.ceo_decision === 'APPROVED' ? '#D1FAE5' : r.ceo_decision === 'WAIT' ? '#FEF3C7' : '#FEE2E2', color: r.ceo_decision === 'APPROVED' ? '#059669' : r.ceo_decision === 'WAIT' ? '#D97706' : '#DC2626', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {r.ceo_decision === 'WAIT' ? '⏳ WAIT' : r.ceo_decision}
                        </span>
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
