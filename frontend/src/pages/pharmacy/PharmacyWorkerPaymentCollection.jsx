import React, { useState, useContext } from 'react';
import { CreditCard, CheckCircle, Printer } from 'lucide-react';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { createCRV } from '../../utils/storeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacyWorkerPaymentCollection = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const [paymentType, setPaymentType] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');

  // Cash fields
  const [cashName, setCashName] = useState('');
  const [cashPhone, setCashPhone] = useState('');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankPhone, setBankPhone] = useState('');

  // Telebirr fields
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [telebirrName, setTelebirrName] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState('');

  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasManagerPermission) return;

    let customerDetails = {};
    if (paymentType === 'Cash') {
      if (!cashName || !cashPhone) return alert('Cash payments require Recipient Full Name and Phone.');
      customerDetails = { name: cashName, phone: cashPhone };
    } else if (paymentType === 'Bank Transfer') {
      if (!bankName || !accountHolder || !accountNumber || !bankPhone) return alert('Bank payments require all fields.');
      customerDetails = { bankName, accountHolder, accountNumber, phone: bankPhone };
    } else {
      if (!telebirrNumber || !telebirrName || !telebirrPhone) return alert('Telebirr payments require all fields.');
      customerDetails = { telebirrNumber, name: telebirrName, phone: telebirrPhone };
    }

    try {
      const crvRecord = createCRV(paymentType, parseFloat(amount), reference, customerDetails);
      crvRecord.paymentStatus = paymentStatus;
      setSubmitted({ crv: crvRecord });
      submitNotification('💰 Payment Collected', 'Payment Recorded - Click to View');
    } catch (err) {
      alert(err.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 540, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #10b981', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#064e3b', margin: '0 0 8px' }}>Payment Recorded</h2>
          <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: 8, margin: '20px 0', border: '1px solid #6ee7b7', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', color: '#047857', marginBottom: 12 }}>{submitted.crv.id}</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Method: <strong>{submitted.crv.paymentMethod}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Amount: <strong>${parseFloat(submitted.crv.amount).toFixed(2)}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Reference: <strong>{submitted.crv.reference}</strong></div>
            <div style={{ marginTop: 12 }}>
              <span style={{ padding: '4px 12px', borderRadius: 4, background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: 13 }}>
                {submitted.crv.paymentStatus}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print CRV
            </button>
            <button onClick={() => { setSubmitted(null); setAmount(''); setReference(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
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
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#047857' }}>
          <CreditCard color="#34d399" size={28} /> PAYMENT COLLECTION
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: CRV</p>
      </div>

      <fieldset disabled={!hasManagerPermission} style={{ border: 'none', padding: 0, margin: 0, opacity: hasManagerPermission ? 1 : 0.6 }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
          
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Payment Type *</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Cash', 'Bank Transfer', 'Telebirr'].map(type => (
                <button type="button" key={type} onClick={() => setPaymentType(type)} style={{
                  padding: '10px 20px', border: '2px solid', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  background: paymentType === type ? '#10b981' : 'white',
                  borderColor: paymentType === type ? '#10b981' : '#cbd5e1',
                  color: paymentType === type ? 'white' : '#475569'
                }}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Payment Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount Received ($) *</label>
                <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reference # (Sale/Prescription) *</label>
                <input required value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. RX-849102 or POS-001" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Conditional Fields */}
            {paymentType === 'Cash' && (
              <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#047857' }}>Recipient Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input required value={cashName} onChange={e => setCashName(e.target.value)} placeholder="Recipient Full Name *" style={{ padding: '10px 12px', border: '1px solid #6ee7b7', borderRadius: 6 }} />
                  <input required value={cashPhone} onChange={e => setCashPhone(e.target.value)} placeholder="Phone *" style={{ padding: '10px 12px', border: '1px solid #6ee7b7', borderRadius: 6 }} />
                </div>
              </div>
            )}
            {paymentType === 'Bank Transfer' && (
              <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0369a1' }}>Bank Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                  <input required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder Full Name *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                  <input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                  <input required value={bankPhone} onChange={e => setBankPhone(e.target.value)} placeholder="Phone *" style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 6 }} />
                </div>
              </div>
            )}
            {paymentType === 'Telebirr' && (
              <div style={{ background: '#fefce8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#92400e' }}>Telebirr Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <input required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Telebirr Number *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
                  <input required value={telebirrName} onChange={e => setTelebirrName(e.target.value)} placeholder="Full Name *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
                  <input required value={telebirrPhone} onChange={e => setTelebirrPhone(e.target.value)} placeholder="Phone *" style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 6 }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Mark Payment Status</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['PAID', 'CASHOUT'].map(status => (
                  <button type="button" key={status} onClick={() => setPaymentStatus(status)} style={{
                    padding: '8px 24px', border: '2px solid', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: paymentStatus === status ? (status === 'PAID' ? '#059669' : '#dc2626') : 'white',
                    borderColor: paymentStatus === status ? (status === 'PAID' ? '#059669' : '#dc2626') : '#cbd5e1',
                    color: paymentStatus === status ? 'white' : '#475569'
                  }}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" style={{ padding: '12px 32px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
            Generate CRV & Record Payment
          </button>
        </form>
      </fieldset>
    </div>
  );
};

export default PharmacyWorkerPaymentCollection;
