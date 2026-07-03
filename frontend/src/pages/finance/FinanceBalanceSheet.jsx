import React, { useState } from 'react';
import { Scale, Download, Printer, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { getBalanceSheetReport } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const fmt = (n) => (n ?? 0).toLocaleString('en-ET', { minimumFractionDigits: 2 });

const Section = ({ label, color }) => (
  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
    <td colSpan={2} style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: 13, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</td>
  </tr>
);

const Row = ({ label, amount, indent = false, bold = false, highlight, color }) => (
  <tr style={{ background: highlight || 'transparent', borderBottom: '1px solid #f1f5f9' }}>
    <td style={{ padding: '8px 16px', paddingLeft: indent ? 40 : 16, color: bold ? '#0f172a' : '#475569', fontWeight: bold ? 700 : 400, fontSize: 14 }}>{label}</td>
    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: bold ? 700 : 400, color: color || (bold ? '#0f172a' : '#475569'), fontSize: 14 }}>
      ETB {fmt(amount)}
    </td>
  </tr>
);

const FinanceBalanceSheet = () => {
  const [fiscalYear, setFiscalYear] = useState('Current');
  const report = getBalanceSheetReport();

  const handleGenerate = () => {
    submitNotification('📊 Balance Sheet Ready', '📊 Balance Sheet - Click to View', 'info.mp3');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed' }}>
            <Scale color="#8b5cf6" size={28} /> BALANCE SHEET
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>M23 — Statement of Financial Position</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
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

      {/* Period Filter */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20, display: 'flex', gap: 8 }}>
        {['Current', 'Previous', 'Fiscal Year'].map(p => (
          <button key={p} onClick={() => setFiscalYear(p)} style={{
            padding: '6px 16px', borderRadius: 20, border: '1px solid',
            background: fiscalYear === p ? '#7c3aed' : 'transparent',
            borderColor: fiscalYear === p ? '#7c3aed' : '#cbd5e1',
            color: fiscalYear === p ? 'white' : '#475569',
            cursor: 'pointer', fontWeight: 600, fontSize: 13
          }}>{p}</button>
        ))}
      </div>

      {/* Validation Banner */}
      {report.isBalanced ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 20, color: '#166534' }}>
          <CheckCircle size={18} />
          <strong>Balance Sheet Balanced</strong> — Total Assets (ETB {fmt(report.totalAssets)}) = Total Liabilities + Equity (ETB {fmt(report.totalLiabilitiesAndEquity)})
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 8, marginBottom: 20, color: '#991b1b' }}>
          <AlertTriangle size={18} />
          <strong>⚠ Balance Sheet IMBALANCE DETECTED</strong> — Assets (ETB {fmt(report.totalAssets)}) ≠ Liabilities + Equity (ETB {fmt(report.totalLiabilitiesAndEquity)}). Investigate ledger entries immediately.
        </div>
      )}

      {/* Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Assets */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f0f9ff' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>ASSETS</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <Section label="Current Assets" color="#0369a1" />
              <Row label="Cash in Hand" amount={report.currentAssets.cashInHand} indent />
              <Row label="Bank Balance" amount={report.currentAssets.bankBalance} indent />
              <Row label="Accounts Receivable" amount={report.currentAssets.accountsReceivable} indent />
              <Row label="Inventory (Store)" amount={report.currentAssets.inventory} indent />
              <Row label="Pharmacy Stock" amount={report.currentAssets.pharmacyStock} indent />
              <Row label="Petty Cash" amount={report.currentAssets.pettyCash} indent />
              <Row label="Total Current Assets" amount={report.currentAssets.total} bold highlight="#e0f2fe" />

              <Section label="Non-Current Assets" color="#0369a1" />
              <Row label="Equipment" amount={report.nonCurrentAssets.equipment} indent />
              <Row label="Vehicles" amount={report.nonCurrentAssets.vehicles} indent />
              <Row label="Furniture & Fixtures" amount={report.nonCurrentAssets.furniture} indent />
              <Row label="Total Non-Current Assets" amount={report.nonCurrentAssets.total} bold highlight="#e0f2fe" />

              <Row label="TOTAL ASSETS" amount={report.totalAssets} bold highlight="#bae6fd" color="#0369a1" />
            </tbody>
          </table>
        </div>

        {/* Liabilities + Equity */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff7ed' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#c2410c' }}>LIABILITIES & EQUITY</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <Section label="Current Liabilities" color="#c2410c" />
              <Row label="Accounts Payable" amount={report.currentLiabilities.accountsPayable} indent />
              <Row label="Bank Loans (Short-term)" amount={report.currentLiabilities.bankLoansShort} indent />
              <Row label="Tax Payable" amount={report.currentLiabilities.taxPayable} indent />
              <Row label="Total Current Liabilities" amount={report.currentLiabilities.total} bold highlight="#ffedd5" />

              <Section label="Non-Current Liabilities" color="#c2410c" />
              <Row label="Bank Loans (Long-term)" amount={report.nonCurrentLiabilities.bankLoansLong} indent />
              <Row label="Total Non-Current Liabilities" amount={report.nonCurrentLiabilities.total} bold highlight="#ffedd5" />

              <Row label="TOTAL LIABILITIES" amount={report.totalLiabilities} bold highlight="#fed7aa" color="#c2410c" />

              <Section label="Equity" color="#7c3aed" />
              <Row label="Capital" amount={report.equity.capital} indent />
              <Row label="Retained Earnings" amount={report.equity.retainedEarnings} indent />
              <Row label="Net Profit / Loss" amount={report.equity.netProfitLoss} indent color={report.equity.netProfitLoss >= 0 ? '#16a34a' : '#dc2626'} />
              <Row label="Total Equity" amount={report.equity.total} bold highlight="#f3e8ff" color="#7c3aed" />

              <Row label="TOTAL LIABILITIES & EQUITY" amount={report.totalLiabilitiesAndEquity} bold highlight={report.isBalanced ? '#dcfce7' : '#fee2e2'} color={report.isBalanced ? '#166534' : '#991b1b'} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceBalanceSheet;
