import React, { useState, useEffect } from 'react';
import { Truck, Send, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import { printingState, markDelivered } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

const PrintingDelivery = () => {
  const [jobs, setJobs] = useState([]);

  const refreshJobs = () => setJobs([...printingState.jobs.filter(j => j.status === 'Delivery')]);

  useEffect(() => {
    refreshJobs();
    playSound('info'); // "🚚 Job Ready for Delivery"
  }, []);

  const handleNotify = (id) => {
    playSound('success');
    alert(`SMS/Email notification sent to customer for Job ${id}`);
  };

  const handleGenerateNote = (id) => {
    playSound('success');
    alert(`Generating Printable Delivery Note for Job ${id}...`);
  };

  const handleDeliver = (id) => {
    try {
      markDelivered(id);
      playSound('success');
      alert(`Job ${id} successfully marked as Delivered and Completed!`);
      refreshJobs();
    } catch (e) {
      alert(`Error: ${e.message}\nSupervisor override required or payment needed.`);
    }
  };

  const handleOverride = (id) => {
    const reason = prompt(`Job ${id} has an outstanding balance. Enter supervisor override reason:`);
    if (reason) {
      const job = printingState.jobs.find(j => j.id === id);
      job.balanceDue = 0; // Simulate payment or override logic
      markDelivered(id);
      playSound('success');
      alert(`Override accepted. Job ${id} completed.`);
      refreshJobs();
    }
  };

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="delivery" />
      <div className="stg-head">
        <h1 className="stg-title">
          <Truck color="#16A34A" /> READY FOR DELIVERY
        </h1>
        <p className="stg-sub">Manage completed jobs awaiting customer pickup/delivery. Balances must be cleared before marking delivered.</p>
      </div>

      <div className="stg-table-card">
        <div className="stg-table-scroll">
          <table className="stg-table">
            <thead>
              <tr>
                {['Job #', 'Customer', 'Phone', 'Quantity', 'Total Amount', 'Balance Due', 'Actions'].map(col => (
                  <th key={col} className={`stg-th${col.includes('Amount') || col.includes('Due') || col === 'Quantity' ? ' stg-th--num' : ''}`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id}>
                  <td className="stg-td stg-strong">{j.id}</td>
                  <td className="stg-td">{j.customerName}</td>
                  <td className="stg-td stg-muted">{j.customerPhone}</td>
                  <td className="stg-td stg-num stg-strong">{j.quantity.toLocaleString()}</td>
                  <td className="stg-td stg-num stg-accent">ETB {(j.totalCost || 0).toLocaleString()}</td>
                  <td className="stg-td stg-num stg-strong" style={{ color: j.balanceDue > 0 ? '#DC2626' : '#16A34A' }}>
                    ${(j.balanceDue || 0).toLocaleString()}
                  </td>
                  <td className="stg-td">
                    <div className="stg-cell-btns">
                      <button onClick={() => handleNotify(j.id)} className="stg-btn stg-btn--soft-blue stg-btn--sm"><Send size={14} /> Notify</button>
                      <button onClick={() => handleGenerateNote(j.id)} className="stg-btn stg-btn--ghost stg-btn--sm"><Printer size={14} /> Print Note</button>

                      {j.balanceDue === 0 ? (
                        <button onClick={() => handleDeliver(j.id)} className="stg-btn stg-btn--soft-green stg-btn--sm"><CheckCircle size={14} /> Mark Delivered</button>
                      ) : (
                        <button onClick={() => handleOverride(j.id)} className="stg-btn stg-btn--soft-red stg-btn--sm"><AlertTriangle size={14} /> Override & Deliver</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td className="stg-td" colSpan={7}><div className="stg-empty">No jobs waiting for delivery.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingDelivery;
