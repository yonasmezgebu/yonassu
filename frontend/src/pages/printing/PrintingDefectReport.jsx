import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Upload } from 'lucide-react';
import { printingState, generateId } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const DEFECT_TYPES = ['Color Mismatch', 'Smudges/Stains', 'Misregistration', 'Paper Damage', 'Cutting Error', 'Binding Error', 'Quantity Shortage', 'Packaging Damage', 'Inspection Failure'];

const PrintingDefectReport = () => {
  const [reports, setReports] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ jobId: '', type: 'Color Mismatch', description: '', reportedBy: 'Supervisor', photoUploaded: false });
  const [search, setSearch] = useState('');

  const refresh = () => {
    setReports([...printingState.defectReports]);
    setJobs([...printingState.jobs.filter(j => j.status === 'QC Failed' || j.status === 'QC Rework')]);
  };

  useEffect(() => { refresh(); playSound('info'); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.jobId) return;
    const def = { id: generateId('DEF'), ...form, date: new Date().toISOString(), status: 'Pending Action' };
    printingState.defectReports.push(def);
    playSound('info');
    showToast(`📋 Defect Reported — Job #${form.jobId}`);
    setForm({ jobId: '', type: 'Color Mismatch', description: '', reportedBy: 'Supervisor', photoUploaded: false });
    refresh();
  };

  const handleAction = (id, act) => {
    const def = printingState.defectReports.find(d => d.id === id);
    if (!def) return;

    if (act === 'Rework') {
      if (!window.confirm(`Send Job #${def.jobId} to rework?`)) return;
      def.status = 'Rework Assigned';
      printingState.reworkJobs.push({
        id: generateId('RWK'),
        defectId: id,
        originalJobId: def.jobId,
        type: 'Re-print',
        assignedTo: 'Unassigned',
        status: 'Pending',
        startedDate: null,
        expectedCompletion: null
      });
      playSound('info');
      showToast(`🔄 Rework Assigned — Job #${def.jobId}`);
    } else if (act === 'Reprint') {
      def.status = 'Reprint Requested';
      playSound('success');
      showToast(`🖨️ Reprint Requested — Job #${def.jobId}`);
    } else if (act === 'Approve with Discount') {
      const disc = prompt('Enter discount % to apply:');
      if (!disc) return;
      def.status = `Approved (${disc}% Discount)`;
      playSound('success');
      showToast(`✅ Approved with ${disc}% Discount — Job #${def.jobId}`);
    } else if (act === 'Reject') {
      const reason = prompt('Enter rejection reason:');
      if (!reason) return;
      def.status = 'Rejected';
      playSound('success');
      showToast(`❌ Job #${def.jobId} Rejected`);
    }

    refresh();
  };

  const filtered = reports.filter(r =>
    r.jobId?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => {
    if (s === 'Pending Action') return { bg: '#fef3c7', color: '#d97706' };
    if (s.includes('Rework')) return { bg: '#eff6ff', color: '#3b82f6' };
    if (s.includes('Approved')) return { bg: '#ecfdf5', color: '#059669' };
    if (s === 'Rejected') return { bg: '#fef2f2', color: '#dc2626' };
    return { bg: '#f1f5f9', color: '#475569' };
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '14px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <AlertTriangle color="#ef4444" size={28} /> DEFECT REPORT
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Log and manage quality defects discovered during or after inspection.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        {/* Log New Defect Form */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a', fontWeight: 700 }}>Log New Defect</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Job # *</label>
              <select value={form.jobId} onChange={e => setForm({...form, jobId: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
                <option value="">Select Job...</option>
                {printingState.jobs.map(j => <option key={j.id} value={j.id}>{j.id} — {j.customerName}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Defect Type *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
                {DEFECT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} placeholder="Describe the defect..." />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Reported By</label>
              <input value={form.reportedBy} onChange={e => setForm({...form, reportedBy: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px', border: '1px dashed #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
              <Upload size={16} color="#3b82f6" />
              {form.photoUploaded ? '📎 Evidence Photo Attached' : 'Upload Photo/Evidence'}
              <input type="file" hidden onChange={() => setForm({...form, photoUploaded: true})} />
            </label>
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              Submit Defect Report
            </button>
          </form>
        </div>

        {/* Defect List */}
        <div>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Job # or Defect Type..." style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => {
              const sc = statusColor(r.status);
              return (
                <div key={r.id} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{r.id}</span>
                      <span style={{ marginLeft: 10, fontSize: 13, color: '#64748b' }}>Job: <strong>{r.jobId}</strong></span>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 4, fontWeight: 600, marginRight: 8 }}>{r.type}</span>
                    {r.description} &nbsp;·&nbsp; By: {r.reportedBy}
                  </div>
                  {r.status === 'Pending Action' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => handleAction(r.id, 'Rework')} style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🔄 Rework</button>
                      <button onClick={() => handleAction(r.id, 'Reprint')} style={{ padding: '6px 12px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🖨️ Reprint</button>
                      <button onClick={() => handleAction(r.id, 'Approve with Discount')} style={{ padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>💰 Approve w/ Discount</button>
                      <button onClick={() => handleAction(r.id, 'Reject')} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>❌ Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#94a3b8' }}>No defect reports found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingDefectReport;
