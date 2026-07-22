import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';

const PRODUCT_TYPES = [
  { code: 'Book', name: 'Book Printing', desc: 'For scholars and researchers' },
  { code: 'Module', name: 'Module Printing', desc: 'For lecturers and educators' },
  { code: 'Exam', name: 'Exam Paper', desc: 'For examinations and tests' },
  { code: 'Brochure', name: 'Brochure', desc: 'For churches, weddings, events' },
  { code: 'TaxReceipt', name: 'Tax Receipt', desc: 'Official government tax receipts' },
];

const PAPER_TYPES = [
  { code: 'A3', name: 'A3', desc: '297mm × 420mm', price: 1.00 },
  { code: 'A4', name: 'A4', desc: '210mm × 297mm', price: 0.50 },
  { code: 'A5', name: 'A5', desc: '148mm × 210mm', price: 0.75 },
];

const BINDING_TYPES = [
  { code: 'None', name: 'No Binding', price: 0 },
  { code: 'Spiral', name: 'Spiral Binding', price: 500 },
  { code: 'Thermal', name: 'Thermal Binding', price: 300 },
];

const PrintingCreateOrder = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', productType: 'Book',
    paperType: 'A4', pagesPerCopy: 1, quantity: 1,
    colorPrinting: false, bindingType: 'None', dueDate: '', specialInstructions: '',
    paymentMethod: 'Telebirr', paymentReference: ''
  });
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const basePrice = PAPER_TYPES.find(p => p.code === form.paperType)?.price || 0.50;
    const multiplier = form.colorPrinting ? 2.0 : 1.0;
    const pricePerUnit = form.pagesPerCopy * basePrice * multiplier;
    const bindingCost = BINDING_TYPES.find(b => b.code === form.bindingType)?.price || 0;
    const bindingTotal = bindingCost * form.quantity;
    const subtotal = pricePerUnit * form.quantity;
    setPricing({ pricePerUnit, bindingCost: bindingTotal, subtotal, totalPrice: subtotal + bindingTotal });
  }, [form.paperType, form.pagesPerCopy, form.quantity, form.colorPrinting, form.bindingType]);

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customerName || !form.customerPhone) { setError('Customer name and phone are required'); return; }
    if (form.customerPhone.length < 10) { setError('Enter a valid phone number'); return; }
    if (!form.dueDate) { setError('Due date is required'); return; }
    if (!form.paymentReference) { setError('Payment Transaction Reference is required'); return; }
    
    setLoading(true);
    try {
      const res = await axios.post('/printing/orders', {
        productType: form.productType,
        quantity: parseInt(form.quantity),
        paperType: form.paperType,
        pagesPerCopy: parseInt(form.pagesPerCopy),
        colorPrinting: form.colorPrinting,
        bindingType: form.bindingType,
        dueDate: form.dueDate,
        specialInstructions: form.specialInstructions || undefined,
        paymentMethod: form.paymentMethod,
        paymentReference: form.paymentReference,
        customer: { name: form.customerName, phone: form.customerPhone, customerTypeId: 1 }
      });
      if (res.status === 'success') {
        navigate(`/printing/orders/${res.data?.orderId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    padding: '12px 28px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(145deg, #2E8B57, #1B5E20)',
    color: 'white',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
    boxShadow: '0 6px 0 #144918, 0 10px 10px rgba(0,0,0,0.2)',
    transition: 'all 0.1s ease',
    transform: 'translateY(0)',
    display: 'inline-block'
  };

  const activeButtonStyle = {
    boxShadow: '0 2px 0 #144918, 0 4px 4px rgba(0,0,0,0.2)',
    transform: 'translateY(4px)'
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 850, margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#1B5E20', fontSize: '2rem', fontWeight: 800 }}>🌿 New Printing Order</h2>

      {error && (
        <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: '1.5rem', fontSize: 14, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(34, 139, 34, 0.08)', border: '1px solid #A5D6A7' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: 13, color: '#2E8B57', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Customer Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Customer Name *</label>
              <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', ':focus': { borderColor: '#4CAF50' } }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Phone *</label>
              <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                placeholder="09xxxxxxxx"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(34, 139, 34, 0.08)', border: '1px solid #A5D6A7' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: 13, color: '#2E8B57', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Order Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Product Type</label>
              <select value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white' }}>
                {PRODUCT_TYPES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Paper Size</label>
              <select value={form.paperType} onChange={e => setForm(f => ({ ...f, paperType: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white' }}>
                {PAPER_TYPES.map(p => <option key={p.code} value={p.code}>{p.name} ({p.desc})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Binding</label>
              <select value={form.bindingType} onChange={e => setForm(f => ({ ...f, bindingType: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: 'white' }}>
                {BINDING_TYPES.map(b => <option key={b.code} value={b.code}>{b.name} {b.price > 0 ? `(+${b.price} ETB/copy)` : ''}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Pages per Copy</label>
              <input type="number" min={1} value={form.pagesPerCopy} onChange={e => setForm(f => ({ ...f, pagesPerCopy: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} min={tomorrow.toISOString().split('T')[0]}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#1B5E20', fontWeight: 600, marginTop: 28 }}>
                <input type="checkbox" checked={form.colorPrinting} onChange={e => setForm(f => ({ ...f, colorPrinting: e.target.checked }))} style={{ width: 18, height: 18, accentColor: '#228B22' }} />
                Color Printing (×2)
              </label>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 600 }}>Special Instructions</label>
            <textarea value={form.specialInstructions} onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))} rows={2} maxLength={500}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical' }} />
          </div>
        </div>

        {pricing && (
          <div style={{ background: 'linear-gradient(135deg, #F5FFF5 0%, #E8F5E9 100%)', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', border: '2px solid #8BC34A', boxShadow: '0 4px 15px rgba(139, 195, 74, 0.2)' }}>
            <h3 style={{ margin: '0 0 1.2rem', fontSize: 16, color: '#1B5E20', fontWeight: 800 }}>Price Estimate</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div><span style={{ fontSize: 13, color: '#2E8B57', fontWeight: 600 }}>Price/Unit</span><div style={{ fontSize: 18, fontWeight: 800, color: '#1B5E20' }}>{pricing.pricePerUnit.toFixed(2)} ETB</div></div>
              <div><span style={{ fontSize: 13, color: '#2E8B57', fontWeight: 600 }}>Binding Cost</span><div style={{ fontSize: 18, fontWeight: 800, color: '#1B5E20' }}>{pricing.bindingCost.toFixed(2)} ETB</div></div>
              <div><span style={{ fontSize: 13, color: '#2E8B57', fontWeight: 600 }}>Subtotal</span><div style={{ fontSize: 18, fontWeight: 800, color: '#1B5E20' }}>{pricing.subtotal.toFixed(2)} ETB</div></div>
              <div><span style={{ fontSize: 13, color: '#2E8B57', fontWeight: 600 }}>Total</span><div style={{ fontSize: 24, fontWeight: 900, color: '#228B22' }}>{pricing.totalPrice.toFixed(2)} ETB</div></div>
            </div>
          </div>
        )}

        <div style={{ background: '#E8F5E9', borderRadius: 16, padding: '2rem', marginBottom: '2rem', border: '2px dashed #4CAF50' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 16, color: '#1B5E20', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>💳</span> Payment Verification
          </h3>
          <p style={{ margin: '0 0 1.5rem', fontSize: 14, color: '#1B5E20', lineHeight: 1.6, fontWeight: 500 }}>
            <strong style={{ color: '#dc2626' }}>Full payment is required before we begin printing.</strong><br/>
            Please pay the total amount of <strong>{pricing ? pricing.totalPrice.toFixed(2) : '0.00'} ETB</strong> to:<br/><br/>
            🟢 <strong>Telebirr:</strong> 0901407032 (SUTANA WALLET)<br/>
            🏦 <strong>CBE Bank:</strong> 1000675227776 (SUTANA)<br/><br/>
            Then, enter your transaction reference number below. Your print job starts once Finance confirms the payment.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 700 }}>Payment Method *</label>
              <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #8BC34A', borderRadius: 10, fontSize: 14, background: 'white', fontWeight: 600, color: '#1B5E20' }}>
                <option value="Telebirr">Telebirr</option>
                <option value="CBE Bank">CBE Bank</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#1B5E20', marginBottom: 6, fontWeight: 700 }}>Transaction Reference / Code *</label>
              <input value={form.paymentReference} onChange={e => setForm(f => ({ ...f, paymentReference: e.target.value }))}
                placeholder="e.g. FT123456789"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #8BC34A', borderRadius: 10, fontSize: 14, outline: 'none', fontWeight: 600, color: '#1B5E20' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '3rem' }}>
          <button type="button" onClick={() => navigate('/printing/orders')}
            style={{ padding: '12px 24px', border: '2px solid #cbd5e1', borderRadius: 12, background: 'white', cursor: 'pointer', fontSize: 14, color: '#475569', fontWeight: 600 }}>
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={loading}
            onMouseDown={(e) => { if(!loading) Object.assign(e.currentTarget.style, activeButtonStyle) }}
            onMouseUp={(e) => { if(!loading) Object.assign(e.currentTarget.style, buttonStyle) }}
            onMouseLeave={(e) => { if(!loading) Object.assign(e.currentTarget.style, buttonStyle) }}
            style={buttonStyle}>
            {loading ? 'Processing...' : 'Submit & Request Print'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrintingCreateOrder;
