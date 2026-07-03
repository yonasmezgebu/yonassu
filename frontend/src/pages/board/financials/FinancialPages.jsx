import React, { useState, useEffect } from 'react';
import { boardAggregationService } from '../../../utils/boardAggregationService';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import { Download, Filter, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';

const PageHeader = ({ title, description, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
      <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
    </div>
    {actions && <div>{actions}</div>}
  </div>
);

// Unified Financial View Component
const FinancialSummaryTable = ({ data, type }) => {
  const total = data.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
            <th style={{ padding: '16px 24px' }}>Category / Department</th>
            <th>Amount</th>
            <th>% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{d.label}</td>
              <td style={{ fontWeight: '700', color: type === 'revenue' ? '#10b981' : '#ef4444' }}>
                <CurrencyDisplay amountCents={d.amount} />
              </td>
              <td style={{ color: '#64748b', fontSize: '14px' }}>
                {total > 0 ? ((d.amount / total) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
            <td style={{ padding: '16px 24px', fontWeight: '800', color: '#0f172a' }}>Total</td>
            <td style={{ fontWeight: '800', color: '#0f172a', fontSize: '18px' }}><CurrencyDisplay amountCents={total} /></td>
            <td style={{ fontWeight: '800', color: '#0f172a' }}>100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// 5.8 Revenue Summary
export const RevenueSummary = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetch = () => {
      const depts = boardAggregationService.getDepartmentBreakdown();
      setData(depts.map(d => ({ label: d.dept, amount: d.revenue })));
    };
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Revenue Summary" 
        description="Consolidated revenue streams broken down by department."
        actions={<button style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '600' }}><Download size={16} /> Export CSV</button>} 
      />
      <FinancialSummaryTable data={data} type="revenue" />
    </div>
  );
};

// 5.9 Expense Summary
export const ExpenseSummary = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetch = () => {
      // Mock expense categories based on spec
      const depts = boardAggregationService.getDepartmentBreakdown();
      const totalExp = depts.reduce((acc, d) => acc + d.expenses, 0);
      
      setData([
        { label: 'Salaries & Payroll', amount: totalExp * 0.4 },
        { label: 'Purchases & COGS', amount: totalExp * 0.35 },
        { label: 'Utilities & Rent', amount: totalExp * 0.1 },
        { label: 'Maintenance', amount: totalExp * 0.08 },
        { label: 'Other Operating Expenses', amount: totalExp * 0.07 }
      ]);
    };
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Expense Summary" 
        description="Enterprise-wide expenses aggregated by category."
        actions={<button style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '600' }}><Download size={16} /> Export CSV</button>} 
      />
      <FinancialSummaryTable data={data} type="expense" />
    </div>
  );
};

// 5.10 Profit & Loss
export const ProfitLoss = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = () => {
      const fin = boardAggregationService.getCompanyFinancials();
      const cogs = fin.expenses * 0.4;
      const grossProfit = fin.revenue - cogs;
      const opex = fin.expenses * 0.6;
      setData({ revenue: fin.revenue, cogs, grossProfit, opex, netProfit: fin.profit });
    };
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  if (!data) return null;

  const PnLRow = ({ label, amount, isTotal = false, color = '#0f172a', indent = false }) => (
    <div style={{ 
      display: 'flex', justifyContent: 'space-between', padding: isTotal ? '16px 24px' : '12px 24px', 
      borderBottom: '1px solid #f1f5f9', backgroundColor: isTotal ? '#f8fafc' : 'white',
      fontWeight: isTotal ? '800' : '500', color: color,
      borderTop: isTotal ? '2px solid #e2e8f0' : 'none'
    }}>
      <span style={{ paddingLeft: indent ? '24px' : '0' }}>{label}</span>
      <span><CurrencyDisplay amountCents={amount} /></span>
    </div>
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Profit & Loss" description="Consolidated P&L waterfall statement." />
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <PnLRow label="Total Revenue" amount={data.revenue} color="#10b981" />
        <PnLRow label="Cost of Goods Sold (COGS)" amount={-data.cogs} color="#ef4444" indent={true} />
        <PnLRow label="Gross Profit" amount={data.grossProfit} isTotal={true} />
        
        <PnLRow label="Operating Expenses (OpEx)" amount={-data.opex} color="#ef4444" indent={true} />
        <PnLRow label="Operating Income / Net Profit" amount={data.netProfit} isTotal={true} color={data.netProfit >= 0 ? '#10b981' : '#ef4444'} />
      </div>
    </div>
  );
};

// 5.12 - 5.14 Unified Report Generator
export const ReportGenerator = ({ periodType }) => {
  // periodType: 'Monthly' | 'Quarterly' | 'Annual'
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Generate unified report based on period
    const fetch = () => {
      setReportData({
        financials: boardAggregationService.getCompanyFinancials(),
        kpis: boardAggregationService.getKPIs(),
        departments: boardAggregationService.getDepartmentBreakdown()
      });
    };
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, [periodType]);

  if (!reportData) return null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title={`${periodType} Report`} 
        description={`Comprehensive ${periodType.toLowerCase()} overview and executive summary.`}
        actions={<button style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '700' }}><Download size={18} /> Download Full PDF</button>}
      />

      <div style={{ padding: '32px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #0f172a', paddingBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>SUTANA ENTERPRISE</h2>
          <div style={{ fontSize: '16px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>{periodType} Performance Report</div>
        </div>

        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>1. Executive Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Revenue</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}><CurrencyDisplay amountCents={reportData.financials.revenue} /></div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Net Profit</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6' }}><CurrencyDisplay amountCents={reportData.financials.profit} /></div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Growth (YoY)</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>+{reportData.kpis.revenueGrowthPct}%</div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Margin</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{reportData.kpis.profitMarginPct}%</div>
          </div>
        </div>

        <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>2. Departmental Performance</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '12px 0' }}>Department</th>
              <th>Revenue</th>
              <th>Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reportData.departments.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', fontWeight: '600' }}>{d.dept}</td>
                <td><CurrencyDisplay amountCents={d.revenue} /></td>
                <td><CurrencyDisplay amountCents={d.profit} /></td>
                <td>{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {periodType !== 'Monthly' && (
          <>
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>3. Strategic Review</h3>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '14px', fontStyle: 'italic' }}>
              Strategy and goal progressions are included in the full PDF export.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
