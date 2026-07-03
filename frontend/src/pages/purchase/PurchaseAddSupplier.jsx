import React, { useState } from 'react';
import { UserPlus, Send, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { createSupplier, updateSupplier } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PurchaseAddSupplier = () => {
  const [submitted, setSubmitted] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', website: '',
    taxId: '', category: 'Pharmaceutical', paymentTerms: 'Net 30', creditLimit: '',
    location: 'Local', bankName: '', accountNumber: '', accountHolder: ''
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (!form.name || !form.contactPerson || !form.phone) {
        setErrorMsg('Supplier Name, Contact Person, and Phone are required.');
        return;
      }
      const created = createSupplier({
        ...form,
        creditLimit: parseFloat(form.creditLimit) || 0,
      });
      setNewSupplierId(created.id);
      setSubmitted(true);
      submitNotification('➕ New Supplier Added', '➕ New Supplier - Click to Verify', 'success.mp3');
    } catch (err) { setErrorMsg(err.message); }
  };

  const handleVerify = (action) => {
    try {
      updateSupplier(newSupplierId, { status: action === 'Approve' ? 'Active' : 'Pending Verification' });
      submitNotification(`✅ Supplier ${action === 'Approve' ? 'Activated' : 'put on Hold'}`, '✅ Supplier Status Updated', 'success.mp3');
      setSubmitted(false);
      setNewSupplierId('');
      setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', website: '', taxId: '', category: 'Pharmaceutical', paymentTerms: 'Net 30', creditLimit: '', location: 'Local', bankName: '', accountNumber: '', accountHolder: '' });
    } catch (err) { setErrorMsg(err.message); }
  };

  const inp = (label, field, type = 'text', required = false, placeholder = '') => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}{required && ' *'}</label>
      <input type={type} value={form[field]} onChange={set(field)} required={required} placeholder={placeholder}
        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
    </div>
  );

  const sel = (label, field, options) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</label>
      <select value={form[field]} onChange={set(field)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <UserPlus color="#22c55e" size={28} /> ADD SUPPLIER
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Register a new supplier. The record will be active in the shared Supplier entity across all modules once verified.</p>
      </div>

      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#991b1b', fontSize: 13 }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {submitted && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 8px', color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={20} /> Supplier Registered — Verification Required</h3>
          <p style={{ color: '#15803d', margin: '0 0 16px', fontSize: 14 }}>Supplier ID: <strong>{newSupplierId}</strong> has been created with status <strong>Pending Verification</strong>.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => handleVerify('Approve')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <CheckCircle size={16} /> Approve — Activate Supplier
            </button>
            <button onClick={() => handleVerify('Hold')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <Clock size={16} /> Hold — Awaiting Verification
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {inp('Supplier Name', 'name', 'text', true)}
            {inp('Contact Person', 'contactPerson', 'text', true)}
            {inp('Phone', 'phone', 'tel', true)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {inp('Email', 'email', 'email')}
            {inp('Address', 'address')}
            {inp('Website', 'website', 'url')}
          </div>
        </div>

        {/* Business Details */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Business Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            {inp('Tax ID', 'taxId')}
            {sel('Supplier Category', 'category', ['Pharmaceutical', 'General', 'Equipment', 'Services'])}
            {sel('Payment Terms', 'paymentTerms', ['Net 30', 'Net 60', 'Cash on Delivery', 'Prepaid'])}
            {inp('Credit Limit ($)', 'creditLimit', 'number')}
          </div>
          <div style={{ marginTop: 16 }}>
            {sel('Location', 'location', ['Local', 'International'])}
          </div>
        </div>

        {/* Bank Details */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Bank Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {inp('Bank Name', 'bankName')}
            {inp('Account Number', 'accountNumber')}
            {inp('Account Holder', 'accountHolder')}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
            <Send size={18} /> Register Supplier
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseAddSupplier;
