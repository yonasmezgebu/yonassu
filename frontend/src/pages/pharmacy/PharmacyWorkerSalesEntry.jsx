import React, { useState, useContext } from 'react';
import { FileText, CheckCircle, Printer } from 'lucide-react';
import { WorkerAuthContext } from './PharmacyWorkerDashboard';
import { createIssueNote, createCRV } from '../../utils/storeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacyWorkerSalesEntry = () => {
  const { hasManagerPermission } = useContext(WorkerAuthContext);
  const [saleType, setSaleType] = useState('Walk-in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [telebirrNumber, setTelebirrNumber] = useState('');

  const [submitted, setSubmitted] = useState(null);

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasManagerPermission) return;

    try {
      // 1. M22
      const m22Lines = [{ itemName: medicineName, qtyToIssue: parseInt(quantity), batchNumber: '' }];
      const m22Record = createIssueNote(`Customer (${saleType}) - ${customerName}`, '', '', m22Lines, true);

      // 2. CRV
      const customerDetails = {
        name: customerName,
        phone: customerPhone,
        bankName, accountHolder, accountNumber, telebirrNumber
      };
      const crvRecord = createCRV(paymentMethod, totalAmount, `Manual Sale - ${saleType}`, customerDetails);

      setSubmitted({ m22: m22Record, crv: crvRecord, customerName, totalAmount, medicineName, quantity });
      submitNotification('📝 Sale Recorded', 'Manual Sale Entered - Click to View');
    } catch (err) {
      alert(err.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #059669', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#059669" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#064e3b', margin: '0 0 8px' }}>Sale Recorded Successfully</h2>
          
          <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: 8, margin: '24px 0', border: '1px solid #a7f3d0' }}>
            <div style={{ margin: '8px 0', fontSize: 14 }}>Customer: <strong>{submitted.customerName}</strong></div>
            <div style={{ margin: '8px 0', fontSize: 14 }}>Items: <strong>{submitted.quantity}x {submitted.medicineName}</strong></div>
            <div style={{ margin: '8px 0', fontSize: 18, fontWeight: 'bold', color: '#047857' }}>Total: ${submitted.totalAmount.toFixed(2)}</div>
            <hr style={{ border: 'none', borderTop: '1px solid #a7f3d0', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'monospace' }}>
              <span>CRV: {submitted.crv.id}</span>
              <span>M22: {submitted.m22.id}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Receipt
            </button>
            <button onClick={() => { setSubmitted(null); setMedicineName(''); setQuantity(''); setUnitPrice(''); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              New Manual Sale
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
          <FileText color="#059669" size={28} /> SALES ENTRY
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M22 + CRV</p>
      </div>

      <fieldset disabled={!hasManagerPermission} style={{ border: 'none', padding: 0, margin: 0, opacity: hasManagerPermission ? 1 : 0.6 }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
          
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Sale Type</h3>
            <select value={saleType} onChange={e => setSaleType(e.target.value)} style={{ width: 300, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
              <option>Walk-in</option>
              <option>Online</option>
              <option>Prescription</option>
            </select>
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Sale Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Customer Name *</label>
                <input required value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Customer Phone *</label>
                <input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Medicine Name *</label>
                <input required value={medicineName} onChange={e => setMedicineName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Quantity *</label>
                <input required type="number" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Unit Price ($) *</label>
                <input required type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Payment Details</h3>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#047857' }}>Total: ${totalAmount.toFixed(2)}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Payment Method *</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '50%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Telebirr</option>
              </select>
            </div>

            {paymentMethod === 'Bank Transfer' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                <input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name *" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                <input required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder *" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                <input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number *" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            )}
            {paymentMethod === 'Telebirr' && (
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                <input required value={telebirrNumber} onChange={e => setTelebirrNumber(e.target.value)} placeholder="Telebirr Number *" style={{ width: '50%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            )}
          </div>

          <button type="submit" style={{ padding: '12px 32px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
            Record Sale
          </button>
        </form>
      </fieldset>
    </div>
  );
};

export default PharmacyWorkerSalesEntry;
