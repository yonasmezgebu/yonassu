import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X, Calendar } from 'lucide-react';
import { printingState, requestReprint, approveReprint } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';

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

  const statusPill = (status) => {
    if (status === 'Approved') return 'stg-pill--success';
    if (status === 'Rejected') return 'stg-pill--danger';
    return 'stg-pill--neutral';
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh + 48px)' }}>
      <StageStyles />
      <div style={{ width: '100%', margin: '0 auto', maxWidth: 1400 }}>
        <div className="stg-head">
          <h1 className="stg-title">
            <RotateCcw style={{ color: 'var(--purple)' }} /> REPRINT REQUESTS
          </h1>
          <p className="stg-sub">Manage jobs requiring reprinting due to errors or complaints.</p>
        </div>

        <div className="stg-toolbar">
          <div className="stg-field" style={{ flex: '1 1 220px' }}>
            <label className="stg-label">Select Original Job #</label>
            <select value={form.jobId} onChange={e => setForm({...form, jobId: e.target.value})} className="stg-select">
              <option value="">-- Select Completed/Delivery Job --</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.id} ({j.customerName})</option>)}
            </select>
          </div>
          <div className="stg-field" style={{ flex: '1 1 220px' }}>
            <label className="stg-label">Reason for Reprint</label>
            <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="stg-select">
              <option value="">-- Select Reason --</option>
              <option>Print Error</option><option>Customer Complaint</option><option>Damage</option><option>Machine Error</option><option>Misprint</option>
            </select>
          </div>
          <button onClick={handleRequest} disabled={!form.jobId || !form.reason} className="stg-btn stg-btn--purple">
            <RotateCcw /> Submit Request
          </button>
        </div>

        <div className="stg-table-card">
          <div className="stg-table-scroll">
            <table className="stg-table">
              <thead>
                <tr>
                  <th className="stg-th">Original Job #</th>
                  <th className="stg-th">Reason</th>
                  <th className="stg-th">Billable</th>
                  <th className="stg-th">Status</th>
                  <th className="stg-th">Requested By / Date</th>
                  <th className="stg-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td className="stg-td stg-strong">{r.originalJobId}</td>
                    <td className="stg-td" style={{ color: 'var(--purple)', fontWeight: 500 }}>{r.reason}</td>
                    <td className="stg-td">
                      <span className={`stg-pill ${r.isBillable ? 'stg-pill--warning' : 'stg-pill--info'}`}>
                        {r.isBillable ? 'Yes (Client)' : 'No (Internal)'}
                      </span>
                    </td>
                    <td className="stg-td">
                      <span className={`stg-pill ${statusPill(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="stg-td stg-muted">
                      {r.requestedBy} <br/><span className="stg-note">{r.date}</span>
                    </td>
                    <td className="stg-td">
                      <div className="stg-cell-btns">
                        {r.status === 'Pending' ? (
                          <>
                            <button onClick={() => handleAction(r.id, 'Approve')} className="stg-btn stg-btn--sm stg-btn--soft-green"><Check /> Approve</button>
                            <button onClick={() => handleAction(r.id, 'Reject')} className="stg-btn stg-btn--sm stg-btn--soft-red"><X /> Reject</button>
                          </>
                        ) : r.status === 'Approved' ? (
                          <button className="stg-btn stg-btn--sm stg-btn--soft-violet"><Calendar /> Schedule</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="stg-empty">No reprint requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingReprintRequests;
