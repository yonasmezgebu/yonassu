import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { salesState } from '../../../utils/salesManagerState';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { FileText } from 'lucide-react';

const SalesCustomerStatement = () => {
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';
  
  const [customers] = useState(salesState.getCustomers());
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statement, setStatement] = useState(null);

  useEffect(() => {
    salesState.notify('PAGE_LOAD');
    if(initialCustomerId) {
        generateStatement();
    }
  }, []);

  const generateStatement = (e) => {
    if(e) e.preventDefault();
    if (!selectedCustomerId) return;
    
    const result = salesState.getCustomerStatement(selectedCustomerId, dateFrom, dateTo);
    setStatement(result);
  };

  const printStatement = () => {
    window.print(); // Simple mock for PDF generation
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Customer Statement</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Generate account statements and transaction ledgers.</p>
      </div>

      {/* Filter Form */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <form onSubmit={generateStatement} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={labelStyle}>Select Customer</label>
            <select 
              value={selectedCustomerId} 
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">Select a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date From</label>
            <input type="date" style={inputStyle} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Date To</label>
            <input type="date" style={inputStyle} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', height: '42px' }}>
            Generate
          </button>
        </form>
      </div>

      {/* Statement Results */}
      {statement && (
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '2px solid #f1f5f9', paddingBottom: '24px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Account Statement</h2>
              <div style={{ color: '#64748b', fontSize: '14px' }}>
                Customer: <span style={{ fontWeight: '600', color: '#1e293b' }}>{customers.find(c => c.id === statement.customer_id)?.name}</span>
              </div>
              <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                Period: {dateFrom || 'Start'} to {dateTo || 'Present'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
               <button onClick={printStatement} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <FileText size={16} /> Print / PDF
               </button>
               <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>Closing Balance</div>
               <div style={{ fontSize: '24px', fontWeight: '700', color: statement.closing_balance_cents > 0 ? '#ef4444' : '#10b981' }}>
                  <CurrencyDisplay amountCents={statement.closing_balance_cents} />
               </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>Reference</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Debit (Dr)</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Credit (Cr)</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {statement.transactions.length > 0 ? statement.transactions.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{t.type}</td>
                  <td style={{ padding: '12px', color: '#3b82f6' }}>{t.ref}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>
                    {t.debit_cents > 0 ? <CurrencyDisplay amountCents={t.debit_cents} /> : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>
                    {t.credit_cents > 0 ? <CurrencyDisplay amountCents={t.credit_cents} /> : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>
                    <CurrencyDisplay amountCents={t.balance_cents} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No transactions found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', height: '42px' };

export default SalesCustomerStatement;
