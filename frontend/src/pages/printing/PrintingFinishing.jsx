import React, { useState, useEffect } from 'react';
import { Scissors, CheckSquare } from 'lucide-react';
import { printingState, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

const PrintingFinishing = () => {
  const [jobs, setJobs] = useState([]);

  const refreshJobs = () => setJobs([...printingState.jobs.filter(j => j.status === 'Finishing')]);

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "✂️ Finishing Stage Updated"
  }, []);

  const handleComplete = (id) => {
    updateJobStage(id, 'Delivery');
    playSound('success');
    refreshJobs();
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="finishing" />
      <div className="stg-head">
        <h1 className="stg-title">
          <Scissors color="#C026D3" /> FINISHING
        </h1>
        <p className="stg-sub">Track jobs in post-print finishing.</p>
      </div>

      <div className="stg-table-card">
        <div className="stg-table-scroll">
          <table className="stg-table">
            <thead>
              <tr>
                {['Job #', 'Customer', 'Quantity', 'Finishing Type', 'Actions'].map(col => (
                  <th key={col} className={`stg-th${col === 'Quantity' ? ' stg-th--num' : ''}`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id}>
                  <td className="stg-td stg-strong">{j.id}</td>
                  <td className="stg-td">{j.customerName}</td>
                  <td className="stg-td stg-num stg-strong">{j.quantity.toLocaleString()}</td>
                  <td className="stg-td">
                    <div className="stg-cell-btns">
                      {j.finishingOptions && j.finishingOptions.length > 0 ? (
                        j.finishingOptions.map(opt => (
                          <span key={opt} className="stg-chip" style={{ background: '#F3E8FF', color: '#9333EA' }}>{opt}</span>
                        ))
                      ) : <span className="stg-note">None</span>}
                    </div>
                  </td>
                  <td className="stg-td">
                    <button onClick={() => handleComplete(j.id)} className="stg-btn stg-btn--soft-green stg-btn--sm"><CheckSquare size={14} /> Move to Delivery</button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td className="stg-td" colSpan={5}><div className="stg-empty">No jobs currently in Finishing.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingFinishing;
