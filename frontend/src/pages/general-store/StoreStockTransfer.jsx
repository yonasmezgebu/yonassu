import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Trash2, Printer, CheckCircle, Search } from 'lucide-react';
import { createTransfer, getInventory } from '../../utils/storeApi';

const emptyLine = () => ({ id: Date.now(), drug_id: '', drug_name: '', qtyToTransfer: '', batchNumber: '' });

const StoreStockTransfer = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferType, setTransferType] = useState('Store → Pharmacy');
  const [transferDate, setTransferDate] = useState('');
  const [reason, setReason] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInventory();
      setInventory(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const addLine = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  const updateLine = (id, field, value) => setLines(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleItemSelect = (id, drug_id) => {
    const item = inventory.find(i => i.drug_id.toString() === drug_id);
    if (!item) return;
    updateLine(id, 'drug_id', drug_id);
    updateLine(id, 'drug_name', item.drug_name);
    updateLine(id, 'batchNumber', item.batch_no || '');
  };

  const validate = () => {
    const e = {};
    if (!transferDate) e.transferDate = 'Transfer date is required';
    if (!reason.trim()) e.reason = 'Transfer reason is required';
    if (!authorizedBy.trim()) e.authorizedBy = 'Authorized by is required';
    lines.forEach((line, i) => {
      if (!line.drug_id) e[`item_${i}`] = 'Item selection required';
      if (!line.qtyToTransfer || isNaN(line.qtyToTransfer) || +line.qtyToTransfer <= 0) e[`qty_${i}`] = 'Valid quantity required';
    });
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const transfer_no = 'TRF-' + Date.now().toString().slice(-6);
      const payload = {
        transfer_no,
        from_location: transferType,
        to_location: transferType,
        transfer_type: transferType,
        authorized_by: authorizedBy,
        transfer_date: transferDate,
        remarks: reason,
        items: lines.map(line => ({
          drug_id: Number(line.drug_id),
          quantity: Number(line.qtyToTransfer),
          batch_no: line.batchNumber,
        }))
      };
      const res = await createTransfer(payload);
      if (!res.success) throw new Error(res.message);
      setSubmitted({ ...res.data, transferNumber: transfer_no, lines });
    } catch (err) {
      setError(err.message || 'Transfer failed');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#64748b' }}>Loading inventory...</div>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', border: '1px solid #e2e8f0', maxWidth: 400 }}>
          <div style={{ color: '#ef4444', fontSize: 40, marginBottom: 12 }}>!</div>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Error</h3>
          <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: 14 }}>{error}</p>
          <button onClick={fetchInventory} style={{ padding: '10px 24px', background: '#5b21b6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #8b5cf6', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#8b5cf6" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#5b21b6', margin: '12px 0 4px' }}>Stock Transfer Completed</h2>
            <p style={{ color: '#64748b' }}>Transfer Note generated. Both source and destination inventories have been updated.</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
              <div><strong>Transfer #:</strong> <span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{submitted.transferNumber}</span></div>
              <div><strong>Type:</strong> {transferType}</div>
              <div><strong>Transfer Date:</strong> {transferDate}</div>
              <div><strong>Authorized By:</strong> {authorizedBy}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Reason:</strong> {reason}</div>
            </div>
            <h4 style={{ margin: '16px 0 8px', color: '#475569' }}>Items Transferred:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#ede9fe' }}>
                {['Item Name', 'Qty Transferred', 'Batch #'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>{submitted.lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.drug_name || l.itemName}</td>
                  <td style={{ padding: '8px 10px' }}>{l.qtyToTransfer}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{l.batchNumber || 'N/A'}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 24, padding: 16, background: '#ede9fe', border: '2px solid #8b5cf6', borderRadius: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#5b21b6' }}>
              🔄 TRANSFER CONFIRMED — STAMP: {submitted.transferNumber} | Auth: {authorizedBy}
            </div>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Note
            </button>
            <button onClick={() => { setSubmitted(null); setLines([emptyLine()]); setErrors({}); setError(null); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Transfer
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
          <ArrowLeftRight color="#8b5cf6" size={28} /> STOCK TRANSFER
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Transfer Note — Manager Access Only</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#b91c1c', fontSize: 14 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 16 }}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Transfer Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Transfer Type *</label>
              <select value={transferType} onChange={e => setTransferType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                <option>Store → Pharmacy</option>
                <option>Store → Other Department</option>
                <option>Store → Store (Different Branch)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Transfer Date *</label>
              <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.transferDate ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.transferDate && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.transferDate}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Authorized By *</label>
              <input value={authorizedBy} onChange={e => setAuthorizedBy(e.target.value)} placeholder="Store Manager name" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.authorizedBy ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.authorizedBy && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.authorizedBy}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Transfer Reason *</label>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for transfer" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.reason ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.reason && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.reason}</span>}
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Items to Transfer</h3>
            <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              <Plus size={14} /> Add Item
            </button>
          </div>
          {lines.map((line, i) => (
            <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>ITEM NAME *</label>}
                <div style={{ position: 'relative' }}>
                  <select value={line.drug_id} onChange={e => handleItemSelect(line.id, e.target.value)} style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`item_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: 'white', appearance: 'auto' }}>
                    <option value="">-- Select Item --</option>
                    {inventory.map(item => (
                      <option key={item.drug_id} value={item.drug_id}>
                        {item.drug_name} {item.strength || ''} (Stock: {item.quantity})
                      </option>
                    ))}
                  </select>
                  <Search size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>QTY *</label>}
                <input type="number" value={line.qtyToTransfer} onChange={e => updateLine(line.id, 'qtyToTransfer', e.target.value)} placeholder="0" style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`qty_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>BATCH # (opt)</label>}
                <input value={line.batchNumber} onChange={e => updateLine(line.id, 'batchNumber', e.target.value)} placeholder="BT-XXXX" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                {lines.length > 1 && <button type="button" onClick={() => removeLine(line.id)} style={{ padding: '9px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => { setLines([emptyLine()]); setErrors({}); }} style={{ padding: '10px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Reset</button>
          <button type="submit" style={{ padding: '10px 28px', background: '#5b21b6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Submit & Generate Transfer Note</button>
        </div>
      </form>
    </div>
  );
};

export default StoreStockTransfer;
