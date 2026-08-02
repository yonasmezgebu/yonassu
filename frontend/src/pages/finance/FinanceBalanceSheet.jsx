import React, { useState, useEffect, useCallback } from 'react';
import { Scale, Download, Printer, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/apiClient';
import { submitNotification } from '../../utils/pharmacyNotifications';

const fmt = (n) => {
  if (n === null || n === undefined) return '';
  const val = Number(n);
  return val < 0
    ? `(${Math.abs(val).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
    : val.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// University Green Nature Palette
const G = {
  primary:   '#228B22', // Forest Green
  dark:      '#1B5E20', // Dark Green
  secondary: '#2E8B57', // Emerald Green
  leaf:      '#4CAF50', // Leaf Green
  sage:      '#A5D6A7', // Sage Green
  olive:     '#6B8E23', // Olive Green
  mint:      '#98FF98', // Mint Green
  lime:      '#8BC34A', // Lime Green
  earth:     '#8D6E63', // Earth Brown
  sky:       '#87CEEB', // Sky Blue
  white:     '#FFFFFF',
  bgPage:    '#F5F5F5', // Light Gray
  text:      '#424242', // Dark Gray
  success:   '#4CAF50',
  warning:   '#FF9800',
  error:     '#F44336',
};

// Row component — sharp corners, hover, proper contrast
const Row = ({ label, amount, bold = false, highlight, textColor, section = false }) => {
  const [hovered, setHovered] = React.useState(false);

  if (section) {
    return (
      <tr style={{ background: '#e8f5e9', borderBottom: `2px solid ${G.sage}` }}>
        <th colSpan={2} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: G.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </th>
      </tr>
    );
  }

  const bg = hovered ? '#e8f5e9' : (highlight || 'transparent');
  return (
    <tr
      style={{ background: bg, borderBottom: `1px solid ${G.bgPage}`, transition: 'background 0.2s ease', cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ padding: '14px 20px', color: bold ? G.text : '#616161', fontWeight: bold ? 700 : 400, fontSize: 14 }}>
        {label}
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: bold ? 700 : 500, color: textColor || (bold ? G.text : '#616161'), fontSize: 14 }}>
        {amount !== undefined && amount !== null ? fmt(amount) : ''}
      </td>
    </tr>
  );
};

const FinanceBalanceSheet = () => {
  const [fiscalYear, setFiscalYear] = useState('Current');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/finance/reports/balance-sheet?date=${fiscalYear.toLowerCase()}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching balance sheet data:', error);
      submitNotification('Error', 'Failed to fetch Balance Sheet data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = () => {
    fetchData();
    submitNotification('Balance Sheet Refreshed', 'The Balance Sheet has been updated', 'info.mp3');
  };

  const report = data || {
    assets: [],
    total_assets: 0,
    liabilities: [],
    total_liabilities: 0,
    equity: [],
    total_equity: 0,
    total_liabilities_and_equity: 0
  };

  const isBalanced = report.total_assets === report.total_liabilities_and_equity;

  const btnPrimary = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 18px',
    background: G.secondary, color: G.white,
    border: 'none', borderRadius: 0,
    cursor: 'pointer', fontWeight: 600, fontSize: 14,
    transition: 'background 0.2s ease', outline: 'none'
  };

  const btnOutline = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 18px',
    background: G.white, color: G.primary,
    border: `1px solid ${G.primary}`, borderRadius: 0,
    cursor: 'pointer', fontWeight: 600, fontSize: 14,
    transition: 'all 0.2s ease', outline: 'none'
  };

  return (
    <div style={{ background: G.bgPage, minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
      <div style={{ padding: '24px', flex: 1, fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box' }}>

        {/* Header — rule 11: white text on green, rule 3: sharp, rule 5: 100% width */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: G.primary, textTransform: 'uppercase' }}>
              <div style={{ background: G.primary, color: G.white, padding: 8, borderRadius: 0, display: 'flex' }}>
                <Scale size={24} />
              </div>
              Balance Sheet
            </h1>
            <p style={{ color: G.text, margin: '8px 0 0', fontSize: 14, fontWeight: 500 }}>Real-time General Ledger aggregation</p>
          </div>

          {/* Buttons — rule 1, 3, 8: buttons sharp, no radius */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = G.primary; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = G.secondary; }}
            >
              <RefreshCw size={16} /> {loading ? 'Loading...' : 'Generate'}
            </button>
            <button
              style={btnOutline}
              onMouseEnter={(e) => { e.currentTarget.style.background = G.primary; e.currentTarget.style.color = G.white; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = G.white; e.currentTarget.style.color = G.primary; }}
            >
              <Download size={16} /> Export
            </button>
            <button
              style={btnOutline}
              onMouseEnter={(e) => { e.currentTarget.style.background = G.primary; e.currentTarget.style.color = G.white; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = G.white; e.currentTarget.style.color = G.primary; }}
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </div>

        {/* Period Filter — rule 3, 8: sharp corners, no radius */}
        <div style={{ background: G.white, border: `1px solid ${G.sage}`, borderRadius: 0, padding: 16, marginBottom: 24, display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${G.sage}` }}>
            {['Current', 'Previous', 'Fiscal Year'].map((p, i, arr) => (
              <button
                key={p}
                onClick={() => setFiscalYear(p)}
                style={{
                  padding: '10px 24px', borderRadius: 0, border: 'none',
                  background: fiscalYear === p ? G.primary : G.white,
                  color: fiscalYear === p ? G.white : G.text,
                  borderRight: i < arr.length - 1 ? `1px solid ${G.sage}` : 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s', outline: 'none'
                }}
                onMouseEnter={(e) => { if (fiscalYear !== p) e.currentTarget.style.background = '#e8f5e9'; }}
                onMouseLeave={(e) => { if (fiscalYear !== p) e.currentTarget.style.background = G.white; }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Balance status indicator — rule 6: in-app only, no browser alert */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px', marginBottom: 24,
          background: isBalanced ? '#e8f5e9' : '#ffebee',
          border: `1px solid ${isBalanced ? G.sage : '#ffcdd2'}`,
          borderRadius: 0, borderLeft: `4px solid ${isBalanced ? G.primary : G.error}`
        }}>
          {isBalanced
            ? <CheckCircle size={18} color={G.primary} />
            : <AlertTriangle size={18} color={G.error} />
          }
          <span style={{ fontSize: 14, fontWeight: 600, color: isBalanced ? G.primary : G.error }}>
            {isBalanced
              ? `Balance Sheet Balanced — Total Assets (ETB ${fmt(report.total_assets)}) = Total Liabilities + Equity (ETB ${fmt(report.total_liabilities_and_equity)})`
              : `Imbalance Detected — Assets (ETB ${fmt(report.total_assets)}) do not equal Liabilities + Equity (ETB ${fmt(report.total_liabilities_and_equity)}). Review journal entries.`
            }
          </span>
        </div>

        {/* Report Table — single column per spec, rule 4: proper rows/cols, rule 16: no mid-page header container */}
        <div style={{ background: G.white, border: `1px solid ${G.sage}`, borderRadius: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: `2px solid ${G.primary}`, background: G.white, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: G.primary, textTransform: 'uppercase' }}>Sutana Company — Balance Sheet</div>
              <div style={{ fontSize: 13, color: G.text, marginTop: 4, fontWeight: 500 }}>Period: {fiscalYear} | Basis: Accrual / Journal Entries</div>
            </div>
            <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>
              Generated: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '580px' }}>
              <tbody>
                {/* ASSETS section */}
                <Row label="Assets" section />
                {report.assets.map((item, idx) => (
                  <Row key={`a-${idx}`} label={item.label} amount={item.amount} />
                ))}
                <Row label="Total Assets" amount={report.total_assets} bold highlight="#e8f5e9" textColor={G.primary} />

                {/* spacer */}
                <tr><td colSpan={2} style={{ padding: '10px', background: G.bgPage }}></td></tr>

                {/* LIABILITIES section */}
                <Row label="Liabilities" section />
                {report.liabilities.map((item, idx) => (
                  <Row key={`l-${idx}`} label={item.label} amount={item.amount} />
                ))}
                <Row label="Total Liabilities" amount={report.total_liabilities} bold highlight="#ffebee" textColor={G.error} />

                {/* spacer */}
                <tr><td colSpan={2} style={{ padding: '10px', background: G.bgPage }}></td></tr>

                {/* EQUITY section */}
                <Row label="Equity" section />
                {report.equity.map((item, idx) => (
                  <Row key={`e-${idx}`} label={item.label} amount={item.amount} />
                ))}
                <Row label="Total Equity" amount={report.total_equity} bold highlight="#f1f8e9" textColor={G.secondary} />

                {/* spacer */}
                <tr><td colSpan={2} style={{ padding: '10px', background: G.bgPage }}></td></tr>

                {/* Final total — rule 11: white text on green for emphasis */}
                <tr style={{ background: isBalanced ? G.primary : G.error }}>
                  <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: 15, color: G.white, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Total Liabilities + Equity
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, fontSize: 15, color: G.white }}>
                    {fmt(report.total_liabilities_and_equity)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceBalanceSheet;
