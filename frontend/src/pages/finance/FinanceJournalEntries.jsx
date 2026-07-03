import React, { useState } from 'react';
import { FilePlus, CheckCircle, Download, Printer } from 'lucide-react';
import { financeState, createJournalEntry } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceJournalEntries = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [debitAccount, setDebitAccount] = useState('5004'); // default expense
  const [debitAmount, setDebitAmount] = useState('');
  const [creditAccount, setCreditAccount] = useState('1001'); // default cash
  const [creditAmount, setCreditAmount] = useState('');
  const [reference, setReference] = useState('');
  
  const [historyFilterDate, setHistoryFilterDate] = useState('');
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Hard check client-side (also done server side)
    const dAmt = parseFloat(debitAmount);
    const cAmt = parseFloat(creditAmount);
    if (Math.abs(dAmt - cAmt) > 0.01) {
      setError(`Double-Entry Error: Debits (${dAmt}) do not equal Credits (${cAmt}). Please balance the entry.`);
      return;
    }
    
    try {
      const data = {
        date, description, debitAccount, debitAmount: dAmt, creditAccount, creditAmount: cAmt, reference
      };
      
      const newEntry = createJournalEntry(data);
      setSuccess(`Journal Entry ${newEntry.id} recorded successfully.`);
      submitNotification('📝 Journal Entry Created', '📝 Journal Entry - Click to View');
      
      // Reset form
      setDescription('');
      setDebitAmount('');
      setCreditAmount('');
      setReference('');
    } catch (err) {
      setError(err.message);
    }
  };

  // For history view, get manual journals only or all ledgers? The spec says "View Journal Entry History, filterable by date". We'll just show all from state.
  const history = financeState.ledgerEntries.filter(entry => 
    !historyFilterDate || entry.date === historyFilterDate
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // newest first

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
            <FilePlus color="#475569" size={28} /> JOURNAL ENTRIES
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Record financial transactions manually. Debits must equal credits.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left Col: Entry Form */}
        <div>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>New Journal Entry</h3>
            
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date *</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Reference #</label>
                  <input value={reference} onChange={e => setReference(e.target.value)} placeholder="CRV/PV/PCV/Sale" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Description *</label>
                <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Transaction details..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0f172a' }}>Double-Entry Bookkeeping</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Debit Account *</label>
                    <select value={debitAccount} onChange={e => setDebitAccount(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                      {financeState.defaultCOA.map(a => <option key={`dr-${a.code}`} value={a.code}>{a.code} - {a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Debit Amount *</label>
                    <input required type="number" step="0.01" value={debitAmount} onChange={e => setDebitAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Credit Account *</label>
                    <select value={creditAccount} onChange={e => setCreditAccount(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                      {financeState.defaultCOA.map(a => <option key={`cr-${a.code}`} value={a.code}>{a.code} - {a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Credit Amount *</label>
                    <input required type="number" step="0.01" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px 0', background: '#334155', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Record Journal Entry
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: History */}
        <div>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Entry History</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                 <input type="date" value={historyFilterDate} onChange={e => setHistoryFilterDate(e.target.value)} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} />
                 <button style={{ padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Download size={14} /> Export</button>
                 <button onClick={() => window.print()} style={{ padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Printer size={14} /> Print</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
              {history.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No entries found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {history.map(entry => (
                    <div key={entry.id} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong style={{ color: '#0f172a' }}>{entry.id}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{entry.date} | {entry.type}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{entry.description} (Ref: {entry.reference || 'N/A'})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                        <div style={{ background: 'white', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          <div style={{ color: '#64748b', marginBottom: 2 }}>Debit: {entry.debitAccount}</div>
                          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>${entry.debitAmount.toFixed(2)}</div>
                        </div>
                        <div style={{ background: 'white', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          <div style={{ color: '#64748b', marginBottom: 2 }}>Credit: {entry.creditAccount}</div>
                          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>${entry.creditAmount.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceJournalEntries;
