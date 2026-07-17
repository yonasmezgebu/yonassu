import React, { useState, useEffect } from 'react';
import { Truck, Send, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import { printingState, markDelivered } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

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
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Truck color="#16a34a" size={28} /> READY FOR DELIVERY
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage completed jobs awaiting customer pickup/delivery. Balances must be cleared before marking delivered.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Job #', 'Customer', 'Phone', 'Quantity', 'Total Amount', 'Balance Due', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col.includes('Amount') || col.includes('Due') || col === 'Quantity' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{j.customerName}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{j.customerPhone}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{j.quantity.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>ETB {(j.totalCost || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: j.balanceDue > 0 ? '#dc2626' : '#16a34a' }}>
                  ${(j.balanceDue || 0).toLocaleString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => handleNotify(j.id)} style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Send size={14} /> Notify</button>
                    <button onClick={() => handleGenerateNote(j.id)} style={{ padding: '4px 8px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Printer size={14} /> Print Note</button>
                    
                    {j.balanceDue === 0 ? (
                      <button onClick={() => handleDeliver(j.id)} style={{ padding: '4px 8px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><CheckCircle size={14} /> Mark Delivered</button>
                    ) : (
                      <button onClick={() => handleOverride(j.id)} style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><AlertTriangle size={14} /> Override & Deliver</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs waiting for delivery.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingDelivery;
