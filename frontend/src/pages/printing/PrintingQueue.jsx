import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import { printingState, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

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
      case 'Pending': return <button onClick={() => handleStageMove(job.id, 'Design')} className="stg-btn stg-btn--soft-violet stg-btn--sm">Move to Design</button>;
      case 'Design': return <span className="stg-note">Manage in Design</span>;
      case 'Prepress': return <span className="stg-note">Manage in Prepress</span>;
      case 'Printing': return <button onClick={() => handleStageMove(job.id, 'Finishing')} className="stg-btn stg-btn--soft-cyan stg-btn--sm">Move to Finish</button>;
      case 'Finishing': return <button onClick={() => handleStageMove(job.id, 'Delivery')} className="stg-btn stg-btn--soft-green stg-btn--sm">Mark Ready</button>;
      default: return null;
    }
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="queue" />
      <div className="stg-head">
        <h1 className="stg-title">
          <List color="#2563EB" /> JOB QUEUE
        </h1>
        <p className="stg-sub">Master view of all active jobs across all stages. Sorted by priority and deadline.</p>
      </div>

      <div className="stg-toolbar">
        <div className="stg-field stg-field--grow">
          <label className="stg-label">Search</label>
          <input className="stg-input" placeholder="Job # or Customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="stg-field">
          <label className="stg-label">Status</label>
          <select className="stg-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option>All</option><option>Pending</option><option>Design</option><option>Prepress</option><option>Printing</option><option>Finishing</option><option>Delivery</option>
          </select>
        </div>
        <div className="stg-field">
          <label className="stg-label">Priority</label>
          <select className="stg-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option>All</option><option>Normal</option><option>Urgent</option><option>Rush</option>
          </select>
        </div>
      </div>

      <div className="stg-table-card">
        <div className="stg-table-scroll">
          <table className="stg-table">
            <thead>
              <tr>
                {['Job #', 'Customer', 'Job Type', 'Quantity', 'Priority', 'Deadline', 'Status', 'Days Remaining', 'Actions'].map(col => (
                  <th key={col} className={`stg-th${col === 'Quantity' ? ' stg-th--num' : ''}`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => {
                const days = getDaysRemaining(j.deadline);
                const rowClass = days < 0 ? 'stg-row--overdue' : days === 0 ? 'stg-row--due' : '';
                return (
                  <tr key={j.id} className={rowClass}>
                    <td className="stg-td stg-strong">{j.id}</td>
                    <td className="stg-td">{j.customerName}</td>
                    <td className="stg-td stg-muted">{j.jobType}</td>
                    <td className="stg-td stg-num stg-strong">{j.quantity.toLocaleString()}</td>
                    <td className="stg-td">
                      <span className="stg-accent" style={{ color: priorityColors[j.priority] }}>{j.priority}</span>
                    </td>
                    <td className="stg-td stg-muted">{new Date(j.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="stg-td">
                      <span className="stg-pill" style={{ background: statusColors[j.status], color: statusTextColors[j.status] }}>
                        {j.status}
                      </span>
                    </td>
                    <td className="stg-td">
                      <span className="stg-accent" style={{ color: days < 0 ? '#dc2626' : days === 0 ? '#d97706' : '#16a34a' }}>
                        {days < 0 ? `Overdue (${Math.abs(days)}d)` : days === 0 ? 'Due Today' : `${days} days`}
                      </span>
                    </td>
                    <td className="stg-td">
                      <div className="stg-cell-btns">{getActionBtn(j)}</div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td className="stg-td" colSpan={9}><div className="stg-empty">No active jobs in queue.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingQueue;
