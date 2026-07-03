import React, { useState } from 'react';
import { Calendar, Send, Download, Printer, CheckCircle } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacyDailySummary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitFinance = () => {
    submitNotification('Submitted to Finance', 'Daily summary submitted to Finance and CEO notified.');
    setIsSubmitted(true);
  };

  const handleExport = () => {
    // Silent export — no sound
    console.log('Exporting daily summary...');
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={24} color="#8b5cf6" /> DAILY SUMMARY
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Real-time Daily Recap & Finance Reconciliation</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Section 1 & 2 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1e293b' }}>Section 1: Sales & Section 2: Payments</h3>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>TOTAL SALES AMOUNT</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>$1,170.00</div>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'bold' }}>TOTAL TRANSACTIONS</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>3</div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8, color: '#475569' }}>Cash Collected</td><td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>$450.00</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8, color: '#475569' }}>Bank Transfers</td><td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>$120.00</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8, color: '#475569' }}>Telbir</td><td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>$600.00</td></tr>
              <tr><td style={{ padding: 8, fontWeight: 'bold' }}>Grand Total</td><td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>$1,170.00</td></tr>
            </tbody>
          </table>
        </div>

        {/* Section 3 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1e293b' }}>Section 3: Top Selling Drugs Today</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr><th style={{ padding: 8 }}>Rank</th><th style={{ padding: 8 }}>Drug Name</th><th style={{ padding: 8, textAlign: 'right' }}>Qty Sold</th><th style={{ padding: 8, textAlign: 'right' }}>Revenue</th></tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8, fontWeight: 'bold' }}>1</td><td style={{ padding: 8 }}>Paracetamol 500mg</td><td style={{ padding: 8, textAlign: 'right' }}>20</td><td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>$1,000.00</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8, fontWeight: 'bold' }}>2</td><td style={{ padding: 8 }}>Vitamin C</td><td style={{ padding: 8, textAlign: 'right' }}>15</td><td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>$450.00</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8, fontWeight: 'bold' }}>3</td><td style={{ padding: 8 }}>Amoxicillin 250mg</td><td style={{ padding: 8, textAlign: 'right' }}>5</td><td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>$1,750.00</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Section 4 & 5 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1e293b' }}>Section 4 & 5: Inventory Alerts</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Low Stock</div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Vitamin C</strong> (Branch A)</div>
              <div style={{ color: '#d97706', fontWeight: 'bold' }}>Shortage: 100</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Expiry Alerts</div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Paracetamol 500mg</strong> (Batch B-101)</div>
              <div style={{ color: '#ef4444', fontWeight: 'bold' }}>Expires in 19 days</div>
            </div>
          </div>
        </div>

        {/* Section 6 & 7 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1e293b' }}>Section 6 & 7: Staff & Tasks</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Attendance Summary</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#dcfce7', color: '#166534', padding: 8, borderRadius: 6, textAlign: 'center', fontWeight: 'bold' }}>2 Present</div>
              <div style={{ flex: 1, background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 6, textAlign: 'center', fontWeight: 'bold' }}>1 Absent</div>
              <div style={{ flex: 1, background: '#fef08a', color: '#854d0e', padding: 8, borderRadius: 6, textAlign: 'center', fontWeight: 'bold' }}>1 Late</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Pending Tasks</div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Stock count</strong> (Assigned to Abebe)</div>
              <div style={{ color: '#b45309', fontWeight: 'bold', fontSize: 12, background: '#fef3c7', padding: '4px 8px', borderRadius: 4 }}>High Priority</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 8 */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1e293b' }}>Section 8: Pending CEO Approvals</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr><th style={{ padding: 8 }}>Request Type</th><th style={{ padding: 8 }}>Request Number</th><th style={{ padding: 8 }}>Submitted Date</th><th style={{ padding: 8 }}>Status</th></tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: 8 }}>Stock Adjustment</td><td style={{ padding: 8, fontWeight: 'bold' }}>ADJ-409</td><td style={{ padding: 8 }}>2026-07-01</td><td style={{ padding: 8, color: '#d97706', fontWeight: 'bold' }}>PENDING CEO APPROVAL</td></tr>
          </tbody>
        </table>
      </div>

      {/* Finance Submission */}
      <div style={{ background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e3a8a' }}>Submit Daily Summary to Finance</h3>
          <p style={{ margin: 0, color: '#3b82f6', fontSize: 14 }}>Locks today's summary and notifies the Finance Manager and CEO.</p>
        </div>
        <button 
          onClick={handleSubmitFinance} 
          disabled={isSubmitted}
          style={{ padding: '16px 32px', background: isSubmitted ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: isSubmitted ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {isSubmitted ? <CheckCircle size={20} /> : <Send size={20} />} 
          {isSubmitted ? 'SUBMITTED TO FINANCE' : 'SUBMIT TO FINANCE'}
        </button>
      </div>
    </div>
  );
};

export default PharmacyDailySummary;
