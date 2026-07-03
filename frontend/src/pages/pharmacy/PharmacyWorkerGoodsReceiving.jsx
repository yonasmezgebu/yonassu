import React, { useState, useContext } from 'react';
import { Truck, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { createGoodsReceivingNote } from '../../utils/storeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const emptyLine = () => ({ id: Date.now(), itemName: '', qtyReceived: '', batchNumber: '', expiryDate: '', location: '' });

const PharmacyWorkerGoodsReceiving = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const [source, setSource] = useState('Store (Transfer)');
  const [referenceRef, setReferenceRef] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([emptyLine()]);
  const [submitted, setSubmitted] = useState(null);

  const addLine = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  const updateLine = (id, field, value) => setLines(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasManagerPermission) return;

    try {
      const m19Record = createGoodsReceivingNote(source, referenceRef, dateReceived, lines);
      setSubmitted({ ...m19Record, m19Number: m19Record.id });
      submitNotification('📥 Goods Received', 'New Stock Added - Click to View');
    } catch (err) {
      alert(err.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #f59e0b', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#f59e0b" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#92400e', margin: '12px 0 4px' }}>Goods Received Successfully</h2>
            <p style={{ color: '#64748b' }}>M19 Goods Receiving Note has been generated.</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
              <div><strong>M19 Number:</strong> <span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{submitted.m19Number}</span></div>
              <div><strong>Source:</strong> {submitted.source}</div>
              <div><strong>Reference #:</strong> {submitted.referenceRef}</div>
              <div><strong>Date:</strong> {submitted.receiptDate}</div>
            </div>
            <h4 style={{ margin: '16px 0 8px', color: '#475569' }}>Items Received:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#fef3c7' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Batch</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Location</th>
              </tr></thead>
              <tbody>{submitted.lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.itemName}</td>
                  <td style={{ padding: '8px 10px' }}>{l.qtyReceived}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{l.batchNumber || 'N/A'}</td>
                  <td style={{ padding: '8px 10px' }}>{l.location}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print M19
            </button>
            <button onClick={() => { setSubmitted(null); setLines([emptyLine()]); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#b45309' }}>
          <Truck color="#f59e0b" size={28} /> GOODS RECEIVING
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M19 — Goods Receiving Note</p>
      </div>

      <fieldset disabled={!hasManagerPermission} style={{ border: 'none', padding: 0, margin: 0, opacity: hasManagerPermission ? 1 : 0.6 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Receipt Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Source *</label>
                <select value={source} onChange={e => setSource(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                  <option>Store (Transfer)</option>
                  <option>Supplier (Direct Delivery)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reference # (M19/Transfer) *</label>
                <input required value={referenceRef} onChange={e => setReferenceRef(e.target.value)} placeholder="e.g. TR-9002" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date Received *</label>
                <input required type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Items Received</h3>
              <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                <Plus size={14} /> Add Item
              </button>
            </div>
            {lines.map((line, i) => (
              <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>MEDICINE NAME *</label>}
                  <input required value={line.itemName} onChange={e => updateLine(line.id, 'itemName', e.target.value)} placeholder="Name" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>QTY *</label>}
                  <input required type="number" value={line.qtyReceived} onChange={e => updateLine(line.id, 'qtyReceived', e.target.value)} placeholder="0" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>BATCH #</label>}
                  <input value={line.batchNumber} onChange={e => updateLine(line.id, 'batchNumber', e.target.value)} placeholder="Batch" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>EXPIRY</label>}
                  <input type="date" value={line.expiryDate} onChange={e => updateLine(line.id, 'expiryDate', e.target.value)} style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>SHELF LOCATION</label>}
                  <input required value={line.location} onChange={e => updateLine(line.id, 'location', e.target.value)} placeholder="e.g. S-1" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                  {lines.length > 1 && <button type="button" onClick={() => removeLine(line.id)} style={{ padding: '9px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={!hasManagerPermission} style={{ padding: '12px 32px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
              Confirm Receipt (M19)
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
};

export default PharmacyWorkerGoodsReceiving;
