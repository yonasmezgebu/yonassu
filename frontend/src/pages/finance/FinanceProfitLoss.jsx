import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Download, Printer, RefreshCw } from 'lucide-react';
import api from '../../services/apiClient';
import { submitNotification } from '../../utils/pharmacyNotifications';

const fmt = (n) => {
  if (n === null || n === undefined) return '';
  const val = Number(n);
  return val < 0 ? `(${Math.abs(val).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : val.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Colors based on instruction 1
const colors = {
  primary: '#228B22', // Forest Green
  secondary: '#2E8B57', // Emerald Green
  accent: '#87CEEB', // Sky Blue
  bgMain: '#FFFFFF', // White
  bgPage: '#F5F5F5', // Light Gray
  text: '#424242', // Dark Gray
  success: '#4CAF50', // Leaf Green
  warning: '#FF9800',
  error: '#F44336',
  sage: '#A5D6A7', // Sage Green
  olive: '#6B8E23', // Olive Green
  mint: '#98FF98', // Mint Green
  lime: '#8BC34A', // Lime Green
  earth: '#8D6E63' // Earth Brown
};

const Row = ({ label, amount, indent = false, bold = false, highlight, textColor }) => (
  <tr style={{ background: highlight || 'transparent', borderBottom: `1px solid ${colors.bgPage}`, transition: 'background 0.2s ease' }} 
      onMouseEnter={(e) => e.currentTarget.style.background = '#e8f5e9'}
      onMouseLeave={(e) => e.currentTarget.style.background = highlight || 'transparent'}>
    <td style={{ padding: '14px 20px', paddingLeft: indent ? 40 : 20, color: bold ? colors.text : '#616161', fontWeight: bold ? 700 : 400, fontSize: 14 }}>{label}</td>
    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: bold ? 700 : 500, color: textColor || (bold ? colors.text : '#616161'), fontSize: 14 }}>
      {amount !== undefined && amount !== null ? fmt(amount) : ''}
    </td>
  </tr>
);

const FinanceProfitLoss = () => {
  const [period, setPeriod] = useState('Month');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/finance/reports/income-statement?period=${period.toLowerCase()}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching income statement data:', error);
      submitNotification('Error', 'Failed to fetch Income Statement data', 'error');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = () => {
    fetchData();
    submitNotification('Income Statement Refreshed', 'The Income Statement has been updated', 'info.mp3');
  };

  const report = data || {
    revenue_items: [],
    total_revenue: 0,
    cogs_items: [],
    total_cogs: 0,
    gross_profit: 0,
    operating_expenses: [],
    total_operating_expenses: 0,
    net_profit: 0
  };

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', 
    background: colors.secondary, color: '#FFFFFF', 
    border: 'none', borderRadius: 0, // Sharp corners
    cursor: 'pointer', fontWeight: 600, fontSize: 14,
    transition: 'all 0.2s ease', outline: 'none'
  };

  const btnSecondaryStyle = {
    ...btnStyle,
    background: colors.bgMain,
    color: colors.primary,
    border: `1px solid ${colors.primary}`
  };

  return (
    <div style={{ background: colors.bgPage, minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', margin: 0, padding: 0 }}>
      {/* Full width container, no side margins */}
      <div style={{ padding: '24px', flex: 1, fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: colors.primary, textTransform: 'uppercase' }}>
              <div style={{ background: colors.primary, color: '#FFFFFF', padding: 8, borderRadius: 0, display: 'flex' }}>
                <TrendingUp size={24} />
              </div>
              Income Statement
            </h1>
            <p style={{ color: colors.text, margin: '8px 0 0', fontSize: 14, fontWeight: 500 }}>Real-time General Ledger aggregation</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              style={{...btnStyle, opacity: loading ? 0.7 : 1}}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = colors.primary)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = colors.secondary)}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} /> {loading ? 'Loading...' : 'Generate'}
            </button>
            <button 
              style={btnSecondaryStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.bgMain; e.currentTarget.style.color = colors.primary; }}
            >
              <Download size={16} /> Export
            </button>
            <button 
              style={btnSecondaryStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.bgMain; e.currentTarget.style.color = colors.primary; }}
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: colors.bgMain, borderRadius: 0, border: `1px solid ${colors.sage}`, padding: 16, marginBottom: 24, display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${colors.sage}`, borderRadius: 0 }}>
            {['Month', 'Quarter', 'Year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '10px 24px', borderRadius: 0, border: 'none',
                background: period === p ? colors.primary : colors.bgMain,
                color: period === p ? '#FFFFFF' : colors.text,
                borderRight: p !== 'Year' ? `1px solid ${colors.sage}` : 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s', outline: 'none'
              }}
              onMouseEnter={(e) => { if(period !== p) e.currentTarget.style.background = '#e8f5e9'; }}
              onMouseLeave={(e) => { if(period !== p) e.currentTarget.style.background = colors.bgMain; }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Revenue', amount: report.total_revenue, color: colors.primary, bg: '#e8f5e9', border: colors.sage },
            { label: 'Gross Profit', amount: report.gross_profit, color: colors.secondary, bg: '#f1f8e9', border: colors.sage },
            { label: 'Net Profit', amount: report.net_profit, color: report.net_profit >= 0 ? colors.primary : colors.error, bg: report.net_profit >= 0 ? '#e8f5e9' : '#ffebee', border: report.net_profit >= 0 ? colors.sage : '#ffcdd2' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: 0, padding: 24, border: `1px solid ${card.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color, letterSpacing: '-0.02em' }}>ETB {fmt(card.amount)}</div>
            </div>
          ))}
        </div>

        {/* Report Table */}
        <div style={{ background: colors.bgMain, borderRadius: 0, border: `1px solid ${colors.sage}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: `2px solid ${colors.primary}`, background: colors.bgMain, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.primary, textTransform: 'uppercase' }}>Sutana Company — Income Statement</div>
              <div style={{ fontSize: 13, color: colors.text, marginTop: 4, fontWeight: 500 }}>Period: {period} | Basis: Accrual / Journal Entries</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: colors.text, fontWeight: 500 }}>
              Generated: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#e8f5e9', borderBottom: `1px solid ${colors.sage}` }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Line</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em', width: '200px' }}>Amount (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue */}
                {report.revenue_items.map((item, idx) => (
                  <Row key={idx} label={item.label} amount={item.amount} />
                ))}
                
                {/* COGS */}
                {report.cogs_items.map((item, idx) => (
                  <Row key={idx} label={`Less: ${item.label}`} amount={-item.amount} textColor={colors.error} />
                ))}

                <Row label="Gross Profit" amount={report.gross_profit} bold highlight="#f1f8e9" textColor={colors.primary} />

                {/* Operating Expenses */}
                {report.operating_expenses.map((item, idx) => (
                  <Row key={idx} label={item.label} amount={-item.amount} textColor={colors.error} />
                ))}
                
                <Row label="Total Operating Expenses" amount={-report.total_operating_expenses} bold highlight="#ffebee" textColor={colors.error} />

                {/* Net Profit */}
                <tr><td colSpan={2} style={{ padding: '16px', background: colors.bgMain }}></td></tr>
                <Row label="Net Profit" amount={report.net_profit} bold highlight={report.net_profit >= 0 ? colors.primary : colors.error} textColor="#FFFFFF" />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceProfitLoss;
