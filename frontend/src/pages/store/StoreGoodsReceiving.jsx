import React, { useState } from 'react';
import { Truck, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { notifyLowStock } from '../../utils/storeNotifications';
import { createGoodsReceivingNote } from '../../utils/storeTransactionService';

const LOW_STOCK_THRESHOLD = 50;

const REORDER_LEVELS = { 'Amoxicillin 500mg': 200, 'Surgical Gloves (L)': 100, 'Paracetamol 500mg': 500 };

const emptyLine = () => ({ id: Date.now(), itemName: '', qtyReceived: '', unitPrice: '', batchNumber: '', expiryDate: '', location: '' });

const StoreGoodsReceiving = () => {
  const [source, setSource] = useState('Supplier');
  const [supplierName, setSupplierName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});

  const addLine = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  const updateLine = (id, field, value) => setLines(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));

  const validate = () => {
    const e = {};
    if (!supplierName.trim()) e.supplierName = 'Source name is required';
    if (!poNumber.trim()) e.poNumber = 'PO/Reference # is required';
    lines.forEach((line, i) => {
      if (!line.itemName.trim()) e[`item_${i}`] = 'Item name required';
      if (!line.qtyReceived || isNaN(line.qtyReceived) || +line.qtyReceived <= 0) e[`qty_${i}`] = 'Valid quantity required';
      if (!line.unitPrice || isNaN(line.unitPrice) || +line.unitPrice <= 0) e[`price_${i}`] = 'Valid unit price required';
      if (!line.batchNumber.trim()) e[`batch_${i}`] = 'Batch number required';
      if (!line.location.trim()) e[`loc_${i}`] = 'Location required';
    });
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const m19Record = createGoodsReceivingNote(source, poNumber, new Date().toISOString(), lines);
      setSubmitted({ ...m19Record, date: m19Record.timestamp, m19Number: m19Record.id, supplierName, deliveryNote });
    } catch (err) {
      setErrors({ supplierName: err.message });
      return;
    }

    // Check low stock thresholds (simulate auto-evaluation)
    lines.forEach(line => {
      const reorder = REORDER_LEVELS[line.itemName];
      if (reorder && +line.qtyReceived < LOW_STOCK_THRESHOLD) {
        notifyLowStock(line.itemName, line.qtyReceived);
      }
    });
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #22c55e', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#22c55e" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#166534', margin: '12px 0 4px' }}>Goods Received Successfully</h2>
            <p style={{ color: '#64748b' }}>M19 Goods Receiving Note has been generated and inventory updated.</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
              <div><strong>M19 Number:</strong> <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{submitted.m19Number}</span></div>
              <div><strong>Source:</strong> {submitted.source}</div>
              <div><strong>Supplier/Source Name:</strong> {submitted.supplierName}</div>
              <div><strong>PO Number:</strong> {submitted.poNumber}</div>
              <div><strong>Delivery Note:</strong> {submitted.deliveryNote || 'N/A'}</div>
              <div><strong>Date:</strong> {new Date(submitted.date).toLocaleDateString()}</div>
            </div>
            <h4 style={{ margin: '16px 0 8px', color: '#475569' }}>Items Received:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f1f5f9' }}>
                {['Item Name', 'Qty', 'Unit Price', 'Batch #', 'Expiry', 'Location'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>{submitted.lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.itemName}</td>
                  <td style={{ padding: '8px 10px' }}>{l.qtyReceived}</td>
                  <td style={{ padding: '8px 10px' }}>${l.unitPrice}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{l.batchNumber}</td>
                  <td style={{ padding: '8px 10px' }}>{l.expiryDate || 'N/A'}</td>
                  <td style={{ padding: '8px 10px' }}>{l.location}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 24, padding: 16, background: '#dcfce7', border: '2px solid #22c55e', borderRadius: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#166534' }}>
              ✅ GOODS RECEIVED — STORE MANAGER STAMP: M19-APPROVED-{submitted.m19Number}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print M19
            </button>
            <button onClick={() => { setSubmitted(null); setLines([emptyLine()]); setErrors({}); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Receiving Note
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck color="#22c55e" size={28} /> GOODS RECEIVING
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M19 — Goods Receiving Note</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Source & Reference */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 15 }}>Source & Reference Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Source Type *</label>
              <select value={source} onChange={e => setSource(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                <option>Supplier (Purchase Order)</option>
                <option>Pharmacy (Returns/Transfers)</option>
                <option>Other Department</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Source / Supplier Name *</label>
              <input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="e.g. ABC Pharma Distributors" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.supplierName ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.supplierName && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.supplierName}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>PO / Reference # *</label>
              <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="e.g. PO-2026-0089" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.poNumber ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.poNumber && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.poNumber}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Delivery Note #</label>
              <input value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="e.g. DN-2026-0012" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: 15 }}>Items Received</h3>
            <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              <Plus size={14} /> Add Item Line
            </button>
          </div>
          {lines.map((line, i) => (
            <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>ITEM NAME *</label>}
                <input value={line.itemName} onChange={e => updateLine(line.id, 'itemName', e.target.value)} placeholder="Item name" style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`item_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>QTY *</label>}
                <input type="number" value={line.qtyReceived} onChange={e => updateLine(line.id, 'qtyReceived', e.target.value)} placeholder="Qty" style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`qty_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>UNIT PRICE *</label>}
                <input type="number" value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', e.target.value)} placeholder="$0.00" style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`price_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>BATCH # *</label>}
                <input value={line.batchNumber} onChange={e => updateLine(line.id, 'batchNumber', e.target.value)} placeholder="BT-XXXX" style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`batch_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>EXPIRY DATE</label>}
                <input type="date" value={line.expiryDate} onChange={e => updateLine(line.id, 'expiryDate', e.target.value)} style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>LOCATION *</label>}
                <input value={line.location} onChange={e => updateLine(line.id, 'location', e.target.value)} placeholder="e.g. Rack A-3" style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`loc_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                {lines.length > 1 && (
                  <button type="button" onClick={() => removeLine(line.id)} style={{ padding: '9px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}>
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => { setLines([emptyLine()]); setErrors({}); }} style={{ padding: '10px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            Reset Form
          </button>
          <button type="submit" style={{ padding: '10px 28px', background: '#166534', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            Submit & Generate M19
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreGoodsReceiving;
