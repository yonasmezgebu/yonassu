import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import DecisionCard from '../../components/procurement/DecisionCard';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { FileText, List, RefreshCw, ArrowLeft, Award, CheckCircle } from 'lucide-react';

export default function CEOTenderDecisions() {
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('list');
  const [tenders, setTenders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await apiClient.get('/procurement/tenders'); if (res.status === 'success') setTenders(res.data || []); } catch (e) { console.error(e); }
  };

  const loadDetail = async (id) => {
    try { const res = await apiClient.get(`/procurement/tenders/${id}`); if (res.status === 'success') setSelected(res.data); } catch (e) { console.error(e); }
  };

  const decide = async (decision, selectedBidId) => {
    setLoading(true);
    try {
      await apiClient.patch(`/procurement/tenders/${selected.id}/ceo-decision`, { decision, selectedBidId, decisionNotes });
      showToast(`Tender ${decision === 'APPROVED' ? 'awarded' : decision}`, decision === 'APPROVED' ? 'success' : 'info');
      playSound(decision === 'APPROVED' ? 'success' : 'info');
      setSelected(null); setDecisionNotes(''); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const forDecision = tenders.filter(t => t.status === 'OPEN' || t.status === 'AWAITING_DECISION');
  const decided = tenders.filter(t => t.status === 'AWARDED' || t.status === 'CLOSED' || t.status === 'CEO_REJECTED');

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => window.history.back()}
          style={{ background: 'none', border: 'none', color: '#224f94', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={22} color="#224f94" /> Tender Bid Decisions
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Review bids and award tenders</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        <button onClick={() => { setTab('list'); setSelected(null); }} style={tabBtn(tab === 'list' && !selected)}>
          <List size={15} /> For Decision ({forDecision.length})
        </button>
        <button onClick={() => { setTab('decided'); setSelected(null); }} style={tabBtn(tab === 'decided')}>
          <CheckCircle size={15} /> Decided ({decided.length})
        </button>
        <button onClick={load} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {selected ? (
        <div>
          <button onClick={() => setSelected(null)}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to tender list
          </button>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: '#224f94', color: 'white', padding: '16px 24px' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{selected.tender_no}</div>
              <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>{selected.drug_name} &middot; Qty: {selected.quantity} {selected.unit_of_measure}</div>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1E293B' }}>Submitted Bids ({selected.bids?.length || 0})</h3>
              {(!selected.bids || selected.bids.length === 0) ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                  No bids submitted for this tender yet
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {selected.bids.map(b => (
                    <div key={b.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', marginBottom: 8, background: b.status === 'AWARDED' ? '#F0FDF4' : 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>
                            {b.supplier_name_resolved || b.supplier_name || `Supplier #${b.supplier_user_id}`}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            Unit: {parseFloat(b.unit_price).toFixed(2)} ETB &middot; Total: {parseFloat(b.total_amount || b.total_price).toFixed(2)} ETB &middot; Delivery: {b.delivery_days} days
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ background: b.status === 'AWARDED' ? '#D1FAE5' : '#F1F5F9', color: b.status === 'AWARDED' ? '#059669' : '#475569', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                            {b.status || 'SUBMITTED'}
                          </span>
                          {selected.status !== 'AWARDED' && selected.status !== 'CLOSED' && (
                            <button onClick={() => decide('APPROVED', b.id)} disabled={loading}
                              style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, fontSize: 11, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                              Award
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selected.status !== 'AWARDED' && selected.status !== 'CLOSED' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Decision Notes</label>
                  <textarea value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)}
                    placeholder="Reason for decision..."
                    style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, minHeight: 60, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />

                  <div style={{ display: 'flex', gap: 10 }}>
                    <DecisionCard
                      decision={selected.ceo_decision || 'PENDING'}
                      ceoNotes={selected.ceo_notes}
                      ceoDecidedBy={selected.ceo_decided_by_name}
                      ceoDecidedAt={selected.ceo_decided_at}
                      onApprove={() => showToast('Select a winning bid first by clicking "Award" on a bid', 'warning')}
                      onReject={() => decide('REJECTED', null)}
                      loading={loading}
                    />
                    <button onClick={() => decide('RE_TENDER', null)} disabled={loading}
                      style={{ padding: '10px 16px', background: '#D97706', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, alignSelf: 'flex-end' }}>
                      Re-Tender
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {tab === 'list' && (
            <div>
              {forDecision.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
                  No tenders awaiting decision
                </div>
              ) : forDecision.map(t => (
                <div key={t.id} onClick={() => loadDetail(t.id)}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{t.tender_no} — {t.drug_name}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Qty: {t.quantity} &middot; Budget: {parseFloat(t.budget_estimate).toFixed(2)} ETB</div>
                  </div>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'decided' && (
            <div>
              {decided.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
                  No decided tenders yet
                </div>
              ) : decided.map(t => (
                <div key={t.id} onClick={() => loadDetail(t.id)}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{t.tender_no} — {t.drug_name}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{t.ceo_decided_by_name ? `Decided by ${t.ceo_decided_by_name}` : ''}</div>
                  </div>
                  <span style={{ background: t.status === 'AWARDED' ? '#D1FAE5' : '#F1F5F9', color: t.status === 'AWARDED' ? '#059669' : '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
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
