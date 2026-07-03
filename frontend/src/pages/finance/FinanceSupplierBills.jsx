import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, Paperclip } from 'lucide-react';
import { financeState, createSupplierBill } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceSupplierBills = () => {
  const [bills, setBills] = useState(financeState.supplierBills);
  const [showForm, setShowForm] = useState(false);
  
  const [supplierName, setSupplierName] = useState('');
  const [billNo, setBillNo] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [poRef, setPoRef] = useState('');
  
  // Simplified items array
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0.15);

  const handleAddItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierName) return alert("Please select a supplier.");
    
    const newBill = createSupplierBill({
      supplierName, billNo, dateReceived, dueDate, poRef, totalAmount, taxAmount, subtotal, items
    });
    
    setBills([...financeState.supplierBills]);
    setShowForm(false);
    
    setSupplierName(''); setBillNo(''); setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    
    submitNotification(`📄 Supplier Bill Received`, '📄 New Bill - Click to View');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#ea580c' }}>
            <FileText color="#f97316" size={28} /> SUPPLIER BILLS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Record incoming bills and invoices from suppliers.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} /> Record Bill
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>New Supplier Bill</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier *</label>
                <select required value={supplierName} onChange={e => setSupplierName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option value="">Select Supplier...</option>
                  {financeState.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier Bill # *</label><input required value={billNo} onChange={e => setBillNo(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date Received *</label><input required type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Due Date *</label><input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>PO Reference</label><input value={poRef} onChange={e => setPoRef(e.target.value)} placeholder="e.g. PO-1234" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Attachments</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px dashed #cbd5e1', borderRadius: 6, color: '#64748b', cursor: 'pointer' }}><Paperclip size={16}/> Upload Invoice File</div>
              </div>
            </div>
            
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Items/Services</h4>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
                  <input required placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                  <input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                  <input required type="number" step="0.01" placeholder="Unit Price" value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                  <div style={{ padding: '8px', background: '#e2e8f0', borderRadius: 6, textAlign: 'right', fontWeight: 600 }}>
                     ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddItem} style={{ fontSize: 12, color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Another Item</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
               <div style={{ width: 300, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#475569' }}><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#475569' }}><span>Tax (15%):</span> <span>${taxAmount.toFixed(2)}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: 8 }}><span>Total:</span> <span>${totalAmount.toFixed(2)}</span></div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 24px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Record Bill</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Bill #', 'Date Recvd', 'Supplier', 'Due Date', 'Total', 'Amount Paid', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Actions' || col.includes('Amount') || col === 'Total' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ea580c', fontFamily: 'monospace' }}>{bill.id}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{bill.dateReceived}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{bill.supplierName}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{bill.dueDate}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>${bill.totalAmount.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#16a34a' }}>${bill.amountPaid.toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: bill.status === 'Paid' ? '#dcfce7' : bill.status === 'Overdue' ? '#fee2e2' : '#fef3c7',
                    color: bill.status === 'Paid' ? '#16a34a' : bill.status === 'Overdue' ? '#dc2626' : '#d97706'
                  }}>
                    {bill.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="View Attachment"><Paperclip size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceSupplierBills;
