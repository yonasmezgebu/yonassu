import React, { useState } from 'react';
import { TrendingUp, Download, Printer, RefreshCw } from 'lucide-react';
import { getProfitLossReport } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const fmt = (n) => (n ?? 0).toLocaleString('en-ET', { minimumFractionDigits: 2 });

const Row = ({ label, amount, indent = false, bold = false, highlight, color }) => (
  <tr style={{ background: highlight || 'transparent', borderBottom: '1px solid #f1f5f9' }}>
    <td style={{ padding: '8px 16px', paddingLeft: indent ? 40 : 16, color: bold ? '#0f172a' : '#475569', fontWeight: bold ? 700 : 400, fontSize: 14 }}>{label}</td>
    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: bold ? 700 : 400, color: color || (bold ? '#0f172a' : '#475569'), fontSize: 14 }}>
      {amount !== undefined ? `ETB ${fmt(amount)}` : ''}
    </td>
  </tr>
);

const FinanceProfitLoss = () => {
  const [period, setPeriod] = useState('Month');
  const [dept, setDept] = useState('All');
  const report = getProfitLossReport(period);

  const handleGenerate = () => {
    submitNotification('📊 P&L Report Ready', '📊 Profit & Loss - Click to View', 'info.mp3');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>
            <TrendingUp color="#10b981" size={28} /> PROFIT & LOSS STATEMENT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>M22 — Income Statement</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
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
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Today', 'Week', 'Month', 'Quarter', 'Year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid',
              background: period === p ? '#059669' : 'transparent',
              borderColor: period === p ? '#059669' : '#cbd5e1',
              color: period === p ? 'white' : '#475569',
              cursor: 'pointer', fontWeight: 600, fontSize: 13
            }}>{p}</button>
          ))}
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          <option value="All">All Departments/Branches</option>
          <option>Pharmacy</option><option>Store</option><option>Car Rental</option><option>Admin</option>
        </select>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', amount: report.revenue.total, color: '#059669', bg: '#f0fdf4' },
          { label: 'Gross Profit', amount: report.grossProfit, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Net Profit / Loss', amount: report.netProfitLoss, color: report.netProfitLoss >= 0 ? '#059669' : '#dc2626', bg: report.netProfitLoss >= 0 ? '#f0fdf4' : '#fef2f2' },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 8, padding: 20, border: `1px solid ${card.bg}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 'bold', color: card.color }}>ETB {fmt(card.amount)}</div>
          </div>
        ))}
      </div>

      {/* Report Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Sutana Company — Profit & Loss Statement</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Period: {period} | Generated: {new Date().toLocaleDateString()}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td colSpan={2} style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: 13, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</td></tr>
            <Row label="Pharmacy Sales" amount={report.revenue.pharmacySales} indent />
            <Row label="Car Rental Income" amount={report.revenue.carRentalIncome} indent />
            <Row label="Agri Rental Income" amount={report.revenue.agriRentalIncome} indent />
            <Row label="Printing Income" amount={report.revenue.printingIncome} indent />
            <Row label="Other Income" amount={report.revenue.otherIncome} indent />
            <Row label="Total Revenue" amount={report.revenue.total} bold highlight="#f0fdf4" color="#059669" />

            <tr><td colSpan={2} style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: 13, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost of Goods Sold</td></tr>
            <Row label="Pharmacy COGS" amount={report.cogs.pharmacyCOGS} indent />
            <Row label="Store COGS" amount={report.cogs.storeCOGS} indent />
            <Row label="Printing COGS" amount={report.cogs.printingCOGS} indent />
            <Row label="Total COGS" amount={report.cogs.total} bold highlight="#fef2f2" color="#dc2626" />

            <Row label="Gross Profit" amount={report.grossProfit} bold highlight="#eff6ff" color="#2563eb" />

            <tr><td colSpan={2} style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: 13, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operating Expenses</td></tr>
            <Row label="Salaries" amount={report.opex.salaries} indent />
            <Row label="Rent" amount={report.opex.rent} indent />
            <Row label="Utilities" amount={report.opex.utilities} indent />
            <Row label="Transportation" amount={report.opex.transportation} indent />
            <Row label="Office Expenses" amount={report.opex.officeExpenses} indent />
            <Row label="Marketing" amount={report.opex.marketing} indent />
            <Row label="Other Expenses" amount={report.opex.otherExpenses} indent />
            <Row label="Total Operating Expenses" amount={report.opex.total} bold highlight="#fffbeb" color="#d97706" />

            <Row label="Operating Income" amount={report.operatingIncome} bold highlight="#f0fdf4" />
            <Row label="Taxes & Interest (15%)" amount={report.taxesInterest} indent />
            <Row label="Net Profit / Loss" amount={report.netProfitLoss} bold highlight={report.netProfitLoss >= 0 ? '#dcfce7' : '#fee2e2'} color={report.netProfitLoss >= 0 ? '#16a34a' : '#dc2626'} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceProfitLoss;
