import React, { useState, useEffect } from 'react';
import { Scale, Download, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceTrialBalance = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    submitNotification('⚖️ Trial Balance Ready', '⚖️ Trial Balance - Click to View');
  }, []);

  // Process ledger entries to build the Trial Balance
  const accountTotals = {};
  
  financeState.defaultCOA.forEach(acc => {
    accountTotals[acc.code] = { 
      code: acc.code, 
      name: acc.name, 
      type: acc.type, 
      debitTotal: 0, 
      creditTotal: 0 
    };
  });

  const filteredEntries = financeState.ledgerEntries.filter(entry => {
    const matchFrom = !dateFrom || entry.date >= dateFrom;
    const matchTo = !dateTo || entry.date <= dateTo;
    return matchFrom && matchTo;
  });

  filteredEntries.forEach(entry => {
    if (entry.debitAccount && accountTotals[entry.debitAccount]) {
      accountTotals[entry.debitAccount].debitTotal += entry.debitAmount;
    }
    if (entry.creditAccount && accountTotals[entry.creditAccount]) {
      accountTotals[entry.creditAccount].creditTotal += entry.creditAmount;
    }
  });

  // Calculate net balances per account
  const trialBalanceRows = Object.values(accountTotals).map(acc => {
    const net = acc.debitTotal - acc.creditTotal;
    let debitBalance = 0;
    let creditBalance = 0;
    if (net > 0) debitBalance = net;
    else if (net < 0) creditBalance = Math.abs(net);
    
    return { ...acc, debitBalance, creditBalance };
  }).filter(acc => acc.debitBalance > 0 || acc.creditBalance > 0 || acc.type === typeFilter); // show if has balance, or if just showing all types.

  const filteredRows = trialBalanceRows.filter(acc => 
    typeFilter === 'All' || acc.type === typeFilter
  );

  const totalDebits = filteredRows.reduce((sum, acc) => sum + acc.debitBalance, 0);
  const totalCredits = filteredRows.reduce((sum, acc) => sum + acc.creditBalance, 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
            <Scale color="#475569" size={28} /> TRIAL BALANCE
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Verify the equality of debits and credits.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Download size={15} /> Export PDF
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Account Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option value="All">All Types</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, height: 35 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Balance Indicator */}
      {isBalanced ? (
         <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 16, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 color="#059669" />
            <div>
              <strong style={{ color: '#064e3b', display: 'block' }}>Trial Balance is Balanced</strong>
              <span style={{ color: '#047857', fontSize: 13 }}>Total debits equal total credits.</span>
            </div>
         </div>
      ) : (
         <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle color="#dc2626" />
            <div>
              <strong style={{ color: '#991b1b', display: 'block' }}>Imbalance Detected</strong>
              <span style={{ color: '#b91c1c', fontSize: 13 }}>Total debits and credits do not match. Difference: ${difference.toFixed(2)}. Check manual journal entries or filter settings.</span>
            </div>
         </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
              {['Account Code', 'Account Name', 'Type', 'Debit Balance', 'Credit Balance'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: ['Debit Balance', 'Credit Balance'].includes(col) ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No data to display.</td></tr>
            ) : filteredRows.map(acc => (
              <tr key={acc.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{acc.code}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{acc.name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{acc.type}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: acc.debitBalance > 0 ? '#0f172a' : '#94a3b8', fontWeight: acc.debitBalance > 0 ? 600 : 400 }}>
                  {acc.debitBalance > 0 ? `$${acc.debitBalance.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: acc.creditBalance > 0 ? '#0f172a' : '#94a3b8', fontWeight: acc.creditBalance > 0 ? 600 : 400 }}>
                  {acc.creditBalance > 0 ? `$${acc.creditBalance.toFixed(2)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
            <tr>
              <td colSpan={3} style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}>TOTALS</td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', fontSize: 16, color: isBalanced ? '#059669' : '#dc2626' }}>${totalDebits.toFixed(2)}</td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', fontSize: 16, color: isBalanced ? '#059669' : '#dc2626' }}>${totalCredits.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default FinanceTrialBalance;
