import React, { useState, useEffect } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { useNavigate } from 'react-router-dom';

const RentalPOS = () => {
  const [assets, setAssets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  const [assetId, setAssetId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [startDt, setStartDt] = useState(new Date().toISOString().substring(0, 16));
  const [endDt, setEndDt] = useState(new Date(Date.now() + 86400000).toISOString().substring(0, 16));
  const [durationUnit, setDurationUnit] = useState('days');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [insurance, setInsurance] = useState(false);
  const [operator, setOperator] = useState(false);
  
  const [error, setError] = useState('');

  useEffect(() => {
    // Only show available assets for immediate POS pickup
    setAssets(rentalState.getAssets().filter(a => a.status === 'available'));
    setCustomers(rentalState.getCustomers());
  }, []);

  const selectedAsset = assets.find(a => a.id === assetId);

  // Live Cost Calc (Client-side mirror of server logic for display)
  let subtotal = 0;
  let totalCost = 0;
  let durationVal = 0;
  if (selectedAsset && startDt && endDt) {
      const s = new Date(startDt);
      const e = new Date(endDt);
      if (durationUnit === 'days') {
          durationVal = Math.ceil((e - s) / 86400000);
          if (durationVal === 0) durationVal = 1;
          subtotal = selectedAsset.daily_rate_cents * durationVal;
      } else {
          durationVal = Math.ceil((e - s) / 3600000);
          if (durationVal === 0) durationVal = 1;
          subtotal = selectedAsset.hourly_rate_cents * durationVal;
      }
      totalCost = subtotal + (insurance ? 50000 : 0) + (operator ? 150000 * durationVal : 0);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      rentalState.createOrder({
        asset_id: assetId,
        customer_id: customerId,
        start_datetime: new Date(startDt).toISOString(),
        end_datetime: new Date(endDt).toISOString(),
        duration_unit: durationUnit,
        additional_services: { insurance, operator },
        payment_details: { method: paymentMethod }
      }, true); // true = immediate pickup
      
      rentalState.notify('PICKUP_SUCCESS');
      navigate('/car-renting/manager/orders');
    } catch (err) {
      setError(err.message);
      rentalState.notify('ERROR');
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>POS / Pickups</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Process immediate walk-in rentals and pickups.</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '800px' }}>
        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '24px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Available Asset *</label>
            <select style={inputStyle} value={assetId} onChange={e => setAssetId(e.target.value)} required>
              <option value="">Select Asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>[{a.asset_type === 'car' ? 'Car' : 'Agri'}] {a.name} ({a.identifier})</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Customer *</label>
            <select style={inputStyle} value={customerId} onChange={e => setCustomerId(e.target.value)} required>
              <option value="">Select Customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Start Date & Time *</label>
            <input type="datetime-local" style={inputStyle} value={startDt} onChange={e => setStartDt(e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>End Date & Time *</label>
            <input type="datetime-local" style={inputStyle} value={endDt} onChange={e => setEndDt(e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>Duration Unit</label>
            <select style={inputStyle} value={durationUnit} onChange={e => setDurationUnit(e.target.value)}>
                <option value="days">Days</option>
                <option value="hours">Hours</option>
            </select>
          </div>

          <div>
             <label style={labelStyle}>Payment Method *</label>
             <select style={inputStyle} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="telbir">Telebirr</option>
             </select>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={insurance} onChange={e => setInsurance(e.target.checked)} />
                  Add Insurance (500 ETB)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={operator} onChange={e => setOperator(e.target.checked)} />
                  Include Operator (1,500 ETB / period)
              </label>
          </div>

          <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#1e40af' }}>Subtotal ({durationVal} {durationUnit}):</span>
                  <span style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={subtotal} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#1e40af' }}>Required Deposit:</span>
                  <span style={{ fontWeight: '600' }}><CurrencyDisplay amountCents={selectedAsset?.deposit_amount_cents || 0} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #93c5fd', paddingTop: '8px' }}>
                  <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Total Due Now (Cost + Deposit):</span>
                  <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '18px' }}><CurrencyDisplay amountCents={totalCost + (selectedAsset?.deposit_amount_cents || 0)} /></span>
              </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}>
              Process Pickup & Collect Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };

export default RentalPOS;
