import React, { useState } from 'react';
import { Wallet, Clock, Printer } from 'lucide-react';
import { financeState, createPCV } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinancePCV = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [accountCode, setAccountCode] = useState('5004'); // Default Office Expenses
  const [description, setDescription] = useState('');
  const [reasonForUrgency, setReasonForUrgency] = useState('');
  
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    // Client-side quick check (server side is also enforced in createPCV)
    if (parseFloat(amount) > 3000) {
      setError('Amount exceeds the maximum petty cash limit of 3,000 ETB.');
      return;
    }
    
    try {
      const data = {
        date, paidTo, amount: parseFloat(amount), accountCode, description, reasonForUrgency
      };
      
      const pcvRecord = createPCV(data);
      setSubmitted({ ...pcvRecord, amountWords });
      
      submitNotification('💵 PCV Created', '💵 Petty Cash Voucher - Click to Approve');
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
        <div style={{ maxWidth: 540, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #8b5cf6', padding: 32, textAlign: 'center' }}>
          <Clock size={56} color="#8b5cf6" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#4c1d95', margin: '0 0 8px' }}>PCV Submitted for Approval</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Manager approval is required before this voucher is finalized.</p>
          
          <div style={{ background: '#f5f3ff', padding: '16px', borderRadius: 8, margin: '20px 0', border: '1px solid #ddd6fe', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', color: '#6d28d9', marginBottom: 12 }}>{submitted.pcvNumber}</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Status: <strong style={{ color: '#d97706' }}>{submitted.status}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Paid To: <strong>{submitted.paidTo}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Amount: <strong>${parseFloat(submitted.amount).toFixed(2)}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Urgency: <strong>{submitted.reasonForUrgency}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Draft PCV
            </button>
            <button onClick={() => { setSubmitted(null); setAmount(''); setPaidTo(''); setDescription(''); setReasonForUrgency(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
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
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9' }}>
          <Wallet color="#8b5cf6" size={28} /> PETTY CASH VOUCHER (PCV)
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Record small, urgent expenses. Maximum limit: 3,000 ETB.</p>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date *</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Paid To *</label>
              <input required value={paidTo} onChange={e => setPaidTo(e.target.value)} placeholder="Recipient name" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount (Max 3,000) *</label>
              <input required type="number" step="0.01" max="3000" value={amount} onChange={handleAmountChange} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount in Words</label>
              <input value={amountWords} onChange={e => setAmountWords(e.target.value)} placeholder="Auto-derived from amount" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
             <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Account Code (Expense) *</label>
              <select value={accountCode} onChange={e => setAccountCode(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                {financeState.defaultCOA.filter(a => a.type === 'Expense').map(a => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
             <div>
               <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Description *</label>
               <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Office Stationery" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
             </div>
             <div>
               <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reason for Urgency *</label>
               <input required value={reasonForUrgency} onChange={e => setReasonForUrgency(e.target.value)} placeholder="Why is this urgent?" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
             </div>
          </div>
        </div>

        <button type="submit" style={{ padding: '12px 32px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
          Submit PCV for Approval
        </button>
      </form>
    </div>
  );
};

export default FinancePCV;
