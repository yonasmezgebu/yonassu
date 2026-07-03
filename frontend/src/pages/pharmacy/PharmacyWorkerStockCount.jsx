import React, { useState, useContext } from 'react';
import { ClipboardCheck, Plus, Trash2, CheckCircle } from 'lucide-react';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { submitNotification } from '../../utils/pharmacyNotifications';

const getMockSystemQty = (name) => {
  if (!name) return '';
  // simple deterministic mock based on length for demo
  return (name.length * 5) % 100;
};

const emptyLine = () => ({ id: Date.now(), itemName: '', physicalQty: '', systemQty: '', variance: 0, reason: '' });

const PharmacyWorkerStockCount = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const [countType, setCountType] = useState('Full Pharmacy Count');
  const [lines, setLines] = useState([emptyLine()]);
  const [submitted, setSubmitted] = useState(false);

  const addLine = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  
  const updateLine = (id, field, value) => {
    setLines(l => l.map(x => {
      if (x.id !== id) return x;
      const updated = { ...x, [field]: value };
      
      // Auto-calc logic
      if (field === 'itemName') {
        updated.systemQty = getMockSystemQty(value);
        if (updated.physicalQty !== '') {
          updated.variance = parseInt(updated.physicalQty || 0) - parseInt(updated.systemQty || 0);
        }
      }
      if (field === 'physicalQty') {
        updated.variance = parseInt(value || 0) - parseInt(updated.systemQty || 0);
      }
      return updated;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasManagerPermission) return;

    // Validation rule: if Variance ≠ 0, worker must enter a reason
    const invalidLine = lines.find(l => l.variance !== 0 && !l.reason.trim());
    if (invalidLine) {
      alert(`Reason required for variance on item: ${invalidLine.itemName || 'Unnamed Item'}`);
      return;
    }

    setSubmitted(true);
    submitNotification('📋 Stock Count Completed', 'Count Report - Click to Review');
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #06b6d4', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#06b6d4" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#164e63', margin: '0 0 8px' }}>Count Report Submitted</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>The stock count report has been sent to the Pharmacy Manager and is <strong>Pending Review</strong>.</p>
          <button onClick={() => { setSubmitted(false); setLines([emptyLine()]); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Back to Count
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#164e63' }}>
          <ClipboardCheck color="#06b6d4" size={28} /> STOCK COUNT
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Count Report</p>
      </div>

      <fieldset disabled={!hasManagerPermission} style={{ border: 'none', padding: 0, margin: 0, opacity: hasManagerPermission ? 1 : 0.6 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Count Details</h3>
            <div style={{ width: 300 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Count Type *</label>
              <select value={countType} onChange={e => setCountType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                <option>Full Pharmacy Count</option>
                <option>Category Count</option>
                <option>Spot Check</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Physical Counts</h3>
              <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                <Plus size={14} /> Add Item
              </button>
            </div>
            {lines.map((line, i) => (
              <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr auto', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>MEDICINE NAME *</label>}
                  <input required value={line.itemName} onChange={e => updateLine(line.id, 'itemName', e.target.value)} placeholder="Name" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>PHYSICAL QTY *</label>}
                  <input required type="number" value={line.physicalQty} onChange={e => updateLine(line.id, 'physicalQty', e.target.value)} placeholder="0" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>SYSTEM QTY</label>}
                  <input disabled value={line.systemQty} style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: '#f8fafc', color: '#64748b' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>VARIANCE</label>}
                  <input disabled value={line.variance} style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: line.variance !== 0 ? '#fee2e2' : '#f8fafc', color: line.variance !== 0 ? '#ef4444' : '#64748b', fontWeight: 'bold' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: line.variance !== 0 ? '#ef4444' : '#94a3b8', marginBottom: 4 }}>REASON (If Variance)</label>}
                  <input value={line.reason} onChange={e => updateLine(line.id, 'reason', e.target.value)} placeholder={line.variance !== 0 ? "Required" : "Optional"} style={{ width: '100%', padding: '9px 10px', border: line.variance !== 0 ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                  {lines.length > 1 && <button type="button" onClick={() => removeLine(line.id)} style={{ padding: '9px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={!hasManagerPermission} style={{ padding: '12px 32px', background: '#06b6d4', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
              Submit Count Report
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
};

export default PharmacyWorkerStockCount;
