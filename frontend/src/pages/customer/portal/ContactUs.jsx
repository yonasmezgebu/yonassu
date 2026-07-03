import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip } from 'lucide-react';

const CATEGORIES = [
  { value: 'order_issue',    label: 'Order Issue' },
  { value: 'payment_issue',  label: 'Payment Issue' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'product_issue',  label: 'Product Issue' },
  { value: 'general_inquiry',label: 'General Inquiry' },
];

const ContactUs = () => {
  const [orders, setOrders] = useState([]);
  const [category, setCategory] = useState('general_inquiry');
  const [relatedOrderId, setRelatedOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setOrders(customerState.getOrders());
    customerState.notify('PAGE_LOAD');
  }, []);

  // Show order picker only for order/delivery/product issues
  const needsOrder = ['order_issue', 'delivery_issue', 'product_issue'].includes(category);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      // Server validates order ownership if an order is linked
      const ticket = customerState.submitSupportTicket(category, message, needsOrder && relatedOrderId ? relatedOrderId : null);
      customerState.notify('SUPPORT_SENT');
      setSubmitted(ticket);
      setMessage('');
      setRelatedOrderId('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '16px', textAlign: 'center', maxWidth: '480px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>Support Request Sent!</h2>
          <p style={{ color: '#64748b', marginBottom: '8px' }}>Your ticket number is:</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '24px' }}>{submitted.ticket_number}</div>
          <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>Our team has been notified and will respond shortly. Track your request in Support History.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setSubmitted(null)} style={{ padding: '12px 24px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Submit Another</button>
            <button onClick={() => navigate('/customer/support/history')} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>View History</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Contact Us</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Submit a support request. We'll respond as quickly as possible.</p>
      </div>

      <div style={{ maxWidth: '640px', backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={labelStyle}>Subject Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
              {CATEGORIES.map(c => (
                <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: `2px solid ${category === c.value ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', transition: 'border-color 0.15s', fontSize: '14px' }}>
                  <input type="radio" name="category" value={c.value} checked={category === c.value} onChange={() => { setCategory(c.value); setRelatedOrderId(''); }} style={{ accentColor: '#3b82f6' }} />
                  <span style={{ fontWeight: category === c.value ? '600' : '400', color: '#334155' }}>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {needsOrder && (
            <div>
              <label style={labelStyle}>Related Order <span style={{ color: '#94a3b8', fontWeight: '400' }}>(optional but recommended)</span></label>
              <select style={inputStyle} value={relatedOrderId} onChange={e => setRelatedOrderId(e.target.value)}>
                <option value="">— Not related to a specific order —</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} — {new Date(o.created_at).toLocaleDateString()}</option>)}
              </select>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Only your own orders are shown. Tampered order IDs will be rejected.</div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Message *</label>
            <textarea 
              style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }} 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Describe your issue in detail…"
              required
              minLength={20}
            />
          </div>

          <div>
            <label style={labelStyle}>Attachments <span style={{ color: '#94a3b8', fontWeight: '400' }}>(max 5 files, images and PDF only)</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '2px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', marginTop: '8px' }}>
              <Paperclip size={18} />
              <span style={{ fontSize: '14px' }}>Click to attach files (virus-scanned before upload)</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Allowed types: .jpg, .png, .pdf — Files go through allowlist validation before storage.</div>
          </div>

          {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>{error}</div>}

          <button type="submit" style={{ padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send size={18} /> Send Support Request
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '0' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '8px', fontSize: '14px', boxSizing: 'border-box' };

export default ContactUs;
