import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X, Calendar } from 'lucide-react';
import { printingState, requestReprint, approveReprint } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingReprintRequests = () => {
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ jobId: '', reason: '' });

  const refresh = () => {
    setRequests([...printingState.reprintRequests]);
    setJobs([...printingState.jobs.filter(j => j.status === 'Completed' || j.status === 'Delivery')]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRequest = (e) => {
    e.preventDefault();
    if(window.confirm('Submit this reprint request?')) {
      requestReprint(form.jobId, form.reason, 'Supervisor');
      playSound('info'); // "🔄 New Reprint Request"
      alert('Reprint Requested Successfully.');
      setForm({ jobId: '', reason: '' });
      refresh();
    }
  };

  const handleAction = (id, act) => {
    if (act === 'Approve') {
      if(window.confirm('Approve reprint and generate linked child Job #?')) {
        approveReprint(id);
        playSound('success');
        alert('Reprint Approved. Child job created in Printing stage.');
        refresh();
      }
    } else {
      const notes = prompt('Enter rejection reason:');
      if (notes) {
        const req = printingState.reprintRequests.find(r => r.id === id);
        if(req) req.status = 'Rejected';
        playSound('success');
        refresh();
      }
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <RotateCcw color="#ec4899" size={28} /> REPRINT REQUESTS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage jobs requiring reprinting due to errors or complaints.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Select Original Job #</label>
          <select value={form.jobId} onChange={e => setForm({...form, jobId: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
            <option value="">-- Select Completed/Delivery Job --</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.id} ({j.customerName})</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Reason for Reprint</label>
          <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
            <option value="">-- Select Reason --</option>
            <option>Print Error</option><option>Customer Complaint</option><option>Damage</option><option>Machine Error</option><option>Misprint</option>
          </select>
        </div>
        <button onClick={handleRequest} disabled={!form.jobId || !form.reason} style={{ padding: '10px 24px', background: '#ec4899', color: 'white', border: 'none', borderRadius: 6, cursor: form.jobId && form.reason ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
          Submit Request
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Original Job #</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Reason</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Billable</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Requested By / Date</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{r.originalJobId}</td>
                <td style={{ padding: '12px 14px', color: '#ec4899', fontWeight: 500 }}>{r.reason}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.isBillable ? '#fef3c7' : '#e0e7ff', color: r.isBillable ? '#d97706' : '#4f46e5' }}>
                    {r.isBillable ? 'Yes (Client)' : 'No (Internal)'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.status === 'Approved' ? '#dcfce7' : r.status === 'Rejected' ? '#fee2e2' : '#f1f5f9', color: r.status === 'Approved' ? '#16a34a' : r.status === 'Rejected' ? '#dc2626' : '#64748b' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{r.requestedBy} <br/><span style={{fontSize:11, color: '#94a3b8'}}>{r.date}</span></td>
                <td style={{ padding: '12px 14px' }}>
                  {r.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAction(r.id, 'Approve')} style={{ padding: '6px 10px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Check size={14} /> Approve</button>
                      <button onClick={() => handleAction(r.id, 'Reject')} style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><X size={14} /> Reject</button>
                    </div>
                  ) : r.status === 'Approved' ? (
                    <button style={{ padding: '6px 10px', background: '#ffedd5', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Calendar size={14} /> Schedule</button>
                  ) : null}
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No reprint requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingReprintRequests;
