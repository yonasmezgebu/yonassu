import React, { useState, useEffect } from 'react';
import { Inbox, CheckCircle, Clock } from 'lucide-react';
import { printingState, createJob } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDesignRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDesigner, setFilterDesigner] = useState('All');
  const [modalReq, setModalReq] = useState(null);

  const refresh = () => setRequests([...printingState.designRequests]);

  useEffect(() => {
    refresh();
    playSound('info'); // "📋 New Design Request Received"
  }, []);

  const handleAssign = (id, designer) => {
    if(!designer) return;
    if(window.confirm(`Assign request to ${designer}?`)) {
      const r = printingState.designRequests.find(x => x.id === id);
      if(r) { r.assignedDesigner = designer; r.status = 'Assigned'; }
      playSound('success');
      refresh();
    }
  };

  const handlePriority = (id, prio) => {
    const r = printingState.designRequests.find(x => x.id === id);
    if(r) r.priority = prio;
    playSound('success');
    refresh();
  };

  const handleConvert = (req) => {
    if(window.confirm('Convert this design request into an active Job Order?')) {
      const jobData = {
        customerName: req.client,
        jobType: req.jobType,
        specialInstructions: req.specs,
        priority: req.priority,
        deadline: req.deadline,
        totalCost: 0, depositPaid: 0
      };
      const newJob = createJob(jobData);
      
      const r = printingState.designRequests.find(x => x.id === req.id);
      if(r) { r.jobId = newJob.id; r.status = 'Converted'; }
      
      playSound('success');
      alert(`Successfully created ${newJob.id}`);
      refresh();
    }
  };

  const filtered = requests.filter(r => 
    (filterStatus === 'All' || r.status === filterStatus) &&
    (filterPriority === 'All' || r.priority === filterPriority) &&
    (filterDesigner === 'All' || r.assignedDesigner === filterDesigner)
  ).sort((a, b) => {
    const pMap = { 'Rush': 1, 'Urgent': 2, 'Normal': 3 };
    return (pMap[a.priority] || 3) - (pMap[b.priority] || 3);
  });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Inbox color="#f43f5e" size={28} /> DESIGN REQUESTS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Central intake queue for unlinked design work.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pending</option><option>Assigned</option><option>Converted</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Priority</label>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Normal</option><option>Urgent</option><option>Rush</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Designer</label>
          <select value={filterDesigner} onChange={e => setFilterDesigner(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Sara T.</option><option>Yonas G.</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Client', 'Job Type', 'Specs Summary', 'Deadline', 'Status', 'Priority', 'Assigned', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }} onClick={() => setModalReq(r)}>{r.client}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a' }}>{r.jobType}</td>
                <td style={{ padding: '12px 14px', color: '#475569', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.specs}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{r.deadline}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.status === 'Converted' ? '#dcfce7' : '#f1f5f9', color: r.status === 'Converted' ? '#16a34a' : '#475569' }}>{r.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <select value={r.priority} onChange={(e) => handlePriority(r.id, e.target.value)} style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}>
                    <option>Normal</option><option>Urgent</option><option>Rush</option>
                  </select>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {r.status === 'Converted' ? <span style={{color: '#94a3b8', fontSize: 12}}>{r.assignedDesigner}</span> : (
                    <select value={r.assignedDesigner || ''} onChange={(e) => handleAssign(r.id, e.target.value)} style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}>
                      <option value="">Assign...</option><option>Sara T. (2 active)</option><option>Yonas G. (0 active)</option>
                    </select>
                  )}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {r.status !== 'Converted' ? (
                    <button onClick={() => handleConvert(r)} style={{ padding: '4px 8px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Convert to Job</button>
                  ) : <span style={{fontSize: 12, color: '#3b82f6', fontWeight: 600}}>{r.jobId}</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingDesignRequests;
