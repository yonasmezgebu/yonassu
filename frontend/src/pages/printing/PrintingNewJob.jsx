import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Printer, Upload } from 'lucide-react';
import { createJob } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { useNavigate } from 'react-router-dom';

const PrintingNewJob = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '', customerPhone: '',
    jobType: 'Business Cards', otherJobType: '',
    paperType: '', paperSize: '', color: 'Full Color',
    quantity: '', pagesCopies: '1', bindingType: 'None',
    finishingOptions: [], specialInstructions: '',
    priority: 'Normal', deadline: '',
    totalCost: '', depositPaid: ''
  });

  useEffect(() => {
    playSound('info'); // "📋 New Job Order Created" notification requirement
  }, []);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  
  const toggleFinishing = (opt) => {
    setForm(p => ({
      ...p, 
      finishingOptions: p.finishingOptions.includes(opt) 
        ? p.finishingOptions.filter(x => x !== opt) 
        : [...p.finishingOptions, opt]
    }));
  };

  const handleSave = (e, printTicket = false) => {
    e.preventDefault();
    createJob({
      ...form,
      jobType: form.jobType === 'Other' ? form.otherJobType : form.jobType,
      quantity: parseInt(form.quantity) || 0,
      pagesCopies: parseInt(form.pagesCopies) || 1,
      totalCost: parseFloat(form.totalCost) || 0,
      depositPaid: parseFloat(form.depositPaid) || 0
    });
    playSound('success');
    alert(printTicket ? 'Job saved and Ticket printed!' : 'Job successfully saved!');
    navigate('/printing/jobs/queue');
  };

  const balanceDue = (parseFloat(form.totalCost) || 0) - (parseFloat(form.depositPaid) || 0);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <PlusCircle color="#22c55e" size={28} /> NEW JOB ORDER
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Job # will be auto-generated upon saving.</p>
      </div>

      <form onSubmit={(e) => handleSave(e, false)}>
        {/* Customer & Job Basics */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Customer & Job Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date *</label>
            <input type="date" value={form.date} onChange={set('date')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Customer Name *</label>
            <input value={form.customerName} onChange={set('customerName')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Customer Phone *</label>
            <input type="tel" value={form.customerPhone} onChange={set('customerPhone')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Job Type *</label>
            <select value={form.jobType} onChange={set('jobType')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
              {['Business Cards', 'Flyers', 'Brochures', 'Posters', 'Books/Magazines', 'Labels', 'Packaging', 'Other'].map(o => <option key={o}>{o}</option>)}
            </select></div>
            {form.jobType === 'Other' && (
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Specify Other Job Type *</label>
              <input value={form.otherJobType} onChange={set('otherJobType')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            )}
          </div>
        </div>

        {/* Specifications */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Paper Type</label><input value={form.paperType} onChange={set('paperType')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Paper Size</label><input value={form.paperSize} onChange={set('paperSize')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Color</label>
            <select value={form.color} onChange={set('color')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}><option>Full Color</option><option>B&W</option></select></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Binding Type</label>
            <select value={form.bindingType} onChange={set('bindingType')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6 }}><option>None</option><option>Saddle Stitch</option><option>Perfect Binding</option><option>Spiral</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Quantity *</label><input type="number" value={form.quantity} onChange={set('quantity')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Pages/Copies</label><input type="number" value={form.pagesCopies} onChange={set('pagesCopies')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Finishing Options</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['Cutting', 'Binding', 'Folding', 'Laminating', 'Packaging'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', background: form.finishingOptions.includes(opt) ? '#e0e7ff' : '#f1f5f9', padding: '6px 12px', borderRadius: 20, border: `1px solid ${form.finishingOptions.includes(opt) ? '#818cf8' : '#cbd5e1'}` }}>
                  <input type="checkbox" checked={form.finishingOptions.includes(opt)} onChange={() => toggleFinishing(opt)} style={{ margin: 0 }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Special Instructions</label><textarea value={form.specialInstructions} onChange={set('specialInstructions')} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
        </div>

        {/* Priority, File & Financials */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Workflow & Files</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Priority</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { l: 'Normal', c: '#64748b' },
                  { l: 'Urgent', c: '#f59e0b' },
                  { l: 'Rush', c: '#dc2626' }
                ].map(p => (
                  <label key={p.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: p.c, cursor: 'pointer' }}>
                    <input type="radio" name="priority" checked={form.priority === p.l} onChange={() => setForm(prev => ({...prev, priority: p.l}))} /> {p.l}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Deadline *</label><input type="datetime-local" value={form.deadline} onChange={set('deadline')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Upload Artwork (PDF, AI, PSD, JPG, PNG, TIFF)</label>
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: 20, textAlign: 'center', color: '#64748b', cursor: 'pointer', background: '#f8fafc' }}>
                <Upload size={24} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>Click or drag files here</div>
              </div>
            </div>
          </div>
          
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Financials</h3>
            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Total Cost ($) *</label><input type="number" value={form.totalCost} onChange={set('totalCost')} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box', fontSize: 16, fontWeight: 'bold' }} /></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Deposit Paid ($)</label><input type="number" value={form.depositPaid} onChange={set('depositPaid')} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div style={{ background: balanceDue > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${balanceDue > 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: balanceDue > 0 ? '#991b1b' : '#166534' }}>Balance Due:</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: balanceDue > 0 ? '#dc2626' : '#16a34a' }}>${Math.max(0, balanceDue).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button type="button" onClick={(e) => handleSave(e, true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#0369a1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}><Printer size={18} /> Save & Print Job Ticket</button>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}><Save size={18} /> Save Job Order</button>
        </div>
      </form>
    </div>
  );
};

export default PrintingNewJob;
