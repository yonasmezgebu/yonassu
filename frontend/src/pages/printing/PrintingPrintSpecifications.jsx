import React, { useState } from 'react';
import { FileText, Save, Trash, Copy } from 'lucide-react';
import { printingState } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';

const PrintingPrintSpecifications = () => {
  const [templates, setTemplates] = useState(printingState.templates);
  const [activeJob, setActiveJob] = useState('');

  const handleApply = (tpl) => {
    if (!activeJob) { alert('Please enter a Job # to apply this template to.'); return; }
    const job = printingState.jobs.find(j => j.id === activeJob);
    if (!job) { alert('Job not found.'); return; }
    
    if(window.confirm(`Overwrite specs for Job ${activeJob} with template "${tpl.name}"?`)) {
      job.paperType = tpl.paperType;
      job.paperSize = tpl.paperSize;
      job.color = tpl.color;
      job.bindingType = tpl.bindingType;
      if (tpl.notes) job.specialInstructions = tpl.notes;
      playSound('success');
      alert(`Specs applied to ${activeJob}.`);
      setActiveJob('');
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <FileText color="#eab308" size={28} /> PRINT SPECIFICATIONS (TEMPLATES)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Reusable specification templates to standardize job setup.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#eab308', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Save size={16} /> Create Template
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Target Job #</label>
          <input placeholder="e.g. JOB-000101" value={activeJob} onChange={e => setActiveJob(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: 200 }} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', paddingBottom: 8 }}>Enter a Job # here, then click "Apply" on a template below.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {templates.map(t => (
          <div key={t.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>{t.name}</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Copy size={16} /></button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash size={16} /></button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, fontSize: 13, color: '#475569', marginBottom: 20 }}>
              <strong style={{ color: '#0f172a' }}>Paper:</strong> <span>{t.paperType} ({t.paperSize})</span>
              <strong style={{ color: '#0f172a' }}>Color:</strong> <span>{t.color}</span>
              <strong style={{ color: '#0f172a' }}>Binding:</strong> <span>{t.bindingType}</span>
              <strong style={{ color: '#0f172a' }}>Coating:</strong> <span>{t.coating}</span>
            </div>
            <button onClick={() => handleApply(t)} style={{ width: '100%', padding: '8px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Apply to Job
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintingPrintSpecifications;
