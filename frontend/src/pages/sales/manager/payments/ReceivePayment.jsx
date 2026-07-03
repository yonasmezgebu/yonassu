import React, { useState, useEffect } from 'react';
import { salesState } from '../../../../utils/salesManagerState';
import CurrencyDisplay from '../../components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';

const ReceivePayment = () => {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  
  // Method specifics
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [telbirNumber, setTelbirNumber] = useState('');

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setCustomers(salesState.getCustomers());
    setInvoices(salesState.getInvoices().filter(i => i.status !== 'paid'));
    salesState.notify('PAGE_LOAD');
  }, []);

  const availableInvoices = invoices.filter(i => !selectedCustomerId || i.customer_id === selectedCustomerId);
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);
  const remainingBalance = selectedInvoice ? (selectedInvoice.total_cents - selectedInvoice.amount_paid_cents) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) { setError("Please select a customer."); return; }
    
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!amountCents || amountCents <= 0) { setError("Please enter a valid amount."); return; }
    
    const methodDetails = {
        bank_name: bankName,
        bank_account_number: bankAccount,
        telbir_number: telbirNumber
    };

    try {
      salesState.receivePayment(selectedInvoiceId || null, amountCents, method, methodDetails, selectedCustomerId);
      navigate('/sales/manager/payments/history');
    } catch (err) {
      setError(err.message);
      salesState.notify('ERROR');
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Receive Payment</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Record a new payment from a customer.</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
        
        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '24px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={labelStyle}>Customer *</label>
            <select style={inputStyle} value={selectedCustomerId} onChange={(e) => { setSelectedCustomerId(e.target.value); setSelectedInvoiceId(''); }} required>
              <option value="">Select Customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Apply to Invoice (Optional)</label>
            <select style={inputStyle} value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
              <option value="">Do not apply to specific invoice (Advance Payment)</option>
              {availableInvoices.map(i => (
                <option key={i.id} value={i.id}>
                  {i.invoice_number} - Balance: {formatCents(i.total_cents - i.amount_paid_cents)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Amount Received (ETB) *</label>
            <input 
              type="number" min="0" step="0.01" style={inputStyle} 
              value={amount} onChange={(e) => setAmount(e.target.value)} 
              placeholder={remainingBalance > 0 ? (remainingBalance/100).toString() : '0.00'}
              required 
            />
            {remainingBalance > 0 && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Remaining balance on selected invoice: <CurrencyDisplay amountCents={remainingBalance} />
                </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Payment Method *</label>
            <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)} required>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer / Deposit</option>
              <option value="telbir">TeleBirr</option>
            </select>
          </div>

          {method === 'bank' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
               <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input type="text" style={inputStyle} value={bankName} onChange={(e) => setBankName(e.target.value)} required />
               </div>
               <div>
                  <label style={labelStyle}>Account / Ref Number</label>
                  <input type="text" style={inputStyle} value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
               </div>
            </div>
          )}

          {method === 'telbir' && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
               <label style={labelStyle}>TeleBirr Phone Number</label>
               <input type="text" style={inputStyle} value={telbirNumber} onChange={(e) => setTelbirNumber(e.target.value)} required />
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}>
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };

const formatCents = (cents) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(cents / 100);

export default ReceivePayment;
