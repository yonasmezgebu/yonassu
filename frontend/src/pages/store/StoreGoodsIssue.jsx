import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus, Trash2, Printer, CheckCircle, Search } from 'lucide-react';
import { createIssue, getInventory } from '../../utils/storeApi';

const DESTINATION_LIST = [
  'Pharmacy',
  'Sales',
  'Printing',
  'Finance',
  'HR',
  'Administration',
  'Maintenance',
  'Laboratory',
  'Radiology',
  'Other Department',
];

const emptyLine = () => ({ id: Date.now(), drug_id: '', drug_name: '', qtyToIssue: '', batchNumber: '' });

const StoreGoodsIssue = () => {
  const [destination, setDestination] = useState('Pharmacy');
  const [requisitionRef, setRequisitionRef] = useState('');
  const [approvalRef, setApprovalRef] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await getInventory();
        setInventory(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const addLine = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  const updateLine = (id, field, value) => setLines(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleDrugSelect = (id, drugId) => {
    const item = inventory.find(i => i.drug_id === Number(drugId));
    if (item) {
      updateLine(id, 'drug_id', drugId);
      updateLine(id, 'drug_name', item.drug_name);
      updateLine(id, 'batchNumber', item.batch_no || '');
    }
  };

  const validate = () => {
    const e = {};
    if (!requisitionRef.trim()) e.requisitionRef = 'Requisition # (M20) is required';
    if (!approvalRef.trim()) e.approvalRef = 'Approval # (M21) is required';
    lines.forEach((line, i) => {
      if (!line.drug_id) e[`item_${i}`] = 'Item required';
      if (!line.qtyToIssue || isNaN(line.qtyToIssue) || +line.qtyToIssue <= 0) e[`qty_${i}`] = 'Valid quantity required';
    });
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const issue_no = 'M22-' + Date.now().toString().slice(-6);
      const payload = {
        issue_no,
        department: destination,
        issued_to: destination,
        requisition_ref: requisitionRef,
        approval_ref: approvalRef,
        items: lines.map(line => ({
          drug_id: Number(line.drug_id),
          quantity: Number(line.qtyToIssue),
          batch_no: line.batchNumber,
        }))
      };
      const res = await createIssue(payload);
      if (!res.success) throw new Error(res.message);
      const responseData = res.data || res;
      setSubmitted({
        m22Number: responseData.issue_no || responseData.id,
        date: responseData.created_at || new Date().toISOString(),
        destination: responseData.department || responseData.issued_to || destination,
        requisitionRef: responseData.requisition_ref || requisitionRef,
        approvalRef: responseData.approval_ref || approvalRef,
        lines: (responseData.items || lines).map((item, idx) => ({
          itemName: item.drug_name || (lines[idx] ? lines[idx].drug_name : ''),
          qtyToIssue: item.quantity || item.qtyToIssue,
          batchNumber: item.batch_no || item.batchNumber || '',
        }))
      });
    } catch (err) {
      setErrors({ requisitionRef: err.message });
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #f59e0b', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#f59e0b" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#92400e', margin: '12px 0 4px' }}>Goods Issued Successfully</h2>
            <p style={{ color: '#64748b' }}>M22 Issue Note has been generated and inventory updated.</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
              <div><strong>M22 Number:</strong> <span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{submitted.m22Number}</span></div>
              <div><strong>Destination:</strong> {submitted.destination}</div>
              <div><strong>Requisition # (M20):</strong> {submitted.requisitionRef}</div>
              <div><strong>Approval # (M21):</strong> {submitted.approvalRef}</div>
              <div><strong>Date:</strong> {new Date(submitted.date).toLocaleDateString()}</div>
            </div>
            <h4 style={{ margin: '16px 0 8px', color: '#475569' }}>Items Issued:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#fef3c7' }}>
                {['Item Name', 'Qty Issued', 'Batch #'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>{submitted.lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.itemName}</td>
                  <td style={{ padding: '8px 10px' }}>{l.qtyToIssue}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{l.batchNumber || 'N/A'}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 24, padding: 16, background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#92400e' }}>
              📤 GOODS ISSUED — STORE MANAGER STAMP: M22-APPROVED-{submitted.m22Number}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print M22
            </button>
            <button onClick={() => { setSubmitted(null); setLines([emptyLine()]); setErrors({}); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Issue Note
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 16 }}>Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: 16 }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpRight color="#f59e0b" size={28} /> GOODS ISSUE
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M22 — Issue Note</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Destination & Reference</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Destination *</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                {DESTINATION_LIST.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Requisition # (M20) *</label>
              <input value={requisitionRef} onChange={e => setRequisitionRef(e.target.value)} placeholder="e.g. M20-2026-0045" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.requisitionRef ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.requisitionRef && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.requisitionRef}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Approval # (M21) *</label>
              <input value={approvalRef} onChange={e => setApprovalRef(e.target.value)} placeholder="e.g. M21-2026-0041" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.approvalRef ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              {errors.approvalRef && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.approvalRef}</span>}
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
            <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>ITEM NAME *</label>}
                <select value={line.drug_id} onChange={e => handleDrugSelect(line.id, e.target.value)} style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`item_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="">Select item...</option>
                  {inventory.map(item => (
                    <option key={item.drug_id} value={item.drug_id}>{item.drug_name} {item.strength} (Stock: {item.quantity})</option>
                  ))}
                </select>
              </div>
              <div>
                {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>QTY TO ISSUE *</label>}
                <input type="number" value={line.qtyToIssue} onChange={e => updateLine(line.id, 'qtyToIssue', e.target.value)} placeholder="0" style={{ width: '100%', padding: '9px 10px', border: `1px solid ${errors[`qty_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
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
          <button type="submit" style={{ padding: '10px 28px', background: '#92400e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Submit & Generate M22</button>
        </div>
      </form>
    </div>
  );
};

export default StoreGoodsIssue;
