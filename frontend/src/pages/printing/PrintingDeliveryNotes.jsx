import React, { useState, useEffect } from 'react';
import { File, Printer, Mail, CheckCircle } from 'lucide-react';
import { printingState, createDeliveryNote, updateJobStage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingDeliveryNotes = () => {
  const [notes, setNotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ jobId: '', method: 'Pickup', items: '', quantity: '' });

  const refresh = () => {
    setNotes([...printingState.deliveryNotes]);
    setJobs([...printingState.jobs.filter(j => j.status === 'Finishing' || j.status === 'Delivery')]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleGenerate = (e) => {
    e.preventDefault();
    const j = printingState.jobs.find(x => x.id === form.jobId);
    if (!j) return;

    createDeliveryNote({
      jobId: j.id, customerName: j.customerName, items: form.items || j.jobType, 
      quantity: form.quantity || j.quantity, totalAmount: j.totalCost, balanceDue: j.balanceDue,
      deliveryDate: new Date().toISOString().split('T')[0], method: form.method
    });
    
    playSound('success');
    alert('Delivery Note Generated.');
    setForm({ jobId: '', method: 'Pickup', items: '', quantity: '' });
    refresh();
  };

  const handleAction = (id, act) => {
    playSound('success');
    if (act === 'Print') alert('Exporting PDF for Print...');
    if (act === 'Email') alert('Email sent to customer via Notification Service.');
    if (act === 'Delivered') {
      const dn = printingState.deliveryNotes.find(x => x.id === id);
      if (dn) {
        dn.status = 'Delivered';
        updateJobStage(dn.jobId, 'Completed');
      }
      refresh();
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <File color="#3b82f6" size={28} /> DELIVERY NOTES
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Formal delivery documentation and dispatch tracking.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Create Form */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>Generate Delivery Note</h3>
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Job # *</label>
              <select value={form.jobId} onChange={e => {
                const j = jobs.find(x => x.id === e.target.value);
                setForm({...form, jobId: e.target.value, items: j?.jobType || '', quantity: j?.quantity || ''})
              }} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option value="">Select Finished/Delivery Job...</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.id} ({j.customerName})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Items Delivered (Editable)</label>
              <input value={form.items} onChange={e => setForm({...form, items: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Quantity (Allows Partial)</label>
              <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Method</label>
              <select value={form.method} onChange={e => setForm({...form, method: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option>Pickup</option><option>Delivery</option><option>Courier</option>
              </select>
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Generate</button>
          </form>
        </div>

        {/* Ledger */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>DN #</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Job / Customer</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{n.id} <br/><span style={{fontSize:11, color:'#64748b'}}>{n.deliveryDate}</span></td>
                  <td style={{ padding: '12px 14px', color: '#0f172a' }}>{n.jobId} <br/><span style={{fontSize:12, color:'#475569'}}>{n.customerName}</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: n.status === 'Delivered' ? '#dcfce7' : '#fef3c7', color: n.status === 'Delivered' ? '#16a34a' : '#d97706' }}>
                      {n.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => handleAction(n.id, 'Print')} style={{ padding: '6px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><Printer size={14} /> PDF</button>
                      <button onClick={() => handleAction(n.id, 'Email')} style={{ padding: '6px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><Mail size={14} /> Email</button>
                      {n.status !== 'Delivered' && (
                        <button onClick={() => handleAction(n.id, 'Delivered')} style={{ padding: '6px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><CheckCircle size={14} /> Mark Delivered</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {notes.length === 0 && <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No delivery notes generated.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingDeliveryNotes;
