import React, { useState, useEffect } from 'react';
import { salesState, formatCents } from '../../../utils/salesManagerState';
import SalesLineItemEditor from '../components/SalesLineItemEditor';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';

const SalesNewSale = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [lines, setLines] = useState([]);
  const [discountCents, setDiscountCents] = useState(0);
  const [taxRate, setTaxRate] = useState(0.15); // 15% VAT
  const [applyTax, setApplyTax] = useState(true);
  const [amountReceivedCents, setAmountReceivedCents] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setCustomers(salesState.getCustomers());
    salesState.notify('PAGE_LOAD');
  }, []);

  // Calculations
  const subtotalCents = lines.reduce((sum, line) => sum + line.line_total_cents, 0);
  const totalAfterDiscountCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = applyTax ? Math.round(totalAfterDiscountCents * taxRate) : 0;
  const totalCents = totalAfterDiscountCents + taxCents;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one item.');
      return;
    }

    try {
      const saleData = {
        customer_id: selectedCustomerId,
        payment_type: paymentType,
        discount_cents: discountCents,
        tax_cents: taxCents,
        amount_received_cents: paymentType === 'credit' ? 0 : (amountReceivedCents || totalCents), 
        // If cash and they didn't specify received, assume full payment
      };

      salesState.createSale(saleData, lines);
      // Success, redirect to history or print receipt
      navigate('/sales/manager/history');
    } catch (err) {
      setError(err.message);
      salesState.notify('ERROR');
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>New Sale</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Create a new sales transaction (Cash, Credit, Bank).</p>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 0, marginBottom: '24px', fontWeight: '500' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0' }}>Line Items</h2>
            <SalesLineItemEditor lines={lines} setLines={setLines} />
          </div>
        </div>

        {/* Right Column: Details & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0' }}>Transaction Details</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>Customer</label>
              <select 
                value={selectedCustomerId} 
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 0, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                required
              >
                <option value="">Select Customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>Payment Type</label>
              <select 
                value={paymentType} 
                onChange={(e) => setPaymentType(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 0, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="bank">Bank Transfer</option>
                <option value="telbir">TeleBirr</option>
              </select>
            </div>
            
            {paymentType === 'cash' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>Amount Received (ETB)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountReceivedCents ? amountReceivedCents / 100 : ''}
                  onChange={(e) => setAmountReceivedCents(Math.round(parseFloat(e.target.value || 0) * 100))}
                  placeholder="Leave empty for full amount"
                  style={{ width: '100%', padding: '10px', borderRadius: 0, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0' }}>Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
              <span>Subtotal</span>
              <CurrencyDisplay amountCents={subtotalCents} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
              <span>Order Discount</span>
              <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountCents ? discountCents / 100 : ''}
                  onChange={(e) => setDiscountCents(Math.round(parseFloat(e.target.value || 0) * 100))}
                  style={{ width: '100px', padding: '6px', borderRadius: 0, border: '1px solid #cbd5e1', textAlign: 'right' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px', color: '#475569', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} />
                Apply 15% VAT
              </label>
              <CurrencyDisplay amountCents={taxCents} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Total</span>
              <CurrencyDisplay amountCents={totalCents} style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }} />
            </div>

            <button 
              type="submit"
              style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 0, fontWeight: '600', fontSize: '16px', cursor: 'pointer', marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              Complete Sale
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default SalesNewSale;
