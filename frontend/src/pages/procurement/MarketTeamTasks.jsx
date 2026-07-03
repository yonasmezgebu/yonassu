import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { ClipboardList, CheckCircle, ArrowLeft, RefreshCw, Search, Send } from 'lucide-react';

export default function MarketTeamTasks() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [approvedPRs, setApprovedPRs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('pending');
  const [marketInfo, setMarketInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadApproved(); loadTasks(); }, []);

  const loadApproved = async () => {
    try { const res = await apiClient.get('/procurement/market/approved-prs'); if (res.status === 'success') setApprovedPRs(res.data || []); } catch (e) { console.error(e); }
  };
  const loadTasks = async () => {
    try { const res = await apiClient.get('/procurement/market/tasks'); if (res.status === 'success') setTasks(res.data || []); } catch (e) { console.error(e); }
  };

  const assignToSelf = async (prId) => {
    setLoading(true);
    try {
      await apiClient.post('/procurement/market/tasks', { procurementRequestId: prId, notes: 'Assigned by Market Team' });
      showToast('Task assigned to you', 'success');
      playSound('success');
      loadApproved(); loadTasks();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const completeTask = async (taskId) => {
    const data = marketInfo[taskId] || {};
    if (!data.findings?.trim()) { showToast('Please enter market findings', 'warning'); return; }
    setLoading(true);
    try {
      await apiClient.patch(`/procurement/market/tasks/${taskId}/complete`, {
        marketInfo: JSON.stringify({
          findings: data.findings,
          suggestedSupplier: data.suggestedSupplier,
          estimatedCost: data.estimatedCost
        })
      });
      showToast('Market task completed', 'success');
      playSound('success');
      setMarketInfo(prev => { const n = { ...prev }; delete n[taskId]; return n; });
      loadApproved(); loadTasks();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={22} color="#224f94" /> Market Team Tasks
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Conduct market research for approved procurement requests</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('pending')} style={tabBtn(tab === 'pending')}><Search size={15} /> Approved PRs</button>
        <button onClick={() => setTab('my-tasks')} style={tabBtn(tab === 'my-tasks')}><ClipboardList size={15} /> My Tasks ({pendingTasks.length})</button>
        <button onClick={() => setTab('completed')} style={tabBtn(tab === 'completed')}><CheckCircle size={15} /> Completed ({completedTasks.length})</button>
        <button onClick={() => { loadApproved(); loadTasks(); }} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {tab === 'pending' && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Approved PRs — Awaiting Market Research ({approvedPRs.length})
          </h3>
          {approvedPRs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
              No approved PRs pending market assignment
            </div>
          ) : approvedPRs.map(pr => (
            <div key={pr.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{pr.drug_name}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                  {pr.pr_no} &middot; Qty: {pr.quantity_requested} {pr.unit_of_measure} &middot; {pr.requested_by_name}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#224f94' }}>{parseFloat(pr.estimated_total).toFixed(2)} ETB</span>
                <button onClick={() => assignToSelf(pr.id)} disabled={loading}
                  style={{ background: '#224f94', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1 }}>
                  <Send size={14} /> Assign to Me
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'my-tasks' && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Active Tasks ({pendingTasks.length})
          </h3>
          {pendingTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
              No active tasks — assign yourself an approved PR first
            </div>
          ) : pendingTasks.map(t => (
            <div key={t.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 18px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{t.drug_name}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    {t.pr_no} &middot; Qty: {t.quantity_needed}
                  </div>
                </div>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  IN PROGRESS
                </span>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Market Research Findings *
                </label>
                <textarea
                  value={marketInfo[t.id]?.findings || ''}
                  onChange={e => setMarketInfo(prev => ({ ...prev, [t.id]: { ...prev[t.id], findings: e.target.value } }))}
                  placeholder="Enter pricing, suppliers found, market conditions, recommendations..."
                  style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, minHeight: 60, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Suggested Supplier</label>
                    <input type="text"
                      value={marketInfo[t.id]?.suggestedSupplier || ''}
                      onChange={e => setMarketInfo(prev => ({ ...prev, [t.id]: { ...prev[t.id], suggestedSupplier: e.target.value } }))}
                      placeholder="Supplier name"
                      style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 6, padding: '8px 12px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Estimated Cost (ETB)</label>
                    <input type="number" step="0.01" min="0"
                      value={marketInfo[t.id]?.estimatedCost || ''}
                      onChange={e => setMarketInfo(prev => ({ ...prev, [t.id]: { ...prev[t.id], estimatedCost: e.target.value } }))}
                      placeholder="0.00"
                      style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 6, padding: '8px 12px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <button onClick={() => completeTask(t.id)} disabled={loading || !marketInfo[t.id]?.findings?.trim()}
                  style={{ marginTop: 4, background: '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 12, cursor: (loading || !marketInfo[t.id]?.findings?.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !marketInfo[t.id]?.findings?.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={15} /> Submit Findings & Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'completed' && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Completed Tasks ({completedTasks.length})
          </h3>
          {completedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
              No completed tasks yet
            </div>
          ) : completedTasks.map(t => (
            <div key={t.id} style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 10, padding: '14px 18px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#065F46', fontSize: 14 }}>{t.drug_name}</div>
                  <div style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>
                    {t.pr_no} &middot; Completed by: {t.completed_by_name}
                  </div>
                </div>
                <span style={{ background: '#D1FAE5', color: '#059669', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  DONE
                </span>
              </div>
              {t.market_info && (
                <div style={{ background: 'white', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#475569', marginTop: 8, borderLeft: '3px solid #059669' }}>
                  {t.market_info}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function tabBtn(active) {
  return {
    background: active ? '#224f94' : 'white',
    color: active ? 'white' : '#475569',
    border: active ? 'none' : '1px solid #E2E8F0',
    borderRadius: 8,
    padding: '8px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: active ? 600 : 400,
  };
}
