import React, { useState, useEffect } from 'react';
import { List, ArrowRight } from 'lucide-react';
import { printingState, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const priorityColors = { Normal: '#64748b', Urgent: '#f59e0b', Rush: '#dc2626' };
const priorityRank = { Rush: 1, Urgent: 2, Normal: 3 };

const statusColors = {
  Pending: '#f1f5f9', Design: '#ede9fe', Prepress: '#fef3c7', 
  Printing: '#cffafe', Finishing: '#fae8ff', Delivery: '#dcfce7', Completed: '#f8fafc'
};
const statusTextColors = {
  Pending: '#475569', Design: '#7c3aed', Prepress: '#d97706', 
  Printing: '#0891b2', Finishing: '#d946ef', Delivery: '#16a34a', Completed: '#94a3b8'
};

const getDaysRemaining = (deadline) => {
  if (!deadline) return 0;
  const ms = new Date(deadline) - new Date();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const PrintingQueue = () => {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [search, setSearch] = useState('');

  const refreshJobs = () => {
    // Only show non-completed/non-cancelled jobs in queue by default
    setJobs([...printingState.jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled')]);
  };

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "📊 Job Queue Updated"
  }, []);

  const handleStageMove = (id, newStage) => {
    updateJobStage(id, newStage);
    playSound('success');
    refreshJobs();
  };

  const filtered = jobs
    .filter(j => 
      (filterStatus === 'All' || j.status === filterStatus) &&
      (filterPriority === 'All' || j.priority === filterPriority) &&
      (!search || j.customerName.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort by priority first (Rush -> Urgent -> Normal)
      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      // Then by soonest deadline
      return new Date(a.deadline) - new Date(b.deadline);
    });

  const getActionBtn = (job) => {
    switch (job.status) {
      case 'Pending': return <button onClick={() => handleStageMove(job.id, 'Design')} style={btnStyle('#8b5cf6', '#ede9fe')}>Move to Design</button>;
      case 'Design': return <span style={{fontSize: 12, color: '#94a3b8'}}>Manage in Design</span>;
      case 'Prepress': return <span style={{fontSize: 12, color: '#94a3b8'}}>Manage in Prepress</span>;
      case 'Printing': return <button onClick={() => handleStageMove(job.id, 'Finishing')} style={btnStyle('#d946ef', '#fae8ff')}>Move to Finish</button>;
      case 'Finishing': return <button onClick={() => handleStageMove(job.id, 'Delivery')} style={btnStyle('#16a34a', '#dcfce7')}>Mark Ready</button>;
      default: return null;
    }
  };

  const btnStyle = (color, bg) => ({
    padding: '4px 10px', background: bg, color: color, border: `1px solid ${color}40`, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12
  });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <List color="#3b82f6" size={28} /> JOB QUEUE
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Master view of all active jobs across all stages. Sorted by priority and deadline.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Search</label>
          <input placeholder="Job # or Customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: 200 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Pending</option><option>Design</option><option>Prepress</option><option>Printing</option><option>Finishing</option><option>Delivery</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Priority</label>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option>All</option><option>Normal</option><option>Urgent</option><option>Rush</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'Customer', 'Job Type', 'Quantity', 'Priority', 'Deadline', 'Status', 'Days Remaining', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Quantity' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(j => {
              const days = getDaysRemaining(j.deadline);
              const rowBg = days < 0 ? '#fef2f2' : days === 0 ? '#fffbeb' : 'transparent';
              return (
                <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9', background: rowBg }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                  <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{j.customerName}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{j.jobType}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{j.quantity.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ color: priorityColors[j.priority], fontWeight: 700 }}>{j.priority}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{new Date(j.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusColors[j.status], color: statusTextColors[j.status] }}>
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: days < 0 ? '#dc2626' : days === 0 ? '#d97706' : '#16a34a' }}>
                    {days < 0 ? `Overdue (${Math.abs(days)}d)` : days === 0 ? 'Due Today' : `${days} days`}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {getActionBtn(j)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No active jobs in queue.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingQueue;
