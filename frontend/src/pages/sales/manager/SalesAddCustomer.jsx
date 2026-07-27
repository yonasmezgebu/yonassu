import React, { useState } from 'react';
import { salesState } from '../../../utils/salesManagerState';
import { useNavigate } from 'react-router-dom';

const SalesAddCustomer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    type: 'walk_in',
    credit_limit_cents: 0,
    payment_terms_days: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      salesState.createCustomer({
        ...formData,
        credit_limit_cents: Math.round(parseFloat(formData.credit_limit_cents) * 100)
      });
      navigate('/sales/manager/customers');
    } catch (err) {
      alert(err.message);
    }
  };

  const isCredit = formData.type === 'credit' || formData.type === 'wholesale';

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Add New Customer</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Register a new customer profile.</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 0, border: '1px solid #e2e8f0', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Customer Name *</label>
            <input type="text" style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input type="tel" style={inputStyle} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Address</label>
            <input type="text" style={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>

          <div>
            <label style={labelStyle}>Tax ID / TIN</label>
            <input type="text" style={inputStyle} value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
          </div>

          <div>
            <label style={labelStyle}>Customer Type *</label>
            <select style={inputStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="walk_in">Walk-in</option>
              <option value="credit">Credit</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>

          {isCredit && (
            <>
              <div>
                <label style={labelStyle}>Credit Limit (ETB)</label>
                <input type="number" min="0" step="0.01" style={inputStyle} value={formData.credit_limit_cents} onChange={e => setFormData({...formData, credit_limit_cents: e.target.value})} required={isCredit} />
              </div>
              <div>
                <label style={labelStyle}>Payment Terms (Days)</label>
                <input type="number" min="0" style={inputStyle} value={formData.payment_terms_days} onChange={e => setFormData({...formData, payment_terms_days: e.target.value})} required={isCredit} />
              </div>
            </>
          )}

          <div style={{ gridColumn: '1 / -1', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={() => navigate('/sales/manager/customers')} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: 0, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: 0, fontWeight: '600', cursor: 'pointer' }}>Create Customer</button>
          </div>

        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: 0, border: '1px solid #cbd5e1', boxSizing: 'border-box' };

export default SalesAddCustomer;
