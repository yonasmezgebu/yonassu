import React, { useState, useEffect } from 'react';
import { Archive, Download, Eye, X } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingHistory = () => {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [modalJob, setModalJob] = useState(null);

  useEffect(() => {
    // Show all jobs, including completed/cancelled
    setJobs([...printingState.jobs]);
    playSound('info'); // "📊 Job History Ready"
  }, []);

  const handleExport = () => {
    playSound('success');
    alert('Exporting Job History Report...');
  };

  const filtered = jobs.filter(j => 
    (filterStatus === 'All' || (filterStatus === 'Completed' && j.status === 'Completed') || (filterStatus === 'Cancelled' && j.status === 'Cancelled') || (filterStatus === 'Active' && !['Completed', 'Cancelled'].includes(j.status))) &&
    (!search || j.customerName.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Archive color="#64748b" size={28} /> JOB HISTORY
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Complete archive of all jobs with full audit trails.</p>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Search</label>
          <input placeholder="Job # or Customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: 200 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Active</option><option>Completed</option><option>Cancelled</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'Customer', 'Job Type', 'Quantity', 'Total Cost', 'Completed Date', 'Status', 'Processed By', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Quantity' || col === 'Total Cost' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(j => {
              const lastAudit = j.auditTrail && j.auditTrail.length > 0 ? j.auditTrail[j.auditTrail.length - 1] : null;
              return (
                <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>{j.customerName}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{j.jobType}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{j.quantity.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>${(j.totalCost || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{j.completedDate || '-'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: j.status === 'Completed' ? '#dcfce7' : j.status === 'Cancelled' ? '#fee2e2' : '#f1f5f9', color: j.status === 'Completed' ? '#16a34a' : j.status === 'Cancelled' ? '#dc2626' : '#64748b' }}>
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{lastAudit ? lastAudit.user : '-'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setModalJob(j)} style={{ padding: '6px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><Eye size={14} /> View Details</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Full Job Detail & Audit Trail Modal */}
      {modalJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 24 }}>Job Detail: {modalJob.id}</h2>
                <div style={{ display: 'inline-block', padding: '4px 12px', background: modalJob.status === 'Completed' ? '#dcfce7' : '#f1f5f9', color: modalJob.status === 'Completed' ? '#16a34a' : '#64748b', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                  Current Status: {modalJob.status}
                </div>
              </div>
              <button onClick={() => setModalJob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              <div>
                <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>Order Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, fontSize: 14 }}>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Customer:</div><div style={{ color: '#0f172a' }}>{modalJob.customerName} ({modalJob.customerPhone})</div>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Job Type:</div><div style={{ color: '#0f172a' }}>{modalJob.jobType}</div>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Quantity:</div><div style={{ color: '#0f172a' }}>{modalJob.quantity.toLocaleString()}</div>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Priority:</div><div style={{ color: '#0f172a', fontWeight: 600 }}>{modalJob.priority}</div>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Deadline:</div><div style={{ color: '#0f172a' }}>{new Date(modalJob.deadline).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>Financials</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, fontSize: 14 }}>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Total Cost:</div><div style={{ color: '#0f172a', fontWeight: 'bold' }}>${(modalJob.totalCost || 0).toLocaleString()}</div>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Deposit:</div><div style={{ color: '#16a34a' }}>${(modalJob.depositPaid || 0).toLocaleString()}</div>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Balance Due:</div><div style={{ color: modalJob.balanceDue > 0 ? '#dc2626' : '#64748b', fontWeight: 'bold' }}>${(modalJob.balanceDue || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>Complete Audit Trail</h3>
              <div style={{ borderLeft: '2px solid #e2e8f0', marginLeft: 8, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {modalJob.auditTrail && modalJob.auditTrail.map((log, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -31, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', border: '2px solid white' }}></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Transitioned to: {log.stage}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      {new Date(log.timestamp).toLocaleString()} • Action by: <strong>{log.user}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintingHistory;
