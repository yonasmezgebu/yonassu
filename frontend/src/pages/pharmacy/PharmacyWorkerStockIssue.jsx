import React, { useState, useContext } from 'react';
import { ArrowRight, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { createIssueNote } from '../../utils/storeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const emptyLine = () => ({ id: Date.now(), itemName: '', qtyToIssue: '', batchNumber: '' });

const PharmacyWorkerStockIssue = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const [destination, setDestination] = useState('Other Departments');
  const [recipientName, setRecipientName] = useState('');
  const [reason, setReason] = useState('Transfer');
  const [lines, setLines] = useState([emptyLine()]);
  const [submitted, setSubmitted] = useState(null);

  const addLine = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  const updateLine = (id, field, value) => setLines(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasManagerPermission) return;

    try {
      // isPharmacyDispense = true to bypass strict Requisition ref requirement, 
      // since we aren't asking for M20 here based on the spec
      const m22Record = createIssueNote(destination, '', '', lines, true);
      setSubmitted({ ...m22Record, m22Number: m22Record.id, recipientName, reason });
      submitNotification('📤 Stock Issued', 'Stock Issue Completed - Click to View');
    } catch (err) {
      alert(err.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #8b5cf6', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#8b5cf6" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#4c1d95', margin: '12px 0 4px' }}>Stock Issued Successfully</h2>
            <p style={{ color: '#64748b' }}>M22 Issue Note generated and inventory updated.</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
              <div><strong>M22 Number:</strong> <span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{submitted.m22Number}</span></div>
              <div><strong>Destination:</strong> {submitted.destination}</div>
              <div><strong>Recipient Name:</strong> {submitted.recipientName}</div>
              <div><strong>Reason:</strong> {submitted.reason}</div>
            </div>
            <h4 style={{ margin: '16px 0 8px', color: '#475569' }}>Items Issued:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#ede9fe' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Batch</th>
              </tr></thead>
              <tbody>{submitted.lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.itemName}</td>
                  <td style={{ padding: '8px 10px' }}>{l.qtyToIssue}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{l.batchNumber || 'N/A'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print M22
            </button>
            <button onClick={() => { setSubmitted(null); setLines([emptyLine()]); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#5b21b6' }}>
          <ArrowRight color="#8b5cf6" size={28} /> STOCK ISSUE
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M22 — Issue Note</p>
      </div>

      <fieldset disabled={!hasManagerPermission} style={{ border: 'none', padding: 0, margin: 0, opacity: hasManagerPermission ? 1 : 0.6 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Issue Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Destination *</label>
                <select value={destination} onChange={e => setDestination(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                  <option>Other Departments</option>
                  <option>Customers (Walk-in)</option>
                  <option>Customers (Online)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Recipient Name *</label>
                <input required value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Name" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reason for Issue *</label>
                <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                  <option>Transfer</option>
                  <option>Sale</option>
                  <option>Return</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Items to Issue</h3>
              <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                <Plus size={14} /> Add Item
              </button>
            </div>
            {lines.map((line, i) => (
              <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>MEDICINE NAME *</label>}
                  <input required value={line.itemName} onChange={e => updateLine(line.id, 'itemName', e.target.value)} placeholder="Name" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>QTY *</label>}
                  <input required type="number" value={line.qtyToIssue} onChange={e => updateLine(line.id, 'qtyToIssue', e.target.value)} placeholder="0" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>BATCH #</label>}
                  <input value={line.batchNumber} onChange={e => updateLine(line.id, 'batchNumber', e.target.value)} placeholder="Batch" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                  {lines.length > 1 && <button type="button" onClick={() => removeLine(line.id)} style={{ padding: '9px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={!hasManagerPermission} style={{ padding: '12px 32px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
              Generate Issue Note (M22)
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
};

export default PharmacyWorkerStockIssue;
