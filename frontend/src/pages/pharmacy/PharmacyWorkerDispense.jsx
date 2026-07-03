import React, { useState, useContext, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { createIssueNote } from '../../utils/storeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const emptyLine = () => ({ id: Date.now(), itemName: '', strength: '', form: 'Tablet', qty: '', batchNumber: '', expiryDate: '' });

const PharmacyWorkerDispense = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const location = useLocation();
  const [customerType, setCustomerType] = useState('Walk-in Customer');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAge, setCustomerAge] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [lines, setLines] = useState([emptyLine()]);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    // Check if routed here from "Pending Prescriptions"
    if (location.state?.prefill) {
      const p = location.state.prefill;
      setCustomerName(p.patientName);
      setCustomerType('Walk-in Customer');
      setLines([{ id: Date.now(), itemName: p.medicine, strength: 'Standard', form: 'Tablet', qty: p.qty, batchNumber: '', expiryDate: '' }]);
    }
  }, [location]);

  const addLine = () => setLines(l => [...l, emptyLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  const updateLine = (id, field, value) => setLines(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasManagerPermission) return;

    // Map lines to format expected by createIssueNote
    const mappedLines = lines.map(l => ({
      itemName: `${l.itemName} ${l.strength} ${l.form}`,
      qtyToIssue: l.qty,
      batchNumber: l.batchNumber
    }));

    try {
      // isPharmacyDispense = true (last parameter) allows bypassing strict M20 requisition rule
      const m22Record = createIssueNote(customerType, '', '', mappedLines, true);
      
      setSubmitted({
        ...m22Record,
        customerName, customerPhone, customerAge, paymentMethod, date: m22Record.timestamp, m22Number: m22Record.id
      });
      submitNotification('💊 Medicines Dispensed', 'Dispense Completed - Click to View');
    } catch (err) {
      alert(err.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #22c55e', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#22c55e" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#166534', margin: '12px 0 4px' }}>Medicines Dispensed Successfully</h2>
            <p style={{ color: '#64748b' }}>M22 Issue Note and Receipt generated. Inventory decremented.</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
              <div><strong>M22 Number:</strong> <span style={{ fontFamily: 'monospace', color: '#166534' }}>{submitted.m22Number}</span></div>
              <div><strong>Customer Name:</strong> {submitted.customerName || 'Anonymous'}</div>
              <div><strong>Type:</strong> {submitted.destination}</div>
              <div><strong>Payment Method:</strong> {submitted.paymentMethod}</div>
              <div><strong>Date:</strong> {new Date(submitted.date).toLocaleDateString()}</div>
            </div>
            <h4 style={{ margin: '16px 0 8px', color: '#475569' }}>Items Dispensed:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#dcfce7' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Batch #</th>
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
              <Printer size={15} /> Print Receipt & M22
            </button>
            <button onClick={() => { setSubmitted(null); setLines([emptyLine()]); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Dispense
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#166534' }}>
          <ShoppingCart color="#22c55e" size={28} /> DISPENSE MEDICINES
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M22 + Receipt</p>
      </div>

      <fieldset disabled={!hasManagerPermission} style={{ border: 'none', padding: 0, margin: 0, opacity: hasManagerPermission ? 1 : 0.6 }}>
        <form onSubmit={handleSubmit}>
          {/* Customer Details */}
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Customer Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Customer Type *</label>
                <select value={customerType} onChange={e => setCustomerType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
                  <option>Walk-in Customer</option>
                  <option>Online Order</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Full Name</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name (optional)" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Phone</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Age</label>
                <input type="number" value={customerAge} onChange={e => setCustomerAge(e.target.value)} placeholder="Age" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              {customerType === 'Online Order' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Address (Required for Online)</label>
                  <input required value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Address" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              )}
            </div>
          </div>

          {/* Medicines */}
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Medicines</h3>
              <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                <Plus size={14} /> Add Medicine
              </button>
            </div>
            {lines.map((line, i) => (
              <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>MEDICINE NAME *</label>}
                  <input required value={line.itemName} onChange={e => updateLine(line.id, 'itemName', e.target.value)} placeholder="Name" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>STRENGTH *</label>}
                  <input required value={line.strength} onChange={e => updateLine(line.id, 'strength', e.target.value)} placeholder="e.g. 500mg" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>FORM *</label>}
                  <select value={line.form} onChange={e => updateLine(line.id, 'form', e.target.value)} style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}>
                    <option>Tablet</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                  </select>
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>QTY *</label>}
                  <input required type="number" value={line.qty} onChange={e => updateLine(line.id, 'qty', e.target.value)} placeholder="0" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>BATCH #</label>}
                  <input value={line.batchNumber} onChange={e => updateLine(line.id, 'batchNumber', e.target.value)} placeholder="Opt" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  {i === 0 && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>EXPIRY</label>}
                  <input type="date" value={line.expiryDate} onChange={e => updateLine(line.id, 'expiryDate', e.target.value)} style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                  {lines.length > 1 && <button type="button" onClick={() => removeLine(line.id)} style={{ padding: '9px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Payment Method</h3>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: 250, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Telebirr</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="submit" disabled={!hasManagerPermission} style={{ padding: '12px 32px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
              Process & Dispense
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
};

export default PharmacyWorkerDispense;
