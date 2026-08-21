import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, CheckCircle, Printer, Loader2 } from 'lucide-react';
import api from '../../services/apiClient';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useLocation } from 'react-router-dom';

const fmtETB = (n) => 'ETB ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FinanceSupplierPayments = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialBill = queryParams.get('billRef') || '';
  const initialSupplier = queryParams.get('supplier') || '';

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [suppliers, setSuppliers] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [supplierName, setSupplierName] = useState(initialSupplier);
  const [billRef, setBillRef] = useState(initialBill);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [supRes, billRes] = await Promise.all([
        api.get('/finance-supplier/suppliers'),
        api.get('/finance-supplier/bills'),
      ]);
      setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
      setBills(Array.isArray(billRes.data) ? billRes.data : []);
    } catch (err) {
      console.error('Failed to load supplier payment data:', err);
      setError('Failed to load suppliers and bills.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingBills = bills.filter(b =>
    b.status !== 'Paid' && (!supplierName || b.supplier_name === supplierName)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!amountPaid || parseFloat(amountPaid) <= 0) return setError('Enter a valid payment amount.');

    setSubmitting(true);
    try {
      const bill = bills.find(b => b.bill_number === billRef);
      const payload = {
        date,
        paidTo: supplierName,
        amount: parseFloat(amountPaid),
        paymentMethod,
        description: `Payment for Bill ${billRef}`,
        referenceNo: billRef,
        bankDetails:     paymentMethod === 'Bank'     ? { bankName, accountHolder, accountNumber } : null,
        telebirrDetails: paymentMethod === 'Telebirr' ? { telebirrNumber, fullName: telebirrName } : null,
      };

      // 1) Create a real EV → recorded in finance_evs (approved & finalized later)
      const res = await api.post('/finance-cash/ev', payload);
      const evNumber = res.data?.data?.evNumber;

      // 2) Apply the payment to the supplier bill (persisted)
      if (bill?.id) {
        await api.put(`/finance-supplier/bills/${bill.id}/payment`, {
          amountPaid: parseFloat(amountPaid),
          paymentMethod,
        });
      }

      setSubmitted({ evNumber, billRef, supplierName, date, amount: parseFloat(amountPaid), paymentMethod });
      submitNotification(`💳 Payment Sent to ${supplierName}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBillSelect = (bId) => {
    setBillRef(bId);
    const bill = bills.find(b => b.bill_number === bId);
    if (bill) {
      const balance = (Number(bill.total_amount) || 0) - (Number(bill.amount_paid) || 0);
      setAmountPaid(balance.toFixed(2));
      if (!supplierName) setSupplierName(bill.supplier_name);
    }
  };

  if (loading && suppliers.length === 0) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Loader2 size={20} className="spin" style={{ color: '#d97706' }} />
        <span style={{ color: '#64748b', fontWeight: 500 }}>Loading supplier data...</span>
        <style>{`.spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 540, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #f59e0b', padding: 32, textAlign: 'center' }}>
          <CheckCircle size={56} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#b45309', margin: '0 0 8px' }}>Supplier Payment Sent</h2>
          <div style={{ background: '#fffbeb', padding: '16px', borderRadius: 8, margin: '20px 0', border: '1px solid #fde68a', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', color: '#d97706', marginBottom: 12 }}>EV #: {submitted.evNumber}</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Date: <strong>{submitted.date}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Supplier: <strong>{submitted.supplierName}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Applied to Bill: <strong>{submitted.billRef}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Amount Paid: <strong>{fmtETB(submitted.amount)}</strong></div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Method: <strong>{submitted.paymentMethod}</strong></div>
            <div style={{ fontSize: 12, marginTop: 12, color: '#92400e' }}>* Payment recorded as an Expense Voucher (EV) — visible in Expense Book and Cash Flow reports once finalized.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print EV
            </button>
            <button onClick={() => { setSubmitted(null); setAmountPaid(''); setBillRef(''); setBankName(''); setAccountHolder(''); setAccountNumber(''); setTelebirrNumber(''); setTelebirrName(''); load(); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
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
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#d97706' }}>
          <ShoppingCart color="#f59e0b" size={28} /> SUPPLIER PAYMENTS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Issue payments to suppliers via the central Expense Voucher (EV) system — recorded in the Cash Book once finalized.</p>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Supplier *</label>
              <select required value={supplierName} onChange={e => { setSupplierName(e.target.value); setBillRef(''); setAmountPaid(''); }} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Bill Reference *</label>
              <select required value={billRef} onChange={e => handleBillSelect(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                <option value="">Select Bill...</option>
                {pendingBills.map(b => {
                  const balance = (Number(b.total_amount) || 0) - (Number(b.amount_paid) || 0);
                  return <option key={b.id} value={b.bill_number}>{b.bill_number} — {fmtETB(balance)} due</option>;
                })}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Amount Paid *</label>
              <input required type="number" step="0.01" min="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
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

        <button type="submit" disabled={submitting} style={{ padding: '12px 32px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {submitting && <Loader2 size={16} className="spin" />}
          {submitting ? 'Processing...' : 'Send Payment & Generate EV'}
        </button>
      </form>
      <style>{`.spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default FinanceSupplierPayments;
