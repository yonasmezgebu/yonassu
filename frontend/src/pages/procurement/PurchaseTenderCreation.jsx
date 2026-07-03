import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { playSound } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { FileText, Plus, List, RefreshCw, ArrowLeft, Send, Calendar } from 'lucide-react';

export default function PurchaseTenderCreation() {
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('create');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    procurementRequestId: '', budgetEstimate: '', openingDate: '',
    closingDate: '', termsAndConditions: '', notes: ''
  });

  useEffect(() => { loadTasks(); loadTenders(); }, []);

  const loadTasks = async () => {
    try {
      const res = await apiClient.get('/procurement/market/tasks');
      if (res.status === 'success') setCompletedTasks((res.data || []).filter(t => t.status === 'COMPLETED'));
    } catch (e) { console.error(e); }
  };

  const loadTenders = async () => {
    try { const res = await apiClient.get('/procurement/tenders'); if (res.status === 'success') setTenders(res.data || []); } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.procurementRequestId) { showToast('Select a completed market task', 'warning'); return; }
    setLoading(true);
    try {
      await apiClient.post('/procurement/tenders', {
        procurementRequestId: parseInt(form.procurementRequestId),
        budgetEstimate: parseFloat(form.budgetEstimate) || 0,
        openingDate: form.openingDate, closingDate: form.closingDate,
        termsAndConditions: form.termsAndConditions, notes: form.notes
      });
      showToast('Tender created and opened for bids', 'success');
      playSound('success');
      setForm({ procurementRequestId: '', budgetEstimate: '', openingDate: '', closingDate: '', termsAndConditions: '', notes: '' });
      loadTasks(); loadTenders();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={22} color="#224f94" /> Procurement Tenders
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Create and manage tenders based on completed market research</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('create')} style={tabBtn(tab === 'create')}><Plus size={15} /> New Tender</button>
        <button onClick={() => setTab('list')} style={tabBtn(tab === 'list')}><List size={15} /> Tenders ({tenders.length})</button>
        <button onClick={() => { loadTasks(); loadTenders(); }} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {tab === 'create' && (
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 15, color: '#1E293B' }}>Create Tender from Market Research</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
              Completed Market Task (PR) *
            </label>
            <select value={form.procurementRequestId} onChange={e => {
              const task = completedTasks.find(t => t.procurement_request_id === parseInt(e.target.value));
              setForm(prev => ({
                ...prev, procurementRequestId: e.target.value,
                budgetEstimate: task ? '' : ''
              }));
            }} style={inputStyle()} required>
              <option value="">— Select a completed market task —</option>
              {completedTasks.map(t => (
                <option key={t.id} value={t.procurement_request_id}>
                  {t.pr_no} — {t.drug_name} (Qty: {t.quantity_needed})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Budget Estimate (ETB)</label>
              <input type="number" step="0.01" min="0" value={form.budgetEstimate} onChange={e => setForm(prev => ({ ...prev, budgetEstimate: e.target.value }))} style={inputStyle()} placeholder="0.00" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Opening Date *</label>
              <input type="datetime-local" value={form.openingDate} onChange={e => setForm(prev => ({ ...prev, openingDate: e.target.value }))} style={inputStyle()} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Closing Date *</label>
              <input type="datetime-local" value={form.closingDate} onChange={e => setForm(prev => ({ ...prev, closingDate: e.target.value }))} style={inputStyle()} required />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Terms & Conditions *</label>
            <textarea value={form.termsAndConditions} onChange={e => setForm(prev => ({ ...prev, termsAndConditions: e.target.value }))} style={{ ...inputStyle(), minHeight: 80, resize: 'vertical' }} placeholder="Payment terms, delivery requirements, quality standards, etc." required />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Additional Notes</label>
            <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} style={{ ...inputStyle(), minHeight: 60, resize: 'vertical' }} placeholder="Any additional information for suppliers..." />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#224f94', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontSize: 14, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Send size={16} /> {loading ? 'Creating...' : 'Open Tender for Bids'}
          </button>
        </form>
      )}

      {tab === 'list' && (
        <div>
          {tenders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: 14 }}>
              No tenders created yet
            </div>
          ) : tenders.map(t => (
            <div key={t.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 18px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{t.tender_no} — {t.drug_name}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    PR: {t.pr_no} &middot; Qty: {t.quantity} {t.unit_of_measure} &middot; Budget: {parseFloat(t.budget_estimate).toFixed(2)} ETB
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: t.status === 'OPEN' ? '#D1FAE5' : '#F1F5F9', color: t.status === 'OPEN' ? '#059669' : '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {t.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    Closes: {t.closing_date ? new Date(t.closing_date).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
              {t.terms_and_conditions && (
                <div style={{ background: '#F8FAFC', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#475569', marginTop: 8, borderLeft: '3px solid #224f94' }}>
                  <strong>Terms:</strong> {t.terms_and_conditions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function inputStyle() {
  return { width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' };
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
