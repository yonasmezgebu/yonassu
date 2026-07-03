import React, { useState } from 'react';
import { CreditCard, CheckCircle, Printer } from 'lucide-react';
import { financeState, receiveCustomerPayment } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useLocation } from 'react-router-dom';

const FinanceCustomerPayments = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialInvoice = queryParams.get('invoiceRef') || '';
  const initialCustomer = queryParams.get('customer') || '';

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState(initialCustomer);
  const [invoiceRef, setInvoiceRef] = useState(initialInvoice);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank');
  
  // Conditional fields
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName] = useState('');
  
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  const pendingInvoices = financeState.customerInvoices.filter(i => 
    (i.status === 'Unpaid' || i.status === 'Overdue') && (!customerName || i.customerName === customerName)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = {
        date,
        customerName,
        invoiceRef,
        amountPaid: parseFloat(amountPaid),
        paymentMethod,
        bankDetails: paymentMethod === 'Bank' ? { bankName, accountHolder, accountNumber } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName } : null,
      };
      
      const crvRecord = receiveCustomerPayment(data);
      setSubmitted({ ...crvRecord, invoiceRef });
      
      submitNotification(`💳 Payment Received from ${customerName}`, '💳 Customer Payment - Click to View');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInvoiceSelect = (invId) => {
    setInvoiceRef(invId);
    const inv = pendingInvoices.find(i => i.id === invId);
    if (inv) {
      setAmountPaid(inv.totalAmount - inv.amountPaid);
      if (!customerName) setCustomerName(inv.customerName);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 540, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #22c55e', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#22c55e" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#166534', margin: '0 0 8px' }}>Payment Recorded Successfully</h2>
          <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: 8, margin: '20px 0', border: '1px solid #bbf7d0', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', color: '#15803d', marginBottom: 12 }}>Receipt: {submitted.crvNumber}</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Date: <strong>{submitted.date}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Customer: <strong>{submitted.receivedFrom}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Applied to Invoice: <strong>{submitted.invoiceRef}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Amount Paid: <strong>${parseFloat(submitted.amount).toFixed(2)}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Method: <strong>{submitted.paymentMethod}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Receipt
            </button>
            <button onClick={() => { setSubmitted(null); setAmountPaid(''); setInvoiceRef(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Record Another
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
          <CreditCard color="#22c55e" size={28} /> CUSTOMER PAYMENTS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Record incoming payments against customer invoices.</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#0f172a' }}>Payment Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date *</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Customer *</label>
              <select required value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                <option value="">Select Customer...</option>
                {financeState.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Invoice Reference *</label>
              <select required value={invoiceRef} onChange={e => handleInvoiceSelect(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                <option value="">Select Invoice...</option>
                {pendingInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.id} - ${inv.totalAmount - inv.amountPaid} due</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount Paid *</label>
              <input required type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
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

          {paymentMethod === 'Bank' && (
            <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
              </div>
            </div>
          )}
          
          {paymentMethod === 'Telebirr' && (
            <div style={{ background: '#fefce8', padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Telebirr Number *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
                <input value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
              </div>
            </div>
          )}
        </div>

        <button type="submit" style={{ padding: '12px 32px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
          Record Payment & Generate Receipt
        </button>
      </form>
    </div>
  );
};

export default FinanceCustomerPayments;
