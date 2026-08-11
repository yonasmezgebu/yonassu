import React, { useState, useEffect } from 'react';
import { Printer, FastForward } from 'lucide-react';
import { printingState, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

const PrintingInPrint = () => {
  const [jobs, setJobs] = useState([]);
  const [filterMachine, setFilterMachine] = useState('All');

  const refreshJobs = () => setJobs([...printingState.jobs.filter(j => j.status === 'Printing')]);

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "🖨️ Printing Stage Updated"
  }, []);

  const handleUpdate = (id, field, val) => {
    const job = printingState.jobs.find(j => j.id === id);
    if(job) job[field] = val;
    refreshJobs();
  };

  const handleComplete = (id) => {
    updateJobStage(id, 'Finishing');
    playSound('success');
    refreshJobs();
  };

  const filtered = jobs.filter(j => filterMachine === 'All' || j.machineAssigned === filterMachine);

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="printing" />
      <div className="stg-head">
        <h1 className="stg-title">
          <Printer color="#0891B2" /> IN PRINTING
        </h1>
        <p className="stg-sub">Track jobs currently on press.</p>
      </div>

      <div className="stg-toolbar">
        <div className="stg-field">
          <label className="stg-label">Filter by Machine</label>
          <select className="stg-select" value={filterMachine} onChange={e => setFilterMachine(e.target.value)}>
            <option>All</option><option>Press A</option><option>Press B</option><option>Digital Printer 1</option><option>Wide Format</option>
          </select>
        </div>
      </div>

      <div className="stg-table-card">
        <div className="stg-table-scroll">
          <table className="stg-table">
            <thead>
              <tr>
                {['Job #', 'Customer', 'Quantity', 'Machine', 'Operator', 'Started', 'Progress (%)', 'Est. Completion', 'Actions'].map(col => (
                  <th key={col} className={`stg-th${col === 'Quantity' ? ' stg-th--num' : ''}`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td className="stg-td stg-strong">{j.id}</td>
                  <td className="stg-td">{j.customerName}</td>
                  <td className="stg-td stg-num stg-strong">{j.quantity.toLocaleString()}</td>
                  <td className="stg-td">
                    <select value={j.machineAssigned || ''} onChange={(e) => handleUpdate(j.id, 'machineAssigned', e.target.value)} className="stg-select stg-input--sm" style={{ width: 150 }}>
                      <option value="">Assign Machine</option><option>Press A</option><option>Press B</option><option>Digital Printer 1</option>
                    </select>
                  </td>
                  <td className="stg-td">
                    <input placeholder="Operator" value={j.operator || ''} onChange={(e) => handleUpdate(j.id, 'operator', e.target.value)} className="stg-input stg-input--sm" style={{ width: 110 }} />
                  </td>
                  <td className="stg-td stg-muted">{j.printStarted || '-'}</td>
                  <td className="stg-td">
                    <div className="stg-progress">
                      <input type="range" min="0" max="100" value={j.printProgress || 0} onChange={(e) => handleUpdate(j.id, 'printProgress', parseInt(e.target.value))} className="stg-range" />
                      <span className="stg-range-val">{j.printProgress || 0}%</span>
                    </div>
                  </td>
                  <td className="stg-td">
                    <input type="datetime-local" value={j.estimatedPrintCompletion || ''} onChange={(e) => handleUpdate(j.id, 'estimatedPrintCompletion', e.target.value)} className="stg-input stg-input--sm" style={{ width: 170 }} />
                  </td>
                  <td className="stg-td">
                    <div className="stg-cell-btns">
                      <button onClick={() => { playSound('success'); }} className="stg-btn stg-btn--ghost stg-btn--sm">Update</button>
                      <button onClick={() => handleComplete(j.id)} className="stg-btn stg-btn--soft-purple stg-btn--sm"><FastForward size={14} /> Finish</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td className="stg-td" colSpan={9}><div className="stg-empty">No jobs currently in Printing.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingInPrint;
