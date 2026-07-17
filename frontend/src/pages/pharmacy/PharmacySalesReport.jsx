import React, { useState } from 'react';
import { TrendingUp, Download, Printer, Send, Activity, DollarSign, Users } from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';

const PharmacySalesReport = () => {
  const [filters, setFilters] = useState({ dateRange: 'Today', branch: 'All', paymentMethod: 'All', worker: 'All' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleExport = (format) => {
    // Silent export — no sound
    console.log(`Exporting Sales Report as ${format}...`);
  };

  const handleSubmitFinance = () => {
    submitNotification('Submitted to Finance', 'Daily Sales Report has been locked and submitted to Finance.');
    setIsSubmitted(true);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={24} color="#0284c7" /> SALES REPORT
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View Sales Analysis & Finance Submission</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleExport('PDF')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export PDF
          </button>
          <button onClick={() => handleExport('Excel')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0284c7', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Date Range</label>
          <select value={filters.dateRange} onChange={e => setFilters({...filters, dateRange: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>Today</option><option>Week</option><option>Month</option><option>Quarter</option><option>Year</option><option>Custom</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Branch</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Payment Method</label>
          <select value={filters.paymentMethod} onChange={e => setFilters({...filters, paymentMethod: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Cash</option><option>Bank Transfer</option><option>Telbir</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Worker Name</label>
          <select value={filters.worker} onChange={e => setFilters({...filters, worker: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Abebe</option><option>Helen</option><option>Samuel</option>
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#eff6ff', padding: 24, borderRadius: 8, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: 12, borderRadius: 8 }}><DollarSign size={24} /></div>
          <div><div style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Total Sales Amount</div><div style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' }}>ETB 1,170.00</div></div>
        </div>
        <div style={{ background: '#ecfccb', padding: 24, borderRadius: 8, border: '1px solid #d9f99d', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#d9f99d', color: '#4d7c0f', padding: 12, borderRadius: 8 }}><Activity size={24} /></div>
          <div><div style={{ color: '#4d7c0f', fontWeight: 'bold' }}>Total Transactions</div><div style={{ fontSize: 24, fontWeight: 'bold', color: '#3f6212' }}>3</div></div>
        </div>
        <div style={{ background: '#f3e8ff', padding: 24, borderRadius: 8, border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#e9d5ff', color: '#7e22ce', padding: 12, borderRadius: 8 }}><TrendingUp size={24} /></div>
          <div><div style={{ color: '#7e22ce', fontWeight: 'bold' }}>Avg Transaction Value</div><div style={{ fontSize: 24, fontWeight: 'bold', color: '#581c87' }}>ETB 390.00</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Top Selling Drugs</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}><tr><th style={{ padding: 8 }}>Drug Name</th><th style={{ padding: 8, textAlign: 'right' }}>Qty Sold</th><th style={{ padding: 8, textAlign: 'right' }}>Revenue</th></tr></thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8 }}>Paracetamol 500mg</td><td style={{ padding: 8, textAlign: 'right' }}>20</td><td style={{ padding: 8, textAlign: 'right' }}>ETB 1,000</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8 }}>Vitamin C</td><td style={{ padding: 8, textAlign: 'right' }}>15</td><td style={{ padding: 8, textAlign: 'right' }}>ETB 450</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8 }}>Amoxicillin 250mg</td><td style={{ padding: 8, textAlign: 'right' }}>5</td><td style={{ padding: 8, textAlign: 'right' }}>ETB 1,750</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Sales by Payment Method</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}><tr><th style={{ padding: 8 }}>Method</th><th style={{ padding: 8, textAlign: 'right' }}>Count</th><th style={{ padding: 8, textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8 }}>Cash</td><td style={{ padding: 8, textAlign: 'right' }}>2</td><td style={{ padding: 8, textAlign: 'right' }}>ETB 450.00</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8 }}>Bank Transfer</td><td style={{ padding: 8, textAlign: 'right' }}>1</td><td style={{ padding: 8, textAlign: 'right' }}>ETB 120.00</td></tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 8 }}>Telbir</td><td style={{ padding: 8, textAlign: 'right' }}>0</td><td style={{ padding: 8, textAlign: 'right' }}>ETB 0.00</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Daily Finance Reconciliation</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Submit this filtered report to the Finance Manager.</p>
        </div>
        <button 
          onClick={handleSubmitFinance} 
          disabled={isSubmitted}
          style={{ padding: '12px 24px', background: isSubmitted ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: isSubmitted ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {isSubmitted ? <CheckCircle size={18} /> : <Send size={18} />} 
          {isSubmitted ? 'SUBMITTED TO FINANCE' : 'SUBMIT TO FINANCE'}
        </button>
      </div>
    </div>
  );
};

// CheckCircle icon mockup since it wasn't imported from lucide-react above
const CheckCircle = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

export default PharmacySalesReport;
