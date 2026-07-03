import React, { useState } from 'react';
import { BarChart2, Download, Printer, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { getIncomeExpenseReport } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const fmt = (n) => (n ?? 0).toLocaleString('en-ET', { minimumFractionDigits: 0 });

// ─── Pure CSS/SVG Charts ─────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expenses)));
  const barH = 160;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: barH + 40, padding: '0 8px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: barH, justifyContent: 'center' }}>
            <div title={`Income: ETB ${fmt(d.income)}`} style={{ width: '45%', height: `${(d.income / maxVal) * barH}px`, background: 'linear-gradient(180deg,#10b981,#059669)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s' }} />
            <div title={`Expenses: ETB ${fmt(d.expenses)}`} style={{ width: '45%', height: `${(d.expenses / maxVal) * barH}px`, background: 'linear-gradient(180deg,#f87171,#dc2626)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{d.dept.slice(0, 7)}</div>
        </div>
      ))}
    </div>
  );
};

const LineChart = ({ data }) => {
  const w = 420, h = 140, pad = 30;
  const maxIncome = Math.max(...data.map(d => d.income));
  const maxExp = Math.max(...data.map(d => d.expenses));
  const maxVal = Math.max(maxIncome, maxExp) * 1.1;
  const xStep = (w - pad * 2) / (data.length - 1);

  const incomePoints = data.map((d, i) => `${pad + i * xStep},${h - pad - ((d.income / maxVal) * (h - pad * 2))}`).join(' ');
  const expensePoints = data.map((d, i) => `${pad + i * xStep},${h - pad - ((d.expenses / maxVal) * (h - pad * 2))}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
        <line key={i} x1={pad} y1={h - pad - r * (h - pad * 2)} x2={w - pad} y2={h - pad - r * (h - pad * 2)} stroke="#f1f5f9" strokeWidth={1} />
      ))}
      {/* Income line */}
      <polyline points={incomePoints} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Expense line */}
      <polyline points={expensePoints} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Dots + Labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={pad + i * xStep} cy={h - pad - (d.income / maxVal) * (h - pad * 2)} r={4} fill="#10b981" />
          <circle cx={pad + i * xStep} cy={h - pad - (d.expenses / maxVal) * (h - pad * 2)} r={4} fill="#ef4444" />
          <text x={pad + i * xStep} y={h - 6} textAnchor="middle" fontSize={10} fill="#64748b">{d.month}</text>
        </g>
      ))}
    </svg>
  );
};

const PieChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.amount, 0);
  let cumulAngle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 70;

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, flexShrink: 0 }}>
        {data.map((d, i) => {
          const angle = (d.amount / total) * 2 * Math.PI;
          const x1 = cx + r * Math.cos(cumulAngle);
          const y1 = cy + r * Math.sin(cumulAngle);
          cumulAngle += angle;
          const x2 = cx + r * Math.cos(cumulAngle);
          const y2 = cy + r * Math.sin(cumulAngle);
          const largeArc = angle > Math.PI ? 1 : 0;
          return (
            <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={d.color} stroke="white" strokeWidth={2} />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: '#475569' }}>{d.category}</span>
            <span style={{ fontWeight: 600, color: '#0f172a', marginLeft: 'auto' }}>{((d.amount / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FinanceIncomeExpense = () => {
  const [period, setPeriod] = useState('Monthly');
  const report = getIncomeExpenseReport();

  const handleGenerate = () => {
    submitNotification('📈 Income & Expense Report Ready', '📈 Income & Expense - Click to View', 'info.mp3');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb' }}>
            <BarChart2 color="#3b82f6" size={28} /> INCOME & EXPENSE ANALYSIS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>M24 — Income vs Expense Report with Visualizations</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
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

      {/* Filter */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20, display: 'flex', gap: 8 }}>
        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '6px 16px', borderRadius: 20, border: '1px solid',
            background: period === p ? '#2563eb' : 'transparent',
            borderColor: period === p ? '#2563eb' : '#cbd5e1',
            color: period === p ? 'white' : '#475569',
            cursor: 'pointer', fontWeight: 600, fontSize: 13
          }}>{p}</button>
        ))}
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 20, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Total Income <TrendingUp size={14} color="#10b981" style={{ display: 'inline' }} /></div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#059669' }}>ETB {fmt(report.totalIncome)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>By Department | By Source</div>
        </div>
        <div style={{ background: '#fef2f2', borderRadius: 8, padding: 20, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Total Expenses <TrendingDown size={14} color="#ef4444" style={{ display: 'inline' }} /></div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#dc2626' }}>ETB {fmt(report.totalExpenses)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>By Category | By Department</div>
        </div>
        <div style={{ background: report.netIncome >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, padding: 20, border: `1px solid ${report.netIncome >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Net Income / Loss</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: report.netIncome >= 0 ? '#059669' : '#dc2626' }}>ETB {fmt(report.netIncome)}</div>
          <div style={{ fontSize: 12, color: report.percentChange >= 0 ? '#059669' : '#dc2626', marginTop: 4 }}>
            {report.percentChange >= 0 ? '▲' : '▼'} {Math.abs(report.percentChange).toFixed(1)}% vs prior period
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Income vs Expenses by Department</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}><div style={{ width: 12, height: 12, background: '#10b981', borderRadius: 2 }} /> Income</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}><div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2 }} /> Expenses</div>
          </div>
          <BarChart data={report.departmentBreakdown} />
        </div>

        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Monthly Income Trend</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}><div style={{ width: 24, height: 3, background: '#10b981', borderRadius: 2 }} /> Income</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}><div style={{ width: 24, height: 3, background: '#ef4444', borderRadius: 2 }} /> Expenses</div>
          </div>
          <LineChart data={report.monthlyTrend} />
        </div>
      </div>

      {/* Pie Chart */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Expense Distribution</div>
        <PieChart data={report.expenseDistribution} />
      </div>
    </div>
  );
};

export default FinanceIncomeExpense;
