import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, AlertTriangle } from 'lucide-react';
import { printingState, logMaterialUsage } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingMaterialUsage = () => {
  const [logs, setLogs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  const [form, setForm] = useState({
    jobId: '', materialType: '', quantity: '', unit: '', cost: '', wastageQty: '0', reason: '', notes: ''
  });

  const refresh = () => {
    setLogs([...printingState.materialUsage].reverse());
    setMaterials([...printingState.materials]);
    setJobs([...printingState.jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled')]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleLog = (e) => {
    e.preventDefault();
    if(window.confirm('Log this material consumption?')) {
      logMaterialUsage({
        jobId: form.jobId,
        materialType: form.materialType,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        cost: parseFloat(form.cost),
        wastageQty: parseFloat(form.wastageQty) || 0,
        reason: form.reason,
        recordedBy: 'Supervisor'
      });
      playSound('success');
      alert('Material Usage Logged Successfully.');
      setForm({ jobId: '', materialType: '', quantity: '', unit: '', cost: '', wastageQty: '0', reason: '', notes: '' });
      refresh();
      
      // Notification Check
      const mat = printingState.materials.find(m => m.type === form.materialType);
      if(mat && mat.stock <= mat.reorderLevel) {
        playSound('info'); // "📦 Low Material Stock"
        alert(`Warning: ${mat.name} is low on stock (${mat.stock} remaining).`);
      }
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Package color="#6366f1" size={28} /> MATERIAL USAGE
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track consumption and wastage of raw materials per job.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Form */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16 }}>Log Material</h3>
          <form onSubmit={handleLog}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Job # *</label>
              <select value={form.jobId} onChange={e => setForm({...form, jobId: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option value="">Select Job...</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.id} ({j.customerName})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Material Category *</label>
              <select value={form.materialType} onChange={e => setForm({...form, materialType: e.target.value, unit: materials.find(m => m.type === e.target.value)?.name.includes('L') ? 'Liters' : 'Units'})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option value="">Select Category...</option>
                {materials.map(m => <option key={m.type} value={m.type}>{m.name} (Stock: {m.stock})</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Used Qty *</label><input type="number" step="0.1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Unit</label><input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box', background: '#f1f5f9' }} /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Total Cost ($) *</label><input type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: '#dc2626', fontWeight: 600, fontSize: 14 }}><AlertTriangle size={16} /> Spoilage / Wastage Log</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Wastage Qty</label><input type="number" step="0.1" value={form.wastageQty} onChange={e => setForm({...form, wastageQty: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Reason</label>
                  <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                    <option value="">None</option><option>Machine Error</option><option>Misprint</option><option>Setup Waste</option><option>Damaged Stock</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <PlusCircle size={16} /> Log Usage & Deduct Stock
            </button>
          </form>
        </div>

        {/* Ledger */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Job #</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Material</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Used</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Wastage</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Cost</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(L => (
                <tr key={L.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{L.jobId}</td>
                  <td style={{ padding: '12px 14px', color: '#6366f1', fontWeight: 500 }}>{L.materialType}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{L.quantity} {L.unit}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#dc2626', fontWeight: L.wastageQty > 0 ? 'bold' : 'normal' }}>
                    {L.wastageQty > 0 ? `${L.wastageQty} ${L.unit}` : '-'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>${L.cost}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{L.recordedBy} <br/><span style={{fontSize:11, color: '#94a3b8'}}>{L.date}</span></td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No materials logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintingMaterialUsage;
