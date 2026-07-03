import React, { useState, useEffect } from 'react';
import { PieChart, Download, CheckCircle, Clock } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceProcurement = () => {
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    submitNotification('📊 Procurement Finance Report', '📊 Procurement Finance - Click to View', 'info.mp3');
  }, []);

  const procurements = financeState.procurements;

  const filteredProcurements = procurements.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return p.status.includes('Pending');
    if (filter === 'Approved') return p.status === 'Approved' || p.status === 'Received' || p.status === 'Sent';
    return p.type === filter;
  });

  // Mock Budget Data for Departments
  const budgetData = [
    { department: 'Pharmacy', allocated: 500000, spent: 345000 },
    { department: 'Laboratory', allocated: 300000, spent: 120000 },
    { department: 'Admin', allocated: 150000, spent: 145000 },
  ];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#db2777' }}>
            <PieChart color="#ec4899" size={28} /> PROCUREMENT FINANCE
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Financial oversight of M8-M11 procurement flows.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
          <Download size={16} /> Export Financial Report
        </button>
      </div>

      {/* Budget vs Actual Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {budgetData.map(b => (
          <div key={b.department} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>{b.department} Budget</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#475569' }}>Allocated</span>
              <span style={{ fontWeight: 600 }}>${b.allocated.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: '#475569' }}>Spent (Actual)</span>
              <span style={{ fontWeight: 600, color: '#db2777' }}>${b.spent.toLocaleString()}</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ 
                width: `${Math.min(100, (b.spent / b.allocated) * 100)}%`, 
                height: '100%', 
                background: (b.spent / b.allocated) > 0.9 ? '#ef4444' : '#10b981' 
              }}></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#94a3b8' }}>Remaining</span>
              <span style={{ fontWeight: 'bold', color: (b.allocated - b.spent) < 10000 ? '#ef4444' : '#10b981' }}>
                ${(b.allocated - b.spent).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12 }}>
          {['All', 'Pending', 'Approved', 'Requisition', 'Fund Request', 'Purchase Order', 'Goods Received Note'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                background: filter === f ? '#fce7f3' : 'transparent',
                color: filter === f ? '#db2777' : '#64748b',
                border: filter === f ? '1px solid #fbcfe8' : '1px solid transparent',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {f}
            </button>
          ))}
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Reference ID', 'Type', 'Date', 'Department / Supplier', 'Details', 'Amount', 'Status'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Amount' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProcurements.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{p.id}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{p.type}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.requestDate || p.poDate || p.grnDate}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{p.department || p.supplier}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>
                  {p.item && <span>Item: {p.item}</span>}
                  {p.poReference && <span>Ref: {p.poReference}</span>}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                  {(p.requestedAmount || p.totalAmount) ? `$${(p.requestedAmount || p.totalAmount).toLocaleString()}` : '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: p.status.includes('Pending') ? '#fef3c7' : '#dcfce7',
                    color: p.status.includes('Pending') ? '#d97706' : '#16a34a'
                  }}>
                    {p.status.includes('Pending') ? <Clock size={12} /> : <CheckCircle size={12} />}
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredProcurements.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No records found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceProcurement;
