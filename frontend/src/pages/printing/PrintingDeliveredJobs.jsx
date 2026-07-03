import React, { useState, useEffect } from 'react';
import { CheckCircle, File, Download } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDeliveredJobs = () => {
  const [deliveries, setDeliveries] = useState([]);

  const refresh = () => setDeliveries([...printingState.deliveries.filter(d => d.status === 'Delivered')]);

  useEffect(() => {
    refresh();
    playSound('info'); // "✅ Delivery Confirmed"
  }, []);

  const handleExport = () => {
    playSound('success');
    alert('Exported Proof of Delivery Data to Excel/PDF.');
  };

  const handleViewNote = (jobId) => {
    const dn = printingState.deliveryNotes.find(n => n.jobId === jobId);
    if(dn) alert(`Delivery Note ${dn.id} Details:\nItems: ${dn.items}\nQty: ${dn.quantity}\nMethod: ${dn.method}`);
    else alert('No specific delivery note document found for this job.');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <CheckCircle color="#10b981" size={28} /> DELIVERED JOBS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Historical archive of completed dispatch runs and proofs of delivery.</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Export Data
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Job #</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Delivery Date</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Driver Assigned</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>POD Signature</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(del => {
              const driver = printingState.drivers.find(d => d.id === del.driverId);
              return (
                <tr key={del.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{del.jobId || 'Unknown'}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{del.scheduleDate}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{driver ? driver.name : 'Walk-in / 3rd Party'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {del.signature ? (
                      <span style={{ fontSize: 11, color: '#10b981', background: '#ecfdf5', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>{del.signature}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>Not Captured</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button onClick={() => handleViewNote(del.jobId)} style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><File size={14} /> View Note</button>
                  </td>
                </tr>
              );
            })}
            {deliveries.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No delivered records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintingDeliveredJobs;
