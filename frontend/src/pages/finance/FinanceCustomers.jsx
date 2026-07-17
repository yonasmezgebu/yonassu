import React, { useState, useEffect } from 'react';
import { Users, Plus, Download, Edit } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceCustomers = () => {
  const [customers, setCustomers] = useState(financeState.customers);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState('Company');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  useEffect(() => {
    // Optionally trigger on load or just when added
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCustomer = {
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name, type, phone, email, address, taxId, 
      creditLimit: parseFloat(creditLimit) || 0,
      paymentTerms,
      outstandingBalance: 0
    };
    
    financeState.customers.push(newCustomer);
    setCustomers([...financeState.customers]);
    setShowForm(false);
    
    // Reset form
    setName(''); setPhone(''); setEmail(''); setAddress(''); setTaxId(''); setCreditLimit('');
    
    submitNotification('👤 Customer Added/Updated', '👤 Customer Record - Click to View');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0284c7' }}>
            <Users color="#0ea5e9" size={28} /> CUSTOMERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage customer records and view outstanding balances.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
            <Download size={16} /> Export List
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>New Customer Record</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Customer Name *</label><input required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Type *</label><select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}><option>Company</option><option>Individual</option></select></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Tax ID / TIN {type === 'Company' ? '*' : ''}</label><input required={type === 'Company'} value={taxId} onChange={e => setTaxId(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 16 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone *</label><input required value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Address</label><input value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Credit Limit (ETB)</label><input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Terms</label><select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}><option>Due on Receipt</option><option>Net 15</option><option>Net 30</option><option>Net 60</option></select></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 24px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Save Customer</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['ID', 'Customer Name', 'Type', 'Contact', 'Credit Limit', 'Outstanding Balance', ''].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col.includes('Balance') || col === '' || col.includes('Limit') ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{c.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{c.type}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>
                  <div>{c.phone}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email}</div>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>
                  {c.creditLimit ? `ETB ${c.creditLimit.toLocaleString()}` : 'N/A'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: c.outstandingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                  ${c.outstandingBalance.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                   <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0284c7' }}><Edit size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceCustomers;
