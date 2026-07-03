import React, { useState, useEffect } from 'react';
import { Landmark, Plus, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceBankAccounts = () => {
  const [accounts, setAccounts] = useState(financeState.bankAccounts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReconcile, setShowReconcile] = useState(null);
  
  // New account form
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [branch, setBranch] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  // Reconcile form
  const [statementBalance, setStatementBalance] = useState('');

  useEffect(() => {
    submitNotification('🏦 Bank Account Updated', '🏦 Bank Account - Click to View');
  }, []);

  const handleAddAccount = (e) => {
    e.preventDefault();
    const newAccount = {
      id: `BANK-00${accounts.length + 1}`,
      bankName, accountNumber, accountHolder, branch,
      balance: parseFloat(openingBalance) || 0
    };
    financeState.bankAccounts.push(newAccount);
    setAccounts([...financeState.bankAccounts]);
    setShowAddForm(false);
    // reset form
    setBankName(''); setAccountNumber(''); setAccountHolder(''); setBranch(''); setOpeningBalance('');
    submitNotification('🏦 Bank Account Added', '🏦 New Bank Account - Click to View');
  };

  const handleReconcile = (e) => {
    e.preventDefault();
    const sysBalance = showReconcile.balance;
    const stmtBalance = parseFloat(statementBalance) || 0;
    const diff = sysBalance - stmtBalance;
    
    if (diff === 0) {
      alert(`Bank Account ${showReconcile.accountNumber} reconciled successfully. No differences found.`);
    } else {
      alert(`Difference found: ${diff} ETB. System balance: ${sysBalance}, Statement balance: ${stmtBalance}. Please record adjustments.`);
    }
    setShowReconcile(null);
    setStatementBalance('');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#1e40af' }}>
            <Landmark color="#3b82f6" size={28} /> BANK ACCOUNTS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage company bank accounts and perform reconciliations.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} /> Add New Account
        </button>
      </div>

      {showAddForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Add New Bank Account</h3>
          <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Bank Name *</label><input required value={bankName} onChange={e => setBankName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Account Number *</label><input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Account Holder *</label><input required value={accountHolder} onChange={e => setAccountHolder(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Branch *</label><input required value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Opening Balance *</label><input required type="number" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" style={{ padding: '8px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, height: 35 }}>Save Account</button>
            </div>
          </form>
        </div>
      )}

      {/* Account Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {accounts.map(acc => (
          <div key={acc.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#0f172a' }}>{acc.bankName}</h3>
                <div style={{ color: '#64748b', fontSize: 14, fontFamily: 'monospace' }}>{acc.accountNumber}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Current Balance</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>${acc.balance.toFixed(2)}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: 13, color: '#475569' }}>
              <div><span style={{ fontWeight: 600 }}>Holder:</span> {acc.accountHolder}</div>
              <div><span style={{ fontWeight: 600 }}>Branch:</span> {acc.branch}</div>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
                <FileText size={15} /> Statement
              </button>
              <button onClick={() => setShowReconcile(acc)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <RotateCcw size={15} /> Reconcile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reconcile Modal */}
      {showReconcile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 color="#3b82f6" /> Bank Reconciliation
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#475569' }}>
              Reconciling <strong>{showReconcile.bankName}</strong> ({showReconcile.accountNumber})
            </p>
            
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>System Balance</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>${showReconcile.balance.toFixed(2)}</div>
            </div>
            
            <form onSubmit={handleReconcile}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Bank Statement Balance *</label>
                <input required type="number" step="0.01" value={statementBalance} onChange={e => setStatementBalance(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowReconcile(null)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Compare & Reconcile</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanceBankAccounts;
