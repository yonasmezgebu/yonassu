import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { DollarSign, Download, CheckCircle, XCircle, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const CEOFinance = () => {
  const [activeReport, setActiveReport] = useState('Daily');

  const [ledger] = useState([
    { id: 'TXN-901', date: '2026-07-01', type: 'Sales Income', dept: 'Pharmacy', amount: 1500, direction: 'Income', ref: 'CRV-01', status: 'Completed' },
    { id: 'TXN-902', date: '2026-07-01', type: 'Supplier Payment', dept: 'Store', amount: 800, direction: 'Expense', ref: 'PV-02', status: 'Completed' },
    { id: 'TXN-903', date: '2026-07-01', type: 'Office Supplies', dept: 'Finance', amount: 50, direction: 'Expense', ref: 'PCV-01', status: 'Completed' },
  ]);

  const [funds, setFunds] = useState([
    { id: 'FR-2001', tender: 'TN-055', dept: 'Purchase', amount: 12500, supplier: 'MedEquip Ltd', status: 'PENDING' },
    { id: 'FR-2002', tender: 'TN-056', dept: 'Purchase', amount: 3400, supplier: 'AutoParts Ltd', status: 'PENDING' },
  ]);

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const totalIncome = ledger.filter(l => l.direction === 'Income').reduce((sum, l) => sum + l.amount, 0);
  const totalExpense = ledger.filter(l => l.direction === 'Expense').reduce((sum, l) => sum + l.amount, 0);
  const profitLoss = totalIncome - totalExpense;

  const handleApproveFund = (id, amount) => {
    setFunds(funds.map(f => f.id === id ? { ...f, status: 'APPROVED' } : f));
    submitNotification('Fund Request Approved', `FR ${id} for $${amount} approved. Finance notified to process payment.`);
  };

  const handleRejectFund = () => {
    if (!rejectReason) return alert('Reason is required');
    setFunds(funds.map(f => f.id === rejectId ? { ...f, status: 'REJECTED' } : f));
    receiveNotification('Fund Request Rejected', `FR ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null);
    setRejectReason('');
  };

  const handleExport = (reportType) => {
    triggerNotification('Export Started', `Exporting ${reportType} Financial Report as PDF...`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>💳 FINANCE & REPORTS</h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View Financial Reports & Approve Funds</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: 14, fontWeight: 'bold', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowUpRight color="#10b981"/> Total Income</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>${totalIncome.toLocaleString()}</div>
        </div>
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: 14, fontWeight: 'bold', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowDownRight color="#ef4444"/> Total Expenses</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>${totalExpense.toLocaleString()}</div>
        </div>
        <div style={{ background: profitLoss >= 0 ? '#dcfce7' : '#fee2e2', padding: 24, borderRadius: 8, border: `1px solid ${profitLoss >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
          <div style={{ color: profitLoss >= 0 ? '#166534' : '#991b1b', fontSize: 14, fontWeight: 'bold', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={16}/> {profitLoss >= 0 ? 'PROFIT' : 'LOSS'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: profitLoss >= 0 ? '#166534' : '#991b1b' }}>${Math.abs(profitLoss).toLocaleString()}</div>
        </div>
      </div>

      {/* M9 FUND APPROVALS */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={18} color="#eab308" /> Pending Fund Requests (M9)
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Fund Request #</th>
              <th style={{ padding: 12 }}>Tender Ref</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Supplier</th>
              <th style={{ padding: 12 }}>Total Amount</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {funds.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{f.id}</td>
                <td style={{ padding: 12, color: '#3b82f6', cursor: 'pointer' }}>{f.tender}</td>
                <td style={{ padding: 12 }}>{f.dept}</td>
                <td style={{ padding: 12 }}>{f.supplier}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>${f.amount}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: f.status === 'APPROVED' ? '#dcfce7' : f.status === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: f.status === 'APPROVED' ? '#166534' : f.status === 'REJECTED' ? '#991b1b' : '#b45309' }}>
                    {f.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  {f.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApproveFund(f.id, f.amount)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14}/> Approve Funding
                      </button>
                      <button onClick={() => setRejectId(f.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={14}/> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FINANCIAL REPORTS & LEDGER */}
      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18}/> Unified Transaction Ledger & Reports
          </h3>
          <button onClick={() => handleExport(activeReport)} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <Download size={14}/> Export {activeReport} Report
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'].map(r => (
            <button key={r} onClick={() => setActiveReport(r)} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: activeReport === r ? '#0f172a' : '#f8fafc', color: activeReport === r ? 'white' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
              {r}
            </button>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>TXN ID</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Type</th>
              <th style={{ padding: 12 }}>Department</th>
              <th style={{ padding: 12 }}>Amount</th>
              <th style={{ padding: 12 }}>Direction</th>
              <th style={{ padding: 12 }}>Doc Ref</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{l.id}</td>
                <td style={{ padding: 12 }}>{l.date}</td>
                <td style={{ padding: 12 }}>{l.type}</td>
                <td style={{ padding: 12 }}>{l.dept}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>${l.amount}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: l.direction === 'Income' ? '#10b981' : '#ef4444' }}>
                    {l.direction === 'Income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {l.direction}
                  </span>
                </td>
                <td style={{ padding: 12, color: '#3b82f6', cursor: 'pointer' }}>{l.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject Fund Request {rejectId}</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRejectFund} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOFinance;
