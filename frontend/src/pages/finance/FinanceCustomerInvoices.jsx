import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, Printer, Mail } from 'lucide-react';
import { financeState, createCustomerInvoice } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceCustomerInvoices = () => {
  const [invoices, setInvoices] = useState(financeState.customerInvoices);
  const [showForm, setShowForm] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  
  // Simplified items array for demo
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0.15); // 15% VAT

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

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
    if (!customerName) return alert("Please select a customer.");
    
    const newInvoice = createCustomerInvoice({
      customerName, date, dueDate, paymentTerms, totalAmount, taxAmount, subtotal, items
    });
    
    setInvoices([...financeState.customerInvoices]);
    setShowForm(false);
    
    setCustomerName(''); setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    
    submitNotification(`📄 Invoice Created for ${customerName}`, '📄 New Invoice - Click to View');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0284c7' }}>
            <FileText color="#0ea5e9" size={28} /> CUSTOMER INVOICES
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Generate and track customer invoices.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>New Invoice</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Customer *</label>
                <select required value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option value="">Select Customer...</option>
                  {financeState.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date *</label><input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Due Date *</label><input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Terms</label><select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}><option>Due on Receipt</option><option>Net 15</option><option>Net 30</option></select></div>
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
              <button type="button" onClick={handleAddItem} style={{ fontSize: 12, color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Another Item</button>
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
              <button type="submit" style={{ padding: '8px 24px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Generate Invoice</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Invoice #', 'Date', 'Customer', 'Due Date', 'Total', 'Amount Paid', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Actions' || col.includes('Amount') || col === 'Total' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0284c7', fontFamily: 'monospace' }}>{inv.id}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{inv.date}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{inv.customerName}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{inv.dueDate}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>${inv.totalAmount.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#16a34a' }}>${inv.amountPaid.toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Overdue' ? '#fee2e2' : '#fef3c7',
                    color: inv.status === 'Paid' ? '#16a34a' : inv.status === 'Overdue' ? '#dc2626' : '#d97706'
                  }}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Print"><Printer size={16} /></button>
                  <button style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Email"><Mail size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceCustomerInvoices;
