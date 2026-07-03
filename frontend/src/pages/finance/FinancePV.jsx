import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, Printer, Upload } from 'lucide-react';
import { financeState, createPV } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinancePV = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank');
  const [accountCode, setAccountCode] = useState('5001'); // Default COGS/Expense
  const [description, setDescription] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  
  // Conditional fields
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState('');
  
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = {
        date,
        paidTo,
        amount: parseFloat(amount),
        paymentMethod,
        accountCode,
        description,
        invoiceRef,
        bankDetails: paymentMethod === 'Bank' ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName, phone: telebirrPhone } : null,
      };
      
      const pvRecord = createPV(data);
      setSubmitted({ ...pvRecord, amountWords });
      
      // Notifications
      submitNotification('💳 PV Created', '💳 New Payment Voucher - Click to View');
      // Mock supplier external notification (no sound per spec)
      setTimeout(() => {
        alert(`External message sent to ${paidTo}: "Payment Sent"`);
      }, 500);
      
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    if (e.target.value) {
      setAmountWords(`${parseFloat(e.target.value).toLocaleString('en-US')} ETB Only`);
    } else {
      setAmountWords('');
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 540, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #f59e0b', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#92400e', margin: '0 0 8px' }}>PV Created Successfully</h2>
          <div style={{ background: '#fef3c7', padding: '16px', borderRadius: 8, margin: '20px 0', border: '1px solid #fcd34d', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', color: '#b45309', marginBottom: 12 }}>{submitted.pvNumber}</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Date: <strong>{submitted.date}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Paid To: <strong>{submitted.paidTo}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Amount: <strong>${parseFloat(submitted.amount).toFixed(2)}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Method: <strong>{submitted.paymentMethod}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print PV
            </button>
            <button onClick={() => { setSubmitted(null); setAmount(''); setInvoiceRef(''); setPaidTo(''); setDescription(''); setDocumentFile(null); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#d97706' }}>
          <ShoppingCart color="#f59e0b" size={28} /> PAYMENT VOUCHER (PV)
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Record all money leaving the office.</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a' }}>Transaction Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date Paid *</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Paid To *</label>
              <input required value={paidTo} onChange={e => setPaidTo(e.target.value)} placeholder="Supplier/Employee/Company" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount Paid *</label>
              <input required type="number" step="0.01" value={amount} onChange={handleAmountChange} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount in Words</label>
              <input value={amountWords} onChange={e => setAmountWords(e.target.value)} placeholder="Auto-derived from amount" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
             <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Account Code (Expense) *</label>
              <select value={accountCode} onChange={e => setAccountCode(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                {financeState.defaultCOA.filter(a => a.type === 'Expense' || a.type === 'Liability').map(a => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Invoice/Bill Reference #</label>
              <input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="Invoice # or Bill # (Optional)" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Description *</label>
             <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Reason for payment" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
          </div>
          
          <div style={{ marginTop: 16 }}>
             <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Supporting Documents</label>
             <div style={{ border: '1px dashed #cbd5e1', padding: '16px', borderRadius: 6, textAlign: 'center', background: '#f8fafc' }}>
                <input type="file" onChange={(e) => setDocumentFile(e.target.files[0])} style={{ display: 'none' }} id="file-upload" />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Upload size={16} /> {documentFile ? documentFile.name : 'Click to Upload Invoice/Bill'}
                </label>
             </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a' }}>Payment Method *</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {['Cash', 'Bank', 'Telebirr'].map(type => (
              <button type="button" key={type} onClick={() => setPaymentMethod(type)} style={{
                padding: '10px 20px', border: '2px solid', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                background: paymentMethod === type ? '#f59e0b' : 'white',
                borderColor: paymentMethod === type ? '#f59e0b' : '#cbd5e1',
                color: paymentMethod === type ? 'white' : '#475569'
              }}>
                {type}
              </button>
            ))}
          </div>

          {/* Conditional Fields */}
          {paymentMethod === 'Bank' && (
            <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0369a1' }}>Bank Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder Full Name *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque # (Optional)" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
              </div>
            </div>
          )}
          
          {paymentMethod === 'Telebirr' && (
            <div style={{ background: '#fefce8', padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#92400e' }}>Telebirr Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <input value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Telebirr Number *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
                <input value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
                <input value={telebirrPhone} onChange={e => setTelebirrPhone(e.target.value)} placeholder="Phone" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
              </div>
            </div>
          )}
        </div>

        <button type="submit" style={{ padding: '12px 32px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
          Generate PV
        </button>
      </form>
    </div>
  );
};

export default FinancePV;
