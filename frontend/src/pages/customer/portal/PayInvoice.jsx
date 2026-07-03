import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';

const METHODS = [
  { value: 'online',  label: 'Online Payment',  sub: 'Instant confirmation via payment gateway', icon: CreditCard, color: '#3b82f6' },
  { value: 'bank',    label: 'Bank Transfer',    sub: 'Requires staff verification (pending 24–48h)', icon: Banknote, color: '#059669' },
  { value: 'telbir',  label: 'Telbir / Mobile',  sub: 'Requires staff verification (pending 24–48h)', icon: Smartphone, color: '#7c3aed' },
  { value: 'cash',    label: 'Cash',             sub: 'Requires staff verification (pending 24–48h)', icon: Banknote, color: '#d97706' },
];

const PayInvoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [method, setMethod] = useState('online');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => {
      const unpaid = customerState.getInvoices().filter(i => i.amount_paid_cents < i.total_cents);
      setInvoices(unpaid);
      customerState.notify('PAGE_LOAD');
    };
    load();
    return customerState.subscribe(load);
  }, []);

  const balance = selectedInvoice ? selectedInvoice.total_cents - selectedInvoice.amount_paid_cents : 0;

  const handleSelect = (inv) => {
    setSelectedInvoice(inv);
    setAmount((inv.total_cents - inv.amount_paid_cents) / 100);
    setError('');
    setResult(null);
  };

  const handlePay = (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!selectedInvoice) { setError('Please select an invoice.'); return; }
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) { setError('Enter a valid payment amount.'); return; }
    if (cents > balance) { setError('Amount exceeds outstanding balance — overpayment is not allowed.'); return; }
    try {
      const pay = customerState.payInvoice(selectedInvoice.id, cents, method);
      // SPEC: "Payment Received" toast fires only for confirmed online payments
      if (method === 'online') {
        customerState.notify('PAYMENT_RECEIVED');
      } else {
        customerState.notify('INFO'); // Soft info for pending submissions
      }
      setResult(pay);
      setSelectedInvoice(null);
      setAmount('');
    } catch (err) {
      setError(err.message);
    }
  };

  const isInstant = method === 'online';

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Pay Invoice</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Settle your outstanding balances. Online payments are confirmed instantly.</p>
      </div>

      {result && (
        <div style={{ padding: '20px', backgroundColor: result.status === 'verified' ? '#ecfdf5' : '#fff7ed', border: `1px solid ${result.status === 'verified' ? '#86efac' : '#fcd34d'}`, borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ fontWeight: '700', fontSize: '16px', color: result.status === 'verified' ? '#15803d' : '#b45309' }}>
            {result.status === 'verified' ? '✅ Payment Confirmed!' : '⏳ Payment Submitted — Pending Staff Verification'}
          </div>
          <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '14px' }}>
            {result.status === 'verified' ? 'Your invoice has been updated.' : 'Your payment reference has been recorded. A staff member will verify within 24–48 hours. Until then, your balance remains outstanding.'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Invoice List */}
        <div>
          <h3 style={{ marginTop: 0, color: '#475569', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Invoice to Pay</h3>
          {invoices.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
              🎉 No outstanding invoices. You're all settled!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invoices.map(inv => {
                const bal = inv.total_cents - inv.amount_paid_cents;
                const overdue = new Date(inv.due_date) < new Date();
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <div key={inv.id} onClick={() => handleSelect(inv)} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{inv.id}</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}><CurrencyDisplay amountCents={bal} /></div>
                        <SalesStatusBadge status={overdue ? 'overdue' : 'unpaid'} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Form */}
        {selectedInvoice && (
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'sticky', top: '24px' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Payment Details</h3>
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Invoice</span><span style={{ fontWeight: '600' }}>{selectedInvoice.id}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}><span>Outstanding</span><span style={{ fontWeight: 'bold', color: '#ef4444' }}><CurrencyDisplay amountCents={balance} /></span></div>
            </div>
            
            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Payment Method</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {METHODS.map(m => {
                    const Icon = m.icon;
                    return (
                      <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: `2px solid ${method === m.value ? m.color : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                        <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} style={{ accentColor: m.color }} />
                        <Icon size={20} color={m.color} />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{m.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{m.sub}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {!isInstant && (
                <div style={{ padding: '12px', backgroundColor: '#fff7ed', border: '1px solid #fcd34d', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
                  ⚠️ This payment method requires staff verification before your balance is updated. Do not double-submit.
                </div>
              )}

              <div>
                <label style={labelStyle}>Amount to Pay (ETB)</label>
                <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: '600', boxSizing: 'border-box' }} required />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Max: ETB {(balance / 100).toLocaleString()}</div>
              </div>

              {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</div>}

              <button type="submit" style={{ padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                {isInstant ? '💳 Pay Now (Instant)' : '📨 Submit Payment Intent'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569' };

export default PayInvoice;
