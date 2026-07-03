import React, { useState } from 'react';
import { CreditCard, CheckCircle, Printer } from 'lucide-react';
import { financeState, createCRV } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceCRV = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount] = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [accountCode, setAccountCode] = useState('4001'); // Default Sales Revenue
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  
  // Conditional fields
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName] = useState('');
  
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = {
        date,
        receivedFrom,
        amount: parseFloat(amount),
        paymentMethod,
        accountCode,
        description,
        referenceNo,
        bankDetails: paymentMethod === 'Bank' ? { bankName, accountHolder, accountNumber, chequeNo } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName } : null,
      };
      
      const crvRecord = createCRV(data);
      setSubmitted({ ...crvRecord, amountWords });
      submitNotification('💰 CRV Created', '💰 New Receipt Voucher - Click to View');
      
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    // Simple mock for amount to words
    if (e.target.value) {
      setAmountWords(`${parseFloat(e.target.value).toLocaleString('en-US')} ETB Only`);
    } else {
      setAmountWords('');
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 540, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #10b981', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#064e3b', margin: '0 0 8px' }}>CRV Created Successfully</h2>
          <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: 8, margin: '20px 0', border: '1px solid #6ee7b7', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', color: '#047857', marginBottom: 12 }}>{submitted.crvNumber}</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Date: <strong>{submitted.date}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Received From: <strong>{submitted.receivedFrom}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Amount: <strong>${parseFloat(submitted.amount).toFixed(2)}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Amount in Words: <strong>{submitted.amountWords}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Method: <strong>{submitted.paymentMethod}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print CRV
            </button>
            <button onClick={() => { setSubmitted(null); setAmount(''); setReferenceNo(''); setReceivedFrom(''); setDescription(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
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
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a' }}>
          <CreditCard color="#22c55e" size={28} /> CASH RECEIPT VOUCHER (CRV)
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Record all money entering the office.</p>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date Received *</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Received From *</label>
              <input required value={receivedFrom} onChange={e => setReceivedFrom(e.target.value)} placeholder="Customer/Company/Person" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount Received *</label>
              <input required type="number" step="0.01" value={amount} onChange={handleAmountChange} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount in Words</label>
              <input value={amountWords} onChange={e => setAmountWords(e.target.value)} placeholder="Auto-derived from amount" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
             <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Account Code *</label>
              <select value={accountCode} onChange={e => setAccountCode(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                {financeState.defaultCOA.filter(a => a.type === 'Income' || a.type === 'Asset').map(a => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reference #</label>
              <input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Sale/Prescription/Booking" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Description *</label>
             <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Reason for receipt" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a' }}>Payment Method *</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {['Cash', 'Bank', 'Telebirr'].map(type => (
              <button type="button" key={type} onClick={() => setPaymentMethod(type)} style={{
                padding: '10px 20px', border: '2px solid', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                background: paymentMethod === type ? '#22c55e' : 'white',
                borderColor: paymentMethod === type ? '#22c55e' : '#cbd5e1',
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Telebirr Number *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
                <input value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
              </div>
            </div>
          )}
        </div>

        <button type="submit" style={{ padding: '12px 32px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
          Generate CRV
        </button>
      </form>
    </div>
  );
};

export default FinanceCRV;
