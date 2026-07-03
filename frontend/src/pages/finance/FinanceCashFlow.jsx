import React, { useState } from 'react';
import { Droplets, Download, Printer, RefreshCw } from 'lucide-react';
import { getCashFlowReport } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const fmt = (n) => n?.toLocaleString('en-ET', { minimumFractionDigits: 2 }) ?? '0.00';

const Row = ({ label, amount, indent = false, bold = false, highlight }) => (
  <tr style={{ background: highlight || 'transparent', borderBottom: '1px solid #f1f5f9' }}>
    <td style={{ padding: '8px 16px', paddingLeft: indent ? 40 : 16, color: bold ? '#0f172a' : '#475569', fontWeight: bold ? 700 : 400, fontSize: 14 }}>{label}</td>
    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: bold ? 700 : 400, color: bold ? '#0f172a' : '#475569', fontSize: 14 }}>{amount !== undefined ? `ETB ${fmt(amount)}` : ''}</td>
  </tr>
);

const FinanceCashFlow = () => {
  const [period, setPeriod] = useState('Month');
  const [dept, setDept] = useState('All');
  const report = getCashFlowReport(period);

  const handleGenerate = () => {
    submitNotification('💰 Cash Flow Report Ready', '💰 Cash Flow Report - Click to View', 'info.mp3');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <Droplets color="#0ea5e9" size={28} /> CASH FLOW STATEMENT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>M21 — Cash Flow Report</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0369a1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            <RefreshCw size={16} /> Generate
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20, display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Today', 'Week', 'Month', 'Quarter', 'Year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid',
              background: period === p ? '#0369a1' : 'transparent',
              borderColor: period === p ? '#0369a1' : '#cbd5e1',
              color: period === p ? 'white' : '#475569',
              cursor: 'pointer', fontWeight: 600, fontSize: 13
            }}>{p}</button>
          ))}
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, color: '#475569' }}>
          <option value="All">All Departments</option>
          <option>Pharmacy</option><option>Store</option><option>Admin</option>
        </select>
      </div>

      {/* Report Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Sutana Company — Cash Flow Statement</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Period: {period} | Generated: {new Date().toLocaleDateString()}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <Row label="Opening Cash Balance" amount={report.opening} bold highlight="#f0f9ff" />

            <tr><td colSpan={2} style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: 13, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Inflows</td></tr>
            <Row label="Sales Revenue" amount={report.inflows.salesRevenue} indent />
            <Row label="Service Income" amount={report.inflows.serviceIncome} indent />
            <Row label="Rental Income" amount={report.inflows.rentalIncome} indent />
            <Row label="Other Income" amount={report.inflows.otherIncome} indent />
            <Row label="Total Inflows" amount={report.inflows.total} bold highlight="#f0fdf4" />

            <tr><td colSpan={2} style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: 13, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Outflows</td></tr>
            <Row label="Supplier Payments" amount={report.outflows.supplierPayments} indent />
            <Row label="Salaries" amount={report.outflows.salaries} indent />
            <Row label="Utilities" amount={report.outflows.utilities} indent />
            <Row label="Rent" amount={report.outflows.rent} indent />
            <Row label="Transportation" amount={report.outflows.transportation} indent />
            <Row label="Other Expenses" amount={report.outflows.otherExpenses} indent />
            <Row label="Total Outflows" amount={report.outflows.total} bold highlight="#fef2f2" />

            <Row label="Net Cash Flow" amount={report.netCashFlow} bold highlight={report.netCashFlow >= 0 ? '#dcfce7' : '#fee2e2'} />
            <Row label="Closing Cash Balance" amount={report.closing} bold highlight="#e0f2fe" />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceCashFlow;
