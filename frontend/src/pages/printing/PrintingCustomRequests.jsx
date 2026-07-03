import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Check, X } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingCustomRequests = () => {
  const [requests, setRequests] = useState([]);

  const refresh = () => setRequests([...printingState.customRequests]);

  useEffect(() => {
    refresh();
    playSound('info'); // "🎨 New Custom Request"
  }, []);

  const handleAction = (id, act) => {
    const r = printingState.customRequests.find(x => x.id === id);
    if (!r) return;

    if (act === 'Reject' || act === 'More Info') {
      const notes = prompt(`Enter message to send to customer for ${act}:`);
      if (!notes) return;
      r.status = act === 'Reject' ? 'Rejected' : 'Awaiting Customer';
    } else if (act === 'Review') {
      r.status = 'Reviewing';
      // Mock pushing to Design Requests
      printingState.designRequests.push({
        id: `DR-from-${id}`, client: r.customerName, jobType: r.type, specs: r.description, deadline: r.deadline, status: 'Pending', priority: r.priority, assignedDesigner: null, jobId: null
      });
      alert('Pushed to internal Design Requests (Menu 9) for feasibility review.');
    } else if (act === 'Approve') {
      r.status = 'Approved';
      alert('Approved! Convert to Order in Menu 19.');
    }
    
    playSound('success');
    refresh();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Star color="#ec4899" size={28} /> CUSTOM REQUESTS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Pre-sales intake for bespoke, non-standard work.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {requests.map(r => (
          <div key={r.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#0f172a' }}>{r.id}</h3>
                <div style={{ fontSize: 14, color: '#ec4899', fontWeight: 600 }}>{r.type}</div>
              </div>
              <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.status === 'Pending' ? '#fef3c7' : '#f1f5f9', color: r.status === 'Pending' ? '#d97706' : '#475569' }}>
                {r.status}
              </span>
            </div>

            <div style={{ fontSize: 13, color: '#475569', marginBottom: 16, flex: 1 }}>
              <p style={{ margin: '0 0 8px' }}><strong>Client:</strong> {r.customerName}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Description:</strong> {r.description}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Budget:</strong> {r.budget}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Deadline:</strong> <span style={{ color: r.priority === 'Urgent' ? '#ef4444' : 'inherit' }}>{r.deadline} ({r.priority})</span></p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => handleAction(r.id, 'Review')} style={{ flex: 1, padding: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Send to Design</button>
              <button onClick={() => handleAction(r.id, 'Approve')} style={{ flex: 1, padding: '8px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Check size={14} /> Approve</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => handleAction(r.id, 'More Info')} style={{ flex: 1, padding: '8px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><MessageCircle size={14} /> Req. Info</button>
              <button onClick={() => handleAction(r.id, 'Reject')} style={{ flex: 1, padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><X size={14} /> Reject</button>
            </div>
          </div>
        ))}
        {requests.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>No custom requests pending.</div>}
      </div>
    </div>
  );
};

export default PrintingCustomRequests;
