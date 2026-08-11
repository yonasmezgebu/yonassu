import React, { useState, useEffect } from 'react';
import { PenTool, Upload, CheckCircle } from 'lucide-react';
import { printingState, updateJobStage, updateDesignProgress } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

const PrintingDesign = () => {
  const [jobs, setJobs] = useState([]);
  const [filterDesigner, setFilterDesigner] = useState('All');

  const refreshJobs = () => setJobs([...printingState.jobs.filter(j => j.status === 'Design')]);

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "🎨 Design Stage Updated"
  }, []);

  const handleProgressChange = (id, val) => {
    updateDesignProgress(id, parseInt(val));
    refreshJobs();
  };

  const handleUpload = (id) => {
    playSound('success');
    alert(`File uploaded and attached to ${id}`);
    // Simulate attaching file
    const job = printingState.jobs.find(j => j.id === id);
    if(job) job.files.push({ name: `design_final_${id}.pdf`, status: 'Pending' });
    refreshJobs();
  };

  const handleComplete = (id) => {
    updateJobStage(id, 'Prepress');
    playSound('success');
    refreshJobs();
  };

  const filtered = jobs.filter(j => filterDesigner === 'All' || j.assignedDesigner === filterDesigner);
  const designers = ['All', ...new Set(jobs.map(j => j.assignedDesigner).filter(Boolean))];

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="design" />
      <div className="stg-head">
        <h1 className="stg-title">
          <PenTool color="#7C3AED" /> IN DESIGN
        </h1>
        <p className="stg-sub">Track jobs currently in the design stage.</p>
      </div>

      <div className="stg-toolbar">
        <div className="stg-field">
          <label className="stg-label">Assigned Designer</label>
          <select className="stg-select" value={filterDesigner} onChange={e => setFilterDesigner(e.target.value)}>
            {designers.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="stg-table-card">
        <div className="stg-table-scroll">
          <table className="stg-table">
            <thead>
              <tr>
                {['Job #', 'Customer', 'Job Type', 'Assigned Designer', 'Started Date', 'Deadline', 'Progress (%)', 'Actions'].map(col => (
                  <th key={col} className="stg-th">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td className="stg-td stg-strong">{j.id}</td>
                  <td className="stg-td">{j.customerName}</td>
                  <td className="stg-td stg-muted">{j.jobType}</td>
                  <td className="stg-td stg-accent" style={{ color: '#7C3AED' }}>{j.assignedDesigner || 'Unassigned'}</td>
                  <td className="stg-td stg-muted">{j.startedDesignDate || '-'}</td>
                  <td className="stg-td stg-accent" style={{ color: '#DC2626' }}>{new Date(j.deadline).toLocaleDateString()}</td>
                  <td className="stg-td">
                    <div className="stg-progress">
                      <input type="range" min="0" max="100" value={j.designProgress || 0} onChange={(e) => handleProgressChange(j.id, e.target.value)} className="stg-range" />
                      <span className="stg-range-val">{j.designProgress || 0}%</span>
                    </div>
                  </td>
                  <td className="stg-td">
                    <div className="stg-cell-btns">
                      <button onClick={() => handleUpload(j.id)} className="stg-btn stg-btn--ghost stg-btn--sm"><Upload size={14} /> Upload Design</button>
                      <button onClick={() => handleComplete(j.id)} className="stg-btn stg-btn--soft-violet stg-btn--sm"><CheckCircle size={14} /> Complete (Prepress)</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td className="stg-td" colSpan={8}><div className="stg-empty">No jobs currently in design.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingDesign;
