import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Printer } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceGeneralLedger = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [accountFilter, setAccountFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    submitNotification('📒 General Ledger Updated', '📒 Ledger - Click to View');
  }, []);

  // Process ledger entries to calculate running balance per account
  // A real system would calculate opening balances up to dateFrom. We'll start from 0 for the filtered view.
  const processedLedger = [];
  const accountBalances = {};

  // Sort chronologically
  const sortedEntries = [...financeState.ledgerEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedEntries.forEach(entry => {
    // Determine Account Name and Type from COA
    const getCOA = (code) => financeState.defaultCOA.find(a => a.code === code) || { name: 'Unknown', type: 'Unknown' };
    
    // Process Debit side
    if (entry.debitAccount) {
      const coa = getCOA(entry.debitAccount);
      if (!accountBalances[entry.debitAccount]) accountBalances[entry.debitAccount] = 0;
      // Normal balance logic (simplified): Assets/Expenses increase on Debit, Liabilities/Equity/Income decrease on Debit.
      // For general display, we'll just show the net effect on the account.
      const isAssetOrExpense = ['Asset', 'Expense'].includes(coa.type);
      accountBalances[entry.debitAccount] += isAssetOrExpense ? entry.debitAmount : -entry.debitAmount;
      
      processedLedger.push({
        id: `${entry.id}-dr`,
        date: entry.date,
        accountCode: entry.debitAccount,
        accountName: coa.name,
        category: coa.type,
        description: entry.description,
        debit: entry.debitAmount,
        credit: 0,
        balance: accountBalances[entry.debitAccount]
      });
    }

    // Process Credit side
    if (entry.creditAccount) {
      const coa = getCOA(entry.creditAccount);
      if (!accountBalances[entry.creditAccount]) accountBalances[entry.creditAccount] = 0;
      const isAssetOrExpense = ['Asset', 'Expense'].includes(coa.type);
      accountBalances[entry.creditAccount] += isAssetOrExpense ? -entry.creditAmount : entry.creditAmount;
      
      processedLedger.push({
        id: `${entry.id}-cr`,
        date: entry.date,
        accountCode: entry.creditAccount,
        accountName: coa.name,
        category: coa.type,
        description: entry.description,
        debit: 0,
        credit: entry.creditAmount,
        balance: accountBalances[entry.creditAccount]
      });
    }
  });

  // Re-sort the split entries by date
  processedLedger.sort((a, b) => new Date(a.date) - new Date(b.date));

  const filtered = processedLedger.filter(entry => {
    const matchFrom = !dateFrom || entry.date >= dateFrom;
    const matchTo = !dateTo || entry.date <= dateTo;
    const matchAccount = accountFilter === 'All' || entry.accountCode === accountFilter;
    const matchCat = categoryFilter === 'All' || entry.category === categoryFilter;
    return matchFrom && matchTo && matchAccount && matchCat;
  });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
            <BookOpen color="#475569" size={28} /> GENERAL LEDGER
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Complete ledger for all accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Download size={15} /> Export PDF/Excel
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Printer size={15} /> Print Ledger
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Account</label>
            <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option value="All">All Accounts</option>
              {financeState.defaultCOA.map(a => (
                <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option value="All">All Categories</option>
              <option value="Asset">Asset Accounts</option>
              <option value="Liability">Liability Accounts</option>
              <option value="Equity">Equity Accounts</option>
              <option value="Income">Income Accounts</option>
              <option value="Expense">Expense Accounts</option>
            </select>
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setAccountFilter('All'); setCategoryFilter('All'); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, height: 35 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
              {['Date', 'Account Code', 'Account Name', 'Category', 'Description', 'Debit', 'Credit', 'Running Balance'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: ['Debit', 'Credit', 'Running Balance'].includes(col) ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No ledger entries found.</td></tr>
            ) : filtered.map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{entry.date}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{entry.accountCode}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{entry.accountName}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{entry.category}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{entry.description}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>
                  {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>
                  {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                  ${entry.balance.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceGeneralLedger;
