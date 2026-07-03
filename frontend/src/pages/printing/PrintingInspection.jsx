import React, { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle, XCircle, Download, Search } from 'lucide-react';
import { printingState, updateJobStage, generateId } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const DEFAULT_CHECKLIST = [
  'Color Accuracy', 'Print Quality', 'Registration', 'Paper Quality',
  'Cutting Accuracy', 'Binding/Finishing', 'Quantity Match', 'Packaging Condition'
];

const DEFECT_TYPES = ['Color Mismatch', 'Smudges/Stains', 'Misregistration', 'Paper Damage', 'Cutting Error', 'Binding Error', 'Quantity Shortage', 'Packaging Damage'];

const PrintingInspection = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [inspector, setInspector] = useState('Supervisor');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [toast, setToast] = useState(null);

  const refresh = () => {
    setJobs([...printingState.jobs.filter(j => 
      j.status === 'Finishing' || j.status === 'Ready for Delivery' || j.status === 'QC Rework'
    )]);
  };

  useEffect(() => { refresh(); playSound('info'); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const selectJob = (job) => {
    setSelectedJob(job);
    const tmpl = printingState.qualityChecklists.find(c => c.type === job.jobType);
    const items = tmpl ? tmpl.items : DEFAULT_CHECKLIST;
    const initial = {};
    items.forEach(i => { initial[i] = false; });
    setChecklist(initial);
  };

  const allChecked = Object.values(checklist).every(v => v === true);
  const passScore = Object.values(checklist).filter(v => v).length;
  const totalItems = Object.keys(checklist).length;

  const handleSubmit = (result) => {
    if (!selectedJob) return;
    if (result === 'PASS' && !allChecked) {
      alert('All checklist items must be checked to PASS.');
      return;
    }
    const inspection = {
      id: generateId('INS'),
      jobId: selectedJob.id,
      inspector,
      date: new Date().toISOString(),
      status: result,
      checklist: { ...checklist },
      score: `${passScore}/${totalItems}`
    };
    printingState.inspections.push(inspection);

    if (result === 'PASS') {
      updateJobStage(selectedJob.id, 'Delivery');
      playSound('success');
      showToast('✅ Inspection Completed — Job PASSED. Moving to Delivery.', 'success');
    } else {
      // Create a defect report automatically
      printingState.defectReports.push({
        id: generateId('DEF'),
        jobId: selectedJob.id,
        reportedBy: inspector,
        date: new Date().toISOString(),
        type: 'Inspection Failure',
        description: `Failed ${totalItems - passScore} checklist item(s)`,
        status: 'Pending Action'
      });
      updateJobStage(selectedJob.id, 'QC Failed');
      playSound('info');
      showToast(`📋 Inspection FAILED — Defect Report created for Job #${selectedJob.id}`, 'info');
    }

    setSelectedJob(null);
    setChecklist({});
    refresh();
  };

  const handleExportCert = () => {
    playSound('success');
    alert('Inspection Certificate PDF Generated & Ready to Print.');
  };

  const filtered = jobs.filter(j =>
    (filterStatus === 'All' || j.status === filterStatus) &&
    (j.id.toLowerCase().includes(search.toLowerCase()) || j.customerName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, background: toast.type === 'success' ? '#ecfdf5' : '#eff6ff', border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#bfdbfe'}`, color: toast.type === 'success' ? '#065f46' : '#1e40af', padding: '14px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxWidth: 400 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <ClipboardCheck color="#0ea5e9" size={28} /> QUALITY INSPECTION
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Final quality gate before delivery. Inspect jobs with a structured checklist.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Left: Jobs Table */}
        <div>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 12px' }}>
              <Search size={16} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Job # or Customer..." style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, color: '#0f172a' }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#475569' }}>
              <option>All</option><option>Finishing</option><option>Ready for Delivery</option><option>QC Rework</option>
            </select>
          </div>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Job #', 'Customer', 'Type', 'Status', 'Inspect'].map(col => (
                    <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(j => (
                  <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedJob?.id === j.id ? '#f0f9ff' : 'white' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{j.id}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{j.customerName}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{j.jobType}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: j.status === 'QC Rework' ? '#fef3c7' : '#ecfdf5', color: j.status === 'QC Rework' ? '#d97706' : '#059669' }}>
                        {j.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => selectJob(j)} style={{ padding: '6px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Inspect</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No jobs ready for inspection.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Checklist Panel */}
        {selectedJob && (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#0f172a' }}>{selectedJob.id}</h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>{selectedJob.customerName} · {selectedJob.jobType} · Qty: {selectedJob.quantity}</div>
              </div>
              <button onClick={() => { setSelectedJob(null); setChecklist({}); }} style={{ padding: '4px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✕ Close</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Inspector Name</label>
              <input value={inspector} onChange={e => setInspector(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Quality Checklist</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9' }}>{passScore}/{totalItems} Passed</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: allChecked ? '#10b981' : '#0ea5e9', width: `${totalItems > 0 ? (passScore/totalItems)*100 : 0}%`, transition: 'width 0.3s' }}></div>
              </div>
              {Object.keys(checklist).map(item => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 6, background: checklist[item] ? '#f0fdf4' : 'white', border: `1px solid ${checklist[item] ? '#bbf7d0' : '#e2e8f0'}`, transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={checklist[item]} onChange={e => setChecklist({ ...checklist, [item]: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
                  <span style={{ fontSize: 13, fontWeight: checklist[item] ? 600 : 400, color: checklist[item] ? '#065f46' : '#475569' }}>{item}</span>
                  {checklist[item] && <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto' }} />}
                </label>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              <strong>Inspector:</strong> {inspector} &nbsp;·&nbsp; <strong>Date:</strong> {new Date().toLocaleDateString()} &nbsp;·&nbsp; <strong>Time:</strong> {new Date().toLocaleTimeString()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleSubmit('PASS')} disabled={!allChecked} style={{ width: '100%', padding: '12px', background: allChecked ? '#10b981' : '#e2e8f0', color: allChecked ? 'white' : '#94a3b8', border: 'none', borderRadius: 6, cursor: allChecked ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle size={18} /> PASS — Move to Delivery
              </button>
              <button onClick={() => handleSubmit('FAIL')} style={{ width: '100%', padding: '12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <XCircle size={18} /> FAIL — Send to Defect Report
              </button>
              <button onClick={handleExportCert} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={14} /> Export Inspection Certificate (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintingInspection;
